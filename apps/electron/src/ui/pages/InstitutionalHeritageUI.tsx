import React, { useState, useEffect } from 'react';
import { 
  History, 
  Search, 
  Award, 
  BookOpen, 
  ChevronRight,
  Clock,
  Star
} from 'lucide-react';
import './InstitutionalHeritageUI.css';

const InstitutionalHeritageUI: React.FC = () => {
  const [timeline, setTimeline] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchTimeline = async () => {
    try {
      const t = await (window as any).aquila.invoke('memory:get-timeline');
      setTimeline(t);
    } catch (err) {
      console.error('Erro ao carregar linha do tempo:', err);
    }
  };

  useEffect(() => {
    fetchTimeline();
  }, []);

  return (
    <div className="heritage-container">
      <header className="heritage-header">
        <div className="flex items-center gap-6">
          <History size={40} className="text-amber-500" />
          <div>
            <h1>Institutional Heritage</h1>
            <p>Núcleo Ancestral & Memória Viva — Nível 44</p>
          </div>
        </div>
        <div className="search-box glass-panel">
           <Search size={18} className="opacity-50" />
           <input 
             type="text" 
             placeholder="Buscar no acervo histórico..." 
             value={searchQuery}
             onChange={(e) => setSearchQuery(e.target.value)}
           />
        </div>
      </header>

      <div className="heritage-content">
        {/* Linha do Tempo */}
        <section className="timeline-section">
           <div className="section-title">
              <Clock size={20} className="text-amber-500" />
              <h3>Linha do Tempo de Excelência</h3>
           </div>
           
           <div className="timeline-v-line">
              {timeline.map((item, i) => (
                <div key={i} className="timeline-item">
                   <div className="year-dot">{item.year}</div>
                   <div className="item-card glass-panel">
                      <div className="type-badge">{item.type}</div>
                      <h4>{item.title}</h4>
                      <p>{item.description}</p>
                      <div className="tags">
                         {item.tags.map((t: string, j: number) => (
                           <span key={j}>#{t}</span>
                         ))}
                      </div>
                   </div>
                </div>
              ))}
           </div>
        </section>

        {/* Destaques e Legado */}
        <aside className="legacy-aside">
           <div className="glass-panel legacy-card">
              <Award size={32} className="text-amber-500 mb-4" />
              <h3>Visão do Fundador</h3>
              <p>"A educação é a ponte entre o passado que nos honra e o futuro que nos desafia."</p>
              <button className="read-more">Explorar Discursos <ChevronRight size={14} /></button>
           </div>

           <div className="glass-panel stats-card">
              <Star size={20} className="text-amber-500 mb-2" />
              <div className="s-val">28 Anos</div>
              <label>De Excelência Educacional</label>
           </div>

           <div className="glass-panel gallery-preview">
              <h3>Acervo Digital</h3>
              <div className="g-grid">
                 <div className="g-item"></div>
                 <div className="g-item"></div>
                 <div className="g-item"></div>
                 <div className="g-item"></div>
              </div>
              <button className="full-gallery">Ver Tudo <BookOpen size={14} /></button>
           </div>
        </aside>
      </div>

      <footer className="heritage-footer">
         <Award size={14} className="text-amber-500" />
         <span>Ancestral Core: Preservando a identidade para guiar a evolução.</span>
      </footer>
    </div>
  );
};

export default InstitutionalHeritageUI;
