import React, { useState, useEffect } from 'react';
import { BookOpen, FileText, ChevronRight, Hash } from 'lucide-react';
import './WikiViewerUI.css';

const WikiViewerUI: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<'pages' | 'decisions' | 'runbooks'>('decisions');
  const [pages, setPages] = useState<any[]>([]);
  const [selectedContent, setSelectedContent] = useState<string>('');
  const [selectedTitle, setSelectedTitle] = useState<string>('');

  const fetchPages = async (cat: 'pages' | 'decisions' | 'runbooks') => {
    setActiveCategory(cat);
    try {
      const list = await (window as any).aquila.invoke('wiki:list-pages', { category: cat });
      setPages(list);
      if (list.length > 0) {
        loadPage(cat, list[0].filename, list[0].title);
      } else {
        setSelectedContent('Nenhum documento encontrado nesta categoria.');
        setSelectedTitle('');
      }
    } catch (err) {
      console.error('Erro ao carregar wiki:', err);
    }
  };

  const loadPage = async (cat: string, filename: string, title: string) => {
    try {
      const content = await (window as any).aquila.invoke('wiki:read-page', { category: cat, filename });
      setSelectedContent(content);
      setSelectedTitle(title);
    } catch (err) {
      setSelectedContent('Erro ao carregar conteúdo do arquivo.');
    }
  };

  useEffect(() => {
    fetchPages('decisions');
  }, []);

  return (
    <div className="wiki-container">
      <aside className="wiki-sidebar glass-panel">
        <div className="wiki-brand">
          <BookOpen size={24} className="text-blue-400" />
          <h2>Sovereign Wiki</h2>
        </div>
        
        <div className="wiki-nav">
          <button className={activeCategory === 'decisions' ? 'active' : ''} onClick={() => fetchPages('decisions')}>
            Decisões Arquiteturais
          </button>
          <button className={activeCategory === 'runbooks' ? 'active' : ''} onClick={() => fetchPages('runbooks')}>
            Runbooks Operacionais
          </button>
          <button className={activeCategory === 'pages' ? 'active' : ''} onClick={() => fetchPages('pages')}>
            Memória Institucional
          </button>
        </div>

        <div className="wiki-file-list">
          {pages.map((p, i) => (
            <div key={i} className="wiki-file-item" onClick={() => loadPage(activeCategory, p.filename, p.title)}>
              <FileText size={16} className="text-slate-400" />
              <div>
                <span className="file-title">{p.title}</span>
                <span className="file-date">{p.date}</span>
              </div>
            </div>
          ))}
        </div>
      </aside>

      <main className="wiki-content glass-panel">
        {selectedTitle ? (
          <article className="markdown-body">
            {/* Em produção, usaríamos uma lib como react-markdown aqui.
                Por ora, renderizamos num <pre> para exibir o conteúdo real do arquivo .md */}
            <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
              {selectedContent}
            </pre>
          </article>
        ) : (
          <div className="empty-state">
             <Hash size={48} className="text-slate-600" />
             <p>Selecione um documento para leitura.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default WikiViewerUI;
