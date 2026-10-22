import React, { useState, useEffect } from 'react';
import { 
  Library, 
  Search, 
  Cpu, 
  Book, 
  Share2, 
  Globe,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import './NeuralLibraryUI.css';

const NeuralLibraryUI: React.FC = () => {
  const [nodes, setNodes] = useState<any[]>([]);
  const [query, setQuery] = useState('');

  const handleSearch = async () => {
    try {
      const results = await (window as any).aquila.invoke('library:query-knowledge', { query });
      setNodes(results);
    } catch (err) {
      console.error('Erro na busca neural:', err);
    }
  };

  useEffect(() => {
    handleSearch();
  }, []);

  return (
    <div className="neural-lib-container">
      <div className="neural-stars"></div>
      
      <header className="neural-lib-header">
        <div className="flex items-center gap-6">
          <div className="lib-icon-glow">
             <Library size={32} className="text-indigo-300" />
          </div>
          <div>
            <h1>Neural Library</h1>
            <p>Acesso Universal ao Conhecimento — Áquila Pro Nível 46</p>
          </div>
        </div>
        <div className="neural-search glass-panel">
           <Search size={18} className="text-indigo-400" />
           <input 
             type="text" 
             placeholder="Explorar rede neural de ideias..." 
             value={query}
             onChange={(e) => setQuery(e.target.value)}
             onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
           />
        </div>
      </header>

      <div className="neural-grid">
        {/* Grafo de Conhecimento (Preview Visual) */}
        <section className="knowledge-graph glass-panel">
           <div className="graph-header">
              <Share2 size={18} className="text-indigo-400" />
              <h3>Conexões Cognitivas</h3>
           </div>
           <div className="graph-viz">
              <div className="node central">Fundamentos</div>
              <div className="node side s1">Física</div>
              <div className="node side s2">IA</div>
              <div className="node side s3">Lógica</div>
              <div className="connection c1"></div>
              <div className="connection c2"></div>
              <div className="connection c3"></div>
           </div>
        </section>

        {/* Resultados da Busca Neural */}
        <main className="results-area">
           {nodes.map((node, i) => (
             <div key={i} className="knowledge-card glass-panel">
                <div className="k-header">
                   <div className="cat-tag">{node.category}</div>
                   <Sparkles size={16} className="text-amber-400" />
                </div>
                <h2>{node.title}</h2>
                <p>{node.summary}</p>
                <div className="k-footer">
                   <div className="conn-count">
                      <Share2 size={12} /> {node.connections.length} conexões detectadas
                   </div>
                   <button className="read-btn">Acessar Neurônio <ChevronRight size={14} /></button>
                </div>
             </div>
           ))}
        </main>

        {/* Estatísticas da Biblioteca */}
        <aside className="lib-stats glass-panel">
           <h3><Globe size={18} /> Universo Cognitivo</h3>
           <div className="stat-item">
              <Book size={20} className="text-indigo-400" />
              <div className="st-data">
                 <label>Acervo Total</label>
                 <strong>1.2M Neurônios</strong>
              </div>
           </div>
           <div className="stat-item">
              <Cpu size={20} className="text-emerald-400" />
              <div className="st-data">
                 <label>Espaço Vetorial</label>
                 <strong>1,536 Dimensões</strong>
              </div>
           </div>
           <div className="lib-status">
              <div className="status-dot"></div>
              <span>Sistema RAG Sincronizado</span>
           </div>
        </aside>
      </div>

      <footer className="neural-lib-footer">
         <Library size={14} className="text-indigo-400" />
         <span>Neural Library: Democratizando o acesso à sabedoria institucional através da IA.</span>
      </footer>
    </div>
  );
};

export default NeuralLibraryUI;
