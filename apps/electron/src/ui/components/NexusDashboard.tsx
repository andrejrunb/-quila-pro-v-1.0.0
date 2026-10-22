import React, { useState, useEffect } from 'react';
import './NexusDashboard.css';

/**
 * NexusDashboard.tsx — Phase 1000 (Sovereign Governance)
 * A visualização central do enxame Áquila Pro.
 */
const NexusDashboard: React.FC = () => {
  const [nodes, setNodes] = useState<{id: string, status: 'online'|'offline', load: number}[]>([]);
  const [hoursSaved, setHoursSaved] = useState(1450);
  const [pulseFeed, setPulseFeed] = useState<string[]>([]);

  useEffect(() => {
    // MOCK: Simulação de dados do enxame via IPC
    setNodes([
      { id: 'Campus Alpha (Nexus)', status: 'online', load: 12 },
      { id: 'Terminal Bloco B', status: 'online', load: 45 },
      { id: 'Edge Hub Lab 1', status: 'online', load: 88 },
      { id: 'Coordenação Principal', status: 'online', load: 15 }
    ]);

    const interval = setInterval(() => {
      setHoursSaved(prev => prev + 0.5);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="nexus-container">
      <header className="nexus-header">
        <div className="nexus-title-group">
          <h1>Nexus: Consciência de Enxame</h1>
          <p>Ecossistema Áquila Pro 1.7.0 • Protocolo P2P Ativo</p>
        </div>
        <div className="nexus-status-badge">SOBERANIA ATIVA</div>
      </header>

      <div className="nexus-grid">
        {/* Widget 1: Topologia do Enxame */}
        <div className="nexus-card node-topology">
          <div className="card-header">Topologia da Malha P2P</div>
          <div className="node-map">
             {/* Simulação Visual: Grafo de Conexões */}
             <svg width="100%" height="200">
               <circle cx="50%" cy="50%" r="40" fill="rgba(0, 150, 255, 0.2)" stroke="#0096ff" strokeWidth="2" />
               <line x1="50%" y1="50%" x2="20%" y2="20%" stroke="rgba(0, 150, 255, 0.5)" strokeDasharray="5,5" />
               <line x1="50%" y1="50%" x2="80%" y2="20%" stroke="rgba(0, 150, 255, 0.5)" strokeDasharray="5,5" />
               <line x1="50%" y1="50%" x2="50%" y2="90%" stroke="rgba(0, 150, 255, 0.5)" strokeDasharray="5,5" />
               <circle cx="20%" cy="20%" r="10" fill="#00ffcc" />
               <circle cx="80%" cy="20%" r="10" fill="#00ffcc" />
               <circle cx="50%" cy="90%" r="10" fill="#ffcc00" />
             </svg>
             <div className="node-list">
               {nodes.map(n => (
                 <div key={n.id} className="node-item">
                   <span className={`dot ${n.status}`}></span>
                   <span className="node-name">{n.id}</span>
                   <span className="node-load">{n.load}%</span>
                 </div>
               ))}
             </div>
          </div>
        </div>

        {/* Widget 2: ROI Coletivo */}
        <div className="nexus-card collective-roi">
          <div className="card-header">ROI Institucional (Time Savings)</div>
          <div className="roi-value">{Math.floor(hoursSaved)}h</div>
          <div className="roi-label">Horas Docentes Salvas este mês</div>
          <div className="roi-chart-mock">
            <div className="bar" style={{height: '40%'}}></div>
            <div className="bar" style={{height: '65%'}}></div>
            <div className="bar" style={{height: '85%'}}></div>
            <div className="bar highlight" style={{height: '95%'}}></div>
          </div>
        </div>

        {/* Widget 3: Pulso de Inteligência (Swarm RAG) */}
        <div className="nexus-card pulse-feed">
          <div className="card-header">Pulso do Córtex (Swarm Intelligence)</div>
          <div className="feed-list">
            <div className="feed-item">
              <span className="tag">PEDAGÓGICO</span>
              <p>Padrão de frequência detectado no Campus B: 92% similar ao Bloco A.</p>
            </div>
            <div className="feed-item">
              <span className="tag security">SEGURANÇA</span>
              <p>Handshake SQS concluído: Nova chave ARK estabelecida com Terminal 04.</p>
            </div>
            <div className="feed-item">
              <span className="tag roi">AUTOPILOT</span>
              <p>Correção de 45 provas concluída no Edge Hub 1. Sincronizando notas...</p>
            </div>
          </div>
        </div>

        {/* Widget 4: Auto-Reparo e Integridade */}
        <div className="nexus-card self-healing">
          <div className="card-header">Integridade e Autocura</div>
          <div className="integrity-status">
            <div className="status-row">
              <span>Binários do Sistema (CRC)</span>
              <span className="val healthy">Íntegro</span>
            </div>
            <div className="status-row">
              <span>Firewall Soberano (SQS)</span>
              <span className="val healthy">Ativo</span>
            </div>
            <div className="status-row">
              <span>Shard Redundancy</span>
              <span className="val">33% (Surplus)</span>
            </div>
          </div>
          <button className="repair-btn">Executar Auditoria de Enxame</button>
        </div>
      </div>
    </div>
  );
};

export default NexusDashboard;
