import React from 'react';
import { PortalLayout } from '../layouts/PortalLayout';
import { UserManagement } from '../pages/UserManagement';
import Settings from '../Settings';
import FinancialGlassUI from '../components/FinancialGlassUI';
import AuditLogViewer from '../pages/AuditLogViewer';
import { UnifiedCommand } from '../pages/UnifiedCommand';
import { CoordinationManagement } from '../pages/CoordinationManagement';
import { AcademicCalendar } from '../pages/AcademicCalendar';
import { ReportingHub } from '../pages/ReportingHub';
import { MultiSiteManager } from '../pages/MultiSiteManager';
import { GovernanceDashboard } from '../pages/GovernanceDashboard';
import GlobalNexusDashboard from '../pages/GlobalNexusDashboard';
import OmniscientCockpit from '../pages/OmniscientCockpit';
import ZenithCockpitUI from '../pages/ZenithCockpitUI';
import CollectiveBrain from '../pages/CollectiveBrain';
import PredictiveDashboard from '../pages/PredictiveDashboard';
import { StudentAILab } from '../pages/StudentAILab';
import HelpCenter from '../pages/HelpCenter';
import { PricingGlassUI } from '../pages/PricingGlassUI';
import { StudentMasteryChamber } from '../pages/StudentMasteryChamber';
import { SchoolGrowthAgentSuite } from '../components/SchoolGrowthAgentSuite';

// Relocated Security Pages
import { SecurityMonitor } from '../pages/SecurityMonitor';
import MultiStreamGrid from '../components/MultiStreamGrid';
import { IoTManager } from '../pages/IoTManager';
import HardwareDiagnostics from '../pages/HardwareDiagnostics';
import { InfrastructureDashboard } from '../pages/InfrastructureDashboard';
import HardwareCalculator from '../pages/HardwareCalculator';
import { PredictiveAbsenceDashboard } from '../pages/PredictiveAbsenceDashboard';
import VisitorManagement from '../pages/VisitorManagement';
import { CameraConfiguration } from '../pages/CameraConfiguration';
import { RuViewPage } from '../pages/RuViewPage';
import SecurityAuditDashboard from '../pages/SecurityAuditDashboard';
import TwinNavigator from '../pages/TwinNavigator';
import { NightSentry } from '../pages/NightSentry';
import { LoadTesting } from '../pages/LoadTesting';
import NetworkTrafficDashboard from '../pages/NetworkTrafficDashboard';

import {
  Users, BarChart3, DollarSign, Heart,
  FileText, Send, CreditCard, UserPlus,
  Clock, TrendingUp, Activity, Sparkles, LayoutGrid, Compass, GraduationCap, Shield
} from 'lucide-react';
import './AdminPortal.css';

interface AdminPortalProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  userRole: string;
  activeHub: 'security' | 'admin' | 'pedagogical';
  onLogout: () => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({ currentPage, onNavigate, userRole }) => {
  const attendanceWeek = [
    { day: 'SEG', val: 94 },
    { day: 'TER', val: 96 },
    { day: 'QUA', val: 95 },
    { day: 'QUI', val: 97 },
    { day: 'SEX', val: 93 },
    { day: 'SÁB', val: 88 },
  ];

  const portalMatrix = [
    { id: 'teacher-dashboard', tag: 'PROF', name: 'Portal Docente', desc: 'Mapa de Sala IA, Chamada & Diário', color: '#3B82F6', icon: <GraduationCap size={14} color="#60A5FA" /> },
    { id: 'coordination', tag: 'COORD', name: 'Portal Coordenação', desc: 'Grade Mestra, Retenção & Córtex', color: '#F59E0B', icon: <Compass size={14} color="#F59E0B" /> },
    { id: 'executive-cockpit-portal', tag: 'DIREÇÃO', name: 'Cockpit Direção', desc: 'BI Financeiro, Governança & SOC', color: '#00F0FF', icon: <Shield size={14} color="#00F0FF" /> },
    { id: 'parent-portal', tag: 'PAIS', name: 'Portal da Família', desc: 'Boletim, Portaria & Financeiro', color: '#0EA5E9', icon: <Users size={14} color="#38BDF8" /> },
    { id: 'student-portal', tag: 'ALUNOS', name: 'Portal do Aluno', desc: 'Jornada Épica, Quests & ENEM', color: '#8B5CF6', icon: <Sparkles size={14} color="#A78BFA" /> },
  ];

  const liveFeed = [
    { id: 1, title: 'João Pedro Silva — Matrícula Confirmada', sub: '3º Ano A • Biometria facial sincronizada', time: 'HÁ 04 MIN', photo: './avatars/face-5.jpg' },
    { id: 2, title: 'Sofia Costa — Presença Portaria Sul', sub: '2º Ano B • Reconhecimento Edge NPU (99.4%)', time: 'HÁ 12 MIN', photo: './avatars/face-6.jpg' },
    { id: 3, title: 'Mensalidade Quitada (PIX Soberano)', sub: 'Responsável por Miguel Santos • 1º Ano C', time: 'HÁ 28 MIN', photo: './avatars/face-7.jpg' },
    { id: 4, title: 'Câmara de Maestria — Recorde de XP', sub: 'Beatriz Lima concluiu trilha de Física ENEM', time: 'HÁ 45 MIN', photo: './avatars/face-8.jpg' },
    { id: 5, title: 'Mapa de Sala Otimizado por IA', sub: 'Turma 2º B • 4 grupos de estudo formados', time: 'HÁ 01 H', photo: './avatars/face-9.jpg' },
  ];

  const renderExecutiveDashboard = () => (
    <div className="ap-cockpit">
      {/* Top Executive Command Bar — Uniform 32px Buttons */}
      <div className="ap-command-bar">
        <div className="ap-cmd-left">
          <span className="ap-cmd-badge">SOVEREIGN EXECUTIVE COCKPIT</span>
          <h1 className="ap-cmd-title">Direção & Inteligência Estratégica Institucional</h1>
        </div>
        <div className="ap-cmd-actions">
          <button onClick={() => onNavigate('seating-intelligence')} className="ap-btn primary">
            <LayoutGrid size={14} />
            <span>Mapa de Salas IA</span>
          </button>
          <button onClick={() => onNavigate('growth-agents')} className="ap-btn primary">
            <Sparkles size={14} />
            <span>Agentes de Crescimento</span>
          </button>
          <button onClick={() => onNavigate('students')} className="ap-btn">
            <UserPlus size={14} />
            <span>Nova Matrícula</span>
          </button>
          <button onClick={() => onNavigate('finance')} className="ap-btn">
            <CreditCard size={14} />
            <span>Financeiro & BI</span>
          </button>
          <button onClick={() => onNavigate('reports-hub')} className="ap-btn">
            <FileText size={14} />
            <span>Relatórios</span>
          </button>
          <button onClick={() => onNavigate('social-nexus')} className="ap-btn">
            <Send size={14} />
            <span>Comunicado</span>
          </button>
          <button onClick={() => onNavigate('mastery-chamber')} className="ap-btn">
            <Sparkles size={14} />
            <span>Câmara ENEM</span>
          </button>
        </div>
      </div>

      {/* 4-Column Telemetry KPI Strip */}
      <section className="ap-kpi-grid">
        <div className="ap-kpi-pod">
          <div className="ap-kpi-meta">
            <span className="ap-kpi-label">TOTAL DE ALUNOS</span>
            <span className="ap-kpi-value">1,248</span>
            <span className="ap-kpi-delta" style={{ color: '#00F0FF' }}>+4.2% vs semestre ant.</span>
          </div>
          <div className="ap-kpi-icon" style={{ background: 'rgba(0, 240, 255, 0.12)', color: '#00F0FF' }}>
            <Users size={18} />
          </div>
        </div>

        <div className="ap-kpi-pod">
          <div className="ap-kpi-meta">
            <span className="ap-kpi-label">FREQUÊNCIA MÉDIA</span>
            <span className="ap-kpi-value" style={{ color: '#10B981' }}>96.4%</span>
            <span className="ap-kpi-delta" style={{ color: '#10B981' }}>Meta 94.0% superada</span>
          </div>
          <div className="ap-kpi-icon" style={{ background: 'rgba(16, 185, 129, 0.14)', color: '#10B981' }}>
            <BarChart3 size={18} />
          </div>
        </div>

        <div className="ap-kpi-pod">
          <div className="ap-kpi-meta">
            <span className="ap-kpi-label">RECEITA MENSAL</span>
            <span className="ap-kpi-value">R$ 450K</span>
            <span className="ap-kpi-delta" style={{ color: '#60A5FA' }}>98.2% adimplência</span>
          </div>
          <div className="ap-kpi-icon" style={{ background: 'rgba(59, 130, 246, 0.14)', color: '#60A5FA' }}>
            <DollarSign size={18} />
          </div>
        </div>

        <div className="ap-kpi-pod">
          <div className="ap-kpi-meta">
            <span className="ap-kpi-label">SATISFAÇÃO (NPS)</span>
            <span className="ap-kpi-value" style={{ color: '#00F0FF' }}>89 PTS</span>
            <span className="ap-kpi-delta" style={{ color: '#10B981' }}>Zona de Excelência</span>
          </div>
          <div className="ap-kpi-icon" style={{ background: 'rgba(6, 182, 212, 0.14)', color: '#06B6D4' }}>
            <Heart size={18} />
          </div>
        </div>
      </section>

      {/* Main 2-Column Bento Workspace */}
      <div className="ap-bento-grid">
        <div className="ap-left-col">
          {/* Side-by-side Telemetry Charts */}
          <div className="ap-charts-row">
            <section className="ap-panel">
              <div className="ap-panel-header">
                <h2 className="ap-panel-title">
                  <TrendingUp size={14} color="#00F0FF" />
                  <span>Curva de Receita & Retenção</span>
                </h2>
                <span className="ap-panel-badge">+12.4% ANUAL</span>
              </div>
              <div className="ap-chart-box">
                <svg viewBox="0 0 400 130" className="w-full h-full">
                  <defs>
                    <linearGradient id="stitchChartGlow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#00F0FF" stopOpacity="0.38" />
                      <stop offset="100%" stopColor="#00F0FF" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path d="M0,125 L0,90 Q60,100 110,70 T220,52 T310,34 T400,16 L400,125 Z" fill="url(#stitchChartGlow)" />
                  <path d="M0,90 Q60,100 110,70 T220,52 T310,34 T400,16" fill="none" stroke="#00F0FF" strokeWidth="3" />
                </svg>
              </div>
            </section>

            <section className="ap-panel">
              <div className="ap-panel-header">
                <h2 className="ap-panel-title">
                  <Activity size={14} color="#10B981" />
                  <span>Telemetria de Presença Semanal</span>
                </h2>
                <span className="ap-panel-badge" style={{ color: '#10B981' }}>TEMPO REAL</span>
              </div>
              <div className="ap-chart-box">
                {attendanceWeek.map((item, i) => (
                  <div key={i} className="ap-bar-col" title={`${item.day}: ${item.val}%`}>
                    <div className="ap-bar-fill" style={{ height: `${item.val}%` }} />
                    <span className="ap-bar-label">{item.day}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* 5-Portal Sovereign Matrix */}
          <section className="ap-panel">
            <div className="ap-panel-header">
              <h2 className="ap-panel-title">
                <Shield size={14} color="#00F0FF" />
                <span>Inspeção Direta dos 5 Portais Soberanos (Stitch Sync)</span>
              </h2>
              <span className="ap-panel-badge">ACESSO IMEDIATO</span>
            </div>
            <div className="ap-portals-matrix">
              {portalMatrix.map(p => (
                <button
                  key={p.id}
                  type="button"
                  className="ap-portal-tile"
                  onClick={() => onNavigate(p.id)}
                >
                  <div className="ap-portal-tile-top">
                    <span
                      className="ap-portal-tile-tag"
                      style={{ background: `${p.color}22`, color: p.color, border: `1px solid ${p.color}55` }}
                    >
                      {p.tag}
                    </span>
                    {p.icon}
                  </div>
                  <div className="ap-portal-tile-name">{p.name}</div>
                  <div className="ap-portal-tile-desc">{p.desc}</div>
                </button>
              ))}
            </div>
          </section>
        </div>

        {/* Right Column: Live Institutional Activity Feed with Rectangular Portraits */}
        <section className="ap-panel">
          <div className="ap-panel-header">
            <h2 className="ap-panel-title">
              <Clock size={14} color="#00F0FF" />
              <span>Pulso Institucional & Auditoria Ao Vivo</span>
            </h2>
            <span className="ap-panel-badge">STREAM ATIVO</span>
          </div>
          <div className="ap-feed-list">
            {liveFeed.map(item => (
              <div key={item.id} className="ap-feed-row">
                <img src={item.photo} alt={item.title} className="ap-feed-photo" />
                <div className="ap-feed-content">
                  <div className="ap-feed-info">
                    <span className="ap-feed-title">{item.title}</span>
                    <span className="ap-feed-sub">{item.sub}</span>
                  </div>
                  <span className="ap-feed-time">{item.time}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );

  const renderAdminPage = () => {
    const onBack = () => onNavigate('executive-cockpit-portal');

    switch (currentPage) {
      case 'dashboard':
      case 'executive-cockpit-portal':
        return renderExecutiveDashboard();
      case 'user-management':
        return <UserManagement onBack={onBack} />;
      case 'settings':
        return <Settings onBack={onBack} />;
      case 'finance':
        return <FinancialGlassUI onBack={onBack} />;
      case 'audit-log':
        return <AuditLogViewer onBack={onBack} />;
      case 'governance':
        return <GovernanceDashboard onBack={onBack} />;
      case 'unified-command':
        return <UnifiedCommand userRole={userRole} onBack={onBack} />;
      case 'coordination':
        return <CoordinationManagement onBack={onBack} />;
      case 'calendar':
        return <AcademicCalendar onBack={onBack} />;
      case 'reports-hub':
        return <ReportingHub onBack={onBack} />;
      case 'multi-site':
        return <MultiSiteManager onBack={onBack} />;
      case 'nexus-mesh':
        return <GlobalNexusDashboard />;
      case 'zenith-cockpit':
        return <OmniscientCockpit />;
      case 'zenith-final':
        return <ZenithCockpitUI />;
      case 'collective-brain':
        return <CollectiveBrain />;
      case 'predictive-dashboard':
        return <PredictiveDashboard onNavigate={onNavigate} />;
      case 'ai-lab':
        return <StudentAILab studentId="SYSTEM" onBack={onBack} />;
      case 'help':
        return <HelpCenter onBack={onBack} />;
      case 'pricing':
        return <PricingGlassUI onBack={onBack} />;
      case 'mastery-chamber':
        return <StudentMasteryChamber studentId="ADMIN_PREVIEW" onBack={onBack} />;
      case 'knowledge-canvas':
      case 'albus-canvas':
        return <StudentMasteryChamber studentId="ADMIN_PREVIEW" initialMode="canvas" onBack={onBack} />;
      case 'security-monitor':
        return <SecurityMonitor />;
      case 'multistream':
        return <MultiStreamGrid />;
      case 'iot-manager':
        return <IoTManager />;
      case 'diagnostics':
        return <HardwareDiagnostics />;
      case 'infrastructure':
        return <InfrastructureDashboard onBack={onBack} />;
      case 'hardware':
        return <HardwareCalculator onBack={onBack} />;
      case 'predictive-absence':
        return <PredictiveAbsenceDashboard onBack={onBack} />;
      case 'visitor-management':
        return <VisitorManagement onBack={onBack} />;
      case 'cameras':
        return <CameraConfiguration />;
      case 'ruview':
        return <RuViewPage />;
      case 'red-audit':
        return <SecurityAuditDashboard />;
      case 'twin-navigator':
        return <TwinNavigator />;
      case 'night-sentry':
        return <NightSentry onBack={onBack} />;
      case 'load-testing':
        return <LoadTesting onBack={onBack} />;
      case 'network-traffic':
        return <NetworkTrafficDashboard onBack={onBack} />;
      case 'growth-agents':
      case 'school-growth-agents':
        return <SchoolGrowthAgentSuite onBack={onBack} />;
      default:
        return renderExecutiveDashboard();
    }
  };

  const isAdmin = ['admin', 'director'].includes(userRole) || !userRole;

  return (
    <PortalLayout
      portalName={isAdmin ? 'Direção & Inteligência Estratégica' : 'Secretaria & Gestão Escolar'}
      themeColor="#00F0FF"
      onNavigate={onNavigate}
    >
      {renderAdminPage()}
    </PortalLayout>
  );
};

export default AdminPortal;
