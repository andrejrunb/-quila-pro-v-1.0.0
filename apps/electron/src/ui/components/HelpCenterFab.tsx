import React, { useState } from 'react';
import { HelpCircle, X } from 'lucide-react';
import { HelpCenter } from './HelpCenter';
import './HelpCenterFab.css';

export const HelpCenterFab: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="help-fab-wrapper">
      {isOpen && (
        <div className="help-center-overlay animate-in fade-in slide-in-from-bottom-10 duration-500">
          <div className="help-center-modal glass-panel">
            <button 
              className="close-help-btn" 
              onClick={() => setIsOpen(false)}
              aria-label="Fechar Ajuda"
            >
              <X size={20} />
            </button>
            <HelpCenter />
          </div>
        </div>
      )}

      <button 
        className={`help-fab-btn ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title="Ajuda e Suporte"
        aria-label="Abrir Central de Ajuda"
      >
        <HelpCircle size={28} />
        {!isOpen && <span className="help-fab-label">Ajuda</span>}
      </button>
    </div>
  );
};

export default HelpCenterFab;
