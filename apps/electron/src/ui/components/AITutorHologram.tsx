import React from 'react';
import './AITutorHologram.css';

/**
 * AI TUTOR HOLOGRAM (CNE/CP nº 15/2026 Compliant)
 * ----------------------------------------------
 * Interface visual neutra do Tutor Socrático de apoio pedagógico.
 * Não utiliza inferência de emoções nem telemetria afetiva de atenção/engajamento.
 */
interface HologramProps {
  /** Mantido apenas por compatibilidade de assinatura; ignorado conforme CNE/CP nº 15/2026. */
  emotion?: string;
  /** Mantido apenas por compatibilidade de assinatura; ignorado conforme CNE/CP nº 15/2026. */
  engagement?: number;
  statusLabel?: string;
}

export const AITutorHologram: React.FC<HologramProps> = ({
  statusLabel = 'TUTOR SOCRÁTICO ÁQUILA • MODO APOIO'
}) => {
  const pulseColor = 'var(--cyan-cyber)';

  return (
    <div className="hologram-container" data-aura="neutral">
      <div className="hologram-aura" />

      <div className="hologram-avatar" style={{ '--pulse-glow': pulseColor } as React.CSSProperties}>
        <div className="avatar-core" style={{ '--pulse-glow': pulseColor } as React.CSSProperties} />
        <div className="avatar-wings" />
      </div>

      <div className="hologram-status holographic-card">
        <p className="metric-label">{statusLabel}</p>
        <p className="metric-label hologram-engagement-text">
          MEDIAÇÃO PEDAGÓGICA • SEM INFERÊNCIA AFETIVA
        </p>
      </div>

      <div className="hologram-glitch-effect" />
    </div>
  );
};
