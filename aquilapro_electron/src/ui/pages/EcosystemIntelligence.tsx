import React from 'react';
import { 
  TrendingDown, Zap, ShieldCheck, 
  ArrowUpRight, DollarSign, PieChart 
} from 'lucide-react';
import './EcosystemIntelligence.css';

/**
 * EcosystemIntelligence (v1631/v1632)
 * Dashboard de ROI e Gestão Unificada para Diretores.
 */
export const EcosystemIntelligence: React.FC = () => {
  const legacyCosts = [
    { name: 'Urania (Grade)', cost: 450 },
    { name: 'Mensageria SMS', cost: 200 },
    { name: 'Sistema Secretaria', cost: 800 },
    { name: 'App Aluno/Pais', cost: 350 },
  ];

  const totalLegacy = legacyCosts.reduce((acc, curr) => acc + curr.cost, 0);
  const aquilaCost = 1200; // Valor consolidado
  const savings = totalLegacy - (aquilaCost / 12); // Exemplo simplificado

  return (
    <div className="roi-dashboard animate-slide-up">
       <header className="roi-header">
          <div className="flex items-center gap-4">
             <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-400">
                <PieChart size={24} />
             </div>
             <div>
                <h2 className="text-xl font-black italic">Inteligência de Ecossistema</h2>
                <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">ROI de Unificação Institucional</p>
             </div>
          </div>
          <div className="buy-license-badge">LICENÇA ACTIVE - FULL OS</div>
       </header>

       <div className="roi-grid grid grid-cols-3 gap-6 mt-8">
          {/* Card ROI */}
          <div className="roi-card col-span-2 glass-card">
             <div className="card-top">
                <h3 className="text-xs font-black uppercase text-secondary">Economia de Unificação</h3>
                <TrendingDown size={14} className="text-green-500" />
             </div>
             <div className="roi-main-content">
                <div className="comparison-box">
                   <div className="legacy-side">
                      <span className="label">Softwares Fragmentados</span>
                      <span className="value text-red-400/50 line-through">R$ {totalLegacy}/mês</span>
                   </div>
                   <div className="aquila-side">
                      <Zap size={16} className="text-yellow-400 animate-pulse" />
                      <div className="flex flex-col">
                         <span className="label">Ecossistema Áquila</span>
                         <span className="value text-white">R$ {aquilaCost}/ano</span>
                         <span className="text-[9px] text-green-400 font-bold uppercase mt-1">~72% DE ECONOMIA</span>
                      </div>
                   </div>
                </div>
                
                <div className="legacy-items-list mt-8">
                   <h4 className="text-[10px] font-black text-slate-500 uppercase mb-3">Custos Substituídos (Legados)</h4>
                   <div className="flex gap-4">
                      {legacyCosts.map(item => (
                         <div key={item.name} className="legacy-pill">
                            <span className="gray-dot"></span>
                            {item.name}
                         </div>
                      ))}
                   </div>
                </div>
             </div>
          </div>

          {/* Card Health */}
          <div className="roi-card glass-card">
             <div className="card-top">
                <h3 className="text-xs font-black uppercase text-secondary">Eficiência Operacional</h3>
                <ShieldCheck size={14} className="text-blue-500" />
             </div>
             <div className="stats-list mt-6 space-y-4">
                <div className="stat-item">
                   <span className="label">Tempo p/ Grade (Urania Sync)</span>
                   <div className="flex items-center gap-2">
                      <span className="value">Instantâneo</span>
                      <ArrowUpRight size={12} className="text-green-500" />
                   </div>
                </div>
                <div className="stat-item">
                   <span className="label">Taxa de Abertura (Mensagem)</span>
                   <span className="value">98.4%</span>
                </div>
                <div className="stat-item">
                   <span className="label">Divergências Resolvidas</span>
                   <span className="value">14 este mês</span>
                </div>
             </div>
          </div>
       </div>

       <section className="unified-status-footer mt-12 grid grid-cols-4 gap-4">
          <div className="status-mini-card">
             <span className="label">Site Acadêmico</span>
             <span className="status text-green-500">ONLINE</span>
          </div>
          <div className="status-mini-card">
             <span className="label">APP Pais/Alunos</span>
             <span className="status text-green-500">SYNCED</span>
          </div>
          <div className="status-mini-card">
             <span className="label">Totens Informativos</span>
             <span className="status text-blue-400">4 ATIVOS</span>
          </div>
          <div className="status-mini-card">
             <span className="label">Urania Integration</span>
             <span className="status text-slate-500">IDLE</span>
          </div>
       </section>
    </div>
  );
};
