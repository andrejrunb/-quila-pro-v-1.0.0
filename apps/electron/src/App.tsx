import React, { useState, useEffect } from 'react';
import { Smartphone } from 'lucide-react';
import { Dashboard } from './ui/Dashboard';
import CameraManager from './ui/CameraManager';
import Settings from './ui/Settings';
import { Students } from './ui/pages/Students';
import { ReportsPage } from './ui/pages/ReportsPage';
import { AlertsPage } from './ui/pages/AlertsPage';
import { ClassroomManagement } from './ui/pages/ClassroomManagement';
import { StudentPhotoUpload } from './ui/pages/StudentPhotoUpload';
import { LGPDCompliance } from './ui/pages/LGPDCompliance';
import WhatsAppIntegration from './ui/pages/WhatsAppIntegration';
import HardwareCalculator from './ui/pages/HardwareCalculator';
import { CoordinationManagement } from './ui/pages/CoordinationManagement';
import { AcademicCalendar } from './ui/pages/AcademicCalendar';
import { Diary } from './ui/pages/Diary';
import { FinanceModule } from './ui/pages/FinanceModule';
import { BiometricEnrollment } from './ui/pages/BiometricEnrollment';
import { ReportingHub } from './ui/pages/ReportingHub';
import { ProtectedRoute } from './ui/components/ProtectedRoute';
import { PredictiveAbsenceDashboard } from './ui/pages/PredictiveAbsenceDashboard';
import { AuditLogViewer } from './ui/pages/AuditLogViewer';
import HardwareDiagnostics from './ui/pages/HardwareDiagnostics';
import { RankingBoard } from './ui/pages/RankingBoard';
import { GlobalSearch } from './ui/components/GlobalSearch';
import { LoginPage } from './ui/pages/LoginPage';
import { UserManagement } from './ui/pages/UserManagement';
import VisitorManagement from './ui/pages/VisitorManagement';
import { SetupWizard } from './ui/components/SetupWizard';
import MultiStreamGrid from './ui/components/MultiStreamGrid';
import HelpCenter from './ui/pages/HelpCenter';
import MobilePortal from './ui/pages/MobilePortal';
import AnalyticsDashboard from './ui/pages/AnalyticsDashboard';
import { InfrastructureDashboard } from './ui/pages/InfrastructureDashboard';
import { SupportPanel } from './ui/pages/SupportPanel';
import { PartnershipPortal } from './ui/pages/PartnershipPortal';
import { ConsentManagement } from './ui/pages/ConsentManagement';
import { MultiSiteManager } from './ui/pages/MultiSiteManager';
import { EventMode } from './ui/pages/EventMode';
import { SustainabilityDashboard } from './ui/pages/SustainabilityDashboard';
import { AnalyticsBI } from './ui/pages/AnalyticsBI';
import { SecurityMonitor } from './ui/pages/SecurityMonitor';
import { IoTManager } from './ui/pages/IoTManager';
import { UnifiedCommand } from './ui/pages/UnifiedCommand';
import TeacherDashboard from './ui/pages/TeacherDashboard';
import { IndoorMappingDashboard } from './ui/pages/IndoorMappingDashboard';
import { ClimateReportPanel } from './ui/components/ClimateReportPanel';
import Sidebar from './ui/components/Sidebar';
import TopBar from './ui/components/TopBar';
import LGPDConsentModal from './ui/components/LGPDConsentModal';
import { HelpModal } from './ui/components/HelpModal';
import { NPSModal } from './ui/components/NPSModal';
import { useKeyboardShortcuts } from './ui/hooks/useKeyboardShortcuts';
import './App.css';
import './ui/styles/accessibility.css';
import { GlobalPulseHUD } from './ui/components/GlobalPulseHUD';
import { QuantumBoot } from './ui/components/QuantumBoot';
import { SovereignExecutiveCockpit } from './ui/components/SovereignExecutiveCockpit';

// Lazy loading dos Portais
const AdminPortal = React.lazy(() => import('./ui/portals/AdminPortal'));
const TeacherPortal = React.lazy(() => import('./ui/portals/TeacherPortal'));
const SecurityPortal = React.lazy(() => import('./ui/portals/SecurityPortal'));
const HRPortal = React.lazy(() => import('./ui/portals/HRPortal'));
const CoordinationPortal = React.lazy(() => import('./ui/portals/CoordinationPortal'));
const ParentPortal = React.lazy(() => import('./ui/portals/ParentPortal'));
const StudentPortal = React.lazy(() => import('./ui/portals/StudentPortal'));
import { PortalLayout } from './ui/layouts/PortalLayout';

export type Page = 
  | 'dashboard' | 'attendance' | 'students' | 'alerts' | 'analytics' | 'reports' | 'multistream' 
  | 'settings' | 'user-management' | 'coordination' | 'calendar' | 'reports-hub' | 'ranking-board' 
  | 'photo-batch' | 'help' | 'infrastructure' | 'support' | 'partners' | 'consent' | 'multi-site' 
  | 'analytics-bi' | 'event-mode' | 'sustainability' | 'cameras' | 'rooms' | 'schedule' | 'executive-pulse'
  | 'photos' | 'lgpd' | 'whatsapp' | 'hardware' | 'predictive-absence' | 'audit-log' 
  | 'diagnostics' | 'mobile' | 'finance' | 'biometric-enrollment' | 'diary' | 'visitor-management' | 'security-monitor' | 'iot-manager' | 'unified-command' | 'teacher-dashboard' | 'indoor-mapping';

export const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchParams, setSearchParams] = useState<any>(null);
  const [showLGPD, setShowLGPD] = useState(false);
  const [lgpdTerm, setLgpdTerm] = useState('');
  const [showHelp, setShowHelp] = useState(false);
  const [showNPS, setShowNPS] = useState(false);

  // Step 164 — Atalhos de teclado globais
  useKeyboardShortcuts({
    onNavigate: (page) => setCurrentPage(page as Page),
    onSearch: () => setIsSearchOpen(true),
    onHelp: () => setShowHelp(h => !h),
    onEscape: () => {
      setShowHelp(false);
      setShowNPS(false);
      setIsSearchOpen(false);
    },
    onSync: () => (window as any).aquila?.invoke('force-sync').catch(() => {}),
    disabled: !isLoggedIn,
  });

  useEffect(() => {
    // Verifica se é a primeira execução (Step 74)
    const hasConfig = localStorage.getItem('aquila_setup_complete');
    if (!hasConfig) setShowSetup(true);
  }, []);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const user = await (window as any).aquila.invoke('get-current-user');
        if (user) {
          setCurrentUser(user);
          setIsLoggedIn(true);
          await checkLGPD(user.id);
        }
      } catch (err) {
        console.error('Session check failed:', err);
      } finally {
        setIsLoading(false);
      }
    };
    checkSession();
  }, []);

  const checkLGPD = async (userId: string) => {
    try {
      const result = await (window as any).aquila.invoke('lgpd:check-consent', userId);
      if (result.success && !result.data.consented) {
        const termResult = await (window as any).aquila.invoke('lgpd:get-term');
        setLgpdTerm(termResult.data.text);
        setShowLGPD(true);
      }
    } catch (err) {
      console.error('LGPD check failed:', err);
    }
  };

  const handleAcceptLGPD = async () => {
    try {
      await (window as any).aquila.invoke('lgpd:record-consent', { userId: currentUser.id });
      setShowLGPD(false);
    } catch (err) {
      console.error('Failed to record consent:', err);
    }
  };

  const handleLogin = async (user: any) => {
    setCurrentUser(user);
    setIsLoggedIn(true);
    await checkLGPD(user.id);
    setCurrentPage('dashboard');
  };

  const handleNavigate = (page: string) => {
    setCurrentPage(page as Page);
  };

  useEffect(() => {
    if ((window as any).aquila?.onNavigate) {
      (window as any).aquila.onNavigate((_event: any, page: string) => {
        setCurrentPage(page as Page);
      });
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLogout = async () => {
    if (window.confirm('Tem certeza que deseja sair do Áquila Pro?')) {
      try {
        await (window as any).aquila.invoke('logout');
        setIsLoggedIn(false);
        setCurrentUser(null);
      } catch (err) {
        console.error('Logout failed:', err);
      }
    }
  };
  const renderPage = () => {
    const onBack = () => setCurrentPage('dashboard');

    return (
      <React.Suspense fallback={<div className="dashboard-loading"><div className="spinner"></div></div>}>
        {(() => {
          // Platform Guard: Verifica se o perfil tem permissão para usar o "Programa" (Desktop)
          const isProgramAuthorized = ['admin', 'director', 'secretary', 'hr', 'coordinator', 'security', 'totem'].includes(currentUser?.role?.toLowerCase() || '');
          
          if (isLoggedIn && !isProgramAuthorized && currentUser?.role) {
            return (
              <PortalLayout portalName="Acesso Restrito" themeColor="#64748b">
                <div className="flex flex-col items-center justify-center p-12 text-center bg-slate-900/50 rounded-3xl border border-slate-800">
                  <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mb-6">
                    <Smartphone className="w-8 h-8 text-blue-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">Portal Disponível via Web & App</h2>
                  <p className="text-slate-400 max-w-md mx-auto mb-8">
                    Seu perfil de <strong>{currentUser.role}</strong> deve ser acessado através do Portal Web ou do Aplicativo Móvel (APK). 
                    A versão desktop é otimizada para fins administrativos e de monitoramento.
                  </p>
                  <button onClick={handleLogout} className="bg-slate-800 hover:bg-slate-700 px-8 py-3 rounded-xl font-bold transition-all">
                    Sair e Acessar via Web
                  </button>
                </div>
              </PortalLayout>
            );
          }

          // Determina qual Portal carregar baseado na página/perfil
          const isAdminPage = [
            'user-management', 'settings', 'finance', 'audit-log', 'lgpd', 'whatsapp', 
            'unified-command', 'coordination', 'calendar', 'reports-hub', 'multi-site'
          ].includes(currentPage);
          
          const isTeacherPage = [
            'teacher-dashboard', 'rooms', 'schedule', 'diary', 'student-portfolio', 
            'attendance', 'students', 'photos', 'ranking-board', 'biometric-enrollment'
          ].includes(currentPage);
          
          const isSecurityPage = [
            'security-monitor', 'multistream', 'iot-manager', 'diagnostics', 
            'infrastructure', 'hardware', 'predictive-absence', 'visitor-management', 'cameras', 'ruview'
          ].includes(currentPage);

          const isHRPage = ['hr-portal', 'staff-management', 'payroll'].includes(currentPage);
          const isCoordinationPage = ['coordination', 'academic-calendar', 'curriculum'].includes(currentPage);
          const isParentPage = ['parent-portal', 'student-tracking', 'family-comms'].includes(currentPage);
          const isStudentPage = ['student-portal', 'my-grades', 'ranking-board'].includes(currentPage);

          const isSustainabilityPage = ['sustainability', 'analytics-bi', 'event-mode', 'consent'].includes(currentPage);

          if (isAdminPage) return <AdminPortal currentPage={currentPage} onNavigate={handleNavigate} userRole={currentUser?.role || ''} />;
          if (isTeacherPage) return <TeacherPortal currentPage={currentPage} onNavigate={handleNavigate} studentParams={searchParams} />;
          if (isSecurityPage) return <SecurityPortal currentPage={currentPage} onNavigate={handleNavigate} />;
          if (isHRPage) return <HRPortal currentPage={currentPage} onNavigate={handleNavigate} />;
          if (isCoordinationPage) return <CoordinationPortal currentPage={currentPage} onNavigate={handleNavigate} />;
          if (isParentPage) return <ParentPortal currentPage={currentPage} onNavigate={handleNavigate} />;
          if (isStudentPage) return <StudentPortal currentPage={currentPage} onNavigate={handleNavigate} />;
          
          // Adicionar portal de sustentabilidade/BI futuro
          if (isSustainabilityPage) return (
            <PortalLayout portalName="Ecosistema & Inteligência BI" themeColor="#8b5cf6">
               <Dashboard onNavigate={handleNavigate} onLogout={handleLogout} /> 
            </PortalLayout>
          );

          // Fallback para o Dashboard unificado ou páginas soltas
          switch (currentPage) {
            case 'dashboard':
              return <Dashboard onNavigate={handleNavigate} onLogout={handleLogout} />;
            case 'students':
              return <Students onNavigate={handleNavigate} onSearchParams={setSearchParams} />;
            case 'reports':
              return <ReportsPage onBack={onBack} />;
            case 'alerts':
              return <AlertsPage onBack={onBack} />;
            case 'indoor-mapping':
              return <IndoorMappingDashboard />;
            case 'help':
              return <HelpCenter />;
            case 'mobile':
              return <MobilePortal />;
              case 'executive-pulse':
              return <SovereignExecutiveCockpit />;
            default:
              return <Dashboard onNavigate={handleNavigate} onLogout={handleLogout} />;
          }
        })()}
      </React.Suspense>
    );
  };

  if (isLoading) {
    return <QuantumBoot />;
  }

  if (!isLoggedIn) {
    return <LoginPage onLogin={handleLogin} />;
  }

  if (showSetup) {
    return (
      <SetupWizard onComplete={() => {
        localStorage.setItem('aquila_setup_complete', 'true');
        setShowSetup(false);
      }} />
    );
  }

  return (
    <div className="app-layout">
      <Sidebar 
        currentPage={currentPage} 
        onNavigate={handleNavigate} 
        user={currentUser}
        onLogout={handleLogout} 
      />
      
      <main className="main-content">
        <TopBar 
          user={currentUser} 
          onNavigate={handleNavigate} 
        />
        
        <div className="page-content animate-fade-in">
          {renderPage()}
        </div>

        {isLoggedIn && <GlobalPulseHUD />}

        {isSearchOpen && (
          <GlobalSearch
            onClose={() => setIsSearchOpen(false)}
            onSelect={(page, params) => {
              setCurrentPage(page as Page);
              setSearchParams(params);
              setIsSearchOpen(false);
            }}
          />
        )}

        <LGPDConsentModal 
          isOpen={showLGPD}
          termText={lgpdTerm}
          onAccept={handleAcceptLGPD}
          onDecline={handleLogout}
        />

        {/* Step 164 — Help Modal de atalhos de teclado */}
        {showHelp && (
          <HelpModal onClose={() => setShowHelp(false)} />
        )}

        {/* Step 170 — NPS Survey Modal */}
        {showNPS && (
          <NPSModal
            onClose={() => setShowNPS(false)}
            onSubmit={(score, feedback) => {
              (window as any).aquila?.invoke('submit-nps', { score, feedback }).catch(() => {});
              setShowNPS(false);
            }}
          />
        )}
      </main>
    </div>
  );
};

export default App;
