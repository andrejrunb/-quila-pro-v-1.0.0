import React from 'react';

interface Props {
  seed: string;
  state?: 'focus' | 'rest' | 'normal';
  entropy?: number; // 0 to 100
  size?: number;
}

const SovereignAvatar: React.FC<Props> = ({ seed, state = 'normal', entropy = 50, size = 120 }) => {
  // Velocidade de animação baseada na entropia (maior entropia = pulso mais rápido)
  const pulseDur = Math.max(0.5, 3 - (entropy / 40)) + 's';
  const rotateDur = Math.max(2, 10 - (entropy / 20)) + 's';
  // Cores dinâmicas baseadas no estado Neuro-UX
  const colors = {
    focus: { primary: '#00ffcc', secondary: '#0066ff', glow: 'rgba(0, 255, 204, 0.4)' },
    rest: { primary: '#ff8800', secondary: '#ff4400', glow: 'rgba(255, 136, 0, 0.4)' },
    normal: { primary: '#ffffff', secondary: '#444444', glow: 'rgba(255, 255, 255, 0.2)' }
  }[state];

  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      style={{ filter: `drop-shadow(0 0 15px ${colors.glow})`, transition: 'all 0.5s ease' }}
    >
      {/* Background Halo */}
      <circle cx="50" cy="50" r="45" stroke={colors.primary} strokeWidth="0.5" strokeDasharray="2 4" opacity="0.3" />
      
      {/* 3D-Style Geometry (Abstract "Digital Double") */}
      <defs>
        <linearGradient id="avatarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={colors.primary} />
          <stop offset="100%" stopColor={colors.secondary} />
        </linearGradient>
      </defs>

      <path 
        d="M50 20 L80 50 L50 80 L20 50 Z" 
        fill="url(#avatarGrad)" 
        fillOpacity="0.8" 
        stroke={colors.primary} 
        strokeWidth="1"
      >
        <animateTransform 
          attributeName="transform" 
          type="rotate" 
          from="0 50 50" 
          to="360 50 50" 
          dur={rotateDur} 
          repeatCount="indefinite" 
        />
      </path>

      {/* Internal Core (Focus Indicator) */}
      <circle cx="50" cy="50" r="10" fill={colors.primary}>
        <animate 
          attributeName="r" 
          values="8;12;8" 
          dur={pulseDur} 
          repeatCount="indefinite" 
        />
      </circle>

      {/* Floating Orbits */}
      <circle cx="50" cy="50" r="35" stroke={colors.primary} strokeWidth="0.5" opacity="0.5" strokeDasharray="10 5" />
    </svg>
  );
};

export default SovereignAvatar;
