import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Video,
  Download,
  Sliders,
  Tv,
  Eye,
  Sparkles,
  Maximize2,
  Minimize2,
  Gauge,
  Activity
} from 'lucide-react';
import './OpuscarPhysicsCinema.css';

export interface OpuscarQuestionTrack {
  question_id?: string;
  exam?: string;
  year?: number;
  subject?: string;
  macro_topic?: string;
  original_question?: string;
  figureCaption?: string;
  correct_answer?: string;
  socraticExplanation?: string;
  diagnostic?: {
    prerequisite_math?: string;
    prerequisite_concept?: string;
  };
}

interface OpuscarPhysicsCinemaProps {
  track: OpuscarQuestionTrack;
  onClose?: () => void;
}

type VisualStyle = 'blueprint' | 'chalkboard' | 'quantum';

export const OpuscarPhysicsCinema: React.FC<OpuscarPhysicsCinemaProps> = ({
  track,
  onClose
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  // Estados de controle de mídia
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [progress, setProgress] = useState<number>(0); // 0 a 100
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1.0);
  const [styleMode, setStyleMode] = useState<VisualStyle>('blueprint');
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Determinar o tipo de fenômeno baseado no texto e macro_topico da questão
  const topicLower = `${track.subject || ''} ${track.macro_topic || ''} ${track.original_question || ''}`.toLowerCase();

  const phenomenonType = (() => {
    if (topicLower.includes('circuito') || topicLower.includes('ohm') || topicLower.includes('resistor') || topicLower.includes('corrente')) {
      return 'CIRCUITO_ELETRICO';
    }
    if (topicLower.includes('plano inclinado') || topicLower.includes('atrito') || topicLower.includes('newton') || topicLower.includes('bloco')) {
      return 'PLANO_INCLINADO';
    }
    if (topicLower.includes('óptica') || topicLower.includes('optica') || topicLower.includes('refra') || topicLower.includes('lente') || topicLower.includes('prisma')) {
      return 'OPTICA_REFRACAO';
    }
    if (topicLower.includes('onda') || topicLower.includes('resson') || topicLower.includes('acústica') || topicLower.includes('frequência')) {
      return 'ONDULATORIA';
    }
    if (topicLower.includes('função') || topicLower.includes('parábola') || topicLower.includes('derivada') || topicLower.includes('gráfico')) {
      return 'FUNCAO_CALCULO';
    }
    return 'LANCAMENTO_OBLIQUO'; // Padrão clássico
  })();

  // Render loop no Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let localProgress = progress;

    const render = () => {
      const w = canvas.width;
      const h = canvas.height;

      // 1. Limpeza de Fundo baseado no Estilo
      if (styleMode === 'blueprint') {
        ctx.fillStyle = '#090d16';
        ctx.fillRect(0, 0, w, h);

        // Grade Milimetrada Blueprint
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.08)';
        ctx.lineWidth = 1;
        const gridSize = 30;
        for (let x = 0; x < w; x += gridSize) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, h);
          ctx.stroke();
        }
        for (let y = 0; y < h; y += gridSize) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(w, y);
          ctx.stroke();
        }
      } else if (styleMode === 'chalkboard') {
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, 0, w, h);
        // Traço de giz sutil
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
        for (let y = 0; y < h; y += 40) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(w, y);
          ctx.stroke();
        }
      } else {
        // Quantum
        ctx.fillStyle = '#020617';
        ctx.fillRect(0, 0, w, h);
      }

      const tNorm = localProgress / 100; // 0.0 a 1.0

      // 2. Renderização Específica do Fenômeno
      if (phenomenonType === 'LANCAMENTO_OBLIQUO') {
        renderLancamentoObliquo(ctx, w, h, tNorm, styleMode);
      } else if (phenomenonType === 'CIRCUITO_ELETRICO') {
        renderCircuitoEletrico(ctx, w, h, tNorm, styleMode);
      } else if (phenomenonType === 'PLANO_INCLINADO') {
        renderPlanoInclinado(ctx, w, h, tNorm, styleMode);
      } else if (phenomenonType === 'OPTICA_REFRACAO') {
        renderOpticaRefracao(ctx, w, h, tNorm, styleMode);
      } else if (phenomenonType === 'ONDULATORIA') {
        renderOndulatoria(ctx, w, h, tNorm, styleMode);
      } else {
        renderFuncaoCalculo(ctx, w, h, tNorm, styleMode);
      }

      // 3. Renderização do HUD de Telemetria Cinema Físico Áquila
      renderTelemetryHUD(ctx, w, h, tNorm, phenomenonType, styleMode);

      // Avançar tempo se estiver rodando
      if (isPlaying) {
        localProgress += 0.35 * speedMultiplier;
        if (localProgress > 100) {
          localProgress = 0; // Loop contínuo
        }
        setProgress(localProgress);
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isPlaying, progress, speedMultiplier, styleMode, phenomenonType]);

  // Função para gravar vídeo .webm nativamente via MediaRecorder
  const toggleRecording = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (isRecording) {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
    } else {
      recordedChunksRef.current = [];
      const stream = canvas.captureStream(60); // 60 FPS
      const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9' });

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        setRecordedVideoUrl(url);
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setIsPlaying(true);
      setProgress(0);
    }
  };

  // Renderizadores de Física Computacional
  const renderLancamentoObliquo = (
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    tNorm: number,
    style: VisualStyle
  ) => {
    const startX = 80;
    const groundY = h - 100;
    const range = w - 160;
    const apexHeight = h * 0.55;

    // Linha do Chão
    ctx.strokeStyle = style === 'blueprint' ? '#00f0ff' : '#94a3b8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(startX - 20, groundY);
    ctx.lineTo(w - 60, groundY);
    ctx.stroke();

    // Trajetória Parabólica Ideal tracejada
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    for (let x = 0; x <= range; x += 5) {
      const u = x / range;
      const y = groundY - 4 * apexHeight * u * (1 - u);
      if (x === 0) ctx.moveTo(startX + x, y);
      else ctx.lineTo(startX + x, y);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // Posição Atual do Projétil
    const currentX = startX + range * tNorm;
    const currentY = groundY - 4 * apexHeight * tNorm * (1 - tNorm);

    // Rastro luminoso (Trajetória percorrida)
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let x = 0; x <= range * tNorm; x += 3) {
      const u = x / range;
      const y = groundY - 4 * apexHeight * u * (1 - u);
      if (x === 0) ctx.moveTo(startX + x, y);
      else ctx.lineTo(startX + x, y);
    }
    ctx.stroke();

    // Projétil (Esfera brilhante)
    const radGrad = ctx.createRadialGradient(currentX, currentY, 2, currentX, currentY, 14);
    radGrad.addColorStop(0, '#ffffff');
    radGrad.addColorStop(0.4, '#38bdf8');
    radGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
    ctx.fillStyle = radGrad;
    ctx.beginPath();
    ctx.arc(currentX, currentY, 14, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(currentX, currentY, 6, 0, Math.PI * 2);
    ctx.fill();

    // Vetores Instantâneos
    // 1. Vetor Velocidade Horizontal (Vx = const)
    const vxLength = 50;
    drawVector(ctx, currentX, currentY, currentX + vxLength, currentY, '#10b981', 'vx (constante)');

    // 2. Vetor Velocidade Vertical (Vy = variável)
    const vyLength = 80 * (0.5 - tNorm);
    drawVector(ctx, currentX, currentY, currentX, currentY + vyLength, '#f59e0b', 'vy');

    // 3. Vetor Resultante V
    drawVector(ctx, currentX, currentY, currentX + vxLength, currentY + vyLength, '#ec4899', 'v');

    // 4. Vetor Aceleração da Gravidade (g = const para baixo)
    drawVector(ctx, currentX, currentY, currentX, currentY + 35, '#ef4444', 'g = 10 m/s²');
  };

  const renderCircuitoEletrico = (
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    tNorm: number,
    style: VisualStyle
  ) => {
    const cx = w / 2;
    const cy = h / 2;
    const rw = 280;
    const rh = 160;

    // Fios do Circuito Retangular
    ctx.strokeStyle = style === 'blueprint' ? '#00f0ff' : '#e2e8f0';
    ctx.lineWidth = 4;
    ctx.strokeRect(cx - rw / 2, cy - rh / 2, rw, rh);

    // Fonte de Tensão (Bateria) à esquerda
    ctx.fillStyle = '#090d16';
    ctx.fillRect(cx - rw / 2 - 10, cy - 25, 20, 50);

    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(cx - rw / 2 - 15, cy - 15);
    ctx.lineTo(cx - rw / 2 + 15, cy - 15);
    ctx.stroke();

    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - rw / 2 - 8, cy + 15);
    ctx.lineTo(cx - rw / 2 + 8, cy + 15);
    ctx.stroke();

    ctx.fillStyle = '#ef4444';
    ctx.font = 'bold 12px monospace';
    ctx.fillText('+ U = 12V -', cx - rw / 2 - 80, cy + 5);

    // Resistor Zig-Zag no topo
    ctx.fillStyle = '#090d16';
    ctx.fillRect(cx - 40, cy - rh / 2 - 10, 80, 20);

    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 3;
    ctx.beginPath();
    const rx = cx - 35;
    const ry = cy - rh / 2;
    ctx.moveTo(rx, ry);
    ctx.lineTo(rx + 10, ry - 12);
    ctx.lineTo(rx + 25, ry + 12);
    ctx.lineTo(rx + 40, ry - 12);
    ctx.lineTo(rx + 55, ry + 12);
    ctx.lineTo(rx + 70, ry);
    ctx.stroke();

    ctx.fillStyle = '#f59e0b';
    ctx.fillText('R = 4 Ω', cx - 20, cy - rh / 2 - 20);

    // Lâmpada na base com brilho dinâmico
    ctx.fillStyle = '#090d16';
    ctx.fillRect(cx - 20, cy + rh / 2 - 15, 40, 30);
    const bulbGlow = ctx.createRadialGradient(cx, cy + rh / 2, 2, cx, cy + rh / 2, 25);
    bulbGlow.addColorStop(0, '#fef08a');
    bulbGlow.addColorStop(0.6, 'rgba(250, 204, 21, 0.4)');
    bulbGlow.addColorStop(1, 'rgba(250, 204, 21, 0)');
    ctx.fillStyle = bulbGlow;
    ctx.beginPath();
    ctx.arc(cx, cy + rh / 2, 25, 0, Math.PI * 2);
    ctx.fill();

    // Elétrons em Movimento (Partículas Ciano Fluindo)
    const numElectrons = 16;
    const perimeter = 2 * (rw + rh);
    for (let i = 0; i < numElectrons; i++) {
      const offset = (tNorm * perimeter + (i * perimeter) / numElectrons) % perimeter;
      let ex = 0;
      let ey = 0;

      if (offset < rw) {
        ex = cx - rw / 2 + offset;
        ey = cy - rh / 2;
      } else if (offset < rw + rh) {
        ex = cx + rw / 2;
        ey = cy - rh / 2 + (offset - rw);
      } else if (offset < 2 * rw + rh) {
        ex = cx + rw / 2 - (offset - (rw + rh));
        ey = cy + rh / 2;
      } else {
        ex = cx - rw / 2;
        ey = cy + rh / 2 - (offset - (2 * rw + rh));
      }

      ctx.fillStyle = '#00f0ff';
      ctx.beginPath();
      ctx.arc(ex, ey, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  const renderPlanoInclinado = (
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    tNorm: number,
    style: VisualStyle
  ) => {
    const baseX = 100;
    const baseY = h - 90;
    const rampW = w - 240;
    const rampH = 180;
    const angle = Math.atan2(rampH, rampW);

    // Rampa Triangular
    ctx.fillStyle = 'rgba(56, 189, 248, 0.08)';
    ctx.beginPath();
    ctx.moveTo(baseX, baseY);
    ctx.lineTo(baseX + rampW, baseY);
    ctx.lineTo(baseX + rampW, baseY - rampH);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = style === 'blueprint' ? '#00f0ff' : '#94a3b8';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Posição do Bloco descendo a rampa
    const blockDist = Math.hypot(rampW, rampH) * (0.15 + 0.7 * tNorm);
    const bx = baseX + rampW - blockDist * Math.cos(angle);
    const by = baseY - rampH + blockDist * Math.sin(angle);

    ctx.save();
    ctx.translate(bx, by);
    ctx.rotate(angle);

    // Desenhar Bloco
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(-25, -30, 50, 30);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(-25, -30, 50, 30);

    // Força Normal N (Perpendicular à superfície)
    drawVector(ctx, 0, -15, 0, -65, '#10b981', 'N');

    // Força de Atrito Fat (Paralela à superfície para trás)
    drawVector(ctx, 0, -15, 45, -15, '#ef4444', 'Fat');

    // Componente Px da gravidade descendo
    drawVector(ctx, 0, -15, -55, -15, '#f59e0b', 'Px = P·sen(α)');

    ctx.restore();

    // Peso P vertical absoluto para o centro da Terra
    drawVector(ctx, bx, by, bx, by + 65, '#ec4899', 'P = m·g');
  };

  const renderOpticaRefracao = (
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    tNorm: number,
    style: VisualStyle
  ) => {
    const cx = w / 2;
    const cy = h / 2;

    // Meio 1 (Ar, n1 = 1.0) e Meio 2 (Vidro/Água, n2 = 1.5)
    ctx.fillStyle = 'rgba(56, 189, 248, 0.12)';
    ctx.fillRect(0, cy, w, h - cy);

    // Linha de Interface
    ctx.strokeStyle = style === 'blueprint' ? '#00f0ff' : '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, cy);
    ctx.lineTo(w, cy);
    ctx.stroke();

    // Linha Normal tracejada
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(cx, 40);
    ctx.lineTo(cx, h - 40);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px monospace';
    ctx.fillText('Meio 1: Ar (n₁ = 1,00)', 40, cy - 25);
    ctx.fillText('Meio 2: Vidro Óptico (n₂ = 1,50)', 40, cy + 35);
    ctx.fillText('Normal (N)', cx + 8, 55);

    // Feixe Laser Incidente (θ1 = 45°)
    const angle1 = Math.PI / 4;
    const n1 = 1.0;
    const n2 = 1.5;
    const angle2 = Math.asin((n1 / n2) * Math.sin(angle1)); // Lei de Snell

    const rayLen = 180;
    const incX = cx - rayLen * Math.sin(angle1);
    const incY = cy - rayLen * Math.cos(angle1);

    // Laser Incidente Vermelho
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(incX, incY);
    ctx.lineTo(cx, cy);
    ctx.stroke();

    // Ponto de Luz no ponto de incidência
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(cx, cy, 5, 0, Math.PI * 2);
    ctx.fill();

    // Feixe Refratado (Aproxima-se da Normal, pois n2 > n1)
    const refX = cx + rayLen * Math.sin(angle2);
    const refY = cy + rayLen * Math.cos(angle2);

    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(refX, refY);
    ctx.stroke();

    // Raio Parcialmente Refletido
    const reflX = cx + rayLen * Math.sin(angle1);
    const reflY = cy - rayLen * Math.cos(angle1);
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(reflX, reflY);
    ctx.stroke();

    // Ângulos anotados
    ctx.fillStyle = '#f59e0b';
    ctx.fillText(`θ₁ = 45° (Incidência)`, cx - 140, cy - 50);
    ctx.fillText(`θ₂ = 28,1° (Refração: aproxima da Normal)`, cx + 25, cy + 85);
  };

  const renderOndulatoria = (
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    tNorm: number,
    style: VisualStyle
  ) => {
    const cy = h / 2;
    const amp = 60;
    const lambda = 180;
    const k = (2 * Math.PI) / lambda;
    const omega = 2 * Math.PI;

    // Linha de Equilíbrio
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(40, cy);
    ctx.lineTo(w - 40, cy);
    ctx.stroke();
    ctx.setLineDash([]);

    // Onda Progressiva Senoidal
    ctx.strokeStyle = style === 'blueprint' ? '#00f0ff' : '#38bdf8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let x = 40; x <= w - 40; x += 3) {
      const y = cy + amp * Math.sin(k * x - omega * tNorm * 3);
      if (x === 40) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Nós e Ventres marcados
    ctx.fillStyle = '#ec4899';
    ctx.font = 'bold 12px monospace';
    ctx.fillText('▲ Crista (Amplitude Máxima)', w / 2 - 80, cy - amp - 15);
    ctx.fillText('▼ Vale', w / 2 + 30, cy + amp + 25);
    ctx.fillText('λ = v / f (Comprimento de Onda)', 60, h - 50);
  };

  const renderFuncaoCalculo = (
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    tNorm: number,
    style: VisualStyle
  ) => {
    const cx = w / 2;
    const cy = h / 2 + 50;
    const scale = 30;

    // Eixos Cartesianos
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(40, cy);
    ctx.lineTo(w - 40, cy);
    ctx.moveTo(cx, 40);
    ctx.lineTo(cx, h - 40);
    ctx.stroke();

    // Parábola: f(x) = 0.5 * x^2 - 2
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let px = 40; px <= w - 40; px += 2) {
      const x = (px - cx) / scale;
      const y = 0.5 * x * x - 2;
      const py = cy - y * scale;
      if (px === 40) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    // Ponto Tangente deslizando: x0 varia de -3 a 3
    const x0 = -3 + 6 * tNorm;
    const y0 = 0.5 * x0 * x0 - 2;
    const px0 = cx + x0 * scale;
    const py0 = cy - y0 * scale;

    // Derivada f'(x) = x
    const m = x0;

    // Reta Tangente no ponto
    const tanLen = 80;
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(px0 - tanLen, py0 + m * tanLen);
    ctx.lineTo(px0 + tanLen, py0 - m * tanLen);
    ctx.stroke();

    // Ponto Tangente
    ctx.fillStyle = '#ec4899';
    ctx.beginPath();
    ctx.arc(px0, py0, 6, 0, Math.PI * 2);
    ctx.fill();

    // Rótulo da Derivada
    ctx.fillStyle = '#f59e0b';
    ctx.font = '12px monospace';
    ctx.fillText(`Inclinação f'(${x0.toFixed(2)}) = ${m.toFixed(2)}`, px0 + 12, py0 - 12);
  };

  // Helper para desenhar setas de vetores
  const drawVector = (
    ctx: CanvasRenderingContext2D,
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    color: string,
    label?: string
  ) => {
    const headLength = 8;
    const angle = Math.atan2(toY - fromY, toX - fromX);

    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headLength * Math.cos(angle - Math.PI / 6), toY - headLength * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(toX - headLength * Math.cos(angle + Math.PI / 6), toY - headLength * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();

    if (label) {
      ctx.font = '11px monospace';
      ctx.fillText(label, toX + 6, toY + 4);
    }
  };

  // HUD de Telemetria Científica estilo Cinema Físico Áquila
  const renderTelemetryHUD = (
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    tNorm: number,
    phenomenon: string,
    style: VisualStyle
  ) => {
    // Caixa Superior Esquerda (Metadados da Questão & Fenômeno)
    ctx.fillStyle = 'rgba(9, 13, 22, 0.85)';
    ctx.strokeStyle = style === 'blueprint' ? '#00f0ff' : 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    ctx.fillRect(16, 16, 260, 64);
    ctx.strokeRect(16, 16, 260, 64);

    ctx.fillStyle = '#00f0ff';
    ctx.font = 'bold 11px monospace';
    ctx.fillText(`ÁQUILA CINEMA FÍSICA 60 FPS • ${phenomenon}`, 26, 34);

    ctx.fillStyle = '#e2e8f0';
    ctx.font = '11px sans-serif';
    ctx.fillText(`${track.exam || 'ENEM'} • ${track.macro_topic || 'Fenômeno Físico'}`, 26, 52);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px monospace';
    ctx.fillText(`t = ${(tNorm * 4.0).toFixed(2)}s | Frame: ${Math.floor(tNorm * 240)}/240`, 26, 68);

    // Barra de Conservação de Energia (para mecânica)
    if (phenomenon === 'LANCAMENTO_OBLIQUO') {
      const barX = w - 170;
      const barY = 16;
      ctx.fillStyle = 'rgba(9, 13, 22, 0.85)';
      ctx.fillRect(barX, barY, 150, 64);
      ctx.strokeRect(barX, barY, 150, 64);

      ctx.fillStyle = '#f8fafc';
      ctx.font = '10px monospace';
      ctx.fillText('CONSERVAÇÃO DE ENERGIA', barX + 10, barY + 16);

      const epFraction = 4 * tNorm * (1 - tNorm);
      const ecFraction = 1 - epFraction;

      // Barra Ec (Cinética)
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(barX + 10, barY + 24, 130 * ecFraction, 10);
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(`Ec: ${(ecFraction * 100).toFixed(0)}%`, barX + 10, barY + 44);

      // Barra Ep (Potencial)
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(barX + 10, barY + 48, 130 * epFraction, 8);
    }
  };

  return (
    <div className={`opuscar-cinema-container ${isFullscreen ? 'fullscreen' : ''}`}>
      {/* Cabeçalho do Player */}
      <div className="opuscar-header">
        <div className="opuscar-title-wrap">
          <div className="opuscar-badge">
            <Video size={14} />
            <span>CINEMA CIENTÍFICO ÁQUILA</span>
          </div>
          <h3>{track.macro_topic || 'Visualização Dinâmica do Fenômeno'}</h3>
        </div>

        <div className="opuscar-header-actions">
          {/* Seletor de Estilo Cinema Físico Áquila */}
          <div className="opuscar-style-selector">
            <button
              className={`style-btn ${styleMode === 'blueprint' ? 'active' : ''}`}
              onClick={() => setStyleMode('blueprint')}
              title="Estilo Blueprint Técnico"
            >
              Blueprint
            </button>
            <button
              className={`style-btn ${styleMode === 'chalkboard' ? 'active' : ''}`}
              onClick={() => setStyleMode('chalkboard')}
              title="Estilo Quadro-Negro Clássico"
            >
              Quadro
            </button>
            <button
              className={`style-btn ${styleMode === 'quantum' ? 'active' : ''}`}
              onClick={() => setStyleMode('quantum')}
              title="Estilo Laboratório Escuro"
            >
              Neon
            </button>
          </div>

          {/* Botão Gravar / Baixar Vídeo (.webm) */}
          <button
            className={`opuscar-btn record ${isRecording ? 'recording' : ''}`}
            onClick={toggleRecording}
            title={isRecording ? 'Parar Gravação' : 'Gravar Vídeo (.webm) para Sala de Aula'}
          >
            {isRecording ? <span className="rec-dot" /> : <Download size={14} />}
            <span>{isRecording ? 'Gravando...' : 'Gravar Vídeo'}</span>
          </button>

          {/* Se houver vídeo pronto */}
          {recordedVideoUrl && (
            <a
              href={recordedVideoUrl}
              download={`opuscar_${track.question_id || 'fenomeno'}.webm`}
              className="opuscar-btn download-ready"
              title="Baixar Arquivo WebM"
            >
              <Download size={14} />
              <span>Baixar WebM</span>
            </a>
          )}

          {/* Modo Telão / Fullscreen */}
          <button
            className="opuscar-btn"
            onClick={() => setIsFullscreen((prev) => !prev)}
            title="Alternar Modo Telão"
          >
            {isFullscreen ? <Minimize2 size={14} /> : <Tv size={14} />}
          </button>

          {onClose && (
            <button className="opuscar-btn close" onClick={onClose} title="Fechar Player">
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Área do Canvas de Renderização */}
      <div className="opuscar-canvas-viewport">
        <canvas
          ref={canvasRef}
          width={960}
          height={500}
          className="opuscar-canvas"
        />

        {/* Rodapé Socrático sobre o Fenômeno */}
        <div className="opuscar-socratic-bar">
          <div className="socratic-icon">
            <Sparkles size={16} color="#38bdf8" />
          </div>
          <div className="socratic-content">
            <strong>Análise Socrática do Fenômeno:</strong>
            <span>
              {track.diagnostic?.prerequisite_concept ||
                track.socraticExplanation ||
                'Observe a evolução temporal dos vetores de força e velocidade exatamente como descrito no enunciado.'}
            </span>
          </div>
          {track.correct_answer && (
            <div className="correct-answer-pill" title="Gabarito Oficial Calibrado">
              Gabarito: <strong>{track.correct_answer}</strong>
            </div>
          )}
        </div>
      </div>

      {/* Barra de Controles de Playback */}
      <div className="opuscar-controls">
        <div className="controls-left">
          <button
            className="ctrl-btn play"
            onClick={() => setIsPlaying((p) => !p)}
            title={isPlaying ? 'Pausar' : 'Reproduzir'}
          >
            {isPlaying ? <Pause size={16} /> : <Play size={16} />}
          </button>

          <button
            className="ctrl-btn"
            onClick={() => {
              setProgress(0);
              setIsPlaying(true);
            }}
            title="Reiniciar Simulação"
          >
            <RotateCcw size={16} />
          </button>

          {/* Timeline Scrubber */}
          <div className="timeline-wrapper">
            <input
              type="range"
              min={0}
              max={100}
              step={0.1}
              value={progress}
              onChange={(e) => {
                setProgress(parseFloat(e.target.value));
              }}
              className="timeline-slider"
            />
            <span className="timeline-time">
              {((progress / 100) * 4).toFixed(1)}s / 4.0s
            </span>
          </div>
        </div>

        <div className="controls-right">
          {/* Seletor de Câmera Lenta */}
          <div className="speed-pills">
            <button
              className={`speed-pill ${speedMultiplier === 0.25 ? 'active' : ''}`}
              onClick={() => setSpeedMultiplier(0.25)}
              title="Câmera Lenta Analítica 0.25x"
            >
              0.25x
            </button>
            <button
              className={`speed-pill ${speedMultiplier === 0.5 ? 'active' : ''}`}
              onClick={() => setSpeedMultiplier(0.5)}
              title="0.5x"
            >
              0.5x
            </button>
            <button
              className={`speed-pill ${speedMultiplier === 1.0 ? 'active' : ''}`}
              onClick={() => setSpeedMultiplier(1.0)}
              title="Velocidade Real 1x"
            >
              1.0x
            </button>
            <button
              className={`speed-pill ${speedMultiplier === 2.0 ? 'active' : ''}`}
              onClick={() => setSpeedMultiplier(2.0)}
              title="Acelerar 2x"
            >
              2.0x
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const AquilaPhysicsCinema = OpuscarPhysicsCinema;
export default OpuscarPhysicsCinema;
