import React, { useState, useEffect, useRef } from 'react';
import { 
  Zap, Wind, Sun, Battery, Thermometer, 
  ShieldCheck, Leaf, ArrowLeft, Activity,
  Settings, Power, RefreshCw
} from 'lucide-react';
import { energyMonitor, EnergyMetric } from '../../services/EnergyMonitorService';
import { thermalEngine, ThermalState } from '../../services/ThermalEfficiencyEngine';
import './SustainabilityDashboard.css';

interface SustainProps {
  onBack: () => void;
}

export const SustainabilityDashboard: React.FC<SustainProps> = ({ onBack }) => {
  const [metrics, setMetrics] = useState<EnergyMetric>(energyMonitor.getMetrics());
  const [thermal, setThermal] = useState<ThermalState>(thermalEngine.getThermalState());

  useEffect(() => {
    const handler = (m: EnergyMetric) => {
      setMetrics(m);
      setThermal(thermalEngine.getThermalState());
    };

    energyMonitor.on('energy-updated', handler);
    return () => { energyMonitor.off('energy-updated', handler); };
  }, []);

  return (
    <div className="sustainability-container" role="main" aria-label="Sovereign Energy Grid">
      <header className="sustainability-header">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="btn-back" title="Go Back">
            <ArrowLeft size={24} />
          </button>
          <div className="sustainability-title">
            <h1>Energy-Grid <span className="opacity-40">// SUSTAINABILITY</span></h1>
            <p className="text-xs text-primary/60 font-black uppercase tracking-widest mt-1">
               Sovereign Computing Infrastructure v3580
            </p>
          </div>
        </div>

        <div className={`eco-mode-badge ${metrics.ecoMode ? 'active' : ''}`}>
           <Leaf size={14} className={metrics.ecoMode ? 'animate-bounce' : ''} />
           {metrics.ecoMode ? 'ECO-MODE: ENGAGED' : 'ECO-MODE: OPTIMIZED'}
        </div>
      </header>

      <div className="energy-grid">
        {/* Real-time Consumption */}
        <div className="metric-card-sustain">
           <CircularGauge 
             label="Grid Load" 
             value={metrics.currentConsumption} 
             max={100} 
             unit="kW" 
           />
           <div className="flex justify-between items-center mt-4 text-xs opacity-60">
             <span>SOURCE: {metrics.source.toUpperCase()}</span>
             <span className={metrics.status === 'stable' ? 'text-emerald-400' : 'text-amber-400'}>
               {metrics.status.toUpperCase()}
             </span>
           </div>
        </div>

        {/* NPU Thermal State */}
        <div className="metric-card-sustain">
          <div className="flex justify-between items-start mb-6">
            <h3 className="text-sm font-black uppercase text-secondary">NPU Thermal Core</h3>
            <Thermometer size={18} className={thermal.isThrottling ? 'text-red-500 animate-pulse' : 'text-emerald-500'} />
          </div>
          <div className="text-4xl font-black mb-2">{thermal.npuTemp}°C</div>
          <p className="text-[10px] opacity-40 uppercase font-bold">Hardware efficiency: {(thermal.efficiencyScore * 100).toFixed(1)}%</p>
          
          <ThermalMeter temp={thermal.npuTemp} />
          
          {thermal.isThrottling && (
            <div className="mt-4 p-2 bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-bold text-center rounded">
               PROACTIVE THROTTLING ENGAGED
            </div>
          )}
        </div>

        {/* Advanced Stats */}
        <div className="metric-card-sustain">
          <h3 className="text-sm font-black uppercase mb-6 opacity-60">Institutional KPIs</h3>
          <div className="space-y-4">
             <div className="flex justify-between items-center">
               <span className="text-xs uppercase font-bold">CO2 Offset</span>
               <span className="text-lg font-black text-emerald-400">+124 kg</span>
             </div>
             <div className="flex justify-between items-center">
               <span className="text-xs uppercase font-bold">Grid Stability</span>
               <span className="text-lg font-black text-blue-400">{metrics.voltage}V</span>
             </div>
             <div className="flex justify-between items-center">
               <span className="text-xs uppercase font-bold">NPU Load</span>
               <span className="text-lg font-black text-amber-400">{(metrics.npuLoad * 100).toFixed(0)}%</span>
             </div>
          </div>
        </div>
      </div>

      <div className="action-bar">
         <button 
           className="btn-eco-toggle" 
           onClick={() => energyMonitor.setEcoMode(!metrics.ecoMode)}
           title="Toggle System-wide Eco-Mode"
         >
           {metrics.ecoMode ? 'Release Throttle' : 'Engage Eco-Mode'}
         </button>
         <button className="btn-eco-toggle border-secondary text-secondary hover:bg-secondary hover:text-white" title="Optimize Grid Synchronization">
           <RefreshCw size={18} /> Sync Grid
         </button>
      </div>
    </div>
  );
};

const CircularGauge: React.FC<{ label: string; value: number; max: number; unit: string }> = ({ label, value, max, unit }) => {
  const fillRef = useRef<SVGCircleElement>(null);
  const radius = 45;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    if (fillRef.current) {
      const offset = circumference - (value / max) * circumference;
      fillRef.current.style.setProperty('--gauge-offset', `${offset}`);
    }
  }, [value]);

  return (
    <div className="circular-gauge-container">
      <svg className="gauge-svg" viewBox="0 0 100 100">
        <circle className="gauge-track" cx="50" cy="50" r={radius} />
        <circle 
          ref={fillRef as any}
          className="gauge-fill" 
          cx="50" cy="50" r={radius} 
        />
      </svg>
      <div className="gauge-value">
        {value.toFixed(1)}
        <div className="text-[10px] font-bold opacity-40 text-center">{unit}</div>
        <div className="text-[8px] font-black uppercase text-center mt-1 text-emerald-400">{label}</div>
      </div>
    </div>
  );
};

const ThermalMeter: React.FC<{ temp: number }> = ({ temp }) => {
  const barRef = useRef<HTMLDivElement>(null);
  const MAX_TEMP = 100;

  useEffect(() => {
    if (barRef.current) {
      const width = Math.min((temp / MAX_TEMP) * 100, 100);
      barRef.current.style.setProperty('--thermal-width', `${width}%`);
    }
  }, [temp]);

  return (
    <div className="thermal-meter-track">
      <div ref={barRef} className="thermal-meter-fill" />
    </div>
  );
};
