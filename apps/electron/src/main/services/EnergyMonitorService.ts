import { EventEmitter } from 'events';

/**
 * Energy-Grid: Sovereign Power Monitoring
 * Integrates with campus smart grids and NPU thermal sensors.
 * Optimized for sustainable institutional compute.
 */

export interface EnergyMetric {
  campusId: string;
  currentConsumption: number; // kW
  voltage: number; // V
  source: 'grid' | 'generator' | 'solar' | 'ups';
  status: 'stable' | 'fluctuating' | 'critical';
  npuLoad: number; // 0-1
  ecoMode: boolean;
  timestamp: string;
}

class EnergyMonitorService extends EventEmitter {
  private static instance: EnergyMonitorService;
  private metrics: EnergyMetric = {
    campusId: 'central-dg',
    currentConsumption: 42.8,
    voltage: 220.2,
    source: 'grid',
    status: 'stable',
    npuLoad: 0.35,
    ecoMode: false,
    timestamp: new Date().toISOString()
  };

  private constructor() {
    super();
    this.startMonitoring();
  }

  public static getInstance(): EnergyMonitorService {
    if (!EnergyMonitorService.instance) {
      EnergyMonitorService.instance = new EnergyMonitorService();
    }
    return EnergyMonitorService.instance;
  }

  private startMonitoring() {
    setInterval(() => {
      this.simulateGridDynamics();
      this.emit('energy-updated', this.metrics);
    }, 5000);
  }

  private simulateGridDynamics() {
    const consumptionDelta = (Math.random() * 2 - 1);
    const voltageDelta = (Math.random() * 4 - 2);
    
    // Auto-throttle NPU if eco-mode is on
    const targetLoad = this.metrics.ecoMode ? 0.25 : 0.65;
    const loadDelta = (targetLoad - this.metrics.npuLoad) * 0.1;

    this.metrics = {
      ...this.metrics,
      currentConsumption: Math.max(10, parseFloat((this.metrics.currentConsumption + consumptionDelta).toFixed(2))),
      voltage: parseFloat((this.metrics.voltage + voltageDelta).toFixed(1)),
      npuLoad: Math.max(0, Math.min(1, this.metrics.npuLoad + loadDelta)),
      status: this.metrics.voltage < 210 || this.metrics.voltage > 235 ? 'fluctuating' : 'stable',
      timestamp: new Date().toISOString()
    };
  }

  public setEcoMode(active: boolean) {
    this.metrics.ecoMode = active;
    this.emit('energy-updated', this.metrics);
    console.log(`[EnergyGrid] Eco-Mode ${active ? 'ENGAGED' : 'DISENGAGED'}`);
  }

  public getMetrics(): EnergyMetric {
    return this.metrics;
  }
}

export const energyMonitor = EnergyMonitorService.getInstance();
export default energyMonitor;

