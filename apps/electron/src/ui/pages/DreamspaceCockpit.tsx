import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Cpu, 
  Binary, 
  Activity, 
  TrendingUp, 
  AlertCircle,
  Play,
  RotateCcw,
  Target
} from 'lucide-react';
import './DreamspaceCockpit.css';

const DreamspaceCockpit: React.FC = () => {
  const [isSimulating, setIsSimulating] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [projections, setProjections] = useState<any[]>([]);

  const runSimulation = async (scenario: string) => {
    setIsSimulating(true);
    setResult(null);
    try {
      const res = await (window as any).aquila.invoke('dreamspace:run-simulation', { scenarioId: scenario });
      setResult(res);
    } catch (err) {
      console.error('Simulação falhou:', err);
    }
    setIsSimulating(false);
  };

  const fetchProjections = async () => {
    const p = await (window as any).aquila.invoke('dreamspace:get-projections');
    setProjections(p);
  };

  useEffect(() => {
    fetchProjections();
  }, []);

  return (
    <div className="dreamspace-container">
      <header className="dreamspace-header">
        <div className="flex items-center gap-4">
          <div className="dream-icon-bg">
            <Sparkles size={28} className="text-purple-400" />
          </div>
          <div>
            <h1>Institutional Dreamspace</h1>
            <p>Simulador de Realidades Alternativas & Visão Estratégica — Nível 39</p>
          </div>
        </div>
      </header>

      <div className="dreamspace-grid">
        {/* Seletor de Cenários */}
        <section className="scenario-selector glass-panel">
           <h3><Cpu size={18} /> Cenários de Realidade Alternativa</h3>
           <div className="scenario-list">
              <button className="scenario-btn" onClick={() => runSimulation('EXPANSION_20')}>
                 <TrendingUp size={16} /> Expansão Alunos +20%
              </button>
              <button className="scenario-btn" onClick={() => runSimulation('NIGHT_SHIFT')}>
                 <Binary size={16} /> Implementar Turno Noturno
              </button>
              <button className="scenario-btn disabled">
                 <Target size={16} /> Fusão Institucional (Locked)
              </button>
           </div>
        </section>

        {/* Resultados da Simulação */}
        <main className="simulation-view glass-panel">
           {isSimulating ? (
             <div className="simulating-state">
                <RotateCcw size={48} className="animate-spin text-purple-400 mb-6" />
                <p>Processando bilhões de conexões neurais no Sovereign Graph...</p>
             </div>
           ) : result ? (
             <div className="result-content">
                <h2>{result.scenarioName}</h2>
                
                <div className="impacts-grid">
                   <div className="impact-box">
                      <label>Impacto Financeiro</label>
                      <div className="impact-val positive">+{result.impacts.financial}%</div>
                   </div>
                   <div className="impact-box">
                      <label>Performance Acadêmica</label>
                      <div className={`impact-val ${result.impacts.performance >= 0 ? 'positive' : 'negative'}`}>
                         {result.impacts.performance}%
                      </div>
                   </div>
                   <div className="impact-box">
                      <label>Bem-Estar (Campus)</label>
                      <div className={`impact-val ${result.impacts.wellbeing >= 0 ? 'positive' : 'negative'}`}>
                         {result.impacts.wellbeing}%
                      </div>
                   </div>
                </div>

                <div className="recommendations-section">
                   <h3><Activity size={16} /> Recomendações Estratégicas</h3>
                   <ul className="rec-list">
                      {result.recommendations.map((r: string, i: number) => (
                        <li key={i}>{r}</li>
                      ))}
                   </ul>
                </div>
             </div>
           ) : (
             <div className="empty-sim">
                <Play size={48} className="opacity-10 mb-4" />
                <p>Selecione um cenário para iniciar a simulação generativa.</p>
             </div>
           )}
        </main>

        {/* Projeções de Longo Prazo */}
        <aside className="projections-aside glass-panel">
           <h3><TrendingUp size={18} /> Projeções 2027-2029</h3>
           <div className="proj-list">
              {projections.map((p, i) => (
                <div key={i} className="proj-card">
                   <div className="proj-info">
                      <span className="year">{p.year}</span>
                      <strong>{p.metric}</strong>
                   </div>
                   <div className="proj-val">
                      {p.value}
                   </div>
                </div>
              ))}
           </div>
           <div className="simulation-alert">
              <AlertCircle size={14} />
              <span>Acurácia da Simulação: 94.2%</span>
           </div>
        </aside>
      </div>

      <footer className="dreamspace-footer">
         <Binary size={14} className="text-purple-400" />
         <span>Dreamspace Engine v2.0 — Governança Baseada em Realidade Alternativa.</span>
      </footer>
    </div>
  );
};

export default DreamspaceCockpit;
