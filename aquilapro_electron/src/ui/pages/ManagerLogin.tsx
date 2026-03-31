import React, { useState } from 'react';
import { Shield, Lock, User, Briefcase, ChevronRight, Loader2 } from 'lucide-react';

/**
 * ManagerLogin.tsx — Passo 21 do Roadmap.
 * Portal de login para Coordenadores e Colaboradores.
 */
export const ManagerLogin: React.FC = () => {
  const [role, setRole] = useState<'coordinator' | 'staff'>('coordinator');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const aquila = (window as any).aquila;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
        const result = await aquila.invoke('login', { email, password, role });
        if (result.success) {
            window.location.hash = '#/dashboard';
        } else {
            alert('Falha no acesso restrito: ' + result.message);
        }
    } catch (err) {
        console.error('Login Error:', err);
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-600/10 blur-[120px] rounded-full" />

      <div className="w-full max-w-md bg-slate-900 border border-white/5 rounded-[40px] p-10 shadow-2xl relative z-10">
        <div className="flex flex-col items-center mb-10">
          <div className="w-20 h-20 bg-blue-600/10 rounded-3xl flex items-center justify-center mb-6 border border-blue-500/20">
            <Shield className="w-10 h-10 text-blue-400" />
          </div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Áquila Pro</h1>
          <p className="text-slate-500 text-sm mt-2 font-bold uppercase tracking-widest">Portal de Gestão</p>
        </div>

        {/* Role Switcher */}
        <div className="flex bg-slate-950 p-1.5 rounded-2xl mb-8 border border-white/5">
            <button 
                onClick={() => setRole('coordinator')}
                className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${role === 'coordinator' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-500'}`}
            >
                Coordenador
            </button>
            <button 
                onClick={() => setRole('staff')}
                className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${role === 'staff' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-500'}`}
            >
                Monitoria
            </button>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="relative">
            <User className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
            <input 
              type="email" 
              placeholder="E-mail funcional"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-950 border border-white/5 rounded-2xl py-5 pl-16 pr-6 text-white text-sm outline-none focus:border-blue-500/50 transition-all font-bold"
              required
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
            <input 
              type="password" 
              placeholder="Senha de acesso"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-950 border border-white/5 rounded-2xl py-5 pl-16 pr-6 text-white text-sm outline-none focus:border-blue-500/50 transition-all font-bold"
              required
            />
          </div>

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full bg-white hover:bg-slate-200 text-slate-950 py-5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-2xl shadow-white/5 disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="animate-spin" /> : <>Acessar Sistema <ChevronRight size={18} /></>}
          </button>
        </form>

        <p className="text-center text-slate-600 text-[10px] font-bold uppercase tracking-widest mt-10">
            Segurança Blindada • LGPD Compliant
        </p>
      </div>
    </div>
  );
};

export default ManagerLogin;
