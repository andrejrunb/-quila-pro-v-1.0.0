import { useState, useEffect } from 'react';


/**
 * useEnergyMonitor Hook (v3650)
 * Reactive wrapper for the EnergyMonitorService.
 */
export const useEnergyMonitor = () => {
  const [metrics, setMetrics] = useState<any>({ currentConsumption: 0, thermalState: 'NORMAL', ecoMode: true });

  useEffect(() => {
    const aquila = (window as any).aquila;
    if (aquila) {
      aquila.getEnergyMetrics().then(setMetrics);
      
      const unsubscribe = aquila.onEnergyUpdated((newMetrics: any) => {
        setMetrics(newMetrics);
      });
      
      return () => {
        if (typeof unsubscribe === 'function') unsubscribe();
      };
    }
  }, []);

  return metrics;
};
