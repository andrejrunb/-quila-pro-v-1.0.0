import React, { useState } from 'react';
import { 
  Brain, 
  Target, 
  ShieldCheck, 
  Zap, 
  Clock,
  History,
  Activity,
  Database as DatabaseIcon,
  GitMerge,
  Cpu
} from 'lucide-react';
import './PredictiveDashboard.css';

interface PredictiveDashboardProps {
  onNavigate?: (page: string) => void;
}

const PredictiveDashboard: React.FC<PredictiveDashboardProps> = ({ onNavigate }) => {
  const [selectedLifecycle, setSelectedLifecycle] = useState<string | null>(null);

  const stats = [
    { label: 'Precisao do Cortex', value: '99.8%', icon: <Brain className="text-cyan-400" />, trend: '+0.4%' },
    { label: 'Evasao Prevenida', value: '156', icon: <Target className="text-emerald-400" />, trend: '+14' },
    { label: 'Auto-Sintese Ativa', value: 'Nivel 11', icon: <ShieldCheck className="text-amber-400" />, trend: 'Evolution' },
    { label: 'NPU Inference', value: '2ms', icon: <Zap className="text-purple-400" />, trend: '-2ms' },
  ];

  return (
    <div className="predictive-dashboard-container">
      <header className="predictive-header">
        <div className="header-left">
          <div className="sovereign-logo-small">A</div>
          <div>
            <h1>Radar de Evasao</h1>
            <p className="status-text">Cortex Central v2.1.0 - Auto-Sintese (Nivel 11)</p>
          </div>
        </div>
        
        <div className="header-right">
          <div className="system-uptime">
            <Clock size={14} /> 15d 04h 22m
          </div>
          <button className="btn-glass" onClick={() => onNavigate?.('dashboard')}>
            <History size={16} /> VOLTAR AO DASHBOARD
          </button>
        </div>
      </header>

      <div className="stats-grid">
        {stats.map((stat, idx) => (
          <div key={idx} className="stat-card-glass">
            <div className="stat-header">
              <div className="stat-icon">{stat.icon}</div>
              <span className="stat-trend">{stat.trend}</span>
            </div>
            <div className="stat-body">
              <span className="stat-value">{stat.value}</span>
              <span className="stat-label">{stat.label}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="main-radar-view">
        <div className="radar-canvas-container">
          <div className="radar-circle-outer">
            <div className="radar-circle-inner">
              <div className="radar-sweep"></div>
              <div className="radar-target" style={{ top: '30%', left: '45%' }}></div>
              <div className="radar-target" style={{ top: '60%', left: '25%' }}></div>
              <div className="radar-target" style={{ top: '45%', left: '70%' }}></div>
            </div>
          </div>
        </div>

        <div className="risk-feed">
          <div className="feed-header">
            <h2><Activity size={18} /> ALERTAS DE PRIORIDADE</h2>
            <button className="btn-link">VER TODOS</button>
          </div>
          
          <div className="feed-items">
            <div className="risk-item critical">
              <div className="risk-indicator"></div>
              <div className="risk-info">
                <h3>ALUNO-7429 (M. Oliveira)</h3>
                <p>94.2% de risco. Fator: <strong>Isolamento Social (Risco Relacional)</strong></p>
              </div>
              <button className="btn-action">INTERVIR</button>
            </div>
            
            <div className="risk-item warning">
              <div className="risk-indicator"></div>
              <div className="risk-info">
                <h3>ALUNO-8812 (J. Silva)</h3>
                <p>72.1% de risco. Peso de <strong>Frequencia</strong> ajustado via Auto-Sintese.</p>
              </div>
              <button className="btn-action">OBSERVAR</button>
            </div>
          </div>
          
          <div className="self-synthesis-card">
            <h3><GitMerge size={16} /> MOTOR DE AUTO-SINTESE</h3>
            <div className="weight-adjuster">
              <div className="weight-row">
                <span>Frequencia</span>
                <div className="progress-bar-small"><div className="progress-fill" style={{ width: '65%' }}></div></div>
                <span>0.65</span>
              </div>
              <div className="weight-row">
                <span>Comportamento</span>
                <div className="progress-bar-small"><div className="progress-fill" style={{ width: '35%' }}></div></div>
                <span>0.35</span>
              </div>
            </div>
            <p className="synthesis-note">Próxima evolução em 04h 12m...</p>
          </div>
        </div>
      </div>

      {selectedLifecycle && (
        <div className="lifecycle-modal-overlay" onClick={() => setSelectedLifecycle(null)}>
          <div className="lifecycle-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>LIFECYCLE LOG: {selectedLifecycle}</h2>
              <button onClick={() => setSelectedLifecycle(null)}>X</button>
            </div>
            <div className="modal-body markdown-content">
              <div className="retention-badge-big">
                <Activity size={16} /> RETENCAO INFINITA ATIVA
              </div>
              <textarea 
                readOnly 
                value={`[SYSTEM] Audit Log - Sovereignty Level 10\n[IPC] Synchronizing clusters...\n[STATE] Homeostasis confirmed.\n[CONSCIOUSNESS] Self-regulation active.`}
              />
            </div>
            <div className="modal-footer">
              <button className="btn-glass" onClick={() => setSelectedLifecycle(null)}>FECHAR</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PredictiveDashboard;
