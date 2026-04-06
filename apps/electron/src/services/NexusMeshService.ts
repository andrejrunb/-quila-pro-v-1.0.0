import { logger } from '../main/logger';

interface MeshNode {
  id: string;
  type: 'TOTEM' | 'CAMERA' | 'HUB' | 'WORKSTATION';
  status: 'ONLINE' | 'OFFLINE';
  lastSeen: Date;
  latencyMs: number;
}

/**
 * NexusMeshService - Camada 5 SQA-1000 (DEPLOY-501)
 * Monitoramento de resiliência de malha (Mesh) entre dispositivos.
 */
export class NexusMeshService {
  private static instance: NexusMeshService;
  private nodes: Map<string, MeshNode> = new Map();

  private constructor() {}

  public static getInstance(): NexusMeshService {
    if (!NexusMeshService.instance) {
      NexusMeshService.instance = new NexusMeshService();
    }
    return NexusMeshService.instance;
  }

  /**
   * [SQA-DEPLOY-501] Heartbeat Gossip
   * Mantém o estado da rede atualizado com latência mínima.
   */
  public heartbeatGossip(nodeId: string, latency: number): void {
    const node = this.nodes.get(nodeId);
    if (node) {
      node.status = 'ONLINE';
      node.lastSeen = new Date();
      node.latencyMs = latency;
    } else {
      this.nodes.set(nodeId, {
        id: nodeId,
        type: 'TOTEM', // Default
        status: 'ONLINE',
        lastSeen: new Date(),
        latencyMs: latency
      });
    }
  }

  /**
   * Detecta falhas de rede em nós críticos.
   */
  public async benchmarkMeshLatency(): Promise<{ nodeId: string; status: string }[]> {
    const threshold = 1000; // 1s
    const reports: { nodeId: string; status: string }[] = [];
    
    this.nodes.forEach((node, id) => {
      if (node.latencyMs > threshold) {
        logger.warn(`[Nexus] Latência alta detectada no nó ${id}: ${node.latencyMs}ms`);
        reports.push({ nodeId: id, status: 'DEGRADED' });
      }
    });

    return reports;
  }

  public getMeshHealth() {
    const onlineCount = Array.from(this.nodes.values()).filter(n => n.status === 'ONLINE').length;
    return {
      nodesTotal: this.nodes.size,
      online: onlineCount,
      health: onlineCount === this.nodes.size ? 'OPTIMAL' : 'DEGRADED'
    };
  }
}

export const nexusMeshService = NexusMeshService.getInstance();
