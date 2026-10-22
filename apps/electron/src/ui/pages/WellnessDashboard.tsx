import React, { useState, useEffect } from 'react';
import { 
  Heart, 
  Activity, 
  Coffee, 
  UserCheck, 
  AlertCircle, 
  TrendingUp,
  Apple,
  Wind
} from 'lucide-react';
import './WellnessDashboard.css';

const WellnessDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<any>(null);
  const [report, setReport] = useState<any>(null);

  const fetchWellnessData = async () => {
    try {
      const m = await (window as any).aquila.invoke('wellness:get-state');
      const r = await (window as any).aquila.invoke('wellness:get-report', { groupId: 'GERAL' });
      setMetrics(m);
      setReport(r);
    } catch (err) {
      console.error('Erro ao carregar dados de bem-estar:', err);
    }
  };

  useEffect(() => {
    fetchWellnessData();
    const interval = setInterval(fetchWellnessData, 10000);
    return () => clearInterval(interval);
  }, []);

  if (!metrics) return null;

  return (
    <div className="wellness-container">
      <header className="wellness-header">
        <div className="flex items-center gap-4">
          <Heart size={32} className="text-rose-400" />
          <div>
            <h1>Holistic Health Mesh</h1>
            <p>Guardião de Bem-Estar & Saúde Preventiva — Nível 41</p>
          </div>
        </div>
      </header>

      <div className="wellness-grid">
        {/* Métricas de Ergonomia e Fadiga */}
        <section className="metrics-section glass-panel">
           <div className="metric-card">
              <UserCheck size={20} className="text-sky-400" />
              <div className="m-info">
                 <label>Score de Postura (Média)</label>
                 <strong>{metrics.avgPosture.toFixed(0)}%</strong>
              </div>
           </div>
           <div className="metric-card">
              <Coffee size={20} className="text-amber-400" />
              <div className="m-info">
                 <label>Nível de Fadiga Detectado</label>
                 <strong>{metrics.avgFatigue.toFixed(0)}%</strong>
              </div>
           </div>
           <div className="metric-card alert">
              <AlertCircle size={20} className="text-rose-400" />
              <div className="m-info">
                 <label>Alertas Ativos</label>
                 <strong>{metrics.totalAlerts}</strong>
              </div>
           </div>
        </section>

        {/* Auditoria de Saúde */}
        <main className="audit-section glass-panel">
           <div className="flex justify-between items-center mb-6">
              <h3><Apple size={18} /> Auditoria Nutricional & Atividade</h3>
              <div className="nutrition-tag">Índice Nutricional: {report?.nutritionIndex}%</div>
           </div>

           <div className="recommendations">
              <h4>Recomendações da IA Wellness:</h4>
              <ul className="rec-list">
                 {report?.recommendations.map((r: string, i: number) => (
                   <li key={i}>{r}</li>
                 ))}
              </ul>
           </div>

           {report?.sedentaryWarning && (
             <div className="sedentary-alert">
                <Activity size={16} className="animate-bounce" />
                <span>Nível de sedentarismo elevado detectado hoje. Sugerimos "Pausa Ativa" agora!</span>
             </div>
           )}
        </main>

        {/* Tendências e Correlações */}
        <aside className="trends-aside glass-panel">
           <h3><TrendingUp size={18} /> Tendências de Bem-Estar</h3>
           <div className="trend-item">
              <Wind size={16} className="text-emerald-400" />
              <span>Qualidade do Ar: <strong>Excelente</strong></span>
           </div>
           <div className="trend-note">
              <p>Nota: Picos de fadiga correlacionam com baixa luminosidade no Bloco D.</p>
           </div>
        </aside>
      </div>

      <footer className="wellness-footer">
         <Heart size={14} className="text-rose-400" />
         <span>Wellness Guardian: Cuidando da saúde física para potencializar o aprendizado mental.</span>
      </footer>
    </div>
  );
};

export default WellnessDashboard;
