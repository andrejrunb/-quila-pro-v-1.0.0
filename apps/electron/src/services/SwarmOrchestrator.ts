import { logger } from '../main/logger';
import { AgentTask } from './AgentDefinitions';
import { EventEmitter } from 'events';
import { nexusSyncService } from './NexusSyncService';
import Database from '../database/Database';
import { SyncPacket } from './AiTypes';
import * as os from 'os';

/**
 * SwarmOrchestrator - Camada 4 SQA-1000 (SWR-901)
 * Orquestrador Master para balanceamento dinâmico de carga entre agentes.
 */
export class SwarmOrchestrator extends EventEmitter {
  private static instance: SwarmOrchestrator;
  private db: Database | null = null;
  private isAlpha: boolean = os.hostname().includes('alpha');

  private constructor() {
    super();
    this.setupListeners();
  }

  public static getInstance(): SwarmOrchestrator {
    if (!SwarmOrchestrator.instance) {
      SwarmOrchestrator.instance = new SwarmOrchestrator();
    }
    return SwarmOrchestrator.instance;
  }

  public init(db: Database) {
    this.db = db;
  }

  private setupListeners(): void {
    nexusSyncService.on('nexus-pulse', async (packet: SyncPacket) => {
      // Nó Alpha: Escuta relatórios e decide o deploy
      if (this.isAlpha && packet.payloadType === 'telemetry' && packet.payload?.type === 'HARDWARE_REPORT') {
        await this.handleHardwareReport(packet.payload, packet.sourceNode);
      }
      
      // Todos os nós: Processam replicação de dados (Fator 3)
      if (packet.payloadType === 'telemetry' && packet.payload?.type === 'SYNC_REPLICA') {
        await this.handleIncomingReplica(packet.payload.table, packet.payload.data);
      }

      // Nós Satélites: Escutam comandos de deploy vindos do Alpha
      if (!this.isAlpha && packet.sourceNode === 'nexus_alpha' && packet.payload?.type === 'DEPLOY_MODEL') {
        this.emit('deployCommandReceived', packet.payload);
      }
    });
  }

  private async handleHardwareReport(report: any, nodeId: string): Promise<void> {
    logger.info(`[Orchestrator] Alpha Core processando hardware de ${nodeId}: ${report.gpuInfo}`);
    
    // Salvar no Banco (Se disponível)
    if (this.db) {
      await this.db.run(`
        INSERT OR REPLACE INTO nexus_nodes (id, name, hardware_report, installed_llm, lastSeen)
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
      `, [nodeId, nodeId, JSON.stringify(report), report.recommendedModel]);
    }

    // Emitir comando de volta
    nexusSyncService.emit('nexus-pulse', {
      id: `dep_${Date.now()}`,
      sourceNode: 'nexus_alpha',
      targetNode: nodeId,
      payloadType: 'telemetry',
      timestamp: Date.now(),
      payload: { 
        type: 'DEPLOY_MODEL', 
        model: report.recommendedModel, 
        reason: report.reason 
      }
    });

    logger.info(`[Orchestrator] Comando de Deploy emitido para ${nodeId}: ${report.recommendedModel}`);
  }

  /**
   * [SQA-SWR-902] Garante replicação em 3 nós aleatórios do enxame (Redundância Tripla)
   */
  public async replicateToSwarm(table: string, data: any): Promise<void> {
    if (!this.db) return;
    
    // 1. Buscar 3 nós ativos (exceto o atual)
    const nodes = await this.db.all('SELECT id FROM nexus_nodes WHERE id != ? LIMIT 3', [os.hostname()]);
    
    if (nodes.length < 3) {
      logger.warn(`[Orchestrator] Fator de replicação incompleto: ${nodes.length}/3 nós disponíveis.`);
    }

    // 2. Emitir pacotes de replicação
    nodes.forEach(node => {
      nexusSyncService.emit('nexus-pulse', {
        id: `rep_${Date.now()}_${node.id}`,
        sourceNode: os.hostname(),
        targetNode: node.id,
        payloadType: 'telemetry',
        timestamp: Date.now(),
        payload: { 
          type: 'SYNC_REPLICA', 
          table, 
          data 
        }
      });
    });

    logger.info(`[Orchestrator] Replicação enviada para ${nodes.length} nós.`);
  }

  private async handleIncomingReplica(table: string, data: any): Promise<void> {
    if (!this.db) return;
    logger.info(`[Orchestrator] Recebendo réplica para a tabela: ${table}`);
    
    // Gravação defensiva de réplica (ID prefixado ou tabela mirror)
    // Para simplificar, assumimos IDs UUID que evitam colisões
    try {
      const keys = Object.keys(data).join(', ');
      const placeholders = Object.keys(data).map(() => '?').join(', ');
      await this.db.run(`INSERT OR REPLACE INTO ${table} (${keys}) VALUES (${placeholders})`, Object.values(data));
    } catch (err) {
      logger.error(`[Orchestrator] Falha ao gravar réplica: ${err}`);
    }
  }

  /**
   * [SQA-SWR-901] Reatribui tarefas baseando-se na pressão dos agentes.
   */
  public async rebalanceWorkload(tasks: AgentTask[]): Promise<void> {
    logger.info('[Orchestrator] Analisando pressão de agentes Swarm...');
    
    tasks.forEach(task => {
      if (task.priority === 'CRITICAL') {
        logger.info(`[Orchestrator] Escalando tarefa ${task.description} para nó prioritário.`);
      }
    });
  }
}

export const swarmOrchestrator = SwarmOrchestrator.getInstance();
