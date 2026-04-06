import { EventEmitter } from 'events';
import { logger } from '../main/logger';
import { NexusNode, SyncPacket } from './AiTypes';
import { sovereignFirewall } from './SovereignFirewallService';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';

/**
 * NEXUS SYNC SERVICE (v3640)
 * -------------------------
 * Manages autonomous P2P data synchronization between campus nodes.
 * Implements a "Gossip Protocol" simulation for sharded ledger distribution.
 */

const HEARTBEAT_TIMEOUT = 30000; // 30 segundos de tolerância

export class NexusSyncService extends EventEmitter {
  private static instance: NexusSyncService;
  private nodes: Map<string, NexusNode & { lastPulse: number }> = new Map();
  private meshActive: boolean = true;
  private checkInterval: NodeJS.Timeout | null = null;
  private db: any;

  constructor() {
    super();
    this.initializeNodes();
    this.startGossipSimulation();
    this.startHeartbeatMonitor();
  }

  /**
   * [SQA-SYNC-605] Inicializa o serviço com a instância de banco do nó.
   */
  public init(db: any) {
    this.db = db;
    logger.info('[Nexus] Serviço de Sincronização inicializado com DB.');
  }

  private initializeNodes() {
    const seedNodes: NexusNode[] = [
      { id: 'nexus_alpha', name: 'Alpha Core (Central)', load: 0.12, syncStatus: 'synced', lastHeartbeat: Date.now(), aiEnabled: true, specialization: ['general'], hardwareProfile: 'high' },
      { id: 'nexus_beta', name: 'Beta Wing (Coordenação)', load: 0.45, syncStatus: 'synced', lastHeartbeat: Date.now(), aiEnabled: true, specialization: ['pedagogy', 'attendance'], hardwareProfile: 'medium' },
      { id: 'nexus_gamma', name: 'Gamma Lab (Direção)', load: 0.22, syncStatus: 'synced', lastHeartbeat: Date.now(), aiEnabled: true, specialization: ['finance', 'legal'], hardwareProfile: 'medium' },
      { id: 'nexus_delta', name: 'Delta Gate (Câmeras)', load: 0.08, syncStatus: 'synced', lastHeartbeat: Date.now(), aiEnabled: true, specialization: ['security', 'vision'], hardwareProfile: 'high' }
    ];
    seedNodes.forEach(node => this.nodes.set(node.id, { ...node, lastPulse: Date.now() }));
  }

  /**
   * [SQA-GSP-201] Heartbeat Monitor (Auto-Cura)
   * Monitora a saúde dos nós e remove os inativos.
   */
  private startHeartbeatMonitor() {
    this.checkInterval = setInterval(() => {
      this.pruneDeadNodes();
    }, 10000); // Checagem a cada 10s
  }

  private pruneDeadNodes() {
    const now = Date.now();
    this.nodes.forEach((node, id) => {
      if (now - node.lastPulse > HEARTBEAT_TIMEOUT && node.syncStatus !== 'offline') {
        logger.warn(`[Gossip] Nó ${id} parou de pulsar. Marcando como SUSPENDED.`);
        node.syncStatus = 'offline';
        this.emit('node-suspended', { id, node });
      }
    });
  }

  private startGossipSimulation() {
    setInterval(() => {
      if (!this.meshActive) return;

      // Simulate a random sync pulse between two nodes
      const nodeIds = Array.from(this.nodes.keys());
      const source = nodeIds[Math.floor(Math.random() * nodeIds.length)];
      let target = nodeIds[Math.floor(Math.random() * nodeIds.length)];
      while (target === source) {
        target = nodeIds[Math.floor(Math.random() * nodeIds.length)];
      }

      const packet: SyncPacket = {
        id: `pkt_${Date.now()}`,
        sourceNode: source,
        targetNode: target,
        payloadType: Math.random() > 0.7 ? 'identity' : 'telemetry',
        timestamp: Date.now()
      };

      // Update node loads
      const sNode = this.nodes.get(source);
      const tNode = this.nodes.get(target);
      if (sNode) sNode.load = Math.min(1, sNode.load + 0.01);
      if (tNode) {
        tNode.load = Math.min(1, tNode.load + 0.02);
        tNode.lastHeartbeat = Date.now();
      }

      this.emit('nexus-pulse', packet);
      
      // Decay load
      setTimeout(() => {
        if (sNode) sNode.load = Math.max(0.05, sNode.load - 0.01);
        if (tNode) tNode.load = Math.max(0.05, tNode.load - 0.01);
      }, 1500);

    }, 2000);
  }

  public getNodes(): NexusNode[] {
    return Array.from(this.nodes.values());
  }

  /**
   * Simula a queda de um nó específico (v3472 Test Rig).
   */
  public simulateNodeFailure(nodeId: string) {
    const node = this.nodes.get(nodeId);
    if (node) {
      logger.warn(`[FailoverTest] Simulando falha do nó: ${nodeId}`);
      node.syncStatus = 'offline';
      node.lastPulse = 0; // Garante que o monitor de heartbeat o veja como morto
      this.emit('node-suspended', { id: nodeId, node });
    }
  }

  /**
   * Restaura um nó que foi derrubado (v3472 Test Rig).
   */
  public restoreNode(nodeId: string) {
    const node = this.nodes.get(nodeId);
    if (node) {
      logger.info(`[FailoverTest] Restaurando nó: ${nodeId}`);
      node.syncStatus = 'synced';
      node.lastPulse = Date.now();
      this.emit('nexus-pulse', { 
        id: `restore_${Date.now()}`, 
        sourceNode: nodeId, 
        targetNode: 'broadcast', 
        payloadType: 'identity', 
        timestamp: Date.now() 
      });
    }
  }

  public setMeshStatus(active: boolean) {
    this.meshActive = active;
    this.emit('mesh-status-changed', active);
  }

  public isMeshAlive(): boolean {
    return this.meshActive;
  }

  /**
   * Transmite uma ação de sessão (login/logout) para todos os nós.
   */
  public broadcastSessionAction(userId: string, action: 'login' | 'logout', deviceType: 'desktop' | 'mobile') {
    const packet: SyncPacket = {
      id: `sess_${Date.now()}`,
      sourceNode: ' nexus_alpha', // Id local (em prod seria dinâmico)
      targetNode: 'broadcast',
      payloadType: 'session_sync',
      timestamp: Date.now(),
      payload: { userId, action, deviceType }
    };
    packet.signature = sovereignFirewall.signPacket(packet);
    this.emit('nexus-pulse', packet);
    logger.info(`[Nexus] Broadcast de sessão para ${userId}: ${action} (Assinado)`);
  }

  /**
   * [SQA-REP-620] Responde a um pedido de paridade com os dados locais protegidos.
   */
  public async respondToParity(sourceId: string, table: string, logs: any[]) {
      const packet: SyncPacket = {
          id: `parity_res_${Date.now()}`,
          sourceNode: os.hostname(),
          targetNode: sourceId,
           payloadType: 'parity_response',
           timestamp: Date.now(),
           payload: logs 
       };
       packet.signature = sovereignFirewall.signPacket(packet);
       this.emit('nexus-pulse', packet);
       logger.info(`[Nexus] Paridade enviada para ${sourceId} (Assinada)`);
   }

   /**
    * [SQA-FW-675] Recebe e processa pulsos externos com validação do Firewall.
    */
   public receivePulse(packet: SyncPacket) {
     if (!sovereignFirewall.verifyPacket(packet)) {
       logger.warn(`[Nexus] Pacote REJEITADO pelo Firewall: ${packet.payloadType} de ${packet.sourceNode}`);
       return;
     }
     
     logger.debug(`[Nexus] Pacote validado e aceito: ${packet.payloadType}`);
     this.emit('nexus-pulse-received', packet);
   }

  /**
   * [HS-03] Receptor de espelhamento binário (Guardian Role)
   */
  private async handleDbMirror(payload: any) {
    try {
      const backupDir = path.join(process.env.APPDATA || '', 'aquila/backup');
      if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
      
      const mirrorPath = path.join(backupDir, 'aquila_mirror.db');
      const buffer = Buffer.from(payload.data, 'base64');
      
      fs.writeFileSync(mirrorPath, buffer);
      console.log(`[Guardian] Mirror recebido e persistido com sucesso: ${new Date().toLocaleTimeString()}`);
    } catch (err) {
      console.error('[Guardian] Falha ao processar mirror recebido:', err);
    }
  }
}

export const nexusSyncService = new NexusSyncService();
