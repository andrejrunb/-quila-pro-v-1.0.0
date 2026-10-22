import React, { useState } from 'react';
import { ScanFace, ScanLine, RefreshCcw, Camera, ShieldAlert, CheckCircle2, AlertTriangle, Fingerprint, Crosshair } from 'lucide-react';

export const IdentityRecaptureSystem: React.FC = () => {
  const [capturing, setCapturing] = useState(false);
  const [progress, setProgress] = useState(0);

  const startRecapture = () => {
    setCapturing(true);
    setProgress(0);
    
    // Simulate AI pipeline training over time
    const interval = setInterval(() => {
        setProgress(p => {
            if (p >= 100) {
                clearInterval(interval);
                setTimeout(() => setCapturing(false), 800);
                return 100;
            }
            return p + 5;
        });
    }, 150);
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in w-full">
       <div className="flex items-center justify-between">
          <div>
             <h2 className="text-xl font-bold text-white flex items-center gap-2">
               <ScanFace className="text-fuchsia-500" /> Recaptura Dinâmica de Identidade
             </h2>
             <p className="text-xs text-slate-400 mt-1">Calibração da Rede Neural Edge para faces que sofrem degradação contínua (ex: mudança de características faciais).</p>
          </div>
       </div>

       <div className="flex flex-col lg:flex-row gap-6">
           
           {/* Painel Central de Visão */}
           <div className="w-full lg:w-2/3 flex flex-col gap-4">
              <div className="bg-black/60 border border-fuchsia-500/20 rounded-2xl overflow-hidden relative shadow-glow h-[420px] flex items-center justify-center">
                 {/* Cam Overlay Mock */}
                 <div className="absolute inset-0 pointer-events-none border-[4px] border-black/80 z-20 m-2 rounded-xl" />
                 
                 <div className="absolute top-4 left-4 z-30 flex items-center gap-2 px-3 py-1.5 bg-black/50 border border-white/10 rounded-lg backdrop-blur-md">
                    <Camera size={14} className="text-fuchsia-400" /> 
                    <span className="text-[10px] font-black uppercase text-fuchsia-400 tracking-wider">CAM-SEC-01 (Portaria)</span>
                 </div>
                 
                 {capturing && (
                    <div className="absolute inset-0 z-10 bg-fuchsia-500/5 mix-blend-overlay">
                        <div className="w-full h-1 bg-fuchsia-500/50 absolute top-0 animate-[scan_2s_linear_infinite]" />
                    </div>
                 )}

                 {/* Simulated Camera Feed (Placeholder Visual) */}
                 <div className="relative z-0 group flex items-center justify-center w-full h-full">
                     <ScanLine size={120} className={`text-fuchsia-500/20 ${capturing ? 'animate-pulse' : ''}`} />
                     {capturing && (
                       <div className="absolute inset-0 flex items-center justify-center">
                           <Crosshair size={260} strokeWidth={0.5} className="text-fuchsia-500/40 animate-[spin_10s_linear_infinite]" />
                       </div>
                     )}
                 </div>

                 {/* Telemetry Footer */}
                 <div className="absolute bottom-4 left-4 right-4 z-30 flex justify-between items-end">
                     <div className="flex flex-col gap-1">
                        <div className="text-[10px] uppercase font-bold text-slate-400">Modelo NPU Atual</div>
                        <div className="text-sm font-bold text-white flex items-center gap-2">
                           YOLO-Face (Base) <span className="text-[10px] bg-red-500/20 text-red-500 px-2 py-0.5 rounded border border-red-500/30">DIVERGENTE</span>
                        </div>
                     </div>
                     <div className="w-1/3 flex flex-col items-end gap-1">
                        <div className="flex items-center gap-2 text-[10px] text-fuchsia-400 font-bold">
                           <span>EXTRAINDO {progress}% </span>
                           <Fingerprint size={12} />
                        </div>
                        <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                           <div className="h-full bg-fuchsia-500 shadow-[0_0_10px_rgba(217,70,239,0.5)] transition-all duration-150" style={{ width: `${progress}%` }} />
                        </div>
                     </div>
                 </div>
              </div>
           </div>

           {/* Operação de Auditoria */}
           <div className="w-full lg:w-1/3 flex flex-col gap-4">
              <div className="bg-white/5 border border-white/5 p-6 rounded-2xl flex-1 flex flex-col">
                  <h3 className="font-bold text-sm text-slate-300 mb-6 uppercase tracking-widest">Painel de Ajuste</h3>
                  
                  <div className="flex flex-col gap-3 mb-6">
                      <div className="bg-black/20 border border-white/5 p-3 rounded-xl flex gap-3 text-sm">
                         <AlertTriangle className="text-amber-500 flex-shrink-0" size={18} />
                         <div>
                            <span className="font-bold text-white text-sm">Falsa Rejeição Alta</span>
                            <p className="text-xs text-slate-400 mt-1">O aluno <strong>LUCAS MENDES (RM: 11029)</strong> está sofrendo rejeições repetidas na catraca Principal.</p>
                         </div>
                      </div>
                  </div>

                  <div className="flex-1" />

                  <div className="flex flex-col gap-3">
                     <button 
                        onClick={startRecapture}
                        disabled={capturing}
                        className={`w-full py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                          capturing 
                           ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                           : 'bg-fuchsia-600 hover:bg-fuchsia-500 text-white shadow-glow'
                        }`}
                     >
                        {capturing ? <RefreshCcw className="animate-spin" size={18} /> : <ScanFace size={18} />}
                        {capturing ? 'Treinando Vetores Neurais...' : 'Forçar Recaptura (120 FPS)'}
                     </button>
                     {progress === 100 && !capturing && (
                        <div className="text-center p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-xs font-bold flex flex-col items-center gap-1">
                           <CheckCircle2 size={24} />
                           Rede reescrita e propagada aos Nodes Edge.
                        </div>
                     )}
                  </div>
              </div>
           </div>
       </div>
    </div>
  );
};
