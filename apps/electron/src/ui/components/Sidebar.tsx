import React, { useEffect, useState } from 'react';
import { 
  LayoutDashboard, BarChart3, Bell, Users, BookOpen,
  Camera, Map, FileText, Settings, ShieldCheck, 
  Search, ChevronRight, LogOut, CreditCard, Globe, UserPlus, Box, Radio, Activity, Sparkles, ScanFace, DoorOpen, ShoppingBag, Brain, Moon, Command, TrendingUp,
  Cctv, Leaf, Infinity, Clock, Share2, Cpu, Eye, FileCheck, LayoutGrid, Key, Shield, Wind, Briefcase, Heart, History, Library, Zap, User, Crown, Tv
} from 'lucide-react';
import { LogoffProtocol } from './LogoffProtocol';
import './Sidebar.css';
import logo from '../../assets/logo.png';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  user: any;
  onLogout: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  currentHub: 'security' | 'admin' | 'pedagogical';
  onHubChange: (hub: 'security' | 'admin' | 'pedagogical') => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  currentPage, onNavigate, user, onLogout, 
  isCollapsed = false, onToggleCollapse,
  currentHub, onHubChange
}) => {
  const [branding, setBranding] = useState<{ logo?: string; primaryColor?: string }>({});
  const [showLogoffProtocol, setShowLogoffProtocol] = useState(false);
  const [ecosystem, setEcosystem] = useState<any>(null);

  useEffect(() => {
    loadBranding();
    loadEcosystem();

    // Listener para mudanças no ecossistema
    const removeListener = window.aquila.ecosystem.onStatusChanged((state: any) => {
      setEcosystem(state);
    });

    return () => {
      if (removeListener) removeListener();
    };
  }, []);

  const loadBranding = async () => {
    try {
      const settings = await (window as any).aquila.invoke('get-school-settings');
      if (settings) {
        setBranding({
          logo: settings.schoolLogo,
          primaryColor: settings.primaryColor
        });
        
        if (settings.primaryColor) {
          document.documentElement.style.setProperty('--brand-primary', settings.primaryColor);
        }
      }
    } catch (err) {
      console.error('Erro ao carregar branding:', err);
    }
  };

  const loadEcosystem = async () => {
    try {
      const state = await window.aquila.ecosystem.getState();
      setEcosystem(state);
    } catch (err) {
      console.error('Erro ao carregar ecossistema no sidebar:', err);
    }
  };
  const allMenuItems = [
    // ═══ SEGURANÇA ═══
    { id: 'dashboard', label: 'Início', icon: <LayoutDashboard size={20} />, hub: 'security', roles: ['admin', 'security', 'director'] },
    { id: 'cameras', label: 'Câmeras ao Vivo', icon: <Camera size={20} />, hub: 'security', roles: ['admin', 'security'] },
    { id: 'alerts', label: 'Ocorrências', icon: <Bell size={20} />, hub: 'security', roles: ['admin', 'security'] },
    { id: 'night-sentry', label: 'Night Sentry', icon: <Moon size={20} />, hub: 'security', roles: ['admin', 'security'] },
    { id: 'security-monitor', label: 'Estado do Sistema', icon: <ShieldCheck size={20} />, hub: 'security', roles: ['admin', 'security'] },
    { id: 'load-testing', label: 'Auditoria de Performance', icon: <Zap size={20} />, hub: 'security', roles: ['admin'] },
    { id: 'social-nexus', label: 'Social Nexus', icon: <Radio size={20} />, hub: 'security', roles: ['admin'] },

    // ═══ GESTÃO & PORTAIS SOBERANOS ═══
    { id: 'executive-cockpit-portal', label: 'Portal da Direção', icon: <Shield size={20} />, hub: 'admin', roles: ['admin', 'director'] },
    { id: 'coordination', label: 'Portal Coordenação', icon: <DoorOpen size={20} />, hub: 'admin', roles: ['admin', 'coordinator', 'secretary', 'director'] },
    { id: 'teacher-dashboard', label: 'Portal do Professor', icon: <BookOpen size={20} />, hub: 'admin', roles: ['admin', 'director', 'coordinator', 'teacher', 'docente'] },
    { id: 'parent-portal', label: 'Portal dos Pais', icon: <Users size={20} />, hub: 'admin', roles: ['admin', 'director', 'coordinator', 'parent', 'responsavel'] },
    { id: 'student-portal', label: 'Portal do Aluno', icon: <Sparkles size={20} />, hub: 'admin', roles: ['admin', 'director', 'coordinator', 'teacher', 'student', 'aluno'] },
    { id: 'zenith-cockpit', label: 'Córtex Transcendente', icon: <Brain size={20} />, hub: 'admin', roles: ['admin'] },
    { id: 'zenith-final', label: 'Zenith Cockpit', icon: <Infinity size={20} />, hub: 'admin', roles: ['admin'] },
    { id: 'executive-pulse', label: 'Cockpit Executivo', icon: <Activity size={20} />, hub: 'admin', roles: ['admin'] },
    { id: 'executive-finance-bi', label: 'BI Financeiro', icon: <TrendingUp size={20} />, hub: 'admin', roles: ['admin', 'director'] },
    { id: 'finance', label: 'Financeiro', icon: <CreditCard size={20} />, hub: 'admin', roles: ['admin', 'director'] },
    { id: 'user-management', label: 'Controle de Acessos', icon: <UserPlus size={20} />, hub: 'admin', roles: ['admin', 'hr', 'rh', 'secretary', 'director'] },
    { id: 'secretaria-portal', label: 'Secretaria Digital', icon: <FileText size={20} />, hub: 'admin', roles: ['admin', 'director', 'secretary', 'hr', 'rh'] },
    { id: 'collective-brain', label: 'Cérebro Coletivo', icon: <Brain size={20} />, hub: 'admin', roles: ['admin'] },
    { id: 'lgpd', label: 'Proteção de Dados', icon: <Globe size={20} />, hub: 'admin', roles: ['admin'] },
    { id: 'ecosystem', label: 'Ecossistema', icon: <LayoutGrid size={20} />, hub: 'admin', roles: ['admin'] },
    { id: 'settings', label: 'Configurações', icon: <Settings size={20} />, hub: 'admin', roles: ['admin', 'director'] },
    { id: 'help', label: 'Central de Ajuda', icon: <BookOpen size={20} />, hub: 'admin', roles: ['admin', 'director', 'secretary', 'security', 'coordinator', 'teacher'] },

    // ═══ ENSINO ═══
    { id: 'seating-intelligence', label: 'Mapa de Assentos IA', icon: <LayoutDashboard size={20} />, hub: 'pedagogical', roles: ['admin', 'coordinator', 'teacher', 'director'] },
    { id: 'teacher-dashboard', label: 'Cockpit Docente (Prof)', icon: <BookOpen size={20} />, hub: 'pedagogical', roles: ['admin', 'coordinator', 'teacher', 'docente', 'director'] },
    { id: 'gradebook', label: 'Planilha de Notas', icon: <FileCheck size={20} />, hub: 'pedagogical', roles: ['admin', 'coordinator', 'teacher', 'docente', 'director', 'secretary'] },
    { id: 'coordination', label: 'Cockpit Coordenação', icon: <BarChart3 size={20} />, hub: 'pedagogical', roles: ['admin', 'coordinator', 'director'] },
    { id: 'parent-portal', label: 'Portal Família (Pais)', icon: <Heart size={20} />, hub: 'pedagogical', roles: ['admin', 'coordinator', 'director', 'parent', 'responsavel'] },
    { id: 'student-portal', label: 'Portal do Aluno (RPG)', icon: <Sparkles size={20} />, hub: 'pedagogical', roles: ['admin', 'coordinator', 'teacher', 'director', 'student', 'aluno'] },
    { id: 'students', label: 'Gestão de Alunos', icon: <Users size={20} />, hub: 'pedagogical', roles: ['admin', 'coordinator', 'teacher', 'director', 'secretary'] },
    { id: 'attendance', label: 'Chamada Inteligente', icon: <BarChart3 size={20} />, hub: 'pedagogical', roles: ['admin', 'coordinator', 'teacher', 'director'] },
    { id: 'tasks', label: 'Tarefas & Agendamentos', icon: <Clock size={20} />, hub: 'pedagogical', roles: ['admin', 'teacher'] },
    ...( !(window as any).aquila ? [{ id: 'whiteboard', label: 'Quadro IA (Scanner)', icon: <Camera size={20} />, hub: 'pedagogical', roles: ['admin', 'teacher'] }] : []),
    { id: 'daily-report', label: 'Relatório Diário IA', icon: <FileText size={20} />, hub: 'pedagogical', roles: ['admin', 'teacher'] },
    { id: 'intelligence-hub', label: 'Inteligência Ativa', icon: <Brain size={20} />, hub: 'pedagogical', roles: ['admin', 'coordinator', 'director'] },
    { id: 'reports-hub', label: 'Relatórios & Laudos', icon: <FileText size={20} />, hub: 'pedagogical', roles: ['admin', 'coordinator', 'director', 'secretary'] },
    { id: 'diary', label: 'Diário de Classe', icon: <BookOpen size={20} />, hub: 'pedagogical', roles: ['admin', 'teacher'] },
    { id: 'ai-lab', label: 'Córtex AI Lab', icon: <Sparkles size={20} />, hub: 'pedagogical', roles: ['admin', 'teacher', 'coordinator', 'student'] },
    { id: 'cosmetics-chamber', label: 'Banners & Cosméticos', icon: <Crown size={20} />, hub: 'pedagogical', roles: ['admin', 'teacher', 'coordinator', 'student', 'aluno'] },
    { id: 'youtube-radar', label: 'Videoaulas YouTube', icon: <Tv size={20} />, hub: 'pedagogical', roles: ['admin', 'teacher', 'coordinator', 'student', 'aluno', 'director'] },
    { id: 'predictive-dashboard', label: 'Radar de Evasão', icon: <Activity size={20} />, hub: 'pedagogical', roles: ['admin', 'coordinator', 'director'] },
    { id: 'sovereign-library', label: 'Biblioteca Pedagógica', icon: <Library size={20} />, hub: 'pedagogical', roles: ['admin', 'teacher', 'coordinator', 'student', 'director'] },
    { id: 'classroom-dashboard', label: 'Painel da Sala', icon: <Clock size={20} />, hub: 'pedagogical', roles: ['admin', 'coordinator', 'teacher', 'docente', 'secretary'] },
    { id: 'lifecycle-dashboard', label: 'Ciclo de Vida', icon: <History size={20} />, hub: 'pedagogical', roles: ['admin', 'coordinator'] },
  ];

  const userRole = user?.role?.toLowerCase() || '';
  const normalizedRole = userRole === 'docente' ? 'teacher' : userRole;

  const canAccessSecurityHub = ['admin', 'director'].includes(normalizedRole) || ['admin', 'director'].includes(userRole);
  const canAccessGestaoHub = ['admin', 'director', 'secretary', 'hr', 'rh', 'coordinator'].includes(normalizedRole) || ['admin', 'director', 'secretary', 'hr', 'rh', 'coordinator'].includes(userRole);
  const canAccessEnsinoHub = ['admin', 'director', 'coordinator', 'teacher', 'docente'].includes(normalizedRole) || ['admin', 'director', 'coordinator', 'teacher', 'docente'].includes(userRole);

  const hasSecurityItems = canAccessSecurityHub && allMenuItems.some(item => 
    item.hub === 'security' && (!item.roles || item.roles.includes(normalizedRole) || item.roles.includes(userRole))
  );
  const hasAdminItems = canAccessGestaoHub && allMenuItems.some(item => 
    item.hub === 'admin' && (!item.roles || item.roles.includes(normalizedRole) || item.roles.includes(userRole))
  );
  const hasPedagogicalItems = canAccessEnsinoHub && allMenuItems.some(item => 
    item.hub === 'pedagogical' && (!item.roles || item.roles.includes(normalizedRole) || item.roles.includes(userRole))
  );

  useEffect(() => {
    const availableHubs: ('security' | 'admin' | 'pedagogical')[] = [];
    if (hasSecurityItems) availableHubs.push('security');
    if (hasAdminItems) availableHubs.push('admin');
    if (hasPedagogicalItems) availableHubs.push('pedagogical');
    
    if (availableHubs.length > 0 && !availableHubs.includes(currentHub)) {
      onHubChange(availableHubs[0]);
    }
  }, [userRole, hasSecurityItems, hasAdminItems, hasPedagogicalItems]);

  const menuItems = allMenuItems.filter(item => {
    const isAllowedRole = !item.roles || item.roles.includes(normalizedRole) || item.roles.includes(userRole);
    const isSameHub = (item as any).hub === currentHub;
    
    // Filtro de Módulo do Ecossistema
    let isModuleActive = true;
    if (ecosystem) {
      if (item.id === 'secretaria-portal') isModuleActive = ecosystem.activeModules?.secretary ?? true;
      if (item.id === 'user-management') isModuleActive = ecosystem.activeModules?.hr ?? true;
      if (item.id === 'attendance') isModuleActive = ecosystem.activeModules?.attendance ?? true;
    }

    return isAllowedRole && isSameHub && isModuleActive;
  });

  return (
    <>
      <style>{`
        .eagle-sidebar {
          background: rgba(15, 23, 42, 0.85);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-right: 1px solid rgba(59, 130, 246, 0.15);
          width: 280px;
          height: 100vh;
          display: flex;
          flex-direction: column;
          transition: width 250ms cubic-bezier(0.4, 0, 0.2, 1);
          color: var(--text-primary, #ffffff);
          position: relative;
          z-index: 50;
        }
        .eagle-sidebar.sidebar-collapsed {
          width: 80px;
        }
        .sidebar-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }
        .logo-full-container {
          display: flex;
          align-items: center;
          gap: 12px;
          text-shadow: 0 0 15px rgba(59, 130, 246, 0.3);
        }
        .logo-img {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: 1px solid rgba(255, 255, 255, 0.15);
          box-shadow: 0 0 15px rgba(239, 68, 68, 0.4), 0 0 25px rgba(59, 130, 246, 0.2);
          object-fit: cover;
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .logo-img:hover {
          transform: scale(1.1) rotate(4deg);
        }
        .logo-img-collapsed {
          width: 28px;
          height: 28px;
          margin: 0 auto;
        }
        .logo-text {
          display: flex;
          flex-direction: column;
        }
        .logo-main {
          font-weight: 800;
          font-size: 16px;
          letter-spacing: 1px;
          color: white;
        }
        .logo-suffix {
          font-size: 11px;
          color: var(--primary, #3b82f6);
          font-weight: 600;
        }
        .collapsed-logo-placeholder {
          font-weight: 800;
          font-size: 20px;
          color: #3b82f6;
          text-align: center;
          width: 100%;
        }
        .sidebar-collapse-btn {
          background: transparent;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          transition: all 200ms ease;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          border-radius: 6px;
        }
        .sidebar-collapse-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          color: white;
        }
        
        .unit-indicator-container {
          padding: 12px 20px 0;
        }
        .unit-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 8px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 4px;
          font-size: 10px;
          font-weight: 600;
          color: #94a3b8;
        }

        .hub-switcher {
          display: flex;
          padding: 12px 20px;
          gap: 8px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }
        .hub-btn {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          padding: 8px 4px;
          background: rgba(30, 41, 59, 0.4);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          color: #94a3b8;
          cursor: pointer;
          transition: all 200ms ease;
        }
        .hub-btn:hover {
          background: rgba(255, 255, 255, 0.05);
          color: white;
        }
        .hub-btn.active {
          background: rgba(59, 130, 246, 0.15);
          border-color: rgba(59, 130, 246, 0.3);
          color: #3b82f6;
          box-shadow: 0 0 10px rgba(59, 130, 246, 0.1);
        }
        .hub-label-mini {
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.5px;
        }

        .sidebar-nav {
          flex: 1;
          overflow-y: auto;
          padding: 16px 12px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .sidebar-nav::-webkit-scrollbar {
          width: 4px;
        }
        .sidebar-nav::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 12px;
          border-radius: 8px;
          background: transparent;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
          width: 100%;
          text-align: left;
          position: relative;
          overflow: hidden;
        }
        .nav-item:hover {
          background: rgba(255, 255, 255, 0.05);
          color: white;
        }
        .nav-item.active {
          background: rgba(59, 130, 246, 0.1);
          color: #3b82f6;
          text-shadow: 0 0 8px rgba(59, 130, 246, 0.4);
        }
        .nav-item.active::before {
          content: '';
          position: absolute;
          left: 0;
          top: 10%;
          height: 80%;
          width: 3px;
          background: #3b82f6;
          border-radius: 0 4px 4px 0;
          box-shadow: 0 0 10px #3b82f6;
        }
        .nav-icon {
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .nav-label {
          font-size: 13px;
          font-weight: 500;
          white-space: nowrap;
          flex: 1;
        }
        .active-indicator {
          opacity: 0.5;
        }

        .sidebar-footer {
          padding: 16px;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        
        .eagle-user-area {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px;
          border-radius: 8px;
          background: rgba(15, 23, 42, 0.5);
          border: 1px solid rgba(255, 255, 255, 0.02);
        }
        .eagle-avatar-wrapper {
          position: relative;
          display: flex;
        }
        .eagle-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: rgba(99, 102, 241, 0.2);
          border: 1px solid rgba(99, 102, 241, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #6366f1;
        }
        .eagle-status-dot {
          position: absolute;
          bottom: 0;
          right: 0;
          width: 10px;
          height: 10px;
          background: #10b981;
          border: 2px solid #0f172a;
          border-radius: 50%;
          box-shadow: 0 0 8px rgba(16, 185, 129, 0.6);
        }
        .eagle-user-details {
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .eagle-user-name {
          font-size: 13px;
          font-weight: 600;
          color: white;
          white-space: nowrap;
          text-overflow: ellipsis;
          overflow: hidden;
        }
        .eagle-user-role {
          font-size: 11px;
          color: #94a3b8;
          white-space: nowrap;
        }

        .logout-item {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 10px;
          border-radius: 8px;
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
          border: 1px solid rgba(239, 68, 68, 0.2);
          cursor: pointer;
          transition: all 200ms ease;
          width: 100%;
        }
        .logout-item:hover {
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
          box-shadow: 0 0 15px rgba(239, 68, 68, 0.2);
        }
        
        .sidebar-project-info {
          font-size: 10px;
          color: #64748b;
          text-align: center;
          margin-top: 8px;
        }
        .sovereign-tag {
          display: inline-block;
          margin-top: 4px;
          padding: 2px 6px;
          background: rgba(59, 130, 246, 0.1);
          color: #3b82f6;
          border-radius: 4px;
          font-size: 9px;
          font-weight: 700;
        }
      `}</style>
      <aside className={`eagle-sidebar ${isCollapsed ? 'sidebar-collapsed' : ''}`}>
        {showLogoffProtocol && (
          <LogoffProtocol 
            onConfirm={() => { setShowLogoffProtocol(false); onLogout(); }} 
            onCancel={() => setShowLogoffProtocol(false)} 
          />
        )}
        
        <div className="sidebar-header">
          <div className="sidebar-logo">
            {!isCollapsed ? (
              <div className="logo-full-container">
                <img src={branding.logo || logo} alt="Áquila Pro" className="logo-img" />
                <div className="logo-text">
                  <span className="logo-main">ÁQUILA</span>
                  <span className="logo-suffix">PRO</span>
                </div>
              </div>
            ) : (
              <img src={branding.logo || logo} alt="Áquila Pro" className="logo-img logo-img-collapsed" />
            )}
          </div>
          
          <button className="sidebar-collapse-btn" onClick={onToggleCollapse} title={isCollapsed ? "Expandir" : "Recolher"}>
            <ChevronRight size={18} className={isCollapsed ? '' : 'rotate-180'} />
          </button>
        </div>

        <div className="unit-indicator-container">
          {!isCollapsed && (
            <div className="unit-badge">
               <Globe size={10} />
               <span>UNIDADE MATRIZ</span>
            </div>
          )}
        </div>

        <div className="hub-switcher">
          {hasSecurityItems && (
            <button 
              className={`hub-btn ${currentHub === 'security' ? 'active' : ''}`} 
              onClick={() => onHubChange('security')}
              title="Hub de Segurança"
            >
              <ShieldCheck size={20} />
              {!isCollapsed && <span className="hub-label-mini">SEGURANÇA</span>}
            </button>
          )}
          {hasAdminItems && (
            <button 
              className={`hub-btn ${currentHub === 'admin' ? 'active' : ''}`} 
              onClick={() => onHubChange('admin')}
              title="Hub Administrativo"
            >
              <Activity size={20} />
              {!isCollapsed && <span className="hub-label-mini">GESTÃO</span>}
            </button>
          )}
          {hasPedagogicalItems && (
            <button 
              className={`hub-btn ${currentHub === 'pedagogical' ? 'active' : ''}`} 
              onClick={() => onHubChange('pedagogical')}
              title="Hub Pedagógico"
            >
              <BookOpen size={20} />
              {!isCollapsed && <span className="hub-label-mini">ENSINO</span>}
            </button>
          )}
        </div>

        <div className="sidebar-nav">
          {menuItems.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${currentPage === item.id ? 'active' : ''}`}
              onClick={() => onNavigate(item.id)}
              title={isCollapsed ? item.label : ''}
            >
              <span className="nav-icon">{item.icon}</span>
              {!isCollapsed && <span className="nav-label">{item.label}</span>}
              {!isCollapsed && currentPage === item.id && <ChevronRight size={14} className="active-indicator" />}
            </button>
          ))}
        </div>

        <div className="sidebar-footer">
          <div className="eagle-user-area">
            <div className="eagle-avatar-wrapper">
              <div className="eagle-avatar">
                <User size={18} />
              </div>
              <div className="eagle-status-dot"></div>
            </div>
            {!isCollapsed && (
              <div className="eagle-user-details">
                <span className="eagle-user-name">{user?.name || 'Administrador'}</span>
                <span className="eagle-user-role">{user?.role?.toUpperCase() || 'ROOT'}</span>
              </div>
            )}
          </div>

          <button 
            className="nav-item logout-item" 
            onClick={() => setShowLogoffProtocol(true)}
            title={isCollapsed ? "Sair do Sistema" : ""}
          >
            <span className="nav-icon"><LogOut size={20} /></span>
            {!isCollapsed && <span className="nav-label">ENCERRAR SESSÃO</span>}
          </button>
          
          {!isCollapsed && (
            <div className="sidebar-project-info">
              ÁQUILA PRO — v2.1.0-rc1

              <div className="sovereign-tag">Campus Digital</div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
