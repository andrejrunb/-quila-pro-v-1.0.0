import React, { useState, useEffect, useRef } from 'react';
import { 
  Globe, Radio, Shield, RefreshCw, 
  MapPin, Zap, Database, Activity,
  Server, Link as LinkIcon
} from 'lucide-react';
import { cloudSync, SyncPeer } from '../../services/CloudSyncService';
import './NetworkMeshConsole.css';

/**
 * NETWORK MESH CONSOLE (v3590)
 * ----------------------------
 * Visualizes the decentralized synchronization topology of the Áquila Sovereign Cloud.
 * Uses "Sovereign-Blue" aesthetic with high-performance Ref-based dynamic metrics.
 */

export const NetworkMeshConsole: React.FC = () => {
  const [peers, setPeers] = useState<SyncPeer[]>(cloudSync.getPeers());
  const [isGlobalSyncing, setIsGlobalSyncing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const peerHandler = (updatedPeers: SyncPeer[]) => setPeers(updatedPeers);
    const startHandler = () => setIsGlobalSyncing(true);
    const endHandler = () => setIsGlobalSyncing(false);

    cloudSync.on('peers-updated', peerHandler);
    cloudSync.on('global-sync-started', startHandler);
    cloudSync.on('global-sync-finished', endHandler);

    return () => {
      cloudSync.off('peers-updated', peerHandler);
      cloudSync.off('global-sync-started', startHandler);
      cloudSync.off('global-sync-finished', endHandler);
    };
  }, []);

  // Topology Visualization Logic (Canvas)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrame: number;
    const points = peers.map((_, i) => ({
      x: 100 + Math.random() * (canvas.width - 200),
      y: 50 + Math.random() * (canvas.height - 100),
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5
    }));

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw Connections (Mesh)
      ctx.beginPath();
      ctx.strokeStyle = isGlobalSyncing ? 'rgba(80, 150, 255, 0.4)' : 'rgba(80, 150, 255, 0.1)';
      ctx.lineWidth = 1;
      for (let i = 0; i < points.length; i++) {
        for (let j = i + 1; j < points.length; j++) {
          ctx.moveTo(points[i].x, points[i].y);
          ctx.lineTo(points[j].x, points[j].y);
        }
      }
      ctx.stroke();

      // Draw Nodes
      points.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = peers[i].status === 'online' ? '#00ffcc' : 
                         peers[i].status === 'syncing' ? '#3399ff' : '#ff4d4d';
        ctx.fill();
        
        // Glow effect
        ctx.shadowBlur = 15;
        ctx.shadowColor = ctx.fillStyle as string;
        ctx.stroke();
        ctx.shadowBlur = 0;
      });

      animationFrame = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationFrame);
  }, [peers, isGlobalSyncing]);

  return (
    <div className="network-mesh-container glass-panel">
      <header className="mesh-header">
        <div className="flex items-center gap-4">
          <div className="icon-badge sovereign">
            <Globe size={20} className="text-secondary" />
          </div>
          <div>
            <h2 className="text-xl font-black uppercase tracking-tighter text-secondary">
              Sovereign Cloud Mesh
            </h2>
            <div className="text-[10px] text-muted font-bold tracking-widest opacity-60">
              E2EE CAMPUS-TO-CAMPUS TOPOLOGY • v3590
            </div>
          </div>
        </div>

        <button 
          className={`btn-action gap-2 ${isGlobalSyncing ? 'animate-pulse opacity-50' : ''}`}
          onClick={() => cloudSync.forceSync()}
          disabled={isGlobalSyncing}
        >
          <RefreshCw size={14} />
          {isGlobalSyncing ? 'SYNCHRONIZING NETWORK...' : 'FORCE GLOBAL SYNC'}
        </button>
      </header>

      <div className="mesh-viz-section">
        <canvas ref={canvasRef} width={800} height={400} className="w-full h-full" />
        {isGlobalSyncing && <div className="sync-ripple" />}
      </div>

      <div className="mesh-grid">
        {peers.map(peer => (
          <div key={peer.id} className="peer-card">
            <div className="peer-name flex items-center justify-between">
              <span>{peer.name}</span>
              <span className={`peer-status-dot ${peer.status}`} />
            </div>
            
            <div className="peer-stats">
              <div className="flex items-center gap-1">
                <Zap size={10} /> {peer.latency}ms
              </div>
              <div className="flex items-center gap-1">
                <Database size={10} /> 1.2GB Shared
              </div>
              <div className="flex items-center gap-1">
                <Server size={10} /> Node {peer.id.split('_')[1]}
              </div>
            </div>

            <div className="mesh-card-bg-icon">
              <LinkIcon size={40} className="opacity-5" />
            </div>
          </div>
        ))}
      </div>

      <footer className="p-4 flex justify-between text-[10px] text-muted border-t border-white/5 uppercase font-bold tracking-widest">
        <span>Sovereignty Ledger: VALIDATED</span>
        <span>Network Integrity: 99.9%</span>
      </footer>
    </div>
  );
};
