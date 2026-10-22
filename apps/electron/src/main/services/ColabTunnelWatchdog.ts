import { EventEmitter } from 'events';
import { colabGpuBridge, ColabHealth } from './ColabGpuBridge';
import Database, { db } from '../../database/Database';
import { v4 as uuidv4 } from 'uuid';

export interface ColabQueuedTask {
  id: string;
  taskType: 'face_embeddings' | 'object_detection' | 'image_process' | 'benchmark';
  payload: any;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  attempts: number;
  result?: any;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WatchdogMetrics {
  isHealthy: boolean;
  consecutiveFailures: number;
  totalChecks: number;
  lastHealthyTimestamp: number | null;
  lastLatencyMs: number;
  pendingTasksCount: number;
  processedTasksCount: number;
}

/**
 * ColabTunnelWatchdog (Passo 101 e 102 - Plano Mestre 200 Passos)
 * -----------------------------------------------------------------
 * Monitora proativamente a integridade do túnel Cloudflare do Colab,
 * gerencia a fila de tarefas offline persistida no SQLite e
 * descarrega automaticamente a fila assim que a GPU fica online.
 */
export class ColabTunnelWatchdog extends EventEmitter {
  private static instance: ColabTunnelWatchdog;

  private consecutiveFailures: number = 0;
  private totalChecks: number = 0;
  private lastHealthyTimestamp: number | null = null;
  private lastLatencyMs: number = 0;
  private processedTasksCount: number = 0;
  private isProcessingQueue: boolean = false;

  private checkInterval: NodeJS.Timeout | null = null;
  private readonly MAX_CONSECUTIVE_FAILURES = 3;
  private readonly WATCHDOG_INTERVAL_MS = 15_000;

  private constructor() {
    super();
    this.setupBridgeListeners();
  }

  public static getInstance(): ColabTunnelWatchdog {
    if (!ColabTunnelWatchdog.instance) {
      ColabTunnelWatchdog.instance = new ColabTunnelWatchdog();
    }
    return ColabTunnelWatchdog.instance;
  }

  private setupBridgeListeners(): void {
    colabGpuBridge.on('online', (health: ColabHealth) => {
      this.consecutiveFailures = 0;
      this.lastHealthyTimestamp = Date.now();
      this.emit('tunnel:restored', { health, timestamp: this.lastHealthyTimestamp });
      this.processPendingTasks().catch((err) => {
        console.error('[ColabTunnelWatchdog] Erro ao processar fila pós-reconexão:', err);
      });
    });

    colabGpuBridge.on('offline', (err: any) => {
      this.consecutiveFailures++;
      this.emit('tunnel:degraded', {
        failures: this.consecutiveFailures,
        error: err?.message || String(err),
      });
    });
  }

  /**
   * Inicia o watchdog de monitoramento contínuo.
   */
  public start(): void {
    this.stop();
    this.checkInterval = setInterval(() => {
      this.tick().catch(() => {});
    }, this.WATCHDOG_INTERVAL_MS);
    this.checkInterval.unref();
  }

  /**
   * Para o watchdog.
   */
  public stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  /**
   * Ciclo individual de inspeção de saúde do túnel.
   */
  public async tick(): Promise<boolean> {
    this.totalChecks++;
    const start = Date.now();
    try {
      const status = colabGpuBridge.getStatus();
      if (!status.url) {
        return false;
      }

      const health = await colabGpuBridge.checkHealth();
      this.lastLatencyMs = Date.now() - start;

      if (health.status === 'HEALTHY') {
        this.consecutiveFailures = 0;
        this.lastHealthyTimestamp = Date.now();
        return true;
      } else {
        this.consecutiveFailures++;
        if (this.consecutiveFailures >= this.MAX_CONSECUTIVE_FAILURES) {
          this.emit('tunnel:expired', {
            consecutiveFailures: this.consecutiveFailures,
            message: 'Túnel do Colab parece ter expirado ou desconectado.',
          });
        }
        return false;
      }
    } catch {
      this.consecutiveFailures++;
      return false;
    }
  }

  /**
   * Enfileira uma tarefa pesada de visão para execução offline persistida.
   */
  public async enqueueTask(
    taskType: ColabQueuedTask['taskType'],
    payload: any
  ): Promise<string> {
    const taskId = `ctask_${uuidv4()}`;
    const payloadStr = JSON.stringify(payload);
    const now = new Date().toISOString();

    try {
      await db.run(
        `INSERT INTO colab_task_queue (id, taskType, payload, status, attempts, createdAt, updatedAt)
         VALUES (?, ?, ?, 'pending', 0, ?, ?)`,
        [taskId, taskType, payloadStr, now, now]
      );
      this.emit('queue:enqueued', { taskId, taskType });
    } catch (err) {
      console.error('[ColabTunnelWatchdog] Falha ao enfileirar tarefa no SQLite:', err);
      throw err;
    }

    // Se o Colab estiver online no momento, processa imediatamente
    if (colabGpuBridge.getStatus().online) {
      this.processPendingTasks().catch(() => {});
    }

    return taskId;
  }

  /**
   * Processa tarefas pendentes na fila do SQLite quando a GPU estiver online.
   */
  public async processPendingTasks(): Promise<number> {
    if (this.isProcessingQueue) return 0;
    if (!colabGpuBridge.getStatus().online) return 0;

    this.isProcessingQueue = true;
    let processed = 0;

    try {
      const pendingRows = await db.all(
        `SELECT * FROM colab_task_queue WHERE status = 'pending' ORDER BY createdAt ASC LIMIT 10`
      );

      for (const row of pendingRows) {
        if (!colabGpuBridge.getStatus().online) break;

        const taskId = row.id;
        let payload: any;
        try {
          payload = JSON.parse(row.payload);
        } catch {
          payload = row.payload;
        }

        await db.run(
          `UPDATE colab_task_queue SET status = 'processing', attempts = attempts + 1, updatedAt = ? WHERE id = ?`,
          [new Date().toISOString(), taskId]
        );

        try {
          let taskResult: any;

          if (row.taskType === 'face_embeddings' && payload.buffer) {
            const buf = Buffer.from(payload.buffer, 'base64');
            taskResult = await colabGpuBridge.extractFaceEmbeddings(buf);
          } else if (row.taskType === 'object_detection' && payload.buffer) {
            const buf = Buffer.from(payload.buffer, 'base64');
            taskResult = await colabGpuBridge.detectObjects(buf, payload.confidence);
          } else if (row.taskType === 'benchmark') {
            taskResult = await colabGpuBridge.benchmark(payload.matrixSize);
          } else {
            taskResult = { skipped: true, reason: 'Task payload or type unsupported' };
          }

          await db.run(
            `UPDATE colab_task_queue SET status = 'completed', result = ?, updatedAt = ? WHERE id = ?`,
            [JSON.stringify(taskResult), new Date().toISOString(), taskId]
          );

          this.processedTasksCount++;
          processed++;
          this.emit('queue:completed', { taskId, result: taskResult });
        } catch (taskErr: any) {
          await db.run(
            `UPDATE colab_task_queue SET status = 'failed', error = ?, updatedAt = ? WHERE id = ?`,
            [taskErr?.message || String(taskErr), new Date().toISOString(), taskId]
          );
          this.emit('queue:failed', { taskId, error: taskErr?.message });
        }
      }
    } finally {
      this.isProcessingQueue = false;
    }

    return processed;
  }

  /**
   * Retorna métricas consolidadas do watchdog.
   */
  public async getMetrics(): Promise<WatchdogMetrics> {
    let pendingCount = 0;
    try {
      const row = await db.get(
        `SELECT COUNT(*) as count FROM colab_task_queue WHERE status = 'pending'`
      );
      pendingCount = row?.count || 0;
    } catch {
      pendingCount = 0;
    }

    return {
      isHealthy: colabGpuBridge.getStatus().online && this.consecutiveFailures === 0,
      consecutiveFailures: this.consecutiveFailures,
      totalChecks: this.totalChecks,
      lastHealthyTimestamp: this.lastHealthyTimestamp,
      lastLatencyMs: this.lastLatencyMs,
      pendingTasksCount: pendingCount,
      processedTasksCount: this.processedTasksCount,
    };
  }

  /**
   * Limpa recursos.
   */
  public destroy(): void {
    this.stop();
    this.removeAllListeners();
  }
}

export const colabTunnelWatchdog = ColabTunnelWatchdog.getInstance();
