import React from 'react';
import { cn } from '@/lib/utils';

interface EliteButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  glow?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * EliteButton - Botão de alta performance com feedback visual de "Glow" neon.
 */
export const EliteButton = React.forwardRef<HTMLButtonElement, EliteButtonProps>(
  ({ className, variant = 'primary', glow = true, size = 'md', ...props }, ref) => {
    
    const variants = {
      primary: 'btn-elite-glow bg-blue-600/20 text-blue-400 border-blue-500/30 hover:bg-blue-600/30',
      secondary: 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10 hover:text-white',
      danger: 'bg-red-600/20 text-red-400 border-red-500/30 hover:bg-red-600/30 hover:shadow-red-500/20',
      ghost: 'bg-transparent text-gray-400 hover:bg-white/5 hover:text-white border-transparent',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-xs',
      md: 'px-5 py-2.5 text-sm',
      lg: 'px-8 py-3.5 text-base font-semibold',
    };

    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-xl border transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:pointer-events-none',
          variants[variant],
          sizes[size],
          glow && variant !== 'ghost' && 'shadow-[0_0_15px_-5px_transparent] hover:shadow-current/40',
          className
        )}
        {...props}
      />
    );
  }
);

EliteButton.displayName = 'EliteButton';
