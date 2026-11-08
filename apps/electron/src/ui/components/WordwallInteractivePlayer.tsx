import React, { useState, useEffect, useMemo } from 'react';
import {
  Gamepad2,
  Trophy,
  Timer,
  Sparkles,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Volume2,
  VolumeX,
  ArrowRight,
  Flame,
  Award,
  Layers,
  Plane,
  Grid,
  Radio,
  Split,
  Box,
  Compass,
  Link2,
  CheckSquare,
  Palette,
  Gem,
  Shuffle
} from 'lucide-react';
import {
  WordwallGameEngine,
  WordwallTemplateType,
  WordwallVisualThemeId,
  GameDefinition,
  GameGroupSortPayload,
  GameMazeChasePayload,
  GameGameshowPayload,
  GameAirplanePayload,
  GameMatchingPairsPayload,
  GameTrueFalsePayload,
  GameOpenTheBoxPayload,
  GameRandomWheelPayload
} from '../../services/WordwallGameEngine';

interface WordwallInteractivePlayerProps {
  initialGame?: GameDefinition;
  onFinish?: (score: number, maxScore: number) => void;
  onClose?: () => void;
}

export const WordwallInteractivePlayer: React.FC<WordwallInteractivePlayerProps> = ({
  initialGame,
  onFinish,
  onClose
}) => {
  const presetGames = useMemo<GameDefinition[]>(() => [
    WordwallGameEngine.createSimuladoTriBncc2026Game(),
    WordwallGameEngine.createFisicaGameshow(),
    WordwallGameEngine.createOlimpiadasOpenTheBoxGame(),
    WordwallGameEngine.createLeisFisicaMatchingGame(),
    WordwallGameEngine.createRoletaSoberanaGame(),
    WordwallGameEngine.createAlavancasGroupSortGame(),
    WordwallGameEngine.createRiosVoadoresMazeGame(),
    WordwallGameEngine.createEletricidadeAirplaneGame()
  ], []);

  const visualThemes = useMemo(() => WordwallGameEngine.getVisualThemes(), []);
  const switchableModalities = useMemo(() => WordwallGameEngine.getCatalogModalities(), []);

  const [activeGame, setActiveGame] = useState<GameDefinition>(initialGame || presetGames[0]);
  const [selectedThemeId, setSelectedThemeId] = useState<WordwallVisualThemeId>(() => {
    const saved = typeof window !== 'undefined' ? window.localStorage.getItem('aquila_wordwall_theme') : null;
    return (saved as WordwallVisualThemeId) || 'cosmic_galaxy';
  });
  const [aureusEarned, setAureusEarned] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [calmReadingMode, setCalmReadingMode] = useState<boolean>(false);
  const [gameOver, setGameOver] = useState<boolean>(false);

  // Group Sort State
  const [groupSortAssignments, setGroupSortAssignments] = useState<Record<string, string>>({});
  const [groupSortValidated, setGroupSortValidated] = useState<boolean>(false);

  // Gameshow State
  const [gameshowIndex, setGameshowIndex] = useState<number>(0);
  const [gameshowSelected, setGameshowSelected] = useState<string | null>(null);
  const [gameshowTimeRemaining, setGameshowTimeRemaining] = useState<number>(45);
  const [hidden5050, setHidden5050] = useState<string[]>([]);
  const [hintActive, setHintActive] = useState<boolean>(false);

  // Maze State
  const [mazeStageIndex, setMazeStageIndex] = useState<number>(0);
  const [mazeLives, setMazeLives] = useState<number>(3);
  const [mazeFeedback, setMazeFeedback] = useState<string | null>(null);

  // Airplane State
  const [airplaneIndex, setAirplaneIndex] = useState<number>(0);
  const [airplaneFuel, setAirplaneFuel] = useState<number>(100);
  const [airplaneFeedback, setAirplaneFeedback] = useState<string | null>(null);

  // Matching Pairs State
  const [selectedLeftId, setSelectedLeftId] = useState<string | null>(null);
  const [matchedPairIds, setMatchedPairIds] = useState<string[]>([]);
  const [pairErrorFlash, setPairErrorFlash] = useState<boolean>(false);

  // True/False Conveyor State
  const [tfIndex, setTfIndex] = useState<number>(0);
  const [tfFeedback, setTfFeedback] = useState<{ correct: boolean; explanation: string } | null>(null);

  // Open the Box State
  const [openedBoxIds, setOpenedBoxIds] = useState<string[]>([]);
  const [activeBoxId, setActiveBoxId] = useState<string | null>(null);
  const [boxSelectedOption, setBoxSelectedOption] = useState<string | null>(null);

  // Random Wheel State
  const [wheelSpinning, setWheelSpinning] = useState<boolean>(false);
  const [wheelRotation, setWheelRotation] = useState<number>(0);
  const [activeSliceIndex, setActiveSliceIndex] = useState<number | null>(null);
  const [completedSliceIds, setCompletedSliceIds] = useState<string[]>([]);

  const activeTheme = useMemo(
    () => visualThemes.find((t) => t.id === selectedThemeId) || visualThemes[0],
    [visualThemes, selectedThemeId]
  );

  const playSound = (kind: 'hit' | 'miss' | 'win' | 'spin') => {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (kind === 'hit') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.14);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
        osc.start();
        osc.stop(ctx.currentTime + 0.22);
      } else if (kind === 'miss') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(190, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(130, ctx.currentTime + 0.18);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
        osc.start();
        osc.stop(ctx.currentTime + 0.22);
      } else if (kind === 'win') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
        osc.start();
        osc.stop(ctx.currentTime + 0.45);
      } else if (kind === 'spin') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(320, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(640, ctx.currentTime + 0.25);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);
        osc.start();
        osc.stop(ctx.currentTime + 0.28);
      }
    } catch {}
  };

  const creditAureusCoins = (coins: number) => {
    setAureusEarned((prev) => prev + coins);
    try {
      const currentRaw = window.localStorage.getItem('aquila_aureus_balance');
      const current = currentRaw ? parseInt(currentRaw, 10) : 2450;
      const updated = (Number.isNaN(current) ? 2450 : current) + coins;
      window.localStorage.setItem('aquila_aureus_balance', String(updated));
    } catch {}
  };

  const resetAllStates = () => {
    setScore(0);
    setStreak(0);
    setAureusEarned(0);
    setGameOver(false);
    setGroupSortAssignments({});
    setGroupSortValidated(false);
    setGameshowIndex(0);
    setGameshowSelected(null);
    setGameshowTimeRemaining(45);
    setHidden5050([]);
    setHintActive(false);
    setMazeStageIndex(0);
    setMazeLives(3);
    setMazeFeedback(null);
    setAirplaneIndex(0);
    setAirplaneFuel(100);
    setAirplaneFeedback(null);
    setSelectedLeftId(null);
    setMatchedPairIds([]);
    setPairErrorFlash(false);
    setTfIndex(0);
    setTfFeedback(null);
    setOpenedBoxIds([]);
    setActiveBoxId(null);
    setBoxSelectedOption(null);
    setWheelSpinning(false);
    setActiveSliceIndex(null);
    setCompletedSliceIds([]);
  };

  useEffect(() => {
    resetAllStates();
  }, [activeGame]);

  // Timer for Gameshow
  useEffect(() => {
    if (activeGame.templateType !== 'gameshow_quiz' || gameOver) return;
    if (gameshowTimeRemaining <= 0) {
      setStreak(0);
      advanceGameshow();
      return;
    }
    const timer = setInterval(() => {
      setGameshowTimeRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [activeGame.templateType, gameshowTimeRemaining, gameOver]);

  // Switch Template (Wordwall signature capability)
  const handleSwitchTemplate = (targetTemplate: WordwallTemplateType) => {
    if (targetTemplate === activeGame.templateType) return;
    const converted = WordwallGameEngine.convertGameToTemplate(activeGame, targetTemplate);
    setActiveGame(converted);
    playSound('spin');
  };

  const handleChangeTheme = (themeId: WordwallVisualThemeId) => {
    setSelectedThemeId(themeId);
    try {
      window.localStorage.setItem('aquila_wordwall_theme', themeId);
    } catch {}
  };

  // Group Sort Handlers
  const handleAssignItem = (itemId: string, groupId: string) => {
    if (groupSortValidated) return;
    setGroupSortAssignments((prev) => ({ ...prev, [itemId]: groupId }));
  };

  const handleValidateGroupSort = () => {
    const payload = activeGame.payload as GameGroupSortPayload;
    let correctCount = 0;
    payload.items.forEach((item) => {
      if (groupSortAssignments[item.id] === item.correctGroupId) {
        correctCount++;
      }
    });
    const roundScore = correctCount * 100;
    setScore(roundScore);
    creditAureusCoins(correctCount * 15);
    setGroupSortValidated(true);
    setGameOver(true);
    playSound('win');
    if (onFinish) onFinish(roundScore, payload.items.length * 100);
  };

  // Gameshow Handlers
  const handleGameshowAnswer = (letter: string) => {
    if (gameshowSelected) return;
    setGameshowSelected(letter);
    const payload = activeGame.payload as GameGameshowPayload;
    const currentQ = payload.questions[gameshowIndex];

    if (letter === currentQ.correctAnswer) {
      const timeBonus = Math.floor(gameshowTimeRemaining * 2);
      const earned = currentQ.points + timeBonus;
      setScore((s) => s + earned);
      setStreak((st) => st + 1);
      creditAureusCoins(25);
      playSound('hit');
    } else {
      setStreak(0);
      playSound('miss');
    }

    setTimeout(() => {
      advanceGameshow();
    }, 1500);
  };

  const advanceGameshow = () => {
    const payload = activeGame.payload as GameGameshowPayload;
    if (gameshowIndex + 1 < payload.questions.length) {
      setGameshowIndex((i) => i + 1);
      setGameshowSelected(null);
      setGameshowTimeRemaining(payload.roundTimeSeconds || 45);
      setHidden5050([]);
      setHintActive(false);
    } else {
      setGameOver(true);
      playSound('win');
      if (onFinish) onFinish(score, payload.questions.length * 200);
    }
  };

  const handleLifeline5050 = () => {
    if (hidden5050.length > 0) return;
    const payload = activeGame.payload as GameGameshowPayload;
    const currentQ = payload.questions[gameshowIndex];
    const wrongOptions = currentQ.options
      .filter((opt) => opt.letter !== currentQ.correctAnswer)
      .map((opt) => opt.letter);
    setHidden5050(wrongOptions.slice(0, 2));
  };

  // Maze Handlers
  const handleMazeZoneSelect = (zone: string) => {
    const payload = activeGame.payload as GameMazeChasePayload;
    const currentStage = payload.stages[mazeStageIndex];

    if (zone === currentStage.correctZone) {
      setScore((s) => s + 150);
      setStreak((st) => st + 1);
      creditAureusCoins(20);
      playSound('hit');
      setMazeFeedback('✓ Corredor Seguro! Avançando para o próximo setor do labirinto...');
      setTimeout(() => {
        setMazeFeedback(null);
        if (mazeStageIndex + 1 < payload.stages.length) {
          setMazeStageIndex((idx) => idx + 1);
        } else {
          setGameOver(true);
          playSound('win');
        }
      }, 1300);
    } else {
      setMazeLives((l) => Math.max(0, l - 1));
      setStreak(0);
      playSound('miss');
      setMazeFeedback(`⚠️ Zona Incorreta! Dica: ${currentStage.socraticHint}`);
      if (mazeLives - 1 <= 0) {
        setGameOver(true);
      }
    }
  };

  // Airplane Handlers
  const handleAirplaneCloudSelect = (cloudText: string) => {
    const payload = activeGame.payload as GameAirplanePayload;
    const currentTarget = payload.targets[airplaneIndex];

    if (cloudText === currentTarget.correctCloudText) {
      setScore((s) => s + currentTarget.points);
      setStreak((st) => st + 1);
      creditAureusCoins(20);
      playSound('hit');
      setAirplaneFeedback('✈️ Voo Perfeito! Atravessou a nuvem correta.');
      setTimeout(() => {
        setAirplaneFeedback(null);
        if (airplaneIndex + 1 < payload.targets.length) {
          setAirplaneIndex((i) => i + 1);
        } else {
          setGameOver(true);
          playSound('win');
        }
      }, 1200);
    } else {
      setAirplaneFuel((f) => Math.max(0, f - 25));
      setStreak(0);
      playSound('miss');
      setAirplaneFeedback('⚡ Turbulência! Combustível reduzido por desvio conceitual.');
      if (airplaneFuel - 25 <= 0) {
        setGameOver(true);
      }
    }
  };

  // Matching Pairs Handlers
  const handleSelectRightPair = (pairId: string) => {
    if (!selectedLeftId) return;
    if (selectedLeftId === pairId) {
      const nextMatched = [...matchedPairIds, pairId];
      setMatchedPairIds(nextMatched);
      setSelectedLeftId(null);
      setScore((s) => s + 150);
      setStreak((st) => st + 1);
      creditAureusCoins(20);
      playSound('hit');
      const payload = activeGame.payload as GameMatchingPairsPayload;
      if (nextMatched.length >= payload.pairs.length) {
        setGameOver(true);
        playSound('win');
      }
    } else {
      setStreak(0);
      setPairErrorFlash(true);
      playSound('miss');
      setTimeout(() => setPairErrorFlash(false), 600);
    }
  };

  // True/False Conveyor Handlers
  const handleTrueFalseAnswer = (userChoice: boolean) => {
    if (tfFeedback) return;
    const payload = activeGame.payload as GameTrueFalsePayload;
    const currentStmt = payload.statements[tfIndex];
    const isCorrect = userChoice === currentStmt.isTrue;

    if (isCorrect) {
      setScore((s) => s + currentStmt.points);
      setStreak((st) => st + 1);
      creditAureusCoins(15);
      playSound('hit');
    } else {
      setStreak(0);
      playSound('miss');
    }

    setTfFeedback({
      correct: isCorrect,
      explanation: currentStmt.explanation
    });

    setTimeout(() => {
      setTfFeedback(null);
      if (tfIndex + 1 < payload.statements.length) {
        setTfIndex((i) => i + 1);
      } else {
        setGameOver(true);
        playSound('win');
      }
    }, 1500);
  };

  // Open the Box Handlers
  const handleBoxAnswer = (optionText: string) => {
    if (boxSelectedOption || !activeBoxId) return;
    setBoxSelectedOption(optionText);
    const payload = activeGame.payload as GameOpenTheBoxPayload;
    const currentBox = payload.boxes.find((b) => b.id === activeBoxId);
    if (!currentBox) return;

    if (optionText === currentBox.correctOption) {
      setScore((s) => s + currentBox.points);
      setStreak((st) => st + 1);
      creditAureusCoins(currentBox.bonusAureus);
      playSound('hit');
    } else {
      setStreak(0);
      playSound('miss');
    }

    setTimeout(() => {
      const nextOpened = [...openedBoxIds, currentBox.id];
      setOpenedBoxIds(nextOpened);
      setActiveBoxId(null);
      setBoxSelectedOption(null);
      if (nextOpened.length >= payload.boxes.length) {
        setGameOver(true);
        playSound('win');
      }
    }, 1300);
  };

  // Random Wheel Handlers
  const handleSpinWheel = () => {
    if (wheelSpinning) return;
    const payload = activeGame.payload as GameRandomWheelPayload;
    const remaining = payload.slices
      .map((s, idx) => ({ s, idx }))
      .filter((item) => !completedSliceIds.includes(item.s.id));

    if (remaining.length === 0) {
      setGameOver(true);
      return;
    }

    setWheelSpinning(true);
    playSound('spin');
    const chosen = remaining[Math.floor(Math.random() * remaining.length)];
    const extraTurns = 720 + chosen.idx * (360 / payload.slices.length);
    setWheelRotation((r) => r + extraTurns);

    setTimeout(() => {
      setWheelSpinning(false);
      setActiveSliceIndex(chosen.idx);
    }, 1100);
  };

  const handleWheelAnswer = (optionText: string) => {
    if (activeSliceIndex === null) return;
    const payload = activeGame.payload as GameRandomWheelPayload;
    const slice = payload.slices[activeSliceIndex];
    if (optionText === slice.correctOption) {
      setScore((s) => s + slice.points);
      setStreak((st) => st + 1);
      creditAureusCoins(30);
      playSound('hit');
    } else {
      setStreak(0);
      playSound('miss');
    }

    const nextCompleted = [...completedSliceIds, slice.id];
    setCompletedSliceIds(nextCompleted);
    setActiveSliceIndex(null);
    if (nextCompleted.length >= payload.slices.length) {
      setGameOver(true);
      playSound('win');
    }
  };

  return (
    <div className={`wordwall-player-container rounded-2xl border ${activeTheme.containerBg} text-slate-100 p-6 backdrop-blur-xl shadow-2xl relative overflow-hidden transition-colors duration-300`}>
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-4 mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-3 bg-gradient-to-tr ${activeTheme.buttonGradient} rounded-xl shadow-lg`}>
            <Gamepad2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-bold uppercase tracking-wider ${activeTheme.accentText}`}>
                {activeTheme.badge} Wordwall Sovereign Engine • {activeGame.grade} ({activeGame.discipline})
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-800 border border-slate-700 text-slate-300">
                BNCC {activeGame.bnccSkillCode}
              </span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">{activeGame.title}</h2>
          </div>
        </div>

        {/* Global HUD Stats */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-xl">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-semibold text-amber-300">{score} XP</span>
          </div>

          <div className="flex items-center gap-2 bg-slate-900/90 border border-amber-500/30 px-3 py-1.5 rounded-xl" title="Moedas Aureus ganhas nesta partida para a Câmara de Cosméticos">
            <Gem className="w-4 h-4 text-yellow-400" />
            <span className="text-sm font-semibold text-yellow-300">+{aureusEarned} Aureus</span>
          </div>

          <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-xl">
            <Flame className="w-4 h-4 text-orange-500" />
            <span className="text-sm font-semibold text-orange-400">{streak}x Combo</span>
          </div>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition"
            title="Alternar Efeitos Sonoros"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm transition"
            >
              Fechar
            </button>
          )}
        </div>
      </div>

      {/* BARRA 1: Catálogo de Atividades Prontas */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
          Atividades BNCC:
        </span>
        {presetGames.map((game) => (
          <button
            key={game.id}
            onClick={() => setActiveGame(game)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition flex items-center gap-1.5 ${
              activeGame.id === game.id
                ? `bg-gradient-to-r ${activeTheme.buttonGradient} text-white shadow-md`
                : 'bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            {game.title.split(':')[0]}
          </button>
        ))}
      </div>

      {/* BARRA 2: Wordwall "Trocar Modelo" (Switch Template para o MESMO conteúdo) + Tema Visual */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-900/70 border border-slate-800 rounded-xl mb-5">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1 mr-2">
            <Shuffle className="w-3.5 h-3.5" />
            Trocar Estilo (Wordwall Switcher):
          </span>
          {switchableModalities.map((mod) => (
            <button
              key={mod.id}
              onClick={() => handleSwitchTemplate(mod.id)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition flex items-center gap-1 ${
                activeGame.templateType === mod.id
                  ? 'bg-indigo-600 text-white border border-indigo-400'
                  : 'bg-slate-950/80 hover:bg-slate-800 text-slate-300 border border-slate-800'
              }`}
              title={mod.description}
            >
              {mod.id === 'gameshow_quiz' && <Radio className="w-3 h-3" />}
              {mod.id === 'group_sort' && <Split className="w-3 h-3" />}
              {mod.id === 'maze_chase' && <Grid className="w-3 h-3" />}
              {mod.id === 'airplane' && <Plane className="w-3 h-3" />}
              {mod.id === 'matching_pairs' && <Link2 className="w-3 h-3" />}
              {mod.id === 'true_false_run' && <CheckSquare className="w-3 h-3" />}
              {mod.id === 'open_the_box' && <Box className="w-3 h-3" />}
              {mod.id === 'random_wheel' && <Compass className="w-3 h-3" />}
              {mod.name}
            </button>
          ))}
        </div>

        {/* Seletor de Tema Visual */}
        <div className="flex items-center gap-1.5">
          <Palette className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-[11px] font-semibold text-slate-400">Tema:</span>
          {visualThemes.map((th) => (
            <button
              key={th.id}
              onClick={() => handleChangeTheme(th.id)}
              className={`px-2 py-1 rounded-lg text-[11px] font-medium transition ${
                selectedThemeId === th.id
                  ? 'bg-slate-700 text-white border border-slate-500'
                  : 'bg-slate-950/60 text-slate-400 hover:text-white border border-slate-800'
              }`}
              title={th.name}
            >
              {th.badge} {th.name.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Instructions */}
      <div className="p-3 bg-indigo-950/30 border border-indigo-500/20 rounded-xl mb-6 text-sm text-indigo-200/90 flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-indigo-400 flex-shrink-0" />
        <span>{activeGame.instructions}</span>
      </div>

      {/* GAME MODE 1: Group Sort */}
      {activeGame.templateType === 'group_sort' && (
        <div className="space-y-6">
          {(() => {
            const payload = activeGame.payload as GameGroupSortPayload;
            if (!payload.groups || !payload.items) {
              return (
                <div className="p-4 bg-slate-900 rounded-xl text-sm text-slate-300">
                  Selecione outro estilo na barra "Trocar Estilo" acima para esta atividade.
                </div>
              );
            }
            return (
              <>
                <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
                  <h4 className="text-xs uppercase font-bold text-slate-400 mb-3 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-indigo-400" />
                    Itens para Classificar:
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {payload.items
                      .filter((item) => !groupSortAssignments[item.id])
                      .map((item) => (
                        <div
                          key={item.id}
                          className="bg-slate-800 border border-slate-700 hover:border-indigo-500/50 px-3 py-2 rounded-lg text-sm font-medium text-slate-200 shadow-sm flex items-center gap-2"
                        >
                          <span>{item.text}</span>
                          <div className="flex items-center gap-1 border-l border-slate-700 pl-2">
                            {payload.groups.map((group) => (
                              <button
                                key={group.id}
                                onClick={() => handleAssignItem(item.id, group.id)}
                                className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-700 hover:bg-indigo-600 text-white transition"
                                title={`Mover para ${group.title}`}
                              >
                                {group.title.charAt(0)}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    {payload.items.filter((item) => !groupSortAssignments[item.id]).length === 0 && (
                      <span className="text-xs text-emerald-400 font-medium">
                        ✓ Todos os itens foram posicionados nas caixas! Clique em "Validar Classificação".
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {payload.groups.map((group) => {
                    const assignedItems = payload.items.filter(
                      (it) => groupSortAssignments[it.id] === group.id
                    );
                    return (
                      <div
                        key={group.id}
                        className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col min-h-[200px]"
                        style={{ borderTop: `4px solid ${group.color || '#6366F1'}` }}
                      >
                        <h3 className="font-bold text-sm text-white mb-3">{group.title}</h3>
                        <div className="space-y-2 flex-grow">
                          {assignedItems.map((item) => {
                            const isCorrect = item.correctGroupId === group.id;
                            return (
                              <div
                                key={item.id}
                                className={`p-2.5 rounded-lg text-xs font-medium border flex items-center justify-between ${
                                  groupSortValidated
                                    ? isCorrect
                                      ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
                                      : 'bg-rose-950/40 border-rose-500/50 text-rose-200'
                                    : 'bg-slate-800/80 border-slate-700 text-slate-300'
                                }`}
                              >
                                <span>{item.text}</span>
                                {groupSortValidated ? (
                                  isCorrect ? (
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                  ) : (
                                    <XCircle className="w-4 h-4 text-rose-400" />
                                  )
                                ) : (
                                  <button
                                    onClick={() => {
                                      const next = { ...groupSortAssignments };
                                      delete next[item.id];
                                      setGroupSortAssignments(next);
                                    }}
                                    className="text-slate-500 hover:text-slate-300 ml-2"
                                  >
                                    ✕
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                  <button
                    onClick={resetAllStates}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-2 transition"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Reiniciar
                  </button>

                  {!groupSortValidated ? (
                    <button
                      onClick={handleValidateGroupSort}
                      className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg transition"
                    >
                      Validar Classificação
                    </button>
                  ) : (
                    <div className="text-emerald-400 text-sm font-bold flex items-center gap-2">
                      <Award className="w-5 h-5" />
                      Rodada concluída! Pontuação: {score} XP (+{aureusEarned} Aureus)
                    </div>
                  )}
                </div>
              </>
            );
          })()}
        </div>
      )}

      {/* GAME MODE 2: Maze Chase */}
      {activeGame.templateType === 'maze_chase' && (
        <div className="space-y-6">
          {(() => {
            const payload = activeGame.payload as GameMazeChasePayload;
            const currentStage = payload.stages[mazeStageIndex] || payload.stages[0];
            const allZones = [currentStage.correctZone, ...currentStage.distractorZones].sort();

            return (
              <div className={`border rounded-xl p-6 ${activeTheme.cardBg}`}>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Setor do Labirinto {mazeStageIndex + 1} de {payload.stages.length}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-rose-400 font-bold">Vidas:</span>
                    {Array.from({ length: 3 }).map((_, idx) => (
                      <span
                        key={idx}
                        className={`text-lg ${idx < mazeLives ? 'text-rose-500' : 'text-slate-700'}`}
                      >
                        ❤️
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-slate-950/80 border border-indigo-500/30 rounded-xl mb-6">
                  <h3 className="text-base font-semibold text-white leading-relaxed">
                    {currentStage.question}
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                  {allZones.map((zone, zIdx) => (
                    <button
                      key={zIdx}
                      onClick={() => handleMazeZoneSelect(zone)}
                      disabled={gameOver}
                      className="p-4 rounded-xl border border-slate-800 bg-slate-950/90 hover:bg-indigo-950/40 hover:border-indigo-500/60 text-left transition flex items-center justify-between group"
                    >
                      <span className="text-sm font-medium text-slate-200 group-hover:text-white">
                        🏃 {zone}
                      </span>
                      <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 transition" />
                    </button>
                  ))}
                </div>

                {mazeFeedback && (
                  <div className="p-3 bg-slate-800/80 border border-slate-700 rounded-xl text-center text-sm font-medium text-indigo-300">
                    {mazeFeedback}
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* GAME MODE 3: Airplane Runner */}
      {activeGame.templateType === 'airplane' && (
        <div className="space-y-6">
          {(() => {
            const payload = activeGame.payload as GameAirplanePayload;
            const currentTarget = payload.targets[airplaneIndex] || payload.targets[0];
            const allClouds = [currentTarget.correctCloudText, ...currentTarget.distractorClouds].sort();

            return (
              <div className={`border rounded-xl p-6 ${activeTheme.cardBg}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Plane className="w-5 h-5 text-sky-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Altitude {airplaneIndex + 1} de {payload.targets.length}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-amber-400 font-bold">Combustível:</span>
                    <div className="w-32 bg-slate-800 rounded-full h-3 overflow-hidden border border-slate-700">
                      <div
                        className="bg-amber-400 h-full rounded-full transition-all"
                        style={{ width: `${airplaneFuel}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-slate-950/80 border border-sky-500/30 rounded-xl mb-6">
                  <h3 className="text-base font-semibold text-white leading-relaxed">
                    {currentTarget.prompt}
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                  {allClouds.map((cloud, cIdx) => (
                    <button
                      key={cIdx}
                      onClick={() => handleAirplaneCloudSelect(cloud)}
                      disabled={gameOver}
                      className="p-4 rounded-xl border border-sky-900/40 bg-sky-950/20 hover:bg-sky-900/30 hover:border-sky-500 text-left transition flex items-center justify-between group"
                    >
                      <span className="text-sm font-semibold text-sky-100">{cloud}</span>
                      <span className="text-xs px-2 py-1 bg-sky-900/40 rounded text-sky-300">☁️ Atravessar</span>
                    </button>
                  ))}
                </div>

                {airplaneFeedback && (
                  <div className="p-3 bg-slate-800/80 border border-slate-700 rounded-xl text-center text-sm font-medium text-sky-300">
                    {airplaneFeedback}
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* GAME MODE 4: Gameshow Quiz */}
      {activeGame.templateType === 'gameshow_quiz' && (
        <div className="space-y-6">
          {(() => {
            const payload = activeGame.payload as GameGameshowPayload;
            const currentQ = payload.questions[gameshowIndex] || payload.questions[0];

            return (
              <div className={`border rounded-xl p-6 ${activeTheme.cardBg}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Pergunta {gameshowIndex + 1} de {payload.questions.length}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[11px] bg-purple-950 text-purple-300 border border-purple-800">
                      +{currentQ.points} PTS
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleLifeline5050}
                      disabled={hidden5050.length > 0}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 rounded-lg text-xs font-bold text-amber-300 border border-slate-700 transition"
                    >
                      50:50
                    </button>
                    <button
                      onClick={() => setHintActive(true)}
                      disabled={hintActive}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 rounded-lg text-xs font-bold text-sky-300 border border-slate-700 transition"
                    >
                      💡 Dica
                    </button>
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-950 border border-slate-800 rounded-lg">
                      <Timer className="w-4 h-4 text-rose-400" />
                      <span className="text-xs font-bold text-rose-300">{gameshowTimeRemaining}s</span>
                    </div>
                  </div>
                </div>

                <div className="p-5 bg-slate-950/90 border border-indigo-500/40 rounded-2xl mb-6 shadow-inner">
                  <h3 className="text-base font-semibold text-white leading-relaxed">
                    {currentQ.text}
                  </h3>
                  {hintActive && (
                    <div className="mt-3 p-3 bg-indigo-950/40 border border-indigo-500/20 rounded-xl text-xs text-indigo-300">
                      💡 <strong>Dica Socrática:</strong> {currentQ.explanation}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {currentQ.options.map((opt) => {
                    if (hidden5050.includes(opt.letter)) {
                      return (
                        <div
                          key={opt.letter}
                          className="p-4 rounded-xl border border-dashed border-slate-800 bg-slate-950/20 opacity-30 cursor-not-allowed"
                        >
                          <span className="text-xs text-slate-600">[Opção eliminada pelo 50:50]</span>
                        </div>
                      );
                    }

                    const isSelected = gameshowSelected === opt.letter;
                    const isCorrect = opt.letter === currentQ.correctAnswer;
                    let btnStyle = 'bg-slate-950/90 border-slate-800 hover:border-indigo-500/60 text-slate-200';

                    if (gameshowSelected) {
                      if (isCorrect) {
                        btnStyle = 'bg-emerald-950/60 border-emerald-500 text-emerald-200';
                      } else if (isSelected) {
                        btnStyle = 'bg-rose-950/60 border-rose-500 text-rose-200';
                      }
                    }

                    return (
                      <button
                        key={opt.letter}
                        onClick={() => handleGameshowAnswer(opt.letter)}
                        disabled={gameshowSelected !== null}
                        className={`p-4 rounded-xl border text-left transition flex items-start gap-3 ${btnStyle}`}
                      >
                        <span className="w-6 h-6 rounded-lg bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {opt.letter}
                        </span>
                        <span className="text-sm font-medium">{opt.text}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* GAME MODE 5: Matching Pairs (Encontre os Pares) */}
      {activeGame.templateType === 'matching_pairs' && (
        <div className="space-y-6">
          {(() => {
            const payload = activeGame.payload as GameMatchingPairsPayload;
            const reversedRight = [...payload.pairs].reverse();

            return (
              <div className={`border rounded-xl p-6 ${activeTheme.cardBg}`}>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Pares Conectados: {matchedPairIds.length} de {payload.pairs.length}
                  </span>
                  {pairErrorFlash && (
                    <span className="text-xs font-bold text-rose-400">
                      ✕ Associação incorreta! Tente outro par.
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Coluna da Esquerda: Termos / Conceitos */}
                  <div className="space-y-2.5">
                    <h4 className="text-xs font-bold uppercase text-indigo-300 mb-2">1. Conceito / Enunciado</h4>
                    {payload.pairs.map((p) => {
                      const isMatched = matchedPairIds.includes(p.id);
                      const isSelected = selectedLeftId === p.id;
                      return (
                        <button
                          key={p.id}
                          disabled={isMatched}
                          onClick={() => setSelectedLeftId(p.id)}
                          className={`w-full p-3.5 rounded-xl border text-left text-sm font-medium transition flex items-center justify-between ${
                            isMatched
                              ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300 opacity-60'
                              : isSelected
                              ? 'bg-indigo-600/30 border-indigo-400 text-white shadow-md'
                              : 'bg-slate-950/80 border-slate-800 hover:border-indigo-500/50 text-slate-200'
                          }`}
                        >
                          <span>{p.leftTerm}</span>
                          {isMatched && <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />}
                        </button>
                      );
                    })}
                  </div>

                  {/* Coluna da Direita: Definições / Fórmulas */}
                  <div className="space-y-2.5">
                    <h4 className="text-xs font-bold uppercase text-emerald-300 mb-2">2. Par Correspondente</h4>
                    {reversedRight.map((p) => {
                      const isMatched = matchedPairIds.includes(p.id);
                      return (
                        <button
                          key={p.id}
                          disabled={isMatched || !selectedLeftId}
                          onClick={() => handleSelectRightPair(p.id)}
                          className={`w-full p-3.5 rounded-xl border text-left text-sm font-medium transition flex items-center justify-between ${
                            isMatched
                              ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300 opacity-60'
                              : selectedLeftId
                              ? 'bg-slate-950/90 border-indigo-500/40 hover:bg-indigo-950/50 text-slate-100 cursor-pointer'
                              : 'bg-slate-950/50 border-slate-800/80 text-slate-400 cursor-not-allowed'
                          }`}
                        >
                          <span>{p.rightDefinition}</span>
                          {isMatched && <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* GAME MODE 6: True / False Run (Esteira Verdadeiro ou Falso) */}
      {activeGame.templateType === 'true_false_run' && (
        <div className="space-y-6">
          {(() => {
            const payload = activeGame.payload as GameTrueFalsePayload;
            const currentStmt = payload.statements[tfIndex] || payload.statements[0];

            return (
              <div className={`border rounded-xl p-6 text-center ${activeTheme.cardBg}`}>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
                  Afirmação Rápida {tfIndex + 1} de {payload.statements.length}
                </div>

                <div className="p-6 bg-slate-950/90 border border-indigo-500/40 rounded-2xl mb-6 max-w-2xl mx-auto">
                  <h3 className="text-lg font-semibold text-white leading-relaxed">
                    {currentStmt.statement}
                  </h3>
                </div>

                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={() => handleTrueFalseAnswer(true)}
                    disabled={tfFeedback !== null}
                    className="px-8 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm uppercase tracking-wider shadow-lg transition flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    Verdadeiro
                  </button>
                  <button
                    onClick={() => handleTrueFalseAnswer(false)}
                    disabled={tfFeedback !== null}
                    className="px-8 py-4 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm uppercase tracking-wider shadow-lg transition flex items-center gap-2"
                  >
                    <XCircle className="w-5 h-5" />
                    Falso
                  </button>
                </div>

                {tfFeedback && (
                  <div className={`mt-5 p-3 rounded-xl border text-xs font-medium max-w-xl mx-auto ${
                    tfFeedback.correct
                      ? 'bg-emerald-950/50 border-emerald-500/50 text-emerald-200'
                      : 'bg-rose-950/50 border-rose-500/50 text-rose-200'
                  }`}>
                    {tfFeedback.correct ? '✓ Exato! ' : '✕ Atenção: '}
                    {tfFeedback.explanation}
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* GAME MODE 7: Open the Box (Abra a Caixa Misteriosa) */}
      {activeGame.templateType === 'open_the_box' && (
        <div className="space-y-6">
          {(() => {
            const payload = activeGame.payload as GameOpenTheBoxPayload;
            const activeBox = payload.boxes.find((b) => b.id === activeBoxId);

            return (
              <div className={`border rounded-xl p-6 ${activeTheme.cardBg}`}>
                {!activeBox ? (
                  <>
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
                      Cofres Abertos: {openedBoxIds.length} de {payload.boxes.length} • Toque em uma caixa para revelar!
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {payload.boxes.map((box) => {
                        const isOpened = openedBoxIds.includes(box.id);
                        return (
                          <button
                            key={box.id}
                            disabled={isOpened}
                            onClick={() => setActiveBoxId(box.id)}
                            className={`p-6 rounded-2xl border text-center transition flex flex-col items-center justify-center gap-2 ${
                              isOpened
                                ? 'bg-slate-950/40 border-slate-800 opacity-40 cursor-not-allowed'
                                : 'bg-gradient-to-br from-slate-900 to-indigo-950/60 border-indigo-500/40 hover:border-amber-400 hover:scale-[1.02] shadow-lg'
                            }`}
                          >
                            <span className="text-3xl">{isOpened ? '🔓' : '🎁'}</span>
                            <span className="text-sm font-bold text-white">Caixa #{box.number}</span>
                            <span className="text-[11px] text-amber-300 font-semibold">
                              {box.label} (+{box.bonusAureus} Aureus)
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <div className="p-5 bg-slate-950/90 border border-amber-500/40 rounded-2xl space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase text-amber-300">
                        🎁 {activeBox.label} • +{activeBox.points} XP & +{activeBox.bonusAureus} Aureus
                      </span>
                      <button
                        onClick={() => setActiveBoxId(null)}
                        className="text-xs text-slate-400 hover:text-white"
                      >
                        Voltar às Caixas
                      </button>
                    </div>
                    <h3 className="text-base font-semibold text-white">{activeBox.question}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {activeBox.options.map((opt, idx) => {
                        const isChosen = boxSelectedOption === opt;
                        const isRight = opt === activeBox.correctOption;
                        let cls = 'bg-slate-900 border-slate-700 hover:border-amber-400 text-slate-200';
                        if (boxSelectedOption) {
                          if (isRight) cls = 'bg-emerald-950/70 border-emerald-500 text-emerald-200';
                          else if (isChosen) cls = 'bg-rose-950/70 border-rose-500 text-rose-200';
                        }
                        return (
                          <button
                            key={idx}
                            disabled={boxSelectedOption !== null}
                            onClick={() => handleBoxAnswer(opt)}
                            className={`p-3.5 rounded-xl border text-left text-sm font-medium transition ${cls}`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* GAME MODE 8: Random Wheel (Roleta Soberana) */}
      {activeGame.templateType === 'random_wheel' && (
        <div className="space-y-6">
          {(() => {
            const payload = activeGame.payload as GameRandomWheelPayload;
            const activeSlice = activeSliceIndex !== null ? payload.slices[activeSliceIndex] : null;

            return (
              <div className={`border rounded-xl p-6 ${activeTheme.cardBg}`}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                  {/* Visual Wheel */}
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <div
                      className="w-48 h-48 rounded-full border-4 border-amber-400 shadow-2xl flex items-center justify-center relative transition-transform duration-1000 ease-out"
                      style={{
                        transform: `rotate(${wheelRotation}deg)`,
                        background: 'conic-gradient(#06B6D4 0deg 90deg, #10B981 90deg 180deg, #6366F1 180deg 270deg, #F59E0B 270deg 360deg)'
                      }}
                    >
                      <div className="w-16 h-16 rounded-full bg-slate-950 border-2 border-white flex items-center justify-center text-xl shadow-inner">
                        🦅
                      </div>
                    </div>

                    <button
                      onClick={handleSpinWheel}
                      disabled={wheelSpinning || activeSlice !== null || gameOver}
                      className={`px-6 py-3 rounded-xl bg-gradient-to-r ${activeTheme.buttonGradient} text-white font-bold text-xs uppercase tracking-wider shadow-lg disabled:opacity-40 transition`}
                    >
                      {wheelSpinning ? 'Girando Roleta...' : '🎡 Girar Roleta Soberana'}
                    </button>
                    <span className="text-xs text-slate-400">
                      Setores Concluídos: {completedSliceIds.length} de {payload.slices.length}
                    </span>
                  </div>

                  {/* Challenge Panel */}
                  <div>
                    {activeSlice ? (
                      <div className="p-5 bg-slate-950/90 border border-indigo-500/40 rounded-2xl space-y-4">
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-950 text-indigo-300 border border-indigo-700">
                          Sorteado: {activeSlice.label}
                        </span>
                        <h3 className="text-base font-semibold text-white">
                          {activeSlice.challengeQuestion}
                        </h3>
                        <div className="space-y-2">
                          {activeSlice.options.map((opt, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleWheelAnswer(opt)}
                              className="w-full p-3 rounded-xl border border-slate-800 bg-slate-900 hover:border-indigo-400 text-left text-sm text-slate-200 transition"
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="p-6 bg-slate-950/50 border border-dashed border-slate-800 rounded-2xl text-center text-sm text-slate-400">
                        Clique em <strong>"Girar Roleta Soberana"</strong> para sortear o próximo tópico da BNCC!
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Game Over Modal / Card */}
      {gameOver && (
        <div className="mt-6 p-6 bg-gradient-to-r from-indigo-950/80 to-purple-950/80 border border-indigo-500/50 rounded-2xl text-center space-y-4">
          <div className="inline-flex p-3 bg-indigo-600/30 rounded-full border border-indigo-500/50">
            <Trophy className="w-8 h-8 text-amber-400" />
          </div>
          <h3 className="text-xl font-bold text-white">Desafio Soberano Concluído!</h3>
          <p className="text-sm text-slate-300">
            Você conquistou <strong>{score} XP</strong> e <strong>+{aureusEarned} Moedas Aureus</strong> dominando a habilidade{' '}
            <span className="text-indigo-400 font-semibold">{activeGame.bnccSkillCode}</span>!
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={resetAllStates}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold uppercase rounded-xl transition shadow-lg"
            >
              Jogar Novamente
            </button>
            <button
              onClick={() => handleSwitchTemplate(activeGame.templateType === 'gameshow_quiz' ? 'open_the_box' : 'gameshow_quiz')}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/40 text-xs font-bold uppercase rounded-xl transition"
            >
              🔀 Jogar Mesmo Conteúdo em Outro Estilo
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
