import React, { useState, useEffect } from 'react';
import { Sparkles, BrainCircuit, Activity, Zap, ShieldCheck } from 'lucide-react';
import './CortexPulseWidget.css';

interface EvolutionaryInsight {
  id: string;
  category: string;
  content: string;
  timestamp: number;
  severity?: string;
}

/**
 * CortexPulseWidget (v402)
 * Visualização em tempo real da evolução da inteligência do sistema.
 */
const CortexPulseWidget: React.FC = () => {
  const [pulses, setPulses] = useState<EvolutionaryInsight[]>([]);

  useEffect(() => {
    const win = window as any;
    if (win.aquila && win.aquila.onCortexPulse) {
      const unsubscribe = win.aquila.onCortexPulse((insight: EvolutionaryInsight) => {
        setPulses(prev => {
          const updated = [insight, ...prev];
          return updated.slice(0, 4); // Mantém apenas os 4 mais recentes
        });
      });
      return () => unsubscribe();
    }
  }, []);

  const getIcon = (category: string) => {
    switch (category) {
      case 'INFRASTRUCTURE': return <Activity size={12} className="text-blue-400" />;
      case 'SECURITY_RISK': return <ShieldCheck size={12} className="text-red-400" />;
      case 'EVOLUTION': return <Zap size={12} className="text-yellow-400" />;
      default: return <BrainCircuit size={12} className="text-blue-400" />;
    }
  };

  return (
    <div className="cortex-pulse-container">
      <div className="pulse-header">
        <Sparkles size={14} className="text-blue-400 animate-pulse" />
        <span className="pulse-label">CÓRTEX EVOLUTION PULSE</span>
      </div>

      <div className="pulse-list">
        {pulses.length === 0 ? (
          <div className="pulse-empty">
            <div className="scanning-line"></div>
            <span>Aguardando Insights Soberanos...</span>
          </div>
        ) : (
          pulses.map((pulse, idx) => (
            <div 
              key={pulse.id || idx} 
              className={`pulse-item animate-pulse-entry severity-${pulse.severity || 'INFO'}`}
              style={{ opacity: 1 - idx * 0.2 }}
            >
              <div className="pulse-meta">
                {getIcon(pulse.category)}
                <span className="pulse-category">{pulse.category}</span>
                <span className="pulse-time">
                  {new Date(pulse.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>
              <p className="pulse-content">{pulse.content}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CortexPulseWidget;
