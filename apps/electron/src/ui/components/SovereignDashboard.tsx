import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Activity, 
  Users, 
  Zap, 
  AlertTriangle, 
  BookOpen, 
  HardDrive, 
  ChevronRight,
  TrendingUp
} from 'lucide-react';
import AIServerSetup from './AIServerSetup';
import SRSMorpher from './SRSMorpher';
import HardwareMonitor from './HardwareMonitor';
import HybridShieldWidget from './HybridShieldWidget';
import './SovereignDashboard.css';

interface DashboardStats {
  swarmHealth: number;
  localProcessingRatio: number;
  criticalAlerts: number;
  activeStudents: number;
  guardiansActive: number;
}

export const SovereignDashboard: React.FC<{ role: 'admin' | 'teacher' | 'staff' }> = ({ role }) => {
  const [stats, setStats] = useState<DashboardStats>({
    swarmHealth: 98.4,
    localProcessingRatio: 85,
    criticalAlerts: 2,
    activeStudents: 450,
    guardiansActive: 2
  });

  const [aiSetupActive, setAiSetupActive] = useState(false);
  const isManagement = role === 'admin' || role === 'staff';

  return (
    <div className="sovereign-dashboard animate-fade-in">
      <header className="dashboard-header">
        <div className="welcome-text">
          <h1>Painel de Soberania <span className="version-tag">v3.4.80</span></h1>
          <p>{isManagement ? 'Visão Global da Unidade Alpha' : 'Visão Pedagógica das Suas Turmas'}</p>
        </div>
        <div className="role-badge">
          <Shield size={14} />
          {role.toUpperCase()} MODE
        </div>
      </header>

      <div className="stats-grid">
        <div className="s-stat-card">
          <div className="s-stat-label">Replicação Tripla</div>
          <div className="s-stat-value">
            <span className="guardian-count-active">{stats.guardiansActive + 1}</span> 
            <span className="guardian-unit-label">Nós</span>
          </div>
        </div>

        <div className="stat-card glass">
          <div className="stat-icon local"><HardDrive size={20} /></div>
          <div className="stat-info">
            <span className="stat-label">Soberania de Dados</span>
            <span className="stat-value">{stats.localProcessingRatio}% Local</span>
          </div>
          <div className="stat-progress">
             <div className="progress-bar"><div className="progress-fill sov-dashboard-ratio-fill"></div></div>
          </div>
        </div>

        <div className="stat-card glass">
          <div className="stat-icon alerts"><AlertTriangle size={20} /></div>
          <div className="stat-info">
            <span className="stat-label">Proteção Híbrida</span>
            <span className="stat-value">ATIVO</span>
          </div>
          <button className="btn-action">Auditoria</button>
        </div>

        <div className="stat-card glass">
          <div className="stat-icon audience"><Users size={20} /></div>
          <div className="stat-info">
            <span className="stat-label">{isManagement ? 'Alunos Ativos' : 'Seus Alunos'}</span>
            <span className="stat-value">{stats.activeStudents}</span>
          </div>
        </div>
      </div>

      <main className="dashboard-content">
        <section className="main-panel glass">
          <div className="panel-header">
            <h3>{isManagement ? 'Monitoramento & Infraestrutura' : 'Alertas Acadêmicos Recentes'}</h3>
            <button className="btn-text" onClick={() => setAiSetupActive(!aiSetupActive)}>
              {aiSetupActive ? 'Voltar ao Monitor' : 'Configurações IA'} <ChevronRight size={16} />
            </button>
          </div>
          
          <div className="panel-body">
            {isManagement ? (
              aiSetupActive ? (
                <AIServerSetup onBack={() => setAiSetupActive(false)} />
              ) : (
                <div className="management-view-container">
                  <div className="sov-internal-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <HardwareMonitor />
                    <HybridShieldWidget />
                  </div>
                </div>
              )
            ) : (
              <div className="academic-alerts">
                <div className="alert-item high-risk">
                    <div className="alert-avatar">👨‍🎓</div>
                    <div className="alert-msg">
                       <strong>João Silva (9º A)</strong>
                       <span>Gap de Engajamento: 45%. Risco de evasão detectado.</span>
                    </div>
                    <button className="btn-intervene">Intervir</button>
                </div>
              </div>
            )}
          </div>
        </section>

        <aside className="side-panel">
          <div className="quick-actions glass">
            <h4>Morfologia SRS</h4>
            <SRSMorpher 
              cards={[
                { id: '1', question: 'Conceito de Densidade?', answer: 'Massa/Volume', category: 'Física' },
                { id: '2', question: 'Raíz quadrada de 144?', answer: '12', category: 'Matemática' }
              ]} 
              tone="Encouraging"
              onFinish={() => console.log('SRS Finished')}
            />
          </div>

          <div className="performance-chart glass">
            <h4>Eficiência do Enxame</h4>
            <div className="chart-placeholder">
              <TrendingUp size={48} className="chart-icon" />
              <span>Sincronia: 99.9%</span>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
};

export default SovereignDashboard;
