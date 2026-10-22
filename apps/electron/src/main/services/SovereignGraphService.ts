import Graph from 'graphology';
import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';
import { resourceMonitor } from './ResourceMonitorService';
import { logger } from '../logger';
import { sovereignEncryptionService } from './SovereignEncryptionService';

/**
 * Entidades suportadas no Grafo de Conhecimento
 */
export type NodeType = 
  | 'PERSON' 
  | 'EVENT' 
  | 'INSIGHT' 
  | 'HARDWARE' 
  | 'LOCATION' 
  | 'ATTENDANCE_EVENT' 
  | 'MERIT_AWARD' 
  | 'GRANT_CAMPAIGN' 
  | 'SCHOLARSHIP' 
  | 'MARKET_ASSET' 
  | 'TRANSACTION'
  | 'SYSTEM_EVENT'
  | 'SECURITY_ALERT'
  | 'AGENT_ACTION'
  | 'TEST_RESULT'
  | 'PLAN'
  | 'PEDAGOGICAL_ACTION'
  | 'CLASS'
  | 'SYSTEM_CONSCIOUSNESS';


interface SovereignNode {
  id: string;
  type: NodeType;
  label: string;
  metadata: Record<string, any>;
}

/**
 * SovereignGraphService (v1.5.0-PRO)
 * Gerencia o Córtex Relacional do Áquila Pro. 
 * Inspirado no Graphify, utiliza Graphology para processamento local de alta performance.
 */
export class SovereignGraphService {
  private static instance: SovereignGraphService;
  private graph: Graph;
  private storagePath: string;
  private isAutoSaving: boolean = false;
  private mutationCount: number = 0;
  private lastMutationReset: number = Date.now();
  private readonly MAX_MUTATIONS_PER_MINUTE = 1000;

  private constructor() {
    this.graph = new Graph({ multi: true });
    // Usar process.cwd() se app não estiver pronto (SSR/Tests)
    const userDataPath = app && typeof app.isReady === 'function' && app.isReady() ? app.getPath('userData') : process.cwd();
    this.storagePath = path.join(userDataPath, 'sovereign_graph_v1.json');
    this.load();
  }

  /**
   * [v1.6.0] Injeta o banco de dados para persistência do grafo.
   */
  public setDatabase(database: any) {
    logger.info('[SKG] Banco de dados injetado no SovereignGraphService');
  }

  public static getInstance(): SovereignGraphService {
    if (!SovereignGraphService.instance) {
      SovereignGraphService.instance = new SovereignGraphService();
    }
    return SovereignGraphService.instance;
  }

  /**
   * Adiciona ou atualiza um nó no grafo
   */
  public addEntity(entity: SovereignNode) {
    // Rate Limiting
    const now = Date.now();
    if (now - this.lastMutationReset > 60000) {
      this.mutationCount = 0;
      this.lastMutationReset = now;
    }

    if (this.mutationCount > this.MAX_MUTATIONS_PER_MINUTE) {
      logger.warn(`[SKG] Rate limit atingido (${this.mutationCount}). Ignorando mutação.`);
      return;
    }

    this.mutationCount++;

    try {
      if (this.graph.hasNode(entity.id)) {
        this.graph.updateNodeAttributes(entity.id, (attr) => ({
          ...attr,
          ...entity.metadata,
          lastSeen: Date.now()
        }));
      } else {
        this.graph.addNode(entity.id, {
          type: entity.type,
          label: entity.label,
          ...entity.metadata,
          createdAt: Date.now()
        });
      }
      this.requestAutoSave();
    } catch (err) {
      logger.error(`[SKG] Erro ao adicionar entidade ${entity.id}: ${err}`);
    }
  }

  public hasNode(nodeId: string): boolean {
    return this.graph.hasNode(nodeId);
  }

  /**
   * Cria uma conexão entre duas entidades
   */
  public associate(sourceId: string, targetId: string, relation: string, weight: number = 1) {
    if (!this.graph.hasNode(sourceId) || !this.graph.hasNode(targetId)) {
      logger.warn(`[SKG] Falha ao associar: Nó(s) inexistente(s) ${sourceId} -> ${targetId}`);
      return;
    }

    const edgeId = `${sourceId}-${targetId}-${relation}`;
    try {
      if (!this.graph.hasEdge(edgeId)) {
        this.graph.addEdgeWithKey(edgeId, sourceId, targetId, {
          relation,
          weight,
          timestamp: Date.now()
        });
      } else {
        this.graph.updateEdgeAttribute(edgeId, 'weight', (w: number) => w + 1);
        this.graph.updateEdgeAttribute(edgeId, 'timestamp', () => Date.now());
      }
      this.requestAutoSave();
    } catch (err) {
      logger.error(`[SKG] Erro ao associar ${sourceId} -> ${targetId}: ${err}`);
    }
  }

  /**
   * Busca nós baseada em texto (Simple Lexical Search para RAG)
   */
  public search(query: string, limit: number = 10): any[] {
    const term = query.toLowerCase();
    const matches: any[] = [];

    this.graph.forEachNode((node, attr) => {
      const content = `${attr.label} ${JSON.stringify(attr)}`.toLowerCase();
      if (content.includes(term)) {
        matches.push({ id: node, ...attr });
      }
    });

    return matches
      .sort((a, b) => (b.lastSeen || b.createdAt) - (a.lastSeen || a.createdAt))
      .slice(0, limit);
  }

  /**
   * Recupera o contexto expandido de uma entidade (Vizinhos e Relações)
   */
  public getKnowledgeContext(nodeId: string, depth: number = 1): any[] {
    if (!this.graph.hasNode(nodeId)) return [];

    const context: any[] = [];
    this.graph.forEachEdge(nodeId, (edge, attributes, source, target) => {
      const neighborId = source === nodeId ? target : source;
      const nodeAttr = this.graph.getNodeAttributes(neighborId);
      context.push({
        id: neighborId,
        label: nodeAttr.label,
        type: nodeAttr.type,
        relation: attributes.relation,
        weight: attributes.weight,
        direction: source === nodeId ? 'out' : 'in',
        meta: nodeAttr
      });
    });

    return context;
  }
  
  /**
   * Helper para o GrantService: Retorna vizinhos filtrados por relação.
   */
  public getNeighbors(nodeId: string, relationType?: string): any[] {
    if (!this.graph.hasNode(nodeId)) return [];
    
    const neighbors: any[] = [];
    this.graph.forEachEdge(nodeId, (edge, attributes, source, target) => {
      const neighborId = source === nodeId ? target : source;
      if (!relationType || attributes.relation === relationType) {
        const nodeAttr = this.graph.getNodeAttributes(neighborId);
        neighbors.push({
          id: neighborId,
          ...nodeAttr,
          metadata: nodeAttr,
          relation: attributes.relation,
          direction: source === nodeId ? 'out' : 'in'
        });
      }
    });
    return neighbors;
  }

  /**
   * Retorna os eventos mais recentes do sistema
   */
  public getRecentEvents(limit: number = 20): any[] {
    const events: any[] = [];
    this.graph.forEachNode((node, attr) => {
      if (attr.type === 'SYSTEM_EVENT' || attr.type === 'SECURITY_ALERT') {
        events.push({ id: node, ...attr });
      }
    });

    return events
      .sort((a, b) => (b.timestamp || b.createdAt) - (a.timestamp || a.createdAt))
      .slice(0, limit);
  }

  /**
   * Registra um insight de consciência sistêmica (Homeostase)
   */
  public async saveConsciousnessInsight(state: any) {
    const id = `consciousness_insight_${Date.now()}`;
    this.addEntity({
      id,
      type: 'SYSTEM_CONSCIOUSNESS',
      label: `System Consciousness Insight - ${state.status}`,
      metadata: {
        ...state,
        timestamp: Date.now()
      }
    });

    // Se houver alertas críticos, associa a um nó de alerta de segurança
    if (state.activeAlerts && state.activeAlerts.length > 0) {
      const alertId = `security_alert_${Date.now()}`;
      this.addEntity({
        id: alertId,
        type: 'SECURITY_ALERT',
        label: `Critical System Homeostasis Alert`,
        metadata: {
          alerts: state.activeAlerts,
          timestamp: Date.now()
        }
      });
      this.associate(id, alertId, 'TRIGGERED');
    }

    logger.info(`[SKG] Insight de consciência registrado: ${id}`);
  }

  /**
   * Realiza auditoria de integridade do Grafo
   */
  public async auditIntegrity() {
    const stats = resourceMonitor.getStatus();
    if (stats.heapUsedMB > 1500) {
      logger.error('[SKG] Memória crítica detectada. Purgando conexões de baixa prioridade.');
      
      // Remove edges com peso baixo e mais antigas que 7 dias
      const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
      this.graph.forEachEdge((edge, attr) => {
        if (attr.weight === 1 && attr.timestamp < weekAgo) {
          this.graph.dropEdge(edge);
        }
      });
    }

    logger.info(`[SKG] Auditoria concluída: ${this.graph.order} nós, ${this.graph.size} arestas.`);
  }

  private load() {
    if (fs.existsSync(this.storagePath)) {
      try {
        const fileContent = fs.readFileSync(this.storagePath, 'utf8');
        const encryptedData = JSON.parse(fileContent);
        const json = sovereignEncryptionService.decryptPayload<any>(encryptedData);
        this.graph.import(json);
        logger.info(`[SKG] Grafo carregado e descriptografado: ${this.graph.order} entidades.`);
      } catch (err) {
        logger.error(`[SKG] Falha ao carregar ou descriptografar grafo: ${err}`);
        // Fallback para carregamento sem criptografia se falhar (migração)
        try {
          const data = fs.readFileSync(this.storagePath, 'utf8');
          const json = JSON.parse(data);
          this.graph.import(json);
          logger.warn(`[SKG] Grafo carregado em modo legado (sem criptografia).`);
        } catch (innerErr) {
          logger.error(`[SKG] Falha total no carregamento do grafo.`);
        }
      }
    }
  }

  private requestAutoSave() {
    if (this.isAutoSaving) return;
    this.isAutoSaving = true;
    setTimeout(() => {
      try {
        const json = this.graph.export();
        const encryptedResult = sovereignEncryptionService.encryptPayload(json as any);
        fs.writeFileSync(this.storagePath, JSON.stringify(encryptedResult));
        this.isAutoSaving = false;
        logger.debug('[SKG] Auto-save criptografado concluído.');
      } catch (err) {
        logger.error(`[SKG] Erro no auto-save criptografado do Grafo: ${err}`);
      }
    }, 10000); // 10s cooldown
  }

  /**
   * [Level 13] Exporta um resumo criptográfico dos insights locais para sincronização P2P.
   */
  public async syncGlobalInsights(): Promise<{ hash: string; topInsights: any[] }> {
    const insights: any[] = [];
    this.graph.forEachNode((node, attr) => {
      if (attr.type === 'INSIGHT' || attr.type === 'SYSTEM_CONSCIOUSNESS') {
        insights.push({ id: node, label: attr.label, timestamp: attr.timestamp || attr.createdAt });
      }
    });

    const topInsights = insights
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 10);

    // Gera um hash SHA-256 baseado nos IDs dos principais insights para consistência federada
    const { createHash } = await import('crypto');
    const hashInput = topInsights.map(i => i.id).sort().join('|');
    const hash = createHash('sha256').update(hashInput).digest('hex');

    logger.info(`[SKG] Sincronização global preparada. Hash: ${hash.substring(0, 12)}...`);
    return { hash, topInsights };
  }

  public getGraphSnapshot(): any {
    return this.graph.export();
  }

  public getStats() {
    return {
      nodes: this.graph.order,
      edges: this.graph.size,
      type: 'DirectedGraph',
      engine: 'Sigma/Graphology'
    };
  }
}

export const sovereignGraphService = SovereignGraphService.getInstance();
