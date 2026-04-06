import React from 'react';
import { Target, User, Navigation, ShieldCheck } from 'lucide-react';
import './GuardInterface.css';

/**
 * Phase 401+ Augmented Reality (AR) Guard Interface
 * Protótipo de HUD para segurança em campo.
 */
export const GuardInterface: React.FC = () => {
  return (
    <div className="guard-hud-container">
      <div className="hud-overlay">
        {/* AR Targets */}
        <div className="hud-target target-1">
          <div className="target-reticle" />
          <div className="target-info">
            <div className="flex items-center gap-1">
              <User size={10} />
              <span>ALUNO: MARCOS S.</span>
            </div>
            <div className="text-[8px] text-emerald-400">STATUS: AUTORIZADO</div>
          </div>
        </div>

        {/* HUD UI */}
        <div className="hud-sidebar left">
          <div className="hud-widget">
            <Navigation size={18} className="mb-2 text-blue-400" />
            <div className="text-[10px] font-bold">NAV: SETOR B</div>
            <div className="text-[8px] text-slate-400">PÁTIO CENTRAL</div>
          </div>
        </div>

        <div className="hud-sidebar right">
          <div className="hud-widget border-emerald-500/30">
            <ShieldCheck size={18} className="mb-2 text-emerald-400" />
            <div className="text-[10px] font-bold">BIO: SECURE</div>
            <div className="text-[8px] text-emerald-400">SCAN OK</div>
          </div>
        </div>

        <div className="hud-bottom">
          <div className="hud-scanline" />
          <div className="text-[9px] tracking-widest uppercase opacity-50">Áquila Pro Field HUD v.4.1.0</div>
        </div>
      </div>
    </div>
  );
};
