import React, { useState, useEffect } from 'react';
import { Search, User, X, Hash } from 'lucide-react';
import './GlobalSearch.css';

interface GlobalSearchProps {
  onSelect: (page: string, params?: any) => void;
  onClose: () => void;
}

export const GlobalSearch: React.FC<GlobalSearchProps> = ({ onSelect, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const aquila = (window as any).aquila;

  useEffect(() => {
    const search = async () => {
      if (query.length < 2) {
        setResults([]);
        return;
      }
      const students = await aquila.invoke('get-students');
      const filtered = students.filter((s: any) => 
        s.name.toLowerCase().includes(query.toLowerCase()) || 
        s.id.includes(query)
      ).slice(0, 5);
      setResults(filtered);
    };

    const timer = setTimeout(search, 300);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="search-overlay" onClick={onClose}>
      <div className="search-modal glass-theme" onClick={e => e.stopPropagation()}>
        <div className="search-input-wrapper">
          <Search size={22} className="text-blue-500" />
          <input 
            autoFocus
            type="text" 
            placeholder="Pesquisar aluno... (Esc para fechar)" 
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <button onClick={onClose} title="Fechar Busca"><X size={18} /></button>
        </div>

        <div className="search-results">
          {results.length > 0 ? (
            results.map(s => (
              <div key={s.id} className="search-item" onClick={() => onSelect('students', { studentId: s.id })}>
                <div className="item-avatar">{s.name.charAt(0)}</div>
                <div className="item-info">
                  <span className="item-name">{s.name}</span>
                  <span className="item-id"><Hash size={10} /> {s.id}</span>
                </div>
                <User size={16} className="text-slate-600" />
              </div>
            ))
          ) : query.length >= 2 ? (
            <div className="search-empty">Nenhum aluno encontrado.</div>
          ) : (
            <div className="search-hint">Digite pelo menos 2 caracteres...</div>
          )}
        </div>
      </div>
    </div>
  );
};
