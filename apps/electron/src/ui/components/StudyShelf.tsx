import React from 'react';
import { Book, FileText, Download, Award, Clock } from 'lucide-react';
import './StudyShelf.css';

interface StudyItem {
  id: string;
  title: string;
  subject: string;
  type: 'notebooklm' | 'flashcard_set' | 'pdf_guide';
  progress: number;
  lastAccessed: string;
}

const mockStudies: StudyItem[] = [
  { id: '1', title: 'Bundle: Revolução Industrial v2', subject: 'História', type: 'notebooklm', progress: 85, lastAccessed: '2h ago' },
  { id: '2', title: 'Topologia de Redes Swarm', subject: 'TI/Robótica', type: 'flashcard_set', progress: 40, lastAccessed: 'Yesterday' },
  { id: '3', title: 'Guia de Ética em IA Soberana', subject: 'Filosofia', type: 'pdf_guide', progress: 100, lastAccessed: '3 days ago' },
];

export const StudyShelf: React.FC = () => {
  return (
    <div className="study-shelf-container glass-premium animate-fade-in">
      <header className="shelf-header">
        <div className="shelf-title">
          <Book size={20} className="text-blue-400" />
          <h3>Estante de Estudos Soberana</h3>
        </div>
        <div className="shelf-stats">
          <span><Award size={14} /> 12 Conquistas</span>
          <div className="divider-v"></div>
          <span><Clock size={14} /> 45h Foco</span>
        </div>
      </header>

      <div className="shelf-grid custom-scroll">
        {mockStudies.map(item => (
          <div key={item.id} className="study-item-card group">
            <div className="item-icon-wrapper">
              {item.type === 'notebooklm' && <div className="item-type-indicator nl">N</div>}
              {item.type === 'pdf_guide' && <FileText className="text-red-400" size={24} />}
              {item.type === 'flashcard_set' && <div className="item-type-indicator srs">SRS</div>}
              <div className="item-glow"></div>
            </div>

            <div className="item-info">
                <span className="item-subject">{item.subject}</span>
                <h4 className="item-title">{item.title}</h4>
                
                <div className="item-progress-row">
                    <div className="item-progress-bar">
                        <div 
                          className="item-progress-fill" 
                          style={{ '--item-progress': `${item.progress}%` } as React.CSSProperties}
                        ></div>
                    </div>
                    <span className="item-progress-text">{item.progress}%</span>
                </div>
            </div>

            <div className="item-actions opacity-0 group-hover:opacity-100">
                <button title="Baixar Bundle"><Download size={16} /></button>
                <button className="btn-open-study">ABRIR</button>
            </div>
          </div>
        ))}
        
        {/* Placeholder for Empty States */}
        <div className="study-item-card empty-locked">
            <div className="item-icon-wrapper locked">
                <Award size={24} className="opacity-20" />
            </div>
            <div className="item-info opacity-30">
                <span className="item-subject">Bloqueado</span>
                <h4 className="item-title">Conteúdo da Semana 15</h4>
            </div>
        </div>
      </div>

      <footer className="shelf-footer">
          <p>Seus bundles são gerados localmente via RAG e criptografados para sua privacidade.</p>
      </footer>
    </div>
  );
};
