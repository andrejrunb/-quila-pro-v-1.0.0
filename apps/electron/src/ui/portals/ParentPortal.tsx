import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { PortalLayout } from '../layouts/PortalLayout';
import { isMvp01Active } from '../../config/mvpProfile';
import {
  User,
  Clock,
  BookOpen,
  DollarSign,
  MessageCircle,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Bell,
  Calendar,
  Shield,
  ShieldAlert,
  Brain,
  Smartphone,
  FileText,
  Award,
  Sparkles,
  Copy,
  QrCode,
  Check,
  X,
  Flame,
  Radio,
  Upload,
  RefreshCw,
  Edit3,
  Printer,
  Users,
} from 'lucide-react';
import { CommunityMarketplace } from '../pages/CommunityMarketplace';
import AcademicReportCard from '../components/AcademicReportCard';
import { MobileParentApp } from '../pages/MobileParentApp';
import { DINNER_CONVERSATION_SCRIPTS } from '../../services/PedagogicalTriScaffoldingBank';
import './ParentPortal.css';

interface ParentPortalProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  studentId?: string;
  sessionUser?: { id?: string; username?: string; name?: string; role?: string } | null;
}

interface AttendanceSummary {
  totalDays: number;
  presentDays: number;
  absences: number;
  lastEntry?: string;
  lastExit?: string;
}

interface GradeSummary {
  subject: string;
  average: number;
  previousAverage?: number;
  trend: 'up' | 'down' | 'stable';
}

interface FinancialSummary {
  status: 'adimplente' | 'pendente' | 'inadimplente';
  nextDueDate?: string;
  nextAmount?: number;
  overdueCount: number;
}

interface Notification {
  id: string;
  type: 'emergency' | 'academic' | 'financial' | 'general';
  title: string;
  body: string;
  sentAt: string;
  readAt?: string;
  sender: string;
}

// Tipos MVP 0.1 (núcleo compartilhado window.aquila.mvp01)
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
  authorizedStudentIds: string[];
}

interface MvpFamilyStudent {
  id: string;
  full_name: string;
  birth_date: string | null;
  registration_code: string | null;
  photo_url: string | null;
  pickup_notes: string | null;
  class_id: string | null;
  class_name: string | null;
}

interface MvpFamilyAttendanceRow {
  id: string;
  student_id: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'JUSTIFIED' | string;
  updated_at: string;
  subject: string;
  lesson_date: string;
}

interface MvpFamilyGradeRow {
  id: string;
  student_id: string;
  class_id: string;
  subject: string;
  period_id: string;
  n1: number | null;
  n2: number | null;
  n3: number | null;
  recovery: number | null;
  entry_state: 'PENDING' | 'GRADED' | 'EXEMPT' | string;
  final_average: number | null;
  updated_at: string;
}

interface MvpFamilyIncidentRow {
  id: string;
  student_id: string;
  class_id: string | null;
  category: 'DISCIPLINARY' | 'PEDAGOGICAL' | 'HEALTH_CARE' | 'PRAISE' | string;
  title: string;
  published_summary: string | null;
  status: string;
  family_ack_at: string | null;
  family_ack_by: string | null;
  created_at: string;
}

interface MvpFamilyCommunicationRow {
  id: string;
  title: string;
  body: string;
  target_scope: string;
  target_class_id: string | null;
  target_student_id: string | null;
  requires_authorization: number;
  authorization_version: number;
  published_at: string;
}

interface MvpFamilyReceiptRow {
  id: string;
  communication_id: string;
  user_id: string;
  student_id: string;
  event_type: 'DELIVERED' | 'OPENED' | 'ACKNOWLEDGED' | 'AUTHORIZED' | 'DENIED';
  note: string | null;
  created_at: string;
}

interface MvpFamilyJustificationRow {
  id: string;
  student_id: string;
  absence_date: string;
  reason: string;
  attachment_name: string | null;
  attachment_size_bytes: number | null;
  status: 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | string;
  reviewed_by: string | null;
  review_note: string | null;
  reviewed_at: string | null;
  created_at: string;
}

interface MvpAcademicPeriodRow {
  id: string;
  name: string;
  start_date: string | null;
  end_date: string | null;
  status: string;
}

interface MvpFamilyOverviewPayload {
  portal: 'family';
  school: { id: string; name: string; city?: string; state?: string } | null;
  academicPeriods: MvpAcademicPeriodRow[];
  students: MvpFamilyStudent[];
  attendance: MvpFamilyAttendanceRow[];
  grades: MvpFamilyGradeRow[];
  incidents: MvpFamilyIncidentRow[];
  communications: MvpFamilyCommunicationRow[];
  receipts: MvpFamilyReceiptRow[];
  justifications: MvpFamilyJustificationRow[];
}

interface ProfileUpdateRequestItem {
  id: string;
  studentId: string;
  studentName: string;
  fieldLabel: string;
  newValue: string;
  note: string;
  status: 'Aguardando conferência da Secretaria';
  createdAt: string;
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

const JUSTIFICATION_STATUS_META: Record<
  string,
  { label: string; code: string; color: string; bg: string; border: string }
> = {
  PENDING_REVIEW: {
    label: 'Em análise pela escola',
    code: 'PENDING_REVIEW',
    color: '#FBBF24',
    bg: 'rgba(245, 158, 11, 0.16)',
    border: 'rgba(245, 158, 11, 0.4)',
  },
  APPROVED: {
    label: 'Aprovado',
    code: 'APPROVED',
    color: '#34D399',
    bg: 'rgba(16, 185, 129, 0.16)',
    border: 'rgba(16, 185, 129, 0.4)',
  },
  REJECTED: {
    label: 'Recusado',
    code: 'REJECTED',
    color: '#F87171',
    bg: 'rgba(239, 68, 68, 0.16)',
    border: 'rgba(239, 68, 68, 0.4)',
  },
};

const INCIDENT_CATEGORY_LABELS: Record<string, string> = {
  DISCIPLINARY: 'Disciplinar',
  PEDAGOGICAL: 'Pedagógica',
  HEALTH_CARE: 'Saúde & Cuidado',
  PRAISE: 'Elogio / Mérito',
};

const INCIDENT_STATUS_LABELS: Record<string, string> = {
  OPEN: 'Aberta',
  IN_PROGRESS: 'Em Andamento',
  RESOLVED: 'Resolvida',
};

const ATTENDANCE_STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  PRESENT: { label: 'Presente', color: '#34D399', bg: 'rgba(16, 185, 129, 0.16)' },
  LATE: { label: 'Atraso', color: '#FBBF24', bg: 'rgba(245, 158, 11, 0.16)' },
  JUSTIFIED: { label: 'Justificada', color: '#38BDF8', bg: 'rgba(56, 189, 248, 0.16)' },
  ABSENT: { label: 'Falta', color: '#F87171', bg: 'rgba(239, 68, 68, 0.16)' },
};

function formatDatePtBr(raw?: string | null): string {
  if (!raw) return '—';
  const isoDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(raw);
  const parsed = isoDateOnly ? new Date(`${raw}T12:00:00`) : new Date(raw);
  if (Number.isNaN(parsed.getTime())) return raw;
  return isoDateOnly
    ? parsed.toLocaleDateString('pt-BR')
    : parsed.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

function formatScoreValue(val: number | null | undefined): string {
  if (val === null || val === undefined || Number.isNaN(Number(val))) return '—';
  return Number(val).toFixed(1);
}

// Constantes legadas usadas exclusivamente quando !isMvp01Active()
const statusLabel: Record<string, string> = {
  adimplente: 'EM DIA',
  pendente: 'PENDENTE',
  inadimplente: 'EM ATRASO',
};

const statusColors: Record<string, string> = {
  adimplente: '#10B981',
  pendente: '#F59E0B',
  inadimplente: '#EF4444',
};

const typeColors: Record<string, string> = {
  emergency: '#EF4444',
  academic: '#3B82F6',
  financial: '#F59E0B',
  general: '#8B5CF6',
};

const typeLabels: Record<string, string> = {
  emergency: 'EMERGÊNCIA',
  academic: 'ACADÊMICO',
  financial: 'FINANCEIRO',
  general: 'GERAL',
};

const PILOT_FALLBACK_NAME = 'LUCAS PILOTO SILVA';
const PILOT_FALLBACK_META = {
  className: '1º ANO PILOTO',
  ra: 'PILOT-999',
  seatLabel: 'Fila 1 • Assento 1',
  teacher: 'Profa. Karine',
};
const PILOT_FALLBACK_ATTENDANCE: AttendanceSummary = {
  totalDays: 80,
  presentDays: 76,
  absences: 4,
  lastEntry: '07:14 • Portaria Principal',
  lastExit: '12:25 • Portaria Principal',
};
const PILOT_FALLBACK_GRADES: GradeSummary[] = [
  { subject: 'Matemática', average: 8.6, previousAverage: 7.9, trend: 'up' },
  { subject: 'Português', average: 9.1, previousAverage: 8.8, trend: 'up' },
  { subject: 'Física', average: 8.2, previousAverage: 8.0, trend: 'up' },
  { subject: 'Química', average: 7.8, previousAverage: 8.1, trend: 'down' },
  { subject: 'História', average: 9.4, previousAverage: 9.0, trend: 'up' },
  { subject: 'Biologia', average: 8.8, previousAverage: 8.5, trend: 'up' },
];
const PILOT_FALLBACK_FINANCIAL: FinancialSummary = {
  status: 'pendente',
  nextDueDate: '10/11/2026',
  nextAmount: 1280.0,
  overdueCount: 0,
};
const PILOT_FALLBACK_NOTIFICATIONS: Notification[] = [
  {
    id: 'notif-pilot-1',
    type: 'academic',
    title: 'Boletim Parcial do Bimestre Disponível',
    body: 'As notas parciais e o parecer pedagógico de acompanhamento já estão liberados para consulta da família.',
    sentAt: 'Hoje • 08:15',
    sender: 'Coordenação Pedagógica',
  },
  {
    id: 'notif-pilot-2',
    type: 'financial',
    title: 'Mensalidade Escolar • Cobrança PIX Disponível',
    body: 'A parcela mensal com vencimento em 10/11/2026 encontra-se disponível para consulta e pagamento via PIX.',
    sentAt: 'Ontem • 16:40',
    sender: 'Secretaria Financeira',
  },
  {
    id: 'notif-pilot-3',
    type: 'general',
    title: 'Mostra Científica & Reunião de Pais',
    body: 'Convidamos os responsáveis para a apresentação dos projetos de Ciências e Física na próxima sexta-feira às 18h30.',
    sentAt: '14/10/2026 • 14:10',
    sender: 'Profa. Karine • Regência',
  },
];
const PILOT_FALLBACK_OCCURRENCES = [
  {
    id: 'occ-pilot-1',
    date: '16/10/2026',
    time: '10:20',
    category: 'Acompanhamento Pedagógico',
    severity: 'Média',
    title: 'Orientação sobre Entrega de Lista de Exercícios (Física)',
    description:
      'Estudante apresentou dúvida pontual em Cinemática Escalar durante a aula prática e recebeu roteiro de reforço no Laboratório Áquila.',
    actionTaken: 'Encaminhamento de trilha adaptativa de revisão e notificação preventiva aos responsáveis.',
    signed: false,
  },
  {
    id: 'occ-pilot-2',
    date: '10/10/2026',
    time: '11:45',
    category: 'Mérito Acadêmico',
    severity: 'Positiva',
    title: 'Destaque na Atividade Colaborativa de Matemática',
    description:
      'Contribuiu ativamente na resolução dos desafios de lógica e apoiou os colegas da equipe na oficina bimestral.',
    actionTaken: 'Registro de mérito pedagógico no portfólio do estudante.',
    signed: true,
    signedAt: '10/10/2026 19:05 (Assinado Digitalmente • Hash SHA-256 / LGPD)',
  },
];

export const ParentPortal: React.FC<ParentPortalProps> = ({
  currentPage,
  onNavigate,
  studentId,
  sessionUser,
}) => {
  const mvp01 = isMvp01Active();

  const resolvedSessionUser = useMemo(() => {
    if (sessionUser) return sessionUser;
    try {
      const raw = sessionStorage.getItem('aquila_session_user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, [sessionUser]);

  const effectiveStudentId = studentId || (resolvedSessionUser as any)?.studentId || 'PILOT-999';
  const signerName = resolvedSessionUser?.name || resolvedSessionUser?.username || 'Responsável Legal';

  // Estados compartilhados / navegação
  const [activeTab, setActiveTab] = useState<
    | 'resumo'
    | 'neuro-rotina'
    | 'presenca'
    | 'notas'
    | 'financeiro'
    | 'marketplace'
    | 'mensagens'
    | 'ocorrencias'
    | 'conquistas'
  >('resumo');
  const [showBoletimModal, setShowBoletimModal] = useState(false);

  // =========================================================================
  // ESTADO MVP 0.1 (integração real com window.aquila.mvp01)
  // =========================================================================
  const [mvpContext, setMvpContext] = useState<MvpContextData | null>(null);
  const [mvpOverview, setMvpOverview] = useState<MvpFamilyOverviewPayload | null>(null);
  const [selectedChildId, setSelectedChildId] = useState<string>('');
  const [mvpLoading, setMvpLoading] = useState<boolean>(mvp01);
  const [mvpAuthError, setMvpAuthError] = useState<string | null>(null);
  const [switchingContext, setSwitchingContext] = useState(false);

  // Formulário de justificativa / atestado
  const [justDate, setJustDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [justReason, setJustReason] = useState<string>('');
  const [justAttachmentName, setJustAttachmentName] = useState<string>('');
  const [justAttachmentBytes, setJustAttachmentBytes] = useState<number | undefined>(undefined);
  const [submittingJust, setSubmittingJust] = useState(false);
  const [justFeedback, setJustFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // Ocorrências e comunicados (ações persistidas)
  const [ackingIncidentId, setAckingIncidentId] = useState<string | null>(null);
  const [incidentActionError, setIncidentActionError] = useState<string | null>(null);
  const [receiptActionBusyKey, setReceiptActionBusyKey] = useState<string | null>(null);
  const [receiptActionError, setReceiptActionError] = useState<string | null>(null);
  const [authNotesByComm, setAuthNotesByComm] = useState<Record<string, string>>({});

  // Solicitação de atualização cadastral (sujeita à Secretaria)
  const [updateFieldLabel, setUpdateFieldLabel] = useState('Telefone / WhatsApp');
  const [updateNewValue, setUpdateNewValue] = useState('');
  const [updateNote, setUpdateNote] = useState('');
  const [updateRequests, setUpdateRequests] = useState<ProfileUpdateRequestItem[]>([]);
  const [updateFeedback, setUpdateFeedback] = useState<string | null>(null);

  const loadMvp01FamilyData = useCallback(async () => {
    if (!mvp01) return;
    setMvpLoading(true);
    setMvpAuthError(null);
    setIncidentActionError(null);
    setReceiptActionError(null);

    try {
      const mvpApi = (window as any).aquila?.mvp01;
      if (!mvpApi?.getPortalOverview) {
        setMvpOverview(null);
        setSelectedChildId('');
        setMvpAuthError('Núcleo MVP 0.1 indisponível neste ambiente.');
        return;
      }

      const ctxRes = await mvpApi.getContext?.();
      const ctxData: MvpContextData | null = ctxRes?.success ? (ctxRes.data as MvpContextData) : null;
      setMvpContext(ctxData);

      const overviewRes = await mvpApi.getPortalOverview({ portal: 'family' });
      if (!overviewRes?.success) {
        setMvpOverview(null);
        setSelectedChildId('');
        setMvpAuthError(
          overviewRes?.error || 'Acesso não autorizado ao Portal da Família para este vínculo.'
        );
        return;
      }

      const payload = overviewRes.data as MvpFamilyOverviewPayload;
      setMvpOverview(payload);

      const activeStudents = Array.isArray(payload.students) ? payload.students : [];
      if (activeStudents.length === 0) {
        setSelectedChildId('');
      } else {
        setSelectedChildId((prev) => {
          if (prev && activeStudents.some((s) => s.id === prev)) return prev;
          if (studentId && activeStudents.some((s) => s.id === studentId)) return studentId;
          return activeStudents[0].id;
        });
      }
    } catch {
      setMvpOverview(null);
      setSelectedChildId('');
      setMvpAuthError('Não foi possível validar a autorização familiar no momento.');
    } finally {
      setMvpLoading(false);
    }
  }, [mvp01, studentId]);

  useEffect(() => {
    if (mvp01) {
      loadMvp01FamilyData();
    }
  }, [mvp01, loadMvp01FamilyData]);

  // Carrega histórico local de solicitações cadastrais sujeitas à conferência da Secretaria
  useEffect(() => {
    if (!mvp01 || !mvpContext?.schoolId || !mvpContext?.userId) return;
    try {
      const storageKey = `mvp01_family_update_reqs_${mvpContext.schoolId}_${mvpContext.userId}`;
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setUpdateRequests(parsed);
      } else {
        setUpdateRequests([]);
      }
    } catch {
      setUpdateRequests([]);
    }
  }, [mvp01, mvpContext?.schoolId, mvpContext?.userId]);

  const handleSwitchContext = async (membershipId: string) => {
    const mvpApi = (window as any).aquila?.mvp01;
    if (!mvpApi?.switchContext || !membershipId) return;
    setSwitchingContext(true);
    setSelectedChildId('');
    setMvpOverview(null);
    try {
      const res = await mvpApi.switchContext({ membershipId });
      if (!res?.success) {
        setMvpAuthError(res?.error || 'Não foi possível alternar o contexto de vínculo.');
        return;
      }
      await loadMvp01FamilyData();
    } finally {
      setSwitchingContext(false);
    }
  };

  const mvpActiveMemberships = useMemo(
    () => (mvpContext?.availableMemberships || []).filter((m) => m.status === 'ACTIVE'),
    [mvpContext]
  );

  const parentCandidateMembership = mvpActiveMemberships.find((m) => {
    const r = m.role.toLowerCase();
    return r === 'parent' || r === 'responsavel' || r === 'pais' || r === 'admin';
  });

  const authorizedStudents = mvpOverview?.students || [];
  const selectedChild = useMemo(
    () => authorizedStudents.find((s) => s.id === selectedChildId) || null,
    [authorizedStudents, selectedChildId]
  );

  const periodNameMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of mvpOverview?.academicPeriods || []) {
      map.set(p.id, p.name);
    }
    return map;
  }, [mvpOverview?.academicPeriods]);

  const childAttendance = useMemo(
    () =>
      selectedChild
        ? (mvpOverview?.attendance || []).filter((a) => a.student_id === selectedChild.id)
        : [],
    [mvpOverview?.attendance, selectedChild]
  );

  const childAttendanceStats = useMemo(() => {
    const total = childAttendance.length;
    const presentLike = childAttendance.filter((a) =>
      ['PRESENT', 'LATE', 'JUSTIFIED'].includes(a.status)
    ).length;
    const absent = childAttendance.filter((a) => a.status === 'ABSENT').length;
    const rate = total > 0 ? Number(((presentLike / total) * 100).toFixed(1)) : null;
    return { total, presentLike, absent, rate };
  }, [childAttendance]);

  const childGrades = useMemo(
    () =>
      selectedChild
        ? (mvpOverview?.grades || []).filter((g) => g.student_id === selectedChild.id)
        : [],
    [mvpOverview?.grades, selectedChild]
  );

  const childPublishedAvg = useMemo(() => {
    const graded = childGrades.filter(
      (g) => g.entry_state === 'GRADED' && g.final_average !== null && g.final_average !== undefined
    );
    if (graded.length === 0) return null;
    const sum = graded.reduce((acc, g) => acc + Number(g.final_average), 0);
    return (sum / graded.length).toFixed(1);
  }, [childGrades]);

  const childIncidents = useMemo(
    () =>
      selectedChild
        ? (mvpOverview?.incidents || []).filter((inc) => inc.student_id === selectedChild.id)
        : [],
    [mvpOverview?.incidents, selectedChild]
  );

  const childCommunications = useMemo(() => {
    if (!selectedChild) return [];
    return (mvpOverview?.communications || []).filter(
      (c) =>
        c.target_scope === 'ALL_SCHOOL' ||
        c.target_student_id === selectedChild.id ||
        (selectedChild.class_id && c.target_class_id === selectedChild.class_id)
    );
  }, [mvpOverview?.communications, selectedChild]);

  const childReceipts = useMemo(
    () =>
      selectedChild
        ? (mvpOverview?.receipts || []).filter((r) => r.student_id === selectedChild.id)
        : [],
    [mvpOverview?.receipts, selectedChild]
  );

  const childJustifications = useMemo(
    () =>
      selectedChild
        ? (mvpOverview?.justifications || []).filter((j) => j.student_id === selectedChild.id)
        : [],
    [mvpOverview?.justifications, selectedChild]
  );

  const pendingIncidentsAckCount = useMemo(
    () => childIncidents.filter((inc) => !inc.family_ack_at).length,
    [childIncidents]
  );

  const pendingCommsCount = useMemo(() => {
    return childCommunications.filter((comm) => {
      const acked = childReceipts.some(
        (r) => r.communication_id === comm.id && r.event_type === 'ACKNOWLEDGED'
      );
      const decided =
        comm.requires_authorization !== 1 ||
        childReceipts.some(
          (r) =>
            r.communication_id === comm.id &&
            (r.event_type === 'AUTHORIZED' || r.event_type === 'DENIED')
        );
      return !acked || !decided;
    }).length;
  }, [childCommunications, childReceipts]);

  const handleAttachmentPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setJustAttachmentName('');
      setJustAttachmentBytes(undefined);
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setJustFeedback({
        type: 'err',
        text: 'O arquivo selecionado excede o limite de 10 MB.',
      });
      return;
    }
    setJustAttachmentName(file.name);
    setJustAttachmentBytes(file.size);
    setJustFeedback(null);
  };

  const handleSubmitJustification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChild) return;
    const mvpApi = (window as any).aquila?.mvp01;
    if (!mvpApi?.submitAbsenceJustification) return;

    if (!justDate.trim()) {
      setJustFeedback({ type: 'err', text: 'Informe a data da ausência.' });
      return;
    }
    if (justReason.trim().length < 5) {
      setJustFeedback({
        type: 'err',
        text: 'Descreva o motivo da justificativa com ao menos 5 caracteres.',
      });
      return;
    }

    setSubmittingJust(true);
    setJustFeedback(null);
    try {
      const res = await mvpApi.submitAbsenceJustification({
        studentId: selectedChild.id,
        absenceDate: justDate.trim(),
        reason: justReason.trim(),
        ...(justAttachmentName.trim() ? { attachmentName: justAttachmentName.trim() } : {}),
        ...(justAttachmentBytes !== undefined ? { attachmentSizeBytes: justAttachmentBytes } : {}),
      });

      if (!res?.success) {
        setJustFeedback({
          type: 'err',
          text: res?.error || 'Não foi possível enviar a justificativa.',
        });
        return;
      }

      setJustReason('');
      setJustAttachmentName('');
      setJustAttachmentBytes(undefined);
      setJustFeedback({
        type: 'ok',
        text: 'Solicitação registrada com status "Em análise pela escola" (PENDING_REVIEW). O envio não abona a falta automaticamente.',
      });
      await loadMvp01FamilyData();
    } catch {
      setJustFeedback({
        type: 'err',
        text: 'Erro ao registrar a justificativa de ausência.',
      });
    } finally {
      setSubmittingJust(false);
    }
  };

  const handleAckIncidentMvp = async (incidentId: string) => {
    const mvpApi = (window as any).aquila?.mvp01;
    if (!mvpApi?.ackIncident) return;
    setAckingIncidentId(incidentId);
    setIncidentActionError(null);
    try {
      const res = await mvpApi.ackIncident({ incidentId });
      if (!res?.success) {
        setIncidentActionError(res?.error || 'Não foi possível confirmar a ciência digital.');
        return;
      }
      const ackAt = res.data?.familyAckAt || new Date().toISOString();
      const ackBy = res.data?.familyAckBy || mvpContext?.userId || '';
      setMvpOverview((prev) =>
        prev
          ? {
              ...prev,
              incidents: prev.incidents.map((inc) =>
                inc.id === incidentId
                  ? { ...inc, family_ack_at: ackAt, family_ack_by: ackBy }
                  : inc
              ),
            }
          : prev
      );
    } catch {
      setIncidentActionError('Falha ao registrar ciência digital da ocorrência.');
    } finally {
      setAckingIncidentId(null);
    }
  };

  const handleRecordReceipt = async (
    communicationId: string,
    eventType: 'ACKNOWLEDGED' | 'AUTHORIZED' | 'DENIED',
    note?: string
  ) => {
    if (!selectedChild) return;
    const mvpApi = (window as any).aquila?.mvp01;
    if (!mvpApi?.recordCommunicationReceipt) return;
    const busyKey = `${communicationId}:${eventType}`;
    setReceiptActionBusyKey(busyKey);
    setReceiptActionError(null);
    try {
      const res = await mvpApi.recordCommunicationReceipt({
        communicationId,
        studentId: selectedChild.id,
        eventType,
        ...(note && note.trim() ? { note: note.trim() } : {}),
      });
      if (!res?.success) {
        setReceiptActionError(res?.error || 'Não foi possível registrar a confirmação.');
        return;
      }
      await loadMvp01FamilyData();
    } catch {
      setReceiptActionError('Falha ao registrar confirmação do comunicado.');
    } finally {
      setReceiptActionBusyKey(null);
    }
  };

  const handleSubmitProfileUpdateRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChild) return;
    if (updateNewValue.trim().length < 3) {
      setUpdateFeedback('Informe o novo dado para solicitação de conferência.');
      return;
    }
    const newItem: ProfileUpdateRequestItem = {
      id: `upd-${Date.now()}`,
      studentId: selectedChild.id,
      studentName: selectedChild.full_name,
      fieldLabel: updateFieldLabel,
      newValue: updateNewValue.trim(),
      note: updateNote.trim(),
      status: 'Aguardando conferência da Secretaria',
      createdAt: new Date().toISOString(),
    };
    const nextList = [newItem, ...updateRequests];
    setUpdateRequests(nextList);
    if (mvpContext?.schoolId && mvpContext?.userId) {
      try {
        localStorage.setItem(
          `mvp01_family_update_reqs_${mvpContext.schoolId}_${mvpContext.userId}`,
          JSON.stringify(nextList)
        );
      } catch {
        // ignore storage quota errors
      }
    }
    setUpdateNewValue('');
    setUpdateNote('');
    setUpdateFeedback(
      'Solicitação protocolada. A alteração depende de conferência documental pela Secretaria Escolar e não altera o cadastro automaticamente.'
    );
  };

  // =========================================================================
  // ESTADO LEGADO (EXCLUSIVO PARA !isMvp01Active())
  // =========================================================================
  const [studentName, setStudentName] = useState<string>('');
  const [studentMeta, setStudentMeta] = useState<{
    className?: string;
    ra?: string;
    seatLabel?: string;
    teacher?: string;
  } | null>(null);
  const [attendance, setAttendance] = useState<AttendanceSummary | null>(null);
  const [grades, setGrades] = useState<GradeSummary[]>([]);
  const [financial, setFinancial] = useState<FinancialSummary | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(!mvp01);
  const [behavioralInsight] = useState<any>({
    currentMood: 'Inferência Emocional Bloqueada (CNE 15/2026)',
    telemetryBlocked: true,
    engagement: null,
  });
  const [dinnerCopied, setDinnerCopied] = useState(false);
  const [pixCopied, setPixCopied] = useState(false);
  const [selectedDinnerGradeIdx, setSelectedDinnerGradeIdx] = useState<number>(4);
  const [showPixModal, setShowPixModal] = useState(false);
  const [parentOccurrences, setParentOccurrences] = useState<
    Array<{
      id: string;
      date: string;
      time: string;
      category: string;
      severity: string;
      title: string;
      description: string;
      actionTaken: string;
      signed: boolean;
      signedAt?: string;
    }>
  >([]);

  const handleSignOccurrence = (occId: string) => {
    const timestamp = new Date().toLocaleString('pt-BR');
    setParentOccurrences((prev) =>
      prev.map((o) => {
        if (o.id === occId) {
          return {
            ...o,
            signed: true,
            signedAt: `${timestamp} (Assinado Digitalmente por ${signerName} • Hash SHA-256 / LGPD)`,
          };
        }
        return o;
      })
    );
  };

  const loadLegacyData = useCallback(async () => {
    if (mvp01) return;
    setLoading(true);
    try {
      const aquilaApi = (window as any).aquila;
      const [studentRes, telemetryRes] = await Promise.all([
        aquilaApi?.student?.getStudent?.(effectiveStudentId) ||
          aquilaApi?.invoke?.('get-student', effectiveStudentId),
        aquilaApi?.invoke?.('attendance:get-telemetry'),
      ]);

      const rawStudent =
        studentRes?.success && studentRes.data
          ? studentRes.data
          : studentRes &&
            typeof studentRes === 'object' &&
            !('success' in studentRes && studentRes.success === false) &&
            (studentRes.name || studentRes.id)
          ? studentRes
          : null;
      const hasRealStudent = Boolean(rawStudent && rawStudent.name);

      if (hasRealStudent) {
        setStudentName(rawStudent.name || '');
        setStudentMeta({
          className:
            rawStudent.className ||
            rawStudent.class_name ||
            rawStudent.classId ||
            PILOT_FALLBACK_META.className,
          ra: rawStudent.ra || rawStudent.registration || effectiveStudentId,
          seatLabel:
            rawStudent.seatLabel || rawStudent.metadata?.seatLabel || PILOT_FALLBACK_META.seatLabel,
          teacher:
            rawStudent.teacherName || rawStudent.metadata?.teacher || PILOT_FALLBACK_META.teacher,
        });
      } else {
        setStudentName(PILOT_FALLBACK_NAME);
        setStudentMeta({
          ...PILOT_FALLBACK_META,
          ra: effectiveStudentId || PILOT_FALLBACK_META.ra,
        });
      }

      const hasTelemetryData = Boolean(
        telemetryRes &&
          ((hasRealStudent &&
            (telemetryRes.totalToday ||
              telemetryRes.presentNow ||
              telemetryRes.lastEntry ||
              telemetryRes.lastExit)) ||
            (!hasRealStudent &&
              (Number(telemetryRes.presentNow ?? 0) > 0 || telemetryRes.lastEntry)))
      );

      if (hasTelemetryData) {
        const presentDays = Number(telemetryRes.presentNow ?? 0);
        const absences = Number(telemetryRes.absentToday ?? 0);
        const totalDays = Number(telemetryRes.totalToday ?? presentDays + absences);
        setAttendance({
          totalDays,
          presentDays,
          absences,
          lastEntry: telemetryRes.lastEntry || undefined,
          lastExit: telemetryRes.lastExit || undefined,
        });
      } else {
        setAttendance(PILOT_FALLBACK_ATTENDANCE);
      }

      const eventsRes = await aquilaApi?.student?.getEvents?.(effectiveStudentId);
      let resolvedGrades: GradeSummary[] = [];
      let resolvedOccurrences: typeof PILOT_FALLBACK_OCCURRENCES = [];

      if (eventsRes?.success && Array.isArray(eventsRes.data) && eventsRes.data.length > 0) {
        const isGenericStub =
          !hasRealStudent &&
          eventsRes.data.length <= 3 &&
          eventsRes.data.some((e: any) => e.id === 'ev1') &&
          eventsRes.data.some((e: any) => e.id === 'ev2');

        if (!isGenericStub) {
          const gradeMap: Record<string, number[]> = {};
          eventsRes.data.forEach((e: any) => {
            if (e.type === 'grade' && e.subject && e.value != null) {
              if (!gradeMap[e.subject]) gradeMap[e.subject] = [];
              gradeMap[e.subject].push(Number(e.value));
            }
          });
          resolvedGrades = Object.entries(gradeMap).map(([subject, vals]) => {
            const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
            return {
              subject,
              average: Math.round(avg * 10) / 10,
              trend: avg >= 7 ? 'up' : 'down',
            };
          });

          if (hasRealStudent) {
            const behEvents = eventsRes.data.filter(
              (e: any) => e.category === 'BEHAVIORAL' || e.type === 'occurrence'
            );
            if (behEvents.length > 0) {
              resolvedOccurrences = behEvents.map((e: any, idx: number) => ({
                id: e.id || `occ-db-${idx}`,
                date: e.timestamp ? new Date(e.timestamp).toLocaleDateString('pt-BR') : 'Hoje',
                time: e.timestamp
                  ? new Date(e.timestamp).toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : '10:00',
                category: e.category || 'Acompanhamento Pedagógico',
                severity: e.type === 'positive' ? 'Positiva' : 'Média',
                title: e.title || 'Registro Escolar',
                description: e.description || 'Registro sincronizado pelo sistema escolar.',
                actionTaken: 'Acompanhamento registrado pela equipe docente/coordenação.',
                signed: Boolean(e.signed),
                signedAt: e.signedAt,
              }));
            }
          }
        }
      }

      if (resolvedGrades.length === 0) {
        try {
          const gradesIpc = await aquilaApi?.invoke?.('academic:get-grades', {
            studentId: effectiveStudentId,
          });
          if (
            gradesIpc?.success &&
            Array.isArray(gradesIpc.data) &&
            gradesIpc.data.length > 0 &&
            hasRealStudent
          ) {
            resolvedGrades = gradesIpc.data.map((g: any) => {
              const avg = Number(g.avg ?? g.average ?? 0);
              return {
                subject: g.subject || 'Disciplina',
                average: Math.round(avg * 10) / 10,
                trend: avg >= 7 ? 'up' : 'down',
              };
            });
          }
        } catch {
          // fallback below
        }
      }

      setGrades(resolvedGrades.length > 0 ? resolvedGrades : PILOT_FALLBACK_GRADES);
      setParentOccurrences(
        resolvedOccurrences.length > 0 ? resolvedOccurrences : PILOT_FALLBACK_OCCURRENCES
      );

      const billingRes = await aquilaApi?.invoke?.(
        'finance:get-billing-history',
        effectiveStudentId
      );
      if (billingRes?.success && Array.isArray(billingRes.data) && billingRes.data.length > 0) {
        const rows = billingRes.data;
        const overdue = rows.filter((r: any) => r.status === 'overdue').length;
        const next = rows.find((r: any) => r.status === 'pending');
        setFinancial({
          status: overdue > 0 ? 'inadimplente' : next ? 'pendente' : 'adimplente',
          nextDueDate: next?.due_date || undefined,
          nextAmount: next?.amount != null ? Number(next.amount) : undefined,
          overdueCount: overdue,
        });
      } else {
        setFinancial(PILOT_FALLBACK_FINANCIAL);
      }

      const notifRes = await aquilaApi?.invoke?.('get-notifications', effectiveStudentId);
      if (Array.isArray(notifRes) && notifRes.length > 0) {
        setNotifications(
          notifRes.map((n: any) => ({
            id: n.id,
            type: (n.type || 'general').toLowerCase() as any,
            title: n.title,
            body: n.message,
            sentAt: new Date(n.timestamp).toLocaleString(),
            sender: 'Sistema Áquila',
            readAt: n.read ? n.timestamp : undefined,
          }))
        );
        setUnreadCount(notifRes.filter((n: any) => !n.read).length);
      } else {
        setNotifications(PILOT_FALLBACK_NOTIFICATIONS);
        setUnreadCount(PILOT_FALLBACK_NOTIFICATIONS.length);
      }
    } catch (err) {
      console.warn('[ParentPortal] Falha ao carregar dados do estudante; aplicando fallback:', err);
      setStudentName((prev) => prev || PILOT_FALLBACK_NAME);
      setStudentMeta(
        (prev) => prev || { ...PILOT_FALLBACK_META, ra: effectiveStudentId || PILOT_FALLBACK_META.ra }
      );
      setAttendance((prev) => prev || PILOT_FALLBACK_ATTENDANCE);
      setGrades((prev) => (prev.length > 0 ? prev : PILOT_FALLBACK_GRADES));
      setFinancial((prev) => prev || PILOT_FALLBACK_FINANCIAL);
      setNotifications((prev) => (prev.length > 0 ? prev : PILOT_FALLBACK_NOTIFICATIONS));
      setUnreadCount((prev) => (prev > 0 ? prev : PILOT_FALLBACK_NOTIFICATIONS.length));
      setParentOccurrences((prev) => (prev.length > 0 ? prev : PILOT_FALLBACK_OCCURRENCES));
    } finally {
      setLoading(false);
    }
  }, [mvp01, effectiveStudentId]);

  useEffect(() => {
    if (!mvp01) {
      loadLegacyData();
    }
  }, [mvp01, loadLegacyData]);

  // =========================================================================
  // RENDERIZAÇÃO MVP 0.1 (PORTAL 4 — FAMÍLIA / PAIS)
  // =========================================================================
  if (mvp01) {
    const mvpTabs: Array<{ key: typeof activeTab; label: string; icon: React.ReactNode }> = [
      { key: 'resumo', label: 'Visão Geral', icon: <User size={13} /> },
      { key: 'presenca', label: 'Presença & Justificativas', icon: <Clock size={13} /> },
      { key: 'notas', label: 'Boletim & Notas', icon: <BookOpen size={13} /> },
      {
        key: 'ocorrencias',
        label: `Ocorrências & Elogios${pendingIncidentsAckCount > 0 ? ` (${pendingIncidentsAckCount})` : ''}`,
        icon: <Shield size={13} />,
      },
      {
        key: 'mensagens',
        label: `Comunicados & Agenda${pendingCommsCount > 0 ? ` (${pendingCommsCount})` : ''}`,
        icon: <Bell size={13} />,
      },
    ];

    const childUpdateRequests = selectedChild
      ? updateRequests.filter((r) => r.studentId === selectedChild.id)
      : [];

    const renderMvpPresenca = () => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Frequência Apurada */}
        <section className="pp-section">
          <div className="pp-section-header-row">
            <h3 className="pp-section-title">
              <Clock size={14} color="#10B981" /> Presença Escolar — {selectedChild?.full_name}
            </h3>
            <span className="pp-section-tag">
              {childAttendanceStats.rate !== null
                ? `${childAttendanceStats.rate}% FREQUÊNCIA`
                : 'SEM REGISTROS DE CHAMADA'}
            </span>
          </div>

          <div className="pp-presence-detail">
            <div className="pp-presence-row">
              <Calendar size={13} style={{ color: '#38BDF8' }} />
              <span>Aulas registradas para o estudante:</span>
              <strong>{childAttendanceStats.total} aula(s)</strong>
            </div>
            <div className="pp-presence-row">
              <CheckCircle2 size={13} style={{ color: '#10B981' }} />
              <span>Presenças / atrasos / faltas justificadas:</span>
              <strong>{childAttendanceStats.presentLike}</strong>
            </div>
            <div className="pp-presence-row">
              <AlertTriangle size={13} style={{ color: '#F87171' }} />
              <span>Faltas sem abono:</span>
              <strong style={{ color: childAttendanceStats.absent > 0 ? '#F87171' : '#34D399' }}>
                {childAttendanceStats.absent}
              </strong>
            </div>
          </div>

          {childAttendance.length === 0 ? (
            <div style={{ padding: '10px 12px', color: '#94A3B8', fontSize: 12 }}>
              Nenhum registro de chamada lançado para este estudante até o momento.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 4 }}>
              {childAttendance.slice(0, 20).map((att) => {
                const meta = ATTENDANCE_STATUS_META[att.status] || {
                  label: att.status,
                  color: '#CBD5E1',
                  bg: 'rgba(148,163,184,0.14)',
                };
                return (
                  <div
                    key={att.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '6px 10px',
                      borderRadius: 6,
                      background: '#141B2D',
                      border: '1px solid rgba(255,255,255,0.06)',
                      fontSize: 12,
                    }}
                  >
                    <span>
                      <strong>{formatDatePtBr(att.lesson_date)}</strong> • {att.subject}
                    </span>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: 5,
                        fontSize: 11,
                        fontWeight: 700,
                        background: meta.bg,
                        color: meta.color,
                      }}
                    >
                      {meta.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Formulário de Justificativa / Atestado */}
        <section className="pp-section" data-testid="parent-justification-section">
          <div className="pp-section-header-row">
            <h3 className="pp-section-title">
              <Upload size={14} color="#FBBF24" /> Enviar Justificativa / Atestado
            </h3>
            <span className="pp-section-tag">ANÁLISE PELA ESCOLA</span>
          </div>

          <div
            style={{
              padding: '8px 12px',
              borderRadius: 8,
              background: 'rgba(245, 158, 11, 0.12)',
              border: '1px solid rgba(245, 158, 11, 0.35)',
              color: '#FDE68A',
              fontSize: 12,
            }}
          >
            <strong>Regra de Abono:</strong> O envio de justificativa ou atestado entra como{' '}
            <strong>Em análise pela escola (PENDING_REVIEW)</strong> e <strong>NÃO abona a falta automaticamente</strong>.
            A aprovação ou recusa depende de análise pela Coordenação ou Secretaria.
          </div>

          <form onSubmit={handleSubmitJustification} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 8 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11.5, color: '#94A3B8', marginBottom: 4 }}>
                  Data da Ausência *
                </label>
                <input
                  type="date"
                  value={justDate}
                  onChange={(e) => setJustDate(e.target.value)}
                  required
                  style={{ width: '100%', minHeight: 36 }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11.5, color: '#94A3B8', marginBottom: 4 }}>
                  Anexo / Atestado (opcional, máx. 10 MB)
                </label>
                <input type="file" onChange={handleAttachmentPick} style={{ width: '100%', minHeight: 36 }} />
                {justAttachmentName && (
                  <span style={{ fontSize: 11, color: '#38BDF8' }}>
                    Selecionado: {justAttachmentName}
                    {justAttachmentBytes !== undefined
                      ? ` (${Math.max(1, Math.round(justAttachmentBytes / 1024))} KB)`
                      : ''}
                  </span>
                )}
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 11.5, color: '#94A3B8', marginBottom: 4 }}>
                Motivo da Ausência (mín. 5 caracteres) *
              </label>
              <textarea
                rows={2}
                placeholder="Ex.: Consulta médica ou motivo familiar justificado..."
                value={justReason}
                onChange={(e) => setJustReason(e.target.value)}
                required
                style={{ width: '100%', minHeight: 60 }}
              />
            </div>

            {justFeedback && (
              <div
                style={{
                  padding: '8px 10px',
                  borderRadius: 6,
                  fontSize: 12,
                  background:
                    justFeedback.type === 'ok'
                      ? 'rgba(16, 185, 129, 0.14)'
                      : 'rgba(239, 68, 68, 0.14)',
                  border:
                    justFeedback.type === 'ok'
                      ? '1px solid rgba(16, 185, 129, 0.35)'
                      : '1px solid rgba(239, 68, 68, 0.35)',
                  color: justFeedback.type === 'ok' ? '#6EE7B7' : '#FCA5A5',
                }}
              >
                {justFeedback.text}
              </div>
            )}

            <div>
              <button
                type="submit"
                className="pp-action-btn primary"
                disabled={submittingJust}
                style={{ height: 34, padding: '0 14px' }}
              >
                <Upload size={13} />
                <span>{submittingJust ? 'Enviando...' : 'Enviar para Análise da Escola'}</span>
              </button>
            </div>
          </form>

          {/* Lista de justificativas enviadas */}
          <div style={{ marginTop: 6 }}>
            <h4 style={{ margin: '0 0 6px 0', fontSize: 12, color: '#94A3B8', textTransform: 'uppercase' }}>
              Histórico de Justificativas ({childJustifications.length})
            </h4>
            {childJustifications.length === 0 ? (
              <div style={{ fontSize: 12, color: '#64748B' }}>
                Nenhuma justificativa enviada para este estudante.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {childJustifications.map((j) => {
                  const st = JUSTIFICATION_STATUS_META[j.status] || JUSTIFICATION_STATUS_META.PENDING_REVIEW;
                  return (
                    <div
                      key={j.id}
                      data-testid={`justification-item-${j.id}`}
                      style={{
                        padding: '8px 10px',
                        borderRadius: 7,
                        background: '#141B2D',
                        border: '1px solid rgba(255,255,255,0.07)',
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
                        <strong style={{ fontSize: 12.5 }}>
                          Ausência em {formatDatePtBr(j.absence_date)}
                        </strong>
                        <span
                          style={{
                            padding: '2px 8px',
                            borderRadius: 5,
                            fontSize: 11,
                            fontWeight: 700,
                            background: st.bg,
                            color: st.color,
                            border: `1px solid ${st.border}`,
                          }}
                        >
                          {st.label} ({st.code})
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: '#CBD5E1' }}>{j.reason}</div>
                      {j.attachment_name && (
                        <div style={{ fontSize: 11, color: '#38BDF8' }}>
                          Anexo: {j.attachment_name}
                        </div>
                      )}
                      {j.review_note && (
                        <div style={{ fontSize: 11.5, color: '#94A3B8' }}>
                          <strong>Parecer da escola:</strong> {j.review_note}
                          {j.reviewed_at ? ` (${formatDatePtBr(j.reviewed_at)})` : ''}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>
    );

    const renderMvpNotas = () => (
      <section className="pp-section" data-testid="parent-grades-section">
        <div className="pp-section-header-row">
          <h3 className="pp-section-title">
            <BookOpen size={14} color="#38BDF8" /> Boletim Publicado — {selectedChild?.full_name}
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              className="pp-action-btn primary"
              style={{ height: 26, padding: '0 10px', fontSize: '0.74rem' }}
              onClick={() => setShowBoletimModal(true)}
            >
              <Printer size={12} />
              <span>Imprimir Boletim (Leitura)</span>
            </button>
            <span className="pp-section-tag">
              MÉDIA PUBLICADA: {childPublishedAvg ?? '—'}
            </span>
          </div>
        </div>

        <div style={{ fontSize: 11.5, color: '#94A3B8' }}>
          Exibindo somente avaliações já publicadas pela escola. Lançamentos em aberto aparecem como{' '}
          <strong>Pendente</strong> (diferenciado de nota <strong>0.0</strong> e de <strong>Dispensado</strong>).
        </div>

        {childGrades.length === 0 ? (
          <div
            style={{
              padding: '16px 12px',
              borderRadius: 8,
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)',
              color: '#94A3B8',
              fontSize: 12.5,
            }}
          >
            Nenhuma nota foi publicada até o momento para este estudante.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#94A3B8' }}>
                  <th style={{ textAlign: 'left', padding: '7px 8px' }}>Disciplina</th>
                  <th style={{ textAlign: 'left', padding: '7px 8px' }}>Período</th>
                  <th style={{ textAlign: 'center', padding: '7px 8px' }}>N1</th>
                  <th style={{ textAlign: 'center', padding: '7px 8px' }}>N2</th>
                  <th style={{ textAlign: 'center', padding: '7px 8px' }}>N3</th>
                  <th style={{ textAlign: 'center', padding: '7px 8px' }}>Rec.</th>
                  <th style={{ textAlign: 'center', padding: '7px 8px' }}>Situação / Média</th>
                </tr>
              </thead>
              <tbody>
                {childGrades.map((g) => (
                  <tr key={g.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <td style={{ padding: '7px 8px', fontWeight: 700 }}>{g.subject}</td>
                    <td style={{ padding: '7px 8px', color: '#CBD5E1' }}>
                      {periodNameMap.get(g.period_id) || g.period_id}
                    </td>
                    <td style={{ padding: '7px 8px', textAlign: 'center', fontFamily: 'monospace' }}>
                      {formatScoreValue(g.n1)}
                    </td>
                    <td style={{ padding: '7px 8px', textAlign: 'center', fontFamily: 'monospace' }}>
                      {formatScoreValue(g.n2)}
                    </td>
                    <td style={{ padding: '7px 8px', textAlign: 'center', fontFamily: 'monospace' }}>
                      {formatScoreValue(g.n3)}
                    </td>
                    <td style={{ padding: '7px 8px', textAlign: 'center', fontFamily: 'monospace' }}>
                      {formatScoreValue(g.recovery)}
                    </td>
                    <td style={{ padding: '7px 8px', textAlign: 'center' }}>
                      {g.entry_state === 'PENDING' ? (
                        <span
                          style={{
                            padding: '2px 7px',
                            borderRadius: 4,
                            background: 'rgba(245, 158, 11, 0.16)',
                            color: '#FBBF24',
                            fontWeight: 700,
                            fontSize: 11,
                          }}
                        >
                          Pendente
                        </span>
                      ) : g.entry_state === 'EXEMPT' ? (
                        <span
                          style={{
                            padding: '2px 7px',
                            borderRadius: 4,
                            background: 'rgba(56, 189, 248, 0.16)',
                            color: '#38BDF8',
                            fontWeight: 700,
                            fontSize: 11,
                          }}
                        >
                          Dispensado
                        </span>
                      ) : (
                        <strong
                          style={{
                            fontFamily: 'monospace',
                            fontSize: 13,
                            color: (g.final_average ?? 0) >= 6 ? '#34D399' : '#F87171',
                          }}
                        >
                          {formatScoreValue(g.final_average)}
                        </strong>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    );

    const renderMvpOcorrencias = () => (
      <section className="pp-section" data-testid="parent-incidents-section">
        <div className="pp-section-header-row">
          <h3 className="pp-section-title">
            <Shield size={14} color="#818CF8" /> Ocorrências & Elogios Publicados à Família
          </h3>
          <span className="pp-section-tag">SOMENTE RESUMO PUBLICADO</span>
        </div>

        <div style={{ fontSize: 11.5, color: '#94A3B8' }}>
          Exibe exclusivamente o resumo publicado para a família referente ao estudante selecionado — anotações internas
          da equipe escolar e nomes de outros estudantes são omitidos.
        </div>

        {incidentActionError && (
          <div
            style={{
              padding: '8px 10px',
              borderRadius: 6,
              background: 'rgba(239,68,68,0.14)',
              border: '1px solid rgba(239,68,68,0.35)',
              color: '#FCA5A5',
              fontSize: 12,
            }}
          >
            {incidentActionError}
          </div>
        )}

        {childIncidents.length === 0 ? (
          <div
            style={{
              padding: '16px 12px',
              borderRadius: 8,
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)',
              color: '#94A3B8',
              fontSize: 12.5,
            }}
          >
            Nenhuma ocorrência ou elogio publicado para {selectedChild?.full_name} até o momento.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {childIncidents.map((inc) => {
              const isAcked = Boolean(inc.family_ack_at);
              const isPraise = inc.category === 'PRAISE';
              return (
                <div
                  key={inc.id}
                  data-testid={`parent-incident-${inc.id}`}
                  style={{
                    padding: 12,
                    borderRadius: 10,
                    background: '#141B2D',
                    border: isPraise
                      ? '1px solid rgba(16, 185, 129, 0.3)'
                      : '1px solid rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      flexWrap: 'wrap',
                      gap: 8,
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                        <span
                          style={{
                            fontSize: 10.5,
                            fontWeight: 800,
                            padding: '2px 7px',
                            borderRadius: 5,
                            background: isPraise
                              ? 'rgba(16, 185, 129, 0.18)'
                              : 'rgba(56, 189, 248, 0.16)',
                            color: isPraise ? '#34D399' : '#7DD3FC',
                          }}
                        >
                          {INCIDENT_CATEGORY_LABELS[inc.category] || inc.category} •{' '}
                          {INCIDENT_STATUS_LABELS[inc.status] || inc.status}
                        </span>
                        <span style={{ fontSize: 11, color: '#94A3B8' }}>
                          {formatDatePtBr(inc.created_at)}
                        </span>
                      </div>
                      <strong style={{ fontSize: 13.5, color: '#F8FAFC' }}>{inc.title}</strong>
                    </div>

                    {isAcked ? (
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '4px 10px',
                          borderRadius: 7,
                          background: 'rgba(16, 185, 129, 0.15)',
                          border: '1px solid rgba(16, 185, 129, 0.35)',
                          color: '#34D399',
                          fontSize: 11.5,
                          fontWeight: 700,
                        }}
                      >
                        <CheckCircle2 size={13} />
                        <span>Ciência Confirmada ({formatDatePtBr(inc.family_ack_at)})</span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="pp-action-btn primary"
                        disabled={ackingIncidentId === inc.id}
                        onClick={() => handleAckIncidentMvp(inc.id)}
                        style={{ height: 30, padding: '0 12px', fontSize: 12 }}
                      >
                        <CheckCircle2 size={13} />
                        <span>
                          {ackingIncidentId === inc.id
                            ? 'Confirmando...'
                            : 'Confirmar Ciência Digital'}
                        </span>
                      </button>
                    )}
                  </div>

                  <p style={{ margin: 0, fontSize: 12.5, color: '#CBD5E1', lineHeight: 1.45 }}>
                    {inc.published_summary || 'Resumo publicado pela coordenação.'}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </section>
    );

    const renderMvpComunicados = () => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Comunicados & Autorizações Separadas */}
        <section className="pp-section" data-testid="parent-communications-section">
          <div className="pp-section-header-row">
            <h3 className="pp-section-title">
              <Bell size={14} color="#A78BFA" /> Comunicados Oficiais & Autorizações
            </h3>
            <span className="pp-section-tag">{childCommunications.length} PUBLICADOS</span>
          </div>

          {receiptActionError && (
            <div
              style={{
                padding: '8px 10px',
                borderRadius: 6,
                background: 'rgba(239,68,68,0.14)',
                border: '1px solid rgba(239,68,68,0.35)',
                color: '#FCA5A5',
                fontSize: 12,
              }}
            >
              {receiptActionError}
            </div>
          )}

          {childCommunications.length === 0 ? (
            <div style={{ padding: 12, color: '#94A3B8', fontSize: 12.5 }}>
              Nenhum comunicado publicado para {selectedChild?.full_name} até o momento.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {childCommunications.map((comm) => {
                const receiptsForComm = childReceipts.filter((r) => r.communication_id === comm.id);
                const ackReceipt = receiptsForComm.find((r) => r.event_type === 'ACKNOWLEDGED');
                const decisionReceipts = receiptsForComm
                  .filter((r) => r.event_type === 'AUTHORIZED' || r.event_type === 'DENIED')
                  .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
                const latestDecision = decisionReceipts[0] || null;
                const requiresAuth = comm.requires_authorization === 1;

                return (
                  <div
                    key={comm.id}
                    data-testid={`parent-comm-${comm.id}`}
                    style={{
                      padding: 12,
                      borderRadius: 10,
                      background: '#141B2D',
                      border: '1px solid rgba(255,255,255,0.08)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 10,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        flexWrap: 'wrap',
                        gap: 8,
                      }}
                    >
                      <div>
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            color: '#A78BFA',
                            textTransform: 'uppercase',
                          }}
                        >
                          {comm.target_scope === 'ALL_SCHOOL'
                            ? 'Comunicado Geral da Escola'
                            : comm.target_scope === 'CLASS'
                            ? 'Comunicado da Turma'
                            : 'Comunicado Individual'}{' '}
                          • {formatDatePtBr(comm.published_at)}
                        </span>
                        <h4 style={{ margin: '2px 0 0 0', fontSize: 14, color: '#F8FAFC' }}>
                          {comm.title}
                        </h4>
                      </div>
                    </div>

                    <p style={{ margin: 0, fontSize: 12.5, color: '#CBD5E1', lineHeight: 1.45 }}>
                      {comm.body}
                    </p>

                    {/* Ação 1: Ciência de Leitura ("Li e estou ciente") */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: 8,
                        paddingTop: 8,
                        borderTop: '1px solid rgba(255,255,255,0.06)',
                      }}
                    >
                      <span style={{ fontSize: 11.5, color: '#94A3B8' }}>
                        <strong>1. Ciência de Leitura:</strong> confirma recebimento do informativo.
                      </span>
                      {ackReceipt ? (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            fontSize: 11.5,
                            fontWeight: 700,
                            color: '#34D399',
                          }}
                        >
                          <CheckCircle2 size={13} />
                          <span>Li e estou ciente ({formatDatePtBr(ackReceipt.created_at)})</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          className="pp-action-btn"
                          disabled={receiptActionBusyKey === `${comm.id}:ACKNOWLEDGED`}
                          onClick={() => handleRecordReceipt(comm.id, 'ACKNOWLEDGED')}
                        >
                          <Check size={13} />
                          <span>
                            {receiptActionBusyKey === `${comm.id}:ACKNOWLEDGED`
                              ? 'Registrando...'
                              : 'Li e estou ciente'}
                          </span>
                        </button>
                      )}
                    </div>

                    {/* Ação 2: Autorização Específica de Atividade (separada de Ciência) */}
                    {requiresAuth && (
                      <div
                        style={{
                          padding: 10,
                          borderRadius: 8,
                          background: 'rgba(14, 165, 233, 0.08)',
                          border: '1px solid rgba(56, 189, 248, 0.28)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 8,
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
                          <strong style={{ fontSize: 12, color: '#BAE6FD' }}>
                            2. Autorização Específica de Atividade (decisão separada da ciência)
                          </strong>
                          {latestDecision && (
                            <span
                              style={{
                                fontSize: 11,
                                fontWeight: 700,
                                padding: '2px 8px',
                                borderRadius: 5,
                                background:
                                  latestDecision.event_type === 'AUTHORIZED'
                                    ? 'rgba(16, 185, 129, 0.18)'
                                    : 'rgba(239, 68, 68, 0.18)',
                                color:
                                  latestDecision.event_type === 'AUTHORIZED' ? '#34D399' : '#F87171',
                              }}
                            >
                              {latestDecision.event_type === 'AUTHORIZED'
                                ? `Autorizado em ${formatDatePtBr(latestDecision.created_at)}`
                                : `Recusado em ${formatDatePtBr(latestDecision.created_at)}`}
                            </span>
                          )}
                        </div>

                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                          <input
                            type="text"
                            placeholder="Observação opcional do responsável..."
                            value={authNotesByComm[comm.id] || ''}
                            onChange={(e) =>
                              setAuthNotesByComm((prev) => ({
                                ...prev,
                                [comm.id]: e.target.value,
                              }))
                            }
                            style={{ flex: 1, minWidth: 180, minHeight: 34, fontSize: 12 }}
                          />
                          <button
                            type="button"
                            className="pp-action-btn primary"
                            disabled={receiptActionBusyKey === `${comm.id}:AUTHORIZED`}
                            onClick={() =>
                              handleRecordReceipt(comm.id, 'AUTHORIZED', authNotesByComm[comm.id])
                            }
                            style={{
                              height: 34,
                              background: 'rgba(16, 185, 129, 0.22)',
                              borderColor: 'rgba(16, 185, 129, 0.5)',
                            }}
                          >
                            <CheckCircle2 size={13} />
                            <span>Autorizar Participação</span>
                          </button>
                          <button
                            type="button"
                            className="pp-action-btn"
                            disabled={receiptActionBusyKey === `${comm.id}:DENIED`}
                            onClick={() =>
                              handleRecordReceipt(comm.id, 'DENIED', authNotesByComm[comm.id])
                            }
                            style={{
                              height: 34,
                              background: 'rgba(239, 68, 68, 0.18)',
                              borderColor: 'rgba(239, 68, 68, 0.45)',
                              color: '#FECACA',
                            }}
                          >
                            <X size={13} />
                            <span>Recusar Autorização</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Agenda Letiva */}
        <section className="pp-section">
          <div className="pp-section-header-row">
            <h3 className="pp-section-title">
              <Calendar size={14} color="#38BDF8" /> Agenda dos Períodos Letivos
            </h3>
            <span className="pp-section-tag">CALENDÁRIO OFICIAL</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 6 }}>
            {(mvpOverview?.academicPeriods || []).map((p) => (
              <div
                key={p.id}
                style={{
                  padding: '8px 10px',
                  borderRadius: 7,
                  background: '#141B2D',
                  border: '1px solid rgba(255,255,255,0.06)',
                  fontSize: 12,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                  <strong>{p.name}</strong>
                  <span style={{ color: p.status === 'OPEN' ? '#34D399' : '#94A3B8', fontWeight: 700 }}>
                    {p.status === 'OPEN' ? 'Aberto' : 'Encerrado'}
                  </span>
                </div>
                <span style={{ color: '#94A3B8', fontSize: 11.5 }}>
                  {formatDatePtBr(p.start_date)} até {formatDatePtBr(p.end_date)}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Solicitação de Atualização Cadastral (Sujeita à Secretaria) */}
        <section className="pp-section" data-testid="parent-profile-update-section">
          <div className="pp-section-header-row">
            <h3 className="pp-section-title">
              <Edit3 size={14} color="#38BDF8" /> Solicitação de Atualização Cadastral
            </h3>
            <span className="pp-section-tag">SUJEITA À SECRETARIA</span>
          </div>

          <div
            style={{
              padding: '8px 12px',
              borderRadius: 7,
              background: 'rgba(14, 165, 233, 0.1)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              color: '#BAE6FD',
              fontSize: 12,
            }}
          >
            <strong>Conferência Obrigatória pela Secretaria:</strong> O envio abaixo registra uma solicitação de
            atualização para {selectedChild?.full_name}. Alterações cadastrais dependem de conferência documental e
            aprovação pela Secretaria Escolar (não alteram o prontuário automaticamente).
          </div>

          <form onSubmit={handleSubmitProfileUpdateRequest} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 8 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11.5, color: '#94A3B8', marginBottom: 4 }}>
                  Informação a Atualizar
                </label>
                <select
                  value={updateFieldLabel}
                  onChange={(e) => setUpdateFieldLabel(e.target.value)}
                  style={{ width: '100%', minHeight: 36 }}
                >
                  <option value="Telefone / WhatsApp">Telefone / WhatsApp</option>
                  <option value="E-mail do Responsável">E-mail do Responsável</option>
                  <option value="Endereço Residencial">Endereço Residencial</option>
                  <option value="Pessoas Autorizadas para Retirada">Pessoas Autorizadas para Retirada</option>
                  <option value="Contato de Emergência">Contato de Emergência</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11.5, color: '#94A3B8', marginBottom: 4 }}>
                  Novo Dado / Alteração Solicitada *
                </label>
                <input
                  type="text"
                  placeholder="Informe o dado atualizado..."
                  value={updateNewValue}
                  onChange={(e) => setUpdateNewValue(e.target.value)}
                  required
                  style={{ width: '100%', minHeight: 36 }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 11.5, color: '#94A3B8', marginBottom: 4 }}>
                Observação / Comprovante a apresentar à Secretaria (opcional)
              </label>
              <input
                type="text"
                placeholder="Ex.: Novo número ativo a partir desta semana"
                value={updateNote}
                onChange={(e) => setUpdateNote(e.target.value)}
                style={{ width: '100%', minHeight: 36 }}
              />
            </div>

            {updateFeedback && (
              <div
                style={{
                  padding: '8px 10px',
                  borderRadius: 6,
                  background: 'rgba(16, 185, 129, 0.14)',
                  border: '1px solid rgba(16, 185, 129, 0.35)',
                  color: '#6EE7B7',
                  fontSize: 12,
                }}
              >
                {updateFeedback}
              </div>
            )}

            <div>
              <button type="submit" className="pp-action-btn primary" style={{ height: 34, padding: '0 14px' }}>
                <FileText size={13} />
                <span>Protocolar Solicitação para a Secretaria</span>
              </button>
            </div>
          </form>

          {childUpdateRequests.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 4 }}>
              {childUpdateRequests.map((req) => (
                <div
                  key={req.id}
                  style={{
                    padding: '7px 10px',
                    borderRadius: 6,
                    background: '#141B2D',
                    border: '1px solid rgba(255,255,255,0.07)',
                    fontSize: 11.5,
                    display: 'flex',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 6,
                  }}
                >
                  <span>
                    <strong>{req.fieldLabel}:</strong> {req.newValue} ({formatDatePtBr(req.createdAt)})
                  </span>
                  <span style={{ color: '#FBBF24', fontWeight: 700 }}>{req.status}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    );

    const renderMvpResumo = () => (
      <>
        <div className="pp-resumo-grid">
          <div className="pp-summary-card" onClick={() => setActiveTab('presenca')}>
            <div className="pp-card-body">
              <span className="pp-card-label">FREQUÊNCIA</span>
              <span className="pp-card-value" style={{ color: '#10B981' }}>
                {childAttendanceStats.rate !== null ? `${childAttendanceStats.rate}%` : '—'}
              </span>
              <span className="pp-card-sub">
                {childAttendanceStats.total} aula(s) • {childAttendanceStats.absent} falta(s)
              </span>
            </div>
            <div className="pp-card-icon" style={{ background: 'rgba(16,185,129,0.14)', color: '#10B981' }}>
              <Clock size={18} />
            </div>
          </div>

          <div className="pp-summary-card" onClick={() => setActiveTab('notas')}>
            <div className="pp-card-body">
              <span className="pp-card-label">BOLETIM PUBLICADO</span>
              <span className="pp-card-value" style={{ color: '#00F0FF' }}>
                {childPublishedAvg !== null ? `${childPublishedAvg} / 10` : '—'}
              </span>
              <span className="pp-card-sub">{childGrades.length} registro(s) publicado(s)</span>
            </div>
            <div className="pp-card-icon" style={{ background: 'rgba(0,240,255,0.12)', color: '#00F0FF' }}>
              <BookOpen size={18} />
            </div>
          </div>

          <div className="pp-summary-card" onClick={() => setActiveTab('ocorrencias')}>
            <div className="pp-card-body">
              <span className="pp-card-label">OCORRÊNCIAS & ELOGIOS</span>
              <span
                className="pp-card-value"
                style={{ color: pendingIncidentsAckCount > 0 ? '#FBBF24' : '#34D399' }}
              >
                {childIncidents.length}
              </span>
              <span className="pp-card-sub">
                {pendingIncidentsAckCount > 0
                  ? `${pendingIncidentsAckCount} aguardando ciência`
                  : 'Todas cientes'}
              </span>
            </div>
            <div className="pp-card-icon" style={{ background: 'rgba(129,140,248,0.14)', color: '#818CF8' }}>
              <Shield size={18} />
            </div>
          </div>

          <div className="pp-summary-card" onClick={() => setActiveTab('mensagens')}>
            <div className="pp-card-body">
              <span className="pp-card-label">COMUNICADOS</span>
              <span className="pp-card-value" style={{ color: '#A78BFA' }}>
                {childCommunications.length}
              </span>
              <span className="pp-card-sub">
                {pendingCommsCount > 0 ? `${pendingCommsCount} pendência(s)` : 'Em dia'}
              </span>
            </div>
            <div className="pp-card-icon" style={{ background: 'rgba(167,139,250,0.14)', color: '#A78BFA' }}>
              <Bell size={18} />
            </div>
          </div>
        </div>

        <div className="pp-bento-two-col">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {renderMvpNotas()}
            {selectedChild?.pickup_notes && (
              <section className="pp-section">
                <div className="pp-section-header-row">
                  <h3 className="pp-section-title">
                    <Shield size={14} color="#10B981" /> Autorização de Retirada Registrada
                  </h3>
                  <span className="pp-section-tag">CADASTRO SECRETARIA</span>
                </div>
                <div style={{ fontSize: 12, color: '#CBD5E1' }}>{selectedChild.pickup_notes}</div>
              </section>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {renderMvpOcorrencias()}
          </div>
        </div>
      </>
    );

    return (
      <PortalLayout
        portalName="Portal da Família — Acesso Autorizado da Família"
        themeColor="#0EA5E9"
        onNavigate={onNavigate}
        sessionUser={resolvedSessionUser}
      >
        <div className="pp-container" data-testid="parent-mvp01-portal">
          {/* Seletor de Contexto Multi-Papel */}
          {mvpActiveMemberships.length > 1 && mvpContext && (
            <div
              data-testid="parent-context-switcher"
              style={{
                padding: '8px 12px',
                borderRadius: 8,
                background: 'rgba(14, 165, 233, 0.1)',
                border: '1px solid rgba(56, 189, 248, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 8,
              }}
            >
              <div style={{ fontSize: 12, color: '#E0F2FE' }}>
                <strong>Vínculo Ativo:</strong>{' '}
                {ROLE_LABELS[mvpContext.activeRole.toLowerCase()] || mvpContext.activeRole}.{' '}
                <span>
                  Alternar para Responsável não herda permissões profissionais e restringe o acesso apenas aos
                  estudantes vinculados.
                </span>
              </div>
              <select
                aria-label="Selecionar vínculo institucional"
                value={mvpContext.membershipId}
                disabled={switchingContext}
                onChange={(e) => handleSwitchContext(e.target.value)}
                style={{
                  minHeight: 34,
                  height: 34,
                  padding: '0 10px',
                  borderRadius: 6,
                  background: '#0F172A',
                  border: '1px solid rgba(56, 189, 248, 0.4)',
                  color: '#F8FAFC',
                  fontSize: 12,
                }}
              >
                {mvpActiveMemberships.map((m) => (
                  <option key={m.membershipId} value={m.membershipId}>
                    {m.personName || m.userId} ({ROLE_LABELS[m.role.toLowerCase()] || m.role})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Barra Acesso Autorizado da Família + Seletor Multi-Filho */}
          <div className="pp-student-header">
            <div className="pp-student-identity">
              <div
                className="pp-student-photo-rect"
                style={{
                  background: 'rgba(14, 165, 233, 0.16)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Users size={20} color="#38BDF8" />
              </div>
              <div className="pp-student-title-block">
                <div className="pp-student-top-line">
                  <h2 className="pp-student-name">
                    {mvpLoading
                      ? 'Sincronizando vínculos familiares...'
                      : selectedChild
                      ? selectedChild.full_name
                      : 'Acesso Autorizado da Família'}
                  </h2>
                  <span
                    className="pp-live-gate-pill"
                    style={{
                      background: 'rgba(14, 165, 233, 0.16)',
                      color: '#38BDF8',
                      borderColor: 'rgba(56, 189, 248, 0.4)',
                    }}
                  >
                    Acesso Autorizado da Família
                  </span>
                </div>
                <span className="pp-student-sub">
                  {selectedChild
                    ? [
                        mvpOverview?.school?.name,
                        selectedChild.class_name ? `Turma ${selectedChild.class_name}` : null,
                        selectedChild.registration_code
                          ? `Matrícula ${selectedChild.registration_code}`
                          : null,
                      ]
                        .filter(Boolean)
                        .join(' • ')
                    : 'Exibição restrita a estudantes vinculados e ativos'}
                </span>
              </div>
            </div>

            <div className="pp-header-actions">
              {authorizedStudents.length > 0 && (
                <select
                  aria-label="Selecionar estudante vinculado"
                  data-testid="parent-student-selector"
                  value={selectedChildId}
                  onChange={(e) => setSelectedChildId(e.target.value)}
                  style={{
                    minHeight: 32,
                    height: 32,
                    padding: '0 10px',
                    borderRadius: 6,
                    background: '#0F172A',
                    border: '1px solid rgba(56, 189, 248, 0.4)',
                    color: '#F8FAFC',
                    fontSize: 12,
                  }}
                >
                  {authorizedStudents.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.full_name} {st.class_name ? `(${st.class_name})` : ''}
                    </option>
                  ))}
                </select>
              )}

              <button
                type="button"
                className="pp-action-btn"
                onClick={loadMvp01FamilyData}
                disabled={mvpLoading}
              >
                <RefreshCw size={13} />
                <span>Atualizar</span>
              </button>

              {selectedChild && (
                <button
                  type="button"
                  className="pp-action-btn primary"
                  onClick={() => setShowBoletimModal(true)}
                >
                  <FileText size={13} />
                  <span>Boletim (Leitura)</span>
                </button>
              )}
            </div>
          </div>

          {/* Se houver erro de autorização OU nenhum estudante vinculado */}
          {mvpAuthError ? (
            <section
              className="pp-section"
              data-testid="parent-auth-notice"
              style={{
                borderColor: 'rgba(239, 68, 68, 0.4)',
                background: 'rgba(239, 68, 68, 0.08)',
                padding: 16,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#FCA5A5' }}>
                <ShieldAlert size={18} />
                <strong>Acesso não autorizado ou vínculo restrito</strong>
              </div>
              <p style={{ margin: '6px 0 0 0', fontSize: 12.5, color: '#FECACA' }}>{mvpAuthError}</p>
              {parentCandidateMembership &&
                mvpContext?.membershipId !== parentCandidateMembership.membershipId && (
                  <div style={{ marginTop: 10 }}>
                    <button
                      type="button"
                      className="pp-action-btn primary"
                      onClick={() => handleSwitchContext(parentCandidateMembership.membershipId)}
                    >
                      Alternar para meu vínculo de Responsável
                    </button>
                  </div>
                )}
            </section>
          ) : mvpLoading ? (
            <div className="pp-loading">Carregando dados autorizados da família...</div>
          ) : !selectedChild ? (
            <section
              className="pp-section"
              data-testid="parent-no-students-notice"
              style={{ padding: 18 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#FBBF24' }}>
                <AlertTriangle size={18} />
                <strong>Nenhum estudante ativo vinculado</strong>
              </div>
              <p style={{ margin: '6px 0 0 0', fontSize: 12.5, color: '#CBD5E1' }}>
                Não há estudantes ativos com permissão de acesso no portal vinculados a este responsável no momento.
                Para habilitar ou atualizar vínculos familiares, procure a Secretaria Escolar.
              </p>
            </section>
          ) : (
            <>
              <div className="pp-tabs">
                {mvpTabs.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    className={`pp-tab ${activeTab === tab.key ? 'active' : ''}`}
                    onClick={() => setActiveTab(tab.key)}
                  >
                    {tab.icon}
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>

              <div className="pp-content">
                {activeTab === 'resumo' && renderMvpResumo()}
                {activeTab === 'presenca' && renderMvpPresenca()}
                {activeTab === 'notas' && renderMvpNotas()}
                {activeTab === 'ocorrencias' && renderMvpOcorrencias()}
                {activeTab === 'mensagens' && renderMvpComunicados()}
              </div>
            </>
          )}

          {/* Modal Boletim Oficial (Leitura/Impressão MVP 0.1) */}
          {showBoletimModal && selectedChild && (
            <div
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(2, 6, 23, 0.85)',
                backdropFilter: 'blur(8px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1100,
                padding: 20,
              }}
              onClick={() => setShowBoletimModal(false)}
            >
              <div
                style={{
                  width: '100%',
                  maxWidth: 680,
                  maxHeight: '85vh',
                  overflowY: 'auto',
                  background: '#0B132B',
                  border: '1px solid rgba(56, 189, 248, 0.35)',
                  borderRadius: 14,
                  padding: 20,
                  color: '#F8FAFC',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 16 }}>
                      Boletim Escolar Publicado — {selectedChild.full_name}
                    </h3>
                    <span style={{ fontSize: 12, color: '#94A3B8' }}>
                      {mvpOverview?.school?.name || 'Unidade Escolar'} • Turma{' '}
                      {selectedChild.class_name || '—'} • Matrícula{' '}
                      {selectedChild.registration_code || selectedChild.id}
                    </span>
                  </div>
                  <button
                    type="button"
                    style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}
                    onClick={() => setShowBoletimModal(false)}
                    aria-label="Fechar boletim"
                  >
                    <X size={18} />
                  </button>
                </div>

                {renderMvpNotas()}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                  <button type="button" className="pp-action-btn" onClick={() => window.print()}>
                    <Printer size={13} />
                    <span>Imprimir</span>
                  </button>
                  <button
                    type="button"
                    className="pp-action-btn primary"
                    onClick={() => setShowBoletimModal(false)}
                  >
                    Fechar
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </PortalLayout>
    );
  }

  // =========================================================================
  // RENDERIZAÇÃO LEGADA (EXCLUSIVA PARA !isMvp01Active())
  // =========================================================================
  const attendanceRate =
    attendance && attendance.totalDays > 0
      ? Math.round((attendance.presentDays / attendance.totalDays) * 100)
      : null;

  const avgGeneral =
    grades.length > 0
      ? (grades.reduce((a, g) => a + g.average, 0) / grades.length).toFixed(1)
      : null;

  const renderNeuroRotina = () => (
    <div className="pp-neuro-container">
      <div className="pp-neuro-hero">
        <div className="pp-neuro-hero-text">
          <h3>
            <Flame size={16} color="#F97316" />
            Radar Neuro-Pedagógico & Retenção Ebbinghaus
          </h3>
          <p>
            Monitoramento inteligente da rotina de consolidação do aluno. Combina o espaçamento cognitivo (+24h,
            +48h, +96h, +144h) e o método de maestria progressiva Áquila para eliminar a lacuna entre as aulas
            semanais (Quinta a Quinta).
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              fontWeight: 800,
              padding: '4px 10px',
              borderRadius: 6,
              background: 'rgba(16, 185, 129, 0.16)',
              color: '#10B981',
              border: '1px solid rgba(16, 185, 129, 0.35)',
            }}
          >
            CICLO ATIVO: ELETROSTÁTICA & VETORES
          </span>
        </div>
      </div>

      <div className="pp-neuro-kpi-grid">
        <div className="pp-neuro-kpi-card">
          <div className="pp-neuro-kpi-info">
            <span className="pp-neuro-kpi-label">SEQUÊNCIA ATIVA</span>
            <span className="pp-neuro-kpi-value" style={{ color: '#F97316' }}>
              12 Dias 🔥
            </span>
            <span className="pp-neuro-kpi-sub">Hábito de estudo diário</span>
          </div>
          <div className="pp-neuro-kpi-icon" style={{ background: 'rgba(249, 115, 22, 0.14)', color: '#F97316' }}>
            <Flame size={20} />
          </div>
        </div>

        <div className="pp-neuro-kpi-card">
          <div className="pp-neuro-kpi-info">
            <span className="pp-neuro-kpi-label">RETENÇÃO ESTIMADA</span>
            <span className="pp-neuro-kpi-value" style={{ color: '#10B981' }}>
              92.4%
            </span>
            <span className="pp-neuro-kpi-sub">Curva de Ebbinghaus protegida</span>
          </div>
          <div className="pp-neuro-kpi-icon" style={{ background: 'rgba(16, 185, 129, 0.14)', color: '#10B981' }}>
            <Brain size={20} />
          </div>
        </div>

        <div className="pp-neuro-kpi-card">
          <div className="pp-neuro-kpi-info">
            <span className="pp-neuro-kpi-label">PODCASTS NOTEBOOKLM</span>
            <span className="pp-neuro-kpi-value" style={{ color: '#A78BFA' }}>
              4 Episódios
            </span>
            <span className="pp-neuro-kpi-sub">Sofia & Lucas no Mobile</span>
          </div>
          <div className="pp-neuro-kpi-icon" style={{ background: 'rgba(167, 139, 250, 0.14)', color: '#A78BFA' }}>
            <Radio size={20} />
          </div>
        </div>

        <div className="pp-neuro-kpi-card">
          <div className="pp-neuro-kpi-info">
            <span className="pp-neuro-kpi-label">MAESTRIA ENEM & PAS</span>
            <span className="pp-neuro-kpi-value" style={{ color: '#00F0FF' }}>
              850 XP
            </span>
            <span className="pp-neuro-kpi-sub">Simulados UnB / UFG / UFMG</span>
          </div>
          <div className="pp-neuro-kpi-icon" style={{ background: 'rgba(0, 240, 255, 0.14)', color: '#00F0FF' }}>
            <Sparkles size={20} />
          </div>
        </div>
      </div>

      {(() => {
        const currentDinnerScript =
          DINNER_CONVERSATION_SCRIPTS[selectedDinnerGradeIdx] || DINNER_CONVERSATION_SCRIPTS[0];
        const whatsappText = `🦅 *Áquila Pro — Conexão Família & Escola (${currentDinnerScript?.gradeLevel})*\n\n*Pergunta para o Jantar:* "${currentDinnerScript?.sparkQuestion}"\n\n💡 *Dica Científica:* ${currentDinnerScript?.topicSummaryPlainLanguage}\n\n🤝 *Papo em Família:* ${currentDinnerScript?.followUpHook}`;
        const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(whatsappText)}`;

        return (
          <div className="pp-dinner-card">
            <div className="pp-dinner-header">
              <span className="pp-dinner-tag">
                <Sparkles size={13} color="#F59E0B" />
                PERGUNTA DE OURO PARA O JANTAR EM FAMÍLIA (CONEXÃO PAIS &amp; FILHOS)
              </span>
              <span style={{ fontSize: '11px', color: '#94A3B8' }}>
                Sem cobrança de notas • Estímulo ao Pensamento Crítico
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', margin: '10px 0 12px 0' }}>
              <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#94A3B8' }}>SÉRIE:</span>
              {DINNER_CONVERSATION_SCRIPTS.map((script, idx) => (
                <button
                  key={script.gradeLevel}
                  type="button"
                  onClick={() => setSelectedDinnerGradeIdx(idx)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 8,
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    background:
                      selectedDinnerGradeIdx === idx
                        ? 'rgba(245, 158, 11, 0.25)'
                        : 'rgba(30, 41, 59, 0.55)',
                    border:
                      selectedDinnerGradeIdx === idx
                        ? '1px solid #F59E0B'
                        : '1px solid rgba(148, 163, 184, 0.2)',
                    color: selectedDinnerGradeIdx === idx ? '#FDE68A' : '#94A3B8',
                  }}
                >
                  {script.gradeLevel}
                </button>
              ))}
            </div>

            <div className="pp-dinner-question-box">
              <p className="pp-dinner-question">"{currentDinnerScript?.sparkQuestion}"</p>
              <p className="pp-dinner-explanation">
                <strong>💡 Dica Científica para os Pais ({currentDinnerScript?.gradeLevel}):</strong>{' '}
                {currentDinnerScript?.topicSummaryPlainLanguage} {currentDinnerScript?.followUpHook}{' '}
                <em>{currentDinnerScript?.closingEncouragement}</em>
              </p>
            </div>

            <div className="pp-dinner-actions" style={{ flexWrap: 'wrap', gap: 10 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  className="pp-action-btn"
                  onClick={() => {
                    navigator.clipboard?.writeText(whatsappText);
                    setDinnerCopied(true);
                    setTimeout(() => setDinnerCopied(false), 3000);
                  }}
                >
                  {dinnerCopied ? <Check size={13} /> : <Copy size={13} />}
                  <span>{dinnerCopied ? 'Copiado!' : 'Copiar Texto Completo'}</span>
                </button>
                <button
                  className="pp-action-btn"
                  onClick={() => window.open(whatsappUrl, '_blank')}
                >
                  <MessageCircle size={13} />
                  <span>Enviar no WhatsApp</span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );

  const renderPresenca = () => (
    <div className="pp-section">
      <div className="pp-section-header-row">
        <h3 className="pp-section-title">
          <Clock size={14} color="#10B981" /> Presença & Portaria (Crachá QR Dinâmico • Padrão ANPD)
        </h3>
        <span className="pp-section-tag">REGISTRO LOCAL AUDITÁVEL</span>
      </div>
      {!attendance ? (
        <div style={{ padding: '18px 14px', color: '#94A3B8', fontSize: '0.84rem' }}>
          Nenhum registro oficial de portaria ou frequência localizado para este estudante.
        </div>
      ) : (
        <div className="pp-presence-detail">
          <div className="pp-presence-row">
            <Shield size={13} style={{ color: '#10B981' }} />
            <span>Última entrada registrada:</span>
            <strong>{attendance.lastEntry || 'Não registrado'}</strong>
          </div>
          <div className="pp-presence-row">
            <Shield size={13} style={{ color: '#F59E0B' }} />
            <span>Última saída registrada:</span>
            <strong>{attendance.lastExit || 'Não registrado'}</strong>
          </div>
          <div className="pp-presence-row">
            <Calendar size={13} style={{ color: '#38BDF8' }} />
            <span>Faltas acumuladas no bimestre:</span>
            <strong style={{ color: attendance.absences > 10 ? '#EF4444' : '#10B981' }}>
              {attendance.absences} faltas
            </strong>
          </div>
          <div className="pp-attendance-bar large">
            <div style={{ flex: 1, background: 'rgba(255,255,255,0.08)', borderRadius: 3 }}>
              <div
                className="pp-bar-fill"
                style={{
                  width: `${attendanceRate ?? 0}%`,
                  background: (attendanceRate ?? 0) >= 75 ? '#10B981' : '#EF4444',
                }}
              />
            </div>
            <span className="pp-bar-label">
              {attendanceRate !== null ? `${attendanceRate}% frequência apurada` : 'Sem cálculo de frequência'}
            </span>
          </div>
        </div>
      )}
    </div>
  );

  const renderNotas = () => (
    <div className="pp-section">
      <div className="pp-section-header-row">
        <h3 className="pp-section-title">
          <BookOpen size={14} color="#38BDF8" /> Desempenho por Disciplina
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            className="pp-action-btn primary"
            style={{ height: 26, padding: '0 10px', fontSize: '0.74rem' }}
            onClick={() => setShowBoletimModal(true)}
            disabled={!effectiveStudentId}
          >
            <FileText size={12} />
            <span>Emitir Boletim Oficial (PDF)</span>
          </button>
          <span className="pp-section-tag">MÉDIA GERAL: {avgGeneral ?? '—'}</span>
        </div>
      </div>
      {grades.length === 0 ? (
        <div style={{ padding: '18px 14px', color: '#94A3B8', fontSize: '0.84rem' }}>
          Nenhuma nota validada por docente foi lançada até o momento para este estudante.
        </div>
      ) : (
        <div className="pp-grades-list">
          {grades.map((g, i) => (
            <div key={i} className="pp-grade-row">
              <span className="pp-grade-subject">{g.subject}</span>
              <div className="pp-grade-bar-wrap">
                <div
                  className="pp-grade-bar"
                  style={{
                    width: `${(g.average / 10) * 100}%`,
                    background: g.average >= 7 ? '#10B981' : g.average >= 5 ? '#F59E0B' : '#EF4444',
                  }}
                />
              </div>
              <span
                className="pp-grade-value"
                style={{
                  color: g.average >= 7 ? '#10B981' : g.average >= 5 ? '#F59E0B' : '#EF4444',
                }}
              >
                {g.average.toFixed(1)}
              </span>
              {g.trend === 'up' ? (
                <TrendingUp size={13} style={{ color: '#10B981' }} />
              ) : g.trend === 'down' ? (
                <TrendingDown size={13} style={{ color: '#EF4444' }} />
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderFinanceiro = () => (
    <div className="pp-section">
      <div className="pp-section-header-row">
        <h3 className="pp-section-title">
          <DollarSign size={14} color="#10B981" /> Situação Financeira & Mensalidades
        </h3>
        <span className="pp-section-tag">{financial ? 'HISTÓRICO FINANCEIRO' : 'SEM TÍTULOS VINCULADOS'}</span>
      </div>
      {!financial ? (
        <div style={{ padding: '18px 14px', color: '#94A3B8', fontSize: '0.84rem' }}>
          Nenhum título financeiro em aberto ou histórico vinculado a este estudante.
        </div>
      ) : (
        <div className="pp-financial-card">
          <div className="pp-financial-status" style={{ borderColor: statusColors[financial.status] }}>
            {financial.status === 'adimplente' ? (
              <CheckCircle2 size={18} style={{ color: '#10B981' }} />
            ) : (
              <AlertTriangle size={18} style={{ color: statusColors[financial.status] }} />
            )}
            <span style={{ color: statusColors[financial.status], fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
              {statusLabel[financial.status]}
            </span>
          </div>
          {financial.nextDueDate && (
            <div className="pp-next-due">
              <Calendar size={13} />
              <span>
                Próximo vencimento: <strong>{financial.nextDueDate}</strong>
              </span>
              {financial.nextAmount != null && (
                <strong style={{ marginLeft: 'auto' }}>R$ {financial.nextAmount.toFixed(2)}</strong>
              )}
            </div>
          )}
          <div style={{ marginTop: 8, display: 'flex', gap: 10 }}>
            <button
              className="pp-action-btn primary"
              style={{ width: '100%', height: 32, justifyContent: 'center' }}
              onClick={() => setShowPixModal(true)}
            >
              <QrCode size={14} />
              <span>Ver Cobrança PIX</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const renderConquistas = () => (
    <div className="pp-section">
      <div className="pp-section-header-row">
        <h3 className="pp-section-title">
          <Award size={14} color="#F59E0B" /> Conquistas BNCC & Mentores de Elite
        </h3>
        <span className="pp-section-tag">2.680 XP ACUMULADO</span>
      </div>
      <div style={{ marginTop: 14, color: '#94A3B8', fontSize: 13 }}>
        Insígnias conquistadas pelo aluno no modo completo.
      </div>
    </div>
  );

  const renderMensagens = () => (
    <div className="pp-section">
      <div className="pp-section-header-row">
        <h3 className="pp-section-title">
          <Bell size={14} color="#A78BFA" /> Comunicados Oficiais da Escola
        </h3>
        <span className="pp-section-tag">{unreadCount} NÃO LIDOS</span>
      </div>
      {notifications.length === 0 ? (
        <div style={{ padding: '18px 14px', color: '#94A3B8', fontSize: '0.84rem' }}>
          Nenhum comunicado oficial localizado para este estudante.
        </div>
      ) : (
        <div className="pp-notifications-list">
          {notifications.map((n) => (
            <div key={n.id} className={`pp-notification ${!n.readAt ? 'unread' : ''}`}>
              <div className="pp-notif-type-dot" style={{ background: typeColors[n.type] }} />
              <div className="pp-notif-body">
                <div className="pp-notif-header">
                  <span className="pp-notif-tag" style={{ color: typeColors[n.type] }}>
                    {typeLabels[n.type]}
                  </span>
                  <span className="pp-notif-time">{n.sentAt}</span>
                </div>
                <strong className="pp-notif-title">{n.title}</strong>
                <p className="pp-notif-text">{n.body}</p>
                <span className="pp-notif-sender">ENVIADO POR: {n.sender.toUpperCase()}</span>
              </div>
              {!n.readAt && <div className="pp-unread-dot" />}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderOcorrencias = () => (
    <div className="pp-section">
      <div className="pp-section-header-row">
        <h3 className="pp-section-title">
          <Shield size={14} color="#818CF8" /> Ocorrências Disciplinares, Pedagógicas & Mérito
        </h3>
        <span className="pp-section-tag">CONFORMIDADE LGPD</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
        {parentOccurrences.map((occ) => (
          <div
            key={occ.id}
            style={{
              padding: 16,
              borderRadius: 14,
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                  {occ.category} • {occ.date} às {occ.time}
                </div>
                <strong style={{ fontSize: '0.95rem', color: '#f8fafc' }}>{occ.title}</strong>
              </div>
              {occ.signed ? (
                <div style={{ color: '#34d399', fontSize: '0.75rem', fontWeight: 700 }}>CIÊNCIA CONFIRMADA</div>
              ) : (
                <button
                  className="pp-action-btn primary"
                  style={{ height: 28, padding: '0 12px', fontSize: '0.76rem' }}
                  onClick={() => handleSignOccurrence(occ.id)}
                >
                  <CheckCircle2 size={14} />
                  <span>Confirmar Ciência Digital</span>
                </button>
              )}
            </div>
            <p style={{ margin: 0, fontSize: '0.84rem', color: '#cbd5e1' }}>{occ.description}</p>
          </div>
        ))}
      </div>
    </div>
  );

  const renderResumo = () => (
    <>
      <div className="pp-resumo-grid">
        <div className="pp-summary-card" onClick={() => setActiveTab('presenca')}>
          <div className="pp-card-body">
            <span className="pp-card-label">PRESENÇA HOJE</span>
            <span className="pp-card-value" style={{ color: '#10B981' }}>
              {attendanceRate !== null ? `${attendanceRate}% FREQ.` : '—'}
            </span>
            <span className="pp-card-sub">
              {attendance?.lastEntry ? `Entrada: ${attendance.lastEntry}` : 'Sem registro de portaria'}
            </span>
          </div>
          <div className="pp-card-icon" style={{ background: 'rgba(16,185,129,0.14)', color: '#10B981' }}>
            <Clock size={18} />
          </div>
        </div>

        <div className="pp-summary-card" onClick={() => setActiveTab('notas')}>
          <div className="pp-card-body">
            <span className="pp-card-label">MÉDIA ACADÊMICA</span>
            <span className="pp-card-value" style={{ color: '#00F0FF' }}>
              {avgGeneral !== null ? `${avgGeneral} / 10` : '—'}
            </span>
            <span className="pp-card-sub">
              {grades.length > 0 ? `${grades.length} disciplinas avaliadas` : 'Sem avaliações lançadas'}
            </span>
          </div>
          <div className="pp-card-icon" style={{ background: 'rgba(0,240,255,0.12)', color: '#00F0FF' }}>
            <BookOpen size={18} />
          </div>
        </div>

        <div className="pp-summary-card" onClick={() => setActiveTab('financeiro')}>
          <div className="pp-card-body">
            <span className="pp-card-label">FINANCEIRO</span>
            <span
              className="pp-card-value"
              style={{ color: financial ? statusColors[financial.status] : '#94A3B8' }}
            >
              {financial ? statusLabel[financial.status] : '—'}
            </span>
            <span className="pp-card-sub">
              {financial?.nextDueDate ? `Próx. venc.: ${financial.nextDueDate}` : 'Situação consultada'}
            </span>
          </div>
          <div className="pp-card-icon" style={{ background: 'rgba(148,163,184,0.12)', color: '#94A3B8' }}>
            <DollarSign size={18} />
          </div>
        </div>

        <div className="pp-summary-card" onClick={() => setActiveTab('neuro-rotina')}>
          <div className="pp-card-body">
            <span className="pp-card-label">ACOMPANHAMENTO DOCENTE</span>
            <span className="pp-card-value" style={{ color: '#A78BFA' }}>
              Regência Humana
            </span>
            <span className="pp-card-sub">
              {behavioralInsight?.telemetryBlocked !== false
                ? 'Inferência Emocional Desativada (CNE 15/2026)'
                : behavioralInsight?.currentMood}
            </span>
          </div>
          <div className="pp-card-icon" style={{ background: 'rgba(139,92,246,0.14)', color: '#A78BFA' }}>
            <Brain size={18} />
          </div>
        </div>
      </div>

      <div className="pp-bento-two-col">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {renderNotas()}
          {renderPresenca()}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {renderMensagens()}
          {renderFinanceiro()}
        </div>
      </div>
    </>
  );

  const pendingOccCount = parentOccurrences.filter((o) => !o.signed).length;
  const ALL_TABS: { key: typeof activeTab; label: string; icon: React.ReactNode }[] = [
    { key: 'resumo', label: 'Visão Geral', icon: <User size={13} /> },
    { key: 'neuro-rotina', label: 'Rotina de Estudos & Neuro-IA', icon: <Flame size={13} color="#F97316" /> },
    { key: 'presenca', label: 'Presença & Portaria', icon: <Clock size={13} /> },
    { key: 'notas', label: 'Boletim & Notas', icon: <BookOpen size={13} /> },
    { key: 'conquistas', label: 'Conquistas & BNCC', icon: <Award size={13} /> },
    { key: 'financeiro', label: 'Financeiro & PIX', icon: <DollarSign size={13} /> },
    {
      key: 'ocorrencias',
      label: `Ocorrências${pendingOccCount > 0 ? ` (${pendingOccCount})` : ''}`,
      icon: <Shield size={13} />,
    },
    {
      key: 'mensagens',
      label: `Comunicados${unreadCount > 0 ? ` (${unreadCount})` : ''}`,
      icon: <Bell size={13} />,
    },
    { key: 'marketplace', label: 'Marketplace Escolar', icon: <MessageCircle size={13} /> },
  ];

  if (currentPage === 'mobile-parent-app') {
    return (
      <PortalLayout
        portalName="Canal Família & Conexão"
        themeColor="#0EA5E9"
        onNavigate={onNavigate}
        sessionUser={resolvedSessionUser}
      >
        <MobileParentApp
          onBack={() => onNavigate('parent-portal')}
          studentName={studentName || 'Lucas Piloto Silva'}
        />
      </PortalLayout>
    );
  }

  return (
    <PortalLayout
      portalName="Canal Família & Conexão"
      themeColor="#0EA5E9"
      onNavigate={onNavigate}
      sessionUser={resolvedSessionUser}
    >
      <div className="pp-container">
        <div className="pp-student-header">
          <div className="pp-student-identity">
            <img
              src="./avatars/face-3.jpg"
              alt={studentName || 'Estudante'}
              className="pp-student-photo-rect"
            />
            <div className="pp-student-title-block">
              <div className="pp-student-top-line">
                <h2 className="pp-student-name">
                  {loading ? 'Sincronizando...' : studentName || PILOT_FALLBACK_NAME}
                </h2>
                <span className="pp-live-gate-pill">
                  {attendance?.lastEntry
                    ? `● NA ESCOLA • ${attendance.lastEntry}`
                    : '● SEM REGISTRO DE PORTARIA'}
                </span>
              </div>
              <span className="pp-student-sub">
                {studentMeta
                  ? [
                      studentMeta.className,
                      studentMeta.ra ? `MATRÍCULA #${studentMeta.ra}` : null,
                      studentMeta.seatLabel,
                    ]
                      .filter(Boolean)
                      .join(' • ') || `ESTUDANTE #${effectiveStudentId}`
                  : `ESTUDANTE #${effectiveStudentId}`}
              </span>
            </div>
          </div>

          <div className="pp-header-actions">
            <button
              className="pp-action-btn primary"
              onClick={() => setShowBoletimModal(true)}
              disabled={!effectiveStudentId}
            >
              <FileText size={14} />
              <span>Boletim Oficial</span>
            </button>
            <button className="pp-action-btn" onClick={() => setActiveTab('mensagens')}>
              <Bell size={14} />
              <span>Avisos ({unreadCount})</span>
            </button>
            <button className="pp-action-btn primary" onClick={() => onNavigate('mobile-parent-app')}>
              <Smartphone size={14} />
              <span>Simulador App Família</span>
            </button>
          </div>
        </div>

        <div className="pp-tabs">
          {ALL_TABS.map((tab) => (
            <button
              key={tab.key}
              className={`pp-tab ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="pp-content">
          {loading ? (
            <div className="pp-loading">Carregando telemetria familiar...</div>
          ) : (
            <>
              {activeTab === 'resumo' && renderResumo()}
              {activeTab === 'neuro-rotina' && renderNeuroRotina()}
              {activeTab === 'presenca' && renderPresenca()}
              {activeTab === 'notas' && renderNotas()}
              {activeTab === 'conquistas' && renderConquistas()}
              {activeTab === 'financeiro' && renderFinanceiro()}
              {activeTab === 'ocorrencias' && renderOcorrencias()}
              {activeTab === 'marketplace' && <CommunityMarketplace />}
              {activeTab === 'mensagens' && renderMensagens()}
            </>
          )}
        </div>

        {showBoletimModal && effectiveStudentId && (
          <AcademicReportCard
            student={{
              id: effectiveStudentId,
              name: studentName || PILOT_FALLBACK_NAME,
              className: studentMeta?.className || PILOT_FALLBACK_META.className,
              teacher: studentMeta?.teacher || PILOT_FALLBACK_META.teacher,
              period: 'Ano Letivo Atual',
              ra: studentMeta?.ra || effectiveStudentId,
            }}
            onClose={() => setShowBoletimModal(false)}
          />
        )}

        {showPixModal && financial && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(2, 6, 23, 0.85)',
              backdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1100,
              padding: 20,
            }}
            onClick={() => setShowPixModal(false)}
          >
            <div
              style={{
                width: '100%',
                maxWidth: 460,
                background: '#0B132B',
                border: '1px solid rgba(0, 240, 255, 0.3)',
                borderRadius: 20,
                padding: 24,
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <QrCode size={18} color="#00F0FF" />
                  <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#fff', fontWeight: 800 }}>
                    Cobrança PIX Institucional
                  </h3>
                </div>
                <button
                  style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                  onClick={() => setShowPixModal(false)}
                >
                  <X size={18} />
                </button>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#10B981' }}>
                  {financial.nextAmount != null
                    ? `R$ ${financial.nextAmount.toFixed(2)}`
                    : 'Valor quitado / em dia'}
                </div>
                <button
                  type="button"
                  className="pp-action-btn primary"
                  style={{ marginTop: 12, width: '100%', height: 34, justifyContent: 'center' }}
                  onClick={() => {
                    const pixCode = `00020126580014BR.GOV.BCB.PIX0136aquila-tesouraria-${effectiveStudentId}@escola.edu.br5204000053039865802BR5916AQUILA PRO EDU6008GOIANIA62070503***6304A1B2`;
                    navigator.clipboard?.writeText(pixCode).catch(() => {});
                    setPixCopied(true);
                    setTimeout(() => setPixCopied(false), 3000);
                  }}
                >
                  {pixCopied ? <Check size={14} /> : <Copy size={14} />}
                  <span>{pixCopied ? 'Código PIX Copiado!' : 'Copiar Código PIX Copia e Cola'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PortalLayout>
  );
};

export default ParentPortal;
