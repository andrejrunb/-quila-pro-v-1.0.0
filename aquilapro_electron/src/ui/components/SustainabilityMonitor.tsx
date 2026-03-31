import React from 'react';
import { energySovereigntyService } from '../../services/EnergySovereigntyService';
import './SustainabilityMonitor.css';

/**
 * SustainabilityMonitor (v2841)
 * Visualizes the institution's commitment to ESG and operational efficiency.
 */
const SustainabilityMonitor: React.FC = () => {
  const metrics = energySovereigntyService.getSustainabilityMetrics();
  const gaugeRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (gaugeRef.current) {
      gaugeRef.current.style.setProperty('--efficiency-width', `${metrics.efficiencyScore * 100}%`);
    }
  }, [metrics]);

  return (
    <div className="sustainability-monitor">
      <div className="monitor-header">
        <h3 className="text-xs font-bold tracking-widest text-emerald-400">ESG SOVEREIGNTY</h3>
        <span className="badge">LIVE</span>
      </div>

      <div className="monitor-grid">
        <div className="monitor-item">
          <div className="monitor-value">{metrics.co2SavedKg.toFixed(1)}</div>
          <div className="monitor-label">KG CO2 SALVOS</div>
        </div>
        <div className="monitor-item">
          <div className="monitor-value">R$ {metrics.costReductionBrl.toLocaleString()}</div>
          <div className="monitor-label">ECONOMIA REAL</div>
        </div>
      </div>

      <div className="sustainability-gauge">
        <div className="gauge-track">
           <div 
             ref={gaugeRef}
             className="gauge-fill" 
           ></div>
        </div>
        <div className="gauge-label">EFICIÊNCIA INSTITUCIONAL: {(metrics.efficiencyScore * 100).toFixed(0)}%</div>
      </div>
    </div>
  );
};

export default SustainabilityMonitor;
