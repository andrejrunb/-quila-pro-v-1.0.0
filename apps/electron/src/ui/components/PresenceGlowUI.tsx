import React, { useState, useEffect } from 'react';
import { User, ShieldCheck, EyeOff } from 'lucide-react';
import './PresenceGlowUI.css';

const PresenceGlowUI: React.FC = () => {
  const [identity, setIdentity] = useState<any>(null);
  const [isAbsent, setIsAbsent] = useState(false);

  useEffect(() => {
    // Simulação de eventos do SeamlessIdentityService via IPC
    const handleIdentityChanged = (_e: any, presence: any) => {
      setIdentity(presence);
      setIsAbsent(false);
    };

    const handleIdentityLost = () => {
      setIsAbsent(true);
      // O sistema pode disparar um auto-blur aqui
    };

    (window as any).aquila.on('identity:presence:changed', handleIdentityChanged);
    (window as any).aquila.on('identity:presence:lost', handleIdentityLost);

    return () => {
      (window as any).aquila.removeAllListeners('identity:presence:changed');
      (window as any).aquila.removeAllListeners('identity:presence:lost');
    };
  }, []);

  if (!identity && !isAbsent) return null;

  return (
    <div className={`presence-glow-overlay ${isAbsent ? 'absent' : 'present'}`}>
       <div className="glow-border"></div>
       
       <div className="presence-badge glass-panel">
          {isAbsent ? (
            <div className="absent-content">
               <EyeOff size={18} className="text-red-500 animate-pulse" />
               <span>Presença Perdida - Protegendo Dados...</span>
            </div>
          ) : (
            <div className="present-content">
               <div className="avatar-mini">
                  <User size={14} />
               </div>
               <div className="identity-info">
                  <strong>{identity.name}</strong>
                  <span>{identity.role} • Seamless Active</span>
               </div>
               <ShieldCheck size={16} className="text-emerald-400" />
            </div>
          )}
       </div>

       {isAbsent && <div className="privacy-blur-layer"></div>}
    </div>
  );
};

export default PresenceGlowUI;
