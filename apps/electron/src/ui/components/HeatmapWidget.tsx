import React, { useState, useEffect, useRef } from 'react';
import { Map, Activity, Users, AlertCircle } from 'lucide-react';
import campusMap from '../../assets/campus_map.png';
import './HeatmapWidget.css';

/**
 * Phase 500 — HeatmapWidget
 * Visualiza a ocupação do campus em tempo real sobre um mapa esquemático.
 * Usa SVG overlays para renderizar os pontos de calor recebidos via bridge.
 */
export const HeatmapWidget: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [hoverPoint, setHoverPoint] = useState<any>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Phase v3460: Listener via bridge seguro
    const unsub = window.aquila?.onHeatmapUpdate?.(setData);
    
    // Simular dados iniciais se necessário (fallback)
    return () => {
      if (unsub) unsub();
    };
  }, []);

  useEffect(() => {
    if (tooltipRef.current && hoverPoint) {
      tooltipRef.current.style.setProperty('--tp-x', `${hoverPoint.x}%`);
      tooltipRef.current.style.setProperty('--tp-y', `${hoverPoint.y}%`);
    }
  }, [hoverPoint]);

  const getHeatColor = (intensity: number) => {
    if (intensity > 0.8) return '#f43f5e'; // Critical
    if (intensity > 0.5) return '#fbbf24'; // Medium
    return '#10b981'; // Low
  };

  return (
    <div className="heatmap-widget-container" role="region" aria-label="Mapa de Calor em Tempo Real">
      <header className="heatmap-header">
        <div className="flex items-center gap-2">
          <Map className="text-blue-400" size={18} />
          <h3 className="text-md font-bold uppercase tracking-tight">Análise de Fluxo Ocupacional</h3>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <Users size={12} className="text-slate-500" />
            <span className="text-[10px] font-mono text-slate-400">TOTAL: {data?.points.length || 0}</span>
          </div>
          <Activity className="text-emerald-500 animate-pulse" size={14} />
        </div>
      </header>

      <div className="heatmap-canvas-wrapper">
        <img src={campusMap} alt="Campus Schematic" className="campus-base-map" />
        
        <svg className="heatmap-svg-layer" viewBox="0 0 100 100" preserveAspectRatio="none">
          {data?.points.map((p: any, i: number) => (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={1.5 + p.intensity * 2}
              fill={getHeatColor(p.intensity)}
              className="heat-point"
              onMouseEnter={() => setHoverPoint(p)}
              onMouseLeave={() => setHoverPoint(null)}
            />
          ))}
        </svg>

        {hoverPoint && (
          <div 
            ref={tooltipRef}
            className="point-tooltip"
          >
            <div className="text-[9px] font-bold">DENSIDADE: {(hoverPoint.intensity * 100).toFixed(0)}%</div>
          </div>
        )}
      </div>

      <footer className="heatmap-footer">
        <div className="flex justify-between items-center text-[9px] text-slate-500 italic">
          <span>Sincronizado via Eagle AI Cluster v2.0.1</span>
          <span>{data ? new Date(data.timestamp).toLocaleTimeString() : '--:--:--'}</span>
        </div>
      </footer>
    </div>
  );
};
