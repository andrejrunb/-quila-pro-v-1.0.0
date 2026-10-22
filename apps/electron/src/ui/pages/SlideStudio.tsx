import React, { useState, useEffect, useRef } from 'react';
import {
  Presentation,
  Play,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Printer,
  Copy,
  Sparkles,
  Lightbulb,
  CheckCircle2,
  Clock,
  Plus,
  Trash2,
  BookOpen,
  HelpCircle,
  Eye,
  EyeOff,
  Sliders,
  Layers,
  Download,
  Share2
} from 'lucide-react';
import './SlideStudio.css';

export interface SlideItem {
  id: string;
  type: 'cover' | 'hook' | 'theory' | 'formula' | 'question' | 'exit_ticket';
  title: string;
  subtitle?: string;
  content: string;
  bulletPoints?: string[];
  formula?: string;
  mentorQuote?: {
    mentorName: string;
    avatar: string;
    quote: string;
  };
  questionData?: {
    text: string;
    options: { letter: string; text: string }[];
    correctAnswer: string;
    explanation: string;
  };
  teacherNotes?: string;
}

export interface SlideDeck {
  id: string;
  title: string;
  subject: string;
  grade: string;
  bnccCode: string;
  themeColor: string;
  mentorName: string;
  slides: SlideItem[];
}

const PRESET_DECKS: SlideDeck[] = [
  {
    id: 'deck-fis-newton',
    title: 'Dinâmica Clássica: As 3 Leis de Newton & Atrito',
    subject: 'Física',
    grade: '1º e 3º Ano EM',
    bnccCode: 'EM13CNT101 • EM13CNT301',
    themeColor: '#00F0FF',
    mentorName: 'Isaac Newton',
    slides: [
      {
        id: 's1',
        type: 'cover',
        title: 'As Três Leis do Movimento',
        subtitle: 'Da Inércia à Gravitação Universal no ENEM e Vestibulares',
        content: 'Aula Estruturada • Colégio Visão • Ensino Médio',
        mentorQuote: {
          mentorName: 'Isaac Newton',
          avatar: '🍎',
          quote: 'Se vi mais longe, foi por estar sobre os ombros de gigantes.'
        },
        teacherNotes: 'Abertura da aula: contextualizar como o conceito de inércia rompeu com a visão aristotélica de que repouso é o estado natural dos corpos.'
      },
      {
        id: 's2',
        type: 'hook',
        title: 'O Desafio do Ônibus em Curva',
        subtitle: 'Problema-Chave para Reflexão da Turma',
        content: 'Quando um ônibus faz uma curva rápida para a esquerda, os passageiros sentem uma força aparente arremessando-os para a direita.',
        bulletPoints: [
          'Existe realmente uma força invisível puxando o passageiro para fora?',
          'Por que a física clássica chama a força centrífuga de "força inercial fictícia"?',
          'Qual é o referencial inercial correto para analisar esse movimento?'
        ],
        mentorQuote: {
          mentorName: 'Isaac Newton',
          avatar: '🍎',
          quote: 'Todo corpo continua em seu estado de repouso ou de movimento uniforme em linha reta, a menos que seja forçado a mudar aquele estado por forças aplicadas sobre ele.'
        },
        teacherNotes: 'Pedir que 2 alunos respondam antes de avançar para a 1ª Lei. Destacar o conceito de referencial inercial vs não-inercial.'
      },
      {
        id: 's3',
        type: 'theory',
        title: '1ª e 2ª Leis do Movimento',
        subtitle: 'Inércia e o Princípio Fundamental da Dinâmica',
        content: 'A resultante das forças que atuam sobre um corpo é a causa de sua aceleração vetorial.',
        formula: '∑ \\vec{F} = m \\cdot \\vec{a}',
        bulletPoints: [
          'Inércia: Propriedade intrínseca da matéria medida pela massa inercial (kg).',
          'Força Resultante: Não gera velocidade; gera variação de velocidade (aceleração).',
          'No Sistema Internacional: 1 Newton = 1 kg · m/s².'
        ],
        teacherNotes: 'Enfatizar que velocidade alta não significa força grande; velocidade constante implica força resultante nula!'
      },
      {
        id: 's4',
        type: 'formula',
        title: '3ª Lei: Ação e Reação & Atrito',
        subtitle: 'Forças de Interação em Pares',
        content: 'A toda ação corresponde uma reação de igual intensidade, mesma direção e sentido oposto, aplicadas em corpos DISTINTOS.',
        formula: 'f_{at} \\le \\mu_e \\cdot N \\quad | \\quad f_{at} = \\mu_c \\cdot N',
        bulletPoints: [
          'Ação e reação nunca se anulam, pois atuam em corpos diferentes.',
          'Atrito estático é uma força de solicitação: varia de zero até o valor máximo.',
          'Quando um carro acelera no asfalto, a força que move o carro para frente é o atrito que o chão exerce nos pneus!'
        ],
        teacherNotes: 'Pegadinha clássica do ENEM: a força que o cavalo faz na carroça é idêntica à força que a carroça faz no cavalo!'
      },
      {
        id: 's5',
        type: 'question',
        title: 'Aplicação ENEM / TRI (Item Calibrado)',
        subtitle: 'Questão Oficial BNCC • Habilidade EM13CNT101',
        content: 'Análise de forças no plano inclinado e atrito estático.',
        questionData: {
          text: 'Um bloco de 10 kg repousa sobre uma rampa inclinada de 30º em relação ao solo. O coeficiente de atrito estático entre o bloco e a rampa é 0,8. Considerando g = 10 m/s², qual é a intensidade da força de atrito que atua sobre o bloco para mantê-lo em equilíbrio estático?',
          options: [
            { letter: 'A', text: '40 N' },
            { letter: 'B', text: '50 N' },
            { letter: 'C', text: '69,2 N' },
            { letter: 'D', text: '80 N' },
            { letter: 'E', text: '100 N' }
          ],
          correctAnswer: 'B',
          explanation: 'No equilíbrio estático ao longo da rampa, o atrito equilibra a componente paralela do peso: f_at = P_x = m · g · sen(30º) = 10 · 10 · 0,5 = 50 N. A força máxima disponível seria μ · N = 0,8 · 100 · cos(30º) ≈ 69,2 N, mas o atrito só utiliza os 50 N necessários para o repouso!'
        },
        teacherNotes: 'Dica do Distrator: Muitos alunos calculam μ · N (69,2 N) sem notar que o atrito estático real se iguala à força solicitante (Px = 50 N).'
      },
      {
        id: 's6',
        type: 'exit_ticket',
        title: 'Exit Ticket (Bilhete de Saída de 1 Minuto)',
        subtitle: 'Verificação Imediata da Aprendizagem',
        content: 'Antes de sair da sala, cada estudante anota em seu caderno ou no aplicativo:',
        bulletPoints: [
          '1. Por que a força normal e a força peso não formam um par de ação e reação?',
          '2. Cite uma situação cotidiana em que o atrito atua a favor do movimento.',
          '3. Qual conceito você gostaria que revisássemos no início da próxima aula?'
        ],
        teacherNotes: 'Recolher os apontamentos ou abrir a Áquila Arena para a batalha de encerramento da aula.'
      }
    ]
  },
  {
    id: 'deck-qui-curie',
    title: 'Química Nuclear: Radioatividade & Decaimento',
    subject: 'Química',
    grade: '2º e 3º Ano EM',
    bnccCode: 'EM13CNT104 • EM13CNT205',
    themeColor: '#10B981',
    mentorName: 'Marie Curie',
    slides: [
      {
        id: 'q1',
        type: 'cover',
        title: 'Química Nuclear & Radioatividade',
        subtitle: 'Da Descoberta do Rádio à Energia Nuclear e Medicina Moderna',
        content: 'Laboratório Pedagógico Soberano • Colégio Visão',
        mentorQuote: {
          mentorName: 'Marie Curie',
          avatar: '🔬',
          quote: 'Na vida, não há nada a temer, apenas a compreender. Agora é a hora de compreender mais, para temer menos.'
        },
        teacherNotes: 'Abertura histórica: o trabalho exaustivo de Marie e Pierre Curie em purificar toneladas de pechblenda para isolar miligramas de cloreto de rádio.'
      },
      {
        id: 'q2',
        type: 'theory',
        title: 'As Três Emissões Naturais',
        subtitle: 'Partículas Alfa, Beta e Radiação Gama',
        content: 'O núcleo instável busca estabilidade emitindo partículas ou ondas eletromagnéticas de alta energia.',
        formula: '^{A}_{Z}X \\longrightarrow ^{A-4}_{Z-2}Y + ^{4}_{2}\\alpha \\quad | \\quad ^{A}_{Z}X \\longrightarrow ^{A}_{Z+1}Y + ^{0}_{-1}\\beta',
        bulletPoints: [
          'Alfa (α): Núcleo de Hélio (2 prótons e 2 nêutrons). Alta massa, baixo poder de penetração (barrada por uma folha de papel).',
          'Beta (β): Elétron de alta velocidade gerado pela desintegração de um nêutron (n → p + e⁻ + ν).',
          'Gama (γ): Onda eletromagnética de frequência altíssima. Sem massa nem carga, altíssimo poder de penetração.'
        ],
        teacherNotes: 'Explicar a 1ª Lei de Soddy (alfa) e a 2ª Lei de Soddy-Fajans-Russel (beta).'
      },
      {
        id: 'q3',
        type: 'formula',
        title: 'Cinética do Decaimento & Meia-Vida',
        subtitle: 'O Tempo Necessário para Reduzir a Amostra à Metade',
        content: 'O período de semidesintegração (t_{1/2}) é uma constante física característica de cada isótopo radioativo.',
        formula: 'M = \\frac{M_0}{2^n} \\quad \\text{onde} \\quad \\Delta t = n \\cdot t_{1/2}',
        bulletPoints: [
          'A meia-vida não depende da temperatura, pressão ou estado físico da amostra.',
          'Carbono-14: Meia-vida de 5.730 anos, essencial na datação arqueológica de fósseis orgânicos.',
          'Iodo-131: Meia-vida de 8 dias, utilizado no diagnóstico e tratamento de distúrbios da tireoide.'
        ],
        teacherNotes: 'Mostrar o gráfico exponencial decrescente e como a curva nunca toca o zero absoluto.'
      },
      {
        id: 'q4',
        type: 'question',
        title: 'Questão TRI: Datação por Meia-Vida',
        subtitle: 'Item Frequente nas Provas de Ciências da Natureza',
        content: 'Problema de cálculo estequiométrico-nuclear com aplicação prática.',
        questionData: {
          text: 'Um fóssil vegetal foi descoberto em uma escavação geológica. A análise laboratorial indicou que a taxa de carbono-14 na amostra era de apenas 12,5% da taxa encontrada em vegetais vivos contemporâneos. Sabendo que a meia-vida do C-14 é de aproximadamente 5.730 anos, qual é a idade estimada do fóssil?',
          options: [
            { letter: 'A', text: '5.730 anos' },
            { letter: 'B', text: '11.460 anos' },
            { letter: 'C', text: '17.190 anos' },
            { letter: 'D', text: '22.920 anos' },
            { letter: 'E', text: '45.840 anos' }
          ],
          correctAnswer: 'C',
          explanation: 'Para atingir 12,5% da atividade original: 100% → 50% (1ª meia-vida) → 25% (2ª meia-vida) → 12,5% (3ª meia-vida). Transcorreram exatamente 3 meias-vidas: 3 × 5.730 anos = 17.190 anos!'
        },
        teacherNotes: 'Orientar os alunos a fazer a contagem sucessiva de divisões por 2 antes de aplicar qualquer logaritmo.'
      }
    ]
  },
  {
    id: 'deck-mat-funcoes',
    title: 'Funções Quadráticas: Vértice & Modelagem',
    subject: 'Matemática',
    grade: '1º e 3º Ano EM',
    bnccCode: 'EM13MAT301 • EM13MAT501',
    themeColor: '#A855F7',
    mentorName: 'Ada Lovelace & Descartes',
    slides: [
      {
        id: 'm1',
        type: 'cover',
        title: 'Funções Quadráticas & Otimização',
        subtitle: 'Parábolas, Pontos de Máximo e Mínimo na Engenharia e Economia',
        content: 'Aula Interativa • Colégio Visão • Ensino Médio',
        mentorQuote: {
          mentorName: 'Ada Lovelace',
          avatar: '💻',
          quote: 'A ciência da computação une a imaginação poética ao rigor estrito das equações matemáticas.'
        },
        teacherNotes: 'Introduzir a parábola na arquitetura (pontes pênseis, antenas parabólicas e trajetórias balísticas).'
      },
      {
        id: 'm2',
        type: 'formula',
        title: 'Equação Canônica & Vértice',
        subtitle: 'Determinação dos Pontos Críticos',
        content: 'Toda função do segundo grau f(x) = ax² + bx + c possui um vértice com coordenadas exatas.',
        formula: 'X_v = -\\frac{b}{2a} \\quad | \\quad Y_v = -\\frac{\\Delta}{4a}',
        bulletPoints: [
          'Se a > 0: Parábola côncava para cima; o vértice é um ponto de MÍNIMO global.',
          'Se a < 0: Parábola côncava para baixo; o vértice é um ponto de MÁXIMO global.',
          'O valor de X_v representa "quando" ou "qual quantidade" atinge o extremo; Y_v representa "quanto" vale esse valor extremo.'
        ],
        teacherNotes: 'Enfatizar a diferença entre "qual o preço que maximiza a receita" (Xv) vs "qual é a receita máxima" (Yv).'
      },
      {
        id: 'm3',
        type: 'question',
        title: 'Questão de Otimização de Lucro',
        subtitle: 'Modelo ENEM Clássico de Álgebra Aplicada',
        content: 'Maximização de receita de um evento escolar.',
        questionData: {
          text: 'Um teatro com capacidade para 400 pessoas cobra R$ 30,00 por ingresso e opera com lotação esgotada. Uma pesquisa de mercado aponta que, para cada R$ 2,00 de aumento no preço do ingresso, 10 espectadores deixam de comparecer. Qual preço de ingresso maximiza a arrecadação total do teatro?',
          options: [
            { letter: 'A', text: 'R$ 35,00' },
            { letter: 'B', text: 'R$ 45,00' },
            { letter: 'C', text: 'R$ 50,00' },
            { letter: 'D', text: 'R$ 55,00' },
            { letter: 'E', text: 'R$ 60,00' }
          ],
          correctAnswer: 'D',
          explanation: 'Seja x o número de aumentos de R$ 2,00. O novo preço é P(x) = 30 + 2x e o público é Q(x) = 400 - 10x. A receita é R(x) = P(x) · Q(x) = (30 + 2x)(400 - 10x) = -20x² + 500x + 12000. O vértice ocorre em x_v = -500 / (2 · -20) = 12,5 aumentos. O preço ideal é P(12,5) = 30 + 2(12,5) = R$ 55,00!'
        },
        teacherNotes: 'Problema de alta taxa de acerto entre os alunos treinados no Colégio Visão.'
      }
    ]
  }
];

export const SlideStudio: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  const [decks, setDecks] = useState<SlideDeck[]>(PRESET_DECKS);
  const [activeDeckId, setActiveDeckId] = useState<string>(PRESET_DECKS[0].id);
  const [activeSlideIndex, setActiveSlideIndex] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [revealAnswer, setRevealAnswer] = useState<boolean>(false);
  const [laserPointerActive, setLaserPointerActive] = useState<boolean>(false);
  const [laserPos, setLaserPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Cronômetro da Aula
  const [timerSeconds, setTimerSeconds] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const activeDeck = decks.find(d => d.id === activeDeckId) || decks[0];
  const activeSlide = activeDeck.slides[activeSlideIndex] || activeDeck.slides[0];

  // Gestão do Timer de Aula
  useEffect(() => {
    if (isTimerRunning) {
      timerIntervalRef.current = setInterval(() => {
        setTimerSeconds(s => s + 1);
      }, 1000);
    } else if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isTimerRunning]);

  // Atalhos de Teclado no Modo Apresentação
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
        e.preventDefault();
        handleNextSlide();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        handlePrevSlide();
      } else if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      } else if (e.key.toLowerCase() === 'l') {
        setLaserPointerActive(prev => !prev);
      } else if (e.key.toLowerCase() === 'r') {
        setRevealAnswer(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeSlideIndex, activeDeck, isFullscreen]);

  const handleNextSlide = () => {
    if (activeSlideIndex < activeDeck.slides.length - 1) {
      setActiveSlideIndex(prev => prev + 1);
      setRevealAnswer(false);
    }
  };

  const handlePrevSlide = () => {
    if (activeSlideIndex > 0) {
      setActiveSlideIndex(prev => prev - 1);
      setRevealAnswer(false);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (laserPointerActive) {
      const rect = e.currentTarget.getBoundingClientRect();
      setLaserPos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };

  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePrintHandout = () => {
    window.print();
  };

  return (
    <div className={`slide-studio-shell ${isFullscreen ? 'fullscreen-mode' : ''}`}>
      {/* BARRA SUPERIOR DO ESTÚDIO DOCENTE */}
      {!isFullscreen && (
        <header className="slide-studio-header">
          <div className="header-left">
            {onBack && (
              <button className="back-btn" onClick={onBack} title="Voltar ao Painel">
                <ArrowLeft size={16} />
                <span>Voltar</span>
              </button>
            )}
            <div className="logo-icon-orb">
              <Presentation size={22} className="text-cyan-400" />
            </div>
            <div>
              <div className="pill-row">
                <span className="studio-pill cyan">DECK DE SLIDES INTERATIVO</span>
                <span className="studio-pill amber">LOUSA DIGITAL & PROJEÇÃO 16:9</span>
                <span className="studio-pill purple">{activeDeck.bnccCode}</span>
              </div>
              <h1>Estúdio de Slides & Aulas Interativas — Áquila Pro</h1>
              <p>Apresentações pedagógicas soberanas com exercícios TRI, ganchos socráticos e handouts imprimíveis.</p>
            </div>
          </div>

          <div className="header-actions">
            <button
              className="action-btn primary"
              onClick={() => setIsFullscreen(true)}
              title="Apresentar em Tela Cheia (F11 / Lousa Digital)"
            >
              <Maximize2 size={15} />
              <span>Apresentar em Tela Cheia</span>
            </button>
            <button
              className="action-btn"
              onClick={handlePrintHandout}
              title="Imprimir Apostila / Fichas de Estudo em PDF"
            >
              <Printer size={15} />
              <span>Imprimir Apostila (PDF)</span>
            </button>
          </div>
        </header>
      )}

      {/* SELETOR DE DECKS DA DISCIPLINA */}
      {!isFullscreen && (
        <nav className="deck-selector-strip">
          <span className="strip-label">AULAS PREPARADAS:</span>
          {decks.map(deck => (
            <button
              key={deck.id}
              className={`deck-chip ${activeDeckId === deck.id ? 'active' : ''}`}
              onClick={() => {
                setActiveDeckId(deck.id);
                setActiveSlideIndex(0);
                setRevealAnswer(false);
              }}
            >
              <span className="chip-badge">{deck.subject}</span>
              <span className="chip-title">{deck.title}</span>
            </button>
          ))}
        </nav>
      )}

      {/* ÁREA CENTRAL DE TRABALHO & PROJEÇÃO */}
      <div className="slide-workspace-grid">
        {/* LADO ESQUERDO: LISTA DE MINIATURAS DOS SLIDES */}
        {!isFullscreen && (
          <aside className="slides-thumbnails-sidebar">
            <div className="sidebar-header">
              <span>SLIDES DA AULA ({activeDeck.slides.length})</span>
            </div>
            <div className="thumbnails-scroll">
              {activeDeck.slides.map((s, idx) => (
                <div
                  key={s.id}
                  className={`thumbnail-card ${activeSlideIndex === idx ? 'active' : ''}`}
                  onClick={() => {
                    setActiveSlideIndex(idx);
                    setRevealAnswer(false);
                  }}
                >
                  <div className="thumb-index">{idx + 1}</div>
                  <div className="thumb-preview">
                    <span className="thumb-type">{s.type.toUpperCase()}</span>
                    <strong>{s.title}</strong>
                  </div>
                </div>
              ))}
            </div>
          </aside>
        )}

        {/* LADO DIREITO: PROJETOR PRINCIPAL 16:9 */}
        <main
          className="slide-stage-container"
          onMouseMove={handleMouseMove}
        >
          {/* Laser Pointer Virtual */}
          {laserPointerActive && (
            <div
              className="virtual-laser-pointer"
              style={{ left: laserPos.x, top: laserPos.y }}
            />
          )}

          {/* PALCO DO SLIDE (PROJEÇÃO 16:9) */}
          <div className={`slide-canvas slide-${activeSlide.type}`}>
            {/* Top Tag do Slide */}
            <div className="slide-top-bar">
              <span className="slide-category-tag">
                {activeDeck.subject} • {activeDeck.grade} • {activeDeck.bnccCode}
              </span>
              <span className="slide-counter-badge">
                SLIDE {activeSlideIndex + 1} / {activeDeck.slides.length}
              </span>
            </div>

            {/* Conteúdo Específico por Tipo de Slide */}
            <div className="slide-main-content">
              {activeSlide.type === 'cover' && (
                <div className="slide-cover-layout">
                  <div className="cover-icon-orb">
                    <span>{activeSlide.mentorQuote?.avatar || '🎓'}</span>
                  </div>
                  <h1 className="cover-title">{activeSlide.title}</h1>
                  <h3 className="cover-subtitle">{activeSlide.subtitle}</h3>
                  <p className="cover-footer-text">{activeSlide.content}</p>
                  {activeSlide.mentorQuote && (
                    <div className="cover-mentor-box">
                      <span className="mentor-name">💡 Mentor Histórico: {activeSlide.mentorQuote.mentorName}</span>
                      <p className="mentor-quote">"{activeSlide.mentorQuote.quote}"</p>
                    </div>
                  )}
                </div>
              )}

              {(activeSlide.type === 'hook' || activeSlide.type === 'theory' || activeSlide.type === 'formula') && (
                <div className="slide-standard-layout">
                  <h2 className="slide-heading">{activeSlide.title}</h2>
                  {activeSlide.subtitle && <h4 className="slide-subheading">{activeSlide.subtitle}</h4>}
                  <p className="slide-lead-p">{activeSlide.content}</p>

                  {activeSlide.formula && (
                    <div className="slide-formula-banner">
                      <span className="formula-label">MODELO MATEMÁTICO:</span>
                      <strong className="formula-text">{activeSlide.formula}</strong>
                    </div>
                  )}

                  {activeSlide.bulletPoints && (
                    <ul className="slide-bullets-list">
                      {activeSlide.bulletPoints.map((b, i) => (
                        <li key={i}>
                          <span className="bullet-dot" />
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {activeSlide.mentorQuote && (
                    <div className="slide-footer-mentor">
                      <span className="mentor-avatar">{activeSlide.mentorQuote.avatar}</span>
                      <div className="mentor-dialogue">
                        <strong>{activeSlide.mentorQuote.mentorName}:</strong>
                        <span>"{activeSlide.mentorQuote.quote}"</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeSlide.type === 'question' && activeSlide.questionData && (
                <div className="slide-question-layout">
                  <div className="q-badge-row">
                    <span className="q-type-badge">ITEM DE VESTIBULAR / TRI</span>
                    <h2>{activeSlide.title}</h2>
                  </div>
                  <p className="q-problem-text">{activeSlide.questionData.text}</p>

                  <div className="q-options-grid">
                    {activeSlide.questionData.options.map(opt => {
                      const isCorrect = opt.letter === activeSlide.questionData?.correctAnswer;
                      return (
                        <div
                          key={opt.letter}
                          className={`q-option-card ${revealAnswer && isCorrect ? 'correct-highlight' : ''}`}
                        >
                          <span className="q-letter">{opt.letter}</span>
                          <span className="q-text">{opt.text}</span>
                          {revealAnswer && isCorrect && (
                            <CheckCircle2 size={18} className="text-emerald-400 q-check-icon" />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {revealAnswer && (
                    <div className="q-resolution-box animate-fade-in">
                      <div className="res-header">
                        <CheckCircle2 size={16} color="#10B981" />
                        <strong>Resolução & Análise de Distratores:</strong>
                      </div>
                      <p>{activeSlide.questionData.explanation}</p>
                    </div>
                  )}
                </div>
              )}

              {activeSlide.type === 'exit_ticket' && (
                <div className="slide-exit-layout">
                  <div className="exit-banner">
                    <Clock size={28} color="#F59E0B" />
                    <div>
                      <h2>{activeSlide.title}</h2>
                      <span>{activeSlide.subtitle}</span>
                    </div>
                  </div>
                  <p className="exit-intro">{activeSlide.content}</p>
                  <div className="exit-cards-grid">
                    {activeSlide.bulletPoints?.map((item, i) => (
                      <div key={i} className="exit-prompt-card">
                        <span className="prompt-num">#{i + 1}</span>
                        <p>{item}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* BARRA DE CONTROLE INFERIOR DO SLIDE */}
            <div className="slide-hud-controls">
              <div className="hud-left">
                <button
                  className="hud-btn"
                  onClick={handlePrevSlide}
                  disabled={activeSlideIndex === 0}
                  title="Slide Anterior (Seta Esquerda)"
                >
                  <ChevronLeft size={16} />
                  <span>Anterior</span>
                </button>
                <button
                  className="hud-btn"
                  onClick={handleNextSlide}
                  disabled={activeSlideIndex === activeDeck.slides.length - 1}
                  title="Próximo Slide (Espaço ou Seta Direita)"
                >
                  <span>Próximo</span>
                  <ChevronRight size={16} />
                </button>
              </div>

              {/* Controles de Lousa & Interação */}
              <div className="hud-center">
                {activeSlide.type === 'question' && (
                  <button
                    className={`hud-tool-btn ${revealAnswer ? 'active' : ''}`}
                    onClick={() => setRevealAnswer(prev => !prev)}
                    title="Revelar ou Ocultar Resposta (Tecla R)"
                  >
                    {revealAnswer ? <EyeOff size={15} /> : <Eye size={15} />}
                    <span>{revealAnswer ? 'Ocultar Gabarito' : 'Revelar Gabarito'}</span>
                  </button>
                )}

                <button
                  className={`hud-tool-btn ${laserPointerActive ? 'active' : ''}`}
                  onClick={() => setLaserPointerActive(prev => !prev)}
                  title="Ativar Apontador Laser Virtual (Tecla L)"
                >
                  <span className="laser-dot-icon" />
                  <span>Laser {laserPointerActive ? 'Ligado' : 'Desligado'}</span>
                </button>

                {/* Cronômetro de Aula */}
                <div className="hud-timer-widget">
                  <button
                    className="timer-toggle-btn"
                    onClick={() => setIsTimerRunning(r => !r)}
                    title="Iniciar ou Pausar Tempo de Aula"
                  >
                    <Clock size={14} color="#00F0FF" />
                    <span className="timer-display">{formatTimer(timerSeconds)}</span>
                  </button>
                  <button
                    className="timer-reset-btn"
                    onClick={() => { setTimerSeconds(0); setIsTimerRunning(false); }}
                    title="Zerar Cronômetro"
                  >
                    00:00
                  </button>
                </div>
              </div>

              <div className="hud-right">
                <button
                  className="hud-btn fullscreen-btn"
                  onClick={() => setIsFullscreen(v => !v)}
                  title={isFullscreen ? 'Sair da Tela Cheia (Esc)' : 'Tela Cheia'}
                >
                  {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                  <span>{isFullscreen ? 'Sair' : 'Tela Cheia'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* NOTAS PEDAGÓGICAS DO PROFESSOR (APENAS FORA DA TELA CHEIA) */}
          {!isFullscreen && activeSlide.teacherNotes && (
            <div className="teacher-notes-panel">
              <div className="notes-header">
                <Lightbulb size={14} color="#F59E0B" />
                <span>Notas Pedagógicas do Professor (Visão Privada):</span>
              </div>
              <p>{activeSlide.teacherNotes}</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default SlideStudio;
