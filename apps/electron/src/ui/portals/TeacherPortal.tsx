import React from 'react';
import { PortalLayout } from '../layouts/PortalLayout';
import { ClassroomManagement } from '../pages/ClassroomManagement';
import { Diary } from '../pages/Diary';
import { StudentPortfolio } from '../pages/StudentPortfolio';
import { TeacherSchedule } from '../pages/TeacherSchedule';
import { SeatingIntelligence } from '../pages/SeatingIntelligence';
import { AttendanceCall } from '../pages/AttendanceCall';
import { TaskScheduler } from '../pages/TaskScheduler';
import { WhiteboardCapture } from '../pages/WhiteboardCapture';
import { TeacherDailyReport } from '../pages/TeacherDailyReport';
import Students from '../pages/Students';
import { StudentMasteryChamber } from '../pages/StudentMasteryChamber';
import { TeacherGradebook } from '../pages/TeacherGradebook';
import { TeacherAIStudio } from '../pages/TeacherAIStudio';
import { ActivityFactory } from '../pages/ActivityFactory';
import { SovereignPvPArena } from '../components/SovereignPvPArena';
import { SlideStudio } from '../pages/SlideStudio';
import { BNCCSkillTree } from '../components/BNCCSkillTree';
import { EssayLab1000 } from '../components/EssayLab1000';
import OmrScannerUI from '../components/OmrScannerUI';
import { BNCCProficiencyHeatmap } from '../components/BNCCProficiencyHeatmap';
import { ExamPaperFoundry } from '../components/ExamPaperFoundry';
import { YouTubePedagogicalFinder } from '../components/YouTubePedagogicalFinder';
import {
  Clock, Users, AlertCircle, CheckCircle2, Calendar,
  FileText, ChevronRight, AlertTriangle, LayoutGrid, Sparkles, BookOpen, FileSpreadsheet, Swords, Presentation, Camera, Flame, Printer, Tv
} from 'lucide-react';
import './TeacherPortal.css';

interface TeacherPortalProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  studentParams?: any;
  user?: any;
}

const PremiumDashboard: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
  const scheduleData = [
    { id: 1, time: '07:00 - 07:50', subject: 'Matemática', className: '3º A', room: 'SALA 12', current: false },
    { id: 2, time: '07:50 - 08:40', subject: 'Matemática', className: '3º A', room: 'SALA 12', current: false },
    { id: 3, time: '08:40 - 09:30', subject: 'Física Aplicada', className: '2º B', room: 'SALA 08', current: true },
    { id: 4, time: '09:50 - 10:40', subject: 'Física Aplicada', className: '2º B', room: 'SALA 08', current: false },
    { id: 5, time: '10:40 - 11:30', subject: 'Matemática', className: '1º C', room: 'SALA 05', current: false },
    { id: 6, time: '11:30 - 12:20', subject: 'Matemática', className: '1º C', room: 'SALA 05', current: false },
  ];

  const attentionStudents = [
    { id: 'std-1', name: 'Lucas Andrade', className: '2º B • Cadeira B3', alert: 'Foco Oscilante • IA', photo: './avatars/face-1.jpg' },
    { id: 'std-2', name: 'Sofia Costa', className: '3º A • Cadeira A2', alert: 'Dúvida Recorrente', photo: './avatars/face-2.jpg' },
    { id: 'std-3', name: 'Gabriel Santos', className: '2º B • Cadeira C4', alert: 'Conversa Lateral', photo: './avatars/face-3.jpg' },
    { id: 'std-4', name: 'Helena Oliveira', className: '1º C • Cadeira A1', alert: 'Destaque Positivo', photo: './avatars/face-4.jpg' },
  ];

  const pendingTasks = [
    { id: 1, desc: 'Diário 3º A pendente de assinatura', date: 'HOJE', priority: 'Alta', target: 'diary' },
    { id: 2, desc: 'Lançamento de notas 2º B (Planilha Bimestral)', date: 'AMANHÃ', priority: 'Média', target: 'gradebook' },
    { id: 3, desc: 'Relatório neuro-pedagógico semanal', date: '15/10', priority: 'Baixa', target: 'daily-report' }
  ];

  const upcomingEvents = [
    { id: 1, date: '19/10', title: 'Alinhamento de Coordenação', type: 'REUNIÃO' },
    { id: 2, date: '21/10', title: 'Simulado ENEM — 3º Ano A', type: 'AVALIAÇÃO' },
    { id: 3, date: '24/10', title: 'Conselho de Classe', type: 'CONSELHO' },
  ];

  return (
    <div className="tp-cockpit">
      {/* Stitch Top Command Bar — Uniform 32px Buttons & Clean Spacing */}
      <div className="tp-command-bar">
        <div className="tp-command-title-group">
          <span className="tp-command-badge">COCKPIT DOCENTE</span>
          <h1 className="tp-command-title">Gestão de Sala & Telemetria Pedagógica</h1>
        </div>
        <div className="tp-command-actions">
          <button className="tp-action-btn primary" onClick={() => onNavigate('youtube-radar')}>
            <Tv size={14} />
            <span>Radar Videoaulas YouTube</span>
          </button>
          <button className="tp-action-btn primary" onClick={() => onNavigate('exam-foundry')}>
            <Printer size={14} />
            <span>Gerador de Provas A4</span>
          </button>
          <button className="tp-action-btn primary" onClick={() => onNavigate('slide-studio')}>
            <Presentation size={14} />
            <span>Estúdio de Slides</span>
          </button>
          <button className="tp-action-btn primary" onClick={() => onNavigate('arena')}>
            <Swords size={14} />
            <span>Arena Batalha</span>
          </button>
          <button className="tp-action-btn primary" onClick={() => onNavigate('knowledge-canvas')}>
            <Sparkles size={14} />
            <span>Canvas Áquila</span>
          </button>
          <button className="tp-action-btn primary" onClick={() => onNavigate('ai-studio')}>
            <Sparkles size={14} />
            <span>Estúdio Pedagógico IA</span>
          </button>
          <button className="tp-action-btn primary" onClick={() => onNavigate('activity-factory')}>
            <Sparkles size={14} />
            <span>Fábrica de Atividades</span>
          </button>
          <button className="tp-action-btn primary" onClick={() => onNavigate('seating-intelligence')}>
            <LayoutGrid size={14} />
            <span>Mapa de Sala (IA)</span>
          </button>
          <button className="tp-action-btn primary" onClick={() => onNavigate('gradebook')}>
            <FileSpreadsheet size={14} />
            <span>Planilha de Notas</span>
          </button>
          <button className="tp-action-btn" onClick={() => onNavigate('attendance')}>
            <Users size={14} />
            <span>Chamada Digital</span>
          </button>
          <button className="tp-action-btn" onClick={() => onNavigate('diary')}>
            <BookOpen size={14} />
            <span>Diário de Classe</span>
          </button>
          <button className="tp-action-btn" onClick={() => onNavigate('daily-report')}>
            <FileText size={14} />
            <span>Relatório IA</span>
          </button>
          <button className="tp-action-btn" onClick={() => onNavigate('essay-lab')}>
            <FileText size={14} />
            <span>Redação 1000</span>
          </button>
          <button className="tp-action-btn" onClick={() => onNavigate('skill-tree')}>
            <BookOpen size={14} />
            <span>Árvore BNCC</span>
          </button>
          <button className="tp-action-btn" onClick={() => onNavigate('omr-scanner')}>
            <Camera size={14} />
            <span>Gabarito OMR</span>
          </button>
          <button className="tp-action-btn" onClick={() => onNavigate('bncc-heatmap')}>
            <Flame size={14} />
            <span>Mapa de Calor BNCC</span>
          </button>
          <button className="tp-action-btn" onClick={() => onNavigate('mastery-chamber')}>
            <Sparkles size={14} />
            <span>Câmara de Maestria</span>
          </button>
        </div>
      </div>

      {/* 4-Column Telemetry KPI Strip */}
      <section className="tp-kpi-grid">
        <div className="tp-kpi-pod">
          <div className="tp-kpi-info">
            <span className="tp-kpi-label">TURMAS HOJE</span>
            <span className="tp-kpi-value">06 AULAS</span>
            <span className="tp-kpi-sub">Aula 3/6 em andamento</span>
          </div>
          <div className="tp-kpi-icon" style={{ background: 'rgba(59, 130, 246, 0.14)', color: '#60A5FA' }}>
            <Clock size={18} />
          </div>
        </div>

        <div className="tp-kpi-pod">
          <div className="tp-kpi-info">
            <span className="tp-kpi-label">ALUNOS ATIVOS</span>
            <span className="tp-kpi-value">187</span>
            <span className="tp-kpi-sub">3 turmas vinculadas</span>
          </div>
          <div className="tp-kpi-icon" style={{ background: 'rgba(0, 240, 255, 0.12)', color: '#00F0FF' }}>
            <Users size={18} />
          </div>
        </div>

        <div className="tp-kpi-pod">
          <div className="tp-kpi-info">
            <span className="tp-kpi-label">FREQUÊNCIA MÉDIA</span>
            <span className="tp-kpi-value" style={{ color: '#10B981' }}>94.2%</span>
            <span className="tp-kpi-sub">+1.8% vs semana anterior</span>
          </div>
          <div className="tp-kpi-icon" style={{ background: 'rgba(16, 185, 129, 0.14)', color: '#10B981' }}>
            <CheckCircle2 size={18} />
          </div>
        </div>

        <div className="tp-kpi-pod">
          <div className="tp-kpi-info">
            <span className="tp-kpi-label">PENDÊNCIAS</span>
            <span className="tp-kpi-value" style={{ color: '#F59E0B' }}>03 ITENS</span>
            <span className="tp-kpi-sub">1 diário vence hoje</span>
          </div>
          <div className="tp-kpi-icon" style={{ background: 'rgba(245, 158, 11, 0.14)', color: '#F59E0B' }}>
            <AlertCircle size={18} />
          </div>
        </div>
      </section>

      {/* Main 2-Column High-Density Bento Grid */}
      <div className="tp-main-grid">
        {/* Left: Grade Horária & Ações Diretas por Turma */}
        <section className="tp-panel">
          <div className="tp-panel-header">
            <h2 className="tp-panel-title">
              <Clock size={14} color="#00F0FF" />
              <span>Cronograma Operacional do Dia</span>
            </h2>
            <span className="tp-panel-tag">TURNO MATUTINO • 06 TEMPOS</span>
          </div>

          <div className="tp-schedule-list">
            {scheduleData.map(slot => (
              <div key={slot.id} className={`tp-schedule-row ${slot.current ? 'current' : ''}`}>
                <div className="tp-slot-left">
                  <span className="tp-slot-time">{slot.time}</span>
                  <div className="tp-slot-details">
                    <span className="tp-slot-subject">{slot.subject} • {slot.className}</span>
                    <span className="tp-slot-room">{slot.room}</span>
                    {slot.current && <span className="tp-slot-live-pill">EM AULA AGORA</span>}
                  </div>
                </div>
                <div className="tp-slot-actions">
                  <button className="tp-mini-btn" onClick={() => onNavigate('seating-intelligence')} title="Abrir Mapa de Sala IA">
                    <LayoutGrid size={12} />
                    <span>Mapa</span>
                  </button>
                  <button className="tp-mini-btn accent" onClick={() => onNavigate('gradebook')} title="Abrir Planilha de Lançamento de Notas">
                    <FileSpreadsheet size={12} />
                    <span>Notas</span>
                  </button>
                  <button className="tp-mini-btn" onClick={() => onNavigate('attendance')} title="Realizar Chamada">
                    <Users size={12} />
                    <span>Chamada</span>
                  </button>
                  <button className="tp-mini-btn" onClick={() => onNavigate('diary')} title="Abrir Diário de Classe">
                    <FileText size={12} />
                    <span>Diário</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Right: Radar de Alunos (Fotos Retangulares) + Pendências + Eventos */}
        <div className="tp-right-stack">
          <section className="tp-panel">
            <div className="tp-panel-header">
              <h2 className="tp-panel-title">
                <Users size={14} color="#00F0FF" />
                <span>Radar de Atenção em Sala (Neuro-IA)</span>
              </h2>
              <button className="tp-mini-btn" onClick={() => onNavigate('seating-intelligence')}>
                Ver Sala Completa
              </button>
            </div>
            <div className="tp-student-attention-grid">
              {attentionStudents.map(student => (
                <div
                  key={student.id}
                  className="tp-student-card"
                  onClick={() => onNavigate('seating-intelligence')}
                  title="Clique para inspecionar no Mapa de Sala"
                >
                  <img src={student.photo} alt={student.name} className="tp-student-photo" />
                  <div className="tp-student-meta">
                    <span className="tp-student-name">{student.name}</span>
                    <span className="tp-student-class">{student.className}</span>
                    <span className="tp-student-alert">{student.alert}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="tp-panel">
            <div className="tp-panel-header">
              <h2 className="tp-panel-title">
                <AlertTriangle size={14} color="#F59E0B" />
                <span>Pendências & Próximos Eventos</span>
              </h2>
              <span className="tp-panel-tag">AÇÃO RÁPIDA</span>
            </div>

            <div className="tp-compact-list">
              {pendingTasks.map(task => (
                <div key={task.id} className="tp-compact-item">
                  <div className="tp-compact-item-left">
                    <div
                      className="tp-priority-indicator"
                      style={{
                        background:
                          task.priority === 'Alta' ? '#EF4444' : task.priority === 'Média' ? '#F59E0B' : '#3B82F6'
                      }}
                    />
                    <div>
                      <div className="tp-compact-text">{task.desc}</div>
                      <div className="tp-compact-sub">PRAZO: {task.date} • PRIORIDADE {task.priority.toUpperCase()}</div>
                    </div>
                  </div>
                  <button className="tp-mini-btn" onClick={() => onNavigate(task.target)}>
                    <span>Resolver</span>
                    <ChevronRight size={12} />
                  </button>
                </div>
              ))}

              {upcomingEvents.map(ev => (
                <div key={`ev-${ev.id}`} className="tp-compact-item">
                  <div className="tp-compact-item-left">
                    <Calendar size={14} color="#60A5FA" />
                    <div>
                      <div className="tp-compact-text">{ev.title}</div>
                      <div className="tp-compact-sub">DATA: {ev.date}</div>
                    </div>
                  </div>
                  <span className="tp-slot-room">{ev.type}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export const TeacherPortal: React.FC<TeacherPortalProps> = ({ currentPage, onNavigate, studentParams, user }) => {
  const renderTeacherPage = () => {
    const onBack = () => onNavigate('teacher-dashboard');

    switch (currentPage) {
      case 'dashboard':
      case 'teacher-dashboard':
        return <PremiumDashboard onNavigate={onNavigate} />;
      case 'gradebook':
        return <TeacherGradebook onBack={onBack} onNavigate={onNavigate} user={user} />;
      case 'students':
        return <Students onNavigate={onNavigate} onSearchParams={studentParams} onBack={onBack} user={user} />;
      case 'rooms':
        return <ClassroomManagement onBack={onBack} />;
      case 'schedule':
        return <TeacherSchedule user={user} onBack={onBack} />;
      case 'diary':
        return <Diary onBack={onBack} user={user} />;
      case 'attendance':
        return <AttendanceCall onBack={onBack} user={user} />;
      case 'tasks':
        return <TaskScheduler onBack={onBack} user={user} />;
      case 'whiteboard':
        return <WhiteboardCapture onBack={onBack} user={user} />;
      case 'daily-report':
        return <TeacherDailyReport onBack={onBack} user={user} />;
      case 'student-portfolio':
        return (
          <StudentPortfolio 
            studentId={studentParams?.studentId || ''} 
            studentName={studentParams?.studentName || 'Aluno'} 
            onBack={onBack} 
          />
        );
      case 'seating-intelligence':
        return <SeatingIntelligence onNavigate={onNavigate} onBack={() => onNavigate('teacher-dashboard')} user={user} showFeedback={true} />;
      case 'mastery-chamber':
        return <StudentMasteryChamber studentId={studentParams?.studentId} onBack={onBack} />;
      case 'knowledge-canvas':
      case 'albus-canvas':
        return <StudentMasteryChamber studentId={studentParams?.studentId} initialMode="canvas" onBack={onBack} />;
      case 'youtube-radar':
      case 'video-finder':
        return <YouTubePedagogicalFinder />;
      case 'ai-studio':
        return <TeacherAIStudio onBack={onBack} />;
      case 'activity-factory':
        return <ActivityFactory onBack={onBack} />;
      case 'exam-foundry':
      case 'banco-provas':
        return <ExamPaperFoundry onNavigate={onNavigate} />;
      case 'slide-studio':
        return <SlideStudio onBack={onBack} />;
      case 'arena':
      case 'pvp-arena':
        return <SovereignPvPArena onBack={onBack} />;
      case 'skill-tree':
      case 'bncc-skills':
        return <BNCCSkillTree onBack={onBack} />;
      case 'essay-lab':
      case 'redacao':
        return <EssayLab1000 onBack={onBack} />;
      case 'omr':
      case 'omr-scanner':
        return <OmrScannerUI onNavigate={onNavigate} />;
      case 'bncc-heatmap':
      case 'heatmap':
        return <BNCCProficiencyHeatmap />;
      default:
        return <PremiumDashboard onNavigate={onNavigate} />;
    }
  };

  return (
    <PortalLayout portalName="Portal Pedagógico (Neuro-IA)" themeColor="#3b82f6" onNavigate={onNavigate}>
      {renderTeacherPage()}
    </PortalLayout>
  );
};

export default TeacherPortal;
