import { useState, useEffect, useCallback } from 'react';
import { useIPC } from './useIPC';

export interface RobotTelemetry {
  id: string;
  type: 'drone' | 'wheeled';
  battery: number;
  status: 'docked' | 'patrolling' | 'responding' | 'emergency-land';
  position: { x: number; y: number; alt: number };
  heading: number;
}

export const useRobotics = () => {
  const { invoke } = useIPC();
  const [units, setUnits] = useState<RobotTelemetry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUnits = useCallback(async () => {
    try {
      const data = await invoke('robotics:get-units');
      if (Array.isArray(data)) {
        setUnits(data);
      }
    } catch (error) {
      console.error('Error fetching robotics units:', error);
    } finally {
      setLoading(false);
    }
  }, [invoke]);

  const sendCommand = useCallback(async (id: string, command: string) => {
    try {
      return await invoke('robotics:send-command', { id, command });
    } catch (error) {
      console.error(`Error sending command ${command} to unit ${id}:`, error);
      return { success: false, error };
    }
  }, [invoke]);

  useEffect(() => {
    fetchUnits();

    // Inscrição para atualizações de telemetria em tempo real
    // Nota: O preload.ts expõe o window.aquila que pode ter listeners
    const aquila = (window as any).aquila;
    if (aquila?.on) {
      const unsubscribe = aquila.on('robotics:telemetry', (data: RobotTelemetry[]) => {
        setUnits([...data]);
      });
      return () => {
        if (typeof unsubscribe === 'function') unsubscribe();
      };
    }
  }, [fetchUnits]);

  return { units, loading, sendCommand, refresh: fetchUnits };
};
