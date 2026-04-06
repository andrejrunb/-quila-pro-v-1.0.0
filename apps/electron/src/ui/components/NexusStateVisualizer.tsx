import React, { useState, useEffect, useRef } from 'react';
import { 
  Zap, Share2, Database, 
  Activity, CloudOff, RefreshCw 
} from 'lucide-react';
import { NEXUS_CLUSTER_CONFIG, NexusNode, SyncPacket } from '../../services/AiTypes';
import './NexusStateVisualizer.css';

/**
 * NEXUS STATE VISUALIZER (v3640)
 * ----------------------------
 * Real-time topology map of the autonomous campus mesh.
 * Aesthetic: "Nexus-Prism" design.
 */
const NexusNodePoint: React.FC<{ node: NexusNode }> = ({ node }) => {
  const ref = useRef<HTMLDivElement>(null);
  
  const nodePositions: Record<string, { top: string, left: string }> = {
    nexus_alpha: { top: '20%', left: '50%' },
    nexus_beta: { top: '50%', left: '80%' },
    nexus_gamma: { top: '50%', left: '20%' },
    nexus_delta: { top: '80%', left: '50%' }
  };

  useEffect(() => {
    if (ref.current && nodePositions[node.id]) {
      ref.current.style.setProperty('--node-top', nodePositions[node.id].top);
      ref.current.style.setProperty('--node-left', nodePositions[node.id].left);
      ref.current.style.setProperty('--node-load-width', `${node.load * 100}%`);
    }
  }, [node]);

  return (
    <div ref={ref} className={`nexus-node-point ${node.syncStatus}`}>
      <div className="node-core">
        <Database size={20} />
      </div>
      <div className="node-stats">
        <span className="node-id">{node.id.split('_')[1].toUpperCase()}</span>
        <div className="load-bar">
          <div className="load-fill" style={{ width: `${node.load * 100}%` }}></div>
        </div>
        <div className="flex gap-1 mt-1">
          <Zap size={8} className={node.load > 0.8 ? "text-amber-400" : "text-teal-400"} />
        </div>
      </div>
    </div>
  );
};

const SyncBeam: React.FC<{ packet: SyncPacket }> = ({ packet }) => {
  const ref = useRef<HTMLDivElement>(null);
  const nodePositions: Record<string, { top: string, left: string }> = {
    nexus_alpha: { top: '20%', left: '50%' },
    nexus_beta: { top: '50%', left: '80%' },
    nexus_gamma: { top: '50%', left: '20%' },
    nexus_delta: { top: '80%', left: '50%' }
  };

  useEffect(() => {
    if (ref.current) {
      const from = nodePositions[packet.sourceNode];
      const to = nodePositions[packet.targetNode];
      if (from && to) {
        ref.current.style.setProperty('--from-top', from.top);
        ref.current.style.setProperty('--from-left', from.left);
        // Em um sistema real, calcularÃ­amos o Ã¢ngulo e distÃ¢ncia aqui
      }
    }
  }, [packet]);

  return <div ref={ref} className="sync-beam animate-pulse" />;
};

export const NexusStateVisualizer: React.FC = () => {
  const [nodes, setNodes] = useState<NexusNode[]>([]);
  const [packets, setPackets] = useState<SyncPacket[]>([]);
  const [meshActive, setMeshActive] = useState(true);
  const [loading, setLoading] = useState(true);

  const fetchState = async () => {
    try {
      const state = await window.aquila.getNexusState();
      if (state) {
        setNodes(state.nodes);
        setMeshActive(state.isAlive);
      }
    } catch (err) {
      console.error('Failed to get nexus status via IPC:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchState();
    const interval = setInterval(fetchState, 5000);

    const unsubscribe = window.aquila.onNexusPulse((packet: SyncPacket) => {
      setPackets(prev => [...prev, packet]);
      setTimeout(() => {
        setPackets(prev => prev.filter(p => p.id !== packet.id));
      }, 2000);
    });

    return () => {
      clearInterval(interval);
      if (unsubscribe) unsubscribe();
    };
  }, []);

  if (loading) return <div className="p-8 text-center text-secondary">Sintonizando Rede Nexus...</div>;

  return (
    <div className="nexus-visualizer-container animate-fade-in glass">
      <header className="flex justify-between items-center mb-6">
        <div>
          <h2 className="section-title !mb-0 flex items-center gap-2">
            <Share2 size={16} /> Rede Nexus Sincronizada
          </h2>
          <p className="text-secondary text-[11px] italic">Arquitetura de Conhecimento Distribuído</p>
        </div>
        <button 
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-bold transition-all ${meshActive ? 'bg-teal-500/10 text-teal-400 border border-teal-500/30' : 'bg-red-500/10 text-red-400 border border-red-500/30'}`}
          onClick={() => window.aquila.setMeshStatus(!meshActive)}
        >
          {meshActive ? <Activity size={14} className="pulse-slow" /> : <CloudOff size={14} />}
          {meshActive ? 'MESH ATIVO' : 'MESH DESLIGADO'}
        </button>
      </header>

      <div className="topology-map relative flex-1 min-h-[300px]">
        {/* SVG de conexões simuladas */}
        <svg className="absolute inset-0 w-100 h-100 pointer-events-none opacity-20">
          <line x1="50%" y1="20%" x2="80%" y2="50%" stroke="var(--info)" strokeWidth="1" strokeDasharray="5" />
          <line x1="50%" y1="20%" x2="20%" y2="50%" stroke="var(--info)" strokeWidth="1" strokeDasharray="5" />
          <line x1="80%" y1="50%" x2="50%" y2="80%" stroke="var(--info)" strokeWidth="1" strokeDasharray="5" />
          <line x1="20%" y1="50%" x2="50%" y2="80%" stroke="var(--info)" strokeWidth="1" strokeDasharray="5" />
        </svg>

        {nodes.map(node => (
          <NexusNodePoint key={node.id} node={node} />
        ))}

        {packets.map(packet => (
          <SyncBeam key={packet.id} packet={packet} />
        ))}
      </div>

      <footer className="nexus-stats-footer grid grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/5">
        <div className="nexus-stat-box text-center">
          <div className="text-[10px] text-secondary uppercase tracking-wider">Latência</div>
          <div className="text-sm font-bold text-white">12ms</div>
        </div>
        <div className="nexus-stat-box text-center">
          <div className="text-[10px] text-secondary uppercase tracking-wider">Shards</div>
          <div className="text-sm font-bold text-white">{NEXUS_CLUSTER_CONFIG.length} / {NEXUS_CLUSTER_CONFIG.length}</div>
        </div>
        <div className="nexus-stat-box text-center">
          <div className="text-[10px] text-secondary uppercase tracking-wider">Gossip</div>
          <div className="text-sm font-bold text-white">2.4 pkt/s</div>
        </div>
        <div className="nexus-stat-box text-center">
          <div className="text-[10px] text-secondary uppercase tracking-wider">Consenso</div>
          <div className="text-sm font-bold text-teal-400">INTEGRAL</div>
        </div>
      </footer>

      <style>{`
        .topology-map { height: 100%; position: relative; }
        .nexus-node-point {
          position: absolute; transform: translate(-50%, -50%);
          top: var(--node-top); left: var(--node-left);
          display: flex; flex-direction: column; align-items: center;
        }
        .node-core {
          width: 44px; height: 44px; border-radius: 12px;
          background: #0f172a; border: 1px solid rgba(255,255,255,0.1);
          display: flex; align-items: center; justify-content: center;
          color: var(--info); transition: all 0.3s;
          box-shadow: 0 4px 12px rgba(0,0,0,0.5);
        }
        .nexus-node-point.synced .node-core { border-color: rgba(74, 222, 128, 0.5); color: #4ade80; box-shadow: 0 0 15px rgba(74, 222, 128, 0.2); }
        .nexus-node-point.pending .node-core { border-color: rgba(251, 191, 36, 0.5); color: #fbbf24; }
        
        .node-id { font-size: 9px; font-weight: 800; color: #94a3b8; margin-top: 8px; }
        .load-bar { width: 30px; height: 2px; background: rgba(255,255,255,0.05); border-radius: 4px; margin-top: 4px; overflow: hidden; }
        .load-fill { height: 100%; background: var(--info); transition: width 0.5s; }
        
        .sync-beam {
          position: absolute; width: 4px; height: 4px; background: var(--info);
          border-radius: 50%; top: var(--from-top); left: var(--from-left);
          filter: blur(1px); box-shadow: 0 0 8px var(--info);
        }
      `}</style>
    </div>
  );
};
