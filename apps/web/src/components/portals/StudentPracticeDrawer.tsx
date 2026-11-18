"use client";

import React, { useState } from "react";
import { X, CheckCircle2, Sparkles, BookOpen, ShieldAlert, AlertTriangle } from "lucide-react";

export type StudentPracticeMode = "essay_lab" | "flashcards_srs";

interface StudentPracticeDrawerProps {
  mode: StudentPracticeMode | null;
  aiPolicyBlocked?: boolean;
  aiPolicyReason?: string | null;
  onClose: () => void;
  onComplete: (
    mode: StudentPracticeMode,
    topic: string
  ) => Promise<{ ok: boolean; error?: string } | void>;
}

const FLASHCARDS_DECK = [
  {
    front: "Primeira Lei da Termodinâmica",
    back: "ΔU = Q − W (variação de energia interna = calor trocado − trabalho realizado).",
  },
  {
    front: "Rendimento de Carnot (η)",
    back: "η = 1 − (Tfria / Tquente), com temperaturas obrigatoriamente em Kelvin (K).",
  },
  {
    front: "Competência 5 da Redação ENEM",
    back: "Proposta de intervenção com 5 elementos: Agente, Ação, Meio/Modo, Efeito e Detalhamento.",
  },
];

export function StudentPracticeDrawer({
  mode,
  aiPolicyBlocked = false,
  aiPolicyReason = null,
  onClose,
  onComplete,
}: StudentPracticeDrawerProps) {
  const [cardIndex, setCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [essayOutline, setEssayOutline] = useState(
    "Tese: A governança local de dados protege estudantes sem impedir apoio pedagógico docente."
  );
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!mode) return null;

  const currentCard = FLASHCARDS_DECK[cardIndex % FLASHCARDS_DECK.length];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={mode === "essay_lab" ? "Laboratório de Redação" : "Revisão Ativa SRS"}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
    >
      <div className="max-w-lg w-full rounded-3xl bg-zinc-950 border border-white/15 p-6 flex flex-col gap-5 relative shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar atividade"
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-white/10 text-zinc-300 hover:text-white"
        >
          <X size={18} />
        </button>

        {aiPolicyBlocked ? (
          <div className="p-5 rounded-2xl bg-amber-950/25 border border-amber-500/40 flex flex-col gap-3">
            <div className="flex items-center gap-2 text-amber-300 text-xs font-bold uppercase tracking-wider">
              <ShieldAlert size={16} /> Bloqueado pelo Parecer CNE/CP nº 15/2026
            </div>
            <p className="text-xs text-zinc-200 leading-relaxed">
              {aiPolicyReason ||
                "O acesso autônomo a ferramentas de apoio generativo (Redação IA / Revisão Guiada IA) não é permitido para Educação Infantil ou Anos Iniciais do Ensino Fundamental (1º ao 5º ano) sem condução presencial do professor."}
            </p>
            <button
              type="button"
              onClick={onClose}
              className="self-end px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold text-white"
            >
              Entendido
            </button>
          </div>
        ) : mode === "flashcards_srs" ? (
          <>
            <div className="flex items-center gap-2 text-cyan-300 text-xs font-bold uppercase tracking-wider">
              <Sparkles size={16} /> Flashcards SRS • Sessão Guiada
            </div>
            <div className="p-5 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-3 min-h-[140px] justify-center">
              <span className="text-[10px] font-mono text-zinc-400">
                Cartão {(cardIndex % FLASHCARDS_DECK.length) + 1} de {FLASHCARDS_DECK.length}
              </span>
              <h3 className="text-base font-bold text-white">{currentCard.front}</h3>
              {showAnswer && (
                <p className="text-xs text-emerald-200 bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3">
                  {currentCard.back}
                </p>
              )}
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
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setShowAnswer((prev) => !prev)}
                className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold text-white"
              >
                {showAnswer ? "Ocultar Resposta" : "Revelar Resposta"}
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={async () => {
                  if (cardIndex + 1 < FLASHCARDS_DECK.length) {
                    setCardIndex((i) => i + 1);
                    setShowAnswer(false);
                    return;
                  }
                  setErrorMsg(null);
                  setSaving(true);
                  const result = await onComplete(
                    "flashcards_srs",
                    "Sessão Flashcards Termodinâmica & Redação"
                  );
                  setSaving(false);
                  if (result && typeof result === "object" && "ok" in result && !result.ok) {
                    setErrorMsg(result.error || "Atividade bloqueada pela política CNE/CP nº 15/2026.");
                    return;
                  }
                  setCardIndex(0);
                  setShowAnswer(false);
                  onClose();
                }}
                className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-black flex items-center gap-1.5"
              >
                <CheckCircle2 size={14} />
                <span>
                  {cardIndex + 1 < FLASHCARDS_DECK.length
                    ? "Próximo Cartão"
                    : "Concluir Sessão (+40 XP)"}
                </span>
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2 text-purple-300 text-xs font-bold uppercase tracking-wider">
              <BookOpen size={16} /> Essay Lab • Estruturação Socrática
            </div>
            <p className="text-xs text-zinc-300">
              Estruture sua tese e os 5 elementos da proposta de intervenção antes da revisão pelo docente. O texto completo permanece na sua sessão escolar local.
            </p>
            <textarea
              rows={4}
              value={essayOutline}
              onChange={(e) => {
                setEssayOutline(e.target.value);
                if (errorMsg) setErrorMsg(null);
              }}
              className="w-full bg-zinc-900 border border-white/15 rounded-xl p-3 text-xs text-white outline-none focus:border-purple-400"
            />
            {errorMsg && (
              <div
                role="alert"
                className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-200 text-xs flex items-start gap-2"
              >
                <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}
            <button
              type="button"
              disabled={saving}
              onClick={async () => {
                setErrorMsg(null);
                setSaving(true);
                const result = await onComplete("essay_lab", essayOutline.slice(0, 120));
                setSaving(false);
                if (result && typeof result === "object" && "ok" in result && !result.ok) {
                  setErrorMsg(result.error || "Atividade bloqueada pela política CNE/CP nº 15/2026.");
                  return;
                }
                onClose();
              }}
              className="self-end px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5"
            >
              <CheckCircle2 size={14} /> Registrar Treino no Histórico (+60 XP)
            </button>
          </>
        )}
      </div>
    </div>
  );
}
