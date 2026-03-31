import React from 'react';
import { ShieldCheck, ShieldAlert, Zap, AlertTriangle } from 'lucide-react';
import './SovereignResponsePanel.css';

interface SovereignResponsePanelProps {
  status: 'normal' | 'emergency';
  onResponse: (active: boolean) => void;
}

/**
 * SovereignResponsePanel.tsx
 * High-fidelity response protocol for campus events.
 * Replaces the legacy "LockdownPanel" with a demilitarized, pedagogical approach.
 */
export const SovereignResponsePanel: React.FC<SovereignResponsePanelProps> = ({ status, onResponse }) => {
  return (
    <div className={`response-panel-card ${status === 'emergency' ? 'active' : ''}`}>
      <div className="flex items-center gap-3 mb-6">
        <div className={`p-3 rounded-2xl ${status === 'emergency' ? 'bg-amber-500 text-black' : 'bg-blue-600/20 text-blue-400'}`}>
          {status === 'emergency' ? <ShieldAlert size={24} /> : <ShieldCheck size={24} />}
        </div>
        <div>
          <h3 className="text-lg font-black italic uppercase tracking-tighter">Campus Response</h3>
          <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black">Active Protocol: {status === 'emergency' ? 'Sovereign Alert' : 'Normal Grid'}</p>
        </div>
      </div>

      <div className="space-y-4">
        {status === 'emergency' ? (
          <div className="response-alert-box animate-pulse">
            <AlertTriangle size={16} />
            <span>PEDAGOGICAL ALERT ACTIVE</span>
          </div>
        ) : (
          <div className="response-status-box">
             <div className="status-dot online" />
             <span>All nodes in equilibrium</span>
          </div>
        )}

        {status === 'emergency' ? (
          <button 
            onClick={() => onResponse(false)}
            className="w-full py-4 rounded-3xl flex items-center justify-center gap-3 text-xs font-black uppercase tracking-[0.2em] transition-all bg-white text-black hover:bg-gray-100"
            aria-pressed="true"
            title="Disable Alert"
          >
            Disable Alert
          </button>
        ) : (
          <button 
            onClick={() => onResponse(true)}
            className="w-full py-4 rounded-3xl flex items-center justify-center gap-3 text-xs font-black uppercase tracking-[0.2em] transition-all bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/20"
            aria-pressed="false"
            title="Initiate Response"
          >
            Initiate Response
            <Zap size={16} />
          </button>
        )}
      </div>

      <div className="mt-8 border-t border-white/5 pt-6">
         <div className="flex justify-between items-center text-[10px] text-gray-400 uppercase tracking-widest font-black mb-4">
            <span>P2P SYNC STATUS</span>
            <span className="text-blue-500">100% V-SYNC</span>
         </div>
         <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 w-full" />
         </div>
      </div>
    </div>
  );
};
