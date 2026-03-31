import React from 'react';
import { UserCheck, Clock, ShieldCheck, XCircle, User } from 'lucide-react';
import { ParentAuthorization } from '../../services/ParentAuthService';

interface Props {
  authorizations: ParentAuthorization[];
  onValidate: (challenge: string) => void;
}

/**
 * ParentAuthHUD (v1614)
 * Monitor de Autorizações de Saída em Tempo Real.
 * Exibe QRs dinâmicos ativos e status de validação.
 */
export const ParentAuthHUD: React.FC<Props> = ({ authorizations, onValidate }) => {
  return (
    <div className="bg-[#0f172a]/90 border border-blue-500/30 rounded-[2.5rem] p-6 backdrop-blur-xl shadow-2xl animate-in zoom-in-95 duration-500">
      
      {/* Header */}
      <div className="flex items-center gap-4 mb-6 border-b border-white/5 pb-4">
        <div className="p-3 bg-blue-600/20 rounded-2xl text-blue-400">
           <UserCheck size={20} />
        </div>
        <div>
           <h3 className="text-sm font-black text-white uppercase tracking-tighter italic">Auth Gateway <span className="text-blue-500">v1614</span></h3>
           <p className="text-[9px] text-slate-500 font-mono uppercase tracking-widest">Dynamic Parent Authorization</p>
        </div>
      </div>

      {/* Auth List */}
      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
        {authorizations.length === 0 ? (
          <div className="py-10 text-center">
             <div className="text-slate-600 mb-2 flex justify-center"><User size={32} strokeWidth={1} /></div>
             <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Nenhuma autorização pendente</p>
          </div>
        ) : (
          authorizations.map(auth => (
            <div 
              key={auth.id}
              className={`p-4 rounded-3xl border transition-all ${auth.status === 'VALIDATED' ? 'bg-green-500/10 border-green-500/30' : 'bg-white/5 border-white/10'}`}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-black text-slate-400">
                      {auth.studentId.substring(0, 2).toUpperCase()}
                   </div>
                   <div>
                      <div className="text-[10px] font-black text-white uppercase tracking-tight">Student {auth.studentId.split('_')[1]}</div>
                      <div className="text-[8px] text-slate-500 uppercase">Via Parent {auth.parentId.split('_')[1]}</div>
                   </div>
                </div>
                {auth.status === 'VALIDATED' ? (
                   <div className="p-1.5 bg-green-500/20 text-green-400 rounded-lg">
                      <ShieldCheck size={14} />
                   </div>
                ) : (
                   <div className="flex items-center gap-2 px-2 py-1 bg-black/40 rounded-lg border border-white/5">
                      <Clock size={10} className="text-orange-400" />
                      <span className="text-[8px] font-mono text-orange-400">EXP 30s</span>
                   </div>
                )}
              </div>

              {auth.status === 'PENDING' && (
                <button 
                  onClick={() => onValidate(auth.qrChallenge)}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all mt-2 active:scale-95"
                >
                  Validar QR Scaneado
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Footer / Stats */}
      <div className="mt-6 pt-4 border-t border-white/5 flex justify-between items-center text-[8px] text-slate-600 font-black uppercase tracking-[0.2em]">
         <span>Active TTL: 30s</span>
         <span>Security: HMAC-SHA256</span>
      </div>
    </div>
  );
};
