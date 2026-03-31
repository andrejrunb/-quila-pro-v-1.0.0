import React, { useState, useEffect } from 'react';
import { Navigation, Battery, Radio, Crosshair, Map as MapIcon, Power } from 'lucide-react';
import { roboticsBridge, RobotTelemetry } from '../../services/RoboticsBridge';
import './RoboticsDashboard.css';

/**
 * Phase 600: RoboticsDashboard
 * Centro de controle tático para unidades de patrulha autônoma.
 */
export const RoboticsDashboard: React.FC = () => {
  const [units, setUnits] = useState<RobotTelemetry[]>(roboticsBridge.getUnits());

  useEffect(() => {
    const handleUpdate = (data: RobotTelemetry[]) => setUnits([...data]);
    roboticsBridge.on('telemetry-update', handleUpdate);
    return () => {
      roboticsBridge.removeListener('telemetry-update', handleUpdate);
    };
  }, []);

  const markerRefs = React.useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    units.forEach(u => {
      const el = markerRefs.current[u.id];
      if (el) {
        el.style.setProperty('--unit-x', `${50 + u.position.x}%`);
        el.style.setProperty('--unit-y', `${50 + u.position.y}%`);
        el.style.setProperty('--unit-heading', `${u.heading}deg`);
      }
    });
  }, [units]);

  const handleAction = (id: string, cmd: any) => {
    roboticsBridge.sendCommand(id, cmd);
  };

  return (
    <div className="robotics-dashboard page-transition">
      <header className="robotics-header">
        <div className="flex items-center gap-3">
          <div className="robotics-icon-box">
            <Radio size={24} className="text-blue-500 animate-pulse" />
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tight">EAGLE EYE CONTROL</h2>
            <p className="text-[10px] uppercase text-slate-500 tracking-[0.2em]">Sistemas Robóticos de Resposta</p>
          </div>
        </div>
        <div className="system-status-pill">LINK ATIVO: 32ms</div>
      </header>

      <div className="robotics-grid">
        <div className="tactical-map-area">
          <div className="map-placeholder">
            <div className="map-grid-lines" />
            <MapIcon size={48} className="text-slate-800 absolute opacity-20" />
            <div className="map-center-aim" />
            
            {/* Renderizar Unidades no Mapa */}
            {units.map(u => (
              <div 
                key={u.id} 
                ref={el => markerRefs.current[u.id] = el}
                className={`unit-marker status-${u.status}`}
              >
                <div className="marker-core" />
                <div className="marker-label">{u.id}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="unit-telemetry-list">
          {units.map(unit => (
            <div key={unit.id} className="telemetry-card">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-sm">{unit.id}</h3>
                  <span className="text-[9px] uppercase font-bold text-blue-400">{unit.type}</span>
                </div>
                <div className={`status-dot ${unit.status}`} />
              </div>

              <div className="stat-row">
                <Battery size={14} className={unit.battery < 20 ? 'text-red-500' : 'text-emerald-500'} />
                <div className="flex-1">
                  <div className="flex justify-between text-[10px] mb-1">
                    <span>Carga</span>
                    <span>{unit.battery.toFixed(1)}%</span>
                  </div>
                  <div className="progress-bar">
                    <div 
                      ref={el => {
                        if (el) el.style.setProperty('--unit-battery', `${unit.battery}%`);
                      }}
                      className="progress-fill" 
                    />
                  </div>
                </div>
              </div>

              <div className="stat-grid-mini">
                <div className="mini-stat">
                  <span className="label">ALT</span>
                  <span className="value">{unit.position.alt}m</span>
                </div>
                <div className="mini-stat">
                  <span className="label">POS</span>
                  <span className="value">{unit.position.x.toFixed(0)},{unit.position.y.toFixed(0)}</span>
                </div>
              </div>

              <div className="unit-actions mt-4">
                {unit.status === 'docked' ? (
                  <button 
                    className="cmd-btn takeoff"
                    onClick={() => handleAction(unit.id, 'TAKEOFF')}
                  >
                    <Navigation size={14} /> DECOLAGEM
                  </button>
                ) : (
                  <button 
                    className="cmd-btn rtl"
                    onClick={() => handleAction(unit.id, 'RTL')}
                  >
                    <Power size={14} /> RETORNAR
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
