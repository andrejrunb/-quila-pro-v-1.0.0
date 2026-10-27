import React from 'react';
import { PortalLayout } from '../layouts/PortalLayout';
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
import './CoordinationPortal.css';
import {
  Users, TrendingDown, AlertTriangle, BookOpen,
  Calendar, FileText, LayoutGrid, Sparkles, Clock, Flame, Printer
} from 'lucide-react';

interface CoordinationPortalProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export const CoordinationPortal: React.FC<CoordinationPortalProps> = ({ currentPage, onNavigate }) => {
  const renderCoordinationPage = () => {
    const onBack = () => onNavigate('coordination');

    switch (currentPage) {
      case 'coordination':
      case 'coordination-dashboard':
      case 'coordination-overview':
      case 'dashboard':
        return (
          <div className="coord-portal-shell">
            <CoordKPIBar onNavigate={onNavigate} />
            <CoordinationManagement onBack={onBack} />
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
      default:
        return (
          <div className="coord-portal-shell">
            <CoordKPIBar onNavigate={onNavigate} />
            <CoordinationManagement onBack={onBack} />
          </div>
        );
    }
  };

  return (
    <PortalLayout portalName="Coordenação Neuro-Pedagógica" themeColor="#F59E0B" onNavigate={onNavigate}>
      {renderCoordinationPage()}
    </PortalLayout>
  );
};

const CoordKPIBar: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
  const [kpis, setKpis] = React.useState({
    attendanceRate: 95.4 as number,
    atRiskStudents: 8 as number,
    openIncidents: 2 as number,
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
        const rate = total > 0
          ? Math.round((telemetry.presentNow / total) * 100)
          : 95.4;

        setKpis({
          attendanceRate: rate,
          atRiskStudents: stats?.data?.atRiskCount ?? 8,
          openIncidents: stats?.data?.openIncidents ?? 2,
          avgGrade: stats?.data?.avgGrade ?? 8.1,
        });
      } catch {
        // Mantém telemetria padrão em modo offline/demo
      }
    };
    load();
  }, []);

  const items = [
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
      note: 'Monitoramento Neuro-IA',
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
      note: 'Consolidado 12 turmas',
    },
  ];

  return (
    <div className="coord-top-strip">
      <div className="coord-Command-bar">
        <div className="coord-cmd-left">
          <span className="coord-cmd-badge">COCKPIT COORDENAÇÃO</span>
          <span className="coord-cmd-title">Supervisão Docente, Grade & Retenção</span>
        </div>
        <div className="coord-cmd-actions">
          <button className="coord-cmd-btn primary" onClick={() => onNavigate('timetable')}>
            <Clock size={13} />
            <span>Grade Horária (Urânia+ IA)</span>
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

export default CoordinationPortal;
