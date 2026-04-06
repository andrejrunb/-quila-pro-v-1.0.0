import * as os from 'os';
import { EventEmitter } from 'events';
import { communicationHubService } from './CommunicationHubService';

/**
 * ResourceMonitorService.ts — AG-005 (Cycle 7 Hardened)
 * Monitora o uso de hardware e o heap interno do Node.js com histerese e eventos proativos.
 */
class ResourceMonitorService extends EventEmitter {
  private intervalId: NodeJS.Timeout | null = null;
  private readonly CPU_THRESHOLD_HIGH = 85; 
  private readonly CPU_THRESHOLD_LOW = 70;  
  private readonly MEMORY_THRESHOLD_HIGH = 0.92;
  private readonly MEMORY_THRESHOLD_LOW = 0.80;
  private readonly HEAP_THRESHOLD_MB_HIGH = 1024;
  private readonly HEAP_THRESHOLD_MB_LOW = 800;
  
  private isThrottled = false;
  private lastCpuLoad = 0;
  private memoryHistory: { ts: number; used: number }[] = [];

  constructor() {
    super();
  }

  public start(intervalMs: number = 30000) { 
    if (this.intervalId) return;

    this.intervalId = setInterval(() => {
      this.checkResources().catch(console.error);
    }, intervalMs);
    
    console.log('[ResourceMonitorService] Auditoria de performance ativa (Cycle 7 Hardened).');
  }

  public stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  public forceCleanup() {
    if (global.gc) {
      console.log('[ResourceMonitorService] Executando Coleta de Lixo Forçada (GC).');
      global.gc();
    } else {
      // Nota: Para habilitar global.gc(), o app deve rodar com --expose-gc
      console.warn('[ResourceMonitorService] GC não exposto. Execute com --expose-gc para otimização máxima.');
    }
  }

  private async checkResources() {
    const cpuLoad = await this.getAverageCpuLoad();
    this.lastCpuLoad = cpuLoad;
    
    const sysMemoryUsage = 1 - (os.freemem() / os.totalmem());
    const heap = process.memoryUsage();
    const heapUsedMB = Math.round(heap.heapUsed / 1024 / 1024);

    // Lógica Preditiva (Cycle 8)
    this.memoryHistory.push({ ts: Date.now(), used: heapUsedMB });
    if (this.memoryHistory.length > 10) this.memoryHistory.shift();

    const memDeltaMBps = this.calculateMemoryDelta();
    const panicInfo = this.checkPredictivePanic(heapUsedMB, memDeltaMBps);
    const isPredictivePanic = panicInfo.panicFound;

    // Lógica de Histerese para evitar oscilações rápidas (flap)
    let shouldThrottle = this.isThrottled;

    if (!this.isThrottled) {
      if (cpuLoad > this.CPU_THRESHOLD_HIGH || sysMemoryUsage > this.MEMORY_THRESHOLD_HIGH || heapUsedMB > this.HEAP_THRESHOLD_MB_HIGH || isPredictivePanic) {
        shouldThrottle = true;
        if (isPredictivePanic) {
          this.emit('proactive-throttle', { projectedOOM: panicInfo.timeToLimit, delta: memDeltaMBps });
        }
      }
    } else {
      if (cpuLoad < this.CPU_THRESHOLD_LOW && sysMemoryUsage < this.MEMORY_THRESHOLD_LOW && heapUsedMB < this.HEAP_THRESHOLD_MB_LOW && !isPredictivePanic) {
        shouldThrottle = false;
      }
    }

    if (shouldThrottle && !this.isThrottled) {
      this.isThrottled = true;
      const reason = heapUsedMB > this.HEAP_THRESHOLD_MB_HIGH ? `HEAP CRÍTICO: ${heapUsedMB}MB` : `CARGA ALTA (CPU: ${cpuLoad.toFixed(1)}%)`;
      
      console.warn(`[ResourceMonitorService] ${reason}. Ativando Throttling.`);
      this.emit('throttle', { active: true, reason, timestamp: Date.now() });
      
      if (heapUsedMB > this.HEAP_THRESHOLD_MB_HIGH) this.forceCleanup();

      communicationHubService.sendMessage({
        sender: 'SISTEMA_RECURSOS',
        recipient: 'SEC_LEVEL_1',
        content: `ALERTA DE RECURSOS: ${reason}. O sistema pode apresentar instabilidade.`,
        priority: 'high',
        channelId: 'sec',
        isSilentAlarm: true
      });

    } else if (!shouldThrottle && this.isThrottled) {
      this.isThrottled = false;
      console.log('[ResourceMonitorService] Carga normalizada. Desativando Throttling.');
      this.emit('throttle', { active: false, timestamp: Date.now() });
      this.emit('resume');
    }

    // Telemetria para o Swarm/Dashboard
    this.emit('telemetry', {
      cpu: cpuLoad,
      memory: sysMemoryUsage,
      heap: heapUsedMB,
      isThrottled: this.isThrottled
    });

    if (heapUsedMB > 500) {
      console.log(`[ResourceMonitorService] Swarm Performance: CPU=${cpuLoad.toFixed(1)}% | RAM=${(sysMemoryUsage*100).toFixed(1)}% | Heap=${heapUsedMB}MB`);
    }
  }

  private async getAverageCpuLoad(): Promise<number> {
    const cpus = os.cpus();
    if (!cpus || cpus.length === 0) return 0;
    
    let totalIdle = 0;
    let totalTick = 0;

    cpus.forEach(cpu => {
      for (const type in cpu.times) {
        totalTick += (cpu.times as any)[type];
      }
      totalIdle += cpu.times.idle;
    });

    const startMeasure = { idle: totalIdle, total: totalTick };
    
    return new Promise((resolve) => {
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
        const percentage = totalDiff === 0 ? 0 : 100 - (100 * idleDiff / totalDiff);
        
        resolve(percentage);
      }, 500);
    });
  }

  private calculateMemoryDelta(): number {
    if (this.memoryHistory.length < 2) return 0;
    
    const latest = this.memoryHistory[this.memoryHistory.length - 1];
    const earliest = this.memoryHistory[0];
    
    const timeDiffSec = (latest.ts - earliest.ts) / 1000;
    if (timeDiffSec === 0) return 0;
    
    const memDiffMB = latest.used - earliest.used;
    return memDiffMB / timeDiffSec; // MB/s
  }

  private checkPredictivePanic(currentMB: number, deltaMBps: number): { panicFound: boolean, timeToLimit: number } {
    if (deltaMBps <= 0) return { panicFound: false, timeToLimit: Infinity };
    
    // Se continuarmos nesse ritmo, chegamos no limite em quanto tempo?
    const remainingMB = this.HEAP_THRESHOLD_MB_HIGH - currentMB;
    const secondsToLimit = remainingMB / deltaMBps;
    
    // Se o limite for ser atingido em menos de 30 segundos, pânico preventivo
    if (secondsToLimit > 0 && secondsToLimit < 30) {
      return { panicFound: true, timeToLimit: secondsToLimit };
    }
    
    return { panicFound: false, timeToLimit: secondsToLimit };
  }

  public getStatus() {
    const heap = process.memoryUsage();
    const currentHeapMB = Math.round(heap.heapUsed / 1024 / 1024);
    const delta = this.calculateMemoryDelta();
    const panic = this.checkPredictivePanic(currentHeapMB, delta);
    
    return {
      isThrottled: this.isThrottled,
      cpuLoad: this.lastCpuLoad,
      memoryUsage: 1 - (os.freemem() / os.totalmem()),
      heapUsedMB: currentHeapMB,
      heapTotalMB: Math.round(heap.heapTotal / 1024 / 1024),
      memoryDeltaMBs: delta,
      predictivePanic: panic.panicFound,
      timeToOOM: panic.timeToLimit,
      limits: {
        cpu: this.CPU_THRESHOLD_HIGH,
        mem: this.MEMORY_THRESHOLD_HIGH,
        heap: this.HEAP_THRESHOLD_MB_HIGH
      }
    };
  }
}

export const resourceMonitor = new ResourceMonitorService();
export default resourceMonitor;
