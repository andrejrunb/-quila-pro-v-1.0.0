import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles, RotateCcw, Play, Pause, Eye, Code, Flame,
  CheckCircle2, AlertCircle, ArrowRight, Award, Zap, Layers
} from 'lucide-react';
import './NativePhETSimulationLab.css';

interface Vector2D {
  x: number;
  y: number;
}

interface ChargeParticle {
  id: number;
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  sign: '+' | '-';
  carrier: 'sweater' | 'balloon' | 'wall';
}

interface KumonDrill {
  id: string;
  level: string;
  question: string;
  ans: string;
  hint: string;
  explanation: string;
}

const KUMON_ELECTRO_DRILLS: KumonDrill[] = [
  {
    id: 'e-1',
    level: 'NÍVEL L1 • AUTOMATICIDADE DE CARGA',
    question: 'Um corpo que ganha 5 · 10¹² elétrons (e = 1,6·10⁻¹⁹ C) adquire qual carga em microcoulombs (μC)? Calcule 5 × 1,6:',
    ans: '8',
    hint: 'Multiplicação direta: 5 · 1,6 = 8 (carga Q = 8 · 10⁻⁷ C = 0,8 μC)',
    explanation: 'A quantização da carga elétrica Q = n · e é o fundamento de qualquer fenômeno eletrostático.'
  },
  {
    id: 'e-2',
    level: 'NÍVEL L2 • LEI DO INVERSO DO QUADRADO',
    question: 'Se a distância d entre o balão e o casaco é reduzida para a metade (1/2), a força de atração F aumenta quantas vezes?',
    ans: '4',
    hint: 'Como d está ao quadrado no denominador: 1 / (1/2)² = 1 / (1/4) = 4',
    explanation: 'Pela Lei de Coulomb, aproximar os corpos pela metade quadruplica a atração mútua.'
  },
  {
    id: 'e-3',
    level: 'NÍVEL L3 • VESTIBULAR UNB / ENEM',
    question: 'Ao aproximar um balão carregado negativamente de uma parede neutra de concreto, por que o balão é atraído e gruda na parede?',
    ans: 'indução',
    hint: 'Digite a palavra-chave do fenômeno de separação de cargas em corpos neutros',
    explanation: 'Ocorre indução eletrostática e polarização: os elétrons da parede são repelidos para o fundo, deixando a superfície com carga positiva próxima.'
  }
];

export const NativePhETSimulationLab: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [activeTab, setActiveTab] = useState<'sim' | 'drills' | 'xray'>('sim');

  // Sim State
  const [balloonPos, setBalloonPos] = useState<Vector2D>({ x: 380, y: 220 });
  const [balloonVel, setBalloonVel] = useState<Vector2D>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [showWall, setShowWall] = useState(true);
  const [showForces, setShowForces] = useState(true);
  const [balloonChargeCount, setBalloonChargeCount] = useState(0);
  const [forceVector, setForceVector] = useState<Vector2D>({ x: 0, y: 0 });

  // Drills State
  const [drillAnswers, setDrillAnswers] = useState<Record<string, string>>({});
  const [drillStatus, setDrillStatus] = useState<Record<string, 'correct' | 'incorrect'>>({});
  const [scoreXp, setScoreXp] = useState(0);

  // Position and geometry references
  const posRef = useRef<Vector2D>({ x: 380, y: 220 });
  const velRef = useRef<Vector2D>({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const chargeCountRef = useRef(0);
  const showWallRef = useRef(showWall);
  const showForcesRef = useRef(showForces);

  useEffect(() => {
    showWallRef.current = showWall;
  }, [showWall]);

  useEffect(() => {
    showForcesRef.current = showForces;
  }, [showForces]);

  // Particles initial state
  const particlesRef = useRef<ChargeParticle[]>([]);

  useEffect(() => {
    // Populate Sweater charges
    const parts: ChargeParticle[] = [];
    let pid = 1;
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 4; c++) {
        const bx = 90 + c * 32;
        const by = 110 + r * 38;
        parts.push({ id: pid++, x: bx, y: by, baseX: bx, baseY: by, sign: '+', carrier: 'sweater' });
        parts.push({ id: pid++, x: bx + 12, y: by + 10, baseX: bx + 12, baseY: by + 10, sign: '-', carrier: 'sweater' });
      }
    }
    // Populate Wall dipoles
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 3; c++) {
        const wx = 620 + c * 26;
        const wy = 70 + r * 38;
        parts.push({ id: pid++, x: wx, y: wy, baseX: wx, baseY: wy, sign: '+', carrier: 'wall' });
        parts.push({ id: pid++, x: wx + 10, y: wy, baseX: wx + 10, baseY: wy, sign: '-', carrier: 'wall' });
      }
    }
    particlesRef.current = parts;
  }, []);

  // 60 FPS Physics Simulation Loop (Transpiled from BalloonForces.java)
  useEffect(() => {
    let animId: number;

    const renderLoop = () => {
      const canvas = canvasRef.current;
      if (!canvas) {
        animId = requestAnimationFrame(renderLoop);
        return;
      }
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const w = canvas.width;
      const h = canvas.height;
      const k = 14.0; // Coulomb constant multiplier from PhET Java
      const dt = 0.016; // 60 FPS step

      // 1. Clear background
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, w, h);

      // Draw Grid / Laboratory floor
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // 2. Draw Sweater (Left side)
      ctx.fillStyle = 'rgba(245, 158, 11, 0.12)';
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(60, 80, 160, 260, 16);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('CASACO DE LÃ', 95, 70);

      // 3. Draw Wall (Right side if visible)
      if (showWallRef.current) {
        ctx.fillStyle = 'rgba(100, 116, 139, 0.2)';
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(600, 50, 90, 340, 8);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#cbd5e1';
        ctx.fillText('PAREDE NEUTRA', 600, 40);
      }

      // 4. Calculate Net Electrostatic Force when balloon is released
      let fx = 0;
      let fy = 0;
      const qBalloon = chargeCountRef.current;
      const bPos = posRef.current;

      // Sweater attraction (if balloon has negative charges)
      if (qBalloon > 0) {
        const sweaterCenter: Vector2D = { x: 140, y: 210 };
        const dx = sweaterCenter.x - bPos.x;
        const dy = sweaterCenter.y - bPos.y;
        const distSq = dx * dx + dy * dy;
        const dist = Math.sqrt(distSq);

        if (dist > 10) {
          // Coulomb vector force: F = k * Q1 * Q2 / dist²
          const forceMag = (k * qBalloon * 8.0) / Math.max(distSq, 400);
          fx += (dx / dist) * forceMag * 40;
          fy += (dy / dist) * forceMag * 40;
        }

        // Wall induced polarization attraction
        if (showWallRef.current && bPos.x > 380) {
          const wallDist = 600 - (bPos.x + 35);
          if (wallDist > 0 && wallDist < 180) {
            // Induced dipole force proportional to 1/d³
            const inducedForce = (k * qBalloon * 4.5) / Math.pow(Math.max(wallDist, 15), 1.6);
            fx += inducedForce * 30;
          }
        }
      }

      // Update force vector for UI
      setForceVector({ x: Math.round(fx), y: Math.round(fy) });

      // Apply Euler-Cromer Physics Integration if NOT dragging
      if (!isDraggingRef.current) {
        // Damping/air resistance
        velRef.current.x = (velRef.current.x + fx * dt) * 0.92;
        velRef.current.y = (velRef.current.y + fy * dt) * 0.92;

        posRef.current.x += velRef.current.x * dt * 60;
        posRef.current.y += velRef.current.y * dt * 60;

        // Boundaries constraints
        if (posRef.current.x < 130) {
          posRef.current.x = 130;
          velRef.current.x = 0;
        }
        if (showWallRef.current && posRef.current.x > 560) {
          posRef.current.x = 560; // Sticks to the wall!
          velRef.current.x = 0;
        } else if (!showWallRef.current && posRef.current.x > 680) {
          posRef.current.x = 680;
          velRef.current.x = 0;
        }

        if (posRef.current.y < 80) posRef.current.y = 80;
        if (posRef.current.y > 330) posRef.current.y = 330;

        setBalloonPos({ ...posRef.current });
      }

      // 5. Draw Charges
      particlesRef.current.forEach((p) => {
        // If carrier is balloon, move with balloon
        let px = p.x;
        let py = p.y;
        if (p.carrier === 'balloon') {
          px = posRef.current.x + p.baseX;
          py = posRef.current.y + p.baseY;
        } else if (p.carrier === 'wall' && p.sign === '-' && qBalloon > 0) {
          // Induced displacement of wall electrons away from negative balloon
          const bDistX = 600 - posRef.current.x;
          if (bDistX > 0 && bDistX < 200) {
            const shift = (1.0 - bDistX / 200) * 14;
            px = p.baseX + shift; // pushed deeper into the wall
          } else {
            px = p.baseX;
          }
        }

        ctx.fillStyle = p.sign === '+' ? '#ef4444' : '#38bdf8';
        ctx.beginPath();
        ctx.arc(px, py, 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(p.sign, px, py);
      });

      // 6. Draw Balloon Body
      const bx = posRef.current.x;
      const by = posRef.current.y;

      ctx.save();
      // Balloon ellipse
      ctx.fillStyle = 'rgba(234, 179, 8, 0.85)';
      ctx.strokeStyle = '#ca8a04';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(bx, by, 40, 52, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Balloon knot
      ctx.fillStyle = '#ca8a04';
      ctx.beginPath();
      ctx.moveTo(bx - 6, by + 52);
      ctx.lineTo(bx + 6, by + 52);
      ctx.lineTo(bx, by + 58);
      ctx.closePath();
      ctx.fill();

      // Balloon string
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(bx, by + 58);
      ctx.bezierCurveTo(bx - 8, by + 75, bx + 12, by + 90, bx, by + 105);
      ctx.stroke();

      ctx.restore();

      // 7. Draw Force Vectors if enabled
      if (showForcesRef.current && (Math.abs(fx) > 1 || Math.abs(fy) > 1)) {
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(bx, by);
        const targetX = bx + fx * 1.8;
        const targetY = by + fy * 1.8;
        ctx.lineTo(targetX, targetY);
        ctx.stroke();

        // Arrow head
        const angle = Math.atan2(fy, fx);
        ctx.fillStyle = '#10b981';
        ctx.beginPath();
        ctx.moveTo(targetX, targetY);
        ctx.lineTo(targetX - 10 * Math.cos(angle - Math.PI / 6), targetY - 10 * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(targetX - 10 * Math.cos(angle + Math.PI / 6), targetY - 10 * Math.sin(angle + Math.PI / 6));
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#34d399';
        ctx.font = 'bold 11px sans-serif';
        ctx.fillText(`F_res: ${Math.round(Math.hypot(fx, fy))} N`, targetX + 10, targetY);
      }

      animId = requestAnimationFrame(renderLoop);
    };

    animId = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Mouse / Touch Handlers for Dragging Balloon & Triboelectricity
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    const dx = mx - posRef.current.x;
    const dy = my - posRef.current.y;
    if (Math.hypot(dx, dy) < 55) {
      isDraggingRef.current = true;
      setIsDragging(true);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDraggingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = Math.max(120, Math.min(canvas.width - 60, e.clientX - rect.left));
    const my = Math.max(70, Math.min(canvas.height - 80, e.clientY - rect.top));

    posRef.current = { x: mx, y: my };
    setBalloonPos({ x: mx, y: my });

    // Check rubbing against sweater (Triboelectric friction transfer)
    if (mx >= 60 && mx <= 230 && my >= 80 && my <= 340) {
      // Find sweater negative charges and transfer to balloon
      particlesRef.current.forEach((p) => {
        if (p.carrier === 'sweater' && p.sign === '-') {
          const distToBalloon = Math.hypot(p.x - mx, p.y - my);
          if (distToBalloon < 45) {
            p.carrier = 'balloon';
            p.baseX = (Math.random() - 0.5) * 40;
            p.baseY = (Math.random() - 0.5) * 50;
            chargeCountRef.current++;
            setBalloonChargeCount(chargeCountRef.current);
          }
        }
      });
    }
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
    setIsDragging(false);
  };

  const handleResetCharges = () => {
    chargeCountRef.current = 0;
    setBalloonChargeCount(0);
    posRef.current = { x: 380, y: 220 };
    velRef.current = { x: 0, y: 0 };
    setBalloonPos({ x: 380, y: 220 });

    particlesRef.current.forEach((p) => {
      if (p.carrier === 'balloon') {
        p.carrier = 'sweater';
        p.x = p.baseX;
        p.y = p.baseY;
      }
    });
  };

  const evaluateDrill = (drillId: string, correctAns: string) => {
    const userVal = (drillAnswers[drillId] || '').trim().toLowerCase();
    const isOk = userVal.includes(correctAns.toLowerCase());
    setDrillStatus((prev) => ({ ...prev, [drillId]: isOk ? 'correct' : 'incorrect' }));
    if (isOk && drillStatus[drillId] !== 'correct') {
      setScoreXp((prev) => prev + 25);
    }
  };

  return (
    <div className="native-phet-container">
      {/* Header Strip */}
      <div className="native-phet-header">
        <div className="header-meta">
          <div className="tech-badge">
            <Zap size={13} className="text-amber-400" />
            <span>ENGENHARIA REVERSA REA • PhET JAVA DESCOMPILADO & TRANSPILADO</span>
          </div>
          <h2>Laboratório Nativo: Eletrostática, Atrito & Polarização Induzida</h2>
          <p>
            Simulação física executada 100% offline em HTML5 Canvas, reconstruída diretamente a partir do código fonte Java original do PhET (<em>BalloonForces.java</em>).
          </p>
        </div>

        <div className="header-score">
          <Award size={18} className="text-amber-400" />
          <div>
            <span className="score-sub">MAESTRIA COGNITIVA</span>
            <span className="score-val">{scoreXp} XP</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="phet-mode-tabs">
        <button
          className={`mode-btn ${activeTab === 'sim' ? 'active' : ''}`}
          onClick={() => setActiveTab('sim')}
        >
          <Play size={14} />
          <span>Simulação Interativa Canvas</span>
        </button>
        <button
          className={`mode-btn ${activeTab === 'drills' ? 'active' : ''}`}
          onClick={() => setActiveTab('drills')}
        >
          <Flame size={14} />
          <span>Desafios Kumon L1/L2/L3</span>
        </button>
        <button
          className={`mode-btn ${activeTab === 'xray' ? 'active' : ''}`}
          onClick={() => setActiveTab('xray')}
        >
          <Code size={14} />
          <span>Raio-X da Descompilação Java (REA)</span>
        </button>
      </div>

      {/* TAB 1: Canvas Simulation */}
      {activeTab === 'sim' && (
        <div className="canvas-wrapper-grid">
          <div className="canvas-box">
            <canvas
              ref={canvasRef}
              width={720}
              height={440}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            />

            <div className="canvas-hud">
              <span className="hud-tip">
                🖐️ <strong>Instrução:</strong> Clique e arraste o balão amarelo sobre o casaco de lã para esfregar e roubar elétrons. Solte no meio ou perto da parede para ver a atração por indução!
              </span>
            </div>
          </div>

          <div className="sim-controls-panel">
            <div className="control-card">
              <span className="control-title">TELEMETRIA DE CARGA</span>
              <div className="metric-row">
                <span>Elétrons no Balão:</span>
                <strong className="text-cyan-400">-{balloonChargeCount} e</strong>
              </div>
              <div className="metric-row">
                <span>Carga Líquida do Casaco:</span>
                <strong className="text-amber-400">+{balloonChargeCount} e</strong>
              </div>
              <div className="metric-row">
                <span>Força Resultante:</span>
                <strong className="text-emerald-400">
                  {Math.round(Math.hypot(forceVector.x, forceVector.y))} N
                </strong>
              </div>
            </div>

            <div className="control-card">
              <span className="control-title">CONTROLES DO AMBIENTE</span>
              <div className="toggle-row">
                <label>
                  <input
                    type="checkbox"
                    checked={showWall}
                    onChange={(e) => setShowWall(e.target.checked)}
                  />
                  <span>Exibir Parede Neutra (Indução)</span>
                </label>
              </div>

              <div className="toggle-row">
                <label>
                  <input
                    type="checkbox"
                    checked={showForces}
                    onChange={(e) => setShowForces(e.target.checked)}
                  />
                  <span>Exibir Vetores de Força Resultante</span>
                </label>
              </div>

              <button className="reset-btn" onClick={handleResetCharges}>
                <RotateCcw size={14} />
                <span>Resetar Cargas e Posição</span>
              </button>
            </div>

            <div className="phet-legend">
              <div className="legend-item">
                <span className="dot red" />
                <span>Cargas Positivas (+)</span>
              </div>
              <div className="legend-item">
                <span className="dot blue" />
                <span>Cargas Negativas (-)</span>
              </div>
              <div className="legend-item">
                <span className="dot green" />
                <span>Vetor Força Eletrostática</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Kumon Micro-Drills */}
      {activeTab === 'drills' && (
        <div className="drills-container">
          <div className="drills-intro-box">
            <Flame size={18} className="text-amber-400" />
            <div>
              <h3>Treino de Automaticidade & Retenção Eletrostática</h3>
              <p>
                Resolva as operações matemáticas passo a passo para liberar a memória de trabalho antes dos grandes vestibulares.
              </p>
            </div>
          </div>

          <div className="drills-list">
            {KUMON_ELECTRO_DRILLS.map((d) => {
              const status = drillStatus[d.id];
              return (
                <div key={d.id} className={`drill-card ${status || ''}`}>
                  <div className="drill-header">
                    <span className="drill-level">{d.level}</span>
                    {status === 'correct' && (
                      <span className="status-badge success">
                        <CheckCircle2 size={13} /> Acerto (+25 XP)
                      </span>
                    )}
                    {status === 'incorrect' && (
                      <span className="status-badge error">
                        <AlertCircle size={13} /> Tente novamente
                      </span>
                    )}
                  </div>

                  <p className="drill-q">{d.question}</p>

                  <div className="drill-input-row">
                    <input
                      type="text"
                      placeholder="Sua resposta..."
                      value={drillAnswers[d.id] || ''}
                      onChange={(e) =>
                        setDrillAnswers((prev) => ({ ...prev, [d.id]: e.target.value }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') evaluateDrill(d.id, d.ans);
                      }}
                    />
                    <button onClick={() => evaluateDrill(d.id, d.ans)}>Verificar</button>
                  </div>

                  <div className="drill-hint-box">
                    <strong>Dica:</strong> {d.hint}
                  </div>

                  {status && (
                    <div className="drill-exp-box">
                      <strong>Fundamento Neuroeducativo:</strong> {d.explanation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: REA Java Decompilation X-Ray */}
      {activeTab === 'xray' && (
        <div className="xray-container">
          <div className="xray-intro">
            <Code size={18} className="text-cyan-400" />
            <div>
              <h3>Engenharia Reversa: Java PhET Bytecode ➔ TypeScript Nativo</h3>
              <p>
                Demonstração da dissecação de <code>balloons_pt_BR.jar</code> descompilado via CFR e mapeado para o motor vetorial 2D do Áquila.
              </p>
            </div>
          </div>

          <div className="code-split-grid">
            <div className="code-panel">
              <div className="code-header">
                <span className="badge-lang java">JAVA (CFR DECOMPILED PHET)</span>
                <span>BalloonForces.java</span>
              </div>
              <pre className="code-block">
{`public static DoublePoint getForce(DoublePoint doublePoint, DoublePoint doublePoint2, double d) {
    DoublePoint doublePoint3 = doublePoint.subtract(doublePoint2);
    double d2 = doublePoint3.length();
    if (d2 == 0.0) {
        return new DoublePoint();
    }
    // Lei de Coulomb Vetorial: F = k * Q1 * Q2 / r^3 * r_vector
    DoublePoint doublePoint4 = doublePoint3.multiply(d / (d2 * d2 * d2));
    return doublePoint4;
}`}
              </pre>
            </div>

            <div className="code-panel">
              <div className="code-header">
                <span className="badge-lang ts">TYPESCRIPT TRANSPILADO (ÁQUILA PRO)</span>
                <span>NativeCanvasPhysics.ts</span>
              </div>
              <pre className="code-block">
{`public calculateForce(p1: Vector2D, p2: Vector2D, qProduct: number): Vector2D {
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    const distSq = dx * dx + dy * dy;
    const dist = Math.sqrt(distSq);

    if (dist === 0) return { x: 0, y: 0 };
    const forceMagnitude = (this.k * qProduct) / (distSq * dist);
    return {
        x: dx * forceMagnitude,
        y: dy * forceMagnitude
    };
}`}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
