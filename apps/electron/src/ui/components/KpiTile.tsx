import React from 'react';
import { LucideIcon } from 'lucide-react';

export interface KpiTileProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon: LucideIcon;
  isDemonstration?: boolean;
}

export const KpiTile: React.FC<KpiTileProps> = ({
  title,
  value,
  subtitle,
  trend,
  icon: Icon,
  isDemonstration = false,
}) => {
  return (
    <div className="glass-panel p-4 flex flex-col justify-between min-h-[110px] relative">
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-2)]">
          {title}
        </span>
        <div className="flex items-center gap-1.5">
          {isDemonstration && (
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-800 text-amber-300 border border-amber-500/30">
              Simulado
            </span>
          )}
          <div className="p-1.5 rounded-md bg-slate-800/80 text-cyan-400">
            <Icon size={16} />
          </div>
        </div>
      </div>

      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-2xl font-bold tabular-nums text-[var(--text-1)]">
          {value}
        </span>
        {subtitle && (
          <span className={`text-xs font-medium tabular-nums ${trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-rose-400' : 'text-[var(--text-3)]'}`}>
            {trend === 'up' ? '↑ ' : trend === 'down' ? '↓ ' : ''}
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
};
