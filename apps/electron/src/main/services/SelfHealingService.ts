import { logger } from '../logger';
import { distributedInferenceService, InferenceTask } from './DistributedInferenceService';
import { sovereignMeshService } from './SovereignMeshService';
import { thermalEfficiencyEngine } from './ThermalEfficiencyEngine';

/**
 * SelfHealingService (Level 15)
 * ----------------------------
 * Serviço de autorrecuperação que monitora a saúde do enxame e redistribui
 * tarefas de inferência em caso de falha de nós ou timeouts excessivos.
 */
export class SelfHealingService {
  private static instance: SelfHealingService;
  private checkInterval: NodeJS.Timeout | null = null;
  private lastKnownPeers: Set<string> = new Set();

  private constructor() {
    this.startMonitoring();
  }

  public static getInstance(): SelfHealingService {
    if (!SelfHealingService.instance) {
      SelfHealingService.instance = new SelfHealingService();
    }
    return SelfHealingService.instance;
  }

  private startMonitoring() {
    // Verifica a cada 10 segundos
    this.checkInterval = setInterval(() => this.auditSwarmHealth(), 10000);
    logger.info('[SelfHealing] Monitoramento de saúde do enxame iniciado.');
  }

  private async auditSwarmHealth() {
    const currentPeers = sovereignMeshService.getConnectedPeers();
    const currentPeerIds = new Set<string>(currentPeers.map(p => p.id));

    // Detecta nós que caíram
    for (const oldId of this.lastKnownPeers) {
      if (!currentPeerIds.has(oldId)) {
        logger.warn(`[SelfHealing] Nó detectado como OFFLINE: ${oldId}. Iniciando plano de contingência.`);
        await this.handleNodeFailure(oldId);
      }
    }

    this.lastKnownPeers = currentPeerIds;

    // Proteção Térmica (Homeostase)
    await this.auditThermalHealth();

    // Também verifica tarefas estagnadas (pending por mais de 30s)
    this.auditStaleTasks();
  }

  private isThermalOffloading = false;

  private async auditThermalHealth() {
    if (this.isThermalOffloading) return;
    if (thermalEfficiencyEngine && thermalEfficiencyEngine.shouldOffloadTask()) {
      const temp = thermalEfficiencyEngine.getTemperature();
      logger.warn(`[SelfHealing/Thermal] Temperatura elevada detectada (${temp.toFixed(1)}°C). Iniciando offload preventivo.`);
      
      const activeTasks = distributedInferenceService.getActiveTasks();
      const localTasks = activeTasks.filter(t => t.targetNodeId === 'local' && t.status === 'pending').slice(0, 3);
      
      if (localTasks.length > 0) {
        this.isThermalOffloading = true;
        try {
          logger.info(`[SelfHealing/Thermal] Redistribuindo ${localTasks.length} tarefas locais para resfriamento.`);
          for (const task of localTasks) {
            distributedInferenceService.cancelTask(task.id);
            await distributedInferenceService.dispatchTask(task.type, task.payload as any, task.consensusRequired);
          }
        } finally {
          this.isThermalOffloading = false;
        }
      }
    }
  }

  private async handleNodeFailure(nodeId: string) {
    const activeTasks = distributedInferenceService.getActiveTasks();
    const tasksToRedistribute = activeTasks.filter(t => t.targetNodeId === nodeId && t.status === 'pending').slice(0, 5);

    if (tasksToRedistribute.length > 0) {
      logger.info(`[SelfHealing] Redistribuindo ${tasksToRedistribute.length} tarefas do nó ${nodeId}...`);
      
      for (const task of tasksToRedistribute) {
        distributedInferenceService.cancelTask(task.id);
        await distributedInferenceService.dispatchTask(task.type, {
          ...task.payload as any,
          retryFromNode: nodeId
        }, task.consensusRequired);
        
        logger.info(`[SelfHealing] Tarefa ${task.id} redistribuída com sucesso.`);
      }
    }
  }

  private heartbeats: Map<string, number> = new Map();

  public reportHeartbeat(serviceId: string) {
    this.heartbeats.set(serviceId, Date.now());
  }

  private auditStaleTasks() {
    distributedInferenceService.pruneStaleTasks(30000);
  }

  public stop() {
    if (this.checkInterval) clearInterval(this.checkInterval);
  }
}

export const selfHealingService = SelfHealingService.getInstance();
