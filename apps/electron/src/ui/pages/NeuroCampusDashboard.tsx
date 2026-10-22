import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Brain, 
  Wind, 
  Sun, 
  Coffee, 
  Zap,
  CheckCircle2,
  AlertCircle,
  Play
} from 'lucide-react';
import './NeuroCampusDashboard.css';

const NeuroCampusDashboard: React.FC = () => {
  const [atmosphere, setAtmosphere] = useState<string>('CONTENT');
  const [activeScene, setActiveScene] = useState<string>('DEEP_WORK');
  const [health, setHealth] = useState<any>(null);

  const fetchData = async () => {
    try {
      // Em produção, isso viria via IPC real
      const h = await (window as any).aquila.invoke('neuro:get-health');
      setHealth(h);
    } catch (err) {
      console.error('Erro ao buscar dados Neuro:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="neuro-container">
      <header className="neuro-header">
        <div className="flex items-center gap-4">
          <Brain className="neuro-logo-glow" size={32} />
          <div>
            <h1>Neuro-Campus Dashboard</h1>
            <p>Malha de Aprendizado Adaptativo (ALM) — Nível 26</p>
          </div>
        </div>
        <div className="vibe-indicator">
           <span className="v-label">Atmosfera Atual</span>
           <span className={`v-value ${atmosphere}`}>{atmosphere}</span>
        </div>
      </header>

      <div className="neuro-grid">
        {/* Visualização de Atmosfera (Fluida) */}
        <section className="vibe-visualizer glass-panel">
           <div className="vibe-blob"></div>
           <div className="vibe-blob second"></div>
           <div className="vibe-content">
              <h3>Pulso Cognitivo Coletivo</h3>
              <div className="metrics-row">
                 <div className="m-item">
                    <span className="m-val">92%</span>
                    <span className="m-lab">Foco</span>
                 </div>
                 <div className="m-item">
                    <span className="m-val">12%</span>
                    <span className="m-lab">Stress</span>
                 </div>
                 <div className="m-item">
                    <span className="m-val">85%</span>
                    <span className="m-lab">Arousal</span>
                 </div>
              </div>
           </div>
        </section>

        {/* Controle de Cenas */}
        <section className="scene-control glass-panel">
           <h3><Zap size={18} /> Cenas Ambientais Ativas</h3>
           <div className="scene-list">
              <div className={`scene-card ${activeScene === 'DEEP_WORK' ? 'active' : ''}`}>
                 <div className="s-icon"><Coffee size={20} /></div>
                 <div className="s-info">
                    <strong>Deep Work</strong>
                    <p>Luz fria (60%), AC 22°C, Som ambiente Neutro</p>
                 </div>
                 {activeScene === 'DEEP_WORK' && <CheckCircle2 className="text-emerald-500" size={18} />}
              </div>
              <div className={`scene-card ${activeScene === 'CALM' ? 'active' : ''}`}>
                 <div className="s-icon"><Wind size={20} /></div>
                 <div className="s-info">
                    <strong>Calm Recovery</strong>
                    <p>Luz quente (30%), AC 24°C, Ventilação reduzida</p>
                 </div>
              </div>
              <div className={`scene-card ${activeScene === 'ACTIVE' ? 'active' : ''}`}>
                 <div className="s-icon"><Sun size={20} /></div>
                 <div className="s-info">
                    <strong>Active Pulse</strong>
                    <p>Luz plena (100%), AC 21°C, Foco em alerta</p>
                 </div>
              </div>
           </div>
           <button className="btn-auto-sync">
              <Play size={14} fill="currentColor" /> Ativar Sincronização Autônoma
           </button>
        </section>

        {/* Impacto Pedagógico */}
        <section className="impact-box glass-panel">
           <h3><Activity size={18} /> ROI de Aprendizado</h3>
           <div className="impact-chart-sim">
              <div className="chart-bar" style={{height: '80%'}}></div>
              <div className="chart-bar" style={{height: '65%'}}></div>
              <div className="chart-bar highlight" style={{height: '95%'}}></div>
              <div className="chart-bar" style={{height: '75%'}}></div>
           </div>
           <p className="impact-footer">
              <AlertCircle size={14} /> Melhoria de <strong>14%</strong> na retenção de conteúdo esta semana.
           </p>
        </section>
      </div>

      <footer className="neuro-footer">
         <Activity size={14} className="text-blue-500" />
         <span>Latência Neuro-Ambiental: 45ms | Malha Sincronizada</span>
      </footer>
    </div>
  );
};

export default NeuroCampusDashboard;
