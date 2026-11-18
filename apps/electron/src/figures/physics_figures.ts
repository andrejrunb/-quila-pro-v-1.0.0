/**
 * Áquila Pro v2.2 — Gerador Paramétrico de Figuras de Física para Avaliações A4
 * apps/electron/src/figures/physics_figures.ts
 *
 * Gráficos vetoriais 100% determinísticos baseados em equações exatas da Óptica Gaussiana e Mecânica Clássica.
 * Zero dependências externas, pronto para impressão 300 DPI.
 */

export interface RayDiagramOptions {
  f?: number;       // Distância focal (cm). > 0 para lente convergente, < 0 para divergente
  p?: number;       // Distância do objeto ao centro óptico (cm)
  hObj?: number;    // Altura do objeto (cm)
  width?: number;
  height?: number;
  showRays?: boolean;
}

export function generateRayDiagramSVG(options: RayDiagramOptions = {}): string {
  const {
    f = 4,
    p = 8,
    hObj = 2.5,
    width = 440,
    height = 240,
    showRays = true
  } = options;

  const centerY = height / 2;
  const centerX = width / 2;

  // Escala dinâmica de pixels por cm
  const maxSpanCm = Math.max(Math.abs(f) * 2.5, p * 1.3, 10);
  const pxPerCm = (width * 0.42) / maxSpanCm;

  // Posições dos focos e antiprincipais
  const fPx = f * pxPerCm;
  const F1_x = centerX - fPx; // Foco objeto (lente convergente)
  const F2_x = centerX + fPx; // Foco imagem (lente convergente)
  const A1_x = centerX - 2 * fPx;
  const A2_x = centerX + 2 * fPx;

  // Equação de Gauss: 1/f = 1/p + 1/p' => p' = (f * p) / (p - f)
  const denom = p - f;
  const isInfinite = Math.abs(denom) < 0.001;
  const pPrime = isInfinite ? Infinity : (f * p) / denom;
  const magnification = isInfinite ? 0 : -pPrime / p;
  const hImg = isInfinite ? 0 : hObj * magnification;

  const objX = centerX - p * pxPerCm;
  const objTopY = centerY - hObj * pxPerCm;

  const isReal = pPrime > 0;
  const imgX = isInfinite ? 0 : centerX + pPrime * pxPerCm;
  const imgTopY = isInfinite ? 0 : centerY - hImg * pxPerCm;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" style="background:#ffffff; font-family:'Segoe UI',sans-serif;">\n`;
  svg += `  <defs>\n`;
  svg += `    <marker id="arrow-axis" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">\n`;
  svg += `      <path d="M 0 2 L 7 5 L 0 8 z" fill="#475569"/>\n`;
  svg += `    </marker>\n`;
  svg += `    <marker id="ray-arrow-red" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto">\n`;
  svg += `      <path d="M 0 2 L 8 5 L 0 8 z" fill="#dc2626"/>\n`;
  svg += `    </marker>\n`;
  svg += `    <marker id="ray-arrow-blue" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto">\n`;
  svg += `      <path d="M 0 2 L 8 5 L 0 8 z" fill="#2563eb"/>\n`;
  svg += `    </marker>\n`;
  svg += `  </defs>\n`;

  // Eixo Principal
  svg += `  <!-- Eixo Principal -->\n`;
  svg += `  <line x1="20" y1="${centerY}" x2="${width - 20}" y2="${centerY}" stroke="#475569" stroke-width="1.4" marker-end="url(#arrow-axis)"/>\n`;

  // Lente Delgada (Convergente: pontas de seta para fora)
  svg += `  <!-- Lente Delgada no Centro Óptico O -->\n`;
  svg += `  <line x1="${centerX}" y1="20" x2="${centerX}" y2="${height - 20}" stroke="#0f172a" stroke-width="2.2"/>\n`;
  // Pontas de seta da lente biconvexa
  svg += `  <polyline fill="none" stroke="#0f172a" stroke-width="2.2" stroke-linecap="round" points="${centerX - 6},30 ${centerX},20 ${centerX + 6},30"/>\n`;
  svg += `  <polyline fill="none" stroke="#0f172a" stroke-width="2.2" stroke-linecap="round" points="${centerX - 6},${height - 30} ${centerX},${height - 20} ${centerX + 6},${height - 30}"/>\n`;
  svg += `  <text x="${centerX + 8}" y="${centerY - 8}" fill="#0f172a" font-size="11" font-weight="700">O</text>\n`;

  // Pontos Notáveis: F1, F2, A1, A2
  const notaveis = [
    { x: F1_x, label: 'F' },
    { x: F2_x, label: "F'" },
    { x: A1_x, label: 'A' },
    { x: A2_x, label: "A'" }
  ];
  for (const n of notaveis) {
    if (n.x >= 20 && n.x <= width - 20) {
      svg += `  <circle cx="${n.x.toFixed(1)}" cy="${centerY}" r="2.5" fill="#0f172a"/>\n`;
      svg += `  <text x="${n.x.toFixed(1)}" y="${centerY + 16}" fill="#0f172a" font-size="10" font-weight="700" text-anchor="middle">${n.label}</text>\n`;
    }
  }

  // Objeto Real (Seta vertical verde)
  svg += `  <!-- Objeto Real -->\n`;
  svg += `  <line x1="${objX.toFixed(1)}" y1="${centerY}" x2="${objX.toFixed(1)}" y2="${objTopY.toFixed(1)}" stroke="#16a34a" stroke-width="2.8"/>\n`;
  svg += `  <polygon points="${objX - 4},${objTopY + 7} ${objX},${objTopY} ${objX + 4},${objTopY + 7}" fill="#16a34a"/>\n`;
  svg += `  <text x="${objX.toFixed(1)}" y="${objTopY - 6}" fill="#16a34a" font-size="10" font-weight="700" text-anchor="middle">Objeto</text>\n`;

  // Raios Notáveis
  if (showRays && !isInfinite) {
    // Raio 1 (Vermelho): Paralelo ao eixo principal até a lente, refrata passando por F'
    svg += `  <!-- Raio 1: Paralelo refrata no foco imagem F' -->\n`;
    svg += `  <line x1="${objX.toFixed(1)}" y1="${objTopY.toFixed(1)}" x2="${centerX}" y2="${objTopY.toFixed(1)}" stroke="#dc2626" stroke-width="1.6"/>\n`;
    
    // Reta que passa por (centerX, objTopY) e (F2_x, centerY)
    const slope1 = (centerY - objTopY) / (F2_x - centerX);
    const endX1 = Math.min(width - 25, isReal ? imgX + 30 : width - 25);
    const endY1 = objTopY + slope1 * (endX1 - centerX);
    svg += `  <line x1="${centerX}" y1="${objTopY.toFixed(1)}" x2="${endX1.toFixed(1)}" y2="${endY1.toFixed(1)}" stroke="#dc2626" stroke-width="1.6" marker-mid="url(#ray-arrow-red)"/>\n`;

    // Prolongamento virtual se imagem for virtual
    if (!isReal) {
      svg += `  <line x1="${centerX}" y1="${objTopY.toFixed(1)}" x2="${imgX.toFixed(1)}" y2="${imgTopY.toFixed(1)}" stroke="#dc2626" stroke-width="1.3" stroke-dasharray="3,3"/>\n`;
    }

    // Raio 2 (Azul): Passa pelo Centro Óptico O sem sofrer desvio
    svg += `  <!-- Raio 2: Passa pelo centro óptico O -->\n`;
    const slope2 = (centerY - objTopY) / (centerX - objX);
    const endX2 = Math.min(width - 25, isReal ? imgX + 30 : width - 25);
    const endY2 = centerY + slope2 * (endX2 - centerX);
    svg += `  <line x1="${objX.toFixed(1)}" y1="${objTopY.toFixed(1)}" x2="${endX2.toFixed(1)}" y2="${endY2.toFixed(1)}" stroke="#2563eb" stroke-width="1.6"/>\n`;

    if (!isReal) {
      svg += `  <line x1="${centerX}" y1="${centerY}" x2="${imgX.toFixed(1)}" y2="${imgTopY.toFixed(1)}" stroke="#2563eb" stroke-width="1.3" stroke-dasharray="3,3"/>\n`;
    }
  }

  // Imagem Conjugada
  if (!isInfinite && imgX >= 25 && imgX <= width - 25) {
    const isVirtual = !isReal;
    const strokeDash = isVirtual ? `stroke-dasharray="4,4"` : '';
    svg += `  <!-- Imagem Conjugada (${isReal ? 'Real/Invertida' : 'Virtual/Direita'}) -->\n`;
    svg += `  <line x1="${imgX.toFixed(1)}" y1="${centerY}" x2="${imgX.toFixed(1)}" y2="${imgTopY.toFixed(1)}" stroke="#9333ea" stroke-width="2.5" ${strokeDash}/>\n`;
    if (imgTopY > centerY) {
      // Invertida
      svg += `  <polygon points="${imgX - 4},${imgTopY - 7} ${imgX},${imgTopY} ${imgX + 4},${imgTopY - 7}" fill="#9333ea"/>\n`;
      svg += `  <text x="${imgX.toFixed(1)}" y="${imgTopY + 14}" fill="#9333ea" font-size="10" font-weight="700" text-anchor="middle">Imagem (${isReal ? 'Real' : 'Virtual'})</text>\n`;
    } else {
      // Direita
      svg += `  <polygon points="${imgX - 4},${imgTopY + 7} ${imgX},${imgTopY} ${imgX + 4},${imgTopY + 7}" fill="#9333ea"/>\n`;
      svg += `  <text x="${imgX.toFixed(1)}" y="${imgTopY - 6}" fill="#9333ea" font-size="10" font-weight="700" text-anchor="middle">Imagem (${isReal ? 'Real' : 'Virtual'})</text>\n`;
    }
  }

  svg += `</svg>`;
  return svg;
}

export interface InclinedPlaneOptions {
  angleDeg?: number;
  massKg?: number;
  width?: number;
  height?: number;
  showForces?: boolean;
}

export function generateInclinedPlaneSVG(options: InclinedPlaneOptions = {}): string {
  const {
    angleDeg = 30,
    width = 380,
    height = 240,
    showForces = true
  } = options;

  const rad = (angleDeg * Math.PI) / 180;
  const pad = 35;
  const baseX1 = pad;
  const baseY = height - pad;
  const planeLength = 260;

  const baseX2 = baseX1 + planeLength * Math.cos(rad);
  const topX = baseX1 + planeLength * Math.cos(rad);
  const topY = baseY - planeLength * Math.sin(rad);

  // Bloco no meio do plano
  const s = 0.55; // Posição ao longo do plano
  const blockCx = baseX1 + (planeLength * s) * Math.cos(rad);
  const blockCy = baseY - (planeLength * s) * Math.sin(rad);

  const bw = 45;
  const bh = 30;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" style="background:#ffffff; font-family:'Segoe UI',sans-serif;">\n`;
  svg += `  <defs>\n`;
  svg += `    <marker id="force-arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto">\n`;
  svg += `      <path d="M 0 2 L 7 5 L 0 8 z" fill="#dc2626"/>\n`;
  svg += `    </marker>\n`;
  svg += `    <marker id="force-blue" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto">\n`;
  svg += `      <path d="M 0 2 L 7 5 L 0 8 z" fill="#2563eb"/>\n`;
  svg += `    </marker>\n`;
  svg += `  </defs>\n`;

  // Cunha do plano inclinado
  svg += `  <polygon points="${baseX1},${baseY} ${topX},${baseY} ${topX},${topY}" fill="#f1f5f9" stroke="#334155" stroke-width="2"/>\n`;

  // Arco do ângulo θ
  const arcR = 40;
  const arcX = baseX1 + arcR * Math.cos(rad);
  const arcY = baseY - arcR * Math.sin(rad);
  svg += `  <path d="M ${baseX1 + arcR} ${baseY} A ${arcR} ${arcR} 0 0 0 ${arcX.toFixed(1)} ${arcY.toFixed(1)}" fill="none" stroke="#2563eb" stroke-width="1.8"/>\n`;
  svg += `  <text x="${baseX1 + arcR + 12}" y="${baseY - 8}" fill="#2563eb" font-size="12" font-weight="bold">θ = ${angleDeg}°</text>\n`;

  // Bloco rotacionado
  svg += `  <g transform="translate(${blockCx.toFixed(1)}, ${blockCy.toFixed(1)}) rotate(${-angleDeg})">\n`;
  svg += `    <rect x="${-bw / 2}" y="${-bh}" width="${bw}" height="${bh}" fill="#bae6fd" stroke="#0284c7" stroke-width="2"/>\n`;
  svg += `    <text x="0" y="${-bh / 2 + 4}" fill="#0369a1" font-size="10" font-weight="bold" text-anchor="middle">m</text>\n`;
  svg += `  </g>\n`;

  // Diagrama de Forças
  if (showForces) {
    const centerBlockX = blockCx - (bh / 2) * Math.sin(rad);
    const centerBlockY = blockCy - (bh / 2) * Math.cos(rad);

    // Peso P (Vertical para baixo)
    const pLen = 65;
    svg += `  <!-- Peso P -->\n`;
    svg += `  <line x1="${centerBlockX.toFixed(1)}" y1="${centerBlockY.toFixed(1)}" x2="${centerBlockX.toFixed(1)}" y2="${(centerBlockY + pLen).toFixed(1)}" stroke="#dc2626" stroke-width="2" marker-end="url(#force-arrow)"/>\n`;
    svg += `  <text x="${centerBlockX + 8}" y="${centerBlockY + pLen + 4}" fill="#dc2626" font-size="11" font-weight="bold">P = m·g</text>\n`;

    // Normal N (Perpendicular à rampa)
    const nLen = pLen * Math.cos(rad);
    const nx = centerBlockX - nLen * Math.sin(rad);
    const ny = centerBlockY - nLen * Math.cos(rad);
    svg += `  <!-- Normal N -->\n`;
    svg += `  <line x1="${centerBlockX.toFixed(1)}" y1="${centerBlockY.toFixed(1)}" x2="${nx.toFixed(1)}" y2="${ny.toFixed(1)}" stroke="#2563eb" stroke-width="2" marker-end="url(#force-blue)"/>\n`;
    svg += `  <text x="${nx - 8}" y="${ny - 4}" fill="#2563eb" font-size="11" font-weight="bold" text-anchor="end">N</text>\n`;

    // Força de atrito Fat (Paralela à rampa subindo)
    const fatLen = 40;
    const fatX = centerBlockX + fatLen * Math.cos(rad);
    const fatY = centerBlockY - fatLen * Math.sin(rad);
    svg += `  <!-- Atrito Fat -->\n`;
    svg += `  <line x1="${centerBlockX.toFixed(1)}" y1="${centerBlockY.toFixed(1)}" x2="${fatX.toFixed(1)}" y2="${fatY.toFixed(1)}" stroke="#d97706" stroke-width="1.8"/>\n`;
    svg += `  <text x="${fatX + 6}" y="${fatY - 6}" fill="#d97706" font-size="10" font-weight="bold">Fat</text>\n`;
  }

  svg += `</svg>`;
  return svg;
}

export interface CircuitOptions {
  voltage?: number;
  r1?: number;
  r2?: number;
  width?: number;
  height?: number;
}

export function generateElectricCircuitSVG(options: CircuitOptions = {}): string {
  const {
    voltage = 12,
    r1 = 4,
    r2 = 6,
    width = 360,
    height = 200
  } = options;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" style="background:#ffffff; font-family:'Segoe UI',sans-serif;">\n`;

  const left = 50;
  const right = 310;
  const top = 40;
  const bottom = 160;

  // Circuito retangular
  svg += `  <!-- Fios condutores -->\n`;
  svg += `  <line x1="${left}" y1="${top}" x2="${120}" y2="${top}" stroke="#1e293b" stroke-width="2"/>\n`;
  svg += `  <line x1="${240}" y1="${top}" x2="${right}" y2="${top}" stroke="#1e293b" stroke-width="2"/>\n`;
  svg += `  <line x1="${right}" y1="${top}" x2="${right}" y2="${bottom}" stroke="#1e293b" stroke-width="2"/>\n`;
  svg += `  <line x1="${right}" y1="${bottom}" x2="${left}" y2="${bottom}" stroke="#1e293b" stroke-width="2"/>\n`;
  svg += `  <line x1="${left}" y1="${bottom}" x2="${left}" y2="${115}" stroke="#1e293b" stroke-width="2"/>\n`;
  svg += `  <line x1="${left}" y1="${85}" x2="${left}" y2="${top}" stroke="#1e293b" stroke-width="2"/>\n`;

  // Fonte de Tensão (Bateria no ramo esquerdo)
  svg += `  <!-- Bateria V = ${voltage} V -->\n`;
  svg += `  <line x1="${left - 18}" y1="85" x2="${left + 18}" y2="85" stroke="#1e293b" stroke-width="3"/>\n`; // Placa positiva (longa)
  svg += `  <line x1="${left - 10}" y1="115" x2="${left + 10}" y2="115" stroke="#1e293b" stroke-width="4.5"/>\n`; // Placa negativa (curta)
  svg += `  <text x="${left - 24}" y="80" fill="#dc2626" font-size="12" font-weight="bold">+</text>\n`;
  svg += `  <text x="${left - 24}" y="125" fill="#2563eb" font-size="14" font-weight="bold">−</text>\n`;
  svg += `  <text x="${left - 30}" y="103" fill="#1e293b" font-size="11" font-weight="bold" text-anchor="end">${voltage} V</text>\n`;

  // Resistor R1 (Zig-zag no topo)
  svg += `  <!-- Resistor R1 -->\n`;
  const rx1 = 120;
  svg += `  <polyline fill="none" stroke="#2563eb" stroke-width="2.5" stroke-linecap="round" points="${rx1},${top} ${rx1 + 10},${top - 12} ${rx1 + 30},${top + 12} ${rx1 + 50},${top - 12} ${rx1 + 70},${top + 12} ${rx1 + 90},${top - 12} ${rx1 + 100},${top} ${rx1 + 120},${top}"/>\n`;
  svg += `  <text x="${rx1 + 60}" y="${top - 18}" fill="#2563eb" font-size="11" font-weight="bold" text-anchor="middle">R₁ = ${r1} Ω</text>\n`;

  // Resistor R2 (Ramo direito)
  const ry1 = 70;
  svg += `  <!-- Resistor R2 -->\n`;
  svg += `  <polyline fill="none" stroke="#16a34a" stroke-width="2.5" stroke-linecap="round" points="${right},${ry1} ${right - 10},${ry1 + 10} ${right + 10},${ry1 + 25} ${right - 10},${ry1 + 40} ${right + 10},${ry1 + 55} ${right},${ry1 + 65}"/>\n`;
  svg += `  <text x="${right + 16}" y="${ry1 + 38}" fill="#16a34a" font-size="11" font-weight="bold">R₂ = ${r2} Ω</text>\n`;

  // Sentido da Corrente Elétrica
  svg += `  <!-- Corrente Elétrica i -->\n`;
  svg += `  <polygon points="${left + 45},${top - 4} ${left + 55},${top} ${left + 45},${top + 4}" fill="#dc2626"/>\n`;
  svg += `  <text x="${left + 50}" y="${top - 8}" fill="#dc2626" font-size="10" font-weight="bold">i</text>\n`;

  svg += `</svg>`;
  return svg;
}
