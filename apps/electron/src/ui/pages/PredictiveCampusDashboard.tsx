import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Calendar, 
  BarChart3, 
  AlertTriangle, 
  Clock, 
  ChevronRight,
  Maximize2,
  Settings2
} from 'lucide-react';
import './PredictiveCampusDashboard.css';

const PredictiveCampusDashboard: React.FC = () => {
  const [projections, setProjections] = useState<any[]>([]);
  const [growth, setGrowth] = useState(10); // 10% base growth
  const [selectedYear, setSelectedYear] = useState(2028);
  const [loading, setLoading] = useState(false);

  const runSimulation = async () => {
    setLoading(true);
    try {
      const results = await (window as any).aquila.invoke('predictive:run-simulation', { enrollmentGrowth: growth });
      setProjections(results);
    } catch (err) {
      console.error('Erro na simulação:', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    runSimulation();
  }, [growth]);

  return (
    <div className="predictive-container">
      <header className="predictive-header">
        <div className="flex items-center gap-4">
          <TrendingUp className="predictive-logo-glow" size={32} />
          <div>
            <h1>Radar Preditivo 5Y</h1>
            <p>Evolução do Gêmeo Digital — Nível 28</p>
          </div>
        </div>
        <div className="simulation-controls">
           <div className="control-item">
              <span>Crescimento Anual</span>
              <input 
                type="range" 
                min="0" max="50" 
                value={growth} 
                onChange={(e) => setGrowth(parseInt(e.target.value))}
              />
              <span className="val-tag">{growth}%</span>
           </div>
        </div>
      </header>

      <div className="predictive-grid">
        {/* Futuro Visualizado (3D Twin Map Projection) */}
        <section className="twin-future-preview glass-panel">
           <div className="time-travel-overlay">
              <span className="year-tag">{selectedYear}</span>
              <div className="status-indicator">ESTADO PROJETADO</div>
           </div>
           
           <div className="future-map-sim">
              {/* Representação visual do campus com mapas de calor preditivos */}
              <div className={`heatmap-zone zone-a ${growth > 20 ? 'critical' : 'warning'}`}>
                 <span className="h-label">Bloco A: {85 + growth}% Uso</span>
              </div>
              <div className="heatmap-zone zone-b">
                 <span className="h-label">Auditório: Nominal</span>
              </div>
           </div>

           <div className="timeline-scroller">
              {[2026, 2027, 2028, 2029, 2030, 2031].map(year => (
                <button 
                  key={year} 
                  className={`time-node ${selectedYear === year ? 'active' : ''}`}
                  onClick={() => setSelectedYear(year)}
                >
                  {year}
                </button>
              ))}
           </div>
        </section>

        {/* Dashboards de Métricas Futuras */}
        <aside className="projection-stats">
           <div className="stat-card glass-panel">
              <h3><BarChart3 size={18} /> Projeção de Alunos</h3>
              {projections.filter(p => p.year === selectedYear).map(p => (
                <div key={p.year} className="p-data">
                   <div className="big-num">{p.projectedEnrollment}</div>
                   <div className="sub-tag">Total Matriculados em {p.year}</div>
                </div>
              ))}
           </div>

           <div className="stat-card glass-panel">
              <h3><Maximize2 size={18} /> Capacidade Física</h3>
              {projections.filter(p => p.year === selectedYear).map(p => (
                <div key={p.year} className="p-data">
                   <div className="progress-bar">
                      <div className="progress-fill" style={{width: `${p.physicalCapacityUsage}%`, background: p.physicalCapacityUsage > 90 ? '#ef4444' : '#3b82f6'}}></div>
                   </div>
                   <div className="sub-tag">{p.physicalCapacityUsage.toFixed(1)}% de ocupação</div>
                </div>
              ))}
           </div>

           <div className="risk-alerts glass-panel">
              <h3><AlertTriangle size={18} /> Alertas de Risco (5Y)</h3>
              <div className="risk-list">
                 {projections.find(p => p.year === selectedYear)?.riskFactors.map((r: string) => (
                   <div key={r} className="risk-item">
                      <ChevronRight size={14} /> {r ? r.replace(/_/g, ' ') : ''}
                   </div>
                 )) || <div className="no-risk">Nenhum risco crítico detectado</div>}
              </div>
           </div>
        </aside>
      </div>

      <footer className="predictive-footer">
         <Clock size={14} className="text-purple-500" />
         <span>Simulação baseada em Algoritmo de Monte Carlo | Áquila Sovereign Intelligence</span>
      </footer>
    </div>
  );
};

export default PredictiveCampusDashboard;
