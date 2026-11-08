/**
 * send_ui_screenshots_to_ais.cjs
 * ============================================================================
 * Conecta ao Chrome logado da usuária (via DevToolsActivePort), envia as
 * screenshots + prompt de UI/UX para as IAs restantes (ChatGPT, DeepSeek,
 * Perplexity, Copilot e Brisk — Claude já recebeu!) e mantém o WebSocket
 * aberto para coletar automaticamente as respostas de todas as 6 IAs!
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const WebSocket = require('ws');

const DEFAULT_CHROME_PORT_FILE = path.join(
  process.env.LOCALAPPDATA || 'C:\\Users\\Thaysa\\AppData\\Local',
  'Google\\Chrome\\User Data\\DevToolsActivePort'
);

const SCREENSHOT_OUT_DIR = path.resolve(__dirname, '../test-results/ui_screenshots_2026_11_08');
const RESPONSES_OUT_DIR = path.resolve(__dirname, '../test-results/ui_screenshots_2026_11_08/ai_responses');
fs.mkdirSync(RESPONSES_OUT_DIR, { recursive: true });

const UI_PAGES_METADATA = [
  { id: '01_admin_executive_cockpit', title: '01. Portal da Direcao (Sovereign Executive Cockpit)' },
  { id: '02_teacher_cockpit_dashboard', title: '02. Portal do Professor (Gestao de Sala & Telemetria)' },
  { id: '03_teacher_schedule_sa_gls', title: '03. Grade Horaria Docente + Otimizador SA+GLS (Zero Janelas)' },
  { id: '04_teacher_ai_studio_tri_pei', title: '04. Estudio Pedagogico IA (Itens TRI 3PL Calibrados + Matriz PEI/AEE DOK 1-4)' },
  { id: '05_coordination_cockpit', title: '05. Portal da Coordenacao Neuro-Pedagogica' },
  { id: '06_secretaria_digital_erp', title: '06. Portal da Secretaria Digital & Dominio Contabil ERP' },
  { id: '07_parent_family_portal', title: '07. Portal da Familia (Roteiros Conversa de Jantar 7 Series + LDB Art. 12 VIII a)' },
  { id: '08_student_rpg_cockpit', title: '08. Portal do Aluno (Jornada Epica RPG & Meu Inicio)' },
  { id: '09_student_cosmetics_chamber', title: '09. Camara de Cosmeticos, Battle Banner 3D & Moeda Aureus' },
  { id: '10_student_mastery_wordwall', title: '10. Camara de Maestria ENEM & Motor Wordwall (8 Estilos Interativos)' }
];

class CdpBrowserClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.msgId = 0;
    this.pending = new Map();
  }

  connect() {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(this.wsUrl, {
        handshakeTimeout: 600000,
        maxPayload: 256 * 1024 * 1024
      });
      this.ws = ws;
      const timer = setTimeout(() => {
        try { ws.close(); } catch {}
        reject(new Error('Timeout conectando ao Chrome CDP WebSocket (600s)'));
      }, 600000);

      ws.on('open', () => {
        clearTimeout(timer);
        resolve();
      });
      ws.on('error', (err) => {
        clearTimeout(timer);
        reject(new Error(err.message || 'Conexao recusada pelo Chrome CDP'));
      });
      ws.on('message', (rawData) => {
        try {
          const data = JSON.parse(rawData.toString());
          if (data.id && this.pending.has(data.id)) {
            const { resolve: res, reject: rej } = this.pending.get(data.id);
            this.pending.delete(data.id);
            if (data.error) rej(new Error(data.error.message));
            else res(data.result);
          }
        } catch {}
      });
    });
  }

  send(method, params = {}, sessionId = undefined, timeoutMs = 15000) {
    return new Promise((resolve, reject) => {
      const id = ++this.msgId;
      const payload = { id, method, params };
      if (sessionId) payload.sessionId = sessionId;

      const timer = setTimeout(() => {
        if (this.pending.has(id)) {
          this.pending.delete(id);
          reject(new Error(`Timeout em ${method}`));
        }
      }, timeoutMs);

      this.pending.set(id, {
        resolve: (res) => {
          clearTimeout(timer);
          resolve(res);
        },
        reject: (err) => {
          clearTimeout(timer);
          reject(err);
        }
      });

      this.ws.send(JSON.stringify(payload));
    });
  }

  close() {
    try { this.ws.close(); } catch {}
  }
}

function getBrowserWsUrl() {
  if (!fs.existsSync(DEFAULT_CHROME_PORT_FILE)) {
    throw new Error(`DevToolsActivePort nao encontrado em ${DEFAULT_CHROME_PORT_FILE}`);
  }
  const lines = fs.readFileSync(DEFAULT_CHROME_PORT_FILE, 'utf-8').trim().split(/\r?\n/);
  const port = parseInt(lines[0], 10);
  const wsPath = lines[1];
  return `ws://127.0.0.1:${port}${wsPath}`;
}

function buildUiAuditPrompt(aiName, specialtyFocus, capturedPaths) {
  const rawBase = 'https://raw.githubusercontent.com/andrejrunb/-quila-pro-v-1.0.0/main/test-results/ui_screenshots_2026_11_08';
  const screenList = capturedPaths
    .map(c => `- \`${c.id}.png\`: ${c.title}\n  Link Direto PNG: ${rawBase}/${c.id}.png`)
    .join('\n');

  return `[AUDITORIA VISUAL DE UI/UX — ÁQUILA PRO DESKTOP & PORTAIS SOBERANOS — 08/11/2026]
[AGENTE CONVOCADO: ${aiName}]
[FOCO DE ESPECIALIDADE: ${specialtyFocus}]

Acabamos de abrir o Áquila Pro Desktop localmente no computador (1920x1080), capturar as 10 telas/portais principais da interface do usuário e disponibilizar os prints (PNG anexados e via links diretos Raw GitHub abaixo) para sua inspeção visual e técnica:

${screenList}

Repositório GitHub (branch \`main\` atualizada até o commit \`7f6cc622\`):
- https://github.com/andrejrunb/-quila-pro-v-1.0.0
- Arquivos de UI principais:
  - \`apps/electron/src/ui/layouts/PortalLayout.tsx\` & \`PortalLayout.css\`
  - \`apps/electron/src/ui/portals/AdminPortal.tsx\`, \`TeacherPortal.tsx\`, \`CoordinationPortal.tsx\`, \`SecretariaPortal.tsx\`, \`ParentPortal.tsx\`, \`StudentPortal.tsx\`
  - \`apps/electron/src/ui/components/StudentRPGPortal.tsx\`, \`StudentCosmeticsChamber.tsx\`, \`WordwallInteractivePlayer.tsx\`
  - \`apps/electron/src/ui/pages/TeacherSchedule.tsx\`, \`TeacherAIStudio.tsx\`

=== RESUMO VISUAL E ESTRUTURAL DAS 10 TELAS CAPTURADAS ===
1. **Top Bar Global (\`PortalLayout.tsx\`)**: Barra superior com badge do portal, tag "Sessão: Usuário (Perfil)", pílulas de alternância de ambiente (\`PROF\`, \`COORD\`, \`DIREÇÃO\`, \`SECRETARIA\`, \`PAIS\`, \`ALUNOS\`), relógio ao vivo e controles de zoom (\`-\`, \`100%\`, \`+\`).
2. **Portal da Direção (\`01_admin_executive_cockpit.png\`)**: Command bar com 9 botões em linha, 4 KPIs (Total de Alunos, Frequência Média, Receita Mensal, NPS), gráficos SVG de curva de receita e barras de presença, matriz de 5 portais e feed lateral de auditoria ao vivo.
3. **Portal do Professor (\`02_teacher_cockpit_dashboard.png\`)**: Filtro de categorias (\`Gestão de Sala\`, \`Aulas & Provas\`, \`BNCC & Gamificação\`, \`Todas\`), 4 KPIs, cronograma operacional do dia com botões rápidos (Mapa, Notas, Chamada, Diário) e radar de atenção em sala.
4. **Grade Horária SA+GLS (\`03_teacher_schedule_sa_gls.png\`)**: Grade semanal Seg-Sex com novo botão "⚡ Otimizar Grade SA+GLS (Zero Janelas)" e banner de resultado com 0 violações hard.
5. **Estúdio Pedagógico IA (\`04_teacher_ai_studio_tri_pei.png\`)**: Estações de criação docente com seletor de Itens Calibrados TRI 3PL (\`ITEM-BNCC-2026-001\` a \`005\`) e Matriz PEI/AEE DOK 1-4.
6. **Portal da Coordenação (\`05_coordination_cockpit.png\`)**: Command bar laranja/âmbar, 4 KPIs (Frequência, Alunos em Atenção, Ocorrências, Média) e gestão de turmas/retenção.
7. **Portal da Secretaria Digital (\`06_secretaria_digital_erp.png\`)**: 11 abas horizontais (\`Visão Geral\`, \`Domínio Contábil & Folha\`, \`Professores\`, \`Gestão de RH\`, \`Matrícula Inteligente\`, \`Importar Matrículas\`, \`Boletins\`, etc.), 4 KPIs esmeralda e cofre de prontuários.
8. **Portal da Família (\`07_parent_family_portal.png\`)**: Seletor "Conversa de Jantar (7 Séries: 6º EF a 3ª EM)", alerta precoce LDB Art. 12, VIII, "a" (30% faltas), portaria segura e prontuário.
9. **Portal do Aluno (\`08_student_rpg_cockpit.png\`)**: Header RPG com foto retangular, barra de XP, 9 botões de ação, bloco triplo "Meu Início" (Continue de onde parou, Para entregar, Feedback do professor), 4 KPIs e Bento Grid de 3 colunas.
10. **Câmara de Cosméticos & Maestria/Wordwall (\`09_student_cosmetics_chamber.png\` & \`10_student_mastery_wordwall.png\`)**: Preview de Battle Banner estilo Clash Royale, catálogo de cosméticos com moeda \`Aureus (🪙)\` e player interativo Wordwall com 8 mecânicas e 5 temas.

=== SUA MISSÃO DE AUDITORIA E REDESIGN UI/UX ===
Analise criticamente as screenshots e a estrutura atual e entregue:
1. **Top 5 Gargalos Visuais e de Usabilidade (Diagnóstico Crítico)**:
   - Onde há sobrecarga cognitiva, excesso de botões na mesma barra, problemas de hierarquia tipográfica, contraste WCAG AAA insuficiente, espaçamento inconsistente ou poluição visual?
2. **Melhorias Específicas por Portal (Direção, Professor, Secretaria, Família e Aluno)**:
   - Como tornar o **Portal do Aluno + Wordwall + Câmara de Cosméticos** ainda mais magnético, fluido e recompensador sem perder o foco pedagógico?
   - Como melhorar a ergonomia visual do **Portal Docente**, **Grade SA+GLS** e **Secretaria Digital** (redução de cliques, agrupamento progressivo, atalhos estilo Linear/Raycast)?
3. **Design Tokens & Micro-interações (Elite Design System)**:
   - Sugestões exatas de paleta de superfície (Dark Slate / Obsidian Glass), bordas luminosas sutis, tipografia tabular (\`font-variant-numeric: tabular-nums\`), estados de \`hover\`/\`focus-visible\` e animações CSS/Framer.
4. **Código Pronto para Aplicação (React / TypeScript / CSS)**:
   - Forneça blocos de código CSS e TSX prontos para copiarmos e aplicarmos imediatamente no repositório.`;
}

const AI_TARGETS = [
  {
    id: 'claude',
    name: 'Claude 3.7 Sonnet (Design System, Hierarquia & WCAG AAA)',
    domains: ['claude.ai'],
    skipSend: true, // Já enviado com sucesso na rodada anterior!
    outputFile: 'claude_ui_ux_audit.md',
    specialtyFocus: 'Arquitetura de Design System Elite, Glassmorphism, Hierarquia Visual, Contraste WCAG AAA e Componentização React/CSS',
    shotIndices: [0, 1, 7, 8],
    inputSelectors: [
      'div.ProseMirror[contenteditable="true"]',
      'fieldset div[contenteditable="true"]',
      'div[contenteditable="true"]'
    ],
    sendSelectors: [
      'button[aria-label*="Send"]',
      'button[aria-label*="Enviar"]',
      'fieldset button:not([disabled])'
    ]
  },
  {
    id: 'chatgpt',
    name: 'ChatGPT 4o / o1 (UX Pedagógico, Gamificação & Jornada Familiar)',
    domains: ['chatgpt.com'],
    skipSend: false,
    outputFile: 'chatgpt_ui_ux_audit.md',
    specialtyFocus: 'UX Pedagógico, Engajamento no Portal do Aluno (Wordwall + Câmara de Cosméticos), Clareza Cognitiva no Portal dos Pais e Estúdio Docente',
    shotIndices: [6, 7, 8, 9],
    inputSelectors: [
      '#prompt-textarea',
      'div#prompt-textarea',
      'div.ProseMirror[contenteditable="true"]',
      'div[contenteditable="true"]',
      'textarea'
    ],
    sendSelectors: [
      'button[data-testid="send-button"]',
      'button[aria-label*="Send"]',
      'button[aria-label*="Enviar"]',
      'form button[type="submit"]'
    ]
  },
  {
    id: 'deepseek',
    name: 'DeepSeek R1 / V3 (Ergonomia de Dados, Dashboards & Grade SA+GLS)',
    domains: ['chat.deepseek.com', 'deepseek.com'],
    skipSend: false,
    outputFile: 'deepseek_ui_ux_audit.md',
    specialtyFocus: 'Densidade de Informação (Data-Ink Ratio de Tufte), Visualização de Telemetria em Tempo Real, Grade Horária SA+GLS e Performance de Renderização',
    shotIndices: [0, 1, 2, 4],
    inputSelectors: [
      'textarea#chat-input',
      'textarea',
      'div[contenteditable="true"]'
    ],
    sendSelectors: [
      'div[role="button"][aria-disabled="false"]',
      'button[type="submit"]'
    ]
  },
  {
    id: 'perplexity',
    name: 'Perplexity Pro (Benchmarks EdTech Globais 2026 & Acessibilidade)',
    domains: ['perplexity.ai'],
    skipSend: false,
    outputFile: 'perplexity_ui_ux_audit.md',
    specialtyFocus: 'Benchmarks Visuais EdTech & SaaS 2026 (Linear, Raycast, Duolingo Max, Wordwall, Kahoot), Acessibilidade Cognitiva (TDAH/Dislexia) e Responsividade',
    shotIndices: [1, 5, 7, 9],
    inputSelectors: [
      'textarea[placeholder]',
      'div[contenteditable="true"]',
      'textarea'
    ],
    sendSelectors: [
      'button[aria-label*="Submit"]',
      'button[aria-label*="Send"]',
      'button[type="submit"]'
    ]
  },
  {
    id: 'copilot',
    name: 'GitHub / Microsoft Copilot (Refatoração CSS, Micro-interações & Layout)',
    domains: ['github.com/copilot', 'copilot.microsoft.com'],
    skipSend: false,
    outputFile: 'copilot_ui_ux_audit.md',
    specialtyFocus: 'Refatoração de CSS Grid/Flexbox, Eliminação de Inline Styles, Estados de Hover/Focus, Atalhos de Teclado e Polimento de Componentes React',
    shotIndices: [0, 2, 5, 8],
    inputSelectors: [
      'textarea#userInput',
      'textarea[placeholder]',
      'textarea',
      'div[contenteditable="true"]'
    ],
    sendSelectors: [
      'button[aria-label*="Submit"]',
      'button[aria-label*="Send"]',
      'button[type="submit"]'
    ]
  },
  {
    id: 'brisk',
    name: 'Brisk Next / Brisk Teaching (UX Docente, PEI/AEE & Devolutivas)',
    domains: ['app.briskteaching.com', 'briskteaching.com'],
    skipSend: false,
    outputFile: 'brisk_ui_ux_audit.md',
    specialtyFocus: 'Fluxo de Trabalho Docente em 1 Clique, Estúdio Pedagógico IA, Diferenciação Visual PEI/AEE (DOK 1-4) e Rubricas Formativas',
    shotIndices: [1, 3, 4, 6],
    inputSelectors: [
      'textarea',
      'div[contenteditable="true"]',
      'input[type="text"]'
    ],
    sendSelectors: [
      'button[type="submit"]',
      'button[aria-label*="Send"]',
      'button[aria-label*="Generate"]'
    ]
  }
];

async function attachScreenshotsAndSendToAiTab(client, targetInfo, aiConfig, capturedPaths) {
  const { sessionId } = await client.send('Target.attachToTarget', {
    targetId: targetInfo.targetId,
    flatten: true
  });

  try {
    await client.send('Page.bringToFront', {}, sessionId, 5000);
    await new Promise(r => setTimeout(r, 700));
  } catch {}

  const selectedCaptures = (aiConfig.shotIndices || [0, 1, 7, 8])
    .map(idx => capturedPaths[idx])
    .filter(Boolean);
  const selectedFilePaths = selectedCaptures.map(c => c.filePath);

  let attachedMethod = 'GITHUB_RAW_LINKS';

  // Tenta anexar via <input type="file"> (rápido, sem serializar base64 gigante)
  try {
    await client.send('DOM.enable', {}, sessionId, 5000);
    const { root } = await client.send('DOM.getDocument', { depth: 3, pierce: true }, sessionId, 5000);
    const { nodeIds } = await client.send('DOM.querySelectorAll', {
      nodeId: root.nodeId,
      selector: 'input[type="file"]'
    }, sessionId, 5000);

    if (nodeIds && nodeIds.length > 0) {
      const targetNodeId = nodeIds[nodeIds.length - 1];
      await client.send('DOM.setFileInputFiles', {
        nodeId: targetNodeId,
        files: selectedFilePaths
      }, sessionId, 8000);

      await client.send('Runtime.evaluate', {
        expression: `
          (function() {
            const inputs = document.querySelectorAll('input[type="file"]');
            const inp = inputs[inputs.length - 1];
            if (inp) {
              inp.dispatchEvent(new Event('change', { bubbles: true }));
              return true;
            }
            return false;
          })()
        `,
        returnByValue: true
      }, sessionId, 5000);

      attachedMethod = `DOM.setFileInputFiles (${selectedFilePaths.length} PNGs)`;
      await new Promise(r => setTimeout(r, 1500));
    }
  } catch {}

  const promptText = buildUiAuditPrompt(aiConfig.name, aiConfig.specialtyFocus, capturedPaths);

  const insertExpr = `
    (function() {
      const selectors = ${JSON.stringify(aiConfig.inputSelectors)};
      const text = ${JSON.stringify(promptText)};
      for (const sel of selectors) {
        const el = document.querySelector(sel);
        if (el) {
          el.focus();
          if (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT') {
            const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set;
            if (setter) setter.call(el, text);
            else el.value = text;
            el.dispatchEvent(new Event('input', { bubbles: true }));
            return { found: true, fastInserted: true, selector: sel };
          } else if (el.isContentEditable) {
            el.innerHTML = '';
            const ok = document.execCommand && document.execCommand('insertText', false, text);
            if (!ok || !el.innerText.trim()) {
              el.innerText = text;
              el.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: text }));
            }
            return { found: true, fastInserted: true, selector: sel };
          }
        }
      }
      return { found: false };
    })()
  `;

  const focusRes = await client.send('Runtime.evaluate', {
    expression: insertExpr,
    returnByValue: true
  }, sessionId, 10000);

  const focusInfo = focusRes?.result?.value || { found: false };
  if (!focusInfo.found) {
    return { ai: aiConfig.name, status: 'INPUT_NOT_FOUND', attachedMethod };
  }

  if (!focusInfo.fastInserted) {
    await client.send('Input.insertText', { text: promptText }, sessionId, 10000);
  }

  await new Promise(r => setTimeout(r, 1000));

  const submitExpr = `
    (function() {
      const sendSels = ${JSON.stringify(aiConfig.sendSelectors)};
      for (const sel of sendSels) {
        const btn = document.querySelector(sel);
        if (btn && !btn.disabled && btn.getAttribute('aria-disabled') !== 'true') {
          btn.click();
          return { clicked: true, selector: sel };
        }
      }
      return { clicked: false };
    })()
  `;

  const subRes = await client.send('Runtime.evaluate', {
    expression: submitExpr,
    returnByValue: true
  }, sessionId, 8000);

  let submitted = Boolean(subRes?.result?.value?.clicked);
  if (!submitted) {
    await client.send('Input.dispatchKeyEvent', {
      type: 'keyDown',
      key: 'Enter',
      code: 'Enter',
      windowsVirtualKeyCode: 13,
      nativeVirtualKeyCode: 13
    }, sessionId, 5000);
    await client.send('Input.dispatchKeyEvent', {
      type: 'keyUp',
      key: 'Enter',
      code: 'Enter',
      windowsVirtualKeyCode: 13,
      nativeVirtualKeyCode: 13
    }, sessionId, 5000);
    submitted = true;
  }

  return {
    ai: aiConfig.name,
    url: targetInfo.url,
    attachedMethod,
    status: submitted ? 'SCREENSHOTS_AND_PROMPT_SENT' : 'READY_IN_COMPOSER'
  };
}

async function collectResponseFromTab(client, targetId) {
  const { sessionId } = await client.send('Target.attachToTarget', {
    targetId,
    flatten: true
  });

  const collectExpr = `
    (function() {
      const candidateSelectors = [
        '[data-message-author-role="assistant"]',
        '.font-claude-message',
        '[data-is-streaming]',
        '.ds-markdown',
        '.prose',
        '.markdown-body',
        'article',
        'main'
      ];
      for (const sel of candidateSelectors) {
        const nodes = Array.from(document.querySelectorAll(sel));
        if (nodes.length > 0) {
          const lastNode = nodes[nodes.length - 1];
          const text = (lastNode.innerText || '').trim();
          if (text.length > 100) {
            return { collected: true, selector: sel, length: text.length, content: text };
          }
        }
      }
      const bodyText = (document.body?.innerText || '').trim();
      return { collected: bodyText.length > 100, selector: 'body', length: bodyText.length, content: bodyText };
    })()
  `;

  const res = await client.send('Runtime.evaluate', {
    expression: collectExpr,
    returnByValue: true
  }, sessionId, 10000);

  return res?.result?.value || { collected: false, length: 0, content: '' };
}

async function collectAllResponses(client, label) {
  const { targetInfos } = await client.send('Target.getTargets');
  const pageTargets = targetInfos.filter(t => t.type === 'page');
  const summary = [];

  for (const aiConfig of AI_TARGETS) {
    const matchingTab = pageTargets.find(t =>
      aiConfig.domains.some(d => (t.url || '').toLowerCase().includes(d))
    );
    if (!matchingTab) continue;
    try {
      const col = await collectResponseFromTab(client, matchingTab.targetId);
      if (col.collected && col.content) {
        const outPath = path.join(RESPONSES_OUT_DIR, aiConfig.outputFile);
        fs.writeFileSync(outPath, col.content, 'utf-8');
        summary.push(`${aiConfig.id}: ${(col.length / 1024).toFixed(1)} KB`);
      }
    } catch {}
  }

  console.log(`[UI-AUDIT-COLLECT ${new Date().toISOString()}] (${label}) -> ${summary.join(' | ') || 'aguardando'}`);
  return summary;
}

async function main() {
  const capturedPaths = UI_PAGES_METADATA.map(item => ({
    ...item,
    filePath: path.join(SCREENSHOT_OUT_DIR, `${item.id}.png`)
  })).filter(c => fs.existsSync(c.filePath));

  const wsUrl = getBrowserWsUrl();
  console.log(`[CDP] Conectando ao Chrome da usuária (${wsUrl})...`);
  console.log(`      >>> Clique em "Allow" na janelinha do Chrome para concluir as 5 IAs restantes e ativar a coleta! <<<`);
  const client = new CdpBrowserClient(wsUrl);
  while (true) {
    try {
      await client.connect();
      break;
    } catch (err) {
      console.log(`[CDP] Aguardando clique em "Allow" no Chrome (${err.message})... reconectando em 3s...`);
      await sleep(3000);
    }
  }

  const { targetInfos } = await client.send('Target.getTargets');
  const pageTargets = targetInfos.filter(t => t.type === 'page');

  const results = [];
  for (const aiConfig of AI_TARGETS) {
    if (aiConfig.skipSend) {
      results.push({ ai: aiConfig.name, status: 'ALREADY_SENT_OK', attachedMethod: 'DOM.setFileInputFiles (4 PNGs)' });
      continue;
    }

    const matchingTab = pageTargets.find(t =>
      aiConfig.domains.some(d => (t.url || '').toLowerCase().includes(d))
    );

    if (!matchingTab) {
      results.push({ ai: aiConfig.name, status: 'TAB_NOT_FOUND', attachedMethod: '-' });
      continue;
    }

    try {
      console.log(`  -> Enviando screenshots + prompt de UI/UX para ${aiConfig.name}...`);
      const res = await attachScreenshotsAndSendToAiTab(client, matchingTab, aiConfig, capturedPaths);
      results.push(res);
      console.log(`     Status: ${res.status} | Anexo: ${res.attachedMethod}`);
    } catch (err) {
      console.warn(`     [WARN] Erro em ${aiConfig.name}: ${err.message}`);
      results.push({ ai: aiConfig.name, status: `ERROR: ${err.message}`, attachedMethod: '-' });
    }
  }

  console.log('\n====================================================================');
  console.log('  RESUMO DO ENVIO DAS SCREENSHOTS UI/UX PARA AS 6 IAs              ');
  console.log('====================================================================');
  console.table(results);

  // Coleta imediata do que já estiver pronto (ex: Claude já está gerando!)
  await collectAllResponses(client, 'initial-check');

  // Mantém o WebSocket aberto e coleta a cada 90s + servidor HTTP em 127.0.0.1:9230
  setInterval(() => {
    client.send('Target.getTargets').catch(() => {});
  }, 20000);

  setInterval(() => {
    collectAllResponses(client, 'periodic-90s').catch(() => {});
  }, 90000);

  const srv = http.createServer(async (req, res) => {
    if (req.url === '/collect') {
      const col = await collectAllResponses(client, 'http-trigger');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, collected: col }));
    } else {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, results }));
    }
  });
  srv.on('error', () => {});
  srv.listen(9230, '127.0.0.1', () => {
    console.log('[DAEMON] Coletor ativo em http://127.0.0.1:9230/collect (coletando respostas a cada 90s sem novo popup Allow!)');
  });
}

main().catch(err => {
  console.error('[ERRO ENVIO CDP]', err.message);
  process.exit(1);
});
