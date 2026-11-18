import React, { useEffect, useState } from 'react';
import { Shield, Zap, MessageSquare, ArrowRight, CheckCircle2, QrCode, X } from 'lucide-react';
import { animate, stagger } from 'animejs';

/**
 * B2BLandingPage.tsx — Página institucional de apresentação para escolas parceiras.
 * Alinhada à Matriz de Veracidade, ANPD NT 4/2026 e Parecer CNE/CP nº 15/2026.
 */
export const B2BLandingPage: React.FC = () => {
  const [activeModal, setActiveModal] = useState<'demo' | 'workflow' | null>(null);
  const [demoSchoolName, setDemoSchoolName] = useState('');
  const [demoEmail, setDemoEmail] = useState('');
  const [demoSubmitted, setDemoSubmitted] = useState(false);

  useEffect(() => {
    animate('.hero > *', { opacity: [0, 1], translateY: [20, 0], delay: stagger(100, { start: 200 }) });

    animate('.hero-badge', {
      translateY: [-5, 5],
      duration: 2000,
      alternate: true,
      loop: true,
      ease: 'inOutQuad'
    });

    animate('.feature-card', { opacity: [0, 1], translateY: [20, 0], delay: stagger(100) });

    animate('.pain-item', {
      translateX: [-50, 0],
      opacity: [0, 1],
      delay: stagger(150),
      duration: 1000,
      ease: 'outQuart'
    });
  }, []);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleDemoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!demoSchoolName.trim() || !demoEmail.trim()) return;
    setDemoSubmitted(true);
  };

  return (
    <div className="landing-page bg-slate-950 text-white min-h-screen font-sans selection:bg-blue-500/30 overflow-x-hidden">
      <div className="fixed inset-0 pointer-events-none opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/30 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-600/20 rounded-full blur-[120px]" />
      </div>

      {/* Header */}
      <nav className="flex justify-between items-center px-12 py-8 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-50 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-black">A</div>
          <span className="text-xl font-black tracking-tighter uppercase">Áquila Pro</span>
        </div>
        <div className="flex items-center gap-8 text-sm font-bold text-slate-400">
          <button type="button" onClick={() => scrollToSection('features')} className="bg-transparent border-0 text-inherit cursor-pointer hover:text-blue-400">
            Funcionalidades
          </button>
          <button type="button" onClick={() => scrollToSection('security')} className="bg-transparent border-0 text-inherit cursor-pointer hover:text-blue-400">
            Privacidade &amp; LGPD
          </button>
          <button
            type="button"
            onClick={() => { setDemoSubmitted(false); setActiveModal('demo'); }}
            className="bg-blue-600 text-white px-6 py-2 rounded-full hover:bg-blue-500 transition-all cursor-pointer border-0"
          >
            Testar Agora
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero px-12 py-24 flex flex-col items-center text-center">
        <div className="hero-badge inline-block px-4 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-xs font-black uppercase tracking-widest mb-8">
          Gestão Escolar Soberana • Conformidade CNE/CP nº 15/2026
        </div>
        <h1 className="text-7xl font-black max-w-4xl leading-tight mb-8">
          A Escola do Futuro é <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">Segura e Auditável.</span>
        </h1>
        <p className="text-xl text-slate-400 max-w-2xl mb-12">
          Organize a entrada e saída de estudantes com Crachá QR dinâmico e Chamada Nominal validada pelo docente.
          Notifique responsáveis via canal oficial mediante consentimento explícito e elimine gargalos na portaria.
        </p>
        <div className="flex gap-6">
          <button
            type="button"
            onClick={() => { setDemoSubmitted(false); setActiveModal('demo'); }}
            className="px-10 py-5 bg-white text-slate-950 rounded-2xl font-black text-lg hover:bg-slate-200 transition-all flex items-center gap-2 cursor-pointer border-0"
          >
            Solicitar Demonstração <ArrowRight size={20} />
          </button>
          <button
            type="button"
            onClick={() => setActiveModal('workflow')}
            className="px-10 py-5 bg-slate-900 border border-white/10 text-white rounded-2xl font-black text-lg hover:bg-slate-800 transition-all cursor-pointer"
          >
            Ver Arquitetura &amp; Fluxo
          </button>
        </div>
      </section>

      {/* Pain Points Section */}
      <section className="px-12 py-24 bg-white text-slate-950 rounded-[64px] mx-6 relative z-10 overflow-hidden">
        <div className="max-w-4xl mx-auto text-center mb-20">
          <h2 className="text-4xl md:text-6xl font-black mb-6 tracking-tighter">O desafio das escolas modernas.</h2>
          <p className="text-xl text-slate-600 font-medium">
            Faltas não justificadas, insegurança no portão e comunicação lenta com as famílias geram atrito e evasão.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-20 items-center">
          <div className="space-y-12">
            <div className="pain-item flex gap-6 items-start">
              <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center shrink-0 font-bold">01</div>
              <div>
                <h4 className="text-2xl font-black mb-2 italic">&quot;Meu filho já chegou na escola?&quot;</h4>
                <p className="text-slate-500">
                  A tranquilidade dos responsáveis depende de registros rápidos. Relatórios manuais de frequência atrasam o aviso preventivo.
                </p>
              </div>
            </div>
            <div className="pain-item flex gap-6 items-start">
              <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center shrink-0 font-bold">02</div>
              <div>
                <h4 className="text-2xl font-black mb-2 italic">O gargalo do portão.</h4>
                <p className="text-slate-500">
                  Filas de entrada, conferência lenta de autorizações de retirada e falta de registro auditável geram risco operacional.
                </p>
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
                Notificação institucional via Portal ou WhatsApp (com opt-in)
              </li>
              <li className="flex items-center gap-4 text-lg">
                <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center text-[10px] font-bold text-slate-950">✓</div>
                Crachá QR Dinâmico + Chamada Nominal Docente (padrão de fábrica)
              </li>
              <li className="flex items-center gap-4 text-lg">
                <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center text-[10px] font-bold text-slate-950">✓</div>
                Trilha de Auditoria SHA-256 &amp; Supervisão Humana Obrigatória
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Trust Grid */}
      <section id="features" className="px-12 py-24 grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
        <div id="security" className="feature-card p-10 bg-slate-900/50 border border-white/5 rounded-3xl hover:border-blue-500/30 transition-all group">
          <Shield className="w-12 h-12 text-blue-500 mb-6 group-hover:scale-110 transition-transform" />
          <h3 className="text-2xl font-bold mb-4">Privacidade &amp; Quarentena Biométrica</h3>
          <p className="text-slate-400 text-sm leading-relaxed">
            Operação local em banco SQLite com modo WAL e conformidade à LGPD / ANPD NT 4/2026. Identificação biométrica
            vem desativada de fábrica e exige opt-in excepcional local com RIPD formal aprovado pela instituição.
          </p>
        </div>
        <div className="feature-card p-10 bg-slate-900/50 border border-white/5 rounded-3xl hover:border-emerald-500/30 transition-all group">
          <QrCode className="w-12 h-12 text-emerald-500 mb-6 group-hover:scale-110 transition-transform" />
          <h3 className="text-2xl font-bold mb-4">Fluxo Ágil por Crachá QR</h3>
          <p className="text-slate-400 text-sm leading-relaxed">
            Credencial estudantil em QR Code dinâmico e conferência rápida de portaria, sem exposição biométrica de menores e com registro imediato no diário.
          </p>
        </div>
        <div className="feature-card p-10 bg-slate-900/50 border border-white/5 rounded-3xl hover:border-purple-500/30 transition-all group">
          <MessageSquare className="w-12 h-12 text-purple-500 mb-6 group-hover:scale-110 transition-transform" />
          <h3 className="text-2xl font-bold mb-4">Comunicação Segura com Famílias</h3>
          <p className="text-slate-400 text-sm leading-relaxed">
            Alertas textuais de registro de entrada e frequência no Portal da Família ou canal autorizado, preservando imagem e dados de crianças e adolescentes.
          </p>
        </div>
      </section>

      {/* Interactive Demo / Workflow Modal */}
      {activeModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-6">
          <div className="bg-slate-900 border border-white/15 rounded-3xl max-w-lg w-full p-8 relative shadow-2xl">
            <button
              type="button"
              onClick={() => setActiveModal(null)}
              aria-label="Fechar janela"
              className="absolute top-5 right-5 bg-transparent border-0 text-slate-400 hover:text-white cursor-pointer"
            >
              <X size={20} />
            </button>

            {activeModal === 'demo' ? (
              demoSubmitted ? (
                <div className="text-center py-6 space-y-4">
                  <CheckCircle2 size={44} className="text-emerald-400 mx-auto" />
                  <h3 className="text-2xl font-bold m-0">Solicitação Registrada</h3>
                  <p className="text-slate-300 text-sm">
                    Recebemos os dados de <strong>{demoSchoolName}</strong> ({demoEmail}) para agendamento de avaliação institucional em ambiente local.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveModal(null)}
                    className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold cursor-pointer border-0"
                  >
                    Concluir
                  </button>
                </div>
              ) : (
                <form onSubmit={handleDemoSubmit} className="space-y-4">
                  <h3 className="text-2xl font-bold m-0">Solicitar Demonstração Institucional</h3>
                  <p className="text-slate-400 text-sm m-0">
                    Apresente o Áquila Pro à direção com checklist de governança LGPD, CNE/CP nº 15/2026 e operação por Crachá QR.
                  </p>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Nome da Instituição</label>
                    <input
                      type="text"
                      required
                      value={demoSchoolName}
                      onChange={e => setDemoSchoolName(e.target.value)}
                      placeholder="Ex.: Colégio Modelo"
                      className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-white/10 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">E-mail da Direção / Coordenação</label>
                    <input
                      type="email"
                      required
                      value={demoEmail}
                      onChange={e => setDemoEmail(e.target.value)}
                      placeholder="direcao@escola.edu.br"
                      className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-white/10 text-white"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold cursor-pointer border-0"
                  >
                    Agendar Apresentação
                  </button>
                </form>
              )
            ) : (
              <div className="space-y-4">
                <h3 className="text-2xl font-bold m-0">Arquitetura Soberana &amp; Governança</h3>
                <ul className="space-y-3 text-sm text-slate-300 pl-4 m-0 list-disc">
                  <li><strong>Portaria padrão:</strong> Crachá QR dinâmico e Chamada Nominal no Diário de Classe.</li>
                  <li><strong>Biometria facial em quarentena:</strong> desabilitada de fábrica; eventual ativação exige RIPD assinado e consentimento expresso (LGPD Art. 14).</li>
                  <li><strong>IA Pedagógica (HITL):</strong> correções e pareceres permanecem em rascunho até validação do docente.</li>
                </ul>
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold cursor-pointer border-0"
                >
                  Entendi
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer / CTA */}
      <footer className="px-12 py-12 border-t border-white/5 text-center text-slate-500 text-xs">
        © 2026 Áquila Pro — Inteligência Artificial sob Regência Docente (Parecer CNE/CP nº 15/2026).
      </footer>
    </div>
  );
};

export default B2BLandingPage;
