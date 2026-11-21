import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { PortalLayout } from '../layouts/PortalLayout';
import { isMvp01Active } from '../../config/mvpProfile';
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
import { PedagogicalPlaylistsManager } from '../components/PedagogicalPlaylistsManager';
import { ClassroomDashboard } from '../pages/ClassroomDashboard';
import { StudentAILab } from '../pages/StudentAILab';
import { StudentCosmeticsChamber } from '../components/StudentCosmeticsChamber';
import SovereignLibrarianUI from '../pages/SovereignLibrarianUI';
import { invokeMvp01, formatRoleLabel, Mvp01ContextData } from '../components/Mvp01SecretariatSuite';
import {
  Layers,
  Clock,
  Users,
  AlertCircle,
  CheckCircle2,
  Calendar,
  FileText,
  ChevronRight,
  AlertTriangle,
  LayoutGrid,
  Sparkles,
  BookOpen,
  FileSpreadsheet,
  Swords,
  Presentation,
  Camera,
  Flame,
  Printer,
  Tv,
  Gamepad2,
  CloudSync,
  Lock,
  Copy,
  Send,
  ShieldAlert,
  Save,
} from 'lucide-react';
import './TeacherPortal.css';

interface TeacherPortalProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  studentParams?: any;
  user?: any;
}

type SyncStateKey = 'LOCAL_SAVED' | 'PENDING_SYNC' | 'SERVER_CONFIRMED' | 'CONFLICT';

const SYNC_STATE_LABELS: Record<SyncStateKey, { label: string; color: string }> = {
  LOCAL_SAVED: { label: 'Salvo neste dispositivo', color: '#60A5FA' },
  PENDING_SYNC: { label: 'Aguardando sincronização', color: '#F59E0B' },
  SERVER_CONFIRMED: { label: 'Confirmado pelo servidor', color: '#10B981' },
  CONFLICT: { label: 'Conflito que exige revisão', color: '#EF4444' },
};

interface TeacherOverviewData {
  portal: 'teacher';
  school: { id: string; name: string } | null;
  academicPeriods: any[];
  assignedClasses: Array<{ classId: string; subject: string }>;
  classes: any[];
  students: any[];
  attendanceSheets: any[];
  attendanceRecords?: any[];
  gradeEntries: any[];
  tasks: any[];
  incidents: any[];
}

function makeIdempotencyKey(prefix: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

const PremiumDashboard: React.FC<{ onNavigate: (page: string) => void; user?: any }> = ({
  onNavigate,
}) => {
  const mvp01 = isMvp01Active();
  const [toolCategory, setToolCategory] = useState<'gestao' | 'aulas' | 'bncc' | 'todos'>('gestao');
  const [mvpSubTab, setMvpSubTab] = useState<'resumo' | 'chamada' | 'notas' | 'diario' | 'ocorrencias'>('resumo');

  const [mvpContext, setMvpContext] = useState<Mvp01ContextData | null>(null);
  const [mvpOverview, setMvpOverview] = useState<TeacherOverviewData | null>(null);
  const [mvpError, setMvpError] = useState<string | null>(null);
  const [syncState, setSyncState] = useState<SyncStateKey>('SERVER_CONFIRMED');
  const [actionMsg, setActionMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // Seleção de turma/disciplina atribuída
  const [selectedAssignmentIdx, setSelectedAssignmentIdx] = useState<number>(0);

  // Chamada Rápida
  const [lessonDate, setLessonDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [lessonTopic, setLessonTopic] = useState<string>('');
  const [homeworkNote, setHomeworkNote] = useState<string>('');
  const [correctionReason, setCorrectionReason] = useState<string>('');
  const [savingAttendance, setSavingAttendance] = useState<boolean>(false);
  const [attendanceIdempotencyKey, setAttendanceIdempotencyKey] = useState<string>('');
  const [attendanceMap, setAttendanceMap] = useState<
    Record<string, 'PRESENT' | 'ABSENT' | 'LATE' | 'JUSTIFIED'>
  >({});

  // Notas
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>('');
  const [gradeDrafts, setGradeDrafts] = useState<
    Record<
      string,
      {
        entryState: 'PENDING' | 'GRADED' | 'EXEMPT';
        n1: string;
        n2: string;
        n3: string;
        recovery: string;
        published: boolean;
      }
    >
  >({});

  // Tarefas / Diário com cópia como rascunho
  const [taskClassId, setTaskClassId] = useState<string>('');
  const [taskSubject, setTaskSubject] = useState<string>('');
  const [taskTitle, setTaskTitle] = useState<string>('');
  const [taskDesc, setTaskDesc] = useState<string>('');
  const [taskDueDate, setTaskDueDate] = useState<string>('');
  const [copySourceTask, setCopySourceTask] = useState<any | null>(null);

  // Ocorrência / Elogio
  const [incStudentId, setIncStudentId] = useState<string>('');
  const [incCategory, setIncCategory] = useState<'PEDAGOGICAL' | 'PRAISE' | 'DISCIPLINARY' | 'HEALTH_CARE'>('PEDAGOGICAL');
  const [incTitle, setIncTitle] = useState<string>('');
  const [incMode, setIncMode] = useState<'INTERNAL_ONLY' | 'FOR_REVIEW'>('INTERNAL_ONLY');
  const [incInternalNotes, setIncInternalNotes] = useState<string>('');
  const [incSuggestedSummary, setIncSuggestedSummary] = useState<string>('');

  const loadTeacherMvp = useCallback(async () => {
    if (!mvp01) return;
    setMvpError(null);
    const ctxRes = await invokeMvp01<Mvp01ContextData>('getContext');
    if (ctxRes.ok) {
      setMvpContext(ctxRes.data);
    }
    const ovRes = await invokeMvp01<TeacherOverviewData>('getPortalOverview', {
      portal: 'teacher',
    });
    if (ovRes.ok) {
      setMvpOverview(ovRes.data);
      const sheets = ovRes.data.attendanceSheets || [];
      if (sheets.some(s => s.sync_state === 'CONFLICT')) {
        setSyncState('CONFLICT');
      } else if (sheets.some(s => s.sync_state === 'PENDING_SYNC')) {
        setSyncState('PENDING_SYNC');
      } else if (sheets.some(s => s.sync_state === 'LOCAL_SAVED')) {
        setSyncState('LOCAL_SAVED');
      } else {
        setSyncState('SERVER_CONFIRMED');
      }
      const openP =
        (ovRes.data.academicPeriods || []).find(p => p.status === 'OPEN') ||
        ovRes.data.academicPeriods?.[0];
      if (openP && !selectedPeriodId) {
        setSelectedPeriodId(openP.id);
      }
      if (!taskClassId && ovRes.data.assignedClasses?.[0]) {
        setTaskClassId(ovRes.data.assignedClasses[0].classId);
        setTaskSubject(ovRes.data.assignedClasses[0].subject);
      }
      if (!incStudentId && ovRes.data.students?.[0]) {
        setIncStudentId(ovRes.data.students[0].id);
      }
    } else if (ovRes.code !== 'BRIDGE_UNAVAILABLE') {
      setMvpError(ovRes.error);
    }
  }, [mvp01, selectedPeriodId, taskClassId, incStudentId]);

  useEffect(() => {
    loadTeacherMvp();
  }, [loadTeacherMvp]);

  const handleSwitchMembership = async (membershipId: string) => {
    const res = await invokeMvp01<Mvp01ContextData>('switchContext', { membershipId });
    if (res.ok) {
      setMvpContext(res.data);
      await loadTeacherMvp();
    } else {
      setMvpError(res.error);
    }
  };

  const assignedClasses = mvpOverview?.assignedClasses || [];
  const activeAssignment = assignedClasses[selectedAssignmentIdx] || assignedClasses[0] || null;
  const activeClassObj = useMemo(
    () => (mvpOverview?.classes || []).find(c => c.id === activeAssignment?.classId),
    [mvpOverview?.classes, activeAssignment]
  );
  const classStudents = useMemo(() => {
    if (!mvpOverview?.students) return [];
    if (!activeAssignment) return mvpOverview.students;
    return mvpOverview.students.filter(s => s.class_id === activeAssignment.classId);
  }, [mvpOverview?.students, activeAssignment]);

  const matchingExistingSheet = useMemo(() => {
    if (!activeAssignment || !mvpOverview?.attendanceSheets) return null;
    return (
      mvpOverview.attendanceSheets.find(
        sh =>
          sh.class_id === activeAssignment.classId &&
          sh.subject === activeAssignment.subject &&
          sh.lesson_date === lessonDate
      ) || null
    );
  }, [mvpOverview?.attendanceSheets, activeAssignment, lessonDate]);

  const prevAttendanceLessonKeyRef = useRef<string>('');
  const prevHydratedSheetIdRef = useRef<string>('');

  // Rehidrata ou reseta mapa de chamada ao trocar turma, disciplina, data ou carregar folha salva
  useEffect(() => {
    const lessonKey = activeAssignment
      ? `${activeAssignment.classId}::${activeAssignment.subject}::${lessonDate}`
      : '';
    const lessonChanged = prevAttendanceLessonKeyRef.current !== lessonKey;
    const sheetId = matchingExistingSheet?.id || '';
    const sheetChanged = prevHydratedSheetIdRef.current !== sheetId;

    const rawRecords: any[] = Array.isArray((matchingExistingSheet as any)?.records)
      ? (matchingExistingSheet as any).records
      : Array.isArray(mvpOverview?.attendanceRecords) && sheetId
      ? mvpOverview.attendanceRecords.filter((r: any) => r.sheet_id === sheetId)
      : [];

    const validStatuses = new Set(['PRESENT', 'ABSENT', 'LATE', 'JUSTIFIED']);

    setAttendanceMap(prev => {
      const next: Record<string, 'PRESENT' | 'ABSENT' | 'LATE' | 'JUSTIFIED'> = {};

      if (rawRecords.length > 0) {
        const byStudent = new Map<string, 'PRESENT' | 'ABSENT' | 'LATE' | 'JUSTIFIED'>();
        for (const rec of rawRecords) {
          const sid = rec.student_id || rec.studentId;
          if (sid && validStatuses.has(rec.status)) {
            byStudent.set(sid, rec.status);
          }
        }
        for (const s of classStudents) {
          next[s.id] = byStudent.get(s.id) || 'PRESENT';
        }
        return next;
      }

      if (lessonChanged && activeAssignment) {
        let draftStatuses: Record<string, any> | null = null;
        try {
          const draftKey = `aquila_att_draft_${activeAssignment.classId}_${activeAssignment.subject}_${lessonDate}`;
          const rawDraft = window.localStorage.getItem(draftKey);
          if (rawDraft) {
            const parsed = JSON.parse(rawDraft);
            if (parsed && typeof parsed.attendanceMap === 'object' && parsed.attendanceMap) {
              draftStatuses = parsed.attendanceMap;
            }
          }
        } catch {
          // ignore localStorage read failures
        }
        for (const s of classStudents) {
          const candidate = draftStatuses?.[s.id];
          next[s.id] = validStatuses.has(candidate) ? candidate : 'PRESENT';
        }
        return next;
      }

      for (const s of classStudents) {
        next[s.id] = prev[s.id] || 'PRESENT';
      }
      return next;
    });

    if (lessonChanged) {
      let draftTopic = '';
      let draftHomework = '';
      if (activeAssignment) {
        try {
          const draftKey = `aquila_att_draft_${activeAssignment.classId}_${activeAssignment.subject}_${lessonDate}`;
          const rawDraft = window.localStorage.getItem(draftKey);
          if (rawDraft) {
            const parsed = JSON.parse(rawDraft);
            if (typeof parsed?.lessonTopic === 'string') draftTopic = parsed.lessonTopic;
            if (typeof parsed?.homeworkNote === 'string') draftHomework = parsed.homeworkNote;
          }
        } catch {
          // ignore localStorage read failures
        }
      }
      setLessonTopic(matchingExistingSheet?.lesson_topic || draftTopic);
      setHomeworkNote(matchingExistingSheet?.homework_note || draftHomework);
      setCorrectionReason('');
    } else if (sheetChanged && matchingExistingSheet) {
      if (matchingExistingSheet.lesson_topic && !lessonTopic) {
        setLessonTopic(matchingExistingSheet.lesson_topic);
      }
      if (matchingExistingSheet.homework_note && !homeworkNote) {
        setHomeworkNote(matchingExistingSheet.homework_note);
      }
    }

    prevAttendanceLessonKeyRef.current = lessonKey;
    prevHydratedSheetIdRef.current = sheetId;
  }, [
    activeAssignment?.classId,
    activeAssignment?.subject,
    lessonDate,
    matchingExistingSheet?.id,
    classStudents,
    mvpOverview?.attendanceRecords,
  ]);

  const attendanceBatchFingerprint = useMemo(() => {
    if (!activeAssignment || classStudents.length === 0) return '';
    const recordPart = classStudents
      .map(s => `${s.id}:${attendanceMap[s.id] || 'PRESENT'}`)
      .join('|');
    return `${activeAssignment.classId}::${activeAssignment.subject}::${lessonDate}::${recordPart}`;
  }, [activeAssignment?.classId, activeAssignment?.subject, lessonDate, classStudents, attendanceMap]);

  // Chave de idempotência estável por lote: gerada ao alterar aula/registros e limpa somente após confirmação no servidor
  useEffect(() => {
    if (!attendanceBatchFingerprint) {
      setAttendanceIdempotencyKey('');
      return;
    }
    setAttendanceIdempotencyKey(makeIdempotencyKey('att'));
  }, [attendanceBatchFingerprint]);

  const attendanceClosedPeriod = useMemo(() => {
    return (
      (mvpOverview?.academicPeriods || []).find(
        p =>
          p.status === 'CLOSED' &&
          p.start_date &&
          p.end_date &&
          p.start_date <= lessonDate &&
          p.end_date >= lessonDate
      ) || null
    );
  }, [mvpOverview?.academicPeriods, lessonDate]);

  const selectedPeriod = useMemo(
    () => (mvpOverview?.academicPeriods || []).find(p => p.id === selectedPeriodId) || null,
    [mvpOverview?.academicPeriods, selectedPeriodId]
  );
  const isGradePeriodClosed = selectedPeriod?.status === 'CLOSED';

  const handleSaveLocalAttendanceDraft = (targetState: 'LOCAL_SAVED' | 'PENDING_SYNC') => {
    if (!activeAssignment) return;
    const key = `aquila_att_draft_${activeAssignment.classId}_${activeAssignment.subject}_${lessonDate}`;
    try {
      window.localStorage.setItem(
        key,
        JSON.stringify({ lessonTopic, homeworkNote, attendanceMap, savedAt: new Date().toISOString() })
      );
      setSyncState(targetState);
      setActionMsg({
        type: 'ok',
        text: `Chamada registrada com estado "${SYNC_STATE_LABELS[targetState].label}".`,
      });
    } catch {
      setActionMsg({ type: 'err', text: 'Não foi possível salvar rascunho local neste navegador.' });
    }
  };

  const handleConfirmAttendance = async () => {
    if (savingAttendance || !activeAssignment || classStudents.length === 0) return;
    if (attendanceClosedPeriod) {
      setActionMsg({
        type: 'err',
        text: `Período "${attendanceClosedPeriod.name}" fechado para lançamentos em ${lessonDate}.`,
      });
      return;
    }
    if (matchingExistingSheet && correctionReason.trim().length < 3) {
      setActionMsg({
        type: 'err',
        text: 'Chamada já existente para esta data: informe motivo da retificação (mín. 3 caracteres).',
      });
      return;
    }

    const batchIdempotencyKey = attendanceIdempotencyKey || makeIdempotencyKey('att');
    if (!attendanceIdempotencyKey) {
      setAttendanceIdempotencyKey(batchIdempotencyKey);
    }

    setSavingAttendance(true);
    setActionMsg(null);
    setSyncState('PENDING_SYNC');

    try {
      const res = await invokeMvp01('recordAttendanceSheet', {
        sheetId: matchingExistingSheet?.id,
        classId: activeAssignment.classId,
        subject: activeAssignment.subject,
        lessonDate,
        lessonTopic: lessonTopic.trim() || undefined,
        homeworkNote: homeworkNote.trim() || undefined,
        expectedVersion: matchingExistingSheet?.version,
        syncState: 'SERVER_CONFIRMED',
        correctionReason: correctionReason.trim() || undefined,
        finalized: true,
        idempotencyKey: batchIdempotencyKey,
        records: classStudents.map(s => ({
          enrollmentId: s.enrollment_id,
          studentId: s.id,
          status: attendanceMap[s.id] || 'PRESENT',
          correctionReason: correctionReason.trim() || undefined,
        })),
      });

      if (!res.ok) {
        if (res.code === 'VERSION_CONFLICT' || res.code === 'SYNC_CONFLICT') {
          setSyncState('CONFLICT');
        } else {
          setSyncState('LOCAL_SAVED');
        }
        setActionMsg({ type: 'err', text: res.error });
        return;
      }

      setAttendanceIdempotencyKey('');
      setSyncState('SERVER_CONFIRMED');
      setCorrectionReason('');
      try {
        window.localStorage.removeItem(
          `aquila_att_draft_${activeAssignment.classId}_${activeAssignment.subject}_${lessonDate}`
        );
      } catch {
        // ignore localStorage cleanup errors
      }
      setActionMsg({
        type: 'ok',
        text: `Chamada confirmada no servidor (v${res.data?.version || 1}) • ${res.data?.recordsCount || classStudents.length} aluno(s).`,
      });
      await loadTeacherMvp();
    } finally {
      setSavingAttendance(false);
    }
  };

  const getGradeDraftKey = (studentId: string) =>
    `${activeAssignment?.classId || ''}:${activeAssignment?.subject || ''}:${selectedPeriodId}:${studentId}`;

  const getStudentGradeState = (studentId: string) => {
    const draftKey = getGradeDraftKey(studentId);
    if (gradeDrafts[draftKey]) return gradeDrafts[draftKey];
    const existing = (mvpOverview?.gradeEntries || []).find(
      g =>
        g.student_id === studentId &&
        g.class_id === activeAssignment?.classId &&
        g.subject === activeAssignment?.subject &&
        g.period_id === selectedPeriodId
    );
    return {
      entryState: (existing?.entry_state || 'PENDING') as 'PENDING' | 'GRADED' | 'EXEMPT',
      n1: existing?.n1 !== null && existing?.n1 !== undefined ? String(existing.n1) : '',
      n2: existing?.n2 !== null && existing?.n2 !== undefined ? String(existing.n2) : '',
      n3: existing?.n3 !== null && existing?.n3 !== undefined ? String(existing.n3) : '',
      recovery:
        existing?.recovery !== null && existing?.recovery !== undefined
          ? String(existing.recovery)
          : '',
      published: Boolean(existing?.published === 1),
    };
  };

  const updateStudentGradeDraft = (
    studentId: string,
    patch: Partial<{
      entryState: 'PENDING' | 'GRADED' | 'EXEMPT';
      n1: string;
      n2: string;
      n3: string;
      recovery: string;
      published: boolean;
    }>
  ) => {
    const draftKey = getGradeDraftKey(studentId);
    const current = getStudentGradeState(studentId);
    setGradeDrafts(prev => ({
      ...prev,
      [draftKey]: { ...current, ...patch },
    }));
  };

  const handleSaveStudentGrade = async (student: any) => {
    if (!activeAssignment || !selectedPeriodId) return;
    if (isGradePeriodClosed) {
      setActionMsg({
        type: 'err',
        text: `Período "${selectedPeriod?.name}" está FECHADO. Reabertura somente pela Secretaria/Coordenação.`,
      });
      return;
    }

    const draftKey = getGradeDraftKey(student.id);
    const draft = getStudentGradeState(student.id);
    const parseNum = (v: string): number | null => {
      if (draft.entryState !== 'GRADED') return null;
      if (v.trim() === '') return null;
      const n = Number(v.replace(',', '.'));
      return Number.isFinite(n) ? n : null;
    };

    const existing = (mvpOverview?.gradeEntries || []).find(
      g =>
        g.student_id === student.id &&
        g.class_id === activeAssignment.classId &&
        g.subject === activeAssignment.subject &&
        g.period_id === selectedPeriodId
    );

    setActionMsg(null);
    const res = await invokeMvp01('recordGradeEntry', {
      enrollmentId: student.enrollment_id,
      studentId: student.id,
      classId: activeAssignment.classId,
      subject: activeAssignment.subject,
      periodId: selectedPeriodId,
      n1: parseNum(draft.n1),
      n2: parseNum(draft.n2),
      n3: parseNum(draft.n3),
      recovery: parseNum(draft.recovery),
      entryState: draft.entryState,
      published: draft.published,
      expectedVersion: existing?.version,
    });

    if (!res.ok) {
      if (res.code === 'VERSION_CONFLICT') setSyncState('CONFLICT');
      setActionMsg({ type: 'err', text: res.error });
      return;
    }

    setActionMsg({
      type: 'ok',
      text:
        draft.entryState === 'PENDING'
          ? `Situação "Pendente (—)" salva para ${student.full_name} (não convertida em 0.0).`
          : draft.entryState === 'EXEMPT'
          ? `Situação "Dispensado" salva para ${student.full_name}.`
          : `Nota salva para ${student.full_name}: Média ${res.data?.final_average ?? '—'}.`,
    });
    await loadTeacherMvp();
    setGradeDrafts(prev => {
      if (!(draftKey in prev)) return prev;
      const next = { ...prev };
      delete next[draftKey];
      return next;
    });
  };

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskClassId || !taskTitle.trim()) return;
    setActionMsg(null);
    const res = await invokeMvp01('saveTask', {
      classId: taskClassId,
      subject: taskSubject.trim() || undefined,
      title: taskTitle.trim(),
      description: taskDesc.trim() || undefined,
      dueDate: taskDueDate || undefined,
    });
    if (!res.ok) {
      setActionMsg({ type: 'err', text: res.error });
      return;
    }
    setTaskTitle('');
    setTaskDesc('');
    setCopySourceTask(null);
    setActionMsg({ type: 'ok', text: `Registro/Tarefa "${res.data?.title}" salvo para a turma.` });
    await loadTeacherMvp();
  };

  const handlePrepareCopyAsDraft = (sourceTask: any) => {
    const otherClasses = assignedClasses.filter(a => a.classId !== sourceTask.class_id);
    const target = otherClasses[0]?.classId || sourceTask.class_id;
    setCopySourceTask(sourceTask);
    setTaskClassId(target);
    setTaskSubject(otherClasses[0]?.subject || sourceTask.subject || '');
    setTaskTitle(`[Rascunho Copiado] ${sourceTask.title}`);
    setTaskDesc(sourceTask.description || '');
    setTaskDueDate(sourceTask.due_date || '');
    setActionMsg({
      type: 'ok',
      text: `Rascunho copiado de "${sourceTask.title}". Escolha a turma de destino e salve quando estiver pronto.`,
    });
  };

  const handleCreateTeacherIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!incStudentId) {
      setActionMsg({ type: 'err', text: 'Selecione um estudante antes de salvar o registro.' });
      return;
    }
    if (!incTitle.trim()) {
      setActionMsg({ type: 'err', text: 'Informe o título da ocorrência ou elogio.' });
      return;
    }
    if (incMode === 'FOR_REVIEW' && incSuggestedSummary.trim().length < 3) {
      setActionMsg({
        type: 'err',
        text: 'Informe uma sugestão de resumo para revisão da Coordenação (mín. 3 caracteres).',
      });
      return;
    }

    setActionMsg(null);
    const studentObj = (mvpOverview?.students || []).find(s => s.id === incStudentId);
    const res = await invokeMvp01('createIncident', {
      studentId: incStudentId,
      classId: studentObj?.class_id || activeAssignment?.classId || null,
      category: incCategory,
      title: incTitle.trim(),
      internalNotes:
        incMode === 'FOR_REVIEW'
          ? `[ENVIADO P/ REVISÃO DE PUBLICAÇÃO PELA COORDENAÇÃO] ${incInternalNotes.trim()}`.trim()
          : incInternalNotes.trim() || null,
      publishedSummary: incMode === 'FOR_REVIEW' ? incSuggestedSummary.trim() : null,
      publishedToFamily: false,
    });

    if (!res.ok) {
      setActionMsg({ type: 'err', text: res.error });
      return;
    }

    setIncTitle('');
    setIncInternalNotes('');
    setIncSuggestedSummary('');
    setActionMsg({
      type: 'ok',
      text:
        incMode === 'INTERNAL_ONLY'
          ? `Registro interno salvo (${res.data?.id}). Não enviado à família.`
          : `Registro salvo e encaminhado para revisão/publicação explícita pela Coordenação (${res.data?.id}).`,
    });
    await loadTeacherMvp();
  };

  const fallbackSchedule = [
    { id: 1, time: '07:00 - 07:50', subject: 'Matemática', className: '3º A', room: 'SALA 12', current: false },
    { id: 2, time: '07:50 - 08:40', subject: 'Matemática', className: '3º A', room: 'SALA 12', current: false },
    { id: 3, time: '08:40 - 09:30', subject: 'Física Aplicada', className: '2º B', room: 'SALA 08', current: true },
  ];

  const scheduleData =
    mvp01 && assignedClasses.length > 0
      ? assignedClasses.map((ac, idx) => {
          const cls = (mvpOverview?.classes || []).find(c => c.id === ac.classId);
          return {
            id: `${ac.classId}-${ac.subject}-${idx}`,
            time: idx === 0 ? '07:30 - 09:10' : '09:30 - 11:10',
            subject: ac.subject,
            className: cls?.name || ac.classId,
            room: cls?.room || 'Sala atribuída',
            current: idx === 0,
            assignmentIdx: idx,
          };
        })
      : fallbackSchedule.map((item, idx) => ({ ...item, assignmentIdx: idx }));

  const attentionStudents = [
    { id: 'std-1', name: 'ALUNO SINTETICO 001', className: '2º B • Cadeira B3', alert: 'Acompanhamento Formativo', photo: './avatars/face-1.jpg' },
    { id: 'std-2', name: 'ALUNO SINTETICO 002', className: '3º A • Cadeira A2', alert: 'Dúvida Recorrente', photo: './avatars/face-2.jpg' },
  ];

  const pendingTasks = (mvpOverview?.tasks || []).length > 0
    ? (mvpOverview?.tasks || []).map(t => ({
        id: t.id,
        desc: `${t.title} (${t.subject || 'Turma'})`,
        date: t.due_date || 'Sem prazo',
        priority: 'Média',
        target: 'tasks',
      }))
    : [
        { id: 1, desc: 'Diário de classe pendente de confirmação', date: 'HOJE', priority: 'Alta', target: 'diary' },
        { id: 2, desc: 'Lançamento de notas do bimestre aberto', date: 'AMANHÃ', priority: 'Média', target: 'gradebook' },
      ];

  const upcomingEvents = [
    { id: 1, date: '19/10', title: 'Alinhamento de Coordenação', type: 'REUNIÃO' },
    { id: 2, date: '24/10', title: 'Conselho de Classe', type: 'CONSELHO' },
  ];

  const syncMeta = SYNC_STATE_LABELS[syncState];

  return (
    <div className="tp-cockpit">
      {/* Top Command Bar */}
      <div className="tp-command-bar">
        <div className="tp-command-top-row">
          <div className="tp-command-title-group">
            <span className="tp-command-badge">
              {mvp01 ? 'MVP 0.1 • PORTAL DO PROFESSOR' : 'COCKPIT DOCENTE'}
            </span>
            <h1 className="tp-command-title">
              {mvp01
                ? `${mvpOverview?.school?.name || 'Docência'} — Chamada, Notas, Diário & Ocorrências`
                : 'Gestão de Sala & Telemetria Pedagógica'}
            </h1>
            {mvp01 && (
              <span
                className="tp-command-badge"
                style={{
                  borderColor: syncMeta.color,
                  color: syncMeta.color,
                  background: `${syncMeta.color}18`,
                }}
              >
                <CloudSync size={11} style={{ display: 'inline', marginRight: 4 }} />
                {syncMeta.label}
              </span>
            )}
          </div>

          {!mvp01 && (
            <div className="tp-category-pills" role="tablist" aria-label="Filtrar ferramentas por categoria">
              <button
                type="button"
                className={`tp-cat-pill ${toolCategory === 'gestao' ? 'active' : ''}`}
                onClick={() => setToolCategory('gestao')}
              >
                <LayoutGrid size={13} />
                <span>Gestão de Sala (5)</span>
              </button>
              <button
                type="button"
                className={`tp-cat-pill ${toolCategory === 'aulas' ? 'active' : ''}`}
                onClick={() => setToolCategory('aulas')}
              >
                <BookOpen size={13} />
                <span>Aulas & Provas (7)</span>
              </button>
              <button
                type="button"
                className={`tp-cat-pill ${toolCategory === 'bncc' ? 'active' : ''}`}
                onClick={() => setToolCategory('bncc')}
              >
                <Sparkles size={13} />
                <span>BNCC & Gamificação (6)</span>
              </button>
              <button
                type="button"
                className={`tp-cat-pill ${toolCategory === 'todos' ? 'active' : ''}`}
                onClick={() => setToolCategory('todos')}
              >
                <Layers size={13} />
                <span>Todas (18)</span>
              </button>
            </div>
          )}
        </div>

        <div className="tp-command-actions">
          {mvp01 && mvpContext && mvpContext.availableMemberships.length > 1 && (
            <select
              aria-label="Alternar papel institucional"
              className="tp-action-btn"
              value={mvpContext.membershipId}
              onChange={e => handleSwitchMembership(e.target.value)}
            >
              {mvpContext.availableMemberships.map(m => (
                <option key={m.membershipId} value={m.membershipId} style={{ background: '#0f172a' }}>
                  Papel: {formatRoleLabel(m.role)}
                </option>
              ))}
            </select>
          )}
          {mvp01 ? (
            <>
              <button
                className={`tp-action-btn ${mvpSubTab === 'resumo' ? 'primary' : ''}`}
                onClick={() => setMvpSubTab('resumo')}
              >
                <LayoutGrid size={14} />
                <span>Visão Geral</span>
              </button>
              <button
                className={`tp-action-btn ${mvpSubTab === 'chamada' ? 'primary' : ''}`}
                onClick={() => setMvpSubTab('chamada')}
              >
                <Users size={14} />
                <span>Chamada Rápida</span>
              </button>
              <button
                className={`tp-action-btn ${mvpSubTab === 'notas' ? 'primary' : ''}`}
                onClick={() => setMvpSubTab('notas')}
              >
                <FileSpreadsheet size={14} />
                <span>Lançar Notas</span>
              </button>
              <button
                className={`tp-action-btn ${mvpSubTab === 'diario' ? 'primary' : ''}`}
                onClick={() => setMvpSubTab('diario')}
              >
                <BookOpen size={14} />
                <span>Diário &amp; Tarefas</span>
              </button>
              <button
                className={`tp-action-btn ${mvpSubTab === 'ocorrencias' ? 'primary' : ''}`}
                onClick={() => setMvpSubTab('ocorrencias')}
              >
                <ShieldAlert size={14} />
                <span>Ocorrência / Elogio</span>
              </button>
              <button className="tp-action-btn" onClick={() => onNavigate('attendance')}>
                <Users size={14} />
                <span>Tela Completa Chamada</span>
              </button>
              <button className="tp-action-btn" onClick={() => onNavigate('gradebook')}>
                <FileSpreadsheet size={14} />
                <span>Planilha Completa</span>
              </button>
              <button className="tp-action-btn" onClick={() => onNavigate('seating-intelligence')}>
                <LayoutGrid size={14} />
                <span>Mapa de Sala</span>
              </button>
            </>
          ) : (
            <>
              {(toolCategory === 'gestao' || toolCategory === 'todos') && (
                <>
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
                  <button className="tp-action-btn" onClick={() => onNavigate('omr-scanner')}>
                    <Camera size={14} />
                    <span>Gabarito OMR</span>
                  </button>
                </>
              )}

              {(toolCategory === 'aulas' || toolCategory === 'todos') && (
                <>
                  <button className="tp-action-btn primary" onClick={() => onNavigate('playlists-gamemaker')}>
                    <Gamepad2 size={14} />
                    <span>Playlists & Game Maker</span>
                  </button>
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
                  <button className="tp-action-btn primary" onClick={() => onNavigate('activity-factory')}>
                    <Sparkles size={14} />
                    <span>Fábrica de Atividades</span>
                  </button>
                  <button className="tp-action-btn primary" onClick={() => onNavigate('knowledge-canvas')}>
                    <Sparkles size={14} />
                    <span>Canvas Áquila</span>
                  </button>
                  <button className="tp-action-btn primary" onClick={() => onNavigate('ai-studio')}>
                    <Sparkles size={14} />
                    <span>Estúdio Pedagógico IA</span>
                  </button>
                </>
              )}

              {(toolCategory === 'bncc' || toolCategory === 'todos') && (
                <>
                  <button className="tp-action-btn primary" onClick={() => onNavigate('arena')}>
                    <Swords size={14} />
                    <span>Arena Batalha</span>
                  </button>
                  <button className="tp-action-btn" onClick={() => onNavigate('bncc-heatmap')}>
                    <Flame size={14} />
                    <span>Mapa de Calor BNCC</span>
                  </button>
                  <button className="tp-action-btn" onClick={() => onNavigate('mastery-chamber')}>
                    <Sparkles size={14} />
                    <span>Câmara de Maestria</span>
                  </button>
                  <button className="tp-action-btn" onClick={() => onNavigate('essay-lab')}>
                    <FileText size={14} />
                    <span>Redação 1000</span>
                  </button>
                  <button className="tp-action-btn" onClick={() => onNavigate('skill-tree')}>
                    <BookOpen size={14} />
                    <span>Árvore BNCC</span>
                  </button>
                  <button className="tp-action-btn" onClick={() => onNavigate('daily-report')}>
                    <FileText size={14} />
                    <span>Relatório IA</span>
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {mvp01 && (mvpError || actionMsg) && (
        <div
          className={`p-2.5 rounded-xl text-xs border ${
            mvpError || actionMsg?.type === 'err'
              ? 'bg-red-500/10 border-red-500/35 text-red-200'
              : 'bg-emerald-500/10 border-emerald-500/35 text-emerald-200'
          }`}
        >
          {mvpError || actionMsg?.text}
        </div>
      )}

      {/* 4-Column Telemetry KPI Strip */}
      <section className="tp-kpi-grid">
        <div className="tp-kpi-pod">
          <div className="tp-kpi-info">
            <span className="tp-kpi-label">TURMAS ATRIBUÍDAS</span>
            <span className="tp-kpi-value">
              {mvp01 && mvpOverview ? String(assignedClasses.length).padStart(2, '0') : '06 AULAS'}
            </span>
            <span className="tp-kpi-sub">
              {mvp01 && activeAssignment
                ? `Ativa: ${activeClassObj?.name || activeAssignment.classId} (${activeAssignment.subject})`
                : 'Aula em andamento'}
            </span>
          </div>
          <div className="tp-kpi-icon" style={{ background: 'rgba(59, 130, 246, 0.14)', color: '#60A5FA' }}>
            <Clock size={18} />
          </div>
        </div>

        <div className="tp-kpi-pod">
          <div className="tp-kpi-info">
            <span className="tp-kpi-label">ALUNOS NAS TURMAS</span>
            <span className="tp-kpi-value">
              {mvp01 && mvpOverview ? mvpOverview.students.length : 187}
            </span>
            <span className="tp-kpi-sub">
              {mvp01 && mvpOverview
                ? `${mvpOverview.classes.length} turma(s) vinculadas`
                : '3 turmas vinculadas'}
            </span>
          </div>
          <div className="tp-kpi-icon" style={{ background: 'rgba(0, 240, 255, 0.12)', color: '#00F0FF' }}>
            <Users size={18} />
          </div>
        </div>

        <div className="tp-kpi-pod">
          <div className="tp-kpi-info">
            <span className="tp-kpi-label">ESTADO DE SINCRONIZAÇÃO</span>
            <span className="tp-kpi-value" style={{ color: syncMeta.color, fontSize: 13 }}>
              {syncMeta.label}
            </span>
            <span className="tp-kpi-sub">
              {(mvpOverview?.attendanceSheets || []).length} folha(s) de chamada registradas
            </span>
          </div>
          <div className="tp-kpi-icon" style={{ background: 'rgba(16, 185, 129, 0.14)', color: '#10B981' }}>
            <CheckCircle2 size={18} />
          </div>
        </div>

        <div className="tp-kpi-pod">
          <div className="tp-kpi-info">
            <span className="tp-kpi-label">TAREFAS &amp; PERÍODOS</span>
            <span className="tp-kpi-value" style={{ color: '#F59E0B' }}>
              {mvp01 && mvpOverview
                ? `${mvpOverview.tasks.length} TAREFAS`
                : '03 ITENS'}
            </span>
            <span className="tp-kpi-sub">
              {mvp01 && selectedPeriod
                ? `${selectedPeriod.name}: ${selectedPeriod.status === 'CLOSED' ? 'FECHADO' : 'ABERTO'}`
                : 'Diário de aula ativo'}
            </span>
          </div>
          <div className="tp-kpi-icon" style={{ background: 'rgba(245, 158, 11, 0.14)', color: '#F59E0B' }}>
            <AlertCircle size={18} />
          </div>
        </div>
      </section>

      {/* PAINÉIS MVP 0.1 INTERATIVOS */}
      {mvp01 && mvpSubTab === 'chamada' && (
        <section className="tp-panel">
          <div className="tp-panel-header">
            <h2 className="tp-panel-title">
              <Users size={14} color="#10B981" />
              <span>Chamada Digital Rápida • {syncMeta.label}</span>
            </h2>
            <div className="flex flex-wrap gap-2 items-center text-xs">
              <select
                value={selectedAssignmentIdx}
                onChange={e => setSelectedAssignmentIdx(Number(e.target.value))}
                className="bg-slate-900 border border-white/15 rounded px-2 py-1 text-white"
              >
                {assignedClasses.map((ac, idx) => (
                  <option key={`${ac.classId}-${ac.subject}`} value={idx}>
                    {(mvpOverview?.classes || []).find(c => c.id === ac.classId)?.name || ac.classId} • {ac.subject}
                  </option>
                ))}
              </select>
              <input
                type="date"
                value={lessonDate}
                onChange={e => setLessonDate(e.target.value)}
                className="bg-slate-900 border border-white/15 rounded px-2 py-1 text-white"
              />
            </div>
          </div>

          {attendanceClosedPeriod && (
            <div className="p-3 mb-2 rounded-xl bg-red-500/15 border border-red-500/35 text-xs text-red-200 flex items-center gap-2">
              <Lock size={14} />
              <span>
                Período <strong>{attendanceClosedPeriod.name}</strong> está FECHADO para lançamentos nesta data.
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3 text-xs">
            <input
              type="text"
              value={lessonTopic}
              onChange={e => setLessonTopic(e.target.value)}
              placeholder="Conteúdo / Tema da aula"
              className="bg-black/40 border border-white/15 rounded-lg px-3 py-2 text-white"
            />
            <input
              type="text"
              value={homeworkNote}
              onChange={e => setHomeworkNote(e.target.value)}
              placeholder="Encaminhamento / Tarefa para casa (opcional)"
              className="bg-black/40 border border-white/15 rounded-lg px-3 py-2 text-white"
            />
          </div>

          {matchingExistingSheet && (
            <div className="mb-3 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-col gap-1.5 text-xs">
              <span className="text-amber-300 font-semibold">
                Chamada já registrada para esta aula (v{matchingExistingSheet.version}). Para retificar, informe o motivo obrigatório:
              </span>
              <input
                type="text"
                value={correctionReason}
                onChange={e => setCorrectionReason(e.target.value)}
                placeholder="Motivo da correção (mín. 3 caracteres) *"
                className="bg-black/50 border border-white/15 rounded-lg px-3 py-1.5 text-white"
              />
            </div>
          )}

          <div className="flex flex-col gap-1 mb-3">
            {classStudents.length === 0 ? (
              <p className="text-xs text-slate-400">Nenhum estudante ativo vinculado a esta turma.</p>
            ) : (
              classStudents.map((st, idx) => {
                const stStatus = attendanceMap[st.id] || 'PRESENT';
                return (
                  <div
                    key={st.id}
                    className="tp-att-row"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono text-[11px] text-slate-400 w-7">#{idx + 1}</span>
                      <span className="font-bold text-sm text-white truncate">{st.full_name}</span>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {(
                        [
                          { id: 'PRESENT', label: 'Presente', kind: 'present' },
                          { id: 'ABSENT', label: 'Falta', kind: 'absent' },
                          { id: 'LATE', label: 'Atraso', kind: 'late' },
                          { id: 'JUSTIFIED', label: 'Justif.', kind: 'justified' },
                        ] as const
                      ).map(opt => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() =>
                            setAttendanceMap(prev => ({ ...prev, [st.id]: opt.id }))
                          }
                          aria-pressed={stStatus === opt.id}
                          className={`tp-att-btn ${opt.kind} ${stStatus === opt.id ? 'active' : ''}`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handleSaveLocalAttendanceDraft('LOCAL_SAVED')}
              className="tp-action-btn"
            >
              <Save size={13} /> Salvar neste dispositivo
            </button>
            <button
              type="button"
              onClick={() => handleSaveLocalAttendanceDraft('PENDING_SYNC')}
              className="tp-action-btn"
            >
              <Clock size={13} /> Marcar Aguardando Sincronização
            </button>
            <button
              type="button"
              disabled={savingAttendance || Boolean(attendanceClosedPeriod) || classStudents.length === 0}
              onClick={handleConfirmAttendance}
              className="tp-action-btn primary"
            >
              <CloudSync size={13} /> {savingAttendance ? 'Confirmando...' : 'Confirmar no Servidor'}
            </button>
          </div>
        </section>
      )}

      {mvp01 && mvpSubTab === 'notas' && (
        <section className="tp-panel">
          <div className="tp-panel-header">
            <h2 className="tp-panel-title">
              <FileSpreadsheet size={14} color="#60A5FA" />
              <span>Lançamento de Notas (Pendente ≠ 0.0 ≠ Dispensado)</span>
            </h2>
            <div className="flex flex-wrap gap-2 text-xs">
              <select
                value={selectedAssignmentIdx}
                onChange={e => setSelectedAssignmentIdx(Number(e.target.value))}
                className="bg-slate-900 border border-white/15 rounded px-2 py-1 text-white"
              >
                {assignedClasses.map((ac, idx) => (
                  <option key={`${ac.classId}-${ac.subject}`} value={idx}>
                    {(mvpOverview?.classes || []).find(c => c.id === ac.classId)?.name || ac.classId} • {ac.subject}
                  </option>
                ))}
              </select>
              <select
                value={selectedPeriodId}
                onChange={e => setSelectedPeriodId(e.target.value)}
                className="bg-slate-900 border border-white/15 rounded px-2 py-1 text-white"
              >
                {(mvpOverview?.academicPeriods || []).map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.status === 'CLOSED' ? 'FECHADO' : 'ABERTO'})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {isGradePeriodClosed && (
            <div className="p-3 mb-3 rounded-xl bg-red-500/15 border border-red-500/35 text-xs text-red-200 flex items-center gap-2">
              <Lock size={14} />
              <span>
                <strong>Período Fechado:</strong> o período {selectedPeriod?.name} está bloqueado para lançamentos e edições de notas.
              </span>
            </div>
          )}

          <div className="flex flex-col gap-1">
            {classStudents.map(st => {
              const g = getStudentGradeState(st.id);
              return (
                <div
                  key={st.id}
                  className="py-1.5 px-3 rounded-lg bg-black/35 border border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs"
                >
                  <div className="min-w-[160px]">
                    <div className="font-bold text-white">{st.full_name}</div>
                    <div className="text-[11px] text-slate-400">
                      Estado:{' '}
                      {g.entryState === 'PENDING'
                        ? 'Pendente (—)'
                        : g.entryState === 'EXEMPT'
                        ? 'Dispensado'
                        : 'Nota lançada (0.0 – 10.0)'}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      disabled={isGradePeriodClosed}
                      value={g.entryState}
                      onChange={e =>
                        updateStudentGradeDraft(st.id, {
                          entryState: e.target.value as 'PENDING' | 'GRADED' | 'EXEMPT',
                        })
                      }
                      className="bg-slate-900 border border-white/15 rounded px-2 py-1 text-white"
                    >
                      <option value="PENDING">Pendente (—)</option>
                      <option value="GRADED">Avaliado (0.0 – 10.0)</option>
                      <option value="EXEMPT">Dispensado</option>
                    </select>

                    {g.entryState === 'GRADED' && (
                      <>
                        <input
                          type="number"
                          step="0.1"
                          min={0}
                          max={10}
                          disabled={isGradePeriodClosed}
                          value={g.n1}
                          onChange={e => updateStudentGradeDraft(st.id, { n1: e.target.value })}
                          placeholder="N1"
                          className="w-16 bg-slate-900 border border-white/15 rounded px-2 py-1 text-white"
                        />
                        <input
                          type="number"
                          step="0.1"
                          min={0}
                          max={10}
                          disabled={isGradePeriodClosed}
                          value={g.n2}
                          onChange={e => updateStudentGradeDraft(st.id, { n2: e.target.value })}
                          placeholder="N2"
                          className="w-16 bg-slate-900 border border-white/15 rounded px-2 py-1 text-white"
                        />
                        <input
                          type="number"
                          step="0.1"
                          min={0}
                          max={10}
                          disabled={isGradePeriodClosed}
                          value={g.n3}
                          onChange={e => updateStudentGradeDraft(st.id, { n3: e.target.value })}
                          placeholder="N3"
                          className="w-16 bg-slate-900 border border-white/15 rounded px-2 py-1 text-white"
                        />
                        <input
                          type="number"
                          step="0.1"
                          min={0}
                          max={10}
                          disabled={isGradePeriodClosed}
                          value={g.recovery}
                          onChange={e => updateStudentGradeDraft(st.id, { recovery: e.target.value })}
                          placeholder="Rec"
                          className="w-16 bg-slate-900 border border-white/15 rounded px-2 py-1 text-white"
                        />
                      </>
                    )}

                    <label className="flex items-center gap-1 text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        disabled={isGradePeriodClosed}
                        checked={g.published}
                        onChange={e => updateStudentGradeDraft(st.id, { published: e.target.checked })}
                      />
                      <span>Publicar</span>
                    </label>

                    <button
                      type="button"
                      disabled={isGradePeriodClosed}
                      onClick={() => handleSaveStudentGrade(st)}
                      className="tp-mini-btn accent"
                    >
                      Salvar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {mvp01 && mvpSubTab === 'diario' && (
        <div className="tp-main-grid">
          <form onSubmit={handleSaveTask} className="tp-panel flex flex-col gap-3">
            <div className="tp-panel-header">
              <h2 className="tp-panel-title">
                <BookOpen size={14} color="#00F0FF" />
                <span>
                  {copySourceTask
                    ? 'Salvar Rascunho Copiado para Outra Turma'
                    : 'Registro Rápido de Diário & Tarefa'}
                </span>
              </h2>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <select
                value={
                  assignedClasses.some(
                    ac => ac.classId === taskClassId && ac.subject === taskSubject
                  )
                    ? `${taskClassId}::${taskSubject}`
                    : assignedClasses.find(ac => ac.classId === taskClassId)
                    ? `${taskClassId}::${assignedClasses.find(ac => ac.classId === taskClassId)!.subject}`
                    : ''
                }
                onChange={e => {
                  const [nextClassId = '', ...rest] = e.target.value.split('::');
                  const nextSubject = rest.join('::');
                  setTaskClassId(nextClassId);
                  setTaskSubject(nextSubject);
                }}
                className="bg-slate-900 border border-white/15 rounded-lg px-2.5 py-2 text-white"
              >
                {assignedClasses.map(ac => (
                  <option
                    key={`${ac.classId}::${ac.subject}`}
                    value={`${ac.classId}::${ac.subject}`}
                  >
                    {(mvpOverview?.classes || []).find(c => c.id === ac.classId)?.name || ac.classId} — {ac.subject}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={taskSubject}
                onChange={e => setTaskSubject(e.target.value)}
                placeholder="Disciplina"
                className="bg-slate-900 border border-white/15 rounded-lg px-2.5 py-2 text-white"
              />
            </div>
            <input
              type="text"
              required
              value={taskTitle}
              onChange={e => setTaskTitle(e.target.value)}
              placeholder="Título do registro de diário / tarefa *"
              className="bg-slate-900 border border-white/15 rounded-lg px-3 py-2 text-xs text-white"
            />
            <textarea
              rows={3}
              value={taskDesc}
              onChange={e => setTaskDesc(e.target.value)}
              placeholder="Descrição das atividades, páginas ou orientações..."
              className="bg-slate-900 border border-white/15 rounded-lg px-3 py-2 text-xs text-white"
            />
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <input
                type="date"
                value={taskDueDate}
                onChange={e => setTaskDueDate(e.target.value)}
                className="bg-slate-900 border border-white/15 rounded-lg px-2.5 py-1.5 text-white"
              />
              <button type="submit" className="tp-action-btn primary">
                <Save size={13} /> Salvar Diário / Tarefa
              </button>
            </div>
          </form>

          <section className="tp-panel flex flex-col gap-3">
            <div className="tp-panel-header">
              <h2 className="tp-panel-title">
                <Copy size={14} color="#F59E0B" />
                <span>Atividades Salvas &amp; Cópia como Rascunho</span>
              </h2>
            </div>
            {(mvpOverview?.tasks || []).length === 0 ? (
              <p className="text-xs text-slate-400">Nenhuma tarefa registrada para suas turmas.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {(mvpOverview?.tasks || []).map(t => (
                  <div key={t.id} className="p-3 rounded-xl bg-black/35 border border-white/10 flex flex-col gap-1.5 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-white">{t.title}</span>
                      <span className="text-slate-400">{t.class_id} • {t.subject || 'Geral'}</span>
                    </div>
                    {t.description && <p className="text-slate-300">{t.description}</p>}
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] text-slate-400">Prazo: {t.due_date || '—'}</span>
                      <button
                        type="button"
                        onClick={() => handlePrepareCopyAsDraft(t)}
                        className="tp-mini-btn"
                      >
                        <Copy size={11} /> Copiar como Rascunho para outra Turma
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {mvp01 && mvpSubTab === 'ocorrencias' && (
        <div className="tp-main-grid">
          <form onSubmit={handleCreateTeacherIncident} className="tp-panel flex flex-col gap-3 p-4">
            <div className="tp-panel-header">
              <h2 className="tp-panel-title">
                <ShieldAlert size={14} color="#F59E0B" />
                <span>Registrar Ocorrência ou Elogio</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <select
                aria-label="Estudante"
                value={incStudentId}
                onChange={e => setIncStudentId(e.target.value)}
                className="bg-slate-900 border border-white/15 rounded-lg px-3 py-2.5 text-white"
              >
                {(mvpOverview?.students || []).length === 0 ? (
                  <option value="">Nenhum estudante vinculado</option>
                ) : (
                  [...(mvpOverview?.students || [])]
                    .sort((a, b) => String(a.full_name || '').localeCompare(String(b.full_name || ''), 'pt-BR'))
                    .map(s => {
                      const clsName = (mvpOverview?.classes || []).find(c => c.id === s.class_id)?.name || s.class_id;
                      return (
                        <option key={s.id} value={s.id}>
                          {s.full_name} — {clsName}
                        </option>
                      );
                    })
                )}
              </select>
              <select
                aria-label="Categoria"
                value={incCategory}
                onChange={e => setIncCategory(e.target.value as any)}
                className="bg-slate-900 border border-white/15 rounded-lg px-3 py-2.5 text-white"
              >
                <option value="PEDAGOGICAL">Pedagógica</option>
                <option value="PRAISE">Elogio / Destaque Positivo</option>
                <option value="DISCIPLINARY">Convivência / Disciplinar</option>
                <option value="HEALTH_CARE">Cuidado / Saúde</option>
              </select>
            </div>

            <input
              type="text"
              required
              value={incTitle}
              onChange={e => setIncTitle(e.target.value)}
              placeholder="Título objetivo da ocorrência ou elogio *"
              className="bg-slate-900 border border-white/15 rounded-lg px-3 py-2.5 text-xs text-white"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs">
              <label
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition ${
                  incMode === 'INTERNAL_ONLY'
                    ? 'bg-sky-500/15 border-sky-400/50 text-white'
                    : 'bg-black/30 border-white/10 text-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="incMode"
                  checked={incMode === 'INTERNAL_ONLY'}
                  onChange={() => setIncMode('INTERNAL_ONLY')}
                />
                <span>Registro Interno da Equipe (não enviado à família)</span>
              </label>
              <label
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition ${
                  incMode === 'FOR_REVIEW'
                    ? 'bg-amber-500/15 border-amber-400/50 text-white'
                    : 'bg-black/30 border-white/10 text-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="incMode"
                  checked={incMode === 'FOR_REVIEW'}
                  onChange={() => setIncMode('FOR_REVIEW')}
                />
                <span>Enviar para Revisão / Publicação (Coordenação)</span>
              </label>
            </div>

            <textarea
              rows={3}
              value={incInternalNotes}
              onChange={e => setIncInternalNotes(e.target.value)}
              placeholder="Nota interna da equipe (contexto pedagógico reservado)"
              className="bg-slate-900 border border-white/15 rounded-lg px-3 py-2.5 text-xs text-white"
            />

            {incMode === 'FOR_REVIEW' && (
              <textarea
                rows={2}
                value={incSuggestedSummary}
                onChange={e => setIncSuggestedSummary(e.target.value)}
                placeholder="Sugestão de resumo para a família (passará por revisão e publicação da Coordenação)"
                className="bg-sky-950/40 border border-sky-500/35 rounded-lg px-3 py-2.5 text-xs text-white"
              />
            )}

            <button
              type="submit"
              className="tp-action-btn primary"
              style={{ alignSelf: 'flex-start', height: 36, padding: '0 16px' }}
            >
              <Send size={14} /> Salvar Registro
            </button>
          </form>

          <section className="tp-panel flex flex-col gap-2 p-4">
            <div className="tp-panel-header">
              <h2 className="tp-panel-title">
                <FileText size={14} color="#60A5FA" />
                <span>Ocorrências &amp; Elogios Recentes ({(mvpOverview?.incidents || []).length})</span>
              </h2>
            </div>
            {(mvpOverview?.incidents || []).length === 0 ? (
              <p className="text-xs text-slate-400 py-4">Nenhum registro lançado até o momento.</p>
            ) : (
              (mvpOverview?.incidents || []).map(inc => {
                const stName =
                  (mvpOverview?.students || []).find(s => s.id === inc.student_id)?.full_name || inc.student_id;
                return (
                  <div key={inc.id} className="p-2.5 rounded-xl bg-black/35 border border-white/10 text-xs flex flex-col gap-1">
                    <div className="flex justify-between gap-2">
                      <strong className="text-white">{inc.title}</strong>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-white/10 text-slate-200 whitespace-nowrap">
                        {inc.published_to_family === 1 ? 'Publicado à Família' : 'Interno / Em Revisão'}
                      </span>
                    </div>
                    <span className="text-slate-400">
                      Estudante: {stName} • Categoria: {inc.category} • Status: {inc.status}
                    </span>
                  </div>
                );
              })
            )}
          </section>
        </div>
      )}

      {/* Main 2-Column High-Density Bento Grid (Visão Geral / Padrão) */}
      {(!mvp01 || mvpSubTab === 'resumo') && (
        <div className="tp-main-grid">
          <section className="tp-panel">
            <div className="tp-panel-header">
              <h2 className="tp-panel-title">
                <Clock size={14} color="#00F0FF" />
                <span>Cronograma Operacional &amp; Turmas Atribuídas</span>
              </h2>
              <span className="tp-panel-tag">{scheduleData.length} ALOCAÇÃO(ÕES)</span>
            </div>

            <div className="tp-schedule-list">
              {scheduleData.map(slot => (
                <div key={slot.id} className={`tp-schedule-row ${slot.current ? 'current' : ''}`}>
                  <div className="tp-slot-left">
                    <span className="tp-slot-time">{slot.time}</span>
                    <div className="tp-slot-details">
                      <span className="tp-slot-subject">{slot.subject} • {slot.className}</span>
                      <span className="tp-slot-room">{slot.room}</span>
                      {slot.current && <span className="tp-slot-live-pill">TURMA ATIVA</span>}
                    </div>
                  </div>
                  <div className="tp-slot-actions">
                    <button
                      className="tp-mini-btn"
                      onClick={() => {
                        setSelectedAssignmentIdx(slot.assignmentIdx);
                        if (mvp01) setMvpSubTab('chamada');
                        else onNavigate('attendance');
                      }}
                    >
                      <Users size={12} />
                      <span>Chamada</span>
                    </button>
                    <button
                      className="tp-mini-btn accent"
                      onClick={() => {
                        setSelectedAssignmentIdx(slot.assignmentIdx);
                        if (mvp01) setMvpSubTab('notas');
                        else onNavigate('gradebook');
                      }}
                    >
                      <FileSpreadsheet size={12} />
                      <span>Notas</span>
                    </button>
                    <button
                      className="tp-mini-btn"
                      onClick={() => {
                        if (mvp01) setMvpSubTab('diario');
                        else onNavigate('diary');
                      }}
                    >
                      <FileText size={12} />
                      <span>Diário</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <div className="tp-right-stack">
            <section className="tp-panel">
              <div className="tp-panel-header">
                <h2 className="tp-panel-title">
                  <Users size={14} color="#00F0FF" />
                  <span>{mvp01 ? 'Estudantes das Turmas Atribuídas' : 'Radar de Atenção em Sala (Neuro-IA)'}</span>
                </h2>
                <button className="tp-mini-btn" onClick={() => onNavigate('seating-intelligence')}>
                  Ver Sala Completa
                </button>
              </div>
              {mvp01 && mvpOverview ? (
                <div className="tp-compact-list">
                  {mvpOverview.students.slice(0, 6).map(st => (
                    <div key={st.id} className="tp-compact-item">
                      <div className="tp-compact-item-left">
                        <Users size={14} color="#60A5FA" />
                        <div>
                          <div className="tp-compact-text">{st.full_name}</div>
                          <div className="tp-compact-sub">
                            Turma {(mvpOverview.classes || []).find(c => c.id === st.class_id)?.name || st.class_id}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="tp-mini-btn"
                        onClick={() => {
                          setIncStudentId(st.id);
                          setMvpSubTab('ocorrencias');
                        }}
                      >
                        Registrar
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="tp-student-attention-grid">
                  {attentionStudents.map(student => (
                    <div
                      key={student.id}
                      className="tp-student-card"
                      onClick={() => onNavigate('seating-intelligence')}
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
              )}
            </section>

            <section className="tp-panel">
              <div className="tp-panel-header">
                <h2 className="tp-panel-title">
                  <AlertTriangle size={14} color="#F59E0B" />
                  <span>Pendências &amp; Próximos Eventos</span>
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
                            task.priority === 'Alta' ? '#EF4444' : task.priority === 'Média' ? '#F59E0B' : '#3B82F6',
                        }}
                      />
                      <div>
                        <div className="tp-compact-text">{task.desc}</div>
                        <div className="tp-compact-sub">
                          PRAZO: {task.date} • PRIORIDADE {task.priority.toUpperCase()}
                        </div>
                      </div>
                    </div>
                    <button
                      className="tp-mini-btn"
                      onClick={() => (mvp01 ? setMvpSubTab('diario') : onNavigate(task.target))}
                    >
                      <span>Abrir</span>
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
      )}
    </div>
  );
};

export const TeacherPortal: React.FC<TeacherPortalProps> = ({ currentPage, onNavigate, studentParams, user }) => {
  const renderTeacherPage = () => {
    const onBack = () => onNavigate('teacher-dashboard');

    switch (currentPage) {
      case 'dashboard':
      case 'teacher-dashboard':
        return <PremiumDashboard onNavigate={onNavigate} user={user} />;
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
        return (
          <SeatingIntelligence
            onNavigate={onNavigate}
            onBack={() => onNavigate('teacher-dashboard')}
            user={user}
            showFeedback={true}
          />
        );
      case 'mastery-chamber':
        return <StudentMasteryChamber studentId={studentParams?.studentId} onBack={onBack} />;
      case 'knowledge-canvas':
      case 'albus-canvas':
        return <StudentMasteryChamber studentId={studentParams?.studentId} initialMode="canvas" onBack={onBack} />;
      case 'youtube-radar':
      case 'video-finder':
        return (
          <YouTubePedagogicalFinder
            onBack={onBack}
            onSelectVideoForLessonPlan={video => {
              (window as any).showToast?.(
                `Vídeo "${video.title}" vinculado com sucesso ao seu Plano de Aula!`,
                'success'
              );
            }}
          />
        );
      case 'ai-studio':
        return <TeacherAIStudio onBack={onBack} />;
      case 'activity-factory':
        return <ActivityFactory onBack={onBack} />;
      case 'exam-foundry':
      case 'banco-provas':
        return <ExamPaperFoundry onNavigate={onNavigate} onBack={onBack} />;
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
        return <OmrScannerUI onNavigate={onNavigate} onBack={onBack} />;
      case 'bncc-heatmap':
      case 'heatmap':
        return <BNCCProficiencyHeatmap onBack={onBack} />;
      case 'playlists-gamemaker':
      case 'playlists':
      case 'gamemaker':
        return <PedagogicalPlaylistsManager onBack={onBack} onNavigate={onNavigate} user={user} />;
      case 'classroom-dashboard':
        return <ClassroomDashboard user={user} />;
      case 'ai-lab':
        return (
          <StudentAILab
            studentId={studentParams?.studentId || 'demo_student_001'}
            classId={studentParams?.classId || user?.classId}
            onBack={onBack}
          />
        );
      case 'cosmetics-chamber':
      case 'battle-banner':
      case 'skins-shop':
        return <StudentCosmeticsChamber studentId={studentParams?.studentId || user?.id} onBack={onBack} />;
      case 'sovereign-library':
        return <SovereignLibrarianUI />;
      default:
        return <PremiumDashboard onNavigate={onNavigate} user={user} />;
    }
  };

  return (
    <PortalLayout
      portalName="Portal do Professor"
      themeColor="#3b82f6"
      onNavigate={onNavigate}
      hideHeader={currentPage === 'seating-intelligence'}
    >
      {renderTeacherPage()}
    </PortalLayout>
  );
};

export default TeacherPortal;
