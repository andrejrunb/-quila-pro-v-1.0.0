import React, { useState, useEffect, useRef } from 'react';
import VoiceAssistant from './VoiceAssistant';
import { Mic } from 'lucide-react';
import './Omnissearch.css';

interface SearchResult {
  id: string;
  title: string;
  path: string;
  type: 'file' | 'event' | 'lesson' | 'doc';
  excerpt: string;
}

const Omnissearch: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showVoice, setShowVoice] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowDown') setActiveIndex(prev => Math.min(prev + 1, results.length + (aiAnswer ? 1 : 0) - 1));
      if (e.key === 'ArrowUp') setActiveIndex(prev => Math.max(prev - 1, 0));
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [results, aiAnswer, onClose]);

  const handleSearch = async (val: string) => {
    setQuery(val);
    if (val.length < 3) {
      setResults([]);
      setAiAnswer(null);
      return;
    }

    setIsSearching(true);
    try {
      // @ts-ignore - IPC Handler definido no main.ts
      const response = await window.electron.invoke('omnissearch:search', val);
      setResults(response.results || []);
      setAiAnswer(response.aiAnswer || null);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="omni-search-wrapper" onClick={onClose}>
      <div className="omni-container" onClick={e => e.stopPropagation()}>
        <header className="omni-header">
          <div className="omni-icon">🧠</div>
          <input 
            ref={inputRef}
            className="omni-input"
            placeholder="Pergunte ao Cérebro do Áquila..."
            value={query}
            onChange={e => handleSearch(e.target.value)}
          />
          <button className="omni-mic-btn" onClick={() => setShowVoice(true)} title="Falar comando">
            <Mic size={20} />
          </button>
          {isSearching && <div className="omni-spinner"></div>}
        </header>

        <div className="omni-results">
          {aiAnswer && (
            <div className={`omni-ai-answer ${activeIndex === 0 ? 'active' : ''}`}>
              <div className="omni-ai-header">
                <span>✦ Resposta da IA Local</span>
              </div>
              <div className="omni-ai-content">
                {aiAnswer}
              </div>
            </div>
          )}

          {results.length > 0 ? (
            results.map((res, i) => (
              <div 
                key={res.id} 
                className={`omni-result-item ${activeIndex === (aiAnswer ? i + 1 : i) ? 'active' : ''}`}
                onMouseEnter={() => setActiveIndex(aiAnswer ? i + 1 : i)}
              >
                <div className="omni-result-icon">
                  {res.type === 'lesson' ? '📚' : res.type === 'doc' ? '📄' : '📁'}
                </div>
                <div className="omni-result-info">
                  <div className="omni-result-title">{res.title}</div>
                  <div className="omni-result-path">{res.path}</div>
                </div>
              </div>
            ))
          ) : query.length >= 3 && !isSearching && (
            <div className="omni-empty">Nenhum resultado encontrado para "{query}"</div>
          )}
        </div>

        <footer className="omni-footer">
          <div className="omni-hint">
            <span>Usando <strong className="omni-accent-text">Enxame Soberano (Agente 1)</strong></span>
          </div>
          <div className="omni-shortcuts">
            <span><span className="omni-key">↑↓</span> Navegar</span>
            <span><span className="omni-key">Enter</span> Abrir</span>
            <span><span className="omni-key">Esc</span> Fechar</span>
          </div>
        </footer>
      </div>

      {showVoice && (
        <VoiceAssistant 
          onResult={(text) => handleSearch(text)} 
          onClose={() => setShowVoice(false)} 
        />
      )}
    </div>
  );
};

export default Omnissearch;
