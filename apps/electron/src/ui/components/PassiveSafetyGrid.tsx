import React, { useEffect, useState } from 'react';
import '../styles/PassiveSafetyGrid.css';

/**
 * PASSIVE SAFETY GRID (v4002)
 * ---------------------------
 * Visualiza presenças em áreas "cegas" (sem câmeras) via WiFi CSI.
 * Renderização puramente vetorial para LGPD e Privacidade MÁXIMA.
 */
export const PassiveSafetyGrid: React.FC = () => {
  const [ghosts, setGhosts] = useState<any[]>([]);
  const [zones] = useState([
    { id: 'WC_MASC_L3', label: 'WC Masculino L3' },
    { id: 'VESTIARIO_SUL', label: 'Vestiário Sul' },
    { id: 'COZINHA_PRO_B', label: 'Cozinha Refeitório' },
    { id: 'BIBLIOTECA_ALMA', label: 'Canto Biblioteca' }
  ]);

  useEffect(() => {
    // Listen for real-time passive detection events
    const unsubscribe = window.aquila.onGhostDetected((data: any) => {
      setGhosts(data || []);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <div className="passive-safety-panel">
      <div className="panel-header">
        <h3 className="hive-title hive-panel-title">MALHA PASSIVA DENSEPOSE (CSI)</h3>
        <div className="sensor-status-badge">SISTEMA ATIVO (v4002)</div>
      </div>

      <div className="zones-layout">
        {zones.map(zone => {
          const zoneGhosts = ghosts.filter(g => g.zoneId === zone.id);
          const hasFall = zoneGhosts.some(g => g.posture === 'FALLEN');

          return (
            <div key={zone.id} className={`safety-zone-card ${hasFall ? 'fall-alert' : ''}`}>
              <div className="zone-label">{zone.label}</div>
              
              {/* Radar Vetorial 2D (Soberania de Dados) */}
              <div className="radar-view">
                 <div className="radar-content">
                    {zoneGhosts.map(ghost => (
                      <div 
                        key={ghost.id} 
                        className={`ghost-blip ${ghost.posture === 'FALLEN' ? ' fallen-blip' : ''}`}
                        style={{
                          '--ghost-x': `${(ghost.x / 20) * 100}%`,
                          '--ghost-y': `${(ghost.y / 10) * 100}%`
                        } as React.CSSProperties}
                      />
                    ))}
                    <div className="radar-sweep" />
                 </div>
              </div>

              <div className="zone-stats">
                 <span className="ghost-count">{zoneGhosts.length} Presença(s)</span>
                 <span className="zone-health">{hasFall ? 'QUEDA DETECTADA' : 'NORMAL'}</span>
              </div>
            </div>
          );
        })}
      </div>

      <p className="privacy-disclaimer">
        ⚠️ MONITORAMENTO POR ASSINATURA DE RÁDIO (CSI). NENHUMA IMAGEM É CAPTURADA NESTAS ÁREAS.
      </p>
    </div>
  );
};
