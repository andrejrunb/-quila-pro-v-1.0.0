/**
 * dispatch_ai_swarm.cjs — Orquestrador Diário e Motor CDP do Swarm Multi-IA (Áquila Pro)
 * ======================================================================================
 * Conecta diretamente ao Chrome Principal da usuária via DevToolsActivePort WebSocket
 * (Target.getTargets + Target.attachToTarget + Input.insertText), localiza as abas já
 * logadas (Claude, ChatGPT, DeepSeek, Perplexity, GitHub/Microsoft Copilot), injeta os
 * prompts cirúrgicos diários e dispara a execução em paralelo.
 */

const fs = require('fs');
const path = require('path');

const DEFAULT_CHROME_PORT_FILE = path.join(
  process.env.LOCALAPPDATA || 'C:\\Users\\Thaysa\\AppData\\Local',
  'Google\\Chrome\\User Data\\DevToolsActivePort'
);
const BRIEFINGS_DIR = path.resolve(__dirname, '../docs/ai_cockpit');
const OUTPUT_BASE = path.resolve(__dirname, '../test-results/swarm_audits');

const CLOUD_LINKS = {
  githubRepo: 'https://github.com/andrejrunb/-quila-pro-v-1.0.0',
  githubRawBase: 'https://raw.githubusercontent.com/andrejrunb/-quila-pro-v-1.0.0/main',
  driveVaultRoot: 'https://drive.google.com/drive/folders/1bO0QaWJMK3k2tQ1vefhijNSuEmLw_ApV',
  driveCleanZip: 'https://drive.google.com/file/d/1uARGNfYiImJ3-216XREfgLoe0dwjVfV5/view?usp=drivesdk',
  veracityMatrixRaw: 'https://raw.githubusercontent.com/andrejrunb/-quila-pro-v-1.0.0/main/docs/MATRIZ_DE_VERACIDADE_E_PORTAIS.md'
};

const DAILY_SWARM_CONFIG = [
  {
    id: 'claude_architect',
    name: 'Claude 3.7 Sonnet (Arquiteto & SQA)',
    domains: ['claude.ai'],
    briefingFile: '01_CLAUDE_ARCHITECTURE_AUDIT.md',
    outputFile: 'claude_architecture_audit_result.md',
    inputSelectors: [
      'div.ProseMirror[contenteditable="true"]',
      'fieldset div[contenteditable="true"]',
      'div[contenteditable="true"]'
    ],
    sendSelectors: [
      'button[aria-label*="Send"]',
      'button[aria-label*="Enviar"]',
      'fieldset button:not([disabled])'
    ],
    schedule: 'Diário — 08:00 BRT',
    parameters: {
      temperature: 0.1,
      strictTypeCheck: true,
      forbidAny: true
    },
    buildDailyPrompt: (baseBriefing, dateStr) => `[MISSÃO DIÁRIA AUTOMATIZADA — DATA: ${dateStr}]
[AGENTE ALVO: CLAUDE 3.7 SONNET — ARQUITETO DE SOFTWARE & AUDITOR SQA]

Acesse os recursos de referência do projeto Áquila Pro:
- GitHub Oficial: ${CLOUD_LINKS.githubRepo}
- Código Limpo (Drive ZIP): ${CLOUD_LINKS.driveCleanZip}
- Matriz de Veracidade: ${CLOUD_LINKS.veracityMatrixRaw}
- Arquivos Alvo do Dia (Raw GitHub):
  1. ${CLOUD_LINKS.githubRawBase}/apps/electron/src/main/handlers.ts
  2. ${CLOUD_LINKS.githubRawBase}/apps/electron/src/main/services/OmrCorrectionService.ts
  3. ${CLOUD_LINKS.githubRawBase}/apps/electron/src/main/services/AuthenticationService.ts

=== DIRETRIZES CIENTÍFICAS E CONTRATO DE ENTREGA ===
${baseBriefing}

=== TAREFA EXECUTIVA DE HOJE (${dateStr}) ===
1. Audite os 3 arquivos alvo acima buscando qualquer uso residual de \`: any\`, \`as any\` ou falhas de validação de entrada nos canais IPC (\`protectedHandle\`).
2. Projete a interface tipada \`DiscriminatedResult<T>\` e a fila persistente SQLite para o \`OmrCorrectionService.ts\` operar com resiliência offline sem jamais gerar notas falsas.
3. Entregue o código completo (drop-in replacement sem omissões) e a suíte de testes Vitest/Jest correspondente.`
  },
  {
    id: 'gpt_pedagogical',
    name: 'ChatGPT 4o / o1 (Diretor Pedagógico & TRI)',
    domains: ['chatgpt.com'],
    briefingFile: '02_GPT_PEDAGOGICAL_TRI_BNCC.md',
    outputFile: 'gpt_pedagogical_tri_result.json',
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
    ],
    schedule: 'Diário — 08:15 BRT',
    parameters: {
      triModel: '3PL (Logistic 3-Parameter)',
      scaleFactorD: 1.7
    },
    buildDailyPrompt: (baseBriefing, dateStr) => `[MISSÃO DIÁRIA AUTOMATIZADA — DATA: ${dateStr}]
[AGENTE ALVO: CHATGPT 4o / o1 — DIRETOR PEDAGÓGICO & ESPECIALISTA EM TRI/BNCC]

Fontes Oficiais do Ecossistema Áquila Pro:
- GitHub Oficial: ${CLOUD_LINKS.githubRepo}
- Matriz de Portais e Pedagogia: ${CLOUD_LINKS.veracityMatrixRaw}
- Google Drive Sovereign Vault: ${CLOUD_LINKS.driveVaultRoot}

=== DIRETRIZES PSICOMÉTRICAS E PEDAGÓGICAS ===
${baseBriefing}

=== TAREFA EXECUTIVA DE HOJE (${dateStr}) ===
1. Gere 5 itens inéditos calibrados pela TRI (Modelo Logístico de 3 Parâmetros: a_discriminacao, b_dificuldade, c_chute) cobrindo Matemática (EM13MAT301, EM13MAT302) e Ciências da Natureza (EF09CI03), com diagnóstico cognitivo exato para cada um dos 4 distratores incorretos.
2. Entregue a revisão blindada do System Prompt Socrático do tutor "Albus" (3 passos sem entregar gabarito imediato).
3. Gere o lote semanal de "Conversas para o Jantar" (Efeito Feynman) para o Portal dos Pais.
Retorne estritamente no schema JSON especificado.`
  },
  {
    id: 'deepseek_math',
    name: 'DeepSeek R1 / V3 (Engenheiro Matemático & OMR)',
    domains: ['chat.deepseek.com', 'deepseek.com'],
    briefingFile: '03_DEEPSEEK_MATH_SOLVER_OMR.md',
    outputFile: 'deepseek_math_solver_result.py',
    inputSelectors: [
      'textarea#chat-input',
      'textarea'
    ],
    sendSelectors: [
      'div[role="button"][aria-disabled="false"]',
      'button[type="submit"]'
    ],
    schedule: 'Diário — 08:30 BRT',
    parameters: {
      maxConvergenceMs: 2000,
      omrFrameBudgetMs: 30,
      confidenceMarginTau: 0.35
    },
    buildDailyPrompt: (baseBriefing, dateStr) => `[MISSÃO DIÁRIA AUTOMATIZADA — DATA: ${dateStr}]
[AGENTE ALVO: DEEPSEEK R1 / V3 — ENGENHEIRO MATEMÁTICO DE SOLVERS & VISÃO OMR]

Fontes de Código do Ecossistema Áquila Pro:
- GitHub Oficial: ${CLOUD_LINKS.githubRepo}
- Arquivo Alvo 1 (Grade Horária): ${CLOUD_LINKS.githubRawBase}/apps/electron/src/main/services/ScheduleGeneratorService.ts
- Arquivo Alvo 2 (Correção OMR): ${CLOUD_LINKS.githubRawBase}/apps/electron/src/main/services/OmrCorrectionService.ts
- Google Drive Clean Source: ${CLOUD_LINKS.driveCleanZip}

=== ESPECIFICAÇÃO MATEMÁTICA E ALGORÍTMICA ===
${baseBriefing}

=== TAREFA EXECUTIVA DE HOJE (${dateStr}) ===
1. Escreva o kernel Python/NumPy/OpenCV determinístico completo para leitura de Cartão-Resposta OMR A4 offline (Homografia 3x3 pelos 4 marcadores de canto, Binarização Adaptativa de Sauvola/Otsu local, cálculo vetorizado de densidade óptica por bolha e margem de confiança tau >= 0.35) que possa ser invocado localmente pelo \`OmrCorrectionService.ts\` em < 30ms por página.
2. Escreva o solver combinatório de Grade Horária Escolar (Simulated Annealing + Guided Local Search) respeitando 100% das restrições Hard e minimizando janelas docentes em < 2 segundos.`
  },
  {
    id: 'perplexity_radar',
    name: 'Perplexity Pro (Radar Regulatório & Benchmark)',
    domains: ['perplexity.ai'],
    briefingFile: '04_PERPLEXITY_REGULATORY_RADAR.md',
    outputFile: 'perplexity_regulatory_radar.md',
    inputSelectors: [
      '#ask-input',
      'div[contenteditable="true"]',
      'textarea[placeholder]',
      'textarea'
    ],
    sendSelectors: [
      'button[aria-label="Submit"]',
      'button[aria-label*="Send"]',
      'button[type="submit"]'
    ],
    schedule: 'Diário — 08:45 BRT',
    parameters: {
      requirePrimarySources: true,
      jurisdictions: ['ANPD', 'MEC', 'CNE', 'MP-SP', 'MP-DFT']
    },
    buildDailyPrompt: (baseBriefing, dateStr) => `[MISSÃO DIÁRIA AUTOMATIZADA — DATA: ${dateStr}]
[AGENTE ALVO: PERPLEXITY PRO — RADAR REGULATÓRIO E INTELIGÊNCIA DE MERCADO EDTECH]

Contexto Normativo do Projeto Áquila Pro:
- Matriz de Veracidade e Fronteira de Dados: ${CLOUD_LINKS.veracityMatrixRaw}
- Google Drive Sovereign Vault: ${CLOUD_LINKS.driveVaultRoot}

=== PROTOCOLO DE INVESTIGAÇÃO E FONTES PRIMÁRIAS ===
${baseBriefing}

=== TAREFA EXECUTIVA DE HOJE (${dateStr}) ===
Realize uma varredura atualizada com citações e links verificáveis:
1. Decisões, notas técnicas e fiscalizações da ANPD e Ministérios Públicos Estaduais sobre biometria facial e dados de menores em escolas privadas (LGPD Art. 14) e obrigatoriedade de alternativa não biométrica (QR Code/Cartão).
2. Pareceres recentes do CNE/MEC sobre tutores de Inteligência Artificial e limites éticos na Educação Básica.
3. Benchmark atualizado de queixas de clientes (ReclameAqui, fóruns de gestores escolares) contra TOTVS Educacional, Sophia, Activesoft e sistemas dependentes 100% de nuvem, destacando argumentos comerciais verificáveis para o Áquila Pro.`
  },
  {
    id: 'copilot_windows',
    name: 'GitHub / Microsoft Copilot (Windows & RPA)',
    domains: ['github.com/copilot', 'copilot.microsoft.com'],
    briefingFile: '05_COPILOT_WINDOWS_RPA_PLATFORM.md',
    outputFile: 'copilot_windows_rpa_result.ps1',
    inputSelectors: [
      'textarea#copilot-chat-textarea',
      'textarea[placeholder*="Ask"]',
      'textarea[placeholder*="Pergunte"]',
      'textarea#userInput',
      'textarea'
    ],
    sendSelectors: [
      'button[type="submit"]',
      'button[aria-label*="Send"]',
      'button[aria-label*="Enviar"]'
    ],
    schedule: 'Diário — 09:00 BRT',
    parameters: {
      targetOS: 'Windows 10/11 Pro & Windows Server',
      encryptionApi: 'Windows DPAPI'
    },
    buildDailyPrompt: (baseBriefing, dateStr) => `[MISSÃO DIÁRIA AUTOMATIZADA — DATA: ${dateStr}]
[AGENTE ALVO: COPILOT — ENGENHEIRO WINDOWS, DPAPI & RPA CONTÁBIL]

Arquivos de Infraestrutura do Áquila Pro:
- GitHub Oficial: ${CLOUD_LINKS.githubRepo}
- Script DR Atual: ${CLOUD_LINKS.githubRawBase}/scripts/restore_edge.ps1
- Serviço de Segurança: ${CLOUD_LINKS.githubRawBase}/apps/electron/src/main/services/SecurityService.ts

=== ESPECIFICAÇÃO DE ENGENHARIA WINDOWS & RPA ===
${baseBriefing}

=== TAREFA EXECUTIVA DE HOJE (${dateStr}) ===
1. Audite e entregue a versão blindada do script PowerShell \`restore_edge.ps1\` com Atomic Swap, verificação de handles abertos no \`aquila.db\`, checagem \`PRAGMA foreign_key_check\` e \`PRAGMA integrity_check\`, e rollback automático em caso de falha.
2. Forneça o script validador e gerador posicional/CSV para exportação contábil RPA compatível com Thomson Reuters Domínio (\`C:\\aquila\\storage\\dominio_out\`).`
  }
];

/**
 * Cliente CDP minimalista sobre o WebSocket do Browser (DevToolsActivePort)
 */
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
      const timer = setTimeout(() => reject(new Error('Timeout conectando ao Browser WS (clique em Allow no Chrome)')), 30000);

      ws.onopen = () => {
        clearTimeout(timer);
        resolve();
      };
      ws.onerror = (err) => {
        clearTimeout(timer);
        reject(new Error(err.message || 'Erro de conexão WebSocket'));
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
      }, 20000);

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
    return null;
  }
  const lines = fs.readFileSync(DEFAULT_CHROME_PORT_FILE, 'utf-8').trim().split(/\r?\n/);
  const port = parseInt(lines[0], 10);
  const wsPath = lines[1];
  if (!port || !wsPath) return null;
  return `ws://127.0.0.1:${port}${wsPath}`;
}

async function injectAndSubmitOnTarget(client, targetId, promptText, inputSelectors, sendSelectors, shouldSubmit) {
  const { sessionId } = await client.send('Target.attachToTarget', {
    targetId,
    flatten: true
  });

  // Ativa a aba rapidamente para hidratar o DOM caso estivesse em background/hibernada
  try {
    await client.send('Page.bringToFront', {}, sessionId);
    await new Promise(r => setTimeout(r, 800));
  } catch {}

  // 1. Foca o elemento de entrada e insere o texto de forma instantânea no DOM (compatível com ProseMirror/React)
  const fastInsertExpr = `
    (function() {
      const selectors = ${JSON.stringify(inputSelectors)};
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
            return { found: true, fastInserted: true, selector: sel, tag: el.tagName };
          } else if (el.isContentEditable) {
            el.innerHTML = '';
            const ok = document.execCommand && document.execCommand('insertText', false, text);
            if (!ok || !el.innerText.trim()) {
              el.innerText = text;
              el.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: text }));
            }
            return { found: true, fastInserted: true, selector: sel, tag: el.tagName };
          }
        }
      }
      return { found: false };
    })()
  `;

  const focusRes = await client.send('Runtime.evaluate', {
    expression: fastInsertExpr,
    returnByValue: true
  }, sessionId);

  const focusInfo = focusRes?.result?.value || { found: false };
  if (!focusInfo.found) {
    return { status: 'INPUT_NOT_FOUND' };
  }

  if (!focusInfo.fastInserted) {
    await client.send('Input.insertText', { text: promptText }, sessionId);
  }

  // Pequena pausa para os frameworks reativos (React/ProseMirror) habilitarem o botão Enviar
  await new Promise(r => setTimeout(r, 700));

  let submitted = false;
  if (shouldSubmit) {
    const submitExpr = `
      (function() {
        const sendSels = ${JSON.stringify(sendSelectors)};
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

    if (subRes?.result?.value?.clicked) {
      submitted = true;
    } else {
      // Fallback: pressiona Enter nativo via CDP
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
  }

  return {
    status: submitted ? 'INJECTED_AND_SUBMITTED' : 'INJECTED_READY',
    selector: focusInfo.selector
  };
}

async function collectResponseFromTarget(client, targetId) {
  const { sessionId } = await client.send('Target.attachToTarget', {
    targetId,
    flatten: true
  });

  const collectExpr = `
    (function() {
      // Seletores específicos das mensagens do assistente em Claude, ChatGPT, DeepSeek, Perplexity e Copilot
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
  }, sessionId);

  return res?.result?.value || { collected: false, length: 0, content: '' };
}

async function main() {
  const args = process.argv.slice(2);
  const shouldInject = args.includes('--inject');
  const shouldSubmit = args.includes('--submit');
  const shouldCollect = args.includes('--collect');
  const onlyArg = args.find(a => a.startsWith('--only='));
  const onlyId = onlyArg ? onlyArg.split('=')[1] : null;

  console.log('========================================================================');
  console.log('  ÁQUILA PRO — MOTOR DE AUTOMAÇÃO DIÁRIA DO SWARM MULTI-IA              ');
  console.log('========================================================================');

  const today = new Date().toISOString().split('T')[0];
  const todayOutputDir = path.join(OUTPUT_BASE, today);
  const promptsOutDir = path.join(todayOutputDir, 'prompts');
  fs.mkdirSync(promptsOutDir, { recursive: true });

  const wsUrl = getBrowserWsUrl();
  let client = null;
  let pages = [];

  if (wsUrl) {
    console.log(`[1/4] Conectando ao Chrome Principal via DevToolsActivePort...`);
    console.log(`      Endpoint: ${wsUrl}`);
    try {
      client = new CdpBrowserClient(wsUrl);
      await client.connect();
      const targetsRes = await client.send('Target.getTargets');
      pages = (targetsRes.targetInfos || []).filter(t => t.type === 'page');
      console.log(`[OK] Conectado com sucesso! ${pages.length} abas ativas encontradas no seu Chrome.\n`);
    } catch (err) {
      console.warn(`[AVISO] Falha ao conectar no WebSocket: ${err.message}\n`);
      client = null;
    }
  } else {
    console.warn(`[AVISO] DevToolsActivePort não encontrado. Ative em chrome://inspect/#remote-debugging.\n`);
  }

  console.log('[2/4] Compilando e Despachando Missões Cirúrgicas para as IAs Abertas...');
  const manifest = {
    generatedAt: new Date().toISOString(),
    date: today,
    wsConnected: Boolean(client),
    cloudLinks: CLOUD_LINKS,
    missions: []
  };

  const activeAgents = onlyId
    ? DAILY_SWARM_CONFIG.filter(a => a.id === onlyId)
    : DAILY_SWARM_CONFIG;

  for (const agent of activeAgents) {
    const briefingPath = path.join(BRIEFINGS_DIR, agent.briefingFile);
    const baseBriefing = fs.existsSync(briefingPath)
      ? fs.readFileSync(briefingPath, 'utf-8')
      : `# Briefing não encontrado em ${briefingPath}`;

    const compiledPrompt = agent.buildDailyPrompt(baseBriefing, today);
    const compiledPromptFile = path.join(promptsOutDir, `${agent.id}_${today}.prompt.md`);
    fs.writeFileSync(compiledPromptFile, compiledPrompt, 'utf-8');

    const matchingPage = pages.find(p =>
      p.url && agent.domains.some(d => p.url.includes(d))
    );

    let dispatchResult = null;
    if (client && matchingPage && shouldInject) {
      try {
        dispatchResult = await injectAndSubmitOnTarget(
          client,
          matchingPage.targetId,
          compiledPrompt,
          agent.inputSelectors,
          agent.sendSelectors,
          shouldSubmit
        );
      } catch (err) {
        dispatchResult = { status: 'ERROR', error: err.message };
      }
    }

    if (client && matchingPage && shouldCollect) {
      try {
        const col = await collectResponseFromTarget(client, matchingPage.targetId);
        if (col.collected && col.content) {
          const outPath = path.join(todayOutputDir, agent.outputFile);
          fs.writeFileSync(outPath, col.content, 'utf-8');
          dispatchResult = { status: `COLLECTED (${(col.length / 1024).toFixed(1)} KB)`, selector: col.selector };
        } else {
          dispatchResult = { status: 'COLLECT_EMPTY' };
        }
      } catch (err) {
        dispatchResult = { status: 'COLLECT_ERROR', error: err.message };
      }
    }

    const tabLabel = matchingPage
      ? `[Aba: ${(matchingPage.title || agent.domains[0]).substring(0, 30)}]`
      : '[Aba Não Encontrada]';
    const statusLabel = dispatchResult ? ` -> ${dispatchResult.status}` : '';

    console.log(`  • ${agent.name.padEnd(44)} | ${(compiledPrompt.length / 1024).toFixed(1)} KB | ${tabLabel}${statusLabel}`);

    manifest.missions.push({
      id: agent.id,
      name: agent.name,
      schedule: agent.schedule,
      compiledPromptPath: compiledPromptFile,
      expectedOutputPath: path.join(todayOutputDir, agent.outputFile),
      matchedTab: matchingPage ? { title: matchingPage.title, url: matchingPage.url, targetId: matchingPage.targetId } : null,
      dispatchResult
    });
  }

  if (client) client.close();

  const manifestPath = path.join(todayOutputDir, 'daily_swarm_dispatch_manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');

  console.log(`\n[3/4] Manifesto Diário Salvo em: ${manifestPath}`);
  console.log('[4/4] Operação Concluída!');
  console.log('========================================================================\n');
}

main().catch(console.error);
