/**
 * Áquila Pro v2.2 — Gerador Paramétrico de Figuras Matemáticas para Avaliações A4
 * apps/electron/src/figures/math_figures.ts
 *
 * Gráficos vetoriais 100% determinísticos, sem alucinações de texto, prontos para impressão 300 DPI.
 */

export interface CoordinateGridOptions {
  xMin?: number;
  xMax?: number;
  yMin?: number;
  yMax?: number;
  step?: number;
  showGrid?: boolean;
  width?: number;
  height?: number;
  xAxisLabel?: string;
  yAxisLabel?: string;
  points?: Array<{ x: number; y: number; label?: string; color?: string }>;
  functionPath?: (x: number) => number;
}

export function generateCoordinateGridSVG(options: CoordinateGridOptions = {}): string {
  const {
    xMin = -5,
    xMax = 5,
    yMin = -5,
    yMax = 5,
    step = 1,
    showGrid = true,
    width = 380,
    height = 280,
    xAxisLabel = 'x',
    yAxisLabel = 'y',
    points = [],
    functionPath
  } = options;

  const pad = 35;
  const plotW = width - 2 * pad;
  const plotH = height - 2 * pad;

  const toPxX = (x: number) => pad + ((x - xMin) / (xMax - xMin)) * plotW;
  const toPxY = (y: number) => height - pad - ((y - yMin) / (yMax - yMin)) * plotH;

  const origX = toPxX(0);
  const origY = toPxY(0);

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" style="background:#ffffff; font-family:'Segoe UI',sans-serif;">\n`;
  svg += `  <defs>\n`;
  svg += `    <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">\n`;
  svg += `      <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#1e293b"/>\n`;
  svg += `    </marker>\n`;
  svg += `  </defs>\n`;

  // Grid
  if (showGrid) {
    svg += `  <!-- Grid lines -->\n`;
    for (let x = Math.ceil(xMin / step) * step; x <= xMax; x += step) {
      if (Math.abs(x) < 1e-6) continue;
      const px = toPxX(x);
      svg += `  <line x1="${px.toFixed(1)}" y1="${pad}" x2="${px.toFixed(1)}" y2="${height - pad}" stroke="#e2e8f0" stroke-width="1"/>\n`;
    }
    for (let y = Math.ceil(yMin / step) * step; y <= yMax; y += step) {
      if (Math.abs(y) < 1e-6) continue;
      const py = toPxY(y);
      svg += `  <line x1="${pad}" y1="${py.toFixed(1)}" x2="${width - pad}" y2="${py.toFixed(1)}" stroke="#e2e8f0" stroke-width="1"/>\n`;
    }
  }

  // Axes
  svg += `  <!-- Main Axes -->\n`;
  svg += `  <line x1="${pad - 10}" y1="${origY.toFixed(1)}" x2="${width - pad + 15}" y2="${origY.toFixed(1)}" stroke="#1e293b" stroke-width="1.8" marker-end="url(#arrow)"/>\n`;
  svg += `  <line x1="${origX.toFixed(1)}" y1="${height - pad + 10}" x2="${origX.toFixed(1)}" y2="${pad - 15}" stroke="#1e293b" stroke-width="1.8" marker-end="url(#arrow)"/>\n`;

  // Axis Labels
  svg += `  <text x="${width - pad + 20}" y="${origY + 4}" fill="#1e293b" font-size="12" font-style="italic" font-weight="bold">${xAxisLabel}</text>\n`;
  svg += `  <text x="${origX}" y="${pad - 22}" fill="#1e293b" font-size="12" font-style="italic" font-weight="bold" text-anchor="middle">${yAxisLabel}</text>\n`;

  // Ticks & Numbers
  svg += `  <!-- Ticks & Numbers -->\n`;
  for (let x = Math.ceil(xMin / step) * step; x <= xMax; x += step) {
    if (Math.abs(x) < 1e-6) continue;
    const px = toPxX(x);
    svg += `  <line x1="${px.toFixed(1)}" y1="${(origY - 3).toFixed(1)}" x2="${px.toFixed(1)}" y2="${(origY + 3).toFixed(1)}" stroke="#1e293b" stroke-width="1.5"/>\n`;
    svg += `  <text x="${px.toFixed(1)}" y="${(origY + 14).toFixed(1)}" fill="#475569" font-size="9" text-anchor="middle">${x}</text>\n`;
  }
  for (let y = Math.ceil(yMin / step) * step; y <= yMax; y += step) {
    if (Math.abs(y) < 1e-6) continue;
    const py = toPxY(y);
    svg += `  <line x1="${(origX - 3).toFixed(1)}" y1="${py.toFixed(1)}" x2="${(origX + 3).toFixed(1)}" y2="${py.toFixed(1)}" stroke="#1e293b" stroke-width="1.5"/>\n`;
    svg += `  <text x="${(origX - 7).toFixed(1)}" y="${(py + 3).toFixed(1)}" fill="#475569" font-size="9" text-anchor="end">${y}</text>\n`;
  }

  // Origin label
  svg += `  <text x="${(origX - 6).toFixed(1)}" y="${(origY + 12).toFixed(1)}" fill="#475569" font-size="9" text-anchor="end">0</text>\n`;

  // Function curve if provided
  if (functionPath) {
    const pointsList: string[] = [];
    const samples = 100;
    for (let i = 0; i <= samples; i++) {
      const x = xMin + (i / samples) * (xMax - xMin);
      const y = functionPath(x);
      if (y >= yMin && y <= yMax) {
        pointsList.push(`${toPxX(x).toFixed(1)},${toPxY(y).toFixed(1)}`);
      }
    }
    if (pointsList.length > 1) {
      svg += `  <polyline fill="none" stroke="#2563eb" stroke-width="2" points="${pointsList.join(' ')}"/>\n`;
    }
  }

  // Data Points
  for (const pt of points) {
    const px = toPxX(pt.x);
    const py = toPxY(pt.y);
    const col = pt.color || '#dc2626';
    svg += `  <circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="3.5" fill="${col}"/>\n`;
    if (pt.label) {
      svg += `  <text x="${(px + 6).toFixed(1)}" y="${(py - 5).toFixed(1)}" fill="#1e293b" font-size="10" font-weight="600">${pt.label}</text>\n`;
    }
  }

  svg += `</svg>`;
  return svg;
}

export type SolidType = 'cilindro' | 'cone' | 'esfera' | 'prisma';

export interface GeometricSolidOptions {
  type?: SolidType;
  radius?: number;
  height?: number;
  radiusLabel?: string;
  heightLabel?: string;
  width?: number;
  totalHeight?: number;
}

export function generateGeometricSolidsSVG(options: GeometricSolidOptions = {}): string {
  const {
    type = 'cilindro',
    radiusLabel = 'r = 3 cm',
    heightLabel = 'h = 8 cm',
    width = 240,
    totalHeight = 240
  } = options;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${totalHeight}" width="${width}" height="${totalHeight}" style="background:#ffffff; font-family:'Segoe UI',sans-serif;">\n`;

  const cx = width / 2;

  if (type === 'cilindro') {
    const rx = 55;
    const ry = 18;
    const topY = 45;
    const botY = 185;

    // Cylinder body fill
    svg += `  <defs>\n`;
    svg += `    <linearGradient id="cylGrad" x1="0" y1="0" x2="1" y2="0">\n`;
    svg += `      <stop offset="0%" stop-color="#f1f5f9"/>\n`;
    svg += `      <stop offset="50%" stop-color="#ffffff"/>\n`;
    svg += `      <stop offset="100%" stop-color="#e2e8f0"/>\n`;
    svg += `    </linearGradient>\n`;
    svg += `  </defs>\n`;

    // Hidden back arc at bottom
    svg += `  <path d="M ${cx - rx} ${botY} A ${rx} ${ry} 0 0 1 ${cx + rx} ${botY}" fill="none" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="4,4"/>\n`;
    // Visible front arc at bottom
    svg += `  <path d="M ${cx - rx} ${botY} A ${rx} ${ry} 0 0 0 ${cx + rx} ${botY}" fill="none" stroke="#1e293b" stroke-width="2"/>\n`;

    // Side edges
    svg += `  <line x1="${cx - rx}" y1="${topY}" x2="${cx - rx}" y2="${botY}" stroke="#1e293b" stroke-width="2"/>\n`;
    svg += `  <line x1="${cx + rx}" y1="${topY}" x2="${cx + rx}" y2="${botY}" stroke="#1e293b" stroke-width="2"/>\n`;

    // Top ellipse
    svg += `  <ellipse cx="${cx}" cy="${topY}" rx="${rx}" ry="${ry}" fill="#f8fafc" stroke="#1e293b" stroke-width="2"/>\n`;

    // Radius line
    svg += `  <line x1="${cx}" y1="${topY}" x2="${cx + rx}" y2="${topY}" stroke="#2563eb" stroke-width="1.5" stroke-dasharray="2,2"/>\n`;
    svg += `  <circle cx="${cx}" cy="${topY}" r="2" fill="#2563eb"/>\n`;
    svg += `  <text x="${cx + rx / 2}" y="${topY - 6}" fill="#2563eb" font-size="10" font-weight="600" text-anchor="middle">${radiusLabel}</text>\n`;

    // Height dimension
    const dimX = cx + rx + 16;
    svg += `  <line x1="${dimX}" y1="${topY}" x2="${dimX}" y2="${botY}" stroke="#64748b" stroke-width="1.2"/>\n`;
    svg += `  <line x1="${dimX - 4}" y1="${topY}" x2="${dimX + 4}" y2="${topY}" stroke="#64748b" stroke-width="1.2"/>\n`;
    svg += `  <line x1="${dimX - 4}" y1="${botY}" x2="${dimX + 4}" y2="${botY}" stroke="#64748b" stroke-width="1.2"/>\n`;
    svg += `  <text x="${dimX + 8}" y="${(topY + botY) / 2 + 4}" fill="#1e293b" font-size="10" font-weight="600">${heightLabel}</text>\n`;

  } else if (type === 'cone') {
    const rx = 60;
    const ry = 18;
    const apexY = 35;
    const botY = 190;

    // Hidden back arc
    svg += `  <path d="M ${cx - rx} ${botY} A ${rx} ${ry} 0 0 1 ${cx + rx} ${botY}" fill="none" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="4,4"/>\n`;
    // Visible front arc
    svg += `  <path d="M ${cx - rx} ${botY} A ${rx} ${ry} 0 0 0 ${cx + rx} ${botY}" fill="none" stroke="#1e293b" stroke-width="2"/>\n`;

    // Cone edges
    svg += `  <line x1="${cx}" y1="${apexY}" x2="${cx - rx}" y2="${botY}" stroke="#1e293b" stroke-width="2"/>\n`;
    svg += `  <line x1="${cx}" y1="${apexY}" x2="${cx + rx}" y2="${botY}" stroke="#1e293b" stroke-width="2"/>\n`;

    // Height internal dashed line
    svg += `  <line x1="${cx}" y1="${apexY}" x2="${cx}" y2="${botY}" stroke="#2563eb" stroke-width="1.5" stroke-dasharray="3,3"/>\n`;
    // Radius dashed line
    svg += `  <line x1="${cx}" y1="${botY}" x2="${cx + rx}" y2="${botY}" stroke="#2563eb" stroke-width="1.5" stroke-dasharray="3,3"/>\n`;

    // Right-angle square
    svg += `  <rect x="${cx}" y="${botY - 8}" width="8" height="8" fill="none" stroke="#2563eb" stroke-width="1"/>\n`;
    svg += `  <circle cx="${cx + 4}" cy="${botY - 4}" r="1" fill="#2563eb"/>\n`;

    svg += `  <text x="${cx - 8}" y="${(apexY + botY) / 2}" fill="#2563eb" font-size="10" font-weight="600" text-anchor="end">${heightLabel}</text>\n`;
    svg += `  <text x="${cx + rx / 2}" y="${botY + 14}" fill="#2563eb" font-size="10" font-weight="600" text-anchor="middle">${radiusLabel}</text>\n`;

  } else if (type === 'esfera') {
    const r = 70;
    const cy = totalHeight / 2;

    // Main circle
    svg += `  <circle cx="${cx}" cy="${cy}" r="${r}" fill="#f8fafc" stroke="#1e293b" stroke-width="2"/>\n`;
    // Equatorial hidden back arc
    svg += `  <path d="M ${cx - r} ${cy} A ${r} ${r * 0.3} 0 0 1 ${cx + r} ${cy}" fill="none" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="4,4"/>\n`;
    // Equatorial front arc
    svg += `  <path d="M ${cx - r} ${cy} A ${r} ${r * 0.3} 0 0 0 ${cx + r} ${cy}" fill="none" stroke="#1e293b" stroke-width="1.5"/>\n`;

    // Radius line from center
    svg += `  <line x1="${cx}" y1="${cy}" x2="${(cx + r * 0.707).toFixed(1)}" y2="${(cy - r * 0.707).toFixed(1)}" stroke="#2563eb" stroke-width="1.8"/>\n`;
    svg += `  <circle cx="${cx}" cy="${cy}" r="2.5" fill="#2563eb"/>\n`;
    svg += `  <text x="${cx + 12}" y="${cy - 20}" fill="#2563eb" font-size="11" font-weight="600">${radiusLabel}</text>\n`;
  }

  svg += `</svg>`;
  return svg;
}

export interface BoxPlotOptions {
  min?: number;
  q1?: number;
  median?: number;
  q3?: number;
  max?: number;
  outliers?: number[];
  label?: string;
  width?: number;
  height?: number;
}

export function generateBoxPlotSVG(options: BoxPlotOptions = {}): string {
  const {
    min = 10,
    q1 = 25,
    median = 40,
    q3 = 60,
    max = 85,
    outliers = [],
    label = 'Distribuição de Frequências (Amostra A)',
    width = 360,
    height = 140
  } = options;

  const pad = 35;
  const plotW = width - 2 * pad;
  const axisY = height - 35;
  const boxY = 45;
  const boxH = 40;

  const scaleMin = Math.floor(Math.min(min, ...outliers, 0) / 10) * 10;
  const scaleMax = Math.ceil(Math.max(max, ...outliers, 100) / 10) * 10;

  const toPx = (v: number) => pad + ((v - scaleMin) / (scaleMax - scaleMin)) * plotW;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" style="background:#ffffff; font-family:'Segoe UI',sans-serif;">\n`;

  // Title
  svg += `  <text x="${width / 2}" y="22" fill="#1e293b" font-size="11" font-weight="700" text-anchor="middle">${label}</text>\n`;

  // Scale Axis
  svg += `  <line x1="${pad}" y1="${axisY}" x2="${width - pad}" y2="${axisY}" stroke="#64748b" stroke-width="1.2"/>\n`;
  for (let val = scaleMin; val <= scaleMax; val += 20) {
    const px = toPx(val);
    svg += `  <line x1="${px.toFixed(1)}" y1="${axisY}" x2="${px.toFixed(1)}" y2="${axisY + 4}" stroke="#64748b" stroke-width="1.2"/>\n`;
    svg += `  <text x="${px.toFixed(1)}" y="${axisY + 16}" fill="#475569" font-size="9" text-anchor="middle">${val}</text>\n`;
  }

  const pxMin = toPx(min);
  const pxQ1 = toPx(q1);
  const pxMed = toPx(median);
  const pxQ3 = toPx(q3);
  const pxMax = toPx(max);
  const midY = boxY + boxH / 2;

  // Whiskers
  svg += `  <line x1="${pxMin.toFixed(1)}" y1="${midY}" x2="${pxQ1.toFixed(1)}" y2="${midY}" stroke="#1e293b" stroke-width="1.8"/>\n`;
  svg += `  <line x1="${pxQ3.toFixed(1)}" y1="${midY}" x2="${pxMax.toFixed(1)}" y2="${midY}" stroke="#1e293b" stroke-width="1.8"/>\n`;

  // Whisker ends
  svg += `  <line x1="${pxMin.toFixed(1)}" y1="${boxY + 8}" x2="${pxMin.toFixed(1)}" y2="${boxY + boxH - 8}" stroke="#1e293b" stroke-width="1.8"/>\n`;
  svg += `  <line x1="${pxMax.toFixed(1)}" y1="${boxY + 8}" x2="${pxMax.toFixed(1)}" y2="${boxY + boxH - 8}" stroke="#1e293b" stroke-width="1.8"/>\n`;

  // IQR Box
  svg += `  <rect x="${pxQ1.toFixed(1)}" y="${boxY}" width="${(pxQ3 - pxQ1).toFixed(1)}" height="${boxH}" fill="#e0f2fe" stroke="#0284c7" stroke-width="1.8"/>\n`;

  // Median line
  svg += `  <line x1="${pxMed.toFixed(1)}" y1="${boxY}" x2="${pxMed.toFixed(1)}" y2="${boxY + boxH}" stroke="#b91c1c" stroke-width="2.5"/>\n`;

  // Outliers
  for (const out of outliers) {
    const px = toPx(out);
    svg += `  <circle cx="${px.toFixed(1)}" cy="${midY}" r="3.5" fill="none" stroke="#ef4444" stroke-width="2"/>\n`;
  }

  svg += `</svg>`;
  return svg;
}

export interface HistogramOptions {
  bins?: Array<{ label: string; value: number }>;
  xLabel?: string;
  yLabel?: string;
  width?: number;
  height?: number;
}

export function generateHistogramSVG(options: HistogramOptions = {}): string {
  const {
    bins = [
      { label: '[0, 2)', value: 4 },
      { label: '[2, 4)', value: 9 },
      { label: '[4, 6)', value: 16 },
      { label: '[6, 8)', value: 11 },
      { label: '[8, 10]', value: 5 }
    ],
    xLabel = 'Intervalo de Classes',
    yLabel = 'Frequência Absoluta',
    width = 360,
    height = 200
  } = options;

  const padLeft = 40;
  const padRight = 20;
  const padTop = 25;
  const padBottom = 40;

  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const maxVal = Math.max(...bins.map(b => b.value), 1);
  const barW = plotW / bins.length;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" style="background:#ffffff; font-family:'Segoe UI',sans-serif;">\n`;

  // Axes
  svg += `  <line x1="${padLeft}" y1="${padTop}" x2="${padLeft}" y2="${height - padBottom}" stroke="#1e293b" stroke-width="1.5"/>\n`;
  svg += `  <line x1="${padLeft}" y1="${height - padBottom}" x2="${width - padRight}" y2="${height - padBottom}" stroke="#1e293b" stroke-width="1.5"/>\n`;

  // Y Axis ticks & grid
  const yTicks = 4;
  for (let i = 0; i <= yTicks; i++) {
    const val = Math.round((i / yTicks) * maxVal);
    const y = height - padBottom - (i / yTicks) * plotH;
    svg += `  <line x1="${padLeft}" y1="${y.toFixed(1)}" x2="${width - padRight}" y2="${y.toFixed(1)}" stroke="#f1f5f9" stroke-width="1"/>\n`;
    svg += `  <text x="${padLeft - 6}" y="${(y + 3).toFixed(1)}" fill="#64748b" font-size="9" text-anchor="end">${val}</text>\n`;
  }

  // Bars
  bins.forEach((b, i) => {
    const x = padLeft + i * barW;
    const h = (b.value / maxVal) * plotH;
    const y = height - padBottom - h;

    svg += `  <rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${(barW - 2).toFixed(1)}" height="${h.toFixed(1)}" fill="#38bdf8" stroke="#0284c7" stroke-width="1.2"/>\n`;
    svg += `  <text x="${(x + barW / 2).toFixed(1)}" y="${(y - 4).toFixed(1)}" fill="#0369a1" font-size="9" font-weight="700" text-anchor="middle">${b.value}</text>\n`;
    svg += `  <text x="${(x + barW / 2).toFixed(1)}" y="${height - padBottom + 14}" fill="#475569" font-size="8.5" text-anchor="middle">${b.label}</text>\n`;
  });

  // Labels
  svg += `  <text x="${width / 2}" y="${height - 8}" fill="#1e293b" font-size="10" font-weight="600" text-anchor="middle">${xLabel}</text>\n`;
  svg += `  <text x="${padLeft - 8}" y="${padTop - 8}" fill="#1e293b" font-size="10" font-weight="600" text-anchor="end">${yLabel}</text>\n`;

  svg += `</svg>`;
  return svg;
}
