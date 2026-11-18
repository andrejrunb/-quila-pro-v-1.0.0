"use client";

import React, { useState } from "react";
import { AlertTriangle, ShieldCheck, X } from "lucide-react";

interface ParentLgpdModalProps {
  open: boolean;
  onClose: () => void;
  defaultGuardianName?: string;
  defaultGuardianCpf?: string;
  onGrantConsent: (
    guardianName: string,
    guardianCpf: string
  ) => Promise<{ ok: boolean; error?: string } | void>;
}

function normalizeCpfDigits(raw: string): string {
  return raw.replace(/\D/g, "");
}

export function ParentLgpdModal({
  open,
  onClose,
  defaultGuardianName,
  defaultGuardianCpf,
  onGrantConsent,
}: ParentLgpdModalProps) {
  const [guardianName, setGuardianName] = useState(
    defaultGuardianName !== undefined ? defaultGuardianName : "Sra. Patrícia Andrade"
  );
  const [guardianCpf, setGuardianCpf] = useState(
    defaultGuardianCpf !== undefined ? defaultGuardianCpf : "123.456.789-00"
  );
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!open) return null;

  const cpfDigits = normalizeCpfDigits(guardianCpf);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Opt-in Biométrico LGPD Art. 14"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
    >
      <div className="max-w-md w-full rounded-3xl bg-zinc-950 border border-cyan-500/35 p-6 flex flex-col gap-4 relative shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar modal de consentimento LGPD"
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-white/10 text-zinc-300 hover:text-white"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-2 text-cyan-300 text-xs font-bold uppercase tracking-wider">
          <ShieldCheck size={16} /> Opt-in Biométrico Opcional (LGPD Art. 14)
        </div>

        <p className="text-xs text-zinc-300 leading-relaxed">
          O acesso por <strong>Crachá QR Dinâmico</strong> e chamada nominal permanece sempre ativo sem necessidade de biometria. Caso opte por autorizar futuros testes em ambiente Edge local (política interna Áquila: sem envio de vetores à nuvem), o registro abaixo grava identidade autenticada, finalidade, versão do termo e protocolo SHA-256 de integridade (não substitui firma qualificada ICP-Brasil) e enfileira comando para confirmação do Edge escolar:
        </p>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="lgpd-guardian-name" className="text-[11px] font-bold text-zinc-300">
            Nome Completo do Responsável Legal
          </label>
          <input
            id="lgpd-guardian-name"
            type="text"
            value={guardianName}
            onChange={(e) => {
              setGuardianName(e.target.value);
              if (errorMsg) setErrorMsg(null);
            }}
            placeholder="Digite seu nome completo"
            className="w-full bg-zinc-900 border border-white/15 rounded-xl px-3 py-2 text-xs text-white"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="lgpd-guardian-cpf" className="text-[11px] font-bold text-zinc-300">
            CPF do Responsável (11 dígitos)
          </label>
          <input
            id="lgpd-guardian-cpf"
            type="text"
            value={guardianCpf}
            onChange={(e) => {
              setGuardianCpf(e.target.value);
              if (errorMsg) setErrorMsg(null);
            }}
            placeholder="000.000.000-00"
            className="w-full bg-zinc-900 border border-white/15 rounded-xl px-3 py-2 text-xs text-white font-mono"
          />
        </div>

        {errorMsg && (
          <div
            role="alert"
            className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-200 text-xs flex items-start gap-2"
          >
            <AlertTriangle size={14} className="shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-zinc-300"
          >
            Manter Crachá QR Padrão
          </button>
          <button
            type="button"
            disabled={submitting || guardianName.trim().length < 3 || cpfDigits.length < 11}
            onClick={async () => {
              setErrorMsg(null);
              if (cpfDigits.length !== 11 || /^(\d)\1{10}$/.test(cpfDigits)) {
                setErrorMsg("CPF inválido: informe 11 dígitos numéricos não repetidos.");
                return;
              }
              setSubmitting(true);
              const result = await onGrantConsent(guardianName.trim(), guardianCpf.trim());
              setSubmitting(false);
              if (result && typeof result === "object" && "ok" in result && !result.ok) {
                setErrorMsg(result.error || "Não foi possível registrar o consentimento.");
                return;
              }
              onClose();
            }}
            className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-black disabled:opacity-50"
          >
            {submitting ? "Registrando..." : "Registrar Ciência e Consentimento (Auditável)"}
          </button>
        </div>
      </div>
    </div>
  );
}
