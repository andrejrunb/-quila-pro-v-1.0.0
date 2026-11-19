import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  Plus,
  Trash2,
  Save,
  MapPin,
  Award,
  Filter,
  CalendarCheck,
  AlertCircle,
  Info,
  Check,
  X,
  Scale,
  ArrowLeft,
} from 'lucide-react';
import { fetchNationalHolidays } from '../../services/BrasilApiService';
import { invokeMvp01 } from '../components/Mvp01SecretariatSuite';
import './AcademicCalendar.css';

interface AcademicCalendarProps {
  onBack: () => void;
}

interface ClassEntity {
  id: string;
  name: string;
  grade: string;
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

interface ManagedHoliday {
  date: string;
  name: string;
  origin: 'BRASIL_API' | 'ESCOLA' | 'ESTADUAL' | 'MUNICIPAL';
  status: 'CANDIDATE' | 'APPROVED' | 'REJECTED';
}

const LDB_STAGE_DEFAULTS = {
  FUNDAMENTAL: {
    label: 'Ensino Fundamental',
    minDays: 200,
    minHours: 800,
    defaultLegalBasis: 'LDB Lei 9.394/1996, Art. 24, I (mín. 200 dias letivos e 800 horas)',
  },
  MEDIO: {
    label: 'Ensino Médio',
    minDays: 200,
    minHours: 1000,
    defaultLegalBasis: 'LDB Lei 9.394/1996 c/c Lei 14.945/2024 (mín. 200 dias letivos e 1.000 horas)',
  },
};

export const AcademicCalendar: React.FC<AcademicCalendarProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<'feriados' | 'unificado'>('feriados');
  const [holidays, setHolidays] = useState<string[]>([]);
  const [managedHolidays, setManagedHolidays] = useState<ManagedHoliday[]>([]);
  const [newHoliday, setNewHoliday] = useState('');
  const [newHolidayName, setNewHolidayName] = useState('');
  const [newHolidayOrigin, setNewHolidayOrigin] = useState<'ESCOLA' | 'ESTADUAL' | 'MUNICIPAL'>('ESCOLA');
  const [isSaving, setIsSaving] = useState(false);
  const [isImportingHolidays, setIsImportingHolidays] = useState(false);
  const [holidayImportMsg, setHolidayImportMsg] = useState<string | null>(null);
  const aquila = (window as any).aquila;

  // Estados MVP 0.1 (Etapa, Carga Horária LDB e Períodos)
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [academicPeriods, setAcademicPeriods] = useState<any[]>([]);
  const [rejectedHolidayDates, setRejectedHolidayDates] = useState<Set<string>>(() => new Set());
  const [selectedStage, setSelectedStage] = useState<'FUNDAMENTAL' | 'MEDIO'>('FUNDAMENTAL');
  const [plannedDays, setPlannedDays] = useState<number>(200);
  const [plannedHours, setPlannedHours] = useState<number>(800);
  const [completedHours, setCompletedHours] = useState<number>(0);
  const [legalBasis, setLegalBasis] = useState<string>(LDB_STAGE_DEFAULTS.FUNDAMENTAL.defaultLegalBasis);
  const [ldbMsg, setLdbMsg] = useState<string | null>(null);

  // Estados do Calendário Unificado
  const [classes, setClasses] = useState<ClassEntity[]>([]);
  const [events, setEvents] = useState<CalendarEventEntity[]>([]);
  const [classFilter, setClassFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  // Estados do Formulário de Evento
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [type, setType] = useState<'anual' | 'bimestral' | 'geral' | 'esportes' | 'eventos' | 'tarefa'>('geral');
  const [classId, setClassId] = useState('all');
  const [subject, setSubject] = useState('');

  useEffect(() => {
    loadSettings();
    loadClasses();
    loadEvents();
    loadMvpAcademicData();
  }, []);

  const loadMvpAcademicData = async () => {
    const ctxRes = await invokeMvp01<any>('getContext');
    const activeRole = String(ctxRes.ok ? ctxRes.data?.activeRole : '').toLowerCase();
    const portalOrder: Array<'secretariat' | 'coordination'> =
      activeRole === 'coordinator' || activeRole === 'coordenacao'
        ? ['coordination', 'secretariat']
        : ['secretariat', 'coordination'];

    for (const portal of portalOrder) {
      const ov = await invokeMvp01<any>('getPortalOverview', { portal });
      if (ov.ok && ov.data) {
        const years = ov.data.academicYears || [];
        setAcademicYears(years);
        setAcademicPeriods(ov.data.academicPeriods || []);
        if (Array.isArray(ov.data.calendarHolidays)) {
          const backendRows: ManagedHoliday[] = ov.data.calendarHolidays
            .filter((h: any) => h && h.date)
            .map((h: any) => ({
              date: String(h.date),
              name: String(h.name || 'Feriado'),
              origin: (['BRASIL_API', 'ESCOLA', 'ESTADUAL', 'MUNICIPAL'].includes(h.origin)
                ? h.origin
                : 'ESCOLA') as ManagedHoliday['origin'],
              status: (['CANDIDATE', 'APPROVED', 'REJECTED'].includes(h.status)
                ? h.status
                : 'CANDIDATE') as ManagedHoliday['status'],
            }));
          const rejectedSet = new Set(
            backendRows.filter(h => h.status === 'REJECTED').map(h => h.date)
          );
          setRejectedHolidayDates(rejectedSet);
          const visibleRows = backendRows
            .filter(h => h.status !== 'REJECTED')
            .sort((a, b) => a.date.localeCompare(b.date));
          setManagedHolidays(visibleRows);
          syncApprovedDates(visibleRows);
        }
        const matched = years.find((y: any) => y.stage === selectedStage) || years[0];
        if (matched) {
          const st: 'FUNDAMENTAL' | 'MEDIO' = matched.stage === 'MEDIO' ? 'MEDIO' : 'FUNDAMENTAL';
          setSelectedStage(st);
          setPlannedDays(Number(matched.planned_days ?? LDB_STAGE_DEFAULTS[st].minDays));
          setPlannedHours(Number(matched.planned_hours ?? LDB_STAGE_DEFAULTS[st].minHours));
          setCompletedHours(Number(matched.completed_hours ?? 0));
          setLegalBasis(matched.legal_basis || LDB_STAGE_DEFAULTS[st].defaultLegalBasis);
        }
        break;
      }
    }
  };

  const activeAcademicYear = useMemo(() => {
    return (
      academicYears.find(y => y.stage === selectedStage) ||
      academicYears[0] || {
        id: selectedStage === 'MEDIO' ? 'ay-2026-med' : 'ay-2026-fund',
        stage: selectedStage,
      }
    );
  }, [academicYears, selectedStage]);

  const handleStageSelect = (stage: 'FUNDAMENTAL' | 'MEDIO') => {
    setSelectedStage(stage);
    setLdbMsg(null);
    const matched = academicYears.find(y => y.stage === stage);
    if (matched) {
      setPlannedDays(Number(matched.planned_days ?? LDB_STAGE_DEFAULTS[stage].minDays));
      setPlannedHours(Number(matched.planned_hours ?? LDB_STAGE_DEFAULTS[stage].minHours));
      setCompletedHours(Number(matched.completed_hours ?? 0));
      setLegalBasis(matched.legal_basis || LDB_STAGE_DEFAULTS[stage].defaultLegalBasis);
    } else {
      setPlannedDays(LDB_STAGE_DEFAULTS[stage].minDays);
      setPlannedHours(LDB_STAGE_DEFAULTS[stage].minHours);
      setCompletedHours(0);
      setLegalBasis(LDB_STAGE_DEFAULTS[stage].defaultLegalBasis);
    }
  };

  const handleSaveAcademicYearHours = async () => {
    if (!activeAcademicYear?.id) return;
    setIsSaving(true);
    setLdbMsg(null);
    const res = await invokeMvp01('updateAcademicYearHours', {
      academicYearId: activeAcademicYear.id,
      plannedDays: Number(plannedDays),
      plannedHours: Number(plannedHours),
      completedHours: Number(completedHours),
      legalBasis: legalBasis.trim() || LDB_STAGE_DEFAULTS[selectedStage].defaultLegalBasis,
    });
    setIsSaving(false);
    if (!res.ok) {
      setLdbMsg(`Erro ao atualizar ano letivo: ${res.error}`);
      return;
    }
    setAcademicYears(prev =>
      prev.map(y => (y.id === activeAcademicYear.id ? { ...y, ...res.data } : y))
    );
    setLdbMsg(`Carga horária e fundamento legal da etapa ${LDB_STAGE_DEFAULTS[selectedStage].label} salvos com sucesso.`);
  };

  const loadSettings = async () => {
    try {
      const settings = await aquila?.invoke?.('get-school-settings');
      if (settings && settings.holidays) {
        const parsed = JSON.parse(settings.holidays);
        if (Array.isArray(parsed)) {
          setHolidays(parsed);
          setManagedHolidays(prev => {
            if (prev.length > 0) return prev;
            return parsed.map((d: string) => ({
              date: d,
              name: 'Feriado / Recesso Confirmado',
              origin: 'ESCOLA',
              status: 'APPROVED',
            }));
          });
        }
      }
    } catch (err) {
      console.error('Erro ao carregar configurações de feriados:', err);
    }
  };

  const loadClasses = async () => {
    try {
      const data = await aquila?.invoke?.('get-classes');
      if (Array.isArray(data)) {
        setClasses(data);
      }
    } catch (err) {
      console.error('Erro ao carregar turmas:', err);
    }
  };

  const loadEvents = async () => {
    try {
      const res = await aquila?.invoke?.('calendar:get-events');
      if (res?.success && Array.isArray(res.data)) {
        setEvents(res.data);
      }
    } catch (err) {
      console.error('Erro ao carregar eventos:', err);
    }
  };

  const syncApprovedDates = (list: ManagedHoliday[]) => {
    setHolidays(
      Array.from(new Set(list.filter(h => h.status === 'APPROVED').map(h => h.date))).sort()
    );
  };

  const handleAddHoliday = async () => {
    if (!newHoliday) return;
    const label = newHolidayName.trim() || `Feriado ${newHolidayOrigin}`;
    const entry: ManagedHoliday = {
      date: newHoliday,
      name: label,
      origin: newHolidayOrigin,
      status: 'APPROVED',
    };
    if (activeAcademicYear?.id) {
      await invokeMvp01('upsertCalendarHoliday', {
        academicYearId: activeAcademicYear.id,
        date: entry.date,
        name: entry.name,
        origin: entry.origin,
        status: 'APPROVED',
      });
    }
    setManagedHolidays(prev => {
      const next = [...prev.filter(h => h.date !== entry.date), entry].sort((a, b) =>
        a.date.localeCompare(b.date)
      );
      syncApprovedDates(next);
      return next;
    });
    setNewHoliday('');
    setNewHolidayName('');
  };

  const handleRemoveHoliday = async (targetDate: string) => {
    const existing = managedHolidays.find(h => h.date === targetDate);
    if (
      (window as any).aquila?.mvp01?.upsertCalendarHoliday &&
      activeAcademicYear?.id
    ) {
      const res = await invokeMvp01('upsertCalendarHoliday', {
        academicYearId: activeAcademicYear.id,
        date: targetDate,
        name: existing?.name || 'Feriado Removido',
        origin: existing?.origin || 'ESCOLA',
        status: 'REJECTED',
      });
      if (!res.ok) {
        setHolidayImportMsg(`Erro ao persistir remoção do feriado: ${res.error}`);
        return;
      }
      setRejectedHolidayDates(prev => new Set(prev).add(targetDate));
    }
    setManagedHolidays(prev => {
      const next = prev.filter(h => h.date !== targetDate);
      syncApprovedDates(next);
      return next;
    });
  };

  const handleImportNationalHolidays = async () => {
    try {
      setIsImportingHolidays(true);
      setHolidayImportMsg(null);
      const year = new Date().getFullYear();
      const { holidays: fetched, source } = await fetchNationalHolidays(year);
      const addedCandidates: ManagedHoliday[] = [];

      for (const item of fetched) {
        const already = managedHolidays.find(m => m.date === item.date);
        if (!already && !rejectedHolidayDates.has(item.date)) {
          const cand: ManagedHoliday = {
            date: item.date,
            name: item.name || 'Feriado Nacional',
            origin: 'BRASIL_API',
            status: 'CANDIDATE',
          };
          addedCandidates.push(cand);
          if (activeAcademicYear?.id) {
            await invokeMvp01('upsertCalendarHoliday', {
              academicYearId: activeAcademicYear.id,
              date: cand.date,
              name: cand.name,
              origin: 'BRASIL_API',
              status: 'CANDIDATE',
            });
          }
        }
      }

      setManagedHolidays(prev =>
        [...prev, ...addedCandidates].sort((a, b) => a.date.localeCompare(b.date))
      );

      setHolidayImportMsg(
        addedCandidates.length > 0
          ? `${addedCandidates.length} feriado(s) de ${year} importados via ${source} como CANDIDATOS À REVISÃO. Aprove ou rejeite cada item abaixo.`
          : `Todos os feriados nacionais de ${year} já constam na lista (${source}).`
      );
    } catch {
      setHolidayImportMsg('Não foi possível importar feriados agora.');
    } finally {
      setIsImportingHolidays(false);
    }
  };

  const handleReviewCandidateHoliday = async (
    item: ManagedHoliday,
    nextStatus: 'APPROVED' | 'REJECTED'
  ) => {
    if (activeAcademicYear?.id) {
      await invokeMvp01('upsertCalendarHoliday', {
        academicYearId: activeAcademicYear.id,
        date: item.date,
        name: item.name,
        origin: item.origin,
        status: nextStatus,
      });
    }
    setManagedHolidays(prev => {
      const next = prev.map(h => (h.date === item.date ? { ...h, status: nextStatus } : h));
      syncApprovedDates(next);
      return next;
    });
  };

  const handleSaveHolidays = async () => {
    try {
      setIsSaving(true);
      await aquila?.invoke?.('save-settings', { holidays: JSON.stringify(holidays) });
      setHolidayImportMsg('Feriados aprovados salvos no calendário institucional.');
    } catch (err) {
      console.error('Erro ao salvar calendário:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !date || !type) {
      alert('Título, Data e Categoria são obrigatórios.');
      return;
    }

    try {
      setIsSaving(true);
      const newEvent = {
        title,
        description,
        date,
        type,
        classId: classId === 'all' ? null : classId,
        subject: type === 'tarefa' ? subject : null,
      };

      const res = await aquila?.invoke?.('calendar:save-event', newEvent);
      if (res?.success) {
        alert('Evento cadastrado e unificado com sucesso!');
        setTitle('');
        setDescription('');
        setDate('');
        setType('geral');
        setClassId('all');
        setSubject('');
        loadEvents();
      } else {
        alert('Erro ao salvar evento: ' + (res?.message || 'Falha'));
      }
    } catch (err: any) {
      alert('Falha ao salvar evento: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (!confirm('Deseja realmente excluir este evento do calendário unificado?')) return;
    try {
      const res = await aquila?.invoke?.('calendar:delete-event', { id });
      if (res?.success) {
        loadEvents();
      } else {
        alert('Erro ao excluir: ' + res?.message);
      }
    } catch (err: any) {
      alert('Falha ao deletar: ' + err.message);
    }
  };

  const filteredEvents = events.filter(evt => {
    const matchClass = classFilter === 'all' || evt.classId === classFilter;
    const matchType = typeFilter === 'all' || evt.type === typeFilter;
    return matchClass && matchType;
  });

  const getEventBadgeClass = (evtType: string) => {
    switch (evtType) {
      case 'anual': return 'badge-anual';
      case 'bimestral': return 'badge-bimestral';
      case 'esportes': return 'badge-esportes';
      case 'eventos': return 'badge-eventos';
      case 'geral': return 'badge-geral';
      case 'tarefa': return 'badge-tarefa';
      default: return 'badge-default';
    }
  };

  const getEventTypeName = (evtType: string) => {
    switch (evtType) {
      case 'anual': return 'Anual';
      case 'bimestral': return 'Bimestral';
      case 'esportes': return 'Esportes';
      case 'eventos': return 'Evento';
      case 'geral': return 'Geral';
      case 'tarefa': return 'Tarefa';
      default: return 'Geral';
    }
  };

  const stageSpec = LDB_STAGE_DEFAULTS[selectedStage];
  const meetsDays = plannedDays >= stageSpec.minDays;
  const meetsHours = plannedHours >= stageSpec.minHours;
  const pendingCandidatesCount = managedHolidays.filter(h => h.status === 'CANDIDATE').length;

  return (
    <div className="academic-calendar-page animate-fade-in">
      <header className="calendar-header">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
          <h1 className="calendar-title">
            <CalendarIcon className="text-orange-500" size={34} />
            Calendário Anual &amp; Conformidade LDB
          </h1>
          <button
            type="button"
            onClick={onBack}
            className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-semibold text-white flex items-center gap-1.5"
          >
            <ArrowLeft size={14} /> Voltar
          </button>
        </div>
        <p className="calendar-subtitle">
          Administre dias letivos e carga horária mínima por etapa (Fundamental: 200d / 800h; Médio: 200d / 1.000h — LDB Lei 9.394/1996 e Lei 14.945/2024), revisão de feriados candidatos e eventos unificados.
        </p>
      </header>

      {/* Tabs Menu */}
      <div className="calendar-tabs-wrapper glass">
        <button
          className={`tab-btn ${activeTab === 'feriados' ? 'active' : ''}`}
          onClick={() => setActiveTab('feriados')}
        >
          <Scale size={18} />
          <span>Carga Horária LDB &amp; Feriados Candidatos ({pendingCandidatesCount} p/ revisar)</span>
        </button>
        <button
          className={`tab-btn ${activeTab === 'unificado' ? 'active' : ''}`}
          onClick={() => setActiveTab('unificado')}
        >
          <CalendarCheck size={18} />
          <span>Calendário Unificado &amp; Eventos</span>
        </button>
      </div>

      {activeTab === 'unificado' ? (
        <div className="unificado-tab-container">
          <div className="calendar-split-grid">
            <section className="calendar-section form-section glass">
              <h2 className="section-title">
                <Plus className="text-orange-400" /> Cadastrar Evento / Atividade
              </h2>
              <form onSubmit={handleCreateEvent} className="event-creation-form mt-4">
                <div className="form-group">
                  <label>Título do Evento / Dever</label>
                  <input
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="Ex: Conselho de Classe ou Reunião de Famílias"
                    required
                  />
                </div>

                <div className="form-group mt-3">
                  <label>Descrição detalhada</label>
                  <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Informações adicionais para alunos, pais e professores..."
                    rows={3}
                  />
                </div>

                <div className="form-row mt-3">
                  <div className="form-group flex-1">
                    <label>Data</label>
                    <input
                      type="date"
                      value={date}
                      onChange={e => setDate(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group flex-1">
                    <label>Categoria</label>
                    <select value={type} onChange={e => setType(e.target.value as any)}>
                      <option value="geral">Geral (Escola)</option>
                      <option value="anual">Anual (Calendário)</option>
                      <option value="bimestral">Bimestral (Provas/Recessos)</option>
                      <option value="esportes">Esportes / Jogos</option>
                      <option value="eventos">Eventos / Feiras</option>
                      <option value="tarefa">Tarefa Escolar (Turma)</option>
                    </select>
                  </div>
                </div>

                <div className="form-row mt-3">
                  <div className="form-group flex-1">
                    <label>Turma Destinatária</label>
                    <select value={classId} onChange={e => setClassId(e.target.value)}>
                      <option value="all">Todas as Turmas (Global)</option>
                      {classes.map(c => (
                        <option key={c.id} value={c.id}>{c.name} ({c.grade})</option>
                      ))}
                    </select>
                  </div>

                  {type === 'tarefa' && (
                    <div className="form-group flex-1 animate-slide-down">
                      <label>Disciplina / Matéria</label>
                      <input
                        type="text"
                        value={subject}
                        onChange={e => setSubject(e.target.value)}
                        placeholder="Ex: História, Física..."
                        required
                      />
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="btn-submit-event mt-4"
                >
                  {isSaving ? 'Salvando...' : 'Cadastrar e Unificar Evento'}
                </button>
              </form>
            </section>

            <section className="calendar-section list-section glass">
              <div className="list-header-flex">
                <h2 className="section-title">Eventos Agendados</h2>
                <div className="filters-bar-grid">
                  <div className="filter-item">
                    <Filter size={14} className="text-dim" />
                    <select value={classFilter} onChange={e => setClassFilter(e.target.value)} title="Filtrar por Turma">
                      <option value="all">Filtro: Turma (Todas)</option>
                      <option value="global-only">Apenas Globais</option>
                      {classes.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="filter-item">
                    <Filter size={14} className="text-dim" />
                    <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} title="Filtrar por Tipo">
                      <option value="all">Filtro: Tipo (Todos)</option>
                      <option value="geral">Geral</option>
                      <option value="anual">Anual</option>
                      <option value="bimestral">Bimestral</option>
                      <option value="esportes">Esportes</option>
                      <option value="eventos">Eventos</option>
                      <option value="tarefa">Tarefa</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="events-scroll-list custom-scrollbar mt-4">
                {filteredEvents.map(evt => {
                  const targetClassName = classes.find(c => c.id === evt.classId)?.name || 'Geral';
                  return (
                    <div key={evt.id} className="event-list-item">
                      <div className="event-left-info">
                        <div className="event-top-row">
                          <span className={`event-badge ${getEventBadgeClass(evt.type)}`}>
                            {getEventTypeName(evt.type)}
                          </span>
                          <span className="event-target-class">
                            Turma: {targetClassName}
                          </span>
                          {evt.subject && (
                            <span className="event-subject-tag">{evt.subject}</span>
                          )}
                        </div>
                        <h3 className="event-list-title">{evt.title}</h3>
                        <p className="event-list-desc">{evt.description}</p>
                        <span className="event-list-date">
                          Data: {new Date(evt.date + 'T00:00:00').toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      <button
                        onClick={() => handleDeleteEvent(evt.id)}
                        className="btn-delete-event"
                        title="Excluir Evento"
                        aria-label="Excluir Evento"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  );
                })}
                {filteredEvents.length === 0 && (
                  <div className="empty-events">
                    <Info size={32} className="text-dim" />
                    <p>Nenhum evento agendado para o filtro selecionado.</p>
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* Painel LDB por Etapa */}
          <section className="calendar-section glass">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="section-title" style={{ marginBottom: 4 }}>
                  <Scale className="text-emerald-400" /> Parâmetros LDB por Etapa &amp; Carga Horária Anual
                </h2>
                <p className="text-xs text-slate-400">
                  Ensino Fundamental: mín. 200 dias e 800 horas • Ensino Médio: mín. 200 dias e 1.000 horas (LDB Lei 9.394/1996 e Lei 14.945/2024).
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleStageSelect('FUNDAMENTAL')}
                  className={`px-3 py-2 rounded-xl text-xs font-bold border ${
                    selectedStage === 'FUNDAMENTAL'
                      ? 'bg-emerald-500/20 border-emerald-500 text-white'
                      : 'bg-white/5 border-white/10 text-slate-300'
                  }`}
                >
                  Ensino Fundamental (200d / 800h)
                </button>
                <button
                  type="button"
                  onClick={() => handleStageSelect('MEDIO')}
                  className={`px-3 py-2 rounded-xl text-xs font-bold border ${
                    selectedStage === 'MEDIO'
                      ? 'bg-emerald-500/20 border-emerald-500 text-white'
                      : 'bg-white/5 border-white/10 text-slate-300'
                  }`}
                >
                  Ensino Médio (200d / 1.000h)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Dias Letivos Previstos (Mín. {stageSpec.minDays})</label>
                <input
                  type="number"
                  min={0}
                  value={plannedDays}
                  onChange={e => setPlannedDays(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-white/15 rounded-xl px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Carga Horária Prevista (Mín. {stageSpec.minHours}h)</label>
                <input
                  type="number"
                  min={0}
                  value={plannedHours}
                  onChange={e => setPlannedHours(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-white/15 rounded-xl px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Carga Horária Realizada (h)</label>
                <input
                  type="number"
                  min={0}
                  step="0.5"
                  value={completedHours}
                  onChange={e => setCompletedHours(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-white/15 rounded-xl px-3 py-2 text-white"
                />
              </div>
              <div className="flex flex-col justify-end">
                <div
                  className={`p-2.5 rounded-xl border text-center font-bold ${
                    meetsDays && meetsHours
                      ? 'bg-emerald-500/15 border-emerald-500/35 text-emerald-300'
                      : 'bg-red-500/15 border-red-500/35 text-red-300'
                  }`}
                >
                  {meetsDays && meetsHours
                    ? `Conforme LDB (${stageSpec.label})`
                    : `Abaixo do mínimo LDB (${stageSpec.minDays}d / ${stageSpec.minHours}h)`}
                </div>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-3 items-end text-xs">
              <div className="flex-1 min-w-[260px]">
                <label className="text-slate-400 block mb-1">Fundamento Legal Aplicável</label>
                <input
                  type="text"
                  value={legalBasis}
                  onChange={e => setLegalBasis(e.target.value)}
                  className="w-full bg-slate-950 border border-white/15 rounded-xl px-3 py-2 text-white"
                />
              </div>
              <button
                type="button"
                onClick={handleSaveAcademicYearHours}
                disabled={isSaving}
                className="btn-add-holiday"
                style={{ height: 38, background: '#10b981' }}
              >
                Salvar Carga Horária LDB
              </button>
            </div>
            {ldbMsg && <p className="text-xs text-emerald-400 mt-2">{ldbMsg}</p>}
          </section>

          <div className="calendar-grid">
            {/* Feriados Candidatos e Locais */}
            <section className="calendar-section glass">
              <h2 className="section-title">
                <Plus className="text-orange-400" /> Feriados Candidatos (BrasilAPI) &amp; Locais
              </h2>
              <p className="text-xs text-slate-400 mb-3">
                Feriados importados via BrasilAPI entram como <strong>Candidatos à Revisão</strong> para aprovação ou rejeição explícita pela equipe escolar.
              </p>
              <div className="flex flex-col gap-2">
                <div className="add-holiday-form" style={{ marginBottom: 0 }}>
                  <input
                    type="date"
                    value={newHoliday}
                    onChange={e => setNewHoliday(e.target.value)}
                    title="Data do Feriado"
                    aria-label="Data do Feriado"
                    className="date-input"
                  />
                  <input
                    type="text"
                    value={newHolidayName}
                    onChange={e => setNewHolidayName(e.target.value)}
                    placeholder="Nome do feriado / recesso"
                    className="date-input"
                  />
                  <select
                    value={newHolidayOrigin}
                    onChange={e => setNewHolidayOrigin(e.target.value as any)}
                    className="date-input"
                  >
                    <option value="ESCOLA">Escolar</option>
                    <option value="ESTADUAL">Estadual</option>
                    <option value="MUNICIPAL">Municipal</option>
                  </select>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleAddHoliday}
                    className="btn-add-holiday"
                    style={{ height: 38 }}
                    aria-label="Adicionar Feriado"
                  >
                    Adicionar Feriado
                  </button>
                  <button
                    type="button"
                    onClick={handleImportNationalHolidays}
                    disabled={isImportingHolidays}
                    className="btn-add-holiday"
                    style={{ height: 38, background: 'rgba(16, 185, 129, 0.2)', border: '1px solid rgba(16, 185, 129, 0.45)' }}
                    title="Importa feriados nacionais via BrasilAPI como candidatos à revisão"
                  >
                    {isImportingHolidays ? 'Importando...' : 'Importar Feriados BR (Candidatos)'}
                  </button>
                </div>
              </div>
              {holidayImportMsg && (
                <p className="text-xs text-emerald-400 mt-2">{holidayImportMsg}</p>
              )}

              <div className="holidays-list custom-scrollbar mt-4">
                {managedHolidays.map((h, i) => (
                  <div key={`${h.date}-${i}`} className="holiday-item">
                    <div className="flex flex-col gap-0.5">
                      <span className="holiday-date">
                        {new Date(h.date + 'T00:00:00').toLocaleDateString('pt-BR')} — {h.name}
                      </span>
                      <div className="flex items-center gap-2 text-[10px]">
                        <span className="px-1.5 py-0.5 rounded bg-white/10 text-slate-300">
                          Origem: {h.origin}
                        </span>
                        <span
                          className={`px-1.5 py-0.5 rounded font-bold ${
                            h.status === 'APPROVED'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : h.status === 'REJECTED'
                              ? 'bg-red-500/20 text-red-300'
                              : 'bg-amber-500/20 text-amber-300'
                          }`}
                        >
                          {h.status === 'CANDIDATE'
                            ? 'CANDIDATO À REVISÃO'
                            : h.status === 'APPROVED'
                            ? 'APROVADO'
                            : 'REJEITADO'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {h.status !== 'APPROVED' && (
                        <button
                          type="button"
                          onClick={() => handleReviewCandidateHoliday(h, 'APPROVED')}
                          className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-300 text-xs font-bold hover:bg-emerald-500/30"
                          title="Aprovar feriado"
                        >
                          <Check size={14} />
                        </button>
                      )}
                      {h.status !== 'REJECTED' && (
                        <button
                          type="button"
                          onClick={() => handleReviewCandidateHoliday(h, 'REJECTED')}
                          className="px-2 py-1 rounded bg-amber-500/20 text-amber-300 text-xs font-bold hover:bg-amber-500/30"
                          title="Rejeitar feriado"
                        >
                          <X size={14} />
                        </button>
                      )}
                      <button
                        onClick={() => handleRemoveHoliday(h.date)}
                        title="Remover Feriado"
                        aria-label="Remover Feriado"
                        className="btn-remove-holiday"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
                {managedHolidays.length === 0 && (
                  <p className="empty-msg">Nenhum feriado cadastrado ou candidato.</p>
                )}
              </div>
            </section>

            {/* Períodos Letivos */}
            <section className="calendar-section periods-section glass">
              <h2 className="section-title">
                <MapPin className="text-blue-400" /> Períodos (Bimestres)
              </h2>
              <p className="section-hint">Mapeamento para consolidação de notas e presença.</p>

              <div className="periods-list mt-4">
                {academicPeriods.length > 0 ? (
                  academicPeriods.map(p => (
                    <div key={p.id} className="period-item">
                      <div>
                        <p className="period-name">{p.name}</p>
                        <p className="period-range">{p.start_date || '—'} — {p.end_date || '—'}</p>
                      </div>
                      <div className={p.status === 'OPEN' ? 'current-badge' : 'waiting-badge'}>
                        {p.status === 'OPEN' ? 'ABERTO' : 'FECHADO'}
                      </div>
                    </div>
                  ))
                ) : (
                  <>
                    <div className="period-item">
                      <div>
                        <p className="period-name">1º Bimestre</p>
                        <p className="period-range">01 Fev — 30 Abr</p>
                      </div>
                      <div className="current-badge">ATUAL</div>
                    </div>
                    <div className="period-item">
                      <div>
                        <p className="period-name">2º Bimestre</p>
                        <p className="period-range">10 Mai — 15 Jul</p>
                      </div>
                      <div className="waiting-badge">AGUARDANDO</div>
                    </div>
                  </>
                )}
              </div>

              <div className="bncc-milestones-box mt-4">
                <h3 className="bncc-title">
                  <Award size={14} className="text-purple-400" />
                  Marcos LDB &amp; BNCC
                </h3>
                <div className="milestones-flex mt-2">
                  <div className="milestone-pill">Fundamental: 200d / 800h</div>
                  <div className="milestone-pill">Médio: 200d / 1.000h</div>
                </div>
                <p className="bncc-info mt-2">
                  Feriados aprovados são descontados automaticamente da contagem de dias letivos disponíveis.
                </p>
              </div>
            </section>
          </div>
        </div>
      )}

      {activeTab === 'feriados' && (
        <button
          onClick={handleSaveHolidays}
          disabled={isSaving}
          className="btn-save-calendar mt-4"
          aria-label="Salvar Feriados"
        >
          {isSaving ? 'Salvando...' : <><Save size={20} /> Salvar Feriados Aprovados</>}
        </button>
      )}
    </div>
  );
};

export default AcademicCalendar;
