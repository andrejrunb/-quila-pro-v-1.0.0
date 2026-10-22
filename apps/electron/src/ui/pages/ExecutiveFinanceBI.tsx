import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  ShieldCheck, 
  BarChart3, 
  PieChart as PieChartIcon, 
  Calendar,
  ChevronRight,
  Activity,
  DollarSign
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import './ExecutiveFinanceBI.css';

const ExecutiveFinanceBI: React.FC = () => {
  const [healthScore, setHealthScore] = useState<any>(null);
  const [forecast, setForecast] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const scoreData = await window.aquila.pricing.getHealthScore();
      const forecastData = await window.aquila.pricing.getRevenueForecast(6);
      
      setHealthScore(scoreData);
      setForecast(forecastData);
      setLoading(false);
    } catch (error) {
      console.error('Erro BI Financeiro:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  if (loading) {
    return (
      <div className="bi-loading-state">
        <div className="sovereign-spinner"></div>
        <p>Sincronizando Córtex Financeiro...</p>
      </div>
    );
  }

  return (
    <div className="executive-bi-container animate-fade-in">
      <header className="bi-header">
        <div className="title-block">
          <h1 className="glass-title">Business Intelligence Executivo</h1>
          <p className="card-subtitle">Visão soberana de saúde financeira e projeções preditivas.</p>
        </div>
        <div className="bi-actions">
          <button className="btn-refresh-bi" onClick={fetchData}>Atualizar Insights</button>
        </div>
      </header>

      <section className="kpi-grid">
        <div className={`kpi-card glass-panel ${healthScore?.status?.toLowerCase() || ''}`}>
          <div className="kpi-header">
            <Activity size={20} />
            <span>Health Score</span>
          </div>
          <div className="kpi-value">{healthScore?.score}%</div>
          <div className="kpi-footer">Status: {healthScore?.status}</div>
          <div className="health-bar-bg">
            <div className="health-bar-fill" style={{ width: `${healthScore?.score}%` }}></div>
          </div>
        </div>

        <div className="kpi-card glass-panel">
          <div className="kpi-header">
            <DollarSign size={20} className="text-primary" />
            <span>Receita Projetada (6m)</span>
          </div>
          <div className="kpi-value">
            {formatCurrency(forecast.reduce((acc, curr) => acc + curr.netRevenue, 0))}
          </div>
          <div className="kpi-footer text-success">+4.2% vs semestre anterior</div>
        </div>

        <div className="kpi-card glass-panel critical">
          <div className="kpi-header">
            <AlertTriangle size={20} />
            <span>Risco de Evasão (Impacto)</span>
          </div>
          <div className="kpi-value">
            {formatCurrency(forecast.reduce((acc, curr) => acc + curr.evasionRiskImpact, 0))}
          </div>
          <div className="kpi-footer">Perda estimada por churn não mitigado</div>
        </div>
      </section>

      <div className="bi-main-grid">
        <div className="chart-section glass-panel">
          <h3 className="chart-title">Projeção de Fluxo de Caixa (Líquido)</h3>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={forecast}>
                <defs>
                  <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="period" stroke="rgba(255,255,255,0.4)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  itemStyle={{ color: 'var(--primary)' }}
                />
                <Area type="monotone" dataKey="netRevenue" stroke="var(--primary)" fillOpacity={1} fill="url(#colorNet)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="insights-section glass-panel">
          <h3 className="chart-title">Insights do Córtex</h3>
          <div className="insights-list">
            {healthScore?.insights.map((insight: string, idx: number) => (
              <div key={idx} className="insight-item">
                <ShieldCheck size={16} className="text-primary" />
                <span>{insight}</span>
              </div>
            ))}
          </div>
          <button className="btn-ai-strategy">
            Gerar Estratégia de Mitigação <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExecutiveFinanceBI;
