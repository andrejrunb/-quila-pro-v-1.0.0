import React, { useState, useEffect } from 'react';
import { Share2, AlertCircle, Users, Activity } from 'lucide-react';
import './SocialGraphView.css';

/**
 * Phase 520: SocialGraphView
 * Visualização tática das conexões e riscos sociais detectados.
 */
export const SocialGraphView: React.FC = () => {
  const [nodes, setNodes] = useState<any[]>([]);
  const [links, setLinks] = useState<any[]>([]);

  useEffect(() => {
    // Simulação de preenchimento inicial
    const mockNodes = [
      { id: 'n1', x: 100, y: 100, risk: 'low' },
      { id: 'n2', x: 200, y: 150, risk: 'medium' },
      { id: 'n3', x: 150, y: 250, risk: 'low' },
      { id: 'n4', x: 300, y: 100, risk: 'high' }
    ];
    setNodes(mockNodes);
    setLinks([
      { source: 'n1', target: 'n2' },
      { source: 'n2', target: 'n3' },
      { source: 'n2', target: 'n4' }
    ]);
  }, []);

  return (
    <div className="social-graph-container page-transition">
      <div className="graph-header">
        <div className="flex items-center gap-2">
          <Share2 size={20} className="text-blue-400" />
          <h2 className="text-xl font-bold">Análise de Tensão Social</h2>
        </div>
        <div className="risk-legend">
          <span className="risk-tag low">Estável</span>
          <span className="risk-tag medium">Monitorar</span>
          <span className="risk-tag high">Risco</span>
        </div>
      </div>

      <div className="graph-canvas-mock">
        <svg width="100%" height="400" viewBox="0 0 400 300">
          {/* Renderizar conexões */}
          {links.map((link, i) => {
            const s = nodes.find(n => n.id === link.source);
            const t = nodes.find(n => n.id === link.target);
            if (!s || !t) return null;
            return (
              <line 
                key={i} 
                x1={s.x} y1={s.y} x2={t.x} y2={t.y} 
                className="graph-link" 
              />
            );
          })}
          
          {/* Renderizar nós */}
          {nodes.map(node => (
            <g key={node.id} transform={`translate(${node.x},${node.y})`}>
              <circle 
                r="12" 
                className={`graph-node node-${node.risk}`} 
              />
              <text y="25" textAnchor="middle" className="node-label">ID-{node.id}</text>
            </g>
          ))}
        </svg>

        <div className="graph-ai-insight">
          <Activity size={16} className="text-blue-400" />
          <span>IA: Identificado isolamento atípico no nó ID-n4.</span>
        </div>
      </div>

      <div className="risk-panel">
        <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">
          <AlertCircle size={14} /> TENSÕES PROATIVAS
        </h4>
        <div className="risk-item">
          <div className="risk-marker high" />
          <div className="flex-1">
            <p className="text-xs font-bold">Fricção entre Grupos A/B</p>
            <p className="text-[10px] text-slate-400">Padrão persistente no Pátio Norte.</p>
          </div>
          <button className="risk-action-btn">Interceptar</button>
        </div>
      </div>
    </div>
  );
};
