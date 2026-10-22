import React from 'react';
import { cn } from '@/lib/utils'; // Assumindo utilitário padrão do shadcn/ui

interface EagleCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  glow?: 'blue' | 'cyan' | 'purple' | 'amber';
  intensity?: 'low' | 'medium' | 'high';
}

/**
 * EagleCard - O componente fundamental de superfície do Áquila Pro.
 * Implementa Glassmorphism v2 com brilho dinâmico.
 */
export const EagleCard = React.forwardRef<HTMLDivElement, EagleCardProps>(
  ({ className, children, glow = 'blue', intensity = 'medium', ...props }, ref) => {
    
    const glowColors = {
      blue: 'hover:border-blue-500/40 hover:shadow-blue-500/15',
      cyan: 'hover:border-cyan-400/40 hover:shadow-cyan-400/15',
      purple: 'hover:border-purple-500/40 hover:shadow-purple-500/15',
      amber: 'hover:border-amber-500/40 hover:shadow-amber-500/15',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'eagle-glass-card p-6',
          glowColors[glow],
          className
        )}
        {...props}
      >
        {/* Camada Interna de Brilho */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
        
        {/* Conteúdo */}
        <div className="relative z-10">
          {children}
        </div>
        
        {/* Decorative Corner Glow */}
        <div className={cn(
          "absolute -top-12 -right-12 w-24 h-24 blur-[60px] rounded-full opacity-20 pointer-events-none",
          glow === 'blue' && "bg-blue-500",
          glow === 'cyan' && "bg-cyan-400",
          glow === 'purple' && "bg-purple-500"
        )} />
      </div>
    );
  }
);

EagleCard.displayName = 'EagleCard';
