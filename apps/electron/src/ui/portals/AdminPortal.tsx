import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { PortalLayout } from '../layouts/PortalLayout';
import { isDirectorRole, isMvp01Active } from '../../config/mvpProfile';
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
import { TurnstileShadowConsole } from '../components/TurnstileShadowConsole';
import { PilotReadinessInspector } from '../components/PilotReadinessInspector';
import { GpuAccelerationCockpit } from '../components/GpuAccelerationCockpit';
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
import { SocialNexus } from '../pages/SocialNexus';
import { Students } from '../pages/Students';
import { SeatingIntelligence } from '../pages/SeatingIntelligence';
import { ClassroomDashboard } from '../pages/ClassroomDashboard';
import { LGPDCompliance } from '../pages/LGPDCompliance';
import WhatsAppIntegration from '../pages/WhatsAppIntegration';
import { AlertsPage } from '../pages/AlertsPage';
import ExecutiveFinanceBI from '../pages/ExecutiveFinanceBI';
import { EcosystemManager } from '../pages/EcosystemManager';
import { PedagogicalIntelligenceHub } from '../pages/PedagogicalIntelligenceHub';
import SovereignLibrarianUI from '../pages/SovereignLibrarianUI';
import LifecycleDashboard from '../pages/LifecycleDashboard';
import { StudentCosmeticsChamber } from '../components/StudentCosmeticsChamber';
import { YouTubePedagogicalFinder } from '../components/YouTubePedagogicalFinder';

import {
  Activity,
  AlertTriangle,
  BarChart3,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Compass,
  Cpu,
  CreditCard,
  DollarSign,
  Eye,
  FileText,
  GraduationCap,
  Heart,
  LayoutGrid,
  MessageSquare,
  Printer,
  RefreshCw,
  Send,
  Shield,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  UserPlus,
  Users,
} from 'lucide-react';
import './AdminPortal.css';

interface AdminPortalProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  userRole: string;
  activeHub: 'security' | 'admin' | 'pedagogical';
  onLogout: () => void;
}

type DirectionTab = 'exec' | 'academico' | 'comunicacao' | 'auditoria';

interface DirectionKpiItem {
  key: string;
  label: string;
  value: number | string;
  formula: string;
  period: string;
  updatedAt: string;
}

interface DirectionIncidentSummary {
  id: string;
  student_id: string;
  class_id: string | null;
  category: 'DISCIPLINARY' | 'PEDAGOGICAL' | 'HEALTH_CARE' | 'PRAISE' | string;
  title: string;
  published_summary: string | null;
  published_to_family: number;
  status: string;
  created_at: string;
}

interface DirectionOverviewPayload {
  portal: 'direction';
  readOnly: true;
  school: { id: string; name: string; cnpj?: string; city?: string; state?: string } | null;
  kpis: DirectionKpiItem[];
  academicYears: Array<{
    id: string;
    year: number;
    stage: string;
    min_days: number;
    min_hours: number;
    planned_days: number | null;
    planned_hours: number | null;
    completed_hours: number;
    legal_basis: string | null;
    status: string;
  }>;
  academicPeriods: Array<{
    id: string;
    academic_year_id: string;
    name: string;
    start_date: string | null;
    end_date: string | null;
    status: string;
    closed_at: string | null;
  }>;
  incidentSummaries: DirectionIncidentSummary[];
  consistencySummary: {
    blockingCount: number;
    warningCount: number;
  };
}

interface MvpMembershipSummary {
  membershipId: string;
  userId: string;
  personName: string | null;
  email: string | null;
  schoolId: string;
  role: string;
  status: 'ACTIVE' | 'INACTIVE';
  validUntil: string | null;
}

interface MvpContextSummary {
  userId: string;
  schoolId: string;
  membershipId: string;
  activeRole: string;
  availableMemberships: MvpMembershipSummary[];
}

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador',
  director: 'Direção (Somente Visualização)',
  diretoria: 'Direção (Somente Visualização)',
  secretary: 'Secretaria',
  secretaria: 'Secretaria',
  coordinator: 'Coordenação',
  coordenacao: 'Coordenação',
  teacher: 'Docente',
  docente: 'Docente',
  parent: 'Responsável',
  responsavel: 'Responsável',
  student: 'Estudante',
  aluno: 'Estudante',
};

const INCIDENT_CATEGORY_LABELS: Record<string, string> = {
  DISCIPLINARY: 'Disciplinar',
  PEDAGOGICAL: 'Pedagógica',
  HEALTH_CARE: 'Acolhimento / Saúde (Resumo Restrito)',
  PRAISE: 'Elogio / Mérito',
};

const INCIDENT_STATUS_LABELS: Record<string, string> = {
  OPEN: 'Aberta',
  IN_PROGRESS: 'Em Acompanhamento',
  RESOLVED: 'Resolvida',
};

function formatDateTimePtBr(raw?: string | null): string {
  if (!raw) return '—';
  const isoDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(raw);
  const parsed = isoDateOnly ? new Date(`${raw}T12:00:00`) : new Date(raw);
  if (Number.isNaN(parsed.getTime())) return raw;
  return isoDateOnly
    ? parsed.toLocaleDateString('pt-BR')
    : parsed.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

function formatKpiDisplayValue(kpi: DirectionKpiItem): string {
  if (typeof kpi.value === 'string') return kpi.value;
  if (kpi.label.includes('(%)') || kpi.key.includes('rate') || kpi.key.includes('progress')) {
    return `${kpi.value}%`;
  }
  return kpi.value.toLocaleString('pt-BR');
}

export const AdminPortal: React.FC<AdminPortalProps> = ({ currentPage, onNavigate, userRole }) => {
  const mvp01 = isMvp01Active();
  const [directionTab, setDirectionTab] = useState<DirectionTab>('exec');
  const [mvpContext, setMvpContext] = useState<MvpContextSummary | null>(null);
  const [directionOverview, setDirectionOverview] = useState<DirectionOverviewPayload | null>(null);
  const [directionLoading, setDirectionLoading] = useState(false);
  const [directionError, setDirectionError] = useState<string | null>(null);
  const [switchingContext, setSwitchingContext] = useState(false);

  const isDirector = isDirectorRole(userRole) || isDirectorRole(mvpContext?.activeRole);
  const isMvp01DirectionView = mvp01 || isDirector;

  const loadDirectionOverview = useCallback(async () => {
    if (!isMvp01DirectionView) return;
    setDirectionLoading(true);
    setDirectionError(null);
    try {
      const mvpApi = (window as any).aquila?.mvp01;
      if (!mvpApi?.getPortalOverview) {
        setDirectionOverview(null);
        setDirectionError('Serviço de leitura da Direção (MVP 0.1) indisponível neste ambiente.');
        return;
      }

      const ctxRes = await mvpApi.getContext?.();
      if (ctxRes?.success && ctxRes.data) {
        setMvpContext(ctxRes.data as MvpContextSummary);
      }

      const overviewRes = await mvpApi.getPortalOverview({ portal: 'direction' });
      if (!overviewRes?.success) {
        setDirectionOverview(null);
        setDirectionError(overviewRes?.error || 'Acesso não autorizado ao Painel da Direção.');
        return;
      }

      setDirectionOverview(overviewRes.data as DirectionOverviewPayload);
    } catch {
      setDirectionOverview(null);
      setDirectionError('Não foi possível consultar os indicadores da Direção.');
    } finally {
      setDirectionLoading(false);
    }
  }, [isMvp01DirectionView]);

  useEffect(() => {
    if (isMvp01DirectionView) {
      loadDirectionOverview();
    }
  }, [isMvp01DirectionView, loadDirectionOverview]);

  const handleSwitchContext = async (membershipId: string) => {
    const mvpApi = (window as any).aquila?.mvp01;
    if (!mvpApi?.switchContext || !membershipId) return;
    setSwitchingContext(true);
    try {
      const res = await mvpApi.switchContext({ membershipId });
      if (!res?.success) {
        setDirectionError(res?.error || 'Não foi possível alternar o vínculo.');
        return;
      }
      setDirectionOverview(null);
      await loadDirectionOverview();
    } finally {
      setSwitchingContext(false);
    }
  };

  const activeMemberships = useMemo(
    () => (mvpContext?.availableMemberships || []).filter((m) => m.status === 'ACTIVE'),
    [mvpContext]
  );

  const directorCandidateMembership = activeMemberships.find((m) => {
    const r = m.role.toLowerCase();
    return r === 'director' || r === 'diretoria' || r === 'admin';
  });

  const renderKpiCard = (kpi: DirectionKpiItem) => (
    <article
      key={kpi.key}
      className="ap-kpi-pod"
      data-testid={`direction-kpi-${kpi.key}`}
      style={{
        flexDirection: 'column',
        alignItems: 'stretch',
        gap: 6,
        padding: '10px 12px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div className="ap-kpi-meta" style={{ gap: 2 }}>
          <span className="ap-kpi-label">{kpi.label}</span>
          <span className="ap-kpi-value" style={{ color: '#00F0FF', fontSize: 20 }}>
            {formatKpiDisplayValue(kpi)}
          </span>
        </div>
        <div className="ap-kpi-icon" style={{ background: 'rgba(0, 240, 255, 0.12)', color: '#00F0FF' }}>
          <BarChart3 size={16} />
        </div>
      </div>

      <div
        style={{
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          paddingTop: 6,
          display: 'flex',
          flexDirection: 'column',
          gap: 3,
          fontSize: 11,
          color: '#CBD5E1',
        }}
      >
        <div>
          <strong style={{ color: '#94A3B8' }}>Período:</strong> {kpi.period}
        </div>
        <div style={{ wordBreak: 'break-word' }}>
          <strong style={{ color: '#94A3B8' }}>Fórmula:</strong>{' '}
          <code
            style={{
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: 10.5,
              color: '#7DD3FC',
              background: 'rgba(14, 165, 233, 0.1)',
              padding: '1px 5px',
              borderRadius: 4,
            }}
          >
            {kpi.formula}
          </code>
        </div>
        <div>
          <strong style={{ color: '#94A3B8' }}>Última atualização:</strong> {formatDateTimePtBr(kpi.updatedAt)}
        </div>
      </div>
    </article>
  );

  // =========================================================================
  // MODO DIREÇÃO SOMENTE VISUALIZAÇÃO (MVP 0.1 / PERFIL DIRECTOR)
  // ZERO botões de edição, criação ou exclusão.
  // =========================================================================
  const renderMvp01DirectionView = () => {
    const kpis = directionOverview?.kpis || [];
    const academicKpis = kpis.filter((k) =>
      ['active_enrollments', 'attendance_rate', 'academic_hours_progress'].includes(k.key)
    );

    return (
      <div className="ap-cockpit" data-testid="direction-readonly-portal">
        {/* Barra Superior de Leitura */}
        <div className="ap-command-bar">
          <div className="ap-cmd-left" style={{ flexWrap: 'wrap' }}>
            <span className="ap-cmd-badge">MVP 0.1 • DIREÇÃO</span>
            <h1 className="ap-cmd-title">
              {directionOverview?.school?.name
                ? `${directionOverview.school.name} — Acompanhamento Executivo`
                : 'Painel Executivo da Direção'}
            </h1>
            <span
              className="ap-cmd-badge"
              data-testid="direction-readonly-badge"
              style={{
                background: 'rgba(14, 165, 233, 0.16)',
                borderColor: 'rgba(56, 189, 248, 0.45)',
                color: '#38BDF8',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
              }}
              title="Na versão MVP 0.1, a Direção opera exclusivamente em modo de consulta e impressão."
            >
              <Eye size={11} />
              <span>Somente Visualização (Leitura)</span>
            </span>
          </div>

          {/* Apenas ações de consulta, atualização de leitura e impressão — ZERO edição/criação/exclusão */}
          <div className="ap-cmd-actions">
            {activeMemberships.length > 1 && mvpContext && (
              <select
                aria-label="Selecionar vínculo institucional"
                value={mvpContext.membershipId}
                disabled={switchingContext}
                onChange={(e) => handleSwitchContext(e.target.value)}
                style={{
                  height: 28,
                  minHeight: 28,
                  padding: '0 8px',
                  borderRadius: 6,
                  background: '#0F172A',
                  border: '1px solid rgba(56, 189, 248, 0.4)',
                  color: '#F8FAFC',
                  fontSize: 11,
                }}
              >
                {activeMemberships.map((m) => (
                  <option key={m.membershipId} value={m.membershipId}>
                    {m.personName || m.userId} ({ROLE_LABELS[m.role.toLowerCase()] || m.role})
                  </option>
                ))}
              </select>
            )}
            <button type="button" onClick={loadDirectionOverview} disabled={directionLoading} className="ap-btn">
              <RefreshCw size={13} />
              <span>Atualizar Leitura</span>
            </button>
            <button type="button" onClick={() => onNavigate('reports-hub')} className="ap-btn primary">
              <FileText size={13} />
              <span>Consultar Relatórios</span>
            </button>
            <button type="button" onClick={() => window.print()} className="ap-btn">
              <Printer size={13} />
              <span>Imprimir Resumo</span>
            </button>
          </div>
        </div>

        {activeMemberships.length > 1 && (
          <div
            style={{
              padding: '6px 10px',
              borderRadius: 6,
              background: 'rgba(14, 165, 233, 0.08)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              fontSize: 11.5,
              color: '#BAE6FD',
            }}
          >
            Contexto multi-papel detectado: alternar vínculo aplica estritamente as permissões do papel selecionado, sem
            herança entre funções.
          </div>
        )}

        {/* 4 Abas Enxutas da Direção */}
        <nav
          role="tablist"
          aria-label="Abas da Direção (Somente Visualização)"
          data-testid="direction-tabs"
          style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}
        >
          {[
            { key: 'exec' as const, label: 'Visão Executiva', icon: <Shield size={13} /> },
            { key: 'academico' as const, label: 'Acadêmico & Frequência', icon: <BookOpen size={13} /> },
            { key: 'comunicacao' as const, label: 'Comunicação & Famílias', icon: <MessageSquare size={13} /> },
            { key: 'auditoria' as const, label: 'Relatórios & Auditoria', icon: <FileText size={13} /> },
          ].map((tab) => {
            const isActive = directionTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={isActive}
                data-testid={`direction-tab-${tab.key}`}
                onClick={() => setDirectionTab(tab.key)}
                className={`ap-btn ${isActive ? 'primary' : ''}`}
                style={{ height: 30, padding: '0 12px' }}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {directionError ? (
          <section
            className="ap-panel"
            style={{
              borderColor: 'rgba(239, 68, 68, 0.4)',
              background: 'rgba(239, 68, 68, 0.08)',
              padding: 16,
            }}
            data-testid="direction-auth-notice"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#FCA5A5', marginBottom: 6 }}>
              <ShieldAlert size={18} />
              <strong>Acesso não autorizado ao Portal da Direção</strong>
            </div>
            <p style={{ margin: 0, fontSize: 12.5, color: '#FECACA' }}>{directionError}</p>
            {directorCandidateMembership &&
              mvpContext?.membershipId !== directorCandidateMembership.membershipId && (
                <div style={{ marginTop: 10 }}>
                  <button
                    type="button"
                    className="ap-btn primary"
                    onClick={() => handleSwitchContext(directorCandidateMembership.membershipId)}
                  >
                    Alternar para vínculo de Direção/Gestão
                  </button>
                </div>
              )}
          </section>
        ) : directionLoading && !directionOverview ? (
          <section className="ap-panel" style={{ padding: 20, textAlign: 'center', color: '#94A3B8' }}>
            Consultando indicadores institucionais...
          </section>
        ) : !directionOverview ? (
          <section className="ap-panel" style={{ padding: 20, color: '#94A3B8' }}>
            Nenhum dado institucional disponível para exibição no momento.
          </section>
        ) : (
          <>
            {/* ABA 1: VISÃO EXECUTIVA */}
            {directionTab === 'exec' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                    gap: 8,
                  }}
                >
                  {kpis.map(renderKpiCard)}
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))',
                    gap: 8,
                  }}
                >
                  {/* Verificação de Consistência (Leitura) */}
                  <section className="ap-panel">
                    <div className="ap-panel-header">
                      <h2 className="ap-panel-title">
                        <AlertTriangle size={14} color="#F59E0B" />
                        <span>Resumo de Verificação de Consistência</span>
                      </h2>
                      <span className="ap-panel-badge">LEITURA</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      <div
                        style={{
                          padding: '10px 12px',
                          borderRadius: 6,
                          background:
                            directionOverview.consistencySummary.blockingCount > 0
                              ? 'rgba(239, 68, 68, 0.12)'
                              : 'rgba(16, 185, 129, 0.1)',
                          border:
                            directionOverview.consistencySummary.blockingCount > 0
                              ? '1px solid rgba(239, 68, 68, 0.35)'
                              : '1px solid rgba(16, 185, 129, 0.3)',
                        }}
                      >
                        <div style={{ fontSize: 10.5, color: '#94A3B8', fontWeight: 700 }}>BLOQUEIOS</div>
                        <div
                          style={{
                            fontSize: 20,
                            fontWeight: 800,
                            color: directionOverview.consistencySummary.blockingCount > 0 ? '#F87171' : '#34D399',
                          }}
                        >
                          {directionOverview.consistencySummary.blockingCount}
                        </div>
                      </div>
                      <div
                        style={{
                          padding: '10px 12px',
                          borderRadius: 6,
                          background: 'rgba(245, 158, 11, 0.1)',
                          border: '1px solid rgba(245, 158, 11, 0.3)',
                        }}
                      >
                        <div style={{ fontSize: 10.5, color: '#94A3B8', fontWeight: 700 }}>AVISOS</div>
                        <div style={{ fontSize: 20, fontWeight: 800, color: '#FBBF24' }}>
                          {directionOverview.consistencySummary.warningCount}
                        </div>
                      </div>
                    </div>
                    <p style={{ margin: 0, fontSize: 11.5, color: '#94A3B8' }}>
                      Tratamento operacional executado exclusivamente pela Secretaria, Coordenação ou Docente.
                    </p>
                  </section>

                  {/* Identificação Institucional & Carga Horária */}
                  <section className="ap-panel">
                    <div className="ap-panel-header">
                      <h2 className="ap-panel-title">
                        <Calendar size={14} color="#00F0FF" />
                        <span>Unidade Escolar & Anos Letivos</span>
                      </h2>
                      <span className="ap-panel-badge">
                        {directionOverview.school?.city
                          ? `${directionOverview.school.city}/${directionOverview.school.state || ''}`
                          : 'INSTITUCIONAL'}
                      </span>
                    </div>
                    {directionOverview.school?.cnpj && (
                      <div style={{ fontSize: 11.5, color: '#CBD5E1' }}>
                        <strong>CNPJ:</strong> {directionOverview.school.cnpj}
                      </div>
                    )}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {directionOverview.academicYears.map((ay) => {
                        const pct = Math.min(
                          100,
                          Math.round((Number(ay.completed_hours || 0) / Math.max(1, Number(ay.min_hours || 800))) * 100)
                        );
                        return (
                          <div
                            key={ay.id}
                            style={{
                              padding: '8px 10px',
                              borderRadius: 6,
                              background: '#141B2D',
                              border: '1px solid rgba(255, 255, 255, 0.06)',
                              fontSize: 11.5,
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                              <strong>
                                {ay.year} • {ay.stage}
                              </strong>
                              <span style={{ color: '#38BDF8', fontFamily: 'monospace' }}>
                                {ay.completed_hours}h / {ay.min_hours}h ({pct}%)
                              </span>
                            </div>
                            <div style={{ height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.08)' }}>
                              <div
                                style={{
                                  height: '100%',
                                  width: `${pct}%`,
                                  borderRadius: 3,
                                  background: pct >= 75 ? '#10B981' : '#38BDF8',
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                </div>
              </div>
            )}

            {/* ABA 2: ACADÊMICO & FREQUÊNCIA */}
            {directionTab === 'academico' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                    gap: 8,
                  }}
                >
                  {academicKpis.map(renderKpiCard)}
                </div>

                <section className="ap-panel">
                  <div className="ap-panel-header">
                    <h2 className="ap-panel-title">
                      <BookOpen size={14} color="#00F0FF" />
                      <span>Anos Letivos e Cumprimento de Carga Horária (Leitura)</span>
                    </h2>
                    <span className="ap-panel-badge">{directionOverview.academicYears.length} REGISTROS</span>
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#94A3B8' }}>
                          <th style={{ textAlign: 'left', padding: '7px 8px' }}>Ano / Etapa</th>
                          <th style={{ textAlign: 'center', padding: '7px 8px' }}>Dias Mín. / Plan.</th>
                          <th style={{ textAlign: 'center', padding: '7px 8px' }}>Horas Cumpridas / Mín.</th>
                          <th style={{ textAlign: 'left', padding: '7px 8px' }}>Base Legal</th>
                          <th style={{ textAlign: 'center', padding: '7px 8px' }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {directionOverview.academicYears.map((ay) => (
                          <tr key={ay.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                            <td style={{ padding: '7px 8px', fontWeight: 700 }}>
                              {ay.year} • {ay.stage}
                            </td>
                            <td style={{ padding: '7px 8px', textAlign: 'center', fontFamily: 'monospace' }}>
                              {ay.min_days} / {ay.planned_days ?? '—'}
                            </td>
                            <td style={{ padding: '7px 8px', textAlign: 'center', fontFamily: 'monospace' }}>
                              {ay.completed_hours}h / {ay.min_hours}h
                            </td>
                            <td style={{ padding: '7px 8px', color: '#CBD5E1' }}>{ay.legal_basis || '—'}</td>
                            <td style={{ padding: '7px 8px', textAlign: 'center' }}>
                              <span
                                style={{
                                  padding: '2px 7px',
                                  borderRadius: 4,
                                  fontSize: 10.5,
                                  fontWeight: 700,
                                  background: ay.status === 'OPEN' ? 'rgba(16,185,129,0.16)' : 'rgba(148,163,184,0.16)',
                                  color: ay.status === 'OPEN' ? '#34D399' : '#CBD5E1',
                                }}
                              >
                                {ay.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>

                <section className="ap-panel">
                  <div className="ap-panel-header">
                    <h2 className="ap-panel-title">
                      <Clock size={14} color="#10B981" />
                      <span>Períodos Letivos & Fechamento (Leitura)</span>
                    </h2>
                    <span className="ap-panel-badge">{directionOverview.academicPeriods.length} PERÍODOS</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 6 }}>
                    {directionOverview.academicPeriods.map((p) => (
                      <div
                        key={p.id}
                        style={{
                          padding: '8px 10px',
                          borderRadius: 6,
                          background: '#141B2D',
                          border: '1px solid rgba(255,255,255,0.07)',
                          fontSize: 11.5,
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                          <strong>{p.name}</strong>
                          <span style={{ color: p.status === 'OPEN' ? '#34D399' : '#94A3B8', fontWeight: 700 }}>
                            {p.status === 'OPEN' ? 'Aberto' : 'Fechado'}
                          </span>
                        </div>
                        <div style={{ color: '#94A3B8' }}>
                          {formatDateTimePtBr(p.start_date)} até {formatDateTimePtBr(p.end_date)}
                        </div>
                        {p.closed_at && (
                          <div style={{ color: '#64748B', fontSize: 10.5, marginTop: 2 }}>
                            Fechado em: {formatDateTimePtBr(p.closed_at)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            )}

            {/* ABA 3: COMUNICAÇÃO & FAMÍLIAS */}
            {directionTab === 'comunicacao' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div
                  style={{
                    padding: '10px 12px',
                    borderRadius: 8,
                    background: 'rgba(14, 165, 233, 0.1)',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    color: '#BAE6FD',
                    fontSize: 12,
                  }}
                >
                  <strong>Privacidade & Escopo da Direção:</strong> São exibidos exclusivamente resumos permitidos de
                  ocorrências. Notas internas confidenciais e prontuários internos de saúde ou acolhimento são omitidos
                  por segregação de dados.
                </div>

                <section className="ap-panel">
                  <div className="ap-panel-header">
                    <h2 className="ap-panel-title">
                      <MessageSquare size={14} color="#38BDF8" />
                      <span>Resumos Permitidos de Ocorrências</span>
                    </h2>
                    <span className="ap-panel-badge">
                      {directionOverview.incidentSummaries.length} REGISTROS
                    </span>
                  </div>

                  {directionOverview.incidentSummaries.length === 0 ? (
                    <div style={{ padding: 14, color: '#94A3B8', fontSize: 12 }}>
                      Nenhuma ocorrência registrada até o momento.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {directionOverview.incidentSummaries.map((inc) => (
                        <div
                          key={inc.id}
                          style={{
                            padding: '10px 12px',
                            borderRadius: 6,
                            background: '#141B2D',
                            border: '1px solid rgba(255, 255, 255, 0.07)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 4,
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              flexWrap: 'wrap',
                              gap: 6,
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span
                                style={{
                                  fontSize: 10,
                                  fontWeight: 700,
                                  padding: '2px 6px',
                                  borderRadius: 4,
                                  background: 'rgba(56, 189, 248, 0.14)',
                                  color: '#7DD3FC',
                                }}
                              >
                                {INCIDENT_CATEGORY_LABELS[inc.category] || inc.category}
                              </span>
                              <strong style={{ fontSize: 12.5, color: '#F8FAFC' }}>{inc.title}</strong>
                            </div>
                            <span style={{ fontSize: 11, color: '#94A3B8' }}>
                              {INCIDENT_STATUS_LABELS[inc.status] || inc.status} •{' '}
                              {formatDateTimePtBr(inc.created_at)}
                            </span>
                          </div>
                          <div style={{ fontSize: 12, color: '#CBD5E1' }}>
                            {inc.published_summary
                              ? inc.published_summary
                              : inc.category === 'HEALTH_CARE'
                              ? 'Detalhes de saúde/acolhimento restritos à equipe responsável.'
                              : 'Ocorrência sem resumo público publicado à família.'}
                          </div>
                          <div style={{ fontSize: 10.5, color: '#64748B' }}>
                            Publicada à família: {inc.published_to_family === 1 ? 'Sim' : 'Não (apenas registro interno)'}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </div>
            )}

            {/* ABA 4: RELATÓRIOS & AUDITORIA */}
            {directionTab === 'auditoria' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <section className="ap-panel">
                  <div className="ap-panel-header">
                    <h2 className="ap-panel-title">
                      <CheckCircle2 size={14} color="#10B981" />
                      <span>Verificação de Consistência & Trilha de Auditoria (Leitura)</span>
                    </h2>
                    <span className="ap-panel-badge">SOMENTE CONSULTA</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 8 }}>
                    <div style={{ padding: 12, borderRadius: 6, background: '#141B2D' }}>
                      <div style={{ fontSize: 11, color: '#94A3B8' }}>Pendências Bloqueantes</div>
                      <strong style={{ fontSize: 22, color: '#F8FAFC' }}>
                        {directionOverview.consistencySummary.blockingCount}
                      </strong>
                    </div>
                    <div style={{ padding: 12, borderRadius: 6, background: '#141B2D' }}>
                      <div style={{ fontSize: 11, color: '#94A3B8' }}>Avisos de Consistência</div>
                      <strong style={{ fontSize: 22, color: '#FBBF24' }}>
                        {directionOverview.consistencySummary.warningCount}
                      </strong>
                    </div>
                  </div>
                  <p style={{ margin: 0, fontSize: 12, color: '#CBD5E1', lineHeight: 1.5 }}>
                    Todas as consultas da Direção neste painel são registradas na trilha de auditoria do núcleo MVP 0.1.
                    Operações de alteração cadastral, lançamento de notas, fechamento de períodos ou emissão documental
                    permanecem restritas aos respectivos papéis executores e bloqueadas no backend para a Direção.
                  </p>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button type="button" className="ap-btn primary" onClick={() => onNavigate('reports-hub')}>
                      <FileText size={13} />
                      <span>Consultar Central de Relatórios</span>
                    </button>
                    <button type="button" className="ap-btn" onClick={() => window.print()}>
                      <Printer size={13} />
                      <span>Imprimir Resumo Institucional</span>
                    </button>
                  </div>
                </section>
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  // =========================================================================
  // MODO LEGADO COMPLETO (APENAS QUANDO !mvp01 && !isDirector)
  // =========================================================================
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
    { id: 1, title: 'ALUNO SINTETICO 001 — Matrícula Confirmada', sub: '3º Ano A • Prontuário SHA-256 sincronizado (LGPD)', time: 'HÁ 04 MIN', photo: './avatars/face-5.jpg' },
    { id: 2, title: 'ALUNO SINTETICO 002 — Presença Portaria Sul', sub: '2º Ano B • Cartão QR / Chamada Nominal (Quarentena Biométrica ANPD)', time: 'HÁ 12 MIN', photo: './avatars/face-6.jpg' },
    { id: 3, title: 'Relatório Diário Consolidado — 7º Ano A', sub: 'Diário de Classe e frequência sincronizados com Coordenação', time: 'HÁ 28 MIN', photo: './avatars/face-7.jpg' },
    { id: 4, title: 'Comunicado Enviado aos Responsáveis', sub: 'Aviso de Reunião Bimestral • Confirmação de leitura ativa', time: 'HÁ 45 MIN', photo: './avatars/face-8.jpg' },
    { id: 5, title: 'Mapa de Sala Atualizado', sub: 'Turma 2º B • Organização pedagógica registrada', time: 'HÁ 01 H', photo: './avatars/face-9.jpg' },
  ];

  const renderLegacyExecutiveDashboard = () => (
    <div className="ap-cockpit">
      <div className="ap-command-bar">
        <div className="ap-cmd-left">
          <span className="ap-cmd-badge">SOVEREIGN EXECUTIVE COCKPIT</span>
          <h1 className="ap-cmd-title">Direção & Inteligência Estratégica Institucional</h1>
        </div>
        <div className="ap-cmd-actions">
          <button onClick={() => onNavigate('pilot-readiness')} className="ap-btn primary" style={{ background: 'linear-gradient(135deg, #10B981, #059669)', border: '1px solid #34D399' }}>
            <Shield size={14} />
            <span>Prontidão dos Pilotos (H-01/H-02)</span>
          </button>
          <button onClick={() => onNavigate('gpu-acceleration')} className="ap-btn primary" style={{ background: 'linear-gradient(135deg, #7C3AED, #6D28D9)', border: '1px solid #A78BFA' }}>
            <Cpu size={14} />
            <span>Aceleração GPU (NVIDIA / Colab)</span>
          </button>
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

      <div className="ap-bento-grid">
        <div className="ap-left-col">
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

          <section className="ap-panel">
            <div className="ap-panel-header">
              <h2 className="ap-panel-title">
                <Shield size={14} color="#00F0FF" />
                <span>Inspeção Direta dos 5 Portais Soberanos (Stitch Sync)</span>
              </h2>
              <span className="ap-panel-badge">ACESSO IMEDIATO</span>
            </div>
            <div className="ap-portals-matrix">
              {portalMatrix.map((p) => (
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

        <section className="ap-panel">
          <div className="ap-panel-header">
            <h2 className="ap-panel-title">
              <Clock size={14} color="#00F0FF" />
              <span>Pulso Institucional & Auditoria Ao Vivo</span>
            </h2>
            <span className="ap-panel-badge">STREAM ATIVO</span>
          </div>
          <div className="ap-feed-list">
            {liveFeed.map((item) => (
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

    if (isMvp01DirectionView) {
      if (currentPage === 'reports-hub') {
        return <ReportingHub onBack={onBack} userRole={userRole || 'director'} userCoordinationId={null} />;
      }
      if (currentPage === 'help') {
        return <HelpCenter onBack={onBack} />;
      }
      if (
        isDirector ||
        currentPage === 'dashboard' ||
        currentPage === 'executive-cockpit-portal' ||
        currentPage === 'executive-pulse'
      ) {
        return renderMvp01DirectionView();
      }
    }

    switch (currentPage) {
      case 'dashboard':
      case 'executive-cockpit-portal':
        return isMvp01DirectionView ? renderMvp01DirectionView() : renderLegacyExecutiveDashboard();
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
        return <ReportingHub onBack={onBack} userRole={userRole || 'admin'} userCoordinationId={null} />;
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
      case 'pilot-readiness':
      case 'homologacao-pilotos':
      case 'pilot-cockpit':
        return <PilotReadinessInspector />;
      case 'gpu-acceleration':
      case 'hardware-cockpit':
      case 'gpu-cockpit':
        return <GpuAccelerationCockpit />;
      case 'turnstile-shadow':
      case 'turnstile-pilot':
      case 'gatekeeper-shadow':
        return <TurnstileShadowConsole onBack={onBack} />;
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
      case 'social-nexus':
        return <SocialNexus onBack={onBack} />;
      case 'students':
        return <Students onNavigate={onNavigate} onBack={onBack} />;
      case 'seating-intelligence':
        return <SeatingIntelligence onNavigate={onNavigate} onBack={onBack} />;
      case 'classroom-dashboard':
        return <ClassroomDashboard user={{ role: userRole }} />;
      case 'lgpd':
        return <LGPDCompliance />;
      case 'whatsapp':
        return <WhatsAppIntegration />;
      case 'alerts':
        return <AlertsPage onBack={onBack} />;
      case 'executive-finance-bi':
        return <ExecutiveFinanceBI />;
      case 'ecosystem':
        return <EcosystemManager />;
      case 'intelligence-hub':
        return <PedagogicalIntelligenceHub />;
      case 'sovereign-library':
        return <SovereignLibrarianUI />;
      case 'lifecycle-dashboard':
        return <LifecycleDashboard />;
      case 'cosmetics-chamber':
      case 'battle-banner':
      case 'skins-shop':
        return <StudentCosmeticsChamber studentId="ADMIN_PREVIEW" onBack={onBack} />;
      case 'youtube-radar':
      case 'video-finder':
        return <YouTubePedagogicalFinder onBack={onBack} />;
      case 'executive-pulse':
        return isMvp01DirectionView ? renderMvp01DirectionView() : renderLegacyExecutiveDashboard();
      default:
        return isMvp01DirectionView ? renderMvp01DirectionView() : renderLegacyExecutiveDashboard();
    }
  };

  const isAdmin = ['admin', 'director', 'diretoria'].includes((userRole || '').toLowerCase()) || !userRole;

  return (
    <PortalLayout
      portalName={
        isMvp01DirectionView
          ? 'Direção — Somente Visualização'
          : isAdmin
          ? 'Direção & Inteligência Estratégica'
          : 'Secretaria & Gestão Escolar'
      }
      themeColor="#00F0FF"
      onNavigate={onNavigate}
    >
      {renderAdminPage()}
    </PortalLayout>
  );
};

export default AdminPortal;
