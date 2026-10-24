import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles, BookOpen, CheckCircle2, Eye, Sliders, Flame, ArrowLeft,
  FileText, Presentation, Brain, ShieldAlert, Play, Pause, RotateCcw,
  Download, Send, Layers, Award, Users, Zap, CheckSquare, Search,
  Compass, Atom, MessageSquare, Camera, Wand2, Star, Check, Copy,
  BarChart3, TrendingUp, HelpCircle, AlertTriangle, Printer, BookmarkCheck
} from 'lucide-react';
import { STUDENTS } from '../../database/studentsData';
import { HISTORICAL_CHARACTERS, generateCharacterResponse, HistoricalCharacter, CharacterArea } from '../utils/historicalPersonas';
import { generatePedagogicalContent } from '../utils/curriculumGenerator';
import { PhetKumonMasteryLab } from '../components/PhetKumonMasteryLab';
import { NativePhETSimulationLab } from '../components/NativePhETSimulationLab';
import { MultimodalPedagogicalStudio } from '../components/MultimodalPedagogicalStudio';
import { SchoolGrowthAgentSuite } from '../components/SchoolGrowthAgentSuite';
import { ExamPaperFoundry } from '../components/ExamPaperFoundry';
import './TeacherAIStudio.css';

interface TeacherAIStudioProps {
  onBack?: () => void;
}

type StudioStation =
  | 'aquila-studio'
  | 'aquila-feedback'
  | 'aquila-inspect'
  | 'aquila-leveler'
  | 'aquila-stem-lab'
  | 'aquila-multimodal-studio'
  | 'aquila-growth-agents'
  | 'aquila-exam-foundry'
  | 'aquila-copilot'
  | 'aquila-snapshot';

type AquilaToolId =
  | 'bncc-lesson'
  | 'slide-deck'
  | 'pei-inclusive'
  | 'paper-exam-ocr'
  | 'enem-saeb-gen'
  | 'creative-study';

type FeedbackMode = 'glow-grow' | 'rubric' | 'next-steps' | 'targeted';
type ReadingLevelId = 'ef2-6ano' | 'em-enem' | 'med-ita' | 'neuro-tdah';

interface StudentWritingSubmission {
  id: string;
  studentName: string;
  className: string;
  title: string;
  topic: string;
  authenticityScore: number;
  activeMinutes: number;
  organicEdits: number;
  pasteEventsCount: number;
  pastedWordsCount: number;
  finalText: string;
  timelineSteps: Array<{
    step: number;
    timestamp: string;
    type: 'ORGANIC_TYPING' | 'SELF_REVISION' | 'COPY_PASTE_ALERT';
    label: string;
    snapshot: string;
  }>;
  feedback: {
    glow: string[];
    grow: string[];
    socraticQuestion: string;
    rubric: Array<{ criterion: string; level: number; max: number; comment: string }>;
    nextSteps: string[];
    targeted: Array<{ quote: string; suggestion: string }>;
  };
}

const SAMPLE_SUBMISSIONS: StudentWritingSubmission[] = [
  {
    id: 'sub-1',
    studentName: STUDENTS[0]?.name || 'ANA CLARA FERREIRA',
    className: STUDENTS[0]?.classRoom || '3 SERIE A',
    title: 'Redação ENEM: Desafios da Inteligência Artificial na Saúde Pública Brasileira',
    topic: 'Redação Dissertativo-Argumentativa (Padrão ENEM 1000 pts)',
    authenticityScore: 96,
    activeMinutes: 44,
    organicEdits: 142,
    pasteEventsCount: 0,
    pastedWordsCount: 0,
    finalText:
      'Na obra "Admirável Mundo Novo", Aldous Huxley retrata uma sociedade condicionada pela tecnologia sem reflexão ética. Fora da ficção, o Brasil contemporâneo enfrenta o desafio de integrar a Inteligência Artificial ao Sistema Único de Saúde (SUS) garantindo equidade e proteção de dados (LGPD). Nesse sentido, tanto a desigualdade de infraestrutura hospitalar quanto a carência de letramento digital dos profissionais exigem intervenção estatal imediata.',
    timelineSteps: [
      {
        step: 1,
        timestamp: '00:04:12',
        type: 'ORGANIC_TYPING',
        label: 'Abertura com repertório literário (Aldous Huxley)',
        snapshot: 'Na obra "Admirável Mundo Novo", Aldous Huxley retrata uma sociedade condicionada pela tecnologia...',
      },
      {
        step: 2,
        timestamp: '00:16:38',
        type: 'SELF_REVISION',
        label: 'Reescrita da tese e inclusão da sigla SUS + LGPD',
        snapshot: 'Na obra "Admirável Mundo Novo", Aldous Huxley retrata uma sociedade condicionada pela tecnologia sem reflexão ética. Fora da ficção, o Brasil contemporâneo enfrenta o desafio de integrar a Inteligência Artificial ao Sistema Único de Saúde (SUS) garantindo equidade e proteção de dados (LGPD).',
      },
      {
        step: 3,
        timestamp: '00:44:05',
        type: 'ORGANIC_TYPING',
        label: 'Fechamento do projeto de texto com conectivo interparágrafo',
        snapshot: 'Na obra "Admirável Mundo Novo", Aldous Huxley retrata uma sociedade condicionada pela tecnologia sem reflexão ética. Fora da ficção, o Brasil contemporâneo enfrenta o desafio de integrar a Inteligência Artificial ao Sistema Único de Saúde (SUS) garantindo equidade e proteção de dados (LGPD). Nesse sentido, tanto a desigualdade de infraestrutura hospitalar quanto a carência de letramento digital dos profissionais exigem intervenção estatal imediata.',
      },
    ],
    feedback: {
      glow: [
        'Repertório sociocultural legítimo e produtivo ("Admirável Mundo Novo" de Aldous Huxley) conectado diretamente ao tema (Competência II: 200/200).',
        'Projeto de texto cristalino com apresentação explícita dos dois argumentos (infraestrutura hospitalar e letramento digital).',
      ],
      grow: [
        'No desenvolvimento do D1, aprofunde um dado estatístico do IBGE ou DataSUS para comprovar a assimetria regional de conectividade.',
        'Na proposta de intervenção (C5), lembre-se de detalhar o Meio/Modo por meio de uma oração explicativa.',
      ],
      socraticQuestion:
        'Como você poderia conectar a referência inicial de Aldous Huxley ao fechamento da sua conclusão para criar um texto ciclicamente coeso?',
      rubric: [
        { criterion: 'C1 — Domínio da Norma Padrão', level: 4, max: 4, comment: 'Sintaxe excelente e ausência de desvios gramaticais (200 pts).' },
        { criterion: 'C2 — Compreensão do Tema & Repertório', level: 4, max: 4, comment: 'Repertório literário produtivo e articulado ao SUS (200 pts).' },
        { criterion: 'C3 — Projeto de Texto & Argumentação', level: 3, max: 4, comment: 'Tese dupla bem definida; pode expandir a exemplificação concreta (160 pts).' },
        { criterion: 'C4 — Coesão & Operadores Argumentativos', level: 4, max: 4, comment: 'Uso preciso de "Fora da ficção" e "Nesse sentido" (200 pts).' },
        { criterion: 'C5 — Proposta de Intervenção (5 Elementos)', level: 4, max: 4, comment: 'Agente (Ministério da Saúde), Ação, Meio, Efeito e Detalhamento presentes (200 pts).' },
      ],
      nextSteps: [
        '1. Insira no 2º parágrafo um dado concreto sobre prontuários eletrônicos no SUS (DataSUS).',
        '2. Retome a distopia de Huxley na última frase da conclusão para fechar o ciclo argumentativo.',
        '3. Verifique a variação lexical da palavra "tecnologia" usando sinônimos como "algoritmos diagnósticos" ou "ferramentas computacionais".',
      ],
      targeted: [
        {
          quote: '"tanto a desigualdade de infraestrutura hospitalar quanto a carência de letramento digital"',
          suggestion: 'Excelente paralelismo sintático ("tanto... quanto..."). Mantenha essa mesma ordem nos parágrafos D1 e D2.',
        },
      ],
    },
  },
  {
    id: 'sub-2',
    studentName: STUDENTS[15]?.name || 'PEDRO HENRIQUE ALVES',
    className: STUDENTS[15]?.classRoom || '2 SERIE A',
    title: 'Relatório de Biologia: Termodinâmica Ecológica e Ciclo do Carbono no Cerrado',
    topic: 'Questão Discursiva BNCC EM13CNT101',
    authenticityScore: 61,
    activeMinutes: 9,
    organicEdits: 14,
    pasteEventsCount: 2,
    pastedWordsCount: 68,
    finalText:
      'O Cerrado goiano atua como uma verdadeira "floresta invertida", pois suas raízes profundas armazenam toneladas de carbono subterrâneo. [BLOCO COLADO EXTERNO: A fotossíntese C3 e C4 opera mediante carboxilação diferencial da RuBisCO sob estresse hídrico sazonal, modulando o fluxo líquido de CO2 ecossistêmico em savanas neotropicais.] Portanto, as queimadas liberam esse estoque rapidamente.',
    timelineSteps: [
      {
        step: 1,
        timestamp: '00:02:10',
        type: 'ORGANIC_TYPING',
        label: 'Introdução autoral com conceito de "floresta invertida"',
        snapshot: 'O Cerrado goiano atua como uma verdadeira "floresta invertida", pois suas raízes profundas armazenam toneladas de carbono subterrâneo.',
      },
      {
        step: 2,
        timestamp: '00:05:40',
        type: 'COPY_PASTE_ALERT',
        label: '⚠️ ALERTA FORENSE DE AUTORIA: Colagem instantânea de 31 palavras em 0,2s (vocabulário acadêmico exógeno)',
        snapshot: 'O Cerrado goiano atua como uma verdadeira "floresta invertida", pois suas raízes profundas armazenam toneladas de carbono subterrâneo. [BLOCO COLADO EXTERNO: A fotossíntese C3 e C4 opera mediante carboxilação diferencial da RuBisCO sob estresse hídrico sazonal, modulando o fluxo líquido de CO2 ecossistêmico em savanas neotropicais.]',
      },
      {
        step: 3,
        timestamp: '00:08:55',
        type: 'ORGANIC_TYPING',
        label: 'Conclusão curta digitada manualmente',
        snapshot: 'O Cerrado goiano atua como uma verdadeira "floresta invertida", pois suas raízes profundas armazenam toneladas de carbono subterrâneo. [BLOCO COLADO EXTERNO: A fotossíntese C3 e C4 opera mediante carboxilação diferencial da RuBisCO sob estresse hídrico sazonal, modulando o fluxo líquido de CO2 ecossistêmico em savanas neotropicais.] Portanto, as queimadas liberam esse estoque rapidamente.',
      },
    ],
    feedback: {
      glow: [
        'Sua explicação inicial usando a metáfora da "floresta invertida" para as raízes profundas do Cerrado é autêntica e demonstra compreensão real da aula!',
      ],
      grow: [
        'O trecho intermediário sobre "carboxilação diferencial da RuBisCO" foi colado sem conexão com a sua própria voz e sem explicar como isso afeta as raízes profundas.',
        'Faltou relacionar o impacto das queimadas com a perda de biodiversidade e o regime de chuvas.',
      ],
      socraticQuestion:
        'Com suas próprias palavras, por que ter raízes tão profundas ajuda uma árvore do Cerrado a sobreviver aos meses de seca em Goiás?',
      rubric: [
        { criterion: 'Autoria & Voz Própria', level: 2, max: 4, comment: 'Detectada colagem externa de 68 palavras sem paráfrase.' },
        { criterion: 'Domínio Conceitual (Ciclo do Carbono)', level: 3, max: 4, comment: 'Compreende o estoque subterrâneo, mas precisa explicar a liberação.' },
        { criterion: 'Contextualização Regional (Cerrado)', level: 4, max: 4, comment: 'Ótima referência ao bioma local.' },
      ],
      nextSteps: [
        '1. Reescreva a segunda frase com suas próprias palavras explicando a diferença entre época de chuva e época de seca no Cerrado.',
        '2. Cite um exemplo de árvore típica do Cerrado (ex: Pequizeiro ou Ipê) e sua adaptação ao fogo (suber espesso).',
      ],
      targeted: [
        {
          quote: '"A fotossíntese C3 e C4 opera mediante carboxilação diferencial da RuBisCO..."',
          suggestion: '⚠️ Trecho colado externamente. Substitua por uma explicação autoral simples sobre como a planta absorve CO2.',
        },
      ],
    },
  },
];

export const TeacherAIStudio: React.FC<TeacherAIStudioProps> = ({ onBack }) => {
  const [activeStation, setActiveStation] = useState<StudioStation>('aquila-studio');
  const [stemSubTab, setStemSubTab] = useState<'official-phet' | 'native-rea'>('official-phet');

  // Estação 1: Gerador Pedagógico Áquila
  const [selectedTool, setSelectedTool] = useState<AquilaToolId>('bncc-lesson');
  const [subject, setSubject] = useState('Física & Ciências da Natureza');
  const [grade, setGrade] = useState('2ª Série A (Ensino Médio)');
  const [topic, setTopic] = useState('calor');
  const [inclusiveProfile, setInclusiveProfile] = useState<'TDAH' | 'TEA' | 'DISLEXIA' | 'ALTAS_HABILIDADES'>('TDAH');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedNonce, setGeneratedNonce] = useState(0);

  // Simulação de OCR de Prova em Papel
  const [ocrStep, setOcrStep] = useState<'idle' | 'scanning' | 'graded'>('idle');
  const [ocrScore, setOcrScore] = useState<number>(8);

  // Estação 2 & 3: Feedback & Forense de Escrita
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string>('sub-1');
  const [feedbackMode, setFeedbackMode] = useState<FeedbackMode>('glow-grow');
  const [replayStepIndex, setReplayStepIndex] = useState<number>(2);
  const [isPlayingReplay, setIsPlayingReplay] = useState<boolean>(false);

  // Estação 4: Nivelador Cognitivo DOK 1-4
  const [readingLevel, setReadingLevel] = useState<ReadingLevelId>('em-enem');

  // Estação 5: Laboratório STEM & Diálogo com Cientistas (75+ Personagens em Domínio Público)
  const [projectileAngle, setProjectileAngle] = useState<number>(45);
  const [projectileVelocity, setProjectileVelocity] = useState<number>(30);
  const [characterFilter, setCharacterFilter] = useState<'all' | CharacterArea>('all');
  const [characterSearch, setCharacterSearch] = useState<string>('');
  const [selectedCharacterId, setSelectedCharacterId] = useState<string>('MARIE_CURIE');
  const [isCharacterTyping, setIsCharacterTyping] = useState<boolean>(false);
  const [boostChatHistory, setBoostChatHistory] = useState<Array<{ sender: 'teacher' | 'character'; name: string; text: string }>>([
    {
      sender: 'character',
      name: 'Marie Curie',
      text: 'Bonjour! Sou Marie Skłodowska-Curie. No laboratório em Paris, provamos que a radioatividade provém do interior do próprio átomo. Como posso ajudar seus estudantes a desvendar o núcleo atômico hoje?',
    },
  ]);
  const [boostInput, setBoostInput] = useState('');

  // Estação 6: Áquila Co-Pilot Docente
  const [selectedCopilotTool, setSelectedCopilotTool] = useState<'rubric-generator' | 'exit-ticket' | 'report-card-comments'>('rubric-generator');
  const [rubricProjectType, setRubricProjectType] = useState<'enem-essay' | 'steam-lab' | 'seminar' | 'maker-project'>('enem-essay');
  const [exitTicketConfidence, setExitTicketConfidence] = useState<number>(4);
  const [exitTicketSelectedOpt, setExitTicketSelectedOpt] = useState<number | null>(1);
  const [selectedStudentForComment, setSelectedStudentForComment] = useState<string>(STUDENTS[0]?.name || 'ANA CLARA FERREIRA');
  const [commentTone, setCommentTone] = useState<'afetivo' | 'analitico' | 'metas' | 'pei'>('afetivo');
  const [toastNotification, setToastNotification] = useState<string | null>(null);

  // Estação 7: Raio-X da Turma & Diagnóstico BNCC
  const [selectedSnapshotClass, setSelectedSnapshotClass] = useState<string>('M-EM2A');
  const [interventionTriggered, setInterventionTriggered] = useState<boolean>(false);

  const showToast = (msg: string) => {
    setToastNotification(msg);
    setTimeout(() => setToastNotification(null), 3500);
  };

  // Personagem Selecionado
  const selectedCharacter = useMemo(
    () => HISTORICAL_CHARACTERS.find(c => c.id === selectedCharacterId) || HISTORICAL_CHARACTERS[0],
    [selectedCharacterId]
  );

  const filteredCharacters = useMemo(() => {
    return HISTORICAL_CHARACTERS.filter(c => {
      const matchArea = characterFilter === 'all' || c.area === characterFilter;
      const q = characterSearch.trim().toLowerCase();
      const matchSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.areaLabel.toLowerCase().includes(q) ||
        c.notableWork.toLowerCase().includes(q) ||
        c.keyTopics.some(t => t.toLowerCase().includes(q));
      return matchArea && matchSearch;
    });
  }, [characterFilter, characterSearch]);

  // Conteúdo Pedagógico Dinâmico e Rigoroso gerado com base no tópico real digitado
  const dynamicPedagogy = useMemo(
    () => generatePedagogicalContent(topic, subject, grade),
    [topic, subject, grade, generatedNonce]
  );

  const currentSubmission = useMemo(
    () => SAMPLE_SUBMISSIONS.find(s => s.id === selectedSubmissionId) || SAMPLE_SUBMISSIONS[0],
    [selectedSubmissionId]
  );

  // Timer do Player de Replay Forense de Escrita
  useEffect(() => {
    if (!isPlayingReplay) return;
    const timer = setInterval(() => {
      setReplayStepIndex(prev => {
        if (prev >= currentSubmission.timelineSteps.length - 1) {
          setIsPlayingReplay(false);
          return prev;
        }
        return prev + 1;
      });
    }, 1500);
    return () => clearInterval(timer);
  }, [isPlayingReplay, currentSubmission]);

  // Cálculo físico em tempo real do Lançamento Oblíquo
  const projectileMetrics = useMemo(() => {
    const g = 9.8;
    const rad = (projectileAngle * Math.PI) / 180;
    const v0 = projectileVelocity;
    const maxHeight = (Math.pow(v0 * Math.sin(rad), 2)) / (2 * g);
    const range = (Math.pow(v0, 2) * Math.sin(2 * rad)) / g;
    const flightTime = (2 * v0 * Math.sin(rad)) / g;
    return {
      maxHeight: maxHeight.toFixed(1),
      range: range.toFixed(1),
      flightTime: flightTime.toFixed(2),
    };
  }, [projectileAngle, projectileVelocity]);

  // Textos adaptados pelo Nivelador Cognitivo
  const leveledTextOutput = useMemo(() => {
    const map: Record<ReadingLevelId, { badge: string; flesch: string; text: string; glossary: string[] }> = {
      'ef2-6ano': {
        badge: 'Nível Fundamental II • Linguagem Acessível & Analogias Cotidianas',
        flesch: 'Legibilidade Flesch-PT: 84 (Muito Fácil)',
        text: `Ao estudarmos "${topic}", podemos pensar em situações simples do dia a dia: quando aquecemos água para o café ou quando usamos a energia de uma pilha. As leis da natureza mostram que a energia nunca desaparece do nada — ela sempre se transforma de uma forma para outra, permitindo que as máquinas funcionem e o mundo se mova!`,
        glossary: ['Energia: a capacidade de realizar trabalho ou provocar transformações.', 'Transformação: mudança de uma forma de energia em outra.'],
      },
      'em-enem': {
        badge: 'Nível Ensino Médio Regular • Padrão Oficial BNCC & ENEM',
        flesch: 'Legibilidade Flesch-PT: 64 (Padrão Ensino Médio)',
        text: `O estudo formal de "${topic}" envolve a quantificação rigorosa das grandezas físicas e químicas associadas aos sistemas em equilíbrio e fora do equilíbrio. Conforme as diretrizes da BNCC (${dynamicPedagogy.lessonPlan.bnccCode}), o estudante deve analisar as taxas de transferência, balanços de conservação e eficiência dos ciclos energéticos industriais.`,
        glossary: ['Estado Estacionário: condição em que as variáveis macroscópicas permanecem constantes.', 'Rendimento: razão entre a energia útil obtida e a energia total fornecida.'],
      },
      'med-ita': {
        badge: 'Nível Avançado • Vestibular Medicina / ITA / IME',
        flesch: 'Legibilidade Flesch-PT: 36 (Acadêmico Densificado)',
        text: `A formulação analítica de "${topic}" exige o tratamento diferencial das equações de estado e das condições de contorno. As irreversibilidades intrínsecas ao processo impõem geração líquida de entropia, reduzindo a exergia disponível para conversão em trabalho mecânico e exigindo a consideração de gradientes finitos de potencial termodinâmico.`,
        glossary: ['Exergia: fração máxima de energia utilizável em um reservatório térmico.', 'Irreversibilidade: dissipação irreversível decorrente de atrito viscoso ou resistivo.'],
      },
      'neuro-tdah': {
        badge: 'Neuro-Adaptado (TDAH / Dislexia) • Chunking & Destaques Semânticos',
        flesch: 'Legibilidade Flesch-PT: 88 (Escaneamento Cognitivo Rápido)',
        text: `✅ PASSO 1 (O QUE É): "${topic}" trata de como a energia e a matéria se organizam.\n✅ PASSO 2 (A REGRA PRINCIPAL): A energia total SEMPRE se conserva no processo.\n✅ PASSO 3 (COMO CAI NO ENEM): Identifique o que entra, o que é transformado e o que se perde para o meio.\n💡 DICA DE PROVA: Destaque as unidades no enunciado antes de aplicar qualquer fórmula!`,
        glossary: ['Chunking: divisão do conteúdo em blocos curtos numerados com checklist visual.'],
      },
    };
    return map[readingLevel];
  }, [readingLevel, topic, dynamicPedagogy]);

  const handleSendBoostQuestion = async (customPrompt?: string) => {
    const question = (customPrompt || boostInput).trim();
    if (!question || isCharacterTyping) return;
    setBoostInput('');
    setIsCharacterTyping(true);

    setBoostChatHistory(prev => [
      ...prev,
      { sender: 'teacher', name: 'Professor / Turma', text: question },
    ]);

    try {
      let replyText = '';
      const context = `Você é ${selectedCharacter.name} (${selectedCharacter.epoch}, ${selectedCharacter.country}). 
Área científica: ${selectedCharacter.areaLabel}. 
Obra notável: ${selectedCharacter.notableWork}.
Diretriz de Persona: ${selectedCharacter.systemPrompt}
Público-alvo: Estudantes e professor do ${grade}.
INSTRUÇÕES OBRIGATÓRIAS:
- Responda SEMPRE em 1ª pessoa como ${selectedCharacter.name}.
- Seja socrático, inspirador, historicamente rigoroso e cientificamente exato em português.
- Responda diretamente ao que foi perguntado: "${question}".
- Nunca dê respostas vazias ou genéricas de robô. Fale com a voz e o entusiasmo de ${selectedCharacter.name}.`;

      const aiRes = await (window as any).aquila?.invoke('ai:chat', {
        message: question,
        context,
      });

      if (aiRes && typeof aiRes === 'string' && !aiRes.includes('Erro ao processar') && !aiRes.includes('não está disponível')) {
        replyText = aiRes;
      } else {
        replyText = generateCharacterResponse(selectedCharacter, question, grade);
      }

      setBoostChatHistory(prev => [
        ...prev,
        { sender: 'character', name: selectedCharacter.name, text: replyText },
      ]);
    } catch {
      const fallbackReply = generateCharacterResponse(selectedCharacter, question, grade);
      setBoostChatHistory(prev => [
        ...prev,
        { sender: 'character', name: selectedCharacter.name, text: fallbackReply },
      ]);
    } finally {
      setIsCharacterTyping(false);
    }
  };

  const handleSelectCharacter = (char: HistoricalCharacter) => {
    setSelectedCharacterId(char.id);
    setBoostChatHistory([
      {
        sender: 'character',
        name: char.name,
        text: char.introGreeting,
      },
    ]);
  };

  const handleRunOcrSimulation = () => {
    setOcrStep('scanning');
    setTimeout(() => {
      setOcrStep('graded');
      setOcrScore(Math.floor(8 + Math.random() * 3)); // 8, 9 ou 10
      showToast('Gabarito processado via OCR com sucesso! 10 questões corrigidas.');
    }, 1200);
  };

  const handleCopyText = (text: string, label: string = 'Conteúdo') => {
    navigator.clipboard.writeText(text);
    showToast(`${label} copiado para a área de transferência!`);
  };

  return (
    <div className="tai-studio-shell">
      {/* HEADER PRINCIPAL */}
      <header className="tai-header">
        <div className="tai-header-left">
          {onBack && (
            <button className="tai-back-btn" onClick={onBack} title="Voltar ao Cockpit Docente">
              <ArrowLeft size={18} />
            </button>
          )}
          <div className="tai-logo-orb">
            <Wand2 size={24} className="text-cyan-400" />
          </div>
          <div>
            <div className="tai-pill-row">
              <span className="tai-pill emerald">ÁQUILA STUDIO (+60 GERADORES BNCC & SAEB)</span>
              <span className="tai-pill purple">FEEDBACK DIAGNÓSTICO & ANÁLISE FORENSE DE AUTORIA</span>
              <span className="tai-pill amber">LABORATÓRIO STEM & 33 PENSADORES HISTÓRICOS</span>
            </div>
            <h1>Estúdio Pedagógico Áquila IA — Co-Piloto Docente Soberano</h1>
            <p>Planejamento BNCC, Adaptação PEI, Correção OCR de Gabarito, Feedback Formativo e Mentoria com Cientistas de Renome.</p>
          </div>
        </div>
      </header>

      {/* TOAST DE FEEDBACK */}
      {toastNotification && (
        <div style={{ position: 'fixed', top: 24, right: 24, zIndex: 9999 }}>
          <div className="af-toast">
            <Check size={16} />
            <span>{toastNotification}</span>
          </div>
        </div>
      )}

      {/* NAVEGAÇÃO DAS 7 ESTAÇÕES DE TRABALHO NATIVAS ÁQUILA */}
      <nav className="tai-station-tabs">
        <button
          className={`tai-station-btn ${activeStation === 'aquila-studio' ? 'active' : ''}`}
          onClick={() => setActiveStation('aquila-studio')}
        >
          <Sparkles size={16} />
          <span>1. Gerador Pedagógico Áquila (BNCC, PEI, Slides & Questões)</span>
        </button>
        <button
          className={`tai-station-btn ${activeStation === 'aquila-feedback' ? 'active' : ''}`}
          onClick={() => setActiveStation('aquila-feedback')}
        >
          <MessageSquare size={16} />
          <span>2. Feedback Diagnóstico (Glow & Grow / Rubricas)</span>
        </button>
        <button
          className={`tai-station-btn ${activeStation === 'aquila-inspect' ? 'active' : ''}`}
          onClick={() => setActiveStation('aquila-inspect')}
        >
          <Eye size={16} />
          <span>3. Análise Forense de Autoria (Replay Biométrico de Escrita)</span>
        </button>
        <button
          className={`tai-station-btn ${activeStation === 'aquila-leveler' ? 'active' : ''}`}
          onClick={() => setActiveStation('aquila-leveler')}
        >
          <Sliders size={16} />
          <span>4. Nivelador Cognitivo (DOK 1–4 & Adaptação Textual)</span>
        </button>
        <button
          className={`tai-station-btn ${activeStation === 'aquila-stem-lab' ? 'active' : ''}`}
          onClick={() => setActiveStation('aquila-stem-lab')}
        >
          <Atom size={16} />
          <span>5. Laboratório STEM & Diálogo com Cientistas (75+ Pensadores em Domínio Público)</span>
        </button>
        <button
          className={`tai-station-btn ${activeStation === 'aquila-copilot' ? 'active' : ''}`}
          onClick={() => setActiveStation('aquila-copilot')}
        >
          <Award size={16} />
          <span>6. Áquila Co-Pilot Docente (Rubricas, Exit Tickets & Pareceres)</span>
        </button>
        <button
          className={`tai-station-btn ${activeStation === 'aquila-snapshot' ? 'active' : ''}`}
          onClick={() => setActiveStation('aquila-snapshot')}
        >
          <BarChart3 size={16} />
          <span>7. Raio-X da Turma & Diagnóstico BNCC</span>
        </button>
        <button
          className={`tai-station-btn ${activeStation === 'aquila-multimodal-studio' ? 'active' : ''}`}
          onClick={() => setActiveStation('aquila-multimodal-studio')}
        >
          <Sparkles size={16} />
          <span>8. Estúdio Multimodal & Gamificação (Brisk • NotebookLM Podcast • Wordwall)</span>
        </button>
        <button
          className={`tai-station-btn ${activeStation === 'aquila-growth-agents' ? 'active' : ''}`}
          onClick={() => setActiveStation('aquila-growth-agents')}
        >
          <Sparkles size={16} />
          <span>9. Enxame de Agentes (Blog Storyteller • Leads & Marketing • Autoridade Científica)</span>
        </button>
        <button
          className={`tai-station-btn ${activeStation === 'aquila-exam-foundry' ? 'active' : ''}`}
          onClick={() => setActiveStation('aquila-exam-foundry')}
        >
          <Printer size={16} />
          <span>10. Gerador de Provas A4 & OMR (Padrão ENEM / PAS / SOMOS Plurall)</span>
        </button>
      </nav>

      {/* =====================================================================
          ESTAÇÃO 1: GERADOR PEDAGÓGICO ÁQUILA
          ===================================================================== */}
      {activeStation === 'aquila-studio' && (
        <div className="tai-workstation-grid">
          {/* Catálogo Lateral das Ferramentas Áquila */}
          <div className="tai-sidebar-card">
            <h3>🧰 Ferramentas Pedagógicas Áquila</h3>
            <p className="tai-sub">Selecione o gerador pedagógico alinhado à BNCC:</p>

            <div className="tai-tool-list">
              {[
                { id: 'bncc-lesson', name: 'Plano de Aula BNCC + Sequência Didática', badge: 'BNCC Oficial', icon: <BookOpen size={16} /> },
                { id: 'slide-deck', name: 'Gerador de Apresentação de Slides (8 Slides)', badge: 'Pronto p/ Projetar', icon: <Presentation size={16} /> },
                { id: 'pei-inclusive', name: 'Adaptador Inclusivo & PEI (TDAH / TEA / Dislexia)', badge: 'Educação Inclusiva', icon: <Brain size={16} /> },
                { id: 'paper-exam-ocr', name: 'Corretor de Provas em Papel (OCR Gabarito)', badge: 'Visão Computacional', icon: <Camera size={16} /> },
                { id: 'enem-saeb-gen', name: 'Lista de Questões Vestibulares c/ Gabarito', badge: 'ENEM & Bancas', icon: <CheckSquare size={16} /> },
                { id: 'creative-study', name: 'Estudo Criativo & Storytelling Engajador', badge: 'Alto Engajamento', icon: <Flame size={16} /> },
              ].map(tool => (
                <div
                  key={tool.id}
                  className={`tai-tool-item ${selectedTool === tool.id ? 'active' : ''}`}
                  onClick={() => setSelectedTool(tool.id as AquilaToolId)}
                >
                  <div className="tai-tool-icon">{tool.icon}</div>
                  <div className="tai-tool-meta">
                    <strong>{tool.name}</strong>
                    <span>{tool.badge}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Painel Central de Geração Áquila */}
          <div className="tai-main-card">
            <div className="tai-params-bar">
              <div className="tai-field">
                <label>Turma (Colégio Áquila Modelo)</label>
                <select value={grade} onChange={e => setGrade(e.target.value)} aria-label="Turma">
                  <option value="6º Ano A (Fund. II)">6º Ano A (Fund. II)</option>
                  <option value="9º Ano A (Fund. II)">9º Ano A (Fund. II)</option>
                  <option value="1ª Série A (Ensino Médio)">1ª Série A (Ensino Médio)</option>
                  <option value="2ª Série A (Ensino Médio)">2ª Série A (Ensino Médio)</option>
                  <option value="3ª Série A (Pré-ENEM)">3ª Série A (Pré-ENEM)</option>
                </select>
              </div>
              <div className="tai-field">
                <label>Disciplina / Área</label>
                <input type="text" value={subject} onChange={e => setSubject(e.target.value)} />
              </div>
              <div className="tai-field grow">
                <label>Tema da Aula ou Habilidade BNCC</label>
                <input
                  type="text"
                  placeholder="Ex: calor, estequiometria, ondas, revolução francesa, função afim..."
                  value={topic}
                  onChange={e => setTopic(e.target.value)}
                />
              </div>
              <button
                className="tai-play-btn"
                style={{ alignSelf: 'flex-end', height: 42, padding: '0 20px', background: 'linear-gradient(135deg, #0ea5e9, #6366f1)', border: 'none' }}
                onClick={() => {
                  setIsGenerating(true);
                  setTimeout(() => {
                    setGeneratedNonce(n => n + 1);
                    setIsGenerating(false);
                    showToast(`Conteúdo gerado com sucesso para "${topic}"!`);
                  }, 400);
                }}
              >
                <Sparkles size={16} />
                <span>{isGenerating ? 'Gerando...' : 'Gerar com IA'}</span>
              </button>
            </div>

            {/* AÇÕES DE EXPORTAÇÃO RÁPIDA */}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginBottom: 14 }}>
              <button
                className="af-btn ghost"
                onClick={() => handleCopyText(JSON.stringify(dynamicPedagogy, null, 2), 'Planejamento Completo')}
              >
                <Copy size={14} />
                <span>Copiar Conteúdo</span>
              </button>
              <button
                className="af-btn ghost"
                onClick={() => showToast(`Planejamento de "${topic}" vinculado ao Diário de Classe!`)}
              >
                <BookmarkCheck size={14} />
                <span>Salvar no Diário</span>
              </button>
              <button
                className="af-btn ghost"
                onClick={() => window.print()}
              >
                <Printer size={14} />
                <span>Imprimir / PDF</span>
              </button>
            </div>

            {/* 1. PLANO DE AULA BNCC */}
            {selectedTool === 'bncc-lesson' && (
              <div className="tai-output-box">
                <div className="tai-output-header">
                  <div>
                    <span className="tai-badge-inline">PLANO DE AULA OFICIAL BNCC • {grade.toUpperCase()}</span>
                    <h2>{topic.toUpperCase()}</h2>
                  </div>
                </div>

                <div className="tai-sections-grid">
                  <div className="tai-sec-card">
                    <h4>🎯 Habilidade BNCC & Objetivos de Bloom</h4>
                    <p><strong>Código BNCC:</strong> <code>{dynamicPedagogy.lessonPlan.bnccCode}</code> — {dynamicPedagogy.lessonPlan.bnccDescription}</p>
                    <p><strong>Verbos de Bloom:</strong> {dynamicPedagogy.lessonPlan.bloomVerbs}</p>
                  </div>
                  <div className="tai-sec-card">
                    <h4>⏱️ Roteiro Cronometrado da Aula (50 Minutos)</h4>
                    <ul>
                      {dynamicPedagogy.lessonPlan.stages.map((stage, idx) => (
                        <li key={idx} style={{ marginBottom: 10 }}>
                          <strong>{stage.time} ({stage.title}):</strong> {stage.desc}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* 2. APRESENTAÇÃO DE SLIDES */}
            {selectedTool === 'slide-deck' && (
              <div className="tai-output-box">
                <span className="tai-badge-inline">APRESENTAÇÃO DE SLIDES PRONTA PARA PROJEÇÃO (8 SLIDES)</span>
                <h2>Apresentação Pronta para Projeção — {topic}</h2>
                <div className="tai-slides-grid">
                  {dynamicPedagogy.slides.map(s => (
                    <div key={s.num} className="tai-slide-card">
                      <span className="slide-num">SLIDE 0{s.num}</span>
                      <h4>{s.title}</h4>
                      <p style={{ whiteSpace: 'pre-line' }}>{s.body}</p>
                      <div style={{ marginTop: 10, fontSize: '0.72rem', color: '#94a3b8', fontStyle: 'italic' }}>
                        Nota do Professor: {s.notes}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3. PEI INCLUSIVO */}
            {selectedTool === 'pei-inclusive' && (
              <div className="tai-output-box">
                <div className="tai-inclusive-selector">
                  <span>Perfil de Adaptação Neuro-Inclusiva (PEI):</span>
                  {(['TDAH', 'TEA', 'DISLEXIA', 'ALTAS_HABILIDADES'] as const).map(prof => (
                    <button
                      key={prof}
                      className={`tai-prof-pill ${inclusiveProfile === prof ? 'active' : ''}`}
                      onClick={() => setInclusiveProfile(prof)}
                    >
                      {prof}
                    </button>
                  ))}
                </div>

                <div className="tai-sec-card" style={{ marginTop: '16px' }}>
                  <h4>🧠 Adaptação Curricular para "{topic}" — Perfil {inclusiveProfile}</h4>
                  <ul>
                    {inclusiveProfile === 'TDAH' && dynamicPedagogy.pei.tdah.map((t, i) => <li key={i}>{t}</li>)}
                    {inclusiveProfile === 'TEA' && dynamicPedagogy.pei.tea.map((t, i) => <li key={i}>{t}</li>)}
                    {inclusiveProfile === 'DISLEXIA' && dynamicPedagogy.pei.dislexia.map((t, i) => <li key={i}>{t}</li>)}
                    {inclusiveProfile === 'ALTAS_HABILIDADES' && dynamicPedagogy.pei.altasHabilidades.map((t, i) => <li key={i}>{t}</li>)}
                  </ul>
                </div>
              </div>
            )}

            {/* 4. OCR DE GABARITO EM PAPEL */}
            {selectedTool === 'paper-exam-ocr' && (
              <div className="tai-output-box">
                <span className="tai-badge-inline">VISÃO COMPUTACIONAL SOBERANA • CORRETOR DE GABARITOS</span>
                <h2>Corretor de Folhas de Resposta em Papel (OCR)</h2>

                <div style={{ display: 'flex', gap: 24, marginTop: 16 }}>
                  <div style={{ flex: 1, padding: 20, borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <h4>Folha de Prova / Cartão-Resposta</h4>
                    <p style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
                      Alinhe a folha de respostas na webcam ou clique no botão para simular a leitura óptica de marcas.
                    </p>

                    <div style={{ marginTop: 20, display: 'flex', gap: 12 }}>
                      <button className="tai-play-btn" onClick={handleRunOcrSimulation}>
                        <Camera size={16} />
                        <span>{ocrStep === 'scanning' ? 'Processando OCR...' : 'Escanear Gabarito'}</span>
                      </button>
                      {ocrStep === 'graded' && (
                        <button className="af-btn ghost" onClick={() => setOcrStep('idle')}>
                          <RotateCcw size={14} />
                          <span>Limpar Leitura</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div style={{ flex: 1, padding: 20, borderRadius: 12, background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.25)' }}>
                    <h4>Resultado da Auditoria Óptica</h4>
                    {ocrStep === 'graded' ? (
                      <div>
                        <div style={{ display: 'flex', gap: 20, alignItems: 'center', marginBottom: 14 }}>
                          <div>
                            <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>NOTA ESTIMADA</span>
                            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#34d399' }}>{ocrScore} / 10</div>
                          </div>
                          <div>
                            <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>ACERTOS / TOTAL</span>
                            <div style={{ fontSize: '1.2rem', color: '#38bdf8' }}>{ocrScore} acertos (10 itens)</div>
                          </div>
                        </div>
                        <button
                          className="af-btn"
                          onClick={() => showToast('Nota lançada automaticamente na Planilha de Notas do Professor!')}
                        >
                          <Check size={14} />
                          <span>Lançar Nota na Planilha</span>
                        </button>
                      </div>
                    ) : (
                      <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
                        Nenhum cartão escaneado no momento. Clique em "Escanear Gabarito" para iniciar.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 5. LISTA DE QUESTÕES VESTIBULAR */}
            {selectedTool === 'enem-saeb-gen' && (
              <div className="tai-output-box">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
                  <div>
                    <span className="tai-badge-inline">BANCO DE QUESTÕES VESTIBULARES • PADRÃO TRI</span>
                    <h2 style={{ margin: '4px 0 0 0' }}>Lista de Questões Calibradas — {topic}</h2>
                  </div>
                  <button
                    className="af-btn primary"
                    style={{ background: 'linear-gradient(135deg, #0284c7, #6366f1)', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
                    onClick={() => setActiveStation('aquila-exam-foundry')}
                  >
                    <Printer size={16} />
                    <span>Diagramar Prova Oficial A4 (2 Colunas + OMR)</span>
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginTop: 16 }}>
                  {dynamicPedagogy.questions.map((q, idx) => (
                    <div key={q.id} style={{ padding: 18, borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ fontWeight: 700, color: '#38bdf8' }}>Questão 0{idx + 1} • {q.exam}</span>
                        <span style={{ fontSize: '0.75rem', color: '#fbbf24' }}>Dificuldade TRI ~{q.triDifficulty}</span>
                      </div>
                      <p style={{ fontSize: '0.9rem', marginBottom: 12 }}>{q.statement}</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
                        {(['A', 'B', 'C', 'D', 'E'] as const).map(letter => (
                          <div
                            key={letter}
                            style={{
                              padding: '8px 12px',
                              borderRadius: 8,
                              background: letter === q.correct ? 'rgba(52, 211, 153, 0.12)' : 'rgba(255,255,255,0.02)',
                              border: letter === q.correct ? '1px solid #34d399' : '1px solid rgba(255,255,255,0.06)',
                              fontSize: '0.85rem'
                            }}
                          >
                            <strong>{letter})</strong> {q.alternatives[letter]}
                          </div>
                        ))}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#cbd5e1', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 10 }}>
                        <strong style={{ color: '#34d399' }}>Resolução Oficial:</strong> {q.explanation}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 6. ESTUDO CRIATIVO */}
            {selectedTool === 'creative-study' && (
              <div className="tai-output-box">
                <span className="tai-badge-inline">STORYTELLING & METODOLOGIAS ATIVAS</span>
                <h2>{dynamicPedagogy.creative.headline}</h2>

                <div className="tai-sec-card" style={{ marginTop: 16 }}>
                  <h4>🎭 Analogia Provocadora</h4>
                  <p>{dynamicPedagogy.creative.analogy}</p>

                  <h4 style={{ marginTop: 14 }}>🌍 Conexão com o Mundo Real</h4>
                  <p>{dynamicPedagogy.creative.realWorldConnection}</p>

                  <h4 style={{ marginTop: 14 }}>🚀 Micro-Desafio Prático</h4>
                  <p>{dynamicPedagogy.creative.microChallenge}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =====================================================================
          ESTAÇÃO 2: FEEDBACK DIAGNÓSTICO (GLOW & GROW)
          ===================================================================== */}
      {activeStation === 'aquila-feedback' && (
        <div className="tai-sections-grid">
          <div className="tai-main-card">
            <span className="tai-badge-inline">FEEDBACK DIAGNÓSTICO FORMATIVO • PADRÃO BNCC</span>
            <h2>Devolutiva Individualizada com Metodologia Glow & Grow</h2>

            <div className="tai-field" style={{ marginTop: 14 }}>
              <label>Selecione a Redação do Estudante</label>
              <select
                className="af-select"
                value={selectedSubmissionId}
                onChange={e => setSelectedSubmissionId(e.target.value)}
              >
                {SAMPLE_SUBMISSIONS.map(s => (
                  <option key={s.id} value={s.id}>{s.studentName} ({s.className}) — {s.title}</option>
                ))}
              </select>
            </div>

            <div className="tai-feedback-mode-bar" style={{ marginTop: 14 }}>
              {[
                { id: 'glow-grow', label: 'Glow & Grow (Brilho & Superação)' },
                { id: 'rubric', label: 'Rubrica Oficial por Competência' },
                { id: 'next-steps', label: 'Próximos Passos de Escrita' },
                { id: 'targeted', label: 'Sugestões Pontuais no Trecho' },
              ].map(m => (
                <button
                  key={m.id}
                  className={`tai-mode-btn ${feedbackMode === m.id ? 'active' : ''}`}
                  onClick={() => setFeedbackMode(m.id as FeedbackMode)}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {feedbackMode === 'glow-grow' && (
              <div className="tai-sec-card" style={{ marginTop: 16 }}>
                <h4 style={{ color: '#34d399' }}>✨ O que Brilhou (Glow)</h4>
                <ul>
                  {currentSubmission.feedback.glow.map((g, i) => <li key={i}>{g}</li>)}
                </ul>

                <h4 style={{ color: '#f59e0b', marginTop: 16 }}>🌱 Oportunidade de Crescimento (Grow)</h4>
                <ul>
                  {currentSubmission.feedback.grow.map((g, i) => <li key={i}>{g}</li>)}
                </ul>

                <div style={{ marginTop: 16, padding: 12, borderRadius: 8, background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
                  <strong>❓ Pergunta Socrática Provocadora:</strong>
                  <p style={{ margin: '4px 0 0', fontStyle: 'italic' }}>{currentSubmission.feedback.socraticQuestion}</p>
                </div>
              </div>
            )}

            {feedbackMode === 'rubric' && (
              <div className="tai-sec-card" style={{ marginTop: 16 }}>
                <h4>Avaliação por Competências (Níveis 1 a 4)</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
                  {currentSubmission.feedback.rubric.map((r, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
                      <div>
                        <strong>{r.criterion}</strong>
                        <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>{r.comment}</div>
                      </div>
                      <div style={{ fontWeight: 800, color: '#38bdf8' }}>{r.level} / {r.max}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {feedbackMode === 'next-steps' && (
              <div className="tai-sec-card" style={{ marginTop: 16 }}>
                <h4>Roteiro de Reescrita Orientada</h4>
                <ul>
                  {currentSubmission.feedback.nextSteps.map((step, i) => <li key={i}>{step}</li>)}
                </ul>
              </div>
            )}

            {feedbackMode === 'targeted' && (
              <div className="tai-sec-card" style={{ marginTop: 16 }}>
                <h4>Trechos Analisados com Sugestão de Paráfrase</h4>
                {currentSubmission.feedback.targeted.map((t, i) => (
                  <div key={i} style={{ marginBottom: 12 }}>
                    <div style={{ fontStyle: 'italic', color: '#cbd5e1' }}>{t.quote}</div>
                    <div style={{ color: '#38bdf8', fontSize: '0.85rem', marginTop: 4 }}>💡 {t.suggestion}</div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
              <button
                className="af-btn"
                onClick={() => handleCopyText(JSON.stringify(currentSubmission.feedback, null, 2), 'Devolutiva')}
              >
                <Copy size={14} />
                <span>Copiar Devolutiva para o Estudante</span>
              </button>
            </div>
          </div>

          <div className="tai-sidebar-card">
            <h3>Texto Submetido pelo Estudante</h3>
            <p style={{ fontSize: '0.88rem', lineHeight: 1.6, whiteSpace: 'pre-line', marginTop: 12, color: '#cbd5e1' }}>
              {currentSubmission.finalText}
            </p>
          </div>
        </div>
      )}

      {/* =====================================================================
          ESTAÇÃO 3: ANÁLISE FORENSE DE AUTORIA (REPLAY DE ESCRITA)
          ===================================================================== */}
      {activeStation === 'aquila-inspect' && (
        <div className="tai-sections-grid">
          <div className="tai-main-card">
            <span className="tai-badge-inline">AUDITORIA FORENSE DE ESCRITA • INTEGRIDADE ACADÊMICA</span>
            <h2>Replay Biométrico da Construção Textual</h2>

            <div className="inspect-kpi-strip" style={{ marginTop: 16 }}>
              <div className="inspect-kpi">
                <span>ÍNDICE DE AUTENTICIDADE</span>
                <strong className={currentSubmission.authenticityScore >= 80 ? 'text-emerald-400' : 'text-amber-400'}>
                  {currentSubmission.authenticityScore}%
                </strong>
              </div>
              <div className="inspect-kpi">
                <span>TEMPO ATIVO DIGITANDO</span>
                <strong className="text-cyan-400">{currentSubmission.activeMinutes} min</strong>
              </div>
              <div className="inspect-kpi">
                <span>EVENTOS DE COLAGEM (PASTE)</span>
                <strong className={currentSubmission.pasteEventsCount > 0 ? 'text-red-400' : 'text-emerald-400'}>
                  {currentSubmission.pasteEventsCount} ({currentSubmission.pastedWordsCount} palavras)
                </strong>
              </div>
            </div>

            <div style={{ marginTop: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>Linha do Tempo de Edição (Passo {replayStepIndex + 1} de {currentSubmission.timelineSteps.length})</span>
                <button
                  className="af-btn ghost"
                  onClick={() => setIsPlayingReplay(!isPlayingReplay)}
                >
                  {isPlayingReplay ? <Pause size={14} /> : <Play size={14} />}
                  <span>{isPlayingReplay ? 'Pausar Replay' : 'Iniciar Replay'}</span>
                </button>
              </div>

              <div style={{ padding: 16, borderRadius: 12, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginBottom: 6 }}>
                  {currentSubmission.timelineSteps[replayStepIndex]?.timestamp} — {currentSubmission.timelineSteps[replayStepIndex]?.label}
                </div>
                <p style={{ fontSize: '0.9rem', color: '#f8fafc', lineHeight: 1.6 }}>
                  {currentSubmission.timelineSteps[replayStepIndex]?.snapshot}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          ESTAÇÃO 4: NIVELADOR COGNITIVO DOK 1–4
          ===================================================================== */}
      {activeStation === 'aquila-leveler' && (
        <div className="tai-main-card">
          <span className="tai-badge-inline">NIVELAMENTO COGNITIVO DOK • ADAPTAÇÃO TEXTUAL POR FAIXA ETÁRIA</span>
          <h2>Adaptação Automática de Dificuldade Textual</h2>

          <div className="tai-feedback-mode-bar" style={{ marginTop: 16 }}>
            {[
              { id: 'ef2-6ano', label: '6º/7º Ano EF (Linguagem Acessível)' },
              { id: 'em-enem', label: 'Ensino Médio Regular (Padrão ENEM)' },
              { id: 'med-ita', label: 'Avançado / Medicina / ITA (Acadêmico)' },
              { id: 'neuro-tdah', label: 'Neuro-Adaptado (TDAH & Dislexia)' },
            ].map(lvl => (
              <button
                key={lvl.id}
                className={`tai-mode-btn ${readingLevel === lvl.id ? 'active' : ''}`}
                onClick={() => setReadingLevel(lvl.id as ReadingLevelId)}
              >
                {lvl.label}
              </button>
            ))}
          </div>

          <div className="tai-sec-card" style={{ marginTop: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="tai-badge-inline">{leveledTextOutput.badge}</span>
              <span style={{ fontSize: '0.78rem', color: '#38bdf8' }}>{leveledTextOutput.flesch}</span>
            </div>

            <p style={{ fontSize: '0.95rem', lineHeight: 1.7, marginTop: 14, whiteSpace: 'pre-line' }}>
              {leveledTextOutput.text}
            </p>

            <div style={{ marginTop: 18, borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 12 }}>
              <strong>Glossário Conceitual Apoiador:</strong>
              <ul style={{ marginTop: 6 }}>
                {leveledTextOutput.glossary.map((g, i) => <li key={i}>{g}</li>)}
              </ul>
            </div>

            <div style={{ marginTop: 16 }}>
              <button
                className="af-btn ghost"
                onClick={() => handleCopyText(leveledTextOutput.text, 'Texto Nivelado')}
              >
                <Copy size={14} />
                <span>Copiar Texto Adaptado</span>
              </button>
            </div>
          </div>
        </div>
      )}

            {/* =====================================================================
          ESTAÇÃO 8: ESTÚDIO MULTIMODAL (BRISK + NOTEBOOKLM + WORDWALL)
          ===================================================================== */}
      {activeStation === 'aquila-multimodal-studio' && (
        <MultimodalPedagogicalStudio />
      )}

      {/* =====================================================================
          ESTAÇÃO 9: ENXAME DE AGENTES (STORYTELLER, LEADS, AUTORIDADE)
          ===================================================================== */}
      {activeStation === 'aquila-growth-agents' && (
        <SchoolGrowthAgentSuite />
      )}

      {/* =====================================================================
          ESTAÇÃO 10: GERADOR DE PROVAS A4 & OMR (ENEM / PAS / PLURALL)
          ===================================================================== */}
      {activeStation === 'aquila-exam-foundry' && (
        <ExamPaperFoundry />
      )}

{/* =====================================================================
          ESTAÇÃO 5: LABORATÓRIO STEM & DIÁLOGO COM 33 GRANDES PENSADORES
          ===================================================================== */}
      {activeStation === 'aquila-stem-lab' && (
        <div className="tai-sections-grid">
          <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 12, marginBottom: 8 }}>
            <button
              className={`tai-station-btn ${stemSubTab === 'official-phet' ? 'active' : ''}`}
              style={{ padding: '8px 16px', borderRadius: 8, fontSize: '0.82rem' }}
              onClick={() => setStemSubTab('official-phet')}
            >
              🌐 1. Catálogo PhET HTML5 & Desafios Kumon (+24h/+48h/+96h)
            </button>
            <button
              className={`tai-station-btn ${stemSubTab === 'native-rea' ? 'active' : ''}`}
              style={{ padding: '8px 16px', borderRadius: 8, fontSize: '0.82rem' }}
              onClick={() => setStemSubTab('native-rea')}
            >
              ⚡ 2. Motor Físico Nativo Transpilado do Java (REA • Eletrostática 60 FPS)
            </button>
          </div>

          {/* LABORATÓRIO SOBERANO PHET COLORADO & KUMON MASTERY */}
          <div style={{ gridColumn: '1 / -1' }}>
            {stemSubTab === 'official-phet' ? <PhetKumonMasteryLab /> : <NativePhETSimulationLab />}
          </div>

          {/* MENTORIA HISTÓRICA COM CIENTISTAS E PENSADORES */}
          <div className="tai-main-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <span className="tai-badge-inline">MENTORIA HISTÓRICA SOBERANA • 75+ CIENTISTAS & PENSADORES (DOMÍNIO PÚBLICO)</span>
                <h2>Diálogo Socrático com Grandes Nomes da Ciência</h2>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  className="tai-chip-btn"
                  onClick={() => {
                    const text = boostChatHistory.map(m => `${m.name}: ${m.text}`).join('\n\n');
                    handleCopyText(text, 'Diálogo com Cientista');
                  }}
                  title="Copiar diálogo para uso na aula"
                >
                  <Copy size={13} />
                  <span>Copiar Diálogo</span>
                </button>
                <button
                  type="button"
                  className="tai-chip-btn"
                  onClick={() => {
                    setBoostChatHistory([
                      {
                        sender: 'character',
                        name: selectedCharacter.name,
                        text: selectedCharacter.introGreeting,
                      },
                    ]);
                  }}
                  title="Reiniciar diálogo"
                >
                  <RotateCcw size={13} />
                  <span>Reiniciar</span>
                </button>
              </div>
            </div>

            {/* BARRA DE PESQUISA & ABAS DE CATEGORIA DE CIENTISTAS */}
            <div style={{ marginTop: 14, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ flex: '1 1 260px', position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: 12, top: 11, color: '#64748b' }} />
                <input
                  type="text"
                  placeholder="Buscar cientista por nome ou conceito (ex: Turing, Curie, Santos Dumont, Darwin)..."
                  value={characterSearch}
                  onChange={e => setCharacterSearch(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px 8px 34px',
                    borderRadius: 8,
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#f8fafc',
                    fontSize: '0.82rem'
                  }}
                />
              </div>

              <div className="tai-category-bar" style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {[
                  { id: 'all', label: `Todos (${HISTORICAL_CHARACTERS.length})` },
                  { id: 'physics_astronomy', label: 'Física & Cosmos' },
                  { id: 'biology_medicine', label: 'Bio & Medicina' },
                  { id: 'chemistry_matter', label: 'Química & Matéria' },
                  { id: 'math_computing', label: 'Matemática & IA' },
                  { id: 'humanities_philosophy', label: 'Humanidades & Letras' },
                  { id: 'engineering_invention', label: 'Engenharia & Invenções' },
                ].map(cat => (
                  <button
                    key={cat.id}
                    className={`tai-chip-btn ${characterFilter === cat.id ? 'active' : ''}`}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 20,
                      fontSize: '0.76rem',
                      fontWeight: 600,
                      background: characterFilter === cat.id ? '#38bdf8' : 'rgba(255,255,255,0.05)',
                      color: characterFilter === cat.id ? '#0f172a' : '#cbd5e1',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                    onClick={() => setCharacterFilter(cat.id as any)}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* SELETOR EM GRID DOS PERSONAGENS FILTRADOS */}
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '12px 0 6px 0', scrollbarWidth: 'thin' }}>
              {filteredCharacters.length === 0 ? (
                <div style={{ padding: '8px 12px', color: '#94a3b8', fontSize: '0.82rem' }}>
                  Nenhum pensador encontrado com o termo "{characterSearch}". Tente buscar por conceito como "relatividade", "dna" ou "algebra".
                </div>
              ) : (
                filteredCharacters.map(char => (
                  <button
                    key={char.id}
                    style={{
                      padding: '8px 14px',
                      borderRadius: 10,
                      border: selectedCharacterId === char.id ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.08)',
                      background: selectedCharacterId === char.id ? 'rgba(56, 189, 248, 0.18)' : 'rgba(255,255,255,0.03)',
                      color: '#f8fafc',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      whiteSpace: 'nowrap',
                      cursor: 'pointer',
                      flexShrink: 0
                    }}
                    onClick={() => handleSelectCharacter(char)}
                    title={`${char.name} (${char.epoch}, ${char.country}) — ${char.notableWork}`}
                  >
                    <span style={{ fontSize: '1rem' }}>{char.avatarIcon}</span>
                    <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>{char.name}</span>
                  </button>
                ))
              )}
            </div>

            {/* DETALHES DO PERSONAGEM SELECIONADO & CITAÇÃO */}
            <div style={{ padding: '12px 16px', borderRadius: 10, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', margin: '10px 0', fontSize: '0.8rem', color: '#94a3b8' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginBottom: 6 }}>
                <div>
                  <strong style={{ color: '#f8fafc', fontSize: '0.9rem' }}>{selectedCharacter.name}</strong>{' '}
                  <span style={{ color: '#38bdf8' }}>({selectedCharacter.epoch}, {selectedCharacter.country})</span> • <em>{selectedCharacter.areaLabel}</em>
                </div>
                <span style={{ fontSize: '0.72rem', background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', padding: '2px 8px', borderRadius: 6, border: '1px solid rgba(56, 189, 248, 0.2)' }}>
                  100% Domínio Público
                </span>
              </div>
              <p style={{ margin: '4px 0', color: '#cbd5e1' }}><strong>Feito Notável:</strong> {selectedCharacter.notableWork}</p>
              <p style={{ margin: '4px 0 8px 0', fontStyle: 'italic', color: '#94a3b8' }}>"{selectedCharacter.famousQuote}"</p>
              
              {/* Botão de Pergunta Rápida Sugerida */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>💡 Proposta Socrática Pronta:</span>
                <button
                  type="button"
                  style={{
                    fontSize: '0.76rem',
                    padding: '4px 10px',
                    background: 'rgba(56, 189, 248, 0.12)',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    color: '#38bdf8',
                    borderRadius: 12,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                  onClick={() => handleSendBoostQuestion(selectedCharacter.suggestedPrompt)}
                  title="Enviar pergunta sugerida imediatamente"
                >
                  <Sparkles size={12} />
                  <span>"{selectedCharacter.suggestedPrompt}"</span>
                </button>
              </div>
            </div>

            {/* CHAT BOX COM HISTÓRICO E SPINNER */}
            <div className="boost-chat-box" style={{ maxHeight: 360, overflowY: 'auto' }}>
              {boostChatHistory.map((msg, idx) => (
                <div key={idx} className={`boost-msg ${msg.sender}`}>
                  <strong>{msg.name}:</strong>
                  <p style={{ whiteSpace: 'pre-line' }}>{msg.text}</p>
                </div>
              ))}
              {isCharacterTyping && (
                <div className="boost-msg character" style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#38bdf8' }}>
                  <Sparkles size={14} className="animate-spin" />
                  <span>{selectedCharacter.name} está formulando a resposta com rigor científico...</span>
                </div>
              )}
            </div>

            {/* CAMPO DE ENTRADA */}
            <div className="boost-input-row">
              <input
                type="text"
                placeholder={`Pergunte algo a ${selectedCharacter.name} para projetar à turma...`}
                value={boostInput}
                onChange={e => setBoostInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSendBoostQuestion()}
                disabled={isCharacterTyping}
              />
              <button className="tai-play-btn" onClick={() => handleSendBoostQuestion()} disabled={isCharacterTyping || !boostInput.trim()}>
                <Send size={15} />
                <span>{isCharacterTyping ? 'Pensando...' : 'Perguntar'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          ESTAÇÃO 6: ÁQUILA CO-PILOT DOCENTE
          ===================================================================== */}
      {activeStation === 'aquila-copilot' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="km-subtool-nav">
            <button
              className={`km-subtool-btn ${selectedCopilotTool === 'rubric-generator' ? 'active' : ''}`}
              onClick={() => setSelectedCopilotTool('rubric-generator')}
            >
              <Award size={15} />
              <span>Gerador de Rubricas Analíticas</span>
            </button>
            <button
              className={`km-subtool-btn ${selectedCopilotTool === 'exit-ticket' ? 'active' : ''}`}
              onClick={() => setSelectedCopilotTool('exit-ticket')}
            >
              <CheckSquare size={15} />
              <span>Bilhete de Saída (Exit Ticket 5 Min)</span>
            </button>
            <button
              className={`km-subtool-btn ${selectedCopilotTool === 'report-card-comments' ? 'active' : ''}`}
              onClick={() => setSelectedCopilotTool('report-card-comments')}
            >
              <FileText size={15} />
              <span>Pareceres & Comentários de Boletim</span>
            </button>
          </div>

          {/* RUBRICAS */}
          {selectedCopilotTool === 'rubric-generator' && (
            <div className="km-exit-card">
              <div className="km-exit-header">
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem' }}>Matriz Analítica de Avaliação Áquila</h3>
                  <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                    Critérios operacionais com pesos ponderados e níveis de proficiência 1 a 4
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <select
                    className="af-select"
                    style={{ width: 260, marginBottom: 0 }}
                    value={rubricProjectType}
                    onChange={e => setRubricProjectType(e.target.value as any)}
                  >
                    <option value="enem-essay">Redação Argumentativa (Padrão ENEM)</option>
                    <option value="steam-lab">Relatório Prático de Laboratório STEAM</option>
                    <option value="seminar">Seminário Oral & Apresentação em Grupo</option>
                    <option value="maker-project">Projeto Maker & Resolução de Problemas</option>
                  </select>
                  <button
                    className="af-btn ghost"
                    onClick={() => handleCopyText('Rubrica de Avaliação Áquila Copiada!', 'Rubrica')}
                  >
                    <Copy size={14} />
                    <span>Copiar</span>
                  </button>
                </div>
              </div>

              <div className="km-rubric-wrap">
                <table className="km-rubric-table">
                  <thead>
                    <tr>
                      <th style={{ width: '22%' }}>CRITÉRIO & PESO</th>
                      <th style={{ width: '19.5%' }}>1. EM DESENVOLVIMENTO (0-40%)</th>
                      <th style={{ width: '19.5%' }}>2. BÁSICO (41-65%)</th>
                      <th style={{ width: '19.5%' }}>3. PROFICIENTE (66-85%)</th>
                      <th style={{ width: '19.5%' }}>4. EXCELENTE (86-100%)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>Domínio Conceitual & Repertório (30%)</strong></td>
                      <td>Erros conceituais graves ou vocabulário inadequado.</td>
                      <td>Conceitos superficiais sem articulação profunda.</td>
                      <td>Aplica com precisão os conceitos teóricos exigidos.</td>
                      <td>Domínio exemplar: repertório interdisciplinar rico.</td>
                    </tr>
                    <tr>
                      <td><strong>Argumentação Crítica & Cálculos (30%)</strong></td>
                      <td>Afirmações sem base empírica ou dados comprobatórios.</td>
                      <td>Apresenta dados isolados com lógica frágil.</td>
                      <td>Argumentação consistente sustentada por cálculos corretos.</td>
                      <td>Pensamento crítico sofisticado que antecipa contra-provas.</td>
                    </tr>
                    <tr>
                      <td><strong>Clareza & Norma Padrão (20%)</strong></td>
                      <td>Estrutura confusa e desvios gramaticais recorrentes.</td>
                      <td>Estrutura aceitável, mas vocabulário repetitivo.</td>
                      <td>Fluidez, emprego correto da norma e clareza didática.</td>
                      <td>Elegância expressiva e coesão textual impecável.</td>
                    </tr>
                    <tr>
                      <td><strong>Proposta de Aplicação Prática (20%)</strong></td>
                      <td>Sem proposta prática ou ideias inviáveis.</td>
                      <td>Proposta vaga sem especificação clara de meios.</td>
                      <td>Proposta concreta, exequível e detalhada.</td>
                      <td>Inovação de alto impacto com consciência ética e ambiental.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* EXIT TICKET */}
          {selectedCopilotTool === 'exit-ticket' && (
            <div className="km-exit-card">
              <div className="km-exit-header">
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem' }}>Bilhete de Saída (Exit Ticket Formativo)</h3>
                  <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                    3 checagens rápidas aplicadas nos 5 minutos finais da aula para calibrar o próximo planejamento
                  </span>
                </div>
                <div className="af-pin-card" style={{ padding: '6px 14px' }}>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginRight: 8 }}>PIN da Turma:</span>
                  <span className="af-pin-code" style={{ fontSize: '1.05rem' }}>EXIT-7749</span>
                </div>
              </div>

              <div className="km-exit-q">
                <span className="km-exit-q-title">
                  <CheckSquare size={16} color="#38bdf8" />
                  1. Checagem Conceitual Objetiva ({topic})
                </span>
                <p style={{ margin: 0, fontSize: '0.82rem', color: '#cbd5e1' }}>
                  Qual das alternativas sintetiza corretamente a relação fundamental de {topic}?
                </p>
                <div className="km-exit-options">
                  {[
                    { id: 0, text: 'A) A taxa de transformação ocorre sem qualquer conservação de energia.' },
                    { id: 1, text: 'B) O sistema obedece rigorosamente às leis de balanço e conservação física.' },
                    { id: 2, text: 'C) O fenômeno anula todas as perdas e atinge 100% de rendimento espontâneo.' },
                    { id: 3, text: 'D) A entropia do universo decresce linearmente durante o processo.' },
                  ].map(opt => (
                    <div
                      key={opt.id}
                      className={`km-exit-opt ${exitTicketSelectedOpt === opt.id ? 'selected' : ''}`}
                      onClick={() => setExitTicketSelectedOpt(opt.id)}
                    >
                      {opt.text}
                      {opt.id === 1 && <span style={{ marginLeft: 'auto', fontSize: '0.72rem', color: '#34d399' }}>✓ Gabarito Correto</span>}
                    </div>
                  ))}
                </div>
              </div>

              <div className="km-exit-q">
                <span className="km-exit-q-title">
                  <HelpCircle size={16} color="#fbbf24" />
                  2. Pergunta de Síntese em 1 Linha (Auto-Explicação)
                </span>
                <p style={{ margin: 0, fontSize: '0.82rem', color: '#cbd5e1' }}>
                  "Com suas palavras: por que {topic} é importante para a ciência moderna?"
                </p>
                <input
                  className="af-input"
                  style={{ marginBottom: 0 }}
                  readOnly
                  value={`Porque ${topic} fundamenta as transformações energéticas e os limites teóricos dos sistemas tecnológicos.`}
                />
              </div>

              <div className="km-exit-q">
                <span className="km-exit-q-title">
                  <Star size={16} color="#facc15" />
                  3. Termômetro de Confiança & Dúvida Residual
                </span>
                <div className="km-star-group">
                  {[1, 2, 3, 4, 5].map(st => (
                    <button
                      key={st}
                      className={`km-star-btn ${exitTicketConfidence >= st ? 'active' : ''}`}
                      onClick={() => setExitTicketConfidence(st)}
                    >
                      <Star size={24} fill={exitTicketConfidence >= st ? '#facc15' : 'none'} />
                    </button>
                  ))}
                  <span style={{ fontSize: '0.82rem', color: '#94a3b8', alignSelf: 'center', marginLeft: 10 }}>
                    {exitTicketConfidence >= 4 ? 'Seguro • Compreendeu bem a teoria' : 'Em Consolidação • Precisa de mais exemplos'}
                  </span>
                </div>
              </div>

              <button
                className="af-btn"
                onClick={() => showToast('Diagnóstico do Exit Ticket salvo no Diário de Bordo!')}
              >
                <Check size={14} />
                <span>Salvar Diagnóstico no Diário</span>
              </button>
            </div>
          )}

          {/* PARECERES */}
          {selectedCopilotTool === 'report-card-comments' && (
            <div className="km-comment-card">
              <div className="km-exit-header">
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem' }}>Gerador de Pareceres Descritivos de Boletim</h3>
                  <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                    Produção automática de pareceres individualizados alinhados ao histórico pedagógico
                  </span>
                </div>
                <button
                  className="af-btn ghost"
                  onClick={() => handleCopyText(`Parecer descritivo de ${selectedStudentForComment}`, 'Parecer')}
                >
                  <Copy size={14} />
                  <span>Copiar Parecer</span>
                </button>
              </div>

              <div className="af-form-grid">
                <div className="af-form-field">
                  <label>Estudante Selecionado</label>
                  <select
                    className="af-select"
                    value={selectedStudentForComment}
                    onChange={e => setSelectedStudentForComment(e.target.value)}
                  >
                    {STUDENTS.slice(0, 25).map(s => (
                      <option key={s.registrationNumber || s.name} value={s.name}>
                        {s.name} ({s.classId})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="af-form-field">
                  <label>Tom Pedagógico</label>
                  <select
                    className="af-select"
                    value={commentTone}
                    onChange={e => setCommentTone(e.target.value as any)}
                  >
                    <option value="afetivo">Incentivador & Afetivo (Foco em esforço e crescimento)</option>
                    <option value="analitico">Formal & Analítico (Linguagem técnica e métricas)</option>
                    <option value="metas">Foco em Metas & Superação (Plano para o próximo ciclo)</option>
                    <option value="pei">Inclusivo & PEI (Adaptações curriculares e acolhimento)</option>
                  </select>
                </div>
              </div>

              <div className="km-comment-block">
                <p><strong>Parecer Descritivo Oficial — 3º Bimestre / 2026:</strong></p>
                <p>
                  Durante este bimestre, <strong>{selectedStudentForComment}</strong> demonstrou notável engajamento nas atividades práticas e debates conceituais de {subject}. Destacou-se especialmente na resolução colaborativa de problemas aplicados a <strong>{topic}</strong> e na pontualidade de entrega dos relatórios.
                </p>
                <p>
                  <strong>Pontos Fortes:</strong> Raciocínio lógico estruturado, participação construtiva nas dinâmicas em grupo e autonomia na utilização dos recursos da Fábrica de Atividades.
                </p>
                <p>
                  <strong>Metas para o 4º Bimestre:</strong> Recomendamos reforço na interpretação de enunciados complexos do padrão ENEM e revisão sistemática para consolidação de fórmulas e unidades de medida.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          ESTAÇÃO 7: RAIO-X DA TURMA & DIAGNÓSTICO BNCC
          ===================================================================== */}
      {activeStation === 'aquila-snapshot' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="cs-header-strip">
            <div>
              <span className="af-pill" style={{ background: 'rgba(56, 189, 248, 0.16)', color: '#38bdf8', borderColor: 'rgba(56, 189, 248, 0.35)' }}>
                TELEMETRIA PEDAGÓGICA • ÚLTIMOS 7 DIAS
              </span>
              <h3 style={{ margin: '6px 0 0', fontSize: '1.25rem', fontWeight: 800 }}>
                Radar de Aprendizagem & Matriz Térmica BNCC
              </h3>
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <select
                className="af-select"
                style={{ width: 240, marginBottom: 0 }}
                value={selectedSnapshotClass}
                onChange={e => setSelectedSnapshotClass(e.target.value)}
              >
                <option value="M-EM2A">2º Ano A — Ensino Médio</option>
                <option value="M-EM3A">3º Ano A — Ensino Médio</option>
                <option value="M-EM1A">1º Ano A — Ensino Médio</option>
                <option value="F-EF29A">9º Ano A — Fundamental II</option>
              </select>
              <button
                className="af-btn"
                onClick={() => {
                  setInterventionTriggered(true);
                  setTimeout(() => setInterventionTriggered(false), 4500);
                }}
              >
                <Sparkles size={15} />
                <span>Disparar Trilha Adaptativa</span>
              </button>
            </div>
          </div>

          {interventionTriggered && (
            <div className="af-toast" style={{ background: 'rgba(56, 189, 248, 0.2)', borderColor: '#38bdf8', color: '#38bdf8' }}>
              <Sparkles size={16} />
              <span>
                Trilha Adaptativa Áquila atribuída automaticamente para os 4 estudantes com defasagem nas habilidades críticas!
              </span>
            </div>
          )}

          <div className="cs-kpi-row">
            <div className="cs-kpi-card">
              <span className="cs-kpi-val" style={{ color: '#34d399' }}>4.8h</span>
              <span className="cs-kpi-lbl">TEMPO MÉDIO DE FOCO ATIVO / ESTUDANTE</span>
            </div>
            <div className="cs-kpi-card">
              <span className="cs-kpi-val" style={{ color: '#38bdf8' }}>91.4%</span>
              <span className="cs-kpi-lbl">CONCLUSÃO DE TAREFAS NO PRAZO</span>
            </div>
            <div className="cs-kpi-card">
              <span className="cs-kpi-val" style={{ color: '#facc15' }}>78.6%</span>
              <span className="cs-kpi-lbl">APROVEITAMENTO GLOBAL DA TURMA</span>
            </div>
            <div className="cs-kpi-card">
              <span className="cs-kpi-val" style={{ color: '#f87171' }}>03 ALUNOS</span>
              <span className="cs-kpi-lbl">EM ALERTA DE APRENDIZAGEM</span>
            </div>
          </div>

          <div className="cs-bncc-matrix">
            <table className="cs-bncc-table">
              <thead>
                <tr>
                  <th style={{ width: '15%' }}>CÓDIGO BNCC</th>
                  <th style={{ width: '35%' }}>HABILIDADE & DESCRITOR</th>
                  <th style={{ width: '25%' }}>DISTRIBUIÇÃO DE PROFICIÊNCIA</th>
                  <th style={{ width: '25%' }}>ESTUDANTES EM RECUPERAÇÃO</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <span style={{ fontWeight: 800, color: '#38bdf8' }}>{dynamicPedagogy.lessonPlan.bnccCode}</span>
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{subject}</div>
                  </td>
                  <td>
                    <strong>{topic.toUpperCase()}</strong>
                    <div style={{ fontSize: '0.74rem', color: '#cbd5e1' }}>
                      {dynamicPedagogy.lessonPlan.bnccDescription}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem' }}>
                      <span style={{ color: '#34d399' }}>82% Proficiente</span>
                      <span style={{ color: '#f59e0b' }}>12% Básico</span>
                      <span style={{ color: '#f87171' }}>6% Crítico</span>
                    </div>
                    <div className="cs-bar-container">
                      <div className="cs-bar-prof" style={{ width: '82%' }} />
                      <div className="cs-bar-dev" style={{ width: '12%' }} />
                      <div className="cs-bar-crit" style={{ width: '6%' }} />
                    </div>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.78rem', color: '#f87171', fontWeight: 700 }}>
                      2 alunos: Davi Lucas Silva, Lucas Andrade
                    </span>
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Encaminhados para reforço na Câmara de Maestria</div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherAIStudio;
