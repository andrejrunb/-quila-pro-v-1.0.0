import React from 'react';
import { X, Keyboard } from 'lucide-react';
import { SHORTCUT_REFERENCE } from '../hooks/useKeyboardShortcuts';
import './HelpModal.css';

interface Props {
  onClose: () => void;
}

export const HelpModal: React.FC<Props> = ({ onClose }) => {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="help-modal-title"
      className="help-modal-overlay"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="help-modal-content">
        {/* Header */}
        <div className="help-modal-header">
          <div className="help-modal-title-group">
            <div className="help-modal-icon-wrapper">
              <Keyboard size={20} color="#60a5fa" />
            </div>
            <h2 id="help-modal-title" className="help-modal-title">
              Atalhos de Teclado
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar ajuda"
            className="help-modal-close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Shortcut List */}
        <div className="help-modal-body">
          {SHORTCUT_REFERENCE.map((shortcut, i) => (
            <div
              key={i}
              className="help-modal-row"
            >
              <span className="help-modal-description">{shortcut.description}</span>
              <div className="help-modal-keys">
                {shortcut.keys.map((key, k) => (
                  <React.Fragment key={k}>
                    <kbd className="kbd">{key}</kbd>
                    {k < shortcut.keys.length - 1 && (
                      <span className="help-modal-plus">+</span>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer hint */}
        <div className="help-modal-footer">
          Pressione <kbd className="kbd">?</kbd> ou <kbd className="kbd">Esc</kbd> para fechar
        </div>
      </div>
    </div>
  );
};

export default HelpModal;
