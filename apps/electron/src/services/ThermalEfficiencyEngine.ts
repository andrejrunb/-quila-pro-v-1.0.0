/**
 * Energy-Grid: Thermal Efficiency Engine
 * Correlates computational load with campus environmental telemetry.
 */

import { energyMonitor, EnergyMetric } from './EnergyMonitorService';

export interface ThermalState {
  npuTemp: number; // Celsius
  efficiencyScore: number; // 0-1
  isThrottling: boolean;
}

class ThermalEfficiencyEngine {
  private static instance: ThermalEfficiencyEngine;
  private readonly CRITICAL_TEMP = 85;

  private constructor() {}

  public static getInstance(): ThermalEfficiencyEngine {
    if (!ThermalEfficiencyEngine.instance) {
      ThermalEfficiencyEngine.instance = new ThermalEfficiencyEngine();
    }
    return ThermalEfficiencyEngine.instance;
  }

  /**
   * Calculates real-time hardware health based on power metrics.
   */
  public getThermalState(): ThermalState {
    const metrics = energyMonitor.getMetrics();
    
    // Heuristic: Temp rises with load
    const baseTemp = 40;
    const loadEffect = metrics.npuLoad * 50;
    const npuTemp = baseTemp + loadEffect + (Math.random() * 2);

    return {
      npuTemp: parseFloat(npuTemp.toFixed(1)),
      efficiencyScore: Math.max(0, 1 - (metrics.currentConsumption / 100)),
      isThrottling: npuTemp > this.CRITICAL_TEMP
    };
  }
}

export const thermalEngine = ThermalEfficiencyEngine.getInstance();
