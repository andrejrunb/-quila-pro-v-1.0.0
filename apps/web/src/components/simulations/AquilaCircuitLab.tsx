"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Zap,
  Activity,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Gauge,
  Sliders,
  Award,
  BookOpen,
  Sparkles,
  ShieldCheck,
  HelpCircle,
  TrendingUp,
} from "lucide-react";

interface CircuitTelemetry {
  voltage: number;
  resistance: number;
  current: number;
  power: number;
  switchClosed: boolean;
  isBlown: boolean;
  timestamp: string;
}

interface AquilaCircuitLabProps {
  onComplete?: (result: {
    telemetry: CircuitTelemetry;
    earnedXp: number;
    challengeScore: number;
  }) => void;
  isTeacherView?: boolean;
}

export function AquilaCircuitLab({
  onComplete,
  isTeacherView = false,
}: AquilaCircuitLabProps) {
  // Simulation State (Pure Mathematical Solver - Deterministic)
  const [voltage, setVoltage] = useState<number>(12); // Volts (0 - 24V)
  const [resistance, setResistance] = useState<number>(6); // Ohms (1 - 50 Ohms)
  const [switchClosed, setSwitchClosed] = useState<boolean>(true);
  const [fuseBlown, setFuseBlown] = useState<boolean>(false);
  const [particleOffset, setParticleOffset] = useState<number>(0);

  // Derived Physical Quantities (Ohm's Law: I = V / R, P = V * I)
  const effectiveResistance = Math.max(0.1, resistance);
  const current =
    switchClosed && !fuseBlown ? Number((voltage / effectiveResistance).toFixed(2)) : 0;
  const power =
    switchClosed && !fuseBlown ? Number((voltage * current).toFixed(2)) : 0;

  // Max safe power limit: 75W (burns fuse to demonstrate protection)
  const MAX_SAFE_POWER = 75;

  useEffect(() => {
    if (power > MAX_SAFE_POWER && !fuseBlown) {
      setFuseBlown(true);
    }
  }, [power, fuseBlown]);

  // Electron Particle Flow Animation
  useEffect(() => {
    if (!switchClosed || fuseBlown || current === 0) return;
    const interval = setInterval(() => {
      // Speed proportional to current
      setParticleOffset((prev) => (prev + current * 1.5) % 100);
    }, 40);
    return () => clearInterval(interval);
  }, [switchClosed, fuseBlown, current]);

  // Pedagogical Scaffolding Challenge ("Escadinha Cognitiva" ENEM)
  const [activeStep, setActiveStep] = useState<number>(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [challengeCompleted, setChallengeCompleted] = useState<boolean>(false);

  const SCAFFOLDING_QUESTIONS = [
    {
      level: "Passo 1: Identificação de Grandeza e Unidade",
      question:
        "No multímetro digital, você ajusta um resistor para medir sua oposição à passagem de corrente. Qual é a unidade padrão do Sistema Internacional (SI) para a resistência elétrica?",
      options: [
        "Volt (V)",
        "Ohm (Ω)",
        "Ampere (A)",
        "Watt (W)",
      ],
      correctIndex: 1,
      hint: "O Volt mede potencial elétrico, o Ampere mede corrente e o Ohm homenageia Georg Ohm.",
    },
    {
      level: "Passo 2: Relação Causa-Efeito (1ª Lei de Ohm)",
      question:
        "Mantendo a resistência do resistor constante em 6 Ω, se você DOBRAR a tensão da fonte (de 6V para 12V), o que acontece com a corrente elétrica indicada no amperímetro?",
      options: [
        "A corrente permanece constante (não varia).",
        "A corrente cai pela metade (inversamente proporcional).",
        "A corrente dobra (diretamente proporcional: I = V / R).",
        "A corrente quadruplica devido ao efeito Joule.",
      ],
      correctIndex: 2,
      hint: "De acordo com V = R · I, se R é fixo, tensão e corrente são grandezas diretamente proporcionais.",
    },
    {
      level: "Passo 3: Aplicação Prática no Laboratório Virtual",
      question:
        "Ajuste no painel acima a Tensão para 12 V e a Resistência para 4 Ω. Qual é o valor exato da corrente medida no circuito e qual a potência dissipada?",
      options: [
        "Corrente = 3,0 A e Potência = 36 W (P = V · I)",
        "Corrente = 4,0 A e Potência = 48 W",
        "Corrente = 0,33 A e Potência = 4 W",
        "Corrente = 2,0 A e Potência = 24 W",
      ],
      correctIndex: 0,
      hint: "I = 12 / 4 = 3,0 A. Potência P = 12 × 3 = 36 W.",
    },
  ];

  const handleVerifyStep = () => {
    if (selectedAnswer === null) return;
    const currentQ = SCAFFOLDING_QUESTIONS[activeStep];
    if (selectedAnswer === currentQ.correctIndex) {
      setFeedback("✓ Correto! Excelente dedução física.");
      setTimeout(() => {
        if (activeStep < SCAFFOLDING_QUESTIONS.length - 1) {
          setActiveStep((s) => s + 1);
          setSelectedAnswer(null);
          setFeedback(null);
        } else {
          setChallengeCompleted(true);
          setFeedback("🎉 Parabéns! Você dominou a Bancada 01: 1ª Lei de Ohm.");
          if (onComplete) {
            onComplete({
              telemetry: {
                voltage,
                resistance,
                current,
                power,
                switchClosed,
                isBlown: fuseBlown,
                timestamp: new Date().toISOString(),
              },
              earnedXp: 150,
              challengeScore: 100,
            });
          }
        }
      }, 1200);
    } else {
      setFeedback(`✕ Incorreto. Dica: ${currentQ.hint}`);
    }
  };

  const resetFuse = () => {
    setVoltage(12);
    setResistance(10);
    setFuseBlown(false);
  };

  // Lamp Brightness computation (0 to 1)
  const lampIntensity = Math.min(1, power / 50);

  return (
    <div className="w-full rounded-2xl bg-[#090D1A] border-2 border-slate-700 p-4 sm:p-6 text-white shadow-2xl flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
            <Zap size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                Bancada 01 • Áquila Lab 3D
              </span>
              <span className="text-[10px] font-bold text-slate-400">
                BNCC: EM13CNT106 • ENEM
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-white">
              Circuito Elétrico & 1ª Lei de Ohm (V = R · I)
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setVoltage(12);
              setResistance(6);
              setSwitchClosed(true);
              setFuseBlown(false);
            }}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 flex items-center gap-1.5 border border-slate-600 transition"
          >
            <RotateCcw size={13} /> Resetar Bancada
          </button>
        </div>
      </div>

      {/* Main Grid: Interactive Circuit Diagram + Digital Gauges */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Circuit Schematic & Animated Particle Canvas */}
        <div className="lg:col-span-7 bg-[#030712] border-2 border-slate-600/90 rounded-2xl p-4 sm:p-5 relative overflow-hidden shadow-inner flex flex-col items-center justify-center min-h-[360px]">
          {/* Fuse Alert */}
          {fuseBlown && (
            <div className="absolute inset-0 z-20 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-fade-in">
              <AlertTriangle className="text-amber-400 w-12 h-12 mb-2 animate-bounce" />
              <h3 className="text-base font-black text-white">
                FUSÍVEL ROMPIDO (SOBRECARGA ELÉTRICA)
              </h3>
              <p className="text-xs text-slate-300 max-w-sm mt-1">
                A potência dissipada ultrapassou o limite seguro de 75W (Efeito Joule excessivo: P = {power}W).
              </p>
              <button
                type="button"
                onClick={resetFuse}
                className="mt-4 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-xs transition"
              >
                Substituir Fusível & Restabelecer Parâmetros
              </button>
            </div>
          )}

          {/* SVG Schematic Diagram with Electron Flow */}
          <div className="w-full max-w-[480px] aspect-[4/3] relative flex items-center justify-center">
            <svg
              viewBox="0 0 400 300"
              className="w-full h-full drop-shadow-[0_0_15px_rgba(6,182,212,0.15)]"
            >
              {/* Circuit Wires */}
              <rect
                x="50"
                y="50"
                width="300"
                height="200"
                rx="16"
                fill="none"
                stroke="#334155"
                strokeWidth="6"
              />
              <rect
                x="50"
                y="50"
                width="300"
                height="200"
                rx="16"
                fill="none"
                stroke={switchClosed && !fuseBlown && current > 0 ? "#00F5D4" : "#475569"}
                strokeWidth="4"
                strokeDasharray={switchClosed && !fuseBlown && current > 0 ? "8 6" : "none"}
                strokeDashoffset={-particleOffset}
                className="transition-colors duration-300"
              />

              {/* Power Supply (Left Branch) */}
              <g transform="translate(50, 150)">
                <circle cx="0" cy="0" r="24" fill="#0F172A" stroke="#38BDF8" strokeWidth="3" />
                <text x="0" y="-4" fill="#38BDF8" fontSize="12" fontWeight="900" textAnchor="middle">
                  + {voltage}V
                </text>
                <text x="0" y="10" fill="#94A3B8" fontSize="9" fontWeight="bold" textAnchor="middle">
                  DC FONTE
                </text>
              </g>

              {/* Switch (Top Branch) */}
              <g
                transform="translate(200, 50)"
                onClick={() => setSwitchClosed(!switchClosed)}
                className="cursor-pointer group"
              >
                <circle cx="-30" cy="0" r="5" fill="#E2E8F0" />
                <circle cx="30" cy="0" r="5" fill="#E2E8F0" />
                {switchClosed ? (
                  <line x1="-30" y1="0" x2="30" y2="0" stroke="#10B981" strokeWidth="4" />
                ) : (
                  <line x1="-30" y1="0" x2="20" y2="-20" stroke="#EF4444" strokeWidth="4" />
                )}
                <text
                  x="0"
                  y="-18"
                  fill={switchClosed ? "#10B981" : "#EF4444"}
                  fontSize="9"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  {switchClosed ? "CHAVE FECHADA (ON)" : "CHAVE ABERTA (OFF)"}
                </text>
              </g>

              {/* Resistor (Right Branch) */}
              <g transform="translate(350, 150)">
                <rect
                  x="-16"
                  y="-35"
                  width="32"
                  height="70"
                  rx="6"
                  fill="#1E293B"
                  stroke="#F59E0B"
                  strokeWidth="3"
                />
                <text
                  x="0"
                  y="-8"
                  fill="#F59E0B"
                  fontSize="12"
                  fontWeight="900"
                  textAnchor="middle"
                >
                  {resistance}Ω
                </text>
                <text
                  x="0"
                  y="8"
                  fill="#CBD5E1"
                  fontSize="9"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  RESISTOR
                </text>
              </g>

              {/* Incandescent Lamp / Filament (Bottom Branch) */}
              <g transform="translate(200, 250)">
                {/* Glow Halo */}
                {switchClosed && !fuseBlown && (
                  <circle
                    cx="0"
                    cy="0"
                    r={20 + lampIntensity * 30}
                    fill={`rgba(255, 214, 10, ${lampIntensity * 0.45})`}
                    className="transition-all duration-300"
                  />
                )}
                <circle
                  cx="0"
                  cy="0"
                  r="22"
                  fill={switchClosed && !fuseBlown ? `rgba(255, 230, 0, ${0.2 + lampIntensity * 0.8})` : "#0F172A"}
                  stroke="#FFD60A"
                  strokeWidth="3"
                />
                {/* Filament */}
                <path
                  d="M -8 10 L -4 -6 L 0 6 L 4 -6 L 8 10"
                  fill="none"
                  stroke={switchClosed && !fuseBlown && current > 0 ? "#FFFFFF" : "#64748B"}
                  strokeWidth="2.5"
                />
                <text
                  x="0"
                  y="36"
                  fill="#FFD60A"
                  fontSize="9"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  {switchClosed && !fuseBlown ? `LÂMPADA (${power}W)` : "LÂMPADA APAGADA"}
                </text>
              </g>
            </svg>
          </div>

          <div className="text-[11px] text-slate-400 mt-2 text-center font-medium">
            💡 Dica: Toque na chave superior para abrir ou fechar o circuito.
          </div>
        </div>

        {/* Right: Controls & Digital Telemetry Gauges */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* Digital Telemetry Panel */}
          <div className="bg-[#030712] border-2 border-slate-600 rounded-2xl p-4 shadow-inner">
            <span className="text-[10px] font-black uppercase tracking-wider text-cyan-300 mb-3 block">
              INSTRUMENTAÇÃO & MEDIÇÃO EM TEMPO REAL
            </span>
            <div className="grid grid-cols-2 gap-3">
              {/* Voltmeter */}
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-700">
                <span className="text-[10px] uppercase font-bold text-sky-400 block">
                  Voltímetro (V)
                </span>
                <span className="text-2xl font-black font-mono text-white">
                  {switchClosed && !fuseBlown ? voltage.toFixed(1) : "0.0"} <span className="text-xs text-sky-400">V</span>
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">DDP aplicada</span>
              </div>

              {/* Ammeter */}
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-700">
                <span className="text-[10px] uppercase font-bold text-emerald-400 block">
                  Amperímetro (I)
                </span>
                <span className="text-2xl font-black font-mono text-white">
                  {current.toFixed(2)} <span className="text-xs text-emerald-400">A</span>
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Fluxo de elétrons</span>
              </div>

              {/* Ohmmeter */}
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-700">
                <span className="text-[10px] uppercase font-bold text-amber-400 block">
                  Resistência (R)
                </span>
                <span className="text-2xl font-black font-mono text-white">
                  {resistance.toFixed(1)} <span className="text-xs text-amber-400">Ω</span>
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Oposição ôhmica</span>
              </div>

              {/* Wattmeter */}
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-700">
                <span className="text-[10px] uppercase font-bold text-purple-400 block">
                  Potência (P)
                </span>
                <span className="text-2xl font-black font-mono text-white">
                  {power.toFixed(1)} <span className="text-xs text-purple-400">W</span>
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Joule / segundo</span>
              </div>
            </div>
          </div>

          {/* Interactive Sliders */}
          <div className="bg-[#030712] border-2 border-slate-600 rounded-2xl p-4 flex flex-col gap-4 shadow-inner">
            {/* Voltage Slider */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-slate-200">
                  Tensão da Fonte (V)
                </label>
                <span className="font-mono text-xs font-black text-sky-400">
                  {voltage} V
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="24"
                step="1"
                value={voltage}
                onChange={(e) => setVoltage(Number(e.target.value))}
                className="w-full accent-sky-400 cursor-pointer h-2 bg-slate-800 rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                <span>0V</span>
                <span>12V (Padrão)</span>
                <span>24V (Máx)</span>
              </div>
            </div>

            {/* Resistance Slider */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-slate-200">
                  Resistência do Circuito (R)
                </label>
                <span className="font-mono text-xs font-black text-amber-400">
                  {resistance} Ω
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="30"
                step="1"
                value={resistance}
                onChange={(e) => setResistance(Number(e.target.value))}
                className="w-full accent-amber-400 cursor-pointer h-2 bg-slate-800 rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                <span>1Ω (Alta Corrente)</span>
                <span>15Ω</span>
                <span>30Ω (Baixa Corrente)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pedagogical Scaffolding Challenge Section (Escadinha Cognitiva ENEM) */}
      <div className="bg-[#030712] border-2 border-cyan-500/50 rounded-2xl p-4 sm:p-5 flex flex-col gap-4 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <Award className="text-amber-400" size={18} />
            <span className="text-xs sm:text-sm font-black text-white">
              Desafio ENEM com Escadinha Cognitiva ({activeStep + 1}/3)
            </span>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-400/20 text-cyan-300 border border-cyan-400/40">
            Recompensa: +150 XP • Medalha de Eletrodinâmica
          </span>
        </div>

        {!challengeCompleted ? (
          <div className="flex flex-col gap-3">
            <span className="text-[11px] font-black uppercase tracking-wider text-cyan-400">
              {SCAFFOLDING_QUESTIONS[activeStep].level}
            </span>
            <p className="text-xs sm:text-sm font-medium text-slate-200 leading-relaxed">
              {SCAFFOLDING_QUESTIONS[activeStep].question}
            </p>

            {/* Multiple Choice Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
              {SCAFFOLDING_QUESTIONS[activeStep].options.map((option, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedAnswer(idx)}
                  className={`p-3 rounded-xl text-xs font-semibold text-left transition border-2 flex items-center gap-2.5 ${
                    selectedAnswer === idx
                      ? "bg-cyan-500/20 border-cyan-400 text-white shadow-[0_0_12px_rgba(6,182,212,0.3)]"
                      : "bg-slate-900/90 border-slate-700 text-slate-300 hover:border-slate-500 hover:text-white"
                  }`}
                >
                  <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center font-mono text-[10px] shrink-0">
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span>{option}</span>
                </button>
              ))}
            </div>

            {/* Feedback & Submission Button */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              {feedback && (
                <div
                  className={`text-xs font-bold ${
                    feedback.startsWith("✓") ? "text-emerald-400" : "text-amber-400"
                  }`}
                >
                  {feedback}
                </div>
              )}
              <button
                type="button"
                disabled={selectedAnswer === null}
                onClick={handleVerifyStep}
                className="ml-auto px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-black font-extrabold text-xs transition shadow-lg shadow-cyan-500/20"
              >
                Verificar Resposta
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="text-emerald-400 w-8 h-8 shrink-0" />
              <div>
                <h4 className="text-sm font-black text-white">
                  Bancada Concluída com Sucesso!
                </h4>
                <p className="text-xs text-emerald-200">
                  Os dados do experimento foram validados e creditados no seu perfil escolar (+150 XP).
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setChallengeCompleted(false);
                setActiveStep(0);
                setSelectedAnswer(null);
                setFeedback(null);
              }}
              className="px-3.5 py-2 rounded-xl bg-emerald-500 text-black font-bold text-xs hover:bg-emerald-400 transition"
            >
              Refazer Desafio
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
