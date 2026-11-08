import React from 'react';
import logo from '../../assets/logo.png';
import './PortalLayout.css';
import { SysHealth } from '../components/SysHealth';
import { HelpCircle, ChevronUp, ChevronDown, GraduationCap, Compass, Shield, Users, Sparkles, FileText, Wifi, Lock, ZoomIn, ZoomOut, Eye } from 'lucide-react';

interface PortalLayoutProps {
  children: React.ReactNode;
  portalName: string;
  themeColor?: string;
  onNavigate?: (page: string) => void;
  sessionUser?: { id?: string; username?: string; name?: string; role?: string } | null;
}

const PORTAL_SHORTCUTS = [
  { id: 'teacher-dashboard', label: 'PROF', title: 'Portal do Professor', icon: <GraduationCap size={12} />, color: '#3b82f6', allowedRoles: ['admin', 'director', 'coordinator', 'teacher', 'docente'] },
  { id: 'coordination', label: 'COORD', title: 'Portal da Coordenação', icon: <Compass size={12} />, color: '#f59e0b', allowedRoles: ['admin', 'director', 'coordinator'] },
  { id: 'executive-cockpit-portal', label: 'DIREÇÃO', title: 'Portal da Direção', icon: <Shield size={12} />, color: '#00F0FF', allowedRoles: ['admin', 'director'] },
  { id: 'secretaria-portal', label: 'SECRETARIA', title: 'Secretaria Escolar', icon: <FileText size={12} />, color: '#10B981', allowedRoles: ['admin', 'director', 'secretary', 'secretaria', 'hr', 'rh'] },
  { id: 'parent-portal', label: 'PAIS', title: 'Prévia do Portal da Família', icon: <Users size={12} />, color: '#0ea5e9', allowedRoles: ['admin', 'director', 'coordinator', 'parent', 'responsavel'] },
  { id: 'student-portal', label: 'ALUNOS', title: 'Prévia do Portal do Aluno', icon: <Sparkles size={12} />, color: '#8b5cf6', allowedRoles: ['admin', 'director', 'coordinator', 'teacher', 'docente', 'student', 'aluno'] },
];

export function resolvePortalPreviewState(
  sessionUser: { id?: string; username?: string; name?: string; role?: string } | null | undefined,
  portalName: string
): {
  canUsePortalSwitcher: boolean;
  isPreviewMode: boolean;
  authenticatedLabel: string;
  normalizedRole: string;
  canExecuteWriteInPortal: boolean;
} {
  const rawRole = (sessionUser?.role || '').toLowerCase().trim();
  const normalizedRole =
    rawRole === 'docente' ? 'teacher' :
    rawRole === 'aluno' ? 'student' :
    rawRole === 'responsavel' ? 'parent' :
    rawRole === 'secretaria' ? 'secretary' :
    rawRole || 'teacher';

  const userName = sessionUser?.name || sessionUser?.username || 'Usuário Autenticado';
  const roleLabelMap: Record<string, string> = {
    admin: 'Administrador',
    director: 'Direção',
    coordinator: 'Coordenação',
    teacher: 'Docente',
    secretary: 'Secretaria',
    student: 'Estudante',
    parent: 'Responsável',
  };
  const roleDisplay = roleLabelMap[normalizedRole] || normalizedRole;
  const authenticatedLabel = `${userName} (${roleDisplay})`;

  // Estudantes, responsáveis e secretaria NÃO podem alternar entre portais administrativos/docentes
  const canUsePortalSwitcher = ['admin', 'director', 'coordinator', 'teacher'].includes(normalizedRole);

  const lowerPortal = (portalName || '').toLowerCase();
  const isStudentPortal = lowerPortal.includes('aluno');
  const isParentPortal = lowerPortal.includes('família') || lowerPortal.includes('familia') || lowerPortal.includes('pais');
  const isCoordPortal = lowerPortal.includes('coordenação') || lowerPortal.includes('coordenacao');
  const isAdminPortal = lowerPortal.includes('direção') || lowerPortal.includes('direcao') || lowerPortal.includes('executivo');
  const isSecPortal = lowerPortal.includes('secretaria');

  let isPreviewMode = false;
  if (normalizedRole === 'teacher' && (isStudentPortal || isParentPortal || isCoordPortal || isAdminPortal || isSecPortal)) {
    isPreviewMode = true;
  } else if (normalizedRole === 'coordinator' && (isStudentPortal || isParentPortal || isAdminPortal || isSecPortal)) {
    isPreviewMode = true;
  } else if ((normalizedRole === 'admin' || normalizedRole === 'director') && (isStudentPortal || isParentPortal)) {
    isPreviewMode = true;
  } else if (normalizedRole === 'secretary' && (isStudentPortal || isParentPortal || isCoordPortal || isAdminPortal)) {
    isPreviewMode = true;
  }

  return {
    canUsePortalSwitcher,
    isPreviewMode,
    authenticatedLabel,
    normalizedRole,
    canExecuteWriteInPortal: !isPreviewMode,
  };
}

export const PortalLayout: React.FC<PortalLayoutProps> = ({ 
  children, 
  portalName, 
  themeColor = 'var(--stitch-cyan)',
  onNavigate,
  sessionUser
}) => {
  const wrapperRef = React.useRef<HTMLDivElement>(null);
  const [showHelp, setShowHelp] = React.useState(false);
  const [isHeaderCollapsed, setIsHeaderCollapsed] = React.useState(false);
  const [liveTime, setLiveTime] = React.useState('');
  const [zoomPercent, setZoomPercent] = React.useState<number>(100);
  const [resolvedUser, setResolvedUser] = React.useState<any>(sessionUser || null);

  React.useEffect(() => {
    if (sessionUser) {
      setResolvedUser(sessionUser);
      return;
    }
    let mounted = true;
    (window as any).aquila?.invoke?.('get-current-user')
      ?.then((u: any) => {
        if (mounted && u) setResolvedUser(u);
      })
      ?.catch(() => {});
    return () => {
      mounted = false;
    };
  }, [sessionUser]);

  const previewState = React.useMemo(
    () => resolvePortalPreviewState(resolvedUser, portalName),
    [resolvedUser, portalName]
  );

  // Atalhos Globais de Zoom (Ctrl +, Ctrl -, Ctrl 0)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === '=' || e.key === '+') {
          e.preventDefault();
          setZoomPercent(prev => Math.min(150, prev + 10));
        } else if (e.key === '-' || e.key === '_') {
          e.preventDefault();
          setZoomPercent(prev => Math.max(60, prev - 10));
        } else if (e.key === '0') {
          e.preventDefault();
          setZoomPercent(100);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  React.useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setLiveTime(now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 15000);
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

  const visibleShortcuts = PORTAL_SHORTCUTS.filter((p) =>
    p.allowedRoles.includes(previewState.normalizedRole)
  );

  return (
    <div className="portal-wrapper aquila-ui" ref={wrapperRef} data-preview-mode={previewState.isPreviewMode ? 'true' : 'false'}>
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
            <div className="portal-header-row" style={{ flexWrap: 'nowrap' }}>
              <div className="portal-header-left" style={{ flexWrap: 'nowrap' }}>
                <div className="portal-badge">
                  <span className="badge-dot"></span>
                  <span className="badge-text">{portalName}</span>
                </div>
                <div className="portal-sovereign-tag" title="Conectado ao banco SQLite local da unidade escolar">
                  <Lock size={10} className="portal-lock-icon" />
                  <span className="portal-sovereign-pulse"></span>
                  <span className="portal-sovereign-text">Sessão: {previewState.authenticatedLabel}</span>
                </div>
                {previewState.isPreviewMode && (
                  <span
                    data-testid="portal-preview-mode-badge"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      fontSize: '10.5px',
                      fontWeight: 700,
                      padding: '2px 9px',
                      borderRadius: '6px',
                      background: 'rgba(245, 158, 11, 0.16)',
                      border: '1px solid rgba(245, 158, 11, 0.45)',
                      color: '#FCD34D',
                      whiteSpace: 'nowrap'
                    }}
                    title="Prévia autorizada: mutações em nome de outro perfil estão bloqueadas e toda ação é auditada na sessão real"
                  >
                    <Eye size={11} />
                    Modo Prévia (Leitura)
                  </span>
                )}
              </div>

              {/* Alternador de Ambiente — exibido apenas para perfis de equipe autorizados */}
              {previewState.canUsePortalSwitcher && visibleShortcuts.length > 1 && (
                <nav className="portal-switcher-bar" aria-label="Alternar Ambiente (Prévia Autorizada)">
                  <span className="portal-switcher-caption" title="Alternar prévia entre ambientes autorizados">AMBIENTE:</span>
                  {visibleShortcuts.map((p) => {
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
              )}

              <div className="portal-header-actions">
                {liveTime && (
                  <div className="portal-time-display" title="Horário Oficial Escolar (America/Sao_Paulo)">
                    <Wifi size={11} className="portal-wifi-icon" />
                    <span className="portal-time-text">{liveTime}</span>
                  </div>
                )}

                {/* Controles de Zoom com compensação de altura para não cortar a tela */}
                <div className="portal-zoom-group" role="group" aria-label="Controle de Zoom do Portal">
                  <button
                    type="button"
                    className="portal-zoom-btn"
                    onClick={() => setZoomPercent(prev => Math.max(70, prev - 10))}
                    title="Diminuir Zoom (Ctrl -)"
                    aria-label="Diminuir Zoom"
                  >
                    <ZoomOut size={12} />
                  </button>
                  <button
                    type="button"
                    className="portal-zoom-pill"
                    onClick={() => setZoomPercent(100)}
                    title="Redefinir Zoom para 100% (Ctrl 0)"
                    aria-label="Redefinir Zoom"
                  >
                    {zoomPercent}%
                  </button>
                  <button
                    type="button"
                    className="portal-zoom-btn"
                    onClick={() => setZoomPercent(prev => Math.min(140, prev + 10))}
                    title="Aumentar Zoom (Ctrl +)"
                    aria-label="Aumentar Zoom"
                  >
                    <ZoomIn size={12} />
                  </button>
                </div>

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

        <div 
          className="portal-content-area"
          style={
            zoomPercent !== 100
              ? {
                  zoom: `${zoomPercent}%`,
                  width: `${10000 / zoomPercent}%`,
                  minHeight: `${10000 / zoomPercent}%`,
                }
              : undefined
          }
        >
          {children}
        </div>
      </div>
    </div>
  );
};

export default PortalLayout;
