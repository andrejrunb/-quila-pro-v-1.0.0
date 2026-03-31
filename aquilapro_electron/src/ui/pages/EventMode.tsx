import React, { useState } from 'react';
import { ArrowLeft, Ticket, Users, Zap, Search, CheckCircle } from 'lucide-react';

interface EventModeProps {
  onBack: () => void;
}

export const EventMode: React.FC<EventModeProps> = ({ onBack }) => {
  const [lastCheckin, setLastCheckin] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-slate-950 p-8 flex flex-col items-center justify-center animate-fade-in">
       <div className="absolute top-8 left-8">
            <button 
                onClick={onBack}
                className="flex items-center text-slate-400 hover:text-white transition-colors group"
            >
                <ArrowLeft size={18} className="mr-2 group-hover:-translate-x-1 transition-transform" />
                Sair do Modo Evento
            </button>
       </div>

       <div className="text-center mb-12">
            <div className="inline-flex items-center bg-blue-600/10 border border-blue-500/20 px-4 py-1 rounded-full mb-4">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse mr-2" />
                <span className="text-blue-400 text-[10px] font-black uppercase tracking-widest">Modo Check-in Ativo</span>
            </div>
            <h1 className="text-5xl font-black text-white italic tracking-tighter uppercase">
                <Ticket className="inline-flex text-blue-500 mr-4 mb-2" size={48} />
                Portal de Eventos
            </h1>
            <p className="text-slate-500 text-lg">Posicione o aluno em frente à câmera para registro instantâneo.</p>
       </div>

       <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="glass-premium aspect-video bg-slate-900 border-blue-500/30 flex items-center justify-center relative shadow-2xl shadow-blue-500/10">
                <div className="absolute inset-8 border-2 border-blue-500/20 rounded-3xl border-dashed" />
                <p className="text-slate-600 font-bold uppercase text-xs tracking-widest">Aguardando Detecção...</p>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest">
                    Câmera 01 - Entrada Pátio
                </div>
            </div>

            <div className="flex flex-col justify-center space-y-6">
                <div className="glass-premium p-8 border-white/5 bg-white/[0.02]">
                    <h3 className="text-slate-500 text-[10px] uppercase font-black tracking-widest mb-4">Último Acesso</h3>
                    {lastCheckin ? (
                        <div className="flex items-center animate-fade-in-up">
                            <div className="w-16 h-16 rounded-2xl bg-emerald-500 flex items-center justify-center mr-6">
                                <CheckCircle size={32} className="text-white" />
                            </div>
                            <div>
                                <h4 className="text-2xl font-black text-white">{lastCheckin}</h4>
                                <p className="text-emerald-400 font-bold text-xs uppercase">Check-in Realizado</p>
                            </div>
                        </div>
                    ) : (
                        <p className="text-slate-600 italic">Nenhum registro nos últimos segundos.</p>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="glass-premium p-6 text-center">
                        <p className="text-[10px] text-slate-500 font-black uppercase mb-1">Total</p>
                        <p className="text-2xl font-black text-white">128</p>
                    </div>
                    <div className="glass-premium p-6 text-center">
                        <p className="text-[10px] text-slate-500 font-black uppercase mb-1">Capacidade</p>
                        <p className="text-2xl font-black text-white">85%</p>
                    </div>
                </div>

                <button 
                    onClick={() => setLastCheckin('Miguel Arraes')}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white py-5 rounded-3xl font-black uppercase tracking-widest transition-all transform active:scale-95 shadow-xl shadow-blue-600/20"
                >
                    Registrar Manualmente
                </button>
            </div>
       </div>

       <div className="mt-12 flex space-x-8 text-slate-600">
            <div className="flex items-center text-xs"><Zap size={14} className="mr-2" /> Latência 0.02s</div>
            <div className="flex items-center text-xs"><Search size={14} className="mr-2" /> Banco Offline</div>
            <div className="flex items-center text-xs"><Users size={14} className="mr-2" /> 2.1k Alunos Sincronizados</div>
       </div>
    </div>
  );
};
