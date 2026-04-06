import React, { useState, useEffect } from 'react';
import { ShieldAlert, Lock, AlertTriangle, ShieldCheck } from 'lucide-react';
import { autonomousActionService } from '../../services/AutonomousActionService';
import './PolicyEnforcer.css';

/**
 * PolicyEnforcer (v1609)
 * Overlay de feedback visual para ações autônomas ativas.
 */
export const PolicyEnforcer: React.FC = () => {
  const [activeActions, setActiveActions] = useState<any[]>([]);

  useEffect(() => {
    const onTrigger = (data: any) => {
      setActiveActions(prev => [...prev, { ...data, id: Math.random().toString(36).substr(2, 9) }]);
      
      // Auto-remover após 15 segundos se não for LOCKDOWN
      if (data.action !== 'LOCKDOWN') {
        setTimeout(() => {
          setActiveActions(prev => prev.filter(a => a.timestamp !== data.timestamp));
        }, 15000);
      }
    };

    autonomousActionService.on('trigger-action', onTrigger);
    return () => {
      autonomousActionService.off('trigger-action', onTrigger);
    };
  }, []);

  if (activeActions.length === 0) return null;

  const isLockdown = activeActions.some(a => a.action === 'LOCKDOWN');

  return (
    <div className={`enforcer-overlay ${isLockdown ? 'enforcer-overlay--critical' : ''}`}>
      {isLockdown && <div className="lockdown-scanline" />}
      
      <div className="enforcer-toast-container">
        {activeActions.map(action => (
          <div key={action.id} className={`enforcer-card ${action.action === 'LOCKDOWN' ? 'card--lockdown' : 'card--intervention'}`}>
            <div className="card-icon-wrapper">
              {action.action === 'LOCKDOWN' ? <Lock size={24} /> : <ShieldAlert size={24} />}
            </div>
            
            <div className="card-content">
              <header className="card-header">
                <span className="badge-critical">
                   {action.action === 'LOCKDOWN' ? 'LOCKDOWN ATIVO' : 'INTERVENÇÃO AUTÔNOMA'}
                </span>
                <span className="card-time">{new Date(action.timestamp).toLocaleTimeString()}</span>
              </header>
              
              <h3 className="card-title">
                {action.action === 'LOCKDOWN' ? 'Bloqueio Total do Perímetro' : 'Restrição de Acesso Local'}
              </h3>
              
              <p className="card-description">
                Gatilho: {action.metadata?.poiType ? `Proximidade a ${action.metadata.poiType}` : 'Detecção de Objeto Letal'}.
                Ação executada via Eagle AI Cluster.
              </p>

              <div className="card-footer">
                <div className="footer-status">
                  <ShieldCheck size={12} />
                  <span>INTEGRIDADE SERIAL ATIVA</span>
                </div>
                {action.action === 'LOCKDOWN' ? (
                   <button 
                     className="btn-override"
                     onClick={() => setActiveActions(prev => prev.filter(a => a.id !== action.id))}
                   >
                     OVERRIDE MANUAL
                   </button>
                ) : null}
              </div>
            </div>

            <div className="card-progress-bar" />
          </div>
        ))}
      </div>

      {isLockdown && (
        <div className="lockdown-alert-text">
          <AlertTriangle size={48} className="blink" />
          <span>ESTADO DE DEFESA NÍVEL 5 ATIVO</span>
        </div>
      )}
    </div>
  );
};
