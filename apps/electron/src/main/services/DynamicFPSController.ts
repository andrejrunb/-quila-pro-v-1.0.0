/**
 * DynamicFPSController.ts — Item 24
 * Monitora a carga de CPU e GPU e ajusta o FPS dos streams dinamicamente.
 * Meta: Qualidade máxima sem travar o sistema.
 */

import * as os from 'os';
import { EventEmitter } from 'events';

interface FPSPolicy {
  cpuThresholdHigh: number; // % CPU para reduzir FPS
  cpuThresholdLow: number;  // % CPU para aumentar FPS
  minFPS: number;
  maxFPS: number;
  defaultFPS: number;
}

const DEFAULT_POLICY: FPSPolicy = {
  cpuThresholdHigh: 75,
  cpuThresholdLow: 40,
  minFPS: 1,
  maxFPS: 15,
  defaultFPS: 5,
};

export class DynamicFPSController extends EventEmitter {
  private currentFPS: number;
  private intervalHandle: NodeJS.Timeout | null = null;
  private cpuSamples: number[] = [];

  constructor(private policy: FPSPolicy = DEFAULT_POLICY) {
    super();
    this.currentFPS = policy.defaultFPS;
  }

  start(): void {
    if (this.intervalHandle) return;
    // Aplica política a cada 10 segundos
    this.intervalHandle = setInterval(() => this._evaluate(), 10_000);
    console.log('[DynamicFPS] Controller iniciado. FPS default:', this.currentFPS);
  }

  stop(): void {
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = null;
    }
  }

  getCurrentFPS(): number { return this.currentFPS; }

  private _getCpuUsage(): number {
    const cpus = os.cpus();
    const totals = cpus.reduce((acc, cpu) => {
      const total = Object.values(cpu.times).reduce((a, b) => a + b, 0);
      return { used: acc.used + cpu.times.user + cpu.times.sys, total: acc.total + total };
    }, { used: 0, total: 0 });
    return (totals.used / totals.total) * 100;
  }

  private _evaluate(): void {
    const cpu = this._getCpuUsage();
    this.cpuSamples.push(cpu);
    if (this.cpuSamples.length > 6) this.cpuSamples.shift();
    const avgCpu = this.cpuSamples.reduce((a, b) => a + b, 0) / this.cpuSamples.length;

    let newFPS = this.currentFPS;

    const { sovereignGridService, EnergyMode } = require('./SovereignGridService');
    const energyMode = sovereignGridService.getStatus().mode;

    if (avgCpu > this.policy.cpuThresholdHigh || energyMode === EnergyMode.CONSERVATION) {
      newFPS = Math.max(this.policy.minFPS, energyMode === EnergyMode.CONSERVATION ? 1 : this.currentFPS - 2);
    } else if (avgCpu < this.policy.cpuThresholdLow && energyMode === EnergyMode.PERFORMANCE) {
      newFPS = Math.min(this.policy.maxFPS, this.currentFPS + 1);
    }

    if (newFPS !== this.currentFPS) {
      this.currentFPS = newFPS;
      console.log(`[DynamicFPS] CPU ${avgCpu.toFixed(1)}% → Ajustando FPS para ${newFPS}`);
      this.emit('fps-changed', { fps: newFPS, cpuAvg: avgCpu });
    }
  }
}

