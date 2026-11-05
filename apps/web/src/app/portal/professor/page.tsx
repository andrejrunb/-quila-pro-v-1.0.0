"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Users, AlertTriangle, Presentation,
  FileSpreadsheet, Sparkles, LayoutGrid, RefreshCw,
  Clock, ShieldCheck, Check, BookOpen, Layers, FileText, Printer
} from "lucide-react";
import { EagleCard } from "@/components/ui/EagleCard";
import { EliteButton } from "@/components/ui/EliteButton";

interface StudentAttendance {
  id: string;
  name: string;
  seat: string;
  status: "present" | "absent" | "justified";
  confidence: number;
  entryTime: string;
}

interface ExamQuestion {
  id: string;
  bncc: string;
  stem: string;
  options: string[];
  answer: string;
}

export default function PortalProfessor() {
  const [activeTab, setActiveTab] = useState<"chamada" | "diario" | "radar" | "notas" | "provas">("chamada");
  const [isSyncingSigaWeb, setIsSyncingSigaWeb] = useState(false);
  const [sigaWebSynced, setSigaWebSynced] = useState(true);
  const [sigaWebHash, setSigaWebHash] = useState("9a7c3f8e12b4d5...c81");
  const [diarioSigned, setDiarioSigned] = useState(false);
  const [quickConfirmedBanner, setQuickConfirmedBanner] = useState<string | null>(null);

  const [students, setStudents] = useState<StudentAttendance[]>([
    { id: "s1", name: "Lucas Andrade", seat: "B3", status: "present", confidence: 99.4, entryTime: "07:12" },
    { id: "s2", name: "Sofia Costa", seat: "A2", status: "present", confidence: 98.7, entryTime: "07:05" },
    { id: "s3", name: "Gabriel Santos", seat: "C4", status: "present", confidence: 97.9, entryTime: "07:18" },
    { id: "s4", name: "Helena Oliveira", seat: "A1", status: "present", confidence: 99.8, entryTime: "06:58" },
    { id: "s5", name: "Matheus Lima", seat: "D2", status: "absent", confidence: 0, entryTime: "--" },
    { id: "s6", name: "Beatriz Ribeiro", seat: "B1", status: "present", confidence: 99.1, entryTime: "07:10" },
    { id: "s7", name: "Thiago Mendes", seat: "C1", status: "justified", confidence: 0, entryTime: "--" },
    { id: "s8", name: "Camila Duarte", seat: "D4", status: "present", confidence: 98.5, entryTime: "07:14" },
  ]);

  // Exam Foundry — Preview A4 em tempo real (2 Colunas + OMR)
  const [examTitle, setExamTitle] = useState("Avaliação Bimestral de Física Aplicada — 2º Ano B");
  const [examInstructions, setExamInstructions] = useState(
    "Utilize caneta esferográfica preta no cartão OMR. Tempo de prova: 50 minutos. Sem consulta."
  );
  const [examQuestions, setExamQuestions] = useState<ExamQuestion[]>([
    {
      id: "q1",
      bncc: "EM13CNT301",
      stem: "Um gás ideal sofre uma expansão isotérmica reversível recebendo 600 J de calor da fonte térmica. Qual é o trabalho realizado pelo gás e a variação de sua energia interna (ΔU)?",
      options: [
        "A) W = 600 J e ΔU = 0 J",
        "B) W = 0 J e ΔU = 600 J",
        "C) W = 300 J e ΔU = 300 J",
        "D) W = -600 J e ΔU = 600 J",
      ],
      answer: "A",
    },
    {
      id: "q2",
      bncc: "EM13CNT302",
      stem: "Uma máquina térmica de Carnot opera entre duas fontes térmicas às temperaturas de 600 K (fonte quente) e 300 K (fonte fria). Qual é o rendimento máximo teórico dessa máquina?",
      options: [
        "A) 25%",
        "B) 50%",
        "C) 75%",
        "D) 80%",
      ],
      answer: "B",
    },
  ]);

  const toggleStudentStatus = (id: string, newStatus: "present" | "absent" | "justified") => {
    setStudents((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: newStatus } : s))
    );
    setSigaWebSynced(false);
  };

  const handleQuickConfirmAttendance = useCallback(() => {
    const nowTime = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    setStudents((prev) =>
      prev.map((s) =>
        s.status === "absent" && s.entryTime !== "--"
          ? { ...s, status: "present" }
          : s
      )
    );
    setSigaWebSynced(true);
    setQuickConfirmedBanner(
      `Chamada rápida (< 90s) confirmada às ${nowTime} e sincronizada com o Diário de Classe!`
    );
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "c") {
        e.preventDefault();
        handleQuickConfirmAttendance();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleQuickConfirmAttendance]);

  const handleSyncSigaWeb = () => {
    setIsSyncingSigaWeb(true);
    setTimeout(() => {
      setIsSyncingSigaWeb(false);
      setSigaWebSynced(true);
      setSigaWebHash(
        Math.random().toString(16).substring(2, 10) +
        Math.random().toString(16).substring(2, 10) +
        "...sha256"
      );
    }, 1200);
  };

  const updateQuestionStem = (id: string, stem: string) => {
    setExamQuestions((prev) => prev.map((q) => (q.id === id ? { ...q, stem } : q)));
  };

  const presentCount = students.filter((s) => s.status === "present").length;
  const absentCount = students.filter((s) => s.status === "absent").length;
  const justifiedCount = students.filter((s) => s.status === "justified").length;

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Teacher Command Bar HUD */}
      <EagleCard glow="blue" className="p-5 sm:p-7 border-blue-500/30 bg-blue-950/10">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4 sm:gap-5">
            {/* Rectangular Avatar */}
            <div className="w-14 h-16 sm:w-16 sm:h-20 rounded-xl bg-gradient-to-br from-blue-600 via-cyan-600 to-indigo-600 p-0.5 shadow-xl shadow-blue-950/60">
              <div className="w-full h-full rounded-[10px] bg-zinc-950 flex items-center justify-center">
                <span className="text-xl sm:text-2xl font-black text-blue-300">RS</span>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  Prof. Ricardo Silva
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/40">
                  Docente Titular • Física & Matemática
                </span>
              </div>
              <p className="text-xs sm:text-sm text-zinc-300 font-medium">
                Aula Ativa: <strong className="text-white">2º Ano B • Física Aplicada</strong> (SALA 08)
              </p>
              <div className="flex items-center gap-3 text-[11px] text-zinc-300 mt-1">
                <span className="text-cyan-400 font-semibold flex items-center gap-1">
                  <Clock size={13} /> Horário: 08:40 - 09:30
                </span>
                <span>•</span>
                <span>32 Alunos Matriculados</span>
              </div>
            </div>
          </div>

          {/* SigaWeb RPA Status & Top Actions */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full lg:w-auto">
            <div className="flex flex-col gap-1 w-full sm:w-auto">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-300">
                  Status SigaWeb RPA:
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    sigaWebSynced
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                      : "bg-amber-500/10 text-amber-300 border-amber-500/30 animate-pulse"
                  }`}
                >
                  {sigaWebSynced ? "SINCRONIZADO" : "PENDENTE DE ENVIO"}
                </span>
              </div>
              <span className="text-[10px] font-mono text-zinc-400 truncate max-w-[200px]">
                Hash: {sigaWebHash}
              </span>
            </div>

            <EliteButton
              variant={sigaWebSynced ? "secondary" : "primary"}
              size="sm"
              onClick={handleSyncSigaWeb}
              disabled={isSyncingSigaWeb}
              className="w-full sm:w-auto gap-2"
            >
              <RefreshCw size={14} className={isSyncingSigaWeb ? "animate-spin" : ""} />
              {isSyncingSigaWeb ? "Sincronizando..." : "Exportar SigaWeb"}
            </EliteButton>
          </div>
        </div>

        {/* Quick Tools Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-6 pt-5 border-t border-white/10">
          <button
            type="button"
            onClick={() => setActiveTab("diario")}
            className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-blue-500/40 text-xs font-semibold text-zinc-200 transition-all"
          >
            <Presentation size={14} className="text-blue-400" />
            <span>Diário & Conteúdo</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("provas")}
            className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-blue-500/40 text-xs font-semibold text-zinc-200 transition-all"
          >
            <Sparkles size={14} className="text-cyan-400" />
            <span>Exam Foundry (A4 Real-Time)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("chamada")}
            className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-blue-500/40 text-xs font-semibold text-zinc-200 transition-all"
          >
            <LayoutGrid size={14} className="text-purple-400" />
            <span>Chamada &lt; 90s</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("notas")}
            className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-blue-500/40 text-xs font-semibold text-zinc-200 transition-all"
          >
            <FileSpreadsheet size={14} className="text-emerald-400" />
            <span>Planilha Bimestral</span>
          </button>
        </div>
      </EagleCard>

      {/* Tabs */}
      <div
        role="tablist"
        aria-label="Navegação do Portal do Professor"
        className="flex items-center gap-2 border-b border-white/10 pb-2 overflow-x-auto"
      >
        <button
          role="tab"
          aria-selected={activeTab === "chamada"}
          onClick={() => setActiveTab("chamada")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap focus-visible:ring-2 focus-visible:ring-cyan-400 outline-none ${
            activeTab === "chamada"
              ? "bg-blue-600/30 text-blue-200 border border-blue-500/40 shadow-lg shadow-blue-900/20"
              : "text-zinc-300 hover:text-white hover:bg-white/5"
          }`}
        >
          <Users size={16} /> Chamada Inteligente (&lt; 90s)
        </button>

        <button
          role="tab"
          aria-selected={activeTab === "provas"}
          onClick={() => setActiveTab("provas")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap focus-visible:ring-2 focus-visible:ring-cyan-400 outline-none ${
            activeTab === "provas"
              ? "bg-blue-600/30 text-blue-200 border border-blue-500/40 shadow-lg shadow-blue-900/20"
              : "text-zinc-300 hover:text-white hover:bg-white/5"
          }`}
        >
          <FileText size={16} /> Preview A4 em Tempo Real (Provas)
        </button>

        <button
          role="tab"
          aria-selected={activeTab === "diario"}
          onClick={() => setActiveTab("diario")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap focus-visible:ring-2 focus-visible:ring-cyan-400 outline-none ${
            activeTab === "diario"
              ? "bg-blue-600/30 text-blue-200 border border-blue-500/40 shadow-lg shadow-blue-900/20"
              : "text-zinc-300 hover:text-white hover:bg-white/5"
          }`}
        >
          <BookOpen size={16} /> Diário de Classe Digital
        </button>

        <button
          role="tab"
          aria-selected={activeTab === "radar"}
          onClick={() => setActiveTab("radar")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap focus-visible:ring-2 focus-visible:ring-cyan-400 outline-none ${
            activeTab === "radar"
              ? "bg-blue-600/30 text-blue-200 border border-blue-500/40 shadow-lg shadow-blue-900/20"
              : "text-zinc-300 hover:text-white hover:bg-white/5"
          }`}
        >
          <AlertTriangle size={16} /> Radar de Atenção Pedagógica
        </button>

        <button
          role="tab"
          aria-selected={activeTab === "notas"}
          onClick={() => setActiveTab("notas")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap focus-visible:ring-2 focus-visible:ring-cyan-400 outline-none ${
            activeTab === "notas"
              ? "bg-blue-600/30 text-blue-200 border border-blue-500/40 shadow-lg shadow-blue-900/20"
              : "text-zinc-300 hover:text-white hover:bg-white/5"
          }`}
        >
          <Layers size={16} /> Notas Bimestrais
        </button>
      </div>

      {/* Tab 1: Chamada Inteligente */}
      {activeTab === "chamada" && (
        <EagleCard glow="cyan" className="p-6 flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <ShieldCheck className="text-cyan-400" size={20} /> Chamada Auditável em &lt; 90 Segundos
              </h2>
              <p className="text-xs text-zinc-300">
                Conferência rápida por assento ou atalho de teclado (<kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-cyan-300">Ctrl+Shift+C</kbd>).
              </p>
            </div>

            {/* Attendance Counters + 1-Click Confirm */}
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <span className="px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-bold">
                {presentCount} Presentes
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-red-500/10 text-red-400 border border-red-500/30 text-xs font-bold">
                {absentCount} Ausentes
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-300 border border-amber-500/30 text-xs font-bold">
                {justifiedCount} Justificados
              </span>

              <button
                type="button"
                data-testid="quick-confirm-attendance-btn"
                onClick={handleQuickConfirmAttendance}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-500/40 text-xs font-bold flex items-center gap-1.5 transition-all"
              >
                <Check size={14} />
                <span>Confirmar Chamada (&lt; 90s) • Ctrl+Shift+C</span>
              </button>
            </div>
          </div>

          {quickConfirmedBanner && (
            <div
              role="status"
              className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-xs text-emerald-200 font-semibold flex items-center justify-between"
            >
              <span>{quickConfirmedBanner}</span>
              <button
                type="button"
                onClick={() => setQuickConfirmedBanner(null)}
                className="text-emerald-300 hover:text-white underline text-[11px]"
              >
                Fechar
              </button>
            </div>
          )}

          {/* Student Roster Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {students.map((student) => (
              <div
                key={student.id}
                className={`p-3.5 rounded-2xl border transition-all flex flex-col gap-2.5 ${
                  student.status === "present"
                    ? "bg-emerald-950/20 border-emerald-500/30"
                    : student.status === "absent"
                    ? "bg-red-950/20 border-red-500/30"
                    : "bg-amber-950/20 border-amber-500/30"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 border border-white/10 text-zinc-300 font-bold">
                    CADEIRA {student.seat}
                  </span>
                  <span
                    className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                      student.status === "present"
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                        : student.status === "absent"
                        ? "bg-red-500/20 text-red-300 border border-red-500/40"
                        : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                    }`}
                  >
                    {student.status === "present"
                      ? `PRESENTE (${student.confidence}%)`
                      : student.status === "absent"
                      ? "AUSENTE"
                      : "JUSTIFICADO"}
                  </span>
                </div>

                <div className="flex flex-col">
                  <h4 className="text-sm font-bold text-white">{student.name}</h4>
                  <span className="text-[11px] text-zinc-300">
                    {student.status === "present"
                      ? `Entrada: ${student.entryTime}`
                      : student.status === "justified"
                      ? "Atestado Médico Anexado"
                      : "Sem registro de entrada"}
                  </span>
                </div>

                {/* Status Toggle Actions */}
                <div className="grid grid-cols-3 gap-1 pt-2 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => toggleStudentStatus(student.id, "present")}
                    className={`py-1 rounded text-[10px] font-bold uppercase transition-all ${
                      student.status === "present"
                        ? "bg-emerald-500 text-black font-black"
                        : "bg-white/5 text-zinc-300 hover:text-white"
                    }`}
                  >
                    P
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleStudentStatus(student.id, "absent")}
                    className={`py-1 rounded text-[10px] font-bold uppercase transition-all ${
                      student.status === "absent"
                        ? "bg-red-500 text-white font-black"
                        : "bg-white/5 text-zinc-300 hover:text-white"
                    }`}
                  >
                    F
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleStudentStatus(student.id, "justified")}
                    className={`py-1 rounded text-[10px] font-bold uppercase transition-all ${
                      student.status === "justified"
                        ? "bg-amber-500 text-black font-black"
                        : "bg-white/5 text-zinc-300 hover:text-white"
                    }`}
                  >
                    FJ
                  </button>
                </div>
              </div>
            ))}
          </div>
        </EagleCard>
      )}

      {/* Tab 2: Preview A4 em Tempo Real (Exam Foundry) */}
      {activeTab === "provas" && (
        <EagleCard glow="cyan" className="p-6 flex flex-col gap-6" data-testid="exam-foundry-a4-preview">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <FileText className="text-cyan-400" size={20} /> Exam Foundry • Preview A4 em Tempo Real (2 Colunas + OMR)
              </h2>
              <p className="text-xs text-zinc-300">
                Edite o cabeçalho e os itens à esquerda e visualize a folha oficial A4 diagramada em duas colunas à direita.
              </p>
            </div>
            <EliteButton variant="primary" size="sm" onClick={() => window.print()} className="gap-2">
              <Printer size={14} /> Imprimir Folha A4 & Cartão OMR
            </EliteButton>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Editor Panel */}
            <div className="lg:col-span-5 flex flex-col gap-4 p-4 rounded-2xl bg-white/5 border border-white/10">
              <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-300">
                1. Editor de Cabeçalho e Questões
              </h3>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-zinc-300">Título da Avaliação</label>
                <input
                  type="text"
                  value={examTitle}
                  onChange={(e) => setExamTitle(e.target.value)}
                  className="w-full bg-zinc-900 border border-white/15 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-cyan-400"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-zinc-300">Instruções ao Estudante</label>
                <textarea
                  rows={2}
                  value={examInstructions}
                  onChange={(e) => setExamInstructions(e.target.value)}
                  className="w-full bg-zinc-900 border border-white/15 rounded-xl p-2.5 text-xs text-white outline-none focus:border-cyan-400"
                />
              </div>

              {examQuestions.map((q, idx) => (
                <div key={q.id} className="flex flex-col gap-2 pt-3 border-t border-white/10">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white">Questão #{idx + 1}</span>
                    <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono text-[10px]">
                      {q.bncc} • Gabarito: {q.answer}
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    value={q.stem}
                    onChange={(e) => updateQuestionStem(q.id, e.target.value)}
                    className="w-full bg-zinc-900 border border-white/15 rounded-xl p-2.5 text-xs text-zinc-200 outline-none focus:border-cyan-400"
                  />
                </div>
              ))}
            </div>

            {/* Live A4 Sheet Preview (2 Columns + OMR Header) */}
            <div className="lg:col-span-7 bg-white text-zinc-900 rounded-2xl p-6 shadow-2xl border border-zinc-300 flex flex-col gap-4">
              <div className="border-b-2 border-zinc-900 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600">
                    COLÉGIO ÁQUILA PRO • SISTEMA SOBERANO DE AVALIAÇÃO (A4 2 COLUNAS)
                  </span>
                  <h3 className="text-sm font-black text-zinc-900">{examTitle}</h3>
                  <p className="text-[11px] text-zinc-700 mt-0.5">{examInstructions}</p>
                </div>
                <div className="border border-zinc-800 rounded p-2 text-[10px] font-mono bg-zinc-50 min-w-[140px]">
                  <div className="font-bold">CARTÃO OMR RÁPIDO</div>
                  <div>1: (A) (B) (C) (D)</div>
                  <div>2: (A) (B) (C) (D)</div>
                </div>
              </div>

              {/* Two-Column A4 Layout */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs leading-relaxed">
                {examQuestions.map((q, idx) => (
                  <div key={q.id} className="flex flex-col gap-2 border-b md:border-b-0 md:border-r last:border-r-0 border-zinc-200 pr-2 pb-2">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-zinc-900 uppercase">QUESTÃO 0{idx + 1}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-700">
                        {q.bncc}
                      </span>
                    </div>
                    <p className="text-zinc-800 text-[11px] text-justify">{q.stem}</p>
                    <ul className="flex flex-col gap-1 mt-1 text-[11px] text-zinc-900 font-medium">
                      {q.options.map((opt) => (
                        <li key={opt}>{opt}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </EagleCard>
      )}

      {/* Tab 3: Diário de Classe Digital */}
      {activeTab === "diario" && (
        <EagleCard glow="blue" className="p-6 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">Registro de Aula & Conteúdo BNCC</h2>
              <p className="text-xs text-zinc-300">
                Diário em conformidade com as diretrizes do Conselho Estadual de Educação.
              </p>
            </div>
            {diarioSigned ? (
              <span className="px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5">
                <Check size={14} /> Assinado Digitalmente (ICP-Brasil)
              </span>
            ) : (
              <EliteButton
                variant="primary"
                size="sm"
                onClick={() => setDiarioSigned(true)}
              >
                Assinar Diário
              </EliteButton>
            )}
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                Conteúdo Programático Ministrado
              </label>
              <textarea
                defaultValue="Primeira Lei da Termodinâmica: Conservação de Energia em transformações gasosas isobáricas, isocóricas e isotérmicas. Resolução comentada de exercícios estilo ENEM e demonstração experimental com simulador virtual."
                rows={3}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs sm:text-sm text-zinc-200 outline-none focus:border-blue-400 transition-all"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                Habilidades BNCC Trabalhadas
              </label>
              <div className="flex items-center gap-2 flex-wrap">
                {["EM13CNT301 - Ciclos Termodinâmicos", "EM13CNT302 - Máquinas Térmicas e Eficiência", "EM13MAT305 - Análise Gráfica P-V"].map((code) => (
                  <span
                    key={code}
                    className="px-3 py-1 rounded-lg bg-blue-500/10 border border-blue-500/30 text-xs font-medium text-blue-300"
                  >
                    {code}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                Tarefas & Estudos Complementares
              </label>
              <input
                type="text"
                defaultValue="Resolver exercícios 1 a 8 da página 142 do Livro Didático. Lista TRI disponível no Portal do Aluno."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs sm:text-sm text-zinc-200 outline-none focus:border-blue-400 transition-all"
              />
            </div>
          </div>
        </EagleCard>
      )}

      {/* Tab 4: Radar de Atenção Pedagógica */}
      {activeTab === "radar" && (
        <EagleCard glow="amber" className="p-6 flex flex-col gap-5">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <AlertTriangle className="text-amber-400" size={20} /> Alunos que Requerem Intervenção
            </h2>
            <p className="text-xs text-zinc-300">
              Inferências geradas pelo Córtex Pedagógico a partir de telemetria de sala e notas recentes.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            {[
              {
                name: "Lucas Andrade",
                issue: "Oscilação de foco identificada nas últimas 2 semanas em Termodinâmica.",
                suggestion: "Aplicar lista de reforço conceitual sobre Trabalho em Processos Gasosos.",
                severity: "Média",
              },
              {
                name: "Sofia Costa",
                issue: "Dúvidas recorrentes em cálculo de rendimento de máquinas térmicas.",
                suggestion: "Agendar monitoria com o Tutor IA Áquila focado em ciclo de Carnot.",
                severity: "Baixa",
              },
              {
                name: "Matheus Lima",
                issue: "2 faltas consecutivas sem justificativa prévia (Radar LDB).",
                suggestion: "Notificar coordenação pedagógica para contato com a família.",
                severity: "Alta",
              },
            ].map((item) => (
              <div
                key={item.name}
                className="p-4 rounded-xl bg-white/5 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-white">{item.name}</h4>
                    <span
                      className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                        item.severity === "Alta"
                          ? "bg-red-500/20 text-red-300 border border-red-500/40"
                          : item.severity === "Média"
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                          : "bg-blue-500/20 text-blue-300 border border-blue-500/40"
                      }`}
                    >
                      Gravidade: {item.severity}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-300">{item.issue}</p>
                  <p className="text-xs text-cyan-300/90">💡 Ação recomendada: {item.suggestion}</p>
                </div>

                <EliteButton variant="secondary" size="sm" className="whitespace-nowrap">
                  Aplicar Ação
                </EliteButton>
              </div>
            ))}
          </div>
        </EagleCard>
      )}

      {/* Tab 5: Notas Bimestrais */}
      {activeTab === "notas" && (
        <EagleCard glow="purple" className="p-6 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">Planilha de Notas • 2º Ano B (Física)</h2>
              <p className="text-xs text-zinc-300">Edição e sincronização direta com a base de dados central.</p>
            </div>
            <EliteButton variant="primary" size="sm">
              Salvar Alterações
            </EliteButton>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-white/10 text-[11px] uppercase tracking-wider text-zinc-300">
                  <th className="py-3 px-4 font-bold">Aluno</th>
                  <th className="py-3 px-3 text-center font-bold">Av. 1 (Peso 3)</th>
                  <th className="py-3 px-3 text-center font-bold">Av. 2 (Peso 4)</th>
                  <th className="py-3 px-3 text-center font-bold">Simulado (Peso 3)</th>
                  <th className="py-3 px-3 text-center font-bold">Média Atual</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {[
                  { name: "Lucas Andrade", n1: 8.5, n2: 9.0, n3: 9.2, med: 8.9 },
                  { name: "Sofia Costa", n1: 8.0, n2: 7.5, n3: 8.0, med: 7.8 },
                  { name: "Gabriel Santos", n1: 7.0, n2: 8.0, n3: 7.5, med: 7.6 },
                  { name: "Helena Oliveira", n1: 9.5, n2: 9.8, n3: 9.5, med: 9.6 },
                ].map((row) => (
                  <tr key={row.name} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 px-4 font-semibold text-white">{row.name}</td>
                    <td className="py-3 px-3 text-center text-zinc-300">{row.n1.toFixed(1)}</td>
                    <td className="py-3 px-3 text-center text-zinc-300">{row.n2.toFixed(1)}</td>
                    <td className="py-3 px-3 text-center text-zinc-300">{row.n3.toFixed(1)}</td>
                    <td className="py-3 px-3 text-center font-bold text-cyan-300">{row.med.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </EagleCard>
      )}
    </div>
  );
}
