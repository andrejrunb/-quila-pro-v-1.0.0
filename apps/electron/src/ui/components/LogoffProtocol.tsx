import React from 'react';
import { LogOut, AlertTriangle, ShieldOff } from 'lucide-react';
import './LogoffProtocol.css';

interface LogoffProtocolProps {
  onConfirm: () => void;
  onCancel: () => void;
}

export const LogoffProtocol: React.FC<LogoffProtocolProps> = ({ onConfirm, onCancel }) => {
  return (
    <div className="logoff-protocol-overlay animate-fade-in">
      <div className="logoff-protocol-content">
        <div className="security-scanlines"></div>
        
        <header className="logoff-header">
          <div className="warning-badge">
            <AlertTriangle size={24} />
            <span>PROTOCOLO DE SAÍDA ATIVO</span>
          </div>
          <h1 className="gigantic-title">SAINDA DA SALA?</h1>
        </header>

        <main className="logoff-body">
          <div className="alert-box-giant">
            <ShieldOff size={80} className="shake-animation" />
            <p className="main-warning-text">
              CERTIFIQUE-SE DE QUE ESTÁ DESLOGANDO DO <span className="highlight">PC DA SALA</span>.
              NÃO DEIXE SUA SESSÃO ABERTA PARA TERCEIROS.
            </p>
          </div>
          
          <div className="security-check-list">
             <div className="check-item">Sessão Segura: PENDENTE</div>
             <div className="check-item">Logs de Atividade: SINCRONIZADOS</div>
          </div>
        </main>

        <footer className="logoff-actions">
          <button className="btn-confirm-logoff" onClick={onConfirm}>
            <LogOut size={24} />
            <span>DESLOGAR AGORA</span>
          </button>
          <button className="btn-cancel-logoff" onClick={onCancel}>
            CONTINUAR LOGADO
          </button>
        </footer>
      </div>
    </div>
  );
};
