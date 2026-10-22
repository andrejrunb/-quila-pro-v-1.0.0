import * as fs from 'fs';
import * as path from 'path';
import { RAGSearchResult, RAGDocument, RAGSection } from '../../types/RAGTypes';
import { EagleMessengerService } from './EagleMessengerService';
import { sovereignGraphService } from './SovereignGraphService';
import { GenerativeAIService } from './GenerativeAIService';

/**
 * Áquila Pro v3461 - PageIndex RAG Integration (Federated Swarm)
 * Provides local and distributed semantic search for the swarm.
 */
export class PageIndexRAGService {
  private docsPaths: string[];
  private documents: Map<string, RAGDocument> = new Map();
  private messenger: EagleMessengerService | null = null;
  private aiService: GenerativeAIService | null = null;
  private embeddings: Map<string, number[][]> = new Map(); // File -> Section Embeddings

  constructor(docsPaths: string | string[]) {
    this.docsPaths = Array.isArray(docsPaths) ? docsPaths : [docsPaths];
  }

  public setAiService(ai: GenerativeAIService) {
    this.aiService = ai;
  }

  /**
   * Scans and indexes markdown files.
   */
  public async buildIndex(): Promise<number> {
    this.documents.clear();
    
    for (const docsPath of this.docsPaths) {
      if (!fs.existsSync(docsPath)) continue;
      
      console.log(`[PageIndexRAG] Building index for: ${docsPath}`);
      const files = await this.listMdFiles(docsPath);
      
      for (const file of files) {
        try {
          const content = fs.readFileSync(file, 'utf-8');
          const relativePath = path.relative(docsPath, file);
          const doc = this.parseDocument(relativePath, content);
          
          this.documents.set(relativePath, doc);

          // Gerar embeddings se o serviço de IA estiver disponível
          if (this.aiService) {
            const sectionEmbeds: number[][] = [];
            for (const section of doc.sections) {
              const embed = await this.aiService.getEmbeddings(section.content);
              sectionEmbeds.push(embed);
            }
            this.embeddings.set(relativePath, sectionEmbeds);
          }

          // Sincronização com o Grafo Soberano (SKG)
          sovereignGraphService.addEntity({
            id: `DOC-${relativePath.replace(/\\|\//g, '_')}`,
            type: 'INSIGHT',
            label: doc.title,
            metadata: {
              path: relativePath,
              sections: doc.sections.length,
              source: 'PageIndexRAG'
            }
          });

        } catch (err: any) {
          console.error(`[PageIndexRAG] Failed to index ${file}:`, err.message);
        }
      }
    }

    console.log(`[PageIndexRAG] Indexed ${this.documents.size} documents.`);
    return this.documents.size;
  }

  /**
   * Parses a markdown file into a structured RAGDocument.
   */
  private parseDocument(file: string, content: string): RAGDocument {
    const sections: RAGSection[] = [];
    const headerRegex = /^(#+)\s+(.+)$/gm;
    let match;
    
    const lines = content.split('\n');
    let currentTitle = path.basename(file, '.md');
    
    // Find headers
    const headerPositions: { level: number, title: string, index: number }[] = [];
    while ((match = headerRegex.exec(content)) !== null) {
      headerPositions.push({
        level: match[1].length,
        title: match[2].trim(),
        index: match.index
      });
    }

    if (headerPositions.length === 0) {
      sections.push({
        title: 'General',
        level: 1,
        content: content,
        startIndex: 0,
        endIndex: content.length
      });
    } else {
      for (let i = 0; i < headerPositions.length; i++) {
        const start = headerPositions[i].index;
        const end = (i + 1 < headerPositions.length) ? headerPositions[i + 1].index : content.length;
        
        sections.push({
          title: headerPositions[i].title,
          level: headerPositions[i].level,
          content: content.substring(start, end),
          startIndex: start,
          endIndex: end
        });
      }
      if (headerPositions[0].level === 1) {
        currentTitle = headerPositions[0].title;
      }
    }

    return {
      file,
      title: currentTitle,
      sections,
      rawContent: content
    };
  }

  /**
   * Search over the structured index with hierarchical awareness and Swarm Federation.
   */
  public async search(query: string, limit: number = 3, swarmSearch: boolean = true): Promise<RAGSearchResult[]> {
    const localResults: RAGSearchResult[] = this.performLocalSearch(query, limit);
    
    // threshold for federated search: if lowest score is too low or no results
    const topScore = localResults.length > 0 ? localResults[0].score : 0;
    const SCORE_THRESHOLD = 5; // Adjustment based on current scoring logic

    if (swarmSearch && this.messenger && topScore < SCORE_THRESHOLD) {
      console.log(`[PageIndexRAG] Local results weak (Score: ${topScore}). Querying Swarm...`);
      const swarmResults = await this.messenger.requestSwarmData<RAGSearchResult>('rag_query', { query, limit });
      
      // Merge and sort
      return [...localResults, ...swarmResults]
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
    }

    return localResults;
  }

  /**
   * Internal local search logic.
   */
  private performLocalSearch(query: string, limit: number): RAGSearchResult[] {
    const results: RAGSearchResult[] = [];
    const normalizedQuery = query.toLowerCase();

    for (const [file, doc] of this.documents.entries()) {
      const docEmbeds = this.embeddings.get(file);
      const breadcrumbStack: { level: number, title: string }[] = [];
      
      for (let i = 0; i < doc.sections.length; i++) {
        const section = doc.sections[i];
        
        // Update breadcrumb stack
        while (breadcrumbStack.length > 0 && breadcrumbStack[breadcrumbStack.length - 1].level >= section.level) {
          breadcrumbStack.pop();
        }
        breadcrumbStack.push({ level: section.level, title: section.title });

        let score = 0;
        const normalizedContent = section.content.toLowerCase();

        // 1. Keyword Score (Fallback/Boost)
        if (normalizedContent.includes(normalizedQuery)) {
          const keywordCount = (normalizedContent.match(new RegExp(normalizedQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
          const titleBoost = section.title.toLowerCase().includes(normalizedQuery) ? 5 : 1;
          score += keywordCount * titleBoost;
        }

        // 2. Semantic Score (Vector)
        // Note: Actual semantic search would require query embedding here.
        // We'll perform it if this is called from the main search method with an embedded query.
        
        if (score > 0) {
          const index = normalizedContent.indexOf(normalizedQuery);
          const snippet = section.content.substring(
            Math.max(0, index - 50), 
            Math.min(section.content.length, index + 150)
          );

          results.push({
            file: doc.file,
            snippet: `...${snippet.trim()}...`,
            score: score,
            breadcrumb: breadcrumbStack.map(b => b.title),
            sectionLevel: section.level
          });
        }
      }
    }

    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * Realiza busca semântica real (Embeddings)
   */
  public async searchSemantic(query: string, limit: number = 5): Promise<RAGSearchResult[]> {
    if (!this.aiService) return this.performLocalSearch(query, limit);

    const queryEmbed = await this.aiService.getEmbeddings(query);
    const results: RAGSearchResult[] = [];

    for (const [file, doc] of this.documents.entries()) {
      const docEmbeds = this.embeddings.get(file);
      if (!docEmbeds) continue;

      const breadcrumbStack: { level: number, title: string }[] = [];
      for (let i = 0; i < doc.sections.length; i++) {
        const section = doc.sections[i];
        const sectionEmbed = docEmbeds[i];

        // Update breadcrumb stack
        while (breadcrumbStack.length > 0 && breadcrumbStack[breadcrumbStack.length - 1].level >= section.level) {
          breadcrumbStack.pop();
        }
        breadcrumbStack.push({ level: section.level, title: section.title });

        const similarity = this.cosineSimilarity(queryEmbed, sectionEmbed);
        
        // Threshold para relevância semântica
        if (similarity > 0.6) {
          results.push({
            file: doc.file,
            snippet: section.content.substring(0, 200) + '...',
            score: similarity * 100, // Normalizado para escala de pontos
            breadcrumb: breadcrumbStack.map(b => b.title),
            sectionLevel: section.level
          });
        }
      }
    }

    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Gera um mapa 2D dos documentos para visualização na UI (Clusterização Simbolica)
   */
  public getKnowledgeMap(): any[] {
    const map: any[] = [];
    const files = Array.from(this.documents.keys());

    files.forEach((file, idx) => {
      const doc = this.documents.get(file);
      const embeds = this.embeddings.get(file);
      
      let x = 0, y = 0;
      if (embeds && embeds.length > 0) {
        // Projeção simples para 2D baseada em embeddings (MOCK PCA)
        // Somamos blocos do embedding para gerar coordenadas pseudo-estáveis
        x = embeds[0].slice(0, 384).reduce((a, b) => a + b, 0) / 10; // Reduz escala
        y = embeds[0].slice(384).reduce((a, b) => a + b, 0) / 10;
      } else {
        x = Math.random() * 2 - 1;
        y = Math.random() * 2 - 1;
      }

      // Clamp para -1..1 para segurança na UI
      x = Math.max(-1, Math.min(1, x));
      y = Math.max(-1, Math.min(1, y));

      map.push({
        id: file,
        title: doc?.title,
        x,
        y,
        size: doc?.sections.length || 1,
        type: file.includes('pedagogico') ? 'EDU' : 'ADMIN',
        connections: [] // Implementação futura de conexões por similaridade
      });
    });

    return map;
  }

  /**
   * Inicia o modo de escuta do enxame para responder a consultas remotas.
   */
  public initSwarm(messenger: EagleMessengerService) {
    this.messenger = messenger;
    this.messenger.on('swarm:rag_query', (data: { query: string, limit: number, senderId: string }) => {
      console.log(`[PageIndexRAG] Swarm query received: ${data.query}`);
      const results = this.performLocalSearch(data.query, data.limit || 3);
      
      if (results.length > 0) {
        // Envia as respostas de volta ao enxame
        results.forEach(res => {
          this.messenger?.broadcastSwarmSync('rag_query:response', res);
        });
      }
    });
  }

  /**
   * [SQA-LIBRARIAN-712] Adiciona manualmente um nó de conhecimento ao RAG.
   */
  public async addKnowledgeNode(node: { id: string; label: string; type: string; content: string; metadata?: any }) {
    const doc: RAGDocument = {
      file: node.id,
      title: node.label,
      sections: [{
        title: node.label,
        level: 1,
        content: node.content,
        startIndex: 0,
        endIndex: node.content.length
      }],
      rawContent: node.content
    };

    this.documents.set(node.id, doc);
    
    if (this.aiService) {
      try {
        const embed = await this.aiService.getEmbeddings(node.content);
        this.embeddings.set(node.id, [embed]);
      } catch (err) {
        console.error(`[PageIndexRAG] Failed to generate embedding for manual node ${node.id}`);
      }
    }

    // Sincronização com o Grafo Soberano (SKG)
    sovereignGraphService.addEntity({
      id: `DOC-${node.id.replace(/\\|\//g, '_')}`,
      type: 'INSIGHT',
      label: node.label,
      metadata: { 
        ...node.metadata, 
        source: 'Manual_Injection',
        category: node.type
      }
    });

    return node.id;
  }

  private async listMdFiles(dir: string): Promise<string[]> {
    let results: string[] = [];
    if (!fs.existsSync(dir)) return [];
    
    const list = fs.readdirSync(dir);
    for (const file of list) {
      if (file === 'node_modules' || file === '.git' || file === '.gemini') continue;
      
      const fullPath = path.resolve(dir, file);
      const stat = fs.statSync(fullPath);
      
      if (stat && stat.isDirectory()) {
        results = results.concat(await this.listMdFiles(fullPath));
      } else if (fullPath.endsWith('.md')) {
        results.push(fullPath);
      }
    }
    
    return results;
  }
}

