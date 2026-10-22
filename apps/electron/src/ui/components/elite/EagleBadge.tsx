import React from 'react';

interface EagleBadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'danger' | 'warning' | 'info' | 'default';
  glow?: boolean;
  className?: string;
}

export const EagleBadge: React.FC<EagleBadgeProps> = ({
  children,
  variant = 'default',
  glow = false,
  className = ''
}) => {
  const baseClasses = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-colors';
  
  const variants = {
    success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    danger: 'bg-red-500/10 text-red-400 border-red-500/20',
    warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    info: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    default: 'bg-white/5 text-slate-300 border-white/10'
  };

  const glowClasses = {
    success: glow ? 'shadow-[0_0_12px_rgba(16,185,129,0.4)] animate-pulse border-emerald-500/50' : '',
    danger: glow ? 'shadow-[0_0_12px_rgba(239,68,68,0.4)] animate-pulse border-red-500/50' : '',
    warning: glow ? 'shadow-[0_0_12px_rgba(245,158,11,0.4)] animate-pulse border-amber-500/50' : '',
    info: glow ? 'shadow-[0_0_12px_rgba(59,130,246,0.4)] animate-pulse border-blue-500/50' : '',
    default: glow ? 'shadow-[0_0_12px_rgba(255,255,255,0.1)]' : ''
  };

  return (
    <span className={`${baseClasses} ${variants[variant]} ${glowClasses[variant]} ${className}`.trim()}>
      {children}
    </span>
  );
};
