import React, { useState, useEffect } from 'react';
import { ScheduleGrid } from '../components/ScheduleGrid';
import {
  DoorOpen,
  ArrowLeft,
  Mic,
  Clock,
  Sparkles,
  CheckCircle2,
  Sliders,
  Plus,
  Trash2,
  Download
} from 'lucide-react';
import './ClassroomManagement.css';

export interface ScheduleUser {
  id?: string;
  name?: string;
  role?: string;
}

export interface ScheduleRoom {
  id: string;
  name: string;
}

export interface ScheduleClassItem {
  id: string;
  name: string;
}

export interface ScheduleEntry {
  id: string;
  classId: string;
  className?: string;
  teacherId: string;
  roomId: string;
  subject: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export interface TimetableSolverSummary {
  hard_violations: number;
  soft_cost: number;
  iterations: number;
  elapsed_ms: number;
}

export interface TeacherConstraintRule {
  id: string;
  subject: string;
  className: string;
  roomId: string;
  weeklyLessons: number;
  forbiddenDay: number; // 0 = nenhum, 1..6 = Seg..Sab
  geminated: boolean;
}

interface AquilaScheduleBridge {
  invoke?: (channel: string, ...args: unknown[]) => Promise<unknown>;
}

interface TeacherScheduleProps {
  user: ScheduleUser;
  onBack: () => void;
}

const DEFAULT_ROOMS: ScheduleRoom[] = [
  { id: 'room-12', name: 'SALA 12 • Bloco A' },
  { id: 'room-08', name: 'SALA 08 • Bloco A' },
  { id: 'room-05', name: 'SALA 05 • Bloco B' },
  { id: 'room-lab', name: 'LAB STEM 02 • Bloco B' },
];

const DEFAULT_CONSTRAINT_RULES: TeacherConstraintRule[] = [
  {
    id: 'rule-1',
    subject: 'Matemática • 3º A',
    className: '3ª Série A — Ensino Médio',
    roomId: 'room-12',
    weeklyLessons: 6,
    forbiddenDay: 0,
    geminated: true
  },
  {
    id: 'rule-2',
    subject: 'Física Aplicada • 2º B',
    className: '2ª Série B — Ensino Médio',
    roomId: 'room-lab',
    weeklyLessons: 5,
    forbiddenDay: 4, // Folga na Quinta nesta turma
    geminated: true
  },
  {
    id: 'rule-3',
    subject: 'Matemática • 1º C',
    className: '1ª Série C — Ensino Médio',
    roomId: 'room-05',
    weeklyLessons: 5,
    forbiddenDay: 6, // Sem aula no Sábado
    geminated: false
  },
  {
    id: 'rule-4',
    subject: 'Olímpica OBMEP/ITA • 3º A',
    className: '3ª Série A — Ensino Médio',
    roomId: 'room-08',
    weeklyLessons: 4,
    forbiddenDay: 2, // Folga na Terça
    geminated: false
  }
];

const TIME_SLOTS = [
  { start: '07:30', end: '08:20' },
  { start: '08:20', end: '09:10' },
  { start: '09:10', end: '10:00' },
  { start: '10:20', end: '11:10' },
  { start: '11:10', end: '12:00' }
];

const DAY_NAMES: Record<number, string> = {
  0: 'Sem Restrição (Todos os Dias)',
  1: 'Segunda-feira (Folga Externa)',
  2: 'Terça-feira (Folga Externa)',
  3: 'Quarta-feira (Folga Externa)',
  4: 'Quinta-feira (Folga Externa)',
  5: 'Sexta-feira (Folga Externa)',
  6: 'Sábado (Livre)'
};

const buildSchedulesFromConstraintRules = (
  teacherId: string,
  rules: TeacherConstraintRule[]
): ScheduleEntry[] => {
  const entries: ScheduleEntry[] = [];
  const activeRules = rules.length > 0 ? rules : DEFAULT_CONSTRAINT_RULES;

  for (let day = 1; day <= 6; day++) {
    const availableRules = activeRules.filter(r => r.forbiddenDay !== day);
    const rulesPool = availableRules.length > 0 ? availableRules : activeRules;
    const maxSlotsToday = day === 6 ? 3 : TIME_SLOTS.length;

    let slotIdx = 0;
    let ruleCursor = (day - 1) % rulesPool.length;

    while (slotIdx < maxSlotsToday) {
      const rule = rulesPool[ruleCursor % rulesPool.length];
      const slot = TIME_SLOTS[slotIdx];

      entries.push({
        id: `sa-gls-${day}-${slotIdx}`,
        classId: `cls-${rule.id}`,
        className: rule.className,
        teacherId,
        roomId: rule.roomId,
        subject: rule.subject,
        dayOfWeek: day,
        startTime: slot.start,
        endTime: slot.end
      });
      slotIdx++;

      // Se a regra pede aula geminada e ainda há espaço no bloco, aloca aula dupla consecutiva sem janela
      if (rule.geminated && slotIdx < maxSlotsToday && slotIdx !== 3) {
        const nextSlot = TIME_SLOTS[slotIdx];
        entries.push({
          id: `sa-gls-${day}-${slotIdx}`,
          classId: `cls-${rule.id}`,
          className: rule.className,
          teacherId,
          roomId: rule.roomId,
          subject: rule.subject,
          dayOfWeek: day,
          startTime: nextSlot.start,
          endTime: nextSlot.end
        });
        slotIdx++;
      }

      ruleCursor++;
    }
  }

  return entries;
};

export const TeacherSchedule: React.FC<TeacherScheduleProps> = ({ user, onBack }) => {
  const effectiveTeacherId = user?.id || 'teacher-synth-01';

  const [constraintRules, setConstraintRules] = useState<TeacherConstraintRule[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = window.localStorage.getItem('aquila_timetable_constraints_v1');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          // fallback
        }
      }
    }
    return DEFAULT_CONSTRAINT_RULES;
  });

  const [showWizard, setShowWizard] = useState<boolean>(false);
  const [newSubject, setNewSubject] = useState<string>('');
  const [newClassName, setNewClassName] = useState<string>('2ª Série A — Ensino Médio');
  const [newRoomId, setNewRoomId] = useState<string>('room-12');
  const [newWeeklyLessons, setNewWeeklyLessons] = useState<number>(4);
  const [newForbiddenDay, setNewForbiddenDay] = useState<number>(0);
  const [newGeminated, setNewGeminated] = useState<boolean>(true);

  const [schedules, setSchedules] = useState<ScheduleEntry[]>(() =>
    buildSchedulesFromConstraintRules(effectiveTeacherId, DEFAULT_CONSTRAINT_RULES)
  );
  const [rooms, setRooms] = useState<ScheduleRoom[]>(DEFAULT_ROOMS);
  const [, setClasses] = useState<ScheduleClassItem[]>([]);
  const [teachers, setTeachers] = useState<ScheduleUser[]>([]);
  const [currentClass, setCurrentClass] = useState<ScheduleEntry | null>(() => {
    const defaults = buildSchedulesFromConstraintRules(effectiveTeacherId, DEFAULT_CONSTRAINT_RULES);
    return defaults[2] || null;
  });
  const [isProcessingReport, setIsProcessingReport] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSolvingTimetable, setIsSolvingTimetable] = useState(false);
  const [solverResult, setSolverResult] = useState<TimetableSolverSummary | null>(null);
  const [solverMode, setSolverMode] = useState<'none' | 'solver' | 'heuristic'>('none');

  const getAquilaBridge = (): AquilaScheduleBridge | undefined => {
    if (typeof window === 'undefined') return undefined;
    return (window as unknown as { aquila?: AquilaScheduleBridge }).aquila;
  };

  useEffect(() => {
    const loadData = async () => {
      const aquila = getAquilaBridge();
      if (!aquila?.invoke) {
        setIsLoading(false);
        return;
      }
      try {
        const [r, c, s, users] = await Promise.all([
          aquila.invoke('get-rooms') as Promise<ScheduleRoom[] | null>,
          aquila.invoke('get-classes') as Promise<ScheduleClassItem[] | null>,
          aquila.invoke('get-schedules') as Promise<ScheduleEntry[] | null>,
          aquila.invoke('get-users') as Promise<ScheduleUser[] | null>
        ]);
        if (r && r.length > 0) {
          setRooms(r);
        }
        setClasses(c || []);

        const allTeachers = (users || []).filter(
          (u) => u.role === 'teacher' || u.role === 'professor'
        );
        setTeachers(allTeachers);

        const mySchedules = (s || []).filter((sch) => sch.teacherId === user?.id);
        if (mySchedules.length > 0) {
          setSchedules(mySchedules);
        } else {
          setSchedules(buildSchedulesFromConstraintRules(effectiveTeacherId, constraintRules));
        }
        const cur = (await aquila.invoke('pedagogical:get-current-class', user?.id)) as ScheduleEntry | null;
        if (cur) {
          setCurrentClass(cur);
        }
      } catch (err) {
        console.error('Erro ao carregar grade do professor:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [user, effectiveTeacherId]);

  const handleAddConstraintRule = () => {
    if (!newSubject.trim()) return;
    const rule: TeacherConstraintRule = {
      id: `rule-${Date.now()}`,
      subject: newSubject.trim(),
      className: newClassName,
      roomId: newRoomId,
      weeklyLessons: newWeeklyLessons,
      forbiddenDay: newForbiddenDay,
      geminated: newGeminated
    };
    const updated = [...constraintRules, rule];
    setConstraintRules(updated);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('aquila_timetable_constraints_v1', JSON.stringify(updated));
    }
    setNewSubject('');
  };

  const handleRemoveConstraintRule = (id: string) => {
    const updated = constraintRules.filter(r => r.id !== id);
    setConstraintRules(updated);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('aquila_timetable_constraints_v1', JSON.stringify(updated));
    }
  };

  const handleExportConstraintsCsv = () => {
    const header = 'disciplina_turma,serie,sala,aulas_semanais,dia_folga,geminada';
    const rows = constraintRules.map(
      r => `"${r.subject}","${r.className}","${r.roomId}",${r.weeklyLessons},${r.forbiddenDay},${r.geminated ? 'SIM' : 'NAO'}`
    );
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'restricoes_grade_sa_gls_aquila.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleRunSaGlsSolver = async () => {
    setIsSolvingTimetable(true);
    try {
      const aquila = getAquilaBridge();
      const numClasses = Math.max(4, constraintRules.length);
      const numTeachers = 18;
      const numRooms = 8;
      const requirements = constraintRules.map((rule, idx) => ({
        req_id: idx + 1,
        class_id: idx % numClasses,
        teacher_id: idx % numTeachers,
        subject_id: idx,
        room_id: idx % numRooms,
        building_id: 0,
        weekly_lessons: rule.weeklyLessons
      }));

      const teacherUnavailable: Record<string, number[]> = {};
      constraintRules.forEach((rule, idx) => {
        if (rule.forbiddenDay >= 1 && rule.forbiddenDay <= 5) {
          const dayIdx = rule.forbiddenDay - 1;
          const tId = String(idx % numTeachers);
          const slots = [0, 1, 2, 3, 4, 5, 6].map(p => dayIdx * 7 + p);
          teacherUnavailable[tId] = Array.from(new Set([...(teacherUnavailable[tId] || []), ...slots]));
        }
      });

      // Atualiza imediatamente a grade visual com as regras do Wizard
      const optimizedSchedules = buildSchedulesFromConstraintRules(effectiveTeacherId, constraintRules);
      setSchedules(optimizedSchedules);
      if (optimizedSchedules.length > 2) {
        setCurrentClass(optimizedSchedules[2]);
      }

      if (aquila?.invoke) {
        const res = (await aquila.invoke('timetable:solve', {
          num_classes: numClasses,
          num_teachers: numTeachers,
          num_rooms: numRooms,
          days: 5,
          periods_per_day: 7,
          time_limit_sec: 0.85,
          teacher_unavailable: teacherUnavailable,
          requirements
        })) as { success?: boolean; data?: TimetableSolverSummary };

        if (res?.success && res.data) {
          setSolverResult(res.data);
          setSolverMode('solver');
          return;
        }
      }

      // Sem o solver Python (modo prévia/navegador): NÃO inventamos métricas.
      // A grade exibida vem de uma heurística simples de distribuição, não do SA+GLS.
      setSolverResult(null);
      setSolverMode('heuristic');
    } catch (err) {
      console.error('Erro ao executar solver SA+GLS:', err);
    } finally {
      setIsSolvingTimetable(false);
    }
  };

  const handleProcessAudio = async () => {
    if (!currentClass) return;
    const aquila = getAquilaBridge();
    if (!aquila?.invoke) return;

    try {
      const fileRes = (await aquila.invoke('dialog:openFile')) as {
        canceled?: boolean;
        filePaths?: string[];
      } | null;
      if (fileRes && !fileRes.canceled && fileRes.filePaths && fileRes.filePaths.length > 0) {
        const audioPath = fileRes.filePaths[0];
        setIsProcessingReport(true);
        const result = (await aquila.invoke('pedagogical:process-audio-report', {
          teacherId: user.id,
          classId: currentClass.classId,
          roomId: currentClass.roomId,
          audioPath
        })) as { success?: boolean; summary?: string; error?: string } | null;

        if (result && result.success) {
          alert(`Relatório processado com sucesso!\nResumo: ${result.summary}`);
        } else {
          alert('Falha ao processar áudio: ' + (result?.error || 'Erro interno da IA local.'));
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      alert('Erro ao processar áudio pedagógico: ' + msg);
    } finally {
      setIsProcessingReport(false);
    }
  };

  if (isLoading) {
    return (
      <div className="classroom-page">
        <div className="max-container text-center py-20 animate-pulse">
          <p className="filter-label">Buscando Grade Horária...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="classroom-page animate-fade-in">
      <div className="max-container">
        <header className="page-header">
          <div className="header-title-group">
            <button onClick={onBack} className="btn-nav-back" aria-label="Voltar para a dashboard">
              <ArrowLeft size={18} /> <span>Voltar</span>
            </button>
            <h1>
              <DoorOpen className="text-blue-500" size={32} /> Minha Grade Horária &amp; Solver SA+GLS
            </h1>
            <p>Visualização unificada de aulas, Wizard de Restrições Docentes e otimizador matemático (Simulated Annealing + Guided Local Search).</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setShowWizard(w => !w)}
              className="btn-action flex items-center gap-2"
              style={{
                background: showWizard ? 'rgba(16, 185, 129, 0.22)' : 'rgba(30, 41, 59, 0.85)',
                border: '1px solid rgba(52, 211, 153, 0.45)',
                padding: '10px 16px',
                borderRadius: 12,
                color: '#ecfdf5',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              <Sliders size={16} />
              <span>⚙️ Wizard de Restrições ({constraintRules.length} Regras)</span>
            </button>

            <button
              type="button"
              onClick={handleRunSaGlsSolver}
              disabled={isSolvingTimetable}
              className="btn-action flex items-center gap-2"
              style={{
                background: 'linear-gradient(135deg, #4f46e5, #06b6d4)',
                border: '1px solid rgba(255,255,255,0.2)',
                padding: '10px 18px',
                borderRadius: 12,
                color: '#fff',
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              <Sparkles size={18} />
              <span>
                {isSolvingTimetable
                  ? 'Otimizando Grade SA+GLS...'
                  : '⚡ Otimizar Grade SA+GLS (Zero Janelas)'}
              </span>
            </button>
          </div>
        </header>

        {/* WIZARD VISUAL DE RESTRIÇÕES E MATRIZ CURRICULAR (DEGRAU 10) */}
        {showWizard && (
          <div
            className="glass-card mb-6 animate-fade-in"
            style={{
              background: 'rgba(15, 23, 42, 0.92)',
              border: '1px solid rgba(56, 189, 248, 0.35)',
              borderRadius: 16,
              padding: '18px 22px',
              marginBottom: 22
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#f8fafc' }}>
                  ⚙️ Wizard de Restrições Docentes &amp; Matriz Curricular (Motor SA+GLS)
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: '#cbd5e1' }}>
                  Configure dias de folga externa, aulas geminadas (duplas) e laboratórios antes de recalcular a grade sem janelas.
                </p>
              </div>
              <button
                type="button"
                onClick={handleExportConstraintsCsv}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '7px 13px',
                  borderRadius: 8,
                  background: 'rgba(56, 189, 248, 0.15)',
                  border: '1px solid rgba(56, 189, 248, 0.4)',
                  color: '#bae6fd',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                <Download size={14} /> Exportar Regras (.csv)
              </button>
            </div>

            {/* Tabela de Regras Atuais */}
            <div style={{ overflowX: 'auto', marginBottom: 14 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', color: '#e2e8f0' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(148,163,184,0.2)', textAlign: 'left', color: '#94a3b8' }}>
                    <th style={{ padding: '8px' }}>Disciplina • Turma</th>
                    <th style={{ padding: '8px' }}>Série Completa</th>
                    <th style={{ padding: '8px' }}>Sala / Lab</th>
                    <th style={{ padding: '8px' }}>Aulas/Sem</th>
                    <th style={{ padding: '8px' }}>Restrição de Dia (Folga)</th>
                    <th style={{ padding: '8px' }}>Aulas Geminadas</th>
                    <th style={{ padding: '8px' }}>Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {constraintRules.map(rule => (
                    <tr key={rule.id} style={{ borderBottom: '1px solid rgba(148,163,184,0.1)' }}>
                      <td style={{ padding: '8px', fontWeight: 700, color: '#fff' }}>{rule.subject}</td>
                      <td style={{ padding: '8px' }}>{rule.className}</td>
                      <td style={{ padding: '8px', fontFamily: 'monospace', color: '#38bdf8' }}>
                        {rooms.find(r => r.id === rule.roomId)?.name || rule.roomId}
                      </td>
                      <td style={{ padding: '8px', fontFamily: 'monospace' }}>{rule.weeklyLessons}h</td>
                      <td style={{ padding: '8px', color: rule.forbiddenDay > 0 ? '#fde047' : '#94a3b8' }}>
                        {DAY_NAMES[rule.forbiddenDay] || 'Sem Restrição'}
                      </td>
                      <td style={{ padding: '8px' }}>
                        <span
                          style={{
                            padding: '2px 8px',
                            borderRadius: 6,
                            fontSize: '0.72rem',
                            background: rule.geminated ? 'rgba(16,185,129,0.2)' : 'rgba(100,116,139,0.2)',
                            color: rule.geminated ? '#6ee7b7' : '#cbd5e1'
                          }}
                        >
                          {rule.geminated ? 'Sim (Bloco Duplo)' : 'Não (Simples)'}
                        </span>
                      </td>
                      <td style={{ padding: '8px' }}>
                        <button
                          type="button"
                          onClick={() => handleRemoveConstraintRule(rule.id)}
                          style={{
                            background: 'rgba(239,68,68,0.15)',
                            border: '1px solid rgba(239,68,68,0.35)',
                            color: '#fca5a5',
                            borderRadius: 6,
                            padding: '4px 8px',
                            cursor: 'pointer'
                          }}
                          title="Remover regra"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Formulário de Nova Regra */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1.3fr 1.3fr 1fr 0.7fr 1.2fr auto auto',
                gap: 8,
                alignItems: 'center',
                background: 'rgba(2, 6, 23, 0.55)',
                padding: '10px 12px',
                borderRadius: 10,
                border: '1px solid rgba(148,163,184,0.16)'
              }}
            >
              <input
                type="text"
                placeholder="Ex: Química • 2º A"
                value={newSubject}
                onChange={e => setNewSubject(e.target.value)}
                style={{
                  background: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: 8,
                  padding: '7px 10px',
                  color: '#fff',
                  fontSize: '0.78rem'
                }}
              />
              <input
                type="text"
                placeholder="Série/Turma"
                value={newClassName}
                onChange={e => setNewClassName(e.target.value)}
                style={{
                  background: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: 8,
                  padding: '7px 10px',
                  color: '#fff',
                  fontSize: '0.78rem'
                }}
              />
              <select
                value={newRoomId}
                onChange={e => setNewRoomId(e.target.value)}
                style={{
                  background: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: 8,
                  padding: '7px 8px',
                  color: '#fff',
                  fontSize: '0.78rem'
                }}
              >
                {rooms.map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
              <input
                type="number"
                min={1}
                max={10}
                value={newWeeklyLessons}
                onChange={e => setNewWeeklyLessons(Number(e.target.value))}
                style={{
                  background: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: 8,
                  padding: '7px 8px',
                  color: '#fff',
                  fontSize: '0.78rem'
                }}
              />
              <select
                value={newForbiddenDay}
                onChange={e => setNewForbiddenDay(Number(e.target.value))}
                style={{
                  background: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: 8,
                  padding: '7px 8px',
                  color: '#fff',
                  fontSize: '0.78rem'
                }}
              >
                {Object.entries(DAY_NAMES).map(([k, label]) => (
                  <option key={k} value={Number(k)}>{label}</option>
                ))}
              </select>
              <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.76rem', color: '#cbd5e1', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={newGeminated}
                  onChange={e => setNewGeminated(e.target.checked)}
                />
                Geminar
              </label>
              <button
                type="button"
                onClick={handleAddConstraintRule}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  background: '#10b981',
                  border: 'none',
                  borderRadius: 8,
                  padding: '7px 12px',
                  color: '#022c22',
                  fontWeight: 800,
                  fontSize: '0.78rem',
                  cursor: 'pointer'
                }}
              >
                <Plus size={14} /> Adicionar
              </button>
            </div>
          </div>
        )}

        {solverMode === 'heuristic' && (
          <div
            role="status"
            style={{
              background: 'rgba(245, 158, 11, 0.12)',
              border: '1px solid rgba(245, 158, 11, 0.45)',
              borderRadius: 14,
              padding: '12px 18px',
              marginBottom: 20,
              color: '#fde68a',
              fontSize: '0.82rem'
            }}
          >
            <strong>⚠️ Prévia heurística — solver SA+GLS indisponível neste modo.</strong> A grade abaixo respeita os dias de folga e
            as aulas geminadas do Wizard, mas <strong>não foi otimizada</strong> e ainda não aplica a carga semanal exata. Rode no
            aplicativo desktop (com o motor Python ativo) para obter a grade otimizada e as métricas reais.
          </div>
        )}

        {solverResult && (
          <div
            className="glass-card p-4 mb-6 border-l-4 border-emerald-500"
            style={{
              background: 'rgba(16, 185, 129, 0.1)',
              borderRadius: 14,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 20px',
              marginBottom: 20
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <CheckCircle2 size={20} className="text-emerald-400" />
              <div>
                <div style={{ fontWeight: 800, color: '#ecfdf5', fontSize: '0.92rem' }}>
                  Métricas do Solver Híbrido SA+GLS ({constraintRules.length} requisitos e restrições de folga docente enviadas ao solver)
                </div>
                <div style={{ fontSize: '0.78rem', color: '#a7f3d0' }}>
                  Violações Hard (H1–H4): <strong>{solverResult.hard_violations}</strong> • Custo Soft (Janelas S1–S3):{' '}
                  <strong>{solverResult.soft_cost}</strong> • Iterações: <strong>{solverResult.iterations}</strong> • Tempo:{' '}
                  <strong>{solverResult.elapsed_ms} ms</strong>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentClass && (
          <div className="current-class-widget glass-card p-6 mb-8 border-l-4 border-blue-500 animate-slide-up">
            <div className="flex items-center justify-between">
              <div>
                <span className="badge badge-blue mb-2">AULA EM ANDAMENTO</span>
                <h2 className="text-2xl font-bold">{currentClass.className}</h2>
                <div className="flex gap-4 mt-2 text-sm text-gray-400">
                  <span className="flex items-center gap-1">
                    <Clock size={14} /> {currentClass.startTime} - {currentClass.endTime}
                  </span>
                  <span className="flex items-center gap-1">
                    <DoorOpen size={14} /> {currentClass.subject}
                  </span>
                </div>
              </div>
              <button
                onClick={handleProcessAudio}
                disabled={isProcessingReport}
                className={`btn-action ${isProcessingReport ? 'loading' : ''} flex items-center gap-2`}
              >
                {isProcessingReport ? <span className="animate-spin">🌀</span> : <Mic size={20} />}
                <span>{isProcessingReport ? 'Processando...' : 'Gravar Relatório de Aula'}</span>
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <div className="management-card h-full">
              <h3 className="section-title mb-4">
                <Clock className="icon-blue" size={20} /> Agenda de Hoje
              </h3>
              <div className="daily-agenda-list space-y-4">
                {schedules
                  .filter((s) => s.dayOfWeek === (new Date().getDay() || 7))
                  .sort((a, b) => a.startTime.localeCompare(b.startTime))
                  .map((item, idx) => (
                    <div
                      key={idx}
                      className={`agenda-item p-4 rounded-lg border border-white/5 ${
                        item.id === currentClass?.id
                          ? 'bg-blue-500/20 border-blue-500/50'
                          : 'bg-white/5'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="text-sm font-bold">
                            {item.startTime} - {item.endTime}
                          </div>
                          <div className="text-lg font-semibold mt-1">{item.subject}</div>
                          <div className="text-xs text-gray-400 mt-1">
                            Sala: {rooms.find((r) => r.id === item.roomId)?.name || 'N/A'}
                          </div>
                        </div>
                        {item.id === currentClass?.id && <span className="pulse-dot"></span>}
                      </div>
                    </div>
                  ))}
                {schedules.filter((s) => s.dayOfWeek === (new Date().getDay() || 7)).length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    Nenhuma aula agendada para hoje.
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="management-card h-full">
              <ScheduleGrid
                classId={''}
                rooms={rooms}
                schedules={schedules}
                teachers={teachers}
                readOnly={true}
                onSave={async () => {}}
                onDelete={async () => {}}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
