import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Map as MapIcon, 
  Globe, 
  ShieldCheck, 
  AlertCircle,
  Activity,
  Zap,
  ChevronRight,
  Target,
  ArrowLeft
} from 'lucide-react';
import './GlobalTrendsDashboard.css';

interface TrendMetric {
  id: string;
  category: string;
  label: string;
  value: number;
  change: number;
  highlight?: boolean;
}

interface RegionalInsight {
  region: string;
  topTrend: string;
  intensity: number; // 0-100
}

const GlobalTrendsDashboard: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  const [metrics, setMetrics] = useState<TrendMetric[]>([]);
  const [insights, setInsights] = useState<RegionalInsight[]>([]);
  const [synthesizedPulse, setSynthesizedPulse] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const trends = await (window as any).aquila.global.getTrends();
      const pulse = await (window as any).aquila.global.getSynthesizedPulse();
      
      setMetrics(trends.metrics || []);
      setInsights(trends.regional || []);
      setSynthesizedPulse(pulse);
    } catch (err) {
      console.error('Erro ao buscar dados globais:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000); // 1 min sync
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="gtd-container glass-morphism animate-fade-in">
      <header className="gtd-header">
        <div className="flex items-center gap-4">
          {onBack && (
            <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-full transition-all mr-2">
              <ArrowLeft size={24} className="text-white" />
            </button>
          )}
          <div className="gtd-brand">
            <Globe className="gtd-logo-glow" />
            <div>
              <h1>Global Swarm Intelligence</h1>
              <p>Síntese Nacional em Tempo Real (Anonimizado)</p>
            </div>
          </div>
        </div>
        <div className="gtd-status-badges">
          <div className="gtd-badge mesh">
            <Activity size={12} /> Mallha Ativa: 100%
          </div>
          <div className="gtd-badge secure">
            <ShieldCheck size={12} /> LGPD Audit OK
          </div>
        </div>
      </header>

      <div className="gtd-content">
        <section className="gtd-grid-main">
          {/* Main Pulse Card */}
          <div className="gtd-card pulse-card glass-glow">
            <div className="gtd-card-header">
              <Zap size={20} color="var(--accent-glow)" />
              <h3>Pulso Nacional do Córtex</h3>
            </div>
            <div className="gtd-pulse-text">
              {synthesizedPulse || "Sintetizando sinal do enxame..."}
            </div>
            <div className="gtd-pulse-footer">
              <TrendingUp size={16} /> Atualizado agora mesmo via P2P
            </div>
          </div>

          {/* Regional Map Simulation */}
          <div className="gtd-card map-card glass-glow">
            <div className="gtd-card-header">
              <MapIcon size={20} color="var(--accent-glow)" />
              <h3>Intensidade Regional</h3>
            </div>
            <div className="gtd-insight-list">
              {insights.map((insight, idx) => (
                <div key={idx} className="gtd-insight-item">
                  <div className="gtd-insight-info">
                    <span className="gtd-region">{insight.region}</span>
                    <span className="gtd-trend-label">{insight.topTrend}</span>
                  </div>
                  <div className="gtd-intensity-bar">
                    <div 
                      className="gtd-intensity-fill" 
                      style={{ width: `${insight.intensity}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="gtd-grid-stats">
          {metrics.map((metric) => (
            <div key={metric.id} className={`gtd-stat-card glass-glow ${metric.highlight ? 'highlight' : ''}`}>
              <div className="gtd-stat-label">{metric.label}</div>
              <div className="gtd-stat-value">
                {metric.category === 'percentage' ? `${metric.value}%` : metric.value}
                <span className={`gtd-stat-change ${metric.change >= 0 ? 'pos' : 'neg'}`}>
                  {metric.change >= 0 ? '+' : ''}{metric.change}%
                </span>
              </div>
              <Target size={14} className="gtd-stat-icon" />
            </div>
          ))}
        </section>

        <section className="gtd-footer-actions">
          <div className="gtd-audit-info">
            <AlertCircle size={16} color="#64748b" />
            <span>Dados agregados de 48 instituições selecionadas pela curadoria Master.</span>
          </div>
          <button className="gtd-refresh-btn" onClick={fetchData} disabled={isLoading}>
            {isLoading ? 'Sincronizando...' : 'Forçar Sincronização'}
          </button>
        </section>
      </div>
    </div>
  );
};

export default GlobalTrendsDashboard;
