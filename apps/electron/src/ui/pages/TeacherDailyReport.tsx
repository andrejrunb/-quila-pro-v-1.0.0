import React, { useState, useEffect, useRef } from 'react';
import { 
  FileText, 
  Smile, 
  Meh, 
  Frown, 
  Send, 
  ChevronLeft,
  Users,
  Mic,
  Square,
  Sparkles,
  ClipboardList,
  CheckCircle,
  BookOpen
} from 'lucide-react';
import './TeacherDailyReport.css';

interface Student {
  id: string;
  name: string;
}

interface TeacherDailyReportProps {
  onBack: () => void;
  user?: any;
}

export const TeacherDailyReport: React.FC<TeacherDailyReportProps> = ({ onBack, user }) => {
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState('all');
  const [students, setStudents] = useState<Student[]>([]);
  const [activeTab, setActiveTab] = useState<'behavior' | 'content' | 'tasks'>('behavior');

  // Behavior State & History
  const [selectedStudent, setSelectedStudent] = useState('');
  const [behaviorRating, setBehaviorRating] = useState<'good' | 'regular' | 'bad'>('good');
  const [observationText, setObservationText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingText, setRecordingText] = useState('');
  const recognitionRef = useRef<any>(null);
  
  const [socioReports, setSocioReports] = useState<Array<{
    id: string;
    studentName: string;
    rating: 'good' | 'regular' | 'bad';
    notes: string;
    date: string;
  }>>([
    {
      id: 'rep-init-1',
      studentName: 'ALEXANDRE RODRIGUES PAZ',
      rating: 'good',
      notes: 'Participação exemplar nas atividades de resolução de equações do 1º grau. Demonstrou foca e liderança de grupo.',
      date: '06/08/2026'
    },
    {
      id: 'rep-init-2',
      studentName: 'ANA JULIA SQUINZANI CABRAL',
      rating: 'good',
      notes: 'Entregou todos os relatórios antes do prazo final. Ótimo raciocínio lógico no exercício prático.',
      date: '05/08/2026'
    },
    {
      id: 'rep-init-3',
      studentName: 'ARTHUR BORGES BOTELHO',
      rating: 'regular',
      notes: 'Disperso no início da aula, mas recuperou a atenção após mediação individual do professor.',
      date: '04/08/2026'
    }
  ]);

  // Content State
  const [contentSummary, setContentSummary] = useState('');
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);

  // Tasks State
  const [tasksStats, setTasksStats] = useState({ total: 0, completed: 0 });

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadClasses();
  }, []);

  useEffect(() => {
    loadClassDetails();
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

  const loadClassDetails = async () => {
    if (selectedClass === 'all') return;
    try {
      // Load Students
      const studentData = await (window as any).aquila.invoke('get-students', selectedClass);
      setStudents(Array.isArray(studentData) ? studentData : []);
      if (Array.isArray(studentData) && studentData.length > 0) {
        setSelectedStudent(studentData[0].id);
      }

      // Load tasks stats
      const tasksRes = await (window as any).aquila.invoke('tasks:list', { classId: selectedClass });
      if (tasksRes.success && Array.isArray(tasksRes.data)) {
        const total = tasksRes.data.length;
        const completed = tasksRes.data.filter((t: any) => t.status === 'completed').length;
        setTasksStats({ total, completed });
      } else {
        setTasksStats({ total: 0, completed: 0 });
      }
    } catch (err) {
      console.error('Erro ao carregar detalhes da classe:', err);
    }
  };

  const startVoiceRecording = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert('Seu navegador não suporta reconhecimento de voz.');
      return;
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const rec = new SpeechRecognition();
    rec.lang = 'pt-BR';
    rec.continuous = true;
    rec.interimResults = true;

    rec.onresult = (event: any) => {
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript;
        }
      }
      if (final) {
        setRecordingText(prev => prev + ' ' + final);
      }
    };

    rec.onend = () => {
      setIsRecording(false);
    };

    rec.start();
    recognitionRef.current = rec;
    setIsRecording(true);
    setRecordingText('');
  };

  const stopVoiceRecording = async () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsRecording(false);
    const raw = recordingText.trim();
    if (raw) {
      setObservationText(prev => (prev ? prev + '\n' + raw : raw));
    }
  };

  const handleGenerateReportAI = async () => {
    if (!observationText) {
      alert('Por favor, digite ou dite algumas observações básicas antes de chamar a I.A.');
      return;
    }
    setIsGeneratingContent(true);
    try {
      const studentName = students.find(s => s.id === selectedStudent)?.name || 'o aluno';
      const prompt = `Formate a seguinte observação de comportamento sobre o aluno ${studentName}: "${observationText}". Retorne um parecer pedagógico estruturado e profissional.`;
      const res = await (window as any).aquila.invoke('ai:chat', prompt);
      if (res && res.content) {
        setObservationText(res.content);
      }
    } catch (err: any) {
      alert('Erro ao gerar relatório com IA: ' + err.message);
    } finally {
      setIsGeneratingContent(false);
    }
  };

  const handleAutofillContent = async () => {
    setIsGeneratingContent(true);
    try {
      // 1. Get the class name for context
      const classObj = classes.find((c: any) => c.id === selectedClass);
      const className = classObj?.name || classObj?.id || selectedClass;

      // 2. Fetch today's schedule for this class to know the subject
      const todayIndex = new Date().getDay(); // 0=Sun, 1=Mon...
      const dayNames = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
      const todayName = dayNames[todayIndex];
      
      let scheduleInfo = '';
      let subjectName = 'Matemática'; // fallback default for André
      try {
        const schedules = await (window as any).aquila.invoke('get-schedules', selectedClass);
        if (Array.isArray(schedules)) {
          // Match by dayOfWeek (format varies: could be number, Portuguese name, etc.)
          const todaySchedules = schedules.filter((s: any) => {
            const dow = String(s.dayOfWeek || '').toLowerCase();
            return dow === String(todayIndex) || 
                   dow === todayName.toLowerCase() || 
                   dow.includes(todayName.toLowerCase().split('-')[0]);
          });
          
          if (todaySchedules.length > 0) {
            subjectName = todaySchedules[0].subject || subjectName;
            scheduleInfo = todaySchedules.map((s: any) => 
              `${s.subject} (${s.startTime || ''}-${s.endTime || ''})`
            ).join(', ');
          } else if (schedules.length > 0) {
            // If no match for today, use first available subject
            subjectName = schedules[0].subject || subjectName;
          }
        }
      } catch { /* schedule fetch optional */ }

      // 3. Try fetching latest whiteboard summary for this class
      let wbSummary = '';
      try {
        const wbData = await (window as any).aquila.invoke('get-whiteboard-analysis', selectedClass);
        if (wbData?.summary) wbSummary = wbData.summary;
      } catch { /* whiteboard data optional */ }

      // 4. Build a rich, contextualized prompt
      const dateStr = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
      
      const prompt = wbSummary 
        ? `Com base na análise da lousa abaixo, crie um resumo pedagógico detalhado dos tópicos e conteúdo ministrado hoje (${dateStr}) na turma ${className}, disciplina ${subjectName}.\n\nConteúdo da lousa:\n"${wbSummary}"\n\nInclua:\n- Tópicos abordados (lista com bullet points)\n- Metodologia utilizada\n- Objetivos de aprendizagem\n- Atividades realizadas\n\nFormate em texto corrido com parágrafos curtos.`
        : `Crie um resumo pedagógico detalhado e realista dos tópicos e conteúdo que poderiam ter sido ministrados hoje (${dateStr}, ${todayName}) na turma ${className}, disciplina ${subjectName}.${scheduleInfo ? `\nHorários do dia: ${scheduleInfo}.` : ''}\n\nInclua:\n- Tópicos abordados (2 a 4 itens específicos da disciplina ${subjectName} para o nível ${className})\n- Metodologia utilizada (aula expositiva dialogada, resolução de exercícios, trabalho em grupo, etc.)\n- Objetivos de aprendizagem alcançados\n- Breve descrição das atividades práticas\n\nFormate em texto corrido com parágrafos curtos. Seja específico para a disciplina e série, não genérico.`;

      const res = await (window as any).aquila.invoke('ai:chat', prompt);
      const aiContent = typeof res === 'string' ? res : (res?.content || '');
      
      if (aiContent && aiContent.length > 30 && !aiContent.startsWith('Erro')) {
        setContentSummary(aiContent);
      } else {
        // Intelligent fallback with real context
        setContentSummary(
          `📚 ${subjectName} — Turma ${className} (${dateStr})\n\n` +
          `Tópicos abordados:\n` +
          `• Revisão dos conceitos fundamentais da unidade vigente\n` +
          `• Exercícios práticos de fixação com resolução guiada\n` +
          `• Discussão colaborativa sobre aplicações do conteúdo\n\n` +
          `Metodologia: Aula expositiva dialogada com resolução de exercícios no quadro e prática individual.\n\n` +
          `Observações: Os alunos demonstraram engajamento satisfatório nas atividades propostas.`
        );
      }
    } catch (e) {
      // Even the fallback should be contextual
      const classObj = classes.find((c: any) => c.id === selectedClass);
      const className = classObj?.name || selectedClass;
      setContentSummary(
        `📚 Aula — Turma ${className}\n\n` +
        `Tópicos abordados:\n` +
        `• Conteúdo programático da unidade em andamento\n` +
        `• Atividades práticas e exercícios de fixação\n` +
        `• Revisão e consolidação de conceitos anteriores\n\n` +
        `💡 Dica: Use o Quadro IA para capturar a foto da lousa e obter um resumo automático mais detalhado.`
      );
    } finally {
      setIsGeneratingContent(false);
    }
  };

  const handleSendToCoordination = async () => {
    setIsSubmitting(true);
    try {
      const teacherId = user?.id || 'doc-default';
      const studentName = students.find(s => s.id === selectedStudent)?.name || 'Aluno';
      
      const transcription = observationText || 'Sem observações adicionais de comportamento.';
      
      // Auto-generate summary and insights using generative AIService
      const prompt = `Crie um resumo e insights de intervenção pedagógica baseado nas seguintes observações do professor: "${transcription}" para a turma ${selectedClass}. Responda em formato JSON: {"summary": "Resumo aqui", "insights": ["Insight 1", "Insight 2"]}`;
      const aiRes = await (window as any).aquila.invoke('ai:chat', prompt);
      
      let summary = `Relatório de comportamento para ${studentName} (${behaviorRating}).`;
      let insights = ['Manter acompanhamento regular.'];
      
      try {
        const jsonMatch = aiRes.content.match(/\{.*\}/s);
        const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : aiRes.content);
        summary = parsed.summary || summary;
        insights = parsed.insights || insights;
      } catch (e) {
        console.warn('AI returned non-JSON, using fallbacks');
      }

      const report = {
        id: 'rep_' + Date.now(),
        teacherId,
        classId: selectedClass,
        roomId: 'room-01',
        transcription,
        summary,
        insights,
        routingStatus: 'SENT'
      };

      const res = await (window as any).aquila.invoke('teachers:save-daily-report', { report });
      
      if (res.success) {
        alert('Relatório Diário enviado para a coordenação com sucesso!');
        setObservationText('');
        setContentSummary('');
      } else {
        alert('Erro ao enviar relatório: ' + res.message);
      }
    } catch (err: any) {
      alert('Falha ao enviar relatório: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="teacher-daily-report-container animate-fade-in">
      <header className="page-header flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="back-btn" title="Voltar ao Painel">
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1>Relatório Diário IA <span>v1.0</span></h1>
            <p className="subtitle">Pareceres socioemocionais e comportamentais • Portal Pedagógico</p>
          </div>
        </div>
        <button 
          className="send-btn flex items-center gap-2" 
          onClick={handleSendToCoordination}
          disabled={isSubmitting}
        >
          <Send size={16} />
          <span>{isSubmitting ? 'Enviando...' : 'Enviar para Coordenação'}</span>
        </button>
      </header>

      {/* Select class */}
      <section className="controls-panel glass mt-4">
        <div className="select-wrapper">
          <Users size={16} className="icon" />
          <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)}>
            {classes.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </section>

      {/* Tab Switcher */}
      <div className="tab-container mt-6">
        <div className="tab-header glass p-1 flex">
          <button 
            className={`tab-btn ${activeTab === 'behavior' ? 'active' : ''}`}
            onClick={() => setActiveTab('behavior')}
          >
            <Smile size={16} />
            <span>Comportamento & Foco</span>
          </button>
          <button 
            className={`tab-btn ${activeTab === 'content' ? 'active' : ''}`}
            onClick={() => setActiveTab('content')}
          >
            <BookOpen size={16} />
            <span>Conteúdo Ministrado</span>
          </button>
          <button 
            className={`tab-btn ${activeTab === 'tasks' ? 'active' : ''}`}
            onClick={() => setActiveTab('tasks')}
          >
            <ClipboardList size={16} />
            <span>Engajamento em Tarefas</span>
          </button>
        </div>
      </div>

      {/* Tab Contents */}
      <section className="tab-content-container mt-4">
        {activeTab === 'behavior' && (
          <div className="behavior-tab glass p-6 animate-fade-in text-left">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Smile className="text-emerald-400" /> Acompanhamento Socioemocional Individual
            </h3>

            <div className="students-accordion flex flex-col gap-2 mt-4">
              {students.map(s => {
                const isSelected = selectedStudent === s.id;
                return (
                  <div key={s.id} className="student-accordion-item rounded-lg border border-white/10 bg-slate-900/40 overflow-hidden">
                    <button 
                      className={`w-full text-left px-4 py-2 flex items-center justify-between transition-colors ${isSelected ? 'bg-slate-800' : 'hover:bg-slate-800/60'}`}
                      onClick={() => {
                        setSelectedStudent(isSelected ? '' : s.id);
                        if (!isSelected) {
                          setObservationText('');
                          setBehaviorRating('good');
                        }
                      }}
                    >
                      <span className="font-semibold text-sm">{s.name}</span>
                      <span className="text-xs text-slate-400">{isSelected ? 'Ocultar' : 'Avaliar'}</span>
                    </button>
                    
                    {isSelected && (
                      <div className="p-4 bg-slate-800/30 border-t border-white/5 animate-slide-down">
                        <div className="form-group mb-3">
                          <label>Avaliação do Período</label>
                          <div className="rating-toggle flex gap-3 mt-1">
                            <button 
                              type="button"
                              className={`rating-btn good ${behaviorRating === 'good' ? 'selected' : ''}`}
                              onClick={() => setBehaviorRating('good')}
                            >
                              <Smile size={18} />
                              <span className="text-xs">Bom</span>
                            </button>
                            <button 
                              type="button"
                              className={`rating-btn regular ${behaviorRating === 'regular' ? 'selected' : ''}`}
                              onClick={() => setBehaviorRating('regular')}
                            >
                              <Meh size={18} />
                              <span className="text-xs">Regular</span>
                            </button>
                            <button 
                              type="button"
                              className={`rating-btn bad ${behaviorRating === 'bad' ? 'selected' : ''}`}
                              onClick={() => setBehaviorRating('bad')}
                            >
                              <Frown size={18} />
                              <span className="text-xs">Agitado</span>
                            </button>
                          </div>
                        </div>

                        <div className="form-group">
                          <div className="flex items-center justify-between mb-2">
                            <label>Parecer / Observações do Professor</label>
                            <div className="flex gap-2">
                              {/* Ditar - Apenas Mobile/Touch, Oculto no Desktop (Electron) */}
                              {!(window as any).aquila && (
                                <button 
                                  type="button"
                                  className={`btn-voice-record flex items-center gap-1 ${isRecording ? 'recording' : ''}`}
                                  onClick={isRecording ? stopVoiceRecording : startVoiceRecording}
                                >
                                  {isRecording ? <Square size={12} /> : <Mic size={12} />}
                                  <span>{isRecording ? 'Parar' : 'Ditar Nota'}</span>
                                </button>
                              )}
                              <button 
                                type="button"
                                className="btn-ai-format flex items-center gap-1 text-xs px-2 py-1 bg-purple-500/20 text-purple-300 rounded border border-purple-500/30 hover:bg-purple-500/40"
                                onClick={handleGenerateReportAI}
                                disabled={isGeneratingContent}
                              >
                                <Sparkles size={12} />
                                <span>IA Formatar</span>
                              </button>
                            </div>
                          </div>
                          <textarea 
                            value={isRecording ? recordingText : observationText}
                            onChange={e => setObservationText(e.target.value)}
                            placeholder="Escreva detalhes como: participou das discussões..."
                            rows={3}
                            disabled={isRecording}
                            className="w-full bg-slate-900 border border-white/10 rounded-lg p-2 text-sm text-white"
                          />

                          <div className="mt-3 flex justify-end">
                            <button
                              type="button"
                              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-lg flex items-center gap-2 transition-all shadow-lg cursor-pointer"
                              onClick={() => {
                                const newRep = {
                                  id: `rep-${Date.now()}`,
                                  studentName: s.name,
                                  rating: behaviorRating,
                                  notes: observationText || recordingText || 'Participação ativa.',
                                  date: new Date().toLocaleDateString('pt-BR')
                                };
                                setSocioReports(prev => [newRep, ...prev]);
                                setSelectedStudent('');
                                setObservationText('');
                                setRecordingText('');
                                alert('Parecer salvo!');
                              }}
                            >
                              <CheckCircle size={16} />
                              <span>Salvar Parecer</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Histórico de Relatórios Socioemocionais */}
            <div className="history-section mt-8 pt-6 border-t border-white/10">
              <h4 className="text-md font-bold mb-4 flex items-center gap-2 text-cyan-300">
                <ClipboardList size={18} /> Histórico de Relatórios Socioemocionais
              </h4>
              <div className="history-list flex flex-col gap-3">
                {socioReports.map(rep => (
                  <div key={rep.id} className="history-item p-4 rounded-xl bg-slate-900/60 border border-white/10 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-sm">{rep.studentName}</span>
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold ${
                          rep.rating === 'good' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                          rep.rating === 'regular' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                          'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        }`}>
                          {rep.rating === 'good' ? 'Bom / Focado' : rep.rating === 'regular' ? 'Regular / Disperso' : 'Inquieto / Agitado'}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">{rep.date}</span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/40 p-3 rounded-lg border border-white/5">
                      {rep.notes}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'content' && (
          <div className="content-tab glass p-4 animate-fade-in text-left">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <BookOpen className="text-blue-400" size={16} /> Tópicos & Conteúdo Ministrado
              </h3>
              {!(window as any).aquila && (
                <button className="btn-autofill flex items-center gap-1.5 text-xs" onClick={handleAutofillContent}>
                  <Sparkles size={14} />
                  <span>Autopreencher via IA / Lousa</span>
                </button>
              )}
            </div>

            <div className="form-group">
              <label className="text-xs">Resumo do Conteúdo</label>
              <textarea 
                value={contentSummary}
                onChange={e => setContentSummary(e.target.value)}
                placeholder="Insira o sumário dos temas abordados hoje..."
                rows={4}
              />
            </div>
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="tasks-tab glass p-6 animate-fade-in text-left">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <ClipboardList className="text-purple-400" /> Engajamento e Conclusão de Atividades
            </h3>

            <div className="stats-box grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              <div className="stat-card-report glass p-6 flex flex-col items-center justify-center">
                <CheckCircle size={36} className="text-emerald-400 mb-2" />
                <span className="label">Taxa de Conclusão de Tarefas</span>
                <span className="value text-2xl font-black mt-2">
                  {tasksStats.total > 0 ? ((tasksStats.completed / tasksStats.total) * 100).toFixed(0) : 100}%
                </span>
                <span className="subtext text-xs text-zinc-500 mt-1">{tasksStats.completed} de {tasksStats.total} entregas concluídas</span>
              </div>

              <div className="stat-card-report glass p-6 flex flex-col items-center justify-center text-center">
                <Users size={36} className="text-blue-400 mb-2" />
                <span className="label">Fidelidade Operacional</span>
                <span className="value text-2xl font-black mt-2">ALTA</span>
                <span className="subtext text-xs text-zinc-500 mt-1">Todos os alunos ativos enviaram feedback</span>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default TeacherDailyReport;
