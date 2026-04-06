import React, { useState, useEffect } from 'react';
import { HexCellCard } from './HexCellCard';
import { HoneycombMeshPulse } from './HoneycombMeshPulse';
import { ShieldAlert, TrendingUp, TrendingDown, Minus, Info } from 'lucide-react';
import './EvasionRadarUI.css';

interface EvasionRisk {
  studentId: string;
  name: string;
  riskScore: number;
  horizon: 14 | 30;
  level: 'LOW' | 'MEDIUM' | 'HIGH';
  factors: string[];
  trend: 'CLIMBING' | 'STABLE' | 'REDUCING';
}

/**
 * RADAR DE EVASÃO SOBERANA (v3341 - Premium Redesign)
 * --------------------------------------------------
 * Visualização de Visão Atencional Reativa baseada em Colmeia.
 */
const EvasionRadarUI: React.FC = () => {
  const [horizon, setHorizon] = useState<14 | 30>(14);
  const [heatmap, setHeatmap] = useState<EvasionRisk[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRisk, setSelectedRisk] = useState<EvasionRisk | null>(null);

  useEffect(() => {
    loadHeatmap();
  }, [horizon]);

  const loadHeatmap = async () => {
    setLoading(true);
    try {
      // @ts-ignore
      const data = await window.electron.invoke('get-evasion-heatmap', horizon);
      setHeatmap(data || []);
    } catch (err) {
      console.error('Failed to load evasion heatmap:', err);
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = (trend: string) => {
     if (trend === 'CLIMBING') return <TrendingUp size={16} className="text-red-400" />;
     if (trend === 'REDUCING') return <TrendingDown size={16} className="text-emerald-400" />;
     return <Minus size={16} className="opacity-40" />;
  };

  if (loading) return (
     <div className="radar-loading-container">
        <div className="honey-loader"></div>
        <p>ESCANEANDO PADRÕES DO NEXUS...</p>
     </div>
  );

  return (
    <div className="radar-master-layout">
      {/* Background Mesh (v4002 Style) */}
      <div className="radar-bg-mesh">
         <HoneycombMeshPulse />
      </div>

      <div className="radar-glass-content">
        <header className="radar-header-premium">
          <div className="radar-branding">
            <ShieldAlert size={28} className="radar-icon-glow" />
            <div>
              <h1 className="premium-title">Radar de Evasão Soberana</h1>
              <p className="premium-subtitle">
                INTELIGÊNCIA PREDITIVA | <span className="highlight">HORIZONTE {horizon}D</span>
              </p>
            </div>
          </div>

          <div className="horizon-pills">
             <button 
               className={`pill-btn ${horizon === 14 ? 'active' : ''}`}
               onClick={() => setHorizon(14)}
             >14 DIAS</button>
             <button 
               className={`pill-btn ${horizon === 30 ? 'active' : ''}`}
               onClick={() => setHorizon(30)}
             >30 DIAS</button>
          </div>
        </header>

        {/* MESH GRID - Transformado para Hexágonos (v3341) */}
        <div className="hex-radar-grid">
           {heatmap.map(risk => (
              <div 
                key={risk.studentId}
                className={`radar-hex-cell ${risk.level.toLowerCase()}`}
                onClick={() => setSelectedRisk(risk)}
              >
                 <div className="hex-initials">{risk.name.substring(0,2).toUpperCase()}</div>
                 <div className="hex-mini-trend">{getTrendIcon(risk.trend)}</div>
                 <div className="hex-risk-bar" style={{ height: `${risk.riskScore}%` }}></div>
              </div>
           ))}
        </div>

        {/* DETALHE PREMIUM (Side Panel Hex) */}
        {selectedRisk && (
           <div className="radar-detail-overlay" onClick={() => setSelectedRisk(null)}>
              <div className="radar-hex-modal animate-hex-reveal" onClick={e => e.stopPropagation()}>
                 <HexCellCard 
                   title={selectedRisk.name}
                   subtitle={`RISCO: ${selectedRisk.riskScore}% (${selectedRisk.level})`}
                   status={selectedRisk.level === 'HIGH' ? 'alert' : (selectedRisk.level === 'MEDIUM' ? 'sync' : 'active')}
                   icon={<div className="modal-hex-icon">{selectedRisk.riskScore}%</div>}
                 />
                 
                 <div className="factor-grid">
                    {selectedRisk.factors.map((f, i) => (
                       <div key={i} className="factor-item">
                          <Info size={12} className="text-amber-500" />
                          <span>{f}</span>
                       </div>
                    ))}
                 </div>

                 <div className="modal-actions">
                    <button className="btn-sovereign btn-approve">ACIONAR FAMÍLIA</button>
                    <button className="btn-sovereign" onClick={() => setSelectedRisk(null)}>FECHAR</button>
                 </div>
              </div>
           </div>
        )}

        <footer className="radar-legend-premium">
           <div className="legend-pills">
              <span className="p-pill p-high">CRÍTICO ({heatmap.filter(r => r.level === 'HIGH').length})</span>
              <span className="p-pill p-medium">ATENÇÃO ({heatmap.filter(r => r.level === 'MEDIUM').length})</span>
              <span className="p-pill p-low">ESTÁVEL</span>
           </div>
        </footer>
      </div>
    </div>
  );
};

export default EvasionRadarUI;
