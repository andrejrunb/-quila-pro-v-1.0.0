import React, { useEffect, useState } from 'react';
import { financialReconciliationService } from '../../services/FinancialReconciliationService';
import './FinancialPulseWidget.css';

/**
 * FinancialPulseWidget (v2641)
 * Real-time institutional financial health monitor.
 */
const FinancialPulseWidget: React.FC = () => {
  const [metrics, setMetrics] = useState(financialReconciliationService.getFinancialPulse());
  const pulseRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (pulseRef.current) {
      pulseRef.current.style.setProperty('--pulse-width', `${(metrics.collected / metrics.expected) * 100}%`);
    }
  }, [metrics]);

  return (
    <div className="finance-pulse-widget">
      <div className="pulse-header">
        <h3 className="text-xs font-black tracking-widest uppercase">PULSO FINANCEIRO</h3>
        <div className="pulse-dot"></div>
      </div>

      <div className="pulse-main">
        <div className="pulse-value">
          <span className="currency">R$</span>
          {metrics.collected.toLocaleString()}
        </div>
        <div className="pulse-capacity">
          <div className="progress-bar">
            <div 
              ref={pulseRef}
              className="progress-fill" 
            ></div>
          </div>
          <span className="progress-label">META: R$ {metrics.expected.toLocaleString()}</span>
        </div>
      </div>

      <div className="pulse-stats">
        <div className="stat">
          <span className="label">CONCILIAÇÃO</span>
          <span className="value">{(metrics.reconciliationRate * 100).toFixed(1)}%</span>
        </div>
        <div className="stat">
          <span className="label">EM DÉBITO</span>
          <span className="value text-red-400">R$ {metrics.deficit.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
};

export default FinancialPulseWidget;
