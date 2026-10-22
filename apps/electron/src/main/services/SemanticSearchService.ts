import { spawn } from 'child_process';
import * as path from 'path';
import { app } from 'electron';

export interface SemanticSearchResult {
  success: boolean;
  camera_id?: string;
  zone?: string;
  query: string;
  similarity?: number;
  box?: number[];
  timestamp?: string;
  error?: string;
}

export class SemanticSearchService {
  private static instance: SemanticSearchService;
  private isSearching = false;

  private constructor() {}

  public static getInstance(): SemanticSearchService {
    if (!SemanticSearchService.instance) {
      SemanticSearchService.instance = new SemanticSearchService();
    }
    return SemanticSearchService.instance;
  }

  /**
   * Executa uma busca semântica visual usando o worker Python local (NVIDIA CLIP/Locate Anything)
   */
  public async search(query: string, cameraId: string = 'cam_01', zone: string = 'entrada'): Promise<SemanticSearchResult> {
    if (this.isSearching) {
      return { success: false, query, error: 'Outra busca já está em andamento.' };
    }
    this.isSearching = true;

    return new Promise((resolve) => {
      const pythonBin = process.env.PYTHON_BIN || 'python';
      const scriptPath = path.join(app.getAppPath(), 'python', 'semantic_search_worker.py');

      const worker = spawn(pythonBin, [scriptPath], {
        env: { ...process.env }
      });

      let stdoutData = '';
      let stderrData = '';

      worker.stdout.on('data', (data) => {
        stdoutData += data.toString();
      });

      worker.stderr.on('data', (data) => {
        stderrData += data.toString();
      });

      // Envia o comando estruturado via stdin para o worker
      const command = {
        command: 'search',
        query: query,
        camera_id: cameraId,
        zone: zone
      };
      
      worker.stdin.write(JSON.stringify(command) + '\n');
      worker.stdin.end();

      worker.on('close', (code) => {
        this.isSearching = false;
        
        if (code === 0) {
          try {
            // Procura por JSON retornado na saída
            const lines = stdoutData.split('\n');
            for (const line of lines) {
              if (line.trim().startsWith('{')) {
                const parsed = JSON.parse(line.trim());
                if (parsed.type === 'semantic_search_result') {
                  resolve({
                    success: parsed.status === 'MATCH_FOUND',
                    camera_id: parsed.camera_id,
                    zone: parsed.zone,
                    query: parsed.query,
                    similarity: parsed.similarity,
                    box: parsed.box,
                    timestamp: parsed.timestamp
                  });
                  return;
                }
              }
            }
            resolve({ success: false, query, error: 'Nenhum resultado estruturado retornado pelo worker.' });
          } catch (e: any) {
            console.error('[SEMANTIC_SEARCH] Erro ao decodificar resultado:', e);
            resolve({ success: false, query, error: `Falha na decodificação JSON: ${e.message}` });
          }
        } else {
          console.error(`[SEMANTIC_SEARCH] Worker falhou com código ${code}. Stderr: ${stderrData}`);
          resolve({ success: false, query, error: `Processo finalizou com erro: ${stderrData || 'Código ' + code}` });
        }
      });
    });
  }
}

export const semanticSearchService = SemanticSearchService.getInstance();
