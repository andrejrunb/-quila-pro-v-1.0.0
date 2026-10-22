import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  RotateCcw,
  Zap,
  Sparkles,
  Compass,
  Eye,
  Award,
  Lightbulb,
  CheckCircle2,
  Volume2,
  VolumeX,
  Sliders,
  Dna,
  Atom,
  Flame,
  Magnet,
  Gauge,
  Info
} from 'lucide-react';
import './ScienceSimulators.css';

export type SimulatorType = 'optics' | 'ballistics' | 'circuits' | 'genetics' | 'periodic_table' | 'thermodynamics' | 'electromagnetism';

interface ScienceSimulatorsProps {
  initialSimulator?: SimulatorType;
  onRewardXp?: (amount: number, reason: string) => void;
}

export const ScienceSimulators: React.FC<ScienceSimulatorsProps> = ({
  initialSimulator = 'optics',
  onRewardXp
}) => {
  const [activeSim, setActiveSim] = useState<SimulatorType>(initialSimulator);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [completedSims, setCompletedSims] = useState<Record<string, boolean>>({});

  // -------------------------------------------------------------
  // SIMULADOR 1: ÓPTICA GEOMÉTRICA (NEWTON & GALILEU)
  // -------------------------------------------------------------
  const [focalLength, setFocalLength] = useState<number>(50); // mm (+ convergente, - divergente)
  const [objectDist, setObjectDist] = useState<number>(110); // mm (p)
  const [objectHeight, setObjectHeight] = useState<number>(35); // mm (h)
  const [refractiveIndex, setRefractiveIndex] = useState<number>(1.5); // Vidro
  const opticsCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Cálculos de Gauss: 1/f = 1/p + 1/p' => p' = (f * p) / (p - f)
  const imageDist = (focalLength * objectDist) / (objectDist - focalLength);
  const magnification = -imageDist / objectDist;
  const imageHeight = magnification * objectHeight;
  const isReal = imageDist > 0;
  const isUpright = magnification > 0;
  const isMagnified = Math.abs(magnification) > 1.05;

  useEffect(() => {
    if (activeSim !== 'optics') return;
    const canvas = opticsCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const scale = 1.3;

    ctx.clearRect(0, 0, w, h);

    // Grid e Eixo Óptico
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 30) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 30) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Eixo principal
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(10, cy);
    ctx.lineTo(w - 10, cy);
    ctx.stroke();

    // Lente (convergente ou divergente)
    ctx.strokeStyle = '#00F0FF';
    ctx.fillStyle = 'rgba(0, 240, 255, 0.15)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx, cy - 85);
    ctx.lineTo(cx, cy + 85);
    ctx.stroke();

    // Setas nos extremos da lente (convergente vs divergente)
    if (focalLength > 0) {
      // Setas para fora (convergente)
      ctx.beginPath();
      ctx.moveTo(cx - 10, cy - 75);
      ctx.lineTo(cx, cy - 85);
      ctx.lineTo(cx + 10, cy - 75);
      ctx.moveTo(cx - 10, cy + 75);
      ctx.lineTo(cx, cy + 85);
      ctx.lineTo(cx + 10, cy + 75);
      ctx.stroke();
    } else {
      // Setas para dentro (divergente)
      ctx.beginPath();
      ctx.moveTo(cx - 10, cy - 85);
      ctx.lineTo(cx, cy - 75);
      ctx.lineTo(cx + 10, cy - 85);
      ctx.moveTo(cx - 10, cy + 85);
      ctx.lineTo(cx, cy + 75);
      ctx.lineTo(cx + 10, cy + 85);
      ctx.stroke();
    }

    // Focos F1 e F2
    const fPixel = focalLength * scale;
    const f1X = cx - fPixel;
    const f2X = cx + fPixel;

    ctx.fillStyle = '#F59E0B';
    ctx.beginPath();
    ctx.arc(f1X, cy, 4, 0, Math.PI * 2);
    ctx.arc(f2X, cy, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#F59E0B';
    ctx.font = '11px JetBrains Mono, monospace';
    ctx.fillText('F₁', f1X - 7, cy + 18);
    ctx.fillText('F₂', f2X - 7, cy + 18);
    ctx.fillText('O', cx - 12, cy + 18);

    // Objeto (Seta à esquerda)
    const objX = cx - objectDist * scale;
    const objY = cy - objectHeight * scale;

    ctx.strokeStyle = '#10B981';
    ctx.fillStyle = '#10B981';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(objX, cy);
    ctx.lineTo(objX, objY);
    ctx.stroke();

    // Cabeça da seta do objeto
    ctx.beginPath();
    ctx.moveTo(objX - 6, objY + 8);
    ctx.lineTo(objX, objY);
    ctx.lineTo(objX + 6, objY + 8);
    ctx.stroke();

    ctx.font = '11px sans-serif';
    ctx.fillText('Objeto', objX - 18, cy + 16);

    // Imagem (Seta)
    const imgX = cx + imageDist * scale;
    const imgY = cy - imageHeight * scale;

    if (Math.abs(imageDist) < 800) {
      ctx.strokeStyle = isReal ? '#8B5CF6' : '#EC4899';
      ctx.fillStyle = isReal ? '#8B5CF6' : '#EC4899';
      ctx.lineWidth = 3;
      if (!isReal) ctx.setLineDash([4, 4]);

      ctx.beginPath();
      ctx.moveTo(imgX, cy);
      ctx.lineTo(imgX, imgY);
      ctx.stroke();

      ctx.setLineDash([]);
      // Cabeça da seta da imagem
      const dir = imageHeight > 0 ? 1 : -1;
      ctx.beginPath();
      ctx.moveTo(imgX - 6, imgY + 8 * dir);
      ctx.lineTo(imgX, imgY);
      ctx.lineTo(imgX + 6, imgY + 8 * dir);
      ctx.stroke();

      ctx.fillText(isReal ? 'Imagem Real' : 'Imagem Virtual', imgX - 30, cy + 16);
    }

    // Raios Notáveis
    // Raio 1: Paralelo ao eixo que refrata passando pelo foco
    ctx.strokeStyle = 'rgba(255, 235, 59, 0.85)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(objX, objY);
    ctx.lineTo(cx, objY);
    if (focalLength > 0) {
      ctx.lineTo(cx + 250, objY + ((cx + 250 - cx) * (cy - objY)) / fPixel);
    } else {
      ctx.lineTo(cx + 250, objY - ((cx + 250 - cx) * (cy - objY)) / Math.abs(fPixel));
    }
    ctx.stroke();

    // Raio 2: Passa pelo centro óptico sem desvio
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.85)';
    ctx.beginPath();
    ctx.moveTo(objX, objY);
    ctx.lineTo(cx + 250, cy - ((cx + 250 - cx) / (cx - objX)) * (cy - objY));
    ctx.stroke();
  }, [activeSim, focalLength, objectDist, objectHeight, refractiveIndex, imageDist, imageHeight]);

  // -------------------------------------------------------------
  // SIMULADOR 2: BALÍSTICA & GRAVIDADE (GALILEU & NEWTON)
  // -------------------------------------------------------------
  const [angleDeg, setAngleDeg] = useState<number>(45);
  const [initialVel, setInitialVel] = useState<number>(28); // m/s
  const [gravityPreset, setGravityPreset] = useState<'terra' | 'lua' | 'marte' | 'jupiter'>('terra');
  const [isFiring, setIsFiring] = useState<boolean>(false);
  const [ballisticsPoints, setBallisticsPoints] = useState<Array<{ x: number; y: number }>>([]);
  const ballisticsCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const GRAVITIES: Record<string, { g: number; label: string; icon: string }> = {
    terra: { g: 9.8, label: 'Terra (g = 9.8 m/s²)', icon: '🌍' },
    lua: { g: 1.62, label: 'Lua (g = 1.62 m/s²)', icon: '🌑' },
    marte: { g: 3.71, label: 'Marte (g = 3.71 m/s²)', icon: '🔴' },
    jupiter: { g: 24.79, label: 'Júpiter (g = 24.8 m/s²)', icon: '🪐' }
  };

  const g = GRAVITIES[gravityPreset].g;
  const angleRad = (angleDeg * Math.PI) / 180;
  const v0x = initialVel * Math.cos(angleRad);
  const v0y = initialVel * Math.sin(angleRad);
  const timeOfFlight = (2 * v0y) / g;
  const maxHeight = (v0y * v0y) / (2 * g);
  const maxRange = (initialVel * initialVel * Math.sin(2 * angleRad)) / g;

  const handleFireCannon = () => {
    if (isFiring) return;
    setIsFiring(true);
    const steps = 60;
    const dt = timeOfFlight / steps;
    const pts: Array<{ x: number; y: number }> = [];

    let currentStep = 0;
    const timer = setInterval(() => {
      const t = currentStep * dt;
      const x = v0x * t;
      const y = v0y * t - 0.5 * g * t * t;
      pts.push({ x, y: Math.max(0, y) });
      setBallisticsPoints([...pts]);

      currentStep++;
      if (currentStep > steps || t >= timeOfFlight) {
        clearInterval(timer);
        setIsFiring(false);
        rewardSimulation('ballistics', 75, 'Lançamento balístico calibrado');
      }
    }, 22);
  };

  useEffect(() => {
    if (activeSim !== 'ballistics') return;
    const canvas = ballisticsCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Solo
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, h - 35, w, 35);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, h - 35);
    ctx.lineTo(w, h - 35);
    ctx.stroke();

    // Canhão na origem (40, h - 35)
    const originX = 50;
    const originY = h - 35;

    // Escala dinâmica
    const scaleX = (w - 100) / Math.max(80, maxRange * 1.15);
    const scaleY = (h - 80) / Math.max(30, maxHeight * 1.3);

    // Tubo do canhão
    const barrelLen = 28;
    const barrelX = originX + barrelLen * Math.cos(angleRad);
    const barrelY = originY - barrelLen * Math.sin(angleRad);

    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(originX, originY);
    ctx.lineTo(barrelX, barrelY);
    ctx.stroke();

    // Roda do canhão
    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.arc(originX, originY, 10, 0, Math.PI * 2);
    ctx.fill();

    // Curva teórica prevista (linha pontilhada cinza)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.setLineDash([3, 3]);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let t = 0; t <= timeOfFlight; t += timeOfFlight / 50) {
      const px = originX + v0x * t * scaleX;
      const py = originY - (v0y * t - 0.5 * g * t * t) * scaleY;
      if (t === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // Trajetória animada real (rastro ciano/âmbar)
    if (ballisticsPoints.length > 0) {
      ctx.strokeStyle = '#00F0FF';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ballisticsPoints.forEach((p, idx) => {
        const px = originX + p.x * scaleX;
        const py = originY - p.y * scaleY;
        if (idx === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.stroke();

      // Projétil atual
      const last = ballisticsPoints[ballisticsPoints.length - 1];
      const curX = originX + last.x * scaleX;
      const curY = originY - last.y * scaleY;

      ctx.fillStyle = '#F59E0B';
      ctx.shadowColor = '#F59E0B';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(curX, curY, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }, [activeSim, angleDeg, initialVel, gravityPreset, ballisticsPoints, maxRange, maxHeight, timeOfFlight]);

  // -------------------------------------------------------------
  // SIMULADOR 3: ELETRODINÂMICA & LEI DE OHM (MARIE CURIE & DA VINCI)
  // -------------------------------------------------------------
  const [voltage, setVoltage] = useState<number>(12); // V
  const [resistance, setResistance] = useState<number>(24); // Ohms
  const [circuitType, setCircuitType] = useState<'lamp' | 'resistor' | 'series' | 'parallel'>('lamp');
  const [switchClosed, setSwitchClosed] = useState<boolean>(true);

  // Cálculos de Ohm: I = V/R, P = V * I
  const effectiveResistance =
    circuitType === 'series'
      ? resistance + 20
      : circuitType === 'parallel'
      ? (resistance * 20) / (resistance + 20)
      : resistance;

  const currentAmps = switchClosed ? voltage / effectiveResistance : 0;
  const powerWatts = switchClosed ? voltage * currentAmps : 0;
  const bulbGlowPct = Math.min(100, Math.round((powerWatts / 60) * 100));

  // -------------------------------------------------------------
  // SIMULADOR 4: GENÉTICA MENDELIANA (GREGOR MENDEL)
  // -------------------------------------------------------------
  const [parent1, setParent1] = useState<'AA' | 'Aa' | 'aa'>('Aa');
  const [parent2, setParent2] = useState<'AA' | 'Aa' | 'aa'>('Aa');
  const [traitType, setTraitType] = useState<'color' | 'texture'>('color');

  // Quadro de Punnett
  const allele1A = parent1[0];
  const allele1B = parent1[1];
  const allele2A = parent2[0];
  const allele2B = parent2[1];

  const offspringGenotypes = [
    [allele1A + allele2A, allele1B + allele2A],
    [allele1A + allele2B, allele1B + allele2B]
  ].map(row =>
    row.map(g => {
      // Normaliza para 'Aa' em vez de 'aA'
      return g === 'aA' ? 'Aa' : g;
    })
  );

  const flatGenotypes = offspringGenotypes.flat();
  const countAA = flatGenotypes.filter(g => g === 'AA').length;
  const countAa = flatGenotypes.filter(g => g === 'Aa').length;
  const countaa = flatGenotypes.filter(g => g === 'aa').length;

  const yellowPct = Math.round(((countAA + countAa) / 4) * 100);
  const greenPct = Math.round((countaa / 4) * 100);

  // -------------------------------------------------------------
  // SIMULADOR 5: TABELA PERIÓDICA INTERATIVA (MARIE CURIE & LAVOISIER)
  // -------------------------------------------------------------
  const PERIODIC_ELEMENTS = [
    { z: 1, sym: 'H', name: 'Hidrogênio', mass: 1.008, group: 'Não-metal', config: '1s¹', radius: '37 pm', note: 'Nomeado por Antoine Lavoisier ("gerador de água"). Mais abundante no universo.' },
    { z: 2, sym: 'He', name: 'Hélio', mass: 4.002, group: 'Gás Nobre', config: '1s²', radius: '32 pm', note: 'Detectado no espectro solar antes de ser isolado na Terra. Não reage facilmente.' },
    { z: 3, sym: 'Li', name: 'Lítio', mass: 6.94, group: 'Alcalino', config: '[He] 2s¹', radius: '152 pm', note: 'Metal mais leve. Base das baterias recarregáveis modernas de alta densidade.' },
    { z: 6, sym: 'C', name: 'Carbono', mass: 12.011, group: 'Não-metal', config: '[He] 2s² 2p²', radius: '77 pm', note: 'Espinha dorsal da química orgânica e da vida devido à sua capacidade de formar 4 ligações covalentes.' },
    { z: 7, sym: 'N', name: 'Nitrogênio', mass: 14.007, group: 'Não-metal', config: '[He] 2s² 2p³', radius: '75 pm', note: 'Compõe 78% da atmosfera terrestre. Essencial em proteínas e ácidos nucleicos.' },
    { z: 8, sym: 'O', name: 'Oxigênio', mass: 15.999, group: 'Calcogênio', config: '[He] 2s² 2p⁴', radius: '73 pm', note: 'Descoberto por Priestley e explicado por Lavoisier como agente fundamental da combustão e respiração.' },
    { z: 11, sym: 'Na', name: 'Sódio', mass: 22.99, group: 'Alcalino', config: '[Ne] 3s¹', radius: '186 pm', note: 'Metal alcalino reativo que reage vigorosamente com água liberando hidrogênio e calor.' },
    { z: 12, sym: 'Mg', name: 'Magnésio', mass: 24.305, group: 'Alcalinoterroso', config: '[Ne] 3s²', radius: '160 pm', note: 'Centro coordenador da molécula de clorofila na fotossíntese dos vegetais.' },
    { z: 17, sym: 'Cl', name: 'Cloro', mass: 35.45, group: 'Halogênio', config: '[Ne] 3s² 3p⁵', radius: '99 pm', note: 'Halogênio oxidante potente com alta afinidade eletrônica, formando cloreto de sódio (sal de cozinha).' },
    { z: 26, sym: 'Fe', name: 'Ferro', mass: 55.845, group: 'Transição', config: '[Ar] 3d⁶ 4s²', radius: '126 pm', note: 'Núcleo com maior estabilidade nuclear por núcleon no cosmos. Centro da hemoglobina sanguínea.' },
    { z: 29, sym: 'Cu', name: 'Cobre', mass: 63.546, group: 'Transição', config: '[Ar] 3d¹⁰ 4s¹', radius: '128 pm', note: 'Excelente condutor térmico e elétrico utilizado na fiação de todas as redes elétricas.' },
    { z: 88, sym: 'Ra', name: 'Rádio', mass: 226, group: 'Alcalinoterroso', config: '[Rn] 7s²', radius: '220 pm', note: 'Isolado por Marie e Pierre Curie em 1898. Milhões de vezes mais radioativo que o urânio!' },
    { z: 92, sym: 'U', name: 'Urânio', mass: 238.029, group: 'Actinídeo', config: '[Rn] 5f³ 6d¹ 7s²', radius: '156 pm', note: 'Combustível da fissão nuclear nas usinas energéticas e elemento-chave estudado por Henri Becquerel.' }
  ];

  const [selectedElement, setSelectedElement] = useState(PERIODIC_ELEMENTS[11]); // Rádio por padrão

  // -------------------------------------------------------------
  // SIMULADOR 6: TERMODINÂMICA DOS GASES & CARNOT (SADI CARNOT & CLAPEYRON)
  // -------------------------------------------------------------
  const [gasVolume, setGasVolume] = useState<number>(4.0); // Litros (1.0 a 10.0 L)
  const [gasTemp, setGasTemp] = useState<number>(300); // Kelvin (150 a 700 K)
  const [gasMoles, setGasMoles] = useState<number>(2.0); // Mols (0.5 a 4.0 mol)
  const [carnotThot, setCarnotThot] = useState<number>(600); // K
  const [carnotTcold, setCarnotTcold] = useState<number>(300); // K
  const [isThermoRunning, setIsThermoRunning] = useState<boolean>(true);
  const thermoCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const gasParticlesRef = useRef<Array<{ x: number; y: number; vx: number; vy: number; radius: number }>>([]);

  const R_CONST = 0.08206; // atm·L / (mol·K)
  const gasPressure = (gasMoles * R_CONST * gasTemp) / gasVolume; // atm
  const gasPressureKPa = gasPressure * 101.325; // kPa
  const carnotEfficiency = Math.max(0, Math.min(100, Math.round((1 - carnotTcold / Math.max(carnotThot, carnotTcold + 1)) * 100)));
  const internalEnergyJ = Math.round((3 / 2) * gasMoles * 8.314 * gasTemp);

  useEffect(() => {
    if (activeSim !== 'thermodynamics') return;
    const canvas = thermoCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (gasParticlesRef.current.length === 0) {
      const particles = [];
      for (let i = 0; i < 40; i++) {
        particles.push({
          x: 70 + Math.random() * 200,
          y: 80 + Math.random() * 150,
          vx: (Math.random() - 0.5) * 3.5,
          vy: (Math.random() - 0.5) * 3.5,
          radius: 3.5
        });
      }
      gasParticlesRef.current = particles;
    }

    let animationId: number;

    const render = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const cylX = 45;
      const cylY = 25;
      const cylW = 250;
      const cylH = 215;

      const minPistonY = cylY + 25; // 10 L
      const maxPistonY = cylY + cylH - 45; // 1 L
      const pistonY = maxPistonY - ((gasVolume - 1.0) / 9.0) * (maxPistonY - minPistonY);
      const speedFactor = Math.sqrt(gasTemp / 300) * 1.8;

      // Cilindro
      ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
      ctx.fillRect(cylX, cylY, cylW, cylH);
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(cylX, cylY);
      ctx.lineTo(cylX, cylY + cylH);
      ctx.lineTo(cylX + cylW, cylY + cylH);
      ctx.lineTo(cylX + cylW, cylY);
      ctx.stroke();

      // Graduações
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 1;
      ctx.font = '9px monospace';
      ctx.fillStyle = '#64748b';
      for (let v = 1; v <= 10; v += 2) {
        const yMark = maxPistonY - ((v - 1.0) / 9.0) * (maxPistonY - minPistonY);
        ctx.beginPath();
        ctx.moveTo(cylX + cylW - 12, yMark);
        ctx.lineTo(cylX + cylW, yMark);
        ctx.stroke();
        ctx.fillText(`${v}L`, cylX + cylW + 4, yMark + 3);
      }

      // Efeito térmico na base
      if (gasTemp >= 380) {
        const intensity = Math.min(1, (gasTemp - 380) / 300);
        ctx.fillStyle = `rgba(239, 68, 68, ${0.4 * intensity})`;
        ctx.fillRect(cylX + 10, cylY + cylH - 6, cylW - 20, 16);
        ctx.fillStyle = '#EF4444';
        ctx.font = '10px sans-serif';
        ctx.fillText(`🔥 Fonte Quente (${gasTemp} K)`, cylX + 65, cylY + cylH + 18);
      } else if (gasTemp <= 240) {
        ctx.fillStyle = 'rgba(56, 189, 248, 0.35)';
        ctx.fillRect(cylX + 10, cylY + cylH - 6, cylW - 20, 16);
        ctx.fillStyle = '#38BDF8';
        ctx.font = '10px sans-serif';
        ctx.fillText(`❄️ Fonte Fria (${gasTemp} K)`, cylX + 75, cylY + cylH + 18);
      }

      // Partículas do gás
      const particles = gasParticlesRef.current;
      particles.forEach(p => {
        if (isThermoRunning) {
          p.x += p.vx * speedFactor;
          p.y += p.vy * speedFactor;

          if (p.x - p.radius <= cylX + 4) {
            p.x = cylX + 4 + p.radius;
            p.vx = Math.abs(p.vx);
          } else if (p.x + p.radius >= cylX + cylW - 4) {
            p.x = cylX + cylW - 4 - p.radius;
            p.vx = -Math.abs(p.vx);
          }

          if (p.y + p.radius >= cylY + cylH - 4) {
            p.y = cylY + cylH - 4 - p.radius;
            p.vy = -Math.abs(p.vy);
          }

          if (p.y - p.radius <= pistonY + 12) {
            p.y = pistonY + 12 + p.radius;
            p.vy = Math.abs(p.vy);
          }
        }

        const pColor = gasTemp > 450 ? '#F97316' : gasTemp < 240 ? '#38BDF8' : '#00F0FF';
        ctx.fillStyle = pColor;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      // Cabeça do Pistão
      ctx.fillStyle = '#334155';
      ctx.strokeStyle = '#00F0FF';
      ctx.lineWidth = 2;
      ctx.fillRect(cylX + 2, pistonY, cylW - 4, 14);
      ctx.strokeRect(cylX + 2, pistonY, cylW - 4, 14);

      // Haste do Pistão
      ctx.fillStyle = '#64748b';
      ctx.fillRect(cylX + cylW / 2 - 8, 8, 16, pistonY - 8);

      // ---------------------------------------------------------
      // LADO DIREITO: DIAGRAMA P x V & RENDIMENTO CARNOT
      // ---------------------------------------------------------
      const plotX = 345;
      const plotY = 25;
      const plotW = 270;
      const plotH = 175;

      ctx.fillStyle = 'rgba(2, 6, 23, 0.7)';
      ctx.fillRect(plotX, plotY, plotW, plotH);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.lineWidth = 1;
      ctx.strokeRect(plotX, plotY, plotW, plotH);

      // Eixos
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(plotX + 30, plotY + 10);
      ctx.lineTo(plotX + 30, plotY + plotH - 22);
      ctx.lineTo(plotX + plotW - 10, plotY + plotH - 22);
      ctx.stroke();

      ctx.fillStyle = '#94a3b8';
      ctx.font = '9px sans-serif';
      ctx.fillText('P (atm)', plotX + 15, plotY + 8);
      ctx.fillText('V (L)', plotX + plotW - 25, plotY + plotH - 8);

      // Curva Isoterma
      ctx.strokeStyle = '#00F0FF';
      ctx.lineWidth = 2;
      ctx.beginPath();
      const pScale = (plotH - 45) / 18;
      const vScale = (plotW - 50) / 10;

      for (let v = 1; v <= 10; v += 0.2) {
        const pCalc = (gasMoles * R_CONST * gasTemp) / v;
        const gx = plotX + 30 + v * vScale;
        const gy = plotY + plotH - 22 - Math.min(18, pCalc) * pScale;
        if (v === 1) ctx.moveTo(gx, gy);
        else ctx.lineTo(gx, gy);
      }
      ctx.stroke();

      // Ponto (V, P)
      const curPlotX = plotX + 30 + gasVolume * vScale;
      const curPlotY = plotY + plotH - 22 - Math.min(18, gasPressure) * pScale;

      ctx.fillStyle = '#F59E0B';
      ctx.beginPath();
      ctx.arc(curPlotX, curPlotY, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.font = '10px monospace';
      ctx.fillStyle = '#F59E0B';
      ctx.fillText(`(${gasVolume.toFixed(1)}L, ${gasPressure.toFixed(1)} atm)`, curPlotX + 6, curPlotY - 5);

      // Barra de Rendimento de Carnot
      ctx.fillStyle = 'rgba(139, 92, 246, 0.18)';
      ctx.strokeStyle = '#8B5CF6';
      ctx.lineWidth = 1;
      ctx.strokeRect(plotX, plotY + plotH - 10, plotW, 36);
      ctx.fillRect(plotX, plotY + plotH - 10, plotW, 36);

      ctx.fillStyle = '#A78BFA';
      ctx.font = '10px sans-serif';
      ctx.fillText(`Rendimento Máx. Carnot (η = 1 - Tf/Tq):`, plotX + 8, plotY + plotH + 5);
      ctx.fillStyle = '#10B981';
      ctx.font = 'bold 12px monospace';
      ctx.fillText(`${carnotEfficiency}%`, plotX + plotW - 44, plotY + plotH + 7);

      if (isThermoRunning) {
        animationId = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, [activeSim, gasVolume, gasTemp, gasMoles, carnotThot, carnotTcold, isThermoRunning, gasPressure, carnotEfficiency]);

  // -------------------------------------------------------------
  // SIMULADOR 7: INDUÇÃO ELETROMAGNÉTICA & LEI DE FARADAY-LENZ
  // -------------------------------------------------------------
  const [coilTurns, setCoilTurns] = useState<number>(25); // 5 a 50 espiras
  const [magnetStrength, setMagnetStrength] = useState<number>(1.2); // T (0.2 a 2.5)
  const [magnetPos, setMagnetPos] = useState<number>(-120); // X (-170 a 170)
  const [isAutoOscillating, setIsAutoOscillating] = useState<boolean>(false);
  const [oscillationSpeed, setOscillationSpeed] = useState<number>(1.2); // Hz
  const [reversePoles, setReversePoles] = useState<boolean>(false);
  const emCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const lastPosRef = useRef<number>(-120);
  const lastTimeRef = useRef<number>(Date.now());
  const inducedEmfRef = useRef<number>(0);
  const [displayEmf, setDisplayEmf] = useState<number>(0);

  useEffect(() => {
    if (activeSim !== 'electromagnetism') return;
    const canvas = emCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    const startTime = Date.now();

    const render = () => {
      const now = Date.now();
      const dt = Math.max(0.001, (now - lastTimeRef.current) / 1000);
      lastTimeRef.current = now;

      let currentX = magnetPos;
      if (isAutoOscillating) {
        const elapsed = (now - startTime) / 1000;
        currentX = Math.sin(elapsed * oscillationSpeed * Math.PI * 2) * 140;
        setMagnetPos(currentX);
      }

      const dx = currentX - lastPosRef.current;
      const v = dx / dt;
      lastPosRef.current = currentX;

      const sigma = 55;
      const poleMultiplier = reversePoles ? -1 : 1;
      const phi = magnetStrength * Math.exp(-Math.pow(currentX / sigma, 2)) * poleMultiplier;
      const dPhiDx = -2 * (currentX / (sigma * sigma)) * phi;
      const rawEmf = -coilTurns * dPhiDx * (v / 80);
      const clampedEmf = Math.max(-12, Math.min(12, rawEmf));
      inducedEmfRef.current = clampedEmf;
      setDisplayEmf(Number(clampedEmf.toFixed(2)));

      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const cx = w / 2;
      const cy = h / 2 - 20;

      // Fiação do circuito
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cx - 70, cy - 40);
      ctx.lineTo(cx - 160, cy - 40);
      ctx.lineTo(cx - 160, cy + 85);
      ctx.lineTo(cx - 50, cy + 85);

      ctx.moveTo(cx + 50, cy + 85);
      ctx.lineTo(cx + 160, cy + 85);
      ctx.lineTo(cx + 160, cy - 40);
      ctx.lineTo(cx + 70, cy - 40);
      ctx.stroke();

      // Linhas de Campo Magnético
      const magnetScreenX = cx + currentX;
      const magnetY = cy;
      const magnetW = 100;
      const magnetH = 34;

      ctx.strokeStyle = 'rgba(0, 240, 255, 0.15)';
      ctx.lineWidth = 1.5;
      for (let offset = -40; offset <= 40; offset += 20) {
        if (offset === 0) continue;
        ctx.beginPath();
        ctx.ellipse(magnetScreenX, magnetY, Math.abs(offset) * 1.8, Math.abs(offset) * 1.1, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Ímã de Barra
      const poleLeft = reversePoles ? 'S' : 'N';
      const poleRight = reversePoles ? 'N' : 'S';
      const colLeft = reversePoles ? '#3B82F6' : '#EF4444';
      const colRight = reversePoles ? '#EF4444' : '#3B82F6';

      ctx.fillStyle = colLeft;
      ctx.fillRect(magnetScreenX - magnetW / 2, magnetY - magnetH / 2, magnetW / 2, magnetH);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText(poleLeft, magnetScreenX - magnetW / 2 + 18, magnetY + 5);

      ctx.fillStyle = colRight;
      ctx.fillRect(magnetScreenX, magnetY - magnetH / 2, magnetW / 2, magnetH);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(poleRight, magnetScreenX + 24, magnetY + 5);

      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(magnetScreenX - magnetW / 2, magnetY - magnetH / 2, magnetW, magnetH);

      // Bobina (Espiras em perspectiva 3D)
      const numLoops = Math.min(16, Math.max(4, Math.round(coilTurns / 3)));
      const loopSpacing = 110 / numLoops;
      const coilStartX = cx - 55;

      for (let i = 0; i < numLoops; i++) {
        const lx = coilStartX + i * loopSpacing;
        ctx.strokeStyle = '#F59E0B';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.ellipse(lx, cy, 7, 36, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      // LÂMPADA INDICADORA
      const lampGlow = Math.min(1, Math.abs(clampedEmf) / 6);
      if (lampGlow > 0.05) {
        const rad = 25 * lampGlow;
        const grad = ctx.createRadialGradient(cx, cy + 85, 2, cx, cy + 85, rad);
        grad.addColorStop(0, 'rgba(255, 235, 59, 0.9)');
        grad.addColorStop(0.5, 'rgba(245, 158, 11, 0.4)');
        grad.addColorStop(1, 'rgba(245, 158, 11, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy + 85, rad, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = lampGlow > 0.1 ? '#FEF08A' : '#334155';
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy + 85, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.strokeStyle = lampGlow > 0.1 ? '#EF4444' : '#64748b';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cx - 4, cy + 91);
      ctx.lineTo(cx - 3, cy + 81);
      ctx.lineTo(cx + 3, cy + 81);
      ctx.lineTo(cx + 4, cy + 91);
      ctx.stroke();

      // GALVANÔMETRO DE ZERO CENTRAL
      const galvX = w - 85;
      const galvY = 65;
      const galvR = 48;

      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(galvX, galvY, galvR, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 1;
      for (let a = -50; a <= 50; a += 25) {
        const rad = ((a - 90) * Math.PI) / 180;
        const x1 = galvX + Math.cos(rad) * (galvR - 8);
        const y1 = galvY + Math.sin(rad) * (galvR - 8);
        const x2 = galvX + Math.cos(rad) * galvR;
        const y2 = galvY + Math.sin(rad) * galvR;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }

      ctx.fillStyle = '#94a3b8';
      ctx.font = '8px monospace';
      ctx.fillText('-10V', galvX - 38, galvY - 14);
      ctx.fillText('0', galvX - 3, galvY - 35);
      ctx.fillText('+10V', galvX + 16, galvY - 14);
      ctx.fillText('GALVANÔMETRO', galvX - 34, galvY + 30);

      const defAngle = (clampedEmf / 12) * 50;
      const ptrRad = ((defAngle - 90) * Math.PI) / 180;
      const ptrX = galvX + Math.cos(ptrRad) * (galvR - 12);
      const ptrY = galvY + Math.sin(ptrRad) * (galvR - 12);

      ctx.strokeStyle = '#EF4444';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(galvX, galvY);
      ctx.lineTo(ptrX, ptrY);
      ctx.stroke();

      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.arc(galvX, galvY, 4, 0, Math.PI * 2);
      ctx.fill();

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, [activeSim, coilTurns, magnetStrength, magnetPos, isAutoOscillating, oscillationSpeed, reversePoles]);

  // Síntese de Voz Soberana (Web Speech API)
  const speakText = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    if (isSpeaking) {
      setIsSpeaking(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pt-BR';
    utterance.rate = 1.05;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const rewardSimulation = (simId: string, xp: number, label: string) => {
    if (!completedSims[simId]) {
      setCompletedSims(prev => ({ ...prev, [simId]: true }));
      onRewardXp?.(xp, label);
    }
  };

  return (
    <div className="science-simulators-shell">
      {/* Navegação entre os 5 Simuladores */}
      <nav className="sim-nav-bar">
        <button
          className={`sim-nav-btn ${activeSim === 'optics' ? 'active' : ''}`}
          onClick={() => { setActiveSim('optics'); window.speechSynthesis?.cancel(); setIsSpeaking(false); }}
        >
          <Eye size={15} />
          <span>Óptica & Lentes</span>
        </button>
        <button
          className={`sim-nav-btn ${activeSim === 'ballistics' ? 'active' : ''}`}
          onClick={() => { setActiveSim('ballistics'); window.speechSynthesis?.cancel(); setIsSpeaking(false); }}
        >
          <Compass size={15} />
          <span>Balística & Gravidade</span>
        </button>
        <button
          className={`sim-nav-btn ${activeSim === 'circuits' ? 'active' : ''}`}
          onClick={() => { setActiveSim('circuits'); window.speechSynthesis?.cancel(); setIsSpeaking(false); }}
        >
          <Zap size={15} />
          <span>Eletrodinâmica & Ohm</span>
        </button>
        <button
          className={`sim-nav-btn ${activeSim === 'genetics' ? 'active' : ''}`}
          onClick={() => { setActiveSim('genetics'); window.speechSynthesis?.cancel(); setIsSpeaking(false); }}
        >
          <Dna size={15} />
          <span>Genética de Mendel</span>
        </button>
        <button
          className={`sim-nav-btn ${activeSim === 'periodic_table' ? 'active' : ''}`}
          onClick={() => { setActiveSim('periodic_table'); window.speechSynthesis?.cancel(); setIsSpeaking(false); }}
        >
          <Atom size={15} />
          <span>Tabela Periódica</span>
        </button>
        <button
          className={`sim-nav-btn ${activeSim === 'thermodynamics' ? 'active' : ''}`}
          onClick={() => { setActiveSim('thermodynamics'); window.speechSynthesis?.cancel(); setIsSpeaking(false); }}
        >
          <Flame size={15} />
          <span>Termodinâmica & Carnot</span>
        </button>
        <button
          className={`sim-nav-btn ${activeSim === 'electromagnetism' ? 'active' : ''}`}
          onClick={() => { setActiveSim('electromagnetism'); window.speechSynthesis?.cancel(); setIsSpeaking(false); }}
        >
          <Magnet size={15} />
          <span>Indução Eletromagnética</span>
        </button>
      </nav>

      {/* ÁREA CENTRAL DO SIMULADOR SELECIONADO */}
      <div className="sim-body">
        {/* ========================================================= */}
        {/* SIMULADOR 1: ÓPTICA GEOMÉTRICA & FORMAÇÃO DE IMAGENS     */}
        {/* ========================================================= */}
        {activeSim === 'optics' && (
          <div className="sim-grid-two-col">
            <div className="sim-canvas-panel">
              <div className="sim-panel-header">
                <div>
                  <h3>🔭 Laboratório de Óptica Geométrica (Lentes de Gauss)</h3>
                  <span className="sim-mentor-pill">Mentor: Isaac Newton & Galileu Galilei</span>
                </div>
                <button
                  className="voice-btn"
                  onClick={() =>
                    speakText(
                      `Equação de Gauss: 1 sobre f é igual a 1 sobre p mais 1 sobre p linha. Com distância focal de ${focalLength} milímetros e objeto a ${objectDist} milímetros, a imagem projetada é ${
                        isReal ? 'real e invertida' : 'virtual e direita'
                      }, com ampliação de ${Math.abs(magnification).toFixed(2)} vezes.`
                    )
                  }
                  title="Ouvir explicação do mentor"
                >
                  {isSpeaking ? <VolumeX size={14} color="#F59E0B" /> : <Volume2 size={14} color="#00F0FF" />}
                  <span>{isSpeaking ? 'Pausar Voz' : 'Ouvir Mentor'}</span>
                </button>
              </div>

              <div className="canvas-wrapper">
                <canvas ref={opticsCanvasRef} width={640} height={260} className="sim-canvas" />
              </div>

              {/* Métricas Ópticas ao Vivo */}
              <div className="sim-kpi-row">
                <div className="sim-kpi-card">
                  <span className="sim-kpi-label">DISTÂNCIA DA IMAGEM (p')</span>
                  <span className="sim-kpi-val" style={{ color: isReal ? '#8B5CF6' : '#EC4899' }}>
                    {Math.abs(imageDist) > 500 ? '∞ (No Infinito)' : `${imageDist.toFixed(1)} mm`}
                  </span>
                  <span className="sim-kpi-sub">{isReal ? 'Lado Oposto (Real)' : 'Mesmo Lado (Virtual)'}</span>
                </div>
                <div className="sim-kpi-card">
                  <span className="sim-kpi-label">AMPLIAÇÃO (A = -p'/p)</span>
                  <span className="sim-kpi-val" style={{ color: '#00F0FF' }}>
                    {magnification.toFixed(2)}x
                  </span>
                  <span className="sim-kpi-sub">{isUpright ? 'Direita (A > 0)' : 'Invertida (A < 0)'}</span>
                </div>
                <div className="sim-kpi-card">
                  <span className="sim-kpi-label">NATUREZA DA IMAGEM</span>
                  <span className="sim-kpi-val" style={{ color: '#10B981' }}>
                    {isReal ? 'REAL' : 'VIRTUAL'}
                  </span>
                  <span className="sim-kpi-sub">{isMagnified ? 'Maior que objeto' : 'Menor que objeto'}</span>
                </div>
              </div>
            </div>

            {/* Controles Ópticos */}
            <div className="sim-controls-panel">
              <h4 className="controls-title"><Sliders size={14} /> Calibração Experimental</h4>

              <div className="control-group">
                <div className="control-label-row">
                  <span>Distância Focal (f)</span>
                  <strong>{focalLength} mm</strong>
                </div>
                <input
                  type="range"
                  min="20"
                  max="90"
                  value={focalLength}
                  onChange={e => setFocalLength(Number(e.target.value))}
                  className="sim-slider"
                />
                <span className="control-tip">Valores positivos indicam lente convergente biconvexa.</span>
              </div>

              <div className="control-group">
                <div className="control-label-row">
                  <span>Posição do Objeto (p)</span>
                  <strong>{objectDist} mm</strong>
                </div>
                <input
                  type="range"
                  min="25"
                  max="180"
                  value={objectDist}
                  onChange={e => setObjectDist(Number(e.target.value))}
                  className="sim-slider"
                />
                <span className="control-tip">
                  {objectDist < focalLength
                    ? '⚠️ Objeto entre o foco e a lente: efeito Lupa (Imagem Virtual e Direita)!'
                    : 'Objeto além do foco: formação de Imagem Real projetável em tela.'}
                </span>
              </div>

              <div className="control-group">
                <div className="control-label-row">
                  <span>Meio de Refração (n)</span>
                  <strong>n = {refractiveIndex.toFixed(2)}</strong>
                </div>
                <div className="button-chips-row">
                  {[
                    { label: 'Ar (1.0)', n: 1.0 },
                    { label: 'Água (1.33)', n: 1.33 },
                    { label: 'Vidro (1.50)', n: 1.5 },
                    { label: 'Diamante (2.42)', n: 2.42 }
                  ].map(m => (
                    <button
                      key={m.label}
                      className={`chip-btn ${refractiveIndex === m.n ? 'active' : ''}`}
                      onClick={() => setRefractiveIndex(m.n)}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dica Socrática de Isaac Newton */}
              <div className="sim-socratic-box">
                <div className="socratic-header">
                  <Lightbulb size={14} color="#F59E0B" />
                  <span>Insight Socrático de Isaac Newton</span>
                </div>
                <p>
                  "Quando a luz passa de um meio menos refringente para um mais refringente, o feixe desvia aproximando-se da normal. 
                  Nas câmeras e no cristalino do olho humano, a imagem projetada na retina é sempre <strong>real e invertida</strong>, 
                  sendo desvirada pelo córtex cerebral!"
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* SIMULADOR 2: BALÍSTICA & GRAVIDADE PLANETÁRIA             */}
        {/* ========================================================= */}
        {activeSim === 'ballistics' && (
          <div className="sim-grid-two-col">
            <div className="sim-canvas-panel">
              <div className="sim-panel-header">
                <div>
                  <h3>🎯 Trajetória Parabólica & Gravidade Universal</h3>
                  <span className="sim-mentor-pill">Mentor: Galileu Galilei & Isaac Newton</span>
                </div>
                <button
                  className="voice-btn"
                  onClick={() =>
                    speakText(
                      `No vácuo, a componente horizontal move-se em velocidade constante, enquanto a componente vertical desacelera sob aceleração da gravidade de ${g} metros por segundo ao quadrado. Alcance máximo projetado: ${maxRange.toFixed(
                        1
                      )} metros.`
                    )
                  }
                >
                  {isSpeaking ? <VolumeX size={14} color="#F59E0B" /> : <Volume2 size={14} color="#00F0FF" />}
                  <span>{isSpeaking ? 'Pausar' : 'Ouvir Galileu'}</span>
                </button>
              </div>

              <div className="canvas-wrapper">
                <canvas ref={ballisticsCanvasRef} width={640} height={260} className="sim-canvas" />
              </div>

              {/* Botão de Disparo */}
              <div className="sim-action-row">
                <button
                  className="sim-fire-btn"
                  onClick={handleFireCannon}
                  disabled={isFiring}
                >
                  <Play size={16} />
                  <span>{isFiring ? 'Projétil em Voo...' : 'Disparar Projétil (Simular Trajetória)'}</span>
                </button>
                <button
                  className="sim-reset-btn"
                  onClick={() => setBallisticsPoints([])}
                >
                  <RotateCcw size={14} />
                  <span>Limpar Rastros</span>
                </button>
              </div>

              <div className="sim-kpi-row">
                <div className="sim-kpi-card">
                  <span className="sim-kpi-label">ALCANCE MÁXIMO (X_max)</span>
                  <span className="sim-kpi-val" style={{ color: '#00F0FF' }}>{maxRange.toFixed(1)} m</span>
                  <span className="sim-kpi-sub">Máximo a 45º</span>
                </div>
                <div className="sim-kpi-card">
                  <span className="sim-kpi-label">ALTURA MÁXIMA (H_max)</span>
                  <span className="sim-kpi-val" style={{ color: '#10B981' }}>{maxHeight.toFixed(1)} m</span>
                  <span className="sim-kpi-sub">V_y = 0 no ápice</span>
                </div>
                <div className="sim-kpi-card">
                  <span className="sim-kpi-label">TEMPO TOTAL DE VOO</span>
                  <span className="sim-kpi-val" style={{ color: '#F59E0B' }}>{timeOfFlight.toFixed(2)} s</span>
                  <span className="sim-kpi-sub">T = 2·V0y / g</span>
                </div>
              </div>
            </div>

            {/* Controles de Lançamento */}
            <div className="sim-controls-panel">
              <h4 className="controls-title"><Sliders size={14} /> Parâmetros de Lançamento</h4>

              <div className="control-group">
                <div className="control-label-row">
                  <span>Ângulo de Disparo (θ)</span>
                  <strong>{angleDeg}º</strong>
                </div>
                <input
                  type="range"
                  min="10"
                  max="85"
                  value={angleDeg}
                  onChange={e => setAngleDeg(Number(e.target.value))}
                  className="sim-slider"
                />
              </div>

              <div className="control-group">
                <div className="control-label-row">
                  <span>Velocidade Inicial (v₀)</span>
                  <strong>{initialVel} m/s</strong>
                </div>
                <input
                  type="range"
                  min="10"
                  max="50"
                  value={initialVel}
                  onChange={e => setInitialVel(Number(e.target.value))}
                  className="sim-slider"
                />
              </div>

              <div className="control-group">
                <div className="control-label-row">
                  <span>Corpo Celeste (Campo Gravitacional g)</span>
                </div>
                <div className="button-chips-grid">
                  {Object.entries(GRAVITIES).map(([key, item]) => (
                    <button
                      key={key}
                      className={`chip-btn ${gravityPreset === key ? 'active' : ''}`}
                      onClick={() => setGravityPreset(key as any)}
                    >
                      <span>{item.icon}</span>
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="sim-socratic-box">
                <div className="socratic-header">
                  <Lightbulb size={14} color="#F59E0B" />
                  <span>Princípio de Galileu Galilei</span>
                </div>
                <p>
                  "O movimento composto é a união simultânea de dois movimentos independentes que não interferem um no outro. 
                  Na horizontal, não há força atuando (MRU com velocidade constante). Na vertical, a gravidade atua como acelerador constante (MRUV)!"
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* SIMULADOR 3: ELETRODINÂMICA & LEI DE OHM                 */}
        {/* ========================================================= */}
        {activeSim === 'circuits' && (
          <div className="sim-grid-two-col">
            <div className="sim-canvas-panel">
              <div className="sim-panel-header">
                <div>
                  <h3>⚡ Circuito Elétrico Fechado & Lei de Ohm</h3>
                  <span className="sim-mentor-pill">Mentor: Marie Curie & Nikola Tesla</span>
                </div>
                <button
                  className="voice-btn"
                  onClick={() =>
                    speakText(
                      `Pela Primeira Lei de Ohm, a corrente elétrica de ${currentAmps.toFixed(
                        2
                      )} Amperes é diretamente proporcional à tensão de ${voltage} Volts e inversamente proporcional à resistência de ${effectiveResistance.toFixed(
                        1
                      )} Ohms. A potência térmica dissipada por Efeito Joule é de ${powerWatts.toFixed(1)} Watts.`
                    )
                  }
                >
                  {isSpeaking ? <VolumeX size={14} color="#F59E0B" /> : <Volume2 size={14} color="#00F0FF" />}
                  <span>{isSpeaking ? 'Pausar' : 'Ouvir Marie Curie'}</span>
                </button>
              </div>

              {/* Renderização Visual do Circuito SVG */}
              <div className="circuit-visual-box">
                <svg viewBox="0 0 540 220" className="circuit-svg">
                  {/* Fio do circuito retangular */}
                  <rect
                    x="50"
                    y="35"
                    width="440"
                    height="150"
                    fill="none"
                    stroke={switchClosed ? '#00F0FF' : '#475569'}
                    strokeWidth="4"
                    rx="12"
                    strokeDasharray={switchClosed ? '8, 8' : 'none'}
                    className={switchClosed ? 'circuit-flowing' : ''}
                  />

                  {/* Bateria na esquerda */}
                  <g transform="translate(50, 110)">
                    <rect x="-24" y="-30" width="48" height="60" fill="#0f172a" stroke="#38bdf8" strokeWidth="2" rx="6" />
                    <text x="0" y="-8" fill="#38bdf8" fontSize="11" fontWeight="700" textAnchor="middle">+{voltage}V</text>
                    <text x="0" y="14" fill="#64748b" fontSize="10" textAnchor="middle">FONTE</text>
                  </g>

                  {/* Chave liga/desliga no topo */}
                  <g transform="translate(270, 35)" style={{ cursor: 'pointer' }} onClick={() => setSwitchClosed(v => !v)}>
                    <circle cx="0" cy="0" r="16" fill="#0f172a" stroke={switchClosed ? '#10B981' : '#EF4444'} strokeWidth="2" />
                    <text x="0" y="4" fill={switchClosed ? '#10B981' : '#EF4444'} fontSize="9" fontWeight="900" textAnchor="middle">
                      {switchClosed ? 'ON' : 'OFF'}
                    </text>
                  </g>

                  {/* Componente na direita: Lâmpada com brilho dinâmico */}
                  <g transform="translate(490, 110)">
                    {switchClosed && bulbGlowPct > 0 && (
                      <circle
                        cx="0"
                        cy="0"
                        r={Math.min(50, 20 + bulbGlowPct * 0.35)}
                        fill="url(#bulbGlowGradient)"
                        opacity={bulbGlowPct / 100}
                      />
                    )}
                    <circle cx="0" cy="0" r="18" fill="#0f172a" stroke="#F59E0B" strokeWidth="2" />
                    <text x="0" y="5" fill="#F59E0B" fontSize="14" textAnchor="middle">💡</text>
                  </g>

                  {/* Resistor na base */}
                  <g transform="translate(270, 185)">
                    <rect x="-40" y="-12" width="80" height="24" fill="#0f172a" stroke="#A78BFA" strokeWidth="2" rx="4" />
                    <text x="0" y="4" fill="#A78BFA" fontSize="11" fontWeight="700" textAnchor="middle">
                      {effectiveResistance.toFixed(1)} Ω
                    </text>
                  </g>

                  <defs>
                    <radialGradient id="bulbGlowGradient">
                      <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.9" />
                      <stop offset="60%" stopColor="#F59E0B" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
                    </radialGradient>
                  </defs>
                </svg>
              </div>

              {/* Multímetro Digital */}
              <div className="sim-kpi-row">
                <div className="sim-kpi-card">
                  <span className="sim-kpi-label">CORRENTE (I = V / R)</span>
                  <span className="sim-kpi-val" style={{ color: '#00F0FF' }}>{currentAmps.toFixed(2)} A</span>
                  <span className="sim-kpi-sub">{(currentAmps * 1000).toFixed(0)} mA</span>
                </div>
                <div className="sim-kpi-card">
                  <span className="sim-kpi-label">POTÊNCIA ELÉTRICA (P = V · I)</span>
                  <span className="sim-kpi-val" style={{ color: '#F59E0B' }}>{powerWatts.toFixed(1)} W</span>
                  <span className="sim-kpi-sub">Brilho: {bulbGlowPct}%</span>
                </div>
                <div className="sim-kpi-card">
                  <span className="sim-kpi-label">CONSUMO EM 1 HORA</span>
                  <span className="sim-kpi-val" style={{ color: '#10B981' }}>{(powerWatts / 1000).toFixed(3)} kWh</span>
                  <span className="sim-kpi-sub">ENEM: E = P · Δt</span>
                </div>
              </div>
            </div>

            {/* Controles do Circuito */}
            <div className="sim-controls-panel">
              <h4 className="controls-title"><Sliders size={14} /> Ajustes de Tensão e Carga</h4>

              <div className="control-group">
                <div className="control-label-row">
                  <span>Tensão da Bateria (V)</span>
                  <strong>{voltage} Volts</strong>
                </div>
                <input
                  type="range"
                  min="3"
                  max="24"
                  step="1.5"
                  value={voltage}
                  onChange={e => setVoltage(Number(e.target.value))}
                  className="sim-slider"
                />
              </div>

              <div className="control-group">
                <div className="control-label-row">
                  <span>Resistência Elétrica (R)</span>
                  <strong>{resistance} Ω</strong>
                </div>
                <input
                  type="range"
                  min="4"
                  max="80"
                  value={resistance}
                  onChange={e => setResistance(Number(e.target.value))}
                  className="sim-slider"
                />
              </div>

              <div className="control-group">
                <div className="control-label-row">
                  <span>Modo de Associação</span>
                </div>
                <div className="button-chips-row">
                  {[
                    { id: 'lamp', label: 'Lâmpada Única' },
                    { id: 'series', label: 'Série (+20Ω)' },
                    { id: 'parallel', label: 'Paralelo (// 20Ω)' }
                  ].map(m => (
                    <button
                      key={m.id}
                      className={`chip-btn ${circuitType === m.id ? 'active' : ''}`}
                      onClick={() => setCircuitType(m.id as any)}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="sim-socratic-box">
                <div className="socratic-header">
                  <Lightbulb size={14} color="#F59E0B" />
                  <span>Efeito Joule & Vestibular</span>
                </div>
                <p>
                  "O aquecimento de resistores (como o chuveiro elétrico e o secador) decorre das colisões dos elétrons livres contra a rede cristalina do metal. 
                  Se você dobra a tensão mantendo o mesmo resistor, a potência quadruplica (P = V² / R)!"
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* SIMULADOR 4: GENÉTICA MENDELIANA & QUADRO DE PUNNETT      */}
        {/* ========================================================= */}
        {activeSim === 'genetics' && (
          <div className="sim-grid-two-col">
            <div className="sim-canvas-panel">
              <div className="sim-panel-header">
                <div>
                  <h3>🌱 Primeira Lei de Mendel — Segregação dos Fatores</h3>
                  <span className="sim-mentor-pill">Mentor: Gregor Mendel (Abade de Brno)</span>
                </div>
                <button
                  className="voice-btn"
                  onClick={() =>
                    speakText(
                      `Cruzando indivíduos com genótipos ${parent1} e ${parent2}, a probabilidade fenotípica é de ${yellowPct}% de sementes amarelas e ${greenPct}% de sementes verdes. O alelo azão domina sobre o alelo azinho.`
                    )
                  }
                >
                  {isSpeaking ? <VolumeX size={14} color="#F59E0B" /> : <Volume2 size={14} color="#00F0FF" />}
                  <span>{isSpeaking ? 'Pausar' : 'Ouvir Gregor Mendel'}</span>
                </button>
              </div>

              {/* Quadro de Punnett 2x2 Interativo */}
              <div className="punnett-square-box">
                <div className="punnett-grid">
                  <div className="punnett-cell header-empty">✕</div>
                  <div className="punnett-cell header-col">Alelo {allele1A}</div>
                  <div className="punnett-cell header-col">Alelo {allele1B}</div>

                  <div className="punnett-cell header-row">Alelo {allele2A}</div>
                  <div className="punnett-cell result-cell">
                    <span className="pea-icon">{offspringGenotypes[0][0] === 'aa' ? '🟢' : '🟡'}</span>
                    <strong>{offspringGenotypes[0][0]}</strong>
                    <small>{offspringGenotypes[0][0] === 'aa' ? 'Verde (Recessivo)' : 'Amarela (Dominante)'}</small>
                  </div>
                  <div className="punnett-cell result-cell">
                    <span className="pea-icon">{offspringGenotypes[0][1] === 'aa' ? '🟢' : '🟡'}</span>
                    <strong>{offspringGenotypes[0][1]}</strong>
                    <small>{offspringGenotypes[0][1] === 'aa' ? 'Verde (Recessivo)' : 'Amarela (Dominante)'}</small>
                  </div>

                  <div className="punnett-cell header-row">Alelo {allele2B}</div>
                  <div className="punnett-cell result-cell">
                    <span className="pea-icon">{offspringGenotypes[1][0] === 'aa' ? '🟢' : '🟡'}</span>
                    <strong>{offspringGenotypes[1][0]}</strong>
                    <small>{offspringGenotypes[1][0] === 'aa' ? 'Verde (Recessivo)' : 'Amarela (Dominante)'}</small>
                  </div>
                  <div className="punnett-cell result-cell">
                    <span className="pea-icon">{offspringGenotypes[1][1] === 'aa' ? '🟢' : '🟡'}</span>
                    <strong>{offspringGenotypes[1][1]}</strong>
                    <small>{offspringGenotypes[1][1] === 'aa' ? 'Verde (Recessivo)' : 'Amarela (Dominante)'}</small>
                  </div>
                </div>
              </div>

              {/* Estatísticas Fenotípicas */}
              <div className="sim-kpi-row">
                <div className="sim-kpi-card">
                  <span className="sim-kpi-label">FENÓTIPO AMARELO (A_)</span>
                  <span className="sim-kpi-val" style={{ color: '#F59E0B' }}>{yellowPct}%</span>
                  <span className="sim-kpi-sub">{countAA + countAa} de 4 descendentes</span>
                </div>
                <div className="sim-kpi-card">
                  <span className="sim-kpi-label">FENÓTIPO VERDE (aa)</span>
                  <span className="sim-kpi-val" style={{ color: '#10B981' }}>{greenPct}%</span>
                  <span className="sim-kpi-sub">{countaa} de 4 descendentes</span>
                </div>
                <div className="sim-kpi-card">
                  <span className="sim-kpi-label">PROPORÇÃO GENOTÍPICA</span>
                  <span className="sim-kpi-val" style={{ color: '#A78BFA' }}>
                    {countAA}:{countAa}:{countaa}
                  </span>
                  <span className="sim-kpi-sub">AA : Aa : aa</span>
                </div>
              </div>
            </div>

            {/* Controles de Genótipo */}
            <div className="sim-controls-panel">
              <h4 className="controls-title"><Sliders size={14} /> Seleção Parental (Geração P)</h4>

              <div className="control-group">
                <div className="control-label-row">
                  <span>Genótipo Progenitor 1 (Pai)</span>
                  <strong>{parent1}</strong>
                </div>
                <div className="button-chips-row">
                  {(['AA', 'Aa', 'aa'] as const).map(g => (
                    <button
                      key={g}
                      className={`chip-btn ${parent1 === g ? 'active' : ''}`}
                      onClick={() => setParent1(g)}
                    >
                      {g} ({g === 'aa' ? 'Verde' : 'Amarela'})
                    </button>
                  ))}
                </div>
              </div>

              <div className="control-group">
                <div className="control-label-row">
                  <span>Genótipo Progenitor 2 (Mãe)</span>
                  <strong>{parent2}</strong>
                </div>
                <div className="button-chips-row">
                  {(['AA', 'Aa', 'aa'] as const).map(g => (
                    <button
                      key={g}
                      className={`chip-btn ${parent2 === g ? 'active' : ''}`}
                      onClick={() => setParent2(g)}
                    >
                      {g} ({g === 'aa' ? 'Verde' : 'Amarela'})
                    </button>
                  ))}
                </div>
              </div>

              <div className="sim-socratic-box">
                <div className="socratic-header">
                  <Lightbulb size={14} color="#F59E0B" />
                  <span>A Regra de Ouro de Gregor Mendel</span>
                </div>
                <p>
                  "Cruzando dois heterozigotos (Aa × Aa), obtemos invariavelmente a clássica proporção fenotípica de <strong>3 para 1</strong> (75% dominantes e 25% recessivos) e a proporção genotípica <strong>1:2:1</strong>. 
                  O alelo recessivo não desaparece; ele apenas fica oculto na presença do dominante!"
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* SIMULADOR 5: TABELA PERIÓDICA INTERATIVA                  */}
        {/* ========================================================= */}
        {activeSim === 'periodic_table' && (
          <div className="sim-grid-two-col">
            <div className="sim-canvas-panel">
              <div className="sim-panel-header">
                <div>
                  <h3>⚛️ Tabela Periódica dos Elementos Químicos</h3>
                  <span className="sim-mentor-pill">Mentores: Marie Curie, Dmitri Mendeleev & Antoine Lavoisier</span>
                </div>
                <button
                  className="voice-btn"
                  onClick={() =>
                    speakText(
                      `O elemento químico ${selectedElement.name}, de símbolo ${selectedElement.sym}, possui número atômico ${
                        selectedElement.z
                      } e massa atômica de ${selectedElement.mass}. Sua distribuição eletrônica fundamental é ${
                        selectedElement.config
                      }. ${selectedElement.note}`
                    )
                  }
                >
                  {isSpeaking ? <VolumeX size={14} color="#F59E0B" /> : <Volume2 size={14} color="#00F0FF" />}
                  <span>{isSpeaking ? 'Pausar' : `Ouvir sobre ${selectedElement.sym}`}</span>
                </button>
              </div>

              {/* Grid dos Elementos Periódicos */}
              <div className="elements-matrix-grid">
                {PERIODIC_ELEMENTS.map(el => (
                  <button
                    key={el.sym}
                    className={`element-tile ${selectedElement.sym === el.sym ? 'selected' : ''}`}
                    onClick={() => setSelectedElement(el)}
                  >
                    <span className="tile-z">{el.z}</span>
                    <strong className="tile-sym">{el.sym}</strong>
                    <span className="tile-name">{el.name}</span>
                    <span className="tile-mass">{el.mass}</span>
                  </button>
                ))}
              </div>

              {/* Detalhamento do Elemento Selecionado */}
              <div className="sim-kpi-row">
                <div className="sim-kpi-card">
                  <span className="sim-kpi-label">NÚMERO ATÔMICO (Z)</span>
                  <span className="sim-kpi-val" style={{ color: '#00F0FF' }}>{selectedElement.z}</span>
                  <span className="sim-kpi-sub">{selectedElement.z} Prótons / {selectedElement.z} Elétrons</span>
                </div>
                <div className="sim-kpi-card">
                  <span className="sim-kpi-label">DISTRIBUIÇÃO ELETRÔNICA</span>
                  <span className="sim-kpi-val" style={{ color: '#A78BFA', fontSize: '13px' }}>
                    {selectedElement.config}
                  </span>
                  <span className="sim-kpi-sub">Diagrama de Linus Pauling</span>
                </div>
                <div className="sim-kpi-card">
                  <span className="sim-kpi-label">RAIO ATÔMICO ESTIMADO</span>
                  <span className="sim-kpi-val" style={{ color: '#10B981' }}>{selectedElement.radius}</span>
                  <span className="sim-kpi-sub">Família: {selectedElement.group}</span>
                </div>
              </div>
            </div>

            {/* Dossiê Histórico & Científico do Elemento */}
            <div className="sim-controls-panel">
              <div className="element-dossier-card">
                <div className="dossier-header">
                  <div className="dossier-big-symbol">{selectedElement.sym}</div>
                  <div>
                    <h2>{selectedElement.name}</h2>
                    <span className="dossier-group">{selectedElement.group} • Massa: {selectedElement.mass} u</span>
                  </div>
                </div>

                <div className="dossier-body">
                  <h4>📜 Memória Histórica & Aplicação Tecnológica:</h4>
                  <p>{selectedElement.note}</p>
                </div>

                {selectedElement.sym === 'Ra' && (
                  <div className="curie-special-badge">
                    <span>☢️ Elemento Radioativo Descoberto por Marie Curie</span>
                  </div>
                )}
              </div>

              <div className="sim-socratic-box">
                <div className="socratic-header">
                  <Lightbulb size={14} color="#F59E0B" />
                  <span>Dmitri Mendeleev (1869)</span>
                </div>
                <p>
                  "Quando organizei os elementos em ordem crescente de massa atômica, notei que as propriedades químicas se repetiam periodicamente. 
                  Cheguei a deixar espaços vazios na tabela, prevendo com exatidão a descoberta e as propriedades de elementos que a humanidade ainda nem conhecia!"
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* SIMULADOR 6: TERMODINÂMICA DOS GASES & CICLO DE CARNOT   */}
        {/* ========================================================= */}
        {activeSim === 'thermodynamics' && (
          <div className="sim-grid-two-col">
            <div className="sim-canvas-panel">
              <div className="sim-panel-header">
                <div>
                  <h3>🔥 Termodinâmica dos Gases & Ciclo de Carnot</h3>
                  <span className="sim-mentor-pill">Mentores: Sadi Carnot, Lord Kelvin & Émile Clapeyron</span>
                </div>
                <button
                  className="voice-btn"
                  onClick={() =>
                    speakText(
                      `Equação de Clapeyron: P vezes V é igual a n vezes R vezes T. Com volume de ${gasVolume.toFixed(
                        1
                      )} litros e temperatura de ${gasTemp} Kelvin, a pressão exercida pelo gás é de ${gasPressure.toFixed(
                        2
                      )} atmosferas. No ciclo térmico ideal entre as fontes de ${carnotThot} Kelvin e ${carnotTcold} Kelvin, o rendimento máximo de Carnot é de ${carnotEfficiency} por cento.`
                    )
                  }
                  title="Ouvir explicação do mentor"
                >
                  {isSpeaking ? <VolumeX size={14} color="#F59E0B" /> : <Volume2 size={14} color="#00F0FF" />}
                  <span>{isSpeaking ? 'Pausar Voz' : 'Ouvir Carnot'}</span>
                </button>
              </div>

              <div className="canvas-wrapper">
                <canvas ref={thermoCanvasRef} width={640} height={260} className="sim-canvas" />
              </div>

              {/* Métricas Termodinâmicas ao Vivo */}
              <div className="sim-kpi-row">
                <div className="sim-kpi-card">
                  <span className="sim-kpi-label">PRESSÃO DO GÁS (P)</span>
                  <span className="sim-kpi-val" style={{ color: '#00F0FF' }}>
                    {gasPressure.toFixed(2)} atm
                  </span>
                  <span className="sim-kpi-sub">{gasPressureKPa.toFixed(1)} kPa</span>
                </div>
                <div className="sim-kpi-card">
                  <span className="sim-kpi-label">ENERGIA INTERNA (U = 3/2 nRT)</span>
                  <span className="sim-kpi-val" style={{ color: '#F59E0B' }}>
                    {internalEnergyJ} J
                  </span>
                  <span className="sim-kpi-sub">Gás Ideal Monoatômico</span>
                </div>
                <div className="sim-kpi-card">
                  <span className="sim-kpi-label">EFICIÊNCIA DE CARNOT (η)</span>
                  <span className="sim-kpi-val" style={{ color: '#10B981' }}>
                    {carnotEfficiency}%
                  </span>
                  <span className="sim-kpi-sub">Limite da 2ª Lei</span>
                </div>
              </div>
            </div>

            {/* Controles Termodinâmicos */}
            <div className="sim-controls-panel">
              <h4 className="controls-title"><Sliders size={14} /> Variáveis de Estado Termodinâmico</h4>

              <div className="control-group">
                <div className="control-label-row">
                  <span>Volume do Cilindro (V)</span>
                  <strong>{gasVolume.toFixed(1)} L</strong>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="0.2"
                  value={gasVolume}
                  onChange={e => {
                    setGasVolume(Number(e.target.value));
                    rewardSimulation('thermodynamics', 80, 'Explorou a Lei Geral dos Gases e Ciclo de Carnot');
                  }}
                  className="sim-slider"
                />
                <span className="control-tip">Comprimir o pistão eleva a pressão por Lei de Boyle-Mariotte.</span>
              </div>

              <div className="control-group">
                <div className="control-label-row">
                  <span>Temperatura do Gás (T)</span>
                  <strong>{gasTemp} K ({(gasTemp - 273.15).toFixed(0)} °C)</strong>
                </div>
                <input
                  type="range"
                  min="150"
                  max="700"
                  step="10"
                  value={gasTemp}
                  onChange={e => setGasTemp(Number(e.target.value))}
                  className="sim-slider"
                />
                <span className="control-tip">Aumentar a temperatura eleva a velocidade cinética média das partículas.</span>
              </div>

              <div className="control-group">
                <div className="control-label-row">
                  <span>Quantidade de Matéria (n)</span>
                  <strong>{gasMoles.toFixed(1)} mols</strong>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="4.0"
                  step="0.5"
                  value={gasMoles}
                  onChange={e => setGasMoles(Number(e.target.value))}
                  className="sim-slider"
                />
              </div>

              <div className="control-group">
                <div className="control-label-row">
                  <span>Fontes de Carnot (Tq / Tf)</span>
                  <strong>{carnotThot} K / {carnotTcold} K</strong>
                </div>
                <div className="button-chips-row">
                  <button
                    className={`chip-btn ${carnotThot === 600 && carnotTcold === 300 ? 'active' : ''}`}
                    onClick={() => { setCarnotThot(600); setCarnotTcold(300); }}
                  >
                    Vapor d'Água (50%)
                  </button>
                  <button
                    className={`chip-btn ${carnotThot === 800 && carnotTcold === 200 ? 'active' : ''}`}
                    onClick={() => { setCarnotThot(800); setCarnotTcold(200); }}
                  >
                    Turbina Avançada (75%)
                  </button>
                  <button
                    className={`chip-btn ${carnotThot === 500 && carnotTcold === 350 ? 'active' : ''}`}
                    onClick={() => { setCarnotThot(500); setCarnotTcold(350); }}
                  >
                    Geotérmica (30%)
                  </button>
                </div>
              </div>

              <div className="sim-socratic-box">
                <div className="socratic-header">
                  <Lightbulb size={14} color="#F59E0B" />
                  <span>Sadi Carnot (1824 - Potência Motriz do Fogo)</span>
                </div>
                <p>
                  "O rendimento de uma máquina térmica não depende da substância utilizada, mas unicamente da diferença de temperatura entre a fonte quente e a fonte fria. 
                  Nenhuma máquina real pode ter rendimento de 100%, pois isso violaria o fluxo natural de calor!"
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* SIMULADOR 7: INDUÇÃO ELETROMAGNÉTICA & LEI DE FARADAY-LENZ */}
        {/* ========================================================= */}
        {activeSim === 'electromagnetism' && (
          <div className="sim-grid-two-col">
            <div className="sim-canvas-panel">
              <div className="sim-panel-header">
                <div>
                  <h3>🧲 Indução Eletromagnética & Lei de Faraday-Lenz</h3>
                  <span className="sim-mentor-pill">Mentores: Michael Faraday, Heinrich Lenz & James Clerk Maxwell</span>
                </div>
                <button
                  className="voice-btn"
                  onClick={() =>
                    speakText(
                      `Lei da Indução de Faraday: a força eletromotriz induzida é proporcional à taxa de variação do fluxo magnético no tempo vezes o número de espiras. 
                      Com ${coilTurns} espiras e ímã de ${magnetStrength} Tesla, a tensão instantânea gerada é de ${displayEmf} Volts. Pela Lei de Lenz, o sentido da corrente sempre se opõe à variação do campo magnético exterior!`
                    )
                  }
                  title="Ouvir explicação do mentor"
                >
                  {isSpeaking ? <VolumeX size={14} color="#F59E0B" /> : <Volume2 size={14} color="#00F0FF" />}
                  <span>{isSpeaking ? 'Pausar Voz' : 'Ouvir Faraday'}</span>
                </button>
              </div>

              <div className="canvas-wrapper">
                <canvas ref={emCanvasRef} width={640} height={260} className="sim-canvas" />
              </div>

              {/* Métricas Eletromagnéticas ao Vivo */}
              <div className="sim-kpi-row">
                <div className="sim-kpi-card">
                  <span className="sim-kpi-label">FORÇA ELETROMOTRIZ (ε)</span>
                  <span className="sim-kpi-val" style={{ color: displayEmf !== 0 ? '#10B981' : '#64748b' }}>
                    {displayEmf > 0 ? `+${displayEmf}` : displayEmf} V
                  </span>
                  <span className="sim-kpi-sub">ε = -N · (dΦ/dt)</span>
                </div>
                <div className="sim-kpi-card">
                  <span className="sim-kpi-label">CORRENTE INDUZIDA (I)</span>
                  <span className="sim-kpi-val" style={{ color: '#00F0FF' }}>
                    {(displayEmf / 10).toFixed(2)} A
                  </span>
                  <span className="sim-kpi-sub">Circuito de R = 10 Ω</span>
                </div>
                <div className="sim-kpi-card">
                  <span className="sim-kpi-label">POLARIDADE DO ÍMÃ</span>
                  <span className="sim-kpi-val" style={{ color: reversePoles ? '#3B82F6' : '#EF4444' }}>
                    {reversePoles ? 'SUL ➔ NORTE' : 'NORTE ➔ SUL'}
                  </span>
                  <span className="sim-kpi-sub">{magnetStrength} Tesla</span>
                </div>
              </div>
            </div>

            {/* Controles Eletromagnéticos */}
            <div className="sim-controls-panel">
              <h4 className="controls-title"><Sliders size={14} /> Parâmetros do Solenoide & Ímã</h4>

              <div className="control-group">
                <div className="control-label-row">
                  <span>Posição Manual do Ímã</span>
                  <strong>{magnetPos.toFixed(0)} px</strong>
                </div>
                <input
                  type="range"
                  min="-160"
                  max="160"
                  value={magnetPos}
                  disabled={isAutoOscillating}
                  onChange={e => {
                    setMagnetPos(Number(e.target.value));
                    rewardSimulation('electromagnetism', 85, 'Indução de Faraday & Lei de Lenz dominada');
                  }}
                  className="sim-slider"
                />
                <span className="control-tip">Mova o controle rapidamente para gerar pico de tensão na bobina!</span>
              </div>

              <div className="control-group">
                <div className="control-label-row">
                  <span>Número de Espiras da Bobina (N)</span>
                  <strong>{coilTurns} espiras</strong>
                </div>
                <input
                  type="range"
                  min="5"
                  max="50"
                  step="5"
                  value={coilTurns}
                  onChange={e => setCoilTurns(Number(e.target.value))}
                  className="sim-slider"
                />
                <span className="control-tip">Mais espiras multiplicam a variação total do fluxo magnético captado.</span>
              </div>

              <div className="control-group">
                <div className="control-label-row">
                  <span>Campo Magnético do Ímã (B)</span>
                  <strong>{magnetStrength.toFixed(1)} T</strong>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="2.5"
                  step="0.1"
                  value={magnetStrength}
                  onChange={e => setMagnetStrength(Number(e.target.value))}
                  className="sim-slider"
                />
              </div>

              <div className="control-group">
                <div className="control-label-row">
                  <span>Movimento Dinâmico</span>
                  <strong>{isAutoOscillating ? 'Oscilação Ativa' : 'Manual'}</strong>
                </div>
                <div className="button-chips-row">
                  <button
                    className={`chip-btn ${isAutoOscillating ? 'active' : ''}`}
                    onClick={() => {
                      setIsAutoOscillating(!isAutoOscillating);
                      rewardSimulation('electromagnetism', 85, 'Indução de Faraday & Lei de Lenz dominada');
                    }}
                  >
                    {isAutoOscillating ? '⏸️ Pausar Oscilador' : '▶️ Oscilar Automaticamente'}
                  </button>
                  <button
                    className="chip-btn"
                    onClick={() => setReversePoles(!reversePoles)}
                  >
                    🔄 Inverter Polos (N/S)
                  </button>
                </div>
              </div>

              <div className="sim-socratic-box">
                <div className="socratic-header">
                  <Lightbulb size={14} color="#F59E0B" />
                  <span>Michael Faraday & Heinrich Lenz (1831)</span>
                </div>
                <p>
                  "A eletricidade não surge da presença do magnetismo, mas sim de seu movimento relativo. 
                  E como Heinrich Lenz demonstrou: a corrente induzida sempre cria um contra-campo magnético que tenta impedir seu movimento — é o princípio de conservação de energia em ação nos geradores e transformadores elétricos!"
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScienceSimulators;
