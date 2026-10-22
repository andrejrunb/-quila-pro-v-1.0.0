import React from 'react';
import { useBranding } from '../hooks/useBranding';
import './BrandingLogo.css';

interface BrandingLogoProps {
  className?: string;
  size?: number;
  planId?: string; // Se não passado, busca do sistema
}

export const BrandingLogo: React.FC<BrandingLogoProps> = ({ className = '', size = 40, planId = 'basic' }) => {
  const { branding, loading } = useBranding(planId);

  // Lógica para detectar se o logo é um emoji ou URL/filename (v3441)
  const isEmoji = branding?.logo ? (branding.logo.length < 10 && !branding.logo.includes('/') && !branding.logo.includes('.')) : true;

  const sizeClass = size <= 32 ? 'size-small' : size >= 64 ? 'size-large' : 'size-medium';

  if (loading) {
    return (
      <div className={`branding-logo-placeholder ${sizeClass} ${className}`} />
    );
  }

  return (
    <div className={`branding-logo-container ${sizeClass} ${className}`}>
      {isEmoji ? (
        <span className="branding-logo-emoji">
          {branding?.logo || '🦅'}
        </span>
      ) : (
        <img 
          src={branding.logo} 
          alt={branding.name} 
          className="branding-logo-img"
          onError={(e) => {
            // Em caso de erro, volta para a águia soberana
            (e.target as HTMLImageElement).src = '🦅';
          }}
        />
      )}
      
      {!branding.isWhiteLabel && (
        <div className="branding-text-stack">
           <span className="branding-logo-name">{branding.name}</span>
           <span className="branding-logo-powered">POWERED BY ÁQUILA</span>
        </div>
      )}
      
      {branding.isWhiteLabel && (
        <span className="branding-logo-name">
          {branding.name}
        </span>
      )}
    </div>
  );
};

export default BrandingLogo;
