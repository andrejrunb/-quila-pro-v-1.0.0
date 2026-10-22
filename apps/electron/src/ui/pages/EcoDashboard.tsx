import React, { useState, useEffect } from 'react';
import { 
  Leaf, 
  Zap, 
  Droplets, 
  TrendingDown, 
  BarChart3, 
  Sun,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';
import './EcoDashboard.css';

const EcoDashboard: React.FC = () => {
  const [stats, setStats] = useState<any[]>([]);
  const [prediction, setPrediction] = useState<any>(null);

  const fetchData = async () => {
    try {
      const s = await (window as any).aquila.invoke('eco:get-stats');
      const p = await (window as any).aquila.invoke('eco:get-prediction');
      setStats(s);
      setPrediction(p);
    } catch (err) {
      console.error('Erro ao carregar dados eco:', err);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="eco-container">
      <header className="eco-header">
        <div className="flex items-center gap-4">
          <Leaf size={32} className="text-emerald-400" />
          <div>
            <h1>Sustentabilidade Autônoma</h1>
            <p>Gestão de Recursos & Eco-Eficiência — Nível 38</p>
          </div>
        </div>
        
        <div className="eco-badge glass-panel">
           <TrendingDown size={16} className="text-emerald-400" />
           <span>Economia: <strong>14%</strong> vs mês anterior</span>
        </div>
      </header>

      <div className="eco-grid">
        {/* Monitor de Recursos em Tempo Real */}
        <section className="resources-monitor glass-panel">
           <h3><BarChart3 size={18} /> Fluxo de Recursos Real-Time</h3>
           <div className="res-list">
              {stats.map((r, i) => (
                <div key={i} className="res-card">
                   <div className="res-icon">
                      {r.type === 'ENERGY' ? <Zap size={18} className="text-amber-400" /> : <Droplets size={18} className="text-blue-400" />}
                   </div>
                   <div className="res-info">
                      <strong>{r.location}</strong>
                      <span>{r.consumption} {r.type === 'ENERGY' ? 'W' : 'L/min'}</span>
                   </div>
                   <div className={`res-status ${r.status.toLowerCase()}`}>
                      {r.status}
                   </div>
                </div>
              ))}
           </div>
        </section>

        {/* Predição e Planejamento */}
        <aside className="eco-aside">
           <div className="prediction-card glass-panel">
              <h3><Sun size={18} /> Predição de Consumo</h3>
              {prediction && (
                <div className="p-content">
                   <div className="p-item">
                      <label>Energia Estimada</label>
                      <strong>{prediction.expectedEnergy} kWh</strong>
                   </div>
                   <div className="p-item">
                      <label>Água Estimada</label>
                      <strong>{prediction.expectedWater} m³</strong>
                   </div>
                   <div className="confidence-meter">
                      <span>Confiança: {(prediction.confidence * 100).toFixed(0)}%</span>
                      <div className="bar"><div className="fill" style={{ width: `${prediction.confidence * 100}%` }}></div></div>
                   </div>
                </div>
              )}
           </div>

           <div className="policy-card glass-panel">
              <h3><ShieldCheck size={18} /> Política Eco-Soberana</h3>
              <p>O Áquila Pro está priorizando o desligamento de AC em salas com 0 ocupação detectada por mais de 5 minutos.</p>
              <div className="eco-alert">
                 <AlertTriangle size={14} />
                 <span>Vazamento detectado no Bloco C - Investigando...</span>
              </div>
           </div>
        </aside>
      </div>

      <footer className="eco-footer">
         <Leaf size={14} className="text-emerald-400" />
         <span>Campus Sustentável: Sua escola neutralizou 2.4 toneladas de CO2 este semestre.</span>
      </footer>
    </div>
  );
};

export default EcoDashboard;
