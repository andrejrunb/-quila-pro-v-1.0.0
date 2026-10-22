import React, { useState, useEffect, useMemo } from 'react';
import { 
  Clock, 
  Plus, 
  Trash2, 
  CheckCircle, 
  AlertCircle, 
  ChevronLeft,
  Users,
  Calendar,
  Sparkles,
  Link2,
  ListTodo,
  BarChart3,
  ChevronDown,
  ChevronUp,
  FileText,
  X,
  ShieldCheck,
  CheckCircle2,
  GraduationCap
} from 'lucide-react';
import './TaskScheduler.css';

interface Student {
  id: string;
  name: string;
}

interface Task {
  id: string;
  studentId: string;
  studentName?: string;
  title: string;
  description: string;
  dueDate: string;
  status: 'pending' | 'completed';
  priority: 'low' | 'normal' | 'high';
  youtubeLinks?: string;
}

interface GroupedTask {
  title: string;
  description: string;
  dueDate: string;
  priority: 'low' | 'normal' | 'high';
  youtubeLinks?: string;
  tasks: Task[];
  total: number;
  completedCount: number;
  completionRate: number;
}

interface TaskSchedulerProps {
  onBack: () => void;
  user?: any;
}

export const TaskScheduler: React.FC<TaskSchedulerProps> = ({ onBack, user }) => {
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState('all');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  // Expanded task state
  const [expandedTasks, setExpandedTasks] = useState<Record<string, boolean>>({});
  const [selectedReport, setSelectedReport] = useState<GroupedTask | null>(null);

  // New task form state
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<'low' | 'normal' | 'high'>('normal');
  const [youtubeLinks, setYoutubeLinks] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    loadClasses();
  }, []);

  useEffect(() => {
    loadTasks();
  }, [selectedClass]);

  const loadClasses = async () => {
    try {
      const teacherId = user?.id || 'teacher-andre';
      const data = await (window as any).aquila.invoke('get-classes', teacherId);
      setClasses(Array.isArray(data) ? data : []);
      if (Array.isArray(data) && data.length > 0) {
        setSelectedClass(data[0].id);
      }
    } catch (err) {
      console.error('Erro ao carregar turmas:', err);
    }
  };

  const loadTasks = async () => {
    try {
      setLoading(true);
      const filterObj: any = selectedClass === 'all' ? {} : { classId: selectedClass };
      
      // Se for professor, filtra apenas tarefas agendadas por ele
      const isTeacher = user?.role === 'teacher' || user?.role === 'docente' || (!user?.role && user?.id);
      if (isTeacher && user?.id) {
        filterObj.teacherId = user.id;
      }
      
      const res = await (window as any).aquila.invoke('tasks:list', filterObj);
      if (res.success) {
        setTasks(Array.isArray(res.data) ? res.data : []);
      }
    } catch (err) {
      console.error('Erro ao carregar tarefas:', err);
    } finally {
      setLoading(false);
    }
  };

  // Group tasks by scheduled title
  const groupedTasks: GroupedTask[] = useMemo(() => {
    const groups: Record<string, GroupedTask> = {};
    
    tasks.forEach(t => {
      const key = t.title || 'Sem Título';
      if (!groups[key]) {
        groups[key] = {
          title: t.title,
          description: t.description || '',
          dueDate: t.dueDate,
          priority: t.priority || 'normal',
          youtubeLinks: t.youtubeLinks,
          tasks: [],
          total: 0,
          completedCount: 0,
          completionRate: 0
        };
      }
      groups[key].tasks.push(t);
      groups[key].total += 1;
      if (t.status === 'completed') {
        groups[key].completedCount += 1;
      }
    });

    Object.values(groups).forEach(g => {
      g.completionRate = g.total > 0 ? Math.round((g.completedCount / g.total) * 100) : 0;
    });

    return Object.values(groups);
  }, [tasks]);

  const toggleExpand = (title: string) => {
    setExpandedTasks(prev => ({
      ...prev,
      [title]: !prev[title]
    }));
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !dueDate) {
      alert('Título e Data de Entrega são obrigatórios.');
      return;
    }

    try {
      const taskTemplate = {
        title,
        description,
        dueDate: new Date(dueDate).toISOString(),
        priority,
        status: 'pending',
        youtubeLinks: youtubeLinks || null,
        teacherId: user?.id || 'usr_andre',
        subject: user?.subject || 'Geral'
      };

      const res = await (window as any).aquila.invoke('tasks:create', {
        classId: selectedClass,
        task: taskTemplate
      });

      if (res.success) {
        try {
          await (window as any).aquila.invoke('calendar:save-event', {
            title,
            description: description || '',
            date: dueDate.split('T')[0],
            type: 'tarefa',
            classId: selectedClass,
            subject: user?.subject || 'Geral',
            teacherId: user?.id || null
          });
        } catch (calErr) {
          console.error('Erro ao sincronizar com calendário unificado:', calErr);
        }

        alert(`Tarefa agendada com sucesso para os ${res.count || 0} alunos da turma!`);
        setShowForm(false);
        setTitle('');
        setDescription('');
        setDueDate('');
        setPriority('normal');
        setYoutubeLinks('');
        loadTasks();
      } else {
        alert('Erro ao criar tarefa: ' + res.message);
      }
    } catch (err: any) {
      alert('Falha ao criar tarefa: ' + err.message);
    }
  };

  const handleToggleStatus = async (task: Task) => {
    try {
      const newStatus = task.status === 'pending' ? 'completed' : 'pending';
      const res = await (window as any).aquila.invoke('tasks:update', {
        id: task.id,
        task: {
          ...task,
          status: newStatus
        }
      });
      if (res.success) {
        loadTasks();
      }
    } catch (err) {
      console.error('Erro ao atualizar status da tarefa:', err);
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (!confirm('Deseja realmente excluir esta tarefa?')) return;
    try {
      const res = await (window as any).aquila.invoke('tasks:delete', { id });
      if (res.success) {
        loadTasks();
      }
    } catch (err) {
      console.error('Erro ao deletar tarefa:', err);
    }
  };

  const handleGenerateAI = async () => {
    if (!title) {
      alert('Insira um assunto/título para a tarefa para que a IA possa elaborar.');
      return;
    }
    setIsGenerating(true);
    try {
      const prompt = `Gere uma tarefa escolar sobre o assunto "${title}". Forneça uma descrição curta e 3 tópicos de exercício.`;
      const aiResponse = await (window as any).aquila.invoke('ai:chat', prompt);
      if (aiResponse && (typeof aiResponse === 'string' ? aiResponse : aiResponse.content)) {
        const text = typeof aiResponse === 'string' ? aiResponse : aiResponse.content;
        setDescription(text);
      } else {
        setDescription(`Pesquise e responda às questões sobre ${title}.`);
      }
    } catch (e) {
      setDescription(`Pesquise e faça um resumo crítico sobre ${title}.`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="task-scheduler-container animate-fade-in">
      <header className="page-header flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="back-btn" title="Voltar ao Painel">
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1>Tarefas & Agendamentos <span>v2.0</span></h1>
            <p className="subtitle">Gestão por Tarefas Agendadas • Acesso Integrado Prof/Coord/Pais</p>
          </div>
        </div>
        <button className="add-task-btn flex items-center gap-2" onClick={() => setShowForm(!showForm)}>
          <Plus size={16} />
          <span>Agendar Nova Tarefa</span>
        </button>
      </header>

      {showForm && (
        <section className="form-panel glass animate-slide-down">
          <h3>Agendar Atividade para Turma</h3>
          <form onSubmit={handleCreateTask} className="task-form-grid mt-4">
            <div className="form-col-left">
              <div className="form-group">
                <label>Assunto/Título da Tarefa</label>
                <div className="input-with-action">
                  <input 
                    type="text" 
                    value={title} 
                    onChange={e => setTitle(e.target.value)} 
                    placeholder="Ex: Resolução dos Exercícios de Álgebra pg 42"
                    required
                  />
                  <button 
                    type="button" 
                    className="btn-ai-generate flex items-center gap-1"
                    onClick={handleGenerateAI}
                    disabled={isGenerating}
                  >
                    <Sparkles size={14} />
                    <span>{isGenerating ? 'Elaborando...' : 'IA Assist'}</span>
                  </button>
                </div>
              </div>

              <div className="form-row mt-2">
                <div className="form-group flex-1">
                  <label>Data de Entrega</label>
                  <input 
                    type="datetime-local" 
                    value={dueDate} 
                    onChange={e => setDueDate(e.target.value)} 
                    required
                  />
                </div>
                <div className="form-group flex-1">
                  <label>Prioridade</label>
                  <select value={priority} onChange={e => setPriority(e.target.value as any)}>
                    <option value="low">Baixa</option>
                    <option value="normal">Normal</option>
                    <option value="high">Alta</option>
                  </select>
                </div>
              </div>

              <div className="form-group mt-2">
                <label>Links Complementares</label>
                <input 
                  type="text" 
                  value={youtubeLinks} 
                  onChange={e => setYoutubeLinks(e.target.value)} 
                  placeholder="Ex: https://youtube.com/watch?v=..."
                />
              </div>
            </div>

            <div className="form-col-right flex flex-col h-full">
              <div className="form-group flex-1 flex flex-col h-full">
                <label>Instruções/Descrição</label>
                <textarea 
                  className="flex-1"
                  value={description} 
                  onChange={e => setDescription(e.target.value)} 
                  placeholder="Insira as diretrizes para os alunos..."
                  rows={4}
                />
              </div>
            </div>

            <div className="form-actions col-span-2 flex gap-3 justify-end mt-2">
              <button type="submit" className="btn-submit">Agendar para Toda a Turma</button>
              <button type="button" className="btn-cancel" onClick={() => setShowForm(false)}>Cancelar</button>
            </div>
          </form>
        </section>
      )}

      {/* Filter and class selection */}
      <section className="controls-panel glass mt-4 flex items-center justify-between">
        <div className="select-wrapper">
          <Users size={16} className="icon" />
          <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)}>
            <option value="all">TODAS AS TURMAS</option>
            {classes.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold text-slate-400 bg-slate-900/60 px-4 py-2 rounded-xl border border-slate-800">
          <ListTodo size={16} className="text-blue-400" />
          <span>{groupedTasks.length} Tarefa(s) Agendada(s)</span>
        </div>
      </section>

      {/* Grouped Tasks List */}
      <section className="tasks-list-container mt-6">
        {loading ? (
          <div className="loading flex items-center justify-center py-20">
            <div className="spinner"></div>
          </div>
        ) : groupedTasks.length === 0 ? (
          <div className="empty-state text-center py-20 text-zinc-500">
            Nenhuma tarefa agendada para esta turma.
          </div>
        ) : (
          <div className="space-y-4">
            {groupedTasks.map(group => {
              const isExpanded = expandedTasks[group.title] ?? true;
              return (
                <div key={group.title} className="scheduled-task-card glass rounded-2xl p-5 border border-white/5 shadow-xl transition hover:border-blue-500/20">
                  {/* Card Header */}
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-[280px]">
                      <div className="p-3 bg-blue-600/15 border border-blue-500/30 rounded-xl text-blue-400">
                        <FileText size={20} />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                          {group.title}
                          <span className={`priority-badge ${group.priority}`}>
                            {group.priority.toUpperCase()}
                          </span>
                        </h3>
                        {group.description && (
                          <p className="text-xs text-slate-400 mt-1 line-clamp-1">{group.description}</p>
                        )}
                        <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                          <span className="flex items-center gap-1">
                            <Calendar size={13} className="text-slate-500" />
                            {new Date(group.dueDate).toLocaleString('pt-BR')}
                          </span>
                          <span>•</span>
                          <span className="font-semibold text-slate-300">
                            {group.completedCount}/{group.total} Alunos Entregaram
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Progress Ring / Bar & Actions */}
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col items-end">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-400">Taxa de Conclusão:</span>
                          <span className="text-sm font-black text-emerald-400">{group.completionRate}%</span>
                        </div>
                        <div className="w-36 h-2 bg-slate-800 rounded-full overflow-hidden mt-1 border border-slate-700">
                          <div 
                            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                            style={{ width: `${group.completionRate}%` }}
                          />
                        </div>
                      </div>

                      {/* Performance Report Button */}
                      <button 
                        onClick={() => setSelectedReport(group)}
                        className="flex items-center gap-2 bg-indigo-600/20 hover:bg-indigo-600/35 text-indigo-300 border border-indigo-500/30 px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-md"
                        title="Ver Relatório de Desempenho"
                      >
                        <BarChart3 size={15} />
                        <span>Relatório de Desempenho</span>
                      </button>

                      {/* Expand / Collapse Toggle */}
                      <button 
                        onClick={() => toggleExpand(group.title)}
                        className="p-2 hover:bg-slate-800/80 text-slate-400 hover:text-white rounded-xl transition border border-slate-800"
                        title={isExpanded ? 'Recolher Alunos' : 'Expandir Alunos'}
                      >
                        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </button>
                    </div>
                  </div>

                  {/* Collapsible Student List Table (Compact Spacing) */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-white/5 overflow-hidden">
                      <table className="tasks-table w-full text-left border-collapse">
                        <thead>
                          <tr>
                            <th className="py-2 px-3 text-xs text-slate-400 uppercase tracking-wider font-bold">Aluno</th>
                            <th className="py-2 px-3 text-xs text-slate-400 uppercase tracking-wider font-bold">Data Entrega</th>
                            <th className="py-2 px-3 text-xs text-slate-400 uppercase tracking-wider font-bold">Status</th>
                            <th className="py-2 px-3 text-xs text-slate-400 uppercase tracking-wider font-bold text-right">Ações</th>
                          </tr>
                        </thead>
                        <tbody>
                          {group.tasks.map(task => (
                            <tr key={task.id} className="hover:bg-white/[0.02] border-b border-white/[0.03] transition">
                              <td className="py-1.5 px-3 text-sm font-semibold text-slate-200">
                                {task.studentName || 'Aluno Desconhecido'}
                              </td>
                              <td className="py-1.5 px-3 text-xs text-slate-400 font-mono">
                                {new Date(task.dueDate).toLocaleString('pt-BR')}
                              </td>
                              <td className="py-1.5 px-3">
                                <button 
                                  className={`status-toggle inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition ${task.status}`}
                                  onClick={() => handleToggleStatus(task)}
                                >
                                  {task.status === 'completed' ? (
                                    <>
                                      <CheckCircle size={13} className="text-emerald-400" />
                                      <span>Entregue</span>
                                    </>
                                  ) : (
                                    <>
                                      <AlertCircle size={13} className="text-amber-400" />
                                      <span>Pendente</span>
                                    </>
                                  )}
                                </button>
                              </td>
                              <td className="py-1.5 px-3 text-right">
                                <button className="delete-btn p-1 text-slate-500 hover:text-red-400 transition" onClick={() => handleDeleteTask(task.id)} title="Excluir Atividade">
                                  <Trash2 size={14} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Relatório de Desempenho Modal (Prof, Coordenação, Pais) */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl relative text-left">
            <button 
              onClick={() => setSelectedReport(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg transition hover:bg-slate-800 cursor-pointer"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 border-b border-white/10 pb-4">
              <div className="p-3 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-xl">
                <BarChart3 size={24} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-0">
                  Relatório de Desempenho da Tarefa
                  <span className="text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2.5 py-0.5 rounded-full font-mono font-bold">
                    {selectedReport.completionRate}% Concluído
                  </span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Atividade: <span className="text-cyan-300 font-semibold">{selectedReport.title}</span>
                </p>
              </div>
            </div>

            {/* Badges de Permissão de Acesso */}
            <div className="flex items-center gap-2 bg-slate-950/80 p-2.5 px-3 rounded-xl border border-white/5 text-xs text-slate-400">
              <ShieldCheck size={16} className="text-emerald-400" />
              <span className="font-bold text-slate-300">Acesso Tríplice:</span>
              <span className="bg-blue-500/10 text-blue-300 px-2 py-0.5 rounded text-[11px] font-bold">Professor</span>
              <span className="bg-emerald-500/10 text-emerald-300 px-2 py-0.5 rounded text-[11px] font-bold">Coordenação</span>
              <span className="bg-purple-500/10 text-purple-300 px-2 py-0.5 rounded text-[11px] font-bold">Pais & Aluno</span>
            </div>

            {/* Overview Stats Bar - Limpo sem caixas rotacionadas */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-950/80 p-3.5 rounded-xl border border-white/5 text-center">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Total Atribuído</span>
                <span className="text-xl font-black text-white mt-1 block">{selectedReport.total} Alunos</span>
              </div>
              <div className="bg-slate-950/80 p-3.5 rounded-xl border border-white/5 text-center">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Entregues</span>
                <span className="text-xl font-black text-emerald-400 mt-1 block">{selectedReport.completedCount}</span>
              </div>
              <div className="bg-slate-950/80 p-3.5 rounded-xl border border-white/5 text-center">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Pendentes</span>
                <span className="text-xl font-black text-amber-400 mt-1 block">{selectedReport.total - selectedReport.completedCount}</span>
              </div>
            </div>

            {/* Diagnóstico Pedagógico IA */}
            <div className="bg-gradient-to-r from-indigo-950/40 to-slate-900/90 p-4 rounded-xl border border-indigo-500/20 space-y-2">
              <div className="flex items-center gap-2 text-indigo-300 text-xs font-bold uppercase tracking-wider">
                <Sparkles size={16} className="text-purple-400" />
                <span>Diagnóstico Córtex IA — Síntese Pedagógica</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {selectedReport.completionRate >= 80 ? (
                  `Engajamento excelente na turma! ${selectedReport.completionRate}% dos alunos entregaram "${selectedReport.title}" dentro do prazo. A assimilação do conteúdo teórico está acima da média pedagógica esperada.`
                ) : selectedReport.completionRate >= 50 ? (
                  `Engajamento moderado. ${selectedReport.completedCount} de ${selectedReport.total} alunos concluíram a atividade. É recomendado enviar um lembrete via aplicativo para os pais dos alunos pendentes.`
                ) : (
                  `Alerta de engajamento baixo: Apenas ${selectedReport.completionRate}% da turma concluiu a atividade até o momento. A Coordenação e o Professor podem agendar reforço pedagógico.`
                )}
              </p>
            </div>

            {/* Lista Organizada em 2 Colunas de Alunos Pendentes */}
            {selectedReport.total - selectedReport.completedCount > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                    Alunos Pendentes ({selectedReport.total - selectedReport.completedCount}):
                  </h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-3 bg-slate-950/80 rounded-xl border border-white/5 custom-scrollbar">
                  {selectedReport.tasks.filter(t => t.status === 'pending').map((t, idx) => (
                    <div key={t.id} className="flex items-center justify-between p-2 px-3 bg-slate-900/60 rounded-lg border border-white/5 text-xs">
                      <span className="font-bold text-slate-200 truncate mr-2">#{idx + 1} {t.studentName || 'Aluno'}</span>
                      <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded text-[10px] font-bold flex-shrink-0">Pendente</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button 
                onClick={() => setSelectedReport(null)}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer shadow-lg shadow-indigo-600/30"
              >
                Fechar Relatório
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskScheduler;
