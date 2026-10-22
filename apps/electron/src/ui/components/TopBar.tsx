import React from 'react';
import { Bell, Mail, Search, User, ChevronRight, Command } from 'lucide-react';

interface TopBarProps {
  user: any;
  onNavigate: (page: string) => void;
  onSearch?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ user, onNavigate, onSearch }) => {
  return (
    <>
      <style>{`
        .eagle-topbar {
          background: rgba(15, 23, 42, 0.7);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          height: 56px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 24px;
          position: sticky;
          top: 0;
          z-index: 40;
          color: white;
          transition: all 200ms ease-out;
        }
        .eagle-breadcrumb {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          font-weight: 500;
          color: var(--text-secondary, #94a3b8);
        }
        .eagle-breadcrumb-item {
          display: flex;
          align-items: center;
          gap: 8px;
          transition: color 200ms ease-out;
        }
        .eagle-breadcrumb-item:hover {
          color: var(--text-primary, #ffffff);
        }
        .eagle-breadcrumb-active {
          color: var(--primary, #3b82f6);
          text-shadow: 0 0 10px rgba(59, 130, 246, 0.3);
        }
        .eagle-search-container {
          position: relative;
          width: 320px;
          display: flex;
          align-items: center;
        }
        .eagle-search-input {
          width: 100%;
          background: rgba(30, 41, 59, 0.5);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 9999px;
          padding: 8px 16px 8px 40px;
          color: white;
          font-size: 14px;
          outline: none;
          transition: all 200ms ease-out;
        }
        .eagle-search-input:focus {
          border-color: rgba(59, 130, 246, 0.5);
          background: rgba(30, 41, 59, 0.8);
          box-shadow: 0 0 15px rgba(59, 130, 246, 0.15);
        }
        .eagle-search-icon {
          position: absolute;
          left: 14px;
          color: #94a3b8;
          pointer-events: none;
        }
        .eagle-search-shortcut {
          position: absolute;
          right: 12px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
          padding: 2px 6px;
          font-size: 10px;
          color: #94a3b8;
          display: flex;
          align-items: center;
          gap: 4px;
          pointer-events: none;
        }
        .eagle-topbar-right {
          display: flex;
          align-items: center;
          gap: 20px;
        }
        .eagle-action-btn {
          background: transparent;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          transition: all 200ms ease-out;
        }
        .eagle-action-btn:hover {
          color: white;
          background: rgba(255, 255, 255, 0.05);
        }
        .eagle-badge {
          position: absolute;
          top: 6px;
          right: 8px;
          width: 8px;
          height: 8px;
          background: #ef4444;
          border-radius: 50%;
          border: 2px solid #0f172a;
        }
        .eagle-user-dropdown {
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 9999px;
          transition: all 200ms ease-out;
        }
        .eagle-user-dropdown:hover {
          background: rgba(255, 255, 255, 0.05);
        }
        .eagle-user-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: rgba(59, 130, 246, 0.2);
          border: 1px solid rgba(59, 130, 246, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #3b82f6;
        }
        .eagle-user-info {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
        }
        .eagle-user-name {
          font-size: 13px;
          font-weight: 600;
          color: white;
        }
        .eagle-user-role {
          font-size: 11px;
          color: #94a3b8;
        }
      `}</style>
      <header className="eagle-topbar">
        <div className="eagle-breadcrumb">
          <span className="eagle-breadcrumb-item">Áquila Analytics <ChevronRight size={14} /></span>
          <span className="eagle-breadcrumb-item eagle-breadcrumb-active">Dashboard</span>
        </div>

        <div className="eagle-search-container" onClick={() => onSearch?.()}>
          <Search size={16} className="eagle-search-icon" />
          <input type="text" className="eagle-search-input" placeholder="Buscar no sistema..." readOnly />
          <div className="eagle-search-shortcut">
            <Command size={10} /> K
          </div>
        </div>

        <div className="eagle-topbar-right">
          <button className="eagle-action-btn" onClick={() => onNavigate('alerts')} title="Alertas">
            <Bell size={20} />
            <span className="eagle-badge" />
          </button>
          
          <div className="eagle-user-dropdown" onClick={() => onNavigate('settings')}>
            <div className="eagle-user-info">
              <span className="eagle-user-name">{user?.name || 'Administrador'}</span>
              <span className="eagle-user-role">{user?.role?.toUpperCase() || 'ROOT'}</span>
            </div>
            <div className="eagle-user-avatar">
              <User size={18} />
            </div>
          </div>
        </div>
      </header>
    </>
  );
};

export default TopBar;
