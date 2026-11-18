"use client";

import { usePortalWorkspace, type ParentWorkspaceData } from "@/lib/usePortalData";
import { PortalSyncBanner, PropagationStatusBadge } from "@/components/PortalSyncBanner";
import { ParentLgpdModal } from "@/components/portals/ParentLgpdModal";

import React, { useState } from "react";
import Link from "next/link";
import {
  ShieldCheck, Clock, BookOpen, DollarSign, MessageCircle,
  CheckCircle2, QrCode, Copy, Check, X,
  FileText, Smartphone, Bell, Sparkles, Lock, AlertTriangle
} from "lucide-react";
import { EagleCard } from "@/components/ui/EagleCard";
import { EliteButton } from "@/components/ui/EliteButton";

export default function PortalPais() {
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return new URLSearchParams(window.location.search).get("studentId");
  });
  const workspaceEndpoint = selectedStudentId
    ? `/api/portal/pais?studentId=${encodeURIComponent(selectedStudentId)}`
    : "/api/portal/pais";
  const { data: workspace, loading, syncError, reload, mutate } =
    usePortalWorkspace<ParentWorkspaceData>(workspaceEndpoint);

  const handleSelectStudent = (studentId: string | null) => {
    setSelectedStudentId(studentId);
    setLgpdConsentOverride(null);
    setLgpdRevocationReceipt(null);
    setSignedReceipts({});
    setOccurrenceErrorById({});
    setContestingOccurrenceId(null);
    setOccurrenceContestReason("");
    setContestingGradeId(null);
    setGradeContestReason("");
    setGradeContestError(null);
    setLocalGradeContests({});
    setPixCommandMeta(null);
    setPixError(null);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (studentId) {
        url.searchParams.set("studentId", studentId);
      } else {
        url.searchParams.delete("studentId");
      }
      window.history.replaceState(null, "", url.toString());
    }
  };
  const [showLgpdOptInModal, setShowLgpdOptInModal] = useState(false);
  const [lgpdConsentOverride, setLgpdConsentOverride] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState<
    "avisos" | "jantar" | "boletim" | "financeiro" | "ocorrencias" | "contato"
  >("avisos");
  const [showPixModal, setShowPixModal] = useState(false);
  const [pixCopied, setPixCopied] = useState(false);
  const [pixSettled, setPixSettled] = useState(false);
  const [pixError, setPixError] = useState<string | null>(null);
  const [pixCommandMeta, setPixCommandMeta] = useState<{
    commandId?: string;
    reconciliationState?: string;
  } | null>(null);
  const [signedReceipts, setSignedReceipts] = useState<
    Record<
      string,
      {
        text: string;
        manifestationType: "SCIENCE_ACKNOWLEDGED" | "DISAGREEMENT_CONTESTATION";
        contestationReason?: string;
        commandId?: string;
        propagationStatus?: string;
      }
    >
  >({});
  const [contestingOccurrenceId, setContestingOccurrenceId] = useState<string | null>(null);
  const [occurrenceContestReason, setOccurrenceContestReason] = useState("");
  const [occurrenceErrorById, setOccurrenceErrorById] = useState<Record<string, string>>({});

  const [contestingGradeId, setContestingGradeId] = useState<string | null>(null);
  const [gradeContestReason, setGradeContestReason] = useState("");
  const [gradeContestError, setGradeContestError] = useState<string | null>(null);
  const [gradeContestSubmitting, setGradeContestSubmitting] = useState(false);
  const [localGradeContests, setLocalGradeContests] = useState<
    Record<string, { status: string; reason: string; commandId?: string; propagationStatus: string }>
  >({});

  // Onboarding LGPD 3 Passos & Estado de Consentimento (Art. 14 e 16)
  const [biometricConsentActive, setBiometricConsentActive] = useState(false);
  const [lgpdRevocationReceipt, setLgpdRevocationReceipt] = useState<string | null>(null);
  const [lgpdError, setLgpdError] = useState<string | null>(null);

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

  const hasServerWorkspace = workspace !== null;
  const isAccessBlocked = Boolean(syncError) && workspace === null;
  const isRevokedOrUnlinked = workspace !== null && workspace.activeStudent === null;
  const isOfflinePreview = workspace === null && !syncError;

  const activeStudentId = workspace?.activeStudent?.id ?? (isOfflinePreview ? "std_001" : "");
  const activeStudentName = workspace?.activeStudent?.name ?? (isOfflinePreview ? "Lucas Andrade" : "Estudante sem vínculo ativo");
  const guardianDisplayName = hasServerWorkspace
    ? workspace.guardianName ?? "Responsável autenticado"
    : isOfflinePreview
      ? "Sra. Patrícia Andrade"
      : "Responsável autenticado";
  const activeClassLabel = hasServerWorkspace
    ? workspace.activeClass?.name
      ? `${workspace.activeClass.name}${workspace.activeClass.roomId ? ` • ${workspace.activeClass.roomId}` : ""}`
      : "Turma não vinculada"
    : isOfflinePreview
      ? "2º Ano B"
      : "Turma indisponível";
  const effectiveConsentActive =
    lgpdConsentOverride ?? workspace?.biometricConsent.enabled ?? biometricConsentActive;
  const primaryInvoice = hasServerWorkspace ? (workspace.invoices[0] ?? null) : null;
  const effectivePixSettled = pixSettled || primaryInvoice?.status === "paid";
  const effectivePixReconciliationState =
    pixCommandMeta?.reconciliationState ??
    primaryInvoice?.reconciliationState ??
    (effectivePixSettled ? "PENDING_EDGE_RECONCILIATION" : null);
  const formattedInvoiceAmount = primaryInvoice
    ? `R$ ${(primaryInvoice.amount / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
    : isOfflinePreview
      ? "R$ 1.480,00"
      : "Sem fatura em aberto";
  const effectivePixPayload =
    primaryInvoice?.pixPayload ||
    (isOfflinePreview
      ? "00020126580014br.gov.bcb.pix0136aquila-demo-nov-202652040000530398654071480.005802BR"
      : "");

  const effectiveOccurrences = hasServerWorkspace
    ? workspace.occurrences.map((occ) => {
        const override = signedReceipts[occ.id];
        const dbSigned = Boolean(occ.signedAt);
        const dbHashPreview = occ.signatureHashSha256
          ? ` (SHA-256: ${occ.signatureHashSha256.slice(0, 16)}...)`
          : "";
        return {
          id: occ.id,
          date: new Date(occ.createdAt).toLocaleDateString("pt-BR"),
          time: new Date(occ.createdAt).toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          type: occ.category,
          title: occ.title,
          desc: occ.description,
          signed: Boolean(override) || dbSigned,
          manifestationType: override?.manifestationType ?? occ.manifestationType ?? null,
          contestationReason: override?.contestationReason ?? occ.contestationReason ?? null,
          propagationStatus: override?.propagationStatus ?? occ.propagationStatus ?? null,
          edgeCommandId: override?.commandId ?? occ.edgeCommandId ?? null,
          signedAt:
            override?.text ||
            (dbSigned
              ? `${new Date(occ.signedAt as string | Date).toLocaleString("pt-BR")}${dbHashPreview}`
              : ""),
        };
      })
    : isOfflinePreview
      ? occurrences.map((occ) => {
          const override = signedReceipts[occ.id];
          return {
            ...occ,
            manifestationType: override?.manifestationType ?? (occ.signed ? "SCIENCE_ACKNOWLEDGED" : null),
            contestationReason: override?.contestationReason ?? null,
            propagationStatus: override?.propagationStatus ?? null,
            edgeCommandId: override?.commandId ?? null,
          };
        })
      : [];

  const effectiveGrades = hasServerWorkspace
    ? workspace.grades
        .filter((g) => g.status === "published")
        .map((g) => {
          const override = localGradeContests[g.id];
          return {
            id: g.id,
            subject: g.subject,
            grade: g.score,
            maxScore: g.maxScore || 10,
            trend: g.evaluationType,
            status: "Revisada CNE 2026",
            propagationStatus: override?.propagationStatus ?? g.propagationStatus ?? null,
            edgeCommandId: override?.commandId ?? g.edgeCommandId ?? null,
            contestationStatus: override?.status ?? g.contestationStatus ?? "none",
            contestationReason: override?.reason ?? g.contestationReason ?? null,
          };
        })
    : isOfflinePreview
      ? [
          {
            id: "mock-1",
            subject: "Matemática",
            grade: 9.2,
            maxScore: 10,
            trend: "+0.4",
            status: "Evoluindo",
            propagationStatus: null as string | null,
            edgeCommandId: null as string | null,
            contestationStatus: localGradeContests["mock-1"]?.status ?? "none",
            contestationReason: localGradeContests["mock-1"]?.reason ?? null,
          },
          {
            id: "mock-2",
            subject: "Física",
            grade: 8.9,
            maxScore: 10,
            trend: "+0.6",
            status: "Evoluindo",
            propagationStatus: null as string | null,
            edgeCommandId: null as string | null,
            contestationStatus: localGradeContests["mock-2"]?.status ?? "none",
            contestationReason: localGradeContests["mock-2"]?.reason ?? null,
          },
          {
            id: "mock-3",
            subject: "Redação ENEM",
            grade: 9.6,
            maxScore: 10,
            trend: "+0.8",
            status: "Destaque",
            propagationStatus: null as string | null,
            edgeCommandId: null as string | null,
            contestationStatus: localGradeContests["mock-3"]?.status ?? "none",
            contestationReason: localGradeContests["mock-3"]?.reason ?? null,
          },
          {
            id: "mock-4",
            subject: "Química",
            grade: 8.8,
            maxScore: 10,
            trend: "+0.2",
            status: "Estável",
            propagationStatus: null as string | null,
            edgeCommandId: null as string | null,
            contestationStatus: localGradeContests["mock-4"]?.status ?? "none",
            contestationReason: localGradeContests["mock-4"]?.reason ?? null,
          },
          {
            id: "mock-5",
            subject: "Biologia",
            grade: 9.4,
            maxScore: 10,
            trend: "+0.3",
            status: "Evoluindo",
            propagationStatus: null as string | null,
            edgeCommandId: null as string | null,
            contestationStatus: localGradeContests["mock-5"]?.status ?? "none",
            contestationReason: localGradeContests["mock-5"]?.reason ?? null,
          },
          {
            id: "mock-6",
            subject: "História",
            grade: 9.1,
            maxScore: 10,
            trend: "-0.2",
            status: "Atenção Leve",
            propagationStatus: null as string | null,
            edgeCommandId: null as string | null,
            contestationStatus: localGradeContests["mock-6"]?.status ?? "none",
            contestationReason: localGradeContests["mock-6"]?.reason ?? null,
          },
        ]
      : [];

  const averageGrade =
    effectiveGrades.length > 0
      ? effectiveGrades.reduce((sum, item) => sum + item.grade, 0) / effectiveGrades.length
      : null;

  const dinnerConversations = hasServerWorkspace
    ? workspace.dinnerConversations
    : isOfflinePreview
      ? [
          {
            id: "dc-1",
            subject: "Física Aplicada • Termodinâmica",
            topic: "Como geladeiras e motores funcionam no dia a dia",
            prompt: "“Lucas, o professor comentou hoje sobre máquinas térmicas. Como um motor de carro transforma calor em movimento sem desperdiçar toda a energia?”",
            context: "Conectado à aula das 08:40 (EM13CNT302) com o Prof. Ricardo.",
          },
          {
            id: "dc-2",
            subject: "Redação & Cidadania",
            topic: "Ética no uso de Inteligência Artificial nas escolas",
            prompt: "“Se você pudesse criar uma regra para o uso responsável de IA pelos estudantes no Brasil, qual seria a sua proposta principal?”",
            context: "Conectado ao tema da Redação Modelo ENEM trabalhado nesta semana.",
          },
          {
            id: "dc-3",
            subject: "Biologia Celular",
            topic: "Energia celular e alimentação saudável",
            prompt: "“O que acontece dentro das nossas células quando fazemos exercício físico intenso e precisamos de energia rápida?”",
            context: "Conectado à revisão espaçada concluída por Lucas ontem.",
          },
        ]
      : [];

  const effectiveAttendanceRate = hasServerWorkspace
    ? workspace.attendanceRate
    : isOfflinePreview
      ? 98.4
      : 0;

  const effectiveAttendanceTimeline = hasServerWorkspace
    ? workspace.attendanceTimeline.map((ev) => ({
        time: `${ev.date} • ${ev.time}`,
        title:
          ev.status === "present"
            ? `Presença Confirmada (${ev.channel})`
            : `Registro: ${ev.status} (${ev.channel})`,
        desc: "Validado via Crachá QR / Chamada Nominal com integridade LGPD.",
      }))
    : isOfflinePreview
      ? [
          { time: "07:12:04", title: "Entrada Confirmada • Portaria Sul", desc: "Acesso validado localmente (LGPD Soberana)." },
          { time: "09:30:15", title: "Intervalo Supervisionado • Pátio Central", desc: "Comunicado: Feira de Ciências confirmada para sexta-feira às 10h." },
          { time: "12:35:00", title: "Previsão de Saída Regular", desc: "Liberação programada ao término do turno matutino." },
        ]
      : [];

  const handleSign = async (
    id: string,
    manifestationType: "SCIENCE_ACKNOWLEDGED" | "DISAGREEMENT_CONTESTATION" = "SCIENCE_ACKNOWLEDGED",
    contestationReason?: string
  ): Promise<boolean> => {
    setOccurrenceErrorById((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    if (manifestationType === "DISAGREEMENT_CONTESTATION") {
      const trimmed = (contestationReason || "").trim();
      if (trimmed.length < 5) {
        setOccurrenceErrorById((prev) => ({
          ...prev,
          [id]: "Informe o motivo da contestação com pelo menos 5 caracteres.",
        }));
        return false;
      }
    }

    const prevReceipt = signedReceipts[id];
    const prevOccurrences = occurrences;
    const time = new Date().toLocaleString("pt-BR");
    const optimisticReceipt = {
      text: `${time} (Registrando manifestação no servidor...)`,
      manifestationType,
      contestationReason: contestationReason?.trim(),
      propagationStatus: "received_by_server",
    };
    setSignedReceipts((prev) => ({ ...prev, [id]: optimisticReceipt }));
    setOccurrences((prev) =>
      prev.map((o) => (o.id === id ? { ...o, signed: true, signedAt: optimisticReceipt.text } : o))
    );
    const res = await mutate<{
      signatureHashSha256?: string;
      syncStatus?: string;
      propagationStatus?: string;
      edgeCommandId?: string;
      commandId?: string;
    }>("signOccurrence", {
      occurrenceId: id,
      manifestationType,
      ...(manifestationType === "DISAGREEMENT_CONTESTATION" && contestationReason
        ? { contestationReason: contestationReason.trim() }
        : {}),
    });
    if (res.ok && res.data?.signatureHashSha256) {
      const hashPreview = res.data.signatureHashSha256.slice(0, 16);
      const label =
        manifestationType === "DISAGREEMENT_CONTESTATION"
          ? "Contestação recebida pelo servidor • Aguardando confirmação na Escola (Edge)"
          : "Ciência recebida pelo servidor • Aguardando confirmação na Escola (Edge)";
      const verifiedReceipt = {
        text: `${time} • ${label} (SHA-256: ${hashPreview}...)`,
        manifestationType,
        contestationReason: contestationReason?.trim(),
        commandId: res.data.edgeCommandId || res.data.commandId,
        propagationStatus: res.data.propagationStatus || "pending_at_edge",
      };
      setSignedReceipts((prev) => ({ ...prev, [id]: verifiedReceipt }));
      setOccurrences((prev) =>
        prev.map((o) => (o.id === id ? { ...o, signed: true, signedAt: verifiedReceipt.text } : o))
      );
      setContestingOccurrenceId(null);
      setOccurrenceContestReason("");
      return true;
    }
    if (res.offlineFallback) {
      setContestingOccurrenceId(null);
      setOccurrenceContestReason("");
      return true;
    }
    setOccurrences(prevOccurrences);
    setSignedReceipts((prev) => {
      const next = { ...prev };
      if (prevReceipt === undefined) {
        delete next[id];
      } else {
        next[id] = prevReceipt;
      }
      return next;
    });
    setOccurrenceErrorById((prev) => ({
      ...prev,
      [id]: res.error || "Não foi possível registrar a manifestação desta ocorrência.",
    }));
    return false;
  };

  const handleSubmitGradeContestation = async (gradeId: string) => {
    const trimmed = gradeContestReason.trim();
    if (trimmed.length < 10) {
      setGradeContestError("Descreva a justificativa pedagógica com pelo menos 10 caracteres.");
      return;
    }
    setGradeContestError(null);
    setGradeContestSubmitting(true);
    const res = await mutate<{ commandId?: string; syncStatus?: string }>("contestGrade", {
      gradeId,
      reason: trimmed,
    });
    setGradeContestSubmitting(false);
    if (!res.ok && !res.offlineFallback) {
      setGradeContestError(res.error || "Não foi possível enviar a contestação da nota.");
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

  const handleRevokeAndPurgeLgpd = async () => {
    if (!activeStudentId) return;
    setLgpdError(null);
    const prevOverride = lgpdConsentOverride;
    const prevActive = biometricConsentActive;
    const prevReceipt = lgpdRevocationReceipt;

    setLgpdConsentOverride(false);
    setBiometricConsentActive(false);
    const stamp = new Date().toLocaleString("pt-BR");
    setLgpdRevocationReceipt(`Enviando revogação Art. 16 ao servidor em ${stamp}...`);

    const res = await mutate<{
      auditSignatureSha256?: string;
      propagationStatus?: string;
      purgeLogId?: string;
      edgeCommandId?: string;
      retentionNotice?: string;
    }>("setBiometricConsent", {
      studentId: activeStudentId,
      decision: "revoke",
    });
    if (res.ok && res.data?.auditSignatureSha256) {
      const cmdTag = res.data.edgeCommandId ? ` • Cmd Edge: ${res.data.edgeCommandId}` : "";
      const retention =
        res.data.retentionNotice ||
        "Trilha de auditoria e registros legais permanecem retidos pelo prazo legal (exclusão imediata apenas de templates opcionais no Edge após confirmação).";
      setLgpdRevocationReceipt(
        `Revogação Art. 16 registrada no servidor (${stamp}) • Status: ${res.data.propagationStatus || "pending_at_edge"}${cmdTag} • SHA-256: ${res.data.auditSignatureSha256.slice(0, 20)}... (${retention})`
      );
      return;
    }
    if (!res.ok && !res.offlineFallback) {
      setLgpdConsentOverride(prevOverride);
      setBiometricConsentActive(prevActive);
      setLgpdRevocationReceipt(prevReceipt);
      setLgpdError(res.error || "Falha ao registrar revogação LGPD.");
    }
  };

  const handleGrantLgpdOptIn = async (
    guardianName: string,
    guardianCpf: string
  ): Promise<{ ok: boolean; error?: string }> => {
    if (!activeStudentId) {
      return { ok: false, error: "Nenhum estudante ativo selecionado." };
    }
    setLgpdError(null);
    const res = await mutate<{
      auditSignatureSha256?: string;
      consentLogId?: string;
      edgeCommandId?: string;
      propagationStatus?: string;
    }>("setBiometricConsent", {
      studentId: activeStudentId,
      decision: "grant",
      guardianName,
      guardianCpf,
    });
    if (res.ok || res.offlineFallback) {
      setLgpdConsentOverride(true);
      setBiometricConsentActive(true);
      const stamp = new Date().toLocaleString("pt-BR");
      const cmdTag = res.data?.edgeCommandId ? ` • Cmd Edge: ${res.data.edgeCommandId}` : "";
      setLgpdRevocationReceipt(
        `Consentimento Art. 14 recebido pelo servidor (${stamp}) • Status: ${res.data?.propagationStatus || "pending_at_edge"}${cmdTag}${
          res.data?.auditSignatureSha256
            ? ` • SHA-256: ${res.data.auditSignatureSha256.slice(0, 20)}...`
            : ""
        }`
      );
      return { ok: true };
    }
    return {
      ok: false,
      error: res.error || "Não foi possível validar o CPF ou registrar o consentimento.",
    };
  };

  const handleCopyPix = () => {
    if (!effectivePixPayload) return;
    setPixCopied(true);
    navigator.clipboard?.writeText(effectivePixPayload);
    setTimeout(() => setPixCopied(false), 2500);
  };

  const handleSettlePix = async () => {
    if (!primaryInvoice && !isOfflinePreview) return;
    setPixError(null);
    const res = await mutate<{
      commandId?: string;
      reconciliationState?: string;
      syncStatus?: string;
    }>("confirmPixPayment", {
      invoiceId: primaryInvoice?.id || "inv_001",
    });
    if (res.ok || res.offlineFallback) {
      setPixSettled(true);
      if (res.data) {
        setPixCommandMeta({
          commandId: res.data.commandId,
          reconciliationState: res.data.reconciliationState || "PENDING_EDGE_RECONCILIATION",
        });
      }
      if (res.ok) {
        await reload();
      }
      setTimeout(() => {
        setShowPixModal(false);
      }, 1200);
      return;
    }
    setPixError(res.error || "Não foi possível registrar a confirmação PIX.");
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <PortalSyncBanner
        portalLabel="Portal das Famílias"
        loading={loading}
        syncError={syncError}
        syncedFromDb={Boolean(workspace)}
        syncState={workspace?.syncStatus?.state}
        pendingCommandCount={workspace?.syncStatus?.pendingCommandCount}
        lastSyncedAt={workspace?.syncStatus?.lastSyncedAt}
        staleReason={workspace?.syncStatus?.staleReason}
        onRefresh={reload}
        complianceNote="LGPD Art. 14/16 • Acesso restrito aos vínculos familiares autorizados & Notas revisadas (CNE 15/2026)"
      />

      {isAccessBlocked && (
        <EagleCard
          glow="amber"
          className="p-6 border-red-500/40 bg-red-950/20 flex flex-col gap-4"
          data-testid="parent-access-blocked"
        >
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-black uppercase tracking-wider text-red-300">
              Acesso Restrito • Proteção por Vínculo
            </span>
            <h1 className="text-xl font-black text-white">
              Consulta não autorizada para este estudante ou sessão expirada
            </h1>
            <p className="text-sm text-zinc-200">{syncError}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {selectedStudentId && (
              <EliteButton
                variant="primary"
                size="sm"
                onClick={() => handleSelectStudent(null)}
              >
                Carregar Estudante Vinculado
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

      {!isAccessBlocked && isRevokedOrUnlinked && (
        <EagleCard
          glow="amber"
          className="p-6 border-amber-500/40 bg-amber-950/20 flex flex-col gap-3"
          data-testid="parent-no-active-student"
        >
          <span className="text-[11px] font-black uppercase tracking-wider text-amber-300">
            Vínculo Familiar Inativo ou Revogado
          </span>
          <h1 className="text-xl font-black text-white">
            Nenhum estudante ativo vinculado a {guardianDisplayName}
          </h1>
          <p className="text-sm text-zinc-200 leading-relaxed">
            Por determinação de privacidade (LGPD e Parecer CNE/CP nº 15/2026), dados escolares e boletins ficam indisponíveis assim que o vínculo de responsabilidade é encerrado ou revogado pela instituição.
          </p>
        </EagleCard>
      )}

      {!isAccessBlocked && !isRevokedOrUnlinked && (
        <>
      {workspace && workspace.students.length > 1 && (
        <div className="flex flex-wrap items-center gap-2" data-testid="guardian-student-switcher">
          <span className="text-xs font-semibold text-zinc-300 mr-1">Estudantes vinculados:</span>
          {workspace.students.map((st) => (
            <button
              key={st.id}
              type="button"
              onClick={() => handleSelectStudent(st.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                st.id === activeStudentId
                  ? "bg-emerald-500/25 text-emerald-200 border border-emerald-400/50"
                  : "bg-white/5 text-zinc-300 border border-white/10 hover:bg-white/10"
              }`}
            >
              {st.name}
            </button>
          ))}
        </div>
      )}

      {/* Guardian Header HUD */}
      <EagleCard glow="cyan" className="p-5 sm:p-7 border-emerald-500/30 bg-emerald-950/10">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4 sm:gap-5">
            {/* Rectangular Avatar */}
            <div className="w-14 h-16 sm:w-16 sm:h-20 rounded-xl bg-gradient-to-br from-emerald-500 via-teal-500 to-indigo-600 p-0.5 shadow-xl shadow-emerald-950/60">
              <div className="w-full h-full rounded-[10px] bg-zinc-950 flex items-center justify-center">
                <span className="text-xl sm:text-2xl font-black text-emerald-300">
                  {activeStudentName
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
                  {activeStudentName}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  Vínculo Ativo • LGPD
                </span>
              </div>
              <p className="text-xs sm:text-sm text-zinc-300 font-medium">
                Responsável: <strong className="text-white">{guardianDisplayName}</strong> • {activeClassLabel}
              </p>
              <div className="flex items-center gap-3 text-[11px] text-zinc-300 mt-1">
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <ShieldCheck size={13} />{" "}
                  {hasServerWorkspace
                    ? workspace.attendanceTimeline[0]
                      ? `Último registro: ${workspace.attendanceTimeline[0].date} (${workspace.attendanceTimeline[0].channel})`
                      : "Nenhum registro de portaria sincronizado"
                    : "Entrada Portaria Sul: 07:12 (Crachá QR / Presença Confirmada)"}
                </span>
                <span>•</span>
                <span>Frequência: {effectiveAttendanceRate}%</span>
              </div>
            </div>
          </div>

          {/* Tuition Status Strip */}
          <div className="flex items-center gap-4 w-full lg:w-auto justify-between lg:justify-end border-t lg:border-t-0 border-white/10 pt-4 lg:pt-0">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-300">
                {primaryInvoice?.description ?? (isOfflinePreview ? "Mensalidade de Novembro:" : "Situação Financeira")}
              </span>
              <span className="text-sm font-black text-white">
                {formattedInvoiceAmount}
              </span>
              <span className="text-[10px] text-emerald-400 font-semibold">
                {primaryInvoice
                  ? effectivePixSettled
                    ? "PIX REPORTADO • PENDENTE CONCILIAÇÃO NO EDGE"
                    : primaryInvoice.status === "cancelled"
                      ? "FATURA CANCELADA"
                      : `Vence em ${primaryInvoice.dueDate}`
                  : isOfflinePreview
                    ? effectivePixSettled
                      ? "PIX REPORTADO • PENDENTE CONCILIAÇÃO NO EDGE"
                      : "Vence em 10/11/2026"
                    : "Atualizado via BFF"}
              </span>
            </div>

            {(primaryInvoice || isOfflinePreview) && (
              <EliteButton
                variant={effectivePixSettled ? "secondary" : "primary"}
                size="sm"
                onClick={() => setShowPixModal(true)}
                className="gap-2"
              >
                <QrCode size={14} />
                {effectivePixSettled ? "Comprovante PIX" : "Pagar com PIX"}
              </EliteButton>
            )}
          </div>
        </div>
      </EagleCard>

      {/* Onboarding de 3 Passos (LGPD Art. 14 e 16) */}
      <EagleCard
        glow="cyan"
        className="p-5 border-cyan-500/30 bg-cyan-950/10 flex flex-col gap-4"
        data-testid="lgpd-onboarding-card"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <Lock size={16} className="text-cyan-400" /> Onboarding de Privacidade Familiar em 3 Passos (LGPD Art. 14 e 16)
            </h2>
            <p className="text-xs text-zinc-300">
              Transparência total sobre como os dados do seu filho são protegidos, gerenciados e eliminados.
            </p>
          </div>
          <span className="text-[10px] font-mono px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            Piloto H-01: Biometria em Quarentena (Offline-First)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs">
          <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex flex-col gap-1.5">
            <span className="text-[10px] font-black uppercase text-cyan-300">
              Passo 1 • Proteção Local (Art. 14)
            </span>
            <h3 className="font-bold text-white">Zero Fotos em Nuvem</h3>
            <p className="text-zinc-300 leading-relaxed">
              Registros escolares ficam exclusivamente no servidor local da escola criptografados com AES-256-GCM.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex flex-col gap-1.5">
            <span className="text-[10px] font-black uppercase text-emerald-300">
              Passo 2 • Escolha Livre & Alternativa
            </span>
            <h3 className="font-bold text-white">Crachá QR / Chamada Digital Equivalente</h3>
            <p className="text-zinc-300 leading-relaxed">
              O estudante tem acesso integral via Crachá QR ou chamada digital sem obrigatoriedade de biometria facial.
            </p>
            <div className="pt-1 flex items-center justify-between">
              <span className="text-[11px] text-zinc-200 font-semibold">
                Opt-in Biométrico Futuro: {effectiveConsentActive ? "Ativo" : "Desativado"}
              </span>
              <button
                type="button"
                data-testid="lgpd-manage-consent-btn"
                onClick={() => {
                  if (effectiveConsentActive) {
                    void handleRevokeAndPurgeLgpd();
                  } else {
                    setShowLgpdOptInModal(true);
                  }
                }}
                className="px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-[11px] font-bold text-white transition"
              >
                {effectiveConsentActive ? "Desativar" : "Gerenciar"}
              </button>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex flex-col gap-1.5 justify-between">
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-black uppercase text-amber-300">
                Passo 3 • Revogação & Expurgo (Art. 16)
              </span>
              <h3 className="font-bold text-white">Revogação & Propagação ao Edge Escolar</h3>
              <p className="text-zinc-300 leading-relaxed">
                Revogue a qualquer momento o opt-in biométrico. O servidor registra protocolo auditável e enfileira comando para o Edge remover templates biométricos locais, preservando registros exigidos por obrigação legal.
              </p>
              {workspace?.biometricConsent &&
                workspace.biometricConsent.propagationStatus &&
                workspace.biometricConsent.propagationStatus !== "not_applicable" && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <PropagationStatusBadge
                      status={workspace.biometricConsent.propagationStatus}
                      commandId={workspace.biometricConsent.edgeCommandId}
                    />
                    <span className="text-[10px] font-mono text-amber-200">
                      {workspace.biometricConsent.consentLogId
                        ? `Protocolo ${workspace.biometricConsent.consentLogId} • `
                        : ""}
                      Versão {workspace.biometricConsent.documentVersion ?? "v2.1-ANPD-2026"}
                    </span>
                  </div>
                )}
            </div>
            <button
              type="button"
              data-testid="lgpd-revoke-purge-btn"
              onClick={handleRevokeAndPurgeLgpd}
              className="mt-2 px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 text-[11px] font-bold transition text-center"
            >
              Revogar Consentimento & Solicitar Expurgo
            </button>
          </div>
        </div>

        {lgpdError && (
          <div
            role="alert"
            className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-xs text-rose-200 flex items-center gap-2"
          >
            <AlertTriangle size={14} className="shrink-0" />
            <span>{lgpdError}</span>
          </div>
        )}

        {lgpdRevocationReceipt && (
          <div
            role="status"
            className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-[11px] font-mono text-emerald-200"
          >
            ✓ {lgpdRevocationReceipt}
          </div>
        )}
      </EagleCard>

      {/* Tabs: Separando Avisos (Notificações) de Conversas para o Jantar (Conteúdo Pedagógico) */}
      <div
        role="tablist"
        aria-label="Navegação do Portal da Família"
        className="flex items-center gap-2 border-b border-white/10 pb-2 overflow-x-auto"
      >
        <button
          role="tab"
          aria-selected={activeTab === "avisos"}
          onClick={() => setActiveTab("avisos")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap focus-visible:ring-2 focus-visible:ring-emerald-400 outline-none ${
            activeTab === "avisos"
              ? "bg-emerald-600/30 text-emerald-200 border border-emerald-500/40 shadow-lg shadow-emerald-900/20"
              : "text-zinc-300 hover:text-white hover:bg-white/5"
          }`}
        >
          <Bell size={16} /> Avisos & Portaria
        </button>

        <button
          role="tab"
          aria-selected={activeTab === "jantar"}
          onClick={() => setActiveTab("jantar")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap focus-visible:ring-2 focus-visible:ring-emerald-400 outline-none ${
            activeTab === "jantar"
              ? "bg-emerald-600/30 text-emerald-200 border border-emerald-500/40 shadow-lg shadow-emerald-900/20"
              : "text-zinc-300 hover:text-white hover:bg-white/5"
          }`}
        >
          <Sparkles size={16} /> Conversas para o Jantar
        </button>

        <button
          role="tab"
          aria-selected={activeTab === "boletim"}
          onClick={() => setActiveTab("boletim")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap focus-visible:ring-2 focus-visible:ring-emerald-400 outline-none ${
            activeTab === "boletim"
              ? "bg-emerald-600/30 text-emerald-200 border border-emerald-500/40 shadow-lg shadow-emerald-900/20"
              : "text-zinc-300 hover:text-white hover:bg-white/5"
          }`}
        >
          <BookOpen size={16} /> Boletim & Rendimento
        </button>

        <button
          role="tab"
          aria-selected={activeTab === "financeiro"}
          onClick={() => setActiveTab("financeiro")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap focus-visible:ring-2 focus-visible:ring-emerald-400 outline-none ${
            activeTab === "financeiro"
              ? "bg-emerald-600/30 text-emerald-200 border border-emerald-500/40 shadow-lg shadow-emerald-900/20"
              : "text-zinc-300 hover:text-white hover:bg-white/5"
          }`}
        >
          <DollarSign size={16} /> Financeiro & PIX
        </button>

        <button
          role="tab"
          aria-selected={activeTab === "ocorrencias"}
          onClick={() => setActiveTab("ocorrencias")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap focus-visible:ring-2 focus-visible:ring-emerald-400 outline-none ${
            activeTab === "ocorrencias"
              ? "bg-emerald-600/30 text-emerald-200 border border-emerald-500/40 shadow-lg shadow-emerald-900/20"
              : "text-zinc-300 hover:text-white hover:bg-white/5"
          }`}
        >
          <FileText size={16} /> Ocorrências & Assinaturas
          {effectiveOccurrences.some((o) => !o.signed) && (
            <span className="w-2 h-2 rounded-full bg-amber-400" />
          )}
        </button>

        <button
          role="tab"
          aria-selected={activeTab === "contato"}
          onClick={() => setActiveTab("contato")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap focus-visible:ring-2 focus-visible:ring-emerald-400 outline-none ${
            activeTab === "contato"
              ? "bg-emerald-600/30 text-emerald-200 border border-emerald-500/40 shadow-lg shadow-emerald-900/20"
              : "text-zinc-300 hover:text-white hover:bg-white/5"
          }`}
        >
          <MessageCircle size={16} /> Canal Direto
        </button>
      </div>

      {/* Tab 1: Avisos & Portaria (Notificações Operacionais) */}
      {activeTab === "avisos" && (
        <EagleCard glow="cyan" className="p-6 flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Bell className="text-emerald-400" size={20} /> Avisos da Escola & Registros de Portaria
              </h2>
              <p className="text-xs text-zinc-300">
                Notificações operacionais de chegada, saída e comunicados oficiais separados do conteúdo pedagógico.
              </p>
            </div>
            <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              Frequência Mensal: {effectiveAttendanceRate.toFixed(1)}%
            </span>
          </div>

          {workspace?.notifications && workspace.notifications.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {workspace.notifications.slice(0, 4).map((note) => (
                <div
                  key={note.id}
                  className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/25 flex flex-col gap-1"
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-300">
                    {note.type}
                  </span>
                  <h4 className="text-xs font-bold text-white">{note.title}</h4>
                  <p className="text-[11px] text-zinc-300">{note.message}</p>
                </div>
              ))}
            </div>
          )}

          {/* Timeline of events */}
          <div className="flex flex-col gap-3 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-white/10 pl-6">
            {effectiveAttendanceTimeline.length === 0 ? (
              <p className="text-xs text-zinc-300">
                Nenhum registro de frequência ou portaria sincronizado para este estudante até o momento.
              </p>
            ) : (
              effectiveAttendanceTimeline.map((ev, i) => (
                <div key={i} className="relative flex flex-col gap-1 text-xs">
                  <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-black" />
                  <span className="font-mono text-emerald-400 font-bold">{ev.time}</span>
                  <h4 className="font-bold text-white">{ev.title}</h4>
                  <p className="text-zinc-300">{ev.desc}</p>
                </div>
              ))
            )}
          </div>
        </EagleCard>
      )}

      {/* Tab 2: Conversas para o Jantar (Perguntas Socráticas Conectadas à Aula) */}
      {activeTab === "jantar" && (
        <EagleCard glow="purple" className="p-6 flex flex-col gap-6" data-testid="dinner-conversations-panel">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="text-purple-400" size={20} /> Conversas para o Jantar (Conexão Família-Escola)
            </h2>
            <p className="text-xs text-zinc-300">
              Perguntas abertas e acolhedoras baseadas nas aulas de hoje para estimular o diálogo em família sem jargão técnico.
            </p>
          </div>

          {dinnerConversations.length === 0 ? (
            <p className="text-xs text-zinc-300">
              Nenhuma pauta de conversa publicada pelos docentes para esta turma até o momento.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {dinnerConversations.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col justify-between gap-3"
                >
                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-purple-300">
                      {item.subject}
                    </span>
                    <h3 className="text-sm font-bold text-white">{item.topic}</h3>
                    <p className="text-xs text-emerald-200 italic bg-emerald-950/30 border border-emerald-500/20 p-3 rounded-xl">
                      {item.prompt}
                    </p>
                  </div>
                  <span className="text-[11px] text-zinc-300 border-t border-white/10 pt-2">
                    {item.context}
                  </span>
                </div>
              ))}
            </div>
          )}
        </EagleCard>
      )}

      {/* Tab 3: Boletim */}
      {activeTab === "boletim" && (
        <EagleCard glow="purple" className="p-6 flex flex-col gap-6" data-testid="parent-grades-panel">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-white">Desempenho Pedagógico de {activeStudentName}</h2>
              <p className="text-xs text-zinc-300">
                Notas revisadas pelo docente (Parecer CNE/CP nº 15/2026) — rascunhos em avaliação permanecem ocultos até aprovação humana. Direito garantido à revisão/contestação.
              </p>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-purple-500/10 text-purple-300 border border-purple-500/30 text-xs font-bold whitespace-nowrap">
              Média Geral: {averageGrade !== null ? averageGrade.toFixed(1) : "—"}
            </div>
          </div>

          {effectiveGrades.length === 0 ? (
            <div
              data-testid="empty-published-grades"
              className="p-4 rounded-xl bg-white/5 border border-white/10 text-xs text-zinc-300"
            >
              Nenhuma nota publicada pelo docente até o momento. Avaliações em rascunho ou revisão permanecem ocultas conforme Parecer CNE/CP nº 15/2026.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {effectiveGrades.map((card, idx) => {
                const isContested = card.contestationStatus === "contested";
                const isFormOpen = contestingGradeId === card.id;
                return (
                  <div key={`${card.id}-${idx}`} className="p-4 rounded-xl bg-white/5 border border-white/10 flex flex-col gap-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-300 font-medium">{card.subject}</span>
                      <span className="text-emerald-400 font-bold font-mono">{card.trend}</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black text-white">{card.grade.toFixed(1)}</span>
                      <span className="text-[10px] text-zinc-300">/ {card.maxScore.toFixed(1)}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] font-semibold text-purple-300 uppercase tracking-wider">
                        {card.status}
                      </span>
                      <PropagationStatusBadge
                        status={card.propagationStatus}
                        commandId={card.edgeCommandId}
                      />
                    </div>

                    {isContested ? (
                      <div className="mt-1 p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-200 flex flex-col gap-0.5">
                        <span className="font-bold uppercase text-[10px]">
                          Contestação Registrada (CNE 15/2026)
                        </span>
                        {card.contestationReason && (
                          <span className="text-zinc-200">{card.contestationReason}</span>
                        )}
                      </div>
                    ) : (
                      <div className="mt-1 flex flex-col gap-2">
                        {!isFormOpen ? (
                          <button
                            type="button"
                            onClick={() => {
                              setContestingGradeId(card.id);
                              setGradeContestReason("");
                              setGradeContestError(null);
                            }}
                            className="self-start px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/15 text-[11px] font-semibold text-zinc-200 transition"
                          >
                            Contestar Nota
                          </button>
                        ) : (
                          <div
                            data-testid={`grade-contestation-form-${card.id}`}
                            className="p-2.5 rounded-xl bg-black/40 border border-amber-500/30 flex flex-col gap-2"
                          >
                            <textarea
                              rows={2}
                              value={gradeContestReason}
                              onChange={(e) => {
                                setGradeContestReason(e.target.value);
                                if (gradeContestError) setGradeContestError(null);
                              }}
                              placeholder="Descreva o motivo da revisão/contestação (mín. 10 caracteres)"
                              className="w-full bg-zinc-900 border border-white/15 rounded-lg p-2 text-xs text-white outline-none focus:border-amber-400"
                            />
                            {gradeContestError && (
                              <span role="alert" className="text-[11px] text-rose-300">
                                {gradeContestError}
                              </span>
                            )}
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setContestingGradeId(null);
                                  setGradeContestError(null);
                                }}
                                className="px-2 py-1 rounded bg-white/5 text-[11px] text-zinc-300"
                              >
                                Cancelar
                              </button>
                              <button
                                type="button"
                                disabled={gradeContestSubmitting}
                                onClick={() => void handleSubmitGradeContestation(card.id)}
                                className="px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-400 text-black text-[11px] font-bold disabled:opacity-50"
                              >
                                {gradeContestSubmitting ? "Enviando..." : "Enviar Contestação"}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </EagleCard>
      )}

      {/* Tab 4: Financeiro & PIX */}
      {activeTab === "financeiro" && (
        <EagleCard glow="cyan" className="p-6 flex flex-col gap-6">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 className="text-lg font-bold text-white">Central Financeira da Mensalidade</h2>
              <p className="text-xs text-zinc-300">
                Emissão instantânea de PIX Dinâmico; confirmação via portal registra recebimento no servidor e aguarda conciliação contábil e no Edge escolar.
              </p>
            </div>
            <span className="px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-bold">
              {primaryInvoice?.status === "cancelled" ? "FATURA CANCELADA" : "CADASTRO ADIMPLENTE"}
            </span>
          </div>

          {!primaryInvoice && hasServerWorkspace ? (
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-xs text-zinc-300">
              Nenhuma fatura vinculada a este estudante no momento.
            </div>
          ) : (
            <div className="p-5 rounded-2xl bg-white/5 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex flex-col gap-1.5">
                <span className="text-xs text-zinc-300 uppercase font-bold tracking-wider">
                  {primaryInvoice?.description ?? "Parcela 11/12 • Novembro de 2026"}
                </span>
                <h3 className="text-2xl font-black text-white">{formattedInvoiceAmount}</h3>
                <p className="text-xs text-emerald-400 font-medium">
                  {effectivePixSettled
                    ? `Status: Pagamento reportado ao BFF • Aguardando conciliação no Edge${
                        primaryInvoice?.receiptHashSha256
                          ? ` • Comprovante ${primaryInvoice.receiptHashSha256.slice(0, 12)}...`
                          : ""
                      }`
                    : primaryInvoice?.status === "cancelled"
                      ? "Fatura cancelada: liquidação bloqueada"
                      : `Vencimento: ${primaryInvoice?.dueDate ?? "10/11/2026"}`}
                </p>
                {effectivePixSettled && effectivePixReconciliationState && (
                  <div>
                    <PropagationStatusBadge
                      status={effectivePixReconciliationState}
                      commandId={pixCommandMeta?.commandId}
                    />
                  </div>
                )}
              </div>

              <EliteButton
                variant={effectivePixSettled ? "secondary" : "primary"}
                size="md"
                onClick={() => {
                  setPixError(null);
                  setShowPixModal(true);
                }}
                disabled={primaryInvoice?.status === "cancelled"}
                className="gap-2"
              >
                <QrCode size={16} />
                {effectivePixSettled ? "Ver Recibo" : "Gerar PIX QR Code"}
              </EliteButton>
            </div>
          )}
        </EagleCard>
      )}

      {/* Tab 5: Ocorrências & Assinaturas */}
      {activeTab === "ocorrencias" && (
        <EagleCard glow="amber" className="p-6 flex flex-col gap-5">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <FileText className="text-amber-400" size={20} /> Prontuário Escolar & Notificações
            </h2>
            <p className="text-xs text-zinc-300">
              Registro de ciência ou contestação vinculado à sessão autenticada, horário e hash SHA-256 de integridade do conteúdo (sem equivalência a certificado ICP-Brasil).
            </p>
          </div>

          <div className="flex flex-col gap-3">
            {effectiveOccurrences.length === 0 ? (
              <p className="text-xs text-zinc-300">
                Nenhuma ocorrência registrada para este estudante até o momento.
              </p>
            ) : (
              effectiveOccurrences.map((occ) => {
                const isContestOpen = contestingOccurrenceId === occ.id;
                const occError = occurrenceErrorById[occ.id];
                const isDisagreement = occ.manifestationType === "DISAGREEMENT_CONTESTATION";
                return (
                  <div
                    key={occ.id}
                    data-testid={`occurrence-card-${occ.id}`}
                    className="p-4 rounded-xl bg-white/5 border border-white/10 flex flex-col gap-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex flex-col gap-1.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[10px] font-mono text-zinc-300">
                            {occ.date} • {occ.time}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white/10 text-zinc-200">
                            {occ.type}
                          </span>
                          {occ.signed && occ.manifestationType && (
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                                isDisagreement
                                  ? "bg-amber-500/15 text-amber-200 border-amber-500/40"
                                  : "bg-emerald-500/15 text-emerald-200 border-emerald-500/40"
                              }`}
                            >
                              {isDisagreement ? "Contestação Registrada" : "Ciência Confirmada"}
                            </span>
                          )}
                          <PropagationStatusBadge
                            status={occ.propagationStatus}
                            commandId={occ.edgeCommandId}
                          />
                        </div>
                        <h4 className="text-sm font-bold text-white">{occ.title}</h4>
                        <p className="text-xs text-zinc-300">{occ.desc}</p>
                        {occ.contestationReason && (
                          <p className="text-xs text-amber-200 bg-amber-500/10 border border-amber-500/25 rounded-lg p-2">
                            Motivo da contestação: {occ.contestationReason}
                          </p>
                        )}
                        {occ.signed && (
                          <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1 mt-1">
                            <CheckCircle2 size={13} /> {occ.signedAt}
                          </span>
                        )}
                      </div>

                      {!occ.signed && (
                        <div className="flex items-center gap-2">
                          <EliteButton
                            variant="primary"
                            size="sm"
                            onClick={() => void handleSign(occ.id, "SCIENCE_ACKNOWLEDGED")}
                            className="whitespace-nowrap"
                          >
                            Registrar Ciência
                          </EliteButton>
                          <EliteButton
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              setContestingOccurrenceId(isContestOpen ? null : occ.id);
                              setOccurrenceContestReason("");
                              setOccurrenceErrorById((prev) => {
                                const next = { ...prev };
                                delete next[occ.id];
                                return next;
                              });
                            }}
                            className="whitespace-nowrap"
                          >
                            Contestar
                          </EliteButton>
                        </div>
                      )}
                    </div>

                    {!occ.signed && isContestOpen && (
                      <div
                        data-testid={`occurrence-contestation-form-${occ.id}`}
                        className="p-3 rounded-xl bg-black/40 border border-amber-500/30 flex flex-col gap-2"
                      >
                        <label className="text-[11px] font-bold text-amber-200">
                          Justificativa da Contestação (mín. 5 caracteres)
                        </label>
                        <textarea
                          rows={2}
                          value={occurrenceContestReason}
                          onChange={(e) => setOccurrenceContestReason(e.target.value)}
                          placeholder="Explique o ponto de discordância para análise da coordenação..."
                          className="w-full bg-zinc-900 border border-white/15 rounded-lg p-2 text-xs text-white outline-none focus:border-amber-400"
                        />
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setContestingOccurrenceId(null)}
                            className="px-2.5 py-1 rounded bg-white/5 text-xs text-zinc-300"
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              void handleSign(
                                occ.id,
                                "DISAGREEMENT_CONTESTATION",
                                occurrenceContestReason
                              )
                            }
                            className="px-3 py-1 rounded bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold"
                          >
                            Enviar Contestação
                          </button>
                        </div>
                      </div>
                    )}

                    {occError && (
                      <div
                        role="alert"
                        className="p-2.5 rounded-lg bg-rose-500/15 border border-rose-500/40 text-xs text-rose-200 flex items-center gap-2"
                      >
                        <AlertTriangle size={14} className="shrink-0" />
                        <span>{occError}</span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </EagleCard>
      )}

      {/* Tab 6: Canal Direto */}
      {activeTab === "contato" && (
        <EagleCard glow="blue" className="p-6 flex flex-col gap-6">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <MessageCircle className="text-blue-400" size={20} /> Canal Institucional com a Coordenação
            </h2>
            <p className="text-xs text-zinc-300">
              Comunicação direta criptografada com a equipe pedagógica e secretaria escolar.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex flex-col gap-3">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Smartphone size={16} className="text-emerald-400" /> Atendimento da Coordenação
              </h4>
              <p className="text-xs text-zinc-300">
                Atendimento ágil para dúvidas de frequência, documentos e ocorrências acadêmicas.
              </p>
              <Link
                href="/contato?perfil=pais&assunto=atendimento-coordenacao"
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold hover:bg-emerald-600/30 transition-all no-underline"
              >
                Abrir Canal de Atendimento
              </Link>
            </div>

            <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex flex-col gap-3">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Clock size={16} className="text-cyan-400" /> Horário de Plantão da Coordenação
              </h4>
              <p className="text-xs text-zinc-300">
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
              type="button"
              onClick={() => setShowPixModal(false)}
              className="absolute top-4 right-4 text-zinc-300 hover:text-white"
            >
              <X size={20} />
            </button>

            <div className="text-center flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                <QrCode size={24} />
              </div>
              <h3 className="text-lg font-bold text-white">PIX Dinâmico Instantâneo</h3>
              <p className="text-xs text-zinc-300">
                {primaryInvoice?.description ?? "Mensalidade Escolar • Novembro 2026"} • <strong>{formattedInvoiceAmount}</strong>
              </p>
            </div>

            {/* PIX QR Display */}
            <div className="w-48 h-48 mx-auto bg-white p-3 rounded-2xl flex items-center justify-center shadow-xl">
              <div className="w-full h-full border-2 border-black border-dashed flex flex-col items-center justify-center text-black text-center p-2">
                <QrCode size={100} className="text-black" />
                <span className="text-[9px] font-bold mt-1 uppercase tracking-tight">
                  Áquila Pay • BCB Pix
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-[10px] uppercase font-bold text-zinc-300 text-center">
                Chave Copia e Cola
              </span>
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl p-2.5">
                <input
                  type="text"
                  readOnly
                  value={effectivePixPayload}
                  className="bg-transparent text-[11px] font-mono text-zinc-200 outline-none flex-1 truncate"
                />
                <button
                  type="button"
                  onClick={handleCopyPix}
                  className="px-3 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 text-xs font-bold hover:bg-cyan-500/30 transition-all flex items-center gap-1"
                >
                  {pixCopied ? <Check size={14} /> : <Copy size={14} />}
                  <span>{pixCopied ? "Copiado!" : "Copiar"}</span>
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2 border-t border-white/10">
              {pixError && (
                <div
                  role="alert"
                  className="p-2.5 rounded-lg bg-rose-500/15 border border-rose-500/40 text-xs text-rose-200 flex items-center gap-2"
                >
                  <AlertTriangle size={14} className="shrink-0" />
                  <span>{pixError}</span>
                </div>
              )}
              <EliteButton
                variant="primary"
                size="md"
                onClick={handleSettlePix}
                disabled={effectivePixSettled || primaryInvoice?.status === "cancelled"}
                className="w-full gap-2"
              >
                <CheckCircle2 size={16} />
                {effectivePixSettled ? "Pagamento Confirmado!" : "Confirmar Pagamento PIX"}
              </EliteButton>
              {effectivePixSettled && effectivePixReconciliationState && (
                <div className="flex items-center justify-center">
                  <PropagationStatusBadge
                    status={effectivePixReconciliationState}
                    commandId={pixCommandMeta?.commandId}
                  />
                </div>
              )}
              <span className="text-[10px] text-zinc-300 text-center">
                {primaryInvoice?.receiptHashSha256
                  ? `Comprovante BFF SHA-256: ${primaryInvoice.receiptHashSha256} • Conciliação definitiva depende do Edge escolar`
                  : "Confirmação reportada ao BFF; conciliação contábil no Edge permanece pendente até confirmação escolar"}
              </span>
            </div>
          </EagleCard>
        </div>
      )}

      <ParentLgpdModal
        key={`${showLgpdOptInModal}-${activeStudentId || "local"}`}
        open={showLgpdOptInModal}
        onClose={() => setShowLgpdOptInModal(false)}
        defaultGuardianName={isOfflinePreview ? undefined : workspace?.guardianName ?? ""}
        defaultGuardianCpf={isOfflinePreview ? undefined : ""}
        onGrantConsent={handleGrantLgpdOptIn}
      />
        </>
      )}
    </div>
  );
}
