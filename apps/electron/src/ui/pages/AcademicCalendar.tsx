import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, Plus, Trash2, Save, MapPin, Award, 
  Filter, CalendarCheck, BookOpen, AlertCircle, Info 
} from 'lucide-react';
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

export const AcademicCalendar: React.FC<AcademicCalendarProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<'feriados' | 'unificado'>('unificado');
  const [holidays, setHolidays] = useState<string[]>([]);
  const [newHoliday, setNewHoliday] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const aquila = (window as any).aquila;

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
  const [classId, setClassId] = useState('all'); // 'all' significa global (null no banco)
  const [subject, setSubject] = useState('');

  useEffect(() => {
    loadSettings();
    loadClasses();
    loadEvents();
  }, []);

  const loadSettings = async () => {
    try {
      const settings = await aquila.invoke('get-school-settings');
      if (settings && settings.holidays) {
        setHolidays(JSON.parse(settings.holidays));
      }
    } catch (err) {
      console.error('Erro ao carregar configurações de feriados:', err);
    }
  };

  const loadClasses = async () => {
    try {
      const data = await aquila.invoke('get-classes');
      if (Array.isArray(data)) {
        setClasses(data);
      }
    } catch (err) {
      console.error('Erro ao carregar turmas:', err);
    }
  };

  const loadEvents = async () => {
    try {
      const res = await aquila.invoke('calendar:get-events');
      if (res.success && Array.isArray(res.data)) {
        setEvents(res.data);
      }
    } catch (err) {
      console.error('Erro ao carregar eventos:', err);
    }
  };

  const handleAddHoliday = () => {
    if (newHoliday && !holidays.includes(newHoliday)) {
      setHolidays([...holidays, newHoliday]);
      setNewHoliday('');
    }
  };

  const handleRemoveHoliday = (date: string) => {
    setHolidays(holidays.filter(h => h !== date));
  };

  const handleSaveHolidays = async () => {
    try {
      setIsSaving(true);
      await aquila.invoke('save-settings', { holidays: JSON.stringify(holidays) });
      alert('Calendário Acadêmico Atualizado com sucesso!');
    } catch (err) {
      console.error('Erro ao salvar calendário:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Criação de Evento Unificado
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
        subject: type === 'tarefa' ? subject : null
      };

      const res = await aquila.invoke('calendar:save-event', newEvent);
      if (res.success) {
        alert('Evento cadastrado e unificado com sucesso!');
        setTitle('');
        setDescription('');
        setDate('');
        setType('geral');
        setClassId('all');
        setSubject('');
        loadEvents();
      } else {
        alert('Erro ao salvar evento: ' + res.message);
      }
    } catch (err: any) {
      alert('Falha ao salvar evento: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Exclusão de Evento Unificado
  const handleDeleteEvent = async (id: string) => {
    if (!confirm('Deseja realmente excluir este evento do calendário unificado?')) return;
    try {
      const res = await aquila.invoke('calendar:delete-event', { id });
      if (res.success) {
        loadEvents();
      } else {
        alert('Erro ao excluir: ' + res.message);
      }
    } catch (err: any) {
      alert('Falha ao deletar: ' + err.message);
    }
  };

  // Filtragem dos eventos
  const filteredEvents = events.filter(evt => {
    const matchClass = classFilter === 'all' || evt.classId === classFilter;
    const matchType = typeFilter === 'all' || evt.type === typeFilter;
    return matchClass && matchType;
  });

  const getEventBadgeClass = (type: string) => {
    switch (type) {
      case 'anual': return 'badge-anual';
      case 'bimestral': return 'badge-bimestral';
      case 'esportes': return 'badge-esportes';
      case 'eventos': return 'badge-eventos';
      case 'geral': return 'badge-geral';
      case 'tarefa': return 'badge-tarefa';
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
      case 'tarefa': return 'Tarefa';
      default: return 'Geral';
    }
  };

  return (
    <div className="academic-calendar-page animate-fade-in">
      <header className="calendar-header">
        <h1 className="calendar-title">
          <CalendarIcon className="text-orange-500" size={40} />
          Portal de Calendários Unificados
        </h1>
        <p className="calendar-subtitle">Administre o calendário escolar anual, bimestral, esportivo, de eventos e tarefas por turma.</p>
      </header>

      {/* Tabs Menu */}
      <div className="calendar-tabs-wrapper glass">
        <button 
          className={`tab-btn ${activeTab === 'unificado' ? 'active' : ''}`}
          onClick={() => setActiveTab('unificado')}
        >
          <CalendarCheck size={18} />
          <span>Calendário Unificado & Tarefas</span>
        </button>
        <button 
          className={`tab-btn ${activeTab === 'feriados' ? 'active' : ''}`}
          onClick={() => setActiveTab('feriados')}
        >
          <MapPin size={18} />
          <span>Feriados & Períodos Bimestrais</span>
        </button>
      </div>

      {activeTab === 'unificado' ? (
        /* ABA DO CALENDÁRIO UNIFICADO */
        <div className="unificado-tab-container">
          <div className="calendar-split-grid">
            
            {/* Form de Cadastro */}
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
                    placeholder="Ex: Campeonato Interclasses ou Dever de História"
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

            {/* Listagem com Filtros */}
            <section className="calendar-section list-section glass">
              <div className="list-header-flex">
                <h2 className="section-title">📅 Eventos Agendados</h2>
                
                {/* Filtros */}
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
                            <span className="event-subject-tag">
                              {evt.subject}
                            </span>
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
        /* ABA ANTIGA DE FERIADOS E BIMESTRES */
        <div className="calendar-grid">
          {/* Holiday Management */}
          <section className="calendar-section glass">
            <h2 className="section-title">
               <Plus className="text-orange-400" /> Adicionar Feriado / Recesso
            </h2>
            <div className="add-holiday-form">
              <input 
                type="date" 
                value={newHoliday}
                onChange={(e) => setNewHoliday(e.target.value)}
                title="Data do Feriado"
                aria-label="Data do Feriado"
                placeholder="Selecione a data"
                className="date-input"
              />
              <button 
                  onClick={handleAddHoliday}
                  className="btn-add-holiday"
                  aria-label="Adicionar Feriado"
              >
                  Adicionar
              </button>
            </div>

            <div className="holidays-list custom-scrollbar mt-4">
              {holidays.map((date, i) => (
                <div key={date + i} className="holiday-item">
                  <span className="holiday-date">{new Date(date).toLocaleDateString('pt-BR')}</span>
                  <button 
                      onClick={() => handleRemoveHoliday(date)}
                      title="Remover Feriado"
                      aria-label="Remover Feriado"
                      className="btn-remove-holiday"
                  >
                      <Trash2 size={16} />
                  </button>
                </div>
              ))}
              {holidays.length === 0 && <p className="empty-msg">Nenhum feriado cadastrado.</p>}
            </div>
          </section>

          {/* Academic Periods */}
          <section className="calendar-section periods-section glass">
             <h2 className="section-title">
               <MapPin className="text-blue-400" /> Períodos (Bimestres)
             </h2>
             <p className="section-hint">Mapeamento para consolidação de notas e presença.</p>
             
             <div className="periods-list mt-4">
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
             </div>

             <div className="bncc-milestones-box mt-4">
                 <h3 className="bncc-title">
                    <Award size={14} className="text-purple-400" />
                    Marcos BNCC (Pacto Nacional)
                 </h3>
                 <div className="milestones-flex mt-2">
                    <div className="milestone-pill">C1: Cultura Digital</div>
                    <div className="milestone-pill">C4: Comunicação</div>
                    <div className="milestone-pill">C7: Argumentação</div>
                 </div>
                 <p className="bncc-info mt-2">Prazos de preenchimento de evidências pedagógicas conforme LDB.</p>
             </div>
          </section>
        </div>
      )}

      {activeTab === 'feriados' && (
        <button
          onClick={handleSaveHolidays}
          disabled={isSaving}
          className="btn-save-calendar mt-4"
          aria-label="Salvar Feriados"
        >
          {isSaving ? 'Salvando...' : <><Save size={20} /> Salvar Configurações de Recessos</>}
        </button>
      )}
    </div>
  );
};

export default AcademicCalendar;
