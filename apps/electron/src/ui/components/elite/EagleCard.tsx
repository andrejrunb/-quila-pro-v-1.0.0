import React, { useState } from 'react';

interface EagleCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  glow?: boolean;
  clickable?: boolean;
  variant?: 'default' | 'kpi' | 'alert' | 'success';
  icon?: React.ReactNode;
  title?: string;
}

export const EagleCard: React.FC<EagleCardProps> = ({ 
  children, 
  className = '', 
  glow = false, 
  clickable = false,
  variant = 'default',
  icon,
  title,
  style,
  onMouseEnter,
  onMouseLeave,
  ...props 
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const getVariantStyles = (): React.CSSProperties => {
    switch (variant) {
      case 'kpi': return { padding: '1rem' };
      case 'alert': return { borderLeft: '4px solid #f59e0b' };
      case 'success': return { borderLeft: '4px solid #10b981' };
      default: return {};
    }
  };

  const baseStyle: React.CSSProperties = {
    background: 'rgba(30, 41, 59, 0.5)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    borderRadius: '1rem',
    padding: '1.5rem',
    transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
    cursor: clickable ? 'pointer' : 'default',
    ...getVariantStyles(),
    ...style,
  };

  const hoverStyle: React.CSSProperties = {
    boxShadow: '0 0 20px rgba(59, 130, 246, 0.15)',
    transform: clickable ? 'scale(1.01) translateY(-1px)' : 'scale(1.01)',
    borderColor: 'rgba(59, 130, 246, 0.3)',
  };

  const currentStyle = isHovered ? { ...baseStyle, ...hoverStyle } : baseStyle;

  return (
    <div 
      className={className} 
      style={currentStyle}
      onMouseEnter={(e) => { setIsHovered(true); if (onMouseEnter) onMouseEnter(e); }}
      onMouseLeave={(e) => { setIsHovered(false); if (onMouseLeave) onMouseLeave(e); }}
      {...props}
    >
      {(icon || title) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          {icon && <span style={{ display: 'flex', alignItems: 'center', color: '#94a3b8' }}>{icon}</span>}
          {title && <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#fff' }}>{title}</h3>}
        </div>
      )}
      {children}
    </div>
  );
};
