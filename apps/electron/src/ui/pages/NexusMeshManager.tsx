import React, { useState, useEffect } from 'react';
import { 
  Share2, 
  ShieldCheck, 
  Zap, 
  Activity, 
  Database, 
  Globe, 
  RefreshCw,
  Cpu
} from 'lucide-react';
import './NexusMeshManager.css';

interface MeshNode {
  id: string;
  name: string;
  ip: string;
  status: 'online' | 'offline' | 'throttled';
  role: string;
  latency: string;
}

const NexusMeshManager: React.FC = () => {
  const [nodes, setNodes] = useState<MeshNode[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [systemInfo, setSystemInfo] = useState<any>(null);
  const [federationStats, setFederationStats] = useState({
    totalLocalKnowledge: 0,
    totalFederatedInsights: 0,
    quantumSafeness: 'Verified'
  });

  useEffect(() => {
    // Simulação de carregamento de dados da malha via IPC
    const mockNodes: MeshNode[] = [
      { id: '1', name: 'Eagle Hub Alpha (Main)', ip: '192.168.1.10', status: 'online', role: 'Main Gateway', latency: '2ms' },
      { id: '2', name: 'Campus Sul Node', ip: '10.0.5.21', status: 'online', role: 'Satellite Unit', latency: '15ms' },
      { id: '3', name: 'Campus Norte Node', ip: '10.0.6.42', status: 'throttled', role: 'Satellite Unit', latency: '45ms' }
    ];
    setNodes(mockNodes);
    
    setFederationStats({
      totalLocalKnowledge: 1242,
      totalFederatedInsights: 458,
      quantumSafeness: 'Quantum Shield Active'
    });

    const fetchSystemInfo = async () => {
      try {
        const info = await (window as any).aquila.invoke('get-system-info');
        setSystemInfo(info);
      } catch (err) {
        console.error('Falha ao buscar telemetria do hardware:', err);
      }
    };
    fetchSystemInfo();
    const interval = setInterval(fetchSystemInfo, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSyncAll = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      // Aqui chamaria window.ipcRenderer.invoke('mesh:sync-all')
    }, 3000);
  };

  return (
    <div className="nexus-manager-container animate-fade-in">
      <header className="nexus-header">
        <div className="header-info">
          <h1>Nexus Network Federation</h1>
          <p className="subtitle">Gestora de Inteligência Coletiva e Malha Soberana</p>
        </div>
        <div className="nexus-status-badge">
          <Globe className="icon-pulse" />
          <span>Sovereign Bridge ACTIVE</span>
        </div>
      </header>

      <div className="nexus-grid">
        {/* Visualização da Teia (Mock SVG) */}
        <section className="mesh-visualization glass-card">
          <div className="card-header">
            <Share2 size={20} />
            <h2>Topologia da Malha</h2>
          </div>
          <div className="mesh-graph-container">
            <svg viewBox="0 0 400 300" className="mesh-svg">
               {/* Linhas de Conexão */}
               <line x1="200" y1="150" x2="100" y2="80" className="mesh-line active" />
               <line x1="200" y1="150" x2="300" y2="80" className="mesh-line throttled" />
               <line x1="200" y1="150" x2="200" y2="250" className="mesh-line active" />
               
               {/* Nodes */}
               <circle cx="200" cy="150" r="10" className="node-center" />
               <circle cx="100" cy="80" r="8" className="node-satellite" />
               <circle cx="300" cy="80" r="8" className="node-satellite throttled" />
               <circle cx="200" cy="250" r="8" className="node-satellite" />
               
               <text x="180" y="130" className="node-label">Local Hub</text>
            </svg>
          </div>
          <div className="mesh-info-footer">
            <p><Activity size={12} /> 3 Hubs Conectados</p>
            <p><Zap size={12} /> 0.8ms Latência Nominal</p>
          </div>
        </section>

        {/* Estatísticas de Federação */}
        <section className="federation-stats glass-card">
          <div className="card-header">
            <Database size={20} />
            <h2>Inteligência Federada</h2>
          </div>
          <div className="stats-list">
            <div className="stat-item highlight">
              <span className="stat-label">Conhecimento Local</span>
              <span className="stat-value">{federationStats.totalLocalKnowledge} Nuggets</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Insights do Nexus</span>
              <span className="stat-value">+{federationStats.totalFederatedInsights} Novos</span>
            </div>
            <div className="stat-item security">
              <ShieldCheck size={16} />
              <span>{federationStats.quantumSafeness}</span>
            </div>
            {systemInfo && (
              <>
                <div className="stat-item">
                  <span className="stat-label">NPU Acelerator</span>
                  <span className="stat-value text-accent font-black" style={{ color: '#10B981' }}>{systemInfo.npu?.tops} TOPS ({systemInfo.npu?.status})</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">NPU Active Load</span>
                  <span className="stat-value">{systemInfo.npu?.load}% Load</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Sovereign RAM</span>
                  <span className="stat-value">{systemInfo.memory?.total - systemInfo.memory?.free}GB / {systemInfo.memory?.total}GB</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">CPU Cores</span>
                  <span className="stat-value">{systemInfo.cpu?.cores} Cores ({systemInfo.cpu?.load}% Load)</span>
                </div>
              </>
            )}
          </div>
          <button 
            className={`sync-button ${isSyncing ? 'syncing' : ''}`}
            onClick={handleSyncAll}
            disabled={isSyncing}
          >
            <RefreshCw size={18} />
            {isSyncing ? 'Sincronizando Nexus...' : 'Forçar Sincronia Global'}
          </button>
        </section>
      </div>

      {/* Lista de Hubs */}
      <section className="nexus-nodes-list glass-card">
        <div className="card-header">
          <Cpu size={20} />
          <h2>Hub Registry (Sovereign Swarm)</h2>
        </div>
        <table className="nexus-table">
          <thead>
            <tr>
              <th>Status</th>
              <th>Nome da Unidade</th>
              <th>IP de Malha</th>
              <th>Papel</th>
              <th>Integridade</th>
            </tr>
          </thead>
          <tbody>
            {nodes.map(node => (
              <tr key={node.id}>
                <td>
                  <span className={`status-dot ${node.status}`}></span>
                  {node.status.toUpperCase()}
                </td>
                <td className="node-name">{node.name}</td>
                <td className="node-ip">{node.ip}</td>
                <td>{node.role}</td>
                <td className="node-latency">
                   <div className="latency-bar">
                      <div className="latency-fill" style={{ width: node.status === 'throttled' ? '80%' : '20%' }}></div>
                   </div>
                   {node.latency}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
};

export default NexusMeshManager;
