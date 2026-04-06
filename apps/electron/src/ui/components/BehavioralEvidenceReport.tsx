import React, { useRef, useEffect } from 'react';
import { 
  BarChart3, TrendingUp, AlertCircle, 
  CheckCircle2, Info, Download, Share2
} from 'lucide-react';

import './BehavioralEvidenceReport.css';

interface Props {
  studentId: string;
}

/**
 * BehavioralEvidenceReport (v1637)
 * Componente visual para reuniões com pais: Aluno vs Média da Turma.
 */
const MetricRow: React.FC<{ m: any }> = ({ m }) => {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (barRef.current) {
      const parentWidth = barRef.current.parentElement?.clientWidth || 1;
      const ratio = m.studentValue / (m.benchmarkValue * 2 || 1);
      barRef.current.style.setProperty('--bar-width', `${Math.min(ratio * 100, 100)}%`);
    }
  }, [m.studentValue, m.benchmarkValue]);

  return (
    <div className={`metric-row ${m.status.toLowerCase()}`}>
      <div className="metric-info">
        <span className="metric-label">{m.label}</span>
        <div className="flex items-baseline gap-2">
          <span className="metric-value">{m.studentValue}{m.unit}</span>
          <span className="metric-avg">Média da Turma: {m.benchmarkValue.toFixed(1)}{m.unit}</span>
        </div>
      </div>

      <div className="comparison-bar-container">
        <div className="bar-bg">
          <div ref={barRef} className="bar-fill student"></div>
          <div className="bar-marker benchmark" title="Média da Turma"></div>
        </div>
        {m.status !== 'NORMAL' && (
          <div className="status-indicator">
            <AlertCircle size={14} />
            <span>OUTLIER {m.status}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export const BehavioralEvidenceReport: React.FC<Props> = ({ studentId }) => {
  const [comparison, setComparison] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchComparison = async () => {
      const aquila = (window as any).aquila;
      if (aquila) {
        const data = await aquila.getStudentComparison(studentId);
        setComparison(data);
      }
      setLoading(false);
    };
    fetchComparison();
  }, [studentId]);

  if (loading) return <div className="text-slate-500 text-sm">Carregando evidências...</div>;
  if (!comparison) return <div className="text-red-500">Dados insuficientes para gerar evidência.</div>;

  const { student, benchmark, deviations } = comparison;

  const metrics = [
    { label: 'Atrasos no Mês', studentValue: student.delays, benchmarkValue: benchmark.averageDelays, unit: 'vezes', status: deviations.delays },
    { label: 'Faltas', studentValue: student.absences, benchmarkValue: benchmark.averageAbsences, unit: 'dias', status: deviations.absences },
    { label: 'Score Comportamental', studentValue: student.behaviorScore, benchmarkValue: benchmark.averageBehaviorScore, unit: '%', status: deviations.score }
  ];

  return (
    <div className="evidence-report-card">
      <header className="report-header">
         <div className="flex items-center gap-3">
            <BarChart3 className="text-blue-400" />
            <h3 className="text-lg font-black italic">ANÁLISE COMPARATIVA DE PERFORMANCE</h3>
         </div>
         <div className="report-actions">
            <Download size={18} className="cursor-pointer hover:text-blue-400" />
            <Share2 size={18} className="cursor-pointer hover:text-blue-400" />
         </div>
      </header>

      <div className="metrics-grid">
         {metrics.map((m, idx) => <MetricRow key={idx} m={m} />)}
      </div>

      <footer className="report-footer">
         <div className="info-box">
            <Info size={16} />
            <p>Estes dados são extraídos automaticamente via Visão Computacional e Sensores de Rádio, garantindo 100% de imparcialidade institucional.</p>
         </div>
         <div className="conclusion-badge">
            <TrendingUp size={16} />
            <span>Ranking: #{comparison.rankAcrossClass.position} de {comparison.rankAcrossClass.total}</span>
         </div>
      </footer>
    </div>
  );
};
