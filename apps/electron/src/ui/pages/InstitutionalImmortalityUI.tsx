import React, { useState, useEffect } from 'react';
import { 
  Infinity, 
  Sparkles, 
  ShieldCheck, 
  ArrowRightLeft, 
  Layers,
  Zap,
  Book
} from 'lucide-react';
import './InstitutionalImmortalityUI.css';

const InstitutionalImmortalityUI: React.FC = () => {
  const [synthesis, setSynthesis] = useState<any[]>([]);

  const fetchLegacy = async () => {
    try {
      const s = await (window as any).aquila.invoke('legacy:get-synthesis');
      setSynthesis(s);
    } catch (err) {
      console.error('Erro ao carregar síntese de legado:', err);
    }
  };

  const startOnboarding = async () => {
    const res = await (window as any).aquila.invoke('legacy:start-transfer', { role: 'COORDINATOR' });
    alert(`Transferência cultural iniciada! ID: ${res.packageId}`);
  };

  useEffect(() => {
    fetchLegacy();
  }, []);

  return (
    <div className="immortality-container">
      <div className="immortality-bg-glow"></div>
      
      <header className="immortality-header">
        <div className="flex items-center gap-6">
          <div className="icon-wrap">
             <Infinity size={40} className="text-indigo-400" />
          </div>
          <div>
            <h1>Institutional Immortality</h1>
            <p>Legado Coletivo & Perpetuação Cultural — Nível 45</p>
          </div>
        </div>
        <button className="onboarding-btn" onClick={startOnboarding}>
           <ArrowRightLeft size={18} /> Iniciar Transferência Cultural
        </button>
      </header>

      <div className="immortality-grid">
        {/* Pilares da Eternidade */}
        <section className="pillars-area">
           <h3>Pilares da Imortalidade Institucional</h3>
           <div className="pillars-grid">
              {synthesis.map((p, i) => (
                <div key={i} className="pillar-card glass-panel">
                   <div className="p-header">
                      <strong>{p.pillar}</strong>
                      <span className="strength">{p.strength}% Sólido</span>
                   </div>
                   <div className="strength-bar"><div className="fill" style={{ width: `${p.strength}%` }}></div></div>
                   <p className="recommendation">
                      <Sparkles size={14} className="text-indigo-300" />
                      {p.recommendation}
                   </p>
                </div>
              ))}
           </div>
        </section>

        {/* Status de Continuidade */}
        <aside className="continuity-status glass-panel">
           <h3>Status de Continuidade</h3>
           <div className="status-list">
              <div className="status-item">
                 <ShieldCheck size={20} className="text-emerald-400" />
                 <div className="si-data">
                    <label>Transferência de Cargo</label>
                    <strong>Resiliência: ALTA</strong>
                 </div>
              </div>
              <div className="status-item">
                 <Layers size={20} className="text-blue-400" />
                 <div className="si-data">
                    <label>Backup Cultural</label>
                    <strong>Sincronizado (99.8%)</strong>
                 </div>
              </div>
              <div className="status-item">
                 <Zap size={20} className="text-amber-400" />
                 <div className="si-data">
                    <label>Inércia de Conhecimento</label>
                    <strong>Mínima (Fluxo Ativo)</strong>
                 </div>
              </div>
           </div>
           
           <div className="recent-onboarding">
              <h4>Onboarding Cultural Recente:</h4>
              <div className="on-item">
                 <Book size={14} />
                 <span>Prof. Ana - Coordenadora (Concluído)</span>
              </div>
           </div>
        </aside>
      </div>

      <footer className="immortality-footer">
         <Infinity size={14} className="text-indigo-400" />
         <span>Collective Legacy: Garantindo que a alma da escola sobreviva ao tempo.</span>
      </footer>
    </div>
  );
};

export default InstitutionalImmortalityUI;
