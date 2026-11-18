import React from 'react';
import { Scale, BookOpen, ShieldCheck } from 'lucide-react';

export function ClassRanking() {
  return (
    <div className="min-h-screen p-8 bg-zinc-950 text-white font-sans selection:bg-cyan-500/30">
      <header className="mb-10 max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold mb-3">
          <Scale size={14} />
          Parecer CNE/CP nº 15/2026 • Governança Antiranqueamento
        </div>
        <h1 className="text-3xl font-bold text-white">
          Acompanhamento Coletivo de Turmas (Visão Não-Competitiva)
        </h1>
        <p className="text-zinc-400 mt-2 text-base">
          O painel de &quot;Pódio das Turmas&quot; e ranqueamento por engajamento/pontualidade foi substituído por
          acompanhamento formativo sem classificação punitiva ou competitiva entre turmas.
        </p>
      </header>

      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
        <section className="p-6 rounded-2xl bg-white/5 border border-white/10">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-cyan-300 mb-3">
            <BookOpen size={18} />
            Inclusão &amp; Equidade Pedagógica
          </h2>
          <p className="text-sm text-zinc-300 leading-relaxed m-0">
            Cada turma possui contexto próprio, ritmos de aprendizagem distintos e demandas específicas de
            acessibilidade. Indicadores são analisados privativamente pela equipe pedagógica no Diário de Classe e no
            Conselho de Classe humano.
          </p>
        </section>

        <section className="p-6 rounded-2xl bg-white/5 border border-white/10">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-emerald-300 mb-3">
            <ShieldCheck size={18} />
            Conformidade LGPD &amp; CNE/MEC
          </h2>
          <p className="text-sm text-zinc-300 leading-relaxed m-0">
            É vedada a exibição de placares comparativos que induzam exposição pública ou ranqueamento automatizado de
            estudantes e coletivos escolares.
          </p>
        </section>
      </div>
    </div>
  );
}
