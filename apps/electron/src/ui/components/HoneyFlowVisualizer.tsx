import React, { useState, useEffect } from 'react';
import { honeyFlowService, FlowMetric } from '../../services/HoneyFlowService';
import { HexCellCard } from './HexCellCard';
import '../styles/CoolmeiaUX.css';

/**
 * HONEY FLOW VISUALIZER (v4001)
 * ----------------------------
 * Exibe o movimento da escola como um fluxo de mel estruturado.
 * Utiliza o sistema hexagonal para mostrar a viscosidade de cada zona.
 */
export const HoneyFlowVisualizer: React.FC = () => {
  const [metrics, setMetrics] = useState<FlowMetric[]>([]);

  useEffect(() => {
    const updateMetrics = async () => {
      const data = await honeyFlowService.getFlowMetrics();
      setMetrics(data);
    };

    updateMetrics();
    const interval = setInterval(updateMetrics, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="honey-flow-container">
       <h2 className="hive-title hive-header-title">
          HONEY FLOW VISCOSITY | MONITORAMENTO DE FLUXO v4001
       </h2>
       
       <div className="honeycomb-grid">
          {metrics.map(metric => (
            <HexCellCard 
              key={metric.zoneId} 
              title={metric.zoneId} 
              subtitle={`DENSIDADE: ${metric.count} | VISCO: ${(metric.viscosity * 100).toFixed(0)}%`} 
              status={metric.viscosity > 0.8 ? 'alert' : (metric.viscosity > 0.5 ? 'sync' : 'active')}
              icon={metric.viscosity > 0.8 ? '🍯' : '💧'}
            />
          ))}
       </div>

       {/* INSIGHTS COMPORTAMENTAIS (v4001) */}
       <div className="social-anomalies-panel">
          <h4 className="hive-title hive-panel-title">ALERTAS DE INTERAÇÃO SOCIAL</h4>
          <ul className="social-anomalies-list">
             <li>⚠️ Aluno ID_341: Registrado isolamento persistente por 45min (Célula: Pátio B).</li>
             <li>🟡 Sugestão: Validar bem-estar emocional via Mentoria ou Coordenação.</li>
          </ul>
       </div>
    </div>
  );
};
