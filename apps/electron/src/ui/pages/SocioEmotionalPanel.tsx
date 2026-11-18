import React from 'react';
import { ShieldAlert, Scale, BookOpen, CheckCircle2 } from 'lucide-react';

/**
 * SocioEmotionalPanel — Neutralizado em conformidade com o Parecer CNE/CP nº 15/2026
 * (DOU de 11/11/2026) e art. 5º da LGPD / Estatuto da Criança e do Adolescente.
 * Inferência automatizada de emoções, atenção ou clima afetivo por IA é vedada.
 */
export const SocioEmotionalPanel: React.FC = () => {
  return (
    <div className="min-h-screen p-8 text-slate-200" style={{ background: 'var(--profile-bg, #020617)' }}>
      <header className="mb-8 max-w-4xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold mb-3">
          <Scale size={14} />
          Parecer CNE/CP nº 15/2026 • Bloqueio Normativo Ativo
        </div>
        <h1 className="flex items-center gap-3 text-3xl font-bold m-0 text-white">
          <ShieldAlert size={30} className="text-amber-400" />
          Acompanhamento Pedagógico Humano (Sem Inferência Emocional por IA)
        </h1>
        <p className="text-slate-400 mt-2 leading-relaxed">
          Em estrita observância ao Parecer CNE/CP nº 15/2026 (homologado em 10/11/2026, DOU de 11/11/2026),
          métricas automatizadas de &quot;engajamento&quot;, &quot;frustração estimada&quot;, humor ou atenção por visão
          computacional ou IA foram desativadas por constituírem risco excessivo.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
        <section className="p-6 rounded-2xl bg-slate-900/70 border border-white/10">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-sky-300 mb-3">
            <BookOpen size={18} />
            Regência &amp; Escuta Docente
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed m-0">
            A observação do bem-estar escolar, clima de turma e acolhimento estudantil compete exclusivamente à
            equipe docente, coordenação pedagógica e orientação educacional em registros qualitativos supervisionados,
            vedado qualquer escore automatizado ou recomendação algorítmica afetiva.
          </p>
        </section>

        <section className="p-6 rounded-2xl bg-slate-900/70 border border-white/10">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-emerald-300 mb-3">
            <CheckCircle2 size={18} />
            Alternativas Auditáveis Disponíveis
          </h2>
          <ul className="text-sm text-slate-300 space-y-2 pl-4 m-0 list-disc">
            <li>Registros de frequência nominal e chamada validada pelo docente.</li>
            <li>Acompanhamento individual de planos de aula e recuperação paralela.</li>
            <li>Canal formal de diálogo com famílias e orientação educacional humana.</li>
          </ul>
        </section>
      </div>
    </div>
  );
};

export default SocioEmotionalPanel;
