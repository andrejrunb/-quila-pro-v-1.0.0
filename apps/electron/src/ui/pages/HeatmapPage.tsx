import React, { useState, useEffect, useRef } from 'react';
import { BarChart3, TrendingUp, Users, Map as MapIcon, Calendar, Clock, ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react';
import './HeatmapPage.css';

interface ZoneSummary {
  zone: string;
  total_passages: number;
  peak_hour: number;
  peak_count: number;
}

export const HeatmapPage: React.FC = () => {
  const [summaries, setSummaries] = useState<ZoneSummary[]>([]);
  const [totalFlux, setTotalFlux] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const aquila = (window as any).aquila;

  const loadData = async () => {
    try {
      setIsLoading(true);
      const data = await aquila.invoke('get-heatmap-summaries');
      if (data) {
        setSummaries(data);
        setTotalFlux(data.reduce((acc: number, s: any) => acc + s.total_passages, 0));
      }
    } catch (err) {
      console.error('Erro ao carregar heatmap:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="heatmap-page">
      <div className="heatmap-container">
        {/* Header */}
        <div className="heatmap-header">
          <div>
            <h1 className="heatmap-title">Heatmap de Fluxo</h1>
            <p className="heatmap-subtitle">
              <Activity className="icon-mini" /> Análise de densidade por zona em tempo real
            </p>
          </div>
          
          <div className="time-selector">
             <button className="time-btn active">Hoje</button>
             <button className="time-btn">Semana</button>
             <button className="time-btn">Mês</button>
          </div>
        </div>

        {/* Stats Grid (Zero-Debt Standard) */}
        <div className="stats-grid">
          <div className="stat-card">
             <div className="stat-card-header">
                <div className="stat-icon-wrapper icon-blue"><Users className="icon-mid" /></div>
                <span className="trend-up">
                  <ArrowUpRight className="icon-mini" /> 12%
                </span>
             </div>
             <p className="stat-value">{totalFlux}</p>
             <p className="stat-label">Passagens Totais</p>
          </div>

          <div className="stat-card">
             <div className="stat-card-header">
                <div className="stat-icon-wrapper icon-indigo"><Clock className="icon-mid" /></div>
                <span className="label-pico">Pico</span>
             </div>
             <p className="stat-value">{summaries.length > 0 ? Math.max(...summaries.map(s => s.peak_count)) : 0}</p>
             <p className="stat-label">Densidade Máxima</p>
          </div>

          <div className="stat-card">
             <div className="stat-card-header">
                <div className="stat-icon-wrapper icon-emerald"><MapIcon className="icon-mid" /></div>
             </div>
             <p className="stat-value">{summaries.length}</p>
             <p className="stat-label">Zonas Ativas</p>
          </div>

          <div className="stat-card">
             <div className="stat-card-header">
                <div className="stat-icon-wrapper icon-orange"><TrendingUp className="icon-mid" /></div>
                <span className="trend-down">
                  <ArrowDownRight className="icon-mini" /> 4%
                </span>
             </div>
             <p className="stat-value">Medium</p>
             <p className="stat-label">Nível de Aglomeração</p>
          </div>
        </div>

        <div className="heatmap-main-grid">
          {/* Gráfico de Barras Estilizado (Zero-Debt compliant) */}
          <div className="chart-section">
             <h3 className="chart-title">
                <BarChart3 className="icon-mid icon-blue-soft" />
                Fluxo por Zona (Densidade)
             </h3>
             
             <div className="bar-list">
                {summaries.map(s => (
                  <HeatmapBar 
                    key={s.zone} 
                    zone={s.zone} 
                    count={s.total_passages} 
                    percentage={Math.min(100, (s.total_passages / (totalFlux || 1)) * 100 * 2)} 
                  />
                ))}
             </div>
          </div>

          {/* Insights Laterais */}
          <div className="insight-section">
             <div className="ai-insight-card">
                <div className="insight-content">
                   <h4 className="insight-title">
                     <TrendingUp className="icon-mid" /> Insight IA
                   </h4>
                   <p className="insight-text">
                     O pico de fluxo na <strong>Zona Sul</strong> ocorre às 12h. Recomendamos aumentar a vigilância nesta área durante o intervalo.
                   </p>
                   <button className="insight-btn">
                     Ver Sugestões
                   </button>
                </div>
                <div className="ai-insight-glow" />
             </div>

             <div className="alerts-card">
                <h4 className="alerts-header">Próximos Alertas</h4>
                <div className="alert-list-mini">
                   <div className="alert-item">
                      <div className="alert-dot dot-yellow" />
                      <span className="alert-label">Potencial aglomeração no Pátio</span>
                      <span className="alert-time">In 15m</span>
                   </div>
                   <div className="alert-item">
                      <div className="alert-dot dot-green" />
                      <span className="alert-label">Troca de turno estável</span>
                      <span className="alert-time">Agora</span>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const HeatmapBar: React.FC<{ zone: string; count: number; percentage: number }> = ({ zone, count, percentage }) => {
  const fillRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (fillRef.current) {
      fillRef.current.style.setProperty('--bar-width', `${percentage}%`);
    }
  }, [percentage]);

  return (
    <div className="heatmap-bar-group">
      <div className="bar-info">
        <span className="zone-name">{zone}</span>
        <span className="passage-count">{count} detectados</span>
      </div>
      <div className="bar-track">
        <div ref={fillRef} className="bar-fill" />
      </div>
    </div>
  );
};

export default HeatmapPage;
