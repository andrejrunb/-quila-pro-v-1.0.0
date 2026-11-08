"use client";

import Link from "next/link";
import { CheckCircle2, ArrowRight, Users, Calendar, Landmark } from "lucide-react";

export default function Solucoes() {
  const personas = [
    {
      id: "direcao",
      name: "Para Direção & Mantenedores",
      pain: "Falta de visibilidade consolidada sobre infrequência e risco jurídico no tratamento de dados de menores.",
      solution: "Governança Local, Indicadores de Retenção e Conformidade LGPD / ANPD 2026.",
      icon: <Landmark className="text-indigo-400" size={40} />,
      bullets: [
        "Painel consolidado de frequência e busca ativa (LDB Art. 12, VIII, 'a' — Lei 15.231/2025)",
        "Prontuários e notas mantidos no servidor local (SQLite WAL) com auditoria SHA-256",
        "Padrão não-biométrico de fábrica (Crachá QR / Chamada) alinhado ao Caso Paraná da ANPD",
      ],
      benefit: "Decisões baseadas em evidências operacionais auditáveis.",
      href: "/contato?perfil=direcao",
    },
    {
      id: "coordenacao",
      name: "Para Coordenação Pedagógica",
      pain: "Informações espalhadas entre planilhas, cadernos de chamada e recados de portaria.",
      solution: "Linha do Tempo Operacional do Estudante & Solver de Grade Horária.",
      icon: <Calendar className="text-emerald-400" size={40} />,
      bullets: [
        "Encadeamento automático: Presença → Atraso → Ocorrência → Justificativa → Ação",
        "Solver híbrido SA+GLS de grade horária sem conflitos de sala ou janela docente",
        "Kit de andaimes inclusivos PEI/AEE (DOK 1 a DOK 4) e bloqueio HITL (CNE 15/2026)",
      ],
      benefit: "Menos consolidação manual de planilhas, mais acompanhamento ativo.",
      href: "/contato?perfil=coordenacao",
    },
    {
      id: "familias",
      name: "Para Professores, Alunos & Famílias",
      pain: "Burocracia no preenchimento de diários e demora na comunicação com os responsáveis.",
      solution: "Diário Docente Ágil, Jogos Estilo Wordwall e Canal Familiar Transparente.",
      icon: <Users className="text-amber-400" size={40} />,
      bullets: [
        "Chamada rápida com mapa de sala (6×5) e correção óptica OMR híbrida",
        "8 modalidades de jogos interativos estilo Wordwall e moeda de mérito Aureus (ECA Digital)",
        "Roteiros semanais 'Conversas para o Jantar' (6º EF à 3ª EM) sem jargão acadêmico",
      ],
      benefit: "Comunicação estruturada e segura entre sala de aula e família.",
      href: "/contato?perfil=familia-docente",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-black text-white">
      <section className="pt-44 pb-16 px-8 flex flex-col items-center">
        <div className="max-w-4xl text-center">
          <h2 className="text-xs font-black uppercase tracking-[0.4em] text-indigo-400 mb-6">
            Soluções por Perfil Institucional
          </h2>
          <h1 className="text-5xl md:text-6xl font-black uppercase tracking-tighter mb-6 leading-tight">
            Fluxos desenhados para a{" "}
            <span className="italic text-indigo-400">rotina real da escola</span>.
          </h1>
          <p className="text-zinc-300 text-lg md:text-xl max-w-2xl mx-auto">
            Cada perfil acessa exclusivamente as ferramentas e dados pertinentes à sua função, com controle de acesso rigoroso (RBAC).
          </p>
        </div>
      </section>

      {/* Persona Cards Grid */}
      <section className="py-16 px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10">
          {personas.map((persona) => (
            <div
              key={persona.id}
              className="group glass p-10 rounded-[48px] border border-white/10 hover:border-indigo-500/40 transition-all flex flex-col gap-6 bg-zinc-950/40"
            >
              <div className="w-20 h-20 rounded-[28px] bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
                {persona.icon}
              </div>
              <div>
                <h2 className="text-2xl font-black uppercase tracking-tighter mb-2">
                  {persona.name}
                </h2>
                <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest">
                  {persona.solution}
                </p>
              </div>
              <p className="text-zinc-300 text-sm leading-relaxed italic border-l-2 border-indigo-500/40 pl-4">
                &ldquo;{persona.pain}&rdquo;
              </p>
              <div className="flex flex-col gap-3 py-2">
                {persona.bullets.map((bullet, i) => (
                  <div key={i} className="flex items-center gap-3 text-xs font-bold text-zinc-200">
                    <CheckCircle2 size={16} className="text-indigo-400 shrink-0" />
                    {bullet}
                  </div>
                ))}
              </div>
              <div className="mt-auto pt-6 border-t border-white/10">
                <div className="text-sm font-black text-white mb-4 uppercase tracking-tighter">
                  {persona.benefit}
                </div>
                <Link
                  href={persona.href}
                  className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 font-bold uppercase tracking-widest text-xs no-underline"
                >
                  Solicitar Roteiro deste Perfil <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-20 px-8 bg-indigo-600/5 mt-12 border-t border-indigo-500/10">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter">
            Deseja avaliar o fluxo completo com sua equipe?
          </h2>
          <Link
            href="/contato"
            className="bg-white text-black px-10 py-5 rounded-full font-black uppercase tracking-widest text-xs hover:bg-zinc-200 transition-all no-underline"
          >
            Agendar Conversa Consultiva
          </Link>
        </div>
      </section>
    </div>
  );
}
