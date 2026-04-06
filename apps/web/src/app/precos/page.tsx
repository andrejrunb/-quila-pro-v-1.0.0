"use client";

import { Shield, Zap, Globe, Cpu, CheckCircle2, ArrowRight, MessageSquare, Target, GraduationCap, Users, Calendar, Landmark, Check } from "lucide-react";

export default function Precos() {
  const plans = [
    {
      id: "essencial",
      name: "Sovereign Essential",
      price: "R$ 4.50",
      period: "/aluno/mês",
      description: "Prontidão para segurança e presença automática.",
      features: ["Presença Facial (Ghost-Vision)", "Alertas de Evasão", "Portal Familiar Básico", "Relatórios de Frequência"],
      cta: "Contratar Essencial",
      highlight: false
    },
    {
      id: "pro",
      name: "Sovereign Pro",
      price: "R$ 8.90",
      period: "/aluno/mês",
      description: "Controle operacional total e automação docente.",
      features: ["Tudo no Essential", "Córtex Docente por Voz", "Integração de WhatsApp", "Timetable Solver IA", "Suporte Prioritário"],
      cta: "Demonstração Pro",
      highlight: true
    },
    {
      id: "elite",
      name: "Sovereign Elite",
      price: "Sob Consulta",
      period: "",
      description: "Customização total e soberania absoluta.",
      features: ["Tudo no Pro", "White-Label Completo (Sua Marca)", "API de Integração Aberta", "DPO as a Service (LGPD)", "Consultoria VIP de Gestão"],
      cta: "Falar com Consultor",
      highlight: false
    }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-black text-white">
      <section className="pt-48 pb-20 px-8 flex flex-col items-center">
        <div className="max-w-4xl text-center">
          <h1 className="text-6xl font-black uppercase tracking-tighter mb-8 italic">O Valor da <span className="text-indigo-500 not-italic">Sua Tranquilidade</span>.</h1>
          <p className="text-zinc-500 text-xl max-w-2xl mx-auto font-medium">
             Investimento estratégico que se paga em redução de evasão, eficiência de staff e fidelização de famílias.
          </p>
        </div>
      </section>

      {/* Pricing Matrix */}
      <section className="py-20 px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, idx) => (
            <div key={idx} className={`group flex flex-col p-12 rounded-[64px] border ${plan.highlight ? 'border-indigo-500 bg-indigo-500/5 shadow-[0_0_50px_rgba(79,70,229,0.1)] scale-105' : 'border-white/5 bg-zinc-950/20'} transition-all`}>
              <div className="mb-8">
                <h3 className="text-2xl font-black uppercase tracking-tighter mb-2">{plan.name}</h3>
                <p className="text-zinc-500 text-sm">{plan.description}</p>
              </div>
              
              <div className="mb-10 flex items-baseline gap-2">
                <span className="text-5xl font-black tracking-tighter">{plan.price}</span>
                <span className="text-zinc-500 text-sm font-bold uppercase tracking-widest">{plan.period}</span>
              </div>

              <div className="flex flex-col gap-5 mb-12">
                {plan.features.map((feat, i) => (
                  <div key={i} className="flex items-center gap-3 text-xs font-bold text-zinc-400 group-hover:text-white transition-colors">
                    <Check size={16} className="text-indigo-500" />
                    {feat}
                  </div>
                ))}
              </div>

              <button className={`mt-auto w-full py-5 rounded-full font-black uppercase tracking-widest text-xs transition-all ${plan.highlight ? 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-xl shadow-indigo-500/20' : 'bg-white text-black hover:bg-zinc-200'}`}>
                {plan.cta}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ Mini */}
      <section className="py-32 px-8 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-black uppercase tracking-tighter text-center mb-20 italic">Dúvidas <span className="text-indigo-500">Comuns</span></h2>
          <div className="flex flex-col gap-6">
            <div className="glass p-10 rounded-[40px] border-white/5">
               <h4 className="text-lg font-black text-white mb-2 uppercase tracking-tighter">O Áquila Pro substitui meu sistema de gestão atual?</h4>
               <p className="text-zinc-500 text-sm leading-relaxed font-medium">Não, o Áquila Pro é um School OS que <span className="text-white">potencializa</span> sua gestão. Operamos como uma camada de visão e automação que pode ser integrada à sua base de dados atual.</p>
            </div>
            <div className="glass p-10 rounded-[40px] border-white/5">
               <h4 className="text-lg font-black text-white mb-2 uppercase tracking-tighter">É necessário investir em novas câmeras?</h4>
               <p className="text-zinc-500 text-sm leading-relaxed font-medium">95% das escolas possuem câmeras compatíveis. Nossa equipe faz uma auditoria técnica durante o setup para garantir que sua infraestrutura suporte o <span className="text-white italic">Ghost-Vision</span>.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
