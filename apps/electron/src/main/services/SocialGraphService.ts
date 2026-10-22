import { EventEmitter } from 'events';
import Database from '../../database/Database';
import { logger } from '../logger';
import Graph from 'graphology';
import louvain from 'graphology-communities-louvain';

export interface SocialConnection {
  sourceId: string;
  targetId: string;
  strength: number; // 0 to 1
  lastInteraction: number;
}

/**
 * Phase 900: SocialGraphService
 * Mapeia conexões e interações detectadas entre indivíduos via ReID e Eventos SQA.
 */
class SocialGraphService extends EventEmitter {
  private db: Database | null = null;
  private graph: Graph = new Graph({ type: 'undirected' });

  public setDatabase(db: Database) {
    this.db = db;
  }

  /**
   * Reconstrói o grafo baseado em proximidade espaço-temporal nos eventos.
   * [SQA-901] Link: Estudantes na mesma sala em janelas de 5 minutos.
   */
  public async computeGraphFromEvents() {
    if (!this.db) return;

    logger.info('[SocialGraph] Recomputando grafo de interações sociais...');
    this.graph.clear();

    try {
      // 1. Buscar todos os eventos de presença (ReID/Smart Class) das últimas 24h
      const events = await this.db.all(`
        SELECT studentId, roomId, timestamp 
        FROM events 
        WHERE timestamp > datetime('now', '-1 day')
        ORDER BY roomId, timestamp ASC
      `);

      // 2. Agrupar por co-presença
      for (let i = 0; i < events.length; i++) {
        const e1 = events[i];
        if (!this.graph.hasNode(e1.studentId)) this.graph.addNode(e1.studentId);

        for (let j = i + 1; j < events.length; j++) {
          const e2 = events[j];
          
          // Se mudou de sala ou passou > 5 min, paramos a detecção de vizinhos para e1
          const timeDiff = (new Date(e2.timestamp).getTime() - new Date(e1.timestamp).getTime()) / 60000;
          if (e1.roomId !== e2.roomId || timeDiff > 5) break;

          // Se estiverem na mesma sala em < 5min, criamos/fortalecemos link
          if (!this.graph.hasNode(e2.studentId)) this.graph.addNode(e2.studentId);
          
          if (!this.graph.hasEdge(e1.studentId, e2.studentId)) {
            this.graph.addEdge(e1.studentId, e2.studentId, { weight: 1 });
          } else {
            const weight = this.graph.getEdgeAttribute(e1.studentId, e2.studentId, 'weight');
            this.graph.setEdgeAttribute(e1.studentId, e2.studentId, 'weight', weight + 1);
          }
        }
      }

      // 3. Detecção de Comunidades (Louvain)
      louvain.assign(this.graph);

      this.emit('graph-updated', this.getGraphData());
      logger.info(`[SocialGraph] Grafo atualizado: ${this.graph.order} nós, ${this.graph.size} conexões.`);
    } catch (err) {
      logger.error(`[SocialGraph] Falha ao processar grafo: ${err}`);
    }
  }

  public getGraphData() {
    const nodes: any[] = [];
    const links: any[] = [];

    this.graph.forEachNode((node, attributes) => {
      nodes.push({ id: node, label: `AL-${node.substring(0, 4)}`, community: attributes.community });
    });

    this.graph.forEachEdge((edge, attributes, source, target) => {
      links.push({ source, target, weight: attributes.weight });
    });

    return { nodes, links };
  }

  public getAtRiskNodes() {
    // Alunos com grau 0 ou 1 (isolamento)
    return this.graph.nodes().filter(node => this.graph.degree(node) <= 1);
  }

  /**
   * Adiciona um insight de conexão ao grafo baseado em análise de IA.
   */
  public addInsightToGraph(sourceId: string, targetId: string, strength: number) {
    if (!this.graph.hasNode(sourceId)) this.graph.addNode(sourceId);
    if (!this.graph.hasNode(targetId)) this.graph.addNode(targetId);

    if (this.graph.hasEdge(sourceId, targetId)) {
      const current = this.graph.getEdgeAttribute(sourceId, targetId, 'weight') || 0;
      this.graph.setEdgeAttribute(sourceId, targetId, 'weight', Math.min(1, current + strength));
    } else {
      this.graph.addEdge(sourceId, targetId, { weight: strength });
    }
  }
}

export const socialGraphService = new SocialGraphService();
export default SocialGraphService;
