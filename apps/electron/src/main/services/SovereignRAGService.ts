import { cortexEvolutionService } from './CortexEvolutionService';
import { sovereignMeshService } from './SovereignMeshService';
import { logger } from '../logger';

/**
 * SovereignRAGService.ts — Phase 900 (Distributed Intelligence)
 * Orquestra buscas de conhecimento (Retrieval) através da malha P2P.
 */
class SovereignRAGService {
  private static instance: SovereignRAGService;
  private readonly QUERY_TIMEOUT = 2500; // 2.5s para busca oportunista na malha

  private constructor() {}

  public static getInstance(): SovereignRAGService {
    if (!SovereignRAGService.instance) {
      SovereignRAGService.instance = new SovereignRAGService();
    }
    return SovereignRAGService.instance;
  }

  /**
   * Realiza uma busca híbrida: Local (BM25) + Swarm (Mesh)
   */
  public async searchSwarm(query: string, limit: number = 5) {
    logger.info(`[SwarmRAG] Iniciando busca distribuída: "${query}"`);

    // 1. Busca Local
    const localResults = cortexEvolutionService.searchKnowledge(query, limit);
    
    // 2. Busca na Malha (Broadcast)
    const remoteResults = await this.queryMesh(query);

    // 3. Rank Fusion (Mesclagem e Relevância)
    const consolidated = this.mergeResults(localResults, remoteResults);
    
    return consolidated.slice(0, limit);
  }

  private async queryMesh(query: string): Promise<any[]> {
    const requestId = `rag_${Date.now()}`;
    const results: any[] = [];

    return new Promise((resolve) => {
      // Handler Temporário para as respostas da malha
      const responseHandler = (packet: any) => {
        if (packet.payloadType === 'RAG_RESPONSE' && packet.payload.requestId === requestId) {
          results.push(...packet.payload.matches);
        }
      };

      // Escuta na malha
      sovereignMeshService.on('packet:received', responseHandler);

      // Dispara a Query
      sovereignMeshService.broadcast({
        id: requestId,
        sourceNode: 'nexus_alpha',
        targetNode: 'all',
        timestamp: Date.now(),
        payloadType: 'RAG_QUERY',
        payload: { query, requestId },
        securityLevel: 'medium_sovereignty'
      }).catch(err => logger.error(`[SwarmRAG] Falha no broadcast: ${err}`));

      // Timeout Oportunista
      setTimeout(() => {
        sovereignMeshService.removeListener('packet:received', responseHandler);
        resolve(results);
      }, this.QUERY_TIMEOUT);
    });
  }

  private mergeResults(local: any[], remote: any[]): any[] {
    // Lógica simples de remoção de duplicatas por ID e ordenação por score
    const map = new Map();
    
    local.forEach(r => map.set(r.id, { ...r, source: 'local' }));
    remote.forEach(r => {
      if (!map.has(r.id) || r.score > map.get(r.id).score) {
        map.set(r.id, { ...r, source: 'remote' });
      }
    });

    return Array.from(map.values()).sort((a, b) => b.score - a.score);
  }
}

export const sovereignRAGService = SovereignRAGService.getInstance();
