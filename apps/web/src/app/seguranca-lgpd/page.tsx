"use client";

import Link from "next/link";
import { Shield, Lock, EyeOff, CheckCircle2, ArrowRight, Cpu } from "lucide-react";

export default function SegurancaLGPD() {
  const principles = [
    {
      title: "Minimização & Consentimento (Art. 14)",
      description:
        "Coletamos apenas os dados necessários para a rotina escolar e segurança do estudante. Qualquer recurso biométrico exige termo de consentimento específico dos responsáveis e oferece alternativa não-biométrica (crachá/chamada nominal) sem distinção.",
      icon: <EyeOff className="text-indigo-400" size={28} />,
    },
    {
      title: "Processamento Local (Offline-First)",
      description:
        "O banco de dados SQLite (WAL) opera dentro da infraestrutura local da escola. Conectores de nuvem permanecem desativados por padrão no piloto H-01 (AQUILA_ENABLE_CLOUD_CONNECTORS=false).",
      icon: <Cpu className="text-indigo-400" size={28} />,
    },
    {
      title: "Criptografia & Trilha de Auditoria (Art. 16)",
      description:
        "Comunicação protegida por TLS 1.3, sessões assinadas com HMAC-SHA256, dados sensíveis em repouso protegidos por AES-256-GCM / Windows DPAPI e registros de expurgo verificáveis por hash SHA-256.",
      icon: <Lock className="text-indigo-400" size={28} />,
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-black text-white">
      <section
        id="privacidade"
        className="pt-44 pb-20 px-8 flex flex-col items-center border-b border-white/5"
      >
        <div className="max-w-4xl text-center">
          <Shield className="text-indigo-500 mb-6 mx-auto" size={56} />
          <h1 className="text-5xl md:text-6xl font-black uppercase tracking-tighter mb-6 leading-tight">
            Privacidade por <span className="italic text-indigo-400">Padrão</span> e Desenho Técnico.
          </h1>
          <p className="text-zinc-300 text-lg md:text-xl max-w-2xl mx-auto font-medium leading-relaxed">
            Arquitetura construída em conformidade com os artigos 14 e 16 da LGPD (Lei nº 13.709/2018) e o artigo 12, VII da LDB, sujeita à validação pelo DPO e RIPD/DPIA institucional de cada escola.
          </p>
        </div>
      </section>

      {/* Principles Section */}
      <section id="governanca" className="py-20 px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
          {principles.map((prince, idx) => (
            <div key={idx} className="flex flex-col gap-5 glass p-8 rounded-[32px] border border-white/10">
              <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center">
                {prince.icon}
              </div>
              <h2 className="text-2xl font-black uppercase tracking-tighter">{prince.title}</h2>
              <p className="text-zinc-300 text-sm leading-relaxed font-medium border-l-2 border-indigo-500/40 pl-4">
                {prince.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Technical Controls Deep Dive */}
      <section id="sla" className="py-24 px-8 bg-zinc-950/40 border-y border-white/5">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter mb-6 italic">
              Controles Técnicos{" "}
              <span className="text-indigo-500 not-italic">Verificáveis em Código</span>.
            </h2>
            <div className="flex flex-col gap-6 text-zinc-300 text-base leading-relaxed">
              <p>
                No perfil de homologação H-01, o sistema prioriza a operação assistida pelo educador e mantém módulos biométricos em quarentena por padrão até a assinatura formal do RIPD institucional.
              </p>
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3 text-xs font-black uppercase tracking-widest text-white">
                  <CheckCircle2 className="text-indigo-400 shrink-0" size={20} />
                  Vetores 512-D com Hash Unidirecional SHA-256 + AES-256-GCM em Repouso
                </div>
                <div className="flex items-center gap-3 text-xs font-black uppercase tracking-widest text-white">
                  <CheckCircle2 className="text-indigo-400 shrink-0" size={20} />
                  Electron Hardening: contextIsolation, sandbox, webSecurity e CSP Estrito
                </div>
                <div className="flex items-center gap-3 text-xs font-black uppercase tracking-widest text-white">
                  <CheckCircle2 className="text-indigo-400 shrink-0" size={20} />
                  Autorização Backend Independente por Série, Turma e Perfil (Zero-Bypass)
                </div>
              </div>
            </div>
          </div>
          <div className="glass rounded-[40px] border border-white/10 p-8 bg-black flex flex-col gap-4">
            <div className="text-xs font-black uppercase tracking-widest text-indigo-400">
              Resumo do Fluxo de Dados (Perímetro Local)
            </div>
            <ol className="space-y-3 text-xs text-zinc-300 font-medium list-decimal list-inside">
              <li>Autenticação de sessão via token assinado com HMAC-SHA256 (3 partes).</li>
              <li>Validação de escopo RBAC e vínculo de turma/série no servidor local.</li>
              <li>Gravação transacional no banco SQLite (`aquila.db`) em modo WAL.</li>
              <li>Registro de auditoria na tabela `zero_bypass_audits` com hash SHA-256.</li>
            </ol>
          </div>
        </div>
      </section>

      {/* Legal & Docs */}
      <section className="py-24 px-8">
        <div className="max-w-4xl mx-auto text-center flex flex-col items-center">
          <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter mb-12">
            Documentação de <span className="text-indigo-500">Conformidade</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
            <Link
              href="/contato?documento=politica-privacidade"
              className="flex items-center justify-between p-8 rounded-[32px] glass hover:bg-white/5 border border-white/10 transition-all text-left no-underline text-white"
            >
              <div>
                <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">
                  Política v2.1
                </div>
                <div className="text-xl font-black">Solicitar Minuta de Privacidade</div>
              </div>
              <ArrowRight size={24} className="text-indigo-400 shrink-0" />
            </Link>
            <Link
              href="/contato?documento=ripd-dpia"
              className="flex items-center justify-between p-8 rounded-[32px] glass hover:bg-white/5 border border-white/10 transition-all text-left no-underline text-white"
            >
              <div>
                <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">
                  LGPD Art. 14 &amp; 38
                </div>
                <div className="text-xl font-black">Modelo de Relatório RIPD / DPIA</div>
              </div>
              <ArrowRight size={24} className="text-indigo-400 shrink-0" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
