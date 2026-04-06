import React, { useEffect, useState } from 'react';
import { Thermometer, Droplets, AlertTriangle, ShieldCheck } from 'lucide-react';
import { climateMonitor, ClimateTelemetry, ClimateAlert } from '../../services/ClimateMonitorService';

/**
 * ClimateHUD (v1619)
 * Widget de monitoramento térmico em tempo real para o Unified Command.
 */
export const ClimateHUD: React.FC = () => {
  const [telemetry, setTelemetry] = useState<ClimateTelemetry | null>(null);
  const [lastAlert, setLastAlert] = useState<ClimateAlert | null>(null);

  useEffect(() => {
    const handleUpdate = (data: ClimateTelemetry) => {
      if (data.sensorId === 'SRV_ROOM_01') {
        setTelemetry(data);
      }
    };

    const handleAlert = (alert: ClimateAlert) => {
      setLastAlert(alert);
    };

    climateMonitor.on('telemetry_update', handleUpdate);
    climateMonitor.on('critical_alert', handleAlert);

    return () => {
      climateMonitor.off('telemetry_update', handleUpdate);
      climateMonitor.off('critical_alert', handleAlert);
    };
  }, []);

  if (!telemetry) return null;

  const isCritical = telemetry.temperature > 28;

  return (
    <div className={`p-6 rounded-[2.5rem] border ${isCritical ? 'bg-red-500/10 border-red-500/50' : 'bg-white/5 border-white/10'} backdrop-blur-xl group transition-all`}>
      <div className="flex justify-between items-start mb-6">
        <div className={`p-4 rounded-3xl ${isCritical ? 'bg-red-500 text-white animate-pulse' : 'bg-indigo-500/10 text-indigo-400'}`}>
          {isCritical ? <AlertTriangle size={24} /> : <ShieldCheck size={24} />}
        </div>
        <div className="text-right">
          <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest block">System Critical</span>
          <span className="text-xs font-bold text-white uppercase tracking-tighter tracking-widest">Server Room #01</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white/5 p-4 rounded-3xl border border-white/5 group-hover:bg-white/10 transition-colors">
          <div className="flex items-center gap-2 mb-2">
            <Thermometer size={14} className={isCritical ? 'text-red-500' : 'text-indigo-400'} />
            <span className="text-[9px] font-black text-slate-500 uppercase">Temp</span>
          </div>
          <span className={`text-2xl font-black italic ${isCritical ? 'text-red-500' : 'text-white'}`}>
            {telemetry.temperature.toFixed(1)}°C
          </span>
        </div>

        <div className="bg-white/5 p-4 rounded-3xl border border-white/5 group-hover:bg-white/10 transition-colors">
          <div className="flex items-center gap-2 mb-2">
            <Droplets size={14} className="text-blue-400" />
            <span className="text-[9px] font-black text-slate-500 uppercase">Humi</span>
          </div>
          <span className="text-2xl font-black text-white italic">
            {telemetry.humidity.toFixed(0)}%
          </span>
        </div>
      </div>

      {isCritical && lastAlert && (
        <div className="mt-6 p-4 bg-red-500/20 border border-red-500/30 rounded-2xl">
          <p className="text-[10px] font-bold text-red-500 uppercase leading-tight">
            {lastAlert.message}
          </p>
        </div>
      )}

      {/* Footer Info */}
      <div className="mt-6 flex justify-between items-center px-2">
         <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">IoT Link Active</span>
         <div className="flex gap-1">
            <div className="w-1 h-1 rounded-full bg-green-500 animate-pulse" />
            <div className="w-1 h-1 rounded-full bg-green-500 animate-pulse delay-75" />
            <div className="w-1 h-1 rounded-full bg-green-500 animate-pulse delay-150" />
         </div>
      </div>
    </div>
  );
};
