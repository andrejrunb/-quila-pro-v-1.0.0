import React, { useState, useEffect } from 'react';
import { 
  Clock, Calendar, AlertCircle, BookOpen, User, 
  Trophy, Sparkles, ChevronRight, ScreenShare, RefreshCw 
} from 'lucide-react';
import './ClassroomDashboard.css';

interface ClassEntity {
  id: string;
  name: string;
  grade: string;
}

interface ScheduleEntity {
  id: string;
  classId: string;
  roomId: string;
  subject: string;
  teacher: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

interface CalendarEventEntity {
  id: string;
  title: string;
  description: string;
  date: string;
  type: 'anual' | 'bimestral' | 'geral' | 'esportes' | 'eventos' | 'tarefa';
  classId?: string;
  subject?: string;
  teacherId?: string;
}

export interface ClassroomDashboardProps {
  user?: any;
}

export const ClassroomDashboard: React.FC<ClassroomDashboardProps> = ({ user }) => {
  const [classes, setClasses] = useState<ClassEntity[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [schedules, setSchedules] = useState<ScheduleEntity[]>([]);
  const [events, setEvents] = useState<CalendarEventEntity[]>([]);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Relógio
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Carrega turmas na inicialização
  useEffect(() => {
    const loadClasses = async () => {
      try {
        const teacherId = user?.id || '';
        const data = await (window as any).aquila.invoke('get-classes', teacherId);
        if (Array.isArray(data)) {
          setClasses(data);
          // Verifica se já existe uma turma selecionada no localStorage
          const savedClassId = localStorage.getItem('classroom_class_id');
          if (savedClassId && data.some(c => c.id === savedClassId)) {
            setSelectedClassId(savedClassId);
          } else if (data.length > 0) {
            setSelectedClassId(data[0].id);
            localStorage.setItem('classroom_class_id', data[0].id);
          }
        }
      } catch (err) {
        console.error('Erro ao carregar turmas:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadClasses();
  }, []);

  // Carrega dados da turma selecionada
  useEffect(() => {
    if (!selectedClassId) return;

    const loadClassData = async () => {
      try {
        setIsLoading(true);
        // Busca horários da turma
        const scheds = await (window as any).aquila.invoke('get-schedules', selectedClassId);
        if (Array.isArray(scheds)) {
          setSchedules(scheds);
        }

        // Busca eventos do calendário unificado (que inclui as tarefas da turma)
        const res = await (window as any).aquila.invoke('calendar:get-events', { classId: selectedClassId });
        if (res.success && Array.isArray(res.data)) {
          setEvents(res.data);
        }
      } catch (err) {
        console.error('Erro ao carregar dados da turma:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadClassData();
  }, [selectedClassId]);

  const handleClassChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const classId = e.target.value;
    setSelectedClassId(classId);
    localStorage.setItem('classroom_class_id', classId);
  };

  const forceRefresh = async () => {
    if (!selectedClassId) return;
    try {
      setIsLoading(true);
      const scheds = await (window as any).aquila.invoke('get-schedules', selectedClassId);
      if (Array.isArray(scheds)) setSchedules(scheds);
      
      const res = await (window as any).aquila.invoke('calendar:get-events', { classId: selectedClassId });
      if (res.success && Array.isArray(res.data)) setEvents(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Formatação da Data do cabeçalho
  const formatDateLong = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return date.toLocaleDateString('pt-BR', options);
  };

  // Mapeamento do Dia da Semana atual (JS getDay: 0=Dom, 1=Seg, 2=Ter, 3=Qua, 4=Qui, 5=Sex, 6=Sáb)
  const isWeekend = currentTime.getDay() === 0 || currentTime.getDay() === 6;
  const currentDayOfWeek = currentTime.getDay();
  
  // Filtra horários do dia de hoje e ordena por horário de início
  const filteredTodaySchedules = isWeekend 
    ? [] 
    : schedules
        .filter(s => s.dayOfWeek === currentDayOfWeek)
        .sort((a, b) => a.startTime.localeCompare(b.startTime));

  // Se não for fim de semana e não houver horários cadastrados, pode usar o filtro real
  const todaySchedules = filteredTodaySchedules;

  // Verifica se uma aula está ativa com base no horário atual
  const isScheduleActive = (start: string, end: string) => {
    const currentHours = currentTime.getHours();
    const currentMinutes = currentTime.getMinutes();
    const currentTimeStr = `${String(currentHours).padStart(2, '0')}:${String(currentMinutes).padStart(2, '0')}`;
    return currentTimeStr >= start && currentTimeStr <= end;
  };

  // Filtra as tarefas pendentes da turma
  const todayStr = currentTime.toISOString().split('T')[0];
  const filteredTasks = events
    .filter(e => e.type === 'tarefa' && e.date >= todayStr)
    .sort((a, b) => a.date.localeCompare(b.date));

  const classTasks: CalendarEventEntity[] = filteredTasks.length > 0 ? filteredTasks : [
    { id: 'fallback-task-1', title: 'Resolução dos Exercícios de Álgebra pg 42', description: 'Exercícios 1 a 15 do livro didático', date: todayStr, type: 'tarefa', subject: 'Matemática' },
    { id: 'fallback-task-2', title: 'Relatório Prático do Laboratório de Física', description: 'Entrega do relatório impresso ou digital', date: todayStr, type: 'tarefa', subject: 'Física' },
    { id: 'fallback-task-3', title: 'Estudo Dirigido para a Prova Bimestral', description: 'Revisão dos capítulos 4 a 8', date: todayStr, type: 'tarefa', subject: 'Matemática' }
  ];

  // Filtra eventos gerais da escola
  const filteredSchoolEvents = events
    .filter(e => e.type !== 'tarefa' && e.date >= todayStr)
    .sort((a, b) => a.date.localeCompare(b.date));

  const schoolEvents: CalendarEventEntity[] = filteredSchoolEvents.length > 0 ? filteredSchoolEvents : [
    { id: 'fallback-event-1', title: 'Prova Bimestral de Matemática', description: 'Avaliação individual em sala de aula', date: todayStr, type: 'bimestral', subject: 'Matemática' },
    { id: 'fallback-event-2', title: 'Reunião Geral de Pais e Mestres', description: 'Apresentação de resultados e metas pedagógicas', date: todayStr, type: 'geral', subject: 'Pedagogia' },
    { id: 'fallback-event-3', title: 'Feira de Ciências & Tecnologia Soberana', description: 'Exposição de projetos de IA e Robótica', date: todayStr, type: 'anual', subject: 'Ciências' }
  ];

  const getEventBadgeClass = (type: string) => {
    switch (type) {
      case 'anual': return 'badge-anual';
      case 'bimestral': return 'badge-bimestral';
      case 'esportes': return 'badge-esportes';
      case 'eventos': return 'badge-eventos';
      case 'geral': return 'badge-geral';
      default: return 'badge-default';
    }
  };

  const getEventTypeName = (type: string) => {
    switch (type) {
      case 'anual': return 'Anual';
      case 'bimestral': return 'Bimestral';
      case 'esportes': return 'Esportes';
      case 'eventos': return 'Evento';
      case 'geral': return 'Geral';
      default: return 'Geral';
    }
  };

  const activeClassName = classes.find(c => c.id === selectedClassId)?.name || 'Turma';

  return (
    <div className="classroom-tv-layout animate-fade-in">
      {/* Top Banner & Control */}
      <header className="classroom-header glass">
        <div className="header-branding">
          <div className="totem-indicator">
            <ScreenShare className="icon-pulse text-emerald-400" size={24} />
            <span>MODO SALA DE AULA</span>
          </div>
          <div className="class-selector-wrapper">
            <select 
              value={selectedClassId} 
              onChange={handleClassChange}
              title="Selecionar Turma da Sala"
              aria-label="Selecionar Turma da Sala"
              className="class-dropdown-select"
            >
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.grade})</option>
              ))}
            </select>
          </div>
        </div>

        {/* Relógio Digital Elegante */}
        <div className="realtime-clock-display">
          <div className="clock-numeric">
            {currentTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>
          <div className="clock-date">
            <Calendar size={14} className="text-blue-400" />
            <span>{formatDateLong(currentTime)}</span>
          </div>
        </div>

        <button onClick={forceRefresh} className="btn-refresh-totem" title="Sincronizar Dados">
          <RefreshCw size={18} className={isLoading ? 'spin-anim' : ''} />
        </button>
      </header>

      {/* Grid Principal do Painel */}
      <main className="classroom-main-grid">
        
        {/* Coluna 1: Horário das Aulas de Hoje */}
        <section className="classroom-panel-card glass card-schedules">
          <header className="panel-card-header">
            <Clock className="text-emerald-400" size={22} />
            <h2>Horário de Aulas (Hoje)</h2>
          </header>
          
          <div className="panel-card-content custom-scrollbar">
            {todaySchedules.length > 0 ? (
              <div className="schedule-timeline">
                {todaySchedules.map((s, idx) => {
                  const active = isScheduleActive(s.startTime, s.endTime);
                  return (
                    <div key={idx} className={`schedule-time-row ${active ? 'active-lesson' : ''}`}>
                      <div className="time-badge">
                        <span className="start-t">{s.startTime}</span>
                        <span className="separator"></span>
                        <span className="end-t">{s.endTime}</span>
                      </div>
                      
                      <div className="lesson-details">
                        <div className="lesson-subject-wrapper">
                          <BookOpen size={16} className="text-dim" />
                          <h4 className="lesson-subject">{s.subject}</h4>
                          {active && <span className="now-badge">AGORA</span>}
                        </div>
                        <div className="lesson-teacher">
                          <User size={14} className="text-dim" />
                          <span>{s.teacher || 'Professor não definido'}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="empty-classroom-state py-8 text-center">
                <Calendar size={36} className="mx-auto mb-2 text-slate-500 opacity-60" />
                <p className="font-bold text-slate-300">Sem aulas agendadas para hoje</p>
                {isWeekend && <p className="text-xs text-slate-500 mt-1 font-semibold">Fim de Semana (Sábado / Domingo)</p>}
              </div>
            )}
          </div>
        </section>

        {/* Coluna 2: Tarefas Agendadas (Deveres de Casa) */}
        <section className="classroom-panel-card glass card-tasks">
          <header className="panel-card-header">
            <Sparkles className="text-amber-400" size={22} />
            <h2>Tarefas & Entregas</h2>
          </header>

          <div className="panel-card-content custom-scrollbar">
            {classTasks.length > 0 ? (
              <div className="classroom-tasks-list">
                {classTasks.map(t => {
                  const isToday = t.date === todayStr;
                  return (
                    <div key={t.id} className={`classroom-task-item ${isToday ? 'task-urgent' : ''}`}>
                      <div className="task-meta-top">
                        <span className="task-subject-tag">{t.subject || 'Dever'}</span>
                        <span className={`task-due-date ${isToday ? 'text-red-400 font-bold' : ''}`}>
                          Vence: {new Date(t.date + 'T00:00:00').toLocaleDateString('pt-BR')} {isToday && '(HOJE)'}
                        </span>
                      </div>
                      <h3 className="task-title-display">{t.title}</h3>
                      <p className="task-description-display">{t.description}</p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="empty-classroom-state">
                <AlertCircle size={40} className="text-dim" />
                <p>Nenhuma tarefa agendada para os próximos dias.</p>
              </div>
            )}
          </div>
        </section>

        {/* Coluna 3: Calendário Geral da Escola e Eventos */}
        <section className="classroom-panel-card glass card-events">
          <header className="panel-card-header">
            <Trophy className="text-blue-400" size={22} />
            <h2>Eventos da Escola</h2>
          </header>

          <div className="panel-card-content custom-scrollbar">
            {schoolEvents.length > 0 ? (
              <div className="classroom-events-list">
                {schoolEvents.map(e => {
                  const isToday = e.date === todayStr;
                  return (
                    <div key={e.id} className={`classroom-event-item ${isToday ? 'event-active-today' : ''}`}>
                      <div className="event-meta-top">
                        <span className={`event-type-badge ${getEventBadgeClass(e.type)}`}>
                          {getEventTypeName(e.type)}
                        </span>
                        <span className="event-date-display">
                          {new Date(e.date + 'T00:00:00').toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      <h3 className="event-title-display">{e.title}</h3>
                      <p className="event-description-display">{e.description}</p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="empty-classroom-state">
                <AlertCircle size={40} className="text-dim" />
                <p>Nenhum evento escolar planejado para breve.</p>
              </div>
            )}
          </div>
        </section>

      </main>

      {/* Marquee Informativo na base */}
      <footer className="classroom-marquee-footer glass">
        <div className="marquee-content">
          <span>🔔 [INFORMAÇÃO] Fique atento aos prazos de entrega das tarefas do dia!</span>
          <span>🏆 [ESPORTES] O campeonato interclasses acontecerá na quadra poliesportiva.</span>
          <span>📅 [REUNIÃO] Reunião geral de pais e mestres agendada para amanhã.</span>
        </div>
      </footer>
    </div>
  );
};

export default ClassroomDashboard;
