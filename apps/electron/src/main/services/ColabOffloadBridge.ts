import axios from 'axios';
import { logger } from '../logger';

export interface ColabGpuInfo {
  device: string;
  vram_total_gb: number;
  vram_allocated_gb: number;
  bf16_supported: boolean;
}

export interface ColabStatusResponse {
  engine: string;
  status: 'READY' | 'BUSY' | 'OFFLINE';
  gpu?: ColabGpuInfo;
}

export interface ColabTaskResult {
  task_id: string;
  status: string;
  duration_ms?: number;
  result?: any;
  message?: string;
}

/**
 * ColabOffloadBridge — Áquila Pro (Level 16 Sovereign Hybrid Compute)
 * Conecta o ecossistema desktop ao acelerador neural remoto (NVIDIA A100) no Google Colab.
 */
export class ColabOffloadBridge {
  private endpointUrl: string | null = null;
  private isConnected: boolean = false;
  private lastGpuInfo: ColabGpuInfo | null = null;

  constructor(initialUrl?: string) {
    if (initialUrl) {
      this.setEndpoint(initialUrl);
    }
  }

  public setEndpoint(url: string) {
    this.endpointUrl = url.replace(/\/+$/, '');
    logger.info(`[ColabBridge] Endpoint configurado: ${this.endpointUrl}`);
  }

  public getEndpoint(): string | null {
    return this.endpointUrl;
  }

  /**
   * Testa a conectividade e verifica se a GPU A100 está ativa no Colab
   */
  public async testConnection(): Promise<{ ok: boolean; gpu?: ColabGpuInfo; error?: string }> {
    if (!this.endpointUrl) {
      return { ok: false, error: 'Endpoint do Colab não configurado.' };
    }

    try {
      const res = await axios.get<ColabStatusResponse>(`${this.endpointUrl}/status`, {
        timeout: 8000
      });

      if (res.data && res.data.status === 'READY') {
        this.isConnected = true;
        this.lastGpuInfo = res.data.gpu || null;
        logger.info(`[ColabBridge] Conexão ativa com Colab A100! Dispositivo: ${res.data.gpu?.device}`);
        return { ok: true, gpu: this.lastGpuInfo || undefined };
      }

      return { ok: false, error: `Status inesperado do motor: ${res.data?.status}` };
    } catch (err: any) {
      this.isConnected = false;
      logger.warn(`[ColabBridge] Falha ao conectar ao Colab: ${err.message}`);
      return { ok: false, error: err.message };
    }
  }

  /**
   * Envia uma tarefa pesada para computação na GPU A100
   */
  public async offloadTask(taskId: string, taskType: string, payload: Record<string, any>): Promise<ColabTaskResult> {
    if (!this.endpointUrl) {
      throw new Error('Colab endpoint não configurado.');
    }

    const startTime = Date.now();
    try {
      logger.info(`[ColabBridge] Despachando tarefa ${taskId} (${taskType}) para GPU A100...`);
      const response = await axios.post<ColabTaskResult>(
        `${this.endpointUrl}/execute`,
        {
          task_id: taskId,
          task_type: taskType,
          payload
        },
        { timeout: 60000 }
      );

      const roundTripMs = Date.now() - startTime;
      logger.info(`[ColabBridge] Tarefa ${taskId} concluída em ${roundTripMs}ms (Execução A100: ${response.data.duration_ms || 0}ms)`);
      return response.data;
    } catch (err: any) {
      logger.error(`[ColabBridge] Erro ao executar tarefa ${taskId} no Colab: ${err.message}`);
      throw err;
    }
  }

  public getStatus() {
    return {
      connected: this.isConnected,
      endpoint: this.endpointUrl,
      gpu: this.lastGpuInfo
    };
  }
}

export const colabOffloadBridge = new ColabOffloadBridge();
