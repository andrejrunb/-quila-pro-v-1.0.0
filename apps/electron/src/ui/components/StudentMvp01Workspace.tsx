import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  BookOpen,
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  Compass,
  FileCheck,
  GraduationCap,
  RefreshCw,
  ShieldAlert,
  UserCheck,
} from 'lucide-react';
import { StudentDomainTrails, MasteryEstimateRecord } from './StudentDomainTrails';

type StudentMvpTab = 'meu-dia' | 'tarefas' | 'notas-freq' | 'trilhas';

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

interface MvpContextData {
  userId: string;
  schoolId: string;
  membershipId: string;
  activeRole: string;
  availableMemberships: MvpMembershipSummary[];
  ownStudentId?: string | null;
}

interface StudentGradeRow {
  id: string;
  subject: string;
  period_id: string;
  n1: number | null;
  n2: number | null;
  n3: number | null;
  recovery: number | null;
  entry_state: 'PENDING' | 'GRADED' | 'EXEMPT' | string;
  final_average: number | null;
}

interface StudentAttendanceRow {
  id: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'JUSTIFIED' | string;
  subject: string;
  lesson_date: string;
}

interface StudentTaskRow {
  id: string;
  school_id: string;
  class_id: string;
  subject: string | null;
  title: string;
  description: string | null;
  due_date: string | null;
  created_at: string;
  completed: number;
}

interface AcademicPeriodRow {
  id: string;
  name: string;
  start_date: string | null;
  end_date: string | null;
  status: 'OPEN' | 'CLOSED' | string;
}

interface StudentOverviewPayload {
  portal: 'student';
  school: { id: string; name: string; city?: string; state?: string } | null;
  academicPeriods: AcademicPeriodRow[];
  student: {
    id: string;
    full_name: string;
    registration_code: string | null;
    photo_url: string | null;
    class_id: string | null;
    class_name: string | null;
  } | null;
  grades: StudentGradeRow[];
  attendance: StudentAttendanceRow[];
  tasks: StudentTaskRow[];
  masteryEstimates: MasteryEstimateRecord[];
}

export interface StudentMvp01WorkspaceProps {
  studentId?: string;
  onNavigate?: (page: string) => void;
}

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador',
  director: 'Direção (Leitura)',
  diretoria: 'Direção (Leitura)',
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

function formatDatePtBr(raw?: string | null): string {
  if (!raw) return 'Data não informada';
  const isoDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(raw);
  const parsed = isoDateOnly ? new Date(`${raw}T12:00:00`) : new Date(raw);
  if (Number.isNaN(parsed.getTime())) return raw;
  return parsed.toLocaleDateString('pt-BR');
}

function formatScoreCell(val: number | null | undefined): string {
  if (val === null || val === undefined || Number.isNaN(Number(val))) return '—';
  return Number(val).toFixed(1);
}

function formatAttendanceStatus(status: string): { label: string; color: string; bg: string } {
  switch (status) {
    case 'PRESENT':
      return { label: 'Presente', color: '#34D399', bg: 'rgba(16, 185, 129, 0.16)' };
    case 'LATE':
      return { label: 'Atraso', color: '#FBBF24', bg: 'rgba(245, 158, 11, 0.16)' };
    case 'JUSTIFIED':
      return { label: 'Falta Justificada', color: '#38BDF8', bg: 'rgba(56, 189, 248, 0.16)' };
    case 'ABSENT':
      return { label: 'Falta', color: '#F87171', bg: 'rgba(239, 68, 68, 0.16)' };
    default:
      return { label: status, color: '#CBD5E1', bg: 'rgba(148, 163, 184, 0.14)' };
  }
}

export const StudentMvp01Workspace: React.FC<StudentMvp01WorkspaceProps> = ({ studentId }) => {
  const [activeTab, setActiveTab] = useState<StudentMvpTab>('meu-dia');
  const [contextData, setContextData] = useState<MvpContextData | null>(null);
  const [overview, setOverview] = useState<StudentOverviewPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [taskActionError, setTaskActionError] = useState<string | null>(null);
  const [togglingTaskId, setTogglingTaskId] = useState<string | null>(null);
  const [switchingMembership, setSwitchingMembership] = useState(false);

  const loadWorkspace = useCallback(async () => {
    setLoading(true);
    setAuthError(null);
    setTaskActionError(null);
    try {
      const mvpApi = (window as any).aquila?.mvp01;
      if (!mvpApi?.getPortalOverview) {
        setOverview(null);
        setAuthError('Núcleo MVP 0.1 indisponível neste ambiente.');
        return;
      }

      const ctxRes = await mvpApi.getContext?.();
      const ctx: MvpContextData | null = ctxRes?.success ? ctxRes.data : null;
      setContextData(ctx);

      const safePreviewStudentId =
        ctx?.activeRole?.toLowerCase() === 'admin' && studentId && studentId.startsWith('student-')
          ? studentId
          : undefined;

      const overviewRes = await mvpApi.getPortalOverview({
        portal: 'student',
        ...(safePreviewStudentId ? { studentId: safePreviewStudentId } : {}),
      });

      if (!overviewRes?.success) {
        setOverview(null);
        setAuthError(overviewRes?.error || 'Acesso não autorizado ao Portal do Aluno.');
        return;
      }

      setOverview(overviewRes.data as StudentOverviewPayload);
    } catch {
      setOverview(null);
      setAuthError('Não foi possível carregar os dados autorizados do estudante.');
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    loadWorkspace();
  }, [loadWorkspace]);

  const handleSwitchContext = async (membershipId: string) => {
    const mvpApi = (window as any).aquila?.mvp01;
    if (!mvpApi?.switchContext || !membershipId) return;
    setSwitchingMembership(true);
    try {
      const res = await mvpApi.switchContext({ membershipId });
      if (!res?.success) {
        setAuthError(res?.error || 'Não foi possível alternar o vínculo.');
        return;
      }
      await loadWorkspace();
    } finally {
      setSwitchingMembership(false);
    }
  };

  const handleToggleTask = async (task: StudentTaskRow) => {
    const student = overview?.student;
    const mvpApi = (window as any).aquila?.mvp01;
    if (!student || !mvpApi?.completeTask) return;

    const nextCompleted = task.completed !== 1;
    setTogglingTaskId(task.id);
    setTaskActionError(null);
    try {
      const res = await mvpApi.completeTask({
        taskId: task.id,
        studentId: student.id,
        completed: nextCompleted,
      });
      if (!res?.success) {
        setTaskActionError(res?.error || 'Não foi possível atualizar o checklist de tarefa.');
        return;
      }
      setOverview((prev) =>
        prev
          ? {
              ...prev,
              tasks: prev.tasks.map((t) =>
                t.id === task.id ? { ...t, completed: nextCompleted ? 1 : 0 } : t
              ),
            }
          : prev
      );
    } catch {
      setTaskActionError('Falha ao atualizar o checklist da tarefa.');
    } finally {
      setTogglingTaskId(null);
    }
  };

  const activeMemberships = useMemo(
    () => (contextData?.availableMemberships || []).filter((m) => m.status === 'ACTIVE'),
    [contextData]
  );

  const periodNameMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of overview?.academicPeriods || []) {
      map.set(p.id, p.name);
    }
    return map;
  }, [overview?.academicPeriods]);

  const attendanceSummary = useMemo(() => {
    const list = overview?.attendance || [];
    const total = list.length;
    const presentLike = list.filter((a) => ['PRESENT', 'LATE', 'JUSTIFIED'].includes(a.status)).length;
    const absent = list.filter((a) => a.status === 'ABSENT').length;
    const late = list.filter((a) => a.status === 'LATE').length;
    const justified = list.filter((a) => a.status === 'JUSTIFIED').length;
    const rate = total > 0 ? Number(((presentLike / total) * 100).toFixed(1)) : null;
    return { total, presentLike, absent, late, justified, rate };
  }, [overview?.attendance]);

  const dailySubjects = useMemo(() => {
    const set = new Set<string>();
    for (const t of overview?.tasks || []) {
      if (t.subject) set.add(t.subject);
    }
    for (const g of overview?.grades || []) {
      if (g.subject) set.add(g.subject);
    }
    for (const a of overview?.attendance || []) {
      if (a.subject) set.add(a.subject);
    }
    if (set.size === 0) {
      return ['Matemática', 'Língua Portuguesa', 'Ciências'];
    }
    return Array.from(set);
  }, [overview]);

  const student = overview?.student ?? null;
  const pendingTasks = (overview?.tasks || []).filter((t) => t.completed !== 1);
  const teacherReviewAlerts = (overview?.masteryEstimates || []).filter(
    (m) => m.needs_teacher_review === 1
  );

  const studentMembershipCandidate = activeMemberships.find((m) => {
    const r = m.role.toLowerCase();
    return r === 'student' || r === 'aluno';
  });

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        padding: '10px 12px',
        color: '#F8FAFC',
      }}
      data-testid="student-mvp01-workspace"
    >
      {/* Seletor de Contexto Multi-Papel se houver múltiplos vínculos ativos */}
      {activeMemberships.length > 1 && contextData && (
        <div
          style={{
            padding: '8px 12px',
            borderRadius: 8,
            background: 'rgba(139, 92, 246, 0.1)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 8,
          }}
        >
          <div style={{ fontSize: 12, color: '#E2E8F0' }}>
            <strong>Vínculo Ativo:</strong>{' '}
            {ROLE_LABELS[contextData.activeRole.toLowerCase()] || contextData.activeRole} • Trocar de vínculo recalcula
            estritamente as permissões sem herança entre papéis.
          </div>
          <select
            aria-label="Selecionar vínculo institucional"
            value={contextData.membershipId}
            disabled={switchingMembership}
            onChange={(e) => handleSwitchContext(e.target.value)}
            style={{
              minHeight: 34,
              padding: '4px 10px',
              borderRadius: 6,
              background: '#0F172A',
              border: '1px solid rgba(167, 139, 250, 0.4)',
              color: '#F8FAFC',
              fontSize: 12,
            }}
          >
            {activeMemberships.map((m) => (
              <option key={m.membershipId} value={m.membershipId}>
                {m.personName || m.userId} ({ROLE_LABELS[m.role.toLowerCase()] || m.role})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Cabeçalho do Aluno (MVP 0.1) */}
      <div
        style={{
          padding: '12px 14px',
          borderRadius: 10,
          background: 'rgba(15, 23, 42, 0.85)',
          border: '1px solid rgba(139, 92, 246, 0.28)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 8,
              background: 'rgba(139, 92, 246, 0.2)',
              border: '1px solid rgba(167, 139, 250, 0.45)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <GraduationCap size={20} color="#A78BFA" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#F8FAFC' }}>
                {loading ? 'Carregando perfil do estudante...' : student?.full_name || 'Portal do Aluno'}
              </h2>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  padding: '2px 7px',
                  borderRadius: 5,
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.35)',
                  color: '#34D399',
                }}
              >
                MVP 0.1 • ESTUDANTE
              </span>
            </div>
            <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>
              {student
                ? [
                    overview?.school?.name,
                    student.class_name ? `Turma ${student.class_name}` : null,
                    student.registration_code ? `Matrícula ${student.registration_code}` : null,
                  ]
                    .filter(Boolean)
                    .join(' • ')
                : 'Acesso estritamente restrito ao perfil do estudante autenticado'}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={loadWorkspace}
          disabled={loading}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 12px',
            borderRadius: 7,
            border: '1px solid rgba(148, 163, 184, 0.3)',
            background: 'rgba(15, 23, 42, 0.9)',
            color: '#E2E8F0',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <RefreshCw size={13} />
          <span>Atualizar</span>
        </button>
      </div>

      {/* Exatamente 4 Abas no MVP 0.1 */}
      <nav
        role="tablist"
        aria-label="Navegação do Portal do Aluno"
        data-testid="student-mvp01-tabs"
        style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}
      >
        {[
          { key: 'meu-dia' as const, label: 'Meu Dia', icon: <Clock size={14} /> },
          {
            key: 'tarefas' as const,
            label: `Tarefas & Agenda${pendingTasks.length > 0 ? ` (${pendingTasks.length})` : ''}`,
            icon: <CheckCircle2 size={14} />,
          },
          { key: 'notas-freq' as const, label: 'Notas & Frequência', icon: <FileCheck size={14} /> },
          { key: 'trilhas' as const, label: 'Trilhas de Domínio', icon: <Compass size={14} /> },
        ].map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              data-testid={`student-tab-${tab.key}`}
              onClick={() => setActiveTab(tab.key)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 14px',
                borderRadius: 8,
                fontSize: 12.5,
                fontWeight: 700,
                cursor: 'pointer',
                border: isActive ? '1px solid #8B5CF6' : '1px solid rgba(148, 163, 184, 0.2)',
                background: isActive ? 'rgba(139, 92, 246, 0.22)' : 'rgba(15, 23, 42, 0.78)',
                color: isActive ? '#EDE9FE' : '#94A3B8',
              }}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Estados de Erro / Sem Estudante Vinculado */}
      {authError ? (
        <div
          style={{
            padding: 18,
            borderRadius: 10,
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            color: '#FECACA',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
          data-testid="student-auth-notice"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ShieldAlert size={18} color="#F87171" />
            <strong>Acesso restrito</strong>
          </div>
          <p style={{ margin: 0, fontSize: 13 }}>{authError}</p>
          {studentMembershipCandidate && contextData?.membershipId !== studentMembershipCandidate.membershipId && (
            <div>
              <button
                type="button"
                onClick={() => handleSwitchContext(studentMembershipCandidate.membershipId)}
                style={{
                  padding: '7px 14px',
                  borderRadius: 7,
                  border: '1px solid #8B5CF6',
                  background: 'rgba(139, 92, 246, 0.28)',
                  color: '#FFFFFF',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Alternar para vínculo de Estudante
              </button>
            </div>
          )}
        </div>
      ) : loading ? (
        <div style={{ padding: 24, textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>
          Carregando dados do estudante...
        </div>
      ) : !student ? (
        <div
          style={{
            padding: 18,
            borderRadius: 10,
            background: 'rgba(15, 23, 42, 0.78)',
            border: '1px solid rgba(148, 163, 184, 0.25)',
            color: '#CBD5E1',
            fontSize: 13,
          }}
        >
          Nenhum perfil de estudante ativo está vinculado a esta sessão. Procure a Secretaria Escolar caso haja divergência.
        </div>
      ) : (
        <>
          {/* ABA 1: MEU DIA */}
          {activeTab === 'meu-dia' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
              {/* Horário / Aulas do Dia */}
              <section
                style={{
                  padding: 14,
                  borderRadius: 10,
                  background: 'rgba(15, 23, 42, 0.78)',
                  border: '1px solid rgba(148, 163, 184, 0.18)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <strong style={{ fontSize: 13.5, display: 'flex', alignItems: 'center', gap: 7 }}>
                    <BookOpen size={15} color="#38BDF8" />
                    <span>Horário & Disciplinas da Turma</span>
                  </strong>
                  <span style={{ fontSize: 11, color: '#94A3B8' }}>{student.class_name || 'Turma atual'}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {dailySubjects.map((subj, index) => (
                    <div
                      key={subj}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '8px 10px',
                        borderRadius: 7,
                        background: 'rgba(2, 6, 23, 0.5)',
                        border: '1px solid rgba(148, 163, 184, 0.12)',
                        fontSize: 12.5,
                      }}
                    >
                      <span style={{ fontWeight: 600, color: '#F8FAFC' }}>{subj}</span>
                      <span style={{ fontFamily: 'monospace', fontSize: 11.5, color: '#94A3B8' }}>
                        Bloco {index + 1}
                      </span>
                    </div>
                  ))}
                </div>
                <span style={{ fontSize: 11, color: '#94A3B8' }}>
                  Grade detalhada por horário é publicada pela Coordenação / Secretaria.
                </span>
              </section>

              {/* Próximas Entregas */}
              <section
                style={{
                  padding: 14,
                  borderRadius: 10,
                  background: 'rgba(15, 23, 42, 0.78)',
                  border: '1px solid rgba(148, 163, 184, 0.18)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <strong style={{ fontSize: 13.5, display: 'flex', alignItems: 'center', gap: 7 }}>
                    <Calendar size={15} color="#FBBF24" />
                    <span>Próximas Entregas</span>
                  </strong>
                  <button
                    type="button"
                    onClick={() => setActiveTab('tarefas')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#38BDF8',
                      fontSize: 11.5,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Ver todas →
                  </button>
                </div>

                {pendingTasks.length === 0 ? (
                  <div style={{ fontSize: 12.5, color: '#94A3B8' }}>
                    Nenhuma tarefa pendente no checklist no momento.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {pendingTasks.slice(0, 4).map((t) => (
                      <div
                        key={t.id}
                        style={{
                          padding: '8px 10px',
                          borderRadius: 7,
                          background: 'rgba(2, 6, 23, 0.5)',
                          border: '1px solid rgba(245, 158, 11, 0.25)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: 8,
                        }}
                      >
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 12.5, fontWeight: 700, color: '#F8FAFC' }}>{t.title}</div>
                          <div style={{ fontSize: 11, color: '#94A3B8' }}>{t.subject || 'Atividade'}</div>
                        </div>
                        <span style={{ fontSize: 11.5, color: '#FBBF24', whiteSpace: 'nowrap', fontWeight: 600 }}>
                          {formatDatePtBr(t.due_date)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Avisos Publicados & Acompanhamento */}
              <section
                style={{
                  padding: 14,
                  borderRadius: 10,
                  background: 'rgba(15, 23, 42, 0.78)',
                  border: '1px solid rgba(148, 163, 184, 0.18)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                }}
              >
                <strong style={{ fontSize: 13.5, display: 'flex', alignItems: 'center', gap: 7 }}>
                  <UserCheck size={15} color="#34D399" />
                  <span>Avisos & Períodos Letivos</span>
                </strong>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {(overview?.academicPeriods || []).map((p) => (
                    <div
                      key={p.id}
                      style={{
                        padding: '7px 10px',
                        borderRadius: 7,
                        background: 'rgba(2, 6, 23, 0.5)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: 12,
                      }}
                    >
                      <span>
                        <strong>{p.name}</strong> ({formatDatePtBr(p.start_date)} – {formatDatePtBr(p.end_date)})
                      </span>
                      <span
                        style={{
                          fontSize: 10.5,
                          fontWeight: 700,
                          color: p.status === 'OPEN' ? '#34D399' : '#94A3B8',
                        }}
                      >
                        {p.status === 'OPEN' ? 'Em andamento' : 'Encerrado'}
                      </span>
                    </div>
                  ))}
                </div>

                {teacherReviewAlerts.length > 0 && (
                  <div
                    style={{
                      padding: '8px 10px',
                      borderRadius: 8,
                      background: 'rgba(245, 158, 11, 0.12)',
                      border: '1px solid rgba(245, 158, 11, 0.35)',
                      fontSize: 12,
                      color: '#FDE68A',
                    }}
                  >
                    <strong>Encaminhamento ao professor:</strong> {teacherReviewAlerts.length} habilidade(s) na Trilha de
                    Domínio marcadas para revisão docente.
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setActiveTab('trilhas')}
                  style={{
                    marginTop: 'auto',
                    padding: '8px 12px',
                    borderRadius: 7,
                    border: '1px solid rgba(139, 92, 246, 0.5)',
                    background: 'rgba(139, 92, 246, 0.2)',
                    color: '#EDE9FE',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Abrir Trilhas de Domínio (Treino)
                </button>
              </section>
            </div>
          )}

          {/* ABA 2: TAREFAS & AGENDA */}
          {activeTab === 'tarefas' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: 9,
                  background: 'rgba(56, 189, 248, 0.1)',
                  border: '1px solid rgba(56, 189, 248, 0.35)',
                  color: '#E0F2FE',
                  fontSize: 12.5,
                }}
              >
                <strong>Organização de Estudos:</strong> Concluir o checklist nesta aba organiza o seu estudo e{' '}
                <strong>NÃO altera a nota oficial</strong> lançada pelo professor.
              </div>

              {taskActionError && (
                <div
                  style={{
                    padding: '8px 12px',
                    borderRadius: 8,
                    background: 'rgba(239, 68, 68, 0.14)',
                    border: '1px solid rgba(239, 68, 68, 0.35)',
                    color: '#FECACA',
                    fontSize: 12,
                  }}
                >
                  {taskActionError}
                </div>
              )}

              {(overview?.tasks || []).length === 0 ? (
                <div
                  style={{
                    padding: 16,
                    borderRadius: 10,
                    background: 'rgba(15, 23, 42, 0.78)',
                    border: '1px solid rgba(148, 163, 184, 0.18)',
                    color: '#94A3B8',
                    fontSize: 13,
                  }}
                >
                  Nenhuma tarefa atribuída para a sua turma no momento.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {(overview?.tasks || []).map((task) => {
                    const isDone = task.completed === 1;
                    const isBusy = togglingTaskId === task.id;
                    return (
                      <div
                        key={task.id}
                        style={{
                          padding: 12,
                          borderRadius: 10,
                          background: isDone ? 'rgba(16, 185, 129, 0.08)' : 'rgba(15, 23, 42, 0.78)',
                          border: isDone
                            ? '1px solid rgba(16, 185, 129, 0.32)'
                            : '1px solid rgba(148, 163, 184, 0.18)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: 12,
                          flexWrap: 'wrap',
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 220 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <span
                              style={{
                                fontSize: 10.5,
                                fontWeight: 700,
                                padding: '2px 7px',
                                borderRadius: 5,
                                background: 'rgba(139, 92, 246, 0.18)',
                                color: '#DDD6FE',
                              }}
                            >
                              {task.subject || 'Atividade'}
                            </span>
                            <span style={{ fontSize: 11.5, color: '#94A3B8' }}>
                              Entrega: {formatDatePtBr(task.due_date)}
                            </span>
                          </div>
                          <strong
                            style={{
                              fontSize: 13.5,
                              color: isDone ? '#A7F3D0' : '#F8FAFC',
                              textDecoration: isDone ? 'line-through' : 'none',
                            }}
                          >
                            {task.title}
                          </strong>
                          {task.description && (
                            <p style={{ margin: '4px 0 0 0', fontSize: 12, color: '#CBD5E1' }}>
                              {task.description}
                            </p>
                          )}
                        </div>

                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleToggleTask(task)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '7px 12px',
                            borderRadius: 7,
                            border: isDone
                              ? '1px solid rgba(16, 185, 129, 0.5)'
                              : '1px solid rgba(148, 163, 184, 0.35)',
                            background: isDone ? 'rgba(16, 185, 129, 0.2)' : 'rgba(2, 6, 23, 0.6)',
                            color: isDone ? '#6EE7B7' : '#F8FAFC',
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: isBusy ? 'wait' : 'pointer',
                          }}
                        >
                          {isDone ? <CheckCircle2 size={14} /> : <Circle size={14} />}
                          <span>{isBusy ? 'Salvando...' : isDone ? 'Concluída (Checklist)' : 'Marcar como Feita'}</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ABA 3: NOTAS & FREQUÊNCIA */}
          {activeTab === 'notas-freq' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: 9,
                  background: 'rgba(16, 185, 129, 0.09)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  color: '#D1FAE5',
                  fontSize: 12,
                }}
              >
                Exibindo exclusivamente suas <strong>notas publicadas</strong> pelo professor e seus{' '}
                <strong>registros próprios de frequência</strong> (sem gabaritos de avaliação e sem dados de outros
                estudantes).
              </div>

              {/* Notas Publicadas */}
              <section
                style={{
                  padding: 14,
                  borderRadius: 10,
                  background: 'rgba(15, 23, 42, 0.78)',
                  border: '1px solid rgba(148, 163, 184, 0.18)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                }}
              >
                <strong style={{ fontSize: 13.5, color: '#F8FAFC' }}>Notas Publicadas</strong>
                {(overview?.grades || []).length === 0 ? (
                  <div style={{ fontSize: 12.5, color: '#94A3B8' }}>
                    Nenhuma nota foi publicada até o momento.
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid rgba(148, 163, 184, 0.2)', color: '#94A3B8' }}>
                          <th style={{ textAlign: 'left', padding: '8px 10px' }}>Disciplina</th>
                          <th style={{ textAlign: 'left', padding: '8px 10px' }}>Período</th>
                          <th style={{ textAlign: 'center', padding: '8px 10px' }}>N1</th>
                          <th style={{ textAlign: 'center', padding: '8px 10px' }}>N2</th>
                          <th style={{ textAlign: 'center', padding: '8px 10px' }}>N3</th>
                          <th style={{ textAlign: 'center', padding: '8px 10px' }}>Rec.</th>
                          <th style={{ textAlign: 'center', padding: '8px 10px' }}>Situação / Média</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(overview?.grades || []).map((g) => {
                          const state = g.entry_state;
                          return (
                            <tr key={g.id} style={{ borderBottom: '1px solid rgba(148, 163, 184, 0.1)' }}>
                              <td style={{ padding: '8px 10px', fontWeight: 700, color: '#F8FAFC' }}>{g.subject}</td>
                              <td style={{ padding: '8px 10px', color: '#CBD5E1' }}>
                                {periodNameMap.get(g.period_id) || g.period_id}
                              </td>
                              <td style={{ padding: '8px 10px', textAlign: 'center', fontFamily: 'monospace' }}>
                                {formatScoreCell(g.n1)}
                              </td>
                              <td style={{ padding: '8px 10px', textAlign: 'center', fontFamily: 'monospace' }}>
                                {formatScoreCell(g.n2)}
                              </td>
                              <td style={{ padding: '8px 10px', textAlign: 'center', fontFamily: 'monospace' }}>
                                {formatScoreCell(g.n3)}
                              </td>
                              <td style={{ padding: '8px 10px', textAlign: 'center', fontFamily: 'monospace' }}>
                                {formatScoreCell(g.recovery)}
                              </td>
                              <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                                {state === 'PENDING' ? (
                                  <span
                                    style={{
                                      padding: '2px 8px',
                                      borderRadius: 5,
                                      background: 'rgba(245, 158, 11, 0.16)',
                                      color: '#FBBF24',
                                      fontWeight: 700,
                                      fontSize: 11.5,
                                    }}
                                  >
                                    Pendente
                                  </span>
                                ) : state === 'EXEMPT' ? (
                                  <span
                                    style={{
                                      padding: '2px 8px',
                                      borderRadius: 5,
                                      background: 'rgba(56, 189, 248, 0.16)',
                                      color: '#38BDF8',
                                      fontWeight: 700,
                                      fontSize: 11.5,
                                    }}
                                  >
                                    Dispensado
                                  </span>
                                ) : (
                                  <strong
                                    style={{
                                      fontFamily: 'monospace',
                                      fontSize: 13.5,
                                      color: (g.final_average ?? 0) >= 6 ? '#34D399' : '#F87171',
                                    }}
                                  >
                                    {formatScoreCell(g.final_average)}
                                  </strong>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              {/* Frequência Própria */}
              <section
                style={{
                  padding: 14,
                  borderRadius: 10,
                  background: 'rgba(15, 23, 42, 0.78)',
                  border: '1px solid rgba(148, 163, 184, 0.18)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                  <strong style={{ fontSize: 13.5, color: '#F8FAFC' }}>Frequência Própria</strong>
                  <span style={{ fontSize: 12, color: '#CBD5E1' }}>
                    Taxa apurada:{' '}
                    <strong
                      style={{
                        color:
                          attendanceSummary.rate === null
                            ? '#94A3B8'
                            : attendanceSummary.rate >= 75
                            ? '#34D399'
                            : '#F87171',
                      }}
                    >
                      {attendanceSummary.rate !== null ? `${attendanceSummary.rate}%` : 'Sem registros'}
                    </strong>{' '}
                    ({attendanceSummary.presentLike}/{attendanceSummary.total} aulas • {attendanceSummary.absent} falta(s))
                  </span>
                </div>

                {attendanceSummary.rate !== null && attendanceSummary.rate < 75 && (
                  <div
                    style={{
                      padding: '8px 10px',
                      borderRadius: 8,
                      background: 'rgba(239, 68, 68, 0.14)',
                      border: '1px solid rgba(239, 68, 68, 0.35)',
                      color: '#FECACA',
                      fontSize: 12,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <AlertTriangle size={14} color="#F87171" />
                    <span>Atenção: sua frequência está abaixo do mínimo legal de 75%.</span>
                  </div>
                )}

                {(overview?.attendance || []).length === 0 ? (
                  <div style={{ fontSize: 12.5, color: '#94A3B8' }}>
                    Nenhum registro de chamada encontrado até o momento.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {(overview?.attendance || []).map((att) => {
                      const badge = formatAttendanceStatus(att.status);
                      return (
                        <div
                          key={att.id}
                          style={{
                            padding: '7px 10px',
                            borderRadius: 7,
                            background: 'rgba(2, 6, 23, 0.5)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: 8,
                            fontSize: 12.5,
                          }}
                        >
                          <span>
                            <strong>{formatDatePtBr(att.lesson_date)}</strong> • {att.subject}
                          </span>
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: 5,
                              background: badge.bg,
                              color: badge.color,
                            }}
                          >
                            {badge.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            </div>
          )}

          {/* ABA 4: TRILHAS DE DOMÍNIO */}
          {activeTab === 'trilhas' && (
            <StudentDomainTrails
              studentId={student.id}
              masteryEstimates={overview?.masteryEstimates || []}
              onSessionRecorded={loadWorkspace}
            />
          )}
        </>
      )}
    </div>
  );
};

export default StudentMvp01Workspace;
