import React from 'react';
import { Shield, Check, X, AlertTriangle } from 'lucide-react';
import './LGPDConsentModal.css';

interface LGPDConsentModalProps {
  isOpen: boolean;
  termText: string;
  onAccept: () => void;
  onDecline: () => void;
}

const LGPDConsentModal: React.FC<LGPDConsentModalProps> = ({ isOpen, termText, onAccept, onDecline }) => {
  if (!isOpen) return null;

  return (
    <div className="lgpd-modal-overlay">
      <div className="lgpd-modal-content eagle-dark-card animate-slide-up">
        <div className="lgpd-modal-header">
          <div className="header-icon-wrapper">
            <Shield className="header-icon" />
          </div>
          <h2>Termos de Privacidade e LGPD</h2>
        </div>

        <div className="lgpd-modal-body">
          <div className="lgpd-alert-banner">
            <AlertTriangle className="alert-icon" />
            <span>A sua concordância é necessária para utilizar o sistema Áquila Pro.</span>
          </div>
          
          <div className="lgpd-term-container">
            <div className="lgpd-term-text">
              {termText.split('\n').map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>
          </div>
        </div>

        <div className="lgpd-modal-footer">
          <button className="btn-secondary btn-lg" onClick={onDecline}>
            <X size={18} />
            Recusar e Sair
          </button>
          <button className="btn-primary btn-lg" onClick={onAccept}>
            <Check size={18} />
            Concordar e Continuar
          </button>
        </div>
      </div>
    </div>
  );
};

export default LGPDConsentModal;
