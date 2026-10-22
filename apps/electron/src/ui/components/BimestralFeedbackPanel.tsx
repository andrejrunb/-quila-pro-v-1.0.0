import React, { useState, useEffect, useCallback } from 'react';
import {
  AlertTriangle,
  Clock,
  User,
  ChevronDown,
  ChevronUp,
  FileText
} from 'lucide-react';
import './BimestralFeedbackPanel.css';

/* ── Type Definitions ─────────────────────────────────────────────── */

type AlertType = 'indisciplina' | 'atraso';

interface FeedbackAlert {
  id: string;
  studentName: string;
  alertType: AlertType;
  rawType?: string;
  reportingTeacher: string;
  date: string;
  observation: string;
}

interface BimestralFeedbackData {
  className: string;
  totalAlerts: number;
  disciplineCount: number;
  delayCount: number;
  alerts: FeedbackAlert[];
}

export interface BimestralFeedbackPanelProps {
  classId: string;
  className?: string;
  refreshTrigger?: number;
  isExpanded?: boolean;
  onToggleExpand?: (expanded: boolean) => void;
}

/* ── Mock Data (fallback) ─────────────────────────────────────────── */

const MOCK_DATA: BimestralFeedbackData = {
  className: '9º Ano B',
  totalAlerts: 8,
  disciplineCount: 5,
  delayCount: 3,
  alerts: [
    {
      id: 'fb-001',
      studentName: 'Lucas Oliveira',
      alertType: 'indisciplina',
      reportingTeacher: 'Profª Ana Beatriz',
      date: '2026-06-12',
      observation: 'Conversas excessivas durante atividade avaliativa de Matemática.',
    },
    {
      id: 'fb-002',
      studentName: 'Mariana Costa',
      alertType: 'atraso',
      reportingTeacher: 'Prof. Ricardo Mendes',
      date: '2026-06-11',
      observation: 'Não entregou o trabalho de Ciências dentro do prazo estipulado.',
    },
    {
      id: 'fb-003',
      studentName: 'Pedro Henrique Silva',
      alertType: 'indisciplina',
      reportingTeacher: 'Profª Cláudia Ferreira',
      date: '2026-06-10',
      observation: 'Recusou-se a participar da atividade em grupo de História.',
    },
    {
      id: 'fb-004',
      studentName: 'Isabela Santos',
      alertType: 'atraso',
      reportingTeacher: 'Prof. Marcos Almeida',
      date: '2026-06-09',
      observation: 'Terceira semana consecutiva sem entregar exercícios de Geografia.',
    },
    {
      id: 'fb-005',
      studentName: 'Gabriel Rodrigues',
      alertType: 'indisciplina',
      reportingTeacher: 'Profª Fernanda Lima',
      date: '2026-06-08',
      observation: 'Uso de celular em sala durante explicação de Língua Portuguesa.',
    },
    {
      id: 'fb-006',
      studentName: 'Beatriz Almeida',
      alertType: 'indisciplina',
      reportingTeacher: 'Prof. Carlos Eduardo',
      date: '2026-06-06',
      observation: 'Conflito verbal com colega durante aula de Educação Física.',
    },
    {
      id: 'fb-007',
      studentName: 'Rafael Souza',
      alertType: 'atraso',
      reportingTeacher: 'Profª Juliana Martins',
      date: '2026-06-05',
      observation: 'Não trouxe material necessário para laboratório de Química.',
    },
    {
      id: 'fb-008',
      studentName: 'Camila Fernandes',
      alertType: 'indisciplina',
      reportingTeacher: 'Prof. André Pereira',
      date: '2026-06-04',
      observation: 'Saiu da sala sem autorização durante aula de Artes.',
    },
  ],
};

/* ── Helpers ───────────────────────────────────────────────────────── */

function formatDate(iso: string): string {
  try {
    const d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  } catch {
    return iso;
  }
}

/* ── Component ─────────────────────────────────────────────────────── */

export const BimestralFeedbackPanel: React.FC<BimestralFeedbackPanelProps> = ({
  classId,
  className,
  refreshTrigger,
  isExpanded: controlledExpanded,
  onToggleExpand,
}) => {
  const [internalExpanded, setInternalExpanded] = useState(true);
  const isExpanded = controlledExpanded !== undefined ? controlledExpanded : internalExpanded;

  const toggleExpand = () => {
    const next = !isExpanded;
    setInternalExpanded(next);
    onToggleExpand?.(next);
  };
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<BimestralFeedbackData | null>(null);

  const fetchFeedback = useCallback(async (targetClassId: string) => {
    setIsLoading(true);
    try {
      const result = await window.aquila.invoke(
        'reports:get-bimestral-feedback',
        targetClassId,
      );
      if (result && Array.isArray(result.alerts)) {
        setData(result as BimestralFeedbackData);
      } else {
        setData(MOCK_DATA);
      }
    } catch {
      // IPC handler may not be registered yet — use demo data
      setData(MOCK_DATA);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (classId) {
      fetchFeedback(classId);
    }
  }, [classId, refreshTrigger, fetchFeedback]);

  // Listener em tempo real para sincronização de novas ocorrências
  useEffect(() => {
    const handleOccurrenceUpdate = (e: any) => {
      if (!classId) return;
      if (!e.detail?.classId || e.detail.classId === classId) {
        fetchFeedback(classId);
      }
    };

    window.addEventListener('aquila:occurrence-saved', handleOccurrenceUpdate);
    return () => window.removeEventListener('aquila:occurrence-saved', handleOccurrenceUpdate);
  }, [classId, fetchFeedback]);

  if (!data) return null;

  const containerClasses = ['bfp-container', className, isExpanded ? 'bfp-expanded' : 'bfp-collapsed']
    .filter(Boolean)
    .join(' ');

  return (
    <div className={containerClasses}>
      {/* ── Header ─────────────────────────────────────────────── */}
      <button
        className="bfp-header"
        onClick={toggleExpand}
        aria-expanded={isExpanded}
      >
        <div className="bfp-header-left">
          <FileText size={18} className="bfp-icon-title" />
          <div>
            <h3 className="bfp-title">📋 Relatórios do Bimestre</h3>
            <span className="bfp-subtitle">{className || data.className}</span>
          </div>
        </div>
        <div className="bfp-header-right">
          {data.totalAlerts > 0 && (
            <span className="bfp-alert-count">{data.totalAlerts}</span>
          )}
          {isExpanded ? (
            <ChevronUp size={18} />
          ) : (
            <ChevronDown size={18} />
          )}
        </div>
      </button>

      {/* ── Body (collapsible) ─────────────────────────────────── */}
      <div
        className={`bfp-body ${isExpanded ? 'bfp-body--open' : 'bfp-body--closed'}`}
      >
        {isLoading ? (
          <div className="bfp-loading">
            <div className="bfp-spinner" />
            <span>Carregando relatórios…</span>
          </div>
        ) : (
          <>
            {/* ── Summary Stats ───────────────────────────────── */}
            <div className="bfp-summary">
              <div className="bfp-stat">
                <AlertTriangle size={14} className="bfp-icon-danger" />
                <span className="bfp-stat-value">{data.disciplineCount}</span>
                <span className="bfp-stat-label">Indisciplina</span>
              </div>
              <div className="bfp-stat">
                <Clock size={14} className="bfp-icon-warning" />
                <span className="bfp-stat-value">{data.delayCount}</span>
                <span className="bfp-stat-label">Atrasos</span>
              </div>
              <div className="bfp-stat">
                <FileText size={14} className="bfp-icon-info" />
                <span className="bfp-stat-value">{data.totalAlerts}</span>
                <span className="bfp-stat-label">Total</span>
              </div>
            </div>

            {/* ── Alert List ──────────────────────────────────── */}
            <ul className="bfp-list">
              {data.alerts.map((alert) => (
                <li key={alert.id} className="bfp-alert-card">
                  <div className="bfp-alert-top">
                    <div className="bfp-student-info">
                      <User size={14} className="bfp-icon-user" />
                      <span className="bfp-student-name">
                        {alert.studentName}
                      </span>
                    </div>
                    <span
                      className={`bfp-badge ${
                        alert.alertType === 'indisciplina'
                          ? 'bfp-badge--danger'
                          : 'bfp-badge--warning'
                      }`}
                    >
                      {alert.rawType ? (
                        alert.rawType === 'CONVERSA' ? 'Conversa' :
                        alert.rawType === 'CELULAR' ? 'Celular' :
                        alert.rawType === 'QUADRO' ? 'Não Copia' :
                        alert.rawType === 'SONO' ? 'Sono' :
                        alert.rawType === 'INTERRUPCAO' ? 'Interrupção' :
                        alert.rawType === 'SEM_MATERIAL' ? 'Sem Apostila' :
                        alert.rawType === 'FORA_SALA' ? 'Fora de Sala' :
                        alert.rawType === 'FORA_MAPA' ? 'Fora do Mapa' :
                        alert.alertType === 'indisciplina' ? 'Indisciplina' : 'Atraso'
                      ) : (
                        alert.alertType === 'indisciplina' ? 'Indisciplina' : 'Atraso de Tarefas'
                      )}
                    </span>
                  </div>

                  <p className="bfp-observation">{alert.observation}</p>

                  <div className="bfp-alert-meta">
                    <span className="bfp-teacher">
                      {alert.reportingTeacher}
                    </span>
                    <span className="bfp-date">{formatDate(alert.date)}</span>
                  </div>
                </li>
              ))}
            </ul>

            {data.alerts.length === 0 && (
              <div className="bfp-empty">
                <FileText size={28} />
                <p>Nenhum alerta registrado neste bimestre.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default BimestralFeedbackPanel;
