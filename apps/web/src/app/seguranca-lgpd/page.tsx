"use client";

import Link from "next/link";
import { Shield, Lock, EyeOff, CheckCircle2, ArrowRight, Cpu, CloudOff } from "lucide-react";

export default function SegurancaLGPD() {
  const principles = [
    {
      title: "Padrão Não-Biométrico & ANPD (Art. 11 e 14)",
      description:
        "Em estrita observância ao Despacho Decisório nº 2/2026/SFI e à Nota Técnica nº 4/2026 da ANPD (Caso Paraná), o módulo biométrico vem DESATIVADO por padrão de fábrica (BIOMETRIC_ATTENDANCE_ENABLED=false). O caminho primário e padrão da escola é Crachá QR Dinâmico e Chamada Nominal sem distinção, exigindo RIPD institucional aprovado e opt-in granular para qualquer ativação biométrica.",
      icon: <EyeOff className="text-indigo-400" size={28} />,
    },
    {
      title: "Soberania Local & Fronteira de Nuvem Clara",
      description:
        "Prontuários pedagógicos, frequência, notas e ocorrências permanecem 100% no banco SQLite (WAL) dentro do servidor local da escola. Conectores externos permanecem desativados por padrão no piloto H-01 e, quando contratados, trafegam apenas o mínimo estrito: metadados financeiros de cobrança (Stripe Connect / PIX) ou avisos oficiais (WhatsApp Meta Cloud API).",
      icon: <Cpu className="text-indigo-400" size={28} />,
    },
    {
      title: "Supervisão Docente CNE & Auditoria (Art. 16)",
      description:
        "Alinhado ao Parecer CNE/CP nº 15/2026 e à Lei nº 15.211/2025 (ECA Digital): nenhuma nota ou questão gerada por IA é publicada sem revisão humana docente (bloqueio RASCUNHO_IA), garantindo direito de contestação, TLS 1.3, AES-256-GCM em repouso e trilha de auditoria imutável com hash SHA-256.",
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
          <p className="text-zinc-300 text-lg md:text-xl max-w-3xl mx-auto font-medium leading-relaxed">
            Arquitetura construída em conformidade com os artigos 11, 14 e 16 da LGPD (Lei nº 13.709/2018), o artigo 12, inciso VIII, alínea &ldquo;a&rdquo; da LDB (atualizado pela Lei nº 15.231/2025), a Lei nº 15.211/2025 (ECA Digital) e o Parecer CNE/CP nº 15/2026, sujeita à validação pelo DPO e RIPD/DPIA institucional de cada escola.
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
                No perfil de homologação H-01, o sistema opera por padrão via Crachá QR e chamada assistida pelo educador, mantendo módulos biométricos desativados de fábrica até aprovação formal do RIPD institucional e garantindo supervisão humana obrigatória em avaliações (Parecer CNE/CP nº 15/2026).
              </p>
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3 text-xs font-black uppercase tracking-widest text-white">
                  <CheckCircle2 className="text-indigo-400 shrink-0" size={20} />
                  Criptografia AES-256-GCM em Repouso + Trilha de Auditoria SHA-256
                </div>
                <div className="flex items-center gap-3 text-xs font-black uppercase tracking-widest text-white">
                  <CheckCircle2 className="text-indigo-400 shrink-0" size={20} />
                  Electron Hardening: contextIsolation, sandbox, webSecurity e CSP Estrito
                </div>
                <div className="flex items-center gap-3 text-xs font-black uppercase tracking-widest text-white">
                  <CheckCircle2 className="text-indigo-400 shrink-0" size={20} />
                  Zero Lootboxes / Microtransações Pagas para Menores (Lei 15.211/2025)
                </div>
              </div>
            </div>
          </div>
          <div className="glass rounded-[40px] border border-white/10 p-8 bg-black flex flex-col gap-4">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-indigo-400">
              <CloudOff size={16} /> Matriz de Fronteira de Dados (Local vs. Nuvem)
            </div>
            <ol className="space-y-3 text-xs text-zinc-300 font-medium list-decimal list-inside">
              <li>
                <strong className="text-white">100% Local (Servidor Edge SQLite WAL):</strong> Prontuário escolar, notas, frequência diária, PEI/AEE, ocorrências e trilha `zero_bypass_audits`.
              </li>
              <li>
                <strong className="text-white">Caminho Primário de Acesso:</strong> Crachá QR Dinâmico e chamada nominal pelo professor (biometria desativada por padrão).
              </li>
              <li>
                <strong className="text-white">Conector Financeiro Opcional (Stripe Connect / PIX):</strong> Trafega exclusivamente dados de cobrança/pagamento do responsável financeiro; nenhum dado pedagógico ou disciplinar do aluno vai para a Stripe.
              </li>
              <li>
                <strong className="text-white">Mensageria Oficial Opcional (WhatsApp Meta API):</strong> Trafega apenas comunicados autorizados com as credenciais institucionais da escola.
              </li>
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
                  Política v2.2 • CNE &amp; ECA Digital
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
                  LGPD Art. 11, 14 &amp; 38 • ANPD 2026
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
