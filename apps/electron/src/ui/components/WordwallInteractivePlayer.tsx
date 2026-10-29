import React, { useState, useEffect, useMemo } from 'react';
import {
  Gamepad2,
  Trophy,
  Timer,
  Sparkles,
  Zap,
  HelpCircle,
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
  Split
} from 'lucide-react';
import {
  WordwallGameEngine,
  GameDefinition,
  GameGroupSortPayload,
  GameMazeChasePayload,
  GameGameshowPayload,
  GameAirplanePayload
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
  // Preset Games Catalog
  const presetGames = useMemo<GameDefinition[]>(() => [
    WordwallGameEngine.createAlavancasGroupSortGame(),
    WordwallGameEngine.createRiosVoadoresMazeGame(),
    WordwallGameEngine.createEletricidadeAirplaneGame(),
    WordwallGameEngine.createFisicaGameshow(),
  ], []);

  const [activeGame, setActiveGame] = useState<GameDefinition>(initialGame || presetGames[0]);
  const [score, setScore] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
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

  // Reset when changing active game
  useEffect(() => {
    setScore(0);
    setStreak(0);
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
  }, [activeGame]);

  // Timer for Gameshow
  useEffect(() => {
    if (activeGame.templateType !== 'gameshow_quiz' || gameOver) return;
    if (gameshowTimeRemaining <= 0) {
      handleGameshowTimeout();
      return;
    }
    const timer = setInterval(() => {
      setGameshowTimeRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [activeGame.templateType, gameshowTimeRemaining, gameOver]);

  const handleGameshowTimeout = () => {
    setStreak(0);
    advanceGameshow();
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
    setGroupSortValidated(true);
    setGameOver(true);
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
    } else {
      setStreak(0);
    }

    setTimeout(() => {
      advanceGameshow();
    }, 1800);
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
    // Shuffle and pick 2
    const toHide = wrongOptions.slice(0, 2);
    setHidden5050(toHide);
  };

  // Maze Handlers
  const handleMazeZoneSelect = (zone: string) => {
    const payload = activeGame.payload as GameMazeChasePayload;
    const currentStage = payload.stages[mazeStageIndex];

    if (zone === currentStage.correctZone) {
      setScore((s) => s + 150);
      setStreak((st) => st + 1);
      setMazeFeedback('Correto! Avançando pelo corredor seguro...');
      setTimeout(() => {
        setMazeFeedback(null);
        if (mazeStageIndex + 1 < payload.stages.length) {
          setMazeStageIndex((idx) => idx + 1);
        } else {
          setGameOver(true);
        }
      }, 1500);
    } else {
      setMazeLives((l) => Math.max(0, l - 1));
      setStreak(0);
      setMazeFeedback('Alerta de Perigo! Você colidiu com uma zona incorreta.');
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
      setAirplaneFeedback('Voo Perfeito! Atravessou a nuvem correta.');
      setTimeout(() => {
        setAirplaneFeedback(null);
        if (airplaneIndex + 1 < payload.targets.length) {
          setAirplaneIndex((i) => i + 1);
        } else {
          setGameOver(true);
        }
      }, 1400);
    } else {
      setAirplaneFuel((f) => Math.max(0, f - 25));
      setStreak(0);
      setAirplaneFeedback('Turbulência! Combustível reduzido por erro de rota.');
      if (airplaneFuel - 25 <= 0) {
        setGameOver(true);
      }
    }
  };

  return (
    <div className="wordwall-player-container rounded-2xl border border-indigo-500/30 bg-slate-950/90 text-slate-100 p-6 backdrop-blur-xl shadow-2xl relative overflow-hidden">
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-xl shadow-lg shadow-indigo-500/30">
            <Gamepad2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                Wordwall Sovereign Engine • {activeGame.grade} ({activeGame.discipline})
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-800 border border-slate-700 text-slate-300">
                BNCC {activeGame.bnccSkillCode}
              </span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">{activeGame.title}</h2>
          </div>
        </div>

        {/* Global HUD Stats */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-semibold text-amber-300">{score} XP</span>
          </div>

          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl">
            <Flame className="w-4 h-4 text-orange-500" />
            <span className="text-sm font-semibold text-orange-400">{streak}x Combo</span>
          </div>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition"
            title="Alternar Áudio"
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

      {/* Preset Switcher Tabs */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-2">
          Modalidades Absorvidas:
        </span>
        {presetGames.map((game) => (
          <button
            key={game.id}
            onClick={() => setActiveGame(game)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition flex items-center gap-1.5 ${
              activeGame.id === game.id
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            {game.templateType === 'group_sort' && <Split className="w-3.5 h-3.5" />}
            {game.templateType === 'maze_chase' && <Grid className="w-3.5 h-3.5" />}
            {game.templateType === 'airplane' && <Plane className="w-3.5 h-3.5" />}
            {game.templateType === 'gameshow_quiz' && <Radio className="w-3.5 h-3.5" />}
            {game.title.split(':')[0]}
          </button>
        ))}
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
            return (
              <>
                {/* Available Unassigned Items */}
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

                {/* Target Groups Columns */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {payload.groups.map((group) => {
                    const assignedItems = payload.items.filter(
                      (it) => groupSortAssignments[it.id] === group.id
                    );
                    return (
                      <div
                        key={group.id}
                        className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col min-h-[220px]"
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

                {/* Action Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                  <button
                    onClick={() => {
                      setGroupSortAssignments({});
                      setGroupSortValidated(false);
                      setGameOver(false);
                    }}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-2 transition"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Reiniciar
                  </button>

                  {!groupSortValidated ? (
                    <button
                      onClick={handleValidateGroupSort}
                      className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-600/30 transition"
                    >
                      Validar Classificação
                    </button>
                  ) : (
                    <div className="text-emerald-400 text-sm font-bold flex items-center gap-2">
                      <Award className="w-5 h-5" />
                      Rodada concluída! Pontuação calculada: {score} XP
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
            const currentStage = payload.stages[mazeStageIndex];
            const allZones = [currentStage.correctZone, ...currentStage.distractorZones].sort();

            return (
              <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Fase {mazeStageIndex + 1} de {payload.stages.length}
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

                {/* Maze Zones */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                  {allZones.map((zone, zIdx) => (
                    <button
                      key={zIdx}
                      onClick={() => handleMazeZoneSelect(zone)}
                      disabled={gameOver}
                      className="p-4 rounded-xl border border-slate-800 bg-slate-950/90 hover:bg-indigo-950/40 hover:border-indigo-500/60 text-left transition flex items-center justify-between group"
                    >
                      <span className="text-sm font-medium text-slate-200 group-hover:text-white">
                        {zone}
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
            const currentTarget = payload.targets[airplaneIndex];
            const allClouds = [currentTarget.correctCloudText, ...currentTarget.distractorClouds].sort();

            return (
              <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Plane className="w-5 h-5 text-sky-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Voo {airplaneIndex + 1} de {payload.targets.length}
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

                {/* Cloud Options */}
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
            const currentQ = payload.questions[gameshowIndex];

            return (
              <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-6">
                {/* Gameshow Top Bar */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Pergunta {gameshowIndex + 1} de {payload.questions.length}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[11px] bg-purple-950 text-purple-300 border border-purple-800">
                      +{currentQ.points} PTS
                    </span>
                  </div>

                  {/* Lifelines */}
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

                {/* Question Box */}
                <div className="p-5 bg-slate-950/90 border border-indigo-500/40 rounded-2xl mb-6 shadow-inner">
                  <h3 className="text-base font-semibold text-white leading-relaxed">
                    {currentQ.text}
                  </h3>
                  {hintActive && (
                    <div className="mt-3 p-3 bg-indigo-950/40 border border-indigo-500/20 rounded-xl text-xs text-indigo-300">
                      💡 <strong>Dica Socrática:</strong> Identifique os dados do enunciado e aplique a relação fundamental de conservação.
                    </div>
                  )}
                </div>

                {/* 4 Multi-choice Cards */}
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

      {/* Game Over Modal / Card */}
      {gameOver && (
        <div className="mt-6 p-6 bg-gradient-to-r from-indigo-950/60 to-purple-950/60 border border-indigo-500/40 rounded-2xl text-center space-y-4">
          <div className="inline-flex p-3 bg-indigo-600/30 rounded-full border border-indigo-500/50">
            <Trophy className="w-8 h-8 text-amber-400" />
          </div>
          <h3 className="text-xl font-bold text-white">Desafio Soberano Concluído!</h3>
          <p className="text-sm text-slate-300">
            Você conquistou <strong>{score} XP</strong> dominando a habilidade{' '}
            <span className="text-indigo-400 font-semibold">{activeGame.bnccSkillCode}</span>!
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => {
                setGameOver(false);
                setScore(0);
                setStreak(0);
                setGroupSortAssignments({});
                setGroupSortValidated(false);
                setGameshowIndex(0);
                setGameshowSelected(null);
                setMazeStageIndex(0);
                setAirplaneIndex(0);
              }}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold uppercase rounded-xl transition shadow-lg shadow-indigo-600/30"
            >
              Jogar Novamente
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
