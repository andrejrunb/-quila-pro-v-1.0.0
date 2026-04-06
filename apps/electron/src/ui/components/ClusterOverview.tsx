import React from 'react';
import { Network, Activity, Shield, Users, Server, Zap, AlertCircle } from 'lucide-react';
import './ClusterOverview.css';

import NeuralShardVisualizer from './NeuralShardVisualizer';

interface ClusterNode {
  id: string;
  name: string;
  status: 'ONLINE' | 'OFFLINE' | 'WARNING';
  load: number;
  activeAgents: number;
  lastSync: string;
}

const ClusterOverview: React.FC = () => {
  const nodes: ClusterNode[] = [
    { id: 'node-01', name: 'Unidade HQ (Brasilia)', status: 'ONLINE', load: 45, activeAgents: 12, lastSync: '12s ago' },
    { id: 'node-02', name: 'Unidade Sul (Taguatinga)', status: 'WARNING', load: 88, activeAgents: 8, lastSync: '45s ago' },
    { id: 'node-03', name: 'Unidade Norte (Sobradinho)', status: 'ONLINE', load: 32, activeAgents: 6, lastSync: '2m ago' },
    { id: 'node-04', name: 'Unidade Leste (Paranoá)', status: 'OFFLINE', load: 0, activeAgents: 0, lastSync: '6h ago' },
  ];

  return (
    <div className="cluster-overview h-full overflow-y-auto">
      <div className="cluster-metrics-grid">
        <div className="metric-card glass">
          <div className="metric-icon"><Shield size={24} /></div>
          <div className="metric-data">
            <span className="label">Total Protegido</span>
            <span className="value">4.2k <small>Alunos</small></span>
          </div>
        </div>
        <div className="metric-card glass">
          <div className="metric-icon"><Activity size={24} /></div>
          <div className="metric-data">
            <span className="label">Eventos/Min</span>
            <span className="value">128 <small>Pico</small></span>
          </div>
        </div>
        <div className="metric-card glass">
          <div className="metric-icon"><Server size={24} /></div>
          <div className="metric-data">
            <span className="label">Saúde do Enxame</span>
            <span className="value">92%</span>
          </div>
        </div>
        <div className="metric-card glass">
          <div className="metric-icon"><Zap size={24} /></div>
          <div className="metric-data">
            <span className="label">Economia NPU</span>
            <span className="value">74%</span>
          </div>
        </div>
      </div>

      <div className="nodes-container">
        <div className="section-header">
          <h2>Nós do Enxame (Swarm Nodes)</h2>
          <div className="node-stats">
            <span className="online">3 Online</span>
            <span className="offline">1 Offline</span>
          </div>
        </div>
        
        <div className="nodes-grid">
          {nodes.map(node => (
            <div key={node.id} className={`node-card glass ${node.status.toLowerCase()}`}>
              <div className="node-header">
                <Network size={20} />
                <h3>{node.name}</h3>
                <div className={`status-badge ${node.status.toLowerCase()}`}>{node.status}</div>
              </div>
              
              <div className="node-body">
                <div className="stat">
                  <span>Carga do Kernel</span>
                  <div className="progress-bar">
                    <div 
                      className="fill" 
                      style={{ 
                        '--fill-width': `${node.load}%`,
                        '--fill-bg': node.load > 80 ? '#ef4444' : '#10b981'
                      } as React.CSSProperties}
                    ></div>
                  </div>
                </div>
                <div className="stat-row">
                  <div className="sub-stat">
                    <Users size={14} />
                    <span>{node.activeAgents} Agentes</span>
                  </div>
                  <div className="sub-stat">
                    <Activity size={14} />
                    <span>{node.lastSync}</span>
                  </div>
                </div>
              </div>
              
              {node.status === 'WARNING' && (
                <div className="node-alert">
                  <AlertCircle size={14} />
                  <span>Alta latência de inferência detectada</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Monitor de Neural Sharding (v3901) */}
      <div className="sharding-monitor mt-12 pb-12">
        <div className="section-header">
          <h2>Monitoramento de Neural Sharding</h2>
          <p className="text-xs text-slate-500">Visualização de fragmentos de pesos entre unidades do enxame</p>
        </div>
        <NeuralShardVisualizer />
      </div>
    </div>
  );
};

export default ClusterOverview;
