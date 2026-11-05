"use client";

import Link from "next/link";
import { Zap, CheckCircle2, ArrowRight, Camera, Clock, Lock } from "lucide-react";

export default function Produto() {
  const modules = [
    {
      id: "presenca",
      name: "Presença Assistida & Linha do Tempo",
      tag: "Núcleo do Piloto H-01",
      icon: <Clock className="text-emerald-400" size={32} />,
      description:
        "Sincronize a grade horária com o registro de presença em sala de aula. Cada falta, atraso ou saída antecipada alimenta automaticamente a linha do tempo operacional do estudante.",
      features: [
        "Chamada rápida com revisão e confirmação humana pelo professor",
        "Encadeamento automático: Presença → Atraso → Ocorrência → Justificativa → Ação",
        "Mapa visual de sala de aula (6×5) com indicadores de atenção pedagógica",
      ],
      href: "/contato?modulo=presenca",
      color: "border-emerald-500/20 bg-emerald-500/5",
    },
    {
      id: "cortex",
      name: "Estúdio Docente & Avaliações OMR",
      tag: "Produtividade em Sala",
      icon: <Zap className="text-amber-400" size={32} />,
      description:
        "Diário de classe integrado ao gerador de avaliações impressas em 2 colunas (padrão INEP/ENEM) e leitura óptica de cartões-resposta (OMR).",
      features: [
        "Lançamento ágil de notas por bimestre e cálculo imediato de médias",
        "Correção óptica OMR de gabaritos com auditoria de confiança por questão",
        "Atribuição rastreável de materiais de revisão entre séries pelo professor",
      ],
      href: "/contato?modulo=docente",
      color: "border-amber-500/20 bg-amber-500/5",
    },
    {
      id: "governanca",
      name: "LGPD & Governança Soberana Local",
      tag: "Privacy-by-Design (Art. 14 e 16)",
      icon: <Lock className="text-indigo-400" size={32} />,
      description:
        "Arquitetura desenhada para proteger dados de crianças e adolescentes com banco local SQLite (WAL), criptografia em repouso e trilha de auditoria verificável.",
      features: [
        "Matriz de consentimento explícito de responsáveis legais (LGPD Art. 14)",
        "Rotina formal de expurgo de dados com hash de evidência SHA-256 (LGPD Art. 16)",
        "Isolamento estrito de escopo curricular por estudante, turma e série",
      ],
      href: "/seguranca-lgpd",
      color: "border-indigo-500/20 bg-indigo-500/5",
    },
    {
      id: "seguranca",
      name: "Perímetro & Visão Computacional de Borda",
      tag: "Módulo Opt-In Controlado",
      icon: <Camera className="text-cyan-400" size={32} />,
      description:
        "Processamento em borda local sob estrita quarentena e controle institucional, sem envio de vídeos ou imagens brutas de alunos para nuvens externas.",
      features: [
        "Alternativa não-biométrica obrigatória (crachá/RFID/chamada nominal) sem distinção",
        "Vetores 512-D cifrados em repouso (AES-256-GCM / DPAPI) quando habilitado",
        "Auto-throttling térmico de hardware para operação contínua em servidor local",
      ],
      href: "/seguranca-lgpd#governanca",
      color: "border-cyan-500/20 bg-cyan-500/5",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-black text-white">
      <section className="pt-44 pb-16 px-8 flex flex-col items-center">
        <div className="max-w-4xl text-center">
          <h1 className="text-5xl md:text-6xl font-black uppercase tracking-tighter mb-6">
            Arquitetura do <span className="text-indigo-500">School OS</span>
          </h1>
          <p className="text-zinc-300 text-lg md:text-xl font-medium leading-relaxed">
            Conheça os módulos do núcleo operacional H-01 e os controles de privacidade que mantêm a instituição no comando dos seus dados.
          </p>
        </div>
      </section>

      {/* Modules Grid */}
      <section className="py-16 px-8">
        <div className="max-w-7xl mx-auto flex flex-col gap-24">
          {modules.map((mod, idx) => (
            <div
              key={mod.id}
              className={`grid grid-cols-1 lg:grid-cols-2 gap-16 items-center ${
                idx % 2 === 1 ? "lg:flex-row-reverse" : ""
              }`}
            >
              <div className="flex flex-col gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-3xl flex items-center justify-center bg-white/5">
                    {mod.icon}
                  </div>
                  <span className="text-xs font-black uppercase tracking-[0.25em] text-zinc-300">
                    {mod.tag}
                  </span>
                </div>
                <h2 className="text-4xl md:text-5xl font-black tracking-tighter uppercase leading-tight">
                  {mod.name}
                </h2>
                <p className="text-zinc-300 text-base md:text-lg leading-relaxed">
                  {mod.description}
                </p>
                <div className="flex flex-col gap-3">
                  {mod.features.map((feat, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm font-bold text-zinc-200">
                      <CheckCircle2 size={18} className="text-indigo-400 shrink-0" />
                      {feat}
                    </div>
                  ))}
                </div>
                <Link
                  href={mod.href}
                  className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 font-black uppercase tracking-widest text-xs mt-2 no-underline"
                >
                  Especificação Técnica &amp; Roteiro <ArrowRight size={14} />
                </Link>
              </div>

              <div
                className={`aspect-video rounded-[40px] border ${mod.color} overflow-hidden flex flex-col items-center justify-center p-8 glass text-center`}
              >
                <div className="text-zinc-300 font-black text-xl uppercase tracking-tighter mb-2">
                  Módulo • {mod.name}
                </div>
                <p className="text-xs text-zinc-400 max-w-sm">
                  Operação local integrada ao banco SQLite (WAL) com controle de acesso por perfil (RBAC).
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-8 border-t border-white/5 bg-zinc-950/40 mt-12">
        <div className="max-w-5xl mx-auto glass p-12 md:p-16 rounded-[48px] border border-indigo-500/20 flex flex-col items-center text-center gap-8 bg-indigo-500/5">
          <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter">
            Pronto para homologar o piloto na sua escola?
          </h2>
          <div className="flex flex-wrap justify-center gap-6">
            <Link
              href="/contato"
              className="bg-white text-black px-10 py-5 rounded-full font-black uppercase tracking-widest text-xs hover:bg-zinc-200 transition-all shadow-2xl no-underline"
            >
              Agendar Demonstração Local
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
