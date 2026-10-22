"use client";

import { useState } from "react";
import { Shield, Lock, User, GraduationCap, Users, LayoutDashboard, ArrowRight, Activity, X, CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export default function Login() {
  const router = useRouter();
  const [selectedPortal, setSelectedPortal] = useState<{
    id: string;
    name: string;
    description: string;
    icon: React.ReactNode;
    color: string;
  } | null>(null);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const portalOptions = [
    {
      id: "escola",
      name: "Gestão Escolar",
      description: "Acesso administrativo, secretaria e RH.",
      icon: <LayoutDashboard className="text-indigo-400" size={32} />,
      color: "indigo"
    },
    {
       id: "pais",
       name: "Portal de Pais",
       description: "Monitoramento de presença e segurança familiar.",
       icon: <Users className="text-emerald-400" size={32} />,
       color: "emerald"
    },
    {
       id: "alunos",
       name: "Portal do Aluno",
       description: "Grade horária, ocorrências e desempenho.",
       icon: <GraduationCap className="text-amber-400" size={32} />,
       color: "amber"
    }
  ];

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      router.push("/bi-dashboard");
    }, 600);
  };

  const handleDemoAccess = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      router.push("/bi-dashboard");
    }, 400);
  };

  return (
    <div className="flex flex-col min-h-screen bg-black text-white items-center justify-center p-8 relative">
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
           {portalOptions.map((opt) => (
             <button 
               key={opt.id} 
               onClick={() => setSelectedPortal(opt)}
               className="group glass p-8 rounded-[36px] border-white/5 hover:border-indigo-500/30 hover:bg-white/5 transition-all flex items-center gap-8 text-left bg-zinc-950/20 shadow-xl text-white cursor-pointer"
             >
                <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                   {opt.icon}
                </div>
                <div className="flex-grow">
                   <h3 className="text-lg font-black uppercase tracking-tighter text-white">{opt.name}</h3>
                   <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">{opt.description}</p>
                </div>
                <ArrowRight size={20} className="text-zinc-700 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
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

      {/* Modal de Autenticação do Portal */}
      {selectedPortal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-zinc-950 border border-white/10 p-8 rounded-[36px] shadow-2xl relative flex flex-col gap-6">
            <button 
              onClick={() => setSelectedPortal(null)}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-4 border-b border-white/10 pb-6">
              <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center">
                {selectedPortal.icon}
              </div>
              <div>
                <h2 className="text-xl font-black uppercase tracking-tight">{selectedPortal.name}</h2>
                <p className="text-xs text-zinc-400 font-medium">Autenticação Segura Soberana</p>
              </div>
            </div>

            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Usuário / CPF / E-mail</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                  <input 
                    type="text" 
                    required
                    placeholder="Digite seu usuário..." 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Senha</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                  <input 
                    type="password" 
                    required
                    placeholder="••••••••" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              <button 
                type="submit"
                disabled={isLoading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 mt-2 cursor-pointer"
              >
                {isLoading ? "Autenticando..." : "Entrar no Portal"}
                <ArrowRight size={18} />
              </button>
            </form>

            <div className="relative my-2 flex items-center justify-center">
              <div className="border-t border-white/10 w-full" />
              <span className="bg-zinc-950 px-3 text-[10px] uppercase font-bold text-zinc-500 tracking-widest absolute">ou</span>
            </div>

            <button 
              onClick={handleDemoAccess}
              disabled={isLoading}
              className="w-full bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-400 font-bold py-3.5 rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer text-xs uppercase tracking-wider"
            >
              <CheckCircle size={16} />
              Acessar Modo Demonstração
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
