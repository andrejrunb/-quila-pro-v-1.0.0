"use client";

import { Shield, Zap, Target, Users, Landmark, ArrowRight, Quote } from "lucide-react";

export default function Sobre() {
  return (
    <div className="flex flex-col min-h-screen bg-black text-white">
      {/* Manifesto Hero */}
      <section className="pt-48 pb-32 px-8 flex flex-col items-center relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-indigo-500/10 blur-[180px] rounded-full -z-10" />
        <div className="max-w-4xl text-center">
          <h2 className="text-xs font-black uppercase tracking-[0.6em] text-indigo-500 mb-8 font-bold">O Manifesto da Soberania</h2>
          <h1 className="text-7xl font-black uppercase tracking-tighter mb-10 leading-[0.9]">Toda Escola Deve Ser <span className="text-transparent bg-clip-text bg-gradient-to-br from-white to-white/30 italic">Proprietária</span> do Seu Próprio Destino.</h1>
          <p className="text-zinc-400 text-xl font-medium leading-relaxed max-w-2xl mx-auto">
            Nascemos para devolver às instituições o controle total sobre seus dados e a segurança absoluta dos seus alunos. Sem nuvens invasivas, sem intermediários.
          </p>
        </div>
      </section>

      {/* Origin Story */}
      <section className="py-32 px-8 bg-zinc-950/30 border-y border-white/5">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
          <div className="flex flex-col gap-8">
             <div className="w-16 h-16 bg-white/5 rounded-3xl flex items-center justify-center">
                <Target size={32} className="text-indigo-400" />
             </div>
             <h2 className="text-4xl font-black uppercase tracking-tighter">Áquila Labs: Engenharia com <span className="text-indigo-500">Propósito</span>.</h2>
             <p className="text-zinc-500 text-lg leading-relaxed">O Áquila Pro não é um produto de prateleira. É o resultado de anos de pesquisa em <span className="text-white">Edge AI</span> e governança de dados educacionais.</p>
             <div className="glass p-10 rounded-[48px] border-white/5 relative">
                <Quote className="absolute top-8 right-12 opacity-10 text-indigo-500" size={64} />
                <p className="text-xl font-medium italic text-zinc-300 leading-relaxed italic">"Nossa missão é tornar a tecnologia invisível e a segurança onipresente. Queremos que o gestor foque no que importa: o aprendizado."</p>
                <p className="mt-6 text-sm font-black text-indigo-500 uppercase tracking-widest font-bold">— Áquila Team v3441</p>
             </div>
          </div>
          <div className="aspect-[4/5] glass rounded-[64px] border-white/10 p-2 overflow-hidden bg-black flex items-center justify-center">
             <div className="text-zinc-700 font-black text-xs uppercase tracking-widest italic font-bold">Áquila Swarm Hub Visão [MOCKVIEW]</div>
          </div>
        </div>
      </section>

      {/* Vision Pillars */}
      <section className="py-32 px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-16">
          <div className="flex flex-col gap-6">
            <Shield size={40} className="text-indigo-500" />
            <h3 className="text-2xl font-black uppercase tracking-tighter">Ética Radical</h3>
            <p className="text-zinc-500 text-sm leading-relaxed font-bold uppercase tracking-widest italic font-bold">Privacidade não é opcional, é o alicerce de toda a nossa engenharia.</p>
          </div>
          <div className="flex flex-col gap-6">
            <Zap size={40} className="text-amber-500" />
            <h3 className="text-2xl font-black uppercase tracking-tighter">Inovação Edge</h3>
            <p className="text-zinc-500 text-sm leading-relaxed font-bold uppercase tracking-widest italic font-bold">Processamento local massivo para garantir latência zero e segurança total.</p>
          </div>
          <div className="flex flex-col gap-6">
            <Landmark size={40} className="text-indigo-400" />
            <h3 className="text-2xl font-black uppercase tracking-tighter">Legado Educacional</h3>
            <p className="text-zinc-500 text-sm leading-relaxed font-bold uppercase tracking-widest italic font-bold">Construímos ferramentas que elevam o padrão das instituições de ensino.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
