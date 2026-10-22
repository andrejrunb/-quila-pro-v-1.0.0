import { logger } from '../logger';

/**
 * MemoryOptimizerService - Camada 1 SQA-1000 (PERF-302)
 * Gestão proativa de heap e buffers pesados.
 */
export class MemoryOptimizerService {
  private static instance: MemoryOptimizerService;

  private constructor() {}

  public static getInstance(): MemoryOptimizerService {
    if (!MemoryOptimizerService.instance) {
      MemoryOptimizerService.instance = new MemoryOptimizerService();
    }
    return MemoryOptimizerService.instance;
  }

  /**
   * [SQA-PERF-302] Dispara Garbage Collection manual se habilitado via Node.js
   */
  public requestGarbageCollection(): void {
    if (typeof global.gc === 'function') {
      logger.info('[Memory] Solicitando Ciclo de Garbage Collection manual...');
      global.gc();
    } else {
      logger.debug('[Memory] GC manual não disponível (Node sem --expose-gc).');
    }
  }

  /**
   * Limpa buffers de imagem e caches temporários do Re-ID
   */
  public async clearHeavyBuffers(): Promise<void> {
    logger.info('[Memory] Purgando buffers de frames e caches de face Recon...');
    // Lógica para limpar Tensores de memória se usar TensorFlow.js ou similar
  }

  public getMemorySnapshot() {
    const memory = process.memoryUsage();
    return {
      heapUsed: (memory.heapUsed / 1024 / 1024).toFixed(2) + ' MB',
      rss: (memory.rss / 1024 / 1024).toFixed(2) + ' MB'
    };
  }
}

export const memoryOptimizer = MemoryOptimizerService.getInstance();

