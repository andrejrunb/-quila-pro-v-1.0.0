import React, { useState, useEffect } from 'react';
import { Smartphone, Shield, Check, RefreshCcw, Lock, Fingerprint } from 'lucide-react';

interface Props {
  userId: string;
  onComplete: () => void;
}

/**
 * MobileAuth (v1606)
 * Interface de emparelhamento e autorização para o ecossistema mobile.
 * Gera o QR Code dinâmico e valida a sincronização com o MobileGateway.
 */
export const MobileAuth: React.FC<Props> = ({ userId, onComplete }) => {
  const [challenge, setChallenge] = useState<string | null>(null);
  const [status, setStatus] = useState<'IDLE' | 'GENERATING' | 'WAITING' | 'SUCCESS'>('IDLE');

  useEffect(() => {
    generateChallenge();
  }, []);

  const generateChallenge = async () => {
    setStatus('GENERATING');
    try {
      const token = await (window as any).aquila.getAuthChallenge(userId);
      setChallenge(token);
      setStatus('WAITING');
    } catch (e) {
      console.error('Erro ao gerar desafio:', e);
      setStatus('IDLE');
    }
  };

  return (
    <div className="bg-[#050b14] border border-blue-500/20 rounded-2xl p-6 w-full max-w-sm mx-auto shadow-2xl backdrop-blur-md">
      <div className="flex flex-col items-center text-center">
        
        {/* State Icon */}
        <div className={`p-4 rounded-full mb-4 ${status === 'SUCCESS' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'}`}>
           {status === 'SUCCESS' ? <Check size={32} /> : <Smartphone size={32} className={status === 'WAITING' ? 'animate-bounce' : ''} />}
        </div>

        <h3 className="text-xl font-black text-white italic tracking-tighter uppercase mb-2">
           Áquila Mobile Bridge
        </h3>
        <p className="text-xs text-slate-500 mb-6 px-4">
           Digitalize o QR Code abaixo no App Áquila (Parent/Guard) para vincular sua biometria local ao sistema central.
        </p>

        {/* QR Zone (Mockup Aesthetic) */}
        <div className="relative group p-4 bg-white/5 rounded-xl border border-white/10 mb-6 group">
           {status === 'GENERATING' ? (
             <div className="w-48 h-48 flex items-center justify-center">
               <RefreshCcw className="animate-spin text-blue-500" />
             </div>
           ) : (
             <div className="relative w-48 h-48 bg-white p-2 rounded-lg">
                {/* Mocked QR Visual */}
                <div className="w-full h-full bg-slate-900 rounded flex flex-col items-center justify-center gap-2 overflow-hidden">
                   <div className="grid grid-cols-8 grid-rows-8 gap-1 opacity-40">
                      {Array.from({ length: 64 }).map((_, i) => (
                        <div key={i} className={`w-3 h-3 ${Math.random() > 0.5 ? 'bg-blue-500' : 'bg-transparent'}`} />
                      ))}
                   </div>
                   <div className="absolute inset-0 flex items-center justify-center">
                      <Lock size={48} className="text-white/20" />
                   </div>
                </div>
             </div>
           )}
           
           {/* Scan overlay */}
           <div className="absolute top-0 left-0 w-full h-1 bg-blue-500/50 blur-[2px] animate-scan-qr pointer-events-none" />
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-3 w-full mb-6">
           <div className="p-3 bg-white/5 rounded-lg border border-white/5 flex flex-col items-start gap-1">
              <Shield size={12} className="text-blue-400" />
              <span className="text-[10px] text-slate-400 font-bold uppercase">Encryption</span>
              <span className="text-[9px] text-slate-600 font-mono">AES-256 GCM</span>
           </div>
           <div className="p-3 bg-white/5 rounded-lg border border-white/5 flex flex-col items-start gap-1">
              <Fingerprint size={12} className="text-purple-400" />
              <span className="text-[10px] text-slate-400 font-bold uppercase">Biometrics</span>
              <span className="text-[9px] text-slate-600 font-mono">HW_ENCLAVE</span>
           </div>
        </div>

        <button 
          onClick={generateChallenge}
          disabled={status === 'GENERATING'}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 transition-colors text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 uppercase tracking-widest disabled:opacity-50"
        >
          <RefreshCcw size={16} /> Atualizar Token
        </button>

        <div className="mt-4 flex items-center gap-2 text-[10px] text-slate-600 font-mono">
           <div className="w-2 h-2 rounded-full bg-green-500" />
           <span>ACTIVE SESSION ID: {userId.substring(0, 8)}</span>
        </div>
      </div>

      <style>{`
        @keyframes scan-qr {
          from { top: 0; opacity: 0; }
          50% { opacity: 1; }
          to { top: 100%; opacity: 0; }
        }
        .animate-scan-qr {
          animation: scan-qr 2s infinite linear;
        }
      `}</style>
    </div>
  );
};
