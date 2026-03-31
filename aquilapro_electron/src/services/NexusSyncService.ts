import { EventEmitter } from 'events';

/**
 * NEXUS SYNC SERVICE (v3640)
 * -------------------------
 * Manages autonomous P2P data synchronization between campus nodes.
 * Implements a "Gossip Protocol" simulation for sharded ledger distribution.
 */

export interface NexusNode {
  id: string;
  name: string;
  load: number; // 0.0 to 1.0
  syncStatus: 'synced' | 'pending' | 'offline';
  lastHeartbeat: number;
}

export interface SyncPacket {
  id: string;
  sourceNode: string;
  targetNode: string;
  payloadType: 'identity' | 'telemetry' | 'schedule';
  timestamp: number;
}

class NexusSyncService extends EventEmitter {
  private nodes: Map<string, NexusNode> = new Map();
  private meshActive: boolean = true;

  constructor() {
    super();
    this.initializeNodes();
    this.startGossipSimulation();
  }

  private initializeNodes() {
    const seedNodes: NexusNode[] = [
      { id: 'nexus_alpha', name: 'Alpha Core (Central)', load: 0.12, syncStatus: 'synced', lastHeartbeat: Date.now() },
      { id: 'nexus_beta', name: 'Beta Wing (Leste)', load: 0.45, syncStatus: 'synced', lastHeartbeat: Date.now() },
      { id: 'nexus_gamma', name: 'Gamma Lab (Oeste)', load: 0.22, syncStatus: 'synced', lastHeartbeat: Date.now() },
      { id: 'nexus_delta', name: 'Delta Gate (Sul)', load: 0.08, syncStatus: 'synced', lastHeartbeat: Date.now() }
    ];
    seedNodes.forEach(node => this.nodes.set(node.id, node));
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

  public setMeshStatus(active: boolean) {
    this.meshActive = active;
    this.emit('mesh-status-changed', active);
  }

  public isMeshAlive(): boolean {
    return this.meshActive;
  }
}

export const nexusSyncService = new NexusSyncService();
