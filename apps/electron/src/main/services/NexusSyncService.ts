import { EventEmitter } from 'events';
import { logger } from '../logger';
import { NexusNode, SyncPacket } from '../../services/AiTypes';
import { sovereignFirewall } from './SovereignFirewallService';
import { sovereignMeshService } from './SovereignMeshService';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';

/**
 * NEXUS SYNC SERVICE (v601) - MESH READY
 * ------------------------------------
 * Gerencia a sincronização autônoma de dados entre nós de campus.
 * Evoluiu de simulação de Gossip para transporte P2P real via SovereignMeshService.
 */

const HEARTBEAT_TIMEOUT = 60000; // Aumentado para 60s na rede real

export class NexusSyncService extends EventEmitter {
  private static instance: NexusSyncService;
  private nodes: Map<string, NexusNode & { lastPulse: number }> = new Map();
  private meshActive: boolean = true;
  private checkInterval: NodeJS.Timeout | null = null;
  private db: any;

  constructor() {
    super();
    this.initializeNodes();
    this.setupMeshIntegration();
    this.startGossipSimulation(); // Mantido para 'fills' de UI e ruído de fundo
    this.startHeartbeatMonitor();
  }

  /**
   * [SQA-SYNC-605] Inicializa o serviço com a instância de banco e ativa o Mesh.
   */
  public async init(db: any) {
    this.db = db;
    logger.info('[Nexus] Serviço de Sincronização ativando camada P2P...');
    await sovereignMeshService.init();

    // Integração com Córtex (Phase 600)
    const { cortexEvolutionService } = await import('./CortexEvolutionService');
    cortexEvolutionService.on('cortex:pulse', (insight: any) => {
      this.broadcastBrainPulse(insight);
    });
  }

  /**
   * Transmite um pulso evolutivo para toda a malha (Phase 600 - LGPD Guarded).
   */
  public broadcastBrainPulse(insight: any) {
    // LGPD Compliance: Garantir que não transmitimos nomes ou fotos brutas
    const sanitizedInsight = { ...insight };
    if (sanitizedInsight.content) {
        // Mock de Scrubber de PII (Personally Identifiable Information)
        sanitizedInsight.content = sanitizedInsight.content.replace(/Alunos?: [^\\n+]/g, 'Aluno: [ANONIMIZADO]');
    }

    this.broadcastMessage('evolution_pulse', sanitizedInsight);
  }

  /**
   * Conecta os eventos do Mesh Service ao fluxo do Nexus.
   */
  private setupMeshIntegration() {
    sovereignMeshService.on('packet', (packet: SyncPacket) => {
      this.handleIncomingPacket(packet);
    });
  }

  private initializeNodes() {
    // Nós "Seed" agora representam identidades conhecidas na malha
    const seedNodes: NexusNode[] = [
      { id: 'nexus_alpha', name: 'Alpha Core (Central)', load: 0.12, syncStatus: 'synced', lastHeartbeat: Date.now(), aiEnabled: true, specialization: ['general'], hardwareProfile: 'high' },
      { id: 'nexus_beta', name: 'Beta Wing (Coordenação)', load: 0.45, syncStatus: 'synced', lastHeartbeat: Date.now(), aiEnabled: true, specialization: ['pedagogy', 'attendance'], hardwareProfile: 'medium' }
    ];
    seedNodes.forEach(node => this.nodes.set(node.id, { ...node, lastPulse: Date.now() }));
  }

  private startHeartbeatMonitor() {
    this.checkInterval = setInterval(() => {
      this.pruneDeadNodes();
    }, 15000);
  }

  private pruneDeadNodes() {
    const now = Date.now();
    this.nodes.forEach((node, id) => {
      if (now - node.lastPulse > HEARTBEAT_TIMEOUT && node.syncStatus !== 'offline') {
        logger.warn(`[Nexus] Nó ${id} (P2P) parou de responder. Marcando como OFFLINE.`);
        node.syncStatus = 'offline';
        this.emit('node-suspended', { id, node });
      }
    });
  }

  /**
   * Processa pacotes reais recebidos via libp2p.
   */
  private async handleIncomingPacket(packet: SyncPacket) {
    const nodeId = packet.sourceNode;
    let node = this.nodes.get(nodeId);

    if (!node) {
      // Auto-descoberta de novo nó na malha
      logger.info(`[Nexus] Novo nó detectado via Mesh: ${nodeId}`);
      node = {
        id: nodeId,
        name: `Node ${nodeId.substring(0, 8)}`,
        load: 0.1,
        syncStatus: 'synced',
        lastHeartbeat: Date.now(),
        aiEnabled: true,
        specialization: ['general'],
        hardwareProfile: 'medium',
        lastPulse: Date.now()
      };
      this.nodes.set(nodeId, node as any);
    } else {
      node.syncStatus = 'synced';
      node.lastPulse = Date.now();
      node.lastHeartbeat = Date.now();
    }

    // Encaminha para processamento específico se necessário
    if (packet.payloadType === 'evolution_pulse') {
        const { cortexEvolutionService } = await import('./CortexEvolutionService');
        await cortexEvolutionService.learnInsight(packet.payload as any, true);
        this.emit('evolution-pulse', packet);
    }

    this.emit('nexus-pulse-received', packet);
  }

  private startGossipSimulation() {
    // Apenas gera tráfego visual/didático se não houver peers reais
    setInterval(() => {
      if (!this.meshActive || sovereignMeshService.getStatus().peersConnected > 0) return;
      
      const packet: SyncPacket = {
        id: `sim_${Date.now()}`,
        sourceNode: 'simulator',
        targetNode: 'broadcast',
        payloadType: 'telemetry',
        timestamp: Date.now()
      };
      this.emit('nexus-pulse', packet);
    }, 5000);
  }

  public getNodes(): NexusNode[] {
    return Array.from(this.nodes.values());
  }

  public async broadcastMessage(type: string, payload: any) {
    const packet: SyncPacket = {
      id: `msg_${Date.now()}`,
      sourceNode: os.hostname(),
      targetNode: 'broadcast',
      payloadType: type as any,
      timestamp: Date.now(),
      payload
    };
    
    // Dispara internamente e via Mesh real
    this.emit('nexus-pulse', packet);
    await sovereignMeshService.broadcast(packet);
  }

  public async broadcastSessionAction(userId: string, action: 'login' | 'logout', deviceType: 'desktop' | 'mobile') {
    const packet: SyncPacket = {
      id: `sess_${Date.now()}`,
      sourceNode: os.hostname(),
      targetNode: 'broadcast',
      payloadType: 'session_sync',
      timestamp: Date.now(),
      payload: { userId, action, deviceType }
    };
    
    await sovereignMeshService.broadcast(packet);
    this.emit('nexus-pulse', packet);
    logger.info(`[Nexus] Real P2P Broadcast: ${userId} ${action}`);
  }

  public setMeshStatus(active: boolean) {
    this.meshActive = active;
    this.emit('mesh-status-changed', active);
  }

  public isMeshAlive(): boolean {
    const status = sovereignMeshService.getStatus();
    return status.active;
  }

  /**
   * [Simulação] Força a queda de um nó localmente para testar failover do mestre.
   */
  public simulateNodeFailure(nodeId: string) {
    const node = this.nodes.get(nodeId);
    if (node) {
      logger.warn(`[Nexus-Simulation] Forçando falha do nó: ${nodeId}`);
      node.syncStatus = 'offline';
      node.lastPulse = 0; 
      this.emit('node-suspended', { id: nodeId, node });
    }
  }

  /**
   * [Simulação] Restaura um nó que estava offline.
   */
  public restoreNode(nodeId: string) {
    const node = this.nodes.get(nodeId);
    if (node) {
      logger.info(`[Nexus-Simulation] Restaurando nó: ${nodeId}`);
      node.syncStatus = 'synced';
      node.lastPulse = Date.now();
      this.emit('nexus-pulse-received', { sourceNode: nodeId, payloadType: 'heartbeat' });
    }
  }
}

export const nexusSyncService = new NexusSyncService();

