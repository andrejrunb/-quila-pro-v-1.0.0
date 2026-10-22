import React, { useState, useEffect } from 'react';
import { 
  Heart, 
  Wind, 
  Zap, 
  MapPin, 
  TrendingUp, 
  Smile, 
  Frown, 
  Meh,
  Activity
} from 'lucide-react';
import './EmpathicCockpit.css';

const EmpathicCockpit: React.FC = () => {
  const [pulse, setPulse] = useState<any>(null);

  const fetchPulse = async () => {
    try {
      const p = await (window as any).aquila.invoke('affective:get-climate');
      setPulse(p);
    } catch (err) {
      console.error('Erro ao carregar pulso emocional:', err);
    }
  };

  useEffect(() => {
    fetchPulse();
    const interval = setInterval(fetchPulse, 5000);
    return () => clearInterval(interval);
  }, []);

  if (!pulse) return null;

  return (
    <div className="empathic-container">
      <header className="empathic-header">
        <div className="flex items-center gap-4">
          <Heart size={32} className="text-pink-500 animate-pulse" />
          <div>
            <h1>Empathic Cockpit</h1>
            <p>Ressonância Emocional & Clima Institucional — Nível 37</p>
          </div>
        </div>
      </header>

      <div className="empathic-grid">
        {/* Métricas Globais */}
        <div className="global-metrics glass-panel">
           <div className="metric-box">
              <Smile size={24} className="text-emerald-400" />
              <div className="m-data">
                 <span className="label">Felicidade Coletiva</span>
                 <strong className="text-emerald-400">{pulse.globalHappiness}%</strong>
              </div>
           </div>
           <div className="metric-box">
              <Zap size={24} className="text-amber-400" />
              <div className="m-data">
                 <span className="label">Nível de Estresse</span>
                 <strong className="text-amber-400">{pulse.stressLevel}%</strong>
              </div>
           </div>
        </div>

        {/* Hotspots de Emoção */}
        <section className="hotspots-section glass-panel">
           <h3><MapPin size={18} /> Hotspots Afetivos (Tempo Real)</h3>
           <div className="hotspots-list">
              {pulse.activeHotspots.map((h: any, i: number) => (
                <div key={i} className="hotspot-item">
                   <div className="h-info">
                      <strong>{h.location}</strong>
                      <span>Emoção Dominante: {h.dominantEmotion}</span>
                   </div>
                   <div className={`emotion-indicator ${h.dominantEmotion.toLowerCase()}`}></div>
                </div>
              ))}
           </div>
        </section>

        {/* Visualizador de Ressonância */}
        <aside className="resonance-visualizer glass-panel">
           <h3><Activity size={18} /> Ondas de Ressonância</h3>
           <div className="waves-container">
              <div className="wave-orb joy"></div>
              <div className="wave-orb stress"></div>
              <div className="wave-orb engagement"></div>
           </div>
           <div className="resonance-note">
              <Wind size={14} className="opacity-40" />
              <span>O sistema ajustará automaticamente a iluminação das salas detectadas como "Alta Tensão".</span>
           </div>
        </aside>
      </div>

      <footer className="empathic-footer">
         <TrendingUp size={14} className="text-blue-400" />
         <span>Tendência: Estabilidade emocional crescente após o intervalo.</span>
      </footer>
    </div>
  );
};

export default EmpathicCockpit;
