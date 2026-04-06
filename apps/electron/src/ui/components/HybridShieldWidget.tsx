import React, { useState, useEffect } from 'react';
import { Shield, Lock, CloudRain, Clock, Database } from 'lucide-react';
import './HybridShieldWidget.css';

interface ShieldStatus {
  pendingBytes: string;
  isEncrypted: boolean;
  nextSyncHours: number;
  guardiansActive: number;
}

const HybridShieldWidget: React.FC = () => {
  const [status, setStatus] = useState<ShieldStatus>({
    pendingBytes: '1.24 GB',
    isEncrypted: true,
    nextSyncHours: 5,
    guardiansActive: 2
  });

  const [progress, setProgress] = useState(15); 

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(p => (p + 0.1) % 100);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="shield-widget-container glass-mini animate-fade-in-up">
      <div className="shield-header">
        <div className="shield-title">
          <Shield size={18} className="text-emerald-400" />
          <span>ESCUDO HÍBRIDO</span>
        </div>
        {status.isEncrypted && (
          <div className="encryption-badge">
             <Lock size={10} style={{marginRight: '4px'}} />
             AES-256
          </div>
        )}
      </div>

      <div className="replication-monitor-grid">
         <div className="node-led online pulse"><div className="led-inner"></div><span>ALPHA</span></div>
         <div className="node-led online"><div className="led-inner"></div><span>BETA</span></div>
         <div className="node-led online"><div className="led-inner"></div><span>GAMMA</span></div>
      </div>

      <div className="shield-stats-row">
        <div className="s-mini-stat">
          <span className="s-val">{status.guardiansActive + 1}</span>
          <span className="s-lab">GUARDIONS</span>
        </div>
        <div className="s-mini-stat">
          <span className="s-val">{status.pendingBytes}</span>
          <span className="s-lab">PENDING</span>
        </div>
      </div>

      <div className="next-sync-row">
        <div className="sync-timer">
          <Clock size={12} className="text-blue-400" />
          <span>Sync Noturno em {status.nextSyncHours}h</span>
        </div>
        <div className="sync-progress-track">
          <div className="sync-progress-fill hsw-sync-fill-bar" style={{ width: `${progress}%` }}></div>
        </div>
      </div>
    </div>
  );
};

export default HybridShieldWidget;
