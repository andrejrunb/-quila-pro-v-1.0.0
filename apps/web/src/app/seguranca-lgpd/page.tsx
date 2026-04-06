"use client";

import { Shield, Lock, EyeOff, Server, HardDrive, FileCheck, CheckCircle2, ArrowRight } from "lucide-react";

export default function SegurancaLGPD() {
  const principles = [
    {
      title: "Minimização de Dados",
      description: "Coletamos apenas o estritamente necessário para a finalidade de segurança e presença. Vetores anônimos substituem identidades visuais permanentes.",
      icon: <EyeOff className="text-indigo-400" size={28} />
    },
    {
      title: "Processamento em Edge",
      description: "A inteligência ocorre dentro da escola. As imagens brutas nunca saem da rede local e são deletadas da RAM em milisegundos.",
      icon: <Cpu className="text-indigo-400" size={28} />
    },
    {
      title: "Criptografia de Ponta",
      description: "Todos os dados em repouso e em trânsito utilizam padrões militares de criptografia (AES-256 e TLS 1.3).",
      icon: <Lock className="text-indigo-400" size={28} />
    }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-black text-white">
      <section className="pt-48 pb-24 px-8 flex flex-col items-center border-b border-white/5">
        <div className="max-w-4xl text-center">
          <Shield className="text-indigo-500 mb-8 mx-auto" size={64} />
          <h1 className="text-6xl font-black uppercase tracking-tighter mb-8 leading-tight">Privacidade por <span className="italic text-indigo-400">Padrão</span> e Design.</h1>
          <p className="text-zinc-500 text-xl max-w-2xl mx-auto font-medium leading-relaxed">
            Nossa arquitetura foi construída para superar as exigências da LGPD e as diretrizes de governança do MEC. No Áquila Pro, a segurança é técnica e juridicamente inabalável.
          </p>
        </div>
      </section>

      {/* Principles Section */}
      <section className="py-24 px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-16">
          {principles.map((prince, idx) => (
            <div key={idx} className="flex flex-col gap-6">
              <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center">
                {prince.icon}
              </div>
              <h3 className="text-2xl font-black uppercase tracking-tighter">{prince.title}</h3>
              <p className="text-zinc-500 text-sm leading-relaxed font-bold italic border-l-2 border-indigo-500/10 pl-4 uppercase tracking-widest">{prince.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Ghost-Vision Deep Dive */}
      <section className="py-32 px-8 bg-zinc-950/20 border-y border-white/5">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
          <div>
            <h2 className="text-4xl font-black uppercase tracking-tighter mb-8 italic">A Arquitetura <span className="text-indigo-500 not-italic">Ghost-Vision</span>.</h2>
            <div className="flex flex-col gap-8 text-zinc-400 text-lg leading-relaxed">
              <p>Ao contrário de sistemas de CFTV tradicionais, o Áquila Pro não armazena vídeos. Nosso motor neural transforma a luz em **tensores matemáticos anônimos** em tempo real.</p>
              <div className="flex flex-col gap-4">
                 <div className="flex items-center gap-4 text-xs font-black uppercase tracking-widest text-white">
                    <CheckCircle2 className="text-indigo-500" size={20} />
                    Zero Persistent Images
                 </div>
                 <div className="flex items-center gap-4 text-xs font-black uppercase tracking-widest text-white">
                    <CheckCircle2 className="text-indigo-500" size={20} />
                    Anonymized Search Tokens
                 </div>
                 <div className="flex items-center gap-4 text-xs font-black uppercase tracking-widest text-white">
                    <CheckCircle2 className="text-indigo-500" size={20} />
                    Hardware-Level Hardening
                 </div>
              </div>
            </div>
          </div>
          <div className="glass aspect-video rounded-[64px] border border-white/10 p-1 bg-black flex items-center justify-center">
             <div className="w-full h-full bg-indigo-500/5 rounded-[60px] flex items-center justify-center italic text-zinc-700 font-bold uppercase tracking-widest text-xs">
                Diagrama de Fluxo de Dados Seguro [v3441]
             </div>
          </div>
        </div>
      </section>

      {/* Legal & Docs */}
      <section className="py-32 px-8">
        <div className="max-w-4xl mx-auto text-center flex flex-col items-center">
          <h2 className="text-4xl font-black uppercase tracking-tighter mb-16">Transparência <span className="text-indigo-500">Legal</span></h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
            <button className="flex items-center justify-between p-8 rounded-[32px] glass hover:bg-white/5 border-white/5 transition-all text-left">
               <div>
                  <div className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1 font-bold">Policy v4.0</div>
                  <div className="text-xl font-black">Política de Privacidade</div>
               </div>
               <ArrowRight size={24} className="text-indigo-400" />
            </button>
            <button className="flex items-center justify-between p-8 rounded-[32px] glass hover:bg-white/5 border-white/5 transition-all text-left font-bold">
               <div className="font-bold">
                  <div className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1 font-bold">Compliance</div>
                  <div className="text-xl font-black">Relatório de Impacto (DPIA)</div>
               </div>
               <ArrowRight size={24} className="text-indigo-400" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
