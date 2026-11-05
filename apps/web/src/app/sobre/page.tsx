"use client";

import Link from "next/link";
import { Shield, Zap, Target, Landmark, Quote } from "lucide-react";

export default function Sobre() {
  return (
    <div className="flex flex-col min-h-screen bg-black text-white">
      {/* Manifesto Hero */}
      <section
        id="manifesto"
        className="pt-44 pb-24 px-8 flex flex-col items-center relative overflow-hidden"
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-indigo-500/10 blur-[180px] rounded-full -z-10" />
        <div className="max-w-4xl text-center">
          <h2 className="text-xs font-black uppercase tracking-[0.5em] text-indigo-400 mb-6">
            O Manifesto da Soberania Escolar
          </h2>
          <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter mb-8 leading-[0.95]">
            Toda Escola Deve Ser{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-br from-white to-white/40 italic">
              Guardiã Soberana
            </span>{" "}
            dos Dados de Seus Alunos.
          </h1>
          <p className="text-zinc-300 text-lg md:text-xl font-medium leading-relaxed max-w-2xl mx-auto">
            Desenvolvemos o Áquila Pro para devolver às instituições de ensino o controle técnico sobre sua operação diária, unindo eficiência pedagógica e privacidade local.
          </p>
        </div>
      </section>

      {/* Origin Story */}
      <section className="py-24 px-8 bg-zinc-950/40 border-y border-white/5">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="flex flex-col gap-6">
            <div className="w-16 h-16 bg-white/5 rounded-3xl flex items-center justify-center">
              <Target size={32} className="text-indigo-400" />
            </div>
            <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter">
              Áquila Labs: Engenharia Aplicada à{" "}
              <span className="text-indigo-500">Sala de Aula</span>.
            </h2>
            <p className="text-zinc-300 text-base md:text-lg leading-relaxed">
              O Áquila Pro combina arquitetura local <span className="text-white font-bold">Offline-First</span>, ferramentas de apoio ao professor e governança auditável para escolas brasileiras.
            </p>
            <div className="glass p-8 md:p-10 rounded-[36px] border border-white/10 relative">
              <Quote className="absolute top-6 right-8 opacity-15 text-indigo-400" size={56} />
              <p className="text-lg font-medium italic text-zinc-200 leading-relaxed">
                &ldquo;Nossa missão é reduzir o tempo perdido com planilhas e chamadas manuais para que direção, coordenação e professores foquem no acompanhamento humano de cada estudante.&rdquo;
              </p>
              <p className="mt-4 text-xs font-black text-indigo-400 uppercase tracking-widest">
                — Engenharia Áquila Pro v2.1
              </p>
            </div>
          </div>
          <div className="glass rounded-[40px] border border-white/10 p-10 bg-black flex flex-col justify-center gap-6">
            <h3 className="text-xl font-black uppercase tracking-tighter text-white">
              Compromissos de Arquitetura
            </h3>
            <ul className="space-y-4 text-sm text-zinc-300 font-medium">
              <li>• Operação local resiliente mesmo sem internet externa.</li>
              <li>• Confirmação humana obrigatória em decisões pedagógicas críticas.</li>
              <li>• Licenciamento transparente com permissão de auditoria LGPD para escolas.</li>
            </ul>
            <div className="pt-2">
              <Link
                href="/contato"
                className="inline-block bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-8 py-4 rounded-full text-xs uppercase tracking-widest no-underline transition-all"
              >
                Conhecer Equipe &amp; Roteiro H-01
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Vision Pillars */}
      <section className="py-24 px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="flex flex-col gap-4">
            <Shield size={36} className="text-indigo-500" />
            <h3 className="text-2xl font-black uppercase tracking-tighter">Privacidade Nativa</h3>
            <p className="text-zinc-300 text-sm leading-relaxed font-medium">
              Proteção de dados de menores como requisito de engenharia desde a camada de banco de dados.
            </p>
          </div>
          <div className="flex flex-col gap-4">
            <Zap size={36} className="text-amber-500" />
            <h3 className="text-2xl font-black uppercase tracking-tighter">Resiliência Local</h3>
            <p className="text-zinc-300 text-sm leading-relaxed font-medium">
              Processamento na rede local da escola para resposta imediata na chamada e no diário.
            </p>
          </div>
          <div className="flex flex-col gap-4">
            <Landmark size={36} className="text-indigo-400" />
            <h3 className="text-2xl font-black uppercase tracking-tighter">Foco Pedagógico</h3>
            <p className="text-zinc-300 text-sm leading-relaxed font-medium">
              Tecnologia a serviço da coordenação pedagógica, do professor e do vínculo com a família.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
