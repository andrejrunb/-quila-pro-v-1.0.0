import React, { useEffect, useState } from 'react';
import { 
  LayoutDashboard, BarChart3, Bell, Users, BookOpen,
  Camera, Map, FileText, Settings, ShieldCheck, 
  Search, ChevronRight, LogOut, CreditCard, Globe, UserPlus, Box, Radio
} from 'lucide-react';
import './Sidebar.css';
import logo from '../../assets/logo.png';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  user: any;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentPage, onNavigate, user, onLogout }) => {
  const [branding, setBranding] = useState<{ logo?: string; primaryColor?: string }>({});

  useEffect(() => {
    const loadBranding = async () => {
      try {
        const settings = await (window as any).electron.ipcRenderer.invoke('get-school-settings');
        if (settings) {
          setBranding({
            logo: settings.schoolLogo,
            primaryColor: settings.primaryColor
          });
          
          // Aplicar cor primária globalmente se existir
          if (settings.primaryColor) {
            document.documentElement.style.setProperty('--brand-primary', settings.primaryColor);
          }
        }
      } catch (err) {
        console.error('Erro ao carregar branding:', err);
      }
    };
    loadBranding();
  }, []);

  const allMenuItems = [
    { id: 'dashboard', label: 'Painel de Controle', icon: <LayoutDashboard size={20} />, roles: ['admin', 'director', 'secretary', 'teacher', 'coordinator', 'hr'] },
    { id: 'unified-command', label: 'Centro de Comando', icon: <Globe size={20} />, roles: ['admin', 'director'] },
    { id: 'analytics', label: 'Análise e Métricas', icon: <BarChart3 size={20} />, roles: ['admin', 'director', 'coordinator'] },
    { id: 'hr-portal', label: 'Portal de RH', icon: <Users size={20} />, roles: ['admin', 'hr', 'director'] },
    { id: 'coordination', label: 'Gestão de Coordenação', icon: <Box size={20} />, roles: ['admin', 'coordinator', 'director'] },
    { id: 'teacher-dashboard', label: 'Portal do Professor', icon: <LayoutDashboard size={20} />, roles: ['admin', 'teacher'] },
    { id: 'parent-portal', label: 'Portal dos Pais', icon: <Users size={20} />, roles: ['admin', 'parent'] },
    { id: 'student-portal', label: 'Portal do Aluno', icon: <Users size={20} />, roles: ['admin', 'student'] },
    { id: 'finance', label: 'Gestão Financeira', icon: <CreditCard size={20} />, roles: ['admin', 'director', 'secretary', 'parent'] },
    { id: 'security-monitor', label: 'Monitoramento de Câmeras', icon: <Camera size={20} />, roles: ['admin', 'security', 'director', 'coordinator'] },
    { id: 'cameras', label: 'Configurar Câmeras', icon: <Settings size={20} />, roles: ['admin', 'director', 'coordinator'] },
    { id: 'ruview', label: 'Mapeamento RuView', icon: <Radio size={20} />, roles: ['admin', 'director', 'coordinator'] },
    { id: 'settings', label: 'Configurações do Sistema', icon: <Settings size={20} />, roles: ['admin'] },
  ];

  const menuItems = allMenuItems.filter(item => {
    const isAllowedRole = !item.roles || item.roles.includes(user?.role?.toLowerCase() || '');
    // Somente perfis autorizados para o 'Programa' devem ver os itens na versão Electron
    const isProgramAuthorized = ['admin', 'director', 'secretary', 'hr', 'coordinator', 'security', 'totem'].includes(user?.role?.toLowerCase() || '');
    return isAllowedRole && isProgramAuthorized;
  });


  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <img src={branding.logo || logo} alt="Áquila Pro" />
        </div>
      </div>

      <div className="sidebar-search">
        <div className="search-box">
          <Search size={16} />
          <input type="text" placeholder="Buscar por aluno..." />
        </div>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <button
            key={item.id}
            className={`nav-item ${currentPage === item.id ? 'active' : ''}`}
            onClick={() => onNavigate(item.id)}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
            {currentPage === item.id && <ChevronRight size={14} className="active-indicator" />}
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button className="nav-item logout-item" onClick={onLogout}>
          <span className="nav-icon"><LogOut size={20} /></span>
          <span className="nav-label">Sair</span>
        </button>
        <div className="sidebar-project-info">
          Projeto: Áquila Pro (v1.2.6)
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
