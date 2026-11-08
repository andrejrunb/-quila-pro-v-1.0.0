"use client";

import Link from "next/link";
import { ArrowRight, Quote, BarChart } from "lucide-react";

export default function Casos() {
  const cases = [
    {
      tag: "Cenário de Bancada 01 • Ensino Fundamental II & Médio",
      school: "Unidade Modelo Sintética — 20 Salas / 500 Alunos",
      location: "Testes Internos Automatizados de Bancada (H-01)",
      challenge:
        "Divergência entre registros de entrada na portaria, chamadas em papel na 1ª aula e demora na identificação de alunos com faltas consecutivas.",
      result:
        "Sincronização imediata em bancada entre chamada docente e fila de alertas da coordenação (20/20 casos de teste internos e 10/10 critérios de orquestração verificados em laboratório), com 100% dos eventos auditados em banco SQLite local (WAL).",
      quote:
        "A consolidação da linha do tempo do aluno permite que a coordenação visualize presença, atrasos, ocorrências e justificativas em uma única tela antes do fim do primeiro tempo de aula.",
      author: "Relatório de Testes Internos H-01 • Coordenação Pedagógica",
    },
    {
      tag: "Cenário de Bancada 02 • Avaliações OMR & Disaster Recovery",
      school: "Fluxo Integrado CSV Sintético → Diário → Kernel OMR",
      location: "Bateria Sintética Verificada em Bancada (Fixtures H-01)",
      challenge:
        "Alto tempo gasto pelos professores na digitação manual de notas de simulados e risco de corrupção de banco em quedas de energia.",
      result:
        "Importação validada de 381 registros sintéticos via CSV, leitura óptica via Kernel OpenCV determinístico (Sauvola + Homografia 3×3) e recuperação transacional atômica do banco SQLite testada em bancada.",
      quote:
        "Mesmo desconectado da internet externa, o aplicativo instalado mantém a chamada, o mapa de carteiras 6×5, os jogos interativos e o lançamento de notas funcionando na rede local.",
      author: "Dossiê Técnico de Estabilidade & DR • Engenharia Áquila",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-black text-white">
      <section className="pt-44 pb-16 px-8 flex flex-col items-center">
        <div className="max-w-4xl text-center">
          <h2 className="text-xs font-black uppercase tracking-[0.4em] text-emerald-400 mb-6">
            Testes Internos de Bancada &amp; Homologação Técnica
          </h2>
          <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter mb-8 leading-[0.95]">
            Evidências de{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-br from-white to-white/40 italic">
              Bancada Verificáveis
            </span>
            .
          </h1>
          <p className="text-zinc-300 text-lg md:text-xl font-medium max-w-2xl mx-auto">
            Resultados obtidos em bateria interna automatizada de bancada (roteiro H-01) utilizando exclusivamente dados sintéticos auditáveis, em estrito respeito ao Art. 14 da LGPD.
          </p>
        </div>
      </section>

      {/* Case Grid */}
      <section className="py-16 px-8">
        <div className="max-w-7xl mx-auto flex flex-col gap-16">
          {cases.map((cs, idx) => (
            <div
              key={idx}
              className="glass p-10 lg:p-16 rounded-[48px] border border-white/10 bg-zinc-950/40 grid grid-cols-1 lg:grid-cols-2 gap-14 items-center"
            >
              <div className="flex flex-col gap-6">
                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-black text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-4 py-1.5 rounded-full">
                    {cs.tag}
                  </span>
                </div>
                <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter">
                  {cs.school} — <span className="text-zinc-400">{cs.location}</span>
                </h2>
                <div className="flex flex-col gap-5">
                  <div>
                    <h3 className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-1">
                      Cenário Avaliado em Laboratório
                    </h3>
                    <p className="text-zinc-300 font-medium text-sm leading-relaxed">
                      {cs.challenge}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-emerald-400 uppercase tracking-widest mb-1">
                      Resultado em Testes Internos de Bancada
                    </h3>
                    <div className="flex items-start gap-3 text-lg font-bold tracking-tight text-white">
                      <BarChart className="text-emerald-400 shrink-0 mt-1" size={24} />
                      <span>{cs.result}</span>
                    </div>
                  </div>
                </div>
                <Link
                  href="/contato?assunto=dossie-h01"
                  className="inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300 font-black uppercase tracking-widest text-xs mt-2 no-underline"
                >
                  Solicitar Dossiê Técnico H-01 <ArrowRight size={14} />
                </Link>
              </div>

              <div className="relative glass p-10 rounded-[36px] border border-emerald-500/20 bg-emerald-500/5">
                <Quote className="absolute top-8 right-10 opacity-15 text-emerald-400" size={64} />
                <p className="text-lg md:text-xl font-bold italic text-zinc-100 leading-relaxed mb-6">
                  &ldquo;{cs.quote}&rdquo;
                </p>
                <p className="text-xs font-black text-emerald-400 uppercase tracking-widest">
                  {cs.author}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Trust Metrics Horizontal */}
      <section className="py-20 px-8 border-y border-white/5">
        <div className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-10 text-center">
          <div>
            <div className="text-4xl md:text-5xl font-black mb-2">20/20</div>
            <p className="text-xs text-zinc-400 font-bold uppercase tracking-widest">
              Casos Internos de Bancada H-01
            </p>
          </div>
          <div>
            <div className="text-4xl md:text-5xl font-black mb-2">WAL</div>
            <p className="text-xs text-zinc-400 font-bold uppercase tracking-widest">
              Persistência Transacional SQLite
            </p>
          </div>
          <div>
            <div className="text-4xl md:text-5xl font-black mb-2">SHA-256</div>
            <p className="text-xs text-zinc-400 font-bold uppercase tracking-widest">
              Integridade da Trilha de Auditoria
            </p>
          </div>
          <div>
            <div className="text-4xl md:text-5xl font-black mb-2">On-Premise</div>
            <p className="text-xs text-zinc-400 font-bold uppercase tracking-widest">
              Prontuários &amp; Notas no Servidor Local
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
