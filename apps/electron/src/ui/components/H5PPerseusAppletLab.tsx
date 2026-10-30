import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles, ArrowLeft, CheckCircle2, AlertCircle, Zap, Coins,
  Lightbulb, Sliders, Play, RotateCcw, Award, Layers, HelpCircle,
  FolderOpen, Flame, Compass, Check, ArrowRight, Eye
} from 'lucide-react';
import './H5PPerseusAppletLab.css';
import {
  H5PPerseusEngine,
  AppletDefinition,
  AppletType,
  AppletValidationResult,
  AppletProgressRecord
} from '../../services/H5PPerseusEngine';

interface H5PPerseusAppletLabProps {
  studentId?: string;
  onBack?: () => void;
  initialAppletId?: string;
}

export const H5PPerseusAppletLab: React.FC<H5PPerseusAppletLabProps> = ({
  studentId = 'stu-master-01',
  onBack,
  initialAppletId
}) => {
  // Navigation / Views
  const [activeTab, setActiveTab] = useState<'catalog' | 'player' | 'history'>('catalog');
  const [filterType, setFilterType] = useState<'ALL' | 'PERSEUS' | 'H5P'>('ALL');
  const [selectedApplet, setSelectedApplet] = useState<AppletDefinition | null>(null);

  // Gamification & Session State
  const [sessionEnergy, setSessionEnergy] = useState<number>(100);
  const [sessionCoins, setSessionCoins] = useState<number>(0);
  const [historyRecords, setHistoryRecords] = useState<any[]>([]);

  // Interactive Player State
  const [sliderM, setSliderM] = useState<number>(1);
  const [sliderB, setSliderB] = useState<number>(0);
  const [numberLinePos, setNumberLinePos] = useState<number>(1.0);
  const [selectedRadioOpt, setSelectedRadioOpt] = useState<string>('');
  const [dragSlotAnswers, setDragSlotAnswers] = useState<Record<number, string>>({});
  const [unlockedHintsCount, setUnlockedHintsCount] = useState<number>(0);
  const [validationResult, setValidationResult] = useState<AppletValidationResult | null>(null);

  // H5P Branching State
  const [currentNodeId, setCurrentNodeId] = useState<string>('');
  const [branchingHistory, setBranchingHistory] = useState<string[]>([]);
  const [accumulatedBranchPoints, setAccumulatedBranchPoints] = useState<number>(0);
  const [lastChoiceFeedback, setLastChoiceFeedback] = useState<string>('');

  // H5P Hotspot State
  const [activeHotspotId, setActiveHotspotId] = useState<string | null>(null);
  const [hotspotQuizAnswers, setHotspotQuizAnswers] = useState<Record<string, number>>({});

  // Catalog
  const catalog = useMemo(() => H5PPerseusEngine.getCatalog(), []);

  // Filtered Catalog
  const filteredCatalog = useMemo(() => {
    if (filterType === 'PERSEUS') {
      return catalog.filter(a => a.type.startsWith('perseus'));
    }
    if (filterType === 'H5P') {
      return catalog.filter(a => a.type.startsWith('h5p'));
    }
    return catalog;
  }, [catalog, filterType]);

  // Load Initial Applet or History
  useEffect(() => {
    if (initialAppletId) {
      const found = catalog.find(a => a.id === initialAppletId);
      if (found) {
        startApplet(found);
      }
    }
    loadHistory();
  }, [initialAppletId]);

  const loadHistory = async () => {
    try {
      if ((window as any).aquila?.applet?.getStudentProgress) {
        const list = await (window as any).aquila.applet.getStudentProgress(studentId);
        if (Array.isArray(list)) {
          setHistoryRecords(list);
        }
      }
    } catch (err) {
      console.warn('[H5PPerseusAppletLab] Não foi possível carregar histórico do SQLite:', err);
    }
  };

  const startApplet = (applet: AppletDefinition) => {
    setSelectedApplet(applet);
    setValidationResult(null);
    setUnlockedHintsCount(0);

    // Reset specific player states
    if (applet.perseusSlider) {
      setSliderM(applet.perseusSlider.initialValue);
      setSliderB(applet.perseusSlider.initialIntercept ?? 0);
    }
    if (applet.perseusNumberLine) {
      setNumberLinePos(applet.perseusNumberLine.initialValue);
    }
    if (applet.perseusRadio) {
      setSelectedRadioOpt('');
    }
    if (applet.h5pBranching) {
      setCurrentNodeId(applet.h5pBranching.startNodeId);
      setBranchingHistory([applet.h5pBranching.startNodeId]);
      setAccumulatedBranchPoints(0);
      setLastChoiceFeedback('');
    }
    if (applet.h5pHotspots) {
      setActiveHotspotId(null);
      setHotspotQuizAnswers({});
    }
    if (applet.h5pDragWords) {
      setDragSlotAnswers({});
    }

    setActiveTab('player');
  };

  const requestNextHint = () => {
    setUnlockedHintsCount(prev => prev + 1);
  };

  // Submit and Audit Execution
  const handleVerify = async () => {
    if (!selectedApplet) return;

    let res: AppletValidationResult;

    if (selectedApplet.type === 'perseus_math_slider') {
      res = H5PPerseusEngine.evaluateSlider(selectedApplet, sliderM, sliderB, unlockedHintsCount);
    } else if (selectedApplet.type === 'perseus_number_line') {
      res = H5PPerseusEngine.evaluateNumberLine(selectedApplet, numberLinePos, unlockedHintsCount);
    } else if (selectedApplet.type === 'perseus_radio_scaffolding') {
      res = H5PPerseusEngine.evaluatePerseusRadio(selectedApplet, selectedRadioOpt, unlockedHintsCount);
    } else if (selectedApplet.type === 'h5p_drag_words') {
      res = H5PPerseusEngine.evaluateDragWords(selectedApplet, dragSlotAnswers);
    } else {
      res = {
        isCorrect: true,
        score: 100,
        maxScore: 100,
        coinsEarned: selectedApplet.maxCoins,
        energyPointsEarned: selectedApplet.maxEnergyPoints,
        feedbackMessage: 'Applet concluído com sucesso!',
        hintPenaltyPercent: 0
      };
    }

    setValidationResult(res);

    if (res.isCorrect || res.score > 0) {
      setSessionCoins(prev => prev + res.coinsEarned);
      setSessionEnergy(prev => prev + res.energyPointsEarned);

      // Persist to SQLite WAL
      try {
        if ((window as any).aquila?.applet?.saveProgress) {
          await (window as any).aquila.applet.saveProgress({
            studentId,
            appletId: selectedApplet.id,
            appletType: selectedApplet.type,
            category: selectedApplet.category,
            score: res.score,
            maxScore: res.maxScore,
            hintsUsed: unlockedHintsCount,
            timeSpentSeconds: 60,
            coinsAwarded: res.coinsEarned
          });
          loadHistory();
        }
      } catch (err) {
        console.error('[H5PPerseusAppletLab] Erro ao persistir progresso do applet:', err);
      }
    }
  };

  // H5P Branching Choice Handler
  const handleBranchChoice = (choice: any) => {
    if (!selectedApplet?.h5pBranching) return;
    setAccumulatedBranchPoints(prev => prev + choice.points);
    setLastChoiceFeedback(choice.feedback);
    setCurrentNodeId(choice.nextNodeId);
    setBranchingHistory(prev => [...prev, choice.nextNodeId]);

    const nextNode = selectedApplet.h5pBranching.nodes[choice.nextNodeId];
    if (nextNode?.isTerminal) {
      const isVictory = choice.isGoodOutcome !== false;
      const finalResult: AppletValidationResult = {
        isCorrect: isVictory,
        score: isVictory ? 100 : 50,
        maxScore: 100,
        coinsEarned: isVictory ? selectedApplet.maxCoins : Math.round(selectedApplet.maxCoins * 0.4),
        energyPointsEarned: isVictory ? selectedApplet.maxEnergyPoints : 40,
        feedbackMessage: nextNode.narrative,
        hintPenaltyPercent: 0
      };
      setValidationResult(finalResult);

      if ((window as any).aquila?.applet?.saveProgress) {
        (window as any).aquila.applet.saveProgress({
          studentId,
          appletId: selectedApplet.id,
          appletType: selectedApplet.type,
          category: selectedApplet.category,
          score: finalResult.score,
          maxScore: 100,
          hintsUsed: 0,
          timeSpentSeconds: 120,
          coinsAwarded: finalResult.coinsEarned
        });
        loadHistory();
      }
    }
  };

  return (
    <div className="h5p-perseus-container" data-testid="h5p-perseus-container">
      {/* Top Header */}
      <header className="applet-header">
        <div className="applet-header-left">
          {onBack && (
            <button className="applet-back-btn" onClick={onBack} title="Voltar ao Cockpit">
              <ArrowLeft size={18} /> Voltar
            </button>
          )}
          <div className="applet-title-wrap">
            <h1>
              <Layers size={24} color="#a78bfa" />
              Laboratório de Applets H5P & Perseus
              <span className="applet-badge-offline">100% Offline Soberano</span>
            </h1>
          </div>
        </div>

        <div className="applet-stats-bar">
          <div className="stat-pill energy">
            <Zap size={16} /> {sessionEnergy} PE (Energia)
          </div>
          <div className="stat-pill coins">
            <Coins size={16} /> +{sessionCoins} Coins
          </div>
        </div>
      </header>

      {/* Mode Sub-nav */}
      <nav className="applet-subnav">
        <button
          className={`subnav-btn ${activeTab === 'catalog' ? 'active' : ''}`}
          onClick={() => setActiveTab('catalog')}
        >
          <FolderOpen size={16} /> Catálogo de Applets ({catalog.length})
        </button>
        {selectedApplet && (
          <button
            className={`subnav-btn ${activeTab === 'player' ? 'active' : ''}`}
            onClick={() => setActiveTab('player')}
          >
            <Play size={16} /> Executando: {selectedApplet.title.slice(0, 30)}...
          </button>
        )}
        <button
          className={`subnav-btn ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => { setActiveTab('history'); loadHistory(); }}
        >
          <Award size={16} /> Meu Histórico de Maestria ({historyRecords.length})
        </button>
      </nav>

      {/* CATALOG VIEW */}
      {activeTab === 'catalog' && (
        <section className="catalog-section">
          {/* Filters */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <button
              className={`subnav-btn ${filterType === 'ALL' ? 'active' : ''}`}
              onClick={() => setFilterType('ALL')}
            >
              Todos ({catalog.length})
            </button>
            <button
              className={`subnav-btn ${filterType === 'PERSEUS' ? 'active' : ''}`}
              onClick={() => setFilterType('PERSEUS')}
            >
              🎯 Khan Academy Perseus (STEM)
            </button>
            <button
              className={`subnav-btn ${filterType === 'H5P' ? 'active' : ''}`}
              onClick={() => setFilterType('H5P')}
            >
              📦 H5P Interactive Packages
            </button>
          </div>

          <div className="catalog-grid">
            {filteredCatalog.map(applet => (
              <div
                key={applet.id}
                className="applet-card"
                onClick={() => startApplet(applet)}
                data-testid={`applet-card-${applet.id}`}
              >
                <div>
                  <div className="card-top">
                    <span className={`category-tag ${applet.category}`}>{applet.category}</span>
                    <span className="type-tag">{applet.type.replace('_', ' ').toUpperCase()}</span>
                  </div>
                  <h3>{applet.title}</h3>
                  <p>{applet.description}</p>
                </div>

                <div className="card-footer">
                  <span>BNCC: <strong>{applet.bnccCode}</strong></span>
                  <div className="card-rewards">
                    <span style={{ color: '#fbbf24' }}>⚡ +{applet.maxEnergyPoints}</span>
                    <span style={{ color: '#38bdf8' }}>🪙 +{applet.maxCoins}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ACTIVE PLAYER VIEW */}
      {activeTab === 'player' && selectedApplet && (
        <div className="player-container" data-testid="applet-active-player">
          <div className="player-header">
            <div>
              <span className={`category-tag ${selectedApplet.category}`} style={{ marginBottom: '0.4rem', display: 'inline-block' }}>
                {selectedApplet.category} • {selectedApplet.gradeLevel}
              </span>
              <h2>{selectedApplet.title}</h2>
              <p>{selectedApplet.description}</p>
            </div>
            <button
              className="applet-back-btn"
              onClick={() => setActiveTab('catalog')}
            >
              Trocar Applet
            </button>
          </div>

          {/* 1. PERSEUS MATH SLIDER (Cartesian Plane) */}
          {selectedApplet.type === 'perseus_math_slider' && selectedApplet.perseusSlider && (
            <div className="perseus-slider-view">
              <div className="canvas-plane-wrap">
                <svg className="svg-cartesian" viewBox="-50 -50 100 100">
                  {/* Grid Lines */}
                  {[-40, -20, 0, 20, 40].map(v => (
                    <g key={v}>
                      <line x1={v} y1="-50" x2={v} y2="50" stroke="#1e293b" strokeWidth="0.5" />
                      <line x1="-50" y1={v} x2="50" y2={v} stroke="#1e293b" strokeWidth="0.5" />
                    </g>
                  ))}
                  {/* Main Axis (X and Y) */}
                  <line x1="-50" y1="0" x2="50" y2="0" stroke="#475569" strokeWidth="1" />
                  <line x1="0" y1="-50" x2="0" y2="50" stroke="#475569" strokeWidth="1" />

                  {/* Target Points: A(1, -1) => in svg: x=10, y=10 (inverted Y) and B(3, 3) => x=30, y=-30 */}
                  <circle cx="10" cy="10" r="2.5" fill="#ec4899" />
                  <text x="13" y="14" fill="#ec4899" fontSize="4">A(1, -1)</text>

                  <circle cx="30" cy="-30" r="2.5" fill="#ec4899" />
                  <text x="33" y="-27" fill="#ec4899" fontSize="4">B(3, 3)</text>

                  {/* Live Student Function Line: y = mx + b. In SVG: x from -5 to +5 maps to -50 to +50 */}
                  {/* (x1=-5, y1 = -(m*(-5) + b)), (x2=5, y2 = -(m*(5) + b)) */}
                  <line
                    x1="-50"
                    y1={(-1) * ((sliderM * -5 + sliderB) * 10)}
                    x2="50"
                    y2={(-1) * ((sliderM * 5 + sliderB) * 10)}
                    stroke="#38bdf8"
                    strokeWidth="1.8"
                  />
                </svg>

                <div style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: '#94a3b8' }}>
                  Pontos Rosa: Alvos A e B • Linha Azul: Sua Função
                </div>
              </div>

              {/* Slider Controls */}
              <div className="slider-controls-panel">
                <div className="formula-display">
                  f(x) = {sliderM.toFixed(1)}x + ({sliderB.toFixed(1)})
                </div>

                <div className="control-group">
                  <div className="control-label">
                    <span>{selectedApplet.perseusSlider.variableName}</span>
                    <span className="value-highlight">m = {sliderM.toFixed(1)}</span>
                  </div>
                  <input
                    type="range"
                    className="range-slider"
                    min={selectedApplet.perseusSlider.min}
                    max={selectedApplet.perseusSlider.max}
                    step={selectedApplet.perseusSlider.step}
                    value={sliderM}
                    onChange={e => setSliderM(parseFloat(e.target.value))}
                    data-testid="perseus-slider-m"
                  />
                </div>

                {selectedApplet.perseusSlider.interceptName && (
                  <div className="control-group">
                    <div className="control-label">
                      <span>{selectedApplet.perseusSlider.interceptName}</span>
                      <span className="value-highlight">b = {sliderB.toFixed(1)}</span>
                    </div>
                    <input
                      type="range"
                      className="range-slider"
                      min={selectedApplet.perseusSlider.minIntercept ?? -5}
                      max={selectedApplet.perseusSlider.maxIntercept ?? 5}
                      step={selectedApplet.perseusSlider.stepIntercept ?? 1}
                      value={sliderB}
                      onChange={e => setSliderB(parseFloat(e.target.value))}
                      data-testid="perseus-slider-b"
                    />
                  </div>
                )}

                {/* Socratic Hint Accordion */}
                <div className="socratic-hint-drawer">
                  <button
                    className="hint-trigger-btn"
                    onClick={requestNextHint}
                    disabled={unlockedHintsCount >= selectedApplet.perseusSlider.hints.length}
                  >
                    <Lightbulb size={16} /> Solicitar Dica Socrática ({unlockedHintsCount}/{selectedApplet.perseusSlider.hints.length})
                  </button>
                  {selectedApplet.perseusSlider.hints.slice(0, unlockedHintsCount).map((hint, idx) => (
                    <div key={idx} className="hint-item">
                      {hint}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 2. PERSEUS NUMBER LINE */}
          {selectedApplet.type === 'perseus_number_line' && selectedApplet.perseusNumberLine && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ background: '#020617', padding: '1.5rem', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.08)' }}>
                <p style={{ margin: '0 0 1rem 0', fontWeight: 600, color: '#f1f5f9' }}>
                  {selectedApplet.perseusNumberLine.prompt}
                </p>

                {/* SVG Number Line */}
                <svg viewBox="0 0 600 80" style={{ width: '100%', height: '80px' }}>
                  {/* Main Axis Line */}
                  <line x1="40" y1="40" x2="560" y2="40" stroke="#64748b" strokeWidth="3" />
                  {/* Major Ticks 0, 1, 2, 3 */}
                  {[0, 1, 2, 3].map(val => {
                    const x = 50 + (val / 3) * 500;
                    return (
                      <g key={val}>
                        <line x1={x} y1="25" x2={x} y2="55" stroke="#94a3b8" strokeWidth="2.5" />
                        <text x={x} y="72" textAnchor="middle" fill="#cbd5e1" fontSize="14" fontWeight="bold">{val}</text>
                      </g>
                    );
                  })}

                  {/* Marker Position */}
                  {(() => {
                    const markerX = 50 + (numberLinePos / 3) * 500;
                    return (
                      <g>
                        <circle cx={markerX} cy="40" r="9" fill="#38bdf8" stroke="#fff" strokeWidth="2" />
                        <polygon points={`${markerX},30 ${markerX - 6},18 ${markerX + 6},18`} fill="#38bdf8" />
                        <text x={markerX} y="14" textAnchor="middle" fill="#38bdf8" fontSize="12" fontWeight="bold">
                          {numberLinePos.toFixed(2)}
                        </text>
                      </g>
                    );
                  })()}
                </svg>

                <div style={{ marginTop: '1rem' }}>
                  <input
                    type="range"
                    className="range-slider"
                    min={0}
                    max={3}
                    step={0.05}
                    value={numberLinePos}
                    onChange={e => setNumberLinePos(parseFloat(e.target.value))}
                    data-testid="perseus-numline-slider"
                  />
                </div>
              </div>

              {/* Hints */}
              <div className="socratic-hint-drawer">
                <button
                  className="hint-trigger-btn"
                  onClick={requestNextHint}
                  disabled={unlockedHintsCount >= selectedApplet.perseusNumberLine.hints.length}
                >
                  <Lightbulb size={16} /> Dica Socrática ({unlockedHintsCount}/{selectedApplet.perseusNumberLine.hints.length})
                </button>
                {selectedApplet.perseusNumberLine.hints.slice(0, unlockedHintsCount).map((hint, idx) => (
                  <div key={idx} className="hint-item">{hint}</div>
                ))}
              </div>
            </div>
          )}

          {/* 3. PERSEUS RADIO WITH SCAFFOLDING */}
          {selectedApplet.type === 'perseus_radio_scaffolding' && selectedApplet.perseusRadio && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ background: 'rgba(30, 41, 59, 0.5)', padding: '1.25rem', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.08)' }}>
                <h3 style={{ margin: '0 0 0.75rem 0', color: '#e2e8f0' }}>{selectedApplet.perseusRadio.questionText}</h3>
                {selectedApplet.perseusRadio.contextLatex && (
                  <div style={{ background: '#020617', padding: '0.6rem 1rem', borderRadius: '0.5rem', fontFamily: 'monospace', color: '#a78bfa', marginBottom: '1rem' }}>
                    Fórmula de Apoio: {selectedApplet.perseusRadio.contextLatex}
                  </div>
                )}

                <div className="choices-list">
                  {selectedApplet.perseusRadio.options.map(opt => (
                    <button
                      key={opt.id}
                      className={`choice-btn ${selectedRadioOpt === opt.id ? 'active' : ''}`}
                      onClick={() => setSelectedRadioOpt(opt.id)}
                      data-testid={`perseus-radio-opt-${opt.id}`}
                    >
                      <span>{opt.text}</span>
                      {selectedRadioOpt === opt.id && <CheckCircle2 size={18} color="#38bdf8" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Progressive Socratic Hints */}
              <div className="socratic-hint-drawer">
                <button
                  className="hint-trigger-btn"
                  onClick={requestNextHint}
                  disabled={unlockedHintsCount >= selectedApplet.perseusRadio.socraticHints.length}
                >
                  <Lightbulb size={16} /> Solicitar Dica Socrática Nível {unlockedHintsCount + 1}
                </button>
                {selectedApplet.perseusRadio.socraticHints.slice(0, unlockedHintsCount).map((hint, idx) => (
                  <div key={idx} className="hint-item">
                    <strong>Nível {hint.level} — {hint.title}:</strong> {hint.hintText}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. H5P BRANCHING SCENARIO */}
          {selectedApplet.type === 'h5p_branching_scenario' && selectedApplet.h5pBranching && (
            <div className="branching-node-wrap">
              {(() => {
                const node = selectedApplet.h5pBranching.nodes[currentNodeId] || selectedApplet.h5pBranching.nodes[selectedApplet.h5pBranching.startNodeId];
                return (
                  <>
                    <div className="narrative-card">
                      <h3>{node.title}</h3>
                      <p>{node.narrative}</p>
                    </div>

                    {lastChoiceFeedback && (
                      <div className="branch-feedback-box">
                        <strong>Feedback da Decisão Anterior:</strong> {lastChoiceFeedback}
                      </div>
                    )}

                    {!node.isTerminal ? (
                      <div className="choices-list">
                        {node.choices.map(choice => (
                          <button
                            key={choice.id}
                            className="choice-btn"
                            onClick={() => handleBranchChoice(choice)}
                            data-testid={`branch-choice-${choice.id}`}
                          >
                            <span>{choice.text}</span>
                            <ArrowRight size={18} />
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '1rem' }}>
                        <button
                          className="applet-back-btn"
                          onClick={() => startApplet(selectedApplet)}
                        >
                          <RotateCcw size={16} /> Reiniciar Cenário
                        </button>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          )}

          {/* 5. H5P IMAGE HOTSPOTS */}
          {selectedApplet.type === 'h5p_image_hotspots' && selectedApplet.h5pHotspots && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1.25rem' }}>
              <div className="hotspot-diagram-area">
                {/* SVG Cell Diagram Mockup */}
                <svg viewBox="0 0 500 350" style={{ width: '100%', height: '100%' }}>
                  <ellipse cx="250" cy="175" rx="220" ry="140" fill="#1e1b4b" stroke="#8b5cf6" strokeWidth="4" />
                  <ellipse cx="250" cy="175" rx="70" ry="50" fill="#312e81" stroke="#a78bfa" strokeWidth="3" />
                  <circle cx="250" cy="175" r="22" fill="#4c1d95" />
                  {/* Mitochondria shape */}
                  <ellipse cx="140" cy="110" rx="40" ry="20" fill="#831843" stroke="#f472b6" strokeWidth="2" transform="rotate(-20 140 110)" />
                  {/* Golgi */}
                  <path d="M 340 120 Q 370 135 340 150 Q 375 160 345 175" stroke="#f59e0b" strokeWidth="5" fill="none" />
                </svg>

                {/* Interactive Pins */}
                {selectedApplet.h5pHotspots.hotspots.map(hs => (
                  <button
                    key={hs.id}
                    className="hotspot-pin"
                    style={{ left: `${hs.xPercent}%`, top: `${hs.yPercent}%` }}
                    onClick={() => setActiveHotspotId(hs.id)}
                    title={hs.name}
                    data-testid={`hotspot-pin-${hs.id}`}
                  >
                    +
                  </button>
                ))}
              </div>

              {/* Hotspot Insight Panel */}
              <div style={{ background: 'rgba(30, 41, 59, 0.6)', padding: '1.25rem', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.08)' }}>
                {activeHotspotId ? (() => {
                  const hs = selectedApplet.h5pHotspots.hotspots.find(h => h.id === activeHotspotId);
                  if (!hs) return null;
                  return (
                    <div>
                      <h3 style={{ margin: '0 0 0.5rem 0', color: '#f472b6' }}>{hs.name}</h3>
                      <p style={{ fontSize: '0.85rem', lineHeight: '1.5', color: '#cbd5e1', marginBottom: '0.75rem' }}>
                        {hs.description}
                      </p>
                      <div style={{ background: '#020617', padding: '0.6rem', borderRadius: '0.5rem', fontSize: '0.8rem', color: '#38bdf8', marginBottom: '1rem' }}>
                        💡 <strong>Curiosidade Científica:</strong> {hs.funFact}
                      </div>

                      {hs.microQuiz && (
                        <div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                            {hs.microQuiz.question}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                            {hs.microQuiz.options.map((opt, oIdx) => (
                              <button
                                key={oIdx}
                                className={`choice-btn ${hotspotQuizAnswers[hs.id] === oIdx ? 'active' : ''}`}
                                style={{ padding: '0.5rem', fontSize: '0.8rem' }}
                                onClick={() => setHotspotQuizAnswers(prev => ({ ...prev, [hs.id]: oIdx }))}
                              >
                                {opt}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })() : (
                  <div style={{ textAlign: 'center', color: '#94a3b8', paddingTop: '2rem' }}>
                    <Eye size={32} style={{ marginBottom: '0.5rem' }} />
                    <p>Clique nos pins pulsantes (+) sobre o diagrama para investigar as organelas celulares.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 6. H5P DRAG WORDS */}
          {selectedApplet.type === 'h5p_drag_words' && selectedApplet.h5pDragWords && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ background: 'rgba(30, 41, 59, 0.5)', padding: '1.5rem', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.08)' }}>
                <p style={{ margin: '0 0 1rem 0', fontWeight: 600, color: '#f1f5f9' }}>
                  {selectedApplet.h5pDragWords.instruction}
                </p>

                {/* Sentence with Slots */}
                <div style={{ fontSize: '1.05rem', lineHeight: '2.2', color: '#e2e8f0', background: '#020617', padding: '1.25rem', borderRadius: '0.75rem' }}>
                  {selectedApplet.h5pDragWords.sentenceSegments.map((seg, sIdx) => {
                    const blank = selectedApplet.h5pDragWords?.blanks.find(b => b.slotIdx === sIdx);
                    return (
                      <React.Fragment key={sIdx}>
                        <span>{seg}</span>
                        {blank && (
                          <span
                            style={{
                              display: 'inline-block',
                              minWidth: '110px',
                              padding: '0.2rem 0.6rem',
                              borderBottom: '2px solid #8b5cf6',
                              background: dragSlotAnswers[blank.slotIdx] ? 'rgba(139, 92, 246, 0.3)' : 'rgba(255, 255, 255, 0.05)',
                              borderRadius: '0.35rem',
                              color: '#c4b5fd',
                              fontWeight: 700,
                              textAlign: 'center',
                              margin: '0 0.35rem',
                              cursor: 'pointer'
                            }}
                            onClick={() => {
                              // Desfazer slot
                              setDragSlotAnswers(prev => {
                                const next = { ...prev };
                                delete next[blank.slotIdx];
                                return next;
                              });
                            }}
                            title="Clique para remover a palavra do slot"
                          >
                            {dragSlotAnswers[blank.slotIdx] || '_______'}
                          </span>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>

                {/* Word Bank Chips */}
                <div style={{ marginTop: '1.5rem' }}>
                  <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.5rem' }}>
                    Banco de Termos Disponíveis (Clique no termo para preencher o próximo slot vazio):
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {[
                      ...selectedApplet.h5pDragWords.blanks.map(b => b.correctWord),
                      ...selectedApplet.h5pDragWords.distractorWords
                    ].map((w, wIdx) => {
                      const isAssigned = Object.values(dragSlotAnswers).includes(w);
                      return (
                        <button
                          key={wIdx}
                          disabled={isAssigned}
                          className="choice-btn"
                          style={{
                            padding: '0.4rem 0.85rem',
                            fontSize: '0.85rem',
                            opacity: isAssigned ? 0.3 : 1,
                            cursor: isAssigned ? 'default' : 'pointer'
                          }}
                          onClick={() => {
                            // Encontrar primeiro slot vago
                            const emptyBlank = selectedApplet.h5pDragWords?.blanks.find(b => !dragSlotAnswers[b.slotIdx]);
                            if (emptyBlank) {
                              setDragSlotAnswers(prev => ({ ...prev, [emptyBlank.slotIdx]: w }));
                            }
                          }}
                        >
                          {w}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Validation Result Banner */}
          {validationResult && (
            <div
              className={`result-banner ${validationResult.isCorrect ? 'success' : 'fail'}`}
              data-testid="applet-result-banner"
            >
              {validationResult.isCorrect ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
              <div>
                <div>{validationResult.feedbackMessage}</div>
                {validationResult.coinsEarned > 0 && (
                  <div style={{ fontSize: '0.85rem', marginTop: '0.2rem' }}>
                    Recompensas: +{validationResult.energyPointsEarned} PE | +{validationResult.coinsEarned} Sovereign Coins
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Player Bottom Actions */}
          {selectedApplet.type !== 'h5p_branching_scenario' && (
            <div className="player-actions">
              <button
                className="verify-btn"
                onClick={handleVerify}
                data-testid="applet-verify-btn"
              >
                <Check size={18} /> Validar Solução e Salvar
              </button>
            </div>
          )}
        </div>
      )}

      {/* HISTORY VIEW */}
      {activeTab === 'history' && (
        <section className="catalog-section" data-testid="applet-history-section">
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>
            🏆 Registro Soberano de Maestria ({historyRecords.length} Conclusões)
          </h2>

          {historyRecords.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
              <Layers size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
              <p>Nenhum applet foi concluído ainda nesta sessão. Escolha uma atividade no catálogo para começar!</p>
            </div>
          ) : (
            <div className="catalog-grid">
              {historyRecords.map(rec => (
                <div key={rec.id} className="applet-card" style={{ cursor: 'default' }}>
                  <div>
                    <div className="card-top">
                      <span className={`category-tag ${rec.category || 'STEM'}`}>{rec.category || 'STEM'}</span>
                      <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 700 }}>
                        NOTA: {rec.score}/{rec.maxScore}
                      </span>
                    </div>
                    <h3>{rec.appletId}</h3>
                    <p style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>
                      Tipo: {rec.appletType} • Dicas: {rec.hintsUsed || 0}
                    </p>
                  </div>

                  <div className="card-footer">
                    <span>{new Date(rec.completedAt).toLocaleDateString('pt-BR')}</span>
                    <span style={{ color: '#38bdf8', fontWeight: 600 }}>🪙 +{rec.coinsAwarded} Coins</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
};

export default H5PPerseusAppletLab;
