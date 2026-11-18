"use client";

import { usePortalWorkspace, type StudentWorkspaceData } from "@/lib/usePortalData";
import { PortalSyncBanner, PropagationStatusBadge } from "@/components/PortalSyncBanner";
import { StudentPracticeDrawer, type StudentPracticeMode } from "@/components/portals/StudentPracticeDrawer";
import { AquilaCircuitLab } from "@/components/simulations/AquilaCircuitLab";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Atom, Sparkles, Brain, Trophy, Flame, Target, BookOpen, Clock,
  CheckCircle2, Send, Zap, AlertTriangle, ShieldAlert, Lock,
  Calendar, ShieldCheck, Play, Pause, RotateCcw, Award
} from "lucide-react";
import { EagleCard } from "@/components/ui/EagleCard";
import { EliteButton } from "@/components/ui/EliteButton";

interface ChatMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: string;
}

export default function PortalAluno() {
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return new URLSearchParams(window.location.search).get("studentId");
  });
  const workspaceEndpoint = selectedStudentId
    ? `/api/portal/aluno?studentId=${encodeURIComponent(selectedStudentId)}`
    : "/api/portal/aluno";
  const { data: workspace, loading, syncError, reload, mutate } =
    usePortalWorkspace<StudentWorkspaceData>(workspaceEndpoint);
  const [activePracticeModal, setActivePracticeModal] = useState<StudentPracticeMode | null>(null);
  const [missionProgressOverrides, setMissionProgressOverrides] = useState<Record<string, number>>({});
  const [sessionXpBonus, setSessionXpBonus] = useState(0);
  const [studySessionError, setStudySessionError] = useState<string | null>(null);
  const [studySessionNotice, setStudySessionNotice] = useState<string | null>(null);
  const [tutorError, setTutorError] = useState<string | null>(null);
  const [contestingGradeId, setContestingGradeId] = useState<string | null>(null);
  const [gradeContestReason, setGradeContestReason] = useState("");
  const [gradeContestError, setGradeContestError] = useState<string | null>(null);
  const [gradeContestSubmitting, setGradeContestSubmitting] = useState(false);
  const [localGradeContests, setLocalGradeContests] = useState<
    Record<string, { status: string; reason: string; commandId?: string; propagationStatus: string }>
  >({});
  const [activeTab, setActiveTab] = useState<"missoes" | "tutor" | "boletim" | "horarios" | "habilidades" | "simulacoes">("missoes");
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      sender: "ai",
      text: "Olá! Sou seu Tutor Socrático Áquila Pro (apoio pedagógico guiado em conformidade com o Parecer CNE/CP nº 15/2026). Como posso te ajudar hoje?",
      timestamp: "07:15",
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);

  const handleResetStudentQuery = () => {
    setSelectedStudentId(null);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.delete("studentId");
      window.history.replaceState(null, "", url.toString());
    }
  };

  // Modo Kumon 3 min (180 segundos) & Gamificação Leve
  const [kumonSeconds, setKumonSeconds] = useState(180);
  const [kumonRunning, setKumonRunning] = useState(false);
  const [streakDays, setStreakDays] = useState(12);
  const [xpPoints, setXpPoints] = useState(2680);

  useEffect(() => {
    if (!kumonRunning) return;
    const timer = setInterval(() => {
      setKumonSeconds((prev) => {
        if (prev <= 1) {
          setKumonRunning(false);
          setStreakDays((d) => d + 1);
          setXpPoints((xp) => xp + 50);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [kumonRunning]);

  const formatKumonTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60).toString().padStart(2, "0");
    const secs = (totalSec % 60).toString().padStart(2, "0");
    return `${mins}:${secs}`;
  };

  const [quests] = useState([
    {
      id: "q1",
      title: "Simulado Express: Eletrodinâmica & Leis de Ohm",
      desc: "5 questões estilo TRI do ENEM",
      reward: "+150 XP • 40 Áquila Coins",
      progress: 60,
      completed: false,
    },
    {
      id: "q2",
      title: "Revisão Espaçada SRS: Biologia Celular",
      desc: "12 flashcards pendentes para consolidação",
      reward: "+80 XP • 20 Áquila Coins",
      progress: 100,
      completed: true,
    },
    {
      id: "q3",
      title: "Ensaio Redação 1000: 'Inteligência Artificial & Ética'",
      desc: "Análise de repertório sociocultural e proposta de intervenção",
      reward: "+250 XP • 60 Áquila Coins",
      progress: 25,
      completed: false,
    },
  ]);

  const grades = [
    { subject: "Matemática & Raciocínio", b1: 9.2, b2: 8.8, b3: 9.5, b4: 9.0, freq: "98%", status: "Ótimo" },
    { subject: "Física Aplicada", b1: 8.5, b2: 7.8, b3: 8.4, b4: 8.9, freq: "96%", status: "Bom" },
    { subject: "Química & Termoquímica", b1: 8.0, b2: 8.5, b3: 9.0, b4: 8.8, freq: "95%", status: "Ótimo" },
    { subject: "Redação Dissertativa", b1: 9.6, b2: 9.2, b3: 9.8, b4: 9.6, freq: "100%", status: "Destaque" },
    { subject: "Biologia Molecular", b1: 8.9, b2: 9.1, b3: 9.0, b4: 9.4, freq: "97%", status: "Ótimo" },
    { subject: "História & Humanidades", b1: 9.0, b2: 9.4, b3: 8.7, b4: 9.1, freq: "98%", status: "Ótimo" },
  ];

  const schedule = [
    { time: "07:00 - 07:50", subject: "Matemática", room: "SALA 12", teacher: "Prof. Ricardo", current: false },
    { time: "07:50 - 08:40", subject: "Matemática", room: "SALA 12", teacher: "Prof. Ricardo", current: false },
    { time: "08:40 - 09:30", subject: "Física Aplicada", room: "LAB 03", teacher: "Profª Helena", current: true },
    { time: "09:50 - 10:40", subject: "Redação & Linguagens", room: "SALA 12", teacher: "Profª Clara", current: false },
    { time: "10:40 - 11:30", subject: "Biologia", room: "LAB 01", teacher: "Prof. Marcos", current: false },
    { time: "11:30 - 12:20", subject: "Química", room: "LAB 02", teacher: "Profª Joana", current: false },
  ];

  const hasServerWorkspace = workspace !== null;
  const isAccessBlocked = Boolean(syncError) && workspace === null;
  const isNoActiveStudent = workspace !== null && workspace.student === null;
  const isOfflinePreview = workspace === null && !syncError;

  const effectiveStudentName =
    workspace?.student?.name ??
    (isOfflinePreview ? "Lucas Andrade" : "Estudante autenticado");
  const effectiveInitials = effectiveStudentName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0])
    .join("") || "AL";
  const effectiveClassName =
    workspace?.activeClass?.name ??
    (isOfflinePreview ? "3º Ano A" : "Turma não vinculada");
  const activeClassGrade = workspace?.activeClass?.grade;
  const isEarlyStageAiBlocked =
    typeof activeClassGrade === "number"
      ? activeClassGrade <= 5
      : /\b(infantil|creche|pr[eé]-?escola|ber[cç][aá]rio|maternal|jardim)\b/i.test(effectiveClassName) ||
        (!/\b(ensino\s+m[eé]dio|\bem\b|s[eé]rie)\b/i.test(effectiveClassName) &&
          (/\b[45][º°]?\s*ano\b/i.test(effectiveClassName) ||
            (/\b[1-3][º°]?\s*ano\b/i.test(effectiveClassName) &&
              /\b(fundamental|fund(\.|amental)?(\s*i)?|ef(\s*i)?)\b/i.test(effectiveClassName))));
  const aiPolicyBlocked =
    workspace?.aiPolicy !== undefined ? workspace.aiPolicy.blocked : isEarlyStageAiBlocked;
  const aiPolicyReason = workspace?.aiPolicy?.reason ?? null;

  const effectiveReg =
    workspace?.student?.registrationNumber ??
    (isOfflinePreview ? "2026-0842" : "—");
  const effectiveStreak = hasServerWorkspace
    ? workspace.streakDays
    : isOfflinePreview
      ? streakDays
      : 0;
  const effectiveCoins = hasServerWorkspace
    ? workspace.coins
    : isOfflinePreview
      ? 1420
      : 0;
  const effectiveXp = hasServerWorkspace
    ? workspace.xpPoints
    : isOfflinePreview
      ? xpPoints + sessionXpBonus
      : 0;

  const baseQuests = hasServerWorkspace
    ? workspace.missions.map((m) => ({
        id: m.id,
        title: m.title,
        desc: m.description,
        reward: `+${m.rewardXp} XP • ${m.rewardCoins} Áquila Coins`,
        progress: m.progress,
        completed: m.completed,
      }))
    : isOfflinePreview
      ? quests
      : [];

  const effectiveMissions = baseQuests.map((q) => {
    const progress = Math.min(100, missionProgressOverrides[q.id] ?? q.progress);
    return {
      ...q,
      progress,
      completed: q.completed || progress >= 100,
    };
  });

  const publishedDbGrades = hasServerWorkspace
    ? workspace.grades.filter((g) => g.status === "published")
    : [];
  const effectiveGrades = hasServerWorkspace
    ? publishedDbGrades.map((g) => {
        const override = localGradeContests[g.id];
        return {
          id: g.id,
          subject: g.subject,
          b1: g.score,
          b2: g.score,
          b3: g.score,
          b4: g.score,
          maxScore: g.maxScore || 10,
          freq: "—",
          status: g.score >= 8.5 ? "Ótimo" : "Publicada",
          propagationStatus: override?.propagationStatus ?? g.propagationStatus ?? null,
          edgeCommandId: override?.commandId ?? g.edgeCommandId ?? null,
          contestationStatus: override?.status ?? g.contestationStatus ?? "none",
          contestationReason: override?.reason ?? g.contestationReason ?? null,
        };
      })
    : isOfflinePreview
      ? grades.map((g, idx) => ({
          ...g,
          id: `mock-${idx}`,
          maxScore: 10,
          propagationStatus: null as string | null,
          edgeCommandId: null as string | null,
          contestationStatus: localGradeContests[`mock-${idx}`]?.status ?? "none",
          contestationReason: localGradeContests[`mock-${idx}`]?.reason ?? null,
        }))
      : [];

  const effectiveAverage =
    effectiveGrades.length > 0
      ? effectiveGrades.reduce((sum, g) => sum + g.b4, 0) / effectiveGrades.length
      : null;

  const effectiveSchedule = hasServerWorkspace
    ? workspace.schedules.map((s, idx) => ({
        time: s.timeSlot,
        subject: s.subject,
        room: s.room,
        teacher: s.teacherName,
        current: idx === 0,
      }))
    : isOfflinePreview
      ? schedule
      : [];

  const handleAdvanceMission = async (missionId: string, currentProgress: number) => {
    const nextProgress = Math.min(100, currentProgress + 25);
    setMissionProgressOverrides((prev) => ({ ...prev, [missionId]: nextProgress }));
    const res = await mutate<{ progress?: number; completed?: boolean }>(
      "advanceMission",
      { missionId, delta: 25 }
    );
    if (res.ok) {
      await reload();
    } else if (res.offlineFallback) {
      setSessionXpBonus((x) => x + 25);
    } else {
      setMissionProgressOverrides((prev) => {
        const next = { ...prev };
        delete next[missionId];
        return next;
      });
      setStudySessionError(res.error ?? "Falha ao atualizar missão.");
    }
  };

  const handleSubmitGradeContestation = async (gradeId: string) => {
    const trimmed = gradeContestReason.trim();
    if (trimmed.length < 10) {
      setGradeContestError("Descreva o motivo da contestação com pelo menos 10 caracteres.");
      return;
    }
    setGradeContestError(null);
    setGradeContestSubmitting(true);
    const res = await mutate<{ commandId?: string; syncStatus?: string }>("contestGrade", {
      gradeId,
      reason: trimmed,
      ...(selectedStudentId ? { studentId: selectedStudentId } : {}),
    });
    setGradeContestSubmitting(false);
    if (!res.ok && !res.offlineFallback) {
      setGradeContestError(res.error ?? "Não foi possível enviar a contestação da nota.");
      return;
    }
    setLocalGradeContests((prev) => ({
      ...prev,
      [gradeId]: {
        status: "contested",
        reason: trimmed,
        commandId: res.data?.commandId,
        propagationStatus: res.data?.syncStatus || "pending_at_edge",
      },
    }));
    setContestingGradeId(null);
    setGradeContestReason("");
  };

  const handleSendMessage = async () => {
    if (aiPolicyBlocked) {
      setTutorError(
        aiPolicyReason ||
          "Acesso ao Tutor IA bloqueado pela política CNE/CP nº 15/2026 para esta faixa etária/etapa."
      );
      return;
    }
    const promptText = chatInput.trim();
    if (!promptText) return;
    setTutorError(null);
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: "user",
      text: promptText,
      timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
    };
    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput("");
    setIsTyping(true);

    const res = await mutate<{
      earnedXp?: number;
      reply?: string;
      pedagogicalHintMode?: string;
    }>("logStudySession", {
      mode: "socratic_tutor",
      durationSeconds: 120,
      topic: promptText,
      ...(selectedStudentId ? { studentId: selectedStudentId } : {}),
    });

    if (!res.ok && !res.offlineFallback) {
      setIsTyping(false);
      setTutorError(
        res.error ??
          "Acesso bloqueado ou falha ao consultar o Tutor Socrático no servidor."
      );
      return;
    }

    let fallbackReply = `Excelente pergunta, ${effectiveStudentName.split(" ")[0]}! Vamos decompor esse conceito passo a passo usando a metodologia de aprendizado ativo do Áquila Pro.`;
    if (promptText.toLowerCase().includes("física") || promptText.toLowerCase().includes("termo")) {
      fallbackReply = "Na Primeira Lei da Termodinâmica (ΔU = Q - W), lembre-se: calor fornecido ao sistema (Q > 0) aumenta a energia interna, enquanto o trabalho realizado pelo gás em expansão (W > 0) consome energia. Quer praticar uma questão do ENEM sobre isso?";
    } else if (promptText.toLowerCase().includes("redação")) {
      fallbackReply = "Para a proposta de intervenção nota 200 no ENEM, garanta os 5 elementos: Agente, Ação, Meio/Modo, Efeito e Detalhamento. Exemplo de detalhamento: especificar o papel do Ministério da Educação via plataformas digitais.";
    } else if (promptText.toLowerCase().includes("matemática")) {
      fallbackReply = "Em funções quadráticas, o vértice da parábola dá o ponto máximo ou mínimo: Xv = -b/(2a) e Yv = -Δ/(4a). Muito útil para otimização de custos e trajetórias balísticas no ENEM!";
    }

    if (res.ok) {
      await reload();
    } else if (res.offlineFallback) {
      setSessionXpBonus((x) => x + 20);
    }

    setChatMessages((prev) => [
      ...prev,
      {
        id: (Date.now() + 1).toString(),
        sender: "ai",
        text: res.ok && res.data?.reply ? res.data.reply : fallbackReply,
        timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
    setIsTyping(false);
  };

  const handleChipClick = (text: string) => {
    setChatInput(text);
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <PortalSyncBanner
        portalLabel="Portal do Estudante"
        loading={loading}
        syncError={syncError}
        syncedFromDb={Boolean(workspace)}
        syncState={workspace?.syncStatus?.state}
        pendingCommandCount={workspace?.syncStatus?.pendingCommandCount}
        lastSyncedAt={workspace?.syncStatus?.lastSyncedAt}
        staleReason={workspace?.syncStatus?.staleReason}
        onRefresh={reload}
        complianceNote="ECA Digital (Lei 15.211/2025) & CNE 2026 • Apenas notas revisadas por docentes são exibidas"
      />

      {isAccessBlocked && (
        <EagleCard
          glow="amber"
          className="p-6 border-red-500/40 bg-red-950/20 flex flex-col gap-4"
          data-testid="student-access-blocked"
        >
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-black uppercase tracking-wider text-red-300">
              Acesso Restrito • Proteção de Dados do Estudante
            </span>
            <h1 className="text-xl font-black text-white">
              Consulta não autorizada para este estudante ou sessão expirada
            </h1>
            <p className="text-sm text-zinc-200">{syncError}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {selectedStudentId && (
              <EliteButton variant="primary" size="sm" onClick={handleResetStudentQuery}>
                Carregar Meu Perfil
              </EliteButton>
            )}
            <EliteButton variant="secondary" size="sm" onClick={() => void reload()}>
              Tentar Novamente
            </EliteButton>
            <Link
              href="/login"
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold text-white no-underline"
            >
              Ir para Login
            </Link>
          </div>
        </EagleCard>
      )}

      {!isAccessBlocked && isNoActiveStudent && (
        <EagleCard
          glow="amber"
          className="p-6 border-amber-500/40 bg-amber-950/20 flex flex-col gap-3"
          data-testid="student-no-active-profile"
        >
          <span className="text-[11px] font-black uppercase tracking-wider text-amber-300">
            Matrícula Inativa ou Sem Vínculo
          </span>
          <h1 className="text-xl font-black text-white">
            Nenhum perfil escolar ativo encontrado para esta conta
          </h1>
          <p className="text-sm text-zinc-200">
            Solicite à secretaria ou coordenação a regularização da matrícula para acessar boletim, horários e missões.
          </p>
        </EagleCard>
      )}

      {!isAccessBlocked && !isNoActiveStudent && (
        <>
      {/* Aluno Hero HUD */}
      <EagleCard glow="purple" className="border-purple-500/30 bg-purple-950/10 p-5 sm:p-7">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          {/* Identity & Avatar */}
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="relative">
              {/* Retângulo Soberano ("Sem Bolinha") */}
              <div className="w-14 h-16 sm:w-16 sm:h-20 rounded-xl bg-gradient-to-br from-purple-600 via-indigo-600 to-cyan-500 p-0.5 shadow-xl shadow-purple-950/60">
                <div className="w-full h-full rounded-[10px] bg-zinc-950 flex items-center justify-center overflow-hidden">
                  <div className="text-xl sm:text-2xl font-black text-purple-300">{effectiveInitials}</div>
                </div>
              </div>
              <div className="absolute -bottom-1.5 -right-1.5 px-1.5 py-0.5 rounded bg-emerald-500 text-[9px] font-black tracking-wider text-black uppercase">
                PRESENTE
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  {effectiveStudentName}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/40">
                  Estudante Áquila
                </span>
              </div>
              <p className="text-xs sm:text-sm text-zinc-300 font-medium">
                {effectiveClassName} •{" "}
                {workspace?.aiPolicy?.stage ?? (isOfflinePreview ? "Ensino Médio Integral" : "Educação Básica")}{" "}
                • Matrícula #{effectiveReg}
              </p>
              <div className="flex items-center gap-3 text-[11px] text-zinc-300 mt-1">
                <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                  <ShieldCheck size={13} />{" "}
                  {workspace?.latestAttendance
                    ? `Última presença: ${workspace.latestAttendance.date} (${
                        workspace.latestAttendance.detectedBy === "qr_badge"
                          ? "Crachá QR"
                          : "Chamada Nominal"
                      })`
                    : isOfflinePreview
                      ? "Portaria Sul • 07:12 (Presença Confirmada)"
                      : "Nenhum registro recente de portaria"}
                </span>
                <span>•</span>
                <span>
                  Média Geral:{" "}
                  <strong className="text-white">
                    {effectiveAverage !== null ? effectiveAverage.toFixed(1) : "—"}
                  </strong>
                </span>
              </div>
            </div>
          </div>

          {/* Gamification Stats Strip */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-6 w-full lg:w-auto justify-between lg:justify-end border-t lg:border-t-0 border-white/10 pt-4 lg:pt-0">
            <div className="flex flex-col items-center px-3 py-2 rounded-xl bg-white/5 border border-white/5 min-w-[70px]">
              <span className="text-xs text-amber-400 font-bold flex items-center gap-1">
                <Flame size={14} className="animate-pulse" /> {effectiveStreak} Dias
              </span>
              <span className="text-[10px] text-zinc-300 uppercase font-semibold">Streak</span>
            </div>

            <div className="flex flex-col items-center px-3 py-2 rounded-xl bg-white/5 border border-white/5 min-w-[80px]">
              <span className="text-xs text-cyan-400 font-bold flex items-center gap-1">
                <Zap size={14} /> {effectiveCoins.toLocaleString("pt-BR")}
              </span>
              <span className="text-[10px] text-zinc-300 uppercase font-semibold">Coins</span>
            </div>

            {/* XP Bar */}
            <div className="flex flex-col gap-1 min-w-[155px] sm:min-w-[185px]">
              <div className="flex justify-between gap-2 text-[11px]">
                <span className="text-zinc-300 font-medium">Progresso XP</span>
                <span className="text-purple-300 font-bold">
                  {effectiveXp.toLocaleString("pt-BR")} / 3.000
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-purple-500 to-cyan-400 w-[89%]" />
              </div>
              <span className="text-[10px] text-zinc-300 text-right">
                {Math.max(0, 3000 - effectiveXp)} XP para o próximo nível
              </span>
            </div>
          </div>
        </div>
      </EagleCard>

      {/* Modo Kumon 3 Minutos + Conquistas (Gamificação Leve & Foco) */}
      <EagleCard
        glow="cyan"
        className="p-5 border-cyan-500/30 bg-cyan-950/10 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
        data-testid="kumon-timer-card"
      >
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
              Modo Kumon 3 min
            </span>
            <h2 className="text-sm sm:text-base font-bold text-white">
              Sprint Diário de Concentração Rápida (Zero Sobrecarga)
            </h2>
          </div>
          <p className="text-xs text-zinc-300">
            Pratique 3 minutos de exercícios focados no seu nível exato para manter o hábito diário e ganhar +50 XP (atividade sem IA, liberada em todas as etapas).
          </p>
          <div className="flex items-center gap-2 flex-wrap pt-1">
            {[
              "🏅 Mestre do Foco 3min",
              `🔥 ${effectiveStreak} Dias de Hábito`,
              isOfflinePreview ? "⚡ Termodinâmica Nível 1" : "📚 Estudo Guiado Offline-First",
            ].map((badge) => (
              <span
                key={badge}
                className="text-[11px] font-semibold px-2.5 py-0.5 rounded-lg bg-white/5 border border-white/10 text-zinc-200 flex items-center gap-1"
              >
                <Award size={12} className="text-amber-400" /> {badge}
              </span>
            ))}
          </div>
          {studySessionError && (
            <div
              role="alert"
              className="mt-1 p-2 rounded-lg bg-rose-500/15 border border-rose-500/40 text-xs text-rose-200 flex items-center gap-1.5"
            >
              <AlertTriangle size={13} />
              <span>{studySessionError}</span>
            </div>
          )}
          {studySessionNotice && (
            <div
              role="status"
              className="mt-1 p-2 rounded-lg bg-emerald-500/15 border border-emerald-500/40 text-xs text-emerald-200"
            >
              ✓ {studySessionNotice}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 bg-zinc-950/80 border border-white/15 rounded-2xl px-4 py-3 self-start lg:self-center flex-wrap">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold text-zinc-300">Timer Kumon</span>
            <span
              data-testid="kumon-countdown-display"
              className="text-2xl font-black font-mono text-cyan-300"
            >
              {formatKumonTime(kumonSeconds)}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setKumonRunning((r) => !r)}
              aria-label={kumonRunning ? "Pausar Modo Kumon" : "Iniciar Modo Kumon"}
              className="px-3 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-black flex items-center gap-1.5 transition focus-visible:ring-2 focus-visible:ring-white outline-none"
            >
              {kumonRunning ? <Pause size={14} /> : <Play size={14} />}
              <span>{kumonRunning ? "Pausar" : "Iniciar"}</span>
            </button>
            <button
              type="button"
              onClick={async () => {
                setStudySessionError(null);
                setStudySessionNotice(null);
                const elapsed = Math.max(10, 180 - kumonSeconds || 180);
                setKumonRunning(false);
                setKumonSeconds(180);
                const res = await mutate<{ earnedXp?: number }>("logStudySession", {
                  mode: "focus_sprint_3min",
                  durationSeconds: elapsed,
                  topic: "Sprint Kumon 3 min concluído",
                  ...(selectedStudentId ? { studentId: selectedStudentId } : {}),
                });
                if (res.ok) {
                  setStudySessionNotice(
                    `Sprint de foco concluído (+${res.data?.earnedXp ?? 50} XP registrados no servidor).`
                  );
                  await reload();
                } else if (res.offlineFallback) {
                  setSessionXpBonus((x) => x + 50);
                  setStudySessionNotice("Sprint de foco registrado em prévia local (+50 XP).");
                } else {
                  setStudySessionError(res.error ?? "Falha ao registrar sprint de foco.");
                }
              }}
              aria-label="Registrar Sprint Kumon"
              className="px-3 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-200 text-xs font-bold transition"
            >
              Concluir Sprint (+50 XP)
            </button>
            <button
              type="button"
              onClick={() => {
                setKumonRunning(false);
                setKumonSeconds(180);
              }}
              aria-label="Reiniciar timer para 3 minutos"
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-zinc-200 transition focus-visible:ring-2 focus-visible:ring-cyan-400 outline-none"
              title="Reiniciar 03:00"
            >
              <RotateCcw size={14} />
            </button>
          </div>
        </div>
      </EagleCard>

      {/* Navigation Tabs (WCAG AA Accessible) */}
      <div
        role="tablist"
        aria-label="Navegação do Portal do Aluno"
        className="flex items-center gap-2 border-b border-white/10 pb-2 overflow-x-auto"
      >
        <button
          role="tab"
          aria-selected={activeTab === "missoes"}
          onClick={() => setActiveTab("missoes")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap focus-visible:ring-2 focus-visible:ring-purple-400 outline-none ${
            activeTab === "missoes"
              ? "bg-purple-600/30 text-purple-200 border border-purple-500/40 shadow-lg shadow-purple-900/20"
              : "text-zinc-300 hover:text-white hover:bg-white/5"
          }`}
        >
          <Target size={16} /> Missões & Quests
        </button>

        <button
          role="tab"
          aria-selected={activeTab === "tutor"}
          onClick={() => setActiveTab("tutor")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap focus-visible:ring-2 focus-visible:ring-purple-400 outline-none ${
            activeTab === "tutor"
              ? "bg-purple-600/30 text-purple-200 border border-purple-500/40 shadow-lg shadow-purple-900/20"
              : "text-zinc-300 hover:text-white hover:bg-white/5"
          }`}
        >
          <Brain size={16} /> Tutor IA Áquila
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
        </button>

        <button
          role="tab"
          aria-selected={activeTab === "boletim"}
          onClick={() => setActiveTab("boletim")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap focus-visible:ring-2 focus-visible:ring-purple-400 outline-none ${
            activeTab === "boletim"
              ? "bg-purple-600/30 text-purple-200 border border-purple-500/40 shadow-lg shadow-purple-900/20"
              : "text-zinc-300 hover:text-white hover:bg-white/5"
          }`}
        >
          <BookOpen size={16} /> Boletim & Desempenho
        </button>

        <button
          role="tab"
          aria-selected={activeTab === "horarios"}
          onClick={() => setActiveTab("horarios")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap focus-visible:ring-2 focus-visible:ring-purple-400 outline-none ${
            activeTab === "horarios"
              ? "bg-purple-600/30 text-purple-200 border border-purple-500/40 shadow-lg shadow-purple-900/20"
              : "text-zinc-300 hover:text-white hover:bg-white/5"
          }`}
        >
          <Calendar size={16} /> Grade Horária
        </button>

        <button
          role="tab"
          aria-selected={activeTab === "habilidades"}
          onClick={() => setActiveTab("habilidades")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap focus-visible:ring-2 focus-visible:ring-cyan-400 outline-none ${
            activeTab === "habilidades"
              ? "bg-cyan-600/30 text-cyan-200 border border-cyan-500/40 shadow-lg shadow-cyan-900/20"
              : "text-zinc-300 hover:text-white hover:bg-white/5"
          }`}
        >
          <Atom size={16} className="text-cyan-400" /> Trilha BNCC & Mentores
          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-cyan-400/20 text-cyan-300 border border-cyan-400/40">Novo</span>
        </button>

        <button
          role="tab"
          aria-selected={activeTab === "simulacoes"}
          onClick={() => setActiveTab("simulacoes")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap focus-visible:ring-2 focus-visible:ring-amber-400 outline-none ${
            activeTab === "simulacoes"
              ? "bg-amber-500/20 text-amber-200 border border-amber-500/40 shadow-lg shadow-amber-900/20"
              : "text-zinc-300 hover:text-white hover:bg-white/5"
          }`}
        >
          <Zap size={16} className="text-amber-400" /> Áquila Lab 3D
          <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
            ENEM &amp; Física
          </span>
        </button>
      </div>

      {/* Tab 1: Missões & Quests */}
      {activeTab === "missoes" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 flex flex-col gap-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Zap className="text-amber-400" size={18} /> Missões do Dia (Aceleração Pedagógica)
            </h2>

            <div className="flex flex-col gap-3">
              {effectiveMissions.length === 0 ? (
                <EagleCard glow="purple" className="p-5 text-xs text-zinc-300">
                  Nenhuma missão atribuída pelo docente até o momento. Use o Modo Kumon 3 min acima para manter seu hábito diário.
                </EagleCard>
              ) : (
                effectiveMissions.map((q) => (
                  <EagleCard
                    key={q.id}
                    glow={q.completed ? "cyan" : "purple"}
                    className={`p-5 transition-all ${
                      q.completed ? "opacity-75 border-emerald-500/30" : "hover:border-purple-500/50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex flex-col gap-1.5 flex-1">
                        <div className="flex items-center gap-2">
                          {q.completed ? (
                            <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0" />
                          ) : (
                            <Target size={16} className="text-purple-400 flex-shrink-0" />
                          )}
                          <h3 className="text-sm font-bold text-white">{q.title}</h3>
                        </div>
                        <p className="text-xs text-zinc-300">{q.desc}</p>
                        <span className="text-[11px] font-semibold text-amber-400 mt-1">{q.reward}</span>

                        {/* Progress bar */}
                        <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden mt-2">
                          <div
                            className={`h-full rounded-full ${
                              q.completed ? "bg-emerald-400" : "bg-gradient-to-r from-purple-500 to-indigo-400"
                            }`}
                            style={{ width: `${q.progress}%` }}
                          />
                        </div>
                      </div>

                      <EliteButton
                        variant={q.completed ? "secondary" : "primary"}
                        size="sm"
                        disabled={q.completed}
                        onClick={() => void handleAdvanceMission(q.id, q.progress)}
                        className="self-center"
                      >
                        {q.completed ? "Concluída" : "Praticar"}
                      </EliteButton>
                    </div>
                  </EagleCard>
                ))
              )}
            </div>
          </div>

          {/* Side Badges & Progress (Sem ranqueamento comparativo punitivo em produção) */}
          <div className="flex flex-col gap-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Trophy className="text-amber-400" size={18} />{" "}
              {isOfflinePreview ? `Ranking da Turma (${effectiveClassName})` : "Minha Evolução Diária"}
            </h2>

            <EagleCard glow="amber" className="p-5 flex flex-col gap-4">
              {isOfflinePreview ? (
                <>
                  <div className="flex items-center justify-between pb-3 border-b border-white/10">
                    <span className="text-xs font-bold text-zinc-300">POSIÇÃO ATUAL</span>
                    <span className="text-sm font-black text-amber-400">#4 LUGAR • {effectiveXp.toLocaleString("pt-BR")} XP</span>
                  </div>

                  <div className="flex flex-col gap-2.5">
                    {[
                      { pos: 1, name: "Sofia Costa", xp: "3.120 XP", badge: "🥇" },
                      { pos: 2, name: "Gabriel Santos", xp: "2.940 XP", badge: "🥈" },
                      { pos: 3, name: "Helena Oliveira", xp: "2.810 XP", badge: "🥉" },
                      { pos: 4, name: `${effectiveStudentName} (Você)`, xp: `${effectiveXp.toLocaleString("pt-BR")} XP`, badge: "⭐", isUser: true },
                      { pos: 5, name: "Matheus Lima", xp: "2.450 XP", badge: "" },
                    ].map((item) => (
                      <div
                        key={item.pos}
                        className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs ${
                          item.isUser
                            ? "bg-purple-600/20 border border-purple-500/40 text-purple-200 font-bold"
                            : "bg-white/5 text-zinc-200"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="w-5 text-center font-bold text-zinc-300">{item.badge || item.pos}</span>
                          <span>{item.name}</span>
                        </div>
                        <span className="font-semibold text-zinc-300">{item.xp}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between pb-3 border-b border-white/10">
                    <span className="text-xs font-bold text-zinc-300">XP ACUMULADO</span>
                    <span className="text-sm font-black text-amber-400">
                      {effectiveXp.toLocaleString("pt-BR")} XP
                    </span>
                  </div>
                  <div className="flex flex-col gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-300">
                      Sessões Recentes
                    </span>
                    {workspace?.recentSessions && workspace.recentSessions.length > 0 ? (
                      workspace.recentSessions.slice(0, 4).map((sess) => (
                        <div
                          key={sess.id}
                          className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/5 text-xs"
                        >
                          <span className="text-zinc-200 truncate">{sess.notes || sess.mode}</span>
                          <span className="font-bold text-emerald-300 whitespace-nowrap ml-2">
                            +{sess.earnedXp} XP
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-zinc-300">
                        Nenhuma sessão registrada ainda. Conclua um Sprint 3 min ou missão para somar XP.
                      </p>
                    )}
                  </div>
                </>
              )}

              <div className="text-[11px] text-zinc-300 text-center pt-2">
                Sincronizado com Missões &amp; Sprint Kumon (Sem ranqueamento punitivo • CNE 15/2026)
              </div>
            </EagleCard>
          </div>
        </div>
      )}

      {/* Tab 2: Tutor IA Áquila */}
      {activeTab === "tutor" && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Chat Stream */}
          <div className="lg:col-span-3 flex flex-col gap-4">
            <EagleCard glow="cyan" className="p-5 flex flex-col h-[520px]">
              {/* Chat Header */}
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300">
                    <Brain size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Córtex Copilot • {effectiveClassName}</h3>
                    <p className="text-[10px] text-zinc-300">
                      Parecer CNE/CP nº 15/2026 (DOU 11/11/2026) • Uso socrático mediado, sem nota automática ou treino externo
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  ONLINE
                </span>
              </div>
              {aiPolicyBlocked ? (
                <div
                  data-testid="tutor-cne-blocked-panel"
                  className="flex-1 flex flex-col items-center justify-center text-center gap-3 p-6"
                >
                  <ShieldCheck size={32} className="text-amber-400" />
                  <h4 className="text-sm font-bold text-white">
                    Tutor IA Autônomo Bloqueado para Educação Infantil e 1º–5º Ano EF
                  </h4>
                  <p className="text-xs text-zinc-300 max-w-md leading-relaxed">
                    Em observância ao Parecer CNE/CP nº 15/2026 (homologado pelo MEC em 10/11/2026), o acesso
                    autônomo de crianças a chatbots e IA generativa é vedado nesta etapa. Recursos digitais
                    ocorrem exclusivamente com planejamento e mediação direta do docente em sala.
                  </p>
                  {aiPolicyReason && (
                    <p className="text-[11px] font-mono text-amber-200 bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 rounded-xl max-w-md">
                      {aiPolicyReason}
                    </p>
                  )}
                </div>
              ) : (
                <>

              {tutorError && (
                <div
                  role="alert"
                  className="mt-3 p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-xs text-rose-200 flex items-center gap-2"
                >
                  <AlertTriangle size={14} className="shrink-0" />
                  <span>{tutorError}</span>
                </div>
              )}

              {/* Message History */}
              <div className="flex-1 overflow-y-auto py-4 flex flex-col gap-3 pr-2">
                {chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col max-w-[85%] ${
                      msg.sender === "user" ? "self-end items-end" : "self-start items-start"
                    }`}
                  >
                    <div
                      className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                        msg.sender === "user"
                          ? "bg-purple-600 text-white rounded-br-none shadow-md shadow-purple-950/40"
                          : "bg-white/10 text-zinc-100 border border-white/10 rounded-bl-none shadow-md"
                      }`}
                    >
                      {msg.text}
                    </div>
                    <span className="text-[10px] text-zinc-300 mt-1 px-1">{msg.timestamp}</span>
                  </div>
                ))}

                {isTyping && (
                  <div className="self-start flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-white/5 border border-white/10 text-xs text-zinc-300">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" />
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.2s]" />
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.4s]" />
                    <span className="ml-1 text-[11px]">Tutor Áquila pensando...</span>
                  </div>
                )}
              </div>

              {/* Suggestion Chips */}
              <div className="flex items-center gap-2 py-2 overflow-x-auto border-t border-white/5 text-[11px]">
                <span className="text-zinc-300 font-medium whitespace-nowrap">Sugestões:</span>
                {[
                  "Física: Primeira Lei Termodinâmica",
                  "Redação: Proposta de Intervenção",
                  "Matemática: Vértice da Parábola",
                ].map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => handleChipClick(chip)}
                    className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 hover:border-cyan-400/50 hover:bg-white/10 transition-all text-zinc-200 whitespace-nowrap"
                  >
                    {chip}
                  </button>
                ))}
              </div>

              {/* Input Area */}
              <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                <input
                  type="text"
                  placeholder="Pergunte ao Tutor IA (ex: Como calcular o rendimento do ciclo de Carnot?)..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                  className="flex-1 bg-white/5 border border-white/10 focus:border-cyan-400/60 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-zinc-400 outline-none transition-all"
                />
                <EliteButton
                  variant="primary"
                  size="md"
                  onClick={handleSendMessage}
                  className="px-4"
                >
                  <Send size={15} />
                </EliteButton>
              </div>
                </>
              )}
            </EagleCard>
          </div>

          {/* Quick Study Tools */}
          <div className="flex flex-col gap-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Laboratórios IA</h3>

            {aiPolicyBlocked && (
              <div
                data-testid="ai-labs-cne-blocked-notice"
                className="p-3 rounded-xl bg-amber-950/25 border border-amber-500/40 text-[11px] text-amber-200 flex items-start gap-2"
              >
                <ShieldAlert size={14} className="shrink-0 mt-0.5 text-amber-400" />
                <span>
                  Redação IA e Flashcards Guiados IA estão bloqueados pelo Parecer CNE/CP nº 15/2026 nesta faixa/etapa. Use o Modo Kumon 3 min (sem IA) ou atividades presenciais com o docente.
                </span>
              </div>
            )}

            <EagleCard glow="purple" className="p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-purple-300 font-bold text-xs">
                  <Sparkles size={14} /> Redação Nota 1000
                </div>
                {aiPolicyBlocked && (
                  <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/35">
                    <Lock size={10} /> Bloqueado CNE
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-300">
                Estruture sua tese e proposta de intervenção com os 5 critérios oficiais do ENEM.
              </p>
              <EliteButton
                variant="secondary"
                size="sm"
                disabled={aiPolicyBlocked}
                onClick={() => {
                  if (!aiPolicyBlocked) setActivePracticeModal("essay_lab");
                }}
                className="w-full"
              >
                {aiPolicyBlocked ? "Bloqueado (CNE/CP nº 15/2026)" : "Abrir Essay Lab"}
              </EliteButton>
            </EagleCard>

            <EagleCard glow="blue" className="p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-blue-300 font-bold text-xs">
                  <Brain size={14} /> Flashcards SRS
                </div>
                {aiPolicyBlocked && (
                  <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/35">
                    <Lock size={10} /> Bloqueado CNE
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-300">
                Revisão ativa baseada em repetição espaçada para retenção de longo prazo.
              </p>
              <EliteButton
                variant="secondary"
                size="sm"
                disabled={aiPolicyBlocked}
                onClick={() => {
                  if (!aiPolicyBlocked) setActivePracticeModal("flashcards_srs");
                }}
                className="w-full"
              >
                {aiPolicyBlocked ? "Bloqueado (CNE/CP nº 15/2026)" : "Praticar 12 Cartões"}
              </EliteButton>
            </EagleCard>
          </div>
        </div>
      )}

      {/* Tab 3: Boletim & Desempenho */}
      {activeTab === "boletim" && (
        <EagleCard glow="purple" className="p-6 flex flex-col gap-6" data-testid="student-grades-panel">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white">Boletim Escolar Bimestral • Ano Letivo 2026</h2>
              <p className="text-xs text-zinc-300">
                Notas revisadas pelo docente (Parecer CNE/CP nº 15/2026). Você pode registrar pedido formal de revisão/contestação.
              </p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-purple-500/10 text-purple-300 border border-purple-500/30">
                Média Geral: {effectiveAverage !== null ? effectiveAverage.toFixed(1) : "—"}
              </span>
              <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                {workspace
                  ? `Última presença: ${workspace.latestAttendance?.date ?? "—"}`
                  : "Frequência: 97.4%"}
              </span>
            </div>
          </div>

          {effectiveGrades.length === 0 ? (
            <div
              data-testid="student-empty-published-grades"
              className="p-4 rounded-xl bg-white/5 border border-white/10 text-xs text-zinc-300"
            >
              Nenhuma nota publicada pelo docente até o momento. Avaliações em rascunho ou correção permanecem ocultas conforme Parecer CNE/CP nº 15/2026.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-[11px] uppercase tracking-wider text-zinc-300">
                    <th className="py-3 px-4 font-bold">Disciplina</th>
                    <th className="py-3 px-3 text-center font-bold">Nota</th>
                    <th className="py-3 px-3 text-center font-bold">Máx</th>
                    <th className="py-3 px-3 text-center font-bold">Situação / Edge</th>
                    <th className="py-3 px-4 text-right font-bold">Revisão (CNE 15/2026)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {effectiveGrades.map((g, idx) => {
                    const isContested = g.contestationStatus === "contested";
                    const isFormOpen = contestingGradeId === g.id;
                    return (
                      <React.Fragment key={`${g.id}-${idx}`}>
                        <tr className="hover:bg-white/5 transition-colors">
                          <td className="py-3.5 px-4 font-semibold text-white">{g.subject}</td>
                          <td className="py-3.5 px-3 text-center font-bold text-purple-300">
                            {g.b4.toFixed(1)}
                          </td>
                          <td className="py-3.5 px-3 text-center text-zinc-300">
                            {g.maxScore.toFixed(1)}
                          </td>
                          <td className="py-3.5 px-3 text-center">
                            <div className="flex flex-col items-center gap-1">
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                                {g.status}
                              </span>
                              <PropagationStatusBadge
                                status={g.propagationStatus}
                                commandId={g.edgeCommandId}
                              />
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            {isContested ? (
                              <div className="inline-flex flex-col items-end gap-0.5 text-amber-200 text-[11px]">
                                <span className="font-bold uppercase text-[10px]">
                                  Contestação Enviada
                                </span>
                                {g.contestationReason && (
                                  <span className="text-zinc-300 max-w-xs truncate">
                                    {g.contestationReason}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setContestingGradeId(isFormOpen ? null : g.id);
                                  setGradeContestReason("");
                                  setGradeContestError(null);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/15 text-[11px] font-semibold text-zinc-200 transition"
                              >
                                {isFormOpen ? "Fechar" : "Contestar Nota"}
                              </button>
                            )}
                          </td>
                        </tr>
                        {isFormOpen && !isContested && (
                          <tr>
                            <td colSpan={5} className="px-4 py-3 bg-black/40">
                              <div
                                data-testid={`student-grade-contestation-form-${g.id}`}
                                className="flex flex-col gap-2"
                              >
                                <textarea
                                  rows={2}
                                  value={gradeContestReason}
                                  onChange={(e) => {
                                    setGradeContestReason(e.target.value);
                                    if (gradeContestError) setGradeContestError(null);
                                  }}
                                  placeholder="Explique o motivo do pedido de revisão desta nota (mín. 10 caracteres)..."
                                  className="w-full bg-zinc-900 border border-white/15 rounded-lg p-2 text-xs text-white outline-none focus:border-amber-400"
                                />
                                {gradeContestError && (
                                  <span role="alert" className="text-xs text-rose-300">
                                    {gradeContestError}
                                  </span>
                                )}
                                <div className="flex justify-end gap-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setContestingGradeId(null);
                                      setGradeContestError(null);
                                    }}
                                    className="px-2.5 py-1 rounded bg-white/5 text-xs text-zinc-300"
                                  >
                                    Cancelar
                                  </button>
                                  <button
                                    type="button"
                                    disabled={gradeContestSubmitting}
                                    onClick={() => void handleSubmitGradeContestation(g.id)}
                                    className="px-3 py-1 rounded bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold disabled:opacity-50"
                                  >
                                    {gradeContestSubmitting ? "Enviando..." : "Enviar Contestação"}
                                  </button>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </EagleCard>
      )}

      {/* Tab 4: Grade Horária */}
      {activeTab === "horarios" && (
        <EagleCard glow="blue" className="p-6 flex flex-col gap-6">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 className="text-lg font-bold text-white">Quadro de Aulas • Semana Letiva</h2>
              <p className="text-xs text-zinc-300">Ambiente inteligente com monitoramento de presença em tempo real.</p>
            </div>
            <span className="text-xs font-bold text-cyan-400 border border-cyan-500/30 px-3 py-1.5 rounded-xl bg-cyan-500/10">
              {effectiveSchedule[0]
                ? `Aula Referência: ${effectiveSchedule[0].subject}`
                : "Grade Horária Digital"}
            </span>
          </div>

          {effectiveSchedule.length === 0 ? (
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-xs text-zinc-300">
              Nenhum horário de aula sincronizado para esta turma até o momento.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {effectiveSchedule.map((slot, idx) => (
                <div
                  key={`${slot.time}-${idx}`}
                  className={`p-4 rounded-2xl border transition-all flex flex-col gap-2 ${
                    slot.current
                      ? "bg-cyan-500/15 border-cyan-400/50 shadow-lg shadow-cyan-950/40"
                      : "bg-white/5 border-white/10"
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-300 font-mono flex items-center gap-1.5">
                      <Clock size={13} /> {slot.time}
                    </span>
                    {slot.current && (
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-cyan-400 text-black">
                        EM CURSO
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-bold text-white">{slot.subject}</h3>
                  <div className="flex items-center justify-between text-xs text-zinc-300 mt-1">
                    <span>{slot.teacher}</span>
                    <span className="font-mono text-zinc-200 font-semibold">{slot.room}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </EagleCard>
      )}

      {/* Tab 5: Trilha de Habilidades BNCC & Mentores Soberanos */}
      {activeTab === "habilidades" && (
        <EagleCard glow="cyan" className="p-6 flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Atom className="text-cyan-400" size={20} /> Trilha Soberana de Habilidades BNCC & Mentoria Histórica
              </h2>
              <p className="text-xs text-zinc-300">
                Competências curriculares calibradas pelo modelo psicométrico TRI (3PL) com mentores em domínio público.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                14 / 18 Habilidades Conquistadas
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                code: "EM13CNT102",
                title: "Termodinâmica & Ciclo de Carnot",
                area: "Ciências da Natureza",
                mentor: "Nicolas Carnot",
                quote: "A potência motriz do calor é independente dos agentes empregados.",
                progress: 85,
                theta: "+0.35 TRI",
                badge: "🔥 Máquina Térmica",
              },
              {
                code: "EM13CNT103",
                title: "Óptica Geométrica & Reflexão Total",
                area: "Ciências da Natureza",
                mentor: "Isaac Newton",
                quote: "Se vi mais longe, foi por estar sobre ombros de gigantes.",
                progress: 70,
                theta: "+0.65 TRI",
                badge: "🌈 Prisma Espectral",
              },
              {
                code: "EM13CNT201",
                title: "Genética Mendeliana & Segregação",
                area: "Ciências da Natureza",
                mentor: "Gregor Mendel",
                quote: "Minha hora ainda há de chegar.",
                progress: 90,
                theta: "-0.80 TRI",
                badge: "🌱 Ervilha de Mendel",
              },
              {
                code: "EM13MAT201",
                title: "Geometria Espacial & Sólidos Inscritos",
                area: "Matemática",
                mentor: "Arquimedes",
                quote: "Dê-me um ponto de apoio e moverei o mundo.",
                progress: 60,
                theta: "+0.40 TRI",
                badge: "🏛️ Coroa de Ouro",
              },
              {
                code: "EM13MAT101",
                title: "Modelagem Linear & Taxas de Variação",
                area: "Matemática",
                mentor: "René Descartes",
                quote: "Dividir cada dificuldade em tantas partes quantas for possível.",
                progress: 95,
                theta: "-1.20 TRI",
                badge: "📐 Plano Cartesiano",
              },
              {
                code: "EF09MA06",
                title: "Funções Quadráticas & Vértice Parabólico",
                area: "Matemática",
                mentor: "Galileu Galilei",
                quote: "O livro da natureza foi escrito em caracteres matemáticos.",
                progress: 100,
                theta: "-0.10 TRI",
                badge: "🔭 Telescópio de Pádua",
              },
            ].map((skill) => (
              <div
                key={skill.code}
                className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-cyan-400/40 transition-all flex flex-col justify-between gap-3"
              >
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-white/10 text-cyan-300">
                      {skill.code}
                    </span>
                    <span className="text-[10px] font-mono font-bold text-zinc-400">
                      {skill.theta}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white">{skill.title}</h3>
                  <p className="text-[11px] text-zinc-400">{skill.area}</p>
                </div>

                <div className="p-2.5 rounded-xl bg-black/30 border border-white/5 flex flex-col gap-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-zinc-300 font-semibold">{skill.badge}</span>
                    <span className="text-[10px] text-zinc-400">{skill.mentor}</span>
                  </div>
                  <p className="text-[10px] italic text-zinc-400 line-clamp-2">&quot;{skill.quote}&quot;</p>
                </div>

                <div className="flex flex-col gap-1">
                  <div className="flex justify-between text-[10px] font-semibold text-zinc-400">
                    <span>Maestria Acumulada</span>
                    <span className="text-white font-bold">{skill.progress}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-indigo-500"
                      style={{ width: `${skill.progress}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </EagleCard>
      )}

      {/* Tab 6: Áquila Lab 3D & Simulações Físicas Interativas */}
      {activeTab === "simulacoes" && (
        <div className="flex flex-col gap-6 animate-fade-in">
          <AquilaCircuitLab
            onComplete={async (result: { earnedXp: number }) => {
              setSessionXpBonus((x) => x + result.earnedXp);
              await mutate("logStudySession", {
                mode: "circuit_simulation_bancada_01",
                durationSeconds: 180,
                topic: "Bancada 01: 1ª Lei de Ohm concluída com 100% no desafio",
                ...(selectedStudentId ? { studentId: selectedStudentId } : {}),
              });
              await reload();
            }}
          />
        </div>
      )}

      <StudentPracticeDrawer
        mode={activePracticeModal}
        aiPolicyBlocked={aiPolicyBlocked}
        aiPolicyReason={aiPolicyReason}
        onClose={() => setActivePracticeModal(null)}
        onComplete={async (mode, topic) => {
          const res = await mutate<{ earnedXp?: number }>("logStudySession", {
            mode,
            durationSeconds: 180,
            topic,
            ...(selectedStudentId ? { studentId: selectedStudentId } : {}),
          });
          if (res.ok) {
            await reload();
            return { ok: true };
          }
          if (res.offlineFallback) {
            setSessionXpBonus((x) => x + 40);
            return { ok: true };
          }
          return {
            ok: false,
            error:
              res.error ??
              "Atividade bloqueada ou não sincronizada pelo servidor.",
          };
        }}
      />
        </>
      )}
    </div>
  );
}
