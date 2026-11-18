"use client";

import React from "react";
import { RefreshCw, ShieldCheck, AlertTriangle } from "lucide-react";

export type PortalSyncUiState =
  | "received_by_server"
  | "pending_at_edge"
  | "applied_by_edge"
  | "sync_stale"
  | "local_preview";

export type DomainSyncBadgeStatus =
  | "received_by_server"
  | "pending_at_edge"
  | "applied_by_edge"
  | "failed"
  | "rejected_by_edge"
  | "sync_stale"
  | "PENDING_EDGE_RECONCILIATION"
  | "not_applicable";

const DOMAIN_BADGE_MAP: Record<string, { label: string; className: string }> = {
  applied_by_edge: {
    label: "Aplicado na Escola (Edge)",
    className: "bg-emerald-500/15 text-emerald-300 border-emerald-500/40",
  },
  pending_at_edge: {
    label: "Pendente na Escola (Edge)",
    className: "bg-amber-500/15 text-amber-200 border-amber-500/40",
  },
  received_by_server: {
    label: "Recebido pelo Servidor (BFF)",
    className: "bg-sky-500/15 text-sky-200 border-sky-500/40",
  },
  failed: {
    label: "Falha no Edge",
    className: "bg-rose-500/15 text-rose-200 border-rose-500/40",
  },
  rejected_by_edge: {
    label: "Rejeitado pelo Edge",
    className: "bg-rose-500/15 text-rose-200 border-rose-500/40",
  },
  sync_stale: {
    label: "Dado Desatualizado",
    className: "bg-rose-500/15 text-rose-200 border-rose-500/40",
  },
  PENDING_EDGE_RECONCILIATION: {
    label: "Pendente Conciliação no Edge",
    className: "bg-amber-500/15 text-amber-200 border-amber-500/40",
  },
  not_applicable: {
    label: "Registro Somente Servidor",
    className: "bg-zinc-800 text-zinc-300 border-white/15",
  },
};

export function PropagationStatusBadge({
  status,
  commandId,
}: {
  status?: string | null;
  commandId?: string | null;
}) {
  if (!status && !commandId) return null;
  const cfg = DOMAIN_BADGE_MAP[status || "received_by_server"] || DOMAIN_BADGE_MAP.received_by_server;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${cfg.className}`}
      title={commandId ? `Comando Edge: ${commandId}` : undefined}
    >
      <span>{cfg.label}</span>
      {commandId && <span className="font-mono opacity-80">#{commandId.slice(-6)}</span>}
    </span>
  );
}

interface PortalSyncBannerProps {
  portalLabel: string;
  loading: boolean;
  syncError: string | null;
  syncedFromDb: boolean;
  syncState?: PortalSyncUiState;
  pendingCommandCount?: number;
  lastSyncedAt?: string | null;
  staleReason?: string | null;
  onRefresh: () => void;
  complianceNote: string;
}

const STATE_BADGE_MAP: Record<PortalSyncUiState, { labelSuffix: string; className: string }> = {
  applied_by_edge: {
    labelSuffix: "Aplicado na Escola (Edge)",
    className: "bg-emerald-500/15 text-emerald-300 border-emerald-500/40",
  },
  pending_at_edge: {
    labelSuffix: "Pendente na Escola (Edge)",
    className: "bg-amber-500/15 text-amber-200 border-amber-500/40",
  },
  received_by_server: {
    labelSuffix: "Recebido pelo Servidor (Projeção BFF)",
    className: "bg-sky-500/15 text-sky-200 border-sky-500/40",
  },
  sync_stale: {
    labelSuffix: "Dado Desatualizado / Falha de Sincronização",
    className: "bg-rose-500/15 text-rose-200 border-rose-500/40",
  },
  local_preview: {
    labelSuffix: "Prévia Local",
    className: "bg-zinc-800 text-zinc-300 border-white/15",
  },
};

export function PortalSyncBanner({
  portalLabel,
  loading,
  syncError,
  syncedFromDb,
  syncState,
  pendingCommandCount,
  lastSyncedAt,
  staleReason,
  onRefresh,
  complianceNote,
}: PortalSyncBannerProps) {
  const effectiveState: PortalSyncUiState = syncError
    ? "sync_stale"
    : syncState ?? (syncedFromDb ? "received_by_server" : "local_preview");
  const badgeConfig = STATE_BADGE_MAP[effectiveState];
  const alertMessage = syncError || (effectiveState === "sync_stale" ? staleReason : null);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4 py-2.5 rounded-2xl border border-white/10 bg-zinc-950/70 text-xs">
      <div className="flex items-center gap-2 flex-wrap">
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${badgeConfig.className}`}
        >
          <ShieldCheck size={12} />
          {`${portalLabel} • ${badgeConfig.labelSuffix}`}
        </span>
        {typeof pendingCommandCount === "number" && pendingCommandCount > 0 && (
          <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-200 text-[10px] font-mono">
            {pendingCommandCount} fila Edge
          </span>
        )}
        {lastSyncedAt && (
          <span className="text-[10px] font-mono text-zinc-400">
            Edge ACK: {new Date(lastSyncedAt).toLocaleString("pt-BR")}
          </span>
        )}
        <span className="text-[11px] text-zinc-300">{complianceNote}</span>
      </div>

      <div className="flex items-center gap-2">
        {alertMessage && (
          <span
            role="alert"
            className="inline-flex items-center gap-1 text-[11px] text-amber-300 font-semibold"
          >
            <AlertTriangle size={12} /> {alertMessage}
          </span>
        )}
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-semibold text-zinc-200 transition disabled:opacity-50"
        >
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
          <span>{loading ? "Sincronizando..." : "Atualizar"}</span>
        </button>
      </div>
    </div>
  );
}
