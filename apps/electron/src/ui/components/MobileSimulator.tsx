import React, { useState, useEffect } from 'react';
import { 
  Smartphone, Bell, Shield, User, MapPin, 
  MessageSquare, Wifi as WifiIcon, Battery as BatteryIcon,
  Activity, Box
} from 'lucide-react';
import './MobileSimulator.css';

/**
 * Phase 501: Mobile Simulator
 * Demonstra a interface mobile integrada para Guardas e Pais.
 */
export const MobileSimulator: React.FC = () => {
  const [view, setView] = useState<'guard' | 'parent'>('guard');
  const [notifications, setNotifications] = useState<any[]>([]);

  // Escutar eventos reais via IPC
  useEffect(() => {
    const handleGuardPush = (_event: any, notif: any) => {
      setNotifications(prev => [{
        id: notif.id,
        title: 'ALERTA DE SEGURANÇA',
        body: notif.message,
        time: 'Agora'
      }, ...prev].slice(0, 5));
    };

    (window as any).electron?.ipcRenderer?.on('mobile:guard-push', handleGuardPush);
    return () => {
      (window as any).electron?.ipcRenderer?.removeListener('mobile:guard-push', handleGuardPush);
    };
  }, []);

  return (
    <div className="mobile-sim-container">
      <div className="phone-frame">
        <div className="phone-screen">
          <header className="mobile-header">
            <div className="mobile-status-bar">
              <span>9:41</span>
              <div className="flex gap-1">
                <Wifi size={12} />
                <Battery size={12} />
              </div>
            </div>
            <div className="mobile-nav-top">
              <span className="font-bold">{view === 'guard' ? 'ÁQUILA GUARD' : 'ÁQUILA PORTAL'}</span>
              <Bell size={18} className={notifications.length > 0 ? 'text-blue-500 animate-pulse' : ''} />
            </div>
          </header>

          <main className="mobile-body">
            {view === 'guard' ? (
              <div className="guard-view">
                <div className="mission-card">
                  <Shield size={24} className="text-blue-400 mb-2" />
                  <h4>Status: Em Ronda</h4>
                  <p className="text-xs text-slate-400">Próximo ponto: Pátio Norte</p>
                </div>
                
                <div className="alert-list">
                  <h5 className="text-[10px] uppercase font-bold text-slate-500 mb-2">Alertas Recentes</h5>
                  {notifications.map(n => (
                    <div key={n.id} className="alert-item">
                      <div className="w-1 h-full bg-blue-500 rounded-full mr-2" />
                      <div>
                        <p className="text-[11px] font-bold">{n.title}</p>
                        <p className="text-[10px] text-slate-400">{n.body}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="parent-view">
                <div className="student-status-card">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
                      <User size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-bold">Enzo Silva</p>
                      <p className="text-[10px] text-emerald-400">Presente em Aula</p>
                    </div>
                  </div>
                  <div className="bg-slate-800/50 p-2 rounded text-[10px] text-slate-400">
                    "Enzo demonstrou alto engajamento em matemática hoje." 
                  </div>
                </div>

                <button className="geofence-btn">
                  <MapPin size={14} />
                  <span>Estou Chegando</span>
                </button>
              </div>
            )}
          </main>

          <footer className="mobile-tabbar">
            <button 
              onClick={() => setView('guard')} 
              className={view === 'guard' ? 'active' : ''}
              title="Visão do Guarda"
            >
              <Shield size={20} />
            </button>
            <button 
              onClick={() => setView('parent')} 
              className={view === 'parent' ? 'active' : ''}
              title="Portal de Pais"
            >
              <User size={20} />
            </button>
            <button title="Mensagens">
              <MessageSquare size={20} />
            </button>
          </footer>
        </div>
        <div className="phone-home-indicator" />
      </div>
    </div>
  );
};

// Sub-componentes Lucide simplificados para o mock
const Wifi = ({ size }: any) => <WifiIcon size={size} />;
const Battery = ({ size }: any) => <BatteryIcon size={size} />;
