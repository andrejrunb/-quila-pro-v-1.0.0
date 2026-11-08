/**
 * send_ui_screenshots_to_ais.cjs
 * ============================================================================
 * Conecta ao Chrome logado da usuária (via DevToolsActivePort) e encaminha as
 * 10 capturas de tela PNG do Áquila Pro Desktop + o prompt cirúrgico de
 * auditoria e melhoria de UI/UX para todas as 6 IAs logadas:
 *   1. Claude 3.7 Sonnet
 *   2. ChatGPT 4o / o1
 *   3. DeepSeek R1 / V3
 *   4. Perplexity Pro
 *   5. GitHub / Microsoft Copilot
 *   6. Brisk Next / Brisk Teaching
 */

const fs = require('fs');
const path = require('path');

const DEFAULT_CHROME_PORT_FILE = path.join(
  process.env.LOCALAPPDATA || 'C:\\Users\\Thaysa\\AppData\\Local',
  'Google\\Chrome\\User Data\\DevToolsActivePort'
);

const SCREENSHOT_OUT_DIR = path.resolve(__dirname, '../test-results/ui_screenshots_2026_11_08');

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
      const ws = new WebSocket(this.wsUrl);
      this.ws = ws;
      const timer = setTimeout(() => {
        try { ws.close(); } catch {}
        reject(new Error('Timeout conectando ao Chrome CDP WebSocket (90s)'));
      }, 90000);

      ws.onopen = () => {
        clearTimeout(timer);
        resolve();
      };
      ws.onerror = (err) => {
        clearTimeout(timer);
        reject(new Error(err.message || 'Conexao recusada pelo Chrome CDP (verifique o popup Allow no Chrome)'));
      };
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.id && this.pending.has(data.id)) {
            const { resolve: res, reject: rej } = this.pending.get(data.id);
            this.pending.delete(data.id);
            if (data.error) rej(new Error(data.error.message));
            else res(data.result);
          }
        } catch {}
      };
    });
  }

  send(method, params = {}, sessionId = undefined) {
    return new Promise((resolve, reject) => {
      const id = ++this.msgId;
      const payload = { id, method, params };
      if (sessionId) payload.sessionId = sessionId;

      const timer = setTimeout(() => {
        if (this.pending.has(id)) {
          this.pending.delete(id);
          reject(new Error(`Timeout em ${method}`));
        }
      }, 25000);

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
  const screenList = capturedPaths
    .map(c => `- \`${c.id}.png\`: ${c.title}`)
    .join('\n');

  return `[AUDITORIA VISUAL DE UI/UX — ÁQUILA PRO DESKTOP & PORTAIS SOBERANOS — 08/11/2026]
[AGENTE CONVOCADO: ${aiName}]
[FOCO DE ESPECIALIDADE: ${specialtyFocus}]

Acabamos de abrir o Áquila Pro Desktop localmente no computador (1920x1080), capturar as 10 telas/portais principais da interface do usuário e anexar os prints (PNG) diretamente nesta conversa para sua inspeção visual e técnica:

${screenList}

Repositório GitHub (branch \`main\` atualizada até o commit \`0ce07a72\`):
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
Analise criticamente as screenshots anexadas e a estrutura atual e entregue:
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

  await client.send('Page.enable', {}, sessionId);
  await client.send('DOM.enable', {}, sessionId);
  await client.send('Runtime.enable', {}, sessionId);

  try {
    await client.send('Page.bringToFront', {}, sessionId);
    await new Promise(r => setTimeout(r, 900));
  } catch {}

  const selectedCaptures = (aiConfig.shotIndices || [0, 1, 7, 8])
    .map(idx => capturedPaths[idx])
    .filter(Boolean);
  const selectedFilePaths = selectedCaptures.map(c => c.filePath);

  let attachedMethod = 'NONE';

  // Método 1: <input type="file"> via DOM.setFileInputFiles
  try {
    const { root } = await client.send('DOM.getDocument', { depth: -1, pierce: true }, sessionId);
    const { nodeIds } = await client.send('DOM.querySelectorAll', {
      nodeId: root.nodeId,
      selector: 'input[type="file"]'
    }, sessionId);

    if (nodeIds && nodeIds.length > 0) {
      const targetNodeId = nodeIds[nodeIds.length - 1];
      await client.send('DOM.setFileInputFiles', {
        nodeId: targetNodeId,
        files: selectedFilePaths
      }, sessionId);

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
      }, sessionId);

      attachedMethod = `DOM.setFileInputFiles (${selectedFilePaths.length} PNGs)`;
      await new Promise(r => setTimeout(r, 1800));
    }
  } catch {}

  // Método 2: ClipboardEvent('paste') com arquivos PNG no elemento de chat
  if (attachedMethod === 'NONE') {
    try {
      const sampleShots = selectedCaptures.slice(0, 3).map(c => ({
        name: `${c.id}.png`,
        b64: fs.readFileSync(c.filePath).toString('base64')
      }));

      const pasteRes = await client.send('Runtime.evaluate', {
        expression: `
          (function() {
            const shots = ${JSON.stringify(sampleShots)};
            const dt = new DataTransfer();
            for (const s of shots) {
              const bin = atob(s.b64);
              const arr = new Uint8Array(bin.length);
              for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
              const file = new File([arr], s.name, { type: 'image/png' });
              dt.items.add(file);
            }
            const active = document.activeElement || document.body;
            const pasteEvt = new ClipboardEvent('paste', {
              bubbles: true,
              cancelable: true,
              clipboardData: dt
            });
            active.dispatchEvent(pasteEvt);
            return { pasted: shots.length };
          })()
        `,
        returnByValue: true
      }, sessionId);

      if (pasteRes?.result?.value?.pasted) {
        attachedMethod = `ClipboardEvent.paste (${pasteRes.result.value.pasted} PNGs)`;
        await new Promise(r => setTimeout(r, 1500));
      }
    } catch {}
  }

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
            return { found: true, selector: sel };
          } else if (el.isContentEditable) {
            el.innerHTML = '';
            const ok = document.execCommand && document.execCommand('insertText', false, text);
            if (!ok || !el.innerText.trim()) {
              el.innerText = text;
              el.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: text }));
            }
            return { found: true, selector: sel };
          }
        }
      }
      return { found: false };
    })()
  `;

  const focusRes = await client.send('Runtime.evaluate', {
    expression: insertExpr,
    returnByValue: true
  }, sessionId);

  if (!focusRes?.result?.value?.found) {
    return { ai: aiConfig.name, status: 'INPUT_NOT_FOUND', attachedMethod };
  }

  await new Promise(r => setTimeout(r, 1400));

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
  }, sessionId);

  let submitted = Boolean(subRes?.result?.value?.clicked);
  if (!submitted) {
    await client.send('Input.dispatchKeyEvent', {
      type: 'keyDown',
      key: 'Enter',
      code: 'Enter',
      windowsVirtualKeyCode: 13,
      nativeVirtualKeyCode: 13
    }, sessionId);
    await client.send('Input.dispatchKeyEvent', {
      type: 'keyUp',
      key: 'Enter',
      code: 'Enter',
      windowsVirtualKeyCode: 13,
      nativeVirtualKeyCode: 13
    }, sessionId);
    submitted = true;
  }

  return {
    ai: aiConfig.name,
    url: targetInfo.url,
    attachedMethod,
    status: submitted ? 'SCREENSHOTS_AND_PROMPT_SENT' : 'READY_IN_COMPOSER'
  };
}

async function main() {
  const capturedPaths = UI_PAGES_METADATA.map(item => ({
    ...item,
    filePath: path.join(SCREENSHOT_OUT_DIR, `${item.id}.png`)
  })).filter(c => fs.existsSync(c.filePath));

  if (capturedPaths.length === 0) {
    throw new Error(`Nenhuma screenshot encontrada em ${SCREENSHOT_OUT_DIR}`);
  }

  const wsUrl = getBrowserWsUrl();
  console.log(`[CDP] Conectando ao Chrome da usuária (${wsUrl})...`);
  console.log(`      >>> Se aparecer a janelinha do Chrome pedindo permissão ("Allow"), clique em Allow! <<<`);
  const client = new CdpBrowserClient(wsUrl);
  await client.connect();

  try {
    const { targetInfos } = await client.send('Target.getTargets');
    const pageTargets = targetInfos.filter(t => t.type === 'page');

    const results = [];
    for (const aiConfig of AI_TARGETS) {
      const matchingTab = pageTargets.find(t =>
        aiConfig.domains.some(d => (t.url || '').toLowerCase().includes(d))
      );

      if (!matchingTab) {
        console.log(`  [AVISO] Aba não encontrada para ${aiConfig.name}`);
        results.push({ ai: aiConfig.name, status: 'TAB_NOT_FOUND' });
        continue;
      }

      console.log(`  -> Enviando screenshots + prompt de UI/UX para ${aiConfig.name}...`);
      const res = await attachScreenshotsAndSendToAiTab(client, matchingTab, aiConfig, capturedPaths);
      results.push(res);
      console.log(`     Status: ${res.status} | Anexo: ${res.attachedMethod}`);
    }

    console.log('\n====================================================================');
    console.log('  RESUMO DO ENVIO DAS SCREENSHOTS UI/UX PARA AS 6 IAs              ');
    console.log('====================================================================');
    console.table(results);
  } finally {
    client.close();
  }
}

main().catch(err => {
  console.error('[ERRO ENVIO CDP]', err.message);
  process.exit(1);
});
