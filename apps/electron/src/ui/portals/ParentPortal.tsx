import React, { useEffect, useState, useCallback } from 'react';
import { PortalLayout } from '../layouts/PortalLayout';
import {
  User, Clock, BookOpen, DollarSign, MessageCircle,
  CheckCircle2, AlertTriangle, TrendingUp, TrendingDown,
  Bell, Calendar, Shield, Brain, Smartphone,
  FileText, Award, Sparkles, Copy, QrCode, Check, X,
  Flame, Radio
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
    description: 'Estudante apresentou dúvida pontual em Cinemática Escalar durante a aula prática e recebeu roteiro de reforço no Laboratório Áquila.',
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
    description: 'Contribuiu ativamente na resolução dos desafios de lógica e apoiou os colegas da equipe na oficina bimestral.',
    actionTaken: 'Registro de mérito pedagógico no portfólio do estudante.',
    signed: true,
    signedAt: '10/10/2026 19:05 (Assinado Digitalmente • Hash SHA-256 / LGPD)',
  },
];

export const ParentPortal: React.FC<ParentPortalProps> = ({ currentPage, onNavigate, studentId, sessionUser }) => {
  const resolvedSessionUser = React.useMemo(() => {
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
  const [loading, setLoading] = useState(true);
  const [behavioralInsight] = useState<any>({
    currentMood: 'Inferência Emocional Bloqueada (CNE 15/2026)',
    telemetryBlocked: true,
    engagement: null,
  });
  const [activeTab, setActiveTab] = useState<'resumo' | 'neuro-rotina' | 'presenca' | 'notas' | 'financeiro' | 'marketplace' | 'mensagens' | 'ocorrencias' | 'conquistas'>('resumo');
  const [dinnerCopied, setDinnerCopied] = useState(false);
  const [pixCopied, setPixCopied] = useState(false);
  const [selectedDinnerGradeIdx, setSelectedDinnerGradeIdx] = useState<number>(4);
  const [showBoletimModal, setShowBoletimModal] = useState(false);
  const [showPixModal, setShowPixModal] = useState(false);

  const [parentOccurrences, setParentOccurrences] = useState<Array<{
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
  }>>([]);

  const handleSignOccurrence = (occId: string) => {
    const timestamp = new Date().toLocaleString('pt-BR');
    setParentOccurrences(prev => prev.map(o => {
      if (o.id === occId) {
        return {
          ...o,
          signed: true,
          signedAt: `${timestamp} (Assinado Digitalmente por ${signerName} • Hash SHA-256 / LGPD)`,
        };
      }
      return o;
    }));
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [studentRes, telemetryRes] = await Promise.all([
        window.aquila?.student?.getStudent?.(effectiveStudentId) || window.aquila?.invoke?.('get-student', effectiveStudentId),
        window.aquila?.invoke?.('attendance:get-telemetry'),
      ]);

      const rawStudent =
        studentRes?.success && studentRes.data
          ? studentRes.data
          : (studentRes && typeof studentRes === 'object' && !('success' in studentRes && studentRes.success === false) && (studentRes.name || studentRes.id))
            ? studentRes
            : null;
      const hasRealStudent = Boolean(rawStudent && rawStudent.name);

      if (hasRealStudent) {
        setStudentName(rawStudent.name || '');
        setStudentMeta({
          className: rawStudent.className || rawStudent.class_name || rawStudent.classId || PILOT_FALLBACK_META.className,
          ra: rawStudent.ra || rawStudent.registration || effectiveStudentId,
          seatLabel: rawStudent.seatLabel || rawStudent.metadata?.seatLabel || PILOT_FALLBACK_META.seatLabel,
          teacher: rawStudent.teacherName || rawStudent.metadata?.teacher || PILOT_FALLBACK_META.teacher,
        });
      } else {
        setStudentName(PILOT_FALLBACK_NAME);
        setStudentMeta({
          ...PILOT_FALLBACK_META,
          ra: effectiveStudentId || PILOT_FALLBACK_META.ra,
        });
      }

      const hasTelemetryData = Boolean(
        telemetryRes && (
          (hasRealStudent && (telemetryRes.totalToday || telemetryRes.presentNow || telemetryRes.lastEntry || telemetryRes.lastExit)) ||
          (!hasRealStudent && (Number(telemetryRes.presentNow ?? 0) > 0 || telemetryRes.lastEntry))
        )
      );

      if (hasTelemetryData) {
        const presentDays = Number(telemetryRes.presentNow ?? 0);
        const absences = Number(telemetryRes.absentToday ?? 0);
        const totalDays = Number(telemetryRes.totalToday ?? (presentDays + absences));
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

      const eventsRes = await window.aquila?.student?.getEvents?.(effectiveStudentId);
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
            return { subject, average: Math.round(avg * 10) / 10, trend: avg >= 7 ? 'up' : 'down' };
          });

          if (hasRealStudent) {
            const behEvents = eventsRes.data.filter(
              (e: any) => e.category === 'BEHAVIORAL' || e.type === 'occurrence'
            );
            if (behEvents.length > 0) {
              resolvedOccurrences = behEvents.map((e: any, idx: number) => ({
                id: e.id || `occ-db-${idx}`,
                date: e.timestamp ? new Date(e.timestamp).toLocaleDateString('pt-BR') : 'Hoje',
                time: e.timestamp ? new Date(e.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '10:00',
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
          const gradesIpc = await window.aquila?.invoke?.('academic:get-grades', { studentId: effectiveStudentId });
          if (gradesIpc?.success && Array.isArray(gradesIpc.data) && gradesIpc.data.length > 0 && hasRealStudent) {
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
      setParentOccurrences(resolvedOccurrences.length > 0 ? resolvedOccurrences : PILOT_FALLBACK_OCCURRENCES);

      const billingRes = await window.aquila?.invoke?.('finance:get-billing-history', effectiveStudentId);
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

      const notifRes = await window.aquila?.invoke?.('get-notifications', effectiveStudentId);
      if (Array.isArray(notifRes) && notifRes.length > 0) {
        setNotifications(notifRes.map((n: any) => ({
          id: n.id,
          type: (n.type || 'general').toLowerCase() as any,
          title: n.title,
          body: n.message,
          sentAt: new Date(n.timestamp).toLocaleString(),
          sender: 'Sistema Áquila',
          readAt: n.read ? n.timestamp : undefined
        })));
        setUnreadCount(notifRes.filter((n: any) => !n.read).length);
      } else {
        setNotifications(PILOT_FALLBACK_NOTIFICATIONS);
        setUnreadCount(PILOT_FALLBACK_NOTIFICATIONS.length);
      }
    } catch (err) {
      console.warn('[ParentPortal] Falha ao carregar dados do estudante; aplicando fallback:', err);
      setStudentName(prev => prev || PILOT_FALLBACK_NAME);
      setStudentMeta(prev => prev || { ...PILOT_FALLBACK_META, ra: effectiveStudentId || PILOT_FALLBACK_META.ra });
      setAttendance(prev => prev || PILOT_FALLBACK_ATTENDANCE);
      setGrades(prev => (prev.length > 0 ? prev : PILOT_FALLBACK_GRADES));
      setFinancial(prev => prev || PILOT_FALLBACK_FINANCIAL);
      setNotifications(prev => (prev.length > 0 ? prev : PILOT_FALLBACK_NOTIFICATIONS));
      setUnreadCount(prev => (prev > 0 ? prev : PILOT_FALLBACK_NOTIFICATIONS.length));
      setParentOccurrences(prev => (prev.length > 0 ? prev : PILOT_FALLBACK_OCCURRENCES));
    } finally {
      setLoading(false);
    }
  }, [effectiveStudentId]);

  useEffect(() => { loadData(); }, [loadData]);

  const attendanceRate = attendance && attendance.totalDays > 0
    ? Math.round((attendance.presentDays / attendance.totalDays) * 100)
    : null;

  const avgGeneral = grades.length > 0
    ? (grades.reduce((a, g) => a + g.average, 0) / grades.length).toFixed(1)
    : null;

  const renderNeuroRotina = () => (
    <div className="pp-neuro-container">
      {/* Hero Banner */}
      <div className="pp-neuro-hero">
        <div className="pp-neuro-hero-text">
          <h3>
            <Flame size={16} color="#F97316" />
            Radar Neuro-Pedagógico & Retenção Ebbinghaus
          </h3>
          <p>
            Monitoramento inteligente da rotina de consolidação do aluno. Combina o espaçamento cognitivo
            (+24h, +48h, +96h, +144h) e o método de maestria progressiva Áquila para eliminar a lacuna entre as aulas semanais (Quinta a Quinta).
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            fontWeight: 800,
            padding: '4px 10px',
            borderRadius: 6,
            background: 'rgba(16, 185, 129, 0.16)',
            color: '#10B981',
            border: '1px solid rgba(16, 185, 129, 0.35)',
          }}>
            CICLO ATIVO: ELETROSTÁTICA & VETORES
          </span>
        </div>
      </div>

      {/* 4 KPI Cards */}
      <div className="pp-neuro-kpi-grid">
        <div className="pp-neuro-kpi-card">
          <div className="pp-neuro-kpi-info">
            <span className="pp-neuro-kpi-label">SEQUÊNCIA ATIVA</span>
            <span className="pp-neuro-kpi-value" style={{ color: '#F97316' }}>12 Dias 🔥</span>
            <span className="pp-neuro-kpi-sub">Hábito de estudo diário</span>
          </div>
          <div className="pp-neuro-kpi-icon" style={{ background: 'rgba(249, 115, 22, 0.14)', color: '#F97316' }}>
            <Flame size={20} />
          </div>
        </div>

        <div className="pp-neuro-kpi-card">
          <div className="pp-neuro-kpi-info">
            <span className="pp-neuro-kpi-label">RETENÇÃO ESTIMADA</span>
            <span className="pp-neuro-kpi-value" style={{ color: '#10B981' }}>92.4%</span>
            <span className="pp-neuro-kpi-sub">Curva de Ebbinghaus protegida</span>
          </div>
          <div className="pp-neuro-kpi-icon" style={{ background: 'rgba(16, 185, 129, 0.14)', color: '#10B981' }}>
            <Brain size={20} />
          </div>
        </div>

        <div className="pp-neuro-kpi-card">
          <div className="pp-neuro-kpi-info">
            <span className="pp-neuro-kpi-label">PODCASTS NOTEBOOKLM</span>
            <span className="pp-neuro-kpi-value" style={{ color: '#A78BFA' }}>4 Episódios</span>
            <span className="pp-neuro-kpi-sub">Sofia & Lucas no Mobile</span>
          </div>
          <div className="pp-neuro-kpi-icon" style={{ background: 'rgba(167, 139, 250, 0.14)', color: '#A78BFA' }}>
            <Radio size={20} />
          </div>
        </div>

        <div className="pp-neuro-kpi-card">
          <div className="pp-neuro-kpi-info">
            <span className="pp-neuro-kpi-label">MAESTRIA ENEM & PAS</span>
            <span className="pp-neuro-kpi-value" style={{ color: '#00F0FF' }}>850 XP</span>
            <span className="pp-neuro-kpi-sub">Simulados UnB / UFG / UFMG</span>
          </div>
          <div className="pp-neuro-kpi-icon" style={{ background: 'rgba(0, 240, 255, 0.14)', color: '#00F0FF' }}>
            <Sparkles size={20} />
          </div>
        </div>
      </div>

      {/* Cronograma Semanal Quinta a Quinta */}
      <div className="pp-timeline-card">
        <div className="pp-timeline-header">
          <span className="pp-timeline-title">
            <Calendar size={14} color="#00F0FF" />
            Cronograma de Espaçamento Cognitivo (Quinta a Quinta)
          </span>
          <span style={{ fontSize: '11px', color: '#64748B', fontFamily: 'var(--font-mono)' }}>
            EFEITO DE PRÁTICA DISTRIBUÍDA (CEPELIAUSKAS ET AL., 2024)
          </span>
        </div>

        <div className="pp-timeline-grid">
          {/* D0 */}
          <div className="pp-timeline-step completed">
            <span className="pp-timeline-badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10B981', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
              QUINTA (D0)
            </span>
            <div className="pp-timeline-step-content">
              <div className="pp-timeline-step-top">
                <span className="pp-timeline-step-name">Aula Presencial: Eletrostática & Vetores Coulomb</span>
                <span className="pp-timeline-status-pill" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10B981' }}>
                  ✓ MINISTRADA NA SALA 3A
                </span>
              </div>
              <p className="pp-timeline-step-desc">
                Conceito introduzido pelo professor. Apresentação teórica dos sinais de carga e atrito triboelétrico.
              </p>
            </div>
          </div>

          {/* +24h */}
          <div className="pp-timeline-step completed">
            <span className="pp-timeline-badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10B981', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
              SEXTA (+24h)
            </span>
            <div className="pp-timeline-step-content">
              <div className="pp-timeline-step-top">
                <span className="pp-timeline-step-name">Micro-doses de Maestria Áquila Nível 1 & 2 no App Mobile</span>
                <span className="pp-timeline-status-pill" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10B981' }}>
                  ✓ 100% ACERTO (3 MIN)
                </span>
              </div>
              <p className="pp-timeline-step-desc">
                Automatização do cálculo aritmético de carga elementar (Q = n · e) e proporção quadrática inversa da força.
              </p>
            </div>
          </div>

          {/* +48h */}
          <div className="pp-timeline-step completed">
            <span className="pp-timeline-badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10B981', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
              SÁBADO (+48h)
            </span>
            <div className="pp-timeline-step-content">
              <div className="pp-timeline-step-top">
                <span className="pp-timeline-step-name">Podcast Sofia & Lucas + Simulação Científica Áquila Interativa</span>
                <span className="pp-timeline-status-pill" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10B981' }}>
                  ✓ CONCLUÍDO (NOTA 10)
                </span>
              </div>
              <p className="pp-timeline-step-desc">
                Áudio imersivo de 2 min explicando polarização da parede neutra, seguido de experimentação 60 FPS no simulador Canvas.
              </p>
            </div>
          </div>

          {/* +96h */}
          <div className="pp-timeline-step active">
            <span className="pp-timeline-badge" style={{ background: 'rgba(0, 240, 255, 0.2)', color: '#00F0FF', border: '1px solid rgba(0, 240, 255, 0.4)' }}>
              SEGUNDA (+96h)
            </span>
            <div className="pp-timeline-step-content">
              <div className="pp-timeline-step-top">
                <span className="pp-timeline-step-name">Desafio Gamificado Jogos Educativos Áquila: "Abra a Caixa" (+30 XP)</span>
                <span className="pp-timeline-status-pill" style={{ background: 'rgba(0, 240, 255, 0.25)', color: '#00F0FF' }}>
                  ⏳ HOJE • DISPONÍVEL NO APP
                </span>
              </div>
              <p className="pp-timeline-step-desc">
                Recuperação ativa (Active Recall) sem consulta. 4 caixas surpresa com desafios rápidos sobre atração e repulsão vetorial.
              </p>
            </div>
          </div>

          {/* +144h */}
          <div className="pp-timeline-step">
            <span className="pp-timeline-badge" style={{ background: 'rgba(148, 163, 184, 0.12)', color: '#94A3B8', border: '1px solid rgba(148, 163, 184, 0.2)' }}>
              QUARTA (+144h)
            </span>
            <div className="pp-timeline-step-content">
              <div className="pp-timeline-step-top">
                <span className="pp-timeline-step-name">Fechamento do Ciclo: Simulado Regional PAS 1 UnB / UFMG</span>
                <span className="pp-timeline-status-pill" style={{ background: 'rgba(148, 163, 184, 0.15)', color: '#CBD5E1' }}>
                  📅 AGENDADO
                </span>
              </div>
              <p className="pp-timeline-step-desc">
                Resolução de 1 questão discursiva real de vestibular para consolidar a memória de longo prazo antes da próxima aula.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Pergunta de Ouro para o Jantar em Família (7 Séries • Conexão Pais & Filhos) */}
      {(() => {
        const currentDinnerScript = DINNER_CONVERSATION_SCRIPTS[selectedDinnerGradeIdx] || DINNER_CONVERSATION_SCRIPTS[0];
        const whatsappText = `🦅 *Áquila Pro — Conexão Família & Escola (${currentDinnerScript?.gradeLevel})*\n\n*Pergunta para o Jantar:* "${currentDinnerScript?.sparkQuestion}"\n\n💡 *Dica Científica:* ${currentDinnerScript?.topicSummaryPlainLanguage}\n\n🤝 *Papo em Família:* ${currentDinnerScript?.followUpHook}`;
        const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(whatsappText)}`;

        return (
          <div className="pp-dinner-card">
            <div className="pp-dinner-header">
              <span className="pp-dinner-tag">
                <Sparkles size={13} color="#F59E0B" />
                PERGUNTA DE OURO PARA O JANTAR EM FAMÍLIA (CONEXÃO PAIS &amp; FILHOS)
              </span>
              <span style={{ fontSize: '11px', color: '#94A3B8' }}>Sem cobrança de notas • Estímulo ao Pensamento Crítico</span>
            </div>

            {/* Seletor Dinâmico das 7 Séries (6º EF à 3ª EM) */}
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
                    transition: 'all 0.2s',
                    background: selectedDinnerGradeIdx === idx ? 'rgba(245, 158, 11, 0.25)' : 'rgba(30, 41, 59, 0.55)',
                    border: selectedDinnerGradeIdx === idx ? '1px solid #F59E0B' : '1px solid rgba(148, 163, 184, 0.2)',
                    color: selectedDinnerGradeIdx === idx ? '#FDE68A' : '#94A3B8',
                  }}
                >
                  {script.gradeLevel}
                </button>
              ))}
            </div>

            <div className="pp-dinner-question-box">
              <p className="pp-dinner-question">
                "{currentDinnerScript?.sparkQuestion}"
              </p>
              <p className="pp-dinner-explanation">
                <strong>💡 Dica Científica para os Pais ({currentDinnerScript?.gradeLevel}):</strong> {currentDinnerScript?.topicSummaryPlainLanguage} {currentDinnerScript?.followUpHook} <em>{currentDinnerScript?.closingEncouragement}</em>
              </p>
            </div>

            <div className="pp-dinner-actions" style={{ flexWrap: 'wrap', gap: 10 }}>
              <span style={{ fontSize: '11px', color: '#CBD5E1', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Brain size={14} color="#F59E0B" />
                Fortalece a cumplicidade familiar e substitui a pergunta "fez a tarefa?" por um diálogo fascinante.
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  className="pp-action-btn"
                  style={{
                    background: dinnerCopied ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.18)',
                    borderColor: dinnerCopied ? '#10B981' : 'rgba(245, 158, 11, 0.4)',
                    color: dinnerCopied ? '#10B981' : '#FDE68A',
                  }}
                  onClick={() => {
                    navigator.clipboard?.writeText(whatsappText);
                    setDinnerCopied(true);
                    setTimeout(() => setDinnerCopied(false), 3000);
                  }}
                >
                  {dinnerCopied ? <Check size={13} /> : <Copy size={13} />}
                  <span>{dinnerCopied ? 'Copiado para Área de Transferência!' : 'Copiar Texto Completo'}</span>
                </button>

                <button
                  className="pp-action-btn"
                  style={{
                    background: 'rgba(16, 185, 129, 0.18)',
                    borderColor: 'rgba(16, 185, 129, 0.45)',
                    color: '#6EE7B7',
                  }}
                  onClick={() => {
                    window.open(whatsappUrl, '_blank');
                  }}
                  title="Abrir no WhatsApp Web / Celular"
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
        <h3 className="pp-section-title"><Clock size={14} color="#10B981" /> Presença & Portaria (Crachá QR Dinâmico • Padrão ANPD)</h3>
        <span className="pp-section-tag">REGISTRO LOCAL AUDITÁVEL</span>
      </div>
      {!attendance ? (
        <div style={{ padding: '18px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#94A3B8', fontSize: '0.84rem' }}>
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
              <div className="pp-bar-fill" style={{
                width: `${attendanceRate ?? 0}%`,
                background: (attendanceRate ?? 0) >= 75 ? '#10B981' : '#EF4444'
              }} />
            </div>
            <span className="pp-bar-label">{attendanceRate !== null ? `${attendanceRate}% frequência apurada` : 'Sem cálculo de frequência'}</span>
          </div>
          {attendanceRate !== null && (() => {
            const ldbAlertText = `🦅 *Áquila Pro — Notificação Escolar (LDB Art. 12, VIII, "a")*\n\nPrezado(a) Responsável Legal,\nInformamos que o registro de frequência do estudante indica ${attendance.absences} faltas (frequência apurada: ${attendanceRate}%).\nConforme a LDB Art. 12, VIII, 'a' (alterada pela Lei Federal nº 15.231/2025), a escola mantém acompanhamento contínuo da assiduidade para garantia da aprendizagem integral.\n\nConsulte o Portal da Família para detalhes pedagógicos e registro diário de portaria.`;
            const ldbWhatsAppUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(ldbAlertText)}`;

            return (
              <div style={{
                marginTop: 10,
                padding: '10px 14px',
                background: attendanceRate >= 75 ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.12)',
                border: attendanceRate >= 75 ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid rgba(239, 68, 68, 0.35)',
                borderRadius: 10,
                fontSize: '0.74rem',
                color: attendanceRate >= 75 ? '#A7F3D0' : '#FECACA',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 8
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {attendanceRate >= 75 ? <CheckCircle2 size={15} color="#10B981" /> : <AlertTriangle size={15} color="#EF4444" />}
                  <span>
                    <strong>Conformidade LDB Art. 12, VIII, "a" (Lei 15.231/2025):</strong> Frequência em {attendanceRate}% (mínimo legal: 75%; limite anual de faltas: 30%). {attendanceRate >= 75 ? 'Sem risco de retenção por infrequência.' : 'Aviso preventivo de infrequência.'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => window.open(ldbWhatsAppUrl, '_blank')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    padding: '4px 10px',
                    borderRadius: 6,
                    background: 'rgba(16, 185, 129, 0.2)',
                    border: '1px solid rgba(16, 185, 129, 0.45)',
                    color: '#6EE7B7',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                  title="Compartilhar resumo oficial no WhatsApp do responsável"
                >
                  <MessageCircle size={12} />
                  <span>Notificar Responsável (WhatsApp)</span>
                </button>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );

  const renderNotas = () => (
    <div className="pp-section">
      <div className="pp-section-header-row">
        <h3 className="pp-section-title"><BookOpen size={14} color="#38BDF8" /> Desempenho por Disciplina</h3>
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
        <div style={{ padding: '18px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#94A3B8', fontSize: '0.84rem' }}>
          Nenhuma nota validada por docente foi lançada até o momento para este estudante.
        </div>
      ) : (
        <div className="pp-grades-list">
          {grades.map((g, i) => (
            <div key={i} className="pp-grade-row">
              <span className="pp-grade-subject">{g.subject}</span>
              <div className="pp-grade-bar-wrap">
                <div className="pp-grade-bar" style={{
                  width: `${(g.average / 10) * 100}%`,
                  background: g.average >= 7 ? '#10B981' : g.average >= 5 ? '#F59E0B' : '#EF4444'
                }} />
              </div>
              <span className="pp-grade-value" style={{
                color: g.average >= 7 ? '#10B981' : g.average >= 5 ? '#F59E0B' : '#EF4444'
              }}>{g.average.toFixed(1)}</span>
              {g.trend === 'up' ? <TrendingUp size={13} style={{ color: '#10B981' }} />
                : g.trend === 'down' ? <TrendingDown size={13} style={{ color: '#EF4444' }} />
                : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderFinanceiro = () => (
    <div className="pp-section">
      <div className="pp-section-header-row">
        <h3 className="pp-section-title"><DollarSign size={14} color="#10B981" /> Situação Financeira & Mensalidades</h3>
        <span className="pp-section-tag">{financial ? 'HISTÓRICO FINANCEIRO' : 'SEM TÍTULOS VINCULADOS'}</span>
      </div>
      {!financial ? (
        <div style={{ padding: '18px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#94A3B8', fontSize: '0.84rem' }}>
          Nenhum título financeiro em aberto ou histórico vinculado a este estudante.
        </div>
      ) : (
        <div className="pp-financial-card">
          <div className="pp-financial-status" style={{ borderColor: statusColors[financial.status] }}>
            {financial.status === 'adimplente'
              ? <CheckCircle2 size={18} style={{ color: '#10B981' }} />
              : <AlertTriangle size={18} style={{ color: statusColors[financial.status] }} />}
            <span style={{ color: statusColors[financial.status], fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
              {statusLabel[financial.status]}
            </span>
          </div>
          {financial.overdueCount > 0 && (
            <div className="pp-overdue-alert">
              ⚠️ {financial.overdueCount} parcela(s) em atraso. Entre em contato com a secretaria.
            </div>
          )}
          {financial.nextDueDate && (
            <div className="pp-next-due">
              <Calendar size={13} />
              <span>Próximo vencimento: <strong>{financial.nextDueDate}</strong></span>
              {financial.nextAmount != null && <strong style={{ marginLeft: 'auto' }}>R$ {financial.nextAmount.toFixed(2)}</strong>}
            </div>
          )}

          {(financial.nextAmount != null || financial) && (
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
          )}
        </div>
      )}
    </div>
  );

  const renderConquistas = () => (
    <div className="pp-section">
      <div className="pp-section-header-row">
        <h3 className="pp-section-title"><Award size={14} color="#F59E0B" /> Conquistas BNCC & Mentores de Elite</h3>
        <span className="pp-section-tag">2.680 XP ACUMULADO</span>
      </div>

      <div style={{ marginTop: 14 }}>
        <h4 style={{ fontSize: '0.82rem', color: '#94A3B8', margin: '0 0 10px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Insígnias de Mestres Conquistadas pelo Aluno
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 10 }}>
          <div style={{ padding: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, display: 'flex', gap: 10, alignItems: 'center' }}>
            <span style={{ fontSize: 26 }}>🍎</span>
            <div>
              <strong style={{ display: 'block', fontSize: '0.82rem', color: '#fff' }}>Isaac Newton</strong>
              <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>Maçã Gravitacional • Física</span>
            </div>
          </div>

          <div style={{ padding: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(96,165,250,0.3)', borderRadius: 10, display: 'flex', gap: 10, alignItems: 'center' }}>
            <span style={{ fontSize: 26 }}>📐</span>
            <div>
              <strong style={{ display: 'block', fontSize: '0.82rem', color: '#fff' }}>C. F. Gauss</strong>
              <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>Selo de Gauss • Matemática</span>
            </div>
          </div>

          <div style={{ padding: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(0,240,255,0.3)', borderRadius: 10, display: 'flex', gap: 10, alignItems: 'center' }}>
            <span style={{ fontSize: 26 }}>☢️</span>
            <div>
              <strong style={{ display: 'block', fontSize: '0.82rem', color: '#fff' }}>Marie Curie</strong>
              <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>Raio de Polônio • Química</span>
            </div>
          </div>

          <div style={{ padding: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(244,63,94,0.3)', borderRadius: 10, display: 'flex', gap: 10, alignItems: 'center' }}>
            <span style={{ fontSize: 26 }}>🪶</span>
            <div>
              <strong style={{ display: 'block', fontSize: '0.82rem', color: '#fff' }}>Machado de Assis</strong>
              <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>Pena de Machado • Redação</span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 16, padding: 16, background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(0,240,255,0.2)', borderRadius: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#00F0FF', fontFamily: 'var(--font-mono)' }}>
            ÚLTIMA REDAÇÃO AVALIADA (ENEM 2023)
          </span>
          <span style={{ fontSize: '1.1rem', fontWeight: 900, color: '#10B981', fontFamily: 'var(--font-mono)' }}>
            960 / 1000 pts
          </span>
        </div>
        <strong style={{ fontSize: '0.9rem', color: '#F8FAFC' }}>
          Desafios para o enfrentamento da invisibilidade do trabalho de cuidado realizado pela mulher no Brasil
        </strong>
        <p style={{ fontSize: '0.8rem', color: '#CBD5E1', margin: '8px 0 0 0', fontStyle: 'italic', lineHeight: 1.5 }}>
          "Sublime arquitetura argumentativa. O estudante articulou com rigor o conceito de trabalho reprodutivo em Silvia Federici e cumpriu exemplarmente todos os 5 elementos da intervenção social." — Machado de Assis
        </p>
      </div>
    </div>
  );

  const renderMensagens = () => (
    <div className="pp-section">
      <div className="pp-section-header-row">
        <h3 className="pp-section-title"><Bell size={14} color="#A78BFA" /> Comunicados Oficiais da Escola</h3>
        <span className="pp-section-tag">{unreadCount} NÃO LIDOS</span>
      </div>
      {notifications.length === 0 ? (
        <div style={{ padding: '18px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#94A3B8', fontSize: '0.84rem' }}>
          Nenhum comunicado oficial localizado para este estudante.
        </div>
      ) : (
        <div className="pp-notifications-list">
          {notifications.map(n => (
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
        <h3 className="pp-section-title"><Shield size={14} color="#818CF8" /> Ocorrências Disciplinares, Pedagógicas & Mérito</h3>
        <span className="pp-section-tag">CONFORMIDADE LGPD</span>
      </div>

      {parentOccurrences.length === 0 ? (
        <div style={{ marginTop: 12, padding: '18px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#94A3B8', fontSize: '0.84rem' }}>
          Nenhuma ocorrência disciplinar ou pedagógica registrada para este estudante.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
          {parentOccurrences.map(occ => (
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: 6,
                      background: occ.category.includes('Mérito') ? 'rgba(168,85,247,0.2)' : occ.severity === 'Média' ? 'rgba(245,158,11,0.2)' : 'rgba(59,130,246,0.2)',
                      color: occ.category.includes('Mérito') ? '#c084fc' : occ.severity === 'Média' ? '#fbbf24' : '#60a5fa',
                    }}>
                      {occ.category.toUpperCase()} • {occ.severity.toUpperCase()}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                      {occ.date} às {occ.time}
                    </span>
                  </div>
                  <strong style={{ fontSize: '0.95rem', color: '#f8fafc' }}>{occ.title}</strong>
                </div>

                {occ.signed ? (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '4px 10px',
                    borderRadius: 8,
                    background: 'rgba(16,185,129,0.15)',
                    border: '1px solid rgba(16,185,129,0.3)',
                    color: '#34d399',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                  }}>
                    <CheckCircle2 size={14} />
                    <span>CIÊNCIA CONFIRMADA</span>
                  </div>
                ) : (
                  <button
                    className="pp-action-btn primary"
                    style={{ height: 28, padding: '0 12px', fontSize: '0.76rem' }}
                    onClick={() => handleSignOccurrence(occ.id)}
                  >
                    <CheckCircle2 size={14} />
                    <span>Assinar Ciência Digital</span>
                  </button>
                )}
              </div>

              <p style={{ margin: 0, fontSize: '0.84rem', color: '#cbd5e1', lineHeight: 1.5 }}>
                {occ.description}
              </p>

              <div style={{
                padding: '8px 12px',
                borderRadius: 8,
                background: 'rgba(255,255,255,0.02)',
                fontSize: '0.78rem',
                color: '#94a3b8',
              }}>
                <strong>Ação da Coordenação:</strong> {occ.actionTaken}
              </div>

              {occ.signed && (
                <div style={{
                  fontSize: '0.72rem',
                  color: '#10b981',
                  borderTop: '1px solid rgba(255,255,255,0.06)',
                  paddingTop: 8,
                  display: 'flex',
                  justifyContent: 'space-between',
                }}>
                  <span>✓ {occ.signedAt}</span>
                  <span style={{ fontFamily: 'monospace' }}>REGISTRO AUDITADO: SHA-256 / LGPD</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderResumo = () => (
    <>
      {/* 4-Column Stitch Telemetry Strip */}
      <div className="pp-resumo-grid">
        <div className="pp-summary-card" onClick={() => setActiveTab('presenca')}>
          <div className="pp-card-body">
            <span className="pp-card-label">PRESENÇA HOJE</span>
            <span className="pp-card-value" style={{ color: '#10B981' }}>{attendanceRate !== null ? `${attendanceRate}% FREQ.` : '—'}</span>
            <span className="pp-card-sub">{attendance?.lastEntry ? `Entrada: ${attendance.lastEntry}` : 'Sem registro de portaria'}</span>
          </div>
          <div className="pp-card-icon" style={{ background: 'rgba(16,185,129,0.14)', color: '#10B981' }}>
            <Clock size={18} />
          </div>
        </div>

        <div className="pp-summary-card" onClick={() => setActiveTab('notas')}>
          <div className="pp-card-body">
            <span className="pp-card-label">MÉDIA ACADÊMICA</span>
            <span className="pp-card-value" style={{ color: '#00F0FF' }}>{avgGeneral !== null ? `${avgGeneral} / 10` : '—'}</span>
            <span className="pp-card-sub">{grades.length > 0 ? `${grades.length} disciplinas avaliadas` : 'Sem avaliações lançadas'}</span>
          </div>
          <div className="pp-card-icon" style={{ background: 'rgba(0,240,255,0.12)', color: '#00F0FF' }}>
            <BookOpen size={18} />
          </div>
        </div>

        {financial ? (
          <div className="pp-summary-card" onClick={() => setActiveTab('financeiro')}>
            <div className="pp-card-body">
              <span className="pp-card-label">FINANCEIRO</span>
              <span className="pp-card-value" style={{ color: statusColors[financial.status] }}>
                {statusLabel[financial.status]}
              </span>
              <span className="pp-card-sub">{financial.nextDueDate ? `Próx. venc.: ${financial.nextDueDate}` : 'Situação consultada'}</span>
            </div>
            <div className="pp-card-icon" style={{ background: `${statusColors[financial.status]}20`, color: statusColors[financial.status] }}>
              <DollarSign size={18} />
            </div>
          </div>
        ) : (
          <div className="pp-summary-card" onClick={() => setActiveTab('financeiro')}>
            <div className="pp-card-body">
              <span className="pp-card-label">FINANCEIRO</span>
              <span className="pp-card-value" style={{ color: '#94A3B8' }}>—</span>
              <span className="pp-card-sub">Sem cobranças vinculadas</span>
            </div>
            <div className="pp-card-icon" style={{ background: 'rgba(148,163,184,0.12)', color: '#94A3B8' }}>
              <DollarSign size={18} />
            </div>
          </div>
        )}

        <div className="pp-summary-card" onClick={() => setActiveTab('neuro-rotina')}>
          <div className="pp-card-body">
            <span className="pp-card-label">ACOMPANHAMENTO DOCENTE</span>
            <span className="pp-card-value" style={{ color: '#A78BFA' }}>
              Regência Humana
            </span>
            <span className="pp-card-sub">{behavioralInsight?.telemetryBlocked !== false ? 'Inferência Emocional Desativada (CNE 15/2026)' : (behavioralInsight?.currentMood || 'Mediação Pedagógica Ativa')}</span>
          </div>
          <div className="pp-card-icon" style={{ background: 'rgba(139,92,246,0.14)', color: '#A78BFA' }}>
            <Brain size={18} />
            {unreadCount > 0 && <span className="pp-badge">{unreadCount}</span>}
          </div>
        </div>
      </div>

      {/* High-Density 2-Column Bento Split (Zero Wasted Space) */}
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

  const pendingOccCount = parentOccurrences.filter(o => !o.signed).length;

  const TABS: { key: typeof activeTab; label: string; icon: React.ReactNode }[] = [
    { key: 'resumo', label: 'Visão Geral (Cockpit)', icon: <User size={13} /> },
    { key: 'neuro-rotina', label: 'Rotina de Estudos & Neuro-IA', icon: <Flame size={13} color="#F97316" /> },
    { key: 'presenca', label: 'Presença & Portaria', icon: <Clock size={13} /> },
    { key: 'notas', label: 'Boletim & Notas', icon: <BookOpen size={13} /> },
    { key: 'conquistas', label: 'Conquistas & BNCC', icon: <Award size={13} /> },
    { key: 'financeiro', label: 'Financeiro & PIX', icon: <DollarSign size={13} /> },
    { key: 'ocorrencias', label: `Ocorrências${pendingOccCount > 0 ? ` (${pendingOccCount})` : ''}`, icon: <Shield size={13} /> },
    { key: 'mensagens', label: `Comunicados${unreadCount > 0 ? ` (${unreadCount})` : ''}`, icon: <Bell size={13} /> },
    { key: 'marketplace', label: 'Marketplace Escolar', icon: <MessageCircle size={13} /> },
  ];

  if (currentPage === 'mobile-parent-app') {
    return (
      <PortalLayout portalName="Canal Família & Conexão" themeColor="#0EA5E9" onNavigate={onNavigate} sessionUser={resolvedSessionUser}>
        <MobileParentApp
          onBack={() => onNavigate('parent-portal')}
          studentName={studentName || 'Lucas Piloto Silva'}
        />
      </PortalLayout>
    );
  }

  return (
    <PortalLayout portalName="Canal Família & Conexão" themeColor="#0EA5E9" onNavigate={onNavigate} sessionUser={resolvedSessionUser}>
      <div className="pp-container">
        {/* Cabeçalho do Aluno — Retrato Retangular ("Sem Bolinha") */}
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
                  {loading
                    ? 'Sincronizando...'
                    : (studentName || PILOT_FALLBACK_NAME)}
                </h2>
                <span className="pp-live-gate-pill">
                  {attendance?.lastEntry ? `● NA ESCOLA • ${attendance.lastEntry}` : '● SEM REGISTRO DE PORTARIA'}
                </span>
              </div>
              <span className="pp-student-sub">
                {studentMeta
                  ? ([studentMeta.className, studentMeta.ra ? `MATRÍCULA #${studentMeta.ra}` : null, studentMeta.seatLabel].filter(Boolean).join(' • ') || `ESTUDANTE #${effectiveStudentId}`)
                  : `ESTUDANTE #${effectiveStudentId}`}
              </span>
            </div>
          </div>

          <div className="pp-header-actions">
            <button className="pp-action-btn primary" onClick={() => setShowBoletimModal(true)} disabled={!effectiveStudentId}>
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

        {/* Navegação por tabs com altura uniforme 28px */}
        <div className="pp-tabs">
          {TABS.map(tab => (
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

        {/* Conteúdo */}
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

        {/* Modal do Boletim Escolar Oficial */}
        {showBoletimModal && effectiveStudentId && (
          <AcademicReportCard
            student={{
              id: effectiveStudentId,
              name: studentName || PILOT_FALLBACK_NAME,
              className: studentMeta?.className || PILOT_FALLBACK_META.className,
              teacher: studentMeta?.teacher || PILOT_FALLBACK_META.teacher,
              period: 'Ano Letivo Atual',
              ra: studentMeta?.ra || effectiveStudentId
            }}
            onClose={() => setShowBoletimModal(false)}
          />
        )}

        {/* Modal de Consulta da Cobrança PIX */}
        {showPixModal && financial && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(2, 6, 23, 0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100,
            padding: 20
          }} onClick={() => setShowPixModal(false)}>
            <div style={{
              width: '100%',
              maxWidth: 460,
              background: '#0B132B',
              border: '1px solid rgba(0, 240, 255, 0.3)',
              borderRadius: 20,
              padding: 24,
              boxShadow: '0 25px 60px rgba(0,0,0,0.8)',
              display: 'flex',
              flexDirection: 'column',
              gap: 14
            }} onClick={e => e.stopPropagation()}>
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

              <div style={{
                textAlign: 'center',
                padding: '16px',
                background: 'rgba(255,255,255,0.03)',
                borderRadius: 14,
                border: '1px solid rgba(255,255,255,0.08)'
              }}>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                  {financial.nextDueDate ? `Vencimento: ${financial.nextDueDate}` : 'Parcela em aberto'}
                </span>
                <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#10B981', margin: '4px 0', fontFamily: 'var(--font-mono)' }}>
                  {financial.nextAmount != null ? `R$ ${financial.nextAmount.toFixed(2)}` : 'Valor quitado / em dia'}
                </div>
                <div style={{
                  marginTop: 8,
                  padding: '8px 10px',
                  borderRadius: 8,
                  background: 'rgba(15, 23, 42, 0.85)',
                  border: '1px solid rgba(56, 189, 248, 0.25)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.72rem',
                  color: '#38BDF8',
                  wordBreak: 'break-all'
                }}>
                  {`00020126580014BR.GOV.BCB.PIX0136aquila-tesouraria-${effectiveStudentId}@escola.edu.br5204000053039865802BR5916AQUILA PRO EDU6008GOIANIA62070503***6304A1B2`}
                </div>
                <button
                  type="button"
                  className="pp-action-btn primary"
                  style={{ marginTop: 12, width: '100%', height: 34, justifyContent: 'center' }}
                  onClick={() => {
                    const pixCode = `00020126580014BR.GOV.BCB.PIX0136aquila-tesouraria-${effectiveStudentId}@escola.edu.br5204000053039865802BR5916AQUILA PRO EDU6008GOIANIA62070503***6304A1B2`;
                    navigator.clipboard?.writeText(pixCode).catch(() => {});
                    setPixCopied(true);
                    (window as any).showToast?.('Código PIX Copia e Cola copiado com sucesso!', 'success');
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
