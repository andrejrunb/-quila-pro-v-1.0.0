import React from 'react';
import './RuViewMapping.css';

interface SignalPoint {
  id: string;
  x: number;
  y: number;
  intensity: number;
  label?: string;
  type?: 'person' | 'infrastructure';
}

interface Props {
  points: SignalPoint[];
  zoneName: string;
}

const SignalNode: React.FC<{ p: SignalPoint }> = ({ p }) => {
  const isPerson = p.type === 'person';
  const typeClass = isPerson ? 'person' : 'infrastructure';

  return (
    <div 
      className="signal-node"
      style={{ 
        '--dot-x': `${p.x}%`, 
        '--dot-y': `${p.y}%`, 
        '--dot-opacity': p.intensity
      } as React.CSSProperties}
    >
      <div className={`node-dot ${typeClass}`}>
        <div className={`node-pulse ${typeClass}`} />
      </div>
      
      {/* Label Tooltip (Zero-Debt CSS) */}
      <div className="node-label-tooltip">
        {p.label || 'Unknown Node'}
      </div>
    </div>
  );
};

export const RuViewMapping: React.FC<Props> = ({ points, zoneName }) => {
  return (
    <div className="ru-map-container" aria-label={`Mapa de Sinais: ${zoneName}`}>
      {points.map(point => (
        <SignalNode key={point.id} p={point} />
      ))}
      
      {/* Overlay de Grid (Zero-Debt SVG) */}
      <svg className="map-grid-overlay">
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
    </div>
  );
};

export default RuViewMapping;
