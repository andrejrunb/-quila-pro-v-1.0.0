"use client";

import { Shield, Zap, Target, Users, CheckCircle2, ArrowRight, Quote, BarChart } from "lucide-react";

export default function Casos() {
  const cases = [
    {
      school: "Colégio Savant",
      location: "São Paulo, SP",
      challenge: "Incerteza no registro de entrada e saída (fraudulência de presença).",
      result: "Redução de 94% em entradas não autorizadas e 100% de precisão na chamada.",
      quote: "O Áquila Pro nos deu a paz de espírito que nenhum sistema de catraca conseguiu dar em 10 anos.",
      author: "Dr. Marcos, Mantenedor"
    },
    {
      school: "Escola Global Matrix",
      location: "Curitiba, PR",
      challenge: "Dificuldade na comunicação em tempo real com as famílias sobre a presença.",
      result: "Aumento de 40% na satisfação dos pais e economia de 15h de staff/semana.",
      quote: "Hoje os pais recebem o alerta antes mesmo do aluno sentar na carteira. É transparência radical.",
      author: "Ana Julia, Coordenadora"
    }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-black text-white">
      <section className="pt-48 pb-20 px-8 flex flex-col items-center">
        <div className="max-w-4xl text-center">
          <h2 className="text-xs font-black uppercase tracking-[0.5em] text-emerald-500 mb-8 font-bold">Evidence-Based Sovereignty</h2>
          <h1 className="text-7xl font-black uppercase tracking-tighter mb-10 leading-[0.9]">Resultados em <span className="text-transparent bg-clip-text bg-gradient-to-br from-white to-white/30 italic">Tempo Real</span>.</h1>
          <p className="text-zinc-500 text-xl font-medium max-w-xl mx-auto">
             Não vendemos promessas. Vendemos números, segurança e eficiência operacional validada por quem decide.
          </p>
        </div>
      </section>

      {/* Case Grid */}
      <section className="py-20 px-8">
        <div className="max-w-7xl mx-auto flex flex-col gap-24">
          {cases.map((cs, idx) => (
            <div key={idx} className="glass p-12 lg:p-20 rounded-[64px] border-white/5 bg-zinc-950/20 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
               <div className="flex flex-col gap-8">
                  <div className="flex items-center gap-3">
                     <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-500/10 px-3 py-1 rounded-full font-bold">Case Study {idx + 1}</span>
                  </div>
                  <h3 className="text-4xl font-black uppercase tracking-tighter">{cs.school} — <span className="text-zinc-500">{cs.location}</span></h3>
                  <div className="flex flex-col gap-6">
                     <div>
                        <h4 className="text-xs font-black text-indigo-500 uppercase tracking-widest mb-2 font-bold">O Desafio</h4>
                        <p className="text-zinc-400 font-medium">{cs.challenge}</p>
                     </div>
                     <div>
                        <h4 className="text-xs font-black text-emerald-500 uppercase tracking-widest mb-2 font-bold">A Vitória</h4>
                        <div className="flex items-center gap-3 text-2xl font-black tracking-tighter">
                           <BarChart className="text-emerald-500" size={28} />
                           {cs.result}
                        </div>
                     </div>
                  </div>
                  <button className="flex items-center gap-2 text-white font-black uppercase tracking-widest text-[10px] mt-4 font-bold">
                    Ler Relatório Completo <ArrowRight size={14} />
                  </button>
               </div>
               
               <div className="relative glass p-12 rounded-[48px] border-emerald-500/10 bg-emerald-500/5">
                  <Quote className="absolute top-10 right-12 opacity-10 text-emerald-500" size={80} />
                  <p className="text-2xl font-black italic text-white leading-relaxed mb-8 italic">"{cs.quote}"</p>
                  <p className="text-sm font-black text-emerald-500 uppercase tracking-widest font-bold">{cs.author}</p>
               </div>
            </div>
          ))}
        </div>
      </section>

      {/* Trust Metrics Horizontal */}
      <section className="py-24 px-8 border-y border-white/5">
        <div className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-12 text-center">
           <div>
              <div className="text-5xl font-black mb-2">99.8%</div>
              <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Uptime Sovereign Hub</p>
           </div>
           <div>
              <div className="text-5xl font-black mb-2">0.2s</div>
              <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Tempo de Inferência</p>
           </div>
           <div>
              <div className="text-5xl font-black mb-2">+50</div>
              <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Instituições Protegidas</p>
           </div>
           <div>
              <div className="text-5xl font-black mb-2">&lt; 1%</div>
              <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Falsa Presença</p>
           </div>
        </div>
      </section>
    </div>
  );
}
