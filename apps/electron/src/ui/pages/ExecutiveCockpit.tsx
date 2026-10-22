import React, { useState, useEffect } from 'react';
import { ArrowLeft, TrendingUp, Brain, Shield, CheckCircle2, Zap, AlertCircle, Clock, BarChart3 } from 'lucide-react';
import './ExecutiveCockpit.css';

interface ROIStats {
  valueCreated: number;
  hoursSaved: number;
  roiPercentage: number;
  status: string;
}

interface PulseStats {
  score: number;
  atRiskCount: number;
  resilience: number;
}

interface AIInsight {
  id: number;
  title: string;
  description: string;
  category: string;
  impact_score: number;
  timestamp: string;
}

const ExecutiveCockpit: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  const [roi, setRoi] = useState<ROIStats | null>(null);
  const [pulse, setPulse] = useState<PulseStats | null>(null);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);

  const FALLBACK_ROI: ROIStats = { valueCreated: 4250.00, hoursSaved: 85, roiPercentage: 340, status: 'OPTIMAL' };
  const FALLBACK_PULSE: PulseStats = { score: 87, atRiskCount: 3, resilience: 95 };

  const fetchWithTimeout = (channel: string, ...args: any[]) => {
    return Promise.race([
      (window as any).aquila.invoke(channel, ...args),
      new Promise((_, reject) => setTimeout(() => reject('timeout'), 3000)),
    ]);
  };

  const fetchData = async () => {
    try {
      const [roiData, pulseData, insightsData] = await Promise.all([
        fetchWithTimeout('executive:get-roi'),
        fetchWithTimeout('executive:get-pulse'),
        fetchWithTimeout('executive:get-ai-insights', 5),
      ]);
      setRoi(roiData as ROIStats);
      setPulse(pulseData as PulseStats);
      setInsights((insightsData as AIInsight[]) || []);
      setIsOffline(false);
    } catch (err) {
      console.warn('[ExecutiveCockpit] Usando fallback:', err);
      if (!roi) setRoi(FALLBACK_ROI);
      if (!pulse) setPulse(FALLBACK_PULSE);
      setIsOffline(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const approveEvolution = async (id: number) => {
    try {
      await window.aquila.invoke('coordination:approve-evolution', id);
      fetchData();
    } catch (err) {
      console.error('[ExecutiveCockpit] Erro ao aprovar evolução:', err);
    }
  };

  return (
    <div className="executive-cockpit-container animate-fade-in">
      <header className="cockpit-header">
        <div className="flex items-center gap-4">
          {onBack && (
            <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-full transition-all mr-2">
              <ArrowLeft size={24} className="text-white" />
            </button>
          )}
          <div className="header-info">
            <h1 className="cockpit-title">EXECUTIVE <span className="text-accent">COCKPIT</span></h1>
            <p className="cockpit-subtitle">METABOLISMO INSTITUCIONAL & RETORNO DE INTELIGÊNCIA</p>
          </div>
        </div>
        <div className="cortex-status">
          <div className="pulse-indicator">
            <div className="pulse-ring"></div>
            <div className="pulse-dot"></div>
          </div>
          <span>CÓRTEX: ATIVO</span>
        </div>
      </header>

      <div className="cockpit-grid">
        {/* ROI Panel */}
        <section className="roi-panel glass-card animate-glow">
          <div className="card-header">
            <TrendingUp className="text-success" />
            <h3>ROI DE INTELIGÊNCIA</h3>
          </div>
          <div className="roi-main">
            <div className="roi-percentage">+{roi?.roiPercentage || 0}%</div>
            <div className="roi-label">EFICIÊNCIA OPERACIONAL</div>
          </div>
          <div className="roi-stats-grid">
            <div className="roi-stat">
              <Clock size={16} />
              <div className="stat-info">
                <span className="stat-val">{roi?.hoursSaved.toFixed(1) || 0}h</span>
                <span className="stat-label">HORAS SALVAS</span>
              </div>
            </div>
            <div className="roi-stat">
              <BarChart3 size={16} />
              <div className="stat-info">
                <span className="stat-val">R$ {roi?.valueCreated.toFixed(2) || 0}</span>
                <span className="stat-label">VALOR CRIADO</span>
              </div>
            </div>
          </div>
        </section>

        {/* Córtex Pulse */}
        <section className="pulse-panel glass-card">
          <div className="card-header">
            <Brain className="text-primary" />
            <h3>CÓRTEX PULSE</h3>
          </div>
          <div className="pulse-score-container">
            <div className="score-ring" style={{ '--score': `${pulse?.score || 0}%` } as any}>
              <span className="score-val">{pulse?.score || 0}</span>
            </div>
          </div>
          <div className="pulse-metrics">
            <div className="p-metric">
              <span>RESILIÊNCIA</span>
              <div className="p-bar"><div style={{ width: `${pulse?.resilience || 0}%` }}></div></div>
            </div>
            <div className="p-metric">
              <span>RISCO PEDAGÓGICO</span>
              <div className="p-bar"><div style={{ width: `${(pulse?.atRiskCount || 0) * 10}%`, background: 'var(--danger)' }}></div></div>
            </div>
          </div>
        </section>

        {/* AI Insights / Evolutions */}
        <section className="insights-panel glass-card">
          <div className="card-header">
            <Zap className="text-amber-500" />
            <h3>EVOLUÇÕES RECOMENDADAS</h3>
          </div>
          <div className="insights-list">
            {insights.length === 0 ? (
              <div className="empty-insights">
                <CheckCircle2 size={32} className="opacity-20 mb-2" />
                <p>NENHUMA EVOLUÇÃO PENDENTE</p>
              </div>
            ) : (
              insights.map(insight => (
                <div key={insight.id} className="insight-item">
                  <div className="insight-body">
                    <div className="insight-top">
                      <span className="insight-cat">{insight.category}</span>
                      <span className="insight-impact">IMPACTO: {insight.impact_score}/10</span>
                    </div>
                    <h4 className="insight-title">{insight.title}</h4>
                    <p className="insight-desc">{insight.description}</p>
                  </div>
                  <button className="approve-btn" onClick={() => approveEvolution(insight.id)}>
                    APROVAR
                  </button>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <footer className="cockpit-footer">
        <div className="security-tag">
          <Shield size={14} /> SOVEREIGN NODE: {window.location.hostname}
        </div>
        <div className="timestamp">
          ÚLTIMA SINCRONIZAÇÃO: {new Date().toLocaleTimeString()}
        </div>
      </footer>
    </div>
  );
};

export default ExecutiveCockpit;
