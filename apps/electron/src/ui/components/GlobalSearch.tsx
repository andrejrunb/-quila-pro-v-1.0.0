import React, { useState, useEffect } from 'react';
import { Search, User, X, Hash, FileText, Book, Brain } from 'lucide-react';
import './GlobalSearch.css';

interface GlobalSearchProps {
  onSelect: (page: string, params?: any) => void;
  onClose: () => void;
}

export const GlobalSearch: React.FC<GlobalSearchProps> = ({ onSelect, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [ragResults, setRagResults] = useState<any[]>([]);
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const aquila = (window as any).aquila;

  useEffect(() => {
    const search = async () => {
      if (query.length < 3) {
        setResults([]);
        setRagResults([]);
        setAiAnswer(null);
        return;
      }
      
      setIsGenerating(true);

      // Busca Alunos
      try {
        const students = await aquila.invoke('get-students');
        if (Array.isArray(students)) {
          const filtered = students.filter((s: any) => 
            s && s.name && (s.name.toLowerCase().includes(query.toLowerCase()) || (s.id && s.id.includes(query)))
          ).slice(0, 5);
          setResults(filtered);
        } else {
          setResults([]);
        }
      } catch (e) {
        console.error('Error fetching students for search:', e);
        setResults([]);
      }

      // Busca RAG (Soberana)
      try {
        const rag = await aquila.invoke('search-rag', query);
        setRagResults(rag || []);
        
        // Síntese de Resposta IA (Omnisearch)
        if (query.includes('?') || query.length > 15) {
          const synthesis = await aquila.invoke('get-ai-synthesis', query);
          setAiAnswer(synthesis);
        } else {
          setAiAnswer(null);
        }
      } catch (err) {
        console.error('RAG Search Error:', err);
      } finally {
        setIsGenerating(false);
      }
    };

    const timer = setTimeout(search, 300);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="search-overlay" onClick={onClose}>
      <div className="global-search-container glass-premium animate-slide-up" onClick={e => e.stopPropagation()}>
        <div className="search-input-wrapper">
          <Search size={22} className="text-blue-500" />
          <input 
            autoFocus
            type="text" 
            placeholder="Pesquisar alunos ou documentos de aula..." 
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <button onClick={onClose} title="Fechar Busca"><X size={18} /></button>
        </div>

        <div className="search-results custom-scroll">
          {isGenerating && !aiAnswer && (
            <div className="ai-loading-indicator">
              <Brain size={16} className="animate-pulse text-blue-400" />
              <span>Consultando Cérebro Soberano...</span>
            </div>
          )}

          {aiAnswer && (
            <div className="ai-answer-box glass-premium animate-fade-in">
               <div className="ai-answer-header">
                  <Brain size={14} /> RESPOSTA DO ENXAME
               </div>
               <p className="ai-answer-text">{aiAnswer}</p>
            </div>
          )}

          {results.length > 0 && (
            <div className="result-group">
               <div className="group-label"><User size={12} /> Alunos</div>
               {results.map(s => (
                 <div key={s.id} className="search-item" onClick={() => onSelect('students', { studentId: s.id })}>
                   <div className="item-avatar">{s.name.charAt(0)}</div>
                   <div className="item-info">
                     <span className="item-name">{s.name}</span>
                     <span className="item-id"><Hash size={10} /> {s.id}</span>
                   </div>
                 </div>
               ))}
            </div>
          )}

          {ragResults.length > 0 && (
            <div className="result-group">
               <div className="group-label"><Brain size={12} /> Cérebro Soberano (IA)</div>
               {ragResults.map((r, i) => (
                 <div key={i} className="search-item rag-item" onClick={() => onSelect('docs', { file: r.file })}>
                   <div className="item-avatar book"><FileText size={16} /></div>
                   <div className="item-info">
                     <span className="item-name">{r.file.split('/').pop()}</span>
                     <span className="item-snippet">{r.snippet}</span>
                   </div>
                   <div className="item-score">{Math.round(r.score * 10)}% match</div>
                 </div>
               ))}
            </div>
          )}

          {results.length === 0 && ragResults.length === 0 && query.length >= 2 && (
            <div className="search-empty">Nenhum resultado encontrado no enxame.</div>
          )}
          
          {query.length < 2 && (
            <div className="search-hint">Digite para buscar no ecossistema Áquila...</div>
          )}
        </div>
      </div>
    </div>
  );
};
