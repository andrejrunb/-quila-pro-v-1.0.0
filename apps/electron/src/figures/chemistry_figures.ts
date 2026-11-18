/**
 * Áquila Pro v2.2 - Estúdio Pedagógico de Figuras Vetoriais
 * chemistry_figures.ts
 *
 * Módulo determinístico para geração de instrumentos e diagramas de química em SVG.
 * Produção Edge-First: sem dependências externas de IA, tempo de renderização < 1ms.
 */

export interface CylinderOptions {
  vol?: number;
  capacity?: number;
  showLoupe?: boolean;
  color?: string;
  width?: number;
  height?: number;
}

function round(val: number, decimals: number = 2): number {
  const factor = Math.pow(10, decimals);
  return Math.round(val * factor) / factor;
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

/**
 * 1. PROVETA GRADUADA COM MENISCO BÉZIER E LUPA DE LEITURA
 * Fórmula cúbica Bézier simétrica de teacherdotdev:
 * M left topY C (left+0.04w) (bottomY-0.4d) (left+0.22w) bottomY midX bottomY C (right-0.22w) bottomY (right-0.04w) (bottomY-0.4d) right topY
 */
export function generateCylinderSVG(options: CylinderOptions = {}): string {
  const {
    vol = 42,
    capacity = 100,
    showLoupe = true,
    color = '#38bdf8',
    width = 280,
    height = 360
  } = options;

  const safeVol = clamp(vol, 0, capacity);

  const cylLeft = 70;
  const cylWidth = 60;
  const cylRight = cylLeft + cylWidth;
  const cylTop = 40;
  const cylBottom = 310;
  const cylHeight = cylBottom - cylTop;

  const liquidTopY = cylBottom - (safeVol / capacity) * cylHeight;
  const meniscusDepth = 10;
  const bottomY = liquidTopY + meniscusDepth;
  const topY = liquidTopY;
  const midX = cylLeft + cylWidth / 2;

  const cp1x = round(cylLeft + 0.04 * cylWidth);
  const cp1y = round(bottomY - 0.4 * meniscusDepth);
  const cp2x = round(cylLeft + 0.22 * cylWidth);
  const cp2y = round(bottomY);
  const cp3x = round(cylRight - 0.22 * cylWidth);
  const cp3y = round(bottomY);
  const cp4x = round(cylRight - 0.04 * cylWidth);
  const cp4y = round(bottomY - 0.4 * meniscusDepth);

  const meniscusPath = `M ${cylLeft} ${topY.toFixed(1)} C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${midX} ${bottomY.toFixed(1)} C ${cp3x} ${cp3y} ${cp4x} ${cp4y} ${cylRight} ${topY.toFixed(1)}`;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" style="background:#ffffff; font-family:'Segoe UI',sans-serif;">\n`;

  // Base hexagonal/plástica da proveta
  svg += `  <!-- Base da Proveta -->\n`;
  svg += `  <path d="M ${cylLeft - 25} ${cylBottom + 18} L ${cylRight + 25} ${cylBottom + 18} L ${cylRight + 15} ${cylBottom} L ${cylLeft - 15} ${cylBottom} Z" fill="#94a3b8" stroke="#334155" stroke-width="1.8"/>\n`;

  // Preenchimento de líquido com gradiente
  svg += `  <defs>\n`;
  svg += `    <linearGradient id="liquidGrad" x1="0" y1="0" x2="1" y2="0">\n`;
  svg += `      <stop offset="0%" stop-color="${color}" stop-opacity="0.85"/>\n`;
  svg += `      <stop offset="50%" stop-color="${color}" stop-opacity="0.55"/>\n`;
  svg += `      <stop offset="100%" stop-color="${color}" stop-opacity="0.9"/>\n`;
  svg += `    </linearGradient>\n`;
  svg += `  </defs>\n`;

  // Corpo do líquido
  svg += `  <!-- Coluna de Líquido -->\n`;
  svg += `  <path d="${meniscusPath} L ${cylRight} ${cylBottom} L ${cylLeft} ${cylBottom} Z" fill="url(#liquidGrad)"/>\n`;
  // Contorno do menisco
  svg += `  <path d="${meniscusPath}" fill="none" stroke="#0284c7" stroke-width="1.8"/>\n`;

  // Parede de vidro da proveta
  svg += `  <!-- Tubo de Vidro -->\n`;
  svg += `  <line x1="${cylLeft}" y1="${cylTop}" x2="${cylLeft}" y2="${cylBottom}" stroke="#0f172a" stroke-width="2"/>\n`;
  svg += `  <line x1="${cylRight}" y1="${cylTop}" x2="${cylRight}" y2="${cylBottom}" stroke="#0f172a" stroke-width="2"/>\n`;
  // Bico superior
  svg += `  <path d="M ${cylLeft - 10} ${cylTop - 6} L ${cylLeft} ${cylTop} L ${cylRight} ${cylTop} L ${cylRight + 4} ${cylTop - 6}" fill="none" stroke="#0f172a" stroke-width="2"/>\n`;

  // Graduação da escala (marcas a cada 10 ml e traços menores a cada 2 ml)
  svg += `  <!-- Escala Milimetrada -->\n`;
  for (let v = 0; v <= capacity; v += 2) {
    const y = cylBottom - (v / capacity) * cylHeight;
    const isMajor = v % 10 === 0;
    const tickLen = isMajor ? 14 : 7;
    const strokeW = isMajor ? 1.4 : 0.8;
    svg += `  <line x1="${cylLeft}" y1="${y.toFixed(1)}" x2="${cylLeft + tickLen}" y2="${y.toFixed(1)}" stroke="#1e293b" stroke-width="${strokeW}"/>\n`;
    if (isMajor && v > 0) {
      svg += `  <text x="${cylLeft - 6}" y="${(y + 3.5).toFixed(1)}" fill="#334155" font-size="9" font-weight="600" text-anchor="end">${v}</text>\n`;
    }
  }

  // Unidade no topo
  svg += `  <text x="${cylLeft - 6}" y="${cylTop + 6}" fill="#475569" font-size="9" font-style="italic" text-anchor="end">mL</text>\n`;

  // Lupa de Leitura (Zoom na posição do menisco)
  if (showLoupe && liquidTopY > cylTop + 20 && liquidTopY < cylBottom - 15) {
    const loupeCx = width - 75;
    const loupeCy = liquidTopY;
    const loupeR = 42;

    svg += `  <!-- Lupa de Ampliação do Menisco -->\n`;
    svg += `  <line x1="${midX}" y1="${bottomY.toFixed(1)}" x2="${loupeCx - loupeR}" y2="${loupeCy}" stroke="#0284c7" stroke-width="1.2" stroke-dasharray="3,3"/>\n`;
    svg += `  <circle cx="${loupeCx}" cy="${loupeCy}" r="${loupeR}" fill="#f0f9ff" stroke="#0284c7" stroke-width="2.5"/>\n`;

    // Zoom do menisco dentro da lupa
    const zoomScale = 1.8;
    const zLeft = loupeCx - (cylWidth / 2) * zoomScale;
    const zRight = loupeCx + (cylWidth / 2) * zoomScale;
    const zTop = loupeCy - 10;
    const zBot = loupeCy + 8;
    const zMid = loupeCx;

    svg += `  <!-- Linha de Visada Tangencial (Fundo do menisco) -->\n`;
    svg += `  <line x1="${loupeCx - loupeR + 6}" y1="${zBot}" x2="${loupeCx + loupeR - 6}" y2="${zBot}" stroke="#ef4444" stroke-width="1.4" stroke-dasharray="2,2"/>\n`;
    svg += `  <path d="M ${zLeft} ${zTop} Q ${zMid} ${zBot + 6} ${zRight} ${zTop}" fill="none" stroke="#0284c7" stroke-width="2.5"/>\n`;

    svg += `  <text x="${loupeCx}" y="${loupeCy + loupeR + 14}" fill="#0f172a" font-size="9.5" font-weight="700" text-anchor="middle">Leitura Tangencial: ${safeVol.toFixed(1)} mL</text>\n`;
  }

  svg += `</svg>`;
  return svg;
}

export interface TitrationCurveOptions {
  equivVolume?: number;
  initialPh?: number;
  equivPh?: number;
  finalPh?: number;
  width?: number;
  height?: number;
}

export function generateTitrationCurveSVG(options: TitrationCurveOptions = {}): string {
  const {
    equivVolume = 25,
    initialPh = 1,
    equivPh = 7,
    finalPh = 13,
    width = 360,
    height = 240
  } = options;

  const padLeft = 45;
  const padRight = 25;
  const padTop = 30;
  const padBottom = 40;

  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;
  const maxV = 50;

  const toPxX = (v: number) => padLeft + (v / maxV) * plotW;
  const toPxY = (ph: number) => height - padBottom - (ph / 14) * plotH;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" style="background:#ffffff; font-family:'Segoe UI',sans-serif;">\n`;

  // Grade de pH
  for (let ph = 0; ph <= 14; ph += 2) {
    const y = toPxY(ph);
    svg += `  <line x1="${padLeft}" y1="${y.toFixed(1)}" x2="${width - padRight}" y2="${y.toFixed(1)}" stroke="#f1f5f9" stroke-width="1"/>\n`;
    svg += `  <text x="${padLeft - 6}" y="${(y + 3.5).toFixed(1)}" fill="#64748b" font-size="9" text-anchor="end">${ph}</text>\n`;
  }

  // Eixos
  svg += `  <line x1="${padLeft}" y1="${padTop}" x2="${padLeft}" y2="${height - padBottom}" stroke="#1e293b" stroke-width="1.8"/>\n`;
  svg += `  <line x1="${padLeft}" y1="${height - padBottom}" x2="${width - padRight}" y2="${height - padBottom}" stroke="#1e293b" stroke-width="1.8"/>\n`;

  // Marcas de Volume
  for (let v = 0; v <= maxV; v += 10) {
    const x = toPxX(v);
    svg += `  <line x1="${x.toFixed(1)}" y1="${height - padBottom}" x2="${x.toFixed(1)}" y2="${height - padBottom + 4}" stroke="#1e293b" stroke-width="1.2"/>\n`;
    svg += `  <text x="${x.toFixed(1)}" y="${height - padBottom + 16}" fill="#64748b" font-size="9" text-anchor="middle">${v}</text>\n`;
  }

  // Rótulos dos eixos
  svg += `  <text x="${padLeft - 8}" y="${padTop - 12}" fill="#0f172a" font-size="10" font-weight="700" text-anchor="end">pH</text>\n`;
  svg += `  <text x="${width / 2}" y="${height - 8}" fill="#0f172a" font-size="10" font-weight="700" text-anchor="middle">Volume de Titulante (mL)</text>\n`;

  // Curva Sigmoide de Titulação (Ácido Forte - Base Forte)
  const points: string[] = [];
  const samples = 100;
  for (let i = 0; i <= samples; i++) {
    const v = (i / samples) * maxV;
    const steepness = 0.8;
    const ph = initialPh + (finalPh - initialPh) / (1 + Math.exp(-steepness * (v - equivVolume)));
    points.push(`${toPxX(v).toFixed(1)},${toPxY(ph).toFixed(1)}`);
  }
  svg += `  <polyline fill="none" stroke="#2563eb" stroke-width="2.5" points="${points.join(' ')}"/>\n`;

  // Ponto de Equivalência
  const eqX = toPxX(equivVolume);
  const eqY = toPxY(equivPh);
  svg += `  <!-- Ponto de Equivalência -->\n`;
  svg += `  <line x1="${eqX.toFixed(1)}" y1="${height - padBottom}" x2="${eqX.toFixed(1)}" y2="${eqY.toFixed(1)}" stroke="#ef4444" stroke-width="1.2" stroke-dasharray="3,3"/>\n`;
  svg += `  <line x1="${padLeft}" y1="${eqY.toFixed(1)}" x2="${eqX.toFixed(1)}" y2="${eqY.toFixed(1)}" stroke="#ef4444" stroke-width="1.2" stroke-dasharray="3,3"/>\n`;
  svg += `  <circle cx="${eqX.toFixed(1)}" cy="${eqY.toFixed(1)}" r="4.5" fill="#ef4444"/>\n`;
  svg += `  <text x="${eqX + 8}" y="${eqY - 6}" fill="#ef4444" font-size="10" font-weight="700">Ponto de Equivalência (pH ${equivPh})</text>\n`;

  svg += `</svg>`;
  return svg;
}
