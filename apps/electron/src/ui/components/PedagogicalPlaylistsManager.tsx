import React, { useState, useEffect } from 'react';
import {
  Layers, Play, Plus, Trash2, Edit3, CheckCircle2, Clock, Sparkles, BookOpen,
  Compass, Award, Coins, ChevronRight, ArrowLeft, ExternalLink, Flame, ShieldCheck,
  Gamepad2, Lightbulb, Users, HelpCircle, FileCheck, Send, Check
} from 'lucide-react';

interface Stage {
  id: string;
  type: 'warmup' | 'simulation' | 'checkpoint' | 'exit_ticket' | 'debriefing';
  title: string;
  durationMinutes: number;
  toolOrGame: string;
  description: string;
  bnccCode?: string;
  checkpointQuestions?: Array<{ question: string; options: string[]; answerIndex: number }>;
  debriefingGuidingQuestions?: string[];
}

interface PedagogicalPlaylist {
  id: string;
  teacherId?: string;
  classId: string;
  className?: string;
  subject: string;
  title: string;
  description: string;
  bnccCodes: string[];
  stages: Stage[];
  coinReward: number;
  badgeId?: string;
  badgeName?: string;
  status: 'active' | 'draft' | 'completed';
  createdAt?: string;
}

interface GameMakerTemplate {
  id: string;
  title: string;
  gameType: 'fact_or_fake' | 'algebra_balance' | 'icon_memory' | 'quiz_show' | 'bingo';
  subject: string;
  bnccCodes: string[];
  config: {
    instructions: string;
    items: Array<{
      id: string;
      statement: string;
      isFact?: boolean;
      explanation?: string;
      question?: string;
      options?: string[];
      correctAnswer?: string | number;
      category?: string;
    }>;
  };
}

interface PedagogicalPlaylistsManagerProps {
  onBack?: () => void;
  onNavigate?: (page: string) => void;
  user?: any;
}

export const PedagogicalPlaylistsManager: React.FC<PedagogicalPlaylistsManagerProps> = ({
  onBack,
  onNavigate,
  user,
}) => {
  const [activeTab, setActiveTab] = useState<'playlists' | 'gamemaker' | 'catalog' | 'live'>('playlists');
  const [selectedClass, setSelectedClass] = useState<string>('class-1em-a');
  const [playlists, setPlaylists] = useState<PedagogicalPlaylist[]>([]);
  const [gameTemplates, setGameTemplates] = useState<GameMakerTemplate[]>([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState<PedagogicalPlaylist | null>(null);
  const [liveStageIndex, setLiveStageIndex] = useState<number>(0);
  const [liveTimerSeconds, setLiveTimerSeconds] = useState<number>(300);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  // New Playlist Form State
  const [isCreatingPlaylist, setIsCreatingPlaylist] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>('');
  const [newSubject, setNewSubject] = useState<string>('Física / Química');
  const [newDescription, setNewDescription] = useState<string>('');
  const [newBnccCodes, setNewBnccCodes] = useState<string>('EM13CNT102, EM13CNT308');
  const [newCoinReward, setNewCoinReward] = useState<number>(30);
  const [newBadgeName, setNewBadgeName] = useState<string>('Cientista Experimental');

  // New Game Maker Template Form State
  const [isCreatingGame, setIsCreatingGame] = useState<boolean>(false);
  const [newGameTitle, setNewGameTitle] = useState<string>('');
  const [newGameType, setNewGameType] = useState<GameMakerTemplate['gameType']>('fact_or_fake');
  const [newGameSubject, setNewGameSubject] = useState<string>('História');
  const [newGameBncc, setNewGameBncc] = useState<string>('EF08HI11, Lei 10.639/03');
  const [newGameInstructions, setNewGameInstructions] = useState<string>('Julgue as assertivas com base em fontes documentais.');
  const [gameItemsList, setGameItemsList] = useState<Array<{ statement: string; isFact: boolean; explanation: string }>>([
    {
      statement: 'A pintura "Independência ou Morte" de Pedro Américo foi produzida 66 anos após o grito do Ipiranga, com idealização patriótica.',
      isFact: true,
      explanation: 'A obra foi encomendada pela família imperial em 1886 e finalizada em Florença em 1888.',
    },
    {
      statement: 'A Lei 10.639/03 trata apenas do ensino de danças típicas sem valorização da história afro-brasileira.',
      isFact: false,
      explanation: 'A lei estabelece a obrigatoriedade do ensino da história e cultura afro-brasileira nas áreas social, econômica e política.',
    },
  ]);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Curated Catalog derived from our comprehensive pedagogical review
  const curatedCatalog = [
    {
      id: 'noas-pilha-daniell',
      title: 'A Pilha de Daniell (Eletroquímica Interativa)',
      source: 'NOAS (CNEC)',
      category: 'Química & Física',
      grade: 'Ensino Médio (1º ao 3º)',
      bncc: 'EM13CNT102, EM13CNT308',
      type: 'Simulador Virtual',
      description: 'Simula a migração de elétrons, a ponte salina e o potencial de oxirredução de eletrodos de Zinco e Cobre.',
      url: 'https://www.noas.com.br/ensino-medio',
    },
    {
      id: 'noaa-clima-furacao',
      title: 'Simulador de Furacões & Satélites GOES',
      source: 'NOAA NESDIS (.gov)',
      category: 'Geofísica & Clima',
      grade: 'Fundamental II / Ensino Médio',
      bncc: 'EF08CI14, EM13CNT206',
      type: 'Simulador Geofísico',
      description: 'Manipulação de pressão atmosférica, ventos de cisalhamento e temperatura oceânica para prever trajetórias climáticas.',
      url: 'https://www.nesdis.noaa.gov/about/k-12-education/educational-games-simulations',
    },
    {
      id: 'escola-floresta-magica',
      title: 'Floresta Mágica: As 5 Corujas Sábias',
      source: 'Escola Games',
      category: 'Ciências da Natureza',
      grade: 'Anos Iniciais (2º Ano)',
      bncc: 'EF02CI06, EF02CI05',
      type: 'Minijogo Formativo',
      description: 'Exploração das 5 partes da planta (raiz, caule, folhas, flores e frutos) com desafios ecológicos e pintura digital.',
      url: 'https://www.escolagames.com.br/jogos/floresta-magica',
    },
    {
      id: 'joelza-fato-fake',
      title: 'Jogo Fato ou Fake? (Fontes & Documentos Históricos)',
      source: 'Ensinar História (Joelza Domingues)',
      category: 'História & Cidadania',
      grade: 'Fundamental II & Médio',
      bncc: 'EF08HI14, Leis 10.639 e 11.645',
      type: 'Cartas & Desafio Crítico',
      description: 'Dinâmica investigativa com fontes primárias, fotografias do séc. XIX e desmistificação de anacronismos.',
      url: 'https://ensinarhistoria.com.br/jogos-variados/',
    },
    {
      id: 'coquinhos-balanca-algebra',
      title: 'Balança Algébrica & Termo das Equações',
      source: 'Coquinhos (12-15 Anos)',
      category: 'Matemática',
      grade: 'Fundamental II (8º e 9º)',
      bncc: 'EF08MA06, EF09MA08',
      type: 'Quebra-Cabeça Lógico',
      description: 'Visualização intuitiva do equilíbrio de equações lineares com incógnitas sem regras mecânicas de sinal.',
      url: 'https://www.coquinhos.com/category/jogos-para-criancas-12-15-anos/',
    },
    {
      id: 'seed-pr-interland',
      title: 'Interland: Cidadania & Segurança na Internet',
      source: 'SEED-PR (Escola Digital Paraná)',
      category: 'Cidadania Digital',
      grade: 'Todos os Segmentos',
      bncc: 'Competência Geral 5 (Cultura Digital)',
      type: 'Mundo Virtual Público',
      description: 'Navegação segura, proteção de senhas, combate ao cyberbullying e privacidade digital sem anúncios comerciais.',
      url: 'https://aluno.escoladigital.pr.gov.br/games',
    },
  ];

  // Default seed playlists
  const defaultPlaylists: PedagogicalPlaylist[] = [
    {
      id: 'pl-1em-eletroquimica',
      classId: 'class-1em-a',
      className: '1º EM A',
      subject: 'Química & Física',
      title: 'Trilha Experimental: A Pilha de Daniell e Energia Sustentável',
      description: 'Sequência em 5 etapas baseada no modelo Legends of Learning / LiveBinders: introdução lógica, laboratório interativo, checagem e avaliação com leitura ótica OMR.',
      bnccCodes: ['EM13CNT102', 'EM13CNT308'],
      coinReward: 30,
      badgeId: 'badge-electro-01',
      badgeName: 'Eletroquímico de Elite',
      status: 'active',
      stages: [
        {
          id: 'stg-1',
          type: 'warmup',
          title: 'Etapa 1: Aquecimento Lógico (5 min)',
          durationMinutes: 5,
          toolOrGame: 'Balança Algébrica de Elétrons (Coquinhos)',
          description: 'Desafio rápido de 5 minutos: equilibrar a perda e ganho de elétrons nos polos metálicos.',
          bnccCode: 'EM13CNT102',
        },
        {
          id: 'stg-2',
          type: 'simulation',
          title: 'Etapa 2: Laboratório Virtual Interativo (15 min)',
          durationMinutes: 15,
          toolOrGame: 'Simulador Pilha de Daniell (NOAS / PhET)',
          description: 'Os alunos manipulam a concentração de sulfato de cobre/zinco e medem a força eletromotriz (fem).',
          bnccCode: 'EM13CNT102',
        },
        {
          id: 'stg-3',
          type: 'checkpoint',
          title: 'Etapa 3: Checkpoint Diagnóstico em Duplas (10 min)',
          durationMinutes: 10,
          toolOrGame: 'Checkpoint Áquila Pro',
          description: 'Perguntas conceituais de transição com feedback imediato nos tablets ou lousa.',
          checkpointQuestions: [
            {
              question: 'Qual eletrodo sofre oxidação e perde massa durante o funcionamento da Pilha de Daniell?',
              options: ['Ânodo de Zinco (Zn)', 'Cátodo de Cobre (Cu)', 'Ponte Salina', 'Solução Eletrolítica'],
              answerIndex: 0,
            },
            {
              question: 'Qual a função principal da ponte salina na pilha?',
              options: ['Gerar eletricidade extra', 'Manter a neutralidade elétrica das meias-células', 'Impedir a corrente elétrica', 'Aquecer os eletrodos'],
              answerIndex: 1,
            },
          ],
        },
        {
          id: 'stg-4',
          type: 'exit_ticket',
          title: 'Etapa 4: Exit Ticket OMR (10 min)',
          durationMinutes: 10,
          toolOrGame: 'Folha OMR Determinística (GradingService)',
          description: 'Aplicação de folha impressa de 3 questões corrigidas instantaneamente por leitura ótica sem mocks.',
          bnccCode: 'EM13CNT308',
        },
        {
          id: 'stg-5',
          type: 'debriefing',
          title: 'Etapa 5: Roteiro de Debriefing Coletivo (10 min)',
          durationMinutes: 10,
          toolOrGame: 'Roda de Conversa Guiada (LiveBinder #1568005)',
          description: 'O professor lidera o fechamento conceitual com as perguntas orientadoras.',
          debriefingGuidingQuestions: [
            'Como a energia química se transformou espontaneamente em energia elétrica na simulação?',
            'Quais os paralelos entre a Pilha de Daniell e as baterias modernas de carros elétricos e celulares?',
          ],
        },
      ],
    },
    {
      id: 'pl-9a-osmose',
      classId: 'class-9a',
      className: '9º Ano A',
      subject: 'Ciências da Natureza',
      title: 'Expedição Celular: Aprendendo por Osmose e Mebranas',
      description: 'Trilha gamificada sobre transporte passivo através da membrana plasmática, hemólise e plasmólise vegetal.',
      bnccCodes: ['EF09CI01', 'EF09CI03'],
      coinReward: 25,
      badgeId: 'badge-cell-01',
      badgeName: 'Biólogo Celular',
      status: 'active',
      stages: [
        {
          id: 'stg-9a-1',
          type: 'warmup',
          title: 'Etapa 1: Aquecimento Iconográfico (5 min)',
          durationMinutes: 5,
          toolOrGame: 'Modelos 3D Celulares (NOAS Cell Model)',
          description: 'Identificação rápida da membrana fosfolipídica e parede celular.',
        },
        {
          id: 'stg-9a-2',
          type: 'simulation',
          title: 'Etapa 2: Simulação de Concentração (15 min)',
          durationMinutes: 15,
          toolOrGame: 'Simulador de Osmose (NOAS / PhET)',
          description: 'Testar células em soluções hipertônicas, isotônicas e hipotônicas.',
        },
        {
          id: 'stg-9a-3',
          type: 'checkpoint',
          title: 'Etapa 3: Desafio em Pares (10 min)',
          durationMinutes: 10,
          toolOrGame: 'Mesa de Seating Intelligence',
          description: 'Duplas debatem o que ocorre com o glóbulo vermelho em água pura.',
        },
        {
          id: 'stg-9a-4',
          type: 'exit_ticket',
          title: 'Etapa 4: Ticket de Saída (10 min)',
          durationMinutes: 10,
          toolOrGame: 'Quiz Rápido Áquila Pro',
          description: '2 perguntas objetivas para consolidação de presença e aprendizagem.',
        },
        {
          id: 'stg-9a-5',
          type: 'debriefing',
          title: 'Etapa 5: Fechamento Docente (10 min)',
          durationMinutes: 10,
          toolOrGame: 'Debriefing Guiado',
          description: 'Discussão sobre preservação de alimentos com sal e desidratação celular.',
        },
      ],
    },
  ];

  // Default seed Game Maker Templates
  const defaultGameTemplates: GameMakerTemplate[] = [
    {
      id: 'tpl-historia-fato-fake',
      title: 'Fato ou Fake? História do Brasil & Iconografia',
      gameType: 'fact_or_fake',
      subject: 'História',
      bnccCodes: ['EF08HI11', 'Lei 10.639/03'],
      config: {
        instructions: 'Os alunos atuam como historiadores e julgam se as assertivas são fatos comprovados por fontes ou mitos.',
        items: [
          {
            id: 'it-1',
            statement: 'A tela "Independência ou Morte" retrata exatamente a posição física e os uniformes de D. Pedro I e sua guarda em 1822.',
            isFact: false,
            explanation: 'Mito histórico: a pintura foi encomendada 66 anos depois; D. Pedro viajava com mulas e trajes rústicos para enfrentar os morros da Serra do Mar.',
          },
          {
            id: 'it-2',
            statement: 'O gravurista Jean-Baptiste Debret retratou em minúcias a violência da escravidão doméstica e a economia canavieira colonial.',
            isFact: true,
            explanation: 'Fato: as obras "Um Jantar Brasileiro" e "Engenho Manual" são documentos visuais indispensáveis para entender a sociedade oitocentista.',
          },
          {
            id: 'it-3',
            statement: 'A Lei 10.639/03 torna facultativo às escolas privadas o ensino da história e cultura afro-brasileira.',
            isFact: false,
            explanation: 'Mito: a Lei é mandatória para toda a rede pública e privada de ensino básico no Brasil (LDB Art. 26-A).',
          },
        ],
      },
    },
    {
      id: 'tpl-matematica-balanca',
      title: 'Balança Algébrica: Resolução Visual de Incógnitas',
      gameType: 'algebra_balance',
      subject: 'Matemática',
      bnccCodes: ['EF08MA06', 'EF09MA08'],
      config: {
        instructions: 'Os alunos equilibram os dois pratos da balança para isolar a variável X sem decorar regras mecânicas.',
        items: [
          {
            id: 'it-m1',
            statement: 'Nível 1: 2X + 4 = 10',
            correctAnswer: 'X = 3',
            explanation: 'Subtraia 4 de ambos os pratos (2X = 6) e divida por 2.',
          },
          {
            id: 'it-m2',
            statement: 'Nível 2: 3X + 7 = X + 15',
            correctAnswer: 'X = 4',
            explanation: 'Remova 1X e 7 unidades de cada lado (2X = 8).',
          },
        ],
      },
    },
  ];

  // Load playlists and templates from backend or initialize with seeds
  useEffect(() => {
    const loadData = async () => {
      try {
        if ((window as any).aquila?.playlists?.list) {
          const list = await (window as any).aquila.playlists.list(selectedClass);
          if (list && list.length > 0) {
            setPlaylists(list);
          } else {
            setPlaylists(defaultPlaylists.filter(p => p.classId === selectedClass || selectedClass === 'all'));
          }
        } else {
          setPlaylists(defaultPlaylists.filter(p => p.classId === selectedClass || selectedClass === 'all'));
        }

        if ((window as any).aquila?.gameMaker?.listTemplates) {
          const tpls = await (window as any).aquila.gameMaker.listTemplates();
          if (tpls && tpls.length > 0) {
            setGameTemplates(tpls);
          } else {
            setGameTemplates(defaultGameTemplates);
          }
        } else {
          setGameTemplates(defaultGameTemplates);
        }
      } catch (err) {
        console.warn('[PlaylistsManager] Usando acervo padrão local:', err);
        setPlaylists(defaultPlaylists.filter(p => p.classId === selectedClass || selectedClass === 'all'));
        setGameTemplates(defaultGameTemplates);
      }
    };
    loadData();
  }, [selectedClass]);

  // Timer logic for Live Class Mode
  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning && liveTimerSeconds > 0) {
      interval = setInterval(() => {
        setLiveTimerSeconds(prev => prev - 1);
      }, 1000);
    } else if (liveTimerSeconds === 0 && isTimerRunning) {
      setIsTimerRunning(false);
      showToast('Tempo da etapa encerrado! Transição para a próxima fase recomendada.', 'info');
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, liveTimerSeconds]);

  const handleCreatePlaylist = async () => {
    if (!newTitle.trim()) {
      showToast('Informe o título da playlist pedagógica.', 'error');
      return;
    }

    const playlist: PedagogicalPlaylist = {
      id: `pl-${Date.now()}`,
      teacherId: user?.id || 'prof_carlos',
      classId: selectedClass,
      className: selectedClass === 'class-1em-a' ? '1º EM A' : '9º Ano A',
      subject: newSubject,
      title: newTitle,
      description: newDescription || 'Sequência pedagógica estruturada com simuladores e desafios.',
      bnccCodes: newBnccCodes.split(',').map(s => s.trim()).filter(Boolean),
      coinReward: newCoinReward,
      badgeName: newBadgeName,
      status: 'active',
      stages: [
        {
          id: `stg-${Date.now()}-1`,
          type: 'warmup',
          title: 'Etapa 1: Aquecimento Lógico (5 min)',
          durationMinutes: 5,
          toolOrGame: 'Desafio Rápido no StudentPortal',
          description: 'Ativação de atenção e acolhimento dos estudantes na chegada à sala.',
        },
        {
          id: `stg-${Date.now()}-2`,
          type: 'simulation',
          title: 'Etapa 2: Investigação Científica & Simulação (15 min)',
          durationMinutes: 15,
          toolOrGame: 'Simulador Virtual Homologado',
          description: 'Manipulação de variáveis e observação de fenômenos em tempo real.',
        },
        {
          id: `stg-${Date.now()}-3`,
          type: 'checkpoint',
          title: 'Etapa 3: Checkpoint Diagnóstico em Duplas (10 min)',
          durationMinutes: 10,
          toolOrGame: 'Seating Intelligence & Quiz',
          description: 'Discussão colaborativa para checagem imediata de compreensão.',
        },
        {
          id: `stg-${Date.now()}-4`,
          type: 'exit_ticket',
          title: 'Etapa 4: Exit Ticket / Avaliação Somativa (10 min)',
          durationMinutes: 10,
          toolOrGame: 'Avaliação OMR Determinística ou Quiz Digital',
          description: 'Registro de evidência formativa no SQLite escolar.',
        },
        {
          id: `stg-${Date.now()}-5`,
          type: 'debriefing',
          title: 'Etapa 5: Roteiro de Debriefing Coletivo (10 min)',
          durationMinutes: 10,
          toolOrGame: 'Roda de Conversa Guiada (Princípio LiveBinders)',
          description: 'Perguntas orientadoras para fechamento conceitual com a turma.',
        },
      ],
    };

    try {
      if ((window as any).aquila?.playlists?.save) {
        await (window as any).aquila.playlists.save(playlist);
      }
      setPlaylists(prev => [playlist, ...prev]);
      setIsCreatingPlaylist(false);
      setNewTitle('');
      setNewDescription('');
      showToast(`Playlist '${playlist.title}' criada e vinculada à turma!`);
    } catch (err) {
      console.error('Erro ao salvar playlist:', err);
      showToast('Erro ao salvar no banco local.', 'error');
    }
  };

  const handleStartLiveClass = (playlist: PedagogicalPlaylist) => {
    setSelectedPlaylist(playlist);
    setLiveStageIndex(0);
    setLiveTimerSeconds((playlist.stages[0]?.durationMinutes || 5) * 60);
    setIsTimerRunning(false);
    setActiveTab('live');
    showToast(`Sessão da Playlist '${playlist.title}' iniciada em Modo Sala!`);
  };

  const handleNextLiveStage = () => {
    if (!selectedPlaylist) return;
    if (liveStageIndex < selectedPlaylist.stages.length - 1) {
      const nextIndex = liveStageIndex + 1;
      setLiveStageIndex(nextIndex);
      setLiveTimerSeconds((selectedPlaylist.stages[nextIndex]?.durationMinutes || 10) * 60);
      setIsTimerRunning(false);
    } else {
      showToast('Parabéns! Todas as etapas da Playlist foram concluídas!', 'success');
    }
  };

  const handleAddCatalogToPlaylist = (catalogItem: any) => {
    setNewTitle(`Trilha Integrada: ${catalogItem.title}`);
    setNewSubject(catalogItem.category);
    setNewDescription(catalogItem.description);
    setNewBnccCodes(catalogItem.bncc);
    setIsCreatingPlaylist(true);
    setActiveTab('playlists');
    showToast(`Simulador '${catalogItem.title}' pré-carregado no Criador de Playlists!`);
  };

  const handleCreateGameTemplate = async () => {
    if (!newGameTitle.trim()) {
      showToast('Informe o título do jogo.', 'error');
      return;
    }

    const template: GameMakerTemplate = {
      id: `tpl-${Date.now()}`,
      title: newGameTitle,
      gameType: newGameType,
      subject: newGameSubject,
      bnccCodes: newGameBncc.split(',').map(s => s.trim()).filter(Boolean),
      config: {
        instructions: newGameInstructions,
        items: gameItemsList.map((item, idx) => ({
          id: `item-${idx}`,
          statement: item.statement,
          isFact: item.isFact,
          explanation: item.explanation,
        })),
      },
    };

    try {
      if ((window as any).aquila?.gameMaker?.saveTemplate) {
        await (window as any).aquila.gameMaker.saveTemplate(template);
      }
      setGameTemplates(prev => [template, ...prev]);
      setIsCreatingGame(false);
      setNewGameTitle('');
      showToast(`Jogo '${template.title}' publicado no Game Maker Studio!`);
    } catch (err) {
      console.error('Erro ao salvar template:', err);
      showToast('Erro ao gravar jogo.', 'error');
    }
  };

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="tp-playlists-manager" style={{ padding: '24px', color: '#E2E8F0', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Toast Notification */}
      {notification && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 9999,
          background: notification.type === 'error' ? '#EF4444' : notification.type === 'info' ? '#3B82F6' : '#10B981',
          color: '#FFF',
          padding: '12px 20px',
          borderRadius: '8px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <CheckCircle2 size={16} />
          <span>{notification.message}</span>
        </div>
      )}

      {/* Header with Navigation and Concept Badge */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {onBack && (
            <button
              onClick={onBack}
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#CBD5E1',
                padding: '8px 14px',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '13px'
              }}
            >
              <ArrowLeft size={14} />
              <span>Voltar ao Cockpit</span>
            </button>
          )}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#00F0FF', letterSpacing: '1px', textTransform: 'uppercase', background: 'rgba(0, 240, 255, 0.1)', padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(0, 240, 255, 0.2)' }}>
                ARQUITETURA GBL • LEGENDS OF LEARNING & LIVEBINDERS
              </span>
            </div>
            <h1 style={{ fontSize: '22px', fontWeight: 700, margin: '4px 0 0 0', color: '#F8FAFC' }}>
              Playlists Pedagógicas & Game Maker Studio
            </h1>
          </div>
        </div>

        {/* Class Filter Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '12px', color: '#94A3B8' }}>Turma Alvo:</span>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            style={{
              background: '#0F172A',
              border: '1px solid rgba(59, 130, 246, 0.4)',
              color: '#38BDF8',
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 600,
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="class-1em-a">1º EM A (Homologação H-01)</option>
            <option value="class-9a">9º Ano A (Ensino Fundamental)</option>
            <option value="all">Todas as Turmas Vinculadas</option>
          </select>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px', marginBottom: '24px' }}>
        <button
          onClick={() => setActiveTab('playlists')}
          style={{
            background: activeTab === 'playlists' ? 'rgba(59, 130, 246, 0.18)' : 'transparent',
            border: activeTab === 'playlists' ? '1px solid #3B82F6' : '1px solid transparent',
            color: activeTab === 'playlists' ? '#60A5FA' : '#94A3B8',
            padding: '8px 16px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Layers size={14} />
          <span>Playlists da Turma ({playlists.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('gamemaker')}
          style={{
            background: activeTab === 'gamemaker' ? 'rgba(16, 185, 129, 0.18)' : 'transparent',
            border: activeTab === 'gamemaker' ? '1px solid #10B981' : '1px solid transparent',
            color: activeTab === 'gamemaker' ? '#34D399' : '#94A3B8',
            padding: '8px 16px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Gamepad2 size={14} />
          <span>Game Maker Studio ({gameTemplates.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('catalog')}
          style={{
            background: activeTab === 'catalog' ? 'rgba(0, 240, 255, 0.15)' : 'transparent',
            border: activeTab === 'catalog' ? '1px solid #00F0FF' : '1px solid transparent',
            color: activeTab === 'catalog' ? '#00F0FF' : '#94A3B8',
            padding: '8px 16px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Compass size={14} />
          <span>Acervo de Simuladores & Desafios ({curatedCatalog.length})</span>
        </button>

        {selectedPlaylist && (
          <button
            onClick={() => setActiveTab('live')}
            style={{
              background: activeTab === 'live' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(245, 158, 11, 0.08)',
              border: '1px solid #F59E0B',
              color: '#FBBF24',
              padding: '8px 16px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginLeft: 'auto'
            }}
          >
            <Play size={14} fill="#FBBF24" />
            <span>Sessão ao Vivo na Sala (Em Andamento)</span>
          </button>
        )}
      </div>

      {/* TAB 1: PLAYLISTS PEDAGÓGICAS */}
      {activeTab === 'playlists' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <p style={{ margin: 0, fontSize: '14px', color: '#94A3B8' }}>
              Sequenciamento estruturado de aula em 5 atos: <strong>Aquecimento $\to$ Simulação $\to$ Checkpoint $\to$ Exit Ticket $\to$ Debriefing</strong>.
            </p>
            <button
              onClick={() => setIsCreatingPlaylist(!isCreatingPlaylist)}
              style={{
                background: '#2563EB',
                border: 'none',
                color: '#FFF',
                padding: '8px 16px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Plus size={15} />
              <span>{isCreatingPlaylist ? 'Fechar Formulário' : 'Nova Playlist da Aula'}</span>
            </button>
          </div>

          {/* Form Create Playlist */}
          {isCreatingPlaylist && (
            <div style={{ background: '#0F172A', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#60A5FA', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Layers size={16} />
                <span>Montar Nova Trilha Sequencial de Aula</span>
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#94A3B8', marginBottom: '4px' }}>Título da Playlist / Tema da Aula:</label>
                  <input
                    type="text"
                    placeholder="Ex: Eletroquímica, Força Gravitacional, Revolução Francesa..."
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', background: '#1E293B', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#FFF' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#94A3B8', marginBottom: '4px' }}>Disciplina / Área:</label>
                  <input
                    type="text"
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', background: '#1E293B', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#FFF' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#94A3B8', marginBottom: '4px' }}>Códigos BNCC (separados por vírgula):</label>
                  <input
                    type="text"
                    value={newBnccCodes}
                    onChange={(e) => setNewBnccCodes(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', background: '#1E293B', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#FFF' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#94A3B8', marginBottom: '4px' }}>Nome da Insígnia Concedida ao Aluno:</label>
                  <input
                    type="text"
                    value={newBadgeName}
                    onChange={(e) => setNewBadgeName(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', background: '#1E293B', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#FFF' }}
                  />
                </div>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#94A3B8', marginBottom: '4px' }}>Objetivo Pedagógico / Descrição Breve:</label>
                <textarea
                  rows={2}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Orientações e metas de aprendizagem esperadas para o término da sessão."
                  style={{ width: '100%', padding: '8px 12px', background: '#1E293B', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#FFF' }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  onClick={() => setIsCreatingPlaylist(false)}
                  style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: '#CBD5E1', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreatePlaylist}
                  style={{ background: '#10B981', border: 'none', color: '#FFF', padding: '8px 20px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
                >
                  Salvar Trilha no Banco
                </button>
              </div>
            </div>
          )}

          {/* List of Playlists */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: '20px' }}>
            {playlists.map((pl) => (
              <div
                key={pl.id}
                style={{
                  background: 'rgba(15, 23, 42, 0.75)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '12px',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.2)'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#38BDF8', background: 'rgba(56, 189, 248, 0.1)', padding: '2px 8px', borderRadius: '4px' }}>
                      {pl.subject} • {pl.className || pl.classId}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#FBBF24', fontWeight: 600 }}>
                      <Coins size={14} />
                      <span>+{pl.coinReward} coins</span>
                    </div>
                  </div>

                  <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '4px 0 8px 0', color: '#F1F5F9' }}>
                    {pl.title}
                  </h3>
                  <p style={{ fontSize: '13px', color: '#94A3B8', margin: '0 0 12px 0', lineHeight: 1.4 }}>
                    {pl.description}
                  </p>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '16px' }}>
                    {pl.bnccCodes?.map((code, idx) => (
                      <span key={idx} style={{ fontSize: '10px', background: 'rgba(255,255,255,0.06)', color: '#CBD5E1', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.08)' }}>
                        {code}
                      </span>
                    ))}
                  </div>

                  {/* 5 Stages Sequence Pill Bar */}
                  <div style={{ background: '#090D16', borderRadius: '8px', padding: '10px', marginBottom: '16px', border: '1px solid rgba(255,255,255,0.04)' }}>
                    <span style={{ fontSize: '11px', color: '#64748B', display: 'block', marginBottom: '6px', fontWeight: 600 }}>
                      ROTEIRO PEDAGÓGICO EM 5 ATOS ({pl.stages?.length || 5} ETAPAS):
                    </span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {pl.stages?.map((stg, sIdx) => (
                        <div key={stg.id || sIdx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', color: '#CBD5E1' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ width: '16px', height: '16px', borderRadius: '50%', background: 'rgba(59, 130, 246, 0.2)', color: '#60A5FA', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700 }}>
                              {sIdx + 1}
                            </span>
                            <span>{stg.title}</span>
                          </span>
                          <span style={{ color: '#64748B', fontSize: '10px' }}>{stg.durationMinutes} min</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '14px' }}>
                  <button
                    onClick={() => handleStartLiveClass(pl)}
                    style={{
                      flex: 1,
                      background: '#2563EB',
                      border: 'none',
                      color: '#FFF',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      fontSize: '12px'
                    }}
                  >
                    <Play size={13} fill="#FFF" />
                    <span>Lançar na Sala</span>
                  </button>
                  <button
                    onClick={() => {
                      setSelectedPlaylist(pl);
                      setActiveTab('live');
                    }}
                    style={{
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: '#E2E8F0',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    Ver Detalhes
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: GAME MAKER STUDIO */}
      {activeTab === 'gamemaker' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <p style={{ margin: '0 0 4px 0', fontSize: '14px', color: '#94A3B8' }}>
                Estúdio de autoria docente inspirado no LiveBinder #1568005 (*ClassTools, JeopardyLabs, Quia*): crie jogos pedagógicos personalizados em minutos.
              </p>
            </div>
            <button
              onClick={() => setIsCreatingGame(!isCreatingGame)}
              style={{
                background: '#10B981',
                border: 'none',
                color: '#FFF',
                padding: '8px 16px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Plus size={15} />
              <span>{isCreatingGame ? 'Fechar Estúdio' : 'Criar Novo Jogo / Desafio'}</span>
            </button>
          </div>

          {/* Form Create Game */}
          {isCreatingGame && (
            <div style={{ background: '#0F172A', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#34D399', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Gamepad2 size={16} />
                <span>Configurar Novo Jogo Pedagógico</span>
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#94A3B8', marginBottom: '4px' }}>Nome do Jogo:</label>
                  <input
                    type="text"
                    placeholder="Ex: Fato ou Fake dos Biomas..."
                    value={newGameTitle}
                    onChange={(e) => setNewGameTitle(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', background: '#1E293B', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#FFF' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#94A3B8', marginBottom: '4px' }}>Mecânica do Jogo:</label>
                  <select
                    value={newGameType}
                    onChange={(e: any) => setNewGameType(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', background: '#1E293B', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#34D399', fontWeight: 600 }}
                  >
                    <option value="fact_or_fake">Fato ou Fake? (Investigação Crítica)</option>
                    <option value="algebra_balance">Balança Algébrica (Equilíbrio de Incógnitas)</option>
                    <option value="icon_memory">Memória Iconográfica / Fontes</option>
                    <option value="quiz_show">Quiz Show em Equipes (Estilo Jeopardy)</option>
                    <option value="bingo">Bingo Conceitual de Iluminuras / Termos</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#94A3B8', marginBottom: '4px' }}>Disciplina & BNCC:</label>
                  <input
                    type="text"
                    value={newGameBncc}
                    onChange={(e) => setNewGameBncc(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', background: '#1E293B', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#FFF' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#94A3B8', marginBottom: '4px' }}>Instruções para o Estudante:</label>
                <input
                  type="text"
                  value={newGameInstructions}
                  onChange={(e) => setNewGameInstructions(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', background: '#1E293B', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#FFF' }}
                />
              </div>

              {/* Items / Questions Editor */}
              <div style={{ background: '#090D16', padding: '14px', borderRadius: '8px', marginBottom: '16px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#CBD5E1', display: 'block', marginBottom: '8px' }}>
                  Itens / Assertivas do Jogo ({gameItemsList.length} itens cadastrados):
                </span>
                {gameItemsList.map((item, idx) => (
                  <div key={idx} style={{ background: '#1E293B', padding: '10px', borderRadius: '6px', marginBottom: '8px', fontSize: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ color: item.isFact ? '#34D399' : '#F87171', fontWeight: 700 }}>
                        {item.isFact ? '✓ VERDADEIRO / FATO' : '✗ FALSO / MITO'}
                      </span>
                      <span style={{ color: '#64748B' }}>Item #{idx + 1}</span>
                    </div>
                    <div style={{ color: '#E2E8F0', marginBottom: '4px' }}>{item.statement}</div>
                    <div style={{ color: '#94A3B8', fontSize: '11px', fontStyle: 'italic' }}>Explicação: {item.explanation}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  onClick={() => setIsCreatingGame(false)}
                  style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: '#CBD5E1', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateGameTemplate}
                  style={{ background: '#10B981', border: 'none', color: '#FFF', padding: '8px 20px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
                >
                  Publicar Jogo no Acervo
                </button>
              </div>
            </div>
          )}

          {/* List of Game Maker Templates */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '20px' }}>
            {gameTemplates.map((tpl) => (
              <div
                key={tpl.id}
                style={{
                  background: 'rgba(15, 23, 42, 0.75)',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                  borderRadius: '12px',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.2)'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#34D399', background: 'rgba(16, 185, 129, 0.1)', padding: '2px 8px', borderRadius: '4px' }}>
                      {tpl.gameType.toUpperCase().replace(/_/g, ' ')}
                    </span>
                    <span style={{ fontSize: '11px', color: '#94A3B8' }}>{tpl.subject}</span>
                  </div>

                  <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '4px 0 8px 0', color: '#F1F5F9' }}>
                    {tpl.title}
                  </h3>
                  <p style={{ fontSize: '13px', color: '#94A3B8', margin: '0 0 12px 0' }}>
                    {tpl.config?.instructions}
                  </p>

                  <div style={{ background: '#090D16', padding: '10px', borderRadius: '8px', marginBottom: '14px' }}>
                    <span style={{ fontSize: '11px', color: '#64748B', display: 'block', marginBottom: '4px' }}>
                      ITENS EMBUTIDOS ({tpl.config?.items?.length || 0}):
                    </span>
                    <div style={{ fontSize: '11px', color: '#CBD5E1' }}>
                      {tpl.config?.items?.[0]?.statement?.substring(0, 90)}...
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => {
                      showToast(`Jogo '${tpl.title}' acionado para projeção ou aplicativo dos estudantes!`);
                    }}
                    style={{
                      flex: 1,
                      background: '#059669',
                      border: 'none',
                      color: '#FFF',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <Play size={13} fill="#FFF" />
                    <span>Jogar com a Turma</span>
                  </button>
                  <button
                    onClick={() => {
                      showToast(`Template duplicado no editor de autoria.`);
                    }}
                    style={{
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: '#CBD5E1',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    <Edit3 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: ACERVO CURADO DE SIMULADORES */}
      {activeTab === 'catalog' && (
        <div>
          <p style={{ margin: '0 0 20px 0', fontSize: '14px', color: '#94A3B8' }}>
            Repositório de objetos de aprendizagem significante, laboratórios virtuais e simulações homologadas (NOAS, NOAA, Escola Games, Ensinar História, Coquinhos).
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '20px' }}>
            {curatedCatalog.map((item) => (
              <div
                key={item.id}
                style={{
                  background: 'rgba(15, 23, 42, 0.75)',
                  border: '1px solid rgba(0, 240, 255, 0.2)',
                  borderRadius: '12px',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.2)'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#00F0FF', background: 'rgba(0, 240, 255, 0.1)', padding: '2px 8px', borderRadius: '4px' }}>
                      {item.source}
                    </span>
                    <span style={{ fontSize: '11px', color: '#94A3B8' }}>{item.grade}</span>
                  </div>

                  <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '4px 0 8px 0', color: '#F1F5F9' }}>
                    {item.title}
                  </h3>
                  <p style={{ fontSize: '13px', color: '#94A3B8', margin: '0 0 12px 0', lineHeight: 1.4 }}>
                    {item.description}
                  </p>

                  <div style={{ marginBottom: '14px' }}>
                    <span style={{ fontSize: '11px', color: '#64748B', display: 'block', marginBottom: '4px' }}>BNCC:</span>
                    <span style={{ fontSize: '11px', background: 'rgba(255,255,255,0.06)', color: '#38BDF8', padding: '2px 6px', borderRadius: '4px' }}>
                      {item.bncc}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '14px' }}>
                  <button
                    onClick={() => handleAddCatalogToPlaylist(item)}
                    style={{
                      flex: 1,
                      background: '#0284C7',
                      border: 'none',
                      color: '#FFF',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <Plus size={13} />
                    <span>Adicionar à Playlist</span>
                  </button>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: '#CBD5E1',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <ExternalLink size={13} />
                    <span>Abrir Fonte</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: MODO SALA AO VIVO (LIVE CLASSROOM SESSION) */}
      {activeTab === 'live' && selectedPlaylist && (
        <div style={{ background: '#090D16', border: '1px solid #F59E0B', borderRadius: '16px', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '16px', marginBottom: '20px' }}>
            <div>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#F59E0B', background: 'rgba(245, 158, 11, 0.1)', padding: '2px 8px', borderRadius: '4px' }}>
                SESSÃO PROJETOR / PAINEL DA SALA • TURMA {selectedPlaylist.className || selectedPlaylist.classId}
              </span>
              <h2 style={{ fontSize: '20px', fontWeight: 700, margin: '6px 0 0 0', color: '#FFF' }}>
                {selectedPlaylist.title}
              </h2>
            </div>

            {/* Stage Timer Widget */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ background: '#1E293B', padding: '8px 16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', textAlign: 'center' }}>
                <span style={{ fontSize: '10px', color: '#94A3B8', display: 'block' }}>TEMPO DA ETAPA:</span>
                <span style={{ fontSize: '22px', fontWeight: 800, fontFamily: 'monospace', color: liveTimerSeconds < 60 ? '#EF4444' : '#38BDF8' }}>
                  {formatTimer(liveTimerSeconds)}
                </span>
              </div>
              <button
                onClick={() => setIsTimerRunning(!isTimerRunning)}
                style={{
                  background: isTimerRunning ? '#DC2626' : '#10B981',
                  border: 'none',
                  color: '#FFF',
                  padding: '10px 16px',
                  borderRadius: '8px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontSize: '13px'
                }}
              >
                {isTimerRunning ? 'Pausar' : 'Iniciar Tempo'}
              </button>
            </div>
          </div>

          {/* Stepper Header (5 Stages) */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', overflowX: 'auto', paddingBottom: '6px' }}>
            {selectedPlaylist.stages?.map((stg, idx) => (
              <div
                key={stg.id || idx}
                onClick={() => {
                  setLiveStageIndex(idx);
                  setLiveTimerSeconds((stg.durationMinutes || 10) * 60);
                  setIsTimerRunning(false);
                }}
                style={{
                  flex: 1,
                  minWidth: '160px',
                  padding: '10px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  background: liveStageIndex === idx ? 'rgba(59, 130, 246, 0.25)' : idx < liveStageIndex ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.04)',
                  border: liveStageIndex === idx ? '1px solid #3B82F6' : idx < liveStageIndex ? '1px solid #10B981' : '1px solid rgba(255,255,255,0.06)',
                  color: liveStageIndex === idx ? '#93C5FD' : idx < liveStageIndex ? '#34D399' : '#64748B'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 700, marginBottom: '2px' }}>
                  {idx < liveStageIndex ? <Check size={12} color="#10B981" /> : <span>#{idx + 1}</span>}
                  <span>{stg.type.toUpperCase()}</span>
                </div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#E2E8F0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {stg.title}
                </div>
              </div>
            ))}
          </div>

          {/* Active Stage Content Card */}
          {selectedPlaylist.stages?.[liveStageIndex] && (
            <div style={{ background: '#0F172A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div>
                  <span style={{ fontSize: '12px', color: '#38BDF8', fontWeight: 700 }}>
                    ETAPA {liveStageIndex + 1} DE {selectedPlaylist.stages.length} • {selectedPlaylist.stages[liveStageIndex].durationMinutes} MINUTOS
                  </span>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '4px 0', color: '#FFF' }}>
                    {selectedPlaylist.stages[liveStageIndex].title}
                  </h3>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.06)', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', color: '#CBD5E1' }}>
                  Ferramenta / Objeto: <strong>{selectedPlaylist.stages[liveStageIndex].toolOrGame}</strong>
                </div>
              </div>

              <p style={{ fontSize: '14px', color: '#CBD5E1', lineHeight: 1.5, marginBottom: '20px' }}>
                {selectedPlaylist.stages[liveStageIndex].description}
              </p>

              {/* Special content depending on stage type */}
              {selectedPlaylist.stages[liveStageIndex].checkpointQuestions && (
                <div style={{ background: '#1E293B', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '13px', color: '#FBBF24', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <HelpCircle size={15} />
                    <span>Questões de Checkpoint Rápido (Projeção na Sala):</span>
                  </h4>
                  {selectedPlaylist.stages[liveStageIndex].checkpointQuestions?.map((q, qIdx) => (
                    <div key={qIdx} style={{ marginBottom: '12px' }}>
                      <p style={{ fontSize: '13px', fontWeight: 600, color: '#FFF', margin: '0 0 6px 0' }}>{qIdx + 1}. {q.question}</p>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        {q.options.map((opt, oIdx) => (
                          <div
                            key={oIdx}
                            style={{
                              padding: '8px 12px',
                              borderRadius: '6px',
                              fontSize: '12px',
                              background: oIdx === q.answerIndex ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.05)',
                              border: oIdx === q.answerIndex ? '1px solid #10B981' : '1px solid rgba(255,255,255,0.08)',
                              color: oIdx === q.answerIndex ? '#34D399' : '#CBD5E1'
                            }}
                          >
                            {opt} {oIdx === q.answerIndex && '✓ (Gabarito)'}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {selectedPlaylist.stages[liveStageIndex].debriefingGuidingQuestions && (
                <div style={{ background: '#1E293B', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
                  <h4 style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#38BDF8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Lightbulb size={15} />
                    <span>Roteiro de Debriefing Guiado (Perguntas para a Roda de Fechamento):</span>
                  </h4>
                  <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#CBD5E1', lineHeight: 1.6 }}>
                    {selectedPlaylist.stages[liveStageIndex].debriefingGuidingQuestions?.map((gq, gIdx) => (
                      <li key={gIdx} style={{ marginBottom: '6px' }}>{gq}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Progress and Coin Rewards */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#FBBF24', fontSize: '13px', fontWeight: 600 }}>
                    <Award size={16} />
                    <span>Recompensa da Trilha: {selectedPlaylist.badgeName}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#34D399', fontSize: '13px', fontWeight: 600 }}>
                    <Coins size={15} />
                    <span>+{selectedPlaylist.coinReward} sovereignCoins por aluno presente</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => {
                      showToast(`Moedas (+${selectedPlaylist.coinReward}) e Insígnia '${selectedPlaylist.badgeName}' registradas para a turma!`, 'success');
                    }}
                    style={{
                      background: 'rgba(16, 185, 129, 0.2)',
                      border: '1px solid #10B981',
                      color: '#34D399',
                      padding: '8px 16px',
                      borderRadius: '6px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <Award size={14} />
                    <span>Conceder Conquistas à Turma</span>
                  </button>

                  <button
                    onClick={handleNextLiveStage}
                    style={{
                      background: '#2563EB',
                      border: 'none',
                      color: '#FFF',
                      padding: '8px 20px',
                      borderRadius: '6px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <span>{liveStageIndex < selectedPlaylist.stages.length - 1 ? 'Avançar Próxima Etapa' : 'Concluir Playlist'}</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
export default PedagogicalPlaylistsManager;
