import React, { useState } from 'react';
import { Play, Pause, RotateCcw, FastForward, SkipBack, Calendar, Clock, Download } from 'lucide-react';

interface Props {
  onPlay: () => void;
  onPause: () => void;
  onReset: () => void;
  onJump: (index: number) => void;
  totalSnapshots: number;
  currentIndex: number;
  isPlaying: boolean;
}

/**
 * ReplayConsole (v1608)
 * Console de controle para Replay de Incidentes.
 * Estilo premium VCR/NVR para perícia digital.
 */
export const ReplayConsole: React.FC<Props> = ({ 
  onPlay, 
  onPause, 
  onReset, 
  onJump, 
  totalSnapshots, 
  currentIndex,
  isPlaying 
}) => {
  const [speed, setSpeed] = useState(1);

  return (
    <div className="bg-[#0f172a] border border-blue-500/40 rounded-3xl p-6 shadow-[0_0_50px_rgba(59,130,246,0.15)] backdrop-blur-xl animate-in fade-in slide-in-from-bottomDuration-500 max-w-2xl w-full mx-auto">
      
      {/* Time Header */}
      <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-400">
            <History size={24} className={isPlaying ? 'animate-pulse' : ''} />
          </div>
          <div>
            <h2 className="text-lg font-black text-white italic tracking-tighter uppercase">Incident Forensic Replay</h2>
            <div className="flex items-center gap-3 text-[10px] text-slate-500 font-mono mt-0.5">
               <span className="flex items-center gap-1"><Calendar size={10} /> 26 MAR 2026</span>
               <span className="flex items-center gap-1"><Clock size={10} /> 10:45:12 AM</span>
            </div>
          </div>
        </div>
        <button 
          className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-slate-400 border border-white/5 transition-all"
          title="Exportar Evidência Pericial (PDF/CSV)"
        >
          <Download size={18} />
        </button>
      </div>

      {/* Scrub Bar */}
      <div className="relative mb-8 group">
        <input 
          type="range" 
          min="0" 
          max={totalSnapshots - 1} 
          value={currentIndex}
          onChange={(e) => onJump(parseInt(e.target.value))}
          className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500 group-hover:h-2 transition-all"
          aria-label="Linha do Tempo de Replay"
          title="Arraste para navegar no tempo"
        />
        <div className="flex justify-between mt-2 px-1 font-mono text-[9px] text-slate-600">
          <span>00:00:00</span>
          <span className="text-blue-400 font-bold">REPLAYING {currentIndex + 1} / {totalSnapshots}</span>
          <span>00:01:40</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={onReset} 
            className="p-2 text-slate-500 hover:text-white transition-colors"
            title="Reiniciar Reprodução"
          >
            <RotateCcw size={20} />
          </button>
          
          <div className="flex items-center gap-1 bg-white/5 rounded-2xl p-1.5 border border-white/5">
            <button className="p-3 text-slate-400 hover:text-white" title="Retroceder 5s"><SkipBack size={18} /></button>
            <button 
              onClick={isPlaying ? onPause : onPlay}
              className={`p-4 rounded-xl shadow-lg transition-all transform hover:scale-105 ${isPlaying ? 'bg-orange-500 text-white shadow-orange-500/20' : 'bg-blue-600 text-white shadow-blue-500/30'}`}
              title={isPlaying ? 'Pausar Replay' : 'Iniciar Replay'}
            >
              {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
            </button>
            <button className="p-3 text-slate-400 hover:text-white" title="Avançar 5s"><FastForward size={18} /></button>
          </div>
        </div>

        {/* Speed & Metadata */}
        <div className="flex items-center gap-6">
           <div className="flex flex-col items-end gap-1">
              <span className="text-[9px] text-slate-500 uppercase font-black tracking-widest">Playback Rate</span>
              <div className="flex gap-2">
                 {[1, 2, 4].map(s => (
                   <button 
                     key={s}
                     onClick={() => setSpeed(s)}
                     className={`px-3 py-1 rounded-lg text-[10px] font-bold border transition-all ${speed === s ? 'bg-blue-500/20 border-blue-500/50 text-blue-400' : 'bg-transparent border-white/5 text-slate-600'}`}
                   >
                     {s}x
                   </button>
                 ))}
              </div>
           </div>
           
           <div className="p-3 bg-red-500/5 border border-red-500/20 rounded-2xl flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
              <div className="flex flex-col">
                 <span className="text-[10px] text-red-400 font-black uppercase italic">Evidence Active</span>
                 <span className="text-[8px] text-slate-600 font-mono">HASH: SHA256_F92A...</span>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

// Mocking History icon as I used it but didn't import it correctly in my head
import { History } from 'lucide-react';
