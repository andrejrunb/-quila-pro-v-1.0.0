import { Database } from '../../database/Database';
import { GenerativeAIService } from './GenerativeAIService';
import { logger } from '../logger';
import { v4 as uuidv4 } from 'uuid';

export interface KnowledgeNode {
  id: string;
  parentId: string | null;
  title: string;
  summary: string | null;
  content: string;
  citations: string[];
  level: number;
  createdAt?: string;
}

export interface KnowledgeCard {
  id: string;
  nodeId: string;
  title: string;
  cardType: 'SUMMARY' | 'METRIC' | 'ACTIONABLE';
  content: string;
  tags: string[];
  createdAt?: string;
}

export class SovereignKnowledgeService {
  private static instance: SovereignKnowledgeService;
  private db!: Database;
  private ai!: GenerativeAIService;
  private initialized = false;

  private constructor() {}

  public static getInstance(): SovereignKnowledgeService {
    if (!SovereignKnowledgeService.instance) {
      SovereignKnowledgeService.instance = new SovereignKnowledgeService();
    }
    return SovereignKnowledgeService.instance;
  }

  public init(db: Database, ai: GenerativeAIService) {
    this.db = db;
    this.ai = ai;
    this.initialized = true;
    logger.info('[SovereignKnowledgeService] Inicializado.');
  }

  /**
   * Garante a existência das tabelas necessárias no SQLite
   */
  public async ensureTables(): Promise<void> {
    if (!this.initialized) throw new Error('SovereignKnowledgeService não inicializado');
    
    await this.db.run(`
      CREATE TABLE IF NOT EXISTS knowledge_nodes (
        id TEXT PRIMARY KEY,
        parent_id TEXT,
        title TEXT NOT NULL,
        summary TEXT,
        content TEXT,
        citations TEXT,
        level INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await this.db.run(`
      CREATE TABLE IF NOT EXISTS knowledge_cards (
        id TEXT PRIMARY KEY,
        node_id TEXT NOT NULL,
        title TEXT NOT NULL,
        card_type TEXT DEFAULT 'SUMMARY',
        content TEXT NOT NULL,
        tags TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (node_id) REFERENCES knowledge_nodes(id) ON DELETE CASCADE
      )
    `);

    logger.info('[SovereignKnowledgeService] Tabelas de conhecimento verificadas.');
  }

  /**
   * Adiciona um novo nó de conhecimento à árvore
   */
  public async addNode(node: Omit<KnowledgeNode, 'createdAt'>): Promise<void> {
    await this.db.run(`
      INSERT OR REPLACE INTO knowledge_nodes (id, parent_id, title, summary, content, citations, level)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      node.id,
      node.parentId,
      node.title,
      node.summary,
      node.content,
      JSON.stringify(node.citations),
      node.level
    ]);
  }

  /**
   * Obtém um nó específico
   */
  public async getNode(id: string): Promise<KnowledgeNode | null> {
    const row = await this.db.get(`SELECT * FROM knowledge_nodes WHERE id = ?`, [id]);
    if (!row) return null;
    return this._mapNodeRow(row);
  }

  /**
   * Lista todos os filhos de um nó
   */
  public async getChildren(parentId: string | null): Promise<KnowledgeNode[]> {
    let rows;
    if (parentId === null) {
      rows = await this.db.all(`SELECT * FROM knowledge_nodes WHERE parent_id IS NULL`);
    } else {
      rows = await this.db.all(`SELECT * FROM knowledge_nodes WHERE parent_id = ?`, [parentId]);
    }
    return rows.map(r => this._mapNodeRow(r));
  }

  /**
   * Busca hierárquica multi-hop (TreeKnowledge)
   * 1. Busca semântica nos nós raiz (nível 0) para achar o tema principal.
   * 2. Desce recursivamente para os filhos mais relevantes.
   * 3. Combina o conteúdo dos nós encontrados.
   */
  public async searchTree(query: string, maxDepth: number = 3): Promise<KnowledgeNode[]> {
    logger.info(`[SovereignKnowledgeService] Buscando na árvore de conhecimento para: "${query}"`);
    
    // 1. Obter nós raiz (nível 0)
    const roots = await this.getChildren(null);
    if (roots.length === 0) return [];

    // Escolhe os nós raiz mais relevantes
    const relevantRoots = await this._rankNodes(query, roots, 2);
    const results: KnowledgeNode[] = [];

    for (const root of relevantRoots) {
      results.push(root);
      await this._traverseSearch(query, root.id, 1, maxDepth, results);
    }

    return results;
  }

  private async _traverseSearch(
    query: string,
    parentId: string,
    currentDepth: number,
    maxDepth: number,
    results: KnowledgeNode[]
  ): Promise<void> {
    if (currentDepth > maxDepth) return;

    const children = await this.getChildren(parentId);
    if (children.length === 0) return;

    // Filtra filhos relevantes semanticamente
    const relevantChildren = await this._rankNodes(query, children, 2);
    for (const child of relevantChildren) {
      results.push(child);
      await this._traverseSearch(query, child.id, currentDepth + 1, maxDepth, results);
    }
  }

  /**
   * Ordena e seleciona nós semanticamente usando embeddings locais ou IA
   */
  private async _rankNodes(query: string, nodes: KnowledgeNode[], limit: number): Promise<KnowledgeNode[]> {
    try {
      const queryEmbedding = await this.ai.getEmbeddings(query);
      const scoredNodes = await Promise.all(nodes.map(async (node) => {
        const textToEmbed = `${node.title} ${node.summary || ''} ${node.content.substring(0, 100)}`;
        const nodeEmbedding = await this.ai.getEmbeddings(textToEmbed);
        const score = this._cosineSimilarity(queryEmbedding, nodeEmbedding);
        return { node, score };
      }));

      return scoredNodes
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(x => x.node);
    } catch (err) {
      // Fallback básico para busca textual simples
      logger.warn(`[SovereignKnowledgeService] Fallback de ordenação textual: ${err}`);
      return nodes
        .filter(n => 
          n.title.toLowerCase().includes(query.toLowerCase()) || 
          (n.summary && n.summary.toLowerCase().includes(query.toLowerCase())) ||
          n.content.toLowerCase().includes(query.toLowerCase())
        )
        .slice(0, limit);
    }
  }

  private _cosineSimilarity(vecA: number[], vecB: number[]): number {
    let dotProduct = 0.0;
    let normA = 0.0;
    let normB = 0.0;
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Gera um KnowledgeCard explicativo/acionável de alto nível para um nó usando LLM
   */
  public async generateCardForNode(nodeId: string, cardType: 'SUMMARY' | 'METRIC' | 'ACTIONABLE' = 'SUMMARY'): Promise<KnowledgeCard | null> {
    const node = await this.getNode(nodeId);
    if (!node) return null;

    logger.info(`[SovereignKnowledgeService] Gerando KnowledgeCard (${cardType}) para nó: ${node.title}`);

    const prompt = `
      Você é um analista pedagógico de elite do Áquila Pro. Baseando-se no conteúdo abaixo, crie um card de conhecimento sintetizado do tipo "${cardType}".
      
      CONTEÚDO DO NÓ:
      Título: ${node.title}
      Resumo: ${node.summary || 'Não fornecido'}
      Conteúdo: ${node.content}
      
      REGRAS:
      - Responda apenas com o conteúdo estruturado do card (máximo de 3 parágrafos ou lista de tópicos acionáveis).
      - Mantenha tom profissional e corporativo.
    `;

    const generatedContent = await this.ai.analyzeContent(prompt);
    const cardId = `CARD-${uuidv4().substring(0, 8)}`;
    const tags = ['auto-generated', cardType.toLowerCase(), node.title.toLowerCase().substring(0, 15)];

    await this.db.run(`
      INSERT OR REPLACE INTO knowledge_cards (id, node_id, title, card_type, content, tags)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      cardId,
      nodeId,
      `Card: ${node.title}`,
      cardType,
      generatedContent,
      JSON.stringify(tags)
    ]);

    return {
      id: cardId,
      nodeId,
      title: `Card: ${node.title}`,
      cardType,
      content: generatedContent,
      tags
    };
  }

  /**
   * Obtém cartões de conhecimento associados a um nó
   */
  public async getCardsForNode(nodeId: string): Promise<KnowledgeCard[]> {
    const rows = await this.db.all(`SELECT * FROM knowledge_cards WHERE node_id = ?`, [nodeId]);
    return rows.map(r => this._mapCardRow(r));
  }

  private _mapNodeRow(row: any): KnowledgeNode {
    let citations: string[] = [];
    try {
      citations = JSON.parse(row.citations || '[]');
    } catch (e) {
      citations = [];
    }
    return {
      id: row.id,
      parentId: row.parent_id,
      title: row.title,
      summary: row.summary,
      content: row.content,
      citations,
      level: row.level,
      createdAt: row.created_at
    };
  }

  private _mapCardRow(row: any): KnowledgeCard {
    let tags: string[] = [];
    try {
      tags = JSON.parse(row.tags || '[]');
    } catch (e) {
      tags = [];
    }
    return {
      id: row.id,
      nodeId: row.node_id,
      title: row.title,
      cardType: row.card_type as any,
      content: row.content,
      tags,
      createdAt: row.created_at
    };
  }
}

export const sovereignKnowledgeService = SovereignKnowledgeService.getInstance();
