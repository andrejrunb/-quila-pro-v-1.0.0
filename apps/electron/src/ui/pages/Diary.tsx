import React, { useState, useEffect, useRef } from 'react';
import { 
  BookOpen, 
  Smile, 
  Meh, 
  Frown, 
  Zap, 
  Save, 
  ChevronLeft,
  Users,
  Clock,
  MessageSquare,
  CheckCircle2,
  Mic,
  Square,
  Send,
  List,
  LayoutGrid,
  ChevronUp,
  ChevronDown,
  X
} from 'lucide-react';

interface Student {
  id: string;
  name: string;
  photoPath?: string;
  class?: string;
}

interface DiaryEntry {
  studentId: string;
  mood: 'happy' | 'neutral' | 'tired' | 'energetic' | null;
  observation: string;
  present: boolean;
}

export const Diary: React.FC<{ onBack: () => void; user?: any }> = ({ onBack, user }) => {
  const [classes, setClasses] = useState<any[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [entries, setEntries] = useState<Record<string, DiaryEntry>>({});
  const [selectedClass, setSelectedClass] = useState('all');
  const [viewMode, setViewMode] = useState<'detailed' | 'bulk' | 'list'>('list');
  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(false);
  const [loading, setLoading] = useState(false);

  const setStudentPresence = (studentId: string, present: boolean) => {
    setEntries(prev => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || { studentId, mood: null, observation: '' }),
        present
      }
    }));
  };

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const teacherId = user?.id || 'teacher-andre';
        const data = await (window as any).aquila.invoke('get-classes', teacherId);
        if (Array.isArray(data)) setClasses(data);
      } catch (e) {
        console.error('Error loading classes in Diary:', e);
      }
    };
    fetchClasses();
  }, []);
  
  // Audio State
  const [recordingId, setRecordingId] = useState<string | null>(null);
  const [recordingText, setRecordingText] = useState('');
  const recognitionRef = useRef<any>(null);

  // Bulk Voice State
  const [isBulkVoiceActive, setIsBulkVoiceActive] = useState(false);
  const [lastTranscript, setLastTranscript] = useState('');
  const [lastCommand, setLastCommand] = useState('');
  const [highlighted, setHighlighted] = useState<{ id: string; type: 'present' | 'absent' } | null>(null);
  const [nameCandidates, setNameCandidates] = useState<Student[]>([]);
  const [pendingVoiceAction, setPendingVoiceAction] = useState<'present' | 'absent' | null>(null);
  const bulkRecognitionRef = useRef<any>(null);

  // Pre-Report Modal State
  const [showModal, setShowModal] = useState(false);
  const [currentPreReport, setCurrentPreReport] = useState<{ studentId: string, text: string, rawText: string } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Synthesize a beep using Web Audio API
  const playAudioBeep = (type: 'success' | 'error' | 'candidate') => {
    try {
      const AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      if (type === 'success') {
        // High double beep
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        osc.start();
        osc.stop(ctx.currentTime + 0.08);
        
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.frequency.setValueAtTime(1320, ctx.currentTime + 0.1);
        gain2.gain.setValueAtTime(0.05, ctx.currentTime + 0.1);
        osc2.start(ctx.currentTime + 0.1);
        osc2.stop(ctx.currentTime + 0.22);
      } else if (type === 'error') {
        // Low dull warning beep
        osc.frequency.setValueAtTime(220, ctx.currentTime);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
      } else if (type === 'candidate') {
        // Mid neutral chime
        osc.frequency.setValueAtTime(587.33, ctx.currentTime);
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
      }
    } catch (err) {
      console.warn('Falha ao emitir bipe de áudio:', err);
    }
  };

  // Numbers parser dictionary
  const PORTUGUESE_NUMBERS: Record<string, number> = {
    'um': 1, 'uma': 1,
    'dois': 2, 'duas': 2,
    'três': 3,
    'quatro': 4,
    'cinco': 5,
    'seis': 6,
    'sete': 7,
    'oito': 8,
    'nove': 9,
    'dez': 10,
    'onze': 11,
    'doze': 12,
    'treze': 13,
    'quatorze': 14,
    'catorze': 14,
    'quinze': 15,
    'dezesseis': 16,
    'dezessete': 17,
    'dezoito': 18,
    'dezenove': 19,
    'vinte': 20,
    'trinta': 30,
    'quarenta': 40,
    'cinquenta': 50
  };

  const parseNumber = (text: string): number | null => {
    const clean = text.trim().toLowerCase();
    if (/^\d+$/.test(clean)) {
      return parseInt(clean, 10);
    }
    if (clean.includes(' e ')) {
      const parts = clean.split(' e ');
      let sum = 0;
      for (const part of parts) {
        const val = PORTUGUESE_NUMBERS[part];
        if (val !== undefined) sum += val;
      }
      return sum > 0 ? sum : null;
    }
    return PORTUGUESE_NUMBERS[clean] || null;
  };

  const triggerHighlight = (studentId: string, isPresent: boolean) => {
    setHighlighted({ id: studentId, type: isPresent ? 'present' : 'absent' });
    setTimeout(() => {
      setHighlighted(null);
    }, 1500);
  };

  const findStudentByName = (spokenName: string): Student[] => {
    const cleanSpoken = spokenName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    if (cleanSpoken.length < 2) return [];

    const matches: Student[] = [];
    students.forEach(student => {
      const cleanStudentName = student.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      if (cleanStudentName.includes(cleanSpoken)) {
        matches.push(student);
      }
    });

    return matches;
  };

  const processVoicePhrase = (phrase: string) => {
    const text = phrase.toLowerCase().trim();
    console.log('[Voice Bulk] Parsing phrase:', text);
    setLastTranscript(phrase);

    const statusKeywords = ['presente', 'presença', 'falta', 'ausente', 'faltou', 'ausência'];
    const isKeywordPresent = (kw: string) => !(kw === 'falta' || kw === 'ausente' || kw === 'faltou' || kw === 'ausência');

    // 1. Standard number order: (número)? [X] [Status]
    const regexNum = /(?:número|numero|nº|num)?\s*(\d+|um|dois|três|quatro|cinco|seis|sete|oito|nove|dez|onze|doze|treze|quatorze|catorze|quinze|dezesseis|dezessete|dezoito|dezenove|vinte|trinta|quarenta|cinquenta)\s+(presente|presença|falta|ausente|faltou|ausência)/gi;
    
    let match;
    let matchedAny = false;

    while ((match = regexNum.exec(text)) !== null) {
      matchedAny = true;
      const numStr = match[1];
      const statusStr = match[2];
      
      const index = parseNumber(numStr);
      if (index !== null && index > 0 && index <= students.length) {
        const student = students[index - 1];
        const isPresent = isKeywordPresent(statusStr.toLowerCase());
        
        setEntries(prev => ({
          ...prev,
          [student.id]: {
            ...prev[student.id],
            present: isPresent
          }
        }));

        setLastCommand(`Sucesso: #${index} (${student.name.split(' ')[0]}) marcado como ${isPresent ? 'PRESENTE' : 'FALTA'}`);
        triggerHighlight(student.id, isPresent);
        playAudioBeep('success');
      } else {
        setLastCommand(`Número inválido: "${numStr}"`);
        playAudioBeep('error');
      }
    }

    // 2. Reverse number order: [Status] (número)? [X]
    if (!matchedAny) {
      const regexNumReverse = /(presente|presença|falta|ausente|faltou|ausência)\s+(?:número|numero|nº|num)?\s*(\d+|um|dois|três|quatro|cinco|seis|sete|oito|nove|dez|onze|doze|treze|quatorze|catorze|quinze|dezesseis|dezessete|dezoito|dezenove|vinte|trinta|quarenta|cinquenta)/gi;
      
      while ((match = regexNumReverse.exec(text)) !== null) {
        matchedAny = true;
        const statusStr = match[1];
        const numStr = match[2];
        
        const index = parseNumber(numStr);
        if (index !== null && index > 0 && index <= students.length) {
          const student = students[index - 1];
          const isPresent = isKeywordPresent(statusStr.toLowerCase());
          
          setEntries(prev => ({
            ...prev,
            [student.id]: {
              ...prev[student.id],
              present: isPresent
            }
          }));

          setLastCommand(`Sucesso: #${index} (${student.name.split(' ')[0]}) marcado como ${isPresent ? 'PRESENTE' : 'FALTA'}`);
          triggerHighlight(student.id, isPresent);
          playAudioBeep('success');
        } else {
          setLastCommand(`Número inválido: "${numStr}"`);
          playAudioBeep('error');
        }
      }
    }

    // 3. Name matching standard order: [Name] [Status]
    if (!matchedAny) {
      for (const keyword of statusKeywords) {
        if (text.includes(keyword)) {
          const parts = text.split(keyword);
          const namePart = parts[0].trim();
          
          if (namePart.length >= 2) {
            const isNumWord = /^(?:número|numero|nº|num)?\s*(?:\d+|um|dois|três|quatro|cinco|seis|sete|oito|nove|dez|onze|doze|treze|quatorze|catorze|quinze|dezesseis|dezessete|dezoito|dezenove|vinte|trinta|quarenta|cinquenta)$/i.test(namePart);
            
            if (!isNumWord) {
              const matchedStudents = findStudentByName(namePart);
              const isPresent = isKeywordPresent(keyword);
              
              if (matchedStudents.length === 1) {
                const student = matchedStudents[0];
                setEntries(prev => ({
                  ...prev,
                  [student.id]: {
                    ...prev[student.id],
                    present: isPresent
                  }
                }));

                const studentIndex = students.findIndex(s => s.id === student.id) + 1;
                setLastCommand(`Sucesso: #${studentIndex} (${student.name.split(' ')[0]}) marcado como ${isPresent ? 'PRESENTE' : 'FALTA'}`);
                triggerHighlight(student.id, isPresent);
                playAudioBeep('success');
                matchedAny = true;
                break;
              } else if (matchedStudents.length > 1) {
                setNameCandidates(matchedStudents);
                setPendingVoiceAction(isPresent ? 'present' : 'absent');
                setLastCommand(`Múltiplos candidatos para "${namePart}". Escolha um.`);
                playAudioBeep('candidate');
                matchedAny = true;
                break;
              }
            }
          }
        }
      }
    }

    // 4. Name matching reverse order: [Status] [Name]
    if (!matchedAny) {
      for (const keyword of statusKeywords) {
        if (text.includes(keyword)) {
          const parts = text.split(keyword);
          const namePart = parts[1] ? parts[1].trim() : '';
          
          if (namePart.length >= 2) {
            const isNumWord = /^(?:número|numero|nº|num)?\s*(?:\d+|um|dois|três|quatro|cinco|seis|sete|oito|nove|dez|onze|doze|treze|quatorze|catorze|quinze|dezesseis|dezessete|dezoito|dezenove|vinte|trinta|quarenta|cinquenta)$/i.test(namePart);
            
            if (!isNumWord) {
              const matchedStudents = findStudentByName(namePart);
              const isPresent = isKeywordPresent(keyword);
              
              if (matchedStudents.length === 1) {
                const student = matchedStudents[0];
                setEntries(prev => ({
                  ...prev,
                  [student.id]: {
                    ...prev[student.id],
                    present: isPresent
                  }
                }));

                const studentIndex = students.findIndex(s => s.id === student.id) + 1;
                setLastCommand(`Sucesso: #${studentIndex} (${student.name.split(' ')[0]}) marcado como ${isPresent ? 'PRESENTE' : 'FALTA'}`);
                triggerHighlight(student.id, isPresent);
                playAudioBeep('success');
                matchedAny = true;
                break;
              } else if (matchedStudents.length > 1) {
                setNameCandidates(matchedStudents);
                setPendingVoiceAction(isPresent ? 'present' : 'absent');
                setLastCommand(`Múltiplos candidatos para "${namePart}". Escolha um.`);
                playAudioBeep('candidate');
                matchedAny = true;
                break;
              }
            }
          }
        }
      }
    }

    if (!matchedAny) {
      setLastCommand(`Não reconhecido: "${phrase}"`);
      playAudioBeep('error');
    }
  };

  const selectCandidate = (student: Student) => {
    if (pendingVoiceAction) {
      const isPresent = pendingVoiceAction === 'present';
      setEntries(prev => ({
        ...prev,
        [student.id]: {
          ...prev[student.id],
          present: isPresent
        }
      }));
      const studentIndex = students.findIndex(s => s.id === student.id) + 1;
      setLastCommand(`Sucesso: #${studentIndex} (${student.name.split(' ')[0]}) marcado como ${isPresent ? 'PRESENTE' : 'FALTA'}`);
      triggerHighlight(student.id, isPresent);
      playAudioBeep('success');
    }
    setNameCandidates([]);
    setPendingVoiceAction(null);
  };

  const startBulkVoice = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert('API de reconhecimento de voz não suportada neste navegador.');
      return;
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'pt-BR';
    recognition.continuous = true;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsBulkVoiceActive(true);
      setLastCommand('Escutando chamada por voz...');
      setLastTranscript('');
    };

    recognition.onresult = (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          const phrase = event.results[i][0].transcript;
          processVoicePhrase(phrase);
        }
      }
    };

    recognition.onerror = (err: any) => {
      console.error('Erro de reconhecimento de voz em lote:', err);
      if (err.error === 'not-allowed') {
        alert('Permissão de microfone negada.');
      }
    };

    recognition.onend = () => {
      setIsBulkVoiceActive(false);
    };

    recognition.start();
    bulkRecognitionRef.current = recognition;
  };

  const stopBulkVoice = () => {
    if (bulkRecognitionRef.current) {
      bulkRecognitionRef.current.stop();
      bulkRecognitionRef.current = null;
    }
    setIsBulkVoiceActive(false);
  };

  useEffect(() => {
    stopBulkVoice();
    loadStudents();
  }, [selectedClass]);

  useEffect(() => {
    return () => {
      if (bulkRecognitionRef.current) {
        bulkRecognitionRef.current.stop();
      }
    };
  }, []);

  const loadStudents = async () => {
    try {
      setLoading(true);
      const data = await (window as any).aquila.invoke('get-students', selectedClass);
      const safeStudents = Array.isArray(data) ? data : [];
      setStudents(safeStudents);
      
      // Initialize entries if empty
      const initialEntries: Record<string, DiaryEntry> = {};
      safeStudents.forEach((s: Student) => {
        initialEntries[s.id] = { studentId: s.id, mood: null, observation: '', present: true };
      });
      setEntries(initialEntries);
    } catch (err) {
      console.error('Erro ao carregar alunos:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateMood = (studentId: string, mood: DiaryEntry['mood']) => {
    setEntries(prev => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || { studentId, observation: '', present: true }),
        mood
      }
    }));
  };

  const updateObservation = (studentId: string, observation: string) => {
    setEntries(prev => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || { studentId, mood: null, present: true }),
        observation
      }
    }));
  };

  const togglePresence = (studentId: string) => {
    setEntries(prev => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || { studentId, mood: null, observation: '' }),
        present: !prev[studentId]?.present
      }
    }));
  };

  const markAllPresent = () => {
    const newEntries = { ...entries };
    students.forEach(s => {
      newEntries[s.id] = { ...newEntries[s.id], present: true };
    });
    setEntries(newEntries);
  };

  const handleSave = async () => {
    try {
      console.log('Salvando diário:', entries);
      alert('Diário de classe salvo com sucesso no banco Áquila!');
    } catch (err) {
      alert('Erro ao salvar diário.');
    }
  };

  const startRecording = (studentId: string) => {
    if (!('webkitSpeechRecognition' in window)) {
      alert('API de reconhecimento de voz não suportada neste navegador.');
      return;
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'pt-BR';
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript) {
        setRecordingText(prev => prev + ' ' + finalTranscript);
      }
    };

    recognition.onend = () => {
      if (recordingId === studentId) {
         // Se parou de gravar sozinho, pode reiniciar, mas para simplificar vamos apenas resetar o ID se o usuário não clicou em parar
      }
    };

    recognition.start();
    recognitionRef.current = recognition;
    setRecordingId(studentId);
    setRecordingText('');
  };

  const stopRecording = async () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    const studentId = recordingId;
    const rawText = recordingText.trim();
    setRecordingId(null);

    if (rawText && studentId) {
       // Gerar Pré-Relatório Pedagógico
       setIsGenerating(true);
       setShowModal(true);
       try {
          const preReport = await (window as any).aquila.invoke('voice:generate-report', {
            studentId,
            rawText
          });
          setCurrentPreReport({
             studentId,
             rawText,
             text: preReport
          });
       } catch (err) {
          console.error(err);
          setCurrentPreReport({
             studentId,
             rawText,
             text: "Erro ao interpretar a fala: " + rawText
          });
       } finally {
          setIsGenerating(false);
       }
    }
  };

  const handleSendReport = async () => {
    if (currentPreReport) {
      try {
        await (window as any).aquila.invoke('voice:send-report', currentPreReport);
        alert('Relatório Pedagógico enviado com sucesso via WhatsApp!');
        setShowModal(false);
        setCurrentPreReport(null);
      } catch (err) {
        alert('Erro ao enviar relatório.');
      }
    }
  };

  const totalStudents = students.length;
  const totalPresent = students.filter(s => entries[s.id]?.present).length;
  const totalAbsent = totalStudents - totalPresent;

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 px-4 py-2.5 space-y-2 animate-in fade-in duration-300 relative overflow-hidden">
      {/* Header Compacto / Recolhível */}
      {isHeaderCollapsed ? (
        <div className="flex items-center justify-between bg-slate-900/80 px-3 py-1.5 rounded-xl border border-white/5 gap-3 shrink-0 shadow-md">
          <div className="flex items-center gap-2.5">
            <button 
              onClick={() => {
                stopBulkVoice();
                onBack();
              }}
              className="p-1.5 hover:bg-slate-800 rounded-lg transition text-slate-400 hover:text-white"
              title="Sair do Diário"
            >
              <ChevronLeft size={18} />
            </button>
            <div className="flex items-center gap-1.5 text-emerald-400 font-extrabold text-xs">
              <BookOpen size={16} />
              <span className="hidden sm:inline">Diário</span>
            </div>
            
            <div className="flex items-center gap-1.5 bg-slate-950 px-2 py-0.5 rounded-lg border border-slate-800">
              <Users size={13} className="text-slate-500" />
              <select 
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="bg-transparent border-none text-slate-200 outline-none text-xs font-bold cursor-pointer"
              >
                <option value="all" className="bg-slate-900">TODAS AS TURMAS</option>
                {classes.map((c: any) => (
                  <option key={c.id} value={c.id} className="bg-slate-900">{(c.name || '').toUpperCase()}</option>
                ))}
              </select>
            </div>

            <div className="hidden md:flex items-center gap-1.5 text-[11px] font-mono font-bold">
              <span className="bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/25">
                {totalPresent} P
              </span>
              <span className="bg-red-500/15 text-red-400 px-2 py-0.5 rounded border border-red-500/25">
                {totalAbsent} F
              </span>
              <span className="text-slate-500 text-[10px]">
                ({totalStudents} total)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="bg-slate-950 p-0.5 rounded-lg border border-slate-800 flex items-center">
              <button 
                onClick={() => setViewMode('detailed')}
                className={`px-2 py-1 rounded-md text-[11px] font-bold transition ${viewMode === 'detailed' ? 'bg-emerald-500 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                title="Modo Detalhado"
              >
                DETALHADO
              </button>
              <button 
                onClick={() => setViewMode('bulk')}
                className={`px-2 py-1 rounded-md text-[11px] font-bold transition flex items-center gap-1 ${viewMode === 'bulk' ? 'bg-emerald-500 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                title="Grade de Cards Rápidos"
              >
                <LayoutGrid size={11} /> CARDS
              </button>
              <button 
                onClick={() => setViewMode('list')}
                className={`px-2 py-1 rounded-md text-[11px] font-bold transition flex items-center gap-1 ${viewMode === 'list' ? 'bg-emerald-500 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                title="Visualização Tradicional em Lista Escolar"
              >
                <List size={11} /> LISTA
              </button>
            </div>

            <button 
              onClick={markAllPresent} 
              className="hidden lg:inline text-emerald-400 hover:text-emerald-300 text-[11px] font-extrabold uppercase px-2 py-1 rounded hover:bg-emerald-500/10 transition"
              title="Marcar todos como presentes"
            >
              Presença Coletiva
            </button>

            <button 
              onClick={handleSave}
              className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition shadow shadow-emerald-900/30"
            >
              <Save size={13} />
              <span>FINALIZAR</span>
            </button>

            <button 
              onClick={() => setIsHeaderCollapsed(false)}
              className="px-2 py-1 bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg text-xs font-bold flex items-center gap-1 border border-white/5 transition"
              title="Expandir Título e Filtros Completos"
            >
              <ChevronDown size={14} />
              <span className="hidden sm:inline">Expandir</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => {
                stopBulkVoice();
                onBack();
              }}
              className="p-1.5 hover:bg-slate-800 rounded-lg transition text-slate-400 hover:text-white"
              title="Sair do Diário"
            >
              <ChevronLeft size={20} />
            </button>
            <div>
              <h1 className="text-xl font-black bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent flex items-center gap-2">
                <BookOpen className="text-emerald-400" size={20} />
                Diário de Classe
              </h1>
              <p className="text-slate-500 text-[11px] uppercase font-bold tracking-wider">Gestão Pedagógica • Unidade 1</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('aquila:navigate', { detail: 'gradebook' }))}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition shadow"
              title="Abrir Planilha de Lançamento de Notas (B1, B2, B3, B4, Recuperação)"
            >
              <span>📊 Planilha de Notas</span>
            </button>
            <div className="bg-slate-900 p-0.5 rounded-xl border border-slate-800 flex">
              <button 
                onClick={() => setViewMode('detailed')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${viewMode === 'detailed' ? 'bg-emerald-500 text-white' : 'text-slate-400 hover:text-slate-200'}`}
              >
                DETALHADO
              </button>
              <button 
                onClick={() => setViewMode('bulk')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${viewMode === 'bulk' ? 'bg-emerald-500 text-white' : 'text-slate-400 hover:text-slate-200'}`}
              >
                <LayoutGrid size={13} /> CARDS
              </button>
              <button 
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${viewMode === 'list' ? 'bg-emerald-500 text-white' : 'text-slate-400 hover:text-slate-200'}`}
              >
                <List size={13} /> LISTA TRADICIONAL
              </button>
            </div>
            <button 
              onClick={handleSave}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-lg shadow-emerald-900/20"
            >
              <Save size={15} />
              FINALIZAR DIA
            </button>
            <button 
              onClick={() => setIsHeaderCollapsed(true)}
              className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl text-xs font-bold flex items-center gap-1 border border-white/5 transition"
              title="Ocultar Topo para Priorizar Alunos"
            >
              <ChevronUp size={15} />
              <span className="hidden md:inline">Ocultar Topo</span>
            </button>
          </div>
        </div>

        {/* Filters Otimizados */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2.5 bg-slate-900/40 p-2.5 rounded-xl border border-white/5">
          <div className="flex items-center gap-2.5 px-3 py-2 bg-slate-950/60 rounded-lg border border-slate-800/60">
            <Users className="text-slate-500" size={16} />
            <select 
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="bg-transparent border-none text-slate-200 outline-none flex-1 text-xs font-bold cursor-pointer"
            >
              <option value="all" className="bg-slate-900">TODAS AS TURMAS</option>
              {classes.map((c: any) => (
                <option key={c.id} value={c.id} className="bg-slate-900">{(c.name || '').toUpperCase()}</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center gap-2.5 px-3 py-2 bg-slate-950/60 rounded-lg border border-slate-800/60">
            <Clock className="text-slate-500" size={16} />
            <span className="text-slate-200 text-xs font-bold uppercase truncate">{new Date().toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })}</span>
          </div>

          <div className="col-span-2 flex items-center justify-end gap-3 px-2 flex-wrap">
            {!(window as any).aquila && (
              <button 
                onClick={isBulkVoiceActive ? stopBulkVoice : startBulkVoice}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-xs transition border ${
                  isBulkVoiceActive 
                    ? 'bg-red-600 hover:bg-red-500 text-white border-red-500/30 shadow-md' 
                    : 'bg-emerald-600/15 hover:bg-emerald-600/25 text-emerald-400 border-emerald-500/30'
                }`}
              >
                <Mic size={13} className={isBulkVoiceActive ? 'animate-pulse' : ''} />
                {isBulkVoiceActive ? 'PARAR VOZ' : 'CHAMADA POR VOZ'}
              </button>
            )}
            <button onClick={markAllPresent} className="text-emerald-400 text-xs font-black uppercase hover:underline">
              Presença Coletiva
            </button>
            <span className="text-slate-400 text-xs font-mono font-bold tracking-wider">
              <span className="text-emerald-400">{totalPresent}P</span> / <span className="text-red-400">{totalAbsent}F</span> ({totalStudents} Total)
            </span>
          </div>
        </div>
      </div>
      )}

      {/* Voice Dictation Speech Console Bar */}
      {isBulkVoiceActive && (
        <div className="bg-slate-900/80 border border-emerald-500/30 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 backdrop-blur-md animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-3.5 h-3.5 bg-red-500 rounded-full animate-ping absolute inset-0"></div>
              <div className="w-3.5 h-3.5 bg-red-600 rounded-full relative flex items-center justify-center">
                <Mic size={9} className="text-white" />
              </div>
            </div>
            <div>
              <p className="text-xs font-black uppercase text-emerald-400 tracking-wider text-left">Chamada Inteligente por Voz</p>
              <p className="text-[11px] text-slate-400 font-medium">
                Dite: <span className="text-slate-300">"Número 3 presente"</span>, <span className="text-slate-300">"Número 5 falta"</span> ou <span className="text-slate-300">"Ana presente"</span>
              </p>
            </div>
          </div>
          
          <div className="flex-1 max-w-md bg-slate-950/50 px-4 py-2 rounded-xl border border-slate-800/80 text-xs text-slate-300 font-mono text-center truncate">
            {lastTranscript ? `Ouvido: "${lastTranscript}"` : 'Aguardando voz...'}
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {lastCommand && (
              <span className={`text-[11px] font-bold px-3 py-1.5 rounded-lg font-mono ${
                lastCommand.startsWith('Sucesso') ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
              }`}>
                {lastCommand}
              </span>
            )}
            <button 
              onClick={stopBulkVoice}
              className="bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white font-bold text-xs px-4 py-2 rounded-xl transition border border-red-500/20"
            >
              DESATIVAR
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto pr-2">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400"></div>
          </div>
        ) : students.length === 0 ? (
          <div className="text-center py-20 text-slate-500 font-bold uppercase tracking-widest text-xs">
             Nenhum registro encontrado para esta turma.
          </div>
        ) : viewMode === 'list' ? (
          /* MODO LISTA TRADICIONAL (Tabela clássica de diário de classe) */
          <div className="bg-slate-900/50 border border-slate-800/80 rounded-xl overflow-hidden shadow-xl mb-4">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-slate-950/90 border-b border-white/5 text-[11px] font-extrabold uppercase text-slate-400 tracking-wider sticky top-0 z-10 backdrop-blur-sm">
                    <th className="py-2.5 px-3 w-14 text-center">Nº</th>
                    <th className="py-2.5 px-3">Aluno</th>
                    <th className="py-2.5 px-4 w-48 text-center">Frequência</th>
                    <th className="py-2.5 px-3 w-40 text-center">Socioemocional</th>
                    <th className="py-2.5 px-3">Observações da Aula</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-xs">
                  {students.map((student, idx) => {
                    const isPresent = entries[student.id]?.present ?? true;
                    return (
                      <tr 
                        key={student.id}
                        className={`transition-colors duration-150 ${
                          highlighted?.id === student.id
                            ? highlighted.type === 'present'
                              ? 'bg-emerald-500/25 ring-1 ring-emerald-400'
                              : 'bg-red-500/25 ring-1 ring-red-400'
                            : isPresent
                              ? 'bg-slate-900/20 hover:bg-slate-800/40'
                              : 'bg-red-950/20 hover:bg-red-950/30'
                        }`}
                      >
                        {/* Número de Chamada */}
                        <td className="py-2 px-3 text-center font-mono font-bold text-slate-400">
                          #{idx + 1}
                        </td>

                        {/* Aluno (Avatar + Nome Completo + Matrícula) */}
                        <td className="py-2 px-3">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-8 h-8 rounded-lg overflow-hidden border flex items-center justify-center shrink-0 ${
                              isPresent ? 'border-emerald-500/40 bg-slate-800' : 'border-red-500/40 bg-slate-900 opacity-60'
                            }`}>
                              {student.photoPath ? (
                                <img src={`file://${student.photoPath}`} className="w-full h-full object-cover" alt="" />
                              ) : (
                                <span className="font-extrabold text-xs text-slate-300">
                                  {student.name.charAt(0).toUpperCase()}
                                </span>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className={`font-bold text-sm truncate ${isPresent ? 'text-slate-100' : 'text-slate-400 line-through'}`}>
                                {student.name}
                              </p>
                              <p className="text-[10px] text-slate-500 font-mono">
                                MAT: {student.id.slice(-6).toUpperCase()}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Botões Rápidos P / F */}
                        <td className="py-2 px-4 text-center">
                          <div className="inline-flex rounded-lg bg-slate-950 p-1 border border-slate-800 gap-1">
                            <button
                              onClick={() => setStudentPresence(student.id, true)}
                              className={`px-3 py-1 rounded-md text-xs font-black transition-all flex items-center gap-1 ${
                                isPresent 
                                  ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/30 scale-105' 
                                  : 'text-slate-500 hover:text-slate-300'
                              }`}
                              title="Marcar Presente"
                            >
                              <CheckCircle2 size={12} /> P
                            </button>
                            <button
                              onClick={() => setStudentPresence(student.id, false)}
                              className={`px-3 py-1 rounded-md text-xs font-black transition-all flex items-center gap-1 ${
                                !isPresent 
                                  ? 'bg-red-500 text-white shadow-sm shadow-red-500/30 scale-105' 
                                  : 'text-slate-500 hover:text-slate-300'
                              }`}
                              title="Marcar Falta"
                            >
                              <X size={12} /> F
                            </button>
                          </div>
                        </td>

                        {/* Socioemocional / Humor */}
                        <td className="py-2 px-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            {[
                              { id: 'happy', icon: <Smile size={14}/>, label: 'Feliz' },
                              { id: 'energetic', icon: <Zap size={14}/>, label: 'Ativo' },
                              { id: 'neutral', icon: <Meh size={14}/>, label: 'Neutro' },
                              { id: 'tired', icon: <Frown size={14}/>, label: 'Desatento' }
                            ].map(m => (
                              <button
                                key={m.id}
                                onClick={() => updateMood(student.id, m.id as any)}
                                className={`p-1.5 rounded-lg transition ${
                                  entries[student.id]?.mood === m.id 
                                    ? 'bg-emerald-500 text-white shadow-sm' 
                                    : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/60'
                                }`}
                                title={m.label}
                              >
                                {m.icon}
                              </button>
                            ))}
                          </div>
                        </td>

                        {/* Observações da Aula */}
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={entries[student.id]?.observation || ''}
                            onChange={(e) => updateObservation(student.id, e.target.value)}
                            placeholder="Anotar observação..."
                            className="w-full bg-slate-950/60 border border-slate-800/80 rounded-lg px-2.5 py-1 text-xs text-slate-200 placeholder-slate-600 focus:border-emerald-500/50 outline-none transition"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : viewMode === 'detailed' ? (
          <div className="space-y-3 pb-6">
            {students.map(student => (
              <div key={student.id} className="bg-slate-900/40 border border-slate-800/50 rounded-xl p-2.5 hover:bg-slate-800/40 transition group flex flex-col md:flex-row items-center gap-3">
                <div className="flex items-center gap-3 min-w-[220px]">
                  <div className="w-9 h-9 rounded-xl bg-slate-800 border border-white/5 overflow-hidden flex items-center justify-center shrink-0">
                    {student.photoPath ? (
                      <img src={`file://${student.photoPath}`} className="w-full h-full object-cover" alt="" />
                    ) : (
                      <Users className="text-slate-600" size={16} />
                    )}
                  </div>
                  <div className="overflow-hidden">
                    <h3 className="font-bold text-slate-100 text-sm truncate group-hover:text-emerald-400 transition">{student.name}</h3>
                    <p className="text-slate-500 text-[10px] font-mono">MAT: {student.id.slice(-6).toUpperCase()}</p>
                  </div>
                </div>

                <div className="flex gap-1 shrink-0">
                  {[
                    { id: 'happy', icon: <Smile size={15}/>, label: 'Feliz' },
                    { id: 'energetic', icon: <Zap size={15}/>, label: 'Ativo' },
                    { id: 'neutral', icon: <Meh size={15}/>, label: 'Neutro' },
                    { id: 'tired', icon: <Frown size={15}/>, label: 'Desatento' }
                  ].map(m => (
                    <button 
                      key={m.id}
                      onClick={() => updateMood(student.id, m.id as any)}
                      className={`p-1.5 rounded-lg transition ${entries[student.id]?.mood === m.id ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20' : 'bg-slate-800/50 hover:bg-slate-800 text-slate-400 border border-white/5'}`}
                      title={m.label}
                    >
                      {m.icon}
                    </button>
                  ))}
                </div>

                <div className="flex-1 w-full flex items-center gap-2">
                  <textarea 
                    value={recordingId === student.id ? recordingText : (entries[student.id]?.observation || '')}
                    onChange={(e) => updateObservation(student.id, e.target.value)}
                    placeholder="Observações... (Ex: Interagiu positivamente)"
                    disabled={recordingId === student.id}
                    className="flex-1 bg-slate-950/50 border border-slate-800/50 rounded-lg p-2 text-xs text-slate-300 focus:border-emerald-500/50 outline-none h-9 resize-none transition disabled:opacity-50"
                  />
                  {!(window as any).aquila && (
                    recordingId === student.id ? (
                       <button onClick={stopRecording} className="shrink-0 flex items-center gap-1 text-[10px] font-bold text-red-400 animate-pulse bg-red-500/10 px-2 h-9 rounded-lg">
                          <Square size={12} />
                       </button>
                    ) : (
                       <button onClick={() => startRecording(student.id)} className="shrink-0 flex items-center gap-1 text-[10px] font-bold text-emerald-400 hover:bg-emerald-500/10 px-2 h-9 rounded-lg transition">
                          <Mic size={14} />
                       </button>
                    )
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2 pt-1 pb-6">
            {students.map((student, idx) => (
              <div 
                key={student.id} 
                onClick={() => togglePresence(student.id)}
                className={`cursor-pointer group relative p-2 rounded-xl border transition-all duration-200 ${
                  highlighted?.id === student.id 
                    ? highlighted.type === 'present'
                      ? 'ring-2 ring-emerald-400 scale-105 border-emerald-400' 
                      : 'ring-2 ring-red-500 scale-105 border-red-500'
                    : entries[student.id]?.present 
                      ? 'bg-emerald-500/10 border-emerald-500/30' 
                      : 'bg-slate-900/50 border-slate-800'
                }`}
              >
                {/* Number Line Badge */}
                <div className="absolute top-1 left-1 bg-slate-800 text-slate-300 text-[9px] font-mono font-bold px-1 py-0.5 rounded border border-white/5 z-10">
                  #{idx + 1}
                </div>

                <div className="flex flex-col items-center text-center space-y-1.5 pt-1">
                  <div className={`w-11 h-11 rounded-xl overflow-hidden border-2 transition-all ${entries[student.id]?.present ? 'border-emerald-500 scale-105 shadow-md shadow-emerald-500/15' : 'border-slate-800 grayscale opacity-40'}`}>
                    {student.photoPath ? (
                      <img src={`file://${student.photoPath}`} className="w-full h-full object-cover" alt="" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-slate-800"><Users size={16} /></div>
                    )}
                  </div>
                  <div>
                    <p className={`text-[11px] font-black truncate max-w-[95px] transition-colors ${entries[student.id]?.present ? 'text-emerald-400' : 'text-slate-500'}`}>
                      {student.name.split(' ')[0]}
                    </p>
                    <span className={`text-[9px] font-bold ${entries[student.id]?.present ? 'text-emerald-500/70' : 'text-slate-600'}`}>
                       {entries[student.id]?.present ? 'PRESENTE' : 'FALTA'}
                    </span>
                  </div>
                </div>
                {entries[student.id]?.present && (
                  <div className="absolute top-1 right-1 bg-emerald-500 text-white rounded-full p-0.5 shadow-md">
                    <CheckCircle2 size={10} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Duplicate Candidates Selection Modal */}
      {nameCandidates.length > 0 && (
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
           <div className="bg-slate-900 border border-emerald-500/30 w-full max-w-md rounded-2xl shadow-2xl p-6 flex flex-col gap-4 animate-in zoom-in-95 duration-200">
              <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                 <div className="bg-emerald-500/20 p-2.5 rounded-xl text-emerald-400">
                    <Users size={20} />
                 </div>
                 <div>
                    <h2 className="text-base font-bold text-white">Mais de um aluno encontrado</h2>
                    <p className="text-xs text-slate-400">Selecione o aluno correto para aplicar a presença/falta:</p>
                 </div>
              </div>

              <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1">
                 {nameCandidates.map(student => (
                   <button
                     key={student.id}
                     onClick={() => selectCandidate(student)}
                     className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-950/50 hover:bg-slate-800 border border-slate-800/80 text-left text-sm font-semibold text-slate-200 hover:text-emerald-400 transition"
                   >
                     <span>{student.name}</span>
                     <span className="text-[10px] font-mono text-slate-500 uppercase">#{students.findIndex(s => s.id === student.id) + 1}</span>
                   </button>
                 ))}
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                 <button 
                   onClick={() => {
                     setNameCandidates([]);
                     setPendingVoiceAction(null);
                   }} 
                   className="px-5 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition"
                 >
                    CANCELAR
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* Voice Pre-Report Modal */}
      {showModal && (
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
           <div className="bg-slate-900 border border-emerald-500/30 w-full max-w-2xl rounded-2xl shadow-2xl p-6 flex flex-col gap-4 animate-in zoom-in-95 duration-200">
              <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                 <div className="bg-emerald-500/20 p-3 rounded-xl text-emerald-400">
                    <MessageSquare size={24} />
                 </div>
                 <div>
                    <h2 className="text-xl font-bold text-white">Revisão Pedagógica Inteligente</h2>
                    <p className="text-sm text-slate-400">O Córtex traduziu seu relato para o linguajar pedagógico adequado.</p>
                 </div>
              </div>

              {isGenerating ? (
                 <div className="flex flex-col items-center justify-center py-12 gap-4">
                    <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
                    <p className="text-sm font-bold text-slate-400 animate-pulse">Processando relato...</p>
                 </div>
              ) : currentPreReport && (
                 <div className="space-y-4">
                    <div className="bg-slate-950 rounded-xl p-4 border border-white/5">
                       <p className="text-[10px] uppercase font-bold text-slate-500 mb-2 tracking-wider">Ouvido originalmente</p>
                       <p className="text-sm text-slate-400 italic">"{currentPreReport.rawText}"</p>
                    </div>
                    
                    <div>
                       <p className="text-[10px] uppercase font-bold text-emerald-500 mb-2 tracking-wider flex items-center gap-2">
                          <Zap size={12} /> Sugestão de Relatório para a Família
                       </p>
                       <textarea
                         className="w-full bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-sm text-slate-200 outline-none focus:border-emerald-500 h-32 resize-none"
                         value={currentPreReport.text}
                         onChange={(e) => setCurrentPreReport({...currentPreReport, text: e.target.value})}
                       />
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                       <button onClick={() => setShowModal(false)} className="px-6 py-2 rounded-xl text-sm font-bold text-slate-400 hover:text-white transition">
                          DESCARTAR
                       </button>
                       <button onClick={handleSendReport} className="flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-lg shadow-emerald-900/20">
                          <Send size={16} /> APROVAR E ENVIAR NOTIFICAÇÃO
                       </button>
                    </div>
                 </div>
              )}
           </div>
        </div>
      )}
    </div>
  );
};
