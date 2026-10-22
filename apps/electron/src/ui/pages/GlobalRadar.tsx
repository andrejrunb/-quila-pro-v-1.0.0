import React, { useState, useEffect } from 'react';
import { 
  Globe, 
  Shield, 
  Activity, 
  Zap, 
  Map as MapIcon,
  Wifi,
  Database,
  Lock,
  ChevronRight
} from 'lucide-react';
import { FederationMetrics } from '../components/FederationMetrics';
import './GlobalRadar.css';

declare const window: any;


interface HubNode {
  id: string;
  name: string;
  status: string;
  latency: number;
  threatLevel: 'Low' | 'Medium' | 'High';
}

const GlobalRadar: React.FC = () => {
  const [nodes, setNodes] = useState<HubNode[]>([]);
  const [selectedHub, setSelectedHub] = useState<string | null>(null);
  const [ledger, setLedger] = useState<any[]>([]);

  const fetchNexusData = async () => {
    try {
      const peers = await window.electron.invoke('nexus:get-peers');
      const ledgerData = await window.electron.invoke('nexus:get-ledger');
      setNodes(peers);
      setLedger(ledgerData);
    } catch (err) {
      console.error('Erro ao buscar dados Nexus:', err);
    }
  };

  useEffect(() => {
    fetchNexusData();
    const interval = setInterval(fetchNexusData, 10000);
    return () => clearInterval(interval);
  }, []);


  return (
    <div className="radar-container">
      <header className="radar-header">
        <div className="radar-title">
          <Globe className="icon-pulse-blue" size={32} />
          <div>
            <h1>Radar Global Nexus</h1>
            <p>Nível 18: Expansão Transdimensional & Federação P2P</p>
          </div>
        </div>
        <div className="mesh-stats">
          <div className="stat-item">
            <Activity size={16} />
            <span>MESH LOAD: 14%</span>
          </div>
          <div className="stat-item">
            <Lock size={16} />
            <span>TUNNEL: AES-256-GCM</span>
          </div>
        </div>
      </header>

      <div className="radar-grid">
        <section className="map-view-panel">
          <div className="radar-visualizer">
            <div className="radar-circle outer"></div>
            <div className="radar-circle middle"></div>
            <div className="radar-circle inner"></div>
            <div className="radar-sweep"></div>
            
            {nodes.map((n, i) => (
              <div 
                key={n.id} 
                className={`hub-marker ${n.threatLevel.toLowerCase()} ${selectedHub === n.id ? 'active' : ''}`}
                style={{ 
                  top: `${30 + (i * 15)}%`, 
                  left: `${20 + (i * 20)}%` 
                }}
                onClick={() => setSelectedHub(n.id)}
              >
                <div className="marker-dot"></div>
                <div className="marker-label">{n.name}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="nexus-info-panel">
          {selectedHub ? (
            <div className="hub-details">
              <h2>Detalhes do Hub: {selectedHub}</h2>
              <div className="detail-list">
                <div className="detail-item">
                  <label>Status da Malha</label>
                  <span className="status-online">Operational</span>
                </div>
                <div className="detail-item">
                  <label>Latência Transdimensional</label>
                  <span>{nodes.find(n => n.id === selectedHub)?.latency}ms</span>
                </div>
                <div className="detail-item">
                  <label>Inteligência de Ameaças</label>
                  <span className="threat-low">Secured (No Signatures)</span>
                </div>
              </div>
              <div className="sync-progress">
                <label>Sincronização de Pesos (Federated Learning)</label>
                <div className="progress-track">
                  <div className="progress-bar" style={{ width: '100%' }}></div>
                </div>
              </div>
              <button className="reconnect-btn"><Zap size={14} /> Forçar Handshake</button>
            </div>
          ) : (
            <div className="nexus-summary">
              <FederationMetrics peers={nodes} tops={nodes.length * 26} />
              
              <div className="recent-mesh-activity">
                <h4>Ledger de Inteligência Global</h4>
                <ul>
                  {ledger.length > 0 ? ledger.map((item, idx) => (
                    <li key={idx}><ChevronRight size={14} /> {item.type}: {item.sourcePeerId || 'Nexus-Mesh'} em {new Date(item.appliedAt).toLocaleTimeString()}</li>
                  )) : (
                    <li><ChevronRight size={14} /> Aguardando sincronização da malha...</li>
                  )}
                </ul>
              </div>
            </div>

          )}
        </section>
      </div>
    </div>
  );
};

export default GlobalRadar;
