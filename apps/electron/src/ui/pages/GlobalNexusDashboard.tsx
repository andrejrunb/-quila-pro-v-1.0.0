import React, { useState, useEffect } from 'react';
import { 
  Globe, 
  Share2, 
  ShieldCheck, 
  Zap, 
  Download, 
  Users,
  Activity,
  Box
} from 'lucide-react';
import './GlobalNexusDashboard.css';

const GlobalNexusDashboard: React.FC = () => {
  const [peers, setPeers] = useState<any[]>([]);
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const p = await (window as any).aquila.invoke('nexus:list-peers');
      const a = await (window as any).aquila.invoke('nexus:list-assets');
      setPeers(p);
      setAssets(a);
      setLoading(false);
    } catch (err) {
      console.error('Erro ao carregar malha Nexus:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="nexus-container">
      <header className="nexus-header">
        <div className="flex items-center gap-4">
          <Globe className="nexus-logo-glow" size={32} />
          <div>
            <h1>Global Nexus Mesh</h1>
            <p>Federação Inter-Institucional (Enxame) — Nível 29</p>
          </div>
        </div>
        <div className="nexus-stats-top">
           <div className="stat">
              <span className="s-val">{peers.length}</span>
              <span className="s-lab">Hubs Conectados</span>
           </div>
           <div className="stat">
              <span className="s-val">84 TB</span>
              <span className="s-lab">Cérebro Coletivo</span>
           </div>
        </div>
      </header>

      <div className="nexus-grid">
        {/* Visualização da Malha (Simulação de Mapa P2P) */}
        <section className="mesh-visualizer glass-panel">
           <div className="mesh-nodes">
              <div className="node local">Local Hub</div>
              {peers.map((peer, idx) => (
                <div key={peer.id} className="node remote" style={{
                   top: `${20 + idx * 15}%`,
                   left: `${60 + (idx % 2) * 10}%`
                }}>
                   {peer.name}
                   <div className="pulse-line"></div>
                </div>
              ))}
           </div>
           <div className="mesh-overlay">
              <Activity size={16} /> Monitorando tráfego inter-unidades...
           </div>
        </section>

        {/* Marketplace de Ativos de Conhecimento */}
        <section className="knowledge-marketplace glass-panel">
           <h3><Share2 size={18} /> Ativos de Conhecimento Disponíveis</h3>
           <div className="asset-list">
              {assets.map(asset => (
                <div key={asset.id} className="asset-item">
                   <div className="asset-info">
                      <strong>{asset.name}</strong>
                      <p>{asset.description}</p>
                      <div className="asset-meta">
                         <span className="a-hub">Origem: {asset.originHubId}</span>
                         <span className="a-score">Impacto: {Math.round(asset.impactScore * 100)}%</span>
                      </div>
                   </div>
                   <button className="btn-download-asset">
                      <Download size={14} /> Importar
                   </button>
                </div>
              ))}
           </div>
           <button className="btn-broadcast-local">
              <Zap size={14} /> Compartilhar Inteligência Local
           </button>
        </section>
      </div>

      <footer className="nexus-footer">
         <ShieldCheck size={14} className="text-emerald-500" />
         <span>Zero-Knowledge Proofs (ZKP) Ativos | Privacidade Soberana Garantida</span>
      </footer>
    </div>
  );
};

export default GlobalNexusDashboard;
