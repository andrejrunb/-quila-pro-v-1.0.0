import React, { useState } from 'react';
import './NotebookLMHub.css';

interface Source {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: 'lesson' | 'board' | 'transcript' | 'flashcard';
}

const SOURCES: Source[] = [
  { id: '1', name: 'História das Civilizações', description: 'Aula de Segunda-feira (10:00)', icon: '📚', type: 'lesson' },
  { id: '2', name: 'Lousa: Revolução Industrial', description: 'Scanner do Agente 2 (Mapa Mental)', icon: '🖼️', type: 'board' },
  { id: '3', name: 'Transcrição: Era Meiji', description: 'Resumo Gerado Pelo Áquila Pro', icon: '✍️', type: 'transcript' },
  { id: '4', name: 'Deck: Revoluções', description: '15 Flashcards de Revisão SRS', icon: '📇', type: 'flashcard' },
];

const NotebookLMHub: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isCompiling, setIsCompiling] = useState(false);
  const [progress, setProgress] = useState(0);

  const toggleSource = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleExport = async () => {
    if (selectedIds.length === 0) return;

    setIsCompiling(true);
    // Simulação de progresso da I.A/Processamento
    for (let i = 0; i <= 100; i += 10) {
      setProgress(i);
      await new Promise(r => setTimeout(r, 300));
    }

    try {
      // @ts-ignore
      await window.electron.invoke('swarm:export-notebook', selectedIds);
      alert('📦 Conhecimento compilado com sucesso! O arquivo foi salvo na sua pasta de estudos.');
      onClose();
    } catch (err) {
      console.error('Export error:', err);
      setIsCompiling(false);
    }
  };

  return (
    <div className="hub-overlay" onClick={onClose}>
      <div className="hub-modal" onClick={e => e.stopPropagation()}>
        {isCompiling && (
          <div className="hub-compiling">
            <div className="hub-progress-ring"></div>
            <div className="hub-title">Compilando Fontes...</div>
            <div className="hub-subtitle">O Áquila Pro está estruturando os dados para o NotebookLM ({progress}%)</div>
          </div>
        )}

        <header className="hub-header">
          <h1 className="hub-title">Hub de Exportação</h1>
          <p className="hub-subtitle">Selecione os materiais para gerar seu Caderno Inteligente do NotebookLM.</p>
        </header>

        <div className="hub-grid">
          {SOURCES.map(source => (
            <div 
              key={source.id} 
              className={`hub-source-card ${selectedIds.includes(source.id) ? 'selected' : ''}`}
              onClick={() => toggleSource(source.id)}
            >
              <div className="hub-source-icon">{source.icon}</div>
              <div className="hub-source-info">
                <div className="hub-source-name">{source.name}</div>
                <div className="hub-source-desc">{source.description}</div>
              </div>
              <div className="hub-checkbox">
                {selectedIds.includes(source.id) && <span>✓</span>}
              </div>
            </div>
          ))}
        </div>

        <div className="hub-actions">
          <button className="hub-btn hub-btn-secondary" onClick={onClose} disabled={isCompiling}>
            Cancelar
          </button>
          <button 
            className="hub-btn hub-btn-primary" 
            onClick={handleExport}
            disabled={selectedIds.length === 0 || isCompiling}
          >
            Compilar Conhecimento ({selectedIds.length})
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotebookLMHub;
