import React, { useState } from 'react';
import { Locate, DoorOpen, MapPin, CheckCircle, Navigation, Info } from 'lucide-react';

interface SurveyPoint {
  x: number;
  y: number;
  type?: 'point' | 'door' | 'entrance' | 'exit';
  timestamp: string;
}

interface Props {
  points: SurveyPoint[];
  onFinish: () => void;
}

/**
 * SurveyHUD (v1607)
 * Monitor de Varredura em Tempo Real.
 * Exibe o rastro do técnico e os pontos de interesse (portas/entradas) registrados.
 */
export const SurveyHUD: React.FC<Props> = ({ points, onFinish }) => {
  const lastPoint = points[points.length - 1];
  const poiCount = points.filter(p => p.type && p.type !== 'point').length;

  return (
    <div className="bg-[#050b14]/90 border border-blue-500/30 rounded-2xl p-5 backdrop-blur-xl shadow-2xl animate-in fade-in zoom-in duration-500 max-w-md w-full">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-500/20 rounded-lg text-orange-400">
            <Locate size={20} className="animate-spin-slow" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-tighter italic">SITE SURVEY ACTIVE</h3>
            <span className="text-[10px] text-slate-500 font-mono">NODE_CALIBRATION_MODE // v1607</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-1 bg-green-500/10 rounded border border-green-500/20">
           <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping" />
           <span className="text-[9px] text-green-400 font-bold uppercase">Streaming</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="p-3 bg-white/5 rounded-xl border border-white/5">
          <div className="text-[9px] text-slate-500 uppercase font-bold mb-1">Pontos Capturados</div>
          <div className="text-xl font-black text-white font-mono">{points.length}</div>
        </div>
        <div className="p-3 bg-white/5 rounded-xl border border-white/5">
          <div className="text-[9px] text-slate-500 uppercase font-bold mb-1">POIs Mapeados (Portas)</div>
          <div className="text-xl font-black text-blue-400 font-mono">{poiCount}</div>
        </div>
      </div>

      {/* Progress Timeline (Recent Tags) */}
      <div className="mb-6">
        <h4 className="text-[10px] text-slate-400 font-bold uppercase mb-3 flex items-center gap-2">
           <Navigation size={10} /> Últimos Eventos de Campo
        </h4>
        <div className="space-y-2 max-h-32 overflow-y-auto pr-2 custom-scrollbar">
          {points.slice(-4).reverse().map((p, i) => (
            <div key={i} className="flex items-center justify-between p-2 bg-white/5 rounded-lg border border-white/5 animate-in slide-in-from-left duration-300">
              <div className="flex items-center gap-2">
                {p.type === 'door' ? <DoorOpen size={12} className="text-orange-400" /> : <MapPin size={12} className="text-blue-400" />}
                <span className="text-[10px] text-slate-300 uppercase font-bold">{p.type === 'point' ? 'Sinal Registrado' : `TAG: ${p.type?.toUpperCase()}`}</span>
              </div>
              <span className="text-[9px] text-slate-500 font-mono">X:{p.x.toFixed(1)} Y:{p.y.toFixed(1)}</span>
            </div>
          ))}
          {points.length === 0 && (
            <div className="text-center py-4 text-[10px] text-slate-600 italic">
               Aguardando primeiro sinal do dispositivo móvel...
            </div>
          )}
        </div>
      </div>

      {/* Current Position HUD */}
      <div className="p-4 bg-blue-500/10 rounded-xl border border-blue-500/20 mb-6 group">
         <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] text-blue-400 font-black uppercase tracking-widest italic">Live Telemetry</span>
            <Info size={12} className="text-blue-400/40" />
         </div>
         <div className="flex items-end gap-1">
            <span className="text-2xl font-black text-white font-mono">{lastPoint ? `(${lastPoint.x.toFixed(2)}, ${lastPoint.y.toFixed(2)})` : '---'}</span>
            <span className="text-[10px] text-blue-500/60 mb-1 font-mono">m</span>
         </div>
      </div>

      <button 
        onClick={onFinish}
        className="w-full py-4 bg-white text-black hover:bg-slate-200 transition-colors rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2"
      >
        <CheckCircle size={16} /> Finalizar e Calibrar Mapa
      </button>

      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
      `}</style>
    </div>
  );
};
