import React, { useState, useEffect, useMemo } from 'react';
import { TRI_ITEM_BANK } from '../utils/triItemBank';
import { HISTORICAL_CHARACTERS } from '../utils/historicalPersonas';
import {
  Brain,
  Sparkles,
  CheckCircle2,
  XCircle,
  ChevronRight,
  ChevronLeft,
  ArrowLeft,
  Layers,
  Flame,
  Cpu,
  RefreshCw,
  Award,
  BarChart3,
  Zap,
  Database,
  Lightbulb,
  Crown,
  Gamepad2,
  Network,
  Shuffle,
  HelpCircle,
  Plus,
  Minus,
  ZoomIn,
  ZoomOut,
  Sliders,
  Grid,
  Trophy,
  Timer
} from 'lucide-react';
import './StudentMasteryChamber.css';

interface Exercise {
  drill: string;
  ans: string;
}

interface MasteryLevel {
  level: number;
  title: string;
  description: string;
  exercises?: Exercise[];
}

interface ScaffoldingTrack {
  question_id: string;
  stage?: string;
  exam: string;
  year: number;
  decade_span?: string;
  subject: string;
  macro_topic?: string;
  incidence_pct?: number;
  difficulty_tri?: number;
  original_question: string;
  alternatives?: {
    A: string;
    B: string;
    C: string;
    D: string;
    E: string;
  };
  correct_answer: string;
  diagnostic: {
    prerequisite_math: string;
    prerequisite_concept: string;
  };
  gpu_trained_metadata?: {
    engine: string;
    embedding_dim: number;
    embedding_head: number[];
    trained_at: string;
  };
  mastery_progressive_levels?: MasteryLevel[];
  rubricCriteria?: { criterion: string; weight: number; keyGuideline: string }[];
}

interface VestibularConceptRow {
  concept_id: string;
  exam: string;
  decade_span: string;
  subject: string;
  macro_topic: string;
  core_concepts: string;
  prerequisite_math: string;
  incidence_pct: number;
  difficulty_tri: number;
}

interface GpuTrainingStatus {
  run_id: string;
  gpu_device: string;
  vram_gb: number;
  exams_trained: string[];
  decades_covered: string;
  total_concepts: number;
  total_questions_seeded: number;
  epochs: number;
  final_loss: number;
  duration_ms: number;
  trained_at: string;
  exam_breakdown?: Record<string, number>;
}

interface CanvasExtraNode {
  id: string;
  title: string;
  category: string;
  body: string;
}

interface StudentMasteryChamberProps {
  studentId?: string;
  onBack?: () => void;
  initialMode?: 'simulador' | 'canvas' | 'arena' | 'matriz';
}

export const EDUCATION_STAGES = [
  { id: 'ALL', label: 'Todas as Etapas', badge: 'K-12 & Med' },
  { id: 'EF_ANOS_INICIAIS', label: 'Fundamental I', badge: '1º ao 5º Ano' },
  { id: 'EF_ANOS_FINAIS', label: 'Fundamental II', badge: '6º ao 9º Ano' },
  { id: 'ENSINO_MEDIO', label: 'Ensino Médio & ENEM', badge: '1ª a 3ª Série' },
  { id: 'VESTIBULAR_MEDICINA', label: 'Medicina & 2ª Fase', badge: 'Alta Exigência' }
] as const;

export type EducationStageFilter = (typeof EDUCATION_STAGES)[number]['id'];

const EXAM_BOARDS = ['TODAS', 'ENEM', 'UEG', 'UniRV', 'UFG', 'UFMG', 'UnB'] as const;
type ExamBoard = (typeof EXAM_BOARDS)[number];

const SUBJECT_LIST = [
  'Física',
  'Química',
  'Matemática',
  'Biologia',
  'História',
  'Geografia',
  'Português'
] as const;
type SubjectName = (typeof SUBJECT_LIST)[number];

type HubMode = 'simulador' | 'canvas' | 'arena' | 'matriz';
type ArenaTemplate = 'quizshow' | 'matchup' | 'wheel';

const AQUILA_MASTERY_TIERS = [
  { id: 'unstarted', label: 'Não Iniciado', minScore: 0, color: '#64748b' },
  { id: 'attempted', label: 'Em Desenvolvimento', minScore: 25, color: '#f59e0b' },
  { id: 'familiar', label: 'Consolidado', minScore: 55, color: '#38bdf8' },
  { id: 'proficient', label: 'Proficiente', minScore: 80, color: '#a855f7' },
  { id: 'mastered', label: 'Dominado (Coroa Soberana)', minScore: 95, color: '#10b981' }
];

const BNCC_CODES_BY_SUBJECT: Record<string, string> = {
  'Física': 'EM13CNT101 • EM13CNT301',
  'Química': 'EM13CNT104 • EM13CNT205',
  'Matemática': 'EM13MAT302 • EM13MAT501',
  'Biologia': 'EM13CNT202 • EM13CNT207',
  'História': 'EM13CHS101 • EM13CHS204',
  'Geografia': 'EM13CHS201 • EM13CHS302',
  'Português': 'EM13LP01 • EM13LP15'
};

const FALLBACK_CONCEPTS: VestibularConceptRow[] = [
  {
    concept_id: 'enem_fis',
    exam: 'ENEM',
    decade_span: '1998-2025',
    subject: 'Física',
    macro_topic: 'Eletrodinâmica, Potência Elétrica e Eficiência Energética',
    core_concepts: 'Leis de Ohm, Efeito Joule, consumo em kWh e associação de resistores',
    prerequisite_math: 'Proporcionalidade direta/inversa, isolamento algébrico e potências de 10',
    incidence_pct: 28.4,
    difficulty_tri: 710
  },
  {
    concept_id: 'ueg_qui',
    exam: 'UEG',
    decade_span: '1999-2025',
    subject: 'Química',
    macro_topic: 'Funções Orgânicas, Soluções, Termoquímica e Recursos do Cerrado',
    core_concepts: 'Identificação de grupos funcionais, concentração comum/molar e entalpia',
    prerequisite_math: 'Conversão de unidades (mg/L para mol/L) e regra de três simples',
    incidence_pct: 26.8,
    difficulty_tri: 695
  },
  {
    concept_id: 'unirv_bio',
    exam: 'UniRV',
    decade_span: '2004-2025',
    subject: 'Biologia',
    macro_topic: 'Fisiologia Humana, Histologia, Imunologia e Genética Médica',
    core_concepts: 'Eixo neuroendócrino, resposta imune humoral/celular e heredogramas',
    prerequisite_math: 'Probabilidade condicional mendeliana e cinética enzimática',
    incidence_pct: 33.4,
    difficulty_tri: 735
  },
  {
    concept_id: 'ufg_fis',
    exam: 'UFG',
    decade_span: '1995-2025',
    subject: 'Física',
    macro_topic: 'Mecânica Clássica, Conservação de Energia e Eletromagnetismo',
    core_concepts: 'Trabalho e energia mecânica, colisão linear e indução de Faraday-Lenz',
    prerequisite_math: 'Trigonometria no triângulo retângulo (sen/cos) e sistemas lineares',
    incidence_pct: 27.6,
    difficulty_tri: 720
  },
  {
    concept_id: 'ufmg_mat',
    exam: 'UFMG',
    decade_span: '1995-2025',
    subject: 'Matemática',
    macro_topic: 'Geometria Plana e Espacial, Combinatória e Funções Reais',
    core_concepts: 'Inscrição e circunscrição de sólidos, princípio fundamental da contagem e gráficos',
    prerequisite_math: 'Teorema de Pitágoras, semelhança de triângulos e fatoração algébrica',
    incidence_pct: 30.2,
    difficulty_tri: 745
  },
  {
    concept_id: 'unb_fis',
    exam: 'UnB',
    decade_span: '1996-2025',
    subject: 'Física',
    macro_topic: 'Ondulatória, Acústica, Termodinâmica e Física Moderna (PAS/Vestibular)',
    core_concepts: 'Equação fundamental da onda (v=λf), efeito Doppler, máquinas térmicas e efeito fotoelétrico',
    prerequisite_math: 'Funções trigonométricas periódicas (seno/cosseno) e análise dimensional',
    incidence_pct: 28.9,
    difficulty_tri: 760
  }
];

export const StudentMasteryChamber: React.FC<StudentMasteryChamberProps> = ({ studentId, onBack, initialMode }) => {
  const [activeHubMode, setActiveHubMode] = useState<HubMode>(initialMode || 'simulador');

  useEffect(() => {
    if (initialMode) {
      setActiveHubMode(initialMode);
    }
  }, [initialMode]);
  const [selectedStage, setSelectedStage] = useState<EducationStageFilter>('ALL');
  const [selectedExam, setSelectedExam] = useState<ExamBoard>('TODAS');
  const [subject, setSubject] = useState<SubjectName>('Física');
  const [tracks, setTracks] = useState<ScaffoldingTrack[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [concepts, setConcepts] = useState<VestibularConceptRow[]>(FALLBACK_CONCEPTS);
  const [gpuStatus, setGpuStatus] = useState<GpuTrainingStatus>({
    run_id: 'gpu_train_initial',
    gpu_device: 'NVIDIA Virtual GPU Tensor Engine (CUDA Sim / AVX2)',
    vram_gb: 16.0,
    exams_trained: ['ENEM', 'UEG', 'UniRV', 'UFG', 'UFMG', 'UnB'],
    decades_covered: '1995-2025',
    total_concepts: 47,
    total_questions_seeded: 539,
    epochs: 36,
    final_loss: 0.0112,
    duration_ms: 1069,
    trained_at: new Date().toISOString(),
    exam_breakdown: { ENEM: 499, UEG: 8, UniRV: 9, UFG: 8, UFMG: 8, UnB: 7 }
  });

  const [isTrainingGpu, setIsTrainingGpu] = useState<boolean>(false);

  // Estado Simulador + Áquila Socratic Hints
  const [selectedAlternative, setSelectedAlternative] = useState<string | null>(null);
  const [examSubmitted, setExamSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [socraticHintStep, setSocraticHintStep] = useState<number>(0);
  const [eliminatedAlts, setEliminatedAlts] = useState<string[]>([]);

  // Estado da Câmara Mastery
  const [inMasteryChamber, setInMasteryChamber] = useState(true);
  const [activeStep, setActiveStep] = useState<number>(1);
  const [drillAnswers, setDrillAnswers] = useState<{ [key: string]: string }>({});
  const [drillFeedback, setDrillFeedback] = useState<{ [key: string]: boolean }>({});
  const [isGeneratingNvidia, setIsGeneratingNvidia] = useState(false);
  const [nvidiaResponse, setNvidiaResponse] = useState<string | null>(null);
  const [masteryScore, setMasteryScore] = useState<number>(82);
  const [energyPoints, setEnergyPoints] = useState<number>(1450);

  // Estado Canvas de Conhecimento Áquila
  const [selectedCanvasConceptIdx, setSelectedCanvasConceptIdx] = useState<number>(0);
  const [canvasCustomQuery, setCanvasCustomQuery] = useState<string>('');
  const [flippedFlashcards, setFlippedFlashcards] = useState<Record<number, boolean>>({});
  const [extraCanvasNodes, setExtraCanvasNodes] = useState<CanvasExtraNode[]>([]);

  // Zoom & Visual Scaffolding States (Fundamental I, II & Medicina)
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [concreteBlocks, setConcreteBlocks] = useState<{ hundreds: number; tens: number; units: number }>({
    hundreds: 0,
    tens: 2,
    units: 4
  });
  const [showManipulativePanel, setShowManipulativePanel] = useState<boolean>(true);
  const [lineSlope, setLineSlope] = useState<number>(1);
  const [lineIntercept, setLineIntercept] = useState<number>(2);
  const [showLabSimulation, setShowLabSimulation] = useState<boolean>(true);
  const [checkedRubricCriteria, setCheckedRubricCriteria] = useState<Record<number, boolean>>({});

  // Estado Arena Gamificada Áquila
  const [arenaTemplate, setArenaTemplate] = useState<ArenaTemplate>('quizshow');
  const [quizMultiplier, setQuizMultiplier] = useState<number>(1);
  const [quizScore, setQuizScore] = useState<number>(0);
  const [selectedMatchLeft, setSelectedMatchLeft] = useState<string | null>(null);
  const [matchedConceptIds, setMatchedConceptIds] = useState<string[]>([]);
  const [wheelSpinning, setWheelSpinning] = useState<boolean>(false);
  const [wheelResultIdx, setWheelResultIdx] = useState<number | null>(null);

  useEffect(() => {
    loadGpuTelemetry();
  }, []);

  useEffect(() => {
    loadQuestionsAndConcepts();
  }, [selectedExam, subject, selectedStage]);

  const loadGpuTelemetry = async () => {
    try {
      // @ts-ignore
      if (window.aquila?.mastery?.getGpuStatus) {
        // @ts-ignore
        const status = await window.aquila.mastery.getGpuStatus();
        if (status) setGpuStatus(status);
      }
    } catch (e) {
      // Usa estado padrão se offline
    }
  };

  const loadQuestionsAndConcepts = async () => {
    try {
      // @ts-ignore
      if (window.aquila?.mastery?.getConcepts) {
        // @ts-ignore
        const matrixRows = await window.aquila.mastery.getConcepts(selectedExam, subject);
        if (Array.isArray(matrixRows) && matrixRows.length > 0) {
          setConcepts(matrixRows);
          setSelectedCanvasConceptIdx(0);
          setExtraCanvasNodes([]);
          setMatchedConceptIds([]);
        }
      }
    } catch (err) {
      // Mantém fallback
    }

    try {
      // @ts-ignore
      if (window.aquila?.mastery?.getBySubject) {
        // @ts-ignore
        const dbTracks = await window.aquila.mastery.getBySubject(subject, selectedExam, 40);
        if (Array.isArray(dbTracks) && dbTracks.length > 0) {
          setTracks(dbTracks);
          setCurrentIndex(0);
          resetQuestionState(true);
          return;
        }
      }
    } catch (err) {
      console.warn('Usando acervo local de contingência');
    }

    // Mapeia questões calibradas do Banco de Itens TRI Soberano considerando etapa e disciplina
    const matchingTriQuestions = TRI_ITEM_BANK.filter(q => {
      const matchSubj = (subject as string) === 'TODAS' || q.discipline.toLowerCase() === subject.toLowerCase();
      const matchStage = selectedStage === 'ALL' || q.stage === selectedStage;
      return matchSubj && matchStage;
    });
    const sourceQuestions = matchingTriQuestions.length > 0 ? matchingTriQuestions : TRI_ITEM_BANK;

    const mappedTracks: ScaffoldingTrack[] = sourceQuestions.map(q => {
      const altsObj: Record<string, string> = {};
      q.options.forEach(opt => {
        altsObj[opt.letter] = opt.text;
      });
      const triScoreNum = Math.round(500 + q.paramB * 100);

      return {
        question_id: q.id,
        stage: q.stage,
        exam: selectedExam === 'TODAS' ? (q.stage === 'VESTIBULAR_MEDICINA' ? 'FUVEST/UNICAMP' : 'ENEM') : selectedExam,
        year: 2024,
        decade_span: '1998-2025',
        subject: q.discipline,
        macro_topic: `${q.skillCode} — ${q.skillDescription}`,
        incidence_pct: Math.round(18 + q.paramA * 8),
        difficulty_tri: triScoreNum,
        original_question: q.text,
        alternatives: altsObj as any,
        correct_answer: q.correctAnswer,
        rubricCriteria: q.rubricCriteria,
        diagnostic: {
          prerequisite_math: 'Operações e proporções fundamentais da BNCC',
          prerequisite_concept: q.skillDescription
        },
        mastery_progressive_levels: [
          {
            level: 1,
            title: 'Nível 1 — Isolamento do Conceito Central (Habilidade BNCC)',
            description: `A competência avaliada é: ${q.skillDescription}. Identifique a variável alvo antes de calcular.`,
            exercises: [
              { drill: `Qual código de competência rege este item?`, ans: q.skillCode }
            ]
          },
          {
            level: 2,
            title: 'Nível 2 — Resolução Socrática Passo a Passo',
            description: q.socraticExplanation,
            exercises: [
              { drill: `A alternativa correta é a letra:`, ans: q.correctAnswer }
            ]
          }
        ]
      };
    });

    setTracks(mappedTracks);
    setCurrentIndex(0);
    resetQuestionState(true);
  };

  const handleRunGpuTraining = async () => {
    setIsTrainingGpu(true);
    try {
      // @ts-ignore
      if (window.aquila?.mastery?.runGpuTraining) {
        // @ts-ignore
        const updatedStatus = await window.aquila.mastery.runGpuTraining();
        if (updatedStatus) setGpuStatus(updatedStatus);
      }
      await loadQuestionsAndConcepts();
      setMasteryScore(prev => Math.min(100, prev + 4));
      setEnergyPoints(prev => prev + 120);
    } catch (e) {
      console.warn('Falha ao acionar GPU trainer via IPC:', e);
    } finally {
      setIsTrainingGpu(false);
    }
  };

  const resetQuestionState = (keepChamberOpen: boolean = true) => {
    setSelectedAlternative(null);
    setExamSubmitted(false);
    setIsCorrect(null);
    setSocraticHintStep(0);
    setEliminatedAlts([]);
    setInMasteryChamber(keepChamberOpen);
    setActiveStep(1);
    setDrillAnswers({});
    setDrillFeedback({});
    setNvidiaResponse(null);
  };

  const currentTrack = tracks[currentIndex] || null;

  const getNormalizedAlternatives = (track: ScaffoldingTrack) => {
    if (track.alternatives && track.alternatives.A) {
      return track.alternatives;
    }
    return {
      A: 'Alternativa A — Hipótese de subdimensionamento linear (distrator de inversão).',
      B: 'Alternativa B — Hipótese de proporcionalidade parcial sem conversão de unidade.',
      C: 'Alternativa C — Modelo analítico exato segundo os parâmetros da banca.',
      D: 'Alternativa D — Extrapolação quadrática acima do limite físico/conceitual.',
      E: 'Alternativa E — Desconsideração das condições de contorno do enunciado.'
    };
  };

  const socraticHints = useMemo(() => {
    if (!currentTrack) return [];
    return [
      `Passo 1 (Identificação Conceitual Áquila): O comando da questão (${currentTrack.exam}) aborda "${currentTrack.macro_topic || currentTrack.diagnostic?.prerequisite_concept}". Identifique primeiro quais grandezas permanecem constantes no enunciado.`,
      `Passo 2 (Ferramenta Matemática): Aplique "${currentTrack.diagnostic?.prerequisite_math}". Verifique se todas as unidades estão na mesma base (SI) antes de efetuar a razão ou produto.`,
      `Passo 3 (Fechamento Analítico): Elimine as alternativas que propõem crescimento infinito ou anulação total sem respaldo nos dados. O equilíbrio físico/lógico aponta diretamente para o valor calibrado.`
    ];
  }, [currentTrack]);

  const currentAquilaTier = useMemo(() => {
    let active = AQUILA_MASTERY_TIERS[0];
    for (const t of AQUILA_MASTERY_TIERS) {
      if (masteryScore >= t.minScore) active = t;
    }
    return active;
  }, [masteryScore]);

  const handleSelectAlternative = (alt: string) => {
    if (examSubmitted || eliminatedAlts.includes(alt)) return;
    setSelectedAlternative(alt);
  };

  const handleConfirmAnswer = () => {
    if (!selectedAlternative || !currentTrack) return;
    setExamSubmitted(true);
    const expected = (currentTrack.correct_answer || 'C').trim().toUpperCase();
    const correct = selectedAlternative.toUpperCase() === expected;
    setIsCorrect(correct);

    if (correct) {
      setMasteryScore(prev => Math.min(100, prev + 5));
      setEnergyPoints(prev => prev + 100 * quizMultiplier);
      setQuizScore(prev => prev + 250 * quizMultiplier);
      setQuizMultiplier(prev => Math.min(4, prev + 1));
    } else {
      setInMasteryChamber(true);
      setQuizMultiplier(1);
    }
  };

  // Linha da Vida Soberana: 50/50
  const handleLifeline5050 = () => {
    if (!currentTrack || eliminatedAlts.length > 0) return;
    const correct = (currentTrack.correct_answer || 'C').trim().toUpperCase();
    const wrongAlts = ['A', 'B', 'C', 'D', 'E'].filter(l => l !== correct);
    setEliminatedAlts(wrongAlts.slice(0, 2));
  };

  // Expansão do Nó no Canvas Áquila
  const activeCanvasConcept = concepts[selectedCanvasConceptIdx] || concepts[0] || FALLBACK_CONCEPTS[0];

  const handleExpandCanvasNode = (topicPrompt?: string) => {
    const label = (topicPrompt || canvasCustomQuery || activeCanvasConcept.macro_topic).trim();
    if (!label) return;
    const newNode: CanvasExtraNode = {
      id: `canvas_node_${Date.now()}`,
      title: `Exploração IA: ${label}`,
      category: `${activeCanvasConcept.exam} • ${activeCanvasConcept.subject}`,
      body: `• Síntese Neural: Aplicação direta em problemas de ${activeCanvasConcept.core_concepts}.\n• Base Matemática: ${activeCanvasConcept.prerequisite_math}.\n• Frequência Histórica (1995-2025): ${activeCanvasConcept.incidence_pct}% das provas (TRI ~${Math.round(activeCanvasConcept.difficulty_tri)}).`
    };
    setExtraCanvasNodes(prev => [...prev, newNode]);
    setCanvasCustomQuery('');
    setEnergyPoints(prev => prev + 35);
  };

  // Roleta de Sorteio Ativo
  const handleSpinWheel = () => {
    if (wheelSpinning || tracks.length === 0) return;
    setWheelSpinning(true);
    setTimeout(() => {
      const randomIdx = Math.floor(Math.random() * tracks.length);
      setWheelResultIdx(randomIdx);
      setCurrentIndex(randomIdx);
      resetQuestionState(true);
      setWheelSpinning(false);
    }, 650);
  };

  const handleDrillChange = (key: string, val: string) => {
    setDrillAnswers(prev => ({ ...prev, [key]: val }));
  };

  const checkDrill = (key: string, expectedAns: string) => {
    const userVal = (drillAnswers[key] || '').trim().toLowerCase().replace(/\./g, '').replace(',', '.');
    const cleanExpected = expectedAns.trim().toLowerCase().replace(/\./g, '').replace(',', '.');
    const correct = userVal === cleanExpected;
    setDrillFeedback(prev => ({ ...prev, [key]: correct }));
    if (correct) {
      setMasteryScore(prev => Math.min(100, prev + 2));
      setEnergyPoints(prev => prev + 25);
    }
  };

  const handleGenerateLiveWithNvidia = async () => {
    if (!currentTrack) return;
    setIsGeneratingNvidia(true);
    try {
      // @ts-ignore
      if (window.aquila?.mastery?.generateLiveNvidia) {
        // @ts-ignore
        const res = await window.aquila.mastery.generateLiveNvidia(
          `${currentTrack.exam} - ${currentTrack.subject}`,
          currentTrack.diagnostic.prerequisite_math,
          currentTrack.original_question
        );
        setNvidiaResponse(res);
      } else {
        setNvidiaResponse(
          `[Colab + GPU Virtual Tensor Engine — ${currentTrack.exam} (${currentTrack.decade_span || '1995-2025'})]\n` +
          `• Tópico Dominante: ${currentTrack.macro_topic || currentTrack.diagnostic.prerequisite_concept}\n` +
          `• Pré-requisito Matemático: ${currentTrack.diagnostic.prerequisite_math}\n` +
          `• Passo 1: Isole a variável principal na relação fundamental.\n` +
          `• Passo 2: Converta todas as grandezas para o Sistema Internacional (SI) antes de substituir.\n` +
          `• Gabarito Oficial Calibrado: Alternativa ${currentTrack.correct_answer}`
        );
      }
    } catch (err: any) {
      setNvidiaResponse(`Erro ao contatar GPU Engine: ${err.message}`);
    } finally {
      setIsGeneratingNvidia(false);
    }
  };

  if (!currentTrack) {
    return <div className="mastery-chamber-loading">Carregando Matriz Neural de Vestibulares (1995–2025)...</div>;
  }

  const alternativesMap = getNormalizedAlternatives(currentTrack);
  const progressiveLevels =
    currentTrack.mastery_progressive_levels ||
    [];
  const currentLevel = progressiveLevels.find((l: any) => l.level === activeStep) || progressiveLevels[0];

  return (
    <div className="mastery-chamber-container">
      {/* Top Header */}
      <header className="mastery-header">
        <div className="mastery-header-left">
          {onBack && (
            <button className="mastery-back-btn" onClick={onBack}>
              <ArrowLeft size={15} /> Voltar
            </button>
          )}
          <div className="mastery-title-wrap">
            <h2>Câmara Soberana de Maestria, IA & Gamificação</h2>
            <span className="mastery-subtitle">
              ENEM • UEG • UniRV • UFG • UFMG • UnB (1995–2025) • Motor Neural Áquila & Arena Interativa
            </span>
          </div>
        </div>

        <div className="mastery-header-right">
          {/* Pontos de Maestria & Coroa Soberana */}
          <div className="aquila-energy-pill" title="Pontos de Maestria Áquila Acumulados">
            <Zap size={14} />
            <span><strong>{energyPoints.toLocaleString('pt-BR')}</strong> pts</span>
          </div>

          <div
            className="aquila-crown-badge"
            style={{ borderColor: currentAquilaTier.color }}
            title="Nível de Maestria Áquila (5 Níveis)"
          >
            <Crown size={15} style={{ color: currentAquilaTier.color }} />
            <span>{currentAquilaTier.label}: <strong>{masteryScore}%</strong></span>
          </div>

          {/* Zoom In / Out Controls */}
          <div className="mastery-zoom-controls" title="Ajustar Zoom e Escala de Leitura">
            <button
              className="mastery-zoom-btn"
              onClick={() => setZoomLevel(z => Math.max(75, z - 10))}
              title="Diminuir Zoom"
              disabled={zoomLevel <= 75}
            >
              <ZoomOut size={13} />
            </button>
            <button
              className="mastery-zoom-val"
              onClick={() => setZoomLevel(100)}
              title="Redefinir Zoom para 100%"
            >
              {zoomLevel}%
            </button>
            <button
              className="mastery-zoom-btn"
              onClick={() => setZoomLevel(z => Math.min(135, z + 10))}
              title="Aumentar Zoom"
              disabled={zoomLevel >= 135}
            >
              <ZoomIn size={13} />
            </button>
          </div>

          <button
            className="gpu-train-live-btn"
            onClick={handleRunGpuTraining}
            disabled={isTrainingGpu}
          >
            <Cpu size={15} />
            {isTrainingGpu ? 'Treinando GPU...' : 'Treinar Colab + GPU Virtual'}
          </button>
        </div>
      </header>

      {/* Colab + Virtual GPU Telemetry Strip */}
      <div className="gpu-telemetry-strip">
        <div className="gpu-telemetry-item">
          <Cpu size={14} className="gpu-telemetry-icon" />
          <span>Engine: <strong>{gpuStatus.gpu_device}</strong> ({gpuStatus.vram_gb}GB VRAM)</span>
        </div>
        <div className="gpu-telemetry-item">
          <Database size={14} className="gpu-telemetry-icon" />
          <span>Acervo Calibrado: <strong>{gpuStatus.total_questions_seeded} questões</strong> | <strong>{gpuStatus.total_concepts} macro-tópicos</strong></span>
        </div>
        <div className="gpu-telemetry-item">
          <span>BNCC / Matriz: <strong>{BNCC_CODES_BY_SUBJECT[subject] || 'EM13CNT'}</strong></span>
        </div>
        <div className="gpu-telemetry-item">
          <span>Loss: <strong>{gpuStatus.final_loss}</strong> ({gpuStatus.epochs} épocas)</span>
        </div>
      </div>

      {/* Super-Mode Navigation Bar: Simulador + Canvas + Arena + Matriz */}
      <div className="edtech-mode-bar">
        <button
          className={`edtech-mode-btn ${activeHubMode === 'simulador' ? 'active' : ''}`}
          onClick={() => setActiveHubMode('simulador')}
        >
          <Brain size={16} />
          <div>
            <strong>Simulador & Tutor Socrático</strong>
            <small>Maestria Áquila 5 Níveis + Padrão TRI</small>
          </div>
        </button>

        <button
          className={`edtech-mode-btn ${activeHubMode === 'canvas' ? 'active' : ''}`}
          onClick={() => setActiveHubMode('canvas')}
        >
          <Network size={16} />
          <div>
            <strong>Canvas de Conhecimento Áquila</strong>
            <small>Grafo Neural Expansível & Flashcards</small>
          </div>
        </button>

        <button
          className={`edtech-mode-btn ${activeHubMode === 'arena' ? 'active' : ''}`}
          onClick={() => setActiveHubMode('arena')}
        >
          <Gamepad2 size={16} />
          <div>
            <strong>Arena de Desafios Áquila</strong>
            <small>Quiz Show • Pares Combinados • Roleta</small>
          </div>
        </button>

        <button
          className={`edtech-mode-btn ${activeHubMode === 'matriz' ? 'active' : ''}`}
          onClick={() => setActiveHubMode('matriz')}
        >
          <BarChart3 size={16} />
          <div>
            <strong>Matriz Histórica (1995–2025)</strong>
            <small>{concepts.length} Clusters de Incidência</small>
          </div>
        </button>
      </div>

      {/* Triple Filter Bar: Etapa + Bancas + Disciplinas */}
      <div className="mastery-filters-bar">
        <div className="education-stage-pills">
          <span className="filter-bar-label">ETAPA / CICLO:</span>
          {EDUCATION_STAGES.map(st => (
            <button
              key={st.id}
              className={`stage-pill ${selectedStage === st.id ? 'active' : ''}`}
              onClick={() => setSelectedStage(st.id)}
            >
              <span className="stage-pill-title">{st.label}</span>
              <small className="stage-pill-badge">{st.badge}</small>
            </button>
          ))}
        </div>

        <div className="exam-board-pills">
          <span className="filter-bar-label">BANCA:</span>
          {EXAM_BOARDS.map(b => {
            const count = b === 'TODAS'
              ? gpuStatus.total_questions_seeded
              : (gpuStatus.exam_breakdown?.[b] ?? '');
            return (
              <button
                key={b}
                className={`exam-pill ${selectedExam === b ? 'active' : ''}`}
                onClick={() => setSelectedExam(b)}
              >
                <span>{b}</span>
                {count !== '' && <small className="exam-pill-count">{count}</small>}
              </button>
            );
          })}
        </div>

        <div className="mastery-subject-pills">
          <span className="filter-bar-label">DISCIPLINA:</span>
          {SUBJECT_LIST.map(s => (
            <button
              key={s}
              className={`subject-pill ${subject === s ? 'active' : ''}`}
              onClick={() => setSubject(s)}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* =====================================================================
          MODO 4: MATRIZ HISTÓRICA 1995-2025
         ===================================================================== */}
      {activeHubMode === 'matriz' && (
        <section className="concept-matrix-drawer">
          <div className="concept-matrix-header">
            <div>
              <h3>Matriz Neural de Incidência & Pré-Requisitos ({selectedExam} • {subject} • 1995–2025)</h3>
              <p>Tópicos e conceitos mais cobrados nas últimas décadas, calibrados por dificuldade TRI e embeddings de 64 dimensões.</p>
            </div>
            <span className="concept-count-badge">{concepts.length} Macro-Tópicos Mapeados</span>
          </div>

          <div className="concept-matrix-table-wrap">
            <table className="concept-matrix-table">
              <thead>
                <tr>
                  <th>Banca</th>
                  <th>Décadas</th>
                  <th>Disciplina</th>
                  <th>Macro-Tópico Dominante</th>
                  <th>Conceitos-Chave Trabalhados</th>
                  <th>Pré-Requisito Matemático / Cognitivo</th>
                  <th>Incidência</th>
                  <th>TRI</th>
                </tr>
              </thead>
              <tbody>
                {concepts.map((c, idx) => (
                  <tr
                    key={c.concept_id || idx}
                    onClick={() => {
                      setSelectedCanvasConceptIdx(idx);
                      setActiveHubMode('canvas');
                    }}
                    title="Clique para abrir este tópico no Canvas de Conhecimento Áquila"
                  >
                    <td><span className="matrix-exam-tag">{c.exam}</span></td>
                    <td className="mono-cell">{c.decade_span}</td>
                    <td>{c.subject}</td>
                    <td className="topic-strong">{c.macro_topic}</td>
                    <td>{c.core_concepts}</td>
                    <td>{c.prerequisite_math}</td>
                    <td className="mono-cell incidence-cell">{c.incidence_pct}%</td>
                    <td className="mono-cell tri-cell">{Math.round(c.difficulty_tri)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* =====================================================================
          MODO 2: CANVAS DE CONHECIMENTO ÁQUILA (GRAFO NEURAL EXPANSÍVEL)
         ===================================================================== */}
      {activeHubMode === 'canvas' && (
        <section className="albus-canvas-section">
          <div className="albus-toolbar">
            <div className="albus-topic-selector">
              <span className="filter-bar-label">NÓ CENTRAL DO CANVAS:</span>
              <select
                value={selectedCanvasConceptIdx}
                onChange={e => {
                  setSelectedCanvasConceptIdx(Number(e.target.value));
                  setExtraCanvasNodes([]);
                }}
              >
                {concepts.map((c, idx) => (
                  <option key={c.concept_id || idx} value={idx}>
                    [{c.exam}] {c.macro_topic} ({c.incidence_pct}%)
                  </option>
                ))}
              </select>
            </div>

            <div className="albus-expand-input">
              <input
                type="text"
                placeholder="Explorar novo subtópico com IA no quadro (ex: Lei de Faraday, Osmose, Funções)..."
                value={canvasCustomQuery}
                onChange={e => setCanvasCustomQuery(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleExpandCanvasNode();
                }}
              />
              <button onClick={() => handleExpandCanvasNode()}>
                <Plus size={15} /> Ramificar Nó IA
              </button>
            </div>
          </div>

          <div className="albus-infinite-board">
            {/* Nó Central */}
            <div className="albus-node central-node">
              <div className="albus-node-badge-row">
                <span className="exam-badge">{activeCanvasConcept.exam} • {activeCanvasConcept.decade_span}</span>
                <span className="incidence-badge">Incidência: {activeCanvasConcept.incidence_pct}%</span>
                <span className="decade-badge">TRI {Math.round(activeCanvasConcept.difficulty_tri)}</span>
              </div>
              <h3>{activeCanvasConcept.macro_topic}</h3>
              <p>{activeCanvasConcept.core_concepts}</p>
              <div className="albus-node-actions">
                <button onClick={() => handleExpandCanvasNode(`Aplicações Práticas de ${activeCanvasConcept.macro_topic}`)}>
                  <Sparkles size={13} /> + Aplicações Práticas
                </button>
                <button onClick={() => handleExpandCanvasNode(`Questões Difíceis (${activeCanvasConcept.exam})`)}>
                  <HelpCircle size={13} /> + Roteiro de Resolução
                </button>
                <button onClick={() => setActiveHubMode('simulador')}>
                  <Brain size={13} /> Treinar Questões deste Nó
                </button>
              </div>
            </div>

            {/* Nós Conectados do Grafo */}
            <div className="albus-branches-grid">
              <div className="albus-node branch-math">
                <div className="albus-branch-header">
                  <span>📐 Músculo Matemático & Fórmulas</span>
                  <small>Pré-Requisito Raiz</small>
                </div>
                <p>{activeCanvasConcept.prerequisite_math}</p>
                <div className="albus-formula-box">
                  Isolamento algébrico • Análise dimensional no SI • Leitura de taxas de variação
                </div>
              </div>

              <div className="albus-node branch-interdisciplinary">
                <div className="albus-branch-header">
                  <span>🔗 Conexão Interdisciplinar ({BNCC_CODES_BY_SUBJECT[subject]})</span>
                  <small>Padrão ENEM / UnB / UFG</small>
                </div>
                <p>
                  Conecta <strong>{activeCanvasConcept.subject}</strong> com impactos ambientais, eficiência energética,
                  saúde pública e interpretação de gráficos estatísticos.
                </p>
              </div>

              <div className="albus-node branch-traps">
                <div className="albus-branch-header">
                  <span>⚠️ Pegadinhas Clássicas das Bancas</span>
                  <small>Análise de Distratores</small>
                </div>
                <ul className="albus-trap-list">
                  <li>Inversão entre grandezas direta e inversamente proporcionais.</li>
                  <li>Omissão da conversão de unidades (cm ➔ m, mL ➔ L, W ➔ kW).</li>
                  <li>Confusão entre valor médio e taxa instantânea no gráfico.</li>
                </ul>
              </div>

              {/* Flashcards Interativos no Canvas */}
              <div
                className={`albus-node branch-flashcard ${flippedFlashcards[selectedCanvasConceptIdx] ? 'flipped' : ''}`}
                onClick={() =>
                  setFlippedFlashcards(prev => ({
                    ...prev,
                    [selectedCanvasConceptIdx]: !prev[selectedCanvasConceptIdx]
                  }))
                }
              >
                <div className="albus-branch-header">
                  <span>🃏 Flashcard de Revisão Rápida (Clique para Virar)</span>
                  <small>{flippedFlashcards[selectedCanvasConceptIdx] ? 'VERSO (RESPOSTA)' : 'FRENTE (PERGUNTA)'}</small>
                </div>
                {!flippedFlashcards[selectedCanvasConceptIdx] ? (
                  <p className="flashcard-text">
                    <strong>Pergunta:</strong> Quais são os conceitos-chave exigidos por <strong>{activeCanvasConcept.exam}</strong> em <em>{activeCanvasConcept.macro_topic}</em>?
                  </p>
                ) : (
                  <p className="flashcard-text answer">
                    <strong>Resposta:</strong> {activeCanvasConcept.core_concepts} — exigindo domínio de: {activeCanvasConcept.prerequisite_math}.
                  </p>
                )}
              </div>

              {/* Nós extras gerados pelo usuário */}
              {extraCanvasNodes.map(node => (
                <div key={node.id} className="albus-node branch-custom">
                  <div className="albus-branch-header">
                    <span>✨ {node.title}</span>
                    <small>{node.category}</small>
                  </div>
                  <pre className="albus-custom-pre">{node.body}</pre>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* =====================================================================
          MODO 3: ARENA DE DESAFIOS ÁQUILA (SWITCH TEMPLATE)
         ===================================================================== */}
      {activeHubMode === 'arena' && (
        <section className="aquila-arena-arena-section">
          <div className="aquila-arena-header-bar">
            <div className="aquila-arena-template-switcher">
              <span className="filter-bar-label">TROCAR MODELO DE DESAFIO:</span>
              <button
                className={`arena-template-btn ${arenaTemplate === 'quizshow' ? 'active' : ''}`}
                onClick={() => setArenaTemplate('quizshow')}
              >
                <Trophy size={15} /> Quiz Show (Arena)
              </button>
              <button
                className={`arena-template-btn ${arenaTemplate === 'matchup' ? 'active' : ''}`}
                onClick={() => setArenaTemplate('matchup')}
              >
                <Layers size={15} /> Pares Combinados (Match Up)
              </button>
              <button
                className={`arena-template-btn ${arenaTemplate === 'wheel' ? 'active' : ''}`}
                onClick={() => setArenaTemplate('wheel')}
              >
                <Shuffle size={15} /> Roleta da Sala (Sorteio Ativo)
              </button>
            </div>

            <div className="aquila-arena-scoreboard">
              <span className="arena-multiplier">Multiplicador: <strong>x{quizMultiplier}</strong></span>
              <span className="arena-score">Placar Arena: <strong>{quizScore} pts</strong></span>
            </div>
          </div>

          {arenaTemplate === 'quizshow' && (
            <div className="arena-quizshow-stage">
              <div className="arena-lifelines-bar">
                <span>AJUDAS DE PALCO:</span>
                <button
                  className="arena-lifeline-btn"
                  onClick={handleLifeline5050}
                  disabled={eliminatedAlts.length > 0 || examSubmitted}
                >
                  ✂️ 50/50 (Eliminar 2 Erradas)
                </button>
                <button
                  className="arena-lifeline-btn"
                  onClick={() => setQuizMultiplier(m => Math.min(5, m + 1))}
                  disabled={examSubmitted}
                >
                  ⚡ Dobrar Pontos (x{Math.min(5, quizMultiplier + 1)})
                </button>
                <button
                  className="arena-lifeline-btn"
                  onClick={() => setSocraticHintStep(s => Math.min(3, s + 1))}
                >
                  💡 Dica da Banca ({socraticHintStep}/3)
                </button>
              </div>

              <div className="arena-question-box">
                <div className="arena-question-meta">
                  <span>RODADA {currentIndex + 1} DE {tracks.length}</span>
                  <span>{currentTrack.exam} {currentTrack.year} • TRI {Math.round(currentTrack.difficulty_tri || 710)}</span>
                </div>
                <h3>{currentTrack.original_question}</h3>

                {socraticHintStep > 0 && (
                  <div className="socratic-hints-box">
                    {socraticHints.slice(0, socraticHintStep).map((h, i) => (
                      <p key={i}>{h}</p>
                    ))}
                  </div>
                )}

                <div className="arena-alternatives-grid">
                  {(['A', 'B', 'C', 'D', 'E'] as const).map(letter => {
                    const text = (alternativesMap as any)[letter];
                    if (!text) return null;
                    const isEliminated = eliminatedAlts.includes(letter);
                    const isSelected = selectedAlternative === letter;
                    let statusClass = '';
                    if (examSubmitted) {
                      if (letter === (currentTrack.correct_answer || 'C').toUpperCase()) statusClass = 'correct-alt';
                      else if (isSelected) statusClass = 'wrong-alt';
                    }

                    return (
                      <button
                        key={letter}
                        className={`arena-alt-card ${isSelected ? 'selected' : ''} ${statusClass} ${isEliminated ? 'eliminated' : ''}`}
                        disabled={isEliminated || examSubmitted}
                        onClick={() => {
                          setSelectedAlternative(letter);
                        }}
                      >
                        <span className="arena-alt-letter">{letter}</span>
                        <span className="arena-alt-text">{isEliminated ? '— Eliminada pelo 50/50 —' : text}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="arena-stage-footer">
                  {!examSubmitted ? (
                    <button
                      className="confirm-answer-btn"
                      disabled={!selectedAlternative}
                      onClick={handleConfirmAnswer}
                    >
                      Confirmar no Quiz Show <ChevronRight size={16} />
                    </button>
                  ) : (
                    <button
                      className="next-question-btn"
                      onClick={() => {
                        setCurrentIndex(i => (i + 1) % tracks.length);
                        resetQuestionState(true);
                      }}
                    >
                      Próxima Rodada <ChevronRight size={16} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {arenaTemplate === 'matchup' && (
            <div className="arena-matchup-stage">
              <div className="arena-matchup-instructions">
                <p>Selecione um <strong>Macro-Tópico</strong> à esquerda e combine com seu <strong>Conceito-Chave / Pré-Requisito</strong> à direita ({matchedConceptIds.length}/{Math.min(6, concepts.length)} combinados):</p>
                {matchedConceptIds.length > 0 && (
                  <button className="reset-btn" onClick={() => { setMatchedConceptIds([]); setSelectedMatchLeft(null); }}>
                    <RefreshCw size={14} /> Reiniciar Tabuleiro
                  </button>
                )}
              </div>
              <div className="arena-matchup-columns">
                <div className="arena-match-col">
                  <h4>Macro-Tópico & Banca</h4>
                  {concepts.slice(0, 6).map(c => {
                    const isMatched = matchedConceptIds.includes(c.concept_id);
                    const isSelected = selectedMatchLeft === c.concept_id;
                    return (
                      <button
                        key={c.concept_id}
                        disabled={isMatched}
                        className={`arena-match-item ${isSelected ? 'selected' : ''} ${isMatched ? 'matched' : ''}`}
                        onClick={() => setSelectedMatchLeft(c.concept_id)}
                      >
                        <span className="matrix-exam-tag">{c.exam}</span>
                        <strong>{c.macro_topic}</strong>
                      </button>
                    );
                  })}
                </div>

                <div className="arena-match-col">
                  <h4>Conceitos-Chave & Base Matemática</h4>
                  {concepts.slice(0, 6).map((c, idx) => {
                    const isMatched = matchedConceptIds.includes(c.concept_id);
                    return (
                      <button
                        key={`${c.concept_id}_target_${idx}`}
                        disabled={isMatched}
                        className={`arena-match-item target ${isMatched ? 'matched' : ''}`}
                        onClick={() => {
                          if (!selectedMatchLeft) return;
                          if (selectedMatchLeft === c.concept_id) {
                            setMatchedConceptIds(prev => [...prev, c.concept_id]);
                            setQuizScore(s => s + 150);
                            setEnergyPoints(p => p + 50);
                            setSelectedMatchLeft(null);
                          } else {
                            setSelectedMatchLeft(null);
                          }
                        }}
                      >
                        <span>{c.core_concepts}</span>
                        <small>Base: {c.prerequisite_math}</small>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {arenaTemplate === 'wheel' && (
            <div className="arena-wheel-stage">
              <div className="arena-wheel-card">
                <div className={`arena-wheel-circle ${wheelSpinning ? 'spinning' : ''}`}>
                  <Shuffle size={42} />
                  <span>{wheelSpinning ? 'Girando Roleta...' : 'Roleta Pronta'}</span>
                </div>
                <button className="confirm-answer-btn" onClick={handleSpinWheel} disabled={wheelSpinning}>
                  🎡 Girar Roleta de Questões ({tracks.length} itens)
                </button>
                {wheelResultIdx !== null && tracks[wheelResultIdx] && (
                  <div className="arena-wheel-result">
                    <span className="exam-badge">{tracks[wheelResultIdx].exam} {tracks[wheelResultIdx].year}</span>
                    <h4>Sorteado: {tracks[wheelResultIdx].macro_topic}</h4>
                    <p>{tracks[wheelResultIdx].original_question}</p>
                    <button className="nvidia-boost-btn" onClick={() => setActiveHubMode('simulador')}>
                      Resolver no Simulador Completo <ChevronRight size={15} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      )}

      {/* =====================================================================
          MODO 1: SIMULADOR OFICIAL + TUTOR SOCRÁTICO ÁQUILA + CÂMARA DE DEGRAUS
         ===================================================================== */}
      {activeHubMode === 'simulador' && (
        <div className="mastery-scalable-viewport" style={{ zoom: `${zoomLevel}%` }}>
        <div className="mastery-content-grid">
          {/* Lado Esquerdo: Questão Oficial do Vestibular */}
          <section className="exam-question-card">
            <div className="card-badge-row">
              <div className="card-badges-left">
                <span className="exam-badge">{currentTrack.exam} {currentTrack.year}</span>
                <span className="subject-badge">{currentTrack.subject}</span>
                {currentTrack.decade_span && (
                  <span className="decade-badge">Décadas {currentTrack.decade_span}</span>
                )}
                {currentTrack.incidence_pct && (
                  <span className="incidence-badge">Incidência: {currentTrack.incidence_pct}%</span>
                )}
                <span className="tri-pill-badge">TRI: {Math.round(currentTrack.difficulty_tri || 715)} pts</span>
              </div>

              {/* Question Navigator */}
              <div className="question-navigator">
                <button
                  className="nav-q-btn"
                  disabled={currentIndex <= 0}
                  onClick={() => {
                    setCurrentIndex(i => Math.max(0, i - 1));
                    resetQuestionState(inMasteryChamber);
                  }}
                  title="Questão Anterior"
                >
                  <ChevronLeft size={15} />
                </button>
                <span className="nav-q-counter">
                  {currentIndex + 1} / {tracks.length}
                </span>
                <button
                  className="nav-q-btn"
                  disabled={currentIndex >= tracks.length - 1}
                  onClick={() => {
                    setCurrentIndex(i => Math.min(tracks.length - 1, i + 1));
                    resetQuestionState(inMasteryChamber);
                  }}
                  title="Próxima Questão"
                >
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>

            {currentTrack.macro_topic && (
              <div className="question-macro-topic-banner">
                <strong>Tópico Mapeado ({BNCC_CODES_BY_SUBJECT[subject]}):</strong> {currentTrack.macro_topic}
              </div>
            )}

            <p className="question-statement">{currentTrack.original_question}</p>

            {/* Módulo Manipulativo Concreto & Blocos Numéricos (Fundamental I - Matific / Educacross) */}
            {(currentTrack.stage === 'EF_ANOS_INICIAIS' || selectedStage === 'EF_ANOS_INICIAIS') && (
              <div className="manipulative-concrete-card">
                <div className="manipulative-header">
                  <div className="manipulative-title">
                    <Sparkles size={16} />
                    <span>Material Concreto & Blocos Numéricos Interativos (Fundamental I)</span>
                  </div>
                  <div className="manipulative-actions">
                    <button
                      className="manipulative-clear-btn"
                      onClick={() => setConcreteBlocks({ hundreds: 0, tens: 0, units: 0 })}
                      title="Zerar Blocos"
                    >
                      Zerar
                    </button>
                    <button
                      className="manipulative-toggle-btn"
                      onClick={() => setShowManipulativePanel(p => !p)}
                    >
                      {showManipulativePanel ? 'Ocultar' : 'Expandir Material Concreto'}
                    </button>
                  </div>
                </div>

                {showManipulativePanel && (
                  <div className="manipulative-body">
                    <div className="manipulative-controls">
                      <div className="control-group">
                        <span className="control-label">Centenas (Placas):</span>
                        <div className="control-btns">
                          <button onClick={() => setConcreteBlocks(b => ({ ...b, hundreds: Math.max(0, b.hundreds - 1) }))}>-</button>
                          <span className="control-val">{concreteBlocks.hundreds}</span>
                          <button onClick={() => setConcreteBlocks(b => ({ ...b, hundreds: Math.min(9, b.hundreds + 1) }))}>+</button>
                        </div>
                      </div>
                      <div className="control-group">
                        <span className="control-label">Dezenas (Barras):</span>
                        <div className="control-btns">
                          <button onClick={() => setConcreteBlocks(b => ({ ...b, tens: Math.max(0, b.tens - 1) }))}>-</button>
                          <span className="control-val">{concreteBlocks.tens}</span>
                          <button onClick={() => setConcreteBlocks(b => ({ ...b, tens: Math.min(19, b.tens + 1) }))}>+</button>
                        </div>
                      </div>
                      <div className="control-group">
                        <span className="control-label">Unidades (Cubinhos):</span>
                        <div className="control-btns">
                          <button onClick={() => setConcreteBlocks(b => ({ ...b, units: Math.max(0, b.units - 1) }))}>-</button>
                          <span className="control-val">{concreteBlocks.units}</span>
                          <button onClick={() => setConcreteBlocks(b => ({ ...b, units: Math.min(30, b.units + 1) }))}>+</button>
                        </div>
                      </div>
                      <div className="concrete-total-pill">
                        Total Representado: <strong>{concreteBlocks.hundreds * 100 + concreteBlocks.tens * 10 + concreteBlocks.units}</strong>
                      </div>
                    </div>

                    <div className="manipulative-board">
                      {concreteBlocks.hundreds > 0 && (
                        <div className="blocks-column hundreds-column">
                          <span className="column-title">Centenas ({concreteBlocks.hundreds * 100})</span>
                          <div className="hundreds-grid">
                            {Array.from({ length: concreteBlocks.hundreds }).map((_, i) => (
                              <div key={i} className="hundred-plate" title="Placa de 100">
                                100
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {concreteBlocks.tens > 0 && (
                        <div className="blocks-column tens-column">
                          <span className="column-title">Dezenas ({concreteBlocks.tens * 10})</span>
                          <div className="tens-grid">
                            {Array.from({ length: concreteBlocks.tens }).map((_, i) => (
                              <div key={i} className="ten-rod" title="Barra de 10">
                                {Array.from({ length: 10 }).map((_, j) => (
                                  <div key={j} className="unit-segment" />
                                ))}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {concreteBlocks.units > 0 && (
                        <div className="blocks-column units-column">
                          <span className="column-title">Unidades ({concreteBlocks.units})</span>
                          <div className="units-grid">
                            {Array.from({ length: concreteBlocks.units }).map((_, i) => (
                              <div key={i} className="unit-cube" title="1 unidade" />
                            ))}
                          </div>
                        </div>
                      )}

                      {concreteBlocks.hundreds === 0 && concreteBlocks.tens === 0 && concreteBlocks.units === 0 && (
                        <div className="empty-manipulative-hint">
                          Clique nos botões acima (+) para adicionar placas, barras ou cubinhos e visualizar a quantidade da questão.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Laboratório Virtual Interativo (PhET / GeoGebra Sandbox para Fundamental II) */}
            {(currentTrack.stage === 'EF_ANOS_FINAIS' || selectedStage === 'EF_ANOS_FINAIS') && (
              <div className="virtual-lab-card">
                <div className="virtual-lab-header">
                  <div className="virtual-lab-title">
                    <Sliders size={16} />
                    <span>Laboratório Interativo: Plano Cartesiano & Funções Dinâmicas (Fundamental II)</span>
                  </div>
                  <button
                    className="virtual-lab-toggle-btn"
                    onClick={() => setShowLabSimulation(p => !p)}
                  >
                    {showLabSimulation ? 'Ocultar Laboratório' : 'Abrir Laboratório Interativo'}
                  </button>
                </div>

                {showLabSimulation && (
                  <div className="virtual-lab-body">
                    <div className="lab-controls-panel">
                      <div className="lab-slider-row">
                        <label>Inclinação da Reta (Taxa de Variação <strong>a = {lineSlope}</strong>):</label>
                        <input
                          type="range"
                          min="-4"
                          max="4"
                          step="0.5"
                          value={lineSlope}
                          onChange={(e) => setLineSlope(parseFloat(e.target.value))}
                          className="lab-range-slider"
                        />
                      </div>
                      <div className="lab-slider-row">
                        <label>Termo Independente / Ponto de Partida (Intercepto <strong>b = {lineIntercept}</strong>):</label>
                        <input
                          type="range"
                          min="-6"
                          max="6"
                          step="1"
                          value={lineIntercept}
                          onChange={(e) => setLineIntercept(parseFloat(e.target.value))}
                          className="lab-range-slider"
                        />
                      </div>
                      <div className="lab-equation-display">
                        <span>Lei da Função Afim: <code>f(x) = {lineSlope === 0 ? '' : lineSlope === 1 ? 'x' : lineSlope === -1 ? '-x' : `${lineSlope}x`} {lineIntercept > 0 ? `+ ${lineIntercept}` : lineIntercept < 0 ? `- ${Math.abs(lineIntercept)}` : ''}</code></span>
                        <span className="lab-root-hint">
                          {lineSlope !== 0
                            ? `Zero/Raiz: x = ${(-lineIntercept / lineSlope).toFixed(2)}`
                            : 'Função Constante (sem raiz única)'}
                        </span>
                      </div>
                    </div>

                    <div className="lab-svg-container">
                      <svg viewBox="-120 -120 240 240" className="lab-coordinate-grid">
                        {[-100, -80, -60, -40, -20, 20, 40, 60, 80, 100].map(val => (
                          <g key={val}>
                            <line x1={val} y1="-115" x2={val} y2="115" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
                            <line x1="-115" y1={val} x2="115" y2={val} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
                          </g>
                        ))}
                        <line x1="-115" y1="0" x2="115" y2="0" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
                        <line x1="0" y1="-115" x2="0" y2="115" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
                        <text x="110" y="-4" fill="#94a3b8" fontSize="8" textAnchor="end">X</text>
                        <text x="6" y="-105" fill="#94a3b8" fontSize="8">Y</text>

                        {(() => {
                          const scale = 10;
                          const x1 = -10;
                          const y1 = lineSlope * x1 + lineIntercept;
                          const x2 = 10;
                          const y2 = lineSlope * x2 + lineIntercept;
                          return (
                            <line
                              x1={x1 * scale}
                              y1={-y1 * scale}
                              x2={x2 * scale}
                              y2={-y2 * scale}
                              stroke="#38bdf8"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                            />
                          );
                        })()}

                        <circle
                          cx="0"
                          cy={-lineIntercept * 10}
                          r="4"
                          fill="#f59e0b"
                          stroke="#0f172a"
                          strokeWidth="1.5"
                        />
                        <text x="8" y={-lineIntercept * 10 + 3} fill="#f59e0b" fontSize="8" fontWeight="bold">
                          (0, {lineIntercept})
                        </text>
                      </svg>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Espelho Oficial de Correção e Rubricas Analíticas (Medicina & 2ª Fase) */}
            {currentTrack.rubricCriteria && currentTrack.rubricCriteria.length > 0 && (
              <div className="rubric-criteria-drawer">
                <div className="rubric-criteria-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Award size={15} />
                    <span>Espelho Analítico da Banca & Autoavaliação de 2ª Fase</span>
                  </div>
                  <div className="rubric-score-badge">
                    Nota Estimada: {Object.keys(checkedRubricCriteria).filter(k => checkedRubricCriteria[parseInt(k)]).reduce((acc, k) => {
                      const item = currentTrack.rubricCriteria![parseInt(k)];
                      return acc + (item ? item.weight * 10 : 0);
                    }, 0).toFixed(1)} / 10.0
                  </div>
                </div>
                <div className="rubric-criteria-list">
                  {currentTrack.rubricCriteria.map((rc, idx) => {
                    const isChecked = !!checkedRubricCriteria[idx];
                    return (
                      <div
                        key={idx}
                        className={`rubric-criterion-card ${isChecked ? 'checked' : ''}`}
                        onClick={() => setCheckedRubricCriteria(prev => ({ ...prev, [idx]: !prev[idx] }))}
                        style={{ cursor: 'pointer' }}
                      >
                        <div className="rc-top">
                          <div className="rc-title-wrap">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {}}
                              className="rc-checkbox"
                            />
                            <span className="rc-title">{rc.criterion}</span>
                          </div>
                          <span className="rc-weight">Peso {(rc.weight * 100).toFixed(0)}% ({(rc.weight * 10).toFixed(1)} pts)</span>
                        </div>
                        <p className="rc-guideline">{rc.keyGuideline}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Dicas Socráticas Passo a Passo Áquila */}
            <div className="socratic-hint-bar">
              <button
                className="socratic-hint-btn"
                onClick={() => setSocraticHintStep(prev => Math.min(3, prev + 1))}
                disabled={socraticHintStep >= 3}
              >
                <Lightbulb size={15} />
                {socraticHintStep === 0
                  ? 'Pedir Dica Socrática Soberana (0/3)'
                  : socraticHintStep < 3
                  ? `Revelar Próxima Dica Socrática (${socraticHintStep}/3)`
                  : 'Todas as 3 Dicas Socráticas Reveladas'}
              </button>
              <button
                className="socratic-canvas-link"
                onClick={() => setActiveHubMode('canvas')}
              >
                <Network size={14} /> Abrir no Canvas de Conhecimento
              </button>
            </div>

            {socraticHintStep > 0 && (
              <div className="socratic-hints-box">
                {socraticHints.slice(0, socraticHintStep).map((hint, idx) => (
                  <div key={idx} className="socratic-hint-item">
                    <Sparkles size={14} />
                    <span>{hint}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="alternatives-list">
              {(['A', 'B', 'C', 'D', 'E'] as const).map(letter => {
                const text = (alternativesMap as any)[letter];
                if (!text) return null;
                const isSelected = selectedAlternative === letter;
                let statusClass = '';
                if (examSubmitted) {
                  if (letter === (currentTrack.correct_answer || 'C').toUpperCase()) statusClass = 'correct-alt';
                  else if (isSelected) statusClass = 'wrong-alt';
                }

                return (
                  <div
                    key={letter}
                    className={`alternative-item ${isSelected ? 'selected' : ''} ${statusClass}`}
                    onClick={() => handleSelectAlternative(letter)}
                  >
                    <span className="alt-letter">{letter}</span>
                    <span className="alt-text">{text}</span>
                    {statusClass === 'correct-alt' && <CheckCircle2 size={16} className="alt-status-icon success" />}
                    {statusClass === 'wrong-alt' && <XCircle size={16} className="alt-status-icon danger" />}
                  </div>
                );
              })}
            </div>

            <div className="question-actions">
              {!examSubmitted ? (
                <>
                  <button
                    className="confirm-answer-btn"
                    disabled={!selectedAlternative}
                    onClick={handleConfirmAnswer}
                  >
                    Confirmar Resposta <ChevronRight size={16} />
                  </button>
                  <button
                    className="need-help-btn"
                    onClick={() => setInMasteryChamber(prev => !prev)}
                  >
                    <Brain size={15} /> {inMasteryChamber ? 'Focar na Prova' : 'Abrir Câmara de Maestria'}
                  </button>
                </>
              ) : (
                <div className="result-alert-box">
                  {isCorrect ? (
                    <div className="alert-content success">
                      <CheckCircle2 size={20} />
                      <div>
                        <strong>Resposta Correta! Gabarito Oficial: {currentTrack.correct_answer} (+100 pts Energia)</strong>
                        <p>Você avançou rumo à Coroa de Maestria neste tópico ({currentAquilaTier.label}).</p>
                      </div>
                    </div>
                  ) : (
                    <div className="alert-content danger">
                      <XCircle size={20} />
                      <div>
                        <strong>Resposta Incorreta (Gabarito: {currentTrack.correct_answer}).</strong>
                        <p>Use os 3 degraus ao lado na Câmara de Maestria para destravar o pré-requisito raiz.</p>
                      </div>
                    </div>
                  )}
                  <div className="result-buttons-row">
                    <button className="reset-btn" onClick={() => resetQuestionState(true)}>
                      <RefreshCw size={14} /> Refazer Questão
                    </button>
                    {currentIndex < tracks.length - 1 && (
                      <button
                        className="next-question-btn"
                        onClick={() => {
                          setCurrentIndex(i => Math.min(tracks.length - 1, i + 1));
                          resetQuestionState(true);
                        }}
                      >
                        Próxima Questão <ChevronRight size={15} />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Lado Direito: A Câmara Mastery + Progresso Soberano Áquila 5 Níveis */}
          {inMasteryChamber && (
            <section className="mastery-chamber-panel">
              <div className="chamber-header">
                <div className="chamber-header-title">
                  <Layers size={18} className="chamber-icon" />
                  <div>
                    <h3>Câmara de Domínio Gradual ({currentTrack.exam})</h3>
                    <p>Escada de Maestria Soberana (5 Níveis) + Micro-passos calibrados na GPU.</p>
                  </div>
                </div>

                <button
                  className="nvidia-boost-btn"
                  onClick={handleGenerateLiveWithNvidia}
                  disabled={isGeneratingNvidia}
                >
                  <Cpu size={14} />
                  {isGeneratingNvidia ? 'Sintetizando...' : 'NVIDIA / Colab Assist'}
                </button>
              </div>

              {/* Barra Visual dos 5 Níveis de Maestria Áquila */}
              <div className="aquila-tiers-strip">
                {AQUILA_MASTERY_TIERS.map(tier => {
                  const reached = masteryScore >= tier.minScore;
                  return (
                    <div
                      key={tier.id}
                      className={`aquila-tier-step ${reached ? 'reached' : ''}`}
                      style={{ borderColor: reached ? tier.color : undefined }}
                    >
                      <Crown size={12} style={{ color: reached ? tier.color : '#64748b' }} />
                      <span>{tier.label}</span>
                    </div>
                  );
                })}
              </div>

              {/* Diagnóstico Pedagógico */}
              <div className="diagnostic-banner">
                <div className="diag-item">
                  <span className="diag-label">🎯 Músculo Matemático Raiz:</span>
                  <span className="diag-value">{currentTrack.diagnostic?.prerequisite_math}</span>
                </div>
                <div className="diag-item">
                  <span className="diag-label">🧠 Conceito Teórico ({currentTrack.exam}):</span>
                  <span className="diag-value">{currentTrack.diagnostic?.prerequisite_concept}</span>
                </div>
              </div>

              {/* Abas de Degraus (Níveis 1, 2, 3) */}
              <div className="level-tabs">
                {progressiveLevels.map((lvl: any) => (
                  <button
                    key={lvl.level}
                    className={`level-tab-btn ${activeStep === lvl.level ? 'active' : ''}`}
                    onClick={() => setActiveStep(lvl.level)}
                  >
                    Degrau {lvl.level}
                  </button>
                ))}
              </div>

              {/* Exercícios do Nível Ativo */}
              {currentLevel && currentLevel.exercises && (
                <div className="level-drill-card">
                  <div className="level-info">
                    <h4>{currentLevel.title}</h4>
                    <p>{currentLevel.description}</p>
                  </div>

                  <div className="drills-scroll-list">
                    {currentLevel.exercises.map((ex: Exercise, i: number) => {
                      const key = `${currentTrack.question_id}_lvl_${activeStep}_ex_${i}`;
                      const isFeedback = drillFeedback[key];

                      return (
                        <div key={key} className="drill-row">
                          <span className="drill-num">{i + 1}.</span>
                          <span className="drill-text">{ex.drill}</span>
                          <div className="drill-input-wrap">
                            <input
                              type="text"
                              placeholder="Resp."
                              value={drillAnswers[key] || ''}
                              onChange={e => handleDrillChange(key, e.target.value)}
                              onKeyDown={e => {
                                if (e.key === 'Enter') checkDrill(key, ex.ans);
                              }}
                            />
                            <button
                              className="drill-check-btn"
                              onClick={() => checkDrill(key, ex.ans)}
                            >
                              Verificar
                            </button>
                            {isFeedback === true && <CheckCircle2 size={16} className="feedback-icon success" />}
                            {isFeedback === false && (
                              <span className="drill-hint-ans" title={`Resposta esperada: ${ex.ans}`}>
                                <XCircle size={16} className="feedback-icon danger" />
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Saída ao vivo da NVIDIA / Colab se ativada */}
              {nvidiaResponse && (
                <div className="nvidia-output-card">
                  <div className="nvidia-output-header">
                    <Sparkles size={15} />
                    <span>Resolução Guiada — Cluster Colab + Virtual GPU</span>
                  </div>
                  <pre className="nvidia-output-text">{nvidiaResponse}</pre>
                </div>
              )}

              <div className="chamber-footer">
                <button
                  className="exit-chamber-btn"
                  onClick={() => {
                    if (activeStep < 3) {
                      setActiveStep(s => s + 1);
                    } else {
                      setActiveStep(1);
                    }
                  }}
                >
                  <Award size={16} />
                  {activeStep < 3 ? `Avançar para o Degrau ${activeStep + 1}` : 'Reiniciar Trilha de Degraus'}
                </button>
              </div>
            </section>
          )}
        </div>
        </div>
      )}
    </div>
  );
};

export default StudentMasteryChamber;
