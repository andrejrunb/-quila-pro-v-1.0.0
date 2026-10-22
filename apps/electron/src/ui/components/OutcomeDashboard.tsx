import React, { useState, useEffect } from 'react';
import { TrendingUp, Target, Award, ArrowUpRight, BarChart3, Calendar, CheckCircle2 } from 'lucide-react';
import './OutcomeDashboard.css';

export const OutcomeDashboard: React.FC = () => {
  const [projections, setProjections] = useState<any[]>([]);
  const [aureusReport, setAureusReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [projData, report] = await Promise.all([
        window.aquila.outcome.getProjection(),
        window.aquila.outcome.getAureusReport()
      ]);
      setProjections(projData || []);
      setAureusReport(report);
    } catch (err) {
      console.error('Erro ao carregar dados do dashboard de resultados:', err);
    } finally {
      setLoading(false);
    }
  };

  const yieldScore = aureusReport?.yieldScore || 0;
  const efficiencyGain = aureusReport?.efficiencyGain || 0;

  return (
    <div className="outcome-dashboard">
      <header className="outcome-header">
        <div className="header-title">
          <TrendingUp className="icon-emerald" size={28} />
          <div>
            <h1>Sovereign Outcomes</h1>
            <p>Maturidade Nível 9: Sucesso Preditivo & Resultados Soberanos</p>
          </div>
        </div>
        <div className="roi-badge">
          <TrendingUp size={16} />
          <span>ROI PEDAGÓGICO: +{efficiencyGain.toFixed(1)}%</span>
        </div>
      </header>

      <div className="outcome-grid">
        {/* Metas Ativas */}
        <section className="goals-section glass-panel">
          <h2 className="section-title"><Target size={20} /> METAS DE SUCESSO ATIVAS</h2>
          <div className="goals-list">
            {projections.length === 0 && !loading && (
              <div className="empty-state">Nenhuma meta ativa definida para este ciclo.</div>
            )}
            {projections.map((g: any) => (
              <div key={g.id} className="goal-card">
                <div className="goal-info">
                  <span className="goal-cat">{g.category}</span>
                  <h3 className="goal-target">Alvo: {g.target_value}%</h3>
                </div>
                <div className="goal-progress-container">
                  <div className="progress-labels">
                    <span>Atual: {g.current_value}%</span>
                    <span>Projetado: {g.projected_value.toFixed(1)}%</span>
                  </div>
                  <div className="progress-bar-bg">
                    <div className="progress-bar-fill emerald" style={{ width: `${g.current_value}%` }}></div>
                    <div className="progress-bar-projection" style={{ width: `${g.projected_value}%` }}></div>
                  </div>
                  <div className="confidence-tag">Confiança: {(g.confidence * 100).toFixed(0)}%</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Estatísticas de Eficiência */}
        <section className="efficiency-stats">
          <div className="stat-card glass-panel emerald-glow">
            <Award className="stat-icon" size={32} />
            <div className="stat-content">
              <span className="stat-label">EFICIÊNCIA INSTITUCIONAL (YIELD)</span>
              <span className="stat-value">{yieldScore.toFixed(0)}%</span>
              <span className="stat-trend positive">
                <ArrowUpRight size={14} /> +{efficiencyGain.toFixed(1)}% este mês
              </span>
            </div>
          </div>

          <div className="stat-card glass-panel">
            <BarChart3 className="stat-icon" size={32} />
            <div className="stat-content">
              <span className="stat-label">STATUS DE CONVERGÊNCIA</span>
              <span className="stat-value" style={{ fontSize: '1.2rem', marginTop: '5px' }}>
                {aureusReport?.institutionalHealth === 'OPTIMAL' ? 'OTIMIZADO' : 'ESTÁVEL'}
              </span>
              <span className="stat-trend positive">Aureus Ativo</span>
            </div>
          </div>

          <div className="milestone-card glass-panel">
            <h3 className="card-subtitle"><Calendar size={16} /> PRÓXIMOS MILESTONES</h3>
            <div className="milestone-item">
              <CheckCircle2 size={14} className="icon-done" />
              <span>Consenso Swarm Calibrado (Nível 7)</span>
            </div>
            {aureusReport?.recentMilestones?.slice(0, 1).map((m: any, idx: number) => (
              <div key={idx} className="milestone-item">
                <div className="pulse-dot"></div>
                <span>Último: {m.metric_name} (+{m.change_percentage}%)</span>
              </div>
            ))}
            {(!aureusReport?.recentMilestones || aureusReport.recentMilestones.length === 0) && (
              <div className="milestone-item">
                <div className="pulse-dot"></div>
                <span>Validação de Resultados Trimestrais</span>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
