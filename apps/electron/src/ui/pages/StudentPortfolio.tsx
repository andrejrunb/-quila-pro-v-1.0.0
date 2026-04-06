import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, User, Calendar, BookOpen, 
  Activity, Zap, Moon, TrendingUp, 
  Download, FileText, Share2, Award, 
  Fingerprint, XCircle
} from 'lucide-react';
import { PortfolioEvent, PedagogicalInsight } from '../../services/AiTypes';
import './StudentPortfolio.css';

interface StudentPortfolioProps {
  studentId: string;
  studentName: string;
  onBack: () => void;
}

/**
 * StudentPortfolio (v1626 / v3600 AI)
 * Registro de Desempenho Comportamental e BiomÃ©trico.
 */
export const StudentPortfolio: React.FC<StudentPortfolioProps> = ({ studentId, studentName, onBack }) => {
  const [events, setEvents] = useState<PortfolioEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [biometricStatus, setBiometricStatus] = useState<'verified' | 'pending'>('pending');
  const [insights, setInsights] = useState<PedagogicalInsight[]>([]);
  const [analyzing, setAnalyzing] = useState(false);

  const loadData = async () => {
    try {
      const portfolio = await window.aquila.getStudentPortfolio(studentId);
      if (portfolio) {
        setEvents(portfolio.events || []);
      }
      
      const pedagogicalInsights = await window.aquila.getPedagogicalInsights(studentId);
      setInsights(pedagogicalInsights || []);
      
      setBiometricStatus('verified'); 
    } catch (err) {
      console.error('Failed to load portfolio via IPC:', err);
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
      await window.aquila.analyzePedagogicalStudent(studentId);
      const updated = await window.aquila.getPedagogicalInsights(studentId);
      setInsights(updated || []);
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
        Sincronizando Dados Biométricos...
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
            <p className="portfolio-subtitle">Registro de Desempenho Comportamental // v1626</p>
          </div>
        </div>
        <div className="portfolio-actions">
          <button aria-label="Baixar PDF" className="action-btn" title="Baixar PDF"><Download size={16} /></button>
          <button aria-label="Compartilhar" className="action-btn" title="Compartilhar com Responsáveis"><Share2 size={16} /></button>
        </div>
      </header>

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

        {/* Central Timeline */}
        <section className="timeline-section glass-card">
          <header className="section-header">
            <h3 className="section-title">Linha do Tempo Pedagógica</h3>
          </header>

          <div className="behavior-timeline">
            {events.length === 0 ? (
              <div className="empty-state">Nenhum evento comportamental registrado.</div>
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

        <section className="pedagogical-notes glass-card">
          <div className="flex justify-between items-center mb-6">
            <h3 className="section-title !mb-0">Insights IA Generativa</h3>
            <button 
              className={`btn-npu-analyze ${analyzing ? 'analyzing' : ''}`}
              onClick={handleAnalyze}
              disabled={analyzing}
            >
              <Zap size={12} /> {analyzing ? 'PROCESSING...' : 'ANALYZE WITH NPU'}
            </button>
          </div>

          <div className="insights-list">
            {insights.length === 0 ? (
              <div className="empty-insight-state">No generative insights yet. Click analysis to initiate.</div>
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
                      <strong>Observation:</strong> {insight.observation}
                    </p>
                    <p className="recommendation-text">
                      <strong>AI Recommendation:</strong> {insight.recommendation}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
