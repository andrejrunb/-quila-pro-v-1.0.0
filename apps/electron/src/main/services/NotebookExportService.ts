import * as fs from 'fs';
import * as path from 'path';
import { logger } from '../logger';

export interface ExportPackage {
  title: string;
  content: string;
  metadata: any;
  sources: string[];
}

/**
 * NotebookExportService - A Ponte de Conhecimento (v3470)
 * Gera pacotes de exportação otimizados para NotebookLM e RAGs Externos.
 */
export class NotebookExportService {
  private readonly EXPORT_DIR = 'C:/aquila/exports';

  constructor() {
    if (!fs.existsSync(this.EXPORT_DIR)) {
      fs.mkdirSync(this.EXPORT_DIR, { recursive: true });
    }
  }

  /**
   * [SQA-EXP-601] Exporta material para formato NotebookLM (.md)
   */
  public async exportAsNotebook(data: ExportPackage): Promise<string> {
    const fileName = `${data.title.replace(/\s/g, '_')}_notebook.md`;
    const filePath = path.join(this.EXPORT_DIR, fileName);

    const markdown = `
# ${data.title}
> Exportado via Áquila Pro Sovereign Bridge (v3470)
> Data: ${new Date().toLocaleString()}

## Conteúdo Principal
${data.content}

## Fontes e Citações (Sovereign Swarm)
${data.sources.map(s => `- ${s}`).join('\n')}

---
**Metadados de Exportação:**
- ID: ${data.metadata.id || 'N/A'}
- Escola: Sovereign School Unit Alpha
- Motor: Distributed LLM RAG
    `.trim();

    await fs.promises.writeFile(filePath, markdown, 'utf8');
    logger.info(`[Export] NotebookLM Package gerado: ${fileName}`);
    return filePath;
  }

  /**
   * [SQA-EXP-602] Exportação em JSON Estruturado para RAG Externo
   */
  public async exportAsJSON(data: ExportPackage): Promise<string> {
    const fileName = `${data.title.replace(/\s/g, '_')}_rag.json`;
    const filePath = path.join(this.EXPORT_DIR, fileName);
    
    await fs.promises.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
    return filePath;
  }
}

export const notebookExportService = new NotebookExportService();

