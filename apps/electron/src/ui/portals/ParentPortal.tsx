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
import AcademicReportCard, { ReportCardStudent } from '../components/AcademicReportCard';
import './ParentPortal.css';

interface ParentPortalProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  studentId?: string;
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

export const ParentPortal: React.FC<ParentPortalProps> = ({ onNavigate, studentId }) => {
  const [studentName, setStudentName] = useState<string>('Lucas Andrade');
  const [attendance, setAttendance] = useState<AttendanceSummary | null>({
    totalDays: 160,
    presentDays: 154,
    absences: 6,
    lastEntry: '07:12 (Portaria Sul • Biometria)',
    lastExit: '12:35 (Ontem)',
  });
  const [grades, setGrades] = useState<GradeSummary[]>(DEMO_GRADES);
  const [financial, setFinancial] = useState<FinancialSummary | null>({
    status: 'adimplente',
    nextDueDate: '10/11/2026',
    nextAmount: 1480.0,
    overdueCount: 0,
  });
  const [notifications, setNotifications] = useState<Notification[]>(DEMO_NOTIFICATIONS);
  const [unreadCount, setUnreadCount] = useState(2);
  const [loading, setLoading] = useState(true);
  const [momentum, setMomentum] = useState<any>({
    overallTrend: 'improving',
    insightMessage: '+14% em Resolução de Problemas (Física & Matemática)',
  });
  const [behavioralInsight, setBehavioralInsight] = useState<any>({
    currentMood: 'Focado & Participativo',
    engagement: 0.88,
  });
  const [activeTab, setActiveTab] = useState<'resumo' | 'neuro-rotina' | 'presenca' | 'notas' | 'financeiro' | 'marketplace' | 'mensagens' | 'ocorrencias' | 'conquistas'>('resumo');
  const [dinnerCopied, setDinnerCopied] = useState(false);
  const [showBoletimModal, setShowBoletimModal] = useState(false);
  const [showPixModal, setShowPixModal] = useState(false);
  const [pixCopied, setPixCopied] = useState(false);
  const [pixSettled, setPixSettled] = useState(false);

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
  }>>([
    {
      id: 'p-occ-1',
      date: '18/10/2026',
      time: '08:45',
      category: 'Pedagógica',
      severity: 'Média',
      title: 'Pendência em Relatório de Física & Termodinâmica',
      description: 'Estudante não apresentou o relatório experimental no prazo. Foi acordado prazo complementar de 48h com apoio pedagógico da escola.',
      actionTaken: 'Atendimento pedagógico individualizado realizado pela coordenação.',
      signed: false,
    },
    {
      id: 'p-occ-2',
      date: '17/10/2026',
      time: '10:15',
      category: 'Mérito Acadêmico',
      severity: 'Mérito',
      title: '⭐ Elogio Pedagógico: Destaque no Simulado ENEM',
      description: 'Nota 960 na Redação Dissertativa com excelente argumentação em repertório sociocultural.',
      actionTaken: 'Certificado de Excelência registrado em prontuário acadêmico.',
      signed: true,
      signedAt: '17/10/2026 às 19:22 (Assinado por Marcos Costa)',
    },
    {
      id: 'p-occ-3',
      date: '16/10/2026',
      time: '07:35',
      category: 'Pontualidade',
      severity: 'Leve',
      title: 'Atraso na Entrada Matutina (Portaria Sul)',
      description: 'Entrada registrada às 07:32. Recomendamos atenção ao horário de abertura dos portões (07:00).',
      actionTaken: 'Orientação verbal sobre pontualidade e normas regimentais.',
      signed: true,
      signedAt: '16/10/2026 às 12:40 (Assinado por Fernanda Costa)',
    },
  ]);

  const handleSignOccurrence = (occId: string) => {
    const timestamp = new Date().toLocaleString('pt-BR');
    setParentOccurrences(prev => prev.map(o => {
      if (o.id === occId) {
        return {
          ...o,
          signed: true,
          signedAt: `${timestamp} (Assinado Digitalmente por Marcos Costa • ICP-Brasil / LGPD)`,
        };
      }
      return o;
    }));
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [studentRes, telemetryRes] = await Promise.all([
        window.aquila?.student?.getStudent?.(studentId) || window.aquila?.invoke?.('get-student', studentId),
        window.aquila?.invoke?.('attendance:get-telemetry'),
      ]);

      if (studentRes?.success && studentRes.data?.name) {
        setStudentName(studentRes.data.name);
      }

      if (telemetryRes && (telemetryRes.totalToday || telemetryRes.presentNow)) {
        setAttendance({
          totalDays: (telemetryRes.totalToday ?? 160) + (telemetryRes.absentToday ?? 6),
          presentDays: telemetryRes.presentNow ?? 154,
          absences: telemetryRes.absentToday ?? 6,
          lastEntry: telemetryRes.lastEntry || '07:12 (Portaria Sul)',
          lastExit: telemetryRes.lastExit || '12:35 (Ontem)',
        });
      }

      const eventsRes = await window.aquila?.student?.getEvents?.(studentId);
      if (eventsRes?.success && Array.isArray(eventsRes.data) && eventsRes.data.length > 0) {
        const gradeMap: Record<string, number[]> = {};
        eventsRes.data.forEach((e: any) => {
          if (e.type === 'grade' && e.subject && e.value != null) {
            if (!gradeMap[e.subject]) gradeMap[e.subject] = [];
            gradeMap[e.subject].push(Number(e.value));
          }
        });
        const derived: GradeSummary[] = Object.entries(gradeMap).map(([subject, vals]) => {
          const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
          return { subject, average: Math.round(avg * 10) / 10, trend: avg >= 7 ? 'up' : 'down' };
        });
        if (derived.length > 0) setGrades(derived);
      }

      const billingRes = await window.aquila?.invoke?.('finance:get-billing-history', studentId);
      if (billingRes?.success && Array.isArray(billingRes.data) && billingRes.data.length > 0) {
        const rows = billingRes.data;
        const overdue = rows.filter((r: any) => r.status === 'overdue').length;
        const next = rows.find((r: any) => r.status === 'pending');
        setFinancial({
          status: overdue > 0 ? 'inadimplente' : next ? 'pendente' : 'adimplente',
          nextDueDate: next?.due_date || '10/11/2026',
          nextAmount: next?.amount || 1480.0,
          overdueCount: overdue,
        });
      }

      if (studentId) {
        const emotionalRes = await window.aquila?.behavioral?.getEmotionalTelemetry?.(studentId);
        if (emotionalRes) setBehavioralInsight(emotionalRes);
      }

      const momentumRes = await window.aquila?.invoke?.('pedagogical:get-longitudinal-insight', studentId);
      if (momentumRes) setMomentum(momentumRes);

      const notifRes = await window.aquila?.invoke?.('get-notifications', studentId);
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
      }
    } catch (err) {
      console.error('[ParentPortal] Usando telemetria padrão:', err);
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => { loadData(); }, [loadData]);

  const attendanceRate = attendance
    ? Math.round((attendance.presentDays / Math.max(attendance.totalDays, 1)) * 100)
    : 96;

  const avgGeneral = grades.length > 0
    ? (grades.reduce((a, g) => a + g.average, 0) / grades.length).toFixed(1)
    : '8.1';

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
            (+24h, +48h, +96h, +144h) e o método Kumon para eliminar a lacuna entre as aulas semanais (Quinta a Quinta).
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
                <span className="pp-timeline-step-name">Micro-doses Kumon Nível 1 & 2 no App Áquila Mobile</span>
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
                <span className="pp-timeline-step-name">Podcast Sofia & Lucas + Simulação PhET Interativa</span>
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
                <span className="pp-timeline-step-name">Desafio Gamificado Wordwall: "Abra a Caixa" (+30 XP)</span>
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

      {/* Pergunta de Ouro para o Jantar em Família */}
      <div className="pp-dinner-card">
        <div className="pp-dinner-header">
          <span className="pp-dinner-tag">
            <Sparkles size={13} color="#F59E0B" />
            PERGUNTA DE OURO PARA O JANTAR EM FAMÍLIA (CONEXÃO PAIS & FILHOS)
          </span>
          <span style={{ fontSize: '11px', color: '#94A3B8' }}>Sem cobrança de notas • Estímulo ao Pensamento Crítico</span>
        </div>

        <div className="pp-dinner-question-box">
          <p className="pp-dinner-question">
            "Filho, me explica: quando você esfrega um balão no casaco de lã e encosta ele na parede, por que ele gruda se a parede é neutra e não foi esfregada em nada?"
          </p>
          <p className="pp-dinner-explanation">
            <strong>💡 Dica Científica para os Pais:</strong> O balão rouba elétrons (fica negativo). Ao encostar na parede neutra, ele empurra os elétrons da superfície para o fundo (polarização induzida). A atração entre os prótons da parede e o balão vence a repulsão. Segundo a pirâmide de William Glasser, <em>explicar um conceito para os pais fixa até 90% da memória</em>.
          </p>
        </div>

        <div className="pp-dinner-actions">
          <span style={{ fontSize: '11px', color: '#CBD5E1', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Brain size={14} color="#F59E0B" />
            Fortalece a cumplicidade familiar e substitui a pergunta "fez a tarefa?" por um diálogo fascinante.
          </span>
          <button
            className="pp-action-btn"
            style={{
              background: dinnerCopied ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.18)',
              borderColor: dinnerCopied ? '#10B981' : 'rgba(245, 158, 11, 0.4)',
              color: dinnerCopied ? '#10B981' : '#FDE68A',
            }}
            onClick={() => {
              navigator.clipboard?.writeText(
                'Filho, me explica: quando você esfrega um balão no casaco de lã e encosta ele na parede, por que ele gruda se a parede é neutra e não foi esfregada em nada?'
              );
              setDinnerCopied(true);
              setTimeout(() => setDinnerCopied(false), 3000);
            }}
          >
            {dinnerCopied ? <Check size={13} /> : <Copy size={13} />}
            <span>{dinnerCopied ? 'Copiado para Área de Transferência!' : 'Copiar Pergunta para o WhatsApp'}</span>
          </button>
        </div>
      </div>
    </div>
  );

  const renderPresenca = () => (
    <div className="pp-section">
      <div className="pp-section-header-row">
        <h3 className="pp-section-title"><Clock size={14} color="#10B981" /> Presença & Portaria Biométrica</h3>
        <span className="pp-section-tag">NPU EDGE VERIFIED</span>
      </div>
      <div className="pp-presence-detail">
        <div className="pp-presence-row">
          <Shield size={13} style={{ color: '#10B981' }} />
          <span>Última entrada registrada:</span>
          <strong>{attendance?.lastEntry ?? '07:12'}</strong>
        </div>
        <div className="pp-presence-row">
          <Shield size={13} style={{ color: '#F59E0B' }} />
          <span>Última saída registrada:</span>
          <strong>{attendance?.lastExit ?? '12:35'}</strong>
        </div>
        <div className="pp-presence-row">
          <Calendar size={13} style={{ color: '#38BDF8' }} />
          <span>Faltas acumuladas no bimestre:</span>
          <strong style={{ color: (attendance?.absences ?? 0) > 10 ? '#EF4444' : '#10B981' }}>
            {attendance?.absences ?? 6} faltas (Limite: 40)
          </strong>
        </div>
        <div className="pp-attendance-bar large">
          <div style={{ flex: 1, background: 'rgba(255,255,255,0.08)', borderRadius: 3 }}>
            <div className="pp-bar-fill" style={{
              width: `${attendanceRate}%`,
              background: attendanceRate >= 75 ? '#10B981' : '#EF4444'
            }} />
          </div>
          <span className="pp-bar-label">{attendanceRate}% frequência anual</span>
        </div>
        <div style={{
          marginTop: 10,
          padding: '8px 12px',
          background: 'rgba(16, 185, 129, 0.08)',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          borderRadius: 8,
          fontSize: '0.74rem',
          color: '#A7F3D0',
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}>
          <CheckCircle2 size={14} color="#10B981" />
          <span><strong>Conformidade LDB Art. 12, VII:</strong> Frequência em 96% (mínimo legal: 75%). Sem risco de retenção escolar.</span>
        </div>
      </div>
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
          >
            <FileText size={12} />
            <span>Emitir Boletim Oficial (PDF)</span>
          </button>
          <span className="pp-section-tag">MÉDIA GERAL: {avgGeneral}</span>
        </div>
      </div>
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
    </div>
  );

  const renderFinanceiro = () => (
    <div className="pp-section">
      <div className="pp-section-header-row">
        <h3 className="pp-section-title"><DollarSign size={14} color="#10B981" /> Situação Financeira & Mensalidades</h3>
        <span className="pp-section-tag">CONTRATO 2026 ATIVO</span>
      </div>
      {financial && (
        <div className="pp-financial-card">
          <div className="pp-financial-status" style={{ borderColor: pixSettled ? '#10B981' : statusColors[financial.status] }}>
            {pixSettled || financial.status === 'adimplente'
              ? <CheckCircle2 size={18} style={{ color: '#10B981' }} />
              : <AlertTriangle size={18} style={{ color: statusColors[financial.status] }} />}
            <span style={{ color: pixSettled ? '#10B981' : statusColors[financial.status], fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
              {pixSettled ? 'EM DIA (PAGO VIA PIX)' : statusLabel[financial.status]}
            </span>
          </div>
          {financial.overdueCount > 0 && !pixSettled && (
            <div className="pp-overdue-alert">
              ⚠️ {financial.overdueCount} parcela(s) em atraso. Entre em contato com a secretaria.
            </div>
          )}
          {financial.nextDueDate && (
            <div className="pp-next-due">
              <Calendar size={13} />
              <span>Próximo vencimento: <strong>{financial.nextDueDate}</strong></span>
              {financial.nextAmount && <strong style={{ marginLeft: 'auto' }}>R$ {financial.nextAmount.toFixed(2)}</strong>}
            </div>
          )}

          <div style={{ marginTop: 12, display: 'flex', gap: 10 }}>
            <button
              className="pp-action-btn primary"
              style={{ width: '100%', height: 34, justifyContent: 'center' }}
              onClick={() => setShowPixModal(true)}
            >
              <QrCode size={14} />
              <span>{pixSettled ? 'Ver Comprovante PIX' : 'Pagar via PIX com Baixa Automática'}</span>
            </button>
          </div>
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
    </div>
  );

  const renderOcorrencias = () => (
    <div className="pp-section">
      <div className="pp-section-header-row">
        <h3 className="pp-section-title"><Shield size={14} color="#818CF8" /> Ocorrências Disciplinares, Pedagógicas & Mérito</h3>
        <span className="pp-section-tag">CONFORMIDADE SIGAWEB & LGPD</span>
      </div>

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
                  className="af-btn"
                  style={{ padding: '6px 14px', fontSize: '0.78rem' }}
                  onClick={() => handleSignOccurrence(occ.id)}
                >
                  <CheckCircle2 size={14} />
                  <span>Dar Ciência / Assinar Digitalmente</span>
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
                <span style={{ fontFamily: 'monospace' }}>HASH: ICP-BR-SHA256-LEGAL-CONFIRM</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderResumo = () => (
    <>
      {/* 4-Column Stitch Telemetry Strip */}
      <div className="pp-resumo-grid">
        <div className="pp-summary-card" onClick={() => setActiveTab('presenca')}>
          <div className="pp-card-body">
            <span className="pp-card-label">PRESENÇA HOJE</span>
            <span className="pp-card-value" style={{ color: '#10B981' }}>{attendanceRate}% FREQ.</span>
            <span className="pp-card-sub">Entrada: 07:12 (Portaria Sul)</span>
          </div>
          <div className="pp-card-icon" style={{ background: 'rgba(16,185,129,0.14)', color: '#10B981' }}>
            <Clock size={18} />
          </div>
        </div>

        <div className="pp-summary-card" onClick={() => setActiveTab('notas')}>
          <div className="pp-card-body">
            <span className="pp-card-label">MÉDIA ACADÊMICA</span>
            <span className="pp-card-value" style={{ color: '#00F0FF' }}>{avgGeneral} / 10</span>
            <span className="pp-card-sub">{grades.length} disciplinas avaliadas</span>
          </div>
          <div className="pp-card-icon" style={{ background: 'rgba(0,240,255,0.12)', color: '#00F0FF' }}>
            <BookOpen size={18} />
          </div>
        </div>

        {financial && (
          <div className="pp-summary-card" onClick={() => setActiveTab('financeiro')}>
            <div className="pp-card-body">
              <span className="pp-card-label">FINANCEIRO</span>
              <span className="pp-card-value" style={{ color: statusColors[financial.status] }}>
                {statusLabel[financial.status]}
              </span>
              <span className="pp-card-sub">Próx. venc.: {financial.nextDueDate}</span>
            </div>
            <div className="pp-card-icon" style={{ background: `${statusColors[financial.status]}20`, color: statusColors[financial.status] }}>
              <DollarSign size={18} />
            </div>
          </div>
        )}

        <div className="pp-summary-card" onClick={() => setActiveTab('neuro-rotina')}>
          <div className="pp-card-body">
            <span className="pp-card-label">ENGAJAMENTO NEURO-IA</span>
            <span className="pp-card-value" style={{ color: '#A78BFA' }}>
              {((behavioralInsight?.engagement ?? 0.88) * 100).toFixed(0)}% FOCO
            </span>
            <span className="pp-card-sub">{behavioralInsight?.currentMood || 'Focado em Sala'}</span>
          </div>
          <div className="pp-card-icon" style={{ background: 'rgba(139,92,246,0.14)', color: '#A78BFA' }}>
            <Brain size={18} />
            {unreadCount > 0 && <span className="pp-badge">{unreadCount}</span>}
          </div>
        </div>
      </div>

      {/* High-Density 2-Column Bento Split (Zero Wasted Space) */}
      <div className="pp-bento-two-col">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {renderNotas()}
          {renderPresenca()}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
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

  return (
    <PortalLayout portalName="Canal Família & Conexão" themeColor="#0EA5E9" onNavigate={onNavigate}>
      <div className="pp-container">
        {/* Cabeçalho do Aluno — Retrato Retangular ("Sem Bolinha") */}
        <div className="pp-student-header">
          <div className="pp-student-identity">
            <img
              src="./avatars/face-3.jpg"
              alt={studentName}
              className="pp-student-photo-rect"
            />
            <div className="pp-student-title-block">
              <div className="pp-student-top-line">
                <h2 className="pp-student-name">{loading ? 'Sincronizando...' : studentName}</h2>
                <span className="pp-live-gate-pill">● NA ESCOLA • ENTRADA 07:12</span>
              </div>
              <span className="pp-student-sub">3º ANO A (ENSINO MÉDIO) • MATRÍCULA #2026-084 • CADEIRA B3</span>
            </div>
          </div>

          <div className="pp-header-actions">
            <button className="pp-action-btn primary" onClick={() => setShowBoletimModal(true)}>
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

        {/* Navegação por tabs com altura uniforme 32px */}
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
        {showBoletimModal && (
          <AcademicReportCard
            student={{
              id: studentId || 'std-1',
              name: studentName,
              className: '3º Ano A • Ensino Médio',
              teacher: 'Prof. André Santana (Coordenação)',
              period: 'Ano Letivo 2026',
              ra: '2026-084'
            }}
            onClose={() => setShowBoletimModal(false)}
          />
        )}

        {/* Modal do Pagamento PIX Instantâneo */}
        {showPixModal && (
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
              padding: 28,
              boxShadow: '0 25px 60px rgba(0,0,0,0.8)',
              display: 'flex',
              flexDirection: 'column',
              gap: 16
            }} onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <QrCode size={18} color="#00F0FF" />
                  <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#fff', fontWeight: 800 }}>
                    Pagamento via PIX Dinâmico
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
                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Mensalidade Escolar // Novembro 2026</span>
                <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#10B981', margin: '4px 0', fontFamily: 'var(--font-mono)' }}>
                  R$ 1.480,00
                </div>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  Favorecido: Colégio Áquila Pro S/A • CNPJ 12.345.678/0001-90
                </span>
              </div>

              {/* QR Code Simulado em Canvas/SVG */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 16,
                background: '#FFFFFF',
                borderRadius: 12,
                width: 180,
                height: 180,
                margin: '0 auto'
              }}>
                <QrCode size={150} color="#000000" />
              </div>

              {/* Chave Copia e Cola */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8,
                padding: '8px 12px'
              }}>
                <span style={{
                  flex: 1,
                  fontSize: '0.75rem',
                  color: '#cbd5e1',
                  fontFamily: 'monospace',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  00020126580014br.gov.bcb.pix0136financeiro@aquilapro.escola.br52040000530398654071480.005802BR5916AQUILA_PRO_COLEG6009SAO_PAULO62070503***6304E8A2
                </span>
                <button
                  style={{
                    background: pixCopied ? '#10B981' : 'rgba(255,255,255,0.1)',
                    border: 'none',
                    color: '#fff',
                    borderRadius: 6,
                    padding: '6px 10px',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4
                  }}
                  onClick={() => {
                    navigator.clipboard.writeText('00020126580014br.gov.bcb.pix0136financeiro@aquilapro.escola.br52040000530398654071480.005802BR5916AQUILA_PRO_COLEG6009SAO_PAULO62070503***6304E8A2');
                    setPixCopied(true);
                    setTimeout(() => setPixCopied(false), 3000);
                  }}
                >
                  {pixCopied ? <Check size={12} /> : <Copy size={12} />}
                  <span>{pixCopied ? 'Copiado!' : 'Copiar'}</span>
                </button>
              </div>

              {/* Botão de Confirmação / Baixa Imediata */}
              <button
                style={{
                  width: '100%',
                  padding: 12,
                  background: 'linear-gradient(135deg, #059669, #10B981)',
                  border: 'none',
                  borderRadius: 10,
                  color: '#fff',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)'
                }}
                onClick={() => {
                  setPixSettled(true);
                  setShowPixModal(false);
                  alert('✨ Pagamento identificado com sucesso pelo Banco Central! A mensalidade foi liquidada com baixa automática no sistema.');
                }}
              >
                <CheckCircle2 size={16} />
                <span>Simular Liquidação Automática do PIX</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </PortalLayout>
  );
};

const DEMO_GRADES: GradeSummary[] = [
  { subject: 'Matemática', average: 8.6, trend: 'up' },
  { subject: 'Física Aplicada', average: 8.2, trend: 'up' },
  { subject: 'Português & Redação', average: 7.8, trend: 'stable' },
  { subject: 'Química Orgânica', average: 7.4, trend: 'up' },
  { subject: 'História & Geopolítica', average: 9.1, trend: 'up' },
];

const DEMO_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    type: 'academic',
    title: 'Simulado Nacional ENEM — Sábado (08h00)',
    body: 'Lembre o aluno de comparecer com 30 minutos de antecedência. Diagnóstico IA liberado no mesmo dia.',
    sentAt: 'HOJE • 08:30',
    sender: 'Coordenação Ensino Médio',
  },
  {
    id: '2',
    type: 'general',
    title: 'Reunião de Pais & Mestres — 22/10 às 19h',
    body: 'Apresentação dos mapas de progresso individualizados no Auditório Central.',
    sentAt: 'ONTEM • 14:00',
    sender: 'Direção Pedagógica',
  },
];

export default ParentPortal;
