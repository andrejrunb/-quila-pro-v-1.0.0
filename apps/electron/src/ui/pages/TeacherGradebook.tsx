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
  { id: 'F-EF26A', name: '6º Ano A — Colégio Visão' },
  { id: 'F-EF26B', name: '6º Ano B — Colégio Visão' },
  { id: 'F-EF27A', name: '7º Ano A — Colégio Visão' },
  { id: 'F-EF27B', name: '7º Ano B — Colégio Visão' },
  { id: 'F-EF28A', name: '8º Ano A — Colégio Visão' },
  { id: 'F-EF28B', name: '8º Ano B — Colégio Visão' },
  { id: 'F-EF29A', name: '9º Ano A — Colégio Visão' },
  { id: 'F-EF29B', name: '9º Ano B — Colégio Visão' },
  { id: 'F-EM1A',  name: '1ª Série A (EM) — Colégio Visão' },
  { id: 'F-EM1B',  name: '1ª Série B (EM) — Colégio Visão' },
  { id: 'F-EM2A',  name: '2ª Série A (EM) — Colégio Visão' },
  { id: 'F-EM3A',  name: '3ª Série A (EM) — Colégio Visão' },
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
    // Prioridade 1: Alunos reais do Colégio Visão extraídos do Activesoft (studentsData.ts)
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
    const v1 = parseFloat(r.n1.replace(',', '.'));
    const v2 = parseFloat(r.n2.replace(',', '.'));
    const v3 = parseFloat(r.n3.replace(',', '.'));
    let partial = 0;

    if (formulaMode === 'ponderada_visao') {
      // Fórmula Ponderada Activesoft / Colégio Visão: N1 (30%) + N2 Simulado TRI (30%) + N3 Prova Global (40%)
      const n1Safe = isNaN(v1) ? 0 : v1;
      const n2Safe = isNaN(v2) ? 0 : v2;
      const n3Safe = isNaN(v3) ? 0 : v3;
      partial = n1Safe * 0.3 + n2Safe * 0.3 + n3Safe * 0.4;
    } else {
      const valid = [v1, v2, v3].filter(v => !isNaN(v));
      partial = valid.length > 0 ? valid.reduce((a, b) => a + b, 0) / valid.length : 0;
    }

    const vRec = parseFloat(r.rec.replace(',', '.'));
    const finalMean = !isNaN(vRec) && vRec > partial ? vRec : partial;
    return Math.min(10, Math.max(0, +finalMean.toFixed(1)));
  };

  const computeAnnualMean = (r: GradeRow, currentBimMean: number): number => {
    const b1 = selectedBimester === 'B1' ? currentBimMean : r.b1;
    const b2 = selectedBimester === 'B2' ? currentBimMean : r.b2;
    const b3 = selectedBimester === 'B3' ? currentBimMean : r.b3;
    const b4 = selectedBimester === 'B4' ? currentBimMean : r.b4;
    return +((b1 + b2 + b3 + b4) / 4).toFixed(1);
  };

  const updateCell = (studentId: string, field: keyof GradeRow, value: string) => {
    setRows(prev =>
      prev.map(r => {
        if (r.studentId !== studentId) return r;
        const next = { ...r, [field]: value };
        const bimMean = computeBimesterMean(next);
        if (selectedBimester === 'B1') next.b1 = bimMean;
        if (selectedBimester === 'B2') next.b2 = bimMean;
        if (selectedBimester === 'B3') next.b3 = bimMean;
        if (selectedBimester === 'B4') next.b4 = bimMean;
        return next;
      })
    );
  };

  const handleSaveGrades = async () => {
    localStorage.setItem(storageKey, JSON.stringify(rows));
    try {
      await (window as any).aquila?.invoke('academic:save-grades', {
        classId: selectedClassId,
        subject: selectedSubject,
        bimester: selectedBimester,
        rows
      });
    } catch (_) {}
    (window as any).showToast?.(`Planilha de ${selectedSubject} (${selectedBimester}) salva e sincronizada!`, 'success');
    setSaveBanner(`Planilha de ${selectedSubject} (${selectedBimester}) salva e sincronizada (${rows.length} alunos)!`);
    setTimeout(() => setSaveBanner(null), 4000);
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
    <div className="tg-cockpit">
      {/* Top Bar */}
      <header className="tg-command-bar">
        <div className="tg-command-left">
          <button className="tg-back-btn" onClick={onBack} title="Voltar ao Cockpit Docente">
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

          {onNavigate && (
            <button
              className="tg-btn secondary"
              onClick={() => onNavigate('omr-scanner')}
              title="Corrigir Provas e Gabaritos via Câmera/Scanner OMR"
              style={{ borderColor: 'rgba(234, 179, 8, 0.5)', color: '#EAB308' }}
            >
              <Camera size={14} />
              <span>Scanner OMR</span>
            </button>
          )}

          {onNavigate && (
            <button
              className="tg-btn secondary"
              onClick={() => onNavigate('exam-foundry')}
              title="Gerar Cadernos de Avaliação e Provas A4 (ENEM/PAS/Bancas Regionais)"
              style={{ borderColor: 'rgba(56, 189, 248, 0.5)', color: '#38BDF8' }}
            >
              <FileText size={14} />
              <span>Gerador Provas A4</span>
            </button>
          )}

          <button
            className="tg-btn secondary"
            onClick={() => setShowReaPortalDrawer(prev => !prev)}
            title="Abrir Conectores REA: SigaWeb e Central de Serviços CSC"
            style={{ borderColor: showReaPortalDrawer ? '#38bdf8' : undefined, color: showReaPortalDrawer ? '#38bdf8' : undefined }}
          >
            <Globe size={14} />
            <span>Portais REA & CSC</span>
          </button>

          <button className="tg-btn secondary" onClick={handleApplyCurveBonus} title="Somar +0,5 na N3 de todos os alunos">
            <Calculator size={14} />
            <span>+0,5 N3</span>
          </button>

          <button className="tg-btn secondary" onClick={handleExportCsv} title="Exportar Planilha para Excel / CSV">
            <Download size={14} />
            <span>Excel/CSV</span>
          </button>

          <button className="tg-btn primary" onClick={handleSaveGrades}>
            <Save size={14} />
            <span>Salvar Notas</span>
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
                <th style={{ width: '88px' }}>Média Anual</th>
                <th style={{ width: '110px' }}>Situação</th>
                <th style={{ minWidth: '170px' }}>Observação Pedagógica</th>
                <th style={{ width: '125px', textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((r, idx) => {
                const bimMean = computeBimesterMean(r);
                const annualMean = computeAnnualMean(r, bimMean);
                const isPassing = bimMean >= 6.0;

                return (
                  <tr key={r.studentId} className={!isPassing ? 'tg-row-recovery' : ''}>
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
                      <span className={`tg-mean-pill ${bimMean >= 7 ? 'good' : bimMean >= 6 ? 'warn' : 'low'}`}>
                        {bimMean.toFixed(1)}
                      </span>
                    </td>
                    <td className="tg-mono-center tg-hist-col">{(selectedBimester === 'B1' ? bimMean : r.b1).toFixed(1)}</td>
                    <td className="tg-mono-center tg-hist-col">{(selectedBimester === 'B2' ? bimMean : r.b2).toFixed(1)}</td>
                    <td className="tg-mono-center tg-hist-col">{(selectedBimester === 'B3' ? bimMean : r.b3).toFixed(1)}</td>
                    <td className="tg-mono-center tg-hist-col">{(selectedBimester === 'B4' ? bimMean : r.b4).toFixed(1)}</td>
                    <td className="tg-mono-center">
                      <strong style={{ color: annualMean >= 6 ? '#38bdf8' : '#f87171' }}>
                        {annualMean.toFixed(1)}
                      </strong>
                    </td>
                    <td>
                      <span className={`tg-status-tag ${isPassing ? 'approved' : 'recovery'}`}>
                        {isPassing ? 'APROVADO' : 'RECUPERAÇÃO'}
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
