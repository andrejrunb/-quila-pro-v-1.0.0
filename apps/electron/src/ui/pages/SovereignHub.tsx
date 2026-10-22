import React, { useState, useEffect } from 'react';
import { Cpu, Globe, ShieldCheck, Zap, Activity, Hexagon, Compass } from 'lucide-react';
import './SovereignHub.css';

export const SovereignHub: React.FC = () => {
  const [status, setStatus] = useState<any>(null);
  const [pulse, setPulse] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchHeartbeat();
      setPulse(p => (p + 1) % 100);
    }, 3000);
    fetchHeartbeat();
    return () => clearInterval(interval);
  }, []);

  const fetchHeartbeat = async () => {
    try {
      const data = await (window as any).api.invoke('consciousness:get-heartbeat');
      setStatus(data);
    } catch (err) {
      console.error('Erro ao obter heartbeat:', err);
    }
  };

  if (!status) return <div className="hub-loading">Sincronizando Consciência...</div>;

  return (
    <div className="sovereign-hub">
      <div className="background-orbit"></div>
      
      <header className="hub-header">
        <Hexagon className="hub-logo icon-spin" size={40} />
        <div className="hub-title-group">
          <h1>ÁQUILA PRO <span className="highlight">OS</span></h1>
          <p>ECOSISTEMA SOBERANO AUTÔNOMO • MATURIDADE NÍVEL 10</p>
        </div>
      </header>

      <main className="hub-core">
        {/* Orbe Central de Consciência */}
        <div className="consciousness-orb">
          <div className="orb-inner">
            <div className="orb-pulse" style={{ opacity: status.resourceHealth / 100 }}></div>
            <Activity size={48} className="orb-icon" />
          </div>
          <div className="orb-label">SAÚDE SISTÊMICA</div>
          <div className="orb-value">{status.resourceHealth.toFixed(1)}%</div>
        </div>

        {/* Anéis de Cluster */}
        <div className="cluster-grid">
          <div className="cluster-node evolution">
            <Cpu size={24} />
            <span>EVOLUÇÃO</span>
            <div className="node-bar"><div className="fill" style={{ width: `${status.evolutionLevel}%` }}></div></div>
          </div>

          <div className="cluster-node swarm">
            <Globe size={24} />
            <span>FEDERAÇÃO</span>
            <div className="node-bar"><div className="fill" style={{ width: `${status.swarmConnectivity}%` }}></div></div>
          </div>

          <div className="cluster-node resilience">
            <ShieldCheck size={24} />
            <span>RESILIÊNCIA</span>
            <div className="node-bar"><div className="fill" style={{ width: `${status.resilienceIndex}%` }}></div></div>
          </div>

          <div className="cluster-node outcome">
            <Zap size={24} />
            <span>RESULTADOS</span>
            <div className="node-bar"><div className="fill" style={{ width: `${status.outcomeSuccessRate * 10}%` }}></div></div>
          </div>
        </div>
      </main>

      <footer className="hub-footer">
        <div className="status-item">
          <Compass size={16} />
          <span>MODO: AUTONOMIA PLENA</span>
        </div>
        <div className="status-item">
          <div className="dot-green"></div>
          <span>SISTEMA SELADO & SOBERANO</span>
        </div>
      </footer>
    </div>
  );
};
