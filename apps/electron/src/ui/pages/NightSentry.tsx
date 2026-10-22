import React, { useState, useEffect } from 'react';
import { Shield, Moon, Lock, AlertTriangle, Eye, Activity, MapPin, Zap, ChevronLeft } from 'lucide-react';
import './NightSentry.css';

interface NightSentryProps {
  onBack: () => void;
}

export const NightSentry: React.FC<NightSentryProps> = ({ onBack }) => {
  const [isLockdown, setIsLockdown] = useState(false);
  const [activeSensors, setActiveSensors] = useState(12);
  const [lastMotion, setLastMotion] = useState('Corredor Bloco B - 22:45');
  const [scanProgress, setScanProgress] = useState(0);
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    const fetchSentryData = async () => {
      try {
        const logsData = await window.aquila.invoke('coordination:get-resilience-logs', 10);
        setLogs(logsData || []);
        
        const telemetry = await window.aquila.invoke('system:get-sentry-telemetry');
        if (telemetry) {
          setActiveSensors(telemetry.activeSensors || 0);
          setLastMotion(telemetry.lastMotion || 'Nenhum movimento detectado');
          setIsLockdown(telemetry.isLockdown || false);
        }
      } catch (err) {
        console.error('[NightSentry] Erro ao buscar dados:', err);
      }
    };

    fetchSentryData();
    const dataInterval = setInterval(fetchSentryData, 5000);
    const radarInterval = setInterval(() => {
      setScanProgress(p => (p + 1) % 100);
    }, 200);

    return () => {
      clearInterval(dataInterval);
      clearInterval(radarInterval);
    };
  }, []);

  const toggleLockdown = async () => {
    const nextState = !isLockdown;
    try {
      const result = await window.aquila.invoke('system:lockdown', nextState);
      if (result.success) {
        setIsLockdown(nextState);
      }
    } catch (err) {
      console.error('[NightSentry] Falha ao executar lockdown:', err);
    }
  };

  return (
    <div className={`night-sentry-container ${isLockdown ? 'lockdown-active' : ''}`}>
      <header className="sentry-header">
        <div className="header-left">
          <button onClick={onBack} className="back-btn-minimal">
            <ChevronLeft size={20} /> VOLTAR
          </button>
          <div className="title-group">
            <h1 className="sentry-title">NIGHT SENTRY <span className="version-tag">v2.1</span></h1>
            <p className="sentry-status">PROTEÇÃO PERIMETRAL ATIVA</p>
          </div>
        </div>
        <div className="system-clock">
          <Moon size={16} className="icon-pulse" />
          <span>23:12:45</span>
        </div>
      </header>

      <div className="sentry-grid">
        {/* Radar Principal */}
        <section className="radar-main glass-panel">
          <div className="radar-circle">
            <div className="radar-sweep" style={{ transform: `rotate(${scanProgress * 3.6}deg)` }}></div>
            <div className="radar-ping p1"></div>
            <div className="radar-ping p2"></div>
            <div className="radar-grid-lines"></div>
            <div className="radar-label">PERÍMETRO DIGITAL</div>
          </div>
          <div className="radar-legend">
            <div className="legend-item"><span className="dot active"></span> SENSORES OK</div>
            <div className="legend-item"><span className="dot motion"></span> MOVIMENTO</div>
          </div>
        </section>

        {/* Status Hub */}
        <section className="status-hub">
          <div className="lockdown-card glass-panel">
            <div className="lock-icon-container">
              {isLockdown ? <Lock size={48} className="icon-alert" /> : <Shield size={48} className="icon-safe" />}
            </div>
            <h2 className="card-title">{isLockdown ? 'LOCKDOWN ATIVO' : 'SISTEMA ARMADO'}</h2>
            <p className="card-desc">Protocolo de confinamento de portas e acessos IoT.</p>
            <button 
              className={`lockdown-btn ${isLockdown ? 'active' : ''}`}
              onClick={toggleLockdown}
            >
              {isLockdown ? 'DESATIVAR LOCKDOWN' : 'EXECUTAR LOCKDOWN'}
            </button>
          </div>

          <div className="metrics-grid">
            <div className="metric-card glass-panel">
              <Eye size={20} className="icon-cyan" />
              <div className="metric-info">
                <span className="m-value">{activeSensors}</span>
                <span className="m-label">SENSORES ATIVOS</span>
              </div>
            </div>
            <div className="metric-card glass-panel">
              <Zap size={20} className="icon-cyan" />
              <div className="metric-info">
                <span className="m-value">100%</span>
                <span className="m-label">ENERGIA UPS</span>
              </div>
            </div>
          </div>
        </section>

        {/* Live Logs */}
        <section className="sentry-logs glass-panel">
          <h3 className="section-title"><Activity size={16} /> LOGS DE ATIVIDADE</h3>
          <div className="log-list">
            {logs.length === 0 ? (
              <div className="log-item info">
                <span className="log-time">--:--</span>
                <span className="log-msg">NENHUMA ATIVIDADE REGISTRADA</span>
              </div>
            ) : (
              logs.map((log, idx) => (
                <div key={log.id || idx} className={`log-item ${log.type === 'PASSIVE_INTEGRITY' ? 'entry' : 'motion'}`}>
                  <span className="log-time">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  <span className="log-msg">{log.description}</span>
                </div>
              ))
            )}
          </div>
          <div className="log-footer">
            <MapPin size={14} /> Localização: Bloco Central
          </div>
        </section>
      </div>

      <div className="scanning-bar">
        <div className="scan-line" style={{ width: `${scanProgress}%` }}></div>
      </div>
    </div>
  );
};
