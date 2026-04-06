import React from 'react';
import { LogOut, AlertTriangle, ShieldCheck, Database, RefreshCw, X } from 'lucide-react';
import { usePerformance } from '../hooks/PerformanceContext';
import './LogoffModal.css';

interface LogoffModalProps {
  onConfirm: () => void;
  onCancel: () => void;
}

export const LogoffModal: React.FC<LogoffModalProps> = ({ onConfirm, onCancel }) => {
  const { isLiteMode } = usePerformance();

  return (
    <div className={`logoff-overlay animate-fade-in ${isLiteMode ? 'mode-lite' : ''}`}>
      <div className="logoff-container glass-premium border-red animate-pop-in">
        <div className="logoff-danger-header">
           <AlertTriangle size={48} className="text-amber-500 animate-pulse" />
           <h2>ENCERRAR SESSÃO NO TERMINAL?</h2>
           <p>Você está prestes a sair do PC da sala de aula.</p>
        </div>

        <div className="logoff-checklist">
           <div className="check-item ok">
              <ShieldCheck size={18} />
              <span>Criptografia de Sessão [ATIVA]</span>
           </div>
           <div className="check-item ok">
              <Database size={18} />
              <span>Sincronia com Enxame [COMPLETA]</span>
           </div>
           <div className="check-item pending">
              <RefreshCw size={18} className="animate-spin-slow" />
              <span>Status: Aguardando Confirmação Humana</span>
           </div>
        </div>

        <div className="logoff-warning-box">
           <p>
              <strong>IMPORTANTE:</strong> Certifique-se de que nenhum aluno tenha acesso ao seu teclado ou mouse após a saída. 
              Sua identidade pedagógica é o núcleo da soberania da escola.
           </p>
        </div>

        <div className="logoff-actions">
           <button className="btn-cancel-logoff" onClick={onCancel}>
              <X size={18} /> MANTER SESSÃO
           </button>
           <button className="btn-confirm-logoff" onClick={onConfirm}>
              <LogOut size={18} /> ENCERRAR SESSÃO AGORA
           </button>
        </div>
      </div>
    </div>
  );
};
