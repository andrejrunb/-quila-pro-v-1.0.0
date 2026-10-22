import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Swords,
  Shield,
  Zap,
  Trophy,
  Timer,
  Flame,
  Crown,
  Users,
  Sparkles,
  Volume2,
  VolumeX,
  RotateCcw,
  CheckCircle2,
  XCircle,
  ChevronRight,
  ArrowLeft,
  Target,
  Heart,
  Award,
  Skull,
  Radio
} from 'lucide-react';
import { TRI_ITEM_BANK, TriQuestion } from '../utils/triItemBank';
import { HISTORICAL_CHARACTERS, HistoricalCharacter } from '../utils/historicalPersonas';
import { STUDENTS } from '../../database/studentsData';
import './SovereignPvPArena.css';

interface SovereignPvPArenaProps {
  studentId?: string;
  studentName?: string;
  onBack?: () => void;
  onRewardXp?: (amount: number, reason: string) => void;
}

type ArenaMode = 'pvp' | 'boss_raid' | 'tournament';
type BattleState = 'lobby' | 'countdown' | 'battling' | 'round_result' | 'game_over';

interface OpponentProfile {
  id: string;
  name: string;
  className: string;
  avatarIcon: string;
  triRating: number;
  aiSkillLevel: 'facil' | 'medio' | 'mestre';
}

interface MentorBoss {
  characterId: string;
  title: string;
  epoch: string;
  avatarIcon: string;
  discipline: string;
  maxHp: number;
  bossQuote: string;
  introTaunt: string;
  defeatQuote: string;
  badgeReward: string;
}

const MENTOR_BOSSES: MentorBoss[] = [
  {
    characterId: 'EINSTEIN',
    title: 'Albert Einstein — O Guardião do Espaço-Tempo',
    epoch: '1879–1955',
    avatarIcon: '🌌',
    discipline: 'Física',
    maxHp: 2500,
    bossQuote: 'A imaginação é mais poderosa que o conhecimento puro. Consegue dobrar o meu referencial?',
    introTaunt: 'Saudações! Vamos testar se seu raciocínio resiste à curvatura do espaço e ao efeito fotoelétrico.',
    defeatQuote: 'Magnífico! Você compreendeu a invariância das leis fundamentais. Receba minha bênção da Relatividade!',
    badgeReward: 'Insígnia de Ouro de Einstein'
  },
  {
    characterId: 'MARIE_CURIE',
    title: 'Marie Curie — A Soberana do Núcleo Atômico',
    epoch: '1867–1934',
    avatarIcon: '🔬',
    discipline: 'Química',
    maxHp: 2200,
    bossQuote: 'Na vida não há nada a temer, apenas a compreender. Que comece o bombardeamento de partículas!',
    introTaunt: 'No meu laboratório em Paris isolamos o Rádio. Você domina a meia-vida e as emissões nucleares?',
    defeatQuote: 'Rigor e precisão admirável! O núcleo do átomo não guarda mais segredos para você.',
    badgeReward: 'Insígnia de Polônio de Marie Curie'
  },
  {
    characterId: 'NEWTON',
    title: 'Isaac Newton — O Mestre das Três Leis',
    epoch: '1643–1727',
    avatarIcon: '🍎',
    discipline: 'Física',
    maxHp: 2400,
    bossQuote: 'Hipóteses não invento. Demonstre com rigor vetorial a ação e reação!',
    introTaunt: 'Se vi mais longe, foi por estar sobre ombros de gigantes. Prove que merece estar aqui.',
    defeatQuote: 'Sua dinâmica é impecável. A gravitação universal reconhece sua maestria mecânica!',
    badgeReward: 'Láurea Real dos Principia de Newton'
  },
  {
    characterId: 'MENDEL',
    title: 'Gregor Mendel — O Decifrador da Hereditariedade',
    epoch: '1822–1884',
    avatarIcon: '🌱',
    discipline: 'Biologia',
    maxHp: 2000,
    bossQuote: 'Mais de 28.000 ervilhas revelaram o padrão. Decifre a proporção fenotípica!',
    introTaunt: 'Bem-vindo ao mosteiro de Brno. Alelos dominantes e recessivos decidirão esta contenda.',
    defeatQuote: 'Seu quadro de Punnett foi perfeito. A Primeira e Segunda Leis estão consolidadas!',
    badgeReward: 'Semente Dourada da Genética de Mendel'
  },
  {
    characterId: 'MACHADO_DE_ASSIS',
    title: 'Machado de Assis — O Bruxo do Cosme Velho',
    epoch: '1839–1908',
    avatarIcon: '📜',
    discipline: 'Português',
    maxHp: 2100,
    bossQuote: 'Ao vencedor, as batatas! Veremos se sua interpretação ultrapassa o olhar oblíquo e dissimulado.',
    introTaunt: 'A crítica social e a fina ironia realista são armas afiadas. Esteja pronto para a sutileza.',
    defeatQuote: 'Capitu teria inveja de tamanha perspicácia. Domina a norma padrão e o subtexto lítero-filosófico!',
    badgeReward: 'Comenda Imortal da Academia Brasileira'
  }
];

export const SovereignPvPArena: React.FC<SovereignPvPArenaProps> = ({
  studentId = 'demo_student',
  studentName = 'Gabriel Rocha',
  onBack,
  onRewardXp
}) => {
  const [arenaMode, setArenaMode] = useState<ArenaMode>('pvp');
  const [battleState, setBattleState] = useState<BattleState>('lobby');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [xpBet, setXpBet] = useState<number>(100);

  // Seleção de Disciplina / Tópico
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>('TODAS');

  // Seleção de Oponente PvP
  const [selectedOpponentIdx, setSelectedOpponentIdx] = useState<number>(0);
  const [selectedBossIdx, setSelectedBossIdx] = useState<number>(0);

  // Estado do Combate
  const [round, setRound] = useState<number>(1);
  const maxRounds = 5;
  const [timeLeft, setTimeLeft] = useState<number>(20);
  const [playerHp, setPlayerHp] = useState<number>(1000);
  const [playerMaxHp] = useState<number>(1000);
  const [playerScore, setPlayerScore] = useState<number>(0);
  const [playerStreak, setPlayerStreak] = useState<number>(0);

  const [opponentHp, setOpponentHp] = useState<number>(1000);
  const [opponentMaxHp, setOpponentMaxHp] = useState<number>(1000);
  const [opponentScore, setOpponentScore] = useState<number>(0);

  const [selectedAnswer, setSelectedAnswer] = useState<'A' | 'B' | 'C' | 'D' | 'E' | null>(null);
  const [opponentAnswered, setOpponentAnswered] = useState<boolean>(false);
  const [roundFinished, setRoundFinished] = useState<boolean>(false);
  const [roundFeedback, setRoundFeedback] = useState<string | null>(null);

  // Questão Ativa
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Lista de Oponentes Colegas de Sala
  const classmates: OpponentProfile[] = useMemo(() => {
    const list = STUDENTS.slice(0, 10);
    return list.map((s, idx) => ({
      id: s.registrationNumber,
      name: s.name,
      className: s.classId || '3º Ano A',
      avatarIcon: ['⚡', '🎯', '🔥', '🧠', '🛡️', '⚔️', '🦅', '💎', '🚀', '🌟'][idx % 10],
      triRating: 620 + (idx * 25),
      aiSkillLevel: idx < 3 ? 'facil' : idx < 7 ? 'medio' : 'mestre'
    }));
  }, []);

  const activeOpponent = classmates[selectedOpponentIdx] || classmates[0];
  const activeBoss = MENTOR_BOSSES[selectedBossIdx] || MENTOR_BOSSES[0];

  // Questões Filtradas
  const battleQuestions: TriQuestion[] = useMemo(() => {
    let list = TRI_ITEM_BANK;
    if (arenaMode === 'boss_raid') {
      const bossDiscipline = activeBoss.discipline.toLowerCase();
      list = TRI_ITEM_BANK.filter(q => q.discipline.toLowerCase() === bossDiscipline);
    } else if (selectedDiscipline !== 'TODAS') {
      list = TRI_ITEM_BANK.filter(q => q.discipline.toLowerCase() === selectedDiscipline.toLowerCase());
    }
    return list.length >= 5 ? list : TRI_ITEM_BANK;
  }, [arenaMode, activeBoss, selectedDiscipline]);

  const currentQ = battleQuestions[currentQuestionIdx % battleQuestions.length] || TRI_ITEM_BANK[0];

  // Locutor Socrático (Síntese TTS)
  const speakNarrator = (text: string) => {
    if (isMuted || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const clean = text.replace(/[*#_`>]/g, '');
    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.lang = 'pt-BR';
    utterance.rate = 1.1;
    window.speechSynthesis.speak(utterance);
  };

  // Iniciar Batalha
  const handleStartBattle = () => {
    setRound(1);
    setCurrentQuestionIdx(Math.floor(Math.random() * Math.max(1, battleQuestions.length - 5)));
    setPlayerHp(playerMaxHp);
    setPlayerScore(0);
    setPlayerStreak(0);
    setSelectedAnswer(null);
    setOpponentAnswered(false);
    setRoundFinished(false);
    setRoundFeedback(null);

    const initialOpponentHp = arenaMode === 'boss_raid' ? activeBoss.maxHp : 1000;
    setOpponentHp(initialOpponentHp);
    setOpponentMaxHp(initialOpponentHp);
    setOpponentScore(0);

    setBattleState('countdown');
    speakNarrator(
      arenaMode === 'boss_raid'
        ? `Desafio Lendário! ${activeBoss.title}. ${activeBoss.introTaunt}`
        : `Duelo iniciado! ${studentName} contra ${activeOpponent.name}. Que vença o melhor raciocínio!`
    );

    setTimeout(() => {
      setBattleState('battling');
      startRoundTimer();
    }, 2500);
  };

  // Timer da Rodada (20s)
  const startRoundTimer = () => {
    setTimeLeft(20);
    setSelectedAnswer(null);
    setOpponentAnswered(false);
    setRoundFinished(false);
    setRoundFeedback(null);

    if (timerRef.current) clearInterval(timerRef.current);

    // Oponente virtual responde em momento dinâmico
    const opponentDelaySec = arenaMode === 'boss_raid'
      ? Math.floor(6 + Math.random() * 8) // Boss responde com sabedoria entre 6 e 14s
      : activeOpponent.aiSkillLevel === 'mestre'
      ? Math.floor(4 + Math.random() * 6)
      : Math.floor(7 + Math.random() * 9);

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev === 20 - opponentDelaySec) {
          setOpponentAnswered(true);
        }
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleTimeExpire();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Expiração do Tempo
  const handleTimeExpire = () => {
    if (roundFinished) return;
    resolveRound(null);
  };

  // Jogador seleciona uma alternativa
  const handlePlayerSelectAnswer = (letter: 'A' | 'B' | 'C' | 'D' | 'E') => {
    if (selectedAnswer || roundFinished) return;
    setSelectedAnswer(letter);

    if (timerRef.current) clearInterval(timerRef.current);
    setTimeout(() => {
      resolveRound(letter);
    }, 600);
  };

  // Resolução da Rodada
  const resolveRound = (chosen: 'A' | 'B' | 'C' | 'D' | 'E' | null) => {
    setRoundFinished(true);
    const isCorrect = chosen === currentQ.correctAnswer;

    // Acerto do Oponente (Probabilidade baseada na habilidade)
    const opponentAccuracy = arenaMode === 'boss_raid' ? 0.85 : activeOpponent.aiSkillLevel === 'mestre' ? 0.8 : 0.65;
    const opponentIsCorrect = Math.random() < opponentAccuracy;

    let pDamage = 0;
    let oDamage = 0;
    let feedback = '';

    if (isCorrect) {
      const timeBonus = Math.round(timeLeft * 25);
      const streakBonus = Math.min(3, playerStreak + 1);
      const roundPoints = (1000 + timeBonus) * streakBonus;

      setPlayerScore(s => s + roundPoints);
      setPlayerStreak(s => s + 1);

      oDamage = arenaMode === 'boss_raid' ? 500 : 250;
      setOpponentHp(hp => Math.max(0, hp - oDamage));

      feedback = `🔥 ACERTO CRÍTICO! +${roundPoints} pts (Bônus de tempo: +${timeBonus}). ${currentQ.socraticExplanation}`;
      speakNarrator('Resposta exata! Acerto crítico!');
    } else {
      setPlayerStreak(0);
      pDamage = chosen === null ? 220 : 180;
      setPlayerHp(hp => Math.max(0, hp - pDamage));

      feedback = chosen === null
        ? `⏰ Tempo esgotado! A resposta correta era a letra ${currentQ.correctAnswer}. ${currentQ.socraticExplanation}`
        : `❌ Resposta incorreta! Você marcou ${chosen}, mas o correto era ${currentQ.correctAnswer}. ${currentQ.socraticExplanation}`;
      speakNarrator(`Incorreto. A alternativa correta era a letra ${currentQ.correctAnswer}.`);
    }

    if (opponentIsCorrect) {
      const oppPoints = 1000 + Math.floor(Math.random() * 400);
      setOpponentScore(s => s + oppPoints);
    } else {
      // Oponente errou, toma dano residual
      setOpponentHp(hp => Math.max(0, hp - 120));
    }

    setRoundFeedback(feedback);
    setBattleState('round_result');
  };

  // Avançar Rodada ou Finalizar Partida
  const handleNextRound = () => {
    if (round >= maxRounds || playerHp <= 0 || opponentHp <= 0) {
      finishGame();
      return;
    }
    setRound(r => r + 1);
    setCurrentQuestionIdx(i => i + 1);
    setBattleState('battling');
    startRoundTimer();
  };

  // Finalizar Batalha
  const finishGame = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setBattleState('game_over');

    const playerWon = playerScore >= opponentScore && playerHp > 0;
    if (playerWon) {
      const xpWon = xpBet * 2;
      onRewardXp?.(xpWon, `Vitória na Arena Áquila contra ${arenaMode === 'boss_raid' ? activeBoss.title : activeOpponent.name}`);
      speakNarrator(
        arenaMode === 'boss_raid'
          ? `Incrível! Você derrotou ${activeBoss.title}! ${activeBoss.defeatQuote}`
          : `Vitória esmagadora de ${studentName}! ${xpWon} XP creditados com louvor!`
      );
    } else {
      speakNarrator('Combate encerrado. O conhecimento exige paciência e persistência.');
    }
  };

  const isPlayerWinner = playerScore >= opponentScore && playerHp > 0;

  return (
    <div className="sovereign-pvp-arena animate-fade-in">
      {/* HEADER PRINCIPAL */}
      <header className="arena-header">
        <div className="arena-header-left">
          {onBack && (
            <button className="arena-back-btn" onClick={onBack} title="Voltar ao Painel">
              <ArrowLeft size={16} />
              <span>Voltar</span>
            </button>
          )}
          <div className="arena-logo-box">
            <Swords size={20} className="arena-pulse-icon" />
          </div>
          <div>
            <h1>Arena de Batalhas Pedagógicas Soberana</h1>
            <span className="arena-subtitle">Duelos PvP & Boss Raids em Rede Local • Sem Internet</span>
          </div>
        </div>

        <div className="arena-header-actions">
          <button
            className="mute-btn"
            onClick={() => setIsMuted(v => !v)}
            title={isMuted ? 'Ativar Locutor Socrático' : 'Silenciar Áudio'}
          >
            {isMuted ? <VolumeX size={15} color="#64748b" /> : <Volume2 size={15} color="#00F0FF" />}
            <span>{isMuted ? 'Locutor Mudo' : 'Locutor Ativo'}</span>
          </button>
        </div>
      </header>

      {/* ============================================================== */}
      {/* 1. ESTADO: LOBBY DE SELEÇÃO                                    */}
      {/* ============================================================== */}
      {battleState === 'lobby' && (
        <div className="arena-lobby-grid">
          {/* Seletor de Modos */}
          <div className="lobby-panel modes-panel">
            <h3 className="lobby-panel-title">
              <Target size={15} /> 1. Escolha o Modo de Combate
            </h3>

            <div className="modes-cards-row">
              <div
                className={`mode-card ${arenaMode === 'pvp' ? 'active' : ''}`}
                onClick={() => setArenaMode('pvp')}
              >
                <div className="mode-icon-wrapper pvp-icon">
                  <Swords size={28} />
                </div>
                <h4>Duelo Socrático 1v1 (PvP)</h4>
                <p>Dispute rodadas rápidas com tempo real contra colegas de turma cadastrados na escola.</p>
                <span className="mode-reward-badge">+200 XP por Vitória</span>
              </div>

              <div
                className={`mode-card ${arenaMode === 'boss_raid' ? 'active' : ''}`}
                onClick={() => setArenaMode('boss_raid')}
              >
                <div className="mode-icon-wrapper boss-icon">
                  <Crown size={28} />
                </div>
                <h4>Boss Raid: Mentor Histórico</h4>
                <p>Enfrente cientistas lendários em domínio público. Acerte 4 de 5 para conquistar a Insígnia.</p>
                <span className="mode-reward-badge gold">+500 XP & Insígnia</span>
              </div>

              <div
                className={`mode-card ${arenaMode === 'tournament' ? 'active' : ''}`}
                onClick={() => setArenaMode('tournament')}
              >
                <div className="mode-icon-wrapper tourney-icon">
                  <Trophy size={28} />
                </div>
                <h4>Torneio ao Vivo da Sala</h4>
                <p>O professor abre a arena e toda a turma compete em tempo real no Leaderboard local.</p>
                <span className="mode-reward-badge purple">Troféu Bimestral</span>
              </div>
            </div>

            {/* Disciplina da Batalha */}
            <div className="filter-discipline-row">
              <span>Área do Conhecimento:</span>
              {['TODAS', 'Matemática', 'Física', 'Química', 'Biologia', 'História', 'Linguagens'].map(d => (
                <button
                  key={d}
                  className={`discipline-chip ${selectedDiscipline === d ? 'active' : ''}`}
                  onClick={() => setSelectedDiscipline(d)}
                >
                  {d}
                </button>
              ))}
            </div>

            {/* Aposta de XP */}
            <div className="xp-bet-row">
              <span>Aposta Soberana de XP:</span>
              {[50, 100, 250, 500].map(val => (
                <button
                  key={val}
                  className={`bet-chip ${xpBet === val ? 'active' : ''}`}
                  onClick={() => setXpBet(val)}
                >
                  💎 {val} XP
                </button>
              ))}
            </div>
          </div>

          {/* Seletor de Oponente ou Mentor */}
          <div className="lobby-panel opponent-panel">
            {arenaMode === 'boss_raid' ? (
              <>
                <h3 className="lobby-panel-title">
                  <Crown size={15} color="#F59E0B" /> 2. Escolha o Cientista Lendário
                </h3>
                <div className="boss-selection-list">
                  {MENTOR_BOSSES.map((boss, idx) => (
                    <div
                      key={boss.characterId}
                      className={`boss-card ${selectedBossIdx === idx ? 'active' : ''}`}
                      onClick={() => setSelectedBossIdx(idx)}
                    >
                      <div className="boss-avatar">{boss.avatarIcon}</div>
                      <div className="boss-info">
                        <strong>{boss.title}</strong>
                        <span className="boss-sub">{boss.discipline} • Época: {boss.epoch}</span>
                        <p className="boss-quote">"{boss.bossQuote}"</p>
                      </div>
                      <span className="boss-hp-tag">{boss.maxHp} HP</span>
                    </div>
                  ))}
                </div>
              </>
            ) : arenaMode === 'tournament' ? (
              <>
                <h3 className="lobby-panel-title">
                  <Radio size={15} color="#A78BFA" /> Sala LAN de Torneio da Turma
                </h3>
                <div className="tourney-lobby-box">
                  <div className="tourney-code-banner">
                    <span className="code-label">CÓDIGO DA SALA LOCAL (LAN):</span>
                    <strong className="code-text">AQUI-3A</strong>
                    <span className="code-sub">24 Estudantes Conectados no Wi-Fi da Escola</span>
                  </div>
                  <div className="connected-students-grid">
                    {classmates.map((c, i) => (
                      <div key={c.id} className="connected-student-pill">
                        <span>{c.avatarIcon}</span>
                        <span>{c.name.split(' ')[0]}</span>
                        <span className="rating-tag">{c.triRating} pts</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <>
                <h3 className="lobby-panel-title">
                  <Users size={15} color="#00F0FF" /> 2. Escolha o Colega para Duelar
                </h3>
                <div className="opponents-list">
                  {classmates.map((opp, idx) => (
                    <div
                      key={opp.id}
                      className={`opponent-select-card ${selectedOpponentIdx === idx ? 'active' : ''}`}
                      onClick={() => setSelectedOpponentIdx(idx)}
                    >
                      <div className="opponent-avatar">{opp.avatarIcon}</div>
                      <div className="opponent-info">
                        <strong>{opp.name}</strong>
                        <span className="opponent-class">{opp.className} • TRI: {opp.triRating} pts</span>
                      </div>
                      <span className={`ai-skill-badge ${opp.aiSkillLevel}`}>
                        {opp.aiSkillLevel.toUpperCase()}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Botão de Iniciar Combate */}
            <div className="lobby-start-bar">
              <button className="start-battle-btn" onClick={handleStartBattle}>
                <Swords size={20} />
                <span>Iniciar Batalha na Arena (+{xpBet * 2} XP)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. ESTADO: CONTAGEM REGRESSIVA (COUNTDOWN)                     */}
      {/* ============================================================== */}
      {battleState === 'countdown' && (
        <div className="arena-countdown-stage">
          <div className="countdown-card">
            <span className="countdown-badge">PREPARE-SE PARA O DUELO</span>
            <h2>{arenaMode === 'boss_raid' ? activeBoss.title : `${studentName} VS ${activeOpponent.name}`}</h2>
            <div className="countdown-circle">
              <Sparkles size={48} className="spin-slow" />
            </div>
            <p>
              {arenaMode === 'boss_raid'
                ? `"${activeBoss.introTaunt}"`
                : 'Responda com velocidade e precisão para acumular multiplicadores e vencer a rodada!'}
            </p>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. ESTADO: BATALHA ATIVA OU RESULTADO DA RODADA               */}
      {/* ============================================================== */}
      {(battleState === 'battling' || battleState === 'round_result') && (
        <div className="arena-combat-stage">
          {/* Top Fighter HUD (Barras de Vida e Placar) */}
          <div className="combat-hud">
            {/* Lado Jogador */}
            <div className="fighter-side player-side">
              <div className="fighter-meta">
                <span className="fighter-avatar">🦅</span>
                <div>
                  <strong>{studentName}</strong>
                  <span className="fighter-streak">
                    {playerStreak > 1 ? `⚡ COMBO x${playerStreak}!` : 'Normal'}
                  </span>
                </div>
              </div>
              <div className="hp-bar-bg">
                <div
                  className="hp-bar-fill player-hp"
                  style={{ width: `${(playerHp / playerMaxHp) * 100}%` }}
                />
              </div>
              <div className="fighter-score-row">
                <span className="fighter-hp-text">{playerHp}/{playerMaxHp} HP</span>
                <span className="fighter-score-val">{playerScore} pts</span>
              </div>
            </div>

            {/* Centro: Timer e Rodada */}
            <div className="combat-center-timer">
              <div className="round-badge">RODADA {round} / {maxRounds}</div>
              <div className={`timer-ring ${timeLeft <= 5 ? 'timer-danger' : ''}`}>
                <Timer size={16} />
                <span>{timeLeft}s</span>
              </div>
              <span className="center-tri-badge">TRI: {Math.round(currentQ.paramB * 100 + 500)} pts</span>
            </div>

            {/* Lado Oponente / Boss */}
            <div className="fighter-side opponent-side">
              <div className="fighter-meta opponent-meta">
                <div style={{ textAlign: 'right' }}>
                  <strong>{arenaMode === 'boss_raid' ? activeBoss.title.split('—')[0] : activeOpponent.name}</strong>
                  <span className="fighter-streak opponent-tag">
                    {arenaMode === 'boss_raid' ? 'MENTOR BOSS' : activeOpponent.aiSkillLevel.toUpperCase()}
                  </span>
                </div>
                <span className="fighter-avatar">
                  {arenaMode === 'boss_raid' ? activeBoss.avatarIcon : activeOpponent.avatarIcon}
                </span>
              </div>
              <div className="hp-bar-bg">
                <div
                  className="hp-bar-fill opponent-hp"
                  style={{ width: `${(opponentHp / opponentMaxHp) * 100}%` }}
                />
              </div>
              <div className="fighter-score-row" style={{ justifyContent: 'flex-end', gap: '1rem' }}>
                <span className="fighter-score-val" style={{ color: '#F59E0B' }}>{opponentScore} pts</span>
                <span className="fighter-hp-text">{opponentHp}/{opponentMaxHp} HP</span>
              </div>
            </div>
          </div>

          {/* Card da Questão do Duelo */}
          <div className="combat-question-card">
            <div className="combat-question-header">
              <span className="q-discipline-tag">{currentQ.discipline} • {currentQ.skillCode}</span>
              <span className="q-desc-tag">{currentQ.skillDescription}</span>
              {opponentAnswered && (
                <span className="opponent-answered-pill">
                  ✓ Oponente já respondeu!
                </span>
              )}
            </div>

            <h3 className="combat-question-text">{currentQ.text}</h3>

            {/* Grid de Alternativas A-E */}
            <div className="combat-options-grid">
              {currentQ.options.map(opt => {
                const isSelected = selectedAnswer === opt.letter;
                const isCorrect = opt.letter === currentQ.correctAnswer;
                let optStateClass = '';

                if (battleState === 'round_result') {
                  if (isCorrect) optStateClass = 'correct-choice';
                  else if (isSelected) optStateClass = 'wrong-choice';
                } else if (isSelected) {
                  optStateClass = 'selected-choice';
                }

                return (
                  <button
                    key={opt.letter}
                    className={`combat-option-btn ${optStateClass}`}
                    onClick={() => handlePlayerSelectAnswer(opt.letter)}
                    disabled={selectedAnswer !== null || battleState === 'round_result'}
                  >
                    <span className="opt-letter">{opt.letter}</span>
                    <span className="opt-text">{opt.text}</span>
                    {battleState === 'round_result' && isCorrect && (
                      <CheckCircle2 size={16} className="text-emerald-400" />
                    )}
                    {battleState === 'round_result' && isSelected && !isCorrect && (
                      <XCircle size={16} className="text-rose-400" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Feedback da Rodada */}
            {battleState === 'round_result' && (
              <div className="round-result-banner animate-fade-in">
                <p>{roundFeedback}</p>
                <button className="next-round-btn" onClick={handleNextRound}>
                  <span>{round >= maxRounds || playerHp <= 0 || opponentHp <= 0 ? 'Ver Placar Final' : 'Próxima Rodada'}</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 4. ESTADO: FIM DE JOGO (GAME OVER / VITÓRIA)                   */}
      {/* ============================================================== */}
      {battleState === 'game_over' && (
        <div className="arena-gameover-stage animate-fade-in">
          <div className="gameover-card">
            <div className="trophy-spotlight">
              {isPlayerWinner ? <Trophy size={60} color="#F59E0B" /> : <Skull size={60} color="#94a3b8" />}
            </div>

            <h2 className="gameover-title" style={{ color: isPlayerWinner ? '#10B981' : '#F59E0B' }}>
              {isPlayerWinner ? '🏆 VITÓRIA ESMAGADORA!' : 'COMBATE FINALIZADO'}
            </h2>

            <p className="gameover-sub">
              {isPlayerWinner
                ? arenaMode === 'boss_raid'
                  ? `Você decifrou o enigma e superou ${activeBoss.title}! "${activeBoss.defeatQuote}"`
                  : `Você superou ${activeOpponent.name} com maestria e velocidade socrática!`
                : 'O oponente acumulou maior consistência neste duelo. Revise o banco de itens e tente a revanche!'}
            </p>

            {/* Placar Final */}
            <div className="final-score-strip">
              <div className="final-score-col">
                <span className="score-label">{studentName} (Você)</span>
                <span className="score-value" style={{ color: '#00F0FF' }}>{playerScore} pts</span>
                <span className="score-hp">HP Restante: {playerHp}</span>
              </div>
              <div className="score-divider">VS</div>
              <div className="final-score-col">
                <span className="score-label">{arenaMode === 'boss_raid' ? activeBoss.title.split('—')[0] : activeOpponent.name}</span>
                <span className="score-value" style={{ color: '#F59E0B' }}>{opponentScore} pts</span>
                <span className="score-hp">HP Restante: {opponentHp}</span>
              </div>
            </div>

            {/* Recompensa Conquistada */}
            {isPlayerWinner && (
              <div className="reward-conquest-box">
                <Award size={20} color="#F59E0B" />
                <div>
                  <strong>+{xpBet * 2} XP Soberanos Creditados!</strong>
                  {arenaMode === 'boss_raid' && (
                    <span className="badge-unlocked">
                      🌟 Desbloqueada: {activeBoss.badgeReward}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Ações Finais */}
            <div className="gameover-actions">
              <button className="arena-action-btn primary" onClick={handleStartBattle}>
                <RotateCcw size={16} />
                <span>Revanche Imediata</span>
              </button>
              <button className="arena-action-btn" onClick={() => setBattleState('lobby')}>
                <Target size={16} />
                <span>Voltar ao Lobby da Arena</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SovereignPvPArena;
