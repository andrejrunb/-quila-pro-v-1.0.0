import React from 'react';
import logo from '../../assets/logo.png';
import './PortalLayout.css';

interface PortalLayoutProps {
  children: React.ReactNode;
  portalName: string;
  themeColor?: string;
}

export const PortalLayout: React.FC<PortalLayoutProps> = ({ 
  children, 
  portalName, 
  themeColor = 'var(--secondary)' 
}) => {
  const wrapperRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (wrapperRef.current) {
      wrapperRef.current.style.setProperty('--portal-accent', themeColor);
    }
  }, [themeColor]);

  return (
    <div className="portal-wrapper" ref={wrapperRef}>
      <div className="portal-glass-container">
        <header className="portal-header-banner">
          <div className="flex items-center justify-between w-full">
            <div className="portal-badge">
              <span className="badge-dot"></span>
              <span className="badge-text">{portalName}</span>
            </div>
            <img src={logo} alt="Áquila" className="h-6 w-auto opacity-40 grayscale hover:opacity-100 hover:grayscale-0 transition-all" />
          </div>
        </header>
        <div className="portal-content-area">
          {children}
        </div>
      </div>
    </div>
  );
};

export default PortalLayout;
