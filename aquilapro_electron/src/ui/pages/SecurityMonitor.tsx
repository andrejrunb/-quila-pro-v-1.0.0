import React, { useState, useEffect } from 'react';
import { Shield, Radio, History, PlayCircle, AlertCircle } from 'lucide-react';
import { aiAnalysisService, SecurityEvent } from '../../services/AiAnalysisService';
import { SecurityAlertCard } from '../components/SecurityAlertCard';
import './SecurityMonitor.css';

export const SecurityMonitor: React.FC = () => {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [isLive, setIsLive] = useState(true);

  useEffect(() => {
    // Carregar eventos iniciais
    setEvents(aiAnalysisService.getRecentEvents());

    // Listener para novos eventos
    const handleNewEvent = (event: SecurityEvent) => {
      setEvents(prev => [event, ...prev].slice(0, 50));
    };

    aiAnalysisService.on('new-event', handleNewEvent);
    return () => {
      aiAnalysisService.off('new-event', handleNewEvent);
    };
  }, []);

  // Simular evento para demonstração (Step 117/118)
  const simulateEvent = () => {
    const types: any[] = ['weapon', 'group', 'fall', 'intrusion', 'vandalism'];
    const cameras = ['Entrada Principal', 'Pátio Norte', 'Corredor Administrativo'];
    
    const newEvent: SecurityEvent = {
      id: Math.random().toString(36).substr(2, 9),
      type: types[Math.floor(Math.random() * types.length)],
      timestamp: Date.now(),
      cameraId: 'cam-sim',
      cameraName: cameras[Math.floor(Math.random() * cameras.length)],
      confidence: 0.82 + Math.random() * 0.15,
    };
    
    aiAnalysisService.handleNewEvent(newEvent);
  };

  return (
    <div className="security-monitor-page">
      <header className="monitor-header">
        <div>
          <div className="monitor-header-left">
            <div className="monitor-icon-wrapper">
              <Shield size={24} />
            </div>
            <h1 className="monitor-title">Advanced Vision</h1>
          </div>
          <p className="monitor-subtitle">Monitoramento proativo de eventos críticos</p>
        </div>

        <div className="monitor-header-right">
          <button 
            onClick={simulateEvent}
            className="simulate-btn"
          >
            Simular Detecção
          </button>
          <div className={`monitor-status-badge ${isLive ? 'live' : 'offline'}`}>
            <Radio size={16} className={isLive ? 'pulse-icon' : ''} />
            {isLive ? 'LIVE ANALYSIS' : 'PAUSED'}
          </div>
        </div>
      </header>

      <div className="security-monitor-layout">
        <main className="stream-grid">
          {/* Mock Camera Views */}
          {[1, 2, 3, 4].map(id => (
            <div key={id} className={`camera-stream-window ${events[0]?.cameraId === `cam-${id}` ? 'alerting' : ''}`}>
              <div className="camera-label">
                <PlayCircle size={14} />
                CÂMERA 0{id}
              </div>
              <div className="monitor-placeholder-center">
                <Radio size={48} opacity={0.3} />
              </div>
            </div>
          ))}
        </main>

        <aside className="alert-sidebar">
          <h2>
            <AlertCircle size={20} color="#ef4444" />
            Alertas em Tempo Real
          </h2>

          <div className="alert-list-scroll">
            {events.length === 0 ? (
              <div className="empty-alerts">
                <History size={48} />
                <p>Nenhuma atividade suspeita detectada</p>
              </div>
            ) : (
              events.map(event => (
                <SecurityAlertCard key={event.id} event={event} />
              ))
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};

export default SecurityMonitor;
