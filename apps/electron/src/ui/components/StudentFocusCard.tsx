import React from 'react';

export interface StudentFocusCardProps {
  subject: string;
  title: string;
  progress: number;
  dueLabel?: string;
  onContinue: () => void;
  className?: string;
  style?: React.CSSProperties;
}

export const StudentFocusCard: React.FC<StudentFocusCardProps> = ({
  subject,
  title,
  progress,
  dueLabel,
  onContinue,
  className = '',
  style,
}) => {
  const safeProgress = Math.min(100, Math.max(0, progress));

  return (
    <section
      className={`glass-panel p-5 relative overflow-hidden ${className}`}
      style={style}
      aria-labelledby="student-focus-title"
    >
      <div className="flex items-center justify-between gap-4 mb-2">
        <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-accent-primary,#60A5FA)]">
          Continue de onde parou
        </span>
        {dueLabel && (
          <span className="text-xs text-[var(--text-2,#94A3B8)] font-medium">
            {dueLabel}
          </span>
        )}
      </div>

      <p className="text-xs text-[var(--text-2,#CBD5E1)] font-medium mb-1">{subject}</p>

      <h2 id="student-focus-title" className="text-lg font-bold text-[var(--text-1,#F8FAFC)] mb-4">
        {title}
      </h2>

      <div className="flex items-center gap-3 mb-4">
        <div
          className="relative flex-1 h-2 overflow-hidden bg-slate-800 rounded-full"
          role="progressbar"
          aria-label="Progresso da atividade"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={safeProgress}
        >
          <span
            className="block h-full bg-[var(--color-accent-primary,#3B82F6)] rounded-full transition-all duration-300"
            style={{ width: `${safeProgress}%` }}
          />
        </div>
        <span className="text-xs font-semibold tabular-nums text-[var(--text-2,#CBD5E1)] min-w-[3rem] text-right">
          {safeProgress}%
        </span>
      </div>

      <button
        type="button"
        className="btn-accessible w-full py-2.5 px-4 rounded-lg bg-[var(--color-accent-primary,#2563EB)] text-white font-bold hover:brightness-110 active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2"
        onClick={onContinue}
      >
        <span>Continuar atividade</span>
      </button>
    </section>
  );
};
