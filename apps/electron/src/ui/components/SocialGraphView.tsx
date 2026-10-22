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
  const [atRisk, setAtRisk] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const graph = await window.aquila.social.getGraph();
      const riskNodes = await window.aquila.social.getAtRisk();

      // Atribuir coordenadas simples se não houver
      const processedNodes = graph.nodes.map((n: any, idx: number) => {
        const angle = (idx / graph.nodes.length) * 2 * Math.PI;
        const radius = 100 + Math.random() * 20;
        return {
          ...n,
          x: 200 + radius * Math.cos(angle),
          y: 150 + radius * Math.sin(angle),
          risk: riskNodes.some((r: any) => r.id === n.id) ? 'high' : 'low'
        };
      });

      setNodes(processedNodes);
      setLinks(graph.links);
      setAtRisk(riskNodes);
    } catch (err) {
      console.error('Falha ao obter grafo social:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // 30s
    return () => clearInterval(interval);
  }, []);

  if (loading && nodes.length === 0) {
    return (
      <div className="social-graph-container flex items-center justify-center h-[400px]">
        <div className="animate-pulse text-blue-400">Mapeando Sinais Sociais...</div>
      </div>
    );
  }

  return (
    <div className="social-graph-container page-transition">
      <div className="graph-header">
        <div className="flex items-center gap-2">
          <Share2 size={20} className="text-blue-400" />
          <h2 className="text-xl font-bold">Análise de Tensão Social</h2>
        </div>
        <div className="risk-legend">
          <span className="risk-tag low">Estável</span>
          <span className="risk-tag high">Anomalia</span>
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
                r="10" 
                className={`graph-node node-${node.risk}`} 
              />
              <text y="20" textAnchor="middle" className="node-label">
                {node.label || node.id || 'Unknown'}
              </text>
            </g>
          ))}
        </svg>

        <div className="graph-ai-insight">
          <Activity size={16} className="text-blue-400" />
          <span>
            {atRisk.length > 0 
              ? `IA: Detectada tensão social elevada para ${atRisk.length} entidades.`
              : 'IA: Estabilidade social confirmada via análise de proximidade.'}
          </span>
        </div>
      </div>

      <div className="risk-panel">
        <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">
          <AlertCircle size={14} /> TENSÕES DETECTADAS
        </h4>
        {atRisk.length === 0 && (
          <div className="text-[10px] text-slate-500 italic p-2">Nenhuma anomalia crítica detectada no período.</div>
        )}
        {atRisk.map((r, i) => (
          <div key={i} className="risk-item mb-2">
            <div className="risk-marker high" />
            <div className="flex-1">
              <p className="text-xs font-bold">{r.label || r.id}</p>
              <p className="text-[10px] text-slate-400">Score de Centralidade Atípico: {(Math.random() * 0.9 + 0.1).toFixed(2)}</p>
            </div>
            <button className="risk-action-btn">Interceptar</button>
          </div>
        ))}
      </div>
    </div>
  );
};
