import * as os from 'os';
import { EventEmitter } from 'events';

/**
 * ResourceMonitorService.ts — AG-005
 * Monitora o uso de hardware e emite eventos de 'throttle' 
 * quando os recursos estão escassos.
 */
class ResourceMonitorService extends EventEmitter {
  private intervalId: NodeJS.Timeout | null = null;
  private readonly CPU_THRESHOLD = 85; // %
  private readonly MEMORY_THRESHOLD = 0.9; // 90%
  private isThrottled = false;

  constructor() {
    super();
  }

  public start(intervalMs: number = 5000) {
    if (this.intervalId) return;

    this.intervalId = setInterval(() => {
      this.checkResources();
    }, intervalMs);
    
    console.log('ResourceMonitorService: Iniciado.');
  }

  public stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private async checkResources() {
    const cpuLoad = await this.getAverageCpuLoad();
    const memoryUsage = 1 - (os.freemem() / os.totalmem());

    const shouldThrottle = cpuLoad > this.CPU_THRESHOLD || memoryUsage > this.MEMORY_THRESHOLD;

    if (shouldThrottle && !this.isThrottled) {
      this.isThrottled = true;
      console.warn(`ResourceMonitorService: ALTA CARGA DETECTADA (CPU: ${cpuLoad.toFixed(1)}%, RAM: ${(memoryUsage * 100).toFixed(1)}%). Ativando Throttling.`);
      this.emit('throttle', true);
    } else if (!shouldThrottle && this.isThrottled) {
      this.isThrottled = false;
      console.log('ResourceMonitorService: Carga normalizada. Desativando Throttling.');
      this.emit('throttle', false);
    }
  }

  private async getAverageCpuLoad(): Promise<number> {
    const cpus = os.cpus();
    let totalIdle = 0;
    let totalTick = 0;

    cpus.forEach(cpu => {
      for (const type in cpu.times) {
        totalTick += (cpu.times as any)[type];
      }
      totalIdle += cpu.times.idle;
    });

    // Precisamos de dois pontos no tempo para calcular a carga real
    return new Promise((resolve) => {
      const startMeasure = { idle: totalIdle, total: totalTick };
      
      setTimeout(() => {
        const nextCpus = os.cpus();
        let nextIdle = 0;
        let nextTick = 0;

        nextCpus.forEach(cpu => {
          for (const type in cpu.times) {
            nextTick += (cpu.times as any)[type];
          }
          nextIdle += cpu.times.idle;
        });

        const idleDiff = nextIdle - startMeasure.idle;
        const totalDiff = nextTick - startMeasure.total;
        const percentage = 100 - (100 * idleDiff / totalDiff);
        
        resolve(percentage);
      }, 500);
    });
  }

  public getStatus() {
    return {
      isThrottled: this.isThrottled,
      cpuThreshold: this.CPU_THRESHOLD,
      memoryThreshold: this.MEMORY_THRESHOLD
    };
  }
}

export const resourceMonitor = new ResourceMonitorService();
export default resourceMonitor;
