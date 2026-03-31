import React from 'react';
import { Bell, Mail, Search, User } from 'lucide-react';
import './TopBar.css';

interface TopBarProps {
  user: any;
  onNavigate: (page: string) => void;
}

export const TopBar: React.FC<TopBarProps> = ({ user, onNavigate }) => {
  return (
    <header className="topbar">
      <div className="topbar-left">
        <h1 className="topbar-title">Áquila Analytics</h1>
        <p className="topbar-subtitle">Sistema de Segurança e Engajamento Escolar</p>
      </div>

      <div className="topbar-right">
        <div className="topbar-actions">
          <button className="topbar-btn" onClick={() => onNavigate('alerts')} title="Alertas">
            <Bell size={20} />
            <span className="dot-badge" />
          </button>
          <button className="topbar-btn" title="Mensagens">
            <Mail size={20} />
          </button>
          <button className="topbar-btn" title="Busca Global">
            <Search size={20} />
          </button>
        </div>

        <div className="topbar-user" onClick={() => onNavigate('settings')}>
          <div className="user-info">
            <span className="user-name">{user?.name || 'Administrador'}</span>
            <span className="user-role">{user?.role?.toUpperCase() || 'ROOT'}</span>
          </div>
          <div className="user-avatar">
            <User size={20} />
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopBar;
