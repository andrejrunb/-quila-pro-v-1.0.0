import React from 'react';
import logo from '../../assets/logo.png';
import './PortalLayout.css';
import { SysHealth } from '../components/SysHealth';
import { HelpCircle, ChevronUp, ChevronDown, GraduationCap, Compass, Shield, Users, Sparkles, FileText, Wifi, Lock } from 'lucide-react';

interface PortalLayoutProps {
  children: React.ReactNode;
  portalName: string;
  themeColor?: string;
  onNavigate?: (page: string) => void;
}

const PORTAL_SHORTCUTS = [
  { id: 'teacher-dashboard', label: 'PROF', title: 'Portal do Professor', icon: <GraduationCap size={12} />, color: '#3b82f6' },
  { id: 'coordination', label: 'COORD', title: 'Portal da Coordenação', icon: <Compass size={12} />, color: '#f59e0b' },
  { id: 'executive-cockpit-portal', label: 'DIREÇÃO', title: 'Portal da Direção (Stitch)', icon: <Shield size={12} />, color: '#00F0FF' },
  { id: 'secretaria-portal', label: 'SECRETARIA', title: 'Secretaria Digital & Domínio ERP', icon: <FileText size={12} />, color: '#10B981' },
  { id: 'parent-portal', label: 'PAIS', title: 'Portal da Família', icon: <Users size={12} />, color: '#0ea5e9' },
  { id: 'student-portal', label: 'ALUNOS', title: 'Portal do Aluno', icon: <Sparkles size={12} />, color: '#8b5cf6' },
];

export const PortalLayout: React.FC<PortalLayoutProps> = ({ 
  children, 
  portalName, 
  themeColor = 'var(--stitch-cyan)',
  onNavigate
}) => {
  const wrapperRef = React.useRef<HTMLDivElement>(null);
  const [showHelp, setShowHelp] = React.useState(false);
  const [isHeaderCollapsed, setIsHeaderCollapsed] = React.useState(false);
  const [liveTime, setLiveTime] = React.useState('');

  React.useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setLiveTime(now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  React.useEffect(() => {
    if (wrapperRef.current) {
      wrapperRef.current.style.setProperty('--portal-accent', themeColor);
    }
  }, [themeColor]);

  const triggerNavigate = (page: string) => {
    if (onNavigate) {
      onNavigate(page);
    } else {
      window.dispatchEvent(new CustomEvent('aquila:navigate', { detail: page }));
    }
  };

  return (
    <div className="portal-wrapper" ref={wrapperRef}>
      <SysHealth />
      <div className="portal-glass-container">
        {isHeaderCollapsed ? (
          <button
            className="portal-collapsed-pill"
            onClick={() => setIsHeaderCollapsed(false)}
            title="Expandir Barra do Portal"
          >
            <span className="badge-dot" />
            <span>{portalName}</span>
            <ChevronDown size={12} />
          </button>
        ) : (
          <header className="portal-header-banner">
            <div className="portal-header-row">
              <div className="portal-header-left">
                <div className="portal-badge">
                  <span className="badge-dot"></span>
                  <span className="badge-text">{portalName}</span>
                </div>
                <div className="portal-sovereign-tag">
                  <Lock size={10} className="portal-lock-icon" />
                  <span className="portal-sovereign-pulse"></span>
                  <span className="portal-sovereign-text">LAN 100% SOBERANA</span>
                </div>
              </div>

              {/* Stitch Sovereign Portal Switcher — 6 Core Portals */}
              <nav className="portal-switcher-bar" aria-label="Alternador Rápido de Portais">
                <span className="portal-switcher-caption">PORTAIS:</span>
                {PORTAL_SHORTCUTS.map((p) => {
                  const isActive =
                    (p.label === 'PROF' && portalName.toLowerCase().includes('pedagógico')) ||
                    (p.label === 'COORD' && portalName.toLowerCase().includes('coordenação')) ||
                    (p.label === 'DIREÇÃO' && portalName.toLowerCase().includes('direção')) ||
                    (p.label === 'SECRETARIA' && portalName.toLowerCase().includes('secretaria')) ||
                    (p.label === 'PAIS' && portalName.toLowerCase().includes('família')) ||
                    (p.label === 'ALUNOS' && portalName.toLowerCase().includes('aluno'));
                  return (
                    <button
                      key={p.id}
                      type="button"
                      className={`portal-switch-pill ${isActive ? 'active' : ''}`}
                      style={{ '--pill-color': p.color } as React.CSSProperties}
                      onClick={() => triggerNavigate(p.id)}
                      title={p.title}
                    >
                      {p.icon}
                      <span>{p.label}</span>
                    </button>
                  );
                })}
              </nav>

              <div className="portal-header-actions">
                {liveTime && (
                  <div className="portal-time-display" title="Horário Oficial Local">
                    <Wifi size={11} className="portal-wifi-icon" />
                    <span className="portal-time-text">{liveTime}</span>
                  </div>
                )}
                <button
                  className="portal-help-btn"
                  title="Ajuda & Suporte"
                  onClick={() => setShowHelp(v => !v)}
                  aria-label="Abrir ajuda"
                >
                  <HelpCircle size={13} />
                  <span>Ajuda</span>
                </button>
                <button
                  className="portal-collapse-btn"
                  title="Recolher barra superior para maximizar conteúdo"
                  onClick={() => setIsHeaderCollapsed(true)}
                  aria-label="Recolher cabeçalho"
                >
                  <ChevronUp size={13} />
                </button>
                <img src={logo} alt="Áquila" className="portal-mini-logo" />
              </div>
            </div>

            {showHelp && (
              <div className="portal-help-panel">
                <strong>Precisa de ajuda com <em>{portalName}</em>?</strong>
                <p>Acesse a documentação ou fale com o suporte Áquila:</p>
                <div className="portal-help-links">
                  <a href="#" onClick={e => { e.preventDefault(); triggerNavigate('help'); setShowHelp(false); }}>📖 Central de Ajuda</a>
                  <a href="#" onClick={e => { e.preventDefault(); triggerNavigate('support'); setShowHelp(false); }}>💬 Abrir Chamado</a>
                </div>
              </div>
            )}
          </header>
        )}

        <div className="portal-content-area">
          {children}
        </div>
      </div>
    </div>
  );
};

export default PortalLayout;
