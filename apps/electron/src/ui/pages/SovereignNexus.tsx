import React, { useState, useEffect } from 'react';
import { 
  Globe, 
  Share2, 
  ShieldCheck, 
  Activity, 
  Zap, 
  Server,
  Lock,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import './SovereignNexus.css';

interface FederationNode {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'syncing';
  lastSync: Date;
  reputation: number;
  accuracy?: number;
}

const SovereignNexus: React.FC = () => {
  const [nodes, setNodes] = useState<FederationNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<FederationNode | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [swarmIntegrity, setSwarmIntegrity] = useState(98.5);
  const [isIsolated, setIsIsolated] = useState(false);
  const [securityAlerts, setSecurityAlerts] = useState<string[]>([]);

  useEffect(() => {
    // Simula carregamento de nós da federação via IPC
    const mockNodes: FederationNode[] = [
      { id: 'hub-002', name: 'Áquila Hub — Unidade Sul', status: 'online', lastSync: new Date(), reputation: 0.98, accuracy: 0.96 },
      { id: 'hub-003', name: 'Áquila Hub — Unidade Leste', status: 'online', lastSync: new Date(), reputation: 0.95, accuracy: 0.92 },
      { id: 'hub-004', name: 'Áquila Hub — Escola Estadual Nexus', status: 'syncing', lastSync: new Date(), reputation: 0.99, accuracy: 0.98 },
      { id: 'hub-005', name: 'Áquila Hub — Colégio Central', status: 'online', lastSync: new Date(), reputation: 0.97, accuracy: 0.94 }
    ];
    setNodes(mockNodes);

    const interval = setInterval(() => {
      setSwarmIntegrity(prev => Math.min(100, prev + (Math.random() * 0.2 - 0.1)));
    }, 5000);

    // Listen for isolation events
    const unsubscribe = window.aquila.onIsolationStatus((data) => {
      setIsIsolated(data.isolated);
      if (data.reason) {
        setSecurityAlerts(prev => [...prev, data.reason]);
      }
    });

    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, []);

  const triggerSync = () => {
    setIsSyncing(true);
    setTimeout(() => setIsSyncing(false), 3000);
  };

  return (
    <div className="nexus-container">
      <header className="nexus-header">
        <div className="header-title">
          <Globe className={`icon-pulse ${isIsolated ? 'isolated' : ''}`} size={40} />
          <div>
            <h1>Sovereign Nexus {isIsolated && <span style={{ color: '#ef4444', fontSize: '1rem' }}>(ISOLADO)</span>}</h1>
            <p className="subtitle">Malha de Inteligência Federada P2P (Nível 12)</p>
          </div>
        </div>
        <div className="swarm-stats">
          <div className="stat-card">
            <Activity size={20} />
            <span>Integridade do Enxame</span>
            <strong>{swarmIntegrity.toFixed(1)}%</strong>
          </div>
          <button 
            className={`sync-btn ${isSyncing ? 'loading' : ''}`}
            onClick={triggerSync}
          >
            <RefreshCw size={18} />
            {isSyncing ? 'Sincronizando...' : 'Sincronizar Malha'}
          </button>
        </div>
      </header>

      <div className="nexus-grid">
        <section className="mesh-visualization">
          <div className="mesh-card">
            <h3>Visualização da Malha (P2P Mesh)</h3>
            <div className="mesh-graph-container">
              <svg className="connection-lines">
                {nodes.map((node, i) => (
                  <line 
                    key={`line-${node.id}`}
                    x1="50%" y1="50%" 
                    x2={i % 2 === 0 ? (i < 2 ? "10%" : "20%") : (i < 2 ? "90%" : "80%")} 
                    y2={i < 2 ? (i % 2 === 0 ? "10%" : "15%") : (i % 2 === 0 ? "80%" : "85%")}
                    className="wisdom-pulse-line"
                  />
                ))}
              </svg>

              <div className="central-node">
                <ShieldCheck size={48} color="#60a5fa" />
                <span>Local Hub</span>
              </div>

              {nodes.map((node, i) => (
                <div 
                  key={node.id} 
                  className={`remote-node node-${i} ${selectedNode?.id === node.id ? 'selected' : ''}`}
                  style={{ '--delay': `${i * 0.5}s` } as any}
                  onClick={() => setSelectedNode(node)}
                >
                  <Server size={24} />
                  <div className="node-info">
                    <span className="node-name">{node.name}</span>
                    <span className={`node-status ${node.status}`}>{node.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <aside className="federation-details">
          {selectedNode ? (
            <div className="node-details-panel">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Server size={18} color="#3b82f6" /> Telemetria
                </h4>
                <button 
                  onClick={() => setSelectedNode(null)}
                  style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1.2rem' }}
                >
                  &times;
                </button>
              </div>

              <div className="detail-row">
                <span className="detail-label">Nome do Hub</span>
                <span className="detail-value">{selectedNode.name}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Reputação (PoS)</span>
                <span className="detail-value">{(selectedNode.reputation * 100).toFixed(1)}%</span>
              </div>
              <div className="reputation-meter">
                <div className="reputation-fill" style={{ width: `${selectedNode.reputation * 100}%` }}></div>
              </div>
              <div className="detail-row" style={{ marginTop: '1rem' }}>
                <span className="detail-label">Precisão Local</span>
                <span className="detail-value">{selectedNode.accuracy ? `${(selectedNode.accuracy * 100).toFixed(1)}%` : 'N/A'}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Status Global</span>
                <span className="detail-value" style={{ color: selectedNode.status === 'online' ? '#10b981' : '#3b82f6' }}>
                  {selectedNode.status.toUpperCase()}
                </span>
              </div>

              <div className="insight-entry" style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '1rem', borderRadius: '1rem', marginTop: '1rem' }}>
                <Zap size={16} />
                <p>Nó verificado. Contribuindo com pesos para o consenso regional via malha segura.</p>
              </div>
            </div>
          ) : (
            <>
              <div className="security-card">
                <Lock size={24} color="#10b981" />
                <h4>Segurança de Federação</h4>
                <p>Protocolo: <strong>PoS (Proof of Sovereignty)</strong></p>
                <p>Criptografia: <strong>AES-256 Quantum-Resistant</strong></p>
                <p>Anonimização: <strong>Differential Privacy Ativa</strong></p>
              </div>

              <div className="nodes-list-card">
                <h3>Hubs Conectados</h3>
                <div className="nodes-scroll">
                  {nodes.map(node => (
                    <div 
                      key={node.id} 
                      className={`node-item ${selectedNode?.id === node.id ? 'active' : ''}`}
                      onClick={() => setSelectedNode(node)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="node-main">
                        <span className={`status-dot ${node.status}`}></span>
                        <span className="node-name">{node.name}</span>
                      </div>
                      <div className="node-meta">
                        <span className="reputation">{(node.reputation * 100).toFixed(0)}% Rep.</span>
                        <span className="sync-time">Last: {node.lastSync.toLocaleTimeString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          <div className="swarm-insights">
            <h3>Insights do Enxame</h3>
            {securityAlerts.map((alert, i) => (
              <div key={i} className="insight-entry" style={{ color: '#ef4444' }}>
                <AlertTriangle size={16} />
                <p>{alert}</p>
              </div>
            ))}
            <div className="insight-entry">
              <Zap size={16} />
              <p>Calibração regional detectou desvio em 'Comportamento'. Pesos ajustados.</p>
            </div>
            <div className="insight-entry">
              <Share2 size={16} />
              <p>Nova tendência de evasão identificada no Cluster Sul. Alerta preventivo ativo.</p>
            </div>
          </div>
          
          {isIsolated && (
            <div className="security-card" style={{ marginTop: '1rem', borderColor: '#ef4444', background: 'rgba(239, 68, 68, 0.1)' }}>
              <ShieldCheck size={24} color="#ef4444" />
              <h4 style={{ color: '#ef4444' }}>Modo Air-Gap Ativo</h4>
              <p>O Hub local cortou comunicações com a federação para proteger a integridade do modelo.</p>
              <button 
                onClick={() => setIsIsolated(false)}
                style={{ marginTop: '1rem', background: '#ef4444', border: 'none', color: 'white', padding: '0.5rem 1rem', borderRadius: '0.5rem', cursor: 'pointer' }}
              >
                Restaurar Conexão
              </button>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};

export default SovereignNexus;
