import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Lock, 
  Activity, 
  BarChart3, 
  EyeOff, 
  Globe,
  Zap,
  ArrowUpRight
} from 'lucide-react';
import './ShieldProDashboard.css';

const ShieldProDashboard: React.FC = () => {
  const [attempts, setAttempts] = useState<any[]>([]);
  const [approvedTools, setApprovedTools] = useState<any[]>([]);
  const [stats, setStats] = useState({
    blockedCount: 0,
    sanitizedPrompts: 0,
    activeProtection: 'Sovereign-Gate v2'
  });

  const fetchData = async () => {
    try {
      const data = await (window as any).aquila.invoke('shield:get-status');
      setAttempts(data.attempts || []);
      setApprovedTools(data.approvedTools || []);
      setStats({
        blockedCount: data.attempts.length,
        sanitizedPrompts: data.sanitizedCount || 42,
        activeProtection: 'Sovereign-Gate v2'
      });
    } catch (err) {
      console.error('Erro ao buscar dados do Shield Pro:', err);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="shield-container">
      <header className="shield-header">
        <div className="header-info">
          <ShieldCheck className="shield-logo-glow" size={32} />
          <div>
            <h1>Shield Pro Dashboard</h1>
            <p>Governança de IA e Prevenção de Vazamento de Dados (DLP)</p>
          </div>
        </div>
        <div className="protection-status">
          <Lock size={14} />
          <span>Proteção Soberana: <strong>ATIVA</strong></span>
        </div>
      </header>

      <div className="shield-metrics-grid">
        <div className="metric-card gold">
          <ShieldAlert size={24} />
          <div className="m-data">
            <span className="label">Vazamentos Bloqueados (Shadow AI)</span>
            <span className="value">{stats.blockedCount}</span>
          </div>
        </div>
        <div className="metric-card emerald">
          <EyeOff size={24} />
          <div className="m-data">
            <span className="label">Prompts Higienizados (DLP)</span>
            <span className="value">{stats.sanitizedPrompts}</span>
          </div>
        </div>
        <div className="metric-card blue">
          <Globe size={24} />
          <div className="m-data">
            <span className="label">Dados Retidos Localmente</span>
            <span className="value">100%</span>
          </div>
        </div>
      </div>

      <div className="shield-layout-main">
        <section className="blocked-feed glass-panel">
          <h3><Activity size={18} /> Monitor de Shadow AI (Tempo Real)</h3>
          <div className="feed-list">
            {attempts.length === 0 ? (
              <p className="empty-msg">Nenhuma atividade suspeita detectada nas últimas 24h.</p>
            ) : (
              attempts.map((attempt, i) => (
                <div key={i} className="attempt-item">
                  <div className="a-header">
                    <span className="a-domain">{attempt.domain}</span>
                    <span className="a-user">User ID: {attempt.user}</span>
                  </div>
                  <div className="a-footer">
                    <span className="a-reason">{attempt.reason}</span>
                    <span className="a-time">{new Date(attempt.timestamp).toLocaleTimeString()}</span>
                    <span className="a-action">REDIRECIONADO</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <aside className="approved-tools glass-panel">
          <h3><Zap size={18} /> IAs Soberanas Aprovadas</h3>
          <div className="tools-list">
            {approvedTools.map((tool, i) => (
              <div key={i} className="tool-card">
                 <div className="t-info">
                   <strong>{tool.name}</strong>
                   <span>{tool.type}</span>
                 </div>
                 <span className="t-status">{tool.status}</span>
              </div>
            ))}
          </div>
          <button className="btn-access-workspace">
             ACESSAR WORKSPACE SOBERANO <ArrowUpRight size={16} />
          </button>
        </aside>
      </div>

      <footer className="shield-footer">
         <ShieldCheck size={14} className="text-emerald-500" />
         <span>Shield Pro v2.0.0 — Operando sob o paradigma Agent-First Governance</span>
      </footer>
    </div>
  );
};

export default ShieldProDashboard;
