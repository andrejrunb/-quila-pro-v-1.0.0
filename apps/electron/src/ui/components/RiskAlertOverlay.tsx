import React, { useState, useEffect } from 'react';
import { AlertTriangle, Brain, X, ChevronRight } from 'lucide-react';
import './RiskAlertOverlay.css';

/**
 * Phase 520: RiskAlertOverlay
 * Alerta proativo disparado pelo ConflictPredictionEngine.
 */
export const RiskAlertOverlay: React.FC = () => {
  const [activeRisk, setActiveRisk] = useState<any>(null);

  useEffect(() => {
    // Simulação de recebimento via IPC
    const mockTimeout = setTimeout(() => {
      setActiveRisk({
        id: 'r1',
        title: 'RISCO DE CONFLITO ELEVADO',
        severity: 'high',
        location: 'Corredor Norte (Perto dos Armários)',
        confidence: 0.89,
        action: 'Intervenção Pedagógica Sugerida'
      });
    }, 15000);
    return () => clearTimeout(mockTimeout);
  }, []);

  const meterRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeRisk && meterRef.current) {
      meterRef.current.style.setProperty('--risk-confidence', `${activeRisk.confidence * 100}%`);
    }
  }, [activeRisk]);

  if (!activeRisk) return null;

  return (
    <div className={`risk-overlay-container severity-${activeRisk.severity} animate-in`}>
      <div className="risk-overlay-content">
        <header className="risk-overlay-header">
          <div className="flex items-center gap-2">
            <Brain size={20} className="animate-pulse" />
            <span className="font-bold text-sm tracking-widest uppercase">Inteligência Preditiva</span>
          </div>
          <button onClick={() => setActiveRisk(null)} title="Dispensar Alerta">
            <X size={16} />
          </button>
        </header>

        <main className="risk-overlay-body">
          <div className="risk-title-box">
            <AlertTriangle size={24} />
            <h3 className="text-xl font-black">{activeRisk.title}</h3>
          </div>
          <div className="risk-meta">
            <p className="text-sm opacity-80">{activeRisk.location}</p>
            <div className="confidence-meter">
              <span className="text-[10px] uppercase font-bold">Confiança IA: {(activeRisk.confidence * 100).toFixed(0)}%</span>
              <div className="meter-bg">
                <div 
                  ref={meterRef}
                  className="meter-fill" 
                />
              </div>
            </div>
          </div>
        </main>

        <footer className="risk-overlay-footer">
          <p className="text-xs font-semibold text-white/90">{activeRisk.action}</p>
          <button className="risk-cta-btn">
            <span>DETALHAR GRAFO</span>
            <ChevronRight size={14} />
          </button>
        </footer>
      </div>
    </div>
  );
};
