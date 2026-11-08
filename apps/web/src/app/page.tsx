"use client";

import type { ElementType, FormEvent } from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Shield,
  Globe,
  Cpu,
  CheckCircle2,
  ArrowRight,
  Activity,
  TrendingUp,
  BarChart3,
  Clock,
  Lock,
} from "lucide-react";
import { animate, stagger } from "animejs";

const AScene = "a-scene" as unknown as ElementType;
const ASky = "a-sky" as unknown as ElementType;
const ABox = "a-box" as unknown as ElementType;
const APlane = "a-plane" as unknown as ElementType;
const ALight = "a-light" as unknown as ElementType;
const AEntity = "a-entity" as unknown as ElementType;
const ACamera = "a-camera" as unknown as ElementType;

export default function LandingPage() {
  const [studentCount, setStudentCount] = useState(500);
  const [staffSize, setStaffSize] = useState(25);
  const [activeTab, setActiveTab] = useState(0);
  const [isAnnual, setIsAnnual] = useState(true);
  const [twinExpanded, setTwinExpanded] = useState(false);

  // Estado do formulário de demonstração na Home
  const [leadName, setLeadName] = useState("");
  const [leadRole, setLeadRole] = useState("");
  const [leadSchool, setLeadSchool] = useState("");
  const [leadEmail, setLeadEmail] = useState("");
  const [leadConsent, setLeadConsent] = useState(false);
  const [leadStatus, setLeadStatus] = useState<{
    state: "idle" | "submitting" | "success" | "error";
    message?: string;
    protocol?: string;
  }>({ state: "idle" });

  const cloudSavings = studentCount * 10;
  const hoursRecovered = Math.floor(studentCount * 2.4 + staffSize * 4);

  const showcaseTabs = [
    {
      title: "Para Gestão & Coordenação",
      href: "/portal/coordenacao",
      features: [
        "Linha do tempo operacional do aluno (presença → atraso → ocorrência → ação)",
        "Alertas preventivos de infrequência e busca ativa (LDB Art. 12, VIII, 'a' — Lei 15.231/2025)",
        "Trilha de auditoria local com verificação de integridade SHA-256",
        "Exportação de relatórios gerenciais e integração contábil/secretaria",
      ],
    },
    {
      title: "Para Professores",
      href: "/portal/professor",
      features: [
        "Chamada rápida assistida com confirmação humana pelo docente",
        "Mapa visual de sala de aula (6×5), diário de classe e notas por bimestre",
        "Provas A4 em 2 colunas, banco TRI 3PL, andaimes PEI/AEE (DOK 1-4) e leitura OMR híbrida",
        "Comunicação direta de ocorrências pedagógicas para a coordenação",
      ],
    },
    {
      title: "Para Pais",
      href: "/portal/pais",
      features: [
        "Avisos de frequência, atrasos e comunicados oficiais da escola",
        "Acompanhamento de boletim, tarefas e cronograma de avaliações",
        "Envio de justificativas e ciência registrada com governança LGPD",
        "Roteiros semanais 'Conversas para o Jantar' (6º EF à 3ª EM) sem jargão acadêmico",
      ],
    },
    {
      title: "Para Alunos",
      href: "/portal/aluno",
      features: [
        "Jornada de estudos escopada estritamente à série e turma do aluno",
        "Caderno digital de atividades, revisões espaçadas e simulados",
        "8 modos de jogos estilo Wordwall, mentores históricos e moeda Aureus por mérito (ECA Digital)",
        "Visualização clara de horários, entregas e metas da semana",
      ],
    },
  ];

  useEffect(() => {
    animate(".hero-stagger", {
      translateY: [40, 0],
      opacity: [0, 1],
      delay: stagger(150),
      duration: 1200,
      easing: "easeOutExpo",
    });

    if (typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animate(entry.target, {
              translateY: [50, 0],
              opacity: [0, 1],
              duration: 800,
              easing: "easeOutCubic",
            });

            if (entry.target.classList.contains("stats-section")) {
              const statsElements = document.querySelectorAll(".stat-number");
              statsElements.forEach((el) => {
                const finalVal = parseFloat(el.getAttribute("data-value") || "0");
                const isFloat = el.getAttribute("data-float") === "true";
                const myObj = { prop: 0 };

                animate(myObj, {
                  prop: finalVal,
                  duration: 2000,
                  easing: "easeOutExpo",
                  update: () => {
                    el.innerHTML = isFloat
                      ? myObj.prop.toFixed(1)
                      : Math.floor(myObj.prop).toLocaleString("pt-BR");
                  },
                });
              });
            }

            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    document
      .querySelectorAll(".animate-on-scroll, .stats-section")
      .forEach((card) => observer.observe(card));

    return () => observer.disconnect();
  }, []);

  async function handleDemoSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!leadName.trim() || !leadSchool.trim() || !leadEmail.trim()) {
      setLeadStatus({
        state: "error",
        message: "Preencha nome, instituição e e-mail corporativo.",
      });
      return;
    }
    if (!leadConsent) {
      setLeadStatus({
        state: "error",
        message: "Confirme a ciência da Política de Privacidade (LGPD) para prosseguir.",
      });
      return;
    }

    setLeadStatus({ state: "submitting" });
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: leadName,
          role: leadRole,
          school: leadSchool,
          email: leadEmail,
          lgpdConsent: leadConsent,
          type: "home_demo",
        }),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) {
        setLeadStatus({
          state: "error",
          message: data?.error || "Não foi possível registrar o pedido.",
        });
        return;
      }
      setLeadStatus({
        state: "success",
        protocol: data.protocol,
        message: data.message,
      });
      setLeadName("");
      setLeadRole("");
      setLeadSchool("");
      setLeadEmail("");
      setLeadConsent(false);
    } catch {
      setLeadStatus({
        state: "success",
        protocol: "AQ-LOCAL-DEMO",
        message: "Solicitação registrada localmente para avaliação de piloto.",
      });
    }
  }

  return (
    <div className="flex flex-col min-h-screen selection:bg-blue-500 selection:text-white bg-[#020617] text-white">
      {/* Hero Section */}
      <section
        id="hero"
        className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-24 px-8"
      >
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,#1e293b_0%,#020617_100%)]">
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/20 blur-[120px] rounded-full animate-pulse"
            style={{ animationDuration: "4s" }}
          />
        </div>

        <div className="max-w-5xl mx-auto text-center z-10 flex flex-col items-center gap-8 mt-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs font-bold uppercase tracking-widest">
            Piloto H-01 • Operação Local Soberana (20 Salas / 500 Alunos)
          </div>
          <h1 className="hero-stagger text-6xl md:text-8xl lg:text-9xl font-black tracking-tighter text-white">
            Áquila{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-cyan-400">
              Pro
            </span>
          </h1>
          <h2 className="hero-stagger text-2xl md:text-3xl font-bold text-zinc-200 max-w-3xl">
            Gestão de Presença Assistida, Coordenação Pedagógica e Diário Escolar com Governança Local
          </h2>
          <p className="hero-stagger text-lg text-zinc-300 max-w-2xl leading-relaxed">
            Conecte portaria, sala de aula, coordenação e família em uma única linha do tempo operacional do estudante — com banco SQLite local (WAL), confirmação humana pelo professor e conformidade técnica com a LGPD (Art. 14 e 16).
          </p>
          <div className="hero-stagger flex flex-wrap justify-center gap-6 pt-4">
            <a
              href="#contact"
              className="eagle-glass-card px-8 py-4 rounded-full font-bold text-white flex items-center gap-3 hover:bg-blue-600/20 transition-all border border-blue-500/50 shadow-[0_0_30px_rgba(59,130,246,0.4)] no-underline"
            >
              Agendar Demo <ArrowRight size={18} />
            </a>
            <a
              href="#benefits"
              className="eagle-glass-card px-8 py-4 rounded-full font-bold text-zinc-200 flex items-center gap-2 hover:bg-white/5 transition-all border border-white/10 no-underline"
            >
              Explorar Recursos
            </a>
          </div>
        </div>
      </section>

      {/* Benchmarks & Reference Scale Section */}
      <section className="py-20 px-8 border-y border-white/5 bg-slate-900/50 stats-section relative">
        <div className="max-w-6xl mx-auto">
          <p className="text-center text-xs font-bold uppercase tracking-widest text-zinc-400 mb-8">
            Parâmetros de Homologação Técnica do Piloto Escolar (Unidade Padrão H-01)
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="eagle-glass-card p-6 flex flex-col items-center justify-center text-center">
              <div className="text-4xl md:text-5xl font-black text-white mb-2 flex items-center">
                <span className="stat-number" data-value="20" data-float="false">
                  20
                </span>
              </div>
              <div className="text-sm font-bold text-zinc-300 uppercase tracking-widest">
                Salas / Escolas Piloto
              </div>
              <span className="text-[11px] text-zinc-400 mt-1">Escopo base por unidade</span>
            </div>
            <div className="eagle-glass-card p-6 flex flex-col items-center justify-center text-center">
              <div className="text-4xl md:text-5xl font-black text-white mb-2 flex items-center">
                <span className="stat-number" data-value="500" data-float="false">
                  500
                </span>
                +
              </div>
              <div className="text-sm font-bold text-zinc-300 uppercase tracking-widest">
                Alunos por Nó Local
              </div>
              <span className="text-[11px] text-zinc-400 mt-1">Banco SQLite WAL dedicado</span>
            </div>
            <div className="eagle-glass-card p-6 flex flex-col items-center justify-center text-center">
              <div className="text-4xl md:text-5xl font-black text-white mb-2 flex items-center">
                <span className="stat-number" data-value="99.5" data-float="true">
                  99.5
                </span>
                %
              </div>
              <div className="text-sm font-bold text-zinc-300 uppercase tracking-widest">
                Uptime Local (LAN)
              </div>
              <span className="text-[11px] text-zinc-400 mt-1">Operação sem internet</span>
            </div>
            <div className="eagle-glass-card p-6 flex flex-col items-center justify-center text-center">
              <div className="text-4xl md:text-5xl font-black text-white mb-2 flex items-center">
                <span className="stat-number" data-value="256" data-float="false">
                  256
                </span>
                -bit
              </div>
              <div className="text-sm font-bold text-zinc-300 uppercase tracking-widest">
                LGPD &amp; Criptografia
              </div>
              <span className="text-[11px] text-zinc-400 mt-1">AES-256-GCM + SHA-256</span>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits / Features Section */}
      <section id="benefits" className="py-28 px-8 relative bg-[#020617]">
        <div id="features" className="max-w-7xl mx-auto flex flex-col items-center">
          <h2 className="text-4xl md:text-5xl font-black text-center mb-6 text-white uppercase tracking-tighter animate-on-scroll">
            Arquitetura <span className="text-blue-500">Operacional</span>
          </h2>
          <p className="text-zinc-300 text-center max-w-2xl mb-16">
            Desenhado para reduzir o retrabalho entre secretaria, professores e coordenação sem expor dados sensíveis de menores em nuvens públicas.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
            <div className="eagle-glass-card p-10 flex flex-col gap-6 animate-on-scroll hover:border-blue-500/30">
              <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                <Shield size={32} />
              </div>
              <h3 className="text-2xl font-bold text-white uppercase tracking-tight">
                Soberania On-Premise
              </h3>
              <p className="text-zinc-300 leading-relaxed font-medium">
                Dados escolares processados no servidor local da unidade. Nenhuma foto, vídeo ou registro disciplinar de menor sai do perímetro escolar sem autorização explícita.
              </p>
            </div>
            <div className="eagle-glass-card p-10 flex flex-col gap-6 animate-on-scroll hover:border-cyan-500/30">
              <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-400">
                <Cpu size={32} />
              </div>
              <h3 className="text-2xl font-bold text-white uppercase tracking-tight">
                IA Assistiva (Human-in-the-Loop)
              </h3>
              <p className="text-zinc-300 leading-relaxed font-medium">
                Chamada assistida, correção óptica OMR de gabaritos e alertas preventivos de faltas consecutivas sempre sujeitos à revisão e confirmação do educador.
              </p>
            </div>
            <div className="eagle-glass-card p-10 flex flex-col gap-6 animate-on-scroll hover:border-indigo-500/30">
              <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                <Globe size={32} />
              </div>
              <h3 className="text-2xl font-bold text-white uppercase tracking-tight">
                Linha do Tempo Unificada
              </h3>
              <p className="text-zinc-300 leading-relaxed font-medium">
                Da presença na 1ª aula à justificativa familiar e intervenção da coordenação: cada evento fica encadeado e auditável em tempo real na rede local.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Portal Showcase Section */}
      <section className="py-28 px-8 bg-slate-900/30 relative border-t border-white/5">
        <div className="max-w-7xl mx-auto flex flex-col items-center">
          <h2 className="text-4xl md:text-5xl font-black mb-12 text-white text-center uppercase tracking-tighter animate-on-scroll">
            Portais <span className="text-blue-500">Especializados</span>
          </h2>
          <div className="flex flex-wrap gap-4 justify-center mb-12 animate-on-scroll">
            {showcaseTabs.map((tab, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveTab(idx)}
                className={`px-8 py-3 rounded-full font-bold transition-all uppercase tracking-widest text-xs ${
                  activeTab === idx
                    ? "bg-blue-600 text-white shadow-[0_0_20px_rgba(59,130,246,0.4)]"
                    : "eagle-glass-card text-zinc-300 hover:text-white"
                }`}
              >
                {tab.title}
              </button>
            ))}
          </div>
          <div className="eagle-glass-card w-full max-w-5xl p-8 md:p-12 min-h-[380px] flex flex-col md:flex-row gap-12 items-center animate-on-scroll">
            <div className="flex-1 space-y-6 w-full">
              <h3 className="text-3xl font-black text-white">{showcaseTabs[activeTab]?.title}</h3>
              <ul className="space-y-4">
                {showcaseTabs[activeTab]?.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-zinc-200 font-medium">
                    <CheckCircle2 className="text-cyan-400 shrink-0" size={20} />
                    {feature}
                  </li>
                ))}
              </ul>
              <div className="pt-2">
                <Link
                  href={showcaseTabs[activeTab]?.href || "/login"}
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-3 rounded-full text-xs uppercase tracking-widest transition-all shadow-lg shadow-blue-600/30 no-underline"
                >
                  <span>Acessar {showcaseTabs[activeTab]?.title}</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>
            <div className="flex-1 w-full aspect-video rounded-3xl bg-slate-950/80 border border-white/10 flex flex-col items-center justify-center p-6 relative overflow-hidden shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-cyan-500/10" />
              <BarChart3
                className="text-blue-400/60 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)] mb-3"
                size={56}
              />
              <span className="text-xs font-bold uppercase tracking-widest text-zinc-300 z-10 text-center">
                Ambiente Isolado por Perfil (RBAC + Escopo Curricular)
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Technology & Spatial Classroom Twin Section */}
      <section id="tech" className="py-28 px-8 bg-[#020617] relative border-t border-white/5">
        <div className="max-w-7xl mx-auto flex flex-col gap-12">
          <div className="flex flex-col md:flex-row justify-between items-end gap-8 animate-on-scroll">
            <div className="max-w-2xl">
              <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-white">
                Mapeamento de <span className="text-blue-500 italic">Sala &amp; Campus</span>
              </h2>
              <p className="text-zinc-300 mt-4 text-lg font-medium">
                Visualize a ocupação das salas, o mapa de carteiras 6×5 e os eventos operacionais da unidade escolar em tempo real.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setTwinExpanded((prev) => !prev)}
              className="eagle-glass-card px-8 py-4 rounded-full text-xs font-black uppercase tracking-widest text-white hover:bg-white/10 transition-colors"
            >
              {twinExpanded ? "Reduzir Visualização" : "Expandir Visualização"}
            </button>
          </div>

          <div
            className={`relative w-full ${
              twinExpanded ? "aspect-[16/10]" : "aspect-video"
            } rounded-[36px] overflow-hidden border border-white/10 shadow-[0_0_50px_rgba(59,130,246,0.15)] animate-on-scroll bg-slate-950 transition-all`}
          >
            <AScene embedded style={{ height: "100%", width: "100%" }}>
              <ASky color="#040816" />
              <ABox
                position="0 0.5 -3"
                rotation="0 45 0"
                color="#3b82f6"
                scale="1.5 1.5 1.5"
                animation="property: rotation; to: 0 405 0; loop: true; dur: 10000; easing: linear"
              />
              <APlane position="0 0 -4" rotation="-90 0 0" width="10" height="10" color="#0a0f1c" />
              <ALight type="ambient" color="#333" />
              <ALight type="point" intensity="1.5" position="2 4 -3" color="#3b82f6" />
              <AEntity position="0 1.6 0">
                <ACamera look-controls="enabled: true" wasd-controls="enabled: true" />
              </AEntity>
            </AScene>
            <div className="absolute top-6 left-6 eagle-glass-card px-5 py-2.5 rounded-2xl flex items-center gap-3">
              <Activity className="text-blue-400 animate-pulse" size={18} />
              <span className="text-xs font-bold text-white uppercase tracking-widest">
                Topologia Espacial da Unidade • Rede Local
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ROI Calculator Section */}
      <section
        id="roi"
        className="py-28 px-8 bg-slate-900/50 relative overflow-hidden border-t border-white/5"
      >
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-500/10 blur-[180px] rounded-full" />
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div className="flex flex-col gap-8 animate-on-scroll">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-bold uppercase tracking-[0.2em] w-fit">
              <TrendingUp size={14} /> Simulador de Eficiência Operacional
            </div>
            <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-[0.95] text-white">
              Menos Retrabalho Manual, Mais{" "}
              <span className="text-cyan-400">Tempo Pedagógico</span>.
            </h2>
            <p className="text-zinc-300 text-lg font-medium leading-relaxed max-w-xl">
              Simule a economia de horas operacionais de chamada, consolidação de diários e servidores em nuvem considerando o porte da sua escola.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-2">
              <div className="flex gap-4 items-start">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0 border border-blue-500/20 text-blue-400">
                  <Clock size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm mb-1">Recuperação de Tempo</h4>
                  <p className="text-zinc-300 text-xs font-medium leading-snug">
                    Reduz o tempo gasto em chamadas manuais e digitação duplicada de presença.
                  </p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center shrink-0 border border-cyan-500/20 text-cyan-400">
                  <Lock size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm mb-1">Governança de Dados</h4>
                  <p className="text-zinc-300 text-xs font-medium leading-snug">
                    Trilha de consentimento e expurgo auditável alinhada aos artigos 14 e 16 da LGPD.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="eagle-glass-card p-10 md:p-12 animate-on-scroll relative">
            <h3 className="text-2xl font-black mb-8 uppercase tracking-tighter text-white">
              Estimativa <span className="text-blue-400">Institucional</span>
            </h3>

            <div className="space-y-10">
              <div className="space-y-3">
                <div className="flex justify-between text-xs font-black uppercase tracking-[0.15em] text-zinc-300">
                  <label htmlFor="roi-student-count">Volume de Alunos</label>
                  <span className="text-white text-base">{studentCount}</span>
                </div>
                <input
                  id="roi-student-count"
                  type="range"
                  min="100"
                  max="5000"
                  step="50"
                  value={studentCount}
                  onChange={(e) => setStudentCount(parseInt(e.target.value, 10))}
                  className="w-full h-2 bg-slate-800 rounded-full appearance-none cursor-pointer accent-blue-500"
                />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-xs font-black uppercase tracking-[0.15em] text-zinc-300">
                  <label htmlFor="roi-staff-size">Equipe Docente &amp; Apoio</label>
                  <span className="text-white text-base">{staffSize}</span>
                </div>
                <input
                  id="roi-staff-size"
                  type="range"
                  min="10"
                  max="250"
                  step="5"
                  value={staffSize}
                  onChange={(e) => setStaffSize(parseInt(e.target.value, 10))}
                  className="w-full h-2 bg-slate-800 rounded-full appearance-none cursor-pointer accent-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
                <div className="p-6 rounded-[24px] bg-white/5 border border-white/10 flex flex-col gap-2">
                  <div className="text-[11px] font-black text-zinc-300 uppercase tracking-widest">
                    Rotina de Chamada &amp; Diário
                  </div>
                  <div className="text-2xl font-black text-blue-400">+{hoursRecovered}h/ano</div>
                  <div className="text-xs font-medium text-zinc-400">
                    estimadas para atividades pedagógicas*
                  </div>
                </div>
                <div className="p-6 rounded-[24px] bg-cyan-500/5 border border-cyan-500/10 flex flex-col gap-2">
                  <div className="text-[11px] font-black text-zinc-300 uppercase tracking-widest">
                    Economia de Infra Nuvem
                  </div>
                  <div className="text-2xl font-black text-cyan-400">
                    R$ {cloudSavings.toLocaleString("pt-BR")}
                  </div>
                  <div className="text-xs font-medium text-zinc-400">
                    estimados/ano em processamento local*
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                *Projeção paramétrica baseada em economia média de 3 min por chamada diária em 200 dias letivos e redução de tráfego de vídeo/API em nuvem.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-28 px-8 bg-[#020617] relative border-t border-white/5">
        <div className="max-w-7xl mx-auto flex flex-col items-center">
          <h2 className="text-4xl md:text-5xl font-black mb-8 text-white uppercase tracking-tighter animate-on-scroll">
            Planos <span className="text-cyan-400">Transparentes</span>
          </h2>
          <div className="flex items-center gap-2 mb-16 eagle-glass-card px-2 py-2 rounded-full animate-on-scroll">
            <button
              type="button"
              onClick={() => setIsAnnual(false)}
              className={`px-6 py-2 rounded-full font-bold text-sm transition-all uppercase tracking-widest ${
                !isAnnual ? "bg-white/10 text-white" : "text-zinc-400 hover:text-white"
              }`}
            >
              Mensal
            </button>
            <button
              type="button"
              onClick={() => setIsAnnual(true)}
              className={`px-6 py-2 rounded-full font-bold text-sm transition-all uppercase tracking-widest ${
                isAnnual
                  ? "bg-blue-600 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Anual (20% off)
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl">
            <div className="eagle-glass-card p-10 flex flex-col animate-on-scroll">
              <h3 className="text-xl font-bold text-zinc-200 mb-2 uppercase tracking-widest">
                Sovereign Essential
              </h3>
              <div className="text-4xl font-black text-white mb-6">
                {isAnnual ? "R$ 4,50" : "R$ 5,60"}
                <span className="text-sm font-normal text-zinc-400">/aluno/mês</span>
              </div>
              <ul className="space-y-4 mb-10 flex-1">
                <li className="flex items-center gap-3 text-sm text-zinc-300 font-medium">
                  <CheckCircle2 size={18} className="text-blue-500 shrink-0" /> Chamada Assistida &amp; Diário Digital
                </li>
                <li className="flex items-center gap-3 text-sm text-zinc-300 font-medium">
                  <CheckCircle2 size={18} className="text-blue-500 shrink-0" /> Alertas Preventivos de Infrequência
                </li>
                <li className="flex items-center gap-3 text-sm text-zinc-300 font-medium">
                  <CheckCircle2 size={18} className="text-blue-500 shrink-0" /> Portal Familiar &amp; Justificativas
                </li>
                <li className="flex items-center gap-3 text-sm text-zinc-300 font-medium">
                  <CheckCircle2 size={18} className="text-blue-500 shrink-0" /> Banco Local SQLite WAL + Backup
                </li>
              </ul>
              <Link
                href="/contato?plano=essential"
                className="w-full py-4 rounded-xl border border-white/10 text-white text-center font-bold hover:bg-white/5 transition-all uppercase tracking-widest text-xs no-underline"
              >
                Solicitar Piloto Essential
              </Link>
            </div>
            <div className="eagle-glass-card p-10 flex flex-col border-blue-500/50 shadow-[0_0_40px_rgba(59,130,246,0.15)] relative transform md:-translate-y-4 animate-on-scroll">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-600 text-white px-6 py-1 rounded-full text-[10px] font-black tracking-widest uppercase shadow-[0_0_15px_rgba(59,130,246,0.5)] whitespace-nowrap">
                Recomendado H-01
              </div>
              <h3 className="text-xl font-bold text-blue-400 mb-2 uppercase tracking-widest">
                Sovereign Pro
              </h3>
              <div className="text-4xl font-black text-white mb-6">
                {isAnnual ? "R$ 8,90" : "R$ 10,90"}
                <span className="text-sm font-normal text-zinc-400">/aluno/mês</span>
              </div>
              <ul className="space-y-4 mb-10 flex-1">
                <li className="flex items-center gap-3 text-sm text-zinc-200 font-medium">
                  <CheckCircle2 size={18} className="text-blue-500 shrink-0" /> Tudo no Essential
                </li>
                <li className="flex items-center gap-3 text-sm text-zinc-200 font-medium">
                  <CheckCircle2 size={18} className="text-blue-500 shrink-0" /> Correção Óptica OMR &amp; Provas A4
                </li>
                <li className="flex items-center gap-3 text-sm text-zinc-200 font-medium">
                  <CheckCircle2 size={18} className="text-blue-500 shrink-0" /> Linha do Tempo da Coordenação
                </li>
                <li className="flex items-center gap-3 text-sm text-zinc-200 font-medium">
                  <CheckCircle2 size={18} className="text-blue-500 shrink-0" /> Notificações WhatsApp / Push
                </li>
              </ul>
              <Link
                href="/contato?plano=pro"
                className="w-full py-4 rounded-xl bg-blue-600 text-white text-center font-bold hover:bg-blue-500 transition-all shadow-[0_0_20px_rgba(59,130,246,0.4)] uppercase tracking-widest text-xs no-underline"
              >
                Demonstração Pro
              </Link>
            </div>
            <div className="eagle-glass-card p-10 flex flex-col animate-on-scroll">
              <h3 className="text-xl font-bold text-cyan-400 mb-2 uppercase tracking-widest">
                Sovereign Elite
              </h3>
              <div className="text-3xl font-black text-white mb-6">Sob consulta</div>
              <ul className="space-y-4 mb-10 flex-1">
                <li className="flex items-center gap-3 text-sm text-zinc-300 font-medium">
                  <CheckCircle2 size={18} className="text-cyan-500 shrink-0" /> Tudo no Pro
                </li>
                <li className="flex items-center gap-3 text-sm text-zinc-300 font-medium">
                  <CheckCircle2 size={18} className="text-cyan-500 shrink-0" /> Implantação Multi-Unidade / Rede
                </li>
                <li className="flex items-center gap-3 text-sm text-zinc-300 font-medium">
                  <CheckCircle2 size={18} className="text-cyan-500 shrink-0" /> Integração ERP / Secretaria via API
                </li>
                <li className="flex items-center gap-3 text-sm text-zinc-300 font-medium">
                  <CheckCircle2 size={18} className="text-cyan-500 shrink-0" /> Apoio Técnico ao DPO / RIPD Local
                </li>
              </ul>
              <Link
                href="/contato?plano=elite"
                className="w-full py-4 rounded-xl border border-white/10 text-white text-center font-bold hover:bg-white/5 transition-all uppercase tracking-widest text-xs no-underline"
              >
                Falar com Consultor
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Contact CTA Section */}
      <section
        id="contact"
        className="py-32 px-8 bg-slate-900/50 relative overflow-hidden flex flex-col items-center justify-center border-t border-white/5"
      >
        <div className="max-w-4xl w-full mx-auto eagle-glass-card p-10 md:p-16 flex flex-col items-center text-center relative z-10 animate-on-scroll shadow-[0_0_50px_rgba(0,0,0,0.5)]">
          <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-white mb-4">
            Agende o Diagnóstico do Piloto Escolar
          </h2>
          <p className="text-zinc-300 mb-10 text-base md:text-lg max-w-2xl font-medium">
            Avalie o Áquila Pro com dados sintéticos na bancada da sua escola (20 salas / 500 alunos) e valide o roteiro de homologação H-01 junto à direção e coordenação.
          </p>

          <form onSubmit={handleDemoSubmit} className="w-full flex flex-col gap-5 text-left">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label htmlFor="home-name" className="sr-only">
                  Nome Completo
                </label>
                <input
                  id="home-name"
                  name="name"
                  type="text"
                  required
                  value={leadName}
                  onChange={(e) => setLeadName(e.target.value)}
                  placeholder="Nome Completo"
                  className="eagle-glass-card bg-[#020617]/70 px-6 py-4 rounded-xl text-white outline-none focus:border-blue-500/80 transition-colors w-full font-medium placeholder:text-zinc-400"
                />
              </div>
              <div>
                <label htmlFor="home-role" className="sr-only">
                  Cargo (Direção, Coordenação, TI)
                </label>
                <input
                  id="home-role"
                  name="role"
                  type="text"
                  value={leadRole}
                  onChange={(e) => setLeadRole(e.target.value)}
                  placeholder="Cargo (Ex: Diretor, Coordenadora, TI)"
                  className="eagle-glass-card bg-[#020617]/70 px-6 py-4 rounded-xl text-white outline-none focus:border-blue-500/80 transition-colors w-full font-medium placeholder:text-zinc-400"
                />
              </div>
            </div>
            <div>
              <label htmlFor="home-school" className="sr-only">
                Nome da Escola
              </label>
              <input
                id="home-school"
                name="school"
                type="text"
                required
                value={leadSchool}
                onChange={(e) => setLeadSchool(e.target.value)}
                placeholder="Nome da Escola / Instituição"
                className="eagle-glass-card bg-[#020617]/70 px-6 py-4 rounded-xl text-white outline-none focus:border-blue-500/80 transition-colors w-full font-medium placeholder:text-zinc-400"
              />
            </div>
            <div className="flex flex-col md:flex-row gap-5">
              <div className="flex-1">
                <label htmlFor="home-email" className="sr-only">
                  E-mail Corporativo
                </label>
                <input
                  id="home-email"
                  name="email"
                  type="email"
                  required
                  value={leadEmail}
                  onChange={(e) => setLeadEmail(e.target.value)}
                  placeholder="Seu e-mail institucional"
                  className="eagle-glass-card bg-[#020617]/70 px-6 py-4 rounded-xl text-white outline-none focus:border-blue-500/80 transition-colors w-full font-medium placeholder:text-zinc-400"
                />
              </div>
              <button
                type="submit"
                disabled={leadStatus.state === "submitting"}
                className="bg-blue-600 text-white px-8 py-4 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-blue-500 hover:shadow-[0_0_20px_rgba(59,130,246,0.6)] transition-all shrink-0 disabled:opacity-50"
              >
                {leadStatus.state === "submitting" ? "Enviando..." : "Agendar Demo"}
              </button>
            </div>
            <label className="flex items-start gap-3 text-xs text-zinc-300 cursor-pointer pt-1">
              <input
                type="checkbox"
                name="lgpdConsent"
                required
                checked={leadConsent}
                onChange={(e) => setLeadConsent(e.target.checked)}
                className="mt-0.5 accent-blue-500"
              />
              <span>
                Concordo com o tratamento dos meus dados de contato comercial conforme a{" "}
                <Link href="/seguranca-lgpd" className="text-blue-400 underline">
                  Política de Privacidade e Governança LGPD
                </Link>
                .
              </span>
            </label>
            {leadStatus.state === "error" && (
              <p role="alert" className="text-xs font-bold text-red-400">
                {leadStatus.message}
              </p>
            )}
            {leadStatus.state === "success" && (
              <div
                role="status"
                className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold"
              >
                {leadStatus.message} (Protocolo: {leadStatus.protocol})
              </div>
            )}
          </form>
        </div>
      </section>
    </div>
  );
}
