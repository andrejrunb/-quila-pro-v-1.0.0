import React, { useState } from 'react';
import { Shield, ShieldAlert, Lock, Bell, CheckCircle, Plus, Info } from 'lucide-react';
import './ActionPolicyEditor.css';

// Zero-Debt: Removido import de AutonomousActionService (Types vêm de AiTypes se necessário)
interface ActionPolicy {
  id: string;
  triggerEvent: string;
  thresholdDistance?: number;
  poiType?: string;
  action: string;
  enabled: boolean;
}

interface Props {
  policies: ActionPolicy[];
  onToggle: (id: string) => void;
  onAdd: (policy: any) => void;
}

/**
 * ActionPolicyEditor (v1609)
 * Gerenciador de Políticas de Resposta Autônoma.
 * Interface para configurar gatilhos automáticos de IoT.
 */
export const ActionPolicyEditor: React.FC<Props> = ({ policies, onToggle, onAdd }) => {
  const [showAdd, setShowAdd] = useState(false);

  return (
    <div className="policy-editor-container" role="dialog" aria-label="Autonomous Defense Policies">
      
      {/* Header */}
      <header className="policy-header">
        <div className="policy-title-group">
          <div className="policy-icon-wrapper">
            <Shield size={28} />
          </div>
          <div>
            <h2 className="policy-title-main">Autonomous Defense Policies</h2>
            <div className="engine-status">
              <span className="status-pulse" />
              Engine v1609 Active | Rule Latency &lt; 40ms
            </div>
          </div>
        </div>
        <button 
          onClick={() => setShowAdd(!showAdd)}
          className="btn-add-policy"
          title="Nova Política de Automação"
        >
          <Plus size={20} />
        </button>
      </header>

      {/* Warning Box */}
      <div className="warning-box">
        <div className="warning-icon-wrapper">
           <Info size={18} />
        </div>
        <div className="warning-content">
           <span className="warning-label">Aviso de Segurança</span>
           <p className="warning-text">
             Políticas autônomas podem acionar travas físicas instantaneamente. 
             Certifique-se de que os sensores de rádio (RuView) estejam calibrados.
           </p>
        </div>
      </div>

      {/* Rules List */}
      <div className="policies-list">
        {policies.map(policy => (
          <div 
            key={policy.id}
            className={`policy-item ${policy.enabled ? 'policy-item--enabled' : 'policy-item--disabled'}`}
          >
            <div className="policy-info">
              <div className={`action-icon-wrapper ${policy.action === 'LOCK' || policy.action === 'LOCKDOWN' ? 'action-icon--red' : 'action-icon--orange'}`}>
                {policy.action === 'LOCK' || policy.action === 'LOCKDOWN' ? <Lock size={20} /> : <Bell size={20} />}
              </div>
              <div>
                <h3 className="policy-name">
                  {policy.id.replace(/_/g, ' ')}
                </h3>
                <div className="policy-meta">
                   <span>Trigger: {policy.triggerEvent}</span>
                   {policy.thresholdDistance && <span>Distance: &lt;{policy.thresholdDistance}m</span>}
                </div>
              </div>
            </div>

            <div className="policy-controls">
              <div className="status-indicator">
                 <div className={`indicator-dot ${policy.enabled ? 'indicator-dot--enabled' : 'indicator-dot--disabled'}`} />
                 <span className="status-label">{policy.enabled ? 'Enabled' : 'Disabled'}</span>
              </div>
              <button 
                onClick={() => onToggle(policy.id)}
                className={`toggle-switch ${policy.enabled ? 'toggle-switch--enabled' : 'toggle-switch--disabled'}`}
                title="Alternar Atividade"
              >
                <div className={`toggle-thumb ${policy.enabled ? 'toggle-thumb--enabled' : 'toggle-thumb--disabled'}`} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Footer Info */}
      <footer className="policy-footer">
          <div className="footer-item">
            <CheckCircle size={12} className="footer-icon--green" />
            <span>AES-256 Storage Hardened</span>
          </div>
          <div className="footer-item">
            <ShieldAlert size={12} className="footer-icon--blue" />
            <span>Failsafe Manual Override</span>
          </div>
      </footer>
    </div>
  );
};
