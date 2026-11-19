import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { PortalLayout } from '../layouts/PortalLayout';
import { isMvp01Active } from '../../config/mvpProfile';
import { CoordinationManagement } from '../pages/CoordinationManagement';
import { AcademicCalendar } from '../pages/AcademicCalendar';
import { ReportingHub } from '../pages/ReportingHub';
import { SeatingIntelligence } from '../pages/SeatingIntelligence';
import { StudentMasteryChamber } from '../pages/StudentMasteryChamber';
import { TimetableBuilder } from '../components/TimetableBuilder';
import { BNCCProficiencyHeatmap } from '../components/BNCCProficiencyHeatmap';
import { SchoolGrowthAgentSuite } from '../components/SchoolGrowthAgentSuite';
import { ExamPaperFoundry } from '../components/ExamPaperFoundry';
import { OmrScannerUI } from '../components/OmrScannerUI';
import { Students } from '../pages/Students';
import { TeacherGradebook } from '../pages/TeacherGradebook';
import { AttendanceCall } from '../pages/AttendanceCall';
import { StudentAILab } from '../pages/StudentAILab';
import { StudentCosmeticsChamber } from '../components/StudentCosmeticsChamber';
import { YouTubePedagogicalFinder } from '../components/YouTubePedagogicalFinder';
import PredictiveDashboard from '../pages/PredictiveDashboard';
import SovereignLibrarianUI from '../pages/SovereignLibrarianUI';
import { ClassroomDashboard } from '../pages/ClassroomDashboard';
import LifecycleDashboard from '../pages/LifecycleDashboard';
import HelpCenter from '../pages/HelpCenter';
import { invokeMvp01, formatRoleLabel, Mvp01ContextData } from '../components/Mvp01SecretariatSuite';
import './CoordinationPortal.css';
import {
  Users,
  TrendingDown,
  AlertTriangle,
  BookOpen,
  Calendar,
  FileText,
  LayoutGrid,
  Sparkles,
  Clock,
  Flame,
  Printer,
  ShieldAlert,
  Lock,
  Send,
  Check,
  X,
  CheckCircle2,
  Eye,
  Plus,
} from 'lucide-react';

interface CoordinationPortalProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

interface CoordOverviewData {
  portal: 'coordination';
  school: { id: string; name: string } | null;
  academicYears: any[];
  academicPeriods: any[];
  classes: any[];
  incidents: any[];
  pendingJustifications: any[];
  masteryAlerts: any[];
}

export const CoordinationPortal: React.FC<CoordinationPortalProps> = ({ currentPage, onNavigate }) => {
  const mvp01 = isMvp01Active();
  const [mvpContext, setMvpContext] = useState<Mvp01ContextData | null>(null);
  const [mvpOverview, setMvpOverview] = useState<CoordOverviewData | null>(null);
  const [mvpError, setMvpError] = useState<string | null>(null);
  const [selectedClassScope, setSelectedClassScope] = useState<string>('ALL');

  const loadCoordMvp = useCallback(async () => {
    if (!mvp01) return;
    setMvpError(null);
    const ctxRes = await invokeMvp01<Mvp01ContextData>('getContext');
    if (ctxRes.ok) {
      setMvpContext(ctxRes.data);
    }
    const ovRes = await invokeMvp01<CoordOverviewData>('getPortalOverview', {
      portal: 'coordination',
    });
    if (ovRes.ok) {
      setMvpOverview(ovRes.data);
    } else if (ovRes.code !== 'BRIDGE_UNAVAILABLE') {
      setMvpError(ovRes.error);
    }
  }, [mvp01]);

  useEffect(() => {
    loadCoordMvp();
  }, [loadCoordMvp]);

  const handleSwitchMembership = async (membershipId: string) => {
    const res = await invokeMvp01<Mvp01ContextData>('switchContext', { membershipId });
    if (res.ok) {
      setMvpContext(res.data);
      await loadCoordMvp();
    } else {
      setMvpError(res.error);
    }
  };

  const renderCoordinationPage = () => {
    const onBack = () => onNavigate('coordination');

    switch (currentPage) {
      case 'coordination':
      case 'coordination-dashboard':
      case 'coordination-overview':
      case 'dashboard':
        return (
          <div className="coord-portal-shell">
            <CoordKPIBar
              onNavigate={onNavigate}
              mvpOverview={mvpOverview}
              mvpContext={mvpContext}
              onSwitchMembership={handleSwitchMembership}
            />
            {mvp01 ? (
              <Mvp01CoordinationWorkspace
                overview={mvpOverview}
                context={mvpContext}
                mvpError={mvpError}
                selectedClassScope={selectedClassScope}
                setSelectedClassScope={setSelectedClassScope}
                onRefresh={loadCoordMvp}
                onBack={onBack}
              />
            ) : (
              <CoordinationManagement onBack={onBack} />
            )}
          </div>
        );
      case 'timetable':
      case 'urania-timetable':
        return <TimetableBuilder onBack={onBack} />;
      case 'calendar':
      case 'academic-calendar':
        return <AcademicCalendar onBack={onBack} />;
      case 'reports-hub':
        return <ReportingHub onBack={onBack} userRole="coordinator" userCoordinationId={null} />;
      case 'seating-intelligence':
        return <SeatingIntelligence onNavigate={onNavigate} onBack={onBack} />;
      case 'mastery-chamber':
        return <StudentMasteryChamber onBack={onBack} />;
      case 'bncc-heatmap':
      case 'skills-heatmap':
      case 'heatmap':
        return (
          <div className="coord-portal-shell">
            <BNCCProficiencyHeatmap onBack={onBack} />
          </div>
        );
      case 'growth-agents':
      case 'school-growth-agents':
        return (
          <div className="coord-portal-shell">
            <SchoolGrowthAgentSuite onBack={onBack} />
          </div>
        );
      case 'exam-foundry':
      case 'banco-provas':
        return (
          <div className="coord-portal-shell">
            <ExamPaperFoundry onNavigate={onNavigate} onBack={onBack} />
          </div>
        );
      case 'omr':
      case 'omr-scanner':
        return (
          <div className="coord-portal-shell">
            <OmrScannerUI onNavigate={onNavigate} onBack={onBack} />
          </div>
        );
      case 'students':
        return <Students onNavigate={onNavigate} onBack={onBack} />;
      case 'gradebook':
        return <TeacherGradebook onBack={onBack} onNavigate={onNavigate} />;
      case 'attendance':
        return <AttendanceCall onBack={onBack} />;
      case 'ai-lab':
        return <StudentAILab studentId="COORD_PREVIEW" onBack={onBack} />;
      case 'cosmetics-chamber':
      case 'battle-banner':
      case 'skins-shop':
        return <StudentCosmeticsChamber studentId="COORD_PREVIEW" onBack={onBack} />;
      case 'youtube-radar':
      case 'video-finder':
        return <YouTubePedagogicalFinder onBack={onBack} />;
      case 'predictive-dashboard':
        return <PredictiveDashboard onNavigate={onNavigate} />;
      case 'sovereign-library':
        return <SovereignLibrarianUI />;
      case 'classroom-dashboard':
        return <ClassroomDashboard />;
      case 'lifecycle-dashboard':
        return <LifecycleDashboard />;
      case 'help':
        return <HelpCenter onBack={onBack} />;
      default:
        return (
          <div className="coord-portal-shell">
            <CoordKPIBar
              onNavigate={onNavigate}
              mvpOverview={mvpOverview}
              mvpContext={mvpContext}
              onSwitchMembership={handleSwitchMembership}
            />
            {mvp01 ? (
              <Mvp01CoordinationWorkspace
                overview={mvpOverview}
                context={mvpContext}
                mvpError={mvpError}
                selectedClassScope={selectedClassScope}
                setSelectedClassScope={setSelectedClassScope}
                onRefresh={loadCoordMvp}
                onBack={onBack}
              />
            ) : (
              <CoordinationManagement onBack={onBack} />
            )}
          </div>
        );
    }
  };

  return (
    <PortalLayout portalName="Coordenação Pedagógica" themeColor="#F59E0B" onNavigate={onNavigate}>
      {renderCoordinationPage()}
    </PortalLayout>
  );
};

interface CoordKPIBarProps {
  onNavigate: (page: string) => void;
  mvpOverview: CoordOverviewData | null;
  mvpContext: Mvp01ContextData | null;
  onSwitchMembership: (membershipId: string) => Promise<void>;
}

const CoordKPIBar: React.FC<CoordKPIBarProps> = ({
  onNavigate,
  mvpOverview,
  mvpContext,
  onSwitchMembership,
}) => {
  const [kpis, setKpis] = React.useState({
    attendanceRate: 95.4 as number,
    atRiskStudents: 0 as number,
    openIncidents: 0 as number,
    avgGrade: 8.1 as number,
  });

  React.useEffect(() => {
    const load = async () => {
      try {
        const [telemetry, stats] = await Promise.all([
          (window as any).aquila.invoke('get-attendance-telemetry'),
          (window as any).aquila.invoke('get-dashboard-stats'),
        ]);

        const total = (telemetry?.totalToday ?? 0) + (telemetry?.absentToday ?? 0);
        const rate = total > 0 ? Math.round((telemetry.presentNow / total) * 100) : 95.4;

        setKpis({
          attendanceRate: rate,
          atRiskStudents: stats?.data?.atRiskCount ?? 0,
          openIncidents: stats?.data?.openIncidents ?? 0,
          avgGrade: stats?.data?.avgGrade ?? 8.1,
        });
      } catch {
        // Mantém telemetria padrão em modo offline/demo
      }
    };
    load();
  }, []);

  const mvp01 = isMvp01Active();
  const scopedClassesCount = mvpOverview?.classes?.length ?? 0;
  const openIncidentsCount = mvpOverview
    ? (mvpOverview.incidents || []).filter(i => i.status !== 'RESOLVED').length
    : kpis.openIncidents;
  const pendingJustCount = mvpOverview ? (mvpOverview.pendingJustifications || []).length : 0;
  const attentionSignalsCount = mvpOverview
    ? (mvpOverview.masteryAlerts || []).length +
      (mvpOverview.incidents || []).filter(i => i.status !== 'RESOLVED').length
    : kpis.atRiskStudents;

  const items = mvp01 && mvpOverview
    ? [
        {
          icon: <Users size={16} />,
          label: 'TURMAS NO ESCOPO',
          value: String(scopedClassesCount).padStart(2, '0'),
          color: '#10B981',
          note: mvpOverview.school?.name || 'Escopo atribuído',
        },
        {
          icon: <TrendingDown size={16} />,
          label: 'SINAIS NO RADAR',
          value: String(attentionSignalsCount).padStart(2, '0'),
          color: '#F59E0B',
          note: 'Acompanhamento pedagógico (sem rótulo clínico)',
        },
        {
          icon: <AlertTriangle size={16} />,
          label: 'OCORRÊNCIAS ABERTAS',
          value: String(openIncidentsCount).padStart(2, '0'),
          color: '#EF4444',
          note: 'Nota interna separada da família',
        },
        {
          icon: <Clock size={16} />,
          label: 'JUSTIFICATIVAS PENDENTES',
          value: String(pendingJustCount).padStart(2, '0'),
          color: '#00F0FF',
          note: 'Aguardando aprovação/rejeição',
        },
      ]
    : [
        {
          icon: <Users size={16} />,
          label: 'FREQUÊNCIA HOJE',
          value: `${kpis.attendanceRate}%`,
          color: kpis.attendanceRate < 75 ? '#EF4444' : '#10B981',
          note: 'Meta institucional: 92%',
        },
        {
          icon: <TrendingDown size={16} />,
          label: 'ALUNOS EM ATENÇÃO',
          value: String(kpis.atRiskStudents).padStart(2, '0'),
          color: '#F59E0B',
          note: 'Radar de atenção pedagógica',
        },
        {
          icon: <AlertTriangle size={16} />,
          label: 'OCORRÊNCIAS ABERTAS',
          value: String(kpis.openIncidents).padStart(2, '0'),
          color: '#EF4444',
          note: 'Aguardando parecer',
        },
        {
          icon: <BookOpen size={16} />,
          label: 'MÉDIA ACADÊMICA',
          value: kpis.avgGrade.toFixed(1),
          color: '#00F0FF',
          note: 'Consolidado institucional',
        },
      ];

  return (
    <div className="coord-top-strip">
      <div className="coord-Command-bar">
        <div className="coord-cmd-left">
          <span className="coord-cmd-badge">
            {mvp01 ? 'MVP 0.1 • COORDENAÇÃO' : 'COCKPIT COORDENAÇÃO'}
          </span>
          <span className="coord-cmd-title">
            {mvp01
              ? 'Escopo de Turmas, Ocorrências, Justificativas & Radar de Atenção Precoce'
              : 'Supervisão Docente, Grade & Retenção'}
          </span>
        </div>
        <div className="coord-cmd-actions">
          {mvp01 && mvpContext && mvpContext.availableMemberships.length > 1 && (
            <select
              aria-label="Alternar papel institucional"
              className="coord-cmd-btn"
              value={mvpContext.membershipId}
              onChange={e => onSwitchMembership(e.target.value)}
            >
              {mvpContext.availableMemberships.map(m => (
                <option key={m.membershipId} value={m.membershipId} style={{ background: '#0f172a' }}>
                  Papel: {formatRoleLabel(m.role)}
                </option>
              ))}
            </select>
          )}
          {mvp01 ? (
            <>
              <button className="coord-cmd-btn primary" onClick={() => onNavigate('reports-hub')}>
                <FileText size={13} />
                <span>Boletins & Relatórios</span>
              </button>
              <button className="coord-cmd-btn primary" onClick={() => onNavigate('calendar')}>
                <Calendar size={13} />
                <span>Calendário Letivo</span>
              </button>
              <button className="coord-cmd-btn" onClick={() => onNavigate('timetable')}>
                <Clock size={13} />
                <span>Grade Horária Áquila</span>
              </button>
              <button className="coord-cmd-btn" onClick={() => onNavigate('attendance')}>
                <Users size={13} />
                <span>Chamada / Frequência</span>
              </button>
              <button className="coord-cmd-btn" onClick={() => onNavigate('seating-intelligence')}>
                <LayoutGrid size={13} />
                <span>Mapa de Salas</span>
              </button>
              <button className="coord-cmd-btn" onClick={() => onNavigate('students')}>
                <BookOpen size={13} />
                <span>Alunos & Fichas</span>
              </button>
            </>
          ) : (
            <>
              <button className="coord-cmd-btn primary" onClick={() => onNavigate('timetable')}>
                <Clock size={13} />
                <span>Grade Horária Áquila</span>
              </button>
              <button className="coord-cmd-btn primary" onClick={() => onNavigate('exam-foundry')}>
                <Printer size={13} />
                <span>Gerador de Provas A4</span>
              </button>
              <button className="coord-cmd-btn primary" onClick={() => onNavigate('growth-agents')}>
                <Sparkles size={13} />
                <span>Agentes & Autoridade</span>
              </button>
              <button className="coord-cmd-btn" onClick={() => onNavigate('seating-intelligence')}>
                <LayoutGrid size={13} />
                <span>Mapa de Salas IA</span>
              </button>
              <button className="coord-cmd-btn" onClick={() => onNavigate('calendar')}>
                <Calendar size={13} />
                <span>Calendário</span>
              </button>
              <button className="coord-cmd-btn" onClick={() => onNavigate('reports-hub')}>
                <FileText size={13} />
                <span>Laudos & Relatórios</span>
              </button>
              <button className="coord-cmd-btn" onClick={() => onNavigate('mastery-chamber')}>
                <Sparkles size={13} />
                <span>Câmara ENEM</span>
              </button>
              <button className="coord-cmd-btn" onClick={() => onNavigate('bncc-heatmap')}>
                <Flame size={13} />
                <span>Mapa de Calor BNCC</span>
              </button>
            </>
          )}
        </div>
      </div>

      <div className="coord-kpi-bar">
        {items.map((item, i) => (
          <div key={i} className="coord-kpi-card">
            <div className="coord-kpi-body">
              <span className="coord-kpi-label">{item.label}</span>
              <span className="coord-kpi-value" style={{ color: item.color }}>{item.value}</span>
              <span className="coord-kpi-note">{item.note}</span>
            </div>
            <div className="coord-kpi-icon" style={{ color: item.color, background: `${item.color}18` }}>
              {item.icon}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// WORKSPACE MVP 0.1 DA COORDENAÇÃO
// ============================================================================

interface WorkspaceProps {
  overview: CoordOverviewData | null;
  context: Mvp01ContextData | null;
  mvpError: string | null;
  selectedClassScope: string;
  setSelectedClassScope: (v: string) => void;
  onRefresh: () => Promise<void>;
  onBack: () => void;
}

const Mvp01CoordinationWorkspace: React.FC<WorkspaceProps> = ({
  overview,
  context,
  mvpError,
  selectedClassScope,
  setSelectedClassScope,
  onRefresh,
  onBack,
}) => {
  const [subTab, setSubTab] = useState<'ocorrencias' | 'radar' | 'gestao'>('ocorrencias');
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // Nova ocorrência
  const [incStudentId, setIncStudentId] = useState('student-demo-1');
  const [incClassId, setIncClassId] = useState('');
  const [incCategory, setIncCategory] = useState<'PEDAGOGICAL' | 'DISCIPLINARY' | 'HEALTH_CARE' | 'PRAISE'>('PEDAGOGICAL');
  const [incTitle, setIncTitle] = useState('');
  const [incInternalNotes, setIncInternalNotes] = useState('');
  const [incPublishedSummary, setIncPublishedSummary] = useState('');
  const [incPublishNow, setIncPublishNow] = useState(false);
  const [incResponsible, setIncResponsible] = useState(context?.userId || 'user-demo-coord');
  const [incDueDate, setIncDueDate] = useState('');

  // Edições por ocorrência (publicação / resolução)
  const [publishDrafts, setPublishDrafts] = useState<Record<string, string>>({});
  const [resolutionDrafts, setResolutionDrafts] = useState<Record<string, string>>({});
  const [justReviewNotes, setJustReviewNotes] = useState<Record<string, string>>({});

  // Ações adotadas no Radar de Atenção Precoce (por sinal)
  const [radarActions, setRadarActions] = useState<Record<string, string>>({});

  const scopedClasses = overview?.classes || [];
  const visibleIncidents = useMemo(() => {
    const list = overview?.incidents || [];
    if (selectedClassScope === 'ALL') return list;
    return list.filter(i => i.class_id === selectedClassScope || !i.class_id);
  }, [overview?.incidents, selectedClassScope]);

  const pendingJustifications = overview?.pendingJustifications || [];
  const currentPeriodName =
    (overview?.academicPeriods || []).find(p => p.status === 'OPEN')?.name || 'Período Letivo Corrente';

  // Monta lista de sinais de Atenção Precoce sem diagnóstico clínico nem rótulo permanente
  const earlyAttentionSignals = useMemo(() => {
    const signals: Array<{
      id: string;
      studentId: string;
      signalObserved: string;
      period: string;
      originRecords: string;
      ruleApplied: string;
      reviewer: string;
      defaultAction: string;
    }> = [];

    for (const m of overview?.masteryAlerts || []) {
      const answered = Number(m.questions_answered ?? 0);
      const independent = Number(m.independent_correct ?? 0);
      const hints = Number(m.hints_used ?? 0);
      const pct = answered > 0 ? Math.round((independent / answered) * 100) : 0;
      signals.push({
        id: `rad-m-${m.id}`,
        studentId: m.student_id,
        signalObserved: `Sinal pedagógico em ${m.subject} (${m.skill_name || m.skill_code}): ${pct}% de acerto independente (${hints} dica(s))`,
        period: currentPeriodName,
        originRecords: `Estudante ${m.student_id} • Sessões de prática (${answered} questões, nível estimado ${m.estimated_level || 'em revisão'})`,
        ruleApplied: 'Solicitada revisão pedagógica docente (needs_teacher_review = 1) com baixa autonomia recente',
        reviewer: 'Coordenação Pedagógica + Docente da Disciplina',
        defaultAction: 'Planejar retomada guiada em sala e acompanhar evolução na próxima atividade',
      });
    }

    for (const inc of visibleIncidents.filter(i => i.status !== 'RESOLVED')) {
      signals.push({
        id: `rad-i-${inc.id}`,
        studentId: inc.student_id,
        signalObserved: `Acompanhamento aberto (${inc.category}): ${inc.title}`,
        period: currentPeriodName,
        originRecords: `Registro de atendimento ${inc.id} • Estudante ${inc.student_id} (${inc.class_id || 'Escopo geral'})`,
        ruleApplied: 'Ocorrência pedagógica/cuidado ainda sem conclusão (status != RESOLVED)',
        reviewer: inc.responsible_user_id || 'Coordenação Pedagógica',
        defaultAction: 'Realizar devolutiva estruturada com docente e família quando aplicável',
      });
    }

    for (const j of pendingJustifications) {
      signals.push({
        id: `rad-j-${j.id}`,
        studentId: j.student_id,
        signalObserved: `Justificativa de ausência pendente de análise em ${j.absence_date}`,
        period: currentPeriodName,
        originRecords: `Justificativa ${j.id} • Estudante ${j.student_name || j.student_id}`,
        ruleApplied: 'Ausência justificada pela família aguardando conferência da Coordenação',
        reviewer: 'Coordenação Pedagógica',
        defaultAction: 'Analisar comprovante e deferir ou solicitar complementação',
      });
    }

    return signals;
  }, [overview?.masteryAlerts, visibleIncidents, pendingJustifications, currentPeriodName]);

  useEffect(() => {
    if (!incClassId && scopedClasses[0]?.id) {
      setIncClassId(scopedClasses[0].id);
    }
  }, [scopedClasses, incClassId]);

  const handleCreateIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    if (!incStudentId.trim() || !incTitle.trim()) return;
    if (incPublishNow && incPublishedSummary.trim().length < 3) {
      setFeedback({
        type: 'err',
        text: 'Para publicar imediatamente à família, preencha o Resumo Publicável à Família (mín. 3 caracteres).',
      });
      return;
    }

    const res = await invokeMvp01('createIncident', {
      studentId: incStudentId.trim(),
      classId: incClassId || null,
      category: incCategory,
      title: incTitle.trim(),
      internalNotes: incInternalNotes.trim() || null,
      publishedSummary: incPublishedSummary.trim() || null,
      publishedToFamily: incPublishNow,
      responsibleUserId: incResponsible.trim() || undefined,
      dueDate: incDueDate || undefined,
    });

    if (!res.ok) {
      setFeedback({ type: 'err', text: res.error });
      return;
    }

    setIncTitle('');
    setIncInternalNotes('');
    setIncPublishedSummary('');
    setIncPublishNow(false);
    setFeedback({
      type: 'ok',
      text: `Ocorrência registrada (${res.data?.id}). Nota Interna permanece restrita à equipe.`,
    });
    await onRefresh();
  };

  const handlePublishToFamily = async (incident: any) => {
    const summary = (publishDrafts[incident.id] ?? incident.published_summary ?? '').trim();
    if (summary.length < 3) {
      setFeedback({
        type: 'err',
        text: 'Informe um Resumo Publicável à Família (mín. 3 caracteres) antes de publicar.',
      });
      return;
    }
    setFeedback(null);
    const res = await invokeMvp01('publishIncidentToFamily', {
      incidentId: incident.id,
      publishedSummary: summary,
    });
    if (!res.ok) {
      setFeedback({ type: 'err', text: res.error });
      return;
    }
    setFeedback({
      type: 'ok',
      text: `Resumo público da ocorrência ${incident.id} enviado à família. A Nota Interna da Equipe continua oculta.`,
    });
    await onRefresh();
  };

  const handleResolveIncident = async (incidentId: string) => {
    const note = (resolutionDrafts[incidentId] || '').trim();
    if (note.length < 3) {
      setFeedback({ type: 'err', text: 'Informe a nota de resolução (mín. 3 caracteres).' });
      return;
    }
    setFeedback(null);
    const res = await invokeMvp01('resolveIncident', {
      incidentId,
      resolutionNote: note,
      status: 'RESOLVED',
    });
    if (!res.ok) {
      setFeedback({ type: 'err', text: res.error });
      return;
    }
    setResolutionDrafts(prev => ({ ...prev, [incidentId]: '' }));
    setFeedback({ type: 'ok', text: `Ocorrência ${incidentId} concluída.` });
    await onRefresh();
  };

  const handleReviewJustification = async (
    justificationId: string,
    decision: 'APPROVED' | 'REJECTED'
  ) => {
    setFeedback(null);
    const res = await invokeMvp01('reviewAbsenceJustification', {
      justificationId,
      decision,
      reviewNote: (justReviewNotes[justificationId] || '').trim() || undefined,
    });
    if (!res.ok) {
      setFeedback({ type: 'err', text: res.error });
      return;
    }
    setFeedback({
      type: 'ok',
      text: `Justificativa ${justificationId} marcada como ${decision === 'APPROVED' ? 'APROVADA' : 'REJEITADA'}.`,
    });
    await onRefresh();
  };

  return (
    <div className="flex flex-col gap-3 animate-fade-in">
      {mvpError && (
        <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 flex items-center justify-between">
          <span>Aviso MVP 0.1: {mvpError}</span>
          <button type="button" onClick={onRefresh} className="coord-cmd-btn">
            Recarregar
          </button>
        </div>
      )}

      {feedback && (
        <div
          className={`p-3 rounded-xl text-xs border ${
            feedback.type === 'ok'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-red-500/10 border-red-500/30 text-red-300'
          }`}
        >
          {feedback.text}
        </div>
      )}

      {/* Barra de Turmas do Escopo Atribuído + Sub-abas */}
      <div className="bg-slate-900/70 border border-white/10 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setSubTab('ocorrencias')}
            className={`coord-cmd-btn ${subTab === 'ocorrencias' ? 'primary' : ''}`}
          >
            <ShieldAlert size={13} />
            <span>Ocorrências &amp; Justificativas ({visibleIncidents.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setSubTab('radar')}
            className={`coord-cmd-btn ${subTab === 'radar' ? 'primary' : ''}`}
          >
            <Eye size={13} />
            <span>Radar de Atenção Precoce ({earlyAttentionSignals.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setSubTab('gestao')}
            className={`coord-cmd-btn ${subTab === 'gestao' ? 'primary' : ''}`}
          >
            <LayoutGrid size={13} />
            <span>Gestão Estrutural</span>
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">Turmas do meu escopo:</span>
          <select
            value={selectedClassScope}
            onChange={e => setSelectedClassScope(e.target.value)}
            className="bg-slate-950 border border-white/15 rounded-lg px-2.5 py-1 text-white"
          >
            <option value="ALL">Todas do Escopo ({scopedClasses.length})</option>
            {scopedClasses.map(c => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.stage || 'Etapa'})
              </option>
            ))}
          </select>
        </div>
      </div>

      {subTab === 'gestao' && <CoordinationManagement onBack={onBack} />}

      {subTab === 'ocorrencias' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Formulário Nova Ocorrência (Segregação estrita Nota Interna vs Resumo à Família) */}
          <form
            onSubmit={handleCreateIncident}
            className="bg-slate-900/75 border border-white/10 rounded-2xl p-4 flex flex-col gap-3"
          >
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Plus size={15} className="text-amber-400" />
              Registrar Ocorrência / Atendimento
            </h3>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">ID do Estudante *</label>
                <input
                  type="text"
                  required
                  value={incStudentId}
                  onChange={e => setIncStudentId(e.target.value)}
                  placeholder="Ex: student-demo-1"
                  className="w-full bg-slate-950 border border-white/15 rounded-lg px-2.5 py-1.5 text-white"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Turma (Escopo)</label>
                <select
                  value={incClassId}
                  onChange={e => setIncClassId(e.target.value)}
                  className="w-full bg-slate-950 border border-white/15 rounded-lg px-2.5 py-1.5 text-white"
                >
                  <option value="">Escopo Geral</option>
                  {scopedClasses.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Categoria</label>
                <select
                  value={incCategory}
                  onChange={e => setIncCategory(e.target.value as any)}
                  className="w-full bg-slate-950 border border-white/15 rounded-lg px-2.5 py-1.5 text-white"
                >
                  <option value="PEDAGOGICAL">Pedagógica</option>
                  <option value="DISCIPLINARY">Convivência / Disciplinar</option>
                  <option value="HEALTH_CARE">Cuidado / Saúde Escolar</option>
                  <option value="PRAISE">Elogio / Destaque</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Prazo de Retorno</label>
                <input
                  type="date"
                  value={incDueDate}
                  onChange={e => setIncDueDate(e.target.value)}
                  className="w-full bg-slate-950 border border-white/15 rounded-lg px-2.5 py-1.5 text-white"
                />
              </div>
            </div>

            <input
              type="text"
              required
              value={incTitle}
              onChange={e => setIncTitle(e.target.value)}
              placeholder="Título objetivo do atendimento *"
              className="w-full bg-slate-950 border border-white/15 rounded-lg px-3 py-2 text-xs text-white"
            />

            <input
              type="text"
              value={incResponsible}
              onChange={e => setIncResponsible(e.target.value)}
              placeholder="Responsável pelo acompanhamento"
              className="w-full bg-slate-950 border border-white/15 rounded-lg px-3 py-1.5 text-xs text-white"
            />

            {/* Campo 1: Nota Interna da Equipe */}
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-col gap-1.5">
              <span className="text-[11px] font-bold text-amber-300 flex items-center gap-1">
                <Lock size={12} /> Nota Interna da Equipe (Sigilosa — Nunca publicada à família)
              </span>
              <textarea
                rows={2}
                value={incInternalNotes}
                onChange={e => setIncInternalNotes(e.target.value)}
                placeholder="Contexto interno entre coordenação e docentes..."
                className="w-full bg-slate-950 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white"
              />
            </div>

            {/* Campo 2: Resumo Publicável à Família */}
            <div className="p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/30 flex flex-col gap-1.5">
              <span className="text-[11px] font-bold text-sky-300 flex items-center gap-1">
                <Send size={12} /> Resumo Publicável à Família (Linguagem objetiva)
              </span>
              <textarea
                rows={2}
                value={incPublishedSummary}
                onChange={e => setIncPublishedSummary(e.target.value)}
                placeholder="Texto claro que poderá ser enviado ao responsável..."
                className="w-full bg-slate-950 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white"
              />
              <label className="flex items-center gap-1.5 text-[11px] text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={incPublishNow}
                  onChange={e => setIncPublishNow(e.target.checked)}
                />
                <span>Publicar resumo à família imediatamente</span>
              </label>
            </div>

            <button
              type="submit"
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs py-2.5 px-4 rounded-xl"
            >
              Registrar Ocorrência
            </button>
          </form>

          {/* Lista de Ocorrências & Justificativas */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            {/* Justificativas de Falta Pendentes */}
            <section className="bg-slate-900/75 border border-white/10 rounded-2xl p-4 flex flex-col gap-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Clock size={15} className="text-cyan-400" />
                Justificativas de Falta Pendentes ({pendingJustifications.length})
              </h3>
              {pendingJustifications.length === 0 ? (
                <p className="text-xs text-slate-400">Nenhuma justificativa pendente de revisão.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {pendingJustifications.map(j => (
                    <div
                      key={j.id}
                      className="p-3 rounded-xl bg-slate-950/70 border border-white/10 flex flex-col gap-2 text-xs"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-bold text-white">
                          {j.student_name || j.student_id} — Falta em {j.absence_date}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                          {j.status}
                        </span>
                      </div>
                      <p className="text-slate-300">Motivo informado: {j.reason}</p>
                      {j.attachment_name && (
                        <span className="text-[11px] text-cyan-300">Anexo: {j.attachment_name}</span>
                      )}
                      <div className="flex flex-wrap items-center gap-2">
                        <input
                          type="text"
                          value={justReviewNotes[j.id] || ''}
                          onChange={e =>
                            setJustReviewNotes(prev => ({ ...prev, [j.id]: e.target.value }))
                          }
                          placeholder="Observação da coordenação (opcional)"
                          className="flex-1 bg-black/50 border border-white/15 rounded-lg px-2.5 py-1 text-xs text-white"
                        />
                        <button
                          type="button"
                          onClick={() => handleReviewJustification(j.id, 'APPROVED')}
                          className="coord-cmd-btn"
                          style={{ borderColor: '#10b981', color: '#34d399' }}
                        >
                          <Check size={12} /> Aprovar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReviewJustification(j.id, 'REJECTED')}
                          className="coord-cmd-btn"
                          style={{ borderColor: '#ef4444', color: '#fca5a5' }}
                        >
                          <X size={12} /> Rejeitar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Ocorrências no Escopo */}
            <section className="bg-slate-900/75 border border-white/10 rounded-2xl p-4 flex flex-col gap-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldAlert size={15} className="text-amber-400" />
                Ocorrências &amp; Atendimentos do Escopo ({visibleIncidents.length})
              </h3>
              {visibleIncidents.length === 0 ? (
                <p className="text-xs text-slate-400">Nenhuma ocorrência registrada para as turmas do escopo.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {visibleIncidents.map(inc => {
                    const pubDraft = publishDrafts[inc.id] ?? inc.published_summary ?? '';
                    return (
                      <div
                        key={inc.id}
                        className="p-3.5 rounded-xl bg-slate-950/75 border border-white/10 flex flex-col gap-2 text-xs"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <span className="font-bold text-white text-sm">{inc.title}</span>
                            <div className="text-[11px] text-slate-400">
                              Estudante: {inc.student_id} • Turma: {inc.class_id || 'Geral'} • Responsável: {inc.responsible_user_id || 'Coordenação'} • Prazo: {inc.due_date || 'Sem prazo'}
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded bg-white/10 text-slate-200 text-[10px] font-bold">
                              {inc.category}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                inc.status === 'RESOLVED'
                                  ? 'bg-emerald-500/20 text-emerald-300'
                                  : 'bg-amber-500/20 text-amber-300'
                              }`}
                            >
                              {inc.status}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/25">
                            <div className="text-[10px] font-bold text-amber-300 uppercase mb-1 flex items-center gap-1">
                              <Lock size={11} /> Nota Interna da Equipe
                            </div>
                            <p className="text-slate-200">
                              {inc.internal_notes || 'Sem anotações internas registradas.'}
                            </p>
                          </div>

                          <div className="p-2.5 rounded-lg bg-sky-500/10 border border-sky-500/25 flex flex-col gap-1.5">
                            <div className="text-[10px] font-bold text-sky-300 uppercase flex items-center justify-between">
                              <span>Resumo Publicável à Família</span>
                              <span>{inc.published_to_family === 1 ? 'PUBLICADO' : 'NÃO PUBLICADO'}</span>
                            </div>
                            <textarea
                              rows={2}
                              value={pubDraft}
                              onChange={e =>
                                setPublishDrafts(prev => ({ ...prev, [inc.id]: e.target.value }))
                              }
                              placeholder="Redija o resumo seguro para a família..."
                              className="w-full bg-black/50 border border-white/10 rounded px-2 py-1 text-xs text-white"
                            />
                            <button
                              type="button"
                              onClick={() => handlePublishToFamily(inc)}
                              className="coord-cmd-btn primary"
                              style={{ alignSelf: 'flex-start' }}
                            >
                              <Send size={11} /> Publicar à Família
                            </button>
                          </div>
                        </div>

                        {inc.status !== 'RESOLVED' ? (
                          <div className="flex flex-wrap items-center gap-2 pt-1">
                            <input
                              type="text"
                              value={resolutionDrafts[inc.id] || ''}
                              onChange={e =>
                                setResolutionDrafts(prev => ({ ...prev, [inc.id]: e.target.value }))
                              }
                              placeholder="Nota de encaminhamento/resolução (mín. 3 chars)..."
                              className="flex-1 bg-black/50 border border-white/15 rounded-lg px-2.5 py-1 text-xs text-white"
                            />
                            <button
                              type="button"
                              onClick={() => handleResolveIncident(inc.id)}
                              className="coord-cmd-btn"
                              style={{ borderColor: '#10b981', color: '#34d399' }}
                            >
                              <CheckCircle2 size={12} /> Concluir Atendimento
                            </button>
                          </div>
                        ) : (
                          <div className="text-[11px] text-emerald-300">
                            Resolução registrada: {inc.resolution_note}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        </div>
      )}

      {subTab === 'radar' && (
        <section className="bg-slate-900/75 border border-white/10 rounded-2xl p-4 flex flex-col gap-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Eye size={17} className="text-amber-400" />
              Radar de Atenção Precoce (Sinais Pedagógicos Auditáveis)
            </h3>
            <p className="text-xs text-slate-400">
              Indicadores estritamente pedagógicos para revisão humana. Não realiza diagnóstico clínico nem atribui rótulo permanente aos estudantes.
            </p>
          </div>

          {earlyAttentionSignals.length === 0 ? (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-xs text-emerald-300">
              Nenhum sinal de atenção pedagógica pendente para as turmas do escopo no momento.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-white/10 text-slate-400 uppercase text-[10px]">
                    <th className="py-2 pr-3">Sinal observado</th>
                    <th className="py-2 pr-3">Período</th>
                    <th className="py-2 pr-3">Registros de origem</th>
                    <th className="py-2 pr-3">Regra aplicada</th>
                    <th className="py-2 pr-3">Responsável pela revisão</th>
                    <th className="py-2">Ação adotada</th>
                  </tr>
                </thead>
                <tbody>
                  {earlyAttentionSignals.map(sig => (
                    <tr key={sig.id} className="border-b border-white/5 align-top">
                      <td className="py-2.5 pr-3 font-semibold text-white">{sig.signalObserved}</td>
                      <td className="py-2.5 pr-3 text-slate-300 whitespace-nowrap">{sig.period}</td>
                      <td className="py-2.5 pr-3 text-slate-300">{sig.originRecords}</td>
                      <td className="py-2.5 pr-3 text-amber-200">{sig.ruleApplied}</td>
                      <td className="py-2.5 pr-3 text-emerald-300">{sig.reviewer}</td>
                      <td className="py-2.5 min-w-[220px]">
                        <input
                          type="text"
                          value={radarActions[sig.id] ?? sig.defaultAction}
                          onChange={e =>
                            setRadarActions(prev => ({ ...prev, [sig.id]: e.target.value }))
                          }
                          className="w-full bg-black/50 border border-white/15 rounded-lg px-2.5 py-1.5 text-xs text-white"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  );
};

export default CoordinationPortal;
