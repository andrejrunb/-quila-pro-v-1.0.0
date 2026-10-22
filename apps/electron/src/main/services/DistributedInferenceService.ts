import { EventEmitter } from 'events';
import { sovereignMeshService } from './SovereignMeshService';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../logger';
import { sovereignEncryptionService } from './SovereignEncryptionService';
import { SyncPacket } from '../../services/AiTypes';

export interface InferenceTask {
  id: string;
  type: 'sentiment' | 'entity_extraction' | 'summarization' | 'embedding' | 'federated_synthesis' | 'security_anomaly' | 'face_recognition';
  payload: Record<string, unknown> | unknown[];
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: Record<string, unknown> | unknown[];
  sourceNodeId: string;
  targetNodeId?: string;
  consensusRequired?: boolean;
  votes?: Map<string, Record<string, unknown> | unknown[]>;
  minVotes?: number;
  requiresSandbox?: boolean;
  wasmModuleId?: string;
  wasmFunctionName?: string;
  createdAt?: number;
}

/**
 * DistributedInferenceService (Level 13)
 * -------------------------------------
 * Permite que um Hub Áquila delegue tarefas de inferência para outros Hubs no Enxame.
 * Isso otimiza o uso de NPUs distribuídas na rede regional.
 */
export class DistributedInferenceService extends EventEmitter {
  private static instance: DistributedInferenceService;
  private activeTasks: Map<string, InferenceTask> = new Map();

  private localCapabilities: Record<string, any> = {
    npu: true,
    tops: 26,
    models: ['llama-3-8b', 'clip-vit-base', 'whisper-base'],
    sandbox: true,
    reputation: 100 // Level 13: Local hub reputation
  };

  private constructor() {
    super();
    this.setupListeners();
    this.announceCapabilities();
  }

  public static getInstance(): DistributedInferenceService {
    if (!DistributedInferenceService.instance) {
      DistributedInferenceService.instance = new DistributedInferenceService();
    }
    return DistributedInferenceService.instance;
  }

  private setupListeners() {
    // Escuta por resultados vindos do Mesh
    sovereignMeshService.on('mesh:payload:inference_result', (data: { sourceNode: string, payload: any }) => {
      this.handleInferenceResult(data);
    });

    // Escuta por requisições de outros Hubs (Modo Worker)
    sovereignMeshService.on('mesh:payload:inference_request', (data: { sourceNode: string, payload: any }) => {
      this.handleIncomingRequest(data);
    });

    // Escuta por anúncios de capacidades
    sovereignMeshService.on('mesh:payload:capability_announcement', (data: { sourceNode: string, payload: any }) => {
      logger.info(`[DistributedInference] Nó ${data.sourceNode} anunciou capacidades:`, data.payload);
    });
  }

  private async announceCapabilities() {
    // Aguarda o Mesh inicializar
    setTimeout(async () => {
      try {
        await sovereignMeshService.broadcast({
          id: `cap_${uuidv4()}`,
          sourceNode: sovereignMeshService.getNodeId(),
          targetNode: 'ALL',
          timestamp: Date.now(),
          payloadType: 'capability_announcement',
          payload: this.localCapabilities,
          securityLevel: 'medium_sovereignty'
        });
        this.emit('mesh:update', this.getLocalCapabilities());
      } catch (e) {
        logger.error('[DistributedInference] Erro ao anunciar capacidades:', e);
      }
    }, 5000);
  }

  /**
   * Remove uma tarefa ativa do registro.
   */
  public cancelTask(taskId: string): void {
    this.activeTasks.delete(taskId);
  }

  /**
   * Remove tarefas que expiraram sem resposta.
   */
  public pruneStaleTasks(maxAgeMs = 30000): void {
    const now = Date.now();
    for (const [id, task] of this.activeTasks.entries()) {
      if (task.createdAt && (now - task.createdAt) > maxAgeMs) {
        this.activeTasks.delete(id);
      }
    }
  }

  /**
   * Envia uma tarefa para processamento distribuído com proteção contra loops e execução local em nós isolados.
   */
  public async dispatchTask(type: InferenceTask['type'], payload: any, consensus = false): Promise<string> {
    // 1. Limpeza preventiva de tarefas antigas
    this.pruneStaleTasks(30000);

    // 2. Limite máximo de segurança para evitar saturação da fila (Backpressure)
    if (this.activeTasks.size >= 25) {
      logger.warn(`[DistributedInference] Backpressure ativado: Fila cheia (${this.activeTasks.size} tarefas ativas). Ignorando despacho duplicado.`);
      return '';
    }

    const taskId = uuidv4();
    const task: InferenceTask = {
      id: taskId,
      type,
      payload,
      status: 'pending',
      sourceNodeId: sovereignMeshService.getNodeId(),
      targetNodeId: payload?.targetNodeId || 'local',
      consensusRequired: consensus,
      votes: consensus ? new Map() : undefined,
      minVotes: consensus ? 3 : 1,
      requiresSandbox: payload?.useSandbox === true,
      wasmModuleId: payload?.wasmModuleId,
      wasmFunctionName: payload?.wasmFunctionName || 'main',
      createdAt: Date.now()
    };

    this.activeTasks.set(taskId, task);
    this.emit('task:update', task);

    // 3. Se nenhum par remoto estiver conectado no Mesh, processa localmente para não deixar pendente
    const connectedPeers = sovereignMeshService.getConnectedPeers();
    if (!connectedPeers || connectedPeers.length === 0) {
      setTimeout(async () => {
        try {
          const { generativeAIService } = await import('./GenerativeAIService');
          const res = await generativeAIService.processDistributedTask(task.type, task.payload);
          task.status = 'completed';
          task.result = res;
          this.emit('task:update', task);
          this.emit(`task:completed:${task.id}`, task);
        } catch {
          task.status = 'failed';
        } finally {
          this.activeTasks.delete(task.id);
        }
      }, 50);
      return taskId;
    }

    logger.info(`[DistributedInference] Despachando tarefa ${type} (${taskId}) ${consensus ? 'com CONSENSO' : ''}...`);

    // Prioriza o envio via nó alvo se especificado no payload e se houver chave ARK
    if (payload?.targetNodeId && sovereignMeshService.isQuantumSafe(payload.targetNodeId)) {
      const ark = sovereignMeshService.getSessionKey(payload.targetNodeId);
      logger.info(`[DistributedInference] Usando canal ARK criptografado para nó: ${payload.targetNodeId}`);
      
      await sovereignMeshService.sendToNode(payload.targetNodeId, {
        id: `task_${taskId}`,
        sourceNode: sovereignMeshService.getNodeId(),
        targetNode: payload.targetNodeId,
        timestamp: Date.now(),
        payloadType: 'inference_request',
        payload: sovereignEncryptionService.encryptPayload(task as unknown as Record<string, unknown>, ark),
        securityLevel: 'high_sovereignty'
      });
    } else {
      // Fallback para broadcast global (menos seguro, mas funcional para descoberta)
      await sovereignMeshService.broadcast({
        id: `task_${taskId}`,
        sourceNode: sovereignMeshService.getNodeId(),
        targetNode: 'ALL',
        timestamp: Date.now(),
        payloadType: 'inference_request',
        payload: sovereignEncryptionService.encryptPayload(task as unknown as Record<string, unknown>),
        securityLevel: consensus ? 'high_sovereignty' : 'medium_sovereignty'
      });
    }

    return taskId;
  }

  /**
   * Lógica do Worker: Processa uma tarefa recebida de outro nó.
   */
  private async handleIncomingRequest(data: any) {
    let task: InferenceTask;
    const ark = sovereignMeshService.getSessionKey(data.sourceNode);
    
    try {
      // Tenta descriptografar usando o ARK se disponível, senão usa a chave global
      task = sovereignEncryptionService.decryptPayload<InferenceTask>(data.payload, ark);
    } catch {
      try {
        // Fallback para chave global (retrocompatibilidade ou broadcast inicial)
        task = sovereignEncryptionService.decryptPayload<InferenceTask>(data.payload);
      } catch {
        logger.error(`[DistributedInference] Falha ao descriptografar requisição de ${data.sourceNode}`);
        return;
      }
    }

    if (task.sourceNodeId === sovereignMeshService.getNodeId()) return;

    logger.info(`[DistributedInference] Recebida tarefa ${task.type} do nó ${task.sourceNodeId}. Processando...`);

    // [Level 13] Integração real com o GenerativeAIService local ou WASM Sandbox
    try {
      let resultData: any;

      if (task.requiresSandbox && task.wasmModuleId) {
        const { wasmSandboxBridge } = await import('./WasmSandboxBridge');
        const wasmResult = await wasmSandboxBridge.executeInSandbox(
          task.wasmModuleId,
          task.wasmFunctionName || 'main',
          Array.isArray(task.payload) ? task.payload as number[] : []
        );
        
        if (!wasmResult.success) throw new Error(`WASM Error: ${wasmResult.error}`);
        resultData = wasmResult.result;
      } else {
        const { generativeAIService } = await import('./GenerativeAIService');
        resultData = await generativeAIService.processDistributedTask(task.type, task.payload);
      }

      const result = {
        taskId: task.id,
        status: 'completed',
        data: resultData,
        processedAt: Date.now(),
        sandboxed: task.requiresSandbox
      };

      const responsePacket: SyncPacket = {
        id: `res_${task.id}`,
        sourceNode: sovereignMeshService.getNodeId(),
        targetNode: task.sourceNodeId,
        timestamp: Date.now(),
        payloadType: 'inference_result',
        payload: sovereignEncryptionService.encryptPayload(result, ark),
        securityLevel: task.requiresSandbox ? 'high_sovereignty' : 'medium_sovereignty'
      };

      if (ark) {
        await sovereignMeshService.sendToNode(task.sourceNodeId, responsePacket);
      } else {
        await sovereignMeshService.broadcast(responsePacket);
      }
    } catch (err: any) {
      logger.error(`[DistributedInference] Falha ao processar tarefa remota: ${err.message}`);
      
      const errorPacket: SyncPacket = {
        id: `res_${task.id}`,
        sourceNode: sovereignMeshService.getNodeId(),
        targetNode: task.sourceNodeId,
        timestamp: Date.now(),
        payloadType: 'inference_result',
        payload: sovereignEncryptionService.encryptPayload({ 
          taskId: task.id, 
          status: 'failed', 
          error: err.message,
          processedAt: Date.now()
        }, ark),
        securityLevel: 'medium_sovereignty'
      };

      if (ark) {
        await sovereignMeshService.sendToNode(task.sourceNodeId, errorPacket);
      } else {
        await sovereignMeshService.broadcast(errorPacket);
      }
    }
  }

  private handleInferenceResult(data: { sourceNode: string, payload: any }) {
    let result: { taskId: string, status: string, data: any };
    const ark = sovereignMeshService.getSessionKey(data.sourceNode);

    try {
      // Tenta descriptografar usando o ARK se disponível, senão usa a chave global
      result = sovereignEncryptionService.decryptPayload<any>(data.payload, ark);
    } catch {
      try {
        result = sovereignEncryptionService.decryptPayload<any>(data.payload);
      } catch {
        logger.error(`[DistributedInference] Falha ao descriptografar resultado de ${data.sourceNode}`);
        return;
      }
    }
    const task = this.activeTasks.get(result.taskId);

    if (!task) return;

    if (task.consensusRequired && task.votes) {
      task.votes.set(data.sourceNode, result.data);
      logger.info(`[DistributedInference] Voto recebido para ${task.id} de ${data.sourceNode} (${task.votes.size}/${task.minVotes})`);

      if (task.votes.size >= (task.minVotes || 1)) {
        this.resolveConsensus(task);
      }
    } else {
      logger.info(`[DistributedInference] Resultado único aceito para tarefa ${task.id}`);
      task.status = 'completed';
      task.result = result.data;
      this.emit('task:update', task);
      this.emit(`task:completed:${task.id}`, task);
      this.activeTasks.delete(task.id);
    }
  }

  private async resolveConsensus(task: InferenceTask) {
    if (!task.votes) return;

    // [Level 13] Lógica de consenso ponderada por reputação
    const voteValues = Array.from(task.votes.entries());
    const frequency: Record<string, number> = {};
    const reputations: Record<string, number> = {};
    
    let winner: Record<string, unknown> | unknown[] | undefined = undefined;
    let maxWeight = 0;

    for (const [nodeId, val] of voteValues) {
      const key = typeof val === 'string' ? val : JSON.stringify(val);
      
      // Busca reputação real do nó no Mesh (Swarm-wide Consensus)
      const nodeReputation = nodeId === sovereignMeshService.getNodeId() 
        ? 1.0 
        : sovereignMeshService.getPeerReputation(nodeId);
      
      frequency[key] = (frequency[key] || 0) + 1;
      reputations[key] = (reputations[key] || 0) + nodeReputation;

      if (reputations[key] > maxWeight) {
        maxWeight = reputations[key];
        winner = val;
      }
    }

    // Exige que o vencedor tenha pelo menos 50% do peso total ou minVotes
    const totalWeight = Object.values(reputations).reduce((a, b) => a + b, 0);
    if (maxWeight >= totalWeight / 2 || task.votes.size >= (task.minVotes || 3)) {
      logger.info(`[DistributedInference] Consenso atingido para ${task.id} (Peso: ${maxWeight.toFixed(2)}/${totalWeight.toFixed(2)})`);
      task.status = 'completed';
      task.result = winner;
      this.emit('task:update', task);
      this.emit(`task:completed:${task.id}`, task);
      this.activeTasks.delete(task.id);
    } else {
      logger.warn(`[DistributedInference] Consenso insuficiente para ${task.id}. Aguardando mais votos...`);
    }
  }

  public getActiveTasks(): InferenceTask[] {
    return Array.from(this.activeTasks.values());
  }

  public getActiveTasksCount(): number {
    return this.activeTasks.size;
  }

  public getLocalCapabilities() {
    // [Level 13] Integração com ThermalEfficiencyEngine e ResourceMonitor
    const activeTasksCount = this.getActiveTasksCount();
    const { resourceMonitor } = require('./ResourceMonitorService');
    const { thermalEfficiencyEngine } = require('./ThermalEfficiencyEngine');
    
    const cpuLoad = resourceMonitor?.getStatus().cpuLoad || 0;
    const temp = thermalEfficiencyEngine?.getTemperature() || 40;
    
    // NPU Load real seria via driver, aqui estimamos baseado em tarefas ativas + CPU
    const estimatedNpuLoad = Math.min(100, activeTasksCount * 12 + (cpuLoad * 0.2));
    
    return {
      ...this.localCapabilities,
      currentLoad: estimatedNpuLoad,
      temperature: temp,
      activeTasks: activeTasksCount,
      timestamp: Date.now(),
      status: temp > 75 ? 'throttled' : 'optimal'
    };
  }
}

export const distributedInferenceService = DistributedInferenceService.getInstance();
