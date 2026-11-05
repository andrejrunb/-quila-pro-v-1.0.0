"use client";

import Link from "next/link";
import { Check } from "lucide-react";

export default function Precos() {
  const plans = [
    {
      id: "essencial",
      name: "Sovereign Essential",
      price: "R$ 4,50",
      period: "/aluno/mês (anual)",
      description: "Núcleo operacional local para chamada assistida, diário e frequência.",
      features: [
        "Chamada Assistida com Confirmação Docente",
        "Alertas Preventivos de Infrequência (LDB Art. 12)",
        "Portal Familiar & Justificativas de Ausência",
        "Banco Local SQLite WAL + Rotina de Backup",
      ],
      cta: "Solicitar Piloto Essential",
      href: "/contato?plano=essential",
      highlight: false,
    },
    {
      id: "pro",
      name: "Sovereign Pro",
      price: "R$ 8,90",
      period: "/aluno/mês (anual)",
      description: "Controle operacional completo para Direção, Coordenação e Professores.",
      features: [
        "Tudo no plano Essential",
        "Linha do Tempo Operacional da Coordenação",
        "Provas A4 em 2 Colunas & Leitura Óptica OMR",
        "Notificações Escolares via WhatsApp / Push",
        "Suporte Técnico Prioritário no Piloto H-01",
      ],
      cta: "Agendar Demonstração Pro",
      href: "/contato?plano=pro",
      highlight: true,
    },
    {
      id: "elite",
      name: "Sovereign Elite",
      price: "Sob Consulta",
      period: "",
      description: "Implantação dedicada para redes de ensino e múltiplos campi.",
      features: [
        "Tudo no plano Pro",
        "Topologia Multi-Unidade com Isolamento por Escola",
        "Integração via API com ERP / Secretaria Escolar",
        "Apoio Técnico ao DPO & Elaboração de RIPD/DPIA",
        "Treinamento Presencial de Equipe Docente",
      ],
      cta: "Falar com Consultor",
      href: "/contato?plano=elite",
      highlight: false,
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-black text-white">
      <section className="pt-44 pb-16 px-8 flex flex-col items-center">
        <div className="max-w-4xl text-center">
          <h1 className="text-5xl md:text-6xl font-black uppercase tracking-tighter mb-6 italic">
            Investimento <span className="text-indigo-500 not-italic">Previsível e Transparente</span>.
          </h1>
          <p className="text-zinc-300 text-lg md:text-xl max-w-2xl mx-auto font-medium">
            Dimensionado para escolas a partir de 20 salas (500 alunos), com licenciamento claro e operação local sem custos ocultos de nuvem.
          </p>
        </div>
      </section>

      {/* Pricing Matrix */}
      <section className="py-16 px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`group flex flex-col p-10 md:p-12 rounded-[48px] border ${
                plan.highlight
                  ? "border-indigo-500 bg-indigo-500/5 shadow-[0_0_50px_rgba(79,70,229,0.12)] md:scale-105"
                  : "border-white/10 bg-zinc-950/40"
              } transition-all`}
            >
              <div className="mb-8">
                <h2 className="text-2xl font-black uppercase tracking-tighter mb-2">{plan.name}</h2>
                <p className="text-zinc-300 text-sm">{plan.description}</p>
              </div>

              <div className="mb-10 flex items-baseline gap-2">
                <span className="text-4xl md:text-5xl font-black tracking-tighter">{plan.price}</span>
                {plan.period && (
                  <span className="text-zinc-400 text-xs font-bold uppercase tracking-widest">
                    {plan.period}
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-4 mb-12">
                {plan.features.map((feat, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 text-xs font-bold text-zinc-200 group-hover:text-white transition-colors"
                  >
                    <Check size={16} className="text-indigo-400 shrink-0" />
                    {feat}
                  </div>
                ))}
              </div>

              <Link
                href={plan.href}
                className={`mt-auto w-full py-5 rounded-full font-black uppercase tracking-widest text-xs text-center no-underline transition-all ${
                  plan.highlight
                    ? "bg-indigo-600 text-white hover:bg-indigo-500 shadow-xl shadow-indigo-500/20"
                    : "bg-white text-black hover:bg-zinc-200"
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-24 px-8 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-black uppercase tracking-tighter text-center mb-16 italic">
            Dúvidas <span className="text-indigo-500 not-italic">Frequentes</span>
          </h2>
          <div className="flex flex-col gap-6">
            <div className="glass p-8 md:p-10 rounded-[32px] border border-white/10">
              <h3 className="text-lg font-black text-white mb-2 uppercase tracking-tighter">
                O Áquila Pro substitui o ERP contábil/fiscal atual da escola?
              </h3>
              <p className="text-zinc-300 text-sm leading-relaxed font-medium">
                Não. O Áquila Pro atua como o sistema operacional pedagógico e de presença diária da escola, exportando relatórios padronizados (CSV/JSON) para integração com o sistema de secretaria ou contabilidade já utilizado pela instituição.
              </p>
            </div>
            <div className="glass p-8 md:p-10 rounded-[32px] border border-white/10">
              <h3 className="text-lg font-black text-white mb-2 uppercase tracking-tighter">
                Qual a infraestrutura mínima para o piloto H-01 (20 salas / 500 alunos)?
              </h3>
              <p className="text-zinc-300 text-sm leading-relaxed font-medium">
                Um servidor local Windows 10/11 Pro (ou estação dedicada na secretaria/TI) conectado à rede local (LAN) da escola. A chamada assistida, o diário docente e a coordenação operam mesmo sem conexão externa à internet.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
