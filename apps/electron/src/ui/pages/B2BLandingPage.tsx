import React, { useEffect, useRef } from 'react';
import { Shield, Zap, MessageSquare, Award, ArrowRight } from 'lucide-react';
import { useAnime, eliteAnimate } from '../hooks/useAnime';

/**
 * B2BLandingPage.tsx — Passo 19 do Roadmap.
 * Página de vendas premium para escolas parceiras.
 */
export const B2BLandingPage: React.FC = () => {
    const heroRef = useRef<HTMLDivElement>(null);
    const featuresRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Animação High-Impact no Hero
        // 1. Entrada escalonada dramática
        eliteAnimate.springIn('.hero > *', 200);
        
        // 2. Flutuação contínua suave para o badge
        useAnime({
            targets: '.hero-badge',
            translateY: [-5, 5],
            duration: 2000,
            direction: 'alternate',
            loop: true,
            easing: 'easeInOutQuad'
        });

        // 3. Stagger no Grid de Features
        eliteAnimate.stagger('.feature-card', 100);

        // 4. Revelação de Dores (High Impact)
        useAnime({
            targets: '.pain-item',
            translateX: [-50, 0],
            opacity: [0, 1],
            delay: anime.stagger(150),
            duration: 1000,
            easing: 'easeOutQuart'
        });
    }, []);

    return (
        <div className="landing-page bg-slate-950 text-white min-h-screen font-sans selection:bg-blue-500/30 overflow-x-hidden">
            {/* Background Decor (High Impact) */}
            <div className="fixed inset-0 pointer-events-none opacity-20">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/30 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-600/20 rounded-full blur-[120px]" />
            </div>

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
        <div className="hero-badge inline-block px-4 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-xs font-black uppercase tracking-widest mb-8">
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

      {/* Pain Points Section (High Impact) */}
      <section className="px-12 py-24 bg-white text-slate-950 rounded-[64px] mx-6 relative z-10 overflow-hidden">
        <div className="max-w-4xl mx-auto text-center mb-20">
            <h2 className="text-4xl md:text-6xl font-black mb-6 tracking-tighter">O desafio das escolas modernas.</h2>
            <p className="text-xl text-slate-600 font-medium">Faltas não justificadas, insegurança no portão e comunicação lenta com os pais geram atrito e evasão.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-20 items-center">
            <div className="space-y-12">
                <div className="pain-item flex gap-6 items-start">
                    <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center shrink-0 font-bold">01</div>
                    <div>
                        <h4 className="text-2xl font-black mb-2 italic">"Meu filho já chegou na escola?"</h4>
                        <p className="text-slate-500">A ansiedade dos pais é constante. Relatórios de presença manuais levam horas para serem processados.</p>
                    </div>
                </div>
                <div className="pain-item flex gap-6 items-start">
                    <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center shrink-0 font-bold">02</div>
                    <div>
                        <h4 className="text-2xl font-black mb-2 italic">O gargalo do portão.</h4>
                        <p className="text-slate-500">Filas imensas, conferência manual de documentos e risco de pessoas não autorizadas retirarem alunos.</p>
                    </div>
                </div>
            </div>

            <div className="bg-slate-950 p-12 rounded-[48px] text-white relative shadow-2xl overflow-hidden group">
                <div className="absolute inset-0 bg-blue-600/10 group-hover:bg-blue-600/20 transition-colors pointer-events-none" />
                <h4 className="text-3xl font-black mb-6 flex items-center gap-3">
                    <Zap className="text-yellow-400" /> A Solução Soberana
                </h4>
                <ul className="space-y-6">
                    <li className="flex items-center gap-4 text-lg">
                        <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center text-[10px] font-bold text-slate-950">✓</div>
                        Notificação INSTANTÂNEA no WhatsApp
                    </li>
                    <li className="flex items-center gap-4 text-lg">
                        <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center text-[10px] font-bold text-slate-950">✓</div>
                        Reconhecimento Facial 0.3s (Edge Native)
                    </li>
                    <li className="flex items-center gap-4 text-lg">
                        <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center text-[10px] font-bold text-slate-950">✓</div>
                        Dashboard de Auditoria em Tempo Real
                    </li>
                </ul>
            </div>
        </div>
      </section>

      {/* Trust Grid */}
      <section id="features" className="px-12 py-24 grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
        <div className="feature-card p-10 bg-slate-900/50 border border-white/5 rounded-3xl hover:border-blue-500/30 transition-all group">
            <Shield className="w-12 h-12 text-blue-500 mb-6 group-hover:scale-110 transition-transform" />
            <h3 className="text-2xl font-bold mb-4">Privacidade Blindada</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
                Processamento 100% local. Nenhuma biometria sobe para a nuvem. Sua escola em total compliance com a LGPD.
            </p>
        </div>
        <div className="feature-card p-10 bg-slate-900/50 border border-white/5 rounded-3xl hover:border-emerald-500/30 transition-all group">
            <Zap className="w-12 h-12 text-emerald-500 mb-6 group-hover:scale-110 transition-transform" />
            <h3 className="text-2xl font-bold mb-4">Velocidade Extrema</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
                Identificação em fluxo. Sem catracas, sem cartões, sem atrasos. Perfeito para horários de pico.
            </p>
        </div>
        <div className="feature-card p-10 bg-slate-900/50 border border-white/5 rounded-3xl hover:border-purple-500/30 transition-all group">
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
