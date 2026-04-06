"use client";

import { Shield, Lock, User, GraduationCap, Users, LayoutDashboard, ArrowRight, Activity } from "lucide-react";

export default function Login() {
  const portalOptions = [
    {
      id: "escola",
      name: "Gestão Escolar",
      description: "Acesso administrativo, secretaria e RH.",
      icon: <LayoutDashboard className="text-indigo-400" size={32} />
    },
    {
       id: "pais",
       name: "Portal de Pais",
       description: "Monitoramento de presença e segurança familiar.",
       icon: <Users className="text-emerald-400" size={32} />
    },
    {
       id: "alunos",
       name: "Portal do Aluno",
       description: "Grade horária, ocorrências e desempenho.",
       icon: <GraduationCap className="text-amber-400" size={32} />
    }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-black text-white items-center justify-center p-8">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-indigo-500/5 blur-[160px] rounded-full -z-10" />
      
      <div className="max-w-md w-full flex flex-col gap-12">
        <div className="text-center">
          <div className="w-20 h-20 bg-indigo-500/10 rounded-[32px] flex items-center justify-center mx-auto mb-8 border border-indigo-500/10 shadow-[0_0_40px_rgba(79,70,229,0.1)]">
             <Shield className="text-indigo-500" size={40} />
          </div>
          <h1 className="text-4xl font-black uppercase tracking-tighter mb-4">Sovereign <span className="text-indigo-400">Access</span></h1>
          <p className="text-zinc-500 text-sm font-bold uppercase tracking-widest">Entre no seu Hub Operacional Áquila Pro.</p>
        </div>

        <div className="flex flex-col gap-5">
           {portalOptions.map((opt, idx) => (
             <button key={idx} className="group glass p-8 rounded-[36px] border-white/5 hover:border-indigo-500/30 transition-all flex items-center gap-8 text-left bg-zinc-950/20">
                <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                   {opt.icon}
                </div>
                <div className="flex-grow">
                   <h3 className="text-lg font-black uppercase tracking-tighter">{opt.name}</h3>
                   <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">{opt.description}</p>
                </div>
                <ArrowRight size={20} className="text-zinc-700 group-hover:text-indigo-400 transition-colors" />
             </button>
           ))}
        </div>

        <div className="text-center border-t border-white/5 pt-10">
           <div className="flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600 mb-6 font-bold">
              <Activity size={12} className="text-emerald-500 animate-pulse" />
              Ghost-Vision Nodes Online
           </div>
           <p className="text-zinc-700 text-[10px] font-bold uppercase tracking-widest">© 2026 Áquila Pro — Sovereignty First Architecture</p>
        </div>
      </div>
    </div>
  );
}
