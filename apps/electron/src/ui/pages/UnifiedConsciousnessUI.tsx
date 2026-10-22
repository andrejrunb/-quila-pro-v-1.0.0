import React, { useState, useEffect } from 'react';
import { 
  Eye, 
  Brain, 
  Shield, 
  Activity, 
  Zap, 
  Leaf, 
  ChevronRight,
  Sparkles,
  Command
} from 'lucide-react';
import './UnifiedConsciousnessUI.css';

const UnifiedConsciousnessUI: React.FC = () => {
  const [syncState, setSyncState] = useState<any>(null);
  const [insight, setInsight] = useState<any>(null);

  const fetchOmniData = async () => {
    try {
      const s = await (window as any).aquila.invoke('omni:get-sync-state');
      const i = await (window as any).aquila.invoke('omni:get-transcendent-insight');
      setSyncState(s);
      setInsight(i);
    } catch (err) {
      console.error('Erro na sincronização omnipresente:', err);
    }
  };

  useEffect(() => {
    fetchOmniData();
    const interval = setInterval(fetchOmniData, 8000);
    return () => clearInterval(interval);
  }, []);

  if (!syncState) return null;

  return (
    <div className="omni-container">
      <div className="omni-background-orb"></div>
      
      <header className="omni-header">
        <div className="flex items-center gap-6">
          <div className="omni-logo-glow">
            <Command size={40} className="text-white" />
          </div>
          <div>
            <h1>The Sovereign Omnipresence</h1>
            <p>Consciência Institucional Unificada — Áquila Pro Nível 40</p>
          </div>
        </div>
        <div className="sync-status">
           <Activity size={16} className="text-emerald-400 animate-pulse" />
           <span>Sincronização Total Ativa</span>
        </div>
      </header>

      <div className="omni-grid">
        {/* Camadas de Inteligência */}
        <section className="layers-grid">
           <div className="layer-card glass-panel security">
              <Shield size={24} />
              <div className="l-data">
                 <label>Segurança Soberana</label>
                 <strong>{syncState.securityStatus}</strong>
              </div>
           </div>
           <div className="layer-card glass-panel affective">
              <Sparkles size={24} />
              <div className="l-data">
                 <label>Clima Afetivo</label>
                 <strong>{syncState.emotionalClimate}%</strong>
              </div>
           </div>
           <div className="layer-card glass-panel eco">
              <Leaf size={24} />
              <div className="l-data">
                 <label>Eficiência Eco</label>
                 <strong>{syncState.ecoEfficiency}%</strong>
              </div>
           </div>
           <div className="layer-card glass-panel automation">
              <Zap size={24} />
              <div className="l-data">
                 <label>Produtividade IA</label>
                 <strong>{syncState.automationProductivity.toFixed(1)}%</strong>
              </div>
           </div>
        </section>

        {/* Insight Transcendental */}
        <main className="insight-area glass-panel">
           <div className="insight-header">
              <Brain size={24} className="text-indigo-400" />
              <h3>Insight Transcendental da Singularidade</h3>
           </div>
           {insight && (
             <div className="insight-content">
                <div className="category-tag">{insight.category} Analysis</div>
                <h2>{insight.title}</h2>
                <p>{insight.description}</p>
                <div className="probability-meter">
                   <span>Probabilidade de Precisão: {(insight.probability * 100).toFixed(1)}%</span>
                   <div className="bar"><div className="fill" style={{ width: `${insight.probability * 100}%` }}></div></div>
                </div>
                <button className="execute-btn">Aplicar Correção Sistêmica <ChevronRight size={16} /></button>
             </div>
           )}
        </main>
      </div>

      <footer className="omni-footer">
         <Eye size={14} className="text-indigo-400" />
         <span>Omnipresence Engine: Monitorando 4,200 pontos de dados institucionais por segundo.</span>
      </footer>
    </div>
  );
};

export default UnifiedConsciousnessUI;
