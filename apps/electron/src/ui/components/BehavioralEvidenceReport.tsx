import React, { useRef, useEffect } from 'react';
import {
  BarChart3, Info, ShieldCheck
} from 'lucide-react';

import './BehavioralEvidenceReport.css';

interface Props {
  studentId: string;
}

/**
 * BehavioralEvidenceReport (CNE/CP nº 15/2026 Compliant)
 * Resumo objetivo de assiduidade e pontualidade para acompanhamento docente e familiar,
 * sem ranqueamento competitivo, sem escore comportamental e sem inferência automatizada.
 */
const MetricRow: React.FC<{ m: { label: string; studentValue: number; unit: string; note: string } }> = ({ m }) => {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (barRef.current) {
      const normalized = Math.min(Math.max(m.studentValue * 10, 0), 100);
      barRef.current.style.setProperty('--bar-width', `${normalized}%`);
    }
  }, [m.studentValue]);

  return (
    <div className="metric-row normal">
      <div className="metric-info">
        <span className="metric-label">{m.label}</span>
        <div className="flex items-baseline gap-2">
          <span className="metric-value">{m.studentValue} {m.unit}</span>
          <span className="metric-avg">{m.note}</span>
        </div>
      </div>

      <div className="comparison-bar-container">
        <div className="bar-bg">
          <div ref={barRef} className="bar-fill student"></div>
        </div>
      </div>
    </div>
  );
};

export const BehavioralEvidenceReport: React.FC<Props> = ({ studentId }) => {
  const [comparison, setComparison] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let active = true;
    const fetchComparison = async () => {
      try {
        const aquila = (window as any).aquila;
        if (aquila?.getStudentComparison) {
          const data = await aquila.getStudentComparison(studentId);
          if (active) setComparison(data);
        }
      } catch {
        // Sem dados locais disponíveis
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchComparison();
    return () => { active = false; };
  }, [studentId]);

  if (loading) return <div className="text-slate-500 text-sm">Carregando registros objetivos...</div>;
  if (!comparison?.student) {
    return (
      <div className="evidence-report-card">
        <header className="report-header">
          <div className="flex items-center gap-3">
            <BarChart3 className="text-blue-400" />
            <h3 className="text-lg font-bold">ACOMPANHAMENTO OBJETIVO DE ASSIDUIDADE</h3>
          </div>
        </header>
        <p className="text-slate-400 text-sm m-0">
          Nenhum registro consolidado de frequência disponível para este estudante no momento.
        </p>
      </div>
    );
  }

  const { student } = comparison;

  const metrics = [
    {
      label: 'Registros de Atraso no Mês',
      studentValue: Number(student.delays ?? 0),
      unit: 'ocorrências',
      note: 'Aferido via chamada nominal ou crachá QR de portaria'
    },
    {
      label: 'Faltas Registradas',
      studentValue: Number(student.absences ?? 0),
      unit: 'dias',
      note: 'Sujeito a justificativa familiar e validação da secretaria'
    }
  ];

  return (
    <div className="evidence-report-card">
      <header className="report-header">
        <div className="flex items-center gap-3">
          <BarChart3 className="text-blue-400" />
          <h3 className="text-lg font-bold">ACOMPANHAMENTO OBJETIVO DE ASSIDUIDADE</h3>
        </div>
        <div className="conclusion-badge">
          <ShieldCheck size={16} />
          <span>Sem Social Scoring • CNE/CP 15/2026</span>
        </div>
      </header>

      <div className="metrics-grid">
        {metrics.map((m, idx) => <MetricRow key={idx} m={m} />)}
      </div>

      <footer className="report-footer">
        <div className="info-box">
          <Info size={16} />
          <p>
            Resumo restrito ao acompanhamento pedagógico e de frequência escolar registrada pela instituição.
            Nos termos do Parecer CNE/CP nº 15/2026, não são exibidos rankings comparativos nem escores comportamentais.
          </p>
        </div>
      </footer>
    </div>
  );
};
