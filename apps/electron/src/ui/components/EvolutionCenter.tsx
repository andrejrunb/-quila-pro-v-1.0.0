import React, { useState, useEffect } from 'react';
import { HexCellCard } from './HexCellCard';
import '../styles/CoolmeiaUX.css';

/**
 * EVOLUTION CENTER (CENTRO DE EVOLUÇÃO) v6001
 * -----------------------------------------
 * Visualiza o progresso da IA Soberana e a auto-otimização do ecossistema.
 */

export const EvolutionCenter: React.FC = () => {
  const [evolutionLogs, setEvolutionLogs] = useState<any[]>([]);
  const [currentMultiplier, setCurrentMultiplier] = useState<number>(1.0);

  useEffect(() => {
    loadEvolutionData();
  }, []);

  const loadEvolutionData = async () => {
    const logs = await (window as any).api.db.all(
      `SELECT * FROM sovereign_evolution_log ORDER BY optimized_at DESC LIMIT 10`
    );
    setEvolutionLogs(logs);
    if (logs.length > 0) {
      setCurrentMultiplier(logs[0].confidence_multiplier);
    }
  };

  return (
    <div className="evolution-center-container coolmeia-command-center">
      <header className="cockpit-header">
        <div className="brand-group">
           <h2 className="hive-title">CENTRO DE EVOLUÇÃO (v6001)</h2>
           <p className="hive-subtitle">AUTO-OTIMIZAÇÃO & MATURIDADE SOBERANA</p>
        </div>
        <div className="hive-badge-group">
           <div className="hive-badge">SIE ACTIVE: LVL 6</div>
        </div>
      </header>

      <div className="evolution-hero-grid">
         <div className="evolution-main-stat">
            <span className="stat-label">MULTIPLICADOR DE CONFIANÇA ATUAL</span>
            <span className="stat-value">{(currentMultiplier).toFixed(3)}x</span>
            <p className="stat-desc">Ajuste algorítmico baseado na eficácia institucional.</p>
         </div>

         <div className="evolution-metrics-hex">
            <HexCellCard 
               title="APRENDIZADO" 
               subtitle={`${evolutionLogs.length} Ciclos`} 
               status="sync" 
               icon="🎓"
            />
            <HexCellCard 
               title="IMPACTO MÉDIO" 
               subtitle={`${(evolutionLogs.reduce((a, b) => a + b.avg_impact, 0) / (evolutionLogs.length || 1) * 100).toFixed(1)}%`} 
               status="sync" 
               icon="⚡"
            />
         </div>
      </div>

      <section className="evolution-timeline">
         <h3 className="panel-section-title">HISTÓRICO DE OTIMIZAÇÃO SOBERANA</h3>
         <div className="timeline-list">
            {evolutionLogs.map((log) => (
              <div key={log.id} className="timeline-item">
                 <div className="timeline-date">{new Date(log.optimized_at).toLocaleString()}</div>
                 <div className="timeline-content">
                    <div className="evolution-pill">
                       <span className="pill-tag">IMPACTO: {(log.avg_impact * 100).toFixed(2)}%</span>
                       <span className="pill-tag">NEW BIAS: {log.confidence_multiplier.toFixed(3)}x</span>
                    </div>
                    <p className="evolution-summary">
                       Otimização baseada em {log.data_samples} amostras de governança adaptativa.
                    </p>
                 </div>
              </div>
            ))}
         </div>
      </section>

      <footer className="cockpit-footer">
          <p>SIE v6.0.1 | AUTO-GOVERNANCE ACTIVE | DATA SOVEREIGNTY VERIFIED</p>
      </footer>
    </div>
  );
};
