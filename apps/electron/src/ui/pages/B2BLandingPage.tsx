import React from 'react';
import { Shield, Zap, MessageSquare, Award, ArrowRight } from 'lucide-react';

/**
 * B2BLandingPage.tsx — Passo 19 do Roadmap.
 * Página de vendas premium para escolas parceiras.
 */
export const B2BLandingPage: React.FC = () => {
  return (
    <div className="landing-page bg-slate-950 text-white min-h-screen font-sans selection:bg-blue-500/30">
      {/* Hero Section */}
      <nav className="flex justify-between items-center px-12 py-8 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-50 border-b border-white/5">
        <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-black">A</div>
            <span className="text-xl font-black tracking-tighter uppercase">Áquila Pro</span>
        </div>
        <div className="flex gap-8 text-sm font-bold text-slate-400">
            <a href="#features" className="hover:text-blue-400">Funcionalidades</a>
            <a href="#security" className="hover:text-blue-400">Privacidade</a>
            <a href="#demo" className="bg-blue-600 text-white px-6 py-2 rounded-full hover:bg-blue-500 transition-all">Testar Agora</a>
        </div>
      </nav>

      <section className="hero px-12 py-24 flex flex-col items-center text-center">
        <div className="inline-block px-4 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-xs font-black uppercase tracking-widest mb-8 animate-bounce">
            Inovação premiada em EdTech
        </div>
        <h1 className="text-7xl font-black max-w-4xl leading-tight mb-8">
            A Escola do Futuro é <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">Segura e Conectada.</span>
        </h1>
        <p className="text-xl text-slate-400 max-w-2xl mb-12">
            Automatize a entrada e saída de alunos com reconhecimento facial local. 
            Envie alertas em tempo real para o WhatsApp dos pais e elimine filas.
        </p>
        <div className="flex gap-6">
            <button className="px-10 py-5 bg-white text-slate-950 rounded-2xl font-black text-lg hover:bg-slate-200 transition-all flex items-center gap-2">
                Solicitar Demonstração <ArrowRight size={20} />
            </button>
            <button className="px-10 py-5 bg-slate-900 border border-white/10 rounded-2xl font-black text-lg hover:bg-slate-800 transition-all">
                Ver Vídeo
            </button>
        </div>
      </section>

      {/* Trust Grid */}
      <section id="features" className="px-12 py-24 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="p-10 bg-slate-900/50 border border-white/5 rounded-3xl hover:border-blue-500/30 transition-all group">
            <Shield className="w-12 h-12 text-blue-500 mb-6 group-hover:scale-110 transition-transform" />
            <h3 className="text-2xl font-bold mb-4">Privacidade Blindada</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
                Processamento 100% local. Nenhuma biometria sobe para a nuvem. Sua escola em total compliance com a LGPD.
            </p>
        </div>
        <div className="p-10 bg-slate-900/50 border border-white/5 rounded-3xl hover:border-emerald-500/30 transition-all group">
            <Zap className="w-12 h-12 text-emerald-500 mb-6 group-hover:scale-110 transition-transform" />
            <h3 className="text-2xl font-bold mb-4">Velocidade Extrema</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
                Identificação em fluxo. Sem catracas, sem cartões, sem atrasos. Perfeito para horários de pico.
            </p>
        </div>
        <div className="p-10 bg-slate-900/50 border border-white/5 rounded-3xl hover:border-purple-500/30 transition-all group">
            <MessageSquare className="w-12 h-12 text-purple-500 mb-6 group-hover:scale-110 transition-transform" />
            <h3 className="text-2xl font-bold mb-4">Engajamento de Elite</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
                Alertas automáticos via WhatsApp com a foto do aluno. Tranquilidade imediata para as famílias parceiras.
            </p>
        </div>
      </section>

      {/* Footer / CTA */}
      <footer className="px-12 py-12 border-t border-white/5 text-center text-slate-500 text-xs">
        © 2026 Áquila Pro — Inteligência Artificial em Defesa da Educação Nacional.
      </footer>
    </div>
  );
};

export default B2BLandingPage;
