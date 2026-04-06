"use client";

import { Shield, Zap, Globe, Cpu, CheckCircle2, ArrowRight, MessageSquare, Target, GraduationCap, Users, Calendar, Landmark } from "lucide-react";

export default function Solucoes() {
  const personas = [
    {
      id: "direcao",
      name: "Para Direção & Mantenedores",
      pain: "Riscos operacionais e falta de visão macro.",
      solution: "Visão Soberana e ROI em Eficiência.",
      icon: <Landmark className="text-indigo-400" size={40} />,
      bullets: ["Redução de custos com chamadas manuais", "Soberania de dados e conformidade LGPD", "Fidelização de famílias via transparência"],
      benefit: "Reduza riscos civis e aumente a retenção de alunos em até 20%."
    },
    {
      id: "coordenacao",
      name: "Para Coordenação & DP",
      pain: "Burocracia excessiva e falta de dados em tempo real.",
      solution: "Automação Operacional e Controle de Fluxo.",
      icon: <Calendar className="text-emerald-400" size={40} />,
      bullets: ["Alertas de frequência em tempo real", "Gestão de ocorrências digitalizada", "Ponto biométrico automatizado"],
      benefit: "Recupere 15h semanais da sua equipe de apoio."
    },
    {
      id: "familias",
      name: "Para as Famílias",
      pain: "Incerteza sobre a segurança e presença do filho.",
      solution: "Paz de Espírito Total.",
      icon: <Users className="text-amber-400" size={40} />,
      bullets: ["Notificações de presença via WhatsApp", "Acesso ao Portal Familiar Seguro", "Histórico de frequência e biometria"],
      benefit: "Transforme a escola em um ambiente de confiança radical."
    }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-black text-white">
      <section className="pt-40 pb-20 px-8 flex flex-col items-center">
        <div className="max-w-4xl text-center">
          <h2 className="text-xs font-black uppercase tracking-[0.5em] text-indigo-500 mb-6">Persona-Centric Solutions</h2>
          <h1 className="text-6xl font-black uppercase tracking-tighter mb-8 leading-tight">Soluções que <span className="italic text-indigo-400">falam o seu cargo</span>.</h1>
          <p className="text-zinc-500 text-xl max-w-2xl mx-auto">
            O Áquila Pro não é apenas software. É um braço direito estratégico para cada pilar da sua instituição.
          </p>
        </div>
      </section>

      {/* Persona Cards Grid */}
      <section className="py-20 px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
          {personas.map((persona, idx) => (
            <div key={idx} className="group glass p-12 rounded-[64px] border-white/5 hover:border-indigo-500/30 transition-all flex flex-col gap-8 bg-zinc-950/20">
              <div className="w-20 h-20 rounded-[32px] bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
                {persona.icon}
              </div>
              <div>
                <h3 className="text-2xl font-black uppercase tracking-tighter mb-2">{persona.name}</h3>
                <p className="text-xs font-bold text-indigo-500 uppercase tracking-widest">{persona.solution}</p>
              </div>
              <p className="text-zinc-400 text-sm leading-relaxed italic border-l-2 border-indigo-500/20 pl-4">
                "{persona.pain}"
              </p>
              <div className="flex flex-col gap-4 py-4">
                {persona.bullets.map((bullet, i) => (
                  <div key={i} className="flex items-center gap-3 text-xs font-bold text-zinc-300">
                    <CheckCircle2 size={16} className="text-indigo-500" />
                    {bullet}
                  </div>
                ))}
              </div>
              <div className="mt-auto pt-6 border-t border-white/5">
                <div className="text-sm font-black text-white mb-4 uppercase tracking-tighter">{persona.benefit}</div>
                <button className="flex items-center gap-2 text-indigo-400 font-bold uppercase tracking-widest text-[10px]">
                  Ver PDF da Solução <ArrowRight size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Floating CTA */}
      <section className="py-20 px-8 bg-indigo-600/5 mt-20 border-t border-indigo-500/10">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-10">
           <h2 className="text-3xl font-black uppercase tracking-tighter">Não encontrou seu perfil?</h2>
           <button className="bg-white text-black px-12 py-5 rounded-full font-black uppercase tracking-widest hover:bg-zinc-200 transition-all">
              Agendar Conversa Consultiva
           </button>
        </div>
      </section>
    </div>
  );
}
