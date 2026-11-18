"use client";

import { usePortalWorkspace, type TeacherWorkspaceData } from "@/lib/usePortalData";
import { PortalSyncBanner, PropagationStatusBadge } from "@/components/PortalSyncBanner";
import { TeacherHitlQueue } from "@/components/portals/TeacherHitlQueue";
import { AquilaCircuitLab } from "@/components/simulations/AquilaCircuitLab";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Users, AlertTriangle, Presentation,
  FileSpreadsheet, Sparkles, LayoutGrid, RefreshCw,
  Clock, ShieldCheck, Check, BookOpen, Layers, FileText, Printer, Zap
} from "lucide-react";
import { EagleCard } from "@/components/ui/EagleCard";
import { EliteButton } from "@/components/ui/EliteButton";

interface StudentAttendance {
  id: string;
  name: string;
  seat: string;
  status: "present" | "absent" | "justified";
  detectedBy?: string;
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
  const [selectedClassId, setSelectedClassId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return new URLSearchParams(window.location.search).get("classId");
  });
  const workspaceEndpoint = selectedClassId
    ? `/api/portal/professor?classId=${encodeURIComponent(selectedClassId)}`
    : "/api/portal/professor";
  const { data: workspace, loading, syncError, reload, mutate } =
    usePortalWorkspace<TeacherWorkspaceData>(workspaceEndpoint);

  const [attendanceDraftByStudent, setAttendanceDraftByStudent] = useState<
    Record<string, "present" | "absent" | "justified">
  >({});
  const [manualOverrideIds, setManualOverrideIds] = useState<Record<string, boolean>>({});
  const [hasUnsavedAttendance, setHasUnsavedAttendance] = useState(false);
  const [localAttendanceSyncState, setLocalAttendanceSyncState] = useState<string | null>(null);
  const [gradeDraftByStudent, setGradeDraftByStudent] = useState<Record<string, string>>({});
  const [diaryTopicDraft, setDiaryTopicDraft] = useState<string | null>(null);
  const [diaryContentDraft, setDiaryContentDraft] = useState<string | null>(null);
  const [diaryHomeworkDraft, setDiaryHomeworkDraft] = useState<string | null>(null);
  const [diaryDinnerPromptDraft, setDiaryDinnerPromptDraft] = useState<string | null>(null);
  const [diaryReceiptHash, setDiaryReceiptHash] = useState<string | null>(null);
  const [diaryStatusBanner, setDiaryStatusBanner] = useState<string | null>(null);
  const [diaryError, setDiaryError] = useState<string | null>(null);
  const [diaryCommandMeta, setDiaryCommandMeta] = useState<{
    commandId?: string;
    propagationStatus?: string;
  } | null>(null);
  const [examSaveBanner, setExamSaveBanner] = useState<string | null>(null);
  const [examSaveError, setExamSaveError] = useState<string | null>(null);
  const [examCommandMeta, setExamCommandMeta] = useState<{
    commandId?: string;
    propagationStatus?: string;
  } | null>(null);
  const [gradesEvaluationType, setGradesEvaluationType] = useState<
    "prova" | "trabalho" | "participacao"
  >("prova");
  const [gradesMaxScore, setGradesMaxScore] = useState<number>(10);
  const [gradesSaveBanner, setGradesSaveBanner] = useState<string | null>(null);
  const [gradesSaveError, setGradesSaveError] = useState<string | null>(null);
  const [gradesCommandMeta, setGradesCommandMeta] = useState<{
    commandId?: string;
    propagationStatus?: string;
  } | null>(null);
  const [radarAppliedMap, setRadarAppliedMap] = useState<Record<string, string>>({});
  const [radarCommandMetaMap, setRadarCommandMetaMap] = useState<
    Record<string, { commandId?: string; propagationStatus?: string }>
  >({});
  const [radarError, setRadarError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"chamada" | "diario" | "radar" | "notas" | "provas" | "simulacoes">("chamada");
  const [isSyncingSigaWeb, setIsSyncingSigaWeb] = useState(false);
  const [sigaWebHash, setSigaWebHash] = useState<string | null>(null);
  const [diarioSigned, setDiarioSigned] = useState(false);
  const [quickConfirmedBanner, setQuickConfirmedBanner] = useState<string | null>(null);

  const handleSelectClass = (classId: string | null) => {
    setSelectedClassId(classId);
    setAttendanceDraftByStudent({});
    setManualOverrideIds({});
    setHasUnsavedAttendance(false);
    setLocalAttendanceSyncState(null);
    setQuickConfirmedBanner(null);
    setGradeDraftByStudent({});
    setDiaryTopicDraft(null);
    setDiaryContentDraft(null);
    setDiaryHomeworkDraft(null);
    setDiaryDinnerPromptDraft(null);
    setDiaryReceiptHash(null);
    setDiaryStatusBanner(null);
    setDiaryError(null);
    setDiaryCommandMeta(null);
    setDiarioSigned(false);
    setGradesSaveBanner(null);
    setGradesSaveError(null);
    setGradesCommandMeta(null);
    setRadarError(null);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (classId) {
        url.searchParams.set("classId", classId);
      } else {
        url.searchParams.delete("classId");
      }
      window.history.replaceState(null, "", url.toString());
    }
  };

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

  const hasServerWorkspace = workspace !== null;
  const isAccessBlocked = Boolean(syncError) && workspace === null;
  const isNoActiveClass = workspace !== null && workspace.activeClass === null;
  const isOfflinePreview = workspace === null && !syncError;

  const baseRoster: StudentAttendance[] = hasServerWorkspace
    ? workspace.roster.map((s) => ({
        id: s.id,
        name: s.name,
        seat: s.seat,
        status: s.status,
        detectedBy: s.detectedBy,
        confidence: s.confidence,
        entryTime: s.entryTime,
      }))
    : isOfflinePreview
      ? students
      : [];

  const effectiveRoster: StudentAttendance[] = baseRoster.map((s) => ({
    ...s,
    status: attendanceDraftByStudent[s.id] ?? s.status,
  }));

  const studentNamesById: Record<string, string> = Object.fromEntries(
    effectiveRoster.map((s) => [s.id, s.name])
  );

  const primaryDiary = workspace?.diaries?.[0];
  const effectiveDiaryTopic =
    diaryTopicDraft ??
    primaryDiary?.topic ??
    "Primeira Lei da Termodinâmica";
  const effectiveDiaryContent =
    diaryContentDraft ??
    primaryDiary?.content ??
    "Primeira Lei da Termodinâmica: Conservação de Energia em transformações gasosas isobáricas, isocóricas e isotérmicas. Resolução comentada de exercícios estilo ENEM e demonstração experimental com simulador virtual.";
  const effectiveDiaryHomework =
    diaryHomeworkDraft ??
    primaryDiary?.homework ??
    (isOfflinePreview
      ? "Resolver exercícios 1 a 8 da página 142 do Livro Didático. Lista TRI disponível no Portal do Aluno."
      : "");
  const effectiveDiaryDinnerPrompt =
    diaryDinnerPromptDraft ??
    primaryDiary?.dinnerPrompt ??
    (isOfflinePreview
      ? "Como um motor de carro ou geladeira transforma calor no dia a dia?"
      : "");
  const effectiveDiarySigned =
    diarioSigned ||
    Boolean(primaryDiary?.signatureHashSha256);
  const effectiveDiaryHash = diaryReceiptHash ?? primaryDiary?.signatureHashSha256 ?? null;
  const effectiveDiarySyncStatus =
    diaryCommandMeta?.propagationStatus ??
    workspace?.lastDiarySync?.status ??
    primaryDiary?.propagationStatus ??
    null;
  const effectiveDiaryCommandId =
    diaryCommandMeta?.commandId ??
    workspace?.lastDiarySync?.commandId ??
    primaryDiary?.edgeCommandId ??
    null;

  const persistRosterAttendance = useCallback(
    async (rosterSnapshot: StudentAttendance[], overridesSnapshot: Record<string, boolean>) => {
      const classId = workspace?.activeClass?.id ?? (isOfflinePreview ? "cls_2b" : "");
      if (!classId || rosterSnapshot.length === 0) {
        return { ok: false as const, error: "Turma ou lista de estudantes indisponível." };
      }
      const date = workspace?.date ?? new Date().toISOString().slice(0, 10);
      return mutate<{ syncHash?: string; commandId?: string; syncStatus?: string }>(
        "saveRosterAttendance",
        {
          classId,
          date,
          entries: rosterSnapshot.map((s) => ({
            studentId: s.id,
            status: s.status,
            detectedBy: overridesSnapshot[s.id]
              ? "manual"
              : s.detectedBy === "qr_badge" || s.detectedBy === "nfc"
                ? s.detectedBy
                : "manual",
          })),
        }
      );
    },
    [isOfflinePreview, mutate, workspace?.activeClass?.id, workspace?.date]
  );

  const toggleStudentStatus = (id: string, newStatus: "present" | "absent" | "justified") => {
    setAttendanceDraftByStudent((prev) => ({ ...prev, [id]: newStatus }));
    setManualOverrideIds((prev) => ({ ...prev, [id]: true }));
    setStudents((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: newStatus } : s))
    );
    setHasUnsavedAttendance(true);
  };

  const handleQuickConfirmAttendance = useCallback(() => {
    const nowTime = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    const prevDraft = attendanceDraftByStudent;
    const prevStudents = students;
    const prevHasUnsaved = hasUnsavedAttendance;

    const confirmedRoster = effectiveRoster.map((s) =>
      s.status === "absent" && s.entryTime !== "--" ? { ...s, status: "present" as const } : s
    );
    setAttendanceDraftByStudent((prev) => {
      const next = { ...prev };
      for (const s of confirmedRoster) {
        next[s.id] = s.status;
      }
      return next;
    });
    setStudents((prev) =>
      prev.map((s) =>
        s.status === "absent" && s.entryTime !== "--"
          ? { ...s, status: "present" }
          : s
      )
    );
    setQuickConfirmedBanner(
      `Chamada rápida (< 90s) confirmada às ${nowTime} — enviando ao servidor para fila Edge...`
    );

    void persistRosterAttendance(confirmedRoster, manualOverrideIds).then((res) => {
      if (res.ok && "data" in res && res.data?.syncHash) {
        const hashShort = res.data.syncHash.slice(0, 16);
        const cmdShort = res.data.commandId ? ` • Cmd ${res.data.commandId.slice(0, 12)}` : "";
        setSigaWebHash(`${hashShort}...sha256`);
        setHasUnsavedAttendance(false);
        setLocalAttendanceSyncState(res.data.syncStatus ?? "pending_at_edge");
        setQuickConfirmedBanner(
          `Chamada rápida (< 90s) recebida pelo servidor às ${nowTime} • Pendente na Escola (Edge)${cmdShort} (SHA-256: ${hashShort}...)`
        );
        void reload();
        return;
      }
      if (!res.ok && !("offlineFallback" in res && res.offlineFallback)) {
        setAttendanceDraftByStudent(prevDraft);
        setStudents(prevStudents);
        setHasUnsavedAttendance(prevHasUnsaved);
        setQuickConfirmedBanner(
          res.error ?? "Falha ao confirmar chamada no servidor. Alterações anteriores preservadas."
        );
      }
    });
  }, [
    attendanceDraftByStudent,
    effectiveRoster,
    hasUnsavedAttendance,
    manualOverrideIds,
    persistRosterAttendance,
    reload,
    students,
  ]);

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

  const handleSyncSigaWeb = async () => {
    setIsSyncingSigaWeb(true);
    const res = await persistRosterAttendance(effectiveRoster, manualOverrideIds);
    setIsSyncingSigaWeb(false);
    if (res.ok && "data" in res && res.data?.syncHash) {
      setSigaWebHash(`${res.data.syncHash.slice(0, 16)}...sha256`);
      setHasUnsavedAttendance(false);
      setLocalAttendanceSyncState(res.data.syncStatus ?? "pending_at_edge");
      await reload();
    } else if (!res.ok && !("offlineFallback" in res && res.offlineFallback)) {
      setQuickConfirmedBanner(res.error ?? "Falha ao exportar chamada para o servidor/Edge.");
    }
  };

  const handleSaveAssessment = async (approveForRelease: boolean) => {
    setExamSaveError(null);
    const res = await mutate<{
      id: string;
      status: string;
      commandId?: string;
      syncStatus?: string;
    }>("saveAssessment", {
      id: workspace?.assessments?.[0]?.id,
      classId: workspace?.activeClass?.id ?? (isOfflinePreview ? "cls_2b" : ""),
      title: examTitle,
      instructions: examInstructions,
      subject: "Física Aplicada",
      bimestre: "4bim",
      questions: examQuestions,
      approveForRelease,
    });
    if (res.ok) {
      if (res.data?.commandId || res.data?.syncStatus) {
        setExamCommandMeta({
          commandId: res.data.commandId,
          propagationStatus: res.data.syncStatus,
        });
      }
      setExamSaveBanner(
        approveForRelease
          ? "Avaliação aprovada por revisão humana docente (Parecer CNE/CP nº 15/2026) — comando enfileirado para a escola!"
          : "Rascunho de avaliação salvo no banco de dados (ainda retido até revisão HITL)."
      );
      await reload();
    } else if (res.offlineFallback) {
      setExamSaveBanner(
        approveForRelease
          ? "Avaliação aprovada em prévia local (Parecer CNE/CP nº 15/2026)."
          : "Rascunho mantido em prévia local."
      );
    } else {
      setExamSaveError(res.error ?? "Falha ao salvar avaliação no servidor.");
    }
  };

  const handleSaveDiary = async (sign: boolean = true) => {
    setDiaryError(null);
    const topicTrimmed = effectiveDiaryTopic.trim();
    const contentTrimmed = effectiveDiaryContent.trim();
    if (topicTrimmed.length < 3) {
      setDiaryError("Informe o tema da aula com pelo menos 3 caracteres.");
      return;
    }
    if (contentTrimmed.length < 5) {
      setDiaryError("Informe o conteúdo programático com pelo menos 5 caracteres.");
      return;
    }
    const classId = workspace?.activeClass?.id ?? (isOfflinePreview ? "cls_2b" : "");
    if (!classId) {
      setDiaryError("Turma não vinculada para registrar o diário.");
      return;
    }
    const res = await mutate<{
      id: string;
      status?: "draft" | "published";
      signed: boolean;
      signatureHashSha256?: string;
      commandId?: string;
      syncStatus?: string;
      propagationStatus?: string;
    }>("saveLessonDiary", {
      id: primaryDiary?.id,
      classId,
      date: workspace?.date ?? new Date().toISOString().slice(0, 10),
      subject: primaryDiary?.subject ?? "Física Aplicada",
      topic: topicTrimmed,
      content: contentTrimmed,
      bnccCodes: ["EM13CNT301", "EM13CNT302", "EM13MAT305"],
      homework: effectiveDiaryHomework.trim() || undefined,
      dinnerPrompt: effectiveDiaryDinnerPrompt.trim() || undefined,
      sign,
    });
    if (res.ok || res.offlineFallback) {
      if (sign || res.data?.signed) {
        setDiarioSigned(true);
      } else {
        setDiarioSigned(false);
      }
      if (res.ok && res.data?.signatureHashSha256) {
        setDiaryReceiptHash(res.data.signatureHashSha256);
      }
      if (res.ok && res.data) {
        setDiaryCommandMeta({
          commandId: res.data.commandId,
          propagationStatus: res.data.propagationStatus ?? res.data.syncStatus,
        });
        setDiaryStatusBanner(
          res.data.status === "published" || res.data.signed
            ? "Diário publicado & assinado no BFF — aguardando confirmação na escola (Edge)."
            : "Rascunho de diário salvo no servidor (não exibido para famílias até publicar)."
        );
        await reload();
      } else {
        setDiaryStatusBanner(
          sign
            ? "Diário assinado em prévia local."
            : "Rascunho de diário mantido em prévia local."
        );
      }
      return;
    }
    setDiaryError(res.error ?? "Falha ao salvar o diário de classe.");
  };

  const handleApplyRadarAction = async (occurrenceId: string, actionApplied: string) => {
    setRadarError(null);
    const prevAction = radarAppliedMap[occurrenceId];
    setRadarAppliedMap((prev) => ({ ...prev, [occurrenceId]: actionApplied }));
    const res = await mutate<{
      actionApplied?: string;
      auditHash?: string;
      commandId?: string;
      propagationStatus?: string;
    }>("applyRadarAction", {
      occurrenceId,
      actionApplied,
    });
    if (res.ok) {
      if (res.data?.commandId || res.data?.propagationStatus) {
        setRadarCommandMetaMap((prev) => ({
          ...prev,
          [occurrenceId]: {
            commandId: res.data?.commandId,
            propagationStatus: res.data?.propagationStatus || "pending_at_edge",
          },
        }));
      }
      await reload();
      return;
    }
    if (!res.offlineFallback) {
      setRadarAppliedMap((prev) => {
        const next = { ...prev };
        if (prevAction === undefined) {
          delete next[occurrenceId];
        } else {
          next[occurrenceId] = prevAction;
        }
        return next;
      });
      setRadarError(res.error ?? "Falha ao registrar ação do Radar Pedagógico.");
    }
  };

  const handleSaveGradesBatch = async () => {
    setGradesSaveError(null);
    setGradesSaveBanner(null);
    const classId = workspace?.activeClass?.id ?? (isOfflinePreview ? "cls_2b" : "");
    if (!classId) {
      setGradesSaveError("Turma indisponível para publicação de notas.");
      return;
    }
    const rosterSource = hasServerWorkspace
      ? effectiveRoster
      : isOfflinePreview
        ? effectiveRoster.length > 0
          ? effectiveRoster
          : [
              { id: "std_001", name: "Lucas Andrade" },
              { id: "std_002", name: "Sofia Costa" },
              { id: "std_003", name: "Gabriel Santos" },
              { id: "std_004", name: "Helena Oliveira" },
            ]
        : [];

    if (rosterSource.length === 0) {
      setGradesSaveError("Nenhum estudante vinculado a esta turma para lançamento de notas.");
      return;
    }

    const entries: Array<{ studentId: string; score: number }> = [];
    for (const row of rosterSource) {
      const dbGrade =
        workspace?.grades.find(
          (g) => g.studentId === row.id && g.evaluationType === gradesEvaluationType
        ) ?? workspace?.grades.find((g) => g.studentId === row.id);
      const draftStr = gradeDraftByStudent[row.id];
      const rawStr =
        draftStr !== undefined
          ? draftStr.trim()
          : dbGrade !== undefined
            ? String(dbGrade.score)
            : isOfflinePreview
              ? "8.5"
              : "";
      if (rawStr === "") continue;
      const numeric = Number(rawStr);
      if (!Number.isFinite(numeric) || numeric < 0 || numeric > gradesMaxScore) {
        setGradesSaveError(
          `Nota inválida para ${row.name}: informe valor entre 0 e ${gradesMaxScore}.`
        );
        return;
      }
      entries.push({ studentId: row.id, score: numeric });
    }

    if (entries.length === 0) {
      setGradesSaveError("Informe ao menos uma nota válida antes de publicar.");
      return;
    }

    const res = await mutate<{
      count?: number;
      auditHash?: string;
      commandId?: string;
      syncStatus?: string;
      propagationStatus?: string;
    }>("saveGradesBatch", {
      classId,
      subject: "Física Aplicada",
      evaluationType: gradesEvaluationType,
      maxScore: gradesMaxScore,
      period: "4bim",
      entries,
    });
    if (res.ok) {
      setGradesCommandMeta({
        commandId: res.data?.commandId,
        propagationStatus: res.data?.propagationStatus ?? res.data?.syncStatus ?? "pending_at_edge",
      });
      setGradesSaveBanner(
        `Notas publicadas (${res.data?.count ?? entries.length} lançamentos • ${gradesEvaluationType} / máx ${gradesMaxScore}) • SHA-256: ${(res.data?.auditHash ?? "local").slice(0, 16)}...`
      );
      await reload();
    } else if (res.offlineFallback) {
      setGradesSaveBanner(
        `Notas atualizadas em prévia local (${entries.length} lançamentos).`
      );
    } else {
      setGradesSaveError(res.error ?? "Falha ao sincronizar lote de notas.");
    }
  };

  const updateQuestionStem = (id: string, stem: string) => {
    setExamQuestions((prev) => prev.map((q) => (q.id === id ? { ...q, stem } : q)));
  };

  const presentCount = effectiveRoster.filter((s) => s.status === "present").length;
  const absentCount = effectiveRoster.filter((s) => s.status === "absent").length;
  const justifiedCount = effectiveRoster.filter((s) => s.status === "justified").length;

  const teacherDisplayName = hasServerWorkspace
    ? workspace.teacherName ?? "Docente autenticado"
    : "Prof. Ricardo Silva";

  const resolvedAttendanceCommandState = hasUnsavedAttendance
    ? "unsaved"
    : localAttendanceSyncState ??
      workspace?.lastAttendanceSync?.status ??
      workspace?.syncStatus?.state ??
      (isOfflinePreview ? "preview" : "received_by_server");

  const attendanceStatusLabel =
    resolvedAttendanceCommandState === "unsaved"
      ? "ALTERAÇÕES PENDENTES DE ENVIO"
      : resolvedAttendanceCommandState === "pending_at_edge"
        ? "PENDENTE NA ESCOLA (EDGE)"
        : resolvedAttendanceCommandState === "applied_by_edge"
          ? "APLICADO NA ESCOLA (EDGE)"
          : resolvedAttendanceCommandState === "rejected_by_edge" ||
              resolvedAttendanceCommandState === "failed" ||
              resolvedAttendanceCommandState === "sync_stale"
            ? "FALHA / REJEITADO NO EDGE"
            : resolvedAttendanceCommandState === "preview"
              ? "MODO LOCAL (PREVIEW)"
              : "RECEBIDO PELO SERVIDOR (BFF)";

  const attendanceStatusIsApplied = resolvedAttendanceCommandState === "applied_by_edge";
  const attendanceStatusIsError =
    resolvedAttendanceCommandState === "rejected_by_edge" ||
    resolvedAttendanceCommandState === "failed" ||
    resolvedAttendanceCommandState === "sync_stale";

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <PortalSyncBanner
        portalLabel="Portal Docente"
        loading={loading}
        syncError={syncError}
        syncedFromDb={Boolean(workspace)}
        syncState={workspace?.syncStatus?.state}
        pendingCommandCount={workspace?.syncStatus?.pendingCommandCount}
        lastSyncedAt={workspace?.syncStatus?.lastSyncedAt}
        staleReason={workspace?.syncStatus?.staleReason}
        onRefresh={reload}
        complianceNote="Parecer CNE/CP nº 15/2026 (Revisão Docente HITL) • Chamada QR / Nominal & Diário SHA-256"
      />

      {isAccessBlocked && (
        <EagleCard
          glow="amber"
          className="p-6 border-red-500/40 bg-red-950/20 flex flex-col gap-4"
          data-testid="teacher-access-blocked"
        >
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-black uppercase tracking-wider text-red-300">
              Acesso Restrito • Proteção de Turma Docente
            </span>
            <h1 className="text-xl font-black text-white">
              Consulta não autorizada para esta turma ou sessão expirada
            </h1>
            <p className="text-sm text-zinc-200">{syncError}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {selectedClassId && (
              <EliteButton variant="primary" size="sm" onClick={() => handleSelectClass(null)}>
                Carregar Minha Turma
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

      {!isAccessBlocked && isNoActiveClass && (
        <EagleCard
          glow="amber"
          className="p-6 border-amber-500/40 bg-amber-950/20 flex flex-col gap-3"
          data-testid="teacher-no-active-class"
        >
          <span className="text-[11px] font-black uppercase tracking-wider text-amber-300">
            Sem Turma Ativa Vinculada
          </span>
          <h1 className="text-xl font-black text-white">
            Nenhuma turma vinculada a {teacherDisplayName}
          </h1>
          <p className="text-sm text-zinc-200">
            Solicite à coordenação ou secretaria o vínculo da sua disciplina/turma para liberar a chamada digital e o diário.
          </p>
        </EagleCard>
      )}

      {!isAccessBlocked && !isNoActiveClass && (
        <>
      {workspace && workspace.classes.length > 1 && (
        <div className="flex flex-wrap items-center gap-2" data-testid="teacher-class-switcher">
          <span className="text-xs font-semibold text-zinc-300 mr-1">Turmas vinculadas:</span>
          {workspace.classes.map((cls) => (
            <button
              key={cls.id}
              type="button"
              onClick={() => handleSelectClass(cls.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                cls.id === workspace.activeClass?.id
                  ? "bg-blue-500/25 text-blue-200 border border-blue-400/50"
                  : "bg-white/5 text-zinc-300 border border-white/10 hover:bg-white/10"
              }`}
            >
              {cls.name}
            </button>
          ))}
        </div>
      )}

      {/* Teacher Command Bar HUD */}
      <EagleCard glow="blue" className="p-5 sm:p-7 border-blue-500/30 bg-blue-950/10">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4 sm:gap-5">
            {/* Rectangular Avatar */}
            <div className="w-14 h-16 sm:w-16 sm:h-20 rounded-xl bg-gradient-to-br from-blue-600 via-cyan-600 to-indigo-600 p-0.5 shadow-xl shadow-blue-950/60">
              <div className="w-full h-full rounded-[10px] bg-zinc-950 flex items-center justify-center">
                <span className="text-xl sm:text-2xl font-black text-blue-300">
                  {teacherDisplayName
                    .replace(/^(Prof\.?|Profa\.?|Dr\.?)\s+/i, "")
                    .split(" ")
                    .slice(0, 2)
                    .map((n) => n[0])
                    .join("")}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  {teacherDisplayName}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/40">
                  Docente Titular • Física & Matemática
                </span>
              </div>
              <p className="text-xs sm:text-sm text-zinc-300 font-medium">
                Aula Ativa:{" "}
                <strong className="text-white">
                  {workspace?.activeClass?.name ?? "2º Ano B"} • Física Aplicada
                </strong>{" "}
                ({workspace?.activeClass?.roomId ?? "SALA 08"})
              </p>
              <div className="flex items-center gap-3 text-[11px] text-zinc-300 mt-1">
                <span className="text-cyan-400 font-semibold flex items-center gap-1">
                  <Clock size={13} /> Horário: 08:40 - 09:30
                </span>
                <span>•</span>
                <span>{workspace ? `${effectiveRoster.length} Alunos em Turma` : "32 Alunos Matriculados"}</span>
              </div>
            </div>
          </div>

          {/* Edge Sync Status & Top Actions */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full lg:w-auto">
            <div className="flex flex-col gap-1 w-full sm:w-auto">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-300">
                  Sincronização Edge / Diário:
                </span>
                <span
                  data-testid="teacher-sync-state-badge"
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    attendanceStatusIsError
                      ? "bg-red-500/15 text-red-300 border-red-500/40"
                      : attendanceStatusIsApplied
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                        : "bg-amber-500/10 text-amber-300 border-amber-500/30"
                  }`}
                >
                  {attendanceStatusLabel}
                </span>
              </div>
              <span className="text-[10px] font-mono text-zinc-400 truncate max-w-[260px]">
                {sigaWebHash
                  ? `Hash: ${sigaWebHash}`
                  : workspace?.lastAttendanceSync?.commandId
                    ? `Chamada Cmd: ${workspace.lastAttendanceSync.commandId}`
                    : "Aguardando registro de chamada"}
              </span>
              {workspace?.lastDiarySync && (
                <div className="flex items-center gap-1.5" data-testid="teacher-last-diary-sync">
                  <span className="text-[10px] uppercase font-bold text-zinc-400">Diário:</span>
                  <PropagationStatusBadge
                    status={workspace.lastDiarySync.status}
                    commandId={workspace.lastDiarySync.commandId}
                  />
                </div>
              )}
            </div>

            <EliteButton
              variant={attendanceStatusIsApplied ? "secondary" : "primary"}
              size="sm"
              onClick={handleSyncSigaWeb}
              disabled={isSyncingSigaWeb}
              className="w-full sm:w-auto gap-2"
            >
              <RefreshCw size={14} className={isSyncingSigaWeb ? "animate-spin" : ""} />
              {isSyncingSigaWeb ? "Sincronizando..." : "Enviar Chamada ao Edge"}
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
        className="flex flex-wrap items-center gap-2 border-b border-white/10 pb-2"
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
          <Zap size={16} className="text-amber-400" /> Áquila Lab 3D &amp; Simulações
          <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
            Física &amp; Matemática
          </span>
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
          {effectiveRoster.length === 0 ? (
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-xs text-zinc-300">
              Nenhum estudante matriculado nesta turma até o momento.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {effectiveRoster.map((student) => (
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
                      ? `PRESENTE (${student.confidence <= 1 ? Math.round(student.confidence * 100) : Math.round(student.confidence)}%)`
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
          )}
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
            <div className="flex items-center gap-2 flex-wrap">
              <EliteButton
                variant="secondary"
                size="sm"
                onClick={() => void handleSaveAssessment(false)}
              >
                Salvar Rascunho
              </EliteButton>
              <EliteButton
                variant="primary"
                size="sm"
                onClick={() => void handleSaveAssessment(true)}
              >
                Aprovar Avaliação HITL (CNE 2026)
              </EliteButton>
              <EliteButton variant="secondary" size="sm" onClick={() => window.print()} className="gap-2">
                <Printer size={14} /> Imprimir Folha A4 & Cartão OMR
              </EliteButton>
            </div>
          </div>

          {examSaveError && (
            <div
              role="alert"
              className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/35 text-xs text-rose-200 font-semibold flex items-center gap-2"
            >
              <AlertTriangle size={14} className="shrink-0" />
              <span>{examSaveError}</span>
            </div>
          )}

          {examSaveBanner && (
            <div
              role="status"
              className="p-3 rounded-xl bg-cyan-500/15 border border-cyan-500/35 text-xs text-cyan-200 font-semibold flex flex-wrap items-center justify-between gap-2"
            >
              <span>✓ {examSaveBanner}</span>
              {examCommandMeta && (
                <PropagationStatusBadge
                  status={examCommandMeta.propagationStatus}
                  commandId={examCommandMeta.commandId}
                />
              )}
            </div>
          )}

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

          <TeacherHitlQueue
            submissions={workspace?.pendingSubmissions ?? []}
            studentNamesById={studentNamesById}
            onApproveSubmission={async (submissionId, finalScore, feedback) => {
              const res = await mutate<{
                commandId?: string;
                propagationStatus?: string;
                syncStatus?: string;
              }>("reviewSubmissionGrade", {
                submissionId,
                finalScore,
                feedback,
              });
              if (res.ok) {
                await reload();
                return {
                  ok: true,
                  commandId: res.data?.commandId,
                  propagationStatus:
                    res.data?.propagationStatus ?? res.data?.syncStatus ?? "pending_at_edge",
                };
              }
              if (res.offlineFallback) {
                return { ok: true };
              }
              return { ok: false, error: res.error };
            }}
          />
        </EagleCard>
      )}

      {/* Tab 3: Diário de Classe Digital */}
      {activeTab === "diario" && (
        <EagleCard glow="blue" className="p-6 flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-white">Registro de Aula & Conteúdo BNCC</h2>
              <p className="text-xs text-zinc-300">
                Diário em conformidade com as diretrizes do Conselho Estadual de Educação e assinatura SHA-256. Apenas registros publicados aparecem para as famílias.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <PropagationStatusBadge
                status={effectiveDiarySyncStatus}
                commandId={effectiveDiaryCommandId}
              />
              {effectiveDiarySigned ? (
                <span className="px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5">
                  <Check size={14} /> Assinado Digitalmente (SHA-256 / LDB)
                  {effectiveDiaryHash ? ` • ${effectiveDiaryHash.slice(0, 12)}...` : ""}
                </span>
              ) : (
                <>
                  <EliteButton
                    variant="secondary"
                    size="sm"
                    onClick={() => void handleSaveDiary(false)}
                  >
                    Salvar Rascunho
                  </EliteButton>
                  <EliteButton
                    variant="primary"
                    size="sm"
                    onClick={() => void handleSaveDiary(true)}
                  >
                    Registrar & Assinar Diário SHA-256
                  </EliteButton>
                </>
              )}
            </div>
          </div>

          {diaryError && (
            <div
              role="alert"
              className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/35 text-xs text-rose-200 font-semibold flex items-center gap-2"
            >
              <AlertTriangle size={14} className="shrink-0" />
              <span>{diaryError}</span>
            </div>
          )}

          {diaryStatusBanner && (
            <div
              role="status"
              className="p-3 rounded-xl bg-blue-500/15 border border-blue-500/35 text-xs text-blue-200 font-semibold"
            >
              ✓ {diaryStatusBanner}
            </div>
          )}

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="diary-topic-input"
                className="text-xs font-bold uppercase tracking-wider text-zinc-300"
              >
                Tema da Aula
              </label>
              <input
                id="diary-topic-input"
                type="text"
                value={effectiveDiaryTopic}
                onChange={(e) => setDiaryTopicDraft(e.target.value)}
                placeholder="Ex.: Primeira Lei da Termodinâmica"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs sm:text-sm text-zinc-200 outline-none focus:border-blue-400 transition-all"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="diary-content-textarea"
                className="text-xs font-bold uppercase tracking-wider text-zinc-300"
              >
                Conteúdo Programático Ministrado
              </label>
              <textarea
                id="diary-content-textarea"
                value={effectiveDiaryContent}
                onChange={(e) => setDiaryContentDraft(e.target.value)}
                rows={3}
                placeholder="Descreva os conceitos trabalhados em sala..."
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
              <label
                htmlFor="diary-homework-input"
                className="text-xs font-bold uppercase tracking-wider text-zinc-300"
              >
                Tarefas & Estudos Complementares
              </label>
              <input
                id="diary-homework-input"
                type="text"
                value={effectiveDiaryHomework}
                onChange={(e) => setDiaryHomeworkDraft(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs sm:text-sm text-zinc-200 outline-none focus:border-blue-400 transition-all"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="diary-dinner-prompt-input"
                className="text-xs font-bold uppercase tracking-wider text-zinc-300"
              >
                Pauta Conversas para o Jantar (Visível às Famílias após Publicação)
              </label>
              <input
                id="diary-dinner-prompt-input"
                type="text"
                value={effectiveDiaryDinnerPrompt}
                onChange={(e) => setDiaryDinnerPromptDraft(e.target.value)}
                placeholder="Pergunta aberta para estimular diálogo em família..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs sm:text-sm text-zinc-200 outline-none focus:border-blue-400 transition-all"
              />
            </div>

            {effectiveDiarySigned && (
              <div className="flex justify-end gap-2">
                <EliteButton
                  variant="secondary"
                  size="sm"
                  onClick={() => void handleSaveDiary(false)}
                >
                  Converter em Rascunho
                </EliteButton>
                <EliteButton
                  variant="primary"
                  size="sm"
                  onClick={() => void handleSaveDiary(true)}
                >
                  Atualizar & Reassinar Diário
                </EliteButton>
              </div>
            )}
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

          {radarError && (
            <div
              role="alert"
              className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/35 text-xs text-rose-200 font-semibold flex items-center gap-2"
            >
              <AlertTriangle size={14} className="shrink-0" />
              <span>{radarError}</span>
            </div>
          )}

          {(() => {
            const radarItems = hasServerWorkspace
              ? workspace.occurrences.map((occ) => ({
                  id: occ.id,
                  name: studentNamesById[occ.studentId] || occ.title,
                  issue: occ.description,
                  suggestion:
                    occ.recommendedAction ??
                    "Registrar acompanhamento individualizado e enviar devolutiva à família.",
                  severity:
                    occ.severity === "high"
                      ? "Alta"
                      : occ.severity === "medium"
                        ? "Média"
                        : "Baixa",
                  applied: radarAppliedMap[occ.id] ?? occ.actionApplied ?? null,
                  propagationStatus:
                    radarCommandMetaMap[occ.id]?.propagationStatus ?? occ.propagationStatus ?? null,
                  edgeCommandId:
                    radarCommandMetaMap[occ.id]?.commandId ?? occ.edgeCommandId ?? null,
                }))
              : isOfflinePreview
                ? [
                    {
                      id: "rad-1",
                      name: "Lucas Andrade",
                      issue: "Oscilação de foco identificada nas últimas 2 semanas em Termodinâmica.",
                      suggestion: "Aplicar lista de reforço conceitual sobre Trabalho em Processos Gasosos.",
                      severity: "Média",
                      applied: radarAppliedMap["rad-1"] ?? null,
                      propagationStatus: null as string | null,
                      edgeCommandId: null as string | null,
                    },
                    {
                      id: "rad-2",
                      name: "Sofia Costa",
                      issue: "Dúvidas recorrentes em cálculo de rendimento de máquinas térmicas.",
                      suggestion: "Agendar monitoria com o Tutor IA Áquila focado em ciclo de Carnot.",
                      severity: "Baixa",
                      applied: radarAppliedMap["rad-2"] ?? null,
                      propagationStatus: null as string | null,
                      edgeCommandId: null as string | null,
                    },
                    {
                      id: "rad-3",
                      name: "Matheus Lima",
                      issue: "2 faltas consecutivas sem justificativa prévia (Radar LDB).",
                      suggestion: "Notificar coordenação pedagógica para contato com a família.",
                      severity: "Alta",
                      applied: radarAppliedMap["rad-3"] ?? null,
                      propagationStatus: null as string | null,
                      edgeCommandId: null as string | null,
                    },
                  ]
                : [];

            if (radarItems.length === 0) {
              return (
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-xs text-zinc-300">
                  Nenhuma ocorrência ou alerta pedagógico ativo para esta turma no momento.
                </div>
              );
            }

            return (
              <div className="flex flex-col gap-3">
                {radarItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl bg-white/5 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex flex-col gap-1">
                      <div className="flex flex-wrap items-center gap-2">
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
                        <PropagationStatusBadge
                          status={item.propagationStatus}
                          commandId={item.edgeCommandId}
                        />
                      </div>
                      <p className="text-xs text-zinc-300">{item.issue}</p>
                      <p className="text-xs text-cyan-300/90">💡 Ação recomendada: {item.suggestion}</p>
                      {item.applied && (
                        <span className="text-[11px] text-emerald-300 font-semibold">
                          ✓ Intervenção aplicada: {item.applied}
                        </span>
                      )}
                    </div>

                    <EliteButton
                      variant="secondary"
                      size="sm"
                      onClick={() => void handleApplyRadarAction(item.id, item.suggestion)}
                      className="whitespace-nowrap"
                    >
                      {item.applied ? "Ação Registrada" : "Aplicar Ação"}
                    </EliteButton>
                  </div>
                ))}
              </div>
            );
          })()}
        </EagleCard>
      )}

      {/* Tab 5: Notas Bimestrais */}
      {activeTab === "notas" && (
        <EagleCard glow="purple" className="p-6 flex flex-col gap-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-white">
                Planilha de Notas • {workspace?.activeClass?.name ?? (isOfflinePreview ? "2º Ano B" : "Turma")} (Física)
              </h2>
              <p className="text-xs text-zinc-300">
                Edição e sincronização direta com a base de dados central sob revisão humana (Parecer CNE/CP nº 15/2026).
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <label className="text-[11px] text-zinc-300 flex items-center gap-1.5">
                <span>Tipo:</span>
                <select
                  aria-label="Tipo de avaliação"
                  value={gradesEvaluationType}
                  onChange={(e) =>
                    setGradesEvaluationType(
                      e.target.value as "prova" | "trabalho" | "participacao"
                    )
                  }
                  className="bg-zinc-900 border border-white/15 rounded-lg px-2 py-1 text-xs text-white"
                >
                  <option value="prova">Prova</option>
                  <option value="trabalho">Trabalho</option>
                  <option value="participacao">Participação</option>
                </select>
              </label>
              <label className="text-[11px] text-zinc-300 flex items-center gap-1.5">
                <span>Nota Máx:</span>
                <input
                  type="number"
                  min={1}
                  max={100}
                  step={1}
                  aria-label="Nota máxima da avaliação"
                  value={gradesMaxScore}
                  onChange={(e) =>
                    setGradesMaxScore(Math.min(100, Math.max(1, Number(e.target.value) || 10)))
                  }
                  className="w-16 bg-zinc-900 border border-white/15 rounded-lg px-2 py-1 text-xs text-white text-center"
                />
              </label>
              <button
                type="button"
                disabled={hasServerWorkspace && effectiveRoster.length === 0}
                onClick={() => void handleSaveGradesBatch()}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition whitespace-nowrap disabled:opacity-50"
              >
                Salvar &amp; Publicar Notas (CNE 2026)
              </button>
            </div>
          </div>

          {gradesSaveError && (
            <div
              role="alert"
              className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/35 text-xs text-rose-200 font-semibold flex items-center gap-2"
            >
              <AlertTriangle size={14} className="shrink-0" />
              <span>{gradesSaveError}</span>
            </div>
          )}

          {gradesSaveBanner && (
            <div
              role="status"
              className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/35 text-xs text-emerald-200 font-semibold flex flex-wrap items-center justify-between gap-2"
            >
              <span>✓ {gradesSaveBanner}</span>
              {gradesCommandMeta && (
                <PropagationStatusBadge
                  status={gradesCommandMeta.propagationStatus}
                  commandId={gradesCommandMeta.commandId}
                />
              )}
            </div>
          )}

          {(() => {
            const tableRows = hasServerWorkspace
              ? effectiveRoster.map((student) => {
                  const dbGrade =
                    workspace.grades.find(
                      (g) =>
                        g.studentId === student.id &&
                        g.evaluationType === gradesEvaluationType
                    ) ?? workspace.grades.find((g) => g.studentId === student.id);
                  return {
                    id: student.id,
                    name: student.name,
                    score: dbGrade?.score ?? null,
                    maxScore: dbGrade?.maxScore ?? gradesMaxScore,
                    status: dbGrade?.status ?? null,
                    propagationStatus: dbGrade?.propagationStatus ?? null,
                    edgeCommandId: dbGrade?.edgeCommandId ?? null,
                    contestationStatus: dbGrade?.contestationStatus ?? "none",
                    contestationReason: dbGrade?.contestationReason ?? null,
                  };
                })
              : isOfflinePreview
                ? [
                    { id: "std_001", name: "Lucas Andrade", score: 8.9, maxScore: 10, status: "published", propagationStatus: null, edgeCommandId: null, contestationStatus: "none", contestationReason: null },
                    { id: "std_002", name: "Sofia Costa", score: 7.8, maxScore: 10, status: "published", propagationStatus: null, edgeCommandId: null, contestationStatus: "none", contestationReason: null },
                    { id: "std_003", name: "Gabriel Santos", score: 7.6, maxScore: 10, status: "published", propagationStatus: null, edgeCommandId: null, contestationStatus: "none", contestationReason: null },
                    { id: "std_004", name: "Helena Oliveira", score: 9.6, maxScore: 10, status: "published", propagationStatus: null, edgeCommandId: null, contestationStatus: "none", contestationReason: null },
                  ]
                : [];

            if (tableRows.length === 0) {
              return (
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-xs text-zinc-300">
                  Nenhum estudante matriculado nesta turma para lançamento de notas.
                </div>
              );
            }

            return (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-[11px] uppercase tracking-wider text-zinc-300">
                      <th className="py-3 px-4 font-bold">Aluno</th>
                      <th className="py-3 px-3 text-center font-bold">Tipo / Máx</th>
                      <th className="py-3 px-3 text-center font-bold">Nota Editável</th>
                      <th className="py-3 px-3 text-center font-bold">Status / Edge</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {tableRows.map((row) => {
                      const draftValue = gradeDraftByStudent[row.id];
                      const displayValue =
                        draftValue !== undefined
                          ? draftValue
                          : row.score !== null
                            ? row.score.toFixed(1)
                            : "";
                      const numericPreview =
                        displayValue !== "" && Number.isFinite(Number(displayValue))
                          ? Number(displayValue).toFixed(1)
                          : "—";
                      return (
                        <tr key={row.id} className="hover:bg-white/5 transition-colors">
                          <td className="py-3 px-4 font-semibold text-white">
                            <div className="flex flex-col gap-0.5">
                              <span>{row.name}</span>
                              {row.contestationStatus === "contested" && (
                                <span className="text-[10px] text-amber-300 font-normal">
                                  Contestada: {row.contestationReason || "Aguardando revisão"}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-3 text-center text-zinc-300 uppercase text-[11px] font-mono">
                            {gradesEvaluationType} / {gradesMaxScore}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <input
                              type="number"
                              min={0}
                              max={gradesMaxScore}
                              step={0.1}
                              aria-label={`Nota de ${row.name}`}
                              placeholder="0.0"
                              value={displayValue}
                              onChange={(e) =>
                                setGradeDraftByStudent((prev) => ({
                                  ...prev,
                                  [row.id]: e.target.value,
                                }))
                              }
                              className="w-20 text-center bg-zinc-900 border border-white/15 rounded-lg px-2 py-1 text-xs font-bold text-white"
                            />
                          </td>
                          <td className="py-3 px-3 text-center font-bold text-cyan-300">
                            <div className="flex flex-col items-center gap-1">
                              <span>
                                {numericPreview} •{" "}
                                <span className="text-[10px] uppercase text-emerald-300">
                                  {row.status === "draft_ai"
                                    ? "RASCUNHO_IA"
                                    : row.status === "pending_review"
                                      ? "REVISÃO_HITL"
                                      : row.status === "published"
                                        ? "PUBLICADA"
                                        : "SEM NOTA"}
                                </span>
                              </span>
                              <PropagationStatusBadge
                                status={row.propagationStatus}
                                commandId={row.edgeCommandId}
                              />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          })()}
        </EagleCard>
      )}

      {/* Tab 6: Áquila Lab 3D & Simulações Pedagógicas Interativas */}
      {activeTab === "simulacoes" && (
        <div className="flex flex-col gap-6 animate-fade-in">
          {/* Teacher Assignment HUD */}
          <EagleCard glow="cyan" className="p-6 flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-cyan-300 px-2 py-0.5 rounded bg-cyan-500/20 border border-cyan-500/40">
                  Gestão de Laboratório Interativo • Projeto Áquila
                </span>
                <h2 className="text-xl font-black text-white mt-1">
                  Bancadas Virtuais &amp; Simulações Pedagógicas 3D
                </h2>
                <p className="text-xs text-zinc-300 mt-1">
                  Atribua bancadas experimentais com validação matemática desacoplada (resolução em tempo real no navegador, Windows e Android).
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    alert("✓ Bancada 01 (Circuito Elétrico & Leis de Ohm) atribuída como Missão ENEM obrigatória para a turma ativa!");
                  }}
                  className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-xs transition shadow-lg shadow-cyan-500/25 flex items-center gap-1.5"
                >
                  <Sparkles size={14} /> Atribuir Bancada à Turma
                </button>
              </div>
            </div>

            {/* Catalog of Reverse-Engineered Benches from Fichas Vivas */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { id: "b1", name: "01. Circuitos & Ohm", status: "Ativa • Pronta", icon: "⚡", active: true },
                { id: "b2", name: "02. Resistores Série/Paralelo", status: "Em Breve", icon: "🎛️", active: false },
                { id: "b3", name: "03. Óptica & Refração (Snell)", status: "Em Breve", icon: "🔍", active: false },
                { id: "b4", name: "04. Lançamento Balístico", status: "Em Breve", icon: "🎯", active: false },
              ].map((bench) => (
                <div
                  key={bench.id}
                  className={`p-3 rounded-xl border text-xs font-semibold flex flex-col gap-1 ${
                    bench.active
                      ? "bg-cyan-500/10 border-cyan-400/50 text-white shadow-md shadow-cyan-950/30"
                      : "bg-white/5 border-white/10 text-zinc-400 opacity-60"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-base">{bench.icon}</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                      bench.active ? "bg-cyan-400 text-black" : "bg-white/10 text-zinc-400"
                    }`}>
                      {bench.status}
                    </span>
                  </div>
                  <span className="mt-1 font-bold">{bench.name}</span>
                </div>
              ))}
            </div>
          </EagleCard>

          {/* Interactive Lab Preview */}
          <AquilaCircuitLab isTeacherView={true} />
        </div>
      )}
        </>
      )}
    </div>
  );
}
