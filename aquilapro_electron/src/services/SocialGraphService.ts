import { EventEmitter } from 'events';

export interface SocialConnection {
  sourceId: string;
  targetId: string;
  strength: number; // 0 to 1
  lastInteraction: number;
}

/**
 * Phase 520: SocialGraphService
 * Mapeia conexões e interações detectadas entre indivíduos (via ReID).
 */
class SocialGraphService extends EventEmitter {
  private connections: Map<string, SocialConnection> = new Map();
  private nodes: Set<string> = new Set();

  public registerInteraction(idA: string, idB: string, strength: number = 0.1) {
    const key = [idA, idB].sort().join(':');
    const existing = this.connections.get(key);
    
    this.nodes.add(idA);
    this.nodes.add(idB);

    if (existing) {
      existing.strength = Math.min(1, existing.strength + strength);
      existing.lastInteraction = Date.now();
    } else {
      this.connections.set(key, {
        sourceId: idA,
        targetId: idB,
        strength,
        lastInteraction: Date.now()
      });
    }

    this.emit('graph-updated', this.getGraphData());
  }

  public getGraphData() {
    return {
      nodes: Array.from(this.nodes).map(id => ({ id, label: `Indivíduo ${id.substring(0, 4)}` })),
      links: Array.from(this.connections.values())
    };
  }

  public getIsolatedNodes() {
    // Simples: nós com conexões muito fracas
    const connectionCounts = new Map<string, number>();
    this.connections.forEach(conn => {
      connectionCounts.set(conn.sourceId, (connectionCounts.get(conn.sourceId) || 0) + conn.strength);
      connectionCounts.set(conn.targetId, (connectionCounts.get(conn.targetId) || 0) + conn.strength);
    });
    
    return Array.from(this.nodes).filter(id => (connectionCounts.get(id) || 0) < 0.2);
  }
}

export const socialGraphService = new SocialGraphService();
