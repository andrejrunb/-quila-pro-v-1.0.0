import React, { useState, useEffect } from 'react';
import './LifecycleDashboard.css';
import { 
  Users, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  ArrowUpRight, 
  Filter,
  DollarSign,
  Activity
} from 'lucide-react';

const LifecycleDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<any>(null);
  const [trends, setTrends] = useState<any[]>([]);
  const [roiData, setRoiData] = useState<any>(null);
  const [riskyStudents, setRiskyStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const handleIntervention = async (studentId: string, studentName: string, action: string) => {
    const reason = prompt(`Confirme o motivo da intervenção para ${studentName}:`, action);
    if (reason === null) return;

    try {
      // @ts-ignore
      await window.aquila.invoke('lifecycle:dismiss-risk', studentId, reason);
      alert('Intervenção registrada com sucesso e auditada no Sovereign OS.');
      await loadData();
    } catch (err) {
      console.error('Failed to register intervention:', err);
      alert('Falha ao registrar intervenção. Verifique os logs do sistema.');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // @ts-ignore
      const [m, t, r, rs] = await Promise.all([
        window.aquila.invoke('lifecycle:get-metrics'),
        window.aquila.invoke('lifecycle:get-trends'),
        window.aquila.invoke('finance:get-intervention-roi'),
        window.aquila.invoke('lifecycle:get-risky-students')
      ]);
      setMetrics(m);
      setTrends(t || []);
      setRoiData(r);
      setRiskyStudents(rs || []);
    } catch (err) {
      console.error('Failed to load lifecycle data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="lifecycle-loading">
        <div className="pulse-loader"></div>
        <span>Sincronizando Ciclo de Vida...</span>
      </div>
    );
  }

  return (
    <div className="lifecycle-container animate-fade-in">
      <header className="lifecycle-header">
        <div className="header-info">
          <h1>Dashboard de Ciclo de Vida <span className="badge">Nível 1000+</span></h1>
          <p>Monitoramento Longitudinal e Inteligência de Retenção Sovereign</p>
        </div>
        <div className="header-actions">
          <button className="btn-secondary" onClick={loadData}>
            <Activity size={18} /> Atualizar
          </button>
          <button className="btn-primary">
            <Filter size={18} /> Filtrar Período
          </button>
        </div>
      </header>

      {/* Overview Cards */}
      <section className="metrics-grid">
        <div className="eagle-card metric-card glow-blue">
          <div className="card-icon"><Users /></div>
          <div className="card-content">
            <span className="label">Total de Alunos</span>
            <h2 className="value">{metrics?.totalStudents || 0}</h2>
            <span className="trend positive"><TrendingUp size={12} /> +2.4% este mês</span>
          </div>
        </div>

        <div className="eagle-card metric-card glow-red">
          <div className="card-icon"><AlertTriangle /></div>
          <div className="card-content">
            <span className="label">Alunos em Risco</span>
            <h2 className="value">{metrics?.atRisk || 0}</h2>
            <span className="trend negative"><TrendingUp size={12} /> +12% vs meta</span>
          </div>
        </div>

        <div className="eagle-card metric-card glow-green">
          <div className="card-icon"><CheckCircle /></div>
          <div className="card-content">
            <span className="label">Taxa de Retenção</span>
            <h2 className="value">{metrics?.retentionRate || 0}%</h2>
            <span className="trend positive">SLA SOBERANO</span>
          </div>
        </div>

        <div className="eagle-card metric-card glow-purple">
          <div className="card-icon"><Activity /></div>
          <div className="card-content">
            <span className="label">Índice de Engajamento</span>
            <h2 className="value">{metrics?.engagementIndex || 0}%</h2>
            <span className="trend neutral">Estável</span>
          </div>
        </div>
      </section>

      <div className="dashboard-main-grid">
        {/* Retention ROI */}
        <section className="eagle-card roi-panel glass-morphism">
          <h3>ROI de Retenção Pedagógica</h3>
          <div className="roi-stats">
            <div className="roi-item">
              <span className="roi-label">Receita Preservada</span>
              <h4 className="roi-value text-green">R$ {(roiData?.revenueSaved || 0).toLocaleString()}</h4>
            </div>
            <div className="roi-divider"></div>
            <div className="roi-item">
              <span className="roi-label">Investimento em Intervenção</span>
              <h4 className="roi-value text-blue">R$ {(roiData?.costOfInterventions || 0).toLocaleString()}</h4>
            </div>
            <div className="roi-divider"></div>
            <div className="roi-item">
              <span className="roi-label">Eficiência (ROI)</span>
              <h4 className="roi-value text-purple">{roiData?.roi?.toFixed(1)}%</h4>
            </div>
          </div>
          <div className="roi-footer">
            <p><TrendingUp size={14} /> Cada R$ 1,00 investido em IA Pedagógica evitou a perda de R$ {(roiData?.revenueSaved / (roiData?.costOfInterventions || 1)).toFixed(2)}</p>
          </div>
        </section>

        {/* Trends Chart Placeholder */}
        <section className="eagle-card trends-panel glass-morphism">
          <div className="panel-header">
            <h3>Tendência de Intervenções</h3>
            <ArrowUpRight size={20} className="text-muted" />
          </div>
          <div className="trends-chart-container">
            {trends.length > 0 ? (
              <div className="bar-chart">
                {(() => {
                  const maxInterventions = Math.max(...trends.map(t => t.interventionCount), 1);
                  return trends.map((t, i) => (
                    <div key={i} className="bar-wrapper">
                      <div 
                        className="bar" 
                        style={{ height: `${(t.interventionCount / maxInterventions) * 100}%` }}
                        title={`${t.month}: ${t.interventionCount} intervenções`}
                      ></div>
                      <span className="bar-label">{t.month.split('-')[1]}/{t.month.split('-')[0].substring(2)}</span>
                    </div>
                  ));
                })()}
              </div>
            ) : (
              <div className="empty-state">Sem dados de tendência suficientes.</div>
            )}
          </div>
        </section>
      </div>

      {/* Recent Alerts Table */}
      <section className="eagle-card alerts-table-panel glass-morphism">
        <div className="panel-header">
          <h3>Alertas Críticos de Evasão (NPU Predict)</h3>
          <button className="btn-text">Ver todos</button>
        </div>
        <table className="eagle-table">
          <thead>
            <tr>
              <th>Aluno</th>
              <th>Status Financeiro</th>
              <th>Engajamento</th>
              <th>Risco Calculado</th>
              <th>Ação Sugerida</th>
            </tr>
          </thead>
          <tbody>
            {riskyStudents.length > 0 ? riskyStudents.map((s, i) => (
              <tr key={s.id || i}>
                <td>{s.name}</td>
                <td><span className={`tag ${s.financialStatus === 'Inadimplente' ? 'tag-red' : 'tag-green'}`}>{s.financialStatus}</span></td>
                <td><span className={`tag ${s.engagement < 50 ? 'tag-red' : 'tag-yellow'}`}>Baixo ({s.engagement}%)</span></td>
                <td><div className="risk-meter"><div className={`risk-fill ${s.riskScore > 0.7 ? 'red' : 'orange'}`} style={{width: `${Math.round(s.riskScore * 100)}%`}}></div>{Math.round(s.riskScore * 100)}%</div></td>
                <td><button className="btn-action" onClick={() => handleIntervention(s.id, s.name, s.suggestedAction)}>{s.suggestedAction}</button></td>
              </tr>
            )) : (
              <tr><td colSpan={5} className="text-center">Nenhum risco crítico detectado no momento.</td></tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
};

export default LifecycleDashboard;
