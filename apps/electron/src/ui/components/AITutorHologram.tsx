import React, { useState, useEffect } from 'react';
import './AITutorHologram.css';

/**
 * AI TUTOR HOLOGRAM (v3702)
 * ------------------------
 * Avatar 3D de alta fidelidade que serve como interface de apoio ao aluno.
 * Reage dinamicamente às emoções detectadas pelo EmotionBridgeService.
 * Utiliza o sistema de design 'Sovereign Eagle' para máxima imersão.
 */
interface HologramProps {
  emotion?: string; // 'Focused', 'Bored', 'Frustrated'
  engagement?: number;
}

export const AITutorHologram: React.FC<HologramProps> = ({ emotion = 'Focused', engagement = 0.85 }) => {
  const [pulseColor, setPulseColor] = useState('var(--cyan-cyber)');

  useEffect(() => {
    // Reação cromática às emoções (v3647)
    if (emotion === 'Frustrated') setPulseColor('var(--safety-red)');
    else if (emotion === 'Bored') setPulseColor('rgba(0, 255, 255, 0.4)');
    else setPulseColor('var(--cyan-cyber)');
  }, [emotion]);

  return (
    <div className="hologram-container" data-aura={emotion.toLowerCase()}>
      <div className="hologram-aura" />
      
      <div className="hologram-avatar" style={{ '--pulse-glow': pulseColor } as any}>
         <div className="avatar-core" style={{ '--pulse-glow': pulseColor } as any} />
         <div className="avatar-wings" />
      </div>

      <div className="hologram-status holographic-card">
         <p className="metric-label">AI ASSISTANT STATE: {emotion.toUpperCase()}</p>
         <div className="engagement-bar">
            <div 
              className="engagement-fill holographic-engagement-fill" 
              style={{ '--engagement-width': `${engagement * 100}%` } as any}
              aria-label={`Engajamento: ${engagement * 100}%`}
            />
         </div>
         <p className="metric-label hologram-engagement-text">
            ENGAGEMENT: {Math.round(engagement * 100)}%
         </p>
      </div>

      <div className="hologram-glitch-effect" />
    </div>
  );
};
