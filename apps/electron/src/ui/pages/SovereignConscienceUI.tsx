import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  CheckCircle, 
  AlertTriangle, 
  Scale, 
  Leaf, 
  Eye,
  Activity
} from 'lucide-react';
import './SovereignConscienceUI.css';

const SovereignConscienceUI: React.FC = () => {
  const [audits, setAudits] = useState<any[]>([]);

  const fetchAudit = async () => {
    try {
      const a = await (window as any).aquila.invoke('ethics:get-audit');
      setAudits(a);
    } catch (err) {
      console.error('Erro na auditoria ética:', err);
    }
  };

  useEffect(() => {
    fetchAudit();
  }, []);

  return (
    <div className="ethics-container">
      <header className="ethics-header">
        <div className="flex items-center gap-6">
          <div className="ethics-icon-bg">
             <Scale size={32} className="text-slate-300" />
          </div>
          <div>
            <h1>Sovereign Conscience</h1>
            <p>Bússola Ética & Governança Planetária — Nível 48</p>
          </div>
        </div>
      </header>

      <div className="ethics-grid">
        {/* Radar de Auditoria Ética */}
        <section className="audit-radar glass-panel">
           <h3>Auditoria de Integridade Moral</h3>
           <div className="audit-list">
              {audits.map((a, i) => (
                <div key={i} className={`audit-card status-${a.status?.toLowerCase() || ''}`}>
                   <div className="a-header">
                      <strong>{a.category}</strong>
                      {a.status === 'OPTIMAL' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
                   </div>
                   <div className="progress-wrap">
                      <div className="progress-bar" style={{ width: `${a.score}%` }}></div>
                   </div>
                   <p>{a.observations}</p>
                </div>
              ))}
           </div>
        </section>

        {/* Pilares Éticos */}
        <aside className="ethics-pillars">
           <div className="glass-panel pillar-stat">
              <Eye size={24} className="text-blue-400 mb-2" />
              <h3>Transparência Radical</h3>
              <p>Cada decisão do Áquila Pro é auditável e justificada por evidências locais.</p>
           </div>
           <div className="glass-panel pillar-stat">
              <Leaf size={24} className="text-emerald-400 mb-2" />
              <h3>Sustentabilidade Consciente</h3>
              <p>Otimização constante de recursos para minimizar a pegada institucional.</p>
           </div>
           <div className="glass-panel global-status">
              <h3>Status Planetário</h3>
              <div className="flex items-center gap-3 mt-4">
                 <Activity size={16} className="text-emerald-400" />
                 <strong>Consciência Sincronizada</strong>
              </div>
              <p className="text-xs opacity-50 mt-2">Alinhado com Frameworks Éticos 2026+</p>
           </div>
        </aside>
      </div>

      <footer className="ethics-footer">
         <Shield size={14} className="text-slate-400" />
         <span>Sovereign Conscience: A tecnologia servindo à humanidade sob uma ética inegociável.</span>
      </footer>
    </div>
  );
};

export default SovereignConscienceUI;
