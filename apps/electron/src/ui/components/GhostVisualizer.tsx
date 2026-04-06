import React from 'react';
import { Activity, User } from 'lucide-react';
import { GhostPresence } from '../../services/AiTypes';
import './GhostVisualizer.css';

interface GhostVisualizerProps {
  ghosts: GhostPresence[];
}

/**
 * GhostVisualizer (Phase v3441)
 * Visualização 3D/Esquemática de detecções passivas (WiFi CSI).
 * Exibe sujeitos em áreas sem câmeras como "fantasmas" digitais.
 */
export const GhostVisualizer: React.FC<GhostVisualizerProps> = ({ ghosts }) => {
  return (
    <div className="ghost-canvas">
      {ghosts.map(ghost => (
        <div 
          key={ghost.id} 
          className={`ghost-subject ${ghost.posture.toLowerCase()}`}
          style={{
            '--ghost-x': `${ghost.x}%`,
            '--ghost-y': `${ghost.y}%`,
            '--ghost-opacity': ghost.confidence
          } as React.CSSProperties}
        >
          <div className="ghost-aura"></div>
          <div className="ghost-core">
            {ghost.posture === 'HORIZONTAL' ? (
              <Activity size={24} className="text-red-500 animate-pulse" />
            ) : (
              <User size={20} className="text-blue-400" />
            )}
          </div>
          
          <div className="ghost-label">
            <span className="ghost-id">{ghost.id.toUpperCase()}</span>
            <span className="ghost-posture">{ghost.posture}</span>
            <div className="ghost-confidence-bar">
               <div 
                 className="bar-fill" 
                 style={{ '--bar-width': `${ghost.confidence * 100}%` } as React.CSSProperties}
               ></div>
            </div>
          </div>

          {ghost.posture === 'HORIZONTAL' && (
            <div className="fall-alert-ping">
               <div className="ping-ring"></div>
               <span className="alert-text">QUEDA DETECTADA (WiFi)</span>
            </div>
          )}
        </div>
      ))}

      <div className="grid-overlay"></div>
      <div className="signal-waves">
         <div className="wave"></div>
         <div className="wave"></div>
         <div className="wave"></div>
      </div>
    </div>
  );
};
