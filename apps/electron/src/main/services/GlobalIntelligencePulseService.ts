import { EventEmitter } from 'events';
import { logger } from '../logger';
import { sovereignMeshService } from './SovereignMeshService';
import { sovereignGraphService } from './SovereignGraphService';
import { sovereignEncryptionService } from './SovereignEncryptionService';

interface PulseState {
  localHash: string;
  globalConsensusHash: string | null;
  agreementRate: number;
  lastPulseTime: number;
  peerHashes: Map<string, string>;
}

/**
 * GlobalIntelligencePulseService (Nível 13 - Phase 1900)
 * -----------------------------------------------------
 * Gerencia a sincronização da "Realidade Global" entre os Hubs Áquila.
 * Utiliza hashing criptográfico para garantir que todos os Hubs no enxame
 * possuam a mesma base de insights fundamentais sem trafegar dados brutos pesados.
 */
export class GlobalIntelligencePulseService extends EventEmitter {
  private static instance: GlobalIntelligencePulseService;
  private state: PulseState = {
    localHash: '',
    globalConsensusHash: null,
    agreementRate: 0,
    lastPulseTime: 0,
    peerHashes: new Map()
  };

  private pulseInterval: NodeJS.Timeout | null = null;

  private constructor() {
    super();
    this.setupListeners();
  }

  public static getInstance(): GlobalIntelligencePulseService {
    if (!GlobalIntelligencePulseService.instance) {
      GlobalIntelligencePulseService.instance = new GlobalIntelligencePulseService();
    }
    return GlobalIntelligencePulseService.instance;
  }

  private setupListeners() {
    // Escuta por pulsos de outros nós
    sovereignMeshService.on('mesh:payload:GLOBAL_INSIGHT_PULSE', (data: { sourceNode: string, payload: any }) => {
      this.handleIncomingPulse(data);
    });
  }

  /**
   * Inicia o ciclo de pulso global.
   */
  public start(intervalMs: number = 30000) { // Default 30s
    if (this.pulseInterval) return;
    
    logger.info(`[Pulse] Iniciando ciclo de sincronização global (${intervalMs}ms)`);
    this.pulseInterval = setInterval(() => this.emitPulse(), intervalMs);
    this.emitPulse(); // Trigger imediato
  }

  /**
   * Emite o hash de inteligência local para o enxame.
   */
  private async emitPulse() {
    const { hash, topInsights } = await sovereignGraphService.syncGlobalInsights();
    this.state.localHash = hash;
    this.state.lastPulseTime = Date.now();

    // Busca dados locais da sala
    const { Database } = await import('../../database/Database');
    const db = Database.getInstance();
    const settings = await db.getSettings();
    const roomId = settings.assigned_room_id || '';
    let roomName = '';
    if (roomId) {
      const room = await db.get('SELECT name FROM rooms WHERE id = ?', [roomId]);
      if (room) roomName = room.name;
    }

    // Busca especificações de hardware locais
    const { sovereignMeshService } = await import('./SovereignMeshService');
    const specs = sovereignMeshService.getLocalHardwareSpecs ? sovereignMeshService.getLocalHardwareSpecs() : {};

    const payload = {
      hash,
      insightCount: topInsights.length,
      timestamp: this.state.lastPulseTime,
      roomId,
      roomName,
      ...specs
    };

    await sovereignMeshService.broadcast({
      id: `pulse_${Date.now()}`,
      sourceNode: sovereignMeshService.getNodeId(),
      targetNode: 'ALL',
      timestamp: Date.now(),
      payloadType: 'GLOBAL_INSIGHT_PULSE',
      payload: sovereignEncryptionService.encryptPayload(payload),
      securityLevel: 'high_sovereignty'
    });

    this.calculateConsensus();
  }

  /**
   * Processa pulso recebido de um par.
   */
  private handleIncomingPulse(data: { sourceNode: string, payload: any }) {
    try {
      const remotePayload = sovereignEncryptionService.decryptPayload<any>(data.payload);
      this.state.peerHashes.set(data.sourceNode, remotePayload.hash);
      
      const remoteRoomId = remotePayload.roomId || '';
      const remoteRoomName = remotePayload.roomName || '';
      const specs = {
        cpu: remotePayload.cpu || '',
        ram: remotePayload.ram || 0,
        gpu: remotePayload.gpu || '',
        tops: remotePayload.tops || 0,
        ssd: remotePayload.ssd || 0
      };

      sovereignMeshService.setPeerRoom(data.sourceNode, remoteRoomId, remoteRoomName, specs);

      logger.debug(`[Pulse] Recebido pulso de ${data.sourceNode}. Hash: ${remotePayload.hash.substring(0, 8)}`);
      this.calculateConsensus();
    } catch (err) {
      logger.error(`[Pulse] Falha ao processar pulso de ${data.sourceNode}: ${err}`);
    }
  }

  /**
   * Calcula o consenso de realidade baseado nos hashes dos pares.
   */
  private calculateConsensus() {
    const hashes = Array.from(this.state.peerHashes.values());
    hashes.push(this.state.localHash); // Inclui o local

    const frequency: Record<string, number> = {};
    let consensusHash: string | null = null;
    let maxFreq = 0;

    for (const h of hashes) {
      frequency[h] = (frequency[h] || 0) + 1;
      if (frequency[h] > maxFreq) {
        maxFreq = frequency[h];
        consensusHash = h;
      }
    }

    const totalNodes = hashes.length;
    this.state.agreementRate = totalNodes > 0 ? maxFreq / totalNodes : 0;
    this.state.globalConsensusHash = consensusHash;

    if (this.state.agreementRate >= 0.6 && consensusHash !== this.state.localHash) {
      logger.warn(`[Pulse] Divergência de realidade detectada! Consenso Global: ${consensusHash?.substring(0, 8)}. Local: ${this.state.localHash.substring(0, 8)}`);
      this.emit('pulse:divergence', { local: this.state.localHash, global: consensusHash });
    } else if (this.state.agreementRate >= 0.6) {
      logger.info(`[Pulse] Realidade Consolidada. Taxa de acordo: ${(this.state.agreementRate * 100).toFixed(0)}%`);
      this.emit('pulse:consensus', consensusHash);
    }

    this.emit('pulse:update', this.state);
  }

  public getState() {
    return {
      ...this.state,
      peerCount: this.state.peerHashes.size
    };
  }
}

export const globalIntelligencePulseService = GlobalIntelligencePulseService.getInstance();
