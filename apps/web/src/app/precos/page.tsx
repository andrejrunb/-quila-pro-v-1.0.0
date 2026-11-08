"use client";

import Link from "next/link";
import { Check } from "lucide-react";

export default function Precos() {
  const plans = [
    {
      id: "essencial",
      name: "Sovereign Essential",
      price: "Sob Consulta",
      period: "Dimensionado por Porte Escolar",
      description: "Núcleo operacional local para chamada assistida, diário e frequência.",
      features: [
        "Chamada Assistida com Confirmação Docente (CNE 15/2026)",
        "Alertas Preventivos de Infrequência (LDB Art. 12, VIII, 'a')",
        "Portal Familiar, Justificativas & Roteiros Semanais",
        "Banco Local SQLite WAL + Recuperação Transacional",
      ],
      cta: "Solicitar Proposta Essential",
      href: "/contato?plano=essential",
      highlight: false,
    },
    {
      id: "pro",
      name: "Sovereign Pro",
      price: "Sob Consulta",
      period: "Recomendado • Piloto H-01",
      description: "Controle operacional completo para Direção, Coordenação e Professores.",
      features: [
        "Tudo no plano Essential",
        "Linha do Tempo Operacional da Coordenação & Solver de Grade Horária",
        "Provas A4 em 2 Colunas, Banco TRI 3PL & Leitura Óptica OMR Híbrida",
        "Jogos Interativos Estilo Wordwall (8 Modos) & Câmara Aureus",
        "Conectores Opcionais: WhatsApp Oficial (Meta API) & QR Code PIX / Stripe",
      ],
      cta: "Agendar Demonstração Pro",
      href: "/contato?plano=pro",
      highlight: true,
    },
    {
      id: "elite",
      name: "Sovereign Elite",
      price: "Sob Consulta",
      period: "Redes & Grupos de Ensino",
      description: "Implantação dedicada para redes de ensino e múltiplos campi.",
      features: [
        "Tudo no plano Pro",
        "Topologia Multi-Unidade com Isolamento por Escola",
        "Exportação Contábil RPA (Domínio / SigaWeb) & API Secretaria",
        "Apoio Técnico ao DPO & Elaboração de RIPD/DPIA (ANPD 2026)",
        "Treinamento Presencial de Equipe Docente & Coordenação",
      ],
      cta: "Falar com Especialista",
      href: "/contato?plano=elite",
      highlight: false,
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-black text-white">
      <section className="pt-44 pb-16 px-8 flex flex-col items-center">
        <div className="max-w-4xl text-center">
          <h1 className="text-5xl md:text-6xl font-black uppercase tracking-tighter mb-6 italic">
            Licenciamento <span className="text-indigo-500 not-italic">Consultivo e Transparente</span>.
          </h1>
          <p className="text-zinc-300 text-lg md:text-xl max-w-2xl mx-auto font-medium">
            Dimensionado conforme o número de alunos, turnos e módulos contratados (a partir de 20 salas / 500 alunos), com separação clara entre operação local e conectores de nuvem opcionais.
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

              <div className="mb-10 flex flex-col gap-1">
                <span className="text-3xl md:text-4xl font-black tracking-tighter">{plan.price}</span>
                {plan.period && (
                  <span className="text-indigo-400 text-xs font-bold uppercase tracking-widest">
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
                Quais dados ficam no servidor local da escola e quais passam pela nuvem (Stripe / WhatsApp)?
              </h3>
              <p className="text-zinc-300 text-sm leading-relaxed font-medium">
                Todos os prontuários pedagógicos, notas, frequência diária, planos PEI/AEE e registros disciplinares ficam 100% no banco SQLite local (WAL) dentro da escola. Caso a instituição opte por ativar o módulo financeiro via Stripe Connect ou avisos via WhatsApp Oficial (Meta Cloud API), trafegam pela nuvem exclusivamente os metadados estritos de cobrança/pagamento do responsável financeiro ou o texto do comunicado autorizado.
              </p>
            </div>
            <div className="glass p-8 md:p-10 rounded-[32px] border border-white/10">
              <h3 className="text-lg font-black text-white mb-2 uppercase tracking-tighter">
                O Áquila Pro substitui o ERP contábil/fiscal atual da escola?
              </h3>
              <p className="text-zinc-300 text-sm leading-relaxed font-medium">
                Não. O Áquila Pro atua como o sistema operacional pedagógico e de presença diária da escola, exportando arquivos posicionais e relatórios padronizados (incluindo layout pipe `|` para Thomson Reuters Domínio / SigaWeb, CSV e JSON) para integração com o sistema de secretaria ou contabilidade já utilizado pela instituição.
              </p>
            </div>
            <div className="glass p-8 md:p-10 rounded-[32px] border border-white/10">
              <h3 className="text-lg font-black text-white mb-2 uppercase tracking-tighter">
                Qual a infraestrutura mínima para o piloto H-01 (20 salas / 500 alunos)?
              </h3>
              <p className="text-zinc-300 text-sm leading-relaxed font-medium">
                Um servidor local Windows 10/11 Pro (ou estação dedicada na secretaria/TI) conectado à rede local (LAN) da escola. A chamada assistida, o diário docente, os jogos interativos e a coordenação operam na rede local mesmo sem conexão externa à internet.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
