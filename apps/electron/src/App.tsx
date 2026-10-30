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
import { ScheduleUpload } from './ui/pages/ScheduleUpload';
import { AcademicCalendar } from './ui/pages/AcademicCalendar';
import { Diary } from './ui/pages/Diary';
import { FinanceModule } from './ui/pages/FinanceModule';
import { ReportingHub } from './ui/pages/ReportingHub';
import { ProtectedRoute } from './ui/components/ProtectedRoute';
import PredictiveDashboard from './ui/pages/PredictiveDashboard';
import { SeatingIntelligence } from './ui/pages/SeatingIntelligence';
import AuditLogViewer from './ui/pages/AuditLogViewer';
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
import ExecutiveCockpit from './ui/pages/ExecutiveCockpit';
import { SovereignExecutiveCockpit } from './ui/components/SovereignExecutiveCockpit';
import { PerformanceProvider } from './ui/hooks/PerformanceContext';
import { ToastProvider } from './ui/hooks/ToastContext';
import { ToastContainer } from './ui/components/ToastContainer';
import { HelpCenterFab } from './ui/components/HelpCenterFab';
import { ErrorBoundary } from './ui/components/ErrorBoundary';
import { StudentAILab } from './ui/pages/StudentAILab';
import { ClassroomDashboard } from './ui/pages/ClassroomDashboard';
import { CoordinationDashboard } from './ui/pages/CoordinationDashboard';
import { AttendanceAudit } from './ui/pages/AttendanceAudit';
import { NightSentry } from './ui/pages/NightSentry';
import { IdentityRecaptureSystem } from './ui/components/IdentityRecaptureSystem';
import { CrossAuditValidation } from './ui/components/CrossAuditValidation';
import { HelpHubSOC } from './ui/components/HelpHubSOC';
import PedagogicalLibrary from './ui/components/PedagogicalLibrary';
import TwinNavigator from './ui/pages/TwinNavigator';
// Lazy loading dos Portais
const AdminPortal = React.lazy(() => import('./ui/portals/AdminPortal'));
const TeacherPortal = React.lazy(() => import('./ui/portals/TeacherPortal'));
const CoordinationPortal = React.lazy(() => import('./ui/portals/CoordinationPortal'));
const SecretariaPortal = React.lazy(() => import('./ui/portals/SecretariaPortal'));
const ParentPortal = React.lazy(() => import('./ui/portals/ParentPortal'));
const StudentPortal = React.lazy(() => import('./ui/portals/StudentPortal'));
const StudentCosmeticsChamber = React.lazy(() => import('./ui/components/StudentCosmeticsChamber').then(m => ({ default: m.StudentCosmeticsChamber })));
const YouTubePedagogicalFinder = React.lazy(() => import('./ui/components/YouTubePedagogicalFinder').then(m => ({ default: m.YouTubePedagogicalFinder })));
import { PortalLayout } from './ui/layouts/PortalLayout';

import { SocialNexus } from './ui/pages/SocialNexus';
import CollectiveBrain from './ui/pages/CollectiveBrain';
import { EcosystemManager } from './ui/pages/EcosystemManager';
import IdentityGovernance from './ui/pages/IdentityGovernance';
import EcoDashboard from './ui/pages/EcoDashboard';
import DigitalForensics from './ui/pages/DigitalForensics';
import CollectiveCouncil from './ui/pages/CollectiveCouncil';
import GlobalRadar from './ui/pages/GlobalRadar';
import InstitutionalPlaybook from './ui/pages/InstitutionalPlaybook';
import SwarmIntelligence from './ui/pages/SwarmIntelligence';
import ShieldProDashboard from './ui/pages/ShieldProDashboard';
import SovereignWorkspace from './ui/pages/SovereignWorkspace';
import SmartCampusDashboard from './ui/pages/SmartCampusDashboard';
import VaultManagement from './ui/pages/VaultManagement';
import NeuroCampusDashboard from './ui/pages/NeuroCampusDashboard';
import SovereignAppStore from './ui/pages/SovereignAppStore';
import PredictiveCampusDashboard from './ui/pages/PredictiveCampusDashboard';
import GlobalNexusDashboard from './ui/pages/GlobalNexusDashboard';
import SovereignNexus from './ui/pages/SovereignNexus';
import { PedagogicalIntelligenceHub } from './ui/pages/PedagogicalIntelligenceHub';
import StudentProfile from './ui/pages/StudentProfile';
import OmniscientCockpit from './ui/pages/OmniscientCockpit';
import SensoryConfigDashboard from './ui/pages/SensoryConfigDashboard';
import InfrastructureArchitectDashboard from './ui/pages/InfrastructureArchitectDashboard';
import SmartSecretariatDashboard from './ui/pages/SmartSecretariatDashboard';
import { CoordinationOverview } from './ui/pages/CoordinationOverview';
import EmpathicCockpit from './ui/pages/EmpathicCockpit';
import DreamspaceCockpit from './ui/pages/DreamspaceCockpit';
import UnifiedConsciousnessUI from './ui/pages/UnifiedConsciousnessUI';
import WellnessDashboard from './ui/pages/WellnessDashboard';
import AdaptiveClassroomUI from './ui/pages/AdaptiveClassroomUI';
import CommunityNexusPortal from './ui/pages/CommunityNexusPortal';
import InstitutionalHeritageUI from './ui/pages/InstitutionalHeritageUI';
import InstitutionalImmortalityUI from './ui/pages/InstitutionalImmortalityUI';
import NeuralLibraryUI from './ui/pages/NeuralLibraryUI';
import SerendipityCockpit from './ui/pages/SerendipityCockpit';
import SovereignConscienceUI from './ui/pages/SovereignConscienceUI';
import OuterNexusCockpit from './ui/pages/OuterNexusCockpit';
import SovereignLibrarianUI from './ui/pages/SovereignLibrarianUI';
import ZenithCockpitUI from './ui/pages/ZenithCockpitUI';
import CameraDeploymentUI from './ui/pages/CameraDeploymentUI';
import InfrastructureDashboardUI from './ui/pages/InfrastructureDashboardUI';
import WikiViewerUI from './ui/pages/WikiViewerUI';
import ExecutiveFinanceBI from './ui/pages/ExecutiveFinanceBI';
import { ScientificAttendance } from './ui/pages/ScientificAttendance';
import MessengerPortal from './ui/pages/MessengerPortal';
import LoadTesting from './ui/pages/LoadTesting';
import LifecycleDashboard from './ui/pages/LifecycleDashboard';
import NetworkTrafficDashboard from './ui/pages/NetworkTrafficDashboard';
import MobileParentApp from './ui/pages/MobileParentApp';





















import LearningCompanionUI from './ui/components/LearningCompanionUI';
import HandoffManagerUI from './ui/components/HandoffManagerUI';
import PresenceGlowUI from './ui/components/PresenceGlowUI';














export type Page = 
  | 'dashboard' | 'attendance' | 'students' | 'alerts' | 'analytics' | 'reports' | 'multistream' 
  | 'settings' | 'user-management' | 'coordination' | 'calendar' | 'reports-hub' | 'ranking-board' 
  | 'photo-batch' | 'help' | 'infrastructure' | 'support' | 'partners' | 'consent' | 'multi-site' 
  | 'analytics-bi' | 'event-mode' | 'sustainability' | 'cameras' | 'rooms' | 'schedule' | 'executive-pulse'
  | 'executive-cockpit-portal' | 'parent-portal' | 'student-portal'
  | 'diagnostics' | 'mobile' | 'finance' | 'biometric-enrollment' | 'diary' | 'gradebook' | 'visitor-management' | 'security-monitor' | 'iot-manager' | 'unified-command' | 'teacher-dashboard' | 'indoor-mapping' | 'ai-lab' | 'coordination-dashboard' | 'coordination-overview' | 'attendance-audit' | 'scientific-attendance' | 'predictive-dashboard' | 'seating-intelligence' | 'secretaria-portal' | 'hr-portal' | 'global-trends' | 'nexus-mesh' | 'night-sentry' | 'identity-recapture' | 'cross-audit' | 'help-hub' | 'sovereign-library' | 'social-nexus' | 'collective-brain' | 'ecosystem' | 'identity-governance' | 'eco-dashboard' | 'forensics' | 'council' | 'global-radar' | 'twin-navigator' | 'playbook' | 'swarm-intelligence' | 'shield-pro' | 'sovereign-workspace' | 'smart-campus' | 'vault-management' | 'neuro-campus' | 'app-store' | 'predictive-5y' | 'nexus-mesh-global' | 'zenith-cockpit' | 'sensory-mesh' | 'infra-architect' | 'empathic-cockpit' | 'dreamspace-cockpit' | 'omnipresence-hub' | 'wellness-portal' | 'adaptive-classroom' | 'nexus-community' | 'institutional-heritage' | 'institutional-immortality' | 'neural-library' | 'institutional-serendipity' | 'sovereign-conscience' | 'outer-nexus' | 'zenith-final' | 'camera-deployment' | 'infrastructure-pro' | 'institutional-wiki' | 'executive-finance-bi' | 'load-testing' | 'lifecycle-dashboard' | 'network-traffic' | 'mobile-parent-app' | 'classroom-dashboard' | 'ai-studio' | 'activity-factory';



























export type HubMode = 'security' | 'admin' | 'pedagogical';

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
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [currentHub, setCurrentHub] = useState<HubMode>('security');
  const [isLGPDPending, setIsLGPDPending] = useState(false);

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
    const orchestrateBoot = async () => {
      console.log('[BOOT] Orchestrating Áquila Pro Boot sequence...');
      
      try {
        // 1. Setup Bypass Check (Priority for E2E)
        const setupComplete = localStorage.getItem('aquila_setup_complete') === 'true';
        if (setupComplete) {
          console.log('[BOOT] Setup bypass detected via localStorage.');
          setShowSetup(false);
        } else {
          try {
            const users = await (window as any).aquila.invoke('get-users');
            const hasAdmin = Array.isArray(users) && users.some((u: any) => u.role === 'admin' || u.role === 'director');
            if (hasAdmin) {
              console.log('[BOOT] Admin user found in database.');
              setShowSetup(false);
            } else {
              console.warn('[BOOT] No admin found, triggering SetupWizard.');
              setShowSetup(true);
            }
          } catch (err) {
            console.error('[BOOT] Failed to check users in DB:', err);
            setShowSetup(true);
          }
        }

        // 2. Session Recovery
        try {
          const user = await (window as any).aquila.invoke('get-current-user');
          if (user) {
            console.log(`[BOOT] Session recovered: ${user.username}`);
            setCurrentUser(user);
            setIsLoggedIn(true);
            // checkLGPD is now handled by a centralized useEffect
          } else {
            console.log('[BOOT] No active session found.');
            setIsLoggedIn(false);
          }
        } catch (err) {
          console.error('[BOOT] Session recovery error:', err);
          setIsLoggedIn(false);
        }

        // 3. Hardware / System Status (Non-blocking)
        (window as any).aquila?.invoke('system:get-info')
          .then((info: any) => console.log('[BOOT] System Info Sync:', info))
          .catch((e: any) => console.warn('[BOOT] Hardware check failed:', e));

      } catch (globalErr) {
        console.error('[BOOT] Fatal boot error:', globalErr);
      } finally {
        setIsLoading(false);
        console.log('[BOOT] Boot orchestration completed.');
      }
    };

    orchestrateBoot();
  }, []);

  const checkLGPD = async (userId: string) => {
    if (isLGPDPending) return;
    setIsLGPDPending(true);
    
    try {
      console.log('[E2E-DEBUG] checkLGPD starting for:', userId);
      const result = await (window as any).aquila.invoke('lgpd:check-consent', userId);
      if (result.success && !result.data.consented) {
        console.log('[E2E-DEBUG] checkLGPD: Consent required');
        const termResult = await (window as any).aquila.invoke('lgpd:get-term');
        setLgpdTerm(termResult.data.text);
        setShowLGPD(true);
      } else {
        console.log('[E2E-DEBUG] checkLGPD: Consent already present');
      }
    } catch (err) {
      console.error('LGPD check failed:', err);
    } finally {
      setIsLGPDPending(false);
    }
  };

  const handleAcceptLGPD = async () => {
    try {
      if (currentUser) {
        await (window as any).aquila.invoke('lgpd:record-consent', { userId: currentUser.id });
      }
      setShowLGPD(false);
    } catch (err) {
      console.error('[E2E-DEBUG] Failed to record LGPD consent:', err);
      // Fallback: unblock the UI regardless of persistence result
      setShowLGPD(false);
    }
  };

  const handleLogin = async (user: any) => {
    console.log('[E2E-DEBUG] Entering handleLogin for user:', user.username);
    setCurrentUser(user);
    setIsLoggedIn(true);
    console.log('[E2E-DEBUG] isLoggedIn set to true');
    const role = user.role?.toLowerCase();
    if (role === 'secretary' || role === 'hr' || role === 'rh') setCurrentPage('secretaria-portal');
    else if (role === 'docente' || role === 'teacher') setCurrentPage('seating-intelligence');
    else if (role === 'coordinator') setCurrentPage('coordination');
    else if (role === 'parent' || role === 'responsavel') setCurrentPage('parent-portal');
    else if (role === 'student' || role === 'aluno') setCurrentPage('student-portal');
    else setCurrentPage('executive-cockpit-portal');
    console.log('[E2E-DEBUG] currentPage set to:', role);
  };

  // Centralized LGPD trigger
  useEffect(() => {
    if (isLoggedIn && currentUser?.id) {
      checkLGPD(currentUser.id);
    }
  }, [isLoggedIn, currentUser?.id]);

  // Centralized Role Redirect
  useEffect(() => {
    if (isLoggedIn && currentUser) {
      if (currentPage === 'dashboard') {
        const role = currentUser.role?.toLowerCase();
        if (role === 'secretary' || role === 'hr' || role === 'rh') setCurrentPage('secretaria-portal');
        else if (role === 'docente' || role === 'teacher') setCurrentPage('seating-intelligence');
        else if (role === 'coordinator') setCurrentPage('coordination');
        else if (role === 'parent' || role === 'responsavel') setCurrentPage('parent-portal');
        else if (role === 'student' || role === 'aluno') setCurrentPage('student-portal');
      }
    }
  }, [isLoggedIn, currentUser, currentPage]);

  const handleNavigate = (page: string, params: any = null) => {
    if (params) setSearchParams(params);
    setCurrentPage(page as Page);
  };

  useEffect(() => {
    if ((window as any).aquila?.onNavigate) {
      (window as any).aquila.onNavigate((_event: any, page: string) => {
        console.log(`[NAVIGATE-IPC] Message received for page: ${page}`);
        setCurrentPage(page as Page);
      });
    }

    const handleCustomNavigate = (e: Event) => {
      const targetPage = (e as CustomEvent<string>).detail;
      if (targetPage) {
        setCurrentPage(targetPage as Page);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
      }
    };
    window.addEventListener('aquila:navigate', handleCustomNavigate);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('aquila:navigate', handleCustomNavigate);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await (window as any).aquila.invoke('logout');
    } catch (err) {
      console.error('Logout failed:', err);
    } finally {
      setIsLoggedIn(false);
      setCurrentUser(null);
    }
  };
  const renderPage = () => {
    const onBack = () => setCurrentPage('dashboard');
    console.log('[E2E-DEBUG] rendingPage | currentPage:', currentPage, '| isLoggedIn:', isLoggedIn);

    return (
      <React.Suspense fallback={<div className="dashboard-loading"><div className="spinner"></div></div>}>
        {(() => {
          // Platform Guard: Permite todos os 5 portais soberanos no Desktop (Admin, Direção, Coord, Prof, Pais, Alunos)
          const isProgramAuthorized = [
            'admin', 'director', 'secretary', 'hr', 'rh', 'coordinator', 'totem',
            'docente', 'teacher', 'parent', 'responsavel', 'student', 'aluno'
          ].includes(currentUser?.role?.toLowerCase() || '');
          
          if (isLoggedIn && !isProgramAuthorized && currentUser?.role && currentPage !== 'help' && currentPage !== 'support') {
            return (
              <PortalLayout portalName="Acesso Restrito" themeColor="#64748b" onNavigate={handleNavigate}>
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

          // Determina qual dos 5 Portais Soberanos carregar baseado na página/perfil
          const isAdminPage = [
            'executive-cockpit-portal', 'user-management', 'settings', 'finance', 'audit-log', 'lgpd', 'whatsapp', 
            'unified-command', 'calendar', 'reports-hub', 'multi-site', 
            'nexus-mesh', 'zenith-cockpit', 'zenith-final', 'collective-brain', 
            'predictive-dashboard', 'help', 'mastery-chamber', 'knowledge-canvas', 'albus-canvas',
            // Security pages relocated to AdminPortal:
            'security-monitor', 'multistream', 'iot-manager', 'diagnostics', 
            'infrastructure', 'hardware', 'predictive-absence', 'visitor-management', 
            'cameras', 'ruview', 'red-audit', 'twin-navigator', 'night-sentry', 
            'load-testing', 'network-traffic', 'growth-agents', 'school-growth-agents', 'students', 'pricing', 'social-nexus', 'executive-pulse', 'seating-intelligence'
          ].includes(currentPage);
          
          const isTeacherPage = [
            'teacher-dashboard', 'rooms', 'schedule', 'diary', 'gradebook', 'student-portfolio', 
            'attendance', 'students', 'photos', 'ranking-board', 'seating-intelligence',
            'tasks', 'whiteboard', 'daily-report', 'mastery-chamber', 'ai-studio', 'activity-factory',
            'slide-studio', 'arena', 'pvp-arena', 'essay-lab', 'redacao', 'skill-tree', 'bncc-skills', 'omr-scanner', 'bncc-heatmap', 'knowledge-canvas', 'albus-canvas', 'exam-foundry', 'banco-provas', 'youtube-radar', 'video-finder', 'omr'
          ].includes(currentPage);
          
          const isCoordinationPage = ['coordination', 'academic-calendar', 'curriculum', 'coordination-dashboard', 'coordination-overview', 'bncc-heatmap', 'skills-heatmap', 'heatmap', 'timetable', 'urania-timetable', 'growth-agents', 'school-growth-agents', 'calendar', 'reports-hub', 'seating-intelligence', 'mastery-chamber', 'exam-foundry', 'banco-provas', 'omr', 'omr-scanner', 'students'].includes(currentPage);
          const isSecretaryPage = ['secretaria-portal', 'hr-portal', 'hr', 'schedule-upload'].includes(currentPage);
          const isParentPage = ['parent-portal'].includes(currentPage);
          const isStudentPage = ['student-portal', 'mastery-chamber', 'ai-lab', 'arena', 'pvp-arena', 'essay-lab', 'redacao', 'skill-tree', 'bncc-skills', 'knowledge-canvas', 'albus-canvas', 'cosmetics-chamber', 'battle-banner', 'skins-shop', 'phet-mastery', 'stem-lab', 'multimodal-studio', 'podcast-wordwall', 'native-phet', 'youtube-radar', 'video-finder', 'playlists-live', 'pedagogical-playlists', 'game-maker-play', 'h5p-perseus-lab', 'interactive-applets', 'perseus-lab', 'h5p-lab'].includes(currentPage);

          const isSustainabilityPage = ['sustainability', 'analytics-bi', 'event-mode', 'consent'].includes(currentPage);

          const userRole = (currentUser?.role || '').toLowerCase();
          const isStudentUser = userRole === 'student' || userRole === 'aluno';
          const isTeacherUser = userRole === 'teacher' || userRole === 'docente';
          const isCoordUser = userRole === 'coordinator' || userRole === 'coordenacao';
          const isSecUser = userRole === 'secretary' || userRole === 'secretaria' || userRole === 'hr' || userRole === 'rh';
          const isParentUser = userRole === 'parent' || userRole === 'responsavel';
          const isAdminUser = userRole === 'admin' || userRole === 'director' || !userRole;

          // 1. Resolução por Perfil Logado (evita que professor caia em tela de aluno em rotas compartilhadas)
          if (isParentUser || isParentPage) return <ParentPortal currentPage={currentPage} onNavigate={handleNavigate} studentId={currentUser?.studentId || currentUser?.id} />;
          if (isCoordUser && isCoordinationPage) return <CoordinationPortal currentPage={currentPage} onNavigate={handleNavigate} />;
          if (isTeacherUser && isTeacherPage) return <TeacherPortal currentPage={currentPage} onNavigate={handleNavigate} studentParams={searchParams} user={currentUser} />;
          if (isSecUser && isSecretaryPage) return <SecretariaPortal currentPage={currentPage} onNavigate={handleNavigate} user={currentUser} />;
          if (isStudentUser && isStudentPage) return <StudentPortal currentPage={currentPage} onNavigate={handleNavigate} studentId={currentUser?.id} />;

          // 2. Resolução Geral / Inter-Portais (Admin inspecionando ou atalhos transversais)
          if (isCoordinationPage && !isTeacherUser && !isStudentUser) return <CoordinationPortal currentPage={currentPage} onNavigate={handleNavigate} />;
          if (isTeacherPage && !isStudentUser) return <TeacherPortal currentPage={currentPage} onNavigate={handleNavigate} studentParams={searchParams} user={currentUser} />;
          if (isStudentPage) return <StudentPortal currentPage={currentPage} onNavigate={handleNavigate} studentId={currentUser?.id} />;
          if (isSecretaryPage) return <SecretariaPortal currentPage={currentPage} onNavigate={handleNavigate} user={currentUser} />;
          if (isAdminPage || isAdminUser) return <AdminPortal currentPage={currentPage} onNavigate={handleNavigate} userRole={currentUser?.role || ''} activeHub={currentHub} onLogout={handleLogout} />;
          
          // Adicionar portal de sustentabilidade/BI futuro
          if (isSustainabilityPage) return (
            <PortalLayout portalName="Ecosistema & Inteligência BI" themeColor="#8b5cf6" onNavigate={handleNavigate}>
               <Dashboard onNavigate={handleNavigate} onLogout={handleLogout} userRole={currentUser?.role || ''} activeHub={currentHub} /> 
            </PortalLayout>
          );

          // Fallback para o Dashboard unificado ou páginas soltas
          switch (currentPage) {
            case 'dashboard':
              return <Dashboard onNavigate={handleNavigate} onLogout={handleLogout} userRole={currentUser?.role || ''} user={currentUser} activeHub={currentHub} />;
            case 'executive-finance-bi':
              return <ExecutiveFinanceBI onBack={onBack} />;
            case 'students':
              return <Students onNavigate={handleNavigate} onSearchParams={setSearchParams} onBack={onBack} />;
            case 'schedule-upload':
              return <ScheduleUpload onBack={onBack} />;
            case 'support':
              return <SupportPanel onBack={onBack} />;
            case 'reports':
              return <ReportsPage onBack={onBack} />;
            case 'alerts':
              return <AlertsPage onBack={onBack} />;
            case 'indoor-mapping':
              return <IndoorMappingDashboard />;
            case 'help':
              return <HelpCenter onBack={onBack} />;
            case 'mobile':
              return <MobilePortal />;
            case 'executive':
              return <ExecutiveCockpit onBack={onBack} />;
            case 'ai-lab':
              return <StudentAILab studentId={currentUser?.id} onBack={onBack} />;
            case 'cosmetics-chamber':
            case 'battle-banner':
            case 'skins-shop':
              return <StudentCosmeticsChamber studentId={currentUser?.id} onBack={onBack} />;
            case 'youtube-radar':
            case 'video-finder':
              return <YouTubePedagogicalFinder onBack={onBack} />;
            case 'timetable':
            case 'urania-timetable':
              return <CoordinationPortal currentPage="timetable" onNavigate={handleNavigate} />;
            case 'growth-agents':
            case 'school-growth-agents':
              return <CoordinationPortal currentPage="growth-agents" onNavigate={handleNavigate} />;
            case 'executive-pulse':
              return <AdminPortal currentPage="executive-cockpit-portal" onNavigate={handleNavigate} userRole={currentUser?.role || ''} activeHub={currentHub} onLogout={handleLogout} />;
            case 'pricing':
              return <AdminPortal currentPage="pricing" onNavigate={handleNavigate} userRole={currentUser?.role || ''} activeHub={currentHub} onLogout={handleLogout} />;
            case 'coordination-dashboard':
              return <CoordinationDashboard />;
            case 'coordination-overview':
              return <CoordinationOverview />;
            case 'lifecycle-dashboard':
              return <LifecycleDashboard />;
            case 'predictive-dashboard':
              return <PredictiveDashboard onNavigate={(page: any) => setCurrentPage(page as Page)} />;
            case 'seating-intelligence':
              return <SeatingIntelligence onNavigate={(page: any) => setCurrentPage(page as Page)} onBack={() => handleNavigate('dashboard')} />;
            case 'classroom-dashboard':
              return <ClassroomDashboard user={currentUser} />;
            case 'night-sentry':
              return <NightSentry onBack={() => handleNavigate('dashboard')} />;
            case 'identity-recapture':
              return <IdentityRecaptureSystem />;
            case 'social-nexus':
              return <SocialNexus onBack={onBack} />;
            case 'sovereign-nexus':
              return <SovereignNexus />;
            case 'intelligence-hub':
              return <PedagogicalIntelligenceHub />;
            case 'student-profile':
              return <StudentProfile studentId={searchParams?.studentId || ''} onBack={onBack} />;
            case 'messenger':
              return <MessengerPortal userRole={currentUser?.role || 'user'} onBack={onBack} />;
            case 'camera-live-view':
            case 'cameras':
              return <CameraManager onBack={onBack} />;
            case 'collective-brain':
              return <CollectiveBrain />;
            case 'help-hub':
              return <HelpHubSOC />;
            case 'ecosystem':
              return <EcosystemManager />;
            case 'sovereign-library':
              return <SovereignLibrarianUI />;
            case 'identity-governance':
              return <IdentityGovernance />;
            case 'eco-dashboard':
              return <EcoDashboard />;
            case 'forensics':
              return <DigitalForensics />;
            case 'council':
              return <CollectiveCouncil />;
            case 'global-radar':
              return <GlobalRadar />;
            case 'twin-navigator':
              return <TwinNavigator />;
            case 'playbook':
              return <InstitutionalPlaybook />;
            case 'swarm-intelligence':
              return <SwarmIntelligence />;
            case 'shield-pro':
              return <ShieldProDashboard />;
            case 'sovereign-workspace':
              return <SovereignWorkspace />;
            case 'smart-campus':
              return <SmartCampusDashboard />;
            case 'vault-management':
              return <VaultManagement />;
            case 'neuro-campus':
              return <NeuroCampusDashboard />;
            case 'app-store':
              return <SovereignAppStore isAdmin={currentUser?.role === 'admin' || currentUser?.role === 'director' || currentUser?.role === 'executive' || currentUser?.role === 'diretoria'} />;
            case 'predictive-5y':
              return <PredictiveCampusDashboard />;
            case 'nexus-mesh-global':
              return <GlobalNexusDashboard />;
            case 'camera-deployment':
              return <CameraDeploymentUI />;
            case 'infrastructure-pro':
              return <InfrastructureDashboardUI />;
            case 'institutional-wiki':
              return <WikiViewerUI />;
            case 'load-testing':
              return <LoadTesting />;


            case 'zenith-final':

              return <ZenithCockpitUI />;
            case 'outer-nexus':

              return <OuterNexusCockpit />;
            case 'sovereign-conscience':

              return <SovereignConscienceUI />;
            case 'institutional-serendipity':

              return <SerendipityCockpit />;
            case 'neural-library':

              return <NeuralLibraryUI />;
            case 'institutional-immortality':

              return <InstitutionalImmortalityUI />;
            case 'institutional-heritage':

              return <InstitutionalHeritageUI />;
            case 'nexus-community':

              return <CommunityNexusPortal />;
            case 'adaptive-classroom':

              return <AdaptiveClassroomUI />;
            case 'wellness-portal':

              return <WellnessDashboard />;
            case 'omnipresence-hub':

              return <UnifiedConsciousnessUI />;
            case 'dreamspace-cockpit':

              return <DreamspaceCockpit />;
            case 'empathic-cockpit':

              return <EmpathicCockpit />;
            case 'zenith-cockpit':

              return <OmniscientCockpit />;
            case 'sensory-mesh':
              return <SensoryConfigDashboard />;
            case 'secretaria-portal':
              return <SmartSecretariatDashboard />;
            case 'infra-architect':

              return <InfrastructureArchitectDashboard />;












            case 'mobile-parent-app':
              return <MobileParentApp onBack={() => handleNavigate('parent-portal')} studentName={currentUser?.childName || 'Aluno'} />;

            default:
              return <Dashboard onNavigate={handleNavigate} onLogout={handleLogout} userRole={currentUser?.role || ''} user={currentUser} activeHub={currentHub} />;
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
        // [FIX-AUTH-001] Mantém localStorage como cache rápido mas não como fonte de verdade
        localStorage.setItem('aquila_setup_complete', 'true');
        setShowSetup(false);
      }} />
    );
  }

  return (
    <PerformanceProvider>
      <ToastProvider>
        <div className={`app-layout ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
          <PresenceGlowUI />
          <ToastContainer />

        <Sidebar 

          currentPage={currentPage} 
          onNavigate={handleNavigate} 
          user={currentUser}
          onLogout={handleLogout} 
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          currentHub={currentHub}
          onHubChange={setCurrentHub}
        />
      
      <main className="main-content">
        <TopBar 
          user={currentUser} 
          onNavigate={handleNavigate} 
          onSearch={() => setIsSearchOpen(true)}
        />
        
        <div className="page-content animate-fade-in">
          <ErrorBoundary onNavigateHome={() => setCurrentPage('dashboard')}>
            {renderPage()}
          </ErrorBoundary>
        </div>

        {/* Global HUD and Help FAB removed per user request */}

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
      </ToastProvider>
    </PerformanceProvider>
  );
};

export default App;
