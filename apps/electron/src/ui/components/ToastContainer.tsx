import React from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useToast, ToastType } from '../hooks/ToastContext';
import './ToastContainer.css';

const ToastIcon = ({ type }: { type: ToastType }) => {
  switch (type) {
    case 'success': return <CheckCircle2 className="text-success" size={20} />;
    case 'error': return <AlertCircle className="text-danger" size={20} />;
    case 'warning': return <AlertTriangle className="text-warning" size={20} />;
    case 'info': return <Info className="text-primary" size={20} />;
    default: return null;
  }
};

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container" role="status" aria-live="polite">
      {toasts.map((toast) => (
        <div 
          key={toast.id} 
          className={`toast-item glass-card animate-slide-in type-${toast.type}`}
        >
          <div className="toast-content">
            <div className="toast-icon-wrapper">
              <ToastIcon type={toast.type} />
            </div>
            <p className="toast-message">{toast.message}</p>
          </div>
          <button 
            className="toast-close" 
            onClick={() => removeToast(toast.id)}
            aria-label="Fechar"
          >
            <X size={16} />
          </button>
          <div className="toast-progress" style={{ animationDuration: `${toast.duration}ms` }} />
        </div>
      ))}
    </div>
  );
};
