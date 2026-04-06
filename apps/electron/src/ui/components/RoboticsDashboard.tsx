import React, { useState, useEffect } from 'react';
import { Navigation, Battery, Radio, Crosshair, Map as MapIcon, Power } from 'lucide-react';
import { useRobotics } from '../hooks/useRobotics';
import './RoboticsDashboard.css';

/**
 * Phase 600: RoboticsDashboard
 * Centro de controle tático para unidades de patrulha autônoma.
 */
export const RoboticsDashboard: React.FC = () => {
  const { units, loading, sendCommand } = useRobotics();

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
    sendCommand(id, cmd);
  };

  if (loading && units.length === 0) {
    return <div className="loading-container">Iniciando Link de Telemetria...</div>;
  }

  return (
    <div className="robotics-dashboard page-transition">
      <header className="robotics-header">
        <div className="robotics-header-title">
          <div className="robotics-icon-box">
            <Radio size={24} className="robotics-icon-pulse" />
          </div>
          <div className="robotics-title-stack">
            <h2 className="robotics-main-title">EAGLE EYE CONTROL</h2>
            <p className="robotics-sub-title">Sistemas Robóticos de Resposta</p>
          </div>
        </div>
        <div className="system-status-pill">LINK ATIVO: 32ms</div>
      </header>

      <div className="robotics-grid">
        <div className="tactical-map-area">
          <div className="map-placeholder">
            <div className="map-grid-lines" />
            <MapIcon size={48} className="map-placeholder-icon" />
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
                <Battery size={14} className={`battery-icon ${unit.battery < 20 ? 'critical' : 'healthy'}`} />
                <div className="flex-1">
                  <div className="stat-info-row">
                    <span>Carga</span>
                    <span>{unit.battery.toFixed(1)}%</span>
                  </div>
                  <div className="progress-bar">
                    <div 
                      key={unit.id}
                      style={{ '--progress-width': `${unit.battery}%` } as React.CSSProperties}
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
