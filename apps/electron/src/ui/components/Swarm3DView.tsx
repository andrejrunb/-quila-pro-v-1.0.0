import React, { useMemo } from 'react';
import { Cpu, Server, Cloud, Zap } from 'lucide-react';
import './Swarm3DView.css';

interface SwarmNode {
  id: string;
  name: string;
  type: 'NPU' | 'SERVER' | 'CLOUD';
  load: number;
  isProcessingVision: boolean;
  active: boolean;
}

interface Swarm3DViewProps {
  nodes: SwarmNode[];
}

export const Swarm3DView: React.FC<Swarm3DViewProps> = ({ nodes }) => {
  // Posicionamento dinâmico para os nós (Diamond layout de 4-6 nós)
  const nodePositions = useMemo(() => {
    const margin = 15; // 15% margin
    return {
      '1': { top: '20%', left: '50%', color: '#3b82f6' },  // Alpha Center
      '2': { top: '50%', left: '20%', color: '#8b5cf6' },  // West
      '3': { top: '50%', left: '80%', color: '#06b6d4' },  // East
      '4': { top: '80%', left: '50%', color: '#f59e0b' },  // South
    };
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case 'NPU': return <Cpu size={20} />;
      case 'SERVER': return <Server size={20} />;
      case 'CLOUD': return <Cloud size={20} />;
      default: return <Cpu size={20} />;
    }
  };

  return (
    <div className="swarm-3d-visualizer">
      {/* SVG para conexões dinâmicas */}
      <svg className="swarm-connections-map">
        <defs>
          <linearGradient id="beamGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="transparent" />
            <stop offset="50%" stopColor="rgba(59, 130, 246, 0.4)" />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Linhas de Conexão */}
        <line x1="50%" y1="20%" x2="20%" y2="50%" className="engine-connection" />
        <line x1="50%" y1="20%" x2="80%" y2="50%" className="engine-connection" />
        <line x1="20%" y1="50%" x2="50%" y2="80%" className="engine-connection" />
        <line x1="80%" y1="50%" x2="50%" y2="80%" className="engine-connection" />
        <line x1="20%" y1="50%" x2="80%" y2="50%" className="engine-connection" strokeDasharray="10,10" />

        {/* Data Beams (Animated) */}
        <path d="M 50% 20% L 20% 50%" className="data-pulse-beam" />
        <path d="M 50% 20% L 80% 50%" className="data-pulse-beam" style={{ animationDelay: '1s' }} />
        <path d="M 80% 50% L 50% 80%" className="data-pulse-beam" style={{ animationDelay: '0.5s' }} />
        <path d="M 20% 50% L 50% 80%" className="data-pulse-beam" style={{ animationDelay: '1.5s' }} />
      </svg>

      {/* Renderização dos Nós */}
      <div className="swarm-nodes-layer">
        {nodes.map(node => {
          const pos = (nodePositions as any)[node.id] || { top: '50%', left: '50%', color: '#fff' };
          return (
            <div 
              key={node.id} 
              className={`swarm-3d-node ${node.active ? 'node-active' : 'node-offline'} ${node.isProcessingVision ? 'node-primary' : ''}`}
              style={{ 
                top: pos.top, 
                left: pos.left,
                '--node-accent': pos.color 
              } as any}
            >
              <div className="node-platform-3d"></div>
              <div className="node-floating-core glass">
                <div className="node-icon-glow">
                  {getIcon(node.type)}
                </div>
                
                {/* Micro-interação Hover Overlay */}
                <div className="node-hover-info glass-premium">
                  <span className="info-title">{node.name}</span>
                  <div className="info-stat">
                    <Activity size={10} />
                    <span>LOAD: {Math.round(node.load)}%</span>
                  </div>
                  {node.isProcessingVision && (
                    <div className="info-tag-vision">
                      <Zap size={8} /> GPU OPTIMIZED
                    </div>
                  )}
                </div>
              </div>

              {/* Status Ring */}
              <div className="node-status-ring">
                 <div className="ring-fill" style={{ width: `${node.load}%` }}></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
