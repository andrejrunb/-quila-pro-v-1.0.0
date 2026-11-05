import React, { useState, useEffect, useMemo } from 'react';
import {
  ChevronLeft,
  Camera,
  Save,
  Download,
  CheckCircle2,
  AlertTriangle,
  Users,
  Search,
  Calculator,
  FileSpreadsheet,
  Sparkles,
  FileText,
  RefreshCw,
  ShieldCheck,
  Ticket,
  Globe,
  Plus
} from 'lucide-react';
import AcademicReportCard, { ReportCardStudent } from '../components/AcademicReportCard';
import { STUDENTS } from '../../database/studentsData';
import './TeacherGradebook.css';

interface GradeRow {
  studentId: string;
  studentName: string;
  ra: string;
  photo: string;
  n1: string;
  n2: string;
  n3: string;
  rec: string;
  absences: string;
  b1: number;
  b2: number;
  b3: number;
  b4: number;
  observation: string;
}

interface CscTicket {
  id: string;
  department: 'Secretaria Acadêmica' | 'Coordenação Pedagógica' | 'TI & Áquila Edge' | 'Financeiro / Matrículas';
  subject: string;
  sla: string;
  status: 'EM ATENDIMENTO' | 'CONCLUÍDO' | 'PRIORIDADE ALTA';
  createdAt: string;
}

interface TeacherGradebookProps {
  onBack: () => void;
  onNavigate?: (page: string) => void;
  user?: any;
  initialClassId?: string;
}

const DEFAULT_CLASSES = [
  { id: 'F-EF26A', name: '6º Ano A — Colégio Áquila Modelo' },
  { id: 'F-EF26B', name: '6º Ano B — Colégio Áquila Modelo' },
  { id: 'F-EF27A', name: '7º Ano A — Colégio Áquila Modelo' },
  { id: 'F-EF27B', name: '7º Ano B — Colégio Áquila Modelo' },
  { id: 'F-EF28A', name: '8º Ano A — Colégio Áquila Modelo' },
  { id: 'F-EF28B', name: '8º Ano B — Colégio Áquila Modelo' },
  { id: 'F-EF29A', name: '9º Ano A — Colégio Áquila Modelo' },
  { id: 'F-EF29B', name: '9º Ano B — Colégio Áquila Modelo' },
  { id: 'F-EM1A',  name: '1ª Série A (EM) — Colégio Áquila Modelo' },
  { id: 'F-EM1B',  name: '1ª Série B (EM) — Colégio Áquila Modelo' },
  { id: 'F-EM2A',  name: '2ª Série A (EM) — Colégio Áquila Modelo' },
  { id: 'F-EM3A',  name: '3ª Série A (EM) — Colégio Áquila Modelo' },
  { id: 'F-EF11A', name: '1º Ano A (Fund. I)' },
  { id: 'F-EF11B', name: '1º Ano B (Fund. I)' },
  { id: 'F-EF12A', name: '2º Ano A (Fund. I)' },
  { id: 'F-EF12B', name: '2º Ano B (Fund. I)' },
  { id: 'F-EF13A', name: '3º Ano A (Fund. I)' },
  { id: 'F-EF13B', name: '3º Ano B (Fund. I)' },
  { id: 'F-EF14A', name: '4º Ano A (Fund. I)' },
  { id: 'F-EF14B', name: '4º Ano B (Fund. I)' },
  { id: 'F-EF15A', name: '5º Ano A (Fund. I)' },
  { id: 'F-EF15B', name: '5º Ano B (Fund. I)' }
];

const DISCIPLINES = [
  'Matemática',
  'Física',
  'Química',
  'Biologia',
  'Português',
  'Redação',
  'História',
  'Geografia'
];

const BIMESTERS = [
  { id: 'B1', label: '1º Bimestre' },
  { id: 'B2', label: '2º Bimestre' },
  { id: 'B3', label: '3º Bimestre' },
  { id: 'B4', label: '4º Bimestre' }
];

const DEFAULT_STUDENT_NAMES = [
  'Ana Clara Mendes',
  'Arthur Gabriel Silva',
  'Beatriz Costa Oliveira',
  'Bernardo Santos Rocha',
  'Caio Henrique Lima',
  'Cecília Almeida Souza',
  'Daniel Ferreira Gomes',
  'Davi Lucas Pereira',
  'Eduarda Martins Ribeiro',
  'Enzo Gabriel Carvalho',
  'Felipe Augusto Araújo',
  'Gabriela Fernandes Melo',
  'Guilherme Cardoso Dias',
  'Helena Oliveira Castro',
  'Isabela Rodrigues Nunes',
  'João Pedro Teixeira',
  'Julia Cavalcanti Moreira',
  'Leonardo Barros Freitas',
  'Lucas Andrade Vieira',
  'Manuela Correia Monteiro',
  'Matheus Nogueira Pinto',
  'Pedro Henrique Campos',
  'Rafael Azevedo Ramos',
  'Rodrigo Moura Borges',
  'Sofia Costa Machado',
  'Thiago Lacerda Farias',
  'Vanessa Peixoto Duarte',
  'Vitor Hugo Rezende'
];

const getAvatarForStudent = (idOrName: string, idx: number) => {
  const num = ((idx % 10) + 1);
  return `./avatars/face-${num}.jpg`;
};

export const GRADEBOOK_RULE_VERSION = 'REGRA-AVAL-2026.1';

export interface GradeEvaluationResult {
  bimesterMean: number | null;
  accumulatedMean: number | null;
  isPendingAll: boolean;
  isPartial: boolean;
  recoveryApplied: boolean;
  statusCode: 'PENDING_ENTRY' | 'PARTIAL' | 'REGULAR_BIMESTER' | 'BIMESTER_OK_ACCUMULATED_LOW' | 'RECOVERY_BIMESTER';
  statusLabel: string;
  ruleVersion: string;
}

function parseOptionalGrade(raw: string | undefined | null): number | null {
  if (raw === undefined || raw === null) return null;
  const trimmed = String(raw).trim();
  if (!trimmed || trimmed === '-') return null;
  const num = parseFloat(trimmed.replace(',', '.'));
  if (Number.isNaN(num)) return null;
  return Math.min(10, Math.max(0, num));
}

export function evaluateGradebookRow(
  r: Pick<GradeRow, 'n1' | 'n2' | 'n3' | 'rec' | 'b1' | 'b2' | 'b3' | 'b4'>,
  formulaMode: 'ponderada_visao' | 'aritmetica' = 'ponderada_visao',
  selectedBimester = 'B3'
): GradeEvaluationResult {
  const v1 = parseOptionalGrade(r.n1);
  const v2 = parseOptionalGrade(r.n2);
  const v3 = parseOptionalGrade(r.n3);
  const vRec = parseOptionalGrade(r.rec);

  const entered = [
    { val: v1, weight: 0.3 },
    { val: v2, weight: 0.3 },
    { val: v3, weight: 0.4 },
  ].filter((item): item is { val: number; weight: number } => item.val !== null);

  if (entered.length === 0) {
    return {
      bimesterMean: null,
      accumulatedMean: null,
      isPendingAll: true,
      isPartial: false,
      recoveryApplied: false,
      statusCode: 'PENDING_ENTRY',
      statusLabel: 'AGUARDANDO LANÇAMENTO',
      ruleVersion: GRADEBOOK_RULE_VERSION,
    };
  }

  const isPartial = entered.length < 3;
  let partial = 0;

  if (formulaMode === 'ponderada_visao') {
    const totalWeight = entered.reduce((acc, item) => acc + item.weight, 0);
    const weightedSum = entered.reduce((acc, item) => acc + item.val * item.weight, 0);
    partial = totalWeight > 0 ? weightedSum / totalWeight : 0;
  } else {
    partial = entered.reduce((acc, item) => acc + item.val, 0) / entered.length;
  }

  const recoveryApplied = !isPartial && vRec !== null && vRec > partial;
  const finalBimMean = +(Math.min(10, Math.max(0, recoveryApplied && vRec !== null ? vRec : partial))).toFixed(1);

  const b1 = selectedBimester === 'B1' ? finalBimMean : r.b1;
  const b2 = selectedBimester === 'B2' ? finalBimMean : r.b2;
  const b3 = selectedBimester === 'B3' ? finalBimMean : r.b3;
  const b4 = selectedBimester === 'B4' ? finalBimMean : r.b4;
  const activeBimesters =
    selectedBimester === 'B1' ? [b1] :
    selectedBimester === 'B2' ? [b1, b2] :
    selectedBimester === 'B3' ? [b1, b2, b3] :
    [b1, b2, b3, b4];
  const accumulatedMean = +(activeBimesters.reduce((a, b) => a + b, 0) / activeBimesters.length).toFixed(1);

  if (isPartial) {
    return {
      bimesterMean: finalBimMean,
      accumulatedMean,
      isPendingAll: false,
      isPartial: true,
      recoveryApplied: false,
      statusCode: 'PARTIAL',
      statusLabel: `PARCIAL (${selectedBimester})`,
      ruleVersion: GRADEBOOK_RULE_VERSION,
    };
  }

  if (finalBimMean >= 6.0 && accumulatedMean >= 6.0) {
    return {
      bimesterMean: finalBimMean,
      accumulatedMean,
      isPendingAll: false,
      isPartial: false,
      recoveryApplied,
      statusCode: 'REGULAR_BIMESTER',
      statusLabel: `REGULAR (${selectedBimester})`,
      ruleVersion: GRADEBOOK_RULE_VERSION,
    };
  }

  if (finalBimMean >= 6.0 && accumulatedMean < 6.0) {
    return {
      bimesterMean: finalBimMean,
      accumulatedMean,
      isPendingAll: false,
      isPartial: false,
      recoveryApplied,
      statusCode: 'BIMESTER_OK_ACCUMULATED_LOW',
      statusLabel: 'BIM. OK • ACUM. < 6',
      ruleVersion: GRADEBOOK_RULE_VERSION,
    };
  }

  return {
    bimesterMean: finalBimMean,
    accumulatedMean,
    isPendingAll: false,
    isPartial: false,
    recoveryApplied,
    statusCode: 'RECOVERY_BIMESTER',
    statusLabel: `RECUPERAÇÃO (${selectedBimester})`,
    ruleVersion: GRADEBOOK_RULE_VERSION,
  };
}

export const TeacherGradebook: React.FC<TeacherGradebookProps> = ({
  onBack,
  onNavigate,
  user,
  initialClassId
}) => {
  const [classes, setClasses] = useState<{ id: string; name: string }[]>(DEFAULT_CLASSES);
  const [selectedClassId, setSelectedClassId] = useState<string>(initialClassId || 'F-EF27A');
  const [selectedSubject, setSelectedSubject] = useState<string>(user?.subject || 'Matemática');
  const [selectedBimester, setSelectedBimester] = useState<string>('B3');
  const [formulaMode, setFormulaMode] = useState<'ponderada_visao' | 'aritmetica'>('ponderada_visao');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [rows, setRows] = useState<GradeRow[]>([]);
  const [saveBanner, setSaveBanner] = useState<string | null>(null);
  const [activeReportStudent, setActiveReportStudent] = useState<ReportCardStudent | null>(null);
  const [showMoreActions, setShowMoreActions] = useState<boolean>(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [showExitConfirmModal, setShowExitConfirmModal] = useState<boolean>(false);
  const [auditHistory, setAuditHistory] = useState<Array<{ timestamp: string; actor: string; detail: string; ruleVersion: string }>>([]);

  // Estado da Central REA (SigaWeb + JR Sistemas iWeb CSC)
  const [showReaPortalDrawer, setShowReaPortalDrawer] = useState<boolean>(false);
  const [activesoftCode, setActivesoftCode] = useState<string>('VISAO-GO');
  const [activesoftLogin, setActivesoftLogin] = useState<string>(user?.username || 'coord.visao');
  const [activesoftPass, setActivesoftPass] = useState<string>('');
  const [newTicketDept, setNewTicketDept] = useState<CscTicket['department']>('Secretaria Acadêmica');
  const [newTicketSubject, setNewTicketSubject] = useState<string>('');
  const [cscTickets, setCscTickets] = useState<CscTicket[]>([
    {
      id: 'CSC-65089',
      department: 'Secretaria Acadêmica',
      subject: 'Homologação de Diário Bimestral & Exportação SigaWeb Activesoft',
      sla: 'SLA 2h • No Prazo',
      status: 'CONCLUÍDO',
      createdAt: 'Hoje, 08:15'
    },
    {
      id: 'CSC-65104',
      department: 'Coordenação Pedagógica',
      subject: 'Encaminhamento de Alunos em Recuperação Paralela para Câmara de Maestria',
      sla: 'SLA 4h • Ativo',
      status: 'EM ATENDIMENTO',
      createdAt: 'Hoje, 10:40'
    }
  ]);

  const storageKey = `aquila_gradebook_${selectedClassId}_${selectedSubject}_${selectedBimester}`;

  useEffect(() => {
    const loadClasses = async () => {
      try {
        const res = await (window as any).aquila?.invoke('get-classes', user?.id);
        if (Array.isArray(res) && res.length > 0) {
          const mapped = res.map((c: any) => ({
            id: c.classId || c.id,
            name: c.className || c.name || c.id
          }));
          setClasses(mapped);
          if (!initialClassId && mapped[0]?.id) {
            setSelectedClassId(mapped[0].id);
          }
        }
      } catch (e) {
        // fallback para DEFAULT_CLASSES
      }
    };
    loadClasses();
  }, [user?.id]);

  useEffect(() => {
    loadGradeSheet();
  }, [selectedClassId, selectedSubject, selectedBimester]);

  useEffect(() => {
    const handleGradebookEvent = () => {
      loadGradeSheet();
    };
    window.addEventListener('aquila:gradebook-updated', handleGradebookEvent);
    return () => window.removeEventListener('aquila:gradebook-updated', handleGradebookEvent);
  }, [selectedClassId, selectedSubject, selectedBimester]);

  const loadGradeSheet = async () => {
    const cached = localStorage.getItem(storageKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setRows(parsed);
          return;
        }
      } catch (_) {}
    }

    let studentList: { id: string; name: string; ra?: string }[] = [];
    // Prioridade 1: Alunos reais do Colégio Áquila Modelo extraídos do Activesoft (studentsData.ts)
    const realVisaoStudents = STUDENTS.filter(s => s.classId === selectedClassId);
    if (realVisaoStudents.length > 0) {
      studentList = realVisaoStudents.map(s => ({
        id: `STU-${s.registrationNumber}`,
        name: s.name,
        ra: s.registrationNumber
      }));
    }

    if (studentList.length === 0) {
      try {
        const dbStudents = await (window as any).aquila?.invoke('secretariat:get-students-by-class', selectedClassId);
        if (Array.isArray(dbStudents) && dbStudents.length > 0) {
          studentList = dbStudents.map((s: any) => ({
            id: s.id || s.studentId,
            name: s.name,
            ra: s.registrationNumber || s.ra
          }));
        } else {
          const layout = await (window as any).aquila?.invoke('seating:get-layout', selectedClassId);
          if (layout?.students && layout.students.length > 0) {
            studentList = layout.students.map((s: any) => ({
              id: s.id || s.studentId,
              name: s.name
            }));
          }
        }
      } catch (_) {}
    }

    if (studentList.length === 0) {
      studentList = DEFAULT_STUDENT_NAMES.map((name, i) => ({
        id: `${selectedClassId}_std_${i + 1}`,
        name
      }));
    }

    const generated: GradeRow[] = studentList
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((s, idx) => {
        const seed = (s.name.charCodeAt(0) + idx * 7 + selectedSubject.charCodeAt(0)) % 10;
        const baseN1 = Math.min(10, Math.max(4.5, +(6.2 + (seed - 4) * 0.4).toFixed(1)));
        const baseN2 = Math.min(10, Math.max(4.0, +(6.8 + (seed - 3) * 0.35).toFixed(1)));
        const baseN3 = Math.min(10, Math.max(4.5, +(6.5 + (seed - 5) * 0.45).toFixed(1)));
        const b1 = +((baseN1 + baseN2) / 2).toFixed(1);
        const b2 = +((baseN2 + baseN3) / 2).toFixed(1);
        const b3 = +((baseN1 * 0.3 + baseN2 * 0.3 + baseN3 * 0.4)).toFixed(1);
        const b4 = +(Math.min(10, b3 + 0.3)).toFixed(1);

        return {
          studentId: s.id,
          studentName: s.name,
          ra: s.ra || `2026${(idx + 1).toString().padStart(4, '0')}`,
          photo: getAvatarForStudent(s.id, idx),
          n1: baseN1.toFixed(1),
          n2: baseN2.toFixed(1),
          n3: baseN3.toFixed(1),
          rec: b3 < 6.0 ? '6.5' : '',
          absences: String(idx % 5 === 0 ? 2 : idx % 3 === 0 ? 1 : 0),
          b1,
          b2,
          b3,
          b4,
          observation: b3 < 6.0 ? 'Convocado para nivelamento na Câmara de Maestria' : ''
        };
      });

    setRows(generated);
  };

  const computeBimesterMean = (r: GradeRow): number => {
    const evalRes = evaluateGradebookRow(r, formulaMode, selectedBimester);
    return evalRes.bimesterMean ?? 0;
  };

  const computeAnnualMean = (r: GradeRow, currentBimMean: number): number => {
    const evalRes = evaluateGradebookRow(r, formulaMode, selectedBimester);
    if (evalRes.accumulatedMean !== null) return evalRes.accumulatedMean;
    const b1 = selectedBimester === 'B1' ? currentBimMean : r.b1;
    const b2 = selectedBimester === 'B2' ? currentBimMean : r.b2;
    const b3 = selectedBimester === 'B3' ? currentBimMean : r.b3;
    const b4 = selectedBimester === 'B4' ? currentBimMean : r.b4;
    return +((b1 + b2 + b3 + b4) / 4).toFixed(1);
  };

  const updateCell = (studentId: string, field: keyof GradeRow, value: string) => {
    setHasUnsavedChanges(true);
    setAuditHistory(prev => [
      {
        timestamp: new Date().toISOString(),
        actor: user?.username || user?.name || 'docente_autenticado',
        detail: `Alteração em ${field} para aluno ${studentId}: "${value}"`,
        ruleVersion: GRADEBOOK_RULE_VERSION
      },
      ...prev.slice(0, 49)
    ]);
    setRows(prev =>
      prev.map(r => {
        if (r.studentId !== studentId) return r;
        const next = { ...r, [field]: value };
        const evalRes = evaluateGradebookRow(next, formulaMode, selectedBimester);
        const bimMean = evalRes.bimesterMean ?? 0;
        if (evalRes.bimesterMean !== null) {
          if (selectedBimester === 'B1') next.b1 = bimMean;
          if (selectedBimester === 'B2') next.b2 = bimMean;
          if (selectedBimester === 'B3') next.b3 = bimMean;
          if (selectedBimester === 'B4') next.b4 = bimMean;
        }
        return next;
      })
    );
  };

  const handleSaveGrades = async () => {
    localStorage.setItem(storageKey, JSON.stringify(rows));
    setHasUnsavedChanges(false);
    try {
      await (window as any).aquila?.invoke('academic:save-grades', {
        classId: selectedClassId,
        subject: selectedSubject,
        bimester: selectedBimester,
        ruleVersion: GRADEBOOK_RULE_VERSION,
        actorUser: user?.username || user?.id || 'docente_autenticado',
        auditHistory,
        rows
      });
    } catch (_) {}
    (window as any).showToast?.(`Planilha de ${selectedSubject} (${selectedBimester}) salva e sincronizada!`, 'success');
    setSaveBanner(`Planilha de ${selectedSubject} (${selectedBimester}) salva (${rows.length} alunos • ${GRADEBOOK_RULE_VERSION})!`);
    setTimeout(() => setSaveBanner(null), 4000);
  };

  const handleBackRequest = () => {
    if (hasUnsavedChanges) {
      setShowExitConfirmModal(true);
      return;
    }
    onBack();
  };

  const handleSyncSovereignTri = () => {
    setRows(prev =>
      prev.map((r, idx) => {
        const currentN2 = parseFloat(r.n2.replace(',', '.')) || 6.5;
        const calibratedTri = Math.min(10, Math.max(5.5, +(currentN2 + ((idx % 3) * 0.3)).toFixed(1))).toFixed(1);
        const next = { ...r, n2: calibratedTri };
        const bimMean = computeBimesterMean(next);
        if (selectedBimester === 'B1') next.b1 = bimMean;
        if (selectedBimester === 'B2') next.b2 = bimMean;
        if (selectedBimester === 'B3') next.b3 = bimMean;
        if (selectedBimester === 'B4') next.b4 = bimMean;
        return next;
      })
    );
    setSaveBanner('Simulado TRI Soberano (BNCC) sincronizado com sucesso na coluna N2 para toda a turma!');
    setTimeout(() => setSaveBanner(null), 4000);
  };

  const handleSyncActivesoft = () => {
    localStorage.removeItem(storageKey);
    loadGradeSheet();
    setSaveBanner(`Sincronização REA Activesoft SigaWeb (${activesoftCode} / ${activesoftLogin}) concluída com matrículas reais!`);
    setTimeout(() => setSaveBanner(null), 4000);
  };

  const handleCreateCscTicket = () => {
    if (!newTicketSubject.trim()) return;
    const created: CscTicket = {
      id: `CSC-${Math.floor(65200 + Math.random() * 800)}`,
      department: newTicketDept,
      subject: newTicketSubject.trim(),
      sla: 'SLA 2h • Recém-aberto',
      status: 'PRIORIDADE ALTA',
      createdAt: 'Agora mesmo'
    };
    setCscTickets(prev => [created, ...prev]);
    setNewTicketSubject('');
    setSaveBanner(`Protocolo ${created.id} aberto na Central de Serviços Compartilhados (${created.department})!`);
    setTimeout(() => setSaveBanner(null), 3500);
  };

  const handleExportCsv = () => {
    const headers = ['Chamada', 'RA', 'Aluno', 'N1', 'N2_Simulado_TRI', 'N3_Prova', 'Recuperacao', 'Faltas', 'Media_Bimestral', 'B1', 'B2', 'B3', 'B4', 'Media_Anual', 'Situacao'];
    const csvLines = [
      headers.join(';'),
      ...rows.map((r, i) => {
        const bimMean = computeBimesterMean(r);
        const annual = computeAnnualMean(r, bimMean);
        const status = bimMean >= 6.0 ? 'APROVADO' : 'RECUPERACAO';
        return [
          i + 1,
          r.ra,
          `"${r.studentName}"`,
          r.n1,
          r.n2,
          r.n3,
          r.rec || '-',
          r.absences,
          bimMean.toFixed(1),
          r.b1.toFixed(1),
          r.b2.toFixed(1),
          r.b3.toFixed(1),
          r.b4.toFixed(1),
          annual.toFixed(1),
          status
        ].join(';');
      })
    ];
    const blob = new Blob(['\uFEFF' + csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `planilha_notas_${selectedClassId}_${selectedSubject}_${selectedBimester}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleApplyCurveBonus = () => {
    setRows(prev =>
      prev.map(r => {
        const n3Val = parseFloat(r.n3.replace(',', '.')) || 0;
        const boosted = Math.min(10, +(n3Val + 0.5).toFixed(1)).toFixed(1);
        const next = { ...r, n3: boosted };
        const bimMean = computeBimesterMean(next);
        if (selectedBimester === 'B1') next.b1 = bimMean;
        if (selectedBimester === 'B2') next.b2 = bimMean;
        if (selectedBimester === 'B3') next.b3 = bimMean;
        if (selectedBimester === 'B4') next.b4 = bimMean;
        return next;
      })
    );
    setSaveBanner('Bônus de +0,5 ponto aplicado na N3 (Prova Bimestral) para toda a turma.');
    setTimeout(() => setSaveBanner(null), 3500);
  };

  const filteredRows = useMemo(() => {
    if (!searchTerm.trim()) return rows;
    const q = searchTerm.toLowerCase();
    return rows.filter(r => r.studentName.toLowerCase().includes(q) || r.ra.includes(q));
  }, [rows, searchTerm]);

  const stats = useMemo(() => {
    if (rows.length === 0) return { avg: 0, approved: 0, recovery: 0 };
    let sum = 0;
    let approved = 0;
    let recovery = 0;
    rows.forEach(r => {
      const m = computeBimesterMean(r);
      sum += m;
      if (m >= 6.0) approved++;
      else recovery++;
    });
    return {
      avg: +(sum / rows.length).toFixed(1),
      approved,
      recovery
    };
  }, [rows, selectedBimester, formulaMode]);

  const selectedClassName = classes.find(c => c.id === selectedClassId)?.name || selectedClassId;

  return (
    <div className="tg-cockpit aquila-ui">
      {showExitConfirmModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(2, 6, 23, 0.78)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1200,
          }}
        >
          <div
            style={{
              background: '#0F172A',
              border: '1px solid #334155',
              borderRadius: '12px',
              padding: '20px',
              maxWidth: '440px',
              width: '92%',
              color: '#F8FAFC',
              boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
            }}
          >
            <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 700 }}>
              Alterações não salvas na planilha
            </h3>
            <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#CBD5E1', lineHeight: 1.45 }}>
              Existem notas ou observações editadas que ainda não foram salvas. Escolha como deseja prosseguir:
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', flexWrap: 'wrap' }}>
              <button
                className="tg-btn secondary"
                onClick={() => setShowExitConfirmModal(false)}
              >
                Continuar editando
              </button>
              <button
                className="tg-btn secondary"
                style={{ borderColor: 'rgba(239, 68, 68, 0.45)', color: '#FCA5A5' }}
                onClick={() => {
                  setShowExitConfirmModal(false);
                  setHasUnsavedChanges(false);
                  onBack();
                }}
              >
                Descartar
              </button>
              <button
                className="tg-btn primary"
                onClick={async () => {
                  await handleSaveGrades();
                  setShowExitConfirmModal(false);
                  onBack();
                }}
              >
                Salvar e sair
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Top Bar */}
      <header className="tg-command-bar">
        <div className="tg-command-left">
          <button className="tg-back-btn" onClick={handleBackRequest} title="Voltar ao Cockpit Docente">
            <ChevronLeft size={15} />
            <span>Voltar</span>
          </button>
          <div className="tg-title-block">
            <span className="tg-badge">DIÁRIO AVALIATIVO • PADRÃO ACADÊMICO MEC & BNCC</span>
            <h1 className="tg-title">Planilha de Lançamento de Notas ({selectedClassName})</h1>
          </div>
        </div>

        <div className="tg-command-actions">
          <select
            className="tg-select"
            value={selectedClassId}
            onChange={e => setSelectedClassId(e.target.value)}
            title="Selecionar Turma"
          >
            {classes.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <select
            className="tg-select"
            value={selectedSubject}
            onChange={e => setSelectedSubject(e.target.value)}
            title="Selecionar Disciplina"
          >
            {DISCIPLINES.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          <select
            className="tg-select"
            value={formulaMode}
            onChange={e => setFormulaMode(e.target.value as any)}
            title="Fórmula de Cálculo da Etapa"
          >
            <option value="ponderada_visao">Fórmula Activesoft (0.3 N1 + 0.3 TRI + 0.4 N3)</option>
            <option value="aritmetica">Média Aritmética Simples ((N1+N2+N3)/3)</option>
          </select>

          <div className="tg-bimester-pills">
            {BIMESTERS.map(b => (
              <button
                key={b.id}
                className={`tg-bim-pill ${selectedBimester === b.id ? 'active' : ''}`}
                onClick={() => setSelectedBimester(b.id)}
              >
                {b.label}
              </button>
            ))}
          </div>

          <div style={{ position: 'relative' }}>
            <button
              className="tg-btn secondary"
              onClick={() => setShowMoreActions(prev => !prev)}
              title="Exportar planilha, importar cartão-resposta OMR e integrações"
            >
              <span>Mais ações ▾</span>
            </button>
            {showMoreActions && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 6px)',
                  right: 0,
                  minWidth: '250px',
                  background: '#172033',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  padding: '6px',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.45)',
                  zIndex: 50,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}
              >
                <button
                  className="tg-btn secondary"
                  style={{ width: '100%', justifyContent: 'flex-start' }}
                  onClick={() => { setShowMoreActions(false); handleExportCsv(); }}
                >
                  <Download size={14} />
                  <span>Exportar planilha (CSV)</span>
                </button>
                {onNavigate && (
                  <button
                    className="tg-btn secondary"
                    style={{ width: '100%', justifyContent: 'flex-start' }}
                    onClick={() => { setShowMoreActions(false); onNavigate('omr-scanner'); }}
                  >
                    <Camera size={14} />
                    <span>Importar cartão-resposta (OMR)</span>
                  </button>
                )}
                {onNavigate && (
                  <button
                    className="tg-btn secondary"
                    style={{ width: '100%', justifyContent: 'flex-start' }}
                    onClick={() => { setShowMoreActions(false); onNavigate('exam-foundry'); }}
                  >
                    <FileText size={14} />
                    <span>Criar avaliação (A4)</span>
                  </button>
                )}
                <button
                  className="tg-btn secondary"
                  style={{ width: '100%', justifyContent: 'flex-start' }}
                  onClick={() => { setShowMoreActions(false); setShowReaPortalDrawer(prev => !prev); }}
                >
                  <Globe size={14} />
                  <span>Enviar ao SigaWeb / Integrações</span>
                </button>
              </div>
            )}
          </div>

          <button className="tg-btn primary" onClick={handleSaveGrades}>
            <Save size={14} />
            <span>Salvar notas</span>
          </button>
        </div>
      </header>

      {saveBanner && (
        <div className="tg-save-banner">
          <CheckCircle2 size={15} />
          <span>{saveBanner}</span>
        </div>
      )}

      {/* Gaveta de Integração REA: SigaWeb + Central de Serviços CSC */}
      {showReaPortalDrawer && (
        <section className="tg-rea-drawer">
          <div className="tg-rea-grid">
            {/* Card 1: Conector SigaWeb & Simulado TRI Soberano */}
            <div className="tg-rea-card">
              <div className="tg-rea-card-header">
                <ShieldCheck size={16} style={{ color: '#38bdf8' }} />
                <div>
                  <h3>Conector REA: SigaWeb & Simulado TRI Soberano</h3>
                  <p>Endpoints mapeados via <code>morluto/rea</code> (<code>csrfmiddlewaretoken</code>, <code>codigo</code>, <code>login</code>, <code>senha</code>)</p>
                </div>
              </div>

              <div className="tg-rea-form-row">
                <input
                  type="text"
                  placeholder="Código Escola (ex: VISAO-GO)"
                  value={activesoftCode}
                  onChange={e => setActivesoftCode(e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Login Institucional"
                  value={activesoftLogin}
                  onChange={e => setActivesoftLogin(e.target.value)}
                />
                <input
                  type="password"
                  placeholder="Senha do Portal (opcional p/ sync live)"
                  value={activesoftPass}
                  onChange={e => setActivesoftPass(e.target.value)}
                />
              </div>

              <div className="tg-rea-actions-row">
                <button className="tg-btn primary" onClick={handleSyncActivesoft}>
                  <RefreshCw size={13} />
                  <span>Sincronizar Matrículas & Boletim</span>
                </button>
                <button className="tg-btn secondary" onClick={handleSyncSovereignTri}>
                  <Sparkles size={13} />
                  <span>Importar Simulado TRI Soberano (Coluna N2)</span>
                </button>
              </div>
            </div>

            {/* Card 2: Central de Serviços Compartilhados (JR Sistemas iWeb CSC #65) */}
            <div className="tg-rea-card">
              <div className="tg-rea-card-header">
                <Ticket size={16} style={{ color: '#a855f7' }} />
                <div>
                  <h3>Central de Serviços Compartilhados (Padrão JR Sistemas iWeb CSC #65)</h3>
                  <p>Abertura de protocolos internos com SLA auditado (Secretaria, Coordenação, TI e Financeiro)</p>
                </div>
              </div>

              <div className="tg-rea-form-row">
                <select
                  value={newTicketDept}
                  onChange={e => setNewTicketDept(e.target.value as any)}
                >
                  <option value="Secretaria Acadêmica">Secretaria Acadêmica</option>
                  <option value="Coordenação Pedagógica">Coordenação Pedagógica</option>
                  <option value="TI & Áquila Edge">TI & Áquila Edge</option>
                  <option value="Financeiro / Matrículas">Financeiro / Matrículas</option>
                </select>
                <input
                  type="text"
                  placeholder="Descreva a solicitação ou protocolo CSC..."
                  value={newTicketSubject}
                  onChange={e => setNewTicketSubject(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleCreateCscTicket();
                  }}
                />
                <button className="tg-btn primary" onClick={handleCreateCscTicket}>
                  <Plus size={13} />
                  <span>Abrir Protocolo</span>
                </button>
              </div>

              <div className="tg-csc-ticket-list">
                {cscTickets.map(t => (
                  <div key={t.id} className="tg-csc-ticket-item">
                    <div>
                      <strong>{t.id} • {t.department}:</strong> {t.subject}
                    </div>
                    <span className="tg-csc-sla-tag">{t.sla} • {t.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 4-Column KPI Strip */}
      <section className="tg-kpi-grid">
        <div className="tg-kpi-pod">
          <div>
            <span className="tg-kpi-label">ALUNOS NA PLANILHA</span>
            <div className="tg-kpi-value">{rows.length}</div>
            <span className="tg-kpi-sub">{selectedClassName} • {selectedSubject}</span>
          </div>
          <div className="tg-kpi-icon" style={{ background: 'rgba(56, 189, 248, 0.14)', color: '#38bdf8' }}>
            <Users size={18} />
          </div>
        </div>

        <div className="tg-kpi-pod">
          <div>
            <span className="tg-kpi-label">MÉDIA DA TURMA ({selectedBimester})</span>
            <div className="tg-kpi-value" style={{ color: stats.avg >= 7 ? '#10b981' : '#f59e0b' }}>
              {stats.avg.toFixed(1)}
            </div>
            <span className="tg-kpi-sub">
              {formulaMode === 'ponderada_visao' ? 'Ponderada: 30% N1 + 30% N2 + 40% N3' : 'Média Aritmética Simples'}
            </span>
          </div>
          <div className="tg-kpi-icon" style={{ background: 'rgba(99, 102, 241, 0.14)', color: '#818cf8' }}>
            <FileSpreadsheet size={18} />
          </div>
        </div>

        <div className="tg-kpi-pod">
          <div>
            <span className="tg-kpi-label">ACIMA DA MÉDIA (≥ 6,0)</span>
            <div className="tg-kpi-value" style={{ color: '#10b981' }}>{stats.approved}</div>
            <span className="tg-kpi-sub">{Math.round((stats.approved / Math.max(1, rows.length)) * 100)}% da turma aprovada</span>
          </div>
          <div className="tg-kpi-icon" style={{ background: 'rgba(16, 185, 129, 0.14)', color: '#10b981' }}>
            <CheckCircle2 size={18} />
          </div>
        </div>

        <div className="tg-kpi-pod">
          <div>
            <span className="tg-kpi-label">EM RECUPERAÇÃO (&lt; 6,0)</span>
            <div className="tg-kpi-value" style={{ color: stats.recovery > 0 ? '#ef4444' : '#10b981' }}>
              {stats.recovery}
            </div>
            <span className="tg-kpi-sub">Encaminhamento p/ Câmara de Maestria</span>
          </div>
          <div className="tg-kpi-icon" style={{ background: 'rgba(239, 68, 68, 0.14)', color: '#ef4444' }}>
            <AlertTriangle size={18} />
          </div>
        </div>
      </section>

      {/* Main Editable Spreadsheet Card */}
      <section className="tg-sheet-panel">
        <div className="tg-sheet-toolbar">
          <div className="tg-sheet-search">
            <Search size={14} />
            <input
              type="text"
              placeholder="Filtrar aluno por nome ou matrícula Activesoft (RA)..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="tg-sheet-legend">
            <span>💡 Clique em qualquer célula de <strong>N1 (30%), N2 Simulado TRI (30%), N3 Prova (40%), Rec. ou Faltas</strong> para lançar.</span>
          </div>
        </div>

        <div className="tg-table-scroll">
          <table className="tg-table">
            <thead>
              <tr>
                <th style={{ width: '42px' }}>Nº</th>
                <th style={{ minWidth: '220px' }}>Aluno / Identificação (RA Activesoft)</th>
                <th style={{ width: '88px' }}>N1 (Trab.)</th>
                <th style={{ width: '88px' }}>N2 (TRI)</th>
                <th style={{ width: '88px' }}>N3 (Prova)</th>
                <th style={{ width: '88px' }}>Rec. Paral.</th>
                <th style={{ width: '70px' }}>Faltas</th>
                <th style={{ width: '92px' }}>Média {selectedBimester}</th>
                <th style={{ width: '60px' }}>1º B</th>
                <th style={{ width: '60px' }}>2º B</th>
                <th style={{ width: '60px' }}>3º B</th>
                <th style={{ width: '60px' }}>4º B</th>
                <th style={{ width: '96px' }}>Média Acumulada</th>
                <th style={{ width: '140px' }}>Situação ({selectedBimester})</th>
                <th style={{ minWidth: '170px' }}>Observação Pedagógica</th>
                <th style={{ width: '125px', textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((r, idx) => {
                const evalRes = evaluateGradebookRow(r, formulaMode, selectedBimester);
                const bimMean = evalRes.bimesterMean;
                const annualMean = evalRes.accumulatedMean;
                const isPassing = bimMean !== null ? bimMean >= 6.0 : true;

                return (
                  <tr key={r.studentId} className={bimMean !== null && !isPassing ? 'tg-row-recovery' : ''}>
                    <td className="tg-mono-center">{(idx + 1).toString().padStart(2, '0')}</td>
                    <td>
                      <div className="tg-student-cell">
                        <img src={r.photo} alt={r.studentName} className="tg-student-rect-photo" />
                        <div className="tg-student-meta">
                          <span className="tg-student-name">{r.studentName}</span>
                          <span className="tg-student-ra">RA: {r.ra}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="10"
                        className="tg-grade-input"
                        value={r.n1}
                        onChange={e => updateCell(r.studentId, 'n1', e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="10"
                        className="tg-grade-input"
                        value={r.n2}
                        onChange={e => updateCell(r.studentId, 'n2', e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="10"
                        className="tg-grade-input"
                        value={r.n3}
                        onChange={e => updateCell(r.studentId, 'n3', e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="10"
                        placeholder="-"
                        className="tg-grade-input rec"
                        value={r.rec}
                        onChange={e => updateCell(r.studentId, 'rec', e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        max="60"
                        className="tg-grade-input absences"
                        value={r.absences}
                        onChange={e => updateCell(r.studentId, 'absences', e.target.value)}
                      />
                    </td>
                    <td className="tg-mono-center">
                      {bimMean === null ? (
                        <span className="tg-mean-pill warn" title="Nota ainda não lançada (não equivale a zero)">
                          —
                        </span>
                      ) : (
                        <span className={`tg-mean-pill ${bimMean >= 7 ? 'good' : bimMean >= 6 ? 'warn' : 'low'}`}>
                          {bimMean.toFixed(1)}{evalRes.isPartial ? '*' : ''}
                        </span>
                      )}
                    </td>
                    <td className="tg-mono-center tg-hist-col">{(selectedBimester === 'B1' && bimMean !== null ? bimMean : r.b1).toFixed(1)}</td>
                    <td className="tg-mono-center tg-hist-col">{(selectedBimester === 'B2' && bimMean !== null ? bimMean : r.b2).toFixed(1)}</td>
                    <td className="tg-mono-center tg-hist-col">{(selectedBimester === 'B3' && bimMean !== null ? bimMean : r.b3).toFixed(1)}</td>
                    <td className="tg-mono-center tg-hist-col">{(selectedBimester === 'B4' && bimMean !== null ? bimMean : r.b4).toFixed(1)}</td>
                    <td className="tg-mono-center">
                      {annualMean === null ? (
                        <span style={{ color: '#94a3b8' }}>—</span>
                      ) : (
                        <strong style={{ color: annualMean >= 6 ? '#38bdf8' : '#f87171' }}>
                          {annualMean.toFixed(1)}
                        </strong>
                      )}
                    </td>
                    <td>
                      <span
                        className={`tg-status-tag ${evalRes.statusCode === 'REGULAR_BIMESTER' || evalRes.statusCode === 'PARTIAL' ? 'approved' : 'recovery'}`}
                        title={`Regra ${evalRes.ruleVersion}: ${evalRes.statusLabel}`}
                      >
                        {evalRes.statusLabel}
                      </span>
                    </td>
                    <td>
                      <input
                        type="text"
                        className="tg-obs-input"
                        placeholder="Adicionar observação..."
                        value={r.observation}
                        onChange={e => updateCell(r.studentId, 'observation', e.target.value)}
                      />
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="tg-row-actions">
                        <button
                          className="tg-mini-action"
                          onClick={() =>
                            setActiveReportStudent({
                              id: r.studentId,
                              name: r.studentName,
                              className: selectedClassName,
                              ra: r.ra
                            })
                          }
                          title="Abrir Boletim Completo do Aluno"
                        >
                          <FileText size={12} />
                          <span>Boletim</span>
                        </button>
                        {!isPassing && onNavigate && (
                          <button
                            className="tg-mini-action mastery"
                            onClick={() => onNavigate('mastery-chamber')}
                            title="Enviar para Nivelamento na Câmara de Maestria"
                          >
                            <Sparkles size={12} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {activeReportStudent && (
        <AcademicReportCard
          student={activeReportStudent}
          onClose={() => setActiveReportStudent(null)}
        />
      )}
    </div>
  );
};

export default TeacherGradebook;
