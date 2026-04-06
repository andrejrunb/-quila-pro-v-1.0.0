import React, { useState, useEffect } from 'react';
import { 
  Zap, Brain, Mic, 
  BarChart3, Play, Download, 
  Plus, CheckCircle2, AlertTriangle,
  FileSearch, MessageSquareQuote
} from 'lucide-react';
import { HexCellCard } from './HexCellCard';
import './EduScienceHub.css';

interface ActionPill {
  id: string;
  type: 'PEDAGOGICAL' | 'LEGAL' | 'ADMINISTRATIVE';
  content: string;
  suggestedAction: string;
  priority: 'URGENT' | 'RECOMMENDED' | 'INFO';
  status: 'pending' | 'approved' | 'discarded';
}

/**
 * EDU-SCIENCE HUB (v3601)
 * -----------------------
 * Central de Inteligência Pedagógica e Materiais Inteligentes.
 */
const EduScienceHub: React.FC = () => {
  const [pills, setPills] = useState<ActionPill[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pills' | 'podcasts' | 'fidelity'>('pills');

  useEffect(() => {
    loadPills();
  }, []);

  const loadPills = async () => {
    setLoading(true);
    try {
      // @ts-ignore
      const data = await window.electron.invoke('get-action-pills');
      setPills(data || []);
    } catch (err) {
      console.error('Failed to load action pills:', err);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
     if (priority === 'URGENT') return 'text-red-400';
     if (priority === 'RECOMMENDED') return 'text-amber-400';
     return 'text-blue-400';
  };

  return (
    <div className="edu-science-container">
      <header className="edu-header">
         <div className="header-branding">
            <div className="icon-blob">
               <Brain size={28} className="text-amber-400" />
            </div>
            <div>
               <h1 className="edu-title">Edu-Science Hub</h1>
               <p className="edu-subtitle">Soberania Pedagógica & Ciência da Aprendizagem</p>
            </div>
         </div>

         <nav className="edu-tabs">
            <button className={activeTab === 'pills' ? 'active' : ''} onClick={() => setActiveTab('pills')}>Insights Hub</button>
            <button className={activeTab === 'podcasts' ? 'active' : ''} onClick={() => setActiveTab('podcasts')}>Edu-Podcast</button>
            <button className={activeTab === 'fidelity' ? 'active' : ''} onClick={() => setActiveTab('fidelity')}>Fidelidade de Aula</button>
         </nav>
      </header>

      <main className="edu-content">
         {activeTab === 'pills' && (
            <div className="pills-grid animate-fade-in">
               <div className="pills-header">
                  <h2 className="text-xl font-black">Pílulas de Ação Cognitiva</h2>
                  <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">Intervenções recomendadas pelo Agente Pedagógico (v3601)</p>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {pills.length > 0 ? pills.map(pill => (
                     <div key={pill.id} className={`pill-card glass-card ${pill.type.toLowerCase()}`}>
                        <div className="pill-type-badge">
                           <Zap size={10} /> {pill.type}
                        </div>
                        <p className="pill-content">{pill.content}</p>
                        <div className="pill-action-box">
                           <span className="label">Ação Sugerida:</span>
                           <p className="action-text">{pill.suggestedAction}</p>
                        </div>
                        <div className="pill-footer">
                           <span className={`priority ${getPriorityColor(pill.priority)}`}>
                              {pill.priority}
                           </span>
                           <div className="actions">
                              <button className="btn-approve-pill" title="Aprovar Intervenção">
                                 <CheckCircle2 size={16} />
                              </button>
                           </div>
                        </div>
                     </div>
                  )) : (
                     <div className="loading-state">Nenhum insight novo no momento.</div>
                  )}
               </div>
            </div>
         )}

         {activeTab === 'podcasts' && (
            <div className="podcast-portal animate-fade-in">
               <div className="podcast-hero glass-panel">
                  <div className="hero-text">
                     <h2 className="text-2xl font-black italic">Edu-Podcast Generator</h2>
                     <p className="text-slate-400 mt-2">Transforme suas anotações ou apostila em um diálogo pedagógico imersivo entre você e a Áquila.</p>
                     <div className="mt-8 flex gap-4">
                        <button className="btn-sovereign btn-approve">
                           <Plus size={16} /> Gerar Novo Podcast
                        </button>
                        <button className="btn-sovereign">
                           <FileSearch size={16} /> Ver Biblioteca
                        </button>
                     </div>
                  </div>
                  <div className="hero-visual">
                     <div className="mic-aura">
                        <Mic size={48} className="text-amber-500 animate-pulse" />
                     </div>
                  </div>
               </div>

               <div className="recent-podcasts mt-12">
                  <h3 className="text-xs font-black uppercase text-slate-500 tracking-widest mb-6">Últimas Conversas Geradas</h3>
                  <div className="podcast-list grid grid-cols-2 gap-4">
                     <div className="podcast-item-glass">
                        <div className="play-button"><Play size={14} fill="currentColor" /></div>
                        <div className="flex-1">
                           <p className="p-title">Heurística de Presença v34</p>
                           <p className="p-meta">12:45 • Pedagógico • Criado Hoje</p>
                        </div>
                        <Download size={14} className="text-slate-500 cursor-pointer" />
                     </div>
                     <div className="podcast-item-glass">
                        <div className="play-button"><Play size={14} fill="currentColor" /></div>
                        <div className="flex-1">
                           <p className="p-title">Explicação: Artigo 53 ECA</p>
                           <p className="p-meta">05:22 • Jurídico/Social • Criado Ontem</p>
                        </div>
                        <Download size={14} className="text-slate-500 cursor-pointer" />
                     </div>
                  </div>
               </div>
            </div>
         )}

         {activeTab === 'fidelity' && (
            <div className="fidelity-view animate-fade-in">
               <div className="grid grid-cols-4 gap-6">
                  <HexCellCard 
                    title="Engajamento Médio"
                    subtitle="ALUNOS ATIVOS: 84.4%"
                    status="active"
                    icon={<Zap size={20} className="text-yellow-400" />}
                  />
                  <HexCellCard 
                    title="Aura de Inutilidade"
                    subtitle="DETECTADO: 15.6%"
                    status="alert"
                    icon={<AlertTriangle size={20} className="text-red-400" />}
                  />
               </div>
               
               <div className="mt-12 glass-panel p-8">
                  <div className="flex justify-between items-center mb-8">
                     <h3 className="text-xl font-black italic">Fidelidade de Aula (Bio vs Digital)</h3>
                     <BarChart3 size={18} className="text-blue-400" />
                  </div>
                  <p className="text-slate-400 text-sm max-w-2xl">
                     Cruzamento entre **Bio-Presença (CSI WiFi)** e **Engajamento Ativo (Caderno Digital)**. 
                     Identificamos alunos que estão em sala mas não estão produzindo conhecimento real.
                  </p>
                  
                  <div className="fidelity-chart-mock mt-8">
                     {/* Representação visual simplificada (v3601) */}
                     <div className="chart-bar">
                        <div className="bar-label">9º ANO A</div>
                        <div className="bar-track"><div className="bar-fill bar-fill-92"></div></div>
                        <div className="bar-value">92%</div>
                     </div>
                     <div className="chart-bar">
                        <div className="bar-label">3º ANO ALPHA</div>
                        <div className="bar-track"><div className="bar-fill bar-fill-64"></div></div>
                        <div className="bar-value">64%</div>
                        <AlertTriangle size={12} className="ml-2 text-red-500 animate-pulse" />
                     </div>
                  </div>
               </div>
            </div>
         )}
      </main>

      <footer className="edu-footer">
         <div className="flex items-center gap-2 opacity-40">
            <MessageSquareQuote size={14} />
            <span className="text-[10px] font-bold">Cognitive Engine v3.6.1 is monitoring learning outcomes.</span>
         </div>
      </footer>
    </div>
  );
};

export default EduScienceHub;
