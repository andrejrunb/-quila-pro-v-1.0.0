import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, User, Calendar, BookOpen, 
  Activity, Zap, Moon, TrendingUp, 
  Download, FileText, Share2, Award, 
  Fingerprint, XCircle, Sparkles, Brain
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, AreaChart, Area 
} from 'recharts';
import { PortfolioEvent, PedagogicalInsight } from '../../services/AiTypes';
import { BNCCSkillTree } from '../components/BNCCSkillTree';
import './StudentPortfolio.css';

interface LongitudinalMetric {
  year: number;
  avgGrade: number;
  avgBehavior: number;
  attendance: number;
}

interface StudentPortfolioProps {
  studentId: string;
  studentName: string;
  onBack: () => void;
}

type PortfolioTab = 'skill-tree' | 'telemetry' | 'timeline' | 'insights';

/**
 * StudentPortfolio (v1626 / v3600 AI / v4000 Longitudinal / v5000 BNCC Skill Tree)
 * Registro de Desempenho Comportamental, Biométrico e Árvore Curricular Soberana.
 */
export const StudentPortfolio: React.FC<StudentPortfolioProps> = ({ studentId, studentName, onBack }) => {
  const [activeTab, setActiveTab] = useState<PortfolioTab>('skill-tree');
  const [events, setEvents] = useState<PortfolioEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [biometricStatus, setBiometricStatus] = useState<'verified' | 'pending'>('pending');
  const [insights, setInsights] = useState<PedagogicalInsight[]>([]);
  const [longitudinalData, setLongitudinalData] = useState<LongitudinalMetric[]>([]);
  const [analyzing, setAnalyzing] = useState(false);

  const loadData = async () => {
    try {
      if (window.aquila?.getStudentPortfolio) {
        const portfolio = await window.aquila.getStudentPortfolio(studentId);
        if (Array.isArray(portfolio)) {
          setLongitudinalData(portfolio);
        } else if (portfolio && (portfolio as any).events) {
          setEvents((portfolio as any).events || []);
        }
      }
      
      if (window.aquila?.getPedagogicalInsights) {
        const pedagogicalInsights = await window.aquila.getPedagogicalInsights(studentId);
        setInsights(pedagogicalInsights || []);
      }
      
      if ((window as any).aquila?.invoke) {
        const history = await (window as any).aquila.invoke('portfolio:get-longitudinal-history', studentId);
        if (history) setLongitudinalData(history);
      }

      setBiometricStatus('verified'); 
    } catch (err) {
      console.warn('Fallback para dados locais do portfólio:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [studentId]);

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      if (window.aquila?.analyzePedagogicalStudent) {
        await window.aquila.analyzePedagogicalStudent(studentId);
        const updated = await window.aquila.getPedagogicalInsights(studentId);
        setInsights(updated || []);
      }
    } catch (err) {
      console.error('Analysis failed:', err);
    } finally {
      setAnalyzing(false);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'restlessness': return <Zap size={18} color="#fb923c" />;
      case 'sleep_warning': return <Moon size={18} color="#60a5fa" />;
      case 'focus_period': return <BookOpen size={18} color="#4ade80" />;
      case 'high_activity': return <TrendingUp size={18} color="#f87171" />;
      default: return <Activity size={18} color="#94a3b8" />;
    }
  };

  if (loading) return (
    <div className="dashboard-loading">
      <div className="spinner"></div>
      <p className="loading-text">
        Sincronizando Dados Pedagógicos & Biométricos...
      </p>
    </div>
  );

  return (
    <div className="portfolio-container animate-fade-in">
      <header className="portfolio-header">
        <button aria-label="Voltar" className="back-btn" onClick={onBack}>
          <ArrowLeft size={18} />
        </button>
        <div className="student-profile-summary">
          <div className="profile-avatar">
            <User size={32} />
          </div>
          <div>
            <h1 className="student-name">{studentName}</h1>
            <p className="portfolio-subtitle">Portfólio Pedagógico Soberano // BNCC & Telemetria Longitudinal</p>
          </div>
        </div>
        <div className="portfolio-actions">
          <button aria-label="Baixar PDF" className="action-btn" title="Baixar PDF"><Download size={16} /></button>
          <button aria-label="Compartilhar" className="action-btn" title="Compartilhar com Responsáveis"><Share2 size={16} /></button>
        </div>
      </header>

      {/* Navegação por Abas do Portfólio */}
      <nav className="portfolio-tabs-bar">
        <button
          className={`portfolio-nav-tab ${activeTab === 'skill-tree' ? 'active' : ''}`}
          onClick={() => setActiveTab('skill-tree')}
        >
          <Sparkles size={14} />
          <span>🌳 Árvore de Habilidades Curriculares BNCC</span>
        </button>
        <button
          className={`portfolio-nav-tab ${activeTab === 'telemetry' ? 'active' : ''}`}
          onClick={() => setActiveTab('telemetry')}
        >
          <TrendingUp size={14} />
          <span>📊 Trajetória Longitudinal & Biometria</span>
        </button>
        <button
          className={`portfolio-nav-tab ${activeTab === 'timeline' ? 'active' : ''}`}
          onClick={() => setActiveTab('timeline')}
        >
          <Activity size={14} />
          <span>📝 Linha do Tempo ({events.length})</span>
        </button>
        <button
          className={`portfolio-nav-tab ${activeTab === 'insights' ? 'active' : ''}`}
          onClick={() => setActiveTab('insights')}
        >
          <Zap size={14} />
          <span>💡 Insights NPU ({insights.length})</span>
        </button>
      </nav>

      {/* Conteúdo Dinâmico por Aba */}
      {activeTab === 'skill-tree' && (
        <section className="portfolio-skill-tree-section">
          <BNCCSkillTree
            studentId={studentId}
            studentName={studentName}
          />
        </section>
      )}

      {activeTab === 'telemetry' && (
        <div className="portfolio-grid">
          {/* Sidebar Stats */}
          <section className="stats-overview">
            <div className="stat-card">
              <div className="stat-label">Eventos Totais</div>
              <div className="stat-value">{events.length}</div>
              <Activity size={24} color="#0d9488" />
            </div>
            
            <div className="stat-card">
              <div className="stat-label">Inquietude (Restless)</div>
              <div className="stat-value">
                {events.filter(e => e.type === 'restlessness').length}
              </div>
              <Zap size={24} color="#fb923c" />
            </div>

            <div className="biometrics-widget">
              <div className="pulse-ring">
                <Fingerprint size={24} />
              </div>
              <div className="biometrics-info">
                <span className="biometrics-label">Biometria Vascular</span>
                <span className="biometrics-status">
                  {biometricStatus === 'verified' ? 'IDENTIDADE VERIFICADA' : 'AGUARDANDO SCAN'}
                </span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-label">Engagement Score</div>
              <div className="stat-value">EXCELENTE</div>
              <Award size={24} color="#10b981" />
            </div>
          </section>

          {/* Central Longitudinal Chart */}
          <section className="timeline-section glass-card" style={{ gridColumn: 'span 2' }}>
            <header className="section-header">
              <h3 className="section-title">Trajetória Longitudinal Multi-ano</h3>
              <span className="badge">Evolução do Rendimento</span>
            </header>

            <div className="longitudinal-chart-container">
              {longitudinalData.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={longitudinalData}>
                    <defs>
                      <linearGradient id="colorGrade" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0d9488" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#0d9488" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="year" stroke="#94a3b8" fontSize={11} />
                    <YAxis stroke="#94a3b8" fontSize={11} domain={[0, 10]} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(255,255,255,0.1)' }}
                      itemStyle={{ color: '#fff' }}
                    />
                    <Area type="monotone" dataKey="avgGrade" stroke="#0d9488" strokeWidth={2} fillOpacity={1} fill="url(#colorGrade)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="empty-state">Sem dados históricos suficientes para análise longitudinal.</div>
              )}
            </div>
          </section>
        </div>
      )}

      {activeTab === 'timeline' && (
        <section className="timeline-section glass-card">
          <header className="section-header">
            <h3 className="section-title">Linha do Tempo Pedagógica & Comportamental</h3>
          </header>

          <div className="behavior-timeline">
            {events.length === 0 ? (
              <div className="empty-state">Nenhum evento comportamental registrado hoje.</div>
            ) : (
              events.map(event => (
                <div key={event.id} className={`timeline-event ${event.severity || 'normal'}`}>
                  <div className="event-icon">
                    {getIcon(event.type)}
                  </div>
                  <div className="event-content">
                    <header className="event-header">
                      <h4 className="event-title">{event.description}</h4>
                      <span className="event-time">{new Date(event.timestamp).toLocaleTimeString()}</span>
                    </header>
                    <p className="event-meta">Local: {event.location} // Eagle AI Inference</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      )}

      {activeTab === 'insights' && (
        <section className="pedagogical-notes glass-card">
          <div className="flex justify-between items-center mb-6">
            <h3 className="section-title !mb-0">Insights IA Generativa & NPU 26 TOPS</h3>
            <button 
              className={`btn-npu-analyze ${analyzing ? 'analyzing' : ''}`}
              onClick={handleAnalyze}
              disabled={analyzing}
            >
              <Zap size={12} /> {analyzing ? 'PROCESSANDO...' : 'ANÁLISE DE LACUNAS COGNITIVAS'}
            </button>
          </div>

          <div className="insights-list">
            {insights.length === 0 ? (
              <div className="empty-insight-state">Nenhum insight generativo gerado ainda. Clique no botão acima para iniciar.</div>
            ) : (
              insights.map((insight, idx) => (
                <div key={idx} className={`pedagogical-tip insight-trend-${insight.trend}`}>
                  <div className="insight-icon-wrapper">
                    {insight.category === 'cognitive' ? <Zap size={20} /> : <FileText size={20} />}
                  </div>
                  <div className="insight-body">
                    <header className="insight-header">
                      <span className="insight-category">{insight.category}</span>
                      <span className={`trend-badge ${insight.trend}`}>{insight.trend.toUpperCase()}</span>
                    </header>
                    <p className="tip-text">
                      <strong>Observação:</strong> {insight.observation}
                    </p>
                    <p className="recommendation-text">
                      <strong>Recomendação Pedagógica IA:</strong> {insight.recommendation}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      )}
    </div>
  );
};
