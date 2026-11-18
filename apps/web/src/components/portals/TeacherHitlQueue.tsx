"use client";

import React, { useState } from "react";
import { AlertTriangle, CheckCircle2, ShieldAlert } from "lucide-react";
import type { TeacherSubmissionRow } from "@/lib/usePortalData";
import { PropagationStatusBadge } from "@/components/PortalSyncBanner";

export interface TeacherHitlApprovalResult {
  ok: boolean;
  error?: string;
  commandId?: string;
  propagationStatus?: string;
}

interface TeacherHitlQueueProps {
  submissions: TeacherSubmissionRow[];
  studentNamesById: Record<string, string>;
  onApproveSubmission: (
    submissionId: string,
    finalScore: number,
    feedback: string
  ) => Promise<TeacherHitlApprovalResult | void>;
}

export function TeacherHitlQueue({
  submissions,
  studentNamesById,
  onApproveSubmission,
}: TeacherHitlQueueProps) {
  const [editingScores, setEditingScores] = useState<Record<string, string>>({});
  const [editingFeedbacks, setEditingFeedbacks] = useState<Record<string, string>>({});
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [lastReceipt, setLastReceipt] = useState<string | null>(null);
  const [lastCommandMeta, setLastCommandMeta] = useState<{
    commandId?: string;
    propagationStatus?: string;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (submissions.length === 0) {
    return null;
  }

  return (
    <div
      data-testid="cne-hitl-review-queue"
      className="p-4 rounded-2xl bg-amber-950/15 border border-amber-500/30 flex flex-col gap-3"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ShieldAlert size={16} className="text-amber-400 shrink-0" />
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Fila de Revisão Humana Docente (Parecer CNE/CP nº 15/2026)
            </h3>
            <p className="text-[11px] text-zinc-300">
              Notas pré-corrigidas por OMR/IA ficam retidas em rascunho até validação docente explícita.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {lastReceipt && (
            <span
              role="status"
              className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-200 border border-emerald-500/40"
            >
              {lastReceipt}
            </span>
          )}
          {lastCommandMeta && (
            <PropagationStatusBadge
              status={lastCommandMeta.propagationStatus || "pending_at_edge"}
              commandId={lastCommandMeta.commandId}
            />
          )}
        </div>
      </div>

      {errorMsg && (
        <div
          role="alert"
          className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2"
        >
          <AlertTriangle size={14} className="shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {submissions.map((sub) => {
          const isPublished = sub.reviewStatus === "published";
          const studentName = studentNamesById[sub.studentId] || sub.studentId;
          const scoreValue =
            editingScores[sub.id] ?? String(sub.finalScore ?? sub.autoScore ?? 0);
          const feedbackValue = editingFeedbacks[sub.id] ?? sub.feedback ?? "";

          return (
            <div
              key={sub.id}
              className="p-3.5 rounded-xl bg-black/40 border border-white/10 flex flex-col gap-2.5"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-white">{studentName}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    isPublished
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                      : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                  }`}
                >
                  {isPublished ? "PUBLICADA (HITL OK)" : "RASCUNHO_IA BLOQUEADO"}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
                <label className="text-[11px] text-zinc-300 flex flex-col gap-1">
                  <span>Prévia OMR/IA: {sub.autoScore ?? "-"}</span>
                  <input
                    type="number"
                    min={0}
                    max={10}
                    step={0.1}
                    value={scoreValue}
                    onChange={(e) =>
                      setEditingScores((prev) => ({ ...prev, [sub.id]: e.target.value }))
                    }
                    className="w-full bg-zinc-900 border border-white/15 rounded-lg px-2 py-1 text-xs text-white"
                  />
                </label>

                <label className="sm:col-span-2 text-[11px] text-zinc-300 flex flex-col gap-1">
                  <span>Parecer Pedagógico</span>
                  <input
                    type="text"
                    value={feedbackValue}
                    onChange={(e) =>
                      setEditingFeedbacks((prev) => ({ ...prev, [sub.id]: e.target.value }))
                    }
                    placeholder="Comentário docente..."
                    className="w-full bg-zinc-900 border border-white/15 rounded-lg px-2.5 py-1 text-xs text-white"
                  />
                </label>
              </div>

              <button
                type="button"
                disabled={submittingId === sub.id}
                onClick={async () => {
                  setErrorMsg(null);
                  setSubmittingId(sub.id);
                  const numericScore = Math.min(10, Math.max(0, Number(scoreValue) || 0));
                  const res = await onApproveSubmission(sub.id, numericScore, feedbackValue);
                  setSubmittingId(null);
                  if (res && typeof res === "object" && "ok" in res && !res.ok) {
                    setErrorMsg(res.error || "Falha ao publicar revisão humana.");
                    return;
                  }
                  const cmdId = res && typeof res === "object" ? res.commandId : undefined;
                  const propStatus =
                    res && typeof res === "object" ? res.propagationStatus : undefined;
                  setLastReceipt(
                    `Nota ${numericScore.toFixed(1)} publicada p/ ${studentName}${cmdId ? ` (${cmdId.slice(-6)})` : ""}`
                  );
                  if (cmdId || propStatus) {
                    setLastCommandMeta({ commandId: cmdId, propagationStatus: propStatus });
                  }
                }}
                className="self-start px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-200 text-[11px] font-bold flex items-center gap-1.5 transition disabled:opacity-50"
              >
                <CheckCircle2 size={13} />
                <span>{isPublished ? "Atualizar Publicação" : "Revisar & Publicar Nota"}</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
