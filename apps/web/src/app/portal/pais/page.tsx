"use client";

import React, { useState } from "react";
import {
  ShieldCheck, Clock, BookOpen, DollarSign, MessageCircle,
  CheckCircle2, AlertTriangle, QrCode, Copy, Check, X,
  FileText, ArrowRight, UserCheck, Smartphone, Send
} from "lucide-react";
import { EagleCard } from "@/components/ui/EagleCard";
import { EliteButton } from "@/components/ui/EliteButton";

export default function PortalPais() {
  const [activeTab, setActiveTab] = useState<"seguranca" | "boletim" | "financeiro" | "ocorrencias" | "contato">("seguranca");
  const [showPixModal, setShowPixModal] = useState(false);
  const [pixCopied, setPixCopied] = useState(false);
  const [pixSettled, setPixSettled] = useState(false);

  const [occurrences, setOccurrences] = useState([
    {
      id: "occ-1",
      date: "18/10/2026",
      time: "08:45",
      type: "Pedagógica",
      title: "Orientação Complementar: Relatório de Física",
      desc: "Estudante participou de alinhamento com a coordenação para entrega de relatório experimental. Prazo estendido em 48h.",
      signed: false,
      signedAt: "",
    },
    {
      id: "occ-2",
      date: "17/10/2026",
      time: "10:15",
      type: "Mérito Acadêmico",
      title: "⭐ Destaque no Simulado ENEM - Redação Nota 960",
      desc: "Excelente articulação de repertório sociocultural e proposta de intervenção detalhada.",
      signed: true,
      signedAt: "17/10/2026 às 19:22 (Assinado por Marcos Andrade)",
    },
    {
      id: "occ-3",
      date: "16/10/2026",
      time: "07:32",
      type: "Pontualidade",
      title: "Registro de Entrada Tolerância (07:32)",
      desc: "Entrada registrada após as 07:15. Recomendamos atenção aos horários de abertura.",
      signed: true,
      signedAt: "16/10/2026 às 12:40 (Assinado por Marcos Andrade)",
    },
  ]);

  const handleSign = (id: string) => {
    const time = new Date().toLocaleString("pt-BR");
    setOccurrences((prev) =>
      prev.map((o) =>
        o.id === id
          ? { ...o, signed: true, signedAt: `${time} (Assinatura Digital ICP-Brasil / LGPD)` }
          : o
      )
    );
  };

  const handleCopyPix = () => {
    setPixCopied(true);
    navigator.clipboard?.writeText(
      "00020126580014br.gov.bcb.pix0136e4b9c1d8-4f2a-4c8d-90b1-8b21c459821052040000530398654071480.005802BR5925AQUILA EDUCACIONAL SA6009SAO PAULO62070503***6304D1B8"
    );
    setTimeout(() => setPixCopied(false), 2500);
  };

  const handleSettlePix = () => {
    setPixSettled(true);
    setTimeout(() => {
      setShowPixModal(false);
    }, 1500);
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Guardian Header HUD */}
      <EagleCard glow="cyan" className="p-5 sm:p-7 border-emerald-500/30 bg-emerald-950/10">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4 sm:gap-5">
            {/* Rectangular Avatar */}
            <div className="w-14 h-16 sm:w-16 sm:h-20 rounded-xl bg-gradient-to-br from-emerald-500 via-teal-500 to-indigo-600 p-0.5 shadow-xl shadow-emerald-950/60">
              <div className="w-full h-full rounded-[10px] bg-zinc-950 flex items-center justify-center">
                <span className="text-xl sm:text-2xl font-black text-emerald-300">LA</span>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  Lucas Andrade
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  Dentro do Campus • Seguro
                </span>
              </div>
              <p className="text-xs sm:text-sm text-zinc-400 font-medium">
                Responsável: <strong className="text-white">Marcos Andrade</strong> • 3º Ano A (Integral)
              </p>
              <div className="flex items-center gap-3 text-[11px] text-zinc-400 mt-1">
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <ShieldCheck size={13} /> Entrada Portaria Sul: 07:12 (Biometria)
                </span>
                <span>•</span>
                <span>Previsão de Saída: 12:35</span>
              </div>
            </div>
          </div>

          {/* Tuition Status Strip */}
          <div className="flex items-center gap-4 w-full lg:w-auto justify-between lg:justify-end border-t lg:border-t-0 border-white/10 pt-4 lg:pt-0">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">
                Mensalidade de Novembro:
              </span>
              <span className="text-sm font-black text-white">R$ 1.480,00</span>
              <span className="text-[10px] text-emerald-400 font-semibold">
                {pixSettled ? "LIQUIDADO VIA PIX" : "Vence em 10/11/2026"}
              </span>
            </div>

            <EliteButton
              variant={pixSettled ? "secondary" : "primary"}
              size="sm"
              onClick={() => setShowPixModal(true)}
              className="gap-2"
            >
              <QrCode size={14} />
              {pixSettled ? "Comprovante PIX" : "Pagar com PIX"}
            </EliteButton>
          </div>
        </div>
      </EagleCard>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab("seguranca")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
            activeTab === "seguranca"
              ? "bg-emerald-600/30 text-emerald-200 border border-emerald-500/40 shadow-lg shadow-emerald-900/20"
              : "text-zinc-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <ShieldCheck size={16} /> Segurança & Portaria
        </button>

        <button
          onClick={() => setActiveTab("boletim")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
            activeTab === "boletim"
              ? "bg-emerald-600/30 text-emerald-200 border border-emerald-500/40 shadow-lg shadow-emerald-900/20"
              : "text-zinc-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <BookOpen size={16} /> Boletim & Rendimento
        </button>

        <button
          onClick={() => setActiveTab("financeiro")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
            activeTab === "financeiro"
              ? "bg-emerald-600/30 text-emerald-200 border border-emerald-500/40 shadow-lg shadow-emerald-900/20"
              : "text-zinc-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <DollarSign size={16} /> Financeiro & PIX
        </button>

        <button
          onClick={() => setActiveTab("ocorrencias")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
            activeTab === "ocorrencias"
              ? "bg-emerald-600/30 text-emerald-200 border border-emerald-500/40 shadow-lg shadow-emerald-900/20"
              : "text-zinc-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <FileText size={16} /> Ocorrências & Assinaturas
          {occurrences.some((o) => !o.signed) && (
            <span className="w-2 h-2 rounded-full bg-amber-400" />
          )}
        </button>

        <button
          onClick={() => setActiveTab("contato")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
            activeTab === "contato"
              ? "bg-emerald-600/30 text-emerald-200 border border-emerald-500/40 shadow-lg shadow-emerald-900/20"
              : "text-zinc-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <MessageCircle size={16} /> Canal Direto
        </button>
      </div>

      {/* Tab 1: Segurança & Portaria */}
      {activeTab === "seguranca" && (
        <EagleCard glow="cyan" className="p-6 flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <ShieldCheck className="text-emerald-400" size={20} /> Telemetria de Portaria & Acesso Biocêntrico
              </h2>
              <p className="text-xs text-zinc-400">
                Monitoramento por reconhecimento facial local de alta precisão (sem envio de imagem bruta para a nuvem - LGPD Soberana).
              </p>
            </div>
            <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              Fidelidade Presencial: 99.8%
            </span>
          </div>

          {/* Timeline of events */}
          <div className="flex flex-col gap-3 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-white/10 pl-6">
            {[
              { time: "07:12:04", title: "Entrada Autorizada • Portaria Sul", desc: "Catraca 02 - Reconhecimento Facial (Confiança: 99.8%)." },
              { time: "09:30:15", title: "Acesso ao Pátio Central • Recreio", desc: "Câmera de fluxo operacional registrou permanência segura." },
              { time: "12:35:00", title: "Saída Programada", desc: "Liberação biométrica padrão ao final das atividades matutinas." },
            ].map((ev, i) => (
              <div key={i} className="relative flex flex-col gap-1 text-xs">
                <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-black" />
                <span className="font-mono text-emerald-400 font-bold">{ev.time}</span>
                <h4 className="font-bold text-white">{ev.title}</h4>
                <p className="text-zinc-400">{ev.desc}</p>
              </div>
            ))}
          </div>
        </EagleCard>
      )}

      {/* Tab 2: Boletim */}
      {activeTab === "boletim" && (
        <EagleCard glow="purple" className="p-6 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">Desempenho Pedagógico de Lucas</h2>
              <p className="text-xs text-zinc-400">
                Acompanhamento bimestral e evolução cognitiva calculada pelo Córtex da Escola.
              </p>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-purple-500/10 text-purple-300 border border-purple-500/30 text-xs font-bold">
              Média Geral: 9.1
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { subject: "Matemática", grade: 9.2, trend: "+0.4", status: "Evoluindo" },
              { subject: "Física", grade: 8.9, trend: "+0.6", status: "Evoluindo" },
              { subject: "Redação ENEM", grade: 9.6, trend: "+0.8", status: "Destaque" },
              { subject: "Química", grade: 8.8, trend: "+0.2", status: "Estável" },
              { subject: "Biologia", grade: 9.4, trend: "+0.3", status: "Evoluindo" },
              { subject: "História", grade: 9.1, trend: "-0.2", status: "Atenção Leve" },
            ].map((card) => (
              <div key={card.subject} className="p-4 rounded-xl bg-white/5 border border-white/10 flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400 font-medium">{card.subject}</span>
                  <span className="text-emerald-400 font-bold font-mono">{card.trend}</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-white">{card.grade.toFixed(1)}</span>
                  <span className="text-[10px] text-zinc-400">/ 10.0</span>
                </div>
                <span className="text-[10px] font-semibold text-purple-300 uppercase tracking-wider">
                  {card.status}
                </span>
              </div>
            ))}
          </div>
        </EagleCard>
      )}

      {/* Tab 3: Financeiro & PIX */}
      {activeTab === "financeiro" && (
        <EagleCard glow="cyan" className="p-6 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">Central Financeira da Mensalidade</h2>
              <p className="text-xs text-zinc-400">
                Emissão instantânea de PIX Dinâmico com conciliação contábil via Domínio Sistemas.
              </p>
            </div>
            <span className="px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-bold">
              CADASTRO ADIMPLENTE
            </span>
          </div>

          <div className="p-5 rounded-2xl bg-white/5 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-zinc-400 uppercase font-bold tracking-wider">
                Parcela 11/12 • Novembro de 2026
              </span>
              <h3 className="text-2xl font-black text-white">R$ 1.480,00</h3>
              <p className="text-xs text-emerald-400 font-medium">
                {pixSettled ? "Status: Pago e Conciliado" : "Vencimento: 10/11/2026"}
              </p>
            </div>

            <EliteButton
              variant={pixSettled ? "secondary" : "primary"}
              size="md"
              onClick={() => setShowPixModal(true)}
              className="gap-2"
            >
              <QrCode size={16} />
              {pixSettled ? "Ver Recibo" : "Gerar PIX QR Code"}
            </EliteButton>
          </div>
        </EagleCard>
      )}

      {/* Tab 4: Ocorrências & Assinaturas */}
      {activeTab === "ocorrencias" && (
        <EagleCard glow="amber" className="p-6 flex flex-col gap-5">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <FileText className="text-amber-400" size={20} /> Prontuário Escolar & Notificações
            </h2>
            <p className="text-xs text-zinc-400">
              Assinatura digital com validade jurídica em conformidade com o Marco Legal da Educação e LGPD.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            {occurrences.map((occ) => (
              <div
                key={occ.id}
                className="p-4 rounded-xl bg-white/5 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex flex-col gap-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-zinc-400">{occ.date} • {occ.time}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white/10 text-zinc-300">
                      {occ.type}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white">{occ.title}</h4>
                  <p className="text-xs text-zinc-300">{occ.desc}</p>
                  {occ.signed && (
                    <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1 mt-1">
                      <CheckCircle2 size={13} /> {occ.signedAt}
                    </span>
                  )}
                </div>

                {!occ.signed && (
                  <EliteButton
                    variant="primary"
                    size="sm"
                    onClick={() => handleSign(occ.id)}
                    className="whitespace-nowrap"
                  >
                    Assinar Notificação
                  </EliteButton>
                )}
              </div>
            ))}
          </div>
        </EagleCard>
      )}

      {/* Tab 5: Canal Direto */}
      {activeTab === "contato" && (
        <EagleCard glow="blue" className="p-6 flex flex-col gap-6">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <MessageCircle className="text-blue-400" size={20} /> Canal Institucional com a Coordenação
            </h2>
            <p className="text-xs text-zinc-400">
              Comunicação direta criptografada com a equipe pedagógica e secretaria escolar.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex flex-col gap-3">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Smartphone size={16} className="text-emerald-400" /> WhatsApp Oficial da Coordenação
              </h4>
              <p className="text-xs text-zinc-400">
                Atendimento ágil para dúvidas de frequência, documentos e ocorrências acadêmicas.
              </p>
              <a
                href="https://wa.me/5511999998888"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold hover:bg-emerald-600/30 transition-all no-underline"
              >
                Abrir WhatsApp Institucional
              </a>
            </div>

            <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex flex-col gap-3">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Clock size={16} className="text-cyan-400" /> Horário de Plantão da Coordenação
              </h4>
              <p className="text-xs text-zinc-400">
                Segunda a Sexta-feira: 07:30 às 17:30.<br />
                Coordenadora Responsável: Profª Juliana Medeiros.
              </p>
            </div>
          </div>
        </EagleCard>
      )}

      {/* Dynamic PIX Payment Modal */}
      {showPixModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <EagleCard glow="cyan" className="max-w-md w-full p-6 flex flex-col gap-5 border-cyan-500/40 relative">
            <button
              onClick={() => setShowPixModal(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white"
            >
              <X size={20} />
            </button>

            <div className="text-center flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                <QrCode size={24} />
              </div>
              <h3 className="text-lg font-bold text-white">PIX Dinâmico Instantâneo</h3>
              <p className="text-xs text-zinc-400">
                Mensalidade Escolar • Novembro 2026 • <strong>R$ 1.480,00</strong>
              </p>
            </div>

            {/* Simulated QR Code Canvas */}
            <div className="w-48 h-48 mx-auto bg-white p-3 rounded-2xl flex items-center justify-center shadow-xl">
              <div className="w-full h-full border-2 border-black border-dashed flex flex-col items-center justify-center text-black text-center p-2">
                <QrCode size={100} className="text-black" />
                <span className="text-[9px] font-bold mt-1 uppercase tracking-tight">
                  Áquila Pay • BCB Pix
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-[10px] uppercase font-bold text-zinc-400 text-center">
                Chave Copia e Cola
              </span>
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl p-2.5">
                <input
                  type="text"
                  readOnly
                  value="00020126580014br.gov.bcb.pix0136e4b9c1d8-4f2a-4c8d-90b1-8b21c459821052040000530398654071480.005802BR"
                  className="bg-transparent text-[11px] font-mono text-zinc-300 outline-none flex-1 truncate"
                />
                <button
                  onClick={handleCopyPix}
                  className="px-3 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 text-xs font-bold hover:bg-cyan-500/30 transition-all flex items-center gap-1"
                >
                  {pixCopied ? <Check size={14} /> : <Copy size={14} />}
                  <span>{pixCopied ? "Copiado!" : "Copiar"}</span>
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2 border-t border-white/10">
              <EliteButton
                variant="primary"
                size="md"
                onClick={handleSettlePix}
                className="w-full gap-2"
              >
                <CheckCircle2 size={16} />
                {pixSettled ? "Pagamento Confirmado!" : "Simular Liquidação Instantânea"}
              </EliteButton>
              <span className="text-[10px] text-zinc-400 text-center">
                Integração automática com Domínio Sistemas (|5100| Baixas)
              </span>
            </div>
          </EagleCard>
        </div>
      )}
    </div>
  );
}
