import { useState, useEffect } from 'react';
import { energyMonitor, EnergyMetric } from '../services/EnergyMonitorService';

/**
 * useEnergyMonitor Hook (v3650)
 * Reactive wrapper for the EnergyMonitorService.
 */
export const useEnergyMonitor = () => {
  const [metrics, setMetrics] = useState<EnergyMetric>(energyMonitor.getMetrics());

  useEffect(() => {
    const handler = (newMetrics: EnergyMetric) => setMetrics(newMetrics);
    energyMonitor.on('energy-updated', handler);
    return () => {
      energyMonitor.off('energy-updated', handler);
    };
  }, []);

  return metrics;
};
