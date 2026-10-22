import React, { useState, useEffect } from 'react';
import { 
  Brain, TrendingUp, AlertTriangle, Users, 
  ChevronRight, ArrowUpRight, ArrowDownRight,
  Filter, Calendar, PieChart, Activity
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, AreaChart, Area 
} from 'recharts';
import { HardwareHealthRadar } from '../components/HardwareHealthRadar';
import './PedagogicalIntelligenceHub.css';


interface DashboardStats {
  globalAvg: number;
  activeAlerts: number;
  totalStudents: number;
  evolutionTrend: 'up' | 'down';
}

/**
 * PedagogicalIntelligenceHub (v4000)
 * Central administrativa para monitoramento longitudinal e orquestração de IA.
 * Parte do Cluster 4: Inteligência Ativa.
 */
export const PedagogicalIntelligenceHub: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    globalAvg: 8.4,
    activeAlerts: 12,
    totalStudents: 450,
    evolutionTrend: 'up'
  });

  const [historicalData, setHistoricalData] = useState([
    { year: '2022', avg: 7.8, behavior: 82 },
    { year: '2023', avg: 8.1, behavior: 85 },
    { year: '2024', avg: 8.4, behavior: 88 },
    { year: '2025', avg: 8.2, behavior: 84 },
    { year: '2026', avg: 8.6, behavior: 90 },
  ]);

  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      // Inicia o monitoramento se não estiver ativo (opcional, já deve estar pelo boot)
      // Recupera estatísticas globais (Simulado para a demonstração, mas usando estrutura de IPC)
      // Em produção: window.aquila.invoke('get-global-pedagogical-stats')
      
      // Simulando delay de hardware NPU
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setLoading(false);
    } catch (err) {
      console.error('Failed to load pedagogical intelligence data:', err);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);


  if (loading) {
    return (
      <div className="hub-loading">
        <div className="pelo-loader"></div>
        <p>Sincronizando Grafo Soberano...</p>
      </div>
    );
  }

  return (
    <div className="hub-container animate-fade-in">
      <header className="hub-header">
        <div className="header-info">
          <div className="icon-badge">
            <Brain size={24} color="#6366f1" />
          </div>
          <div>
            <h1>Central de Inteligência Pedagógica</h1>
            <p className="subtitle">Motor de Análise Longitudinal & Soberania de Dados // v4.0</p>
          </div>
        </div>
        
        <div className="header-actions">
          <button className="filter-btn">
            <Calendar size={16} />
            <span>2024-2026</span>
          </button>
          <button className="filter-btn">
            <Filter size={16} />
            <span>Filtros</span>
          </button>
        </div>
      </header>

      <section className="hardware-health-section">
        <HardwareHealthRadar />
      </section>

      <div className="stats-grid">

        <div className="stat-card glass-card">
          <div className="stat-header">
            <Activity size={20} color="#6366f1" />
            <span>Média Global</span>
          </div>
          <div className="stat-value">{stats.globalAvg}</div>
          <div className="stat-footer positive">
            <ArrowUpRight size={14} />
            <span>+2.4% vs 2025</span>
          </div>
        </div>

        <div className="stat-card glass-card">
          <div className="stat-header">
            <AlertTriangle size={20} color="#f43f5e" />
            <span>Alertas Críticos</span>
          </div>
          <div className="stat-value">{stats.activeAlerts}</div>
          <div className="stat-footer negative">
            <ArrowDownRight size={14} />
            <span>8 alunos em risco</span>
          </div>
        </div>

        <div className="stat-card glass-card">
          <div className="stat-header">
            <Users size={20} color="#10b981" />
            <span>Alunos Ativos</span>
          </div>
          <div className="stat-value">{stats.totalStudents}</div>
          <div className="stat-footer">
            <span>Rede Local Estável</span>
          </div>
        </div>
      </div>

      <div className="charts-section">
        <div className="chart-card glass-card main-chart">
          <h3>Evolução da Performance Acadêmica (YoY)</h3>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={historicalData}>
                <defs>
                  <linearGradient id="colorAvg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="year" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" domain={[0, 10]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area type="monotone" dataKey="avg" stroke="#6366f1" fillOpacity={1} fill="url(#colorAvg)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="alerts-list glass-card">
          <div className="list-header">
            <h3>Orquestração de Agentes</h3>
            <span className="badge">5 Planos Ativos</span>
          </div>
          
          <div className="alert-item">
            <div className="alert-icon academic">P</div>
            <div className="alert-content">
              <h4>Plano de Reforço: Lucas Silva</h4>
              <p>Queda de 15% detectada em Matemática (Longitudinal).</p>
            </div>
            <ChevronRight size={16} color="#94a3b8" />
          </div>

          <div className="alert-item">
            <div className="alert-icon behavioral">A</div>
            <div className="alert-content">
              <h4>Adesão: 7º Ano B</h4>
              <p>Melhora constante no engajamento comportamental.</p>
            </div>
            <ChevronRight size={16} color="#94a3b8" />
          </div>

          <button className="view-all-btn">Ver Todos os Insights</button>
        </div>
      </div>
    </div>
  );
};
