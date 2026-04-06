import React from 'react';
import { PortalLayout } from '../layouts/PortalLayout';
import { Dashboard } from '../Dashboard';
import { UserManagement } from '../pages/UserManagement';
import Settings from '../Settings';
import { FinanceModule } from '../pages/FinanceModule';
import { AuditLogViewer } from '../pages/AuditLogViewer';
import { UnifiedCommand } from '../pages/UnifiedCommand';
import { CoordinationManagement } from '../pages/CoordinationManagement';
import { AcademicCalendar } from '../pages/AcademicCalendar';
import { ReportingHub } from '../pages/ReportingHub';
import { MultiSiteManager } from '../pages/MultiSiteManager';
import { GovernanceDashboard } from '../pages/GovernanceDashboard';
import { EduPodcast } from '../pages/EduPodcast';

interface AdminPortalProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  userRole: string; // Adicionado para segmentação interna
}

export const AdminPortal: React.FC<AdminPortalProps> = ({ currentPage, onNavigate, userRole }) => {
  const renderAdminPage = () => {
    const onBack = () => onNavigate('dashboard');

    switch (currentPage) {
      case 'dashboard':
        return <Dashboard onNavigate={onNavigate} onLogout={() => {}} userRole={userRole} />;
      case 'user-management':
        return <UserManagement onBack={onBack} />;
      case 'settings':
        return <Settings onBack={onBack} />;
      case 'finance':
        return <FinanceModule onBack={onBack} />;
      case 'audit-log':
        // Mantemos AuditLogViewer para compatibilidade ou migramos tudo para Governance
        return <AuditLogViewer onBack={onBack} />;
      case 'governance':
        return <GovernanceDashboard />;
      case 'unified-command':
        return <UnifiedCommand userRole={userRole} />;
      case 'coordination':
        return <CoordinationManagement onBack={onBack} />;
      case 'calendar':
        return <AcademicCalendar onBack={onBack} />;
      case 'reports-hub':
        return <ReportingHub onBack={onBack} userRole="director" userCoordinationId={null} />;
      case 'multi-site':
        return <MultiSiteManager onBack={onBack} />;
      case 'edu-podcast':
        return <EduPodcast />;
      default:
        return <Dashboard onNavigate={onNavigate} onLogout={() => {}} />;
    }
  };

  const isAdmin = ['admin', 'director'].includes(userRole);
  
  return (
    <PortalLayout 
      portalName={isAdmin ? "Direção & Inteligência Estratégica" : "Secretaria & Gestão Escolar"} 
      themeColor={isAdmin ? "#1e40af" : "#3b82f6"}
    >
      {renderAdminPage()}
    </PortalLayout>
  );
};

export default AdminPortal;
