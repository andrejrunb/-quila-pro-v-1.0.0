import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  Compass,
  HelpCircle,
  Layers,
  PauseCircle,
  Play,
  RefreshCw,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  UserCheck,
} from 'lucide-react';

export interface MasteryEstimateRecord {
  id?: string;
  school_id?: string;
  student_id?: string;
  subject: string;
  skill_code: string;
  skill_name?: string | null;
  questions_answered: number;
  independent_correct: number;
  hints_used: number;
  duration_seconds?: number;
  completed_reason?: string | null;
  estimated_level?: string | null;
  confidence_label?: 'BAIXA' | 'MEDIA' | 'ALTA' | string | null;
  needs_teacher_review?: number;
  updated_at?: string | null;
}

interface PracticeQuestionItem {
  id: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  hint: string;
  explanation: string;
  flashcardFront: string;
  flashcardBack: string;
}

interface SkillTrackDefinition {
  subject: 'Matemática';
  skillCode: string;
  bnccCode: string;
  skillName: string;
  summary: string;
  questions: PracticeQuestionItem[];
}

export interface StudentDomainTrailsProps {
  studentId: string;
  masteryEstimates: MasteryEstimateRecord[];
  onSessionRecorded?: () => Promise<void> | void;
}

const MAX_SESSION_QUESTIONS = 6; // Teto pedagógico entre 6 e 8 questões (limite rígido do backend: 8)
const CONSECUTIVE_ERROR_PAUSE_LIMIT = 3;

const PILOT_MATH_TRACKS: SkillTrackDefinition[] = [
  {
    subject: 'Matemática',
    skillCode: 'MAT-FRAC-EQ',
    bnccCode: 'EF07MA08',
    skillName: 'Frações Equivalentes',
    summary: 'Identificação, simplificação e comparação proporcional de frações equivalentes.',
    questions: [
      {
        id: 'feq-1',
        prompt: 'Qual fração abaixo é equivalente a 2/3?',
        options: ['4/6', '3/4', '4/9', '6/8'],
        correctIndex: 0,
        hint: 'Multiplique o numerador (2) e o denominador (3) pelo mesmo número inteiro diferente de zero, como 2.',
        explanation: 'Multiplicando numerador e denominador por 2: (2 × 2) / (3 × 2) = 4/6.',
        flashcardFront: 'Como obter uma fração equivalente a 2/3?',
        flashcardBack: 'Multiplique ou divida numerador e denominador pelo mesmo número não nulo. Ex.: (2×2)/(3×2) = 4/6.',
      },
      {
        id: 'feq-2',
        prompt: 'Simplificando a fração 18/24 até a forma irredutível, obtemos:',
        options: ['6/8', '3/4', '2/3', '9/16'],
        correctIndex: 1,
        hint: 'Encontre o maior divisor comum entre 18 e 24 (que é 6) e divida ambos por ele.',
        explanation: 'Dividindo 18 e 24 por 6: 18 ÷ 6 = 3 e 24 ÷ 6 = 4, resultando em 3/4.',
        flashcardFront: 'Quando uma fração está na forma irredutível?',
        flashcardBack: 'Quando numerador e denominador não possuem divisor comum maior que 1. Em 18/24, dividindo por 6 chegamos a 3/4.',
      },
      {
        id: 'feq-3',
        prompt: 'Na igualdade 5/8 = x/32, qual é o valor de x?',
        options: ['16', '24', '20', '15'],
        correctIndex: 2,
        hint: 'Veja por quanto 8 foi multiplicado para resultar em 32, e multiplique 5 pelo mesmo fator.',
        explanation: 'Como 8 × 4 = 32, multiplicamos o numerador por 4: x = 5 × 4 = 20.',
        flashcardFront: 'Como encontrar o termo desconhecido em 5/8 = x/32?',
        flashcardBack: 'Identifique o fator entre os denominadores (32 ÷ 8 = 4) e aplique no numerador: x = 5 × 4 = 20.',
      },
      {
        id: 'feq-4',
        prompt: 'Uma barra foi dividida em 12 partes iguais. Quantas partes representam exatamente 3/4 da barra?',
        options: ['6 partes', '8 partes', '10 partes', '9 partes'],
        correctIndex: 3,
        hint: 'Transforme 3/4 em uma fração equivalente com denominador 12.',
        explanation: 'Multiplicando 3/4 por 3 em cima e embaixo: (3 × 3)/(4 × 3) = 9/12, ou seja, 9 partes.',
        flashcardFront: 'Quantos doze-avos equivalem a 3/4?',
        flashcardBack: 'Como 4 × 3 = 12, multiplicamos 3 × 3 = 9. Logo, 3/4 = 9/12.',
      },
      {
        id: 'feq-5',
        prompt: 'Qual dos pares abaixo NÃO é formado por frações equivalentes?',
        options: ['1/2 e 7/14', '3/5 e 6/15', '4/7 e 12/21', '5/6 e 15/18'],
        correctIndex: 1,
        hint: 'Compare se o fator que multiplica o numerador é igual ao fator que multiplica o denominador.',
        explanation: 'Em 3/5, multiplicar por 2 gera 6/10, e não 6/15. Portanto, 3/5 e 6/15 não são equivalentes.',
        flashcardFront: 'Como testar rapidamente se a/b e c/d são equivalentes?',
        flashcardBack: 'Verifique se o fator multiplicativo é igual no numerador e no denominador (ou se a × d = b × c).',
      },
      {
        id: 'feq-6',
        prompt: 'Ana leu 15/25 de um livro e Lucas leu 3/5 do mesmo livro. Comparando as leituras:',
        options: [
          'Ana leu mais que Lucas',
          'Lucas leu mais que Ana',
          'Leram a mesma fração do livro',
          'Não é possível comparar sem o total de páginas',
        ],
        correctIndex: 2,
        hint: 'Simplifique 15/25 dividindo numerador e denominador por 5 e compare com 3/5.',
        explanation: 'Simplificando 15/25 por 5 obtemos 3/5. Portanto, ambos leram exatamente a mesma fração do livro.',
        flashcardFront: 'Por que 15/25 e 3/5 representam a mesma parte do todo?',
        flashcardBack: 'Porque 15 ÷ 5 = 3 e 25 ÷ 5 = 5; reduzir pelo mesmo fator preserva a proporção do todo.',
      },
    ],
  },
  {
    subject: 'Matemática',
    skillCode: 'MAT-EQ-1G',
    bnccCode: 'EF07MA18',
    skillName: 'Equações do 1º Grau',
    summary: 'Resolução de igualdades com uma incógnita e modelagem de problemas simples.',
    questions: [
      {
        id: 'eq1-1',
        prompt: 'Qual é o valor de x na equação x + 9 = 17?',
        options: ['8', '26', '7', '9'],
        correctIndex: 0,
        hint: 'Subtraia 9 dos dois lados da igualdade para isolar x.',
        explanation: 'x = 17 - 9, logo x = 8. Conferindo: 8 + 9 = 17.',
        flashcardFront: 'Qual o princípio aditivo na equação x + 9 = 17?',
        flashcardBack: 'Aplicamos a operação inversa dos dois lados: subtraindo 9, isolamos x = 17 - 9 = 8.',
      },
      {
        id: 'eq1-2',
        prompt: 'Resolva a equação 3x = 21:',
        options: ['18', '7', '6', '63'],
        correctIndex: 1,
        hint: 'O número 3 está multiplicando x; divida ambos os lados por 3.',
        explanation: 'x = 21 ÷ 3 = 7. Conferindo: 3 × 7 = 21.',
        flashcardFront: 'Como resolver 3x = 21?',
        flashcardBack: 'Dividimos os dois membros pelo coeficiente 3: x = 21 / 3 = 7.',
      },
      {
        id: 'eq1-3',
        prompt: 'Qual é a solução da equação 2x - 5 = 11?',
        options: ['3', '6', '8', '16'],
        correctIndex: 2,
        hint: 'Primeiro some 5 nos dois lados para isolar 2x; depois divida por 2.',
        explanation: '2x = 11 + 5 -> 2x = 16 -> x = 16 ÷ 2 = 8.',
        flashcardFront: 'Qual a ordem mais segura em 2x - 5 = 11?',
        flashcardBack: '1º isole o termo com x somando 5 (2x = 16); 2º divida pelo coeficiente 2 (x = 8).',
      },
      {
        id: 'eq1-4',
        prompt: 'Em 4x + 6 = 2x + 18, qual é o valor de x?',
        options: ['4', '12', '3', '6'],
        correctIndex: 3,
        hint: 'Agrupe os termos com x no primeiro membro (4x - 2x) e os números no segundo (18 - 6).',
        explanation: '4x - 2x = 18 - 6 -> 2x = 12 -> x = 6.',
        flashcardFront: 'Como lidar com x nos dois lados (4x + 6 = 2x + 18)?',
        flashcardBack: 'Subtraia 2x e 6 de ambos os membros: 2x = 12 -> x = 6.',
      },
      {
        id: 'eq1-5',
        prompt: 'O triplo de um número somado a 4 é igual a 25. Que número é esse?',
        options: ['9', '7', '21', '8'],
        correctIndex: 1,
        hint: 'Traduza o enunciado para 3n + 4 = 25, subtraia 4 e divida por 3.',
        explanation: '3n + 4 = 25 -> 3n = 21 -> n = 7.',
        flashcardFront: 'Como modelar "o triplo de um número somado a 4 é 25"?',
        flashcardBack: 'Escreva 3n + 4 = 25 -> 3n = 21 -> n = 7.',
      },
      {
        id: 'eq1-6',
        prompt: 'Resolva a equação 5(x - 2) = 20:',
        options: ['4', '2', '6', '10'],
        correctIndex: 2,
        hint: 'Divida ambos os lados por 5 para obter x - 2 = 4, ou aplique a distributiva (5x - 10 = 20).',
        explanation: 'Dividindo por 5: x - 2 = 4 -> x = 4 + 2 = 6.',
        flashcardFront: 'Como resolver equações com parênteses como 5(x - 2) = 20?',
        flashcardBack: 'Você pode dividir ambos os lados por 5 (x - 2 = 4 -> x = 6) ou distribuir (5x - 10 = 20).',
      },
    ],
  },
  {
    subject: 'Matemática',
    skillCode: 'MAT-RAZ-PROP',
    bnccCode: 'EF07MA17',
    skillName: 'Razão e Proporção',
    summary: 'Leitura de razões simplificadas, escalas e grandezas diretamente proporcionais.',
    questions: [
      {
        id: 'rp-1',
        prompt: 'Em uma turma há 12 meninas e 18 meninos. Qual a razão simplificada entre o número de meninas e o de meninos?',
        options: ['2/3', '3/2', '2/5', '3/5'],
        correctIndex: 0,
        hint: 'Monte a razão 12/18 respeitando a ordem (meninas : meninos) e simplifique por 6.',
        explanation: '12/18 simplificado por 6 resulta em 2/3 (2 meninas para cada 3 meninos).',
        flashcardFront: 'O que observar ao escrever uma razão entre duas quantidades?',
        flashcardBack: 'Mantenha a ordem pedida no enunciado (ex.: meninas/meninos = 12/18) e simplifique (2/3).',
      },
      {
        id: 'rp-2',
        prompt: 'Uma receita usa 2 xícaras de farinha para 3 ovos. Para manter a proporção usando 9 ovos, quantas xícaras de farinha são necessárias?',
        options: ['4 xícaras', '6 xícaras', '8 xícaras', '12 xícaras'],
        correctIndex: 1,
        hint: 'Veja por qual número 3 ovos foram multiplicados para chegar a 9 ovos.',
        explanation: 'De 3 para 9 ovos multiplicamos por 3; logo, 2 × 3 = 6 xícaras de farinha.',
        flashcardFront: 'Como escalar uma receita proporcional (2 xícaras : 3 ovos)?',
        flashcardBack: 'Multiplique todas as grandezas pelo mesmo fator. Para 9 ovos (×3), use 2 × 3 = 6 xícaras.',
      },
      {
        id: 'rp-3',
        prompt: 'Um veículo percorre 180 km em 3 horas em ritmo constante. Quantos quilômetros percorrerá em 5 horas no mesmo ritmo?',
        options: ['240 km', '270 km', '300 km', '360 km'],
        correctIndex: 2,
        hint: 'Encontre primeiro quantos quilômetros são percorridos em 1 hora (180 ÷ 3).',
        explanation: '180 ÷ 3 = 60 km por hora. Em 5 horas: 60 × 5 = 300 km.',
        flashcardFront: 'Como usar o valor unitário em proporções diretas?',
        flashcardBack: 'Divida para achar o valor de 1 unidade (180 km ÷ 3 h = 60 km/h) e multiplique pelo alvo (× 5 h = 300 km).',
      },
      {
        id: 'rp-4',
        prompt: 'Na proporção 4/6 = 10/x, qual é o valor de x?',
        options: ['12', '16', '20', '15'],
        correctIndex: 3,
        hint: 'Use a propriedade fundamental das proporções: o produto dos meios é igual ao dos extremos (4 · x = 6 · 10).',
        explanation: '4 · x = 6 · 10 -> 4x = 60 -> x = 60 ÷ 4 = 15.',
        flashcardFront: 'Qual é a propriedade fundamental das proporções (a/b = c/d)?',
        flashcardBack: 'O produto cruzado se mantém igual: a · d = b · c. Em 4/6 = 10/x, 4x = 60 -> x = 15.',
      },
      {
        id: 'rp-5',
        prompt: 'Uma planta está na escala 1 : 50. Se uma parede mede 6 cm no desenho, qual é o comprimento real em metros?',
        options: ['30 m', '3 m', '0,3 m', '5 m'],
        correctIndex: 1,
        hint: 'Multiplique 6 cm por 50 para obter a medida real em centímetros e depois divida por 100 para converter em metros.',
        explanation: '6 cm × 50 = 300 cm. Como 100 cm = 1 m, 300 cm = 3 metros.',
        flashcardFront: 'Como converter medida em escala 1 : 50 para metros?',
        flashcardBack: 'Multiplique a medida do desenho por 50 (resultado em cm) e divida por 100 para passar para metros.',
      },
      {
        id: 'rp-6',
        prompt: 'Se 4 cadernos iguais custam R$ 36,00, quanto custarão 7 desses cadernos?',
        options: ['R$ 54,00', 'R$ 72,00', 'R$ 63,00', 'R$ 49,00'],
        correctIndex: 2,
        hint: 'Calcule o preço de 1 caderno (36 ÷ 4) e multiplique por 7.',
        explanation: 'Cada caderno custa 36 ÷ 4 = R$ 9,00. Sete cadernos custam 7 × 9 = R$ 63,00.',
        flashcardFront: 'Qual o método direto para "4 itens custam 36; quanto custam 7"?',
        flashcardBack: 'Reduza à unidade: 36 ÷ 4 = 9 por item; depois 7 × 9 = 63.',
      },
    ],
  },
];

function formatEstimatedLevel(level?: string | null): { label: string; color: string; bg: string } {
  switch (level) {
    case 'DOMINADO':
      return { label: 'Dominado (Estimativa Atual)', color: '#34D399', bg: 'rgba(16, 185, 129, 0.16)' };
    case 'EM_CONSOLIDACAO':
      return { label: 'Em Consolidação', color: '#38BDF8', bg: 'rgba(56, 189, 248, 0.16)' };
    case 'EM_DESENVOLVIMENTO':
      return { label: 'Em Desenvolvimento', color: '#FBBF24', bg: 'rgba(245, 158, 11, 0.16)' };
    case 'INICIAL':
      return { label: 'Inicial', color: '#F87171', bg: 'rgba(239, 68, 68, 0.16)' };
    default:
      return { label: 'Sem evidências suficientes', color: '#94A3B8', bg: 'rgba(148, 163, 184, 0.14)' };
  }
}

function formatConfidenceLabel(conf?: string | null): { label: string; color: string } {
  switch (conf) {
    case 'ALTA':
      return { label: 'Alta', color: '#34D399' };
    case 'MEDIA':
      return { label: 'Média', color: '#38BDF8' };
    case 'BAIXA':
      return { label: 'Baixa', color: '#FBBF24' };
    default:
      return { label: 'Não avaliada', color: '#94A3B8' };
  }
}

export const StudentDomainTrails: React.FC<StudentDomainTrailsProps> = ({
  studentId,
  masteryEstimates,
  onSessionRecorded,
}) => {
  const [selectedSkillCode, setSelectedSkillCode] = useState<string>(PILOT_MATH_TRACKS[0].skillCode);
  const [subView, setSubView] = useState<'practice' | 'drafts'>('practice');

  // Estado da sessão controlada (máx. 6 questões por sessão)
  const [sessionState, setSessionState] = useState<
    'IDLE' | 'ACTIVE' | 'PAUSED_FOR_TEACHER' | 'COMPLETED'
  >('IDLE');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [currentEvaluated, setCurrentEvaluated] = useState<{
    isCorrect: boolean;
    wasIndependent: boolean;
  } | null>(null);
  const [hintRevealedForCurrent, setHintRevealedForCurrent] = useState(false);

  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [independentCorrect, setIndependentCorrect] = useState(0);
  const [assistedCorrect, setAssistedCorrect] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [consecutiveErrors, setConsecutiveErrors] = useState(0);
  const [maxConsecutiveErrors, setMaxConsecutiveErrors] = useState(0);
  const [missedQuestionIds, setMissedQuestionIds] = useState<string[]>([]);
  const [sessionStartedAt, setSessionStartedAt] = useState<number>(Date.now());

  const [savingSession, setSavingSession] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [lastPersistedResult, setLastPersistedResult] = useState<{
    estimatedLevel: string;
    confidenceLabel: string;
    needsTeacherReview: boolean;
    completedReason: string;
  } | null>(null);

  // Rascunhos candidatos de revisão (Flashcards & Quiz)
  const [flippedCardIds, setFlippedCardIds] = useState<Record<string, boolean>>({});
  const [draftQuizAnswers, setDraftQuizAnswers] = useState<Record<string, number>>({});

  const selectedTrack = useMemo(
    () => PILOT_MATH_TRACKS.find((t) => t.skillCode === selectedSkillCode) ?? PILOT_MATH_TRACKS[0],
    [selectedSkillCode]
  );

  const sessionQuestions = useMemo(
    () => selectedTrack.questions.slice(0, MAX_SESSION_QUESTIONS),
    [selectedTrack]
  );

  const estimateBySkill = useMemo(() => {
    const map = new Map<string, MasteryEstimateRecord>();
    for (const est of masteryEstimates) {
      map.set(est.skill_code, est);
    }
    return map;
  }, [masteryEstimates]);

  const currentQuestion = sessionQuestions[currentIndex] ?? null;

  const persistSession = async (params: {
    answered: number;
    indCorrect: number;
    hints: number;
    consecErrs: number;
    completedReason: string;
  }) => {
    if (params.answered < 1) return;
    const boundedQuestions = Math.min(8, Math.max(1, params.answered));
    const boundedIndCorrect = Math.min(boundedQuestions, Math.max(0, params.indCorrect));
    const durationSeconds = Math.max(1, Math.round((Date.now() - sessionStartedAt) / 1000));

    setSavingSession(true);
    setSaveError(null);
    try {
      const api = (window as any).aquila?.mvp01;
      if (!api?.recordPracticeSession) {
        setSaveError('Serviço de registro de sessão MVP 0.1 indisponível neste ambiente.');
        return;
      }
      const res = await api.recordPracticeSession({
        studentId,
        subject: selectedTrack.subject,
        skillCode: selectedTrack.skillCode,
        skillName: selectedTrack.skillName,
        questionsAnswered: boundedQuestions,
        independentCorrect: boundedIndCorrect,
        hintsUsed: params.hints,
        durationSeconds,
        completedReason: params.completedReason,
        consecutiveErrors: params.consecErrs,
      });
      if (!res?.success) {
        setSaveError(res?.error || 'Não foi possível registrar a sessão de treino.');
        return;
      }
      setLastPersistedResult({
        estimatedLevel: res.data?.estimatedLevel || 'EM_DESENVOLVIMENTO',
        confidenceLabel: res.data?.confidenceLabel || 'BAIXA',
        needsTeacherReview: Boolean(res.data?.needsTeacherReview),
        completedReason: params.completedReason,
      });
      await onSessionRecorded?.();
    } catch {
      setSaveError('Erro ao salvar o registro da sessão formativa.');
    } finally {
      setSavingSession(false);
    }
  };

  const handleStartSession = (skillCode?: string) => {
    if (skillCode) {
      setSelectedSkillCode(skillCode);
    }
    setSessionState('ACTIVE');
    setCurrentIndex(0);
    setSelectedOption(null);
    setCurrentEvaluated(null);
    setHintRevealedForCurrent(false);
    setQuestionsAnswered(0);
    setIndependentCorrect(0);
    setAssistedCorrect(0);
    setHintsUsed(0);
    setConsecutiveErrors(0);
    setMaxConsecutiveErrors(0);
    setMissedQuestionIds([]);
    setLastPersistedResult(null);
    setSaveError(null);
    setSessionStartedAt(Date.now());
    setSubView('practice');
  };

  const handleRevealHint = () => {
    if (sessionState !== 'ACTIVE' || currentEvaluated || hintRevealedForCurrent) return;
    setHintRevealedForCurrent(true);
    setHintsUsed((prev) => prev + 1);
  };

  const handleSubmitAnswer = async () => {
    if (!currentQuestion || selectedOption === null || currentEvaluated) return;
    const isCorrect = selectedOption === currentQuestion.correctIndex;
    const wasIndependent = isCorrect && !hintRevealedForCurrent;

    const nextAnswered = questionsAnswered + 1;
    const nextIndCorrect = independentCorrect + (wasIndependent ? 1 : 0);
    const nextAssistedCorrect = assistedCorrect + (isCorrect && hintRevealedForCurrent ? 1 : 0);
    const nextConsecErrors = isCorrect ? 0 : consecutiveErrors + 1;
    const nextMaxConsec = Math.max(maxConsecutiveErrors, nextConsecErrors);

    setQuestionsAnswered(nextAnswered);
    setIndependentCorrect(nextIndCorrect);
    setAssistedCorrect(nextAssistedCorrect);
    setConsecutiveErrors(nextConsecErrors);
    setMaxConsecutiveErrors(nextMaxConsec);
    if (!isCorrect) {
      setMissedQuestionIds((prev) => [...prev, currentQuestion.id]);
    }
    setCurrentEvaluated({ isCorrect, wasIndependent });

    if (nextConsecErrors >= CONSECUTIVE_ERROR_PAUSE_LIMIT) {
      setSessionState('PAUSED_FOR_TEACHER');
      await persistSession({
        answered: nextAnswered,
        indCorrect: nextIndCorrect,
        hints: hintsUsed,
        consecErrs: nextConsecErrors,
        completedReason: 'PAUSED_CONSECUTIVE_ERRORS',
      });
    }
  };

  const handleNextOrFinish = async () => {
    if (sessionState !== 'ACTIVE') return;
    const isLast = currentIndex + 1 >= sessionQuestions.length;
    if (isLast) {
      setSessionState('COMPLETED');
      await persistSession({
        answered: questionsAnswered,
        indCorrect: independentCorrect,
        hints: hintsUsed,
        consecErrs: maxConsecutiveErrors,
        completedReason: 'COMPLETED',
      });
      return;
    }
    setCurrentIndex((prev) => prev + 1);
    setSelectedOption(null);
    setCurrentEvaluated(null);
    setHintRevealedForCurrent(false);
  };

  const handleManualPause = async () => {
    if (sessionState !== 'ACTIVE') return;
    if (questionsAnswered === 0) {
      setSessionState('IDLE');
      return;
    }
    setSessionState('COMPLETED');
    await persistSession({
      answered: questionsAnswered,
      indCorrect: independentCorrect,
      hints: hintsUsed,
      consecErrs: maxConsecutiveErrors,
      completedReason: 'PAUSED_BY_STUDENT',
    });
  };

  const candidateReviewItems = useMemo(() => {
    const missed = selectedTrack.questions.filter((q) => missedQuestionIds.includes(q.id));
    if (missed.length > 0) return missed;
    return selectedTrack.questions.slice(0, 4);
  }, [selectedTrack, missedQuestionIds]);

  const selectedEstimate = estimateBySkill.get(selectedTrack.skillCode);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }} data-testid="student-domain-trails">
      {/* Aviso Pedagógico Obrigatório */}
      <div
        style={{
          padding: '12px 14px',
          borderRadius: 10,
          background: 'rgba(14, 165, 233, 0.1)',
          border: '1px solid rgba(56, 189, 248, 0.35)',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Compass size={16} color="#38BDF8" />
            <strong style={{ fontSize: 13.5, color: '#F8FAFC' }}>
              Trilhas de Domínio — Treino Adaptativo (Piloto Controlado de Matemática)
            </strong>
          </div>
          <span
            style={{
              fontSize: 10.5,
              fontWeight: 700,
              padding: '3px 8px',
              borderRadius: 6,
              background: 'rgba(245, 158, 11, 0.16)',
              border: '1px solid rgba(245, 158, 11, 0.4)',
              color: '#FCD34D',
            }}
          >
            MATERIAL DE TREINO • NÃO ALTERA NOTA OFICIAL
          </span>
        </div>
        <p style={{ margin: 0, fontSize: 12.5, color: '#E2E8F0', lineHeight: 1.45 }}>
          Estima o domínio com base nas respostas disponíveis, indicando evidências, nível de confiança e necessidade de
          revisão. Sessões limitadas a até {MAX_SESSION_QUESTIONS} questões revisadas por etapa (teto de 8 itens),
          separando uso de dicas de acertos independentes e pausando automaticamente após 3 erros seguidos para
          encaminhamento ao professor.
        </p>
      </div>

      {/* Cards de Estimativa por Habilidade */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: 10,
        }}
      >
        {PILOT_MATH_TRACKS.map((track) => {
          const est = estimateBySkill.get(track.skillCode);
          const levelMeta = formatEstimatedLevel(est?.estimated_level);
          const confMeta = formatConfidenceLabel(est?.confidence_label);
          const isSelected = track.skillCode === selectedTrack.skillCode;
          const needsReview = est?.needs_teacher_review === 1;

          return (
            <div
              key={track.skillCode}
              style={{
                padding: 12,
                borderRadius: 10,
                background: isSelected ? 'rgba(139, 92, 246, 0.12)' : 'rgba(15, 23, 42, 0.72)',
                border: isSelected
                  ? '1px solid rgba(167, 139, 250, 0.55)'
                  : '1px solid rgba(148, 163, 184, 0.18)',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 10.5, fontFamily: 'monospace', color: '#A78BFA', fontWeight: 700 }}>
                  {track.subject.toUpperCase()} • {track.bnccCode}
                </span>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    padding: '2px 7px',
                    borderRadius: 5,
                    background: levelMeta.bg,
                    color: levelMeta.color,
                  }}
                >
                  {levelMeta.label}
                </span>
              </div>

              <div>
                <strong style={{ fontSize: 14, color: '#F8FAFC', display: 'block' }}>{track.skillName}</strong>
                <span style={{ fontSize: 11.5, color: '#94A3B8' }}>{track.summary}</span>
              </div>

              <div
                style={{
                  padding: '8px 10px',
                  borderRadius: 8,
                  background: 'rgba(2, 6, 23, 0.45)',
                  border: '1px solid rgba(148, 163, 184, 0.12)',
                  fontSize: 11.5,
                  color: '#CBD5E1',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 3,
                }}
              >
                <div>
                  <strong>Evidências:</strong>{' '}
                  {est
                    ? `${est.questions_answered} respondidas • ${est.independent_correct} sem dica • ${est.hints_used} dicas`
                    : 'Nenhuma sessão registrada ainda'}
                </div>
                <div>
                  <strong>Confiança da estimativa:</strong>{' '}
                  <span style={{ color: confMeta.color, fontWeight: 700 }}>{confMeta.label}</span>
                </div>
                <div>
                  <strong>Necessidade de revisão:</strong>{' '}
                  {needsReview ? (
                    <span style={{ color: '#FCA5A5', fontWeight: 700 }}>
                      Revisão recomendada — encaminhado ao professor
                    </span>
                  ) : est ? (
                    <span style={{ color: '#A7F3D0' }}>
                      {est.estimated_level === 'DOMINADO' ? 'Revisão periódica sugerida' : 'Consolidação recomendada'}
                    </span>
                  ) : (
                    <span style={{ color: '#94A3B8' }}>Aguardando primeira sessão</span>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 6, marginTop: 'auto' }}>
                <button
                  type="button"
                  onClick={() => handleStartSession(track.skillCode)}
                  style={{
                    flex: 1,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    padding: '7px 10px',
                    borderRadius: 7,
                    border: '1px solid rgba(139, 92, 246, 0.5)',
                    background: 'rgba(139, 92, 246, 0.22)',
                    color: '#F8FAFC',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  <Play size={13} />
                  <span>{est ? 'Nova Sessão (6 itens)' : 'Iniciar Sessão (6 itens)'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSkillCode(track.skillCode);
                    setSubView('drafts');
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 5,
                    padding: '7px 10px',
                    borderRadius: 7,
                    border: '1px solid rgba(148, 163, 184, 0.28)',
                    background: 'rgba(15, 23, 42, 0.85)',
                    color: '#CBD5E1',
                    fontSize: 11.5,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <Layers size={13} />
                  <span>Revisão</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Alternador entre Sessão Prática e Rascunhos Candidatos de Revisão */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            type="button"
            onClick={() => setSubView('practice')}
            style={{
              padding: '6px 12px',
              borderRadius: 7,
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              border: subView === 'practice' ? '1px solid #8B5CF6' : '1px solid rgba(148, 163, 184, 0.25)',
              background: subView === 'practice' ? 'rgba(139, 92, 246, 0.22)' : 'rgba(15, 23, 42, 0.7)',
              color: subView === 'practice' ? '#E9D5FF' : '#94A3B8',
            }}
          >
            Sessão Controlada • {selectedTrack.skillName}
          </button>
          <button
            type="button"
            onClick={() => setSubView('drafts')}
            style={{
              padding: '6px 12px',
              borderRadius: 7,
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              border: subView === 'drafts' ? '1px solid #38BDF8' : '1px solid rgba(148, 163, 184, 0.25)',
              background: subView === 'drafts' ? 'rgba(14, 165, 233, 0.2)' : 'rgba(15, 23, 42, 0.7)',
              color: subView === 'drafts' ? '#BAE6FD' : '#94A3B8',
            }}
          >
            Rascunhos Candidatos: Flashcards & Quiz ({selectedTrack.skillName})
          </button>
        </div>

        {selectedEstimate && (
          <span style={{ fontSize: 11.5, color: '#94A3B8' }}>
            Histórico acumulado nesta habilidade: {selectedEstimate.questions_answered} itens • Confiança{' '}
            <strong style={{ color: formatConfidenceLabel(selectedEstimate.confidence_label).color }}>
              {formatConfidenceLabel(selectedEstimate.confidence_label).label}
            </strong>
          </span>
        )}
      </div>

      {/* Sub-visão 1: Sessão Limitada de Treino */}
      {subView === 'practice' && (
        <div
          style={{
            padding: 16,
            borderRadius: 12,
            background: 'rgba(15, 23, 42, 0.78)',
            border: '1px solid rgba(148, 163, 184, 0.2)',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          {sessionState === 'IDLE' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <BookOpen size={16} color="#A78BFA" />
                <strong style={{ fontSize: 14, color: '#F8FAFC' }}>
                  Pronto para praticar: {selectedTrack.skillName} ({selectedTrack.bnccCode})
                </strong>
              </div>
              <p style={{ margin: 0, fontSize: 12.5, color: '#CBD5E1', lineHeight: 1.45 }}>
                Esta sessão contém <strong>{sessionQuestions.length} questões revisadas</strong> (máximo permitido por
                sessão: {MAX_SESSION_QUESTIONS} nesta trilha, teto de 8). Caso precise, use o botão{' '}
                <strong>Pedir Dica Pedagógica</strong> — ele ajuda no raciocínio e é contabilizado separadamente dos
                acertos independentes.
              </p>
              <div>
                <button
                  type="button"
                  onClick={() => handleStartSession(selectedTrack.skillCode)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '9px 16px',
                    borderRadius: 8,
                    border: '1px solid #8B5CF6',
                    background: 'rgba(139, 92, 246, 0.28)',
                    color: '#FFFFFF',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  <Play size={14} />
                  <span>Iniciar Sessão de {sessionQuestions.length} Questões</span>
                </button>
              </div>
            </div>
          )}

          {sessionState === 'ACTIVE' && currentQuestion && (
            <>
              {/* Barra de Progresso e Contadores Transparentes */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 8,
                  paddingBottom: 10,
                  borderBottom: '1px solid rgba(148, 163, 184, 0.14)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span
                    style={{
                      fontFamily: 'monospace',
                      fontSize: 11.5,
                      fontWeight: 800,
                      padding: '3px 8px',
                      borderRadius: 6,
                      background: 'rgba(139, 92, 246, 0.2)',
                      color: '#DDD6FE',
                    }}
                  >
                    QUESTÃO {currentIndex + 1} DE {sessionQuestions.length}
                  </span>
                  <span style={{ fontSize: 12, color: '#34D399', fontWeight: 600 }}>
                    Sem dica: {independentCorrect}
                  </span>
                  <span style={{ fontSize: 12, color: '#38BDF8', fontWeight: 600 }}>
                    Com dica: {assistedCorrect}
                  </span>
                  <span style={{ fontSize: 12, color: '#FBBF24', fontWeight: 600 }}>
                    Dicas usadas: {hintsUsed}
                  </span>
                  <span
                    style={{
                      fontSize: 12,
                      color: consecutiveErrors >= 2 ? '#FCA5A5' : '#94A3B8',
                      fontWeight: 600,
                    }}
                  >
                    Erros seguidos: {consecutiveErrors}/{CONSECUTIVE_ERROR_PAUSE_LIMIT}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleManualPause}
                  disabled={savingSession}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    padding: '5px 10px',
                    borderRadius: 6,
                    border: '1px solid rgba(148, 163, 184, 0.3)',
                    background: 'transparent',
                    color: '#CBD5E1',
                    fontSize: 11.5,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <PauseCircle size={13} />
                  <span>{questionsAnswered > 0 ? 'Pausar e Salvar' : 'Sair da Sessão'}</span>
                </button>
              </div>

              {/* Enunciado */}
              <div style={{ fontSize: 15, fontWeight: 700, color: '#F8FAFC', lineHeight: 1.45 }}>
                {currentQuestion.prompt}
              </div>

              {/* Dica Pedagógica Separada */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {!hintRevealedForCurrent ? (
                  <div>
                    <button
                      type="button"
                      disabled={Boolean(currentEvaluated)}
                      onClick={handleRevealHint}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '6px 12px',
                        borderRadius: 7,
                        border: '1px solid rgba(245, 158, 11, 0.45)',
                        background: 'rgba(245, 158, 11, 0.14)',
                        color: '#FDE68A',
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: currentEvaluated ? 'not-allowed' : 'pointer',
                        opacity: currentEvaluated ? 0.5 : 1,
                      }}
                    >
                      <HelpCircle size={14} />
                      <span>Pedir Dica Pedagógica (registra uso de dica)</span>
                    </button>
                  </div>
                ) : (
                  <div
                    style={{
                      padding: '10px 12px',
                      borderRadius: 8,
                      background: 'rgba(245, 158, 11, 0.12)',
                      border: '1px solid rgba(245, 158, 11, 0.38)',
                      color: '#FEF3C7',
                      fontSize: 12.5,
                      lineHeight: 1.45,
                    }}
                  >
                    <strong>Dica pedagógica (registrada separadamente):</strong> {currentQuestion.hint}
                  </div>
                )}
              </div>

              {/* Alternativas */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 8 }}>
                {currentQuestion.options.map((opt, idx) => {
                  const isPicked = selectedOption === idx;
                  const isRightOption = idx === currentQuestion.correctIndex;
                  let borderColor = isPicked ? '#8B5CF6' : 'rgba(148, 163, 184, 0.25)';
                  let bg = isPicked ? 'rgba(139, 92, 246, 0.22)' : 'rgba(2, 6, 23, 0.5)';

                  if (currentEvaluated) {
                    if (isRightOption) {
                      borderColor = '#10B981';
                      bg = 'rgba(16, 185, 129, 0.18)';
                    } else if (isPicked && !currentEvaluated.isCorrect) {
                      borderColor = '#EF4444';
                      bg = 'rgba(239, 68, 68, 0.18)';
                    }
                  }

                  return (
                    <button
                      key={idx}
                      type="button"
                      disabled={Boolean(currentEvaluated)}
                      onClick={() => setSelectedOption(idx)}
                      style={{
                        textAlign: 'left',
                        padding: '10px 12px',
                        borderRadius: 8,
                        border: `1px solid ${borderColor}`,
                        background: bg,
                        color: '#F8FAFC',
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: currentEvaluated ? 'default' : 'pointer',
                      }}
                    >
                      <span style={{ color: '#94A3B8', marginRight: 8 }}>{String.fromCharCode(65 + idx)})</span>
                      {opt}
                    </button>
                  );
                })}
              </div>

              {/* Feedback e Ação */}
              {currentEvaluated ? (
                <div
                  style={{
                    padding: '10px 12px',
                    borderRadius: 8,
                    background: currentEvaluated.isCorrect
                      ? 'rgba(16, 185, 129, 0.12)'
                      : 'rgba(239, 68, 68, 0.12)',
                    border: currentEvaluated.isCorrect
                      ? '1px solid rgba(16, 185, 129, 0.35)'
                      : '1px solid rgba(239, 68, 68, 0.35)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {currentEvaluated.isCorrect ? (
                      <CheckCircle2 size={16} color="#34D399" />
                    ) : (
                      <AlertTriangle size={16} color="#F87171" />
                    )}
                    <strong style={{ fontSize: 13, color: '#F8FAFC' }}>
                      {currentEvaluated.wasIndependent
                        ? 'Acerto independente (sem uso de dica)!'
                        : currentEvaluated.isCorrect
                        ? 'Resposta correta com apoio de dica.'
                        : 'Resposta incorreta — vamos revisar o raciocínio.'}
                    </strong>
                  </div>
                  <p style={{ margin: 0, fontSize: 12.5, color: '#E2E8F0' }}>{currentQuestion.explanation}</p>
                  <div>
                    <button
                      type="button"
                      onClick={handleNextOrFinish}
                      disabled={savingSession}
                      style={{
                        padding: '8px 14px',
                        borderRadius: 7,
                        border: '1px solid #38BDF8',
                        background: 'rgba(14, 165, 233, 0.22)',
                        color: '#FFFFFF',
                        fontSize: 12.5,
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      {currentIndex + 1 >= sessionQuestions.length ? 'Concluir Sessão e Salvar Estimativa' : 'Próxima Questão'}
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <button
                    type="button"
                    disabled={selectedOption === null}
                    onClick={handleSubmitAnswer}
                    style={{
                      padding: '8px 16px',
                      borderRadius: 8,
                      border: '1px solid #8B5CF6',
                      background: selectedOption === null ? 'rgba(148, 163, 184, 0.15)' : 'rgba(139, 92, 246, 0.3)',
                      color: '#FFFFFF',
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: selectedOption === null ? 'not-allowed' : 'pointer',
                      opacity: selectedOption === null ? 0.6 : 1,
                    }}
                  >
                    Confirmar Resposta
                  </button>
                </div>
              )}
            </>
          )}

          {sessionState === 'PAUSED_FOR_TEACHER' && (
            <div
              style={{
                padding: 14,
                borderRadius: 10,
                background: 'rgba(245, 158, 11, 0.12)',
                border: '1px solid rgba(245, 158, 11, 0.42)',
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}
              data-testid="practice-paused-teacher-referral"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <UserCheck size={18} color="#FBBF24" />
                <strong style={{ fontSize: 14.5, color: '#FEF3C7' }}>
                  Pausa Automática — Encaminhamento ao Professor
                </strong>
              </div>
              <p style={{ margin: 0, fontSize: 12.5, color: '#FDE68A', lineHeight: 1.5 }}>
                Detectamos 3 erros consecutivos nesta sequência. Para evitar desgaste e reforçar a base antes de
                avançar, a sessão foi pausada automaticamente e sinalizada para acompanhamento do seu professor
                (<strong>Necessidade de revisão docente</strong>).
              </p>
              <div style={{ fontSize: 12, color: '#E2E8F0' }}>
                Resumo registrado: {questionsAnswered} questão(ões) respondida(s) • {independentCorrect} acerto(s)
                independente(s) • {assistedCorrect} com dica • {hintsUsed} dica(s) utilizada(s).
              </div>
              {saveError && (
                <div style={{ color: '#FCA5A5', fontSize: 12 }}>{saveError}</div>
              )}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setSubView('drafts')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '7px 12px',
                    borderRadius: 7,
                    border: '1px solid #38BDF8',
                    background: 'rgba(14, 165, 233, 0.2)',
                    color: '#E0F2FE',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  <Layers size={13} />
                  <span>Abrir Flashcards de Revisão (Rascunho)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSessionState('IDLE')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '7px 12px',
                    borderRadius: 7,
                    border: '1px solid rgba(148, 163, 184, 0.35)',
                    background: 'transparent',
                    color: '#E2E8F0',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <RotateCcw size={13} />
                  <span>Escolher Outra Habilidade</span>
                </button>
              </div>
            </div>
          )}

          {sessionState === 'COMPLETED' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }} data-testid="practice-session-summary">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircle2 size={18} color="#34D399" />
                <strong style={{ fontSize: 14.5, color: '#F8FAFC' }}>
                  Sessão Registrada — {selectedTrack.skillName}
                </strong>
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                  gap: 8,
                }}
              >
                <div style={{ padding: 10, borderRadius: 8, background: 'rgba(2,6,23,0.5)' }}>
                  <div style={{ fontSize: 11, color: '#94A3B8' }}>Questões Respondidas</div>
                  <strong style={{ fontSize: 16, color: '#F8FAFC' }}>{questionsAnswered} / {sessionQuestions.length}</strong>
                </div>
                <div style={{ padding: 10, borderRadius: 8, background: 'rgba(2,6,23,0.5)' }}>
                  <div style={{ fontSize: 11, color: '#94A3B8' }}>Acertos Independentes (sem dica)</div>
                  <strong style={{ fontSize: 16, color: '#34D399' }}>{independentCorrect}</strong>
                </div>
                <div style={{ padding: 10, borderRadius: 8, background: 'rgba(2,6,23,0.5)' }}>
                  <div style={{ fontSize: 11, color: '#94A3B8' }}>Acertos com Dica / Dicas Usadas</div>
                  <strong style={{ fontSize: 16, color: '#FBBF24' }}>{assistedCorrect} / {hintsUsed}</strong>
                </div>
                <div style={{ padding: 10, borderRadius: 8, background: 'rgba(2,6,23,0.5)' }}>
                  <div style={{ fontSize: 11, color: '#94A3B8' }}>Nível Estimado / Confiança</div>
                  <strong style={{ fontSize: 13.5, color: '#38BDF8' }}>
                    {lastPersistedResult
                      ? `${formatEstimatedLevel(lastPersistedResult.estimatedLevel).label} (${formatConfidenceLabel(lastPersistedResult.confidenceLabel).label})`
                      : savingSession
                      ? 'Calculando...'
                      : 'Registrado'}
                  </strong>
                </div>
              </div>

              {lastPersistedResult?.needsTeacherReview && (
                <div
                  style={{
                    padding: '8px 12px',
                    borderRadius: 8,
                    background: 'rgba(245, 158, 11, 0.14)',
                    border: '1px solid rgba(245, 158, 11, 0.35)',
                    color: '#FDE68A',
                    fontSize: 12,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <ShieldAlert size={15} />
                  <span>
                    Necessidade de revisão sinalizada ao professor com base nas evidências desta sessão.
                  </span>
                </div>
              )}

              {saveError && <div style={{ color: '#FCA5A5', fontSize: 12 }}>{saveError}</div>}

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => handleStartSession(selectedTrack.skillCode)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '7px 12px',
                    borderRadius: 7,
                    border: '1px solid #8B5CF6',
                    background: 'rgba(139, 92, 246, 0.25)',
                    color: '#FFFFFF',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  <RefreshCw size={13} />
                  <span>Fazer Nova Sessão Limitada</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSubView('drafts')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '7px 12px',
                    borderRadius: 7,
                    border: '1px solid rgba(56, 189, 248, 0.4)',
                    background: 'rgba(14, 165, 233, 0.16)',
                    color: '#BAE6FD',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  <Layers size={13} />
                  <span>Ver Flashcards & Quiz de Revisão</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Sub-visão 2: Quizzes e Flashcards Gerados como Rascunho Candidato de Revisão */}
      {subView === 'drafts' && (
        <div
          style={{
            padding: 16,
            borderRadius: 12,
            background: 'rgba(15, 23, 42, 0.78)',
            border: '1px solid rgba(56, 189, 248, 0.28)',
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
          }}
          data-testid="student-revision-drafts"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Sparkles size={16} color="#38BDF8" />
              <strong style={{ fontSize: 14, color: '#F8FAFC' }}>
                Quizzes e Flashcards — Rascunho Candidato de Revisão ({selectedTrack.skillName})
              </strong>
            </div>
            <span
              style={{
                fontSize: 10.5,
                fontWeight: 800,
                padding: '3px 8px',
                borderRadius: 6,
                background: 'rgba(245, 158, 11, 0.16)',
                border: '1px solid rgba(245, 158, 11, 0.4)',
                color: '#FCD34D',
              }}
            >
              RASCUNHO CANDIDATO • MATERIAL DE TREINO (NUNCA NOTA OFICIAL)
            </span>
          </div>

          <p style={{ margin: 0, fontSize: 12, color: '#CBD5E1' }}>
            {missedQuestionIds.length > 0
              ? 'Cartões e checagem rápida priorizando os pontos em que houve erro na sessão recente.'
              : 'Cartões e checagem rápida gerados como apoio de revisão da habilidade selecionada.'}{' '}
            O uso deste material serve exclusivamente para estudo pessoal e não altera notas do boletim.
          </p>

          {/* Flashcards de Revisão */}
          <div>
            <h4 style={{ margin: '0 0 8px 0', fontSize: 12.5, color: '#94A3B8', textTransform: 'uppercase' }}>
              Flashcards Candidatos de Revisão (clique para virar)
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 10 }}>
              {candidateReviewItems.map((item) => {
                const flipped = Boolean(flippedCardIds[item.id]);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() =>
                      setFlippedCardIds((prev) => ({ ...prev, [item.id]: !prev[item.id] }))
                    }
                    style={{
                      textAlign: 'left',
                      padding: 12,
                      borderRadius: 9,
                      border: flipped
                        ? '1px solid rgba(16, 185, 129, 0.45)'
                        : '1px solid rgba(56, 189, 248, 0.3)',
                      background: flipped ? 'rgba(16, 185, 129, 0.1)' : 'rgba(2, 6, 23, 0.55)',
                      color: '#F8FAFC',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 6,
                      minHeight: 112,
                    }}
                  >
                    <span style={{ fontSize: 10, fontWeight: 700, color: flipped ? '#34D399' : '#38BDF8' }}>
                      {flipped ? 'VERSO • PASSO A PASSO (RASCUNHO)' : 'FRENTE • CONCEITO DE REVISÃO'}
                    </span>
                    <span style={{ fontSize: 12.5, lineHeight: 1.4, color: '#E2E8F0' }}>
                      {flipped ? item.flashcardBack : item.flashcardFront}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quiz Candidato de Autoavaliação */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <h4 style={{ margin: 0, fontSize: 12.5, color: '#94A3B8', textTransform: 'uppercase' }}>
              Quiz Candidato de Revisão (autoavaliação sem valor de nota oficial)
            </h4>
            {candidateReviewItems.slice(0, 3).map((item, idx) => {
              const chosen = draftQuizAnswers[item.id];
              const isAnswered = chosen !== undefined;
              const isCorrect = chosen === item.correctIndex;
              return (
                <div
                  key={`quiz-${item.id}`}
                  style={{
                    padding: 12,
                    borderRadius: 8,
                    background: 'rgba(2, 6, 23, 0.5)',
                    border: '1px solid rgba(148, 163, 184, 0.16)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                  }}
                >
                  <strong style={{ fontSize: 12.5, color: '#F8FAFC' }}>
                    {idx + 1}. {item.prompt}
                  </strong>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {item.options.map((opt, optIdx) => (
                      <button
                        key={optIdx}
                        type="button"
                        onClick={() =>
                          setDraftQuizAnswers((prev) => ({ ...prev, [item.id]: optIdx }))
                        }
                        style={{
                          padding: '5px 10px',
                          borderRadius: 6,
                          fontSize: 12,
                          cursor: 'pointer',
                          border:
                            chosen === optIdx
                              ? optIdx === item.correctIndex
                                ? '1px solid #10B981'
                                : '1px solid #EF4444'
                              : '1px solid rgba(148, 163, 184, 0.25)',
                          background:
                            chosen === optIdx
                              ? optIdx === item.correctIndex
                                ? 'rgba(16, 185, 129, 0.2)'
                                : 'rgba(239, 68, 68, 0.2)'
                              : 'rgba(15, 23, 42, 0.7)',
                          color: '#F8FAFC',
                        }}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                  {isAnswered && (
                    <span style={{ fontSize: 11.5, color: isCorrect ? '#6EE7B7' : '#FCA5A5' }}>
                      {isCorrect ? '✓ Conferido! ' : '✕ Revise a dica: '}
                      {item.explanation}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDomainTrails;
