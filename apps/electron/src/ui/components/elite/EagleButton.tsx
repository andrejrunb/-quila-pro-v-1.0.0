import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';

interface EagleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  glow?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const EagleButton: React.FC<EagleButtonProps> = ({
  children,
  className = '',
  variant = 'primary',
  size = 'md',
  glow = true,
  loading = false,
  leftIcon,
  rightIcon,
  style,
  disabled,
  onMouseEnter,
  onMouseLeave,
  onMouseDown,
  onMouseUp,
  ...props
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isActive, setIsActive] = useState(false);

  const getVariantStyles = (): { base: React.CSSProperties, hover: React.CSSProperties } => {
    switch (variant) {
      case 'primary':
        return {
          base: { background: 'linear-gradient(135deg, #3b82f6, #6366f1)', color: '#fff', border: 'none' },
          hover: { 
            background: 'linear-gradient(135deg, #2563eb, #4f46e5)',
            boxShadow: glow ? '0 0 20px rgba(59, 130, 246, 0.4)' : 'none'
          }
        };
      case 'secondary':
        return {
          base: { background: 'rgba(30, 41, 59, 0.5)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.3)' },
          hover: { 
            background: 'rgba(30, 41, 59, 0.8)',
            boxShadow: glow ? '0 0 20px rgba(59, 130, 246, 0.2)' : 'none'
          }
        };
      case 'danger':
        return {
          base: { background: 'linear-gradient(135deg, #ef4444, #b91c1c)', color: '#fff', border: 'none' },
          hover: { 
            background: 'linear-gradient(135deg, #dc2626, #991b1b)',
            boxShadow: glow ? '0 0 20px rgba(239, 68, 68, 0.4)' : 'none'
          }
        };
      case 'ghost':
        return {
          base: { background: 'transparent', color: '#cbd5e1', border: 'none' },
          hover: { background: 'rgba(255, 255, 255, 0.1)', color: '#fff' }
        };
      default:
        return { base: {}, hover: {} };
    }
  };

  const getSizeStyles = (): React.CSSProperties => {
    switch (size) {
      case 'sm': return { padding: '0.375rem 0.75rem', fontSize: '0.75rem' };
      case 'md': return { padding: '0.5rem 1rem', fontSize: '0.875rem' };
      case 'lg': return { padding: '0.75rem 1.5rem', fontSize: '1rem' };
      default: return {};
    }
  };

  const vStyles = getVariantStyles();

  const baseStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    borderRadius: '0.75rem',
    fontWeight: 600,
    fontFamily: 'Inter, sans-serif',
    transition: 'all 200ms ease-out',
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1,
    transform: isActive && !disabled && !loading ? 'scale(0.97)' : 'scale(1)',
    ...getSizeStyles(),
    ...vStyles.base,
    ...style
  };

  const currentStyle = isHovered && !disabled && !loading ? { ...baseStyle, ...vStyles.hover } : baseStyle;

  return (
    <button 
      className={className} 
      style={currentStyle}
      disabled={disabled || loading}
      onMouseEnter={(e) => { setIsHovered(true); if (onMouseEnter) onMouseEnter(e); }}
      onMouseLeave={(e) => { setIsHovered(false); setIsActive(false); if (onMouseLeave) onMouseLeave(e); }}
      onMouseDown={(e) => { setIsActive(true); if (onMouseDown) onMouseDown(e); }}
      onMouseUp={(e) => { setIsActive(false); if (onMouseUp) onMouseUp(e); }}
      {...props}
    >
      {loading && <Loader2 className="animate-spin" size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} />}
      {!loading && leftIcon && <span style={{ display: 'flex' }}>{leftIcon}</span>}
      {children}
      {!loading && rightIcon && <span style={{ display: 'flex' }}>{rightIcon}</span>}
    </button>
  );
};
