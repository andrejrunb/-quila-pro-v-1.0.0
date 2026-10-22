import * as fs from 'fs';
import * as path from 'path';
import { logger } from '../logger';

/**
 * WikiSyncService
 * Gerencia a leitura e escrita de arquivos Markdown no repositório 'aquila-wiki'.
 * Transforma a 'Memória Institucional' do SQLite em documentos físicos duradouros.
 */
export class WikiSyncService {
  private static instance: WikiSyncService;
  private wikiRoot: string = 'c:\\aquila\\aquila-wiki';

  private constructor() {
    this.ensureDirectories();
  }

  public static getInstance(): WikiSyncService {
    if (!WikiSyncService.instance) {
      WikiSyncService.instance = new WikiSyncService();
    }
    return WikiSyncService.instance;
  }

  /**
   * Garante que a estrutura básica do Wiki exista.
   */
  private ensureDirectories() {
    const dirs = ['pages', 'decisions', 'runbooks', 'agents', 'sources'];
    dirs.forEach(dir => {
      const fullPath = path.join(this.wikiRoot, dir);
      if (!fs.existsSync(fullPath)) {
        try {
          fs.mkdirSync(fullPath, { recursive: true });
        } catch (err) {
          logger.error(`[WikiSync] Erro ao criar diretório ${fullPath}:`, err);
        }
      }
    });
  }

  /**
   * Publica uma nova decisão institucional como um arquivo Markdown.
   */
  public async publishDecision(title: string, markdownContent: string, author: string = 'Áquila Pro AI'): Promise<string> {
    const filename = `${Date.now()}_${title.toLowerCase().replace(/[^a-z0-9]/g, '_')}.md`;
    const fullPath = path.join(this.wikiRoot, 'decisions', filename);
    
    const header = `---
title: "${title}"
author: "${author}"
date: "${new Date().toISOString()}"
type: "decision"
---

# ${title}

`;

    try {
      fs.writeFileSync(fullPath, header + markdownContent, 'utf-8');
      logger.info(`[WikiSync] Decisão publicada: ${filename}`);
      return filename;
    } catch (err) {
      logger.error(`[WikiSync] Erro ao publicar decisão ${title}:`, err);
      throw err;
    }
  }

  /**
   * Lê o conteúdo de uma página específica do Wiki.
   */
  public async readPage(category: 'pages' | 'decisions' | 'runbooks', filename: string): Promise<string> {
    const fullPath = path.join(this.wikiRoot, category, filename);
    if (!fs.existsSync(fullPath)) {
      throw new Error('Página não encontrada no Wiki.');
    }
    return fs.readFileSync(fullPath, 'utf-8');
  }

  /**
   * Lista todas as páginas disponíveis em uma categoria.
   */
  public async listPages(category: 'pages' | 'decisions' | 'runbooks'): Promise<{ filename: string, title: string, date: string }[]> {
    const fullPath = path.join(this.wikiRoot, category);
    if (!fs.existsSync(fullPath)) return [];

    const files = fs.readdirSync(fullPath).filter(f => f.endsWith('.md'));
    
    // Extração básica de metadados simulada (YAML Frontmatter parsing simples)
    return files.map(filename => {
      const content = fs.readFileSync(path.join(fullPath, filename), 'utf-8');
      const titleMatch = content.match(/title:\s*"([^"]+)"/);
      const dateMatch = content.match(/date:\s*"([^"]+)"/);
      
      return {
        filename,
        title: titleMatch ? titleMatch[1] : filename.replace('.md', ''),
        date: dateMatch ? new Date(dateMatch[1]).toLocaleDateString() : 'N/A'
      };
    });
  }

  /**
   * Pesquisa por termos nos arquivos Markdown do Wiki.
   */
  public async search(query: string): Promise<any[]> {
    const results: any[] = [];
    const categories: ('pages' | 'decisions' | 'runbooks')[] = ['pages', 'decisions', 'runbooks'];
    
    for (const category of categories) {
      const fullPath = path.join(this.wikiRoot, category);
      if (!fs.existsSync(fullPath)) continue;

      const files = fs.readdirSync(fullPath).filter(f => f.endsWith('.md'));
      for (const filename of files) {
        const content = fs.readFileSync(path.join(fullPath, filename), 'utf-8');
        if (content.toLowerCase().includes(query.toLowerCase())) {
          const titleMatch = content.match(/title:\s*"([^"]+)"/);
          results.push({
            category,
            filename,
            slug: filename.replace('.md', ''),
            title: titleMatch ? titleMatch[1] : filename.replace('.md', ''),
            snippet: content.substring(0, 150) + '...'
          });
        }
      }
    }
    return results;
  }

  /**
   * Recupera um artigo específico pelo seu slug (nome do arquivo).
   */
  public async getArticle(slug: string): Promise<string> {
    const categories: ('pages' | 'decisions' | 'runbooks')[] = ['pages', 'decisions', 'runbooks'];
    for (const category of categories) {
      const fullPath = path.join(this.wikiRoot, category, `${slug}.md`);
      if (fs.existsSync(fullPath)) {
        return fs.readFileSync(fullPath, 'utf-8');
      }
    }
    throw new Error(`Artigo '${slug}' não encontrado no Wiki.`);
  }

  /**
   * Retorna estatísticas da biblioteca Wiki.
   */
  public async getLibraryStats() {
    const categories: ('pages' | 'decisions' | 'runbooks')[] = ['pages', 'decisions', 'runbooks'];
    const stats: any = { total: 0 };
    
    for (const category of categories) {
      const fullPath = path.join(this.wikiRoot, category);
      if (fs.existsSync(fullPath)) {
        const count = fs.readdirSync(fullPath).filter(f => f.endsWith('.md')).length;
        stats[category] = count;
        stats.total += count;
      } else {
        stats[category] = 0;
      }
    }
    
    return stats;
  }
}

export const wikiSyncService = WikiSyncService.getInstance();
