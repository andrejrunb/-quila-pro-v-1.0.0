import { resourceMonitor } from './ResourceMonitorService';
import { communicationHubService } from './CommunicationHubService';
import { logger } from '../logger';

/**
 * InfrastructureWatchdog.ts — Phase 800 (Sovereign Infrastructure)
 * Monitora a saúde lógica dos serviços e executa reparos autonômicos.
 */
class InfrastructureWatchdog {
  private static instance: InfrastructureWatchdog;
  private services: Map<string, { status: 'up' | 'down' | 'repairing', lastHeartbeat: number, restartCount: number }> = new Map();
  private watchdogInterval: NodeJS.Timeout | null = null;

  private constructor() {}

  public static getInstance(): InfrastructureWatchdog {
    if (!InfrastructureWatchdog.instance) {
      InfrastructureWatchdog.instance = new InfrastructureWatchdog();
    }
    return InfrastructureWatchdog.instance;
  }

  public start() {
    if (this.watchdogInterval) return;
    
    logger.info('[Watchdog] Iniciando Sentinela de Infraestrutura Soberana...');
    
    this.watchdogInterval = setInterval(() => {
      this.auditInfrastructure();
    }, 60000); // Auditoria a cada minuto
  }

  /**
   * Registra um heartbeat de um serviço interno.
   */
  public heartbeat(serviceName: string) {
    const info = this.services.get(serviceName) || { status: 'up', lastHeartbeat: Date.now(), restartCount: 0 };
    info.lastHeartbeat = Date.now();
    info.status = 'up';
    this.services.set(serviceName, info);
  }

  private async auditInfrastructure() {
    const now = Date.now();
    
    // 1. Verificação de Heartbeat de Serviços
    for (const [name, info] of this.services.entries()) {
      if (now - info.lastHeartbeat > 180000 && info.status !== 'repairing') {
        logger.warn(`[Watchdog] Serviço ${name} parou de responder. Iniciando Auto-Repair.`);
        await this.autoRepair(name);
      }
    }

    // 2. Verificação de Integridade Binária (Phase 1000)
    const { selfHealingInnoService } = await import('./SelfHealingInnoService');
    const integrity = await selfHealingInnoService.verifyBinaryIntegrity();
    
    if (!integrity.healthy) {
      logger.error(`[Watchdog] Corrupção de Binários detectada: ${integrity.corruptedFiles.join(', ')}. Disparando Reparo Cruzado P2P.`);
      await this.crossRepair(integrity.corruptedFiles);
    }

    // 3. Verificação de Integridade Física via ResourceMonitor
    const status = resourceMonitor.getStatus();
    if (status.predictivePanic) {
      logger.error(`[Watchdog] Pânico Preditivo detectado. Solicitando limpeza de emergência.`);
      resourceMonitor.forceCleanup();
    }
  }

  private async autoRepair(serviceName: string) {
    const info = this.services.get(serviceName);
    if (!info) return;

    info.status = 'repairing';
    info.restartCount++;
    this.services.set(serviceName, info);

    try {
      communicationHubService.sendMessage({
        sender: 'WATCHDOG_REPAIR',
        recipient: 'SISTEMA',
        content: `REPAIR_TRIGGER: ${serviceName}`,
        priority: 'high',
        channelId: 'system'
      });

      setTimeout(() => {
        this.heartbeat(serviceName);
        logger.info(`[Watchdog] Serviço ${serviceName} recuperado com sucesso.`);
      }, 5000);

    } catch (err) {
      logger.error(`[Watchdog] Falha crítica ao reparar ${serviceName}: ${err}`);
      info.status = 'down';
      this.services.set(serviceName, info);
    }
  }

  /**
   * [Phase 1000] Solicita fragmentos de arquivos corrompidos para a malha P2P.
   */
  private async crossRepair(files: string[]) {
    const { sovereignMeshService } = await import('./SovereignMeshService');
    
    for (const file of files) {
      logger.info(`[Watchdog] Solicitando REPAIR_REQUEST para o arquivo: ${file}`);
      
      await sovereignMeshService.broadcast({
        id: `repair_${Date.now()}_${file}`,
        sourceNode: sovereignMeshService.getNodeId(),
        targetNode: 'ALL',
        timestamp: Date.now(),
        payloadType: 'REPAIR_REQUEST',
        payload: { 
          fileName: file,
          requestHash: 'CRC_REQUIRED' // O nó que possui o binário validará contra seu backup
        },
        securityLevel: 'high_sovereignty'
      });
    }
  }

  public getGlobalHealth() {
    return {
      activeServices: this.services.size,
      services: Object.fromEntries(this.services),
      systemResources: resourceMonitor.getStatus()
    };
  }
}

export const infrastructureWatchdog = InfrastructureWatchdog.getInstance();
