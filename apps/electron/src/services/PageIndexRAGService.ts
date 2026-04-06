import * as fs from 'fs';
import * as path from 'path';
import { RAGSearchResult, RAGDocument, RAGSection } from '../types/RAGTypes';
import { EagleMessengerService } from './EagleMessengerService';

/**
 * Áquila Pro v3461 - PageIndex RAG Integration (Federated Swarm)
 * Provides local and distributed semantic search for the swarm.
 */
export class PageIndexRAGService {
  private docsPaths: string[];
  private documents: Map<string, RAGDocument> = new Map();
  private messenger: EagleMessengerService | null = null;

  constructor(docsPaths: string | string[]) {
    this.docsPaths = Array.isArray(docsPaths) ? docsPaths : [docsPaths];
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
          
          this.documents.set(relativePath, this.parseDocument(relativePath, content));
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

    for (const doc of this.documents.values()) {
      const breadcrumbStack: { level: number, title: string }[] = [];
      
      for (const section of doc.sections) {
        // Update breadcrumb stack
        while (breadcrumbStack.length > 0 && breadcrumbStack[breadcrumbStack.length - 1].level >= section.level) {
          breadcrumbStack.pop();
        }
        breadcrumbStack.push({ level: section.level, title: section.title });

        const normalizedContent = section.content.toLowerCase();
        if (normalizedContent.includes(normalizedQuery)) {
          // Calculate score
          const keywordCount = (normalizedContent.match(new RegExp(normalizedQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
          const titleBoost = section.title.toLowerCase().includes(normalizedQuery) ? 2 : 1;
          const score = keywordCount * titleBoost;

          // Context extraction
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
