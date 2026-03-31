import React, { useState, useEffect, useRef } from 'react';
import { 
  Zap, Share2, Database, 
  Activity, CloudOff, RefreshCw 
} from 'lucide-react';
import { NEXUS_CLUSTER_CONFIG } from '../../services/NexusNodeRegistry';
import { nexusSyncService, NexusNode, SyncPacket } from '../../services/NexusSyncService';
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
    if (ref.current) {
      ref.current.style.setProperty('--node-top', nodePositions[node.id].top);
      ref.current.style.setProperty('--node-left', nodePositions[node.id].left);
      ref.current.style.setProperty('--node-load-width', `${node.load * 100}%`);
    }
  }, [node.load, node.id]);

  return (
    <div ref={ref} className="nexus-node-point">
      <span className="nexus-node-name">{NEXUS_CLUSTER_CONFIG.find(c => c.id === node.id)?.campusName || node.name}</span>
      <div className="nexus-node-load">{(node.load * 100).toFixed(0)}%</div>
      <div className="nexus-load-bar">
        <div className="nexus-load-fill" />
      </div>
      <div className="flex gap-1 mt-1">
        <Database size={8} className="text-secondary opacity-50" />
        <Zap size={8} className={node.load > 0.8 ? "text-amber-400 pulse-fast" : "text-teal-400"} />
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
        ref.current.style.setProperty('--beam-angle', `${Math.atan2(parseFloat(to.top) - parseFloat(from.top), parseFloat(to.left) - parseFloat(from.left))}rad`);
      }
    }
  }, [packet]);

  return <div ref={ref} className="sync-beam animate-pulse" />;
};

export const NexusStateVisualizer: React.FC = () => {
  const [nodes, setNodes] = useState<NexusNode[]>(nexusSyncService.getNodes());
  const [packets, setPackets] = useState<SyncPacket[]>([]);
  const [meshActive, setMeshActive] = useState(nexusSyncService.isMeshAlive());

  useEffect(() => {
    const handlePulse = (packet: SyncPacket) => {
      setPackets(prev => [...prev, packet]);
      setNodes(nexusSyncService.getNodes());
      setTimeout(() => {
        setPackets(prev => prev.filter(p => p.id !== packet.id));
      }, 2000);
    };

    const handleStatus = (active: boolean) => setMeshActive(active);

    nexusSyncService.on('nexus-pulse', handlePulse);
    nexusSyncService.on('mesh-status-changed', handleStatus);

    return () => {
      nexusSyncService.off('nexus-pulse', handlePulse);
      nexusSyncService.off('mesh-status-changed', handleStatus);
    };
  }, []);

  return (
    <div className="nexus-visualizer-container animate-fade-in">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="section-title !mb-0"><Share2 size={16} /> Rede Nexus Sincronizada</h2>
          <p className="text-secondary text-[11px] italic">Arquitetura de Conhecimento Distribuído (Sem Servidor Central)</p>
        </div>
        <button 
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-bold transition-all ${meshActive ? 'bg-teal-500/10 text-teal-400 border border-teal-500/30' : 'bg-red-500/10 text-red-400 border border-red-500/30'}`}
          onClick={() => nexusSyncService.setMeshStatus(!meshActive)}
        >
          {meshActive ? <Activity size={14} className="pulse-slow" /> : <CloudOff size={14} />}
          {meshActive ? 'MESH ATIVO' : 'MESH DESLIGADO'}
        </button>
      </header>

      <div className="nexus-mesh-canvas">
        {nodes.map(node => (
          <NexusNodePoint key={node.id} node={node} />
        ))}

        {packets.map(packet => (
          <SyncBeam key={packet.id} packet={packet} />
        ))}
      </div>

      <footer className="nexus-stats-footer">
        <div className="nexus-stat-box">
          <div className="nexus-stat-label">Latência Peer</div>
          <div className="nexus-stat-value">124ms</div>
        </div>
        <div className="nexus-stat-box">
          <div className="nexus-stat-label">Shards Ativos</div>
          <div className="nexus-stat-value">64 / 64</div>
        </div>
        <div className="nexus-stat-box">
          <div className="nexus-stat-label">Taxa de Gossip</div>
          <div className="nexus-stat-value">2.4 pkt/s</div>
        </div>
        <div className="nexus-stat-box">
          <div className="nexus-stat-label">Consenso local</div>
          <div className="nexus-stat-value text-teal-400">INTEGRAL</div>
        </div>
      </footer>
    </div>
  );
};
