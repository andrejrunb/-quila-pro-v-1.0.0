import React, { useEffect, useState, useRef } from 'react';
import { Activity, Shield, Zap, Globe } from 'lucide-react';
import './GlobalPulseHUD.css';

/**
 * GlobalPulseHUD (v1.0.0)
 * Persistent Heads-Up Display for Ecosystem Monitoring.
 */
export const GlobalPulseHUD: React.FC = () => {
  const [cpuLoad, setCpuLoad] = useState(24);
  const [networkLatency, setNetworkLatency] = useState(12);
  const [activeIncidents, setActiveIncidents] = useState(0);
  const gaugeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (gaugeRef.current) {
      gaugeRef.current.style.setProperty('--cpu-load', `${cpuLoad}%`);
    }
  }, [cpuLoad]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCpuLoad(Math.floor(20 + Math.random() * 15));
      setNetworkLatency(Math.floor(8 + Math.random() * 8));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="global-pulse-hud">
      <div className="hud-section network">
        <Globe size={14} className="hud-icon text-blue-400" />
        <div className="hud-data">
          <span className="hud-label">Sovereign Net</span>
          <span className="hud-value">{networkLatency}ms</span>
        </div>
      </div>

      <div className="hud-divider"></div>

      <div className="hud-section neural">
        <Zap size={14} className="hud-icon text-amber-400 pulse-icon" />
        <div className="hud-data">
          <span className="hud-label">Neural Core</span>
          <span className="hud-value">{cpuLoad}%</span>
        </div>
        <div className="mini-gauge">
          <div className="mini-fill" ref={gaugeRef}></div>
        </div>
      </div>

      <div className="hud-divider"></div>

      <div className="hud-section security">
        <Shield size={14} className="hud-icon text-emerald-400" />
        <div className="hud-data">
          <span className="hud-label">Security</span>
          <span className="hud-value">{activeIncidents === 0 ? 'ENCHIPED' : 'ALERT'}</span>
        </div>
      </div>
      
      <div className="hud-system-time">
        <Activity size={12} className="mr-1 opacity-50" />
        {new Date().toLocaleTimeString('pt-BR', { hour12: false })}
      </div>
    </div>
  );
};

export default GlobalPulseHUD;
