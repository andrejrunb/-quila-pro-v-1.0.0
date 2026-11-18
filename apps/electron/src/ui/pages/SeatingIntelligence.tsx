import React, { useState, useEffect } from 'react';
import {
  ArrowLeftRight,
  Clock,
  CheckCircle2,
  Send,
  ZoomIn,
  ZoomOut,
  Sparkles, 
  Save, 
  AlertTriangle, 
  ChevronLeft,
  Search,
  Monitor,
  RefreshCw,
  X,
  Camera,
  Activity,
  BookOpen,
  LayoutDashboard,
  Settings,
  Minus,
  Plus,
  MoveHorizontal,
  FileText,
  LayoutGrid,
  List,
  Tv
} from 'lucide-react';
import { CameraViewer } from '../components/CameraViewer';
import { BimestralFeedbackPanel } from '../components/BimestralFeedbackPanel';
import { useWebSocket } from '../hooks/useWebSocket';
import './SeatingIntelligence.css';
interface Student {
  id: string;
  name: string;
  row?: number;
  col?: number;
  status?: 'PRESENT' | 'ABSENT' | 'MISPLACED' | 'UNASSIGNED' | 'focus' | 'fatigue' | 'talking';
}
interface Class {
  id: string;
  name: string;
}
interface CameraDevice {
  id: string;
  name: string;
  url: string;
  status: string;
}
const getStudentPhoto = (student: Student) => {
  const str = student.id || student.name || 'aluno';
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const index = (Math.abs(hash) % 10) + 1;
  return `./avatars/face-${index}.jpg`;
};
interface SeatingIntelligenceProps {
  onBack: () => void;
  onNavigate?: (page: string) => void;
  user?: any;
  showFeedback?: boolean;
}
export const SeatingIntelligence: React.FC<SeatingIntelligenceProps> = ({ onBack, onNavigate, user, showFeedback = false }) => {
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [rows, setRows] = useState(6);
  const [cols, setCols] = useState(8);
  const [deskPos, setDeskPos] = useState({ x: 38, y: 0 }); // Desliza somente na horizontal X (trilho frontal)
  const [isMovingDesk, setIsMovingDesk] = useState(false);
  const [isFeedbackExpanded, setIsFeedbackExpanded] = useState(false);
  const [draggedStudent, setDraggedStudent] = useState<Student | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [gridZoom, setGridZoom] = useState<number>(100);
  const [feedbackRefreshTrigger, setFeedbackRefreshTrigger] = useState(0);
  const viewportRef = React.useRef<HTMLDivElement>(null);
  const mainGridRef = React.useRef<HTMLDivElement>(null);
  const [lineCoords, setLineCoords] = useState<{ x1: number; y1: number; x2: number; y2: number }[]>([]);
  const frontRailRef = React.useRef<HTMLDivElement>(null);
  const handleDeskPointerDown = (e: React.PointerEvent) => {
    if (isLiveMode) return;
    setIsMovingDesk(true);
    try { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); } catch { /* captura indisponível */ }
  };
  const handleDeskPointerMove = (e: React.PointerEvent) => {
    if (!isMovingDesk || isLiveMode || !frontRailRef.current) return;
    const rect = frontRailRef.current.getBoundingClientRect();
    const x = Math.max(1, Math.min(80, ((e.clientX - rect.left) / rect.width) * 100));
    setDeskPos(prev => ({ ...prev, x }));
  };
  const handleDeskPointerUp = (e: React.PointerEvent) => {
    if (isMovingDesk) {
      setIsMovingDesk(false);
      try { (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId); } catch { /* liberação indisponível */ }
    }
  };
  
  const [showConfigPopover, setShowConfigPopover] = useState(false);
  const configPopoverRef = React.useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!showConfigPopover) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (configPopoverRef.current && !configPopoverRef.current.contains(e.target as Node)) {
        setShowConfigPopover(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showConfigPopover]);
  const [interactionGroup, setInteractionGroup] = useState<Student[]>([]);
  const [showInteractionMenu, setShowInteractionMenu] = useState(false);
  const [isReportMode, setIsReportMode] = useState(false);
  const [selectedReportStudents, setSelectedReportStudents] = useState<Student[]>([]);
  // Estados para Integração de Câmera
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [isProjectedSeating, setIsProjectedSeating] = useState(false);
  useEffect(() => {
    const handleProjEvent = (e: Event) => {
      const rawDetail = (e as CustomEvent<boolean | { active?: boolean }>).detail;
      const detail = typeof rawDetail === 'boolean' ? rawDetail : rawDetail?.active;
      if (typeof detail === 'boolean') {
        setIsProjectedSeating(detail);
      }
    };
    window.addEventListener('aquila:toggle-projection-mode', handleProjEvent);
    return () => window.removeEventListener('aquila:toggle-projection-mode', handleProjEvent);
  }, []);
  const toggleProjection = () => {
    const next = !isProjectedSeating;
    setIsProjectedSeating(next);
    window.dispatchEvent(new CustomEvent('aquila:toggle-projection-mode', { detail: next }));
  };
  const toggleReportStudent = (student: Student) => {
    setSelectedReportStudents(prev => {
      const exists = prev.some(s => s.id === student.id);
      const next = exists ? prev.filter(s => s.id !== student.id) : [...prev, student];
      setShowInteractionMenu(next.length > 0);
      return next;
    });
  };
  // Estados de Sugestão de Alteração de Mapeamento (Professor -> Coordenação)
  const [showSuggestModal, setShowSuggestModal] = useState(false);
  const [suggestStudent, setSuggestStudent] = useState<Student | null>(null);
  const [suggestTargetMode, setSuggestTargetMode] = useState<'swap' | 'empty'>('swap');
  const [suggestTargetStudentId, setSuggestTargetStudentId] = useState<string>('');
  const [suggestTargetRow, setSuggestTargetRow] = useState<number>(0);
  const [suggestTargetCol, setSuggestTargetCol] = useState<number>(0);
  const [suggestReason, setSuggestReason] = useState<string>('CONVERSA');
  const [suggestCustomReason, setSuggestCustomReason] = useState<string>('');
  const [isSubmittingSuggestion, setIsSubmittingSuggestion] = useState(false);
  const [pendingSuggestions, setPendingSuggestions] = useState<any[]>([]);
  const [showPendingModal, setShowPendingModal] = useState(false);
  const pendingSuggestionStudentIds = React.useMemo(() => {
    return new Set(pendingSuggestions.filter(s => s.status === 'PENDENTE').map(s => s.studentId));
  }, [pendingSuggestions]);
  const loadSuggestions = async (classId?: string) => {
    const cid = classId || selectedClassId;
    if (!cid) return;
    try {
      let data: any[] = [];
      if (window.aquila?.invoke) {
        data = await window.aquila.invoke('seating:get-change-suggestions', { classId: cid });
      }
      if (!data || data.length === 0) {
        const local = localStorage.getItem(`aquila_seating_sug_${cid}`);
        data = local ? JSON.parse(local) : [];
      }
      setPendingSuggestions(Array.isArray(data) ? data : []);
    } catch (e) {
      console.warn('[Seating] Falha ao carregar sugestões:', e);
    }
  };
  const openSuggestModal = (student?: Student) => {
    const targetStudent = student || students.find(s => s.row !== undefined && s.col !== undefined) || students[0] || null;
    setSuggestStudent(targetStudent);
    const otherStudent = students.find(s => s.id !== targetStudent?.id && s.row !== undefined && s.col !== undefined);
    if (otherStudent) {
      setSuggestTargetStudentId(otherStudent.id);
      setSuggestTargetRow(otherStudent.row ?? 0);
      setSuggestTargetCol(otherStudent.col ?? 0);
      setSuggestTargetMode('swap');
    } else {
      setSuggestTargetMode('empty');
      setSuggestTargetRow(0);
      setSuggestTargetCol(0);
    }
    setSuggestReason('CONVERSA');
    setSuggestCustomReason('');
    setShowSuggestModal(true);
  };
  const handleSendSuggestion = async () => {
    if (!suggestStudent || !selectedClassId) return;
    setIsSubmittingSuggestion(true);
    try {
      const targetStudent = suggestTargetMode === 'swap' 
        ? students.find(s => s.id === suggestTargetStudentId) 
        : null;
      const reasonLabels: Record<string, string> = {
        'CONVERSA': 'Conversa frequente com colegas ao lado (dispersão)',
        'VISAO': 'Dificuldade visual / necessidade de proximidade da lousa',
        'APOIO': 'Necessidade de mediação ou apoio pedagógico prioritário',
        'ATALHO': 'Conflito interpessoal / recomendação de separação',
        'OUTRO': suggestCustomReason || 'Outra solicitação pedagógica fundamentada'
      };
      const finalReason = reasonLabels[suggestReason] || suggestReason;
      const tRow = suggestTargetMode === 'swap' ? targetStudent?.row : suggestTargetRow;
      const tCol = suggestTargetMode === 'swap' ? targetStudent?.col : suggestTargetCol;
      const payload = {
        classId: selectedClassId,
        studentId: suggestStudent.id,
        studentName: suggestStudent.name,
        currentRow: suggestStudent.row,
        currentCol: suggestStudent.col,
        targetStudentId: targetStudent?.id,
        targetStudentName: targetStudent?.name,
        targetRow: tRow,
        targetCol: tCol,
        reason: finalReason,
        teacherId: user?.id,
        teacherName: user?.name || user?.username || 'Docente',
        notes: suggestCustomReason
      };
      let success = false;
      let sugId = `sug_${Date.now()}`;
      if (window.aquila?.invoke) {
        const res = await window.aquila.invoke('seating:submit-change-suggestion', payload);
        if (res && res.success) {
          success = true;
          sugId = res.suggestionId || sugId;
        }
      } else {
        success = true;
      }
      const newEntry = { ...payload, id: sugId, status: 'PENDENTE', createdAt: new Date().toISOString() };
      const updated = [newEntry, ...pendingSuggestions.filter(p => p.id !== sugId)];
      setPendingSuggestions(updated);
      try {
        localStorage.setItem(`aquila_seating_sug_${selectedClassId}`, JSON.stringify(updated));
      } catch {}
      setShowSuggestModal(false);
      (window as any).showToast?.(`Sugestão enviada à Coordenação com sucesso! (Protocolo #${sugId.slice(-6)})`, 'success');
    } catch (e: any) {
      console.error('[Seating] Erro ao submeter sugestão:', e);
      (window as any).showToast?.('Erro ao enviar sugestão à coordenação.', 'error');
    } finally {
      setIsSubmittingSuggestion(false);
    }
  };
  const handleAuthorizeSuggestion = async (suggestionId: string, action: 'APPROVE' | 'REJECT') => {
    try {
      const sug = pendingSuggestions.find(s => s.id === suggestionId);
      if (!sug) return;
      if (window.aquila?.invoke) {
        const res = await window.aquila.invoke('seating:authorize-suggestion', {
          suggestionId,
          action,
          authorizedBy: user?.name || 'Coordenação Pedagógica'
        });
        if (action === 'APPROVE') {
          setStudents(prev => {
            return prev.map(s => {
              if (s.id === sug.studentId) {
                return { ...s, row: sug.targetRow, col: sug.targetCol };
              }
              if (sug.targetStudentId && s.id === sug.targetStudentId) {
                return { ...s, row: sug.currentRow, col: sug.currentCol };
              }
              return s;
            });
          });
          await loadLayout(selectedClassId);
          (window as any).showToast?.(res?.message || 'Mapeamento autorizado e atualizado com sucesso!', 'success');
        } else {
          (window as any).showToast?.(res?.message || 'Sugestão recusada pela coordenação.', 'info');
        }
      } else {
        if (action === 'APPROVE') {
          setStudents(prev => prev.map(s => {
            if (s.id === sug.studentId) return { ...s, row: sug.targetRow, col: sug.targetCol };
            if (sug.targetStudentId && s.id === sug.targetStudentId) return { ...s, row: sug.currentRow, col: sug.currentCol };
            return s;
          }));
          (window as any).showToast?.('Sugestão autorizada e mapeamento atualizado!', 'success');
        } else {
          (window as any).showToast?.('Sugestão recusada.', 'info');
        }
      }
      const updated = pendingSuggestions.map(s => s.id === suggestionId ? { ...s, status: action === 'APPROVE' ? 'AUTORIZADA' : 'RECUSADA' } : s);
      setPendingSuggestions(updated);
      try {
        localStorage.setItem(`aquila_seating_sug_${selectedClassId}`, JSON.stringify(updated));
      } catch {}
    } catch (e) {
      console.error('[Seating] Erro ao autorizar sugestão:', e);
      (window as any).showToast?.('Erro ao processar autorização da sugestão.', 'error');
    }
  };
  useEffect(() => {
    if (selectedClassId) {
      loadSuggestions(selectedClassId);
    }
  }, [selectedClassId]);
  const [pedagogicalCamera, setPedagogicalCamera] = useState<CameraDevice | null>(null);
  const [activeDetections, setActiveDetections] = useState<Set<string>>(new Set());
  const [spatialAudit, setSpatialAudit] = useState<Record<string, Student['status']>>({});
  const { lastMessage } = useWebSocket();
  useEffect(() => {
    const init = async () => {
      try {
        let teacherClasses: any[] = [];
        try {
          teacherClasses = await window.aquila.invoke('get-classes', user?.id);
          if (!teacherClasses || teacherClasses.length === 0) {
            teacherClasses = await window.aquila.invoke('secretariat:get-teacher-classes', user?.id);
          }
        } catch (e) {
          console.warn('[Seating] Erro ao buscar turmas do professor:', e);
        }
        let allClasses: any[] = [];
        try {
          allClasses = await window.aquila.invoke('get-classes');
          if (!allClasses || allClasses.length === 0) {
            allClasses = await window.aquila.invoke('secretariat:get-teacher-classes');
          }
        } catch (e) {
          console.warn('[Seating] Erro ao buscar todas as turmas:', e);
        }
        const classMap = new Map<string, string>();
        (teacherClasses || []).forEach((c: any) => {
          const id = c.classId || c.id;
          const name = c.className || c.name || id;
          if (id) classMap.set(id, name);
        });
        (allClasses || []).forEach((c: any) => {
          const id = c.classId || c.id;
          const name = c.className || c.name || id;
          if (id && !classMap.has(id)) classMap.set(id, name);
        });
        let mappedClasses = Array.from(classMap.entries()).map(([id, name]) => ({ id, name }));
        if (mappedClasses.length === 0) {
          mappedClasses = [
            { id: 'F-EF27A', name: '7º Ano A' },
            { id: 'F-EF27B', name: '7º Ano B' },
            { id: 'F-EF28A', name: '8º Ano A' },
            { id: 'F-EF28B', name: '8º Ano B' },
            { id: 'F-EF29A', name: '9º Ano A' },
            { id: 'F-EF29B', name: '9º Ano B' }
          ];
        }
        setClasses(mappedClasses);
        // Buscar câmeras disponíveis em bloco isolado
        try {
          const cameras = await window.aquila.invoke('get-cameras');
          const pedCam = cameras?.find((c: any) => c.ip === '192.168.1.105' || c.name?.toLowerCase().includes('pedagógica'));
          setPedagogicalCamera(pedCam || cameras?.[0] || null);
        } catch (camErr) {
          console.warn('[Seating] Aviso ao carregar câmeras:', camErr);
        }
        // Buscar agendamento ativo em bloco isolado
        let targetClassId = mappedClasses[0].id;
        try {
          const activeRes = await window.aquila.invoke('seating:get-active-schedule-for-local-room');
          if (activeRes && activeRes.success && activeRes.classId) {
            targetClassId = activeRes.classId;
          }
        } catch (schedErr) {
          console.warn('[Seating] Sem agendamento local ativo:', schedErr);
        }
        setSelectedClassId(targetClassId);
        await loadLayout(targetClassId);
      } catch (err) {
        console.error('Erro na inicialização de SeatingIntelligence:', err);
      }
    };
    init();
  }, [user?.id]);
  // Monitorar detecções em tempo real
  useEffect(() => {
    if (lastMessage?.type === 'detection') {
      const detectedIds = new Set<string>(
        (lastMessage.data?.detections ?? []).map((d: any) => String(d.id))
      );
      setActiveDetections(detectedIds);
      
      // Limpar detecções após 2 segundos se não houver atualização
      const timer = setTimeout(() => {
        setActiveDetections(new Set());
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [lastMessage]);
  // Auditoria Espacial em Tempo Real
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isLiveMode && selectedClassId && pedagogicalCamera) {
      const performAudit = async () => {
        try {
          const result = await window.aquila.seating.validatePresence(selectedClassId, pedagogicalCamera.name);
          if (result?.summary) {
            const auditMap: Record<string, Student['status']> = {};
            result.details.forEach((d: any) => {
              auditMap[d.studentId] = d.status;
            });
            setSpatialAudit(auditMap);
          }
        } catch (err) {
          console.error('Erro na auditoria espacial:', err);
        }
      };
      performAudit();
      interval = setInterval(performAudit, 10000); // Polling a cada 10s
    } else {
      setSpatialAudit({});
    }
    return () => clearInterval(interval);
  }, [isLiveMode, selectedClassId, pedagogicalCamera]);
  const packStudentsToExactChairs = (rawStudents: any[], targetCols: number) => {
    const total = rawStudents.length;
    const validCols = Math.max(1, Math.min(12, targetCols || 6));
    const exactRows = Math.max(1, Math.ceil(Math.max(1, total) / validCols));
    const occupied = new Set<string>();
    const normalized = rawStudents.map((s: any) => {
      const id = s.id || s.studentId;
      const r = s.row !== null && s.row !== undefined ? Number(s.row) : undefined;
      const c = s.col !== null && s.col !== undefined ? Number(s.col) : undefined;
      if (
        r !== undefined &&
        c !== undefined &&
        r >= 0 &&
        r < exactRows &&
        c >= 0 &&
        c < validCols &&
        r * validCols + c < total &&
        !occupied.has(`${r}-${c}`)
      ) {
        occupied.add(`${r}-${c}`);
        return { ...s, id, name: s.name, row: r, col: c };
      }
      return { ...s, id, name: s.name, row: undefined, col: undefined };
    });
    let seatIdx = 0;
    const packed = normalized.map((s: any) => {
      if (s.row !== undefined && s.col !== undefined) return s;
      while (seatIdx < total) {
        const r = Math.floor(seatIdx / validCols);
        const c = seatIdx % validCols;
        seatIdx++;
        if (!occupied.has(`${r}-${c}`)) {
          occupied.add(`${r}-${c}`);
          return { ...s, row: r, col: c };
        }
      }
      return s;
    });
    return { packed, exactRows, validCols };
  };
  const loadLayout = async (classId: string) => {
    try {
      const layout = await window.aquila.invoke('seating:get-layout', classId);
      if (layout && layout.students && layout.students.length > 0) {
        const preferredCols = layout.cols ? Math.min(8, Math.max(4, layout.cols)) : 6;
        const { packed, exactRows, validCols } = packStudentsToExactChairs(layout.students, preferredCols);
        setCols(validCols);
        setRows(exactRows);
        const loadedDeskX = typeof layout?.deskPos?.x === 'number' ? Math.max(1, Math.min(80, layout.deskPos.x)) : 38;
        setDeskPos({ x: loadedDeskX, y: 0 });
        setStudents(packed);
      } else {
        await loadStudents(classId);
      }
    } catch (err) {
      console.warn('[Seating] Fallback para alunos da turma:', err);
      await loadStudents(classId);
    }
  };
  const loadStudents = async (classId: string = selectedClassId) => {
    if (!classId) return;
    try {
      let data = await window.aquila.invoke('secretariat:get-students-by-class', classId);
      if (!data || data.length === 0) {
        const layout = await window.aquila.invoke('seating:get-layout', classId);
        if (layout && layout.students) data = layout.students;
      }
      if (data && data.length > 0) {
        const preferredCols = cols ? Math.min(8, Math.max(4, cols)) : 6;
        const { packed, exactRows, validCols } = packStudentsToExactChairs(data, preferredCols);
        setCols(validCols);
        setRows(exactRows);
        setStudents(packed);
      } else {
        setStudents([]);
      }
    } catch (err) {
      console.error('Erro ao carregar alunos:', err);
      setStudents([]);
    }
  };
  const saveLayout = async () => {
    try {
      await window.aquila.invoke('seating:save-layout', selectedClassId, { 
        rows, 
        cols, 
        deskPos, 
        students 
      });
      alert('Layout pedagógico persistido com sucesso!');
    } catch (err) {
      console.error('[Seating] Erro ao salvar layout:', err);
      alert('Erro ao salvar layout.');
    }
  };
  const handleColsChange = (newCols: number) => {
    const validCols = Math.max(1, Math.min(12, newCols));
    setStudents(prev => {
      const { packed, exactRows } = packStudentsToExactChairs(prev, validCols);
      setCols(validCols);
      setRows(exactRows);
      return packed;
    });
  };
  const handleRowsChange = (newRows: number) => {
    const minNeededRows = Math.max(1, Math.ceil(Math.max(1, students.length) / cols));
    const validRows = Math.max(minNeededRows, Math.min(15, newRows));
    setRows(validRows);
  };
  const autoReorganizeGrid = () => {
    setStudents(prev => {
      const sorted = [...prev].sort((a, b) => a.name.localeCompare(b.name));
      const exactRows = Math.max(1, Math.ceil(Math.max(1, sorted.length) / cols));
      setRows(exactRows);
      return sorted.map((s, idx) => ({
        ...s,
        row: Math.floor(idx / cols),
        col: idx % cols
      }));
    });
  };
  const saveGridDimensions = async () => {
    if (!selectedClassId) return;
    try {
      await window.aquila.invoke('seating:save-layout', selectedClassId, {
        rows,
        cols,
        deskPos,
        students
      });
      alert(`Grid salvo com sucesso: ${rows} fileiras × ${cols} colunas!`);
      setShowConfigPopover(false);
    } catch (err) {
      console.error('[Seating] Erro ao salvar grid:', err);
      alert('Erro ao salvar grid.');
    }
  };
  const handleDragStart = (student: Student) => {
    if (isLiveMode) return; // Bloquear arrasto no modo live
    setDraggedStudent(student);
  };
  const handleDrop = (r: number, c: number) => {
    if (!draggedStudent || isLiveMode) return;
    
    const targetStudent = students.find(s => s.row === r && s.col === c);
    if (targetStudent && targetStudent.id !== draggedStudent.id) {
      // Soltou aluno sobre outro aluno ocupado -> Grupo de ocorrência
      setInteractionGroup(prev => {
        const next = [...prev];
        if (!next.some(s => s.id === draggedStudent.id)) {
          next.push(draggedStudent);
        }
        if (!next.some(s => s.id === targetStudent.id)) {
          next.push(targetStudent);
        }
        return next;
      });
      setShowInteractionMenu(true);
      setDraggedStudent(null);
      return;
    }
    
    setStudents(prev => {
      const otherStudents = prev.filter(s => s.id !== draggedStudent.id);
      const filtered = otherStudents.map(s => {
        if (s.row === r && s.col === c) {
          return { ...s, row: undefined, col: undefined };
        }
        return s;
      });
      
      return [...filtered, { ...draggedStudent, row: r, col: c }];
    });
    
    setDraggedStudent(null);
  };
  const submitOccurrence = async (type: 'CONVERSA' | 'CELULAR' | 'QUADRO' | 'SONO' | 'INTERRUPCAO' | 'SEM_MATERIAL' | 'FORA_SALA' | 'FORA_MAPA') => {
    try {
      const studentIds = (isReportMode ? selectedReportStudents : interactionGroup).map(s => s.id);
      let desc = '';
      let newStatus: 'focus' | 'fatigue' | 'talking' = 'focus';
      
      switch(type) {
        case 'CONVERSA':
          desc = 'Ocorrência de Conversa Paralela / Grupo de Conversa';
          newStatus = 'talking';
          break;
        case 'CELULAR':
          desc = 'Ocorrência de Uso Indevido de Celular';
          newStatus = 'talking';
          break;
        case 'QUADRO':
          desc = 'Ocorrência de Aluno Desatento / Não Copiando o Quadro';
          newStatus = 'talking';
          break;
        case 'SONO':
          desc = 'Ocorrência de Aluno com Sono ou Dormindo em Sala';
          newStatus = 'fatigue';
          break;
        case 'INTERRUPCAO':
          desc = 'Ocorrência de Interrupção Constante das Aulas';
          newStatus = 'talking';
          break;
        case 'SEM_MATERIAL':
          desc = 'Ocorrência de Aluno sem Apostila ou Material Pedagógico';
          newStatus = 'talking';
          break;
        case 'FORA_SALA':
          desc = 'Ocorrência de Aluno Fora da Sala de Aula';
          newStatus = 'fatigue';
          break;
        case 'FORA_MAPA':
          desc = 'Ocorrência de Aluno Sentado Fora do Mapeamento de Assentos';
          newStatus = 'talking';
          break;
      }
      const result = await window.aquila.seating.registerBehavioralOccurrence({
        studentIds,
        occurrenceType: type,
        description: desc
      });
      if (result && result.success) {
        // Atualizar temporariamente o status dos alunos no mapa em tempo real
        setStudents(prev => prev.map(s => {
          if (studentIds.includes(s.id)) {
            return { ...s, status: newStatus };
          }
          return s;
        }));
        setFeedbackRefreshTrigger(prev => prev + 1);
        window.dispatchEvent(new CustomEvent('aquila:occurrence-saved', { detail: { classId: selectedClassId } }));
        alert('Ocorrência comportamental registrada com sucesso!');
      } else {
        alert('Falha ao registrar ocorrência.');
      }
    } catch (err) {
      console.error('Error submitting occurrence:', err);
      alert('Erro ao salvar ocorrência.');
    } finally {
      setShowInteractionMenu(false);
      setInteractionGroup([]);
      setSelectedReportStudents([]);
    }
  };
  // Atalhos de teclado para barra de ocorrência (1 a 8 e Esc)
  useEffect(() => {
    if (!showInteractionMenu) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
      if (e.key === 'Escape') {
        setShowInteractionMenu(false);
        setInteractionGroup([]);
        setSelectedReportStudents([]);
        return;
      }
      switch (e.key) {
        case '1':
          submitOccurrence('CONVERSA');
          break;
        case '2':
          submitOccurrence('CELULAR');
          break;
        case '3':
          submitOccurrence('QUADRO');
          break;
        case '4':
          submitOccurrence('SONO');
          break;
        case '5':
          submitOccurrence('INTERRUPCAO');
          break;
        case '6':
          submitOccurrence('SEM_MATERIAL');
          break;
        case '7':
          submitOccurrence('FORA_SALA');
          break;
        case '8':
          submitOccurrence('FORA_MAPA');
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showInteractionMenu, isReportMode, selectedReportStudents, interactionGroup, selectedClassId]);
  const unseatStudent = (id: string) => {
    setStudents(prev => prev.map(s => s.id === id ? { ...s, row: undefined, col: undefined } : s));
  };
  // Cálculo de precisão geométrica em tempo real para as linhas de conexão (100% imunes a shifts de layout)
  const updateLinePositions = React.useCallback(() => {
    if (interactionGroup.length < 2 || !mainGridRef.current) {
      setLineCoords([]);
      return;
    }
    const gridEl = mainGridRef.current;
    const gridRect = gridEl.getBoundingClientRect();
    if (!gridRect.width || !gridRect.height) return;

    const zoomScale = (gridZoom || 100) / 100;
    const coords: { x1: number; y1: number; x2: number; y2: number }[] = [];

    for (let i = 0; i < interactionGroup.length - 1; i++) {
      const studentA = interactionGroup[i];
      const studentB = interactionGroup[i + 1];
      const elA = document.getElementById(`student-card-${studentA.id}`);
      const elB = document.getElementById(`student-card-${studentB.id}`);

      if (elA && elB) {
        const rectA = elA.getBoundingClientRect();
        const rectB = elB.getBoundingClientRect();

        // Ponto central exato do cartão relativo ao grid principal (compensado pelo zoom)
        const x1 = (rectA.left + rectA.width / 2 - gridRect.left) / zoomScale;
        const y1 = (rectA.top + rectA.height / 2 - gridRect.top) / zoomScale;
        const x2 = (rectB.left + rectB.width / 2 - gridRect.left) / zoomScale;
        const y2 = (rectB.top + rectB.height / 2 - gridRect.top) / zoomScale;

        coords.push({ x1, y1, x2, y2 });
      } else {
        const sA = students.find(s => s.id === studentA.id);
        const sB = students.find(s => s.id === studentB.id);
        if (sA && sB && sA.row !== undefined && sA.col !== undefined && sB.row !== undefined && sB.col !== undefined) {
          const colWidth = gridRect.width / cols;
          const rowHeight = gridRect.height / rows;
          coords.push({
            x1: (sA.col + 0.5) * colWidth,
            y1: (sA.row + 0.5) * rowHeight,
            x2: (sB.col + 0.5) * colWidth,
            y2: (sB.row + 0.5) * rowHeight
          });
        }
      }
    }
    setLineCoords(coords);
  }, [interactionGroup, students, cols, rows, gridZoom]);

  useEffect(() => {
    updateLinePositions();
    const animId = requestAnimationFrame(updateLinePositions);
    const t1 = setTimeout(updateLinePositions, 40);
    const t2 = setTimeout(updateLinePositions, 120);
    const t3 = setTimeout(updateLinePositions, 280);

    window.addEventListener('resize', updateLinePositions);
    const vp = viewportRef.current;
    if (vp) vp.addEventListener('scroll', updateLinePositions);

    return () => {
      cancelAnimationFrame(animId);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      window.removeEventListener('resize', updateLinePositions);
      if (vp) vp.removeEventListener('scroll', updateLinePositions);
    };
  }, [updateLinePositions, showInteractionMenu, interactionGroup]);

  const renderInteractionLines = () => {
    if (interactionGroup.length < 2 || lineCoords.length === 0) return null;
    return (
      <svg
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 40,
          overflow: 'visible'
        }}
      >
        <defs>
          <filter id="interactionGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        {lineCoords.map((coord, idx) => (
          <g key={`interaction-line-${idx}`}>
            {/* Halo / Glow externo de destaque */}
            <line
              x1={coord.x1}
              y1={coord.y1}
              x2={coord.x2}
              y2={coord.y2}
              stroke="rgba(239, 68, 68, 0.4)"
              strokeWidth="8"
              strokeLinecap="round"
              filter="url(#interactionGlow)"
            />
            {/* Linha tracejada interna de alta nitidez */}
            <line
              x1={coord.x1}
              y1={coord.y1}
              x2={coord.x2}
              y2={coord.y2}
              stroke="#ef4444"
              strokeWidth="3.2"
              strokeDasharray="8,5"
              strokeLinecap="round"
              className="interaction-connection-line"
            />
            {/* Marcadores de ancoragem circular no centro exato de cada aluno */}
            <circle cx={coord.x1} cy={coord.y1} r="5" fill="#ef4444" stroke="#ffffff" strokeWidth="1.5" />
            <circle cx={coord.x2} cy={coord.y2} r="5" fill="#ef4444" stroke="#ffffff" strokeWidth="1.5" />
          </g>
        ))}
      </svg>
    );
  };
  const renderGrid = () => {
    const grid: React.ReactNode[] = [];
    const totalStudents = students.length;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const seatIndex = r * cols + c;
        const student = students.find(s => s.row === r && s.col === c);
        // Não renderiza cadeiras extras além da quantidade real de alunos da turma
        if (totalStudents > 0 && seatIndex >= totalStudents && !student) {
          continue;
        }
        const isDetected = student && activeDetections.has(student.id);
        const auditStatus = student ? spatialAudit[student.id] : null;
        const isHighlighted = student && interactionGroup.some(ig => ig.id === student.id);
        
        grid.push(
          <div 
            key={`${r}-${c}`}
            className={`si-seat ${student ? 'occupied' : 'empty'} ${isDetected ? 'detected' : ''} ${auditStatus === 'MISPLACED' ? 'misplaced-seat' : ''}`}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(r, c)}
          >
            {student ? (
              <div 
                id={`student-card-${student.id}`}
                className={`si-student-token thermometer-blue ${isDetected ? 'detected-glow' : ''} ${auditStatus === 'MISPLACED' ? 'misplaced-glow' : ''} ${auditStatus === 'ABSENT' ? 'absent-token' : ''} ${isHighlighted ? 'in-interaction-group' : ''} ${selectedReportStudents.some(s => s.id === student.id) ? 'selected-report' : ''}`}
                draggable={!isLiveMode && !isReportMode}
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/plain', student.id);
                  handleDragStart(student);
                }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDrop(r, c)}
                onClick={() => {
                  if (isReportMode) {
                    toggleReportStudent(student);
                  } else {
                    // Modo Normal: Seleção e Formação de Grupo por clique direto
                    setInteractionGroup(prev => {
                      const exists = prev.some(s => s.id === student.id);
                      if (exists) {
                        const next = prev.filter(s => s.id !== student.id);
                        if (next.length === 0) {
                          setShowInteractionMenu(false);
                        }
                        return next;
                      } else {
                        const next = [...prev, student];
                        setShowInteractionMenu(true);
                        return next;
                      }
                    });
                  }
                }}
              >
                <div
                  className="seat-card-clean"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    width: '100%',
                    height: '100%',
                    padding: '7px 10px',
                    background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.96) 0%, rgba(30, 41, 59, 0.92) 100%)',
                    borderRadius: '12px',
                    boxSizing: 'border-box',
                    position: 'relative',
                    overflow: 'hidden',
                    border: '1px solid rgba(255, 255, 255, 0.08)'
                  }}
                >
                  <div
                    style={{
                      width: '54px',
                      height: '54px',
                      minWidth: '54px',
                      borderRadius: '11px',
                      overflow: 'hidden',
                      background: '#1e293b',
                      border: '1.5px solid rgba(96, 165, 250, 0.45)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      boxShadow: '0 3px 10px rgba(0, 0, 0, 0.45)'
                    }}
                  >
                    <img 
                      src={getStudentPhoto(student)} 
                      alt={student.name} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 20%', display: 'block' }}
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const fallback = e.currentTarget.parentElement?.querySelector('.seat-fallback-avatar');
                        if (fallback) (fallback as HTMLElement).style.display = 'flex';
                      }}
                    />
                    <div
                      className="seat-fallback-avatar"
                      style={{
                        display: 'none',
                        width: '100%',
                        height: '100%',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '18px',
                        fontWeight: 800,
                        color: '#fff'
                      }}
                    >
                      <span>{(student.name || '?').charAt(0).toUpperCase()}</span>
                    </div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '3px', paddingRight: !isLiveMode ? '22px' : '0' }}>
                    <span
                      title={student.name}
                      style={{
                        fontSize: '13px',
                        fontWeight: 800,
                        color: '#F8FAFC',
                        lineHeight: 1.25,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        wordBreak: 'break-word',
                        letterSpacing: '0.01em'
                      }}
                    >
                      {student.name || 'Aluno'}
                    </span>
                    {pendingSuggestionStudentIds.has(student.id) && (
                      <span style={{ fontSize: '10px', fontWeight: 700, color: '#F59E0B', display: 'inline-flex', alignItems: 'center', gap: '2px', marginTop: '1px' }}>
                        ⏳ Sugestão Enviada
                      </span>
                    )}
                  </div>
                  <div className="seat-top-badges">
                    {auditStatus === 'MISPLACED' && (
                      <span className="seat-badge-chip misplaced" title="Fora do lugar">
                        <AlertTriangle size={10} /> FORA
                      </span>
                    )}
                    {isDetected && (
                      <span className="seat-badge-chip detected" title="Detectado por IA">
                        <Activity size={10} /> IA
                      </span>
                    )}
                  </div>
                    <button 
                    className="seat-suggest-btn" 
                    onClick={(e) => {
                      e.stopPropagation();
                      openSuggestModal(student);
                    }}
                    title="Sugerir alteração de mapeamento à Coordenação"
                  >
                    <ArrowLeftRight size={11} />
                  </button>
                </div>
              </div>
            ) : (
              <span className="seat-coord">{(rows - r)}.{(cols - c)}</span>
            )}
          </div>
        );
      }
    }
    return grid;
  };
  const renderListView = () => {
    const filtered = students.filter(s => 
      !searchTerm || s.name.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => a.name.localeCompare(b.name));
    return (
      <div className="si-list-view-container animate-fade-in" style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, height: '100%', width: '100%', gap: '8px' }}>
        <div className="si-list-header-bar">
          <div className="si-list-stats">
            <span className="si-stat-badge">Total: <strong>{filtered.length}</strong> alunos</span>
            <span className="si-stat-badge mapped">Mapeados: <strong>{filtered.filter(s => s.row !== undefined && s.col !== undefined).length}</strong></span>
            <span className="si-stat-badge unassigned">Sem Carteira: <strong>{filtered.filter(s => s.row === undefined || s.col === undefined).length}</strong></span>
          </div>
          <div className="si-list-search-wrap">
            <Search size={14} />
            <input 
              type="text" 
              placeholder="Filtrar aluno..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="si-list-table-wrap">
          <table className="si-list-table">
            <thead>
              <tr>
                <th style={{ width: '70px' }}>Foto</th>
                <th>Nome do Aluno</th>
                <th>Carteira</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Ações Rápidas</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s, idx) => {
                const isAssigned = s.row !== undefined && s.col !== undefined;
                const isDetected = activeDetections.has(s.id);
                const auditStatus = spatialAudit[s.id];
                const inGroup = interactionGroup.some(ig => ig.id === s.id);
                const inReport = selectedReportStudents.some(rs => rs.id === s.id);
                return (
                  <tr 
                    key={s.id} 
                    className={`si-list-row ${inGroup ? 'row-group' : ''} ${inReport ? 'row-report' : ''}`}
                    onClick={() => {
                      if (isReportMode) {
                        toggleReportStudent(s);
                      } else {
                        setInteractionGroup(prev => {
                          const exists = prev.some(item => item.id === s.id);
                          if (exists) {
                            const next = prev.filter(item => item.id !== s.id);
                            if (next.length === 0) setShowInteractionMenu(false);
                            return next;
                          } else {
                            setShowInteractionMenu(true);
                            return [...prev, s];
                          }
                        });
                      }
                    }}
                  >
                    <td>
                      <div className="si-list-photo-box">
                        <img src={getStudentPhoto(s)} alt={s.name} className="si-list-img" />
                      </div>
                    </td>
                    <td>
                      <div className="si-list-name-col">
                        <span className="si-list-full-name">{s.name}</span>
                        <span className="si-list-id-label">Chamada: {(idx + 1).toString().padStart(2, '0')}</span>
                      </div>
                    </td>
                    <td>
                      {isAssigned ? (
                        <span className="si-list-seat-badge">
                          Fila {rows - (s.row ?? 0)}, Carteira {cols - (s.col ?? 0)}
                        </span>
                      ) : (
                        <span className="si-list-seat-badge empty">Sem carteira</span>
                      )}
                    </td>
                    <td>
                      <div className="si-list-status-chips">
                        {isDetected && <span className="si-chip detected">IA Ativa</span>}
                        {auditStatus === 'MISPLACED' && <span className="si-chip misplaced">Fora Lugar</span>}
                        {!isDetected && auditStatus !== 'MISPLACED' && <span className="si-chip normal">Normal</span>}
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="si-list-action-btns">
                        <button 
                          className="si-list-btn report"
                          onClick={(e) => {
                            e.stopPropagation();
                            setInteractionGroup([s]);
                            setShowInteractionMenu(true);
                          }}
                          title="Registrar ocorrência para este aluno"
                        >
                          Ocorrência
                        </button>
                        {isAssigned && !isLiveMode && (
                          <button 
                            className="si-list-btn unseat"
                            onClick={(e) => {
                              e.stopPropagation();
                              unseatStudent(s.id);
                            }}
                            title="Desocupar carteira"
                          >
                            Liberar
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
      </div>
    );
  };
  const selectedClassName = classes.find(c => c.id === selectedClassId)?.name || selectedClassId;
  const isOutOfGrid = (s: Student) => 
    s.row === undefined || s.row === null || 
    s.col === undefined || s.col === null || 
    s.row >= rows || s.col >= cols;
  const unassignedStudents = students.filter(s => isOutOfGrid(s) && s.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const hasUnassigned = students.some(isOutOfGrid);
  return (
    <div className={`seating-intelligence-container page-root animate-fade-in ${isLiveMode ? 'live-active' : ''} ${showFeedback ? 'with-feedback' : ''} ${isProjectedSeating ? 'is-projected' : ''}`}>
      {showConfigPopover && (
        <div 
          className="si-config-backdrop animate-fade-in"
          onClick={() => setShowConfigPopover(false)}
        />
      )}
      <header className="si-header">
        <div className="si-title-block">
          {onNavigate && (
            <button className="si-nav-btn glass" onClick={() => onNavigate('teacher-dashboard')} title="Painel do Professor">
              <LayoutDashboard size={18} />
            </button>
          )}
          <button className="si-back-btn" onClick={onBack} title="Voltar">
            <ChevronLeft size={18} />
          </button>
          <div className="si-class-selector-wrapper">
            <select 
              className="si-class-select-premium"
              value={selectedClassId} 
              onChange={(e) => {
                const cid = e.target.value;
                setSelectedClassId(cid);
                loadLayout(cid);
              }}
            >
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            {!isLiveMode && (
              <div className="si-config-wrapper" ref={configPopoverRef} style={{ position: 'relative', display: 'inline-block', zIndex: 120 }}>
                <button 
                  className={`si-header-btn config ${showConfigPopover ? 'active' : ''}`}
                  onClick={() => setShowConfigPopover(!showConfigPopover)}
                  title="Configurar Fileiras e Colunas da Sala"
                >
                  <Settings size={15} />
                  <span>{cols} Col × {rows} Fil</span>
                </button>
                {showConfigPopover && (
                  <div 
                    className="si-config-popover animate-fade-in"
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    <div className="si-config-popover-header">
                      <span className="si-config-title">Configurar Sala</span>
                      <button 
                        className="si-config-close" 
                        onClick={() => setShowConfigPopover(false)}
                        title="Fechar"
                      >
                        <X size={14} />
                      </button>
                    </div>
                    <div className="si-config-row">
                      <span className="si-config-label">Colunas:</span>
                      <div className="si-stepper-control">
                        <button 
                          className="si-stepper-btn" 
                          onClick={() => handleColsChange(cols - 1)}
                          disabled={cols <= 1}
                          title="Diminuir Colunas"
                        >
                          <Minus size={13} />
                        </button>
                        <span className="si-stepper-value">{cols}</span>
                        <button 
                          className="si-stepper-btn" 
                          onClick={() => handleColsChange(cols + 1)}
                          disabled={cols >= 15}
                          title="Aumentar Colunas"
                        >
                          <Plus size={13} />
                        </button>
                      </div>
                    </div>
                    <div className="si-config-row">
                      <span className="si-config-label">Fileiras:</span>
                      <div className="si-stepper-control">
                        <button 
                          className="si-stepper-btn" 
                          onClick={() => handleRowsChange(rows - 1)}
                          disabled={rows <= 1}
                          title="Diminuir Fileiras"
                        >
                          <Minus size={13} />
                        </button>
                        <span className="si-stepper-value">{rows}</span>
                        <button 
                          className="si-stepper-btn" 
                          onClick={() => handleRowsChange(rows + 1)}
                          disabled={rows >= 15}
                          title="Aumentar Fileiras"
                        >
                          <Plus size={13} />
                        </button>
                      </div>
                    </div>
                    <div className="si-config-actions">
                      <button 
                        className="si-config-action-btn auto" 
                        onClick={autoReorganizeGrid}
                        title="Distribuir todos os alunos em ordem alfabética nas novas colunas"
                      >
                        <RefreshCw size={12} /> Auto-Distribuir no Grid
                      </button>
                      <button 
                        className="si-config-action-btn save" 
                        onClick={saveGridDimensions}
                        title="Salvar dimensões de colunas e fileiras"
                      >
                        <Save size={12} /> Salvar Grid
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="si-actions">
           {/* Cluster 1: Visualização & Zoom das Carteiras */}
           <div className="si-control-cluster view-zoom-cluster">
             <div className="si-view-toggle">
               <button 
                 className={`si-header-btn ${viewMode === 'grid' ? 'active' : ''}`}
                 onClick={() => setViewMode('grid')}
                 title="Visualização em Mapa de Sala"
               >
                 <LayoutGrid size={14} />
                 <span>Mapa</span>
               </button>
               <button 
                 className={`si-header-btn ${viewMode === 'list' ? 'active' : ''}`}
                 onClick={() => setViewMode('list')}
                 title="Visualização Tradicional em Lista"
               >
                 <List size={14} />
                 <span>Lista</span>
               </button>
             </div>
             {/* Controles de Zoom Dedicados para o Mapa de Carteiras */}
             <div className="si-zoom-controls" role="group" aria-label="Controle de Zoom do Mapa">
               <button 
                 type="button"
                 className="si-zoom-btn" 
                 onClick={() => setGridZoom(prev => Math.max(60, prev - 10))} 
                 title="Diminuir Zoom das Carteiras (Ctrl -)"
                 aria-label="Diminuir Zoom"
               >
                 <ZoomOut size={13} />
               </button>
               <button 
                 type="button"
                 className="si-zoom-value" 
                 onClick={() => setGridZoom(100)} 
                 title="Redefinir Zoom para 100%"
                 aria-label="Redefinir Zoom"
               >
                 {gridZoom}%
               </button>
               <button 
                 type="button"
                 className="si-zoom-btn" 
                 onClick={() => setGridZoom(prev => Math.min(150, prev + 10))} 
                 title="Aumentar Zoom das Carteiras (Ctrl +)"
                 aria-label="Aumentar Zoom"
               >
                 <ZoomIn size={13} />
               </button>
             </div>
           </div>
           {/* Cluster 2: Ferramentas Pedagógicas & Sugestão de Mapeamento */}
           <div className="si-control-cluster tools-cluster">
             <button
               className="si-header-btn"
               onClick={() => {
                 if (onNavigate) onNavigate('gradebook');
                 else window.dispatchEvent(new CustomEvent('aquila:navigate', { detail: 'gradebook' }));
               }}
               title="Abrir Planilha de Notas do Professor"
             >
               <FileText size={14} />
               <span>Notas</span>
             </button>
             {showFeedback && (
               <button 
                 className={`si-header-btn feedback ${isFeedbackExpanded ? 'active' : ''}`}
                 onClick={() => setIsFeedbackExpanded(!isFeedbackExpanded)}
                 title="Relatórios e Ocorrências do Bimestre"
               >
                 <FileText size={14} />
                 <span>Relatórios</span>
               </button>
             )}
             <button 
               className="si-header-btn suggest" 
               onClick={() => openSuggestModal()}
               title="Sugerir alteração do mapeamento de sala para autorização da Coordenação"
               style={{ background: 'rgba(16, 185, 129, 0.18)', borderColor: '#10b981', color: '#10b981' }}
             >
               <ArrowLeftRight size={13} />
               <span>Sugerir Alteração</span>
             </button>
             {pendingSuggestions.length > 0 && (
               <button 
                 className="si-header-btn pending-badge" 
                 onClick={() => setShowPendingModal(true)}
                 title="Ver propostas de alteração de mapeamento da turma"
                 style={{ background: 'rgba(245, 158, 11, 0.18)', borderColor: '#f59e0b', color: '#fbbf24' }}
               >
                 <Clock size={13} />
                 <span>Sugestões ({pendingSuggestions.filter(s => s.status === 'PENDENTE').length})</span>
               </button>
             )}
           </div>
           {/* Legenda de Status Realocada (Compacta no Topo) */}
           <div className="si-legend-compact" role="note" aria-label="Legenda dos Assentos" title="Legenda de status das carteiras">
             <div className="leg-item"><span className="si-leg-dot empty"></span> Vazio</div>
             <div className="leg-item"><span className="si-leg-dot occupied"></span> Ocupado</div>
             <div className="leg-item"><span className="si-leg-dot detected"></span> IA</div>
             <div className="leg-item"><span className="si-leg-dot risk"></span> Atenção</div>
             <div className="leg-item"><span className="si-leg-dot misplaced"></span> Desvio</div>
           </div>
           {/* Cluster 3: Sincronização & Persistência */}
           <div className="si-control-cluster actions-cluster">
             <button className="si-header-btn sync" onClick={() => loadStudents()} disabled={isLiveMode} title="Atualizar Alunos da Turma">
               <RefreshCw size={14} />
             </button>
             
             <button 
               type="button"
               className={`si-header-btn projection ${isProjectedSeating ? 'active' : ''}`} 
               onClick={toggleProjection}
               title={isProjectedSeating ? "Sair da Projeção de Sala (Esc)" : "Projetar Mapeamento de Sala no Telão da Turma"}
               style={{ background: isProjectedSeating ? 'rgba(0, 240, 255, 0.25)' : 'rgba(0, 240, 255, 0.12)', borderColor: '#00F0FF', color: '#00F0FF' }}
             >
               <Tv size={14} />
               <span>{isProjectedSeating ? 'Sair da Projeção' : 'Projetar Mapeamento'}</span>
             </button>
             <button className="si-header-btn save primary" onClick={saveLayout} disabled={isLiveMode} title="Salvar Layout no Banco de Dados">
               <Save size={14} />
               <span>Salvar Mapa</span>
             </button>
           </div>
        </div>
      </header>
      <div className={`si-workspace ${!hasUnassigned ? 'no-sidebar' : ''}`}>
        {!isLiveMode && !isProjectedSeating && hasUnassigned && (
          <aside className="si-sidebar glass">
            <div className="sidebar-header">
              <h3>Lista de Alunos</h3>
              <div className="search-wrap">
                <Search size={14} />
                <input 
                  type="text" 
                  placeholder="Buscar..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <div className="student-inventory">
              <button 
                className="si-btn-save" 
                style={{ width: '100%', marginBottom: '10px', background: 'rgba(59, 130, 246, 0.2)', border: '1px solid rgba(59, 130, 246, 0.5)' }}
                onClick={() => {
                  setStudents(prev => {
                    const occupiedKeys = new Set(
                      prev
                        .filter(st => st.row !== undefined && st.row !== null && st.col !== undefined && st.col !== null)
                        .map(st => `${st.row}-${st.col}`)
                    );
                    let r = 0;
                    let c = 0;
                    return prev.map(s => {
                      if (s.row !== undefined && s.row !== null) return s;
                      while (r < rows && occupiedKeys.has(`${r}-${c}`)) {
                        c++;
                        if (c >= cols) { c = 0; r++; }
                      }
                      if (r >= rows) return s;
                      const assignedRow = r;
                      const assignedCol = c;
                      occupiedKeys.add(`${assignedRow}-${assignedCol}`);
                      c++;
                      if (c >= cols) { c = 0; r++; }
                      return { ...s, row: assignedRow, col: assignedCol };
                    });
                  });
                }}
              >
                <Sparkles size={14} style={{ marginRight: '6px' }} /> Distribuir Automático
              </button>
              {unassignedStudents.map(student => (
                  <div
                    key={student.id}
                    className="si-inventory-card"
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/plain', student.id);
                      handleDragStart(student);
                    }}
                  >
                    <div className="inv-avatar">
                      <img src={getStudentPhoto(student)} alt={student.name} className="inv-photo" />
                    </div>
                    <span>{student.name}</span>
                  </div>
                ))}
            </div>
          </aside>
        )}
        <main className={`si-grid-area ${isLiveMode ? 'full-width' : ''}`}>
          {showInteractionMenu && (
            (isReportMode && selectedReportStudents.length > 0) ||
            (!isReportMode && interactionGroup.length > 0)
          ) && (
            <div className="si-occurrence-bar glass animate-slide-in-down">
              <div className="si-occurrence-top-row">
                <div className="si-occurrence-group-info">
                  {isReportMode ? (
                    <>
                      <span className="si-occurrence-badge-icon">📝</span>
                      <span className="si-occurrence-label">Relato em Lote:</span>
                      <div className="si-occurrence-flow">
                        {selectedReportStudents.map((s, idx) => (
                          <React.Fragment key={s.id}>
                            <span className="si-occurrence-student-name">{s.name.split(' ')[0]}</span>
                            {idx < selectedReportStudents.length - 1 && <span style={{ color: '#10b981', margin: '0 4px' }}>,</span>}
                          </React.Fragment>
                        ))}
                      </div>
                    </>
                  ) : (
                    <>
                      <span className="si-occurrence-badge-icon">🗣️</span>
                      <span className="si-occurrence-label">
                        {interactionGroup.length === 1 ? 'Aluno Selecionado:' : `Grupo (${interactionGroup.length} Alunos):`}
                      </span>
                      <div className="si-occurrence-flow">
                        {interactionGroup.map((s, idx) => (
                          <React.Fragment key={s.id}>
                            <span className="si-occurrence-student-name">{s.name.split(' ')[0]}</span>
                            {idx < interactionGroup.length - 1 && <span className="si-occurrence-arrow">➔</span>}
                          </React.Fragment>
                        ))}
                      </div>
                      <span className="si-occurrence-hint">
                        {interactionGroup.length === 1 
                          ? '💡 Clique ou arraste outro aluno para conectar o grupo' 
                          : '💡 Clique em outros alunos para adicionar ou remover do grupo'}
                      </span>
                    </>
                  )}
                </div>
                <button 
                  className="si-occurrence-close-btn"
                  onClick={() => {
                    setShowInteractionMenu(false);
                    setInteractionGroup([]);
                    setSelectedReportStudents([]);
                  }}
                  title="Limpar Seleção (Esc)"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="si-occurrence-options-bar">
                <button className="si-opt-btn" onClick={() => submitOccurrence('CONVERSA')} title="[1] Conversa / Grupo de Conversa">
                  🗣️ 1. Conversa
                </button>
                <button className="si-opt-btn" onClick={() => submitOccurrence('CELULAR')} title="[2] Uso de Celular">
                  📵 2. Celular
                </button>
                <button className="si-opt-btn" onClick={() => submitOccurrence('QUADRO')} title="[3] Não tá copiando o quadro">
                  📝 3. Não copia
                </button>
                <button className="si-opt-btn" onClick={() => submitOccurrence('SONO')} title="[4] Sono ou dormir na sala">
                  😴 4. Sono
                </button>
                <button className="si-opt-btn danger" onClick={() => submitOccurrence('INTERRUPCAO')} title="[5] Interrupção Constante">
                  ⚠️ 5. Interrupção
                </button>
                <button className="si-opt-btn" onClick={() => submitOccurrence('SEM_MATERIAL')} title="[6] Não trouxeram apostila/material">
                  📚 6. Sem apostila
                </button>
                <button className="si-opt-btn" onClick={() => submitOccurrence('FORA_SALA')} title="[7] Fora da sala de aula">
                  🚪 7. Fora de sala
                </button>
                <button className="si-opt-btn" onClick={() => submitOccurrence('FORA_MAPA')} title="[8] Fora do mapeamento">
                  🗺️ 8. Fora do mapa
                </button>
              </div>
            </div>
          )}
          {viewMode === 'list' ? (
            renderListView()
          ) : (
            <>
              {isLiveMode && pedagogicalCamera && (
                <div className="si-camera-overlay glass animate-slide-in-right">
                  <CameraViewer 
                    cameraId={pedagogicalCamera.id} 
                    cameraUrl={pedagogicalCamera.url} 
                    location={pedagogicalCamera.name}
                  />
                  <div className="camera-badge">LIVE FEED - SALA 101</div>
                </div>
              )}
              <div 
                ref={viewportRef}
                className="si-grid-viewport" 
                onDragOver={(e) => e.preventDefault()}
                onWheel={(e) => {
                  if (e.ctrlKey) {
                    e.preventDefault();
                    if (e.deltaY < 0) {
                      setGridZoom(prev => Math.min(150, prev + 5));
                    } else {
                      setGridZoom(prev => Math.max(60, prev - 5));
                    }
                  }
                }}
              >
                {/* Trilho frontal do Quadro e Mesa do Professor (Desliza somente na horizontal X) */}
                <div className="si-front-board-container" ref={frontRailRef}>
                  <div className="si-blackboard-bar">
                    <span className="si-blackboard-label">QUADRO / LOUSA</span>
                  </div>
                  <div 
                    className={`teacher-desk-slider ${isMovingDesk ? 'moving' : ''} ${isLiveMode ? 'locked' : ''}`}
                    onPointerDown={handleDeskPointerDown}
                    onPointerMove={handleDeskPointerMove}
                    onPointerUp={handleDeskPointerUp}
                    style={{ left: `${deskPos.x}%` }}
                    title="Mesa do Professor (Arraste para reposicionar no quadro)"
                  >
                    <Monitor size={15} />
                    <span className="desk-title">MESA DO PROFESSOR</span>
                    {!isLiveMode && (
                      <div className="desk-drag-indicator" title="Deslizar horizontalmente">
                        <MoveHorizontal size={13} />
                      </div>
                    )}
                  </div>
                </div>
                <div 
                  ref={mainGridRef}
                  className="si-main-grid"
                  style={{
                    position: 'relative',
                    gridTemplateRows: `repeat(${rows}, minmax(72px, 1fr))`,
                    gridTemplateColumns: `repeat(${cols}, minmax(130px, 1fr))`,
                    width: gridZoom !== 100 ? `${10000 / gridZoom}%` : '100%',
                    minHeight: gridZoom !== 100 ? `${10000 / gridZoom}%` : '0',
                    zoom: gridZoom !== 100 ? `${gridZoom}%` : undefined,
                    transition: 'zoom 0.15s ease-out'
                  }}
                >
                  {renderGrid()}
                  {renderInteractionLines()}
                </div>
              </div>
              
            </>
          )}
        </main>
        {showFeedback && selectedClassId && isFeedbackExpanded && (
          <aside className="si-feedback-drawer animate-slide-in-right">
            <div className="si-drawer-header">
              <span className="si-drawer-title">📋 Relatórios do Bimestre</span>
              <button 
                className="si-drawer-close"
                onClick={() => setIsFeedbackExpanded(false)}
                title="Fechar Painel"
              >
                <X size={15} />
              </button>
            </div>
            <div className="si-drawer-body">
              <BimestralFeedbackPanel 
                classId={selectedClassId} 
                className={selectedClassName} 
                refreshTrigger={feedbackRefreshTrigger}
                isExpanded={true}
                onToggleExpand={setIsFeedbackExpanded}
              />
            </div>
          </aside>
        )}
      </div>
      {/* ── Modal de Sugestão de Alteração de Mapeamento (Professor -> Coordenação) ── */}
      {showSuggestModal && (
        <div className="si-modal-overlay animate-fade-in" onClick={() => setShowSuggestModal(false)}>
          <div className="si-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="si-modal-header">
              <div className="si-modal-title-wrap">
                <span className="si-modal-icon-badge"><ArrowLeftRight size={18} /></span>
                <div>
                  <h3 className="si-modal-title">Sugerir Alteração do Mapeamento</h3>
                  <p className="si-modal-subtitle">A proposta será enviada para autorização da Coordenação Pedagógica</p>
                </div>
              </div>
              <button className="si-modal-close" onClick={() => setShowSuggestModal(false)} title="Fechar"><X size={16} /></button>
            </div>
            <div className="si-modal-body">
              {/* Aluno de Origem */}
              <div className="si-form-group">
                <label className="si-form-label">Aluno a ser Remanejado:</label>
                <select 
                  className="si-form-select"
                  value={suggestStudent?.id || ''}
                  onChange={(e) => {
                    const found = students.find(s => s.id === e.target.value);
                    if (found) setSuggestStudent(found);
                  }}
                >
                  {students.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} {s.row !== undefined && s.col !== undefined ? `(Fila ${rows - s.row}, Coluna ${cols - s.col})` : '(Sem carteira)'}
                    </option>
                  ))}
                </select>
              </div>
              {/* Tipo de Destino */}
              <div className="si-form-group">
                <label className="si-form-label">Tipo de Movimentação:</label>
                <div className="si-pill-selector">
                  <button 
                    type="button" 
                    className={`si-pill-opt ${suggestTargetMode === 'swap' ? 'active' : ''}`}
                    onClick={() => setSuggestTargetMode('swap')}
                  >
                    🔄 Trocar de lugar com outro aluno
                  </button>
                  <button 
                    type="button" 
                    className={`si-pill-opt ${suggestTargetMode === 'empty' ? 'active' : ''}`}
                    onClick={() => setSuggestTargetMode('empty')}
                  >
                    📍 Mover para assento vago
                  </button>
                </div>
              </div>
              {/* Destino: Aluno ou Cadeira Vaga */}
              {suggestTargetMode === 'swap' ? (
                <div className="si-form-group">
                  <label className="si-form-label">Trocar de lugar com:</label>
                  <select 
                    className="si-form-select"
                    value={suggestTargetStudentId}
                    onChange={(e) => setSuggestTargetStudentId(e.target.value)}
                  >
                    {students.filter(s => s.id !== suggestStudent?.id).map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} {s.row !== undefined && s.col !== undefined ? `(Fila ${rows - s.row}, Coluna ${cols - s.col})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="si-form-row">
                  <div className="si-form-group" style={{ flex: 1 }}>
                    <label className="si-form-label">Fileira Alvo:</label>
                    <select 
                      className="si-form-select"
                      value={suggestTargetRow}
                      onChange={(e) => setSuggestTargetRow(Number(e.target.value))}
                    >
                      {Array.from({ length: rows }).map((_, idx) => (
                        <option key={idx} value={idx}>Fila {rows - idx}</option>
                      ))}
                    </select>
                  </div>
                  <div className="si-form-group" style={{ flex: 1 }}>
                    <label className="si-form-label">Coluna Alvo:</label>
                    <select 
                      className="si-form-select"
                      value={suggestTargetCol}
                      onChange={(e) => setSuggestTargetCol(Number(e.target.value))}
                    >
                      {Array.from({ length: cols }).map((_, idx) => (
                        <option key={idx} value={idx}>Coluna {cols - idx}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
              {/* Justificativa Pedagógica */}
              <div className="si-form-group">
                <label className="si-form-label">Justificativa Pedagógica:</label>
                <div className="si-reasons-grid">
                  {[
                    { id: 'CONVERSA', label: '🗣️ Conversas paralelas / distração' },
                    { id: 'VISAO', label: '👓 Dificuldade visual / aproximar da lousa' },
                    { id: 'APOIO', label: '🤝 Necessidade de tutoria / apoio' },
                    { id: 'ATALHO', label: '⚠️ Conflito interpessoal / afastar' },
                    { id: 'OUTRO', label: '✏️ Outro motivo' }
                  ].map(r => (
                    <button
                      key={r.id}
                      type="button"
                      className={`si-reason-pill ${suggestReason === r.id ? 'active' : ''}`}
                      onClick={() => setSuggestReason(r.id)}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>
              {/* Campo para Observações Extras */}
              <div className="si-form-group">
                <label className="si-form-label">Detalhes para a Coordenação (Opcional):</label>
                <textarea
                  className="si-form-textarea"
                  rows={2}
                  placeholder="Ex: Aluno relatou dificuldade em enxergar a lousa nas últimas semanas..."
                  value={suggestCustomReason}
                  onChange={(e) => setSuggestCustomReason(e.target.value)}
                />
              </div>
            </div>
            <div className="si-modal-footer">
              <button type="button" className="si-btn-cancel" onClick={() => setShowSuggestModal(false)}>Cancelar</button>
              <button 
                type="button" 
                className="si-btn-submit-suggest"
                onClick={handleSendSuggestion}
                disabled={isSubmittingSuggestion}
              >
                <Send size={14} />
                <span>{isSubmittingSuggestion ? 'Enviando...' : 'Enviar Sugestão à Coordenação'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ── Modal de Gestão e Autorização da Coordenação ── */}
      {showPendingModal && (
        <div className="si-modal-overlay animate-fade-in" onClick={() => setShowPendingModal(false)}>
          <div className="si-modal-content wide" onClick={(e) => e.stopPropagation()}>
            <div className="si-modal-header">
              <div className="si-modal-title-wrap">
                <span className="si-modal-icon-badge coord"><CheckCircle2 size={18} /></span>
                <div>
                  <h3 className="si-modal-title">Sugestões de Mapeamento — Painel da Coordenação</h3>
                  <p className="si-modal-subtitle">Autorize propostas enviadas pelos docentes para atualizar o mapa em tempo real</p>
                </div>
              </div>
              <button className="si-modal-close" onClick={() => setShowPendingModal(false)} title="Fechar"><X size={16} /></button>
            </div>
            <div className="si-modal-body">
              {pendingSuggestions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#94a3b8' }}>
                  Nenhuma sugestão pendente para esta turma no momento.
                </div>
              ) : (
                <div className="si-sug-list">
                  {pendingSuggestions.map(sug => (
                    <div key={sug.id} className={`si-sug-card ${sug.status.toLowerCase()}`}>
                      <div className="si-sug-card-header">
                        <div className="si-sug-card-title">
                          <strong>{sug.studentName}</strong>
                          <span className="si-sug-arrow">➔</span>
                          <span>{sug.targetStudentName ? `Troca com ${sug.targetStudentName}` : `Cadeira (Fila ${rows - sug.targetRow}, Col ${cols - sug.targetCol})`}</span>
                        </div>
                        <span className={`si-sug-status-badge ${sug.status.toLowerCase()}`}>{sug.status}</span>
                      </div>
                      <div className="si-sug-details">
                        <span className="si-sug-meta">Solicitante: <strong>{sug.teacherName || 'Docente'}</strong></span>
                        <span className="si-sug-reason">Motivo: <em>"{sug.reason}"</em></span>
                        {sug.notes && <span className="si-sug-notes">Obs: {sug.notes}</span>}
                      </div>
                      {sug.status === 'PENDENTE' && (
                        <div className="si-sug-actions">
                          <button 
                            type="button" 
                            className="si-btn-sug-reject" 
                            onClick={() => handleAuthorizeSuggestion(sug.id, 'REJECT')}
                          >
                            Recusar
                          </button>
                          <button 
                            type="button" 
                            className="si-btn-sug-approve" 
                            onClick={() => handleAuthorizeSuggestion(sug.id, 'APPROVE')}
                          >
                            <CheckCircle2 size={13} />
                            <span>Autorizar e Aplicar Mapeamento</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="si-modal-footer">
              <button type="button" className="si-btn-cancel" onClick={() => setShowPendingModal(false)}>Fechar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default SeatingIntelligence;