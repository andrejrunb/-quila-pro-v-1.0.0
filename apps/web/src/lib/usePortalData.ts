"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface TeacherClassSummary {
  id: string;
  name: string;
  grade: number;
  shift: string;
  year: number;
  roomId: string | null;
}

export interface TeacherRosterStudent {
  id: string;
  name: string;
  registrationNumber: string;
  seat: string;
  status: "present" | "absent" | "justified";
  detectedBy: string;
  confidence: number;
  entryTime: string;
}

export type PortalPropagationStatus =
  | "not_applicable"
  | "pending_at_edge"
  | "applied_by_edge"
  | "failed"
  | "rejected_by_edge";

export interface PortalInstitutionSyncStatus {
  state: "received_by_server" | "pending_at_edge" | "applied_by_edge" | "sync_stale";
  pendingCommandCount: number;
  lastSyncedAt: string | null;
  staleReason: string | null;
}

export interface PortalDomainSyncCommand {
  commandId: string;
  status: string;
  updatedAt: string;
  edgeAckAt: string | null;
}

export interface TeacherLessonDiary {
  id: string;
  classId: string;
  date: string;
  subject: string;
  topic: string;
  content: string;
  bnccCodesJson: string;
  homework: string | null;
  dinnerPrompt: string | null;
  signatureHashSha256: string | null;
  status?: "draft" | "published";
  propagationStatus?: PortalPropagationStatus | string;
  edgeCommandId?: string | null;
}

export interface TeacherAssessmentRow {
  id: string;
  classId: string;
  title: string;
  instructions: string;
  subject: string;
  bimestre: "1bim" | "2bim" | "3bim" | "4bim";
  questionsJson: string;
  status: "draft_ai" | "pending_review" | "approved" | "published";
}

export interface TeacherSubmissionRow {
  id: string;
  assessmentId: string;
  studentId: string;
  autoScore: number | null;
  finalScore: number | null;
  reviewStatus: "draft_ai" | "teacher_reviewed" | "published";
  feedback: string | null;
}

export interface TeacherOccurrenceRow {
  id: string;
  studentId: string;
  category: string;
  severity: "low" | "medium" | "high";
  title: string;
  description: string;
  recommendedAction: string | null;
  actionApplied: string | null;
  propagationStatus?: PortalPropagationStatus | string;
  edgeCommandId?: string | null;
}

export interface PortalGradeRow {
  id: string;
  studentId: string;
  classId: string;
  subject: string;
  evaluationType: string;
  score: number;
  maxScore: number;
  period: "1bim" | "2bim" | "3bim" | "4bim";
  status: "draft_ai" | "pending_review" | "published";
  propagationStatus?: PortalPropagationStatus | string;
  edgeCommandId?: string | null;
  contestationStatus?: "none" | "contested" | "resolved" | string;
  contestationReason?: string | null;
  contestedAt?: string | Date | null;
  contestedByUserId?: string | null;
}

export interface TeacherWorkspaceData {
  teacherName?: string;
  classes: TeacherClassSummary[];
  activeClass: TeacherClassSummary | null;
  roster: TeacherRosterStudent[];
  diaries: TeacherLessonDiary[];
  assessments: TeacherAssessmentRow[];
  pendingSubmissions: TeacherSubmissionRow[];
  occurrences: TeacherOccurrenceRow[];
  grades: PortalGradeRow[];
  date: string;
  syncStatus?: PortalInstitutionSyncStatus;
  lastAttendanceSync?: PortalDomainSyncCommand | null;
  lastDiarySync?: PortalDomainSyncCommand | null;
}

export interface ParentWorkspaceData {
  guardianName?: string;
  students: Array<{ id: string; name: string; registrationNumber: string; classId: string | null }>;
  activeStudent: { id: string; name: string; registrationNumber: string; classId: string | null } | null;
  activeClass: { id: string; name: string; roomId: string | null } | null;
  attendanceTimeline: Array<{ id: string; date: string; time: string; status: string; channel: string }>;
  attendanceRate: number;
  dinnerConversations: Array<{ id: string; subject: string; topic: string; prompt: string; context: string }>;
  grades: PortalGradeRow[];
  invoices: Array<{
    id: string;
    description: string;
    amount: number;
    dueDate: string;
    status: "pending" | "paid" | "overdue" | "cancelled";
    pixPayload: string | null;
    receiptHashSha256: string | null;
    paidAt?: string | Date | null;
    reconciliationState?: string | null;
  }>;
  occurrences: Array<{
    id: string;
    category: string;
    severity: string;
    title: string;
    description: string;
    signedAt: string | Date | null;
    signatureHashSha256: string | null;
    createdAt: string | Date;
    manifestationType?: "SCIENCE_ACKNOWLEDGED" | "DISAGREEMENT_CONTESTATION" | string | null;
    contestationReason?: string | null;
    documentVersion?: string | null;
    propagationStatus?: PortalPropagationStatus | string;
    edgeCommandId?: string | null;
  }>;
  notifications: Array<{ id: string; title: string; message: string; type: string }>;
  biometricConsent: {
    enabled: boolean;
    status: string;
    documentVersion?: string;
    purpose?: string;
    manifestationType?: string | null;
    propagationStatus?: PortalPropagationStatus | string;
    consentLogId?: string | null;
    edgeCommandId?: string | null;
    purgeLogId?: string | null;
    recordedAtMs?: number | null;
    latestReceiptSha256: string | null;
  };
  syncStatus?: PortalInstitutionSyncStatus;
}

export interface StudentWorkspaceData {
  student: { id: string; name: string; registrationNumber: string } | null;
  activeClass: { id: string; name: string; roomId: string | null; grade?: number | null } | null;
  latestAttendance: { status: string; detectedBy: string; date: string } | null;
  grades: PortalGradeRow[];
  schedules: Array<{
    id: string;
    dayOfWeek: number;
    timeSlot: string;
    subject: string;
    room: string;
    teacherName: string;
  }>;
  missions: Array<{
    id: string;
    title: string;
    description: string;
    subject: string;
    bnccCode: string | null;
    rewardXp: number;
    rewardCoins: number;
    progress: number;
    completed: boolean;
  }>;
  xpPoints: number;
  coins: number;
  streakDays: number;
  recentSessions: Array<{ id: string; mode: string; durationSeconds: number; earnedXp: number; notes: string | null }>;
  aiPolicy?: {
    blocked: boolean;
    stage: string;
    ageYears?: number | null;
    reason: string;
  };
  syncStatus?: PortalInstitutionSyncStatus;
}

export interface PortalMutationResult<R> {
  ok: boolean;
  status?: number;
  data?: R;
  error?: string;
  offlineFallback?: boolean;
}

async function extractHttpSyncError(response: Response): Promise<string> {
  const errBody = (await response.json().catch(() => ({}))) as { error?: string };
  if (errBody.error) return errBody.error;
  if (response.status >= 500) {
    return "Dado possivelmente desatualizado: falha de sincronização com o servidor.";
  }
  return `Acesso bloqueado ou vínculo indisponível (HTTP ${response.status}).`;
}

export function usePortalWorkspace<T>(endpoint: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [settledEndpoint, setSettledEndpoint] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const hasSyncedOnceRef = useRef(false);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(endpoint, { cache: "no-store" });
      if (!response.ok) {
        const message = await extractHttpSyncError(response);
        hasSyncedOnceRef.current = true;
        setData(null);
        setSyncError(message);
        return;
      }
      const json = (await response.json()) as T;
      hasSyncedOnceRef.current = true;
      setData(json);
      setSyncError(null);
    } catch {
      if (hasSyncedOnceRef.current) {
        setSyncError("Falha de rede: não foi possível sincronizar os dados com o servidor.");
      }
      // In isolated Vitest jsdom without HTTP server, initial deterministic snapshot stays active
    } finally {
      setSettledEndpoint(endpoint);
      setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const response = await fetch(endpoint, { cache: "no-store" });
        if (!mounted) return;
        if (!response.ok) {
          const message = await extractHttpSyncError(response);
          if (!mounted) return;
          hasSyncedOnceRef.current = true;
          setData(null);
          setSyncError(message);
          return;
        }
        const json = (await response.json()) as T;
        if (mounted) {
          hasSyncedOnceRef.current = true;
          setData(json);
          setSyncError(null);
        }
      } catch {
        if (mounted && hasSyncedOnceRef.current) {
          setSyncError("Falha de rede: dado exibido pode estar desatualizado.");
        }
      } finally {
        if (mounted) {
          setSettledEndpoint(endpoint);
          setLoading(false);
        }
      }
    };
    void load();
    return () => {
      mounted = false;
    };
  }, [endpoint]);

  const mutate = useCallback(
    async <R = Record<string, unknown>>(action: string, payload: unknown): Promise<PortalMutationResult<R>> => {
      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, payload }),
        });

        const parsed = (await response.json().catch(() => ({}))) as R & { error?: string };
        if (!response.ok) {
          const message = parsed.error || "Falha ao salvar alteração no portal.";
          if (response.status === 401 || response.status >= 500) {
            setSyncError(message);
          }
          return { ok: false, status: response.status, error: message };
        }
        setSyncError(null);
        void reload();
        return { ok: true, status: response.status, data: parsed };
      } catch {
        if (hasSyncedOnceRef.current) {
          const networkError = "Falha de rede: não foi possível sincronizar a alteração com o servidor.";
          setSyncError(networkError);
          return { ok: false, error: networkError };
        }
        return { ok: false, offlineFallback: true };
      }
    },
    [endpoint, reload]
  );

  const effectiveLoading = loading || (settledEndpoint !== null && settledEndpoint !== endpoint);
  return { data, loading: effectiveLoading, syncError, reload, mutate };
}
