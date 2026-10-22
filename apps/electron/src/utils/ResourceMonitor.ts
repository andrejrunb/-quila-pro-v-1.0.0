import { communicationHubService } from '../main/services/CommunicationHubService';

/**
 * ResourceMonitor (v1.0.1)
 * Monitora o consumo de recursos (RAM/CPU) e emite alertas se exceder limites.
 * Parte do Cycle 5 de Estabilização.
 */
export class ResourceMonitor {
  private interval: NodeJS.Timeout | null = null;
  private readonly MEMORY_THRESHOLD_MB = 800; // Alerta se Heap > 800MB

  constructor() {
    this.start();
  }

  public start() {
    this.interval = setInterval(() => {
      this.audit();
    }, 300000); // A cada 5 minutos
    
    // Auditoria inicial
    this.audit();
  }

  public stop() {
    if (this.interval) clearInterval(this.interval);
  }

  private audit() {
    const memory = process.memoryUsage();
    const heapUsedMB = Math.round(memory.heapUsed / 1024 / 1024);
    const rssMB = Math.round(memory.rss / 1024 / 1024);
    const externalMB = Math.round(memory.external / 1024 / 1024);

    console.log(`[ResourceMonitor] Audit Results: RSS: ${rssMB}MB | Heap: ${heapUsedMB}MB | External: ${externalMB}MB`);

    if (heapUsedMB > this.MEMORY_THRESHOLD_MB) {
      console.warn(`[CRITICAL] ALTA UTILIZAÇÃO DE MEMÓRIA: ${heapUsedMB}MB`);
      
      communicationHubService.sendMessage({
        sender: 'SISTEMA_RECURSOS',
        recipient: 'ADMIN',
        content: `ALERTA DE PERFORMANCE: O uso de Heap excedeu ${this.MEMORY_THRESHOLD_MB}MB (Atual: ${heapUsedMB}MB). Considere reiniciar o módulo AI.`,
        priority: 'high',
        channelId: 'gen',
        isSilentAlarm: true
      });

      // Se possível, sugerir GC manual em ambiente Node com --expose-gc
      if (global.gc) {
        console.log('[ResourceMonitor] Acionando Garbage Collection manual...');
        global.gc();
      }
    }
  }
}

export const resourceMonitor = new ResourceMonitor();

