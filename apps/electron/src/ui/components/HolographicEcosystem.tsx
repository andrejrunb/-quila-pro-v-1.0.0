import React, { useEffect, useState } from 'react';
import '../styles/SovereignEagleUX.css';

/**
 * HOLOGRAPHIC ECOSYSTEM (v3647)
 * ----------------------------
 * Componente principal do Comando Central.
 * Renderiza o mapa de nós interconectados do Áquila Pro.
 */
export const HolographicEcosystem: React.FC = () => {
  const [swarm, setSwarm] = useState<any>(null);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    const fetchSwarm = async () => {
      // @ts-ignore
      const result = await window.electron.invoke('swarm:get-global-ecosystem');
      if (result.success) setSwarm(result.data);
    };

    fetchSwarm();
    const interval = setInterval(() => {
      fetchSwarm();
      setCurrentTime(new Date().toLocaleTimeString());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  if (!swarm) return <div className="eagle-command-center">Iniciando Córtex Central...</div>;

  return (
    <div className="eagle-command-center">
      {/* HEADER ESTATÍSTICO (v3510) */}
      <header className="holographic-card eagle-header">
        <div>
          <h1 className="eagle-title">ÁQUILA PRO | GLOBAL COMMAND CENTER</h1>
          <p className="metric-label">STATUS: ENXAME SOBERANO ATIVO - {currentTime}</p>
        </div>
        <div className="eagle-header-stats">
          <div className="integrity-seal-gold">LEDGER VERIFIED 99.8% | QUANTUM SHIELD ACTIVE</div>
          <div className="metric-value">{swarm.activeNodes}/{swarm.totalUnits} NÓS ONLINE | P2P MESH ENABLED</div>
        </div>
      </header>

      {/* MAPA DE NÓS (SIMULAÇÃO VISUAL v3510) */}
      <main className="unit-grid">
        {swarm.units.map((unit: any) => (
          <div key={unit.id} className="holographic-card">
            <div className="unit-info-header">
              <div className={`unit-node ${unit.status !== 'active' ? 'offline' : ''}`} />
              <h3 className="unit-name">{unit.name}</h3>
            </div>
            
            <div className="unit-metrics-grid">
              <div>
                <p className="metric-label">CARGA NPU</p>
                <div className="metric-value" data-overload={unit.npuLoad > 80}>
                  {unit.npuLoad.toFixed(1)}%
                </div>
              </div>
              <div>
                <p className="metric-label">TEMPERATURA</p>
                <div className="metric-value">{unit.npuTemp.toFixed(1)}°C</div>
              </div>
              <div>
                <p className="metric-label">STUDENTS</p>
                <div className="metric-value">{unit.activeStudents} ACTIVE</div>
              </div>
              <div>
                <p className="metric-label">SYNC</p>
                <div className="metric-value metric-sync-text">{unit.lastSync}</div>
              </div>
            </div>

            <div className="data-stream-glow" />
          </div>
        ))}
      </main>

      {/* FOOTER DE TELEMETRIA NPU (951-1000) */}
      <footer className="holographic-card eagle-footer">
        AVERAGE SWARM LOAD: {(swarm.units.reduce((a: any, b: any) => a + b.npuLoad, 0) / swarm.totalUnits).toFixed(2)}% | 
        DISTRIBUTED AI CHUNKER: OPERATIONAL | v3510
      </footer>
    </div>
  );
};
