import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  Clock, Calendar, AlertCircle, BookOpen, User, 
  Trophy, Sparkles, ScreenShare, RefreshCw,
  Monitor, Power, Image as ImageIcon, Settings2,
  CheckCircle2, AlertTriangle, X
} from 'lucide-react';
import { getLocalTodayIsoDate } from '../utils/studentGradeScope';
import {
  WORKSTATION_USAGE_OPTIONS,
  WorkstationUsageType,
  DEFAULT_WORKSTATION_CLASSES,
} from '../components/SetupWizard';
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

interface WorkstationState {
  usageType: WorkstationUsageType;
  classId: string;
  className: string;
  autoStartOs: boolean;
  projectWallpaper: boolean;
  wakeOffsetMinutes: number;
  shutdownOffsetMinutes: number;
  shutdownConfirmSeconds: number;
  wakeTime: string;
  shutdownTime: string;
  firstLessonStart: string;
  lastLessonEnd: string;
}

export interface ClassroomDashboardProps {
  user?: any;
}

const DEFAULT_FALLBACK_SCHEDULES = (classId: string, dayOfWeek: number): ScheduleEntity[] => [
  { id: 'slot-1', classId, roomId: 'SALA-01', subject: 'EM Disciplina IV', teacher: 'BETY', dayOfWeek, startTime: '07:30', endTime: '08:20' },
  { id: 'slot-2', classId, roomId: 'SALA-01', subject: 'EM Disciplina III', teacher: 'GUILHERME', dayOfWeek, startTime: '08:20', endTime: '09:10' },
  { id: 'slot-3', classId, roomId: 'SALA-01', subject: 'EM Disciplina IV', teacher: 'BETY', dayOfWeek, startTime: '09:10', endTime: '10:00' },
  { id: 'slot-4', classId, roomId: 'SALA-01', subject: 'EM Disciplina V', teacher: 'LANDER', dayOfWeek, startTime: '10:30', endTime: '11:10' },
];

export const ClassroomDashboard: React.FC<ClassroomDashboardProps> = ({ user }) => {
  const [classes, setClasses] = useState<ClassEntity[]>(DEFAULT_WORKSTATION_CLASSES);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [schedules, setSchedules] = useState<ScheduleEntity[]>([]);
  const [events, setEvents] = useState<CalendarEventEntity[]>([]);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [workstation, setWorkstation] = useState<WorkstationState>({
    usageType: (localStorage.getItem('aquila_terminal_profile') as WorkstationUsageType) || 'classroom',
    classId: localStorage.getItem('classroom_class_id') || '',
    className: '1 SERIE B (1ª Série EM)',
    autoStartOs: true,
    projectWallpaper: true,
    wakeOffsetMinutes: 10,
    shutdownOffsetMinutes: 10,
    shutdownConfirmSeconds: 60,
    wakeTime: '07:20',
    shutdownTime: '11:20',
    firstLessonStart: '07:30',
    lastLessonEnd: '11:10',
  });

  const [wallpaperStatus, setWallpaperStatus] = useState<{
    syncing: boolean;
    lastSyncLabel: string;
    path?: string;
    appliedHost?: boolean;
  }>({ syncing: false, lastSyncLabel: 'Aguardando sincronização' });

  const [showWorkstationModal, setShowWorkstationModal] = useState(false);
  const [draftUsageType, setDraftUsageType] = useState<WorkstationUsageType>('classroom');
  const [draftClassId, setDraftClassId] = useState<string>('');
  const [draftAutoStart, setDraftAutoStart] = useState<boolean>(true);
  const [draftProjectWallpaper, setDraftProjectWallpaper] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [showShutdownModal, setShowShutdownModal] = useState(false);
  const [shutdownCountdown, setShutdownCountdown] = useState<number>(60);
  const [shutdownActionFeedback, setShutdownActionFeedback] = useState<string | null>(null);
  const shutdownPostponedUntilRef = useRef<number>(0);

  const showNotice = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(prev => (prev === msg ? null : prev)), 4000);
  }, []);

  // Relógio em tempo real
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Carrega configuração inicial do terminal + turmas
  useEffect(() => {
    const loadInitial = async () => {
      try {
        const wsRes = await (window as any).aquila?.invoke?.('workstation:get-config');
        if (wsRes?.success && wsRes.config) {
          setWorkstation(prev => ({ ...prev, ...wsRes.config }));
        }
      } catch {}

      try {
        const teacherId = user?.id || '';
        const data = await (window as any).aquila?.invoke?.('get-classes', teacherId);
        const list: ClassEntity[] = Array.isArray(data) && data.length > 0 ? data : DEFAULT_WORKSTATION_CLASSES;
        setClasses(list);
        const savedClassId = localStorage.getItem('classroom_class_id');
        if (savedClassId && list.some(c => c.id === savedClassId)) {
          setSelectedClassId(savedClassId);
        } else if (list.length > 0) {
          setSelectedClassId(list[0].id);
          localStorage.setItem('classroom_class_id', list[0].id);
        }
      } catch (err) {
        console.error('Erro ao carregar turmas:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadInitial();
  }, [user?.id]);

  // Carrega dados da turma selecionada
  useEffect(() => {
    if (!selectedClassId) return;

    const loadClassData = async () => {
      try {
        setIsLoading(true);
        const scheds = await (window as any).aquila?.invoke?.('get-schedules', selectedClassId);
        if (Array.isArray(scheds)) {
          setSchedules(scheds);
        }

        const res = await (window as any).aquila?.invoke?.('calendar:get-events', { classId: selectedClassId });
        if (res?.success && Array.isArray(res.data)) {
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
      const scheds = await (window as any).aquila?.invoke?.('get-schedules', selectedClassId);
      if (Array.isArray(scheds)) setSchedules(scheds);

      const res = await (window as any).aquila?.invoke?.('calendar:get-events', { classId: selectedClassId });
      if (res?.success && Array.isArray(res.data)) setEvents(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Mapeamento do Dia da Semana atual
  const isWeekend = currentTime.getDay() === 0 || currentTime.getDay() === 6;
  const currentDayOfWeek = currentTime.getDay();

  const filteredTodaySchedules = useMemo(() => {
    const matches = schedules
      .filter(s => s.dayOfWeek === currentDayOfWeek)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
    if (matches.length > 0) return matches;
    if (isWeekend) return [];
    return DEFAULT_FALLBACK_SCHEDULES(selectedClassId || '1-serie-b', currentDayOfWeek);
  }, [schedules, currentDayOfWeek, isWeekend, selectedClassId]);

  const todaySchedules = filteredTodaySchedules;
  const activeClassName = classes.find(c => c.id === selectedClassId)?.name || workstation.className || 'Turma';

  // Sincroniza programação automática de ligar (-10 min) e desligar (+10 min) com o horário da Coordenação
  useEffect(() => {
    if (todaySchedules.length === 0) return;
    const firstLessonStart = todaySchedules[0].startTime;
    const lastLessonEnd = todaySchedules[todaySchedules.length - 1].endTime;

    const syncPower = async () => {
      try {
        const res = await (window as any).aquila?.invoke?.('workstation:schedule-power', {
          classId: selectedClassId,
          className: activeClassName,
          firstLessonStart,
          lastLessonEnd,
          wakeOffsetMinutes: 10,
          shutdownOffsetMinutes: 10,
        });
        if (res?.success) {
          setWorkstation(prev => ({
            ...prev,
            classId: selectedClassId,
            className: activeClassName,
            firstLessonStart: res.firstLessonStart,
            lastLessonEnd: res.lastLessonEnd,
            wakeTime: res.wakeTime,
            shutdownTime: res.shutdownTime,
          }));
        }
      } catch {}
    };
    syncPower();
  }, [selectedClassId, activeClassName, todaySchedules]);

  // Projeção automática no Plano de Fundo do Desktop Windows
  const projectDesktopWallpaper = useCallback(async (manual = false) => {
    try {
      setWallpaperStatus(prev => ({ ...prev, syncing: true }));
      const res = await (window as any).aquila?.invoke?.('workstation:project-wallpaper');
      if (res?.success) {
        const timeStr = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setWallpaperStatus({
          syncing: false,
          lastSyncLabel: `Projetado às ${timeStr}`,
          path: res.wallpaperPath,
          appliedHost: Boolean(res.appliedToHostDesktop),
        });
        if (manual) {
          showNotice('Tela atualizada projetada no Plano de Fundo do Desktop!');
        }
      } else {
        setWallpaperStatus(prev => ({ ...prev, syncing: false }));
      }
    } catch {
      setWallpaperStatus(prev => ({ ...prev, syncing: false }));
    }
  }, [showNotice]);

  useEffect(() => {
    if (!workstation.projectWallpaper) return;
    const initialTimer = setTimeout(() => {
      projectDesktopWallpaper(false);
    }, 900);
    const interval = setInterval(() => {
      projectDesktopWallpaper(false);
    }, 60_000);
    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [workstation.projectWallpaper, selectedClassId, projectDesktopWallpaper]);

  // Verifica automaticamente o horário de desligamento (+10 min após última aula)
  useEffect(() => {
    if (showShutdownModal || isWeekend) return;
    if (Date.now() < shutdownPostponedUntilRef.current) return;
    const nowHHMM = `${String(currentTime.getHours()).padStart(2, '0')}:${String(currentTime.getMinutes()).padStart(2, '0')}`;
    if (workstation.shutdownTime && nowHHMM === workstation.shutdownTime) {
      setShutdownActionFeedback(null);
      setShutdownCountdown(workstation.shutdownConfirmSeconds || 60);
      setShowShutdownModal(true);
    }
  }, [currentTime, workstation.shutdownTime, workstation.shutdownConfirmSeconds, showShutdownModal, isWeekend]);

  // Timer regressivo de 60 segundos do pedido de autorização para desligar
  useEffect(() => {
    if (!showShutdownModal) return;
    const timer = setInterval(() => {
      setShutdownCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          (window as any).aquila?.invoke?.('workstation:execute-shutdown', {
            classId: selectedClassId,
            reason: 'auto_timer_60s',
          }).then((res: any) => {
            setShutdownActionFeedback(
              res?.simulated
                ? 'Timer 60s concluído — comando "shutdown /s /t 0" validado (modo seguro de testes).'
                : 'Desligamento automático do computador autorizado e iniciado.'
            );
          }).catch(() => {});
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [showShutdownModal, selectedClassId]);

  const handleOpenShutdownPrompt = () => {
    setShutdownActionFeedback(null);
    setShutdownCountdown(workstation.shutdownConfirmSeconds || 60);
    setShowShutdownModal(true);
  };

  const handleCancelShutdown = async () => {
    shutdownPostponedUntilRef.current = Date.now() + 60 * 60_000;
    try {
      await (window as any).aquila?.invoke?.('workstation:cancel-shutdown', { postponeMinutes: 60 });
    } catch {}
    setShowShutdownModal(false);
    showNotice('Desligamento adiado em +60 minutos. Computador mantido ligado.');
  };

  const handleConfirmShutdownNow = async () => {
    try {
      const res = await (window as any).aquila?.invoke?.('workstation:execute-shutdown', {
        classId: selectedClassId,
        reason: 'manual_teacher_authorization',
      });
      setShutdownActionFeedback(
        res?.simulated
          ? 'Desligamento autorizado (simulação segura: shutdown /s /t 0 registrado em auditoria).'
          : 'Desligamento iniciado!'
      );
      setTimeout(() => setShowShutdownModal(false), 1800);
    } catch {}
  };

  const openWorkstationConfigModal = () => {
    setDraftUsageType(workstation.usageType || 'classroom');
    setDraftClassId(selectedClassId || classes[0]?.id || '1-serie-b');
    setDraftAutoStart(workstation.autoStartOs);
    setDraftProjectWallpaper(workstation.projectWallpaper);
    setShowWorkstationModal(true);
  };

  const saveWorkstationConfig = async () => {
    const cls = classes.find(c => c.id === draftClassId);
    const payload = {
      usageType: draftUsageType,
      classId: draftUsageType === 'classroom' ? draftClassId : '',
      className: draftUsageType === 'classroom' ? (cls?.name || activeClassName) : '',
      autoStartOs: draftAutoStart,
      projectWallpaper: draftUsageType === 'classroom' ? draftProjectWallpaper : false,
      wakeOffsetMinutes: 10,
      shutdownOffsetMinutes: 10,
      shutdownConfirmSeconds: 60,
    };

    try {
      localStorage.setItem('aquila_terminal_profile', draftUsageType);
      if (draftUsageType === 'classroom' && draftClassId) {
        localStorage.setItem('classroom_class_id', draftClassId);
        setSelectedClassId(draftClassId);
      }
      localStorage.setItem('aquila_workstation_config', JSON.stringify(payload));
      const res = await (window as any).aquila?.invoke?.('workstation:configure', payload);
      if (res?.success && res.config) {
        setWorkstation(prev => ({ ...prev, ...res.config }));
      } else {
        setWorkstation(prev => ({ ...prev, ...payload }));
      }
      setShowWorkstationModal(false);
      showNotice(`Terminal registrado como "${WORKSTATION_USAGE_OPTIONS.find(o => o.id === draftUsageType)?.label || draftUsageType}" com Auto-Start no SO.`);
    } catch {}
  };

  const formatDateLong = (date: Date) => {
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const isScheduleActive = (start: string, end: string) => {
    const currentTimeStr = `${String(currentTime.getHours()).padStart(2, '0')}:${String(currentTime.getMinutes()).padStart(2, '0')}`;
    return currentTimeStr >= start && currentTimeStr <= end;
  };

  const todayStr = getLocalTodayIsoDate(currentTime);
  const filteredTasks = events
    .filter(e => e.type === 'tarefa' && e.date >= todayStr)
    .sort((a, b) => a.date.localeCompare(b.date));

  const classTasks: CalendarEventEntity[] = filteredTasks.length > 0 ? filteredTasks.slice(0, 3) : [
    { id: 'fallback-task-1', title: 'Resolução dos Exercícios de Álgebra pg 42', description: 'Exercícios 1 a 15 do livro didático', date: todayStr, type: 'tarefa', subject: 'Matemática' },
    { id: 'fallback-task-2', title: 'Relatório Prático do Laboratório de Física', description: 'Entrega do relatório impresso ou digital', date: todayStr, type: 'tarefa', subject: 'Física' },
    { id: 'fallback-task-3', title: 'Estudo Dirigido para a Prova Bimestral', description: 'Revisão dos capítulos 4 a 8', date: todayStr, type: 'tarefa', subject: 'Matemática' }
  ];

  const filteredSchoolEvents = events
    .filter(e => e.type !== 'tarefa' && e.date >= todayStr)
    .sort((a, b) => a.date.localeCompare(b.date));

  const schoolEvents: CalendarEventEntity[] = filteredSchoolEvents.length > 0 ? filteredSchoolEvents.slice(0, 3) : [
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

  const usageOption = WORKSTATION_USAGE_OPTIONS.find(o => o.id === workstation.usageType) || WORKSTATION_USAGE_OPTIONS[0];

  return (
    <div className="classroom-tv-layout animate-fade-in">
      {toastMessage && (
        <div className="classroom-toast-banner">
          <CheckCircle2 size={16} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Banner & Control */}
      <header className="classroom-header glass">
        <div className="header-branding">
          <div className="totem-indicator">
            <ScreenShare className="icon-pulse text-emerald-400" size={18} />
            <span>MODO SALA DE AULA</span>
            <span className="ws-os-pill" title="Programa configurado para inicializar automaticamente com o Sistema Operacional">
              <CheckCircle2 size={12} />
              Inicialização c/ SO: {workstation.autoStartOs ? 'ATIVA' : 'MANUAL'}
            </span>
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
            <Calendar size={12} className="text-blue-400" />
            <span>{formatDateLong(currentTime)}</span>
          </div>
        </div>

        <div className="header-right-controls">
          <button
            type="button"
            onClick={openWorkstationConfigModal}
            className="ws-action-chip ws-chip-config"
            title="Configurar tipo de uso deste computador e turma vinculada"
          >
            <Settings2 size={15} />
            <span>Uso: {usageOption.label}</span>
          </button>

          <button
            type="button"
            onClick={() => projectDesktopWallpaper(true)}
            className="ws-action-chip ws-chip-wallpaper"
            title="Projetar esta tela atualizada no plano de fundo da Área de Trabalho do Windows"
          >
            <ImageIcon size={15} />
            <span>{wallpaperStatus.syncing ? 'Projetando...' : `Fundo Desktop: ${wallpaperStatus.lastSyncLabel}`}</span>
          </button>

          <button onClick={forceRefresh} className="btn-refresh-totem" title="Sincronizar Dados">
            <RefreshCw size={16} className={isLoading ? 'spin-anim' : ''} />
          </button>
        </div>
      </header>

      {/* Barra de Automação Energética & Coordenação */}
      <div className="workstation-power-strip glass">
        <div className="power-strip-item">
          <Power size={14} className="text-emerald-400" />
          <span>
            <strong>Ligar PC (-10 min):</strong> {workstation.wakeTime} (1ª aula {workstation.firstLessonStart})
          </span>
        </div>
        <div className="power-strip-divider" />
        <div className="power-strip-item">
          <Clock size={14} className="text-amber-400" />
          <span>
            <strong>Desligar PC (+10 min):</strong> {workstation.shutdownTime} (Última aula {workstation.lastLessonEnd} • Aviso 60s)
          </span>
        </div>
        <div className="power-strip-divider" />
        <div className="power-strip-item">
          <Monitor size={14} className="text-sky-400" />
          <span>
            <strong>Desktop Live Wallpaper:</strong> {workstation.projectWallpaper ? 'Projeção Contínua Ativa' : 'Pausada'}
          </span>
        </div>
        <button
          type="button"
          onClick={handleOpenShutdownPrompt}
          className="btn-test-shutdown-timer"
        >
          <Power size={13} />
          <span>Testar Aviso Desligamento (60s)</span>
        </button>
      </div>

      {/* Grid Principal do Painel */}
      <main className="classroom-main-grid">
        
        {/* Coluna 1: Horário das Aulas de Hoje */}
        <section className="classroom-panel-card glass card-schedules">
          <header className="panel-card-header">
            <Clock className="text-emerald-400" size={19} />
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
                          <BookOpen size={14} className="text-dim" />
                          <h4 className="lesson-subject">{s.subject}</h4>
                          {active && <span className="now-badge">AGORA</span>}
                        </div>
                        <div className="lesson-teacher">
                          <User size={12} className="text-dim" />
                          <span>{s.teacher || 'Professor não definido'}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="empty-classroom-state">
                <Calendar size={32} className="mx-auto mb-1 text-slate-500 opacity-60" />
                <p className="font-bold text-slate-300">Sem aulas agendadas para hoje</p>
                {isWeekend && <p className="text-xs text-slate-500 mt-1 font-semibold">Fim de Semana (Sábado / Domingo)</p>}
              </div>
            )}
          </div>
        </section>

        {/* Coluna 2: Tarefas Agendadas (Deveres de Casa) */}
        <section className="classroom-panel-card glass card-tasks">
          <header className="panel-card-header">
            <Sparkles className="text-amber-400" size={19} />
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
                <AlertCircle size={36} className="text-dim" />
                <p>Nenhuma tarefa agendada para os próximos dias.</p>
              </div>
            )}
          </div>
        </section>

        {/* Coluna 3: Calendário Geral da Escola e Eventos */}
        <section className="classroom-panel-card glass card-events">
          <header className="panel-card-header">
            <Trophy className="text-blue-400" size={19} />
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
                <AlertCircle size={36} className="text-dim" />
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

      {/* MODAL 1: Registro do Tipo de Uso do Computador & Turma */}
      {showWorkstationModal && (
        <div className="ws-modal-overlay" role="dialog" aria-modal="true" aria-label="Registro do Tipo de Uso do Computador">
          <div className="ws-modal-card">
            <header className="ws-modal-header">
              <div className="ws-modal-title-group">
                <Monitor className="text-emerald-400" size={22} />
                <div>
                  <h3>Registro do Tipo de Uso deste Computador</h3>
                  <p>Defina o setor de instalação e automatize inicialização, energia e projeção no Desktop.</p>
                </div>
              </div>
              <button type="button" onClick={() => setShowWorkstationModal(false)} className="ws-modal-close" aria-label="Fechar">
                <X size={18} />
              </button>
            </header>

            <div className="ws-modal-body">
              <div className="ws-modal-usage-grid">
                {WORKSTATION_USAGE_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setDraftUsageType(opt.id)}
                    className={`ws-modal-usage-btn ${draftUsageType === opt.id ? 'active' : ''}`}
                  >
                    <span className="ws-opt-title">{opt.label}</span>
                    <span className="ws-opt-sub">{opt.subtitle}</span>
                  </button>
                ))}
              </div>

              {draftUsageType === 'classroom' && (
                <div className="ws-modal-classroom-settings">
                  <label className="ws-modal-label">
                    Turma Vinculada a esta Sala (1º Ano, 2º Ano, 1ª Série, etc.)
                  </label>
                  <select
                    value={draftClassId}
                    onChange={(e) => setDraftClassId(e.target.value)}
                    className="ws-modal-select"
                    aria-label="Selecionar Turma Vinculada"
                  >
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.grade})</option>
                    ))}
                  </select>

                  <div className="ws-modal-checks">
                    <label className="ws-modal-check">
                      <input type="checkbox" checked={draftAutoStart} onChange={(e) => setDraftAutoStart(e.target.checked)} />
                      <span>Inicializar automaticamente com o Sistema Operacional (Windows Auto-Start)</span>
                    </label>
                    <label className="ws-modal-check">
                      <input type="checkbox" checked={draftProjectWallpaper} onChange={(e) => setDraftProjectWallpaper(e.target.checked)} />
                      <span>Projetar esta tela atualizada no Plano de Fundo do Desktop</span>
                    </label>
                    <div className="ws-modal-power-note">
                      <Power size={14} className="text-amber-400" />
                      <span>
                        Energia sincronizada com a Coordenação: liga automaticamente <strong>10 min antes</strong> ({workstation.wakeTime}) e solicita desligamento <strong>10 min depois</strong> ({workstation.shutdownTime}) com timer de 60s.
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <footer className="ws-modal-footer">
              <button type="button" onClick={() => setShowWorkstationModal(false)} className="ws-btn-secondary">
                Cancelar
              </button>
              <button type="button" onClick={saveWorkstationConfig} className="ws-btn-primary">
                Salvar Registro do Computador
              </button>
            </footer>
          </div>
        </div>
      )}

      {/* MODAL 2: Pedido de Autorização para Desligamento Automático (Timer 60s) */}
      {showShutdownModal && (
        <div className="ws-modal-overlay" role="alertdialog" aria-modal="true" aria-label="Autorização de Desligamento Automático">
          <div className="ws-modal-card ws-shutdown-card">
            <div className="ws-shutdown-badge">
              <AlertTriangle size={28} className="text-amber-400" />
              <span>DESLIGAMENTO PROGRAMADO PELA COORDENAÇÃO (+10 MIN)</span>
            </div>

            <div className="ws-countdown-ring">
              <span className="ws-countdown-number">{shutdownCountdown}s</span>
              <span className="ws-countdown-caption">para desligamento</span>
            </div>

            <div className="ws-countdown-bar-track">
              <div
                className="ws-countdown-bar-fill"
                style={{ width: `${Math.max(0, Math.min(100, (shutdownCountdown / 60) * 100))}%` }}
              />
            </div>

            <p className="ws-shutdown-desc">
              As aulas da turma <strong>{activeClassName}</strong> encerraram às <strong>{workstation.lastLessonEnd}</strong>.
              Deseja autorizar o desligamento automático deste computador agora? Caso não haja resposta, o sistema desligará ao final dos <strong>{shutdownCountdown} segundos</strong>.
            </p>

            {shutdownActionFeedback && (
              <div className="ws-shutdown-feedback">
                <CheckCircle2 size={16} />
                <span>{shutdownActionFeedback}</span>
              </div>
            )}

            <div className="ws-shutdown-actions">
              <button type="button" onClick={handleCancelShutdown} className="ws-btn-keep-on">
                Cancelar / Manter Computador Ligado (+1h)
              </button>
              <button type="button" onClick={handleConfirmShutdownNow} className="ws-btn-shutdown-now">
                <Power size={16} />
                <span>Autorizar e Desligar Agora</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassroomDashboard;
