import React, { useState, useMemo } from 'react';
import {
  Brain,
  CheckCircle2,
  Lock,
  Sparkles,
  Award,
  Zap,
  Target,
  Search,
  BookOpen,
  Filter,
  ArrowRight,
  TrendingUp,
  X,
  Play,
  Share2,
  Atom,
  Flame
} from 'lucide-react';
import { TRI_ITEM_BANK, TriQuestion } from '../utils/triItemBank';
import './BNCCSkillTree.css';

export type BNCCArea = 'todas' | 'matematica' | 'natureza' | 'linguagens' | 'humanas';
export type SkillStatus = 'all' | 'mastered' | 'in_progress' | 'locked';
export type SkillLevel = 'fundamentos' | 'intermediario' | 'avancado' | 'mestre';

export interface BNCCSkillNode {
  id: string;
  code: string;
  area: 'matematica' | 'natureza' | 'linguagens' | 'humanas';
  discipline: string;
  title: string;
  description: string;
  level: SkillLevel;
  triTheta: number; // Parâmetro b de dificuldade TRI (-2.0 a +2.5)
  xpReward: number;
  prerequisites: string[];
  mentor: {
    name: string;
    role: string;
    quote: string;
    badgeName: string;
    badgeIcon: string;
    color: string;
  };
  status: 'mastered' | 'in_progress' | 'locked';
  progressPct: number; // 0 - 100
}

export const BNCC_SKILLS_DATA: BNCCSkillNode[] = [
  // ==========================================
  // MATEMÁTICA E SUAS TECNOLOGIAS (MAT)
  // ==========================================
  {
    id: 'EM13MAT101',
    code: 'EM13MAT101',
    area: 'matematica',
    discipline: 'Matemática',
    title: 'Modelagem Linear & Taxas de Variação',
    description: 'Interpretar criticamente taxas de variação e crescimento linear em situações cotidianas, econômicas e científicas.',
    level: 'fundamentos',
    triTheta: -1.2,
    xpReward: 150,
    prerequisites: [],
    mentor: {
      name: 'René Descartes',
      role: 'Pai da Geometria Analítica',
      quote: 'Dividir cada uma das dificuldades que examinardes em tantas parcelas quantas for possível.',
      badgeName: 'Bússola Cartesiana',
      badgeIcon: '🧭',
      color: '#38BDF8'
    },
    status: 'mastered',
    progressPct: 100
  },
  {
    id: 'EM13MAT103',
    code: 'EM13MAT103',
    area: 'matematica',
    discipline: 'Matemática',
    title: 'Funções Quadráticas & Vértices',
    description: 'Modelar fenômenos físicos e econômicos por parábolas, determinando pontos de máximo, mínimo e raízes reais.',
    level: 'intermediario',
    triTheta: 0.1,
    xpReward: 200,
    prerequisites: ['EM13MAT101'],
    mentor: {
      name: 'Carl Friedrich Gauss',
      role: 'Príncipe dos Matemáticos',
      quote: 'A matemática é a rainha das ciências e a teoria dos números é a rainha da matemática.',
      badgeName: 'Selo de Gauss',
      badgeIcon: '📐',
      color: '#60A5FA'
    },
    status: 'mastered',
    progressPct: 100
  },
  {
    id: 'EM13MAT202',
    code: 'EM13MAT202',
    area: 'matematica',
    discipline: 'Matemática',
    title: 'Probabilidade Condicional & Amostragem',
    description: 'Calcular probabilidade simples e condicional em experimentos equiprováveis e tomada de decisões sob incerteza.',
    level: 'intermediario',
    triTheta: 0.3,
    xpReward: 200,
    prerequisites: ['EM13MAT101'],
    mentor: {
      name: 'Blaise Pascal',
      role: 'Pioneiro da Teoria das Probabilidades',
      quote: 'O coração tem razões que a própria razão desconhece.',
      badgeName: 'Dado de Pascal',
      badgeIcon: '🎲',
      color: '#818CF8'
    },
    status: 'in_progress',
    progressPct: 75
  },
  {
    id: 'EM13MAT301',
    code: 'EM13MAT301',
    area: 'matematica',
    discipline: 'Matemática',
    title: 'Análise Combinatória & Princípio Multiplicativo',
    description: 'Resolver problemas complexos de contagem, arranjos, permutações e combinações com restrições lógicas.',
    level: 'avancado',
    triTheta: 1.1,
    xpReward: 250,
    prerequisites: ['EM13MAT202'],
    mentor: {
      name: 'Ada Lovelace',
      role: 'Primeira Programadora da História',
      quote: 'A ciência das operações matemáticas tece padrões algébricos assim como o tear tece flores.',
      badgeName: 'Engrenagem Algorítmica',
      badgeIcon: '⚙️',
      color: '#C084FC'
    },
    status: 'in_progress',
    progressPct: 50
  },
  {
    id: 'EM13MAT305',
    code: 'EM13MAT305',
    area: 'matematica',
    discipline: 'Matemática',
    title: 'Geometria Espacial Métrica & Volumes',
    description: 'Investigar relações métricas e espaciais no cálculo de volumes e áreas superficiais de prismas, cilindros e esferas.',
    level: 'avancado',
    triTheta: 1.3,
    xpReward: 260,
    prerequisites: ['EM13MAT103'],
    mentor: {
      name: 'Arquimedes de Siracusa',
      role: 'Gênio da Geometria Clássica',
      quote: 'Dê-me uma alavanca e um ponto de apoio e moverei o mundo.',
      badgeName: 'Esfera de Arquimedes',
      badgeIcon: '🔮',
      color: '#34D399'
    },
    status: 'locked',
    progressPct: 0
  },
  {
    id: 'EM13MAT501',
    code: 'EM13MAT501',
    area: 'matematica',
    discipline: 'Matemática',
    title: 'Trigonometria Circular & Funções Periódicas',
    description: 'Compreender o ciclo trigonométrico, fenômenos ondulatórios e transformações periódicas de seno e cosseno.',
    level: 'mestre',
    triTheta: 1.9,
    xpReward: 320,
    prerequisites: ['EM13MAT305'],
    mentor: {
      name: 'Euclides de Alexandria',
      role: 'Autor de "Os Elementos"',
      quote: 'Não há estrada real para a geometria.',
      badgeName: 'Compêndio Euclidiano',
      badgeIcon: '🏛️',
      color: '#F59E0B'
    },
    status: 'locked',
    progressPct: 0
  },

  // ==========================================
  // CIÊNCIAS DA NATUREZA E SUAS TECNOLOGIAS (CNT)
  // ==========================================
  {
    id: 'EM13CNT101',
    code: 'EM13CNT101',
    area: 'natureza',
    discipline: 'Física',
    title: 'Dinâmica Newtoniana & Leis do Movimento',
    description: 'Prever e analisar movimentos a partir das 3 Leis de Newton e do princípio fundamental da conservação mecânica.',
    level: 'fundamentos',
    triTheta: -0.9,
    xpReward: 160,
    prerequisites: [],
    mentor: {
      name: 'Isaac Newton',
      role: 'Pioneiro da Física Clássica',
      quote: 'Se vi mais longe, foi por estar sobre ombros de gigantes.',
      badgeName: 'Maçã Gravitacional',
      badgeIcon: '🍎',
      color: '#EF4444'
    },
    status: 'mastered',
    progressPct: 100
  },
  {
    id: 'EM13CNT102',
    code: 'EM13CNT102',
    area: 'natureza',
    discipline: 'Química',
    title: 'Estequiometria & Conservação das Massas',
    description: 'Explicar transformações químicas, rendimento e reagente limitante com base nas Leis de Lavoisier e Proust.',
    level: 'fundamentos',
    triTheta: -0.8,
    xpReward: 160,
    prerequisites: [],
    mentor: {
      name: 'Antoine Lavoisier',
      role: 'Pai da Química Moderna',
      quote: 'Na natureza nada se cria, nada se perde, tudo se transforma.',
      badgeName: 'Balança de Lavoisier',
      badgeIcon: '⚖️',
      color: '#10B981'
    },
    status: 'mastered',
    progressPct: 100
  },
  {
    id: 'EM13CNT104',
    code: 'EM13CNT104',
    area: 'natureza',
    discipline: 'Física / Química',
    title: 'Radioatividade & Decaimento Nuclear',
    description: 'Avaliar emissões alfa, beta e gama, meia-vida radioativa e aplicações da energia nuclear na medicina e indústria.',
    level: 'intermediario',
    triTheta: 0.4,
    xpReward: 210,
    prerequisites: ['EM13CNT102'],
    mentor: {
      name: 'Marie Curie',
      role: 'Dupla Laureada com o Nobel',
      quote: 'Nada na vida deve ser temido, somente compreendido.',
      badgeName: 'Raio de Polônio',
      badgeIcon: '☢️',
      color: '#00F0FF'
    },
    status: 'mastered',
    progressPct: 100
  },
  {
    id: 'EM13CNT201',
    code: 'EM13CNT201',
    area: 'natureza',
    discipline: 'Biologia',
    title: 'Genética Mendeliana & Cruzamentos',
    description: 'Analisar a segregação independente dos fatores hereditários, quadros de Punnett e determinação alélica.',
    level: 'intermediario',
    triTheta: 0.2,
    xpReward: 200,
    prerequisites: [],
    mentor: {
      name: 'Gregor Mendel',
      role: 'Patrono da Genética',
      quote: 'Minha hora ainda há de chegar.',
      badgeName: 'Ervilha de Mendel',
      badgeIcon: '🌱',
      color: '#4ADE80'
    },
    status: 'in_progress',
    progressPct: 80
  },
  {
    id: 'EM13CNT301',
    code: 'EM13CNT301',
    area: 'natureza',
    discipline: 'Física',
    title: 'Eletrodinâmica & Circuitos de Resistores',
    description: 'Analisar circuitos elétricos em série e paralelo, 1ª e 2ª Leis de Ohm e dissipação térmica por Efeito Joule.',
    level: 'avancado',
    triTheta: 1.0,
    xpReward: 250,
    prerequisites: ['EM13CNT101'],
    mentor: {
      name: 'Georg Simon Ohm',
      role: 'Descobridor da Resistência Elétrica',
      quote: 'A corrente em um condutor é proporcional à diferença de potencial nele aplicada.',
      badgeName: 'Chave Ohmíca',
      badgeIcon: '⚡',
      color: '#FBBF24'
    },
    status: 'in_progress',
    progressPct: 60
  },
  {
    id: 'EM13CNT303',
    code: 'EM13CNT303',
    area: 'natureza',
    discipline: 'Biologia',
    title: 'Evolução Biológica & Seleção Natural',
    description: 'Compreender a ancestralidade comum, especiação, mutações adaptativas e pressões ecológicas de seleção.',
    level: 'avancado',
    triTheta: 0.9,
    xpReward: 240,
    prerequisites: ['EM13CNT201'],
    mentor: {
      name: 'Charles Darwin',
      role: 'Autor de "A Origem das Espécies"',
      quote: 'Não é o mais forte que sobrevive, nem o mais inteligente, mas o que melhor se adapta às mudanças.',
      badgeName: 'Tentilhão de Darwin',
      badgeIcon: '🦅',
      color: '#A3E635'
    },
    status: 'locked',
    progressPct: 0
  },
  {
    id: 'EM13CNT106',
    code: 'EM13CNT106',
    area: 'natureza',
    discipline: 'Física Moderna',
    title: 'Relatividade Restrita & Efeito Fotoelétrico',
    description: 'Examinar a dilatação temporal, contração espacial e o comportamento dual onda-partícula da radiação eletromagnética.',
    level: 'mestre',
    triTheta: 2.1,
    xpReward: 350,
    prerequisites: ['EM13CNT104', 'EM13CNT301'],
    mentor: {
      name: 'Albert Einstein',
      role: 'Autor da Teoria da Relatividade',
      quote: 'A imaginação é mais importante que o conhecimento.',
      badgeName: 'Chave do Espaço-Tempo',
      badgeIcon: '🌌',
      color: '#A855F7'
    },
    status: 'locked',
    progressPct: 0
  },

  // ==========================================
  // LINGUAGENS E SUAS TECNOLOGIAS (LP)
  // ==========================================
  {
    id: 'EM13LP01',
    code: 'EM13LP01',
    area: 'linguagens',
    discipline: 'Língua Portuguesa & Redação',
    title: 'Estrutura Dissertativa & Tese ENEM',
    description: 'Construir a estrutura dissertativo-argumentativa do ENEM, formulando tese clara e coerente com os Direitos Humanos.',
    level: 'fundamentos',
    triTheta: -1.0,
    xpReward: 160,
    prerequisites: [],
    mentor: {
      name: 'Machado de Assis',
      role: 'Fundador da Academia Brasileira de Letras',
      quote: 'Ao vencedor, as batatas!',
      badgeName: 'Pena de Machado',
      badgeIcon: '🪶',
      color: '#F43F5E'
    },
    status: 'mastered',
    progressPct: 100
  },
  {
    id: 'EM13LP12',
    code: 'EM13LP12',
    area: 'linguagens',
    discipline: 'Língua Portuguesa',
    title: 'Mecanismos Coesivos Inter e Intraparágrafo',
    description: 'Empregar operadores argumentativos ("Outrossim", "Por conseguinte") e elementos referenciais evitando repetições viciosas.',
    level: 'intermediario',
    triTheta: 0.2,
    xpReward: 200,
    prerequisites: ['EM13LP01'],
    mentor: {
      name: 'Rui Barbosa',
      role: 'O Águia de Haia',
      quote: 'A palavra é o instrumento irresistível da conquista da liberdade.',
      badgeName: 'Elo Republicano',
      badgeIcon: '🔗',
      color: '#FB923C'
    },
    status: 'mastered',
    progressPct: 100
  },
  {
    id: 'EM13LP49',
    code: 'EM13LP49',
    area: 'linguagens',
    discipline: 'Redação & Filosofia',
    title: 'Repertório Sociocultural Legítimo e Produtivo',
    description: 'Mobilizar repertório de outras áreas (Constituição, filósofos, sociólogos, obras literárias) para embasar a argumentação.',
    level: 'avancado',
    triTheta: 1.2,
    xpReward: 260,
    prerequisites: ['EM13LP12'],
    mentor: {
      name: 'Joaquim Nabuco',
      role: 'Diplomata e Escritor Abolicionista',
      quote: 'A verdadeira força de uma causa está na justiça do seu princípio.',
      badgeName: 'Tomo Humanista',
      badgeIcon: '📜',
      color: '#EAB308'
    },
    status: 'in_progress',
    progressPct: 70
  },
  {
    id: 'EM13LP15',
    code: 'EM13LP15',
    area: 'linguagens',
    discipline: 'Redação Nota 1000',
    title: 'Proposta de Intervenção Completa (5 Elementos)',
    description: 'Elaborar proposta de intervenção social com os 5 elementos obrigatórios: Agente, Ação, Meio/Modo, Efeito e Detalhamento.',
    level: 'mestre',
    triTheta: 1.7,
    xpReward: 300,
    prerequisites: ['EM13LP49'],
    mentor: {
      name: 'Paulo Freire',
      role: 'Patrono da Educação Brasileira',
      quote: 'Se a educação sozinha não transforma a sociedade, sem ela tampouco a sociedade muda.',
      badgeName: 'Farol da Emancipação',
      badgeIcon: '🏮',
      color: '#EC4899'
    },
    status: 'in_progress',
    progressPct: 40
  },

  // ==========================================
  // CIÊNCIAS HUMANAS E SOCIAIS APLICADAS (CHS)
  // ==========================================
  {
    id: 'EM13CHS101',
    code: 'EM13CHS101',
    area: 'humanas',
    discipline: 'Filosofia / Sociologia',
    title: 'Contratualismo & Estado Moderno',
    description: 'Analisar as teorias do pacto social em Hobbes, Locke e Rousseau e os fundamentos da legitimidade do poder estatal.',
    level: 'fundamentos',
    triTheta: -0.9,
    xpReward: 150,
    prerequisites: [],
    mentor: {
      name: 'John Locke',
      role: 'Filósofo do Empirismo e Direitos Naturais',
      quote: 'As ações dos seres humanos são as melhores intérpretes dos seus pensamentos.',
      badgeName: 'Tratado Cívico',
      badgeIcon: '🏛️',
      color: '#3B82F6'
    },
    status: 'mastered',
    progressPct: 100
  },
  {
    id: 'EM13CHS103',
    code: 'EM13CHS103',
    area: 'humanas',
    discipline: 'Geografia',
    title: 'Globalização & Meio Técnico-Científico-Informacional',
    description: 'Compreender a divisão internacional do trabalho, fluxos de capitais e dados, e impactos socioespaciais contemporâneos.',
    level: 'intermediario',
    triTheta: 0.1,
    xpReward: 200,
    prerequisites: ['EM13CHS101'],
    mentor: {
      name: 'Milton Santos',
      role: 'Maior Geógrafo do Brasil & Prêmio Vautrin Lud',
      quote: 'A força da alienação vem dessa fragilidade dos indivíduos, que apenas conseguem identificar o que os separa.',
      badgeName: 'Rosa dos Ventos Crítica',
      badgeIcon: '🧭',
      color: '#14B8A6'
    },
    status: 'mastered',
    progressPct: 100
  },
  {
    id: 'EM13CHS204',
    code: 'EM13CHS204',
    area: 'humanas',
    discipline: 'História do Brasil',
    title: 'Constituições Brasileiras & Direitos Fundamentais',
    description: 'Examinar a trajetória da cidadania e garantias civis desde a Carta de 1824 até a Constituição Cidadã de 1988.',
    level: 'avancado',
    triTheta: 1.1,
    xpReward: 250,
    prerequisites: ['EM13CHS103'],
    mentor: {
      name: 'Darcy Ribeiro',
      role: 'Antropólogo e Educador Brasileiro',
      quote: 'Só há duas opções nesta vida: se conformar ou se revoltar. Eu não me conformo.',
      badgeName: 'Urupês da Cidadania',
      badgeIcon: '📖',
      color: '#F97316'
    },
    status: 'in_progress',
    progressPct: 65
  },
  {
    id: 'EM13CHS502',
    code: 'EM13CHS502',
    area: 'humanas',
    discipline: 'História Geral / Geopolítica',
    title: 'Geopolítica Contemporânea & Crises Globais',
    description: 'Avaliar as transformações da Guerra Fria à multipolaridade, transição energética e soberania tecnológica dos povos.',
    level: 'mestre',
    triTheta: 1.8,
    xpReward: 320,
    prerequisites: ['EM13CHS204'],
    mentor: {
      name: 'Adam Smith',
      role: 'Pioneiro da Economia Política',
      quote: 'A ciência é o grande antídoto contra o veneno do entusiasmo e da superstição.',
      badgeName: 'Moeda da Riqueza',
      badgeIcon: '🪙',
      color: '#EAB308'
    },
    status: 'locked',
    progressPct: 0
  }
];

interface BNCCSkillTreeProps {
  studentId?: string;
  studentName?: string;
  onBack?: () => void;
  onRewardXp?: (amount: number, reason: string) => void;
  onLaunchQuestion?: (question: TriQuestion) => void;
}

export const BNCCSkillTree: React.FC<BNCCSkillTreeProps> = ({
  studentId = 'demo_student_001',
  studentName = 'Gabriel Rocha',
  onBack,
  onRewardXp,
  onLaunchQuestion
}) => {
  const [skills, setSkills] = useState<BNCCSkillNode[]>(BNCC_SKILLS_DATA);
  const [selectedArea, setSelectedArea] = useState<BNCCArea>('todas');
  const [selectedStatus, setSelectedStatus] = useState<SkillStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSkillModal, setActiveSkillModal] = useState<BNCCSkillNode | null>(null);
  const [activeQuizQuestion, setActiveQuizQuestion] = useState<TriQuestion | null>(null);
  const [quizSelectedOption, setQuizSelectedOption] = useState<string | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [xpToast, setXpToast] = useState<{ amount: number; message: string } | null>(null);

  // Filtro de nós
  const filteredSkills = useMemo(() => {
    return skills.filter(skill => {
      if (selectedArea !== 'todas' && skill.area !== selectedArea) return false;
      if (selectedStatus !== 'all' && skill.status !== selectedStatus) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesCode = skill.code.toLowerCase().includes(query);
        const matchesTitle = skill.title.toLowerCase().includes(query);
        const matchesDesc = skill.description.toLowerCase().includes(query);
        const matchesMentor = skill.mentor.name.toLowerCase().includes(query);
        if (!matchesCode && !matchesTitle && !matchesDesc && !matchesMentor) return false;
      }
      return true;
    });
  }, [skills, selectedArea, selectedStatus, searchQuery]);

  // Estatísticas de maestria
  const stats = useMemo(() => {
    const total = skills.length;
    const mastered = skills.filter(s => s.status === 'mastered').length;
    const inProgress = skills.filter(s => s.status === 'in_progress').length;
    const locked = skills.filter(s => s.status === 'locked').length;
    const totalXp = skills.filter(s => s.status === 'mastered').reduce((acc, s) => acc + s.xpReward, 0);
    const overallPct = Math.round((mastered / total) * 100);

    return { total, mastered, inProgress, locked, totalXp, overallPct };
  }, [skills]);

  // Disparo de toast de XP
  const triggerXpToast = (amount: number, message: string) => {
    setXpToast({ amount, message });
    if (onRewardXp) {
      onRewardXp(amount, message);
    }
    try {
      if ((window as any).aquila?.student?.addXp && studentId) {
        (window as any).aquila.student.addXp(studentId, amount, message);
      }
    } catch {}
    setTimeout(() => setXpToast(null), 4000);
  };

  // Abrir treino prático com questão do banco TRI
  const handleOpenPractice = (skill: BNCCSkillNode) => {
    // Procura questão correspondente no banco TRI
    const matchedQuestion = TRI_ITEM_BANK.find(q => q.skillCode === skill.code) || 
      TRI_ITEM_BANK.find(q => q.area === skill.area) || 
      TRI_ITEM_BANK[0];

    if (onLaunchQuestion) {
      onLaunchQuestion(matchedQuestion);
      return;
    }

    setActiveQuizQuestion(matchedQuestion);
    setQuizSelectedOption(null);
    setQuizSubmitted(false);
  };

  // Submeter resposta do simulador de questão
  const handleQuizSubmit = () => {
    if (!quizSelectedOption || !activeQuizQuestion) return;
    setQuizSubmitted(true);

    const isCorrect = quizSelectedOption === activeQuizQuestion.correctAnswer;
    if (isCorrect) {
      triggerXpToast(150, `Habilidade ${activeSkillModal?.code || activeQuizQuestion.skillCode} Fortalecida!`);
      // Atualiza progresso da habilidade se estiver no modal
      if (activeSkillModal) {
        setSkills(prev => prev.map(s => {
          if (s.id === activeSkillModal.id) {
            const nextProgress = Math.min(100, s.progressPct + 25);
            const nextStatus = nextProgress >= 100 ? 'mastered' : s.status;
            return { ...s, progressPct: nextProgress, status: nextStatus };
          }
          return s;
        }));
      }
    }
  };

  return (
    <div className="bncc-skill-tree-container animate-fade-in">
      {/* Header com Navegação e Controles de Área */}
      <header className="skill-tree-header">
        <div className="header-left">
          {onBack && (
            <button className="btn-back" onClick={onBack} title="Voltar">
              ← Voltar
            </button>
          )}
          <div className="header-titles">
            <div className="brand-tag">
              <Sparkles size={12} color="#00F0FF" />
              <span>CURRÍCULO SOBERANO BNCC // NOVO ENSINO MÉDIO</span>
            </div>
            <h1>Árvore de Habilidades & Mentores Curriculares</h1>
            <p className="subtitle">
              Mapa de progressão cognitiva com parâmetros TRI calibrados e mentores históricos em domínio público.
            </p>
          </div>
        </div>

        {/* Global XP & Mastery Badge */}
        <div className="header-right">
          {xpToast && (
            <div className="xp-floating-pill">
              <Zap size={14} color="#F59E0B" />
              <span>+{xpToast.amount} XP • {xpToast.message}</span>
            </div>
          )}
          <div className="mastery-summary-pill">
            <Award size={18} color="#00F0FF" />
            <div>
              <span className="pill-title">{stats.overallPct}% CONCLUÍDO</span>
              <span className="pill-sub">{stats.mastered} de {stats.total} Habilidades Dominadas</span>
            </div>
          </div>
        </div>
      </header>

      {/* KPI Stats Strip */}
      <section className="skill-kpi-strip">
        <div className="skill-kpi-card">
          <div className="kpi-icon-wrap" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10B981' }}>
            <CheckCircle2 size={20} />
          </div>
          <div className="kpi-info">
            <span className="kpi-label">DOMINADAS (MAESTRIA)</span>
            <span className="kpi-val" style={{ color: '#10B981' }}>{stats.mastered} HABILIDADES</span>
            <span className="kpi-sub">Insígnias de mentores desbloqueadas</span>
          </div>
        </div>

        <div className="skill-kpi-card">
          <div className="kpi-icon-wrap" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#F59E0B' }}>
            <TrendingUp size={20} />
          </div>
          <div className="kpi-info">
            <span className="kpi-label">EM DESENVOLVIMENTO</span>
            <span className="kpi-val" style={{ color: '#F59E0B' }}>{stats.inProgress} HABILIDADES</span>
            <span className="kpi-sub">Treinos e quizzes pendentes</span>
          </div>
        </div>

        <div className="skill-kpi-card">
          <div className="kpi-icon-wrap" style={{ background: 'rgba(148, 163, 184, 0.15)', color: '#94A3B8' }}>
            <Lock size={20} />
          </div>
          <div className="kpi-info">
            <span className="kpi-label">BLOQUEADAS</span>
            <span className="kpi-val" style={{ color: '#94A3B8' }}>{stats.locked} HABILIDADES</span>
            <span className="kpi-sub">Exigem pré-requisitos anteriores</span>
          </div>
        </div>

        <div className="skill-kpi-card">
          <div className="kpi-icon-wrap" style={{ background: 'rgba(0, 240, 255, 0.15)', color: '#00F0FF' }}>
            <Zap size={20} />
          </div>
          <div className="kpi-info">
            <span className="kpi-label">XP CURRICULAR CONQUISTADO</span>
            <span className="kpi-val" style={{ color: '#00F0FF' }}>{stats.totalXp} XP</span>
            <span className="kpi-sub">Pontuação válida para o ranking</span>
          </div>
        </div>
      </section>

      {/* Filter Toolbar */}
      <section className="skill-filter-bar">
        <div className="area-tabs">
          <button
            className={`area-tab ${selectedArea === 'todas' ? 'active' : ''}`}
            onClick={() => setSelectedArea('todas')}
          >
            Todas as Áreas
          </button>
          <button
            className={`area-tab area-mat ${selectedArea === 'matematica' ? 'active' : ''}`}
            onClick={() => setSelectedArea('matematica')}
          >
            📐 Matemática
          </button>
          <button
            className={`area-tab area-cnt ${selectedArea === 'natureza' ? 'active' : ''}`}
            onClick={() => setSelectedArea('natureza')}
          >
            ⚛️ Ciências da Natureza
          </button>
          <button
            className={`area-tab area-lp ${selectedArea === 'linguagens' ? 'active' : ''}`}
            onClick={() => setSelectedArea('linguagens')}
          >
            ✍️ Linguagens & Redação
          </button>
          <button
            className={`area-tab area-chs ${selectedArea === 'humanas' ? 'active' : ''}`}
            onClick={() => setSelectedArea('humanas')}
          >
            🏛️ Ciências Humanas
          </button>
        </div>

        <div className="search-status-controls">
          <div className="search-box">
            <Search size={14} color="#64748B" />
            <input
              type="text"
              placeholder="Buscar por código (ex: EM13MAT101), mentor ou tema..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className="clear-btn" onClick={() => setSearchQuery('')}>
                <X size={12} />
              </button>
            )}
          </div>

          <select
            className="status-select"
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value as SkillStatus)}
          >
            <option value="all">Todos os Status</option>
            <option value="mastered">Apenas Dominadas</option>
            <option value="in_progress">Em Desenvolvimento</option>
            <option value="locked">Bloqueadas</option>
          </select>
        </div>
      </section>

      {/* Grid Interativo de Habilidades & Mentores */}
      <main className="skill-grid">
        {filteredSkills.map(skill => {
          const isMastered = skill.status === 'mastered';
          const isInProgress = skill.status === 'in_progress';
          const isLocked = skill.status === 'locked';

          return (
            <div
              key={skill.id}
              className={`skill-card status-${skill.status} area-${skill.area}`}
              onClick={() => setActiveSkillModal(skill)}
            >
              {/* Top Card Badge Header */}
              <div className="card-top-header">
                <span className="skill-code-badge">{skill.code}</span>
                <div className="card-status-indicator">
                  {isMastered && (
                    <span className="status-tag mastered">
                      <CheckCircle2 size={12} /> DOMINADA
                    </span>
                  )}
                  {isInProgress && (
                    <span className="status-tag in-progress">
                      <TrendingUp size={12} /> {skill.progressPct}%
                    </span>
                  )}
                  {isLocked && (
                    <span className="status-tag locked">
                      <Lock size={12} /> BLOQUEADA
                    </span>
                  )}
                </div>
              </div>

              {/* Title & Description */}
              <h3 className="skill-title">{skill.title}</h3>
              <p className="skill-description">{skill.description}</p>

              {/* Progress bar */}
              <div className="skill-progress-bar-bg">
                <div
                  className="skill-progress-bar-fill"
                  style={{
                    width: `${skill.progressPct}%`,
                    background: isMastered
                      ? '#10B981'
                      : isInProgress
                      ? '#F59E0B'
                      : 'rgba(255,255,255,0.1)'
                  }}
                />
              </div>

              {/* Mentor Patron Emblem */}
              <div className="mentor-seal-bar">
                <div className="mentor-seal-left">
                  <span className="mentor-seal-icon">{skill.mentor.badgeIcon}</span>
                  <div className="mentor-seal-meta">
                    <span className="mentor-name">{skill.mentor.name}</span>
                    <span className="mentor-badge-name">{skill.mentor.badgeName}</span>
                  </div>
                </div>
                <div className="skill-xp-tag">+{skill.xpReward} XP</div>
              </div>

              {/* Footer action */}
              <div className="card-footer-action">
                <span className="level-pill">{skill.level.toUpperCase()} • TRI θ {skill.triTheta > 0 ? `+${skill.triTheta}` : skill.triTheta}</span>
                <span className="card-link-text">Ver Detalhes →</span>
              </div>
            </div>
          );
        })}
      </main>

      {/* Modal Detalhado da Habilidade */}
      {activeSkillModal && (
        <div className="skill-modal-overlay" onClick={() => setActiveSkillModal(null)}>
          <div className="skill-modal-card animate-scale-up" onClick={e => e.stopPropagation()}>
            <header className="modal-header">
              <div className="modal-header-info">
                <div className="modal-tags">
                  <span className="skill-code-badge">{activeSkillModal.code}</span>
                  <span className={`status-tag ${activeSkillModal.status}`}>
                    {activeSkillModal.status === 'mastered' ? 'DOMINADA' : activeSkillModal.status === 'in_progress' ? 'EM DESENVOLVIMENTO' : 'BLOQUEADA'}
                  </span>
                  <span className="level-pill">{activeSkillModal.discipline}</span>
                </div>
                <h2>{activeSkillModal.title}</h2>
              </div>
              <button className="btn-close-modal" onClick={() => setActiveSkillModal(null)}>
                <X size={18} />
              </button>
            </header>

            <div className="modal-body">
              <div className="modal-section">
                <h4>Descrição Curricular Oficial (BNCC)</h4>
                <p className="modal-desc-text">{activeSkillModal.description}</p>
              </div>

              {/* Mentor Emblem Showcase */}
              <div className="modal-mentor-box" style={{ borderColor: activeSkillModal.mentor.color }}>
                <div className="mentor-avatar-badge" style={{ background: `${activeSkillModal.mentor.color}20` }}>
                  <span style={{ fontSize: 32 }}>{activeSkillModal.mentor.badgeIcon}</span>
                </div>
                <div className="mentor-box-content">
                  <div className="mentor-box-top">
                    <strong>{activeSkillModal.mentor.name}</strong>
                    <span className="mentor-role">{activeSkillModal.mentor.role}</span>
                  </div>
                  <p className="mentor-quote">"{activeSkillModal.mentor.quote}"</p>
                  <div className="mentor-insignia">
                    <span>Insígnia: <strong>{activeSkillModal.mentor.badgeName}</strong></span>
                    <span className="insignia-unlocked-status">
                      {activeSkillModal.status === 'mastered' ? '✨ DESBLOQUEADA' : '🔒 BLOQUEADA (Atinja 100% de Maestria)'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Telemetria TRI e Parâmetros */}
              <div className="modal-metrics-grid">
                <div className="metric-box">
                  <span className="m-label">NÍVEL DE PROFICIÊNCIA TRI</span>
                  <span className="m-val">θ = {activeSkillModal.triTheta > 0 ? `+${activeSkillModal.triTheta}` : activeSkillModal.triTheta}</span>
                  <span className="m-sub">Parâmetro de Dificuldade do Item</span>
                </div>
                <div className="metric-box">
                  <span className="m-label">RECOMPENSA DE MAESTRIA</span>
                  <span className="m-val" style={{ color: '#00F0FF' }}>+{activeSkillModal.xpReward} XP</span>
                  <span className="m-sub">Creditado ao portfólio do aluno</span>
                </div>
                <div className="metric-box">
                  <span className="m-label">PROGRESSO DO ALUNO</span>
                  <span className="m-val" style={{ color: activeSkillModal.progressPct === 100 ? '#10B981' : '#F59E0B' }}>
                    {activeSkillModal.progressPct}%
                  </span>
                  <span className="m-sub">Baseado em exercícios e provas</span>
                </div>
              </div>

              {/* Pré-requisitos se houver */}
              {activeSkillModal.prerequisites.length > 0 && (
                <div className="modal-prereqs">
                  <h4>Pré-requisitos Curriculares</h4>
                  <div className="prereq-list">
                    {activeSkillModal.prerequisites.map(prereqId => {
                      const pSkill = BNCC_SKILLS_DATA.find(s => s.id === prereqId);
                      return (
                        <div key={prereqId} className="prereq-pill">
                          <CheckCircle2 size={12} color="#10B981" />
                          <span>{prereqId}: {pSkill?.title || 'Habilidade Fundamental'}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <footer className="modal-footer">
              <button
                className="btn-practice-primary"
                onClick={() => {
                  handleOpenPractice(activeSkillModal);
                }}
              >
                <Play size={16} />
                <span>Treinar Habilidade na Prática (Simulador TRI)</span>
              </button>
            </footer>
          </div>
        </div>
      )}

      {/* Modal Interativo de Treino com Questão TRI */}
      {activeQuizQuestion && (
        <div className="skill-modal-overlay" onClick={() => setActiveQuizQuestion(null)}>
          <div className="skill-quiz-modal animate-scale-up" onClick={e => e.stopPropagation()}>
            <header className="quiz-header">
              <div className="quiz-header-badge">
                <Target size={14} color="#00F0FF" />
                <span>SIMULADOR TRI SOBERANO • {activeQuizQuestion.skillCode}</span>
              </div>
              <button className="btn-close-modal" onClick={() => setActiveQuizQuestion(null)}>
                <X size={18} />
              </button>
            </header>

            <div className="quiz-body">
              <div className="quiz-skill-desc">
                <strong>Habilidade Avaliada:</strong> {activeQuizQuestion.skillDescription}
              </div>

              <p className="quiz-text">{activeQuizQuestion.text}</p>

              <div className="quiz-options">
                {activeQuizQuestion.options.map(opt => {
                  let optClass = 'quiz-option';
                  if (quizSubmitted) {
                    if (opt.letter === activeQuizQuestion.correctAnswer) {
                      optClass += ' correct';
                    } else if (opt.letter === quizSelectedOption) {
                      optClass += ' incorrect';
                    }
                  } else if (quizSelectedOption === opt.letter) {
                    optClass += ' selected';
                  }

                  return (
                    <button
                      key={opt.letter}
                      className={optClass}
                      disabled={quizSubmitted}
                      onClick={() => setQuizSelectedOption(opt.letter)}
                    >
                      <span className="opt-letter">{opt.letter}</span>
                      <span className="opt-text">{opt.text}</span>
                    </button>
                  );
                })}
              </div>

              {quizSubmitted && (
                <div className={`quiz-feedback-box ${quizSelectedOption === activeQuizQuestion.correctAnswer ? 'success' : 'error'}`}>
                  <h4>
                    {quizSelectedOption === activeQuizQuestion.correctAnswer
                      ? '✨ Resposta Correta! (+150 XP)'
                      : '⚠️ Atenção à fundamentação teórica'}
                  </h4>
                  <p>{activeQuizQuestion.socraticExplanation}</p>
                </div>
              )}
            </div>

            <footer className="quiz-footer">
              {!quizSubmitted ? (
                <button
                  className="btn-practice-primary"
                  disabled={!quizSelectedOption}
                  onClick={handleQuizSubmit}
                >
                  Confirmar Resposta
                </button>
              ) : (
                <button
                  className="btn-practice-primary"
                  onClick={() => setActiveQuizQuestion(null)}
                >
                  Concluir Treino
                </button>
              )}
            </footer>
          </div>
        </div>
      )}
    </div>
  );
};
