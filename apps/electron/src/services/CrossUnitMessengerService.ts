import { EventEmitter } from 'events';
import { logger } from '../main/logger';

/**
 * UnitStatus (v3341)
 * Metadata sobre o estado de saúde de uma unidade escolar remota.
 */
export interface UnitStatus {
  unitId: string;
  name: string;
  healthScore: number;
  activeAgents: number;
  occupancyCount: number;
  lastSync?: number;
}

/**
 * CROSS-UNIT MESSENGER SERVICE (v3341)
 * ------------------------------------
 * Orquestra a comunicação entre múltiplas unidades de ensino (Nós Nexus).
 * Permite a visualização de 'Cluster' e compartilhamento de recursos simbólicos.
 */
class CrossUnitMessengerService extends EventEmitter {
  private static instance: CrossUnitMessengerService;
  private units: Map<string, UnitStatus> = new Map();

  private constructor() {
    super();
    this.initializeNetwork();
  }

  public static getInstance(): CrossUnitMessengerService {
    if (!CrossUnitMessengerService.instance) {
      CrossUnitMessengerService.instance = new CrossUnitMessengerService();
    }
    return CrossUnitMessengerService.instance;
  }

  /**
   * Inicializa o mapa base da rede vinculada ao cliente HQ.
   */
  private initializeNetwork() {
    this.registerUnit({
      unitId: 'unit-hq',
      name: 'Áquila HQ (Vila Mariana)',
      healthScore: 0.99,
      activeAgents: 12,
      occupancyCount: 450
    });

    this.registerUnit({
      unitId: 'unit-south',
      name: 'Áquila Sul (Interlagos)',
      healthScore: 0.92,
      activeAgents: 8,
      occupancyCount: 210
    });
  }

  public registerUnit(status: UnitStatus) {
    this.units.set(status.unitId, {
      ...status,
      lastSync: Date.now()
    });
    logger.info(`[ClusterSync] Unidade ${status.name} registrada na rede soberana.`);
  }

  public getUnitStatus(unitId: string): UnitStatus | undefined {
    return this.units.get(unitId);
  }

  public getAllUnits(): UnitStatus[] {
    return Array.from(this.units.values());
  }

  /**
   * [SQA-NET-912] Envia uma mensagem assinada para outra unidade via Tunnel.
   */
  public async sendCrossUnitMessage(targetUnitId: string, payload: any): Promise<boolean> {
     logger.info(`[ClusterSync] Encapsulando mensagem para ${targetUnitId} via QuantumTunnel...`);
     // Simulação de delay de rede via túnel seguro (v3341)
     await new Promise(r => setTimeout(r, 150));
     
     this.emit('message-sent', { targetUnitId, payload, timestamp: Date.now() });
     return true;
  }
}

export const crossUnitMessengerService = CrossUnitMessengerService.getInstance();
