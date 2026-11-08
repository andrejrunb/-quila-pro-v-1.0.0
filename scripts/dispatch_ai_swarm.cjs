/**
 * dispatch_ai_swarm.cjs — Orquestrador Diário e Motor de Templates do Swarm Multi-IA (Áquila Pro)
 * ===============================================================================================
 * 1. Conecta via Chrome DevTools Protocol (CDP) na porta 9222 (Chrome Cockpit Dedicado).
 * 2. Compila os Templates Exatos de Prompt Diário (com links GitHub + Google Drive Cloud Vault +
 *    alvos dinâmicos de código do dia) para:
 *    - Claude 3.7 Sonnet (Arquitetura Hexagonal, Tipagem Estrita, Isolamento RBAC, Vitest)
 *    - ChatGPT 4o / o1 (Psicometria TRI 3PL, Matriz BNCC, Tutor Socrático Albus, Engajamento Familiar)
 *    - DeepSeek R1 / V3 (Solver Combinatório NP-Hard de Grade Horária, Visão Computacional OMR)
 *    - Perplexity Pro (Radar Regulatório ANPD/MEC/CNE/LGPD Art. 14, Benchmark EdTech)
 *    - Microsoft Copilot (Windows DPAPI, Disaster Recovery Atômico PowerShell, RPA Contábil)
 * 3. Injeta automaticamente os prompts nas abas ativas via CDP WebSocket (quando --inject é usado)
 *    e salva os pacotes diários auditáveis em test-results/swarm_audits/YYYY-MM-DD/.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const CDP_PORT = 9222;
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
  driveDocsFolderId: '1YimvcNR265Uyj6jLUGcisSL2HQdNF8w1',
  veracityMatrixRaw: 'https://raw.githubusercontent.com/andrejrunb/-quila-pro-v-1.0.0/main/docs/MATRIZ_DE_VERACIDADE_E_PORTAIS.md'
};

/**
 * Configuração Mestre de Automação Diária com Templates Cirúrgicos e Parâmetros por IA
 */
const DAILY_SWARM_CONFIG = [
  {
    id: 'claude_architect',
    name: 'Claude 3.7 Sonnet (Arquiteto & SQA)',
    domain: 'claude.ai',
    url: 'https://claude.ai/new',
    briefingFile: '01_CLAUDE_ARCHITECTURE_AUDIT.md',
    outputFile: 'claude_architecture_audit_result.md',
    selectorHint: 'div.ProseMirror[contenteditable="true"], fieldset div[contenteditable="true"]',
    schedule: 'Diário — 08:00 BRT',
    parameters: {
      temperature: 0.1,
      strictTypeCheck: true,
      forbidAny: true,
      targetFiles: [
        'apps/electron/src/main/handlers.ts',
        'apps/electron/src/main/services/OmrCorrectionService.ts',
        'apps/electron/src/main/services/AuthenticationService.ts',
        'apps/electron/src/database/Database.ts'
      ]
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
    domain: 'chatgpt.com',
    url: 'https://chatgpt.com/',
    briefingFile: '02_GPT_PEDAGOGICAL_TRI_BNCC.md',
    outputFile: 'gpt_pedagogical_tri_result.json',
    selectorHint: '#prompt-textarea, div#prompt-textarea[contenteditable="true"]',
    schedule: 'Diário — 08:15 BRT',
    parameters: {
      triModel: '3PL (Logistic 3-Parameter)',
      scaleFactorD: 1.7,
      bnccStages: ['Ensino Fundamental II (6º ao 9º)', 'Ensino Médio (1ª a 3ª série)'],
      socraticSteps: 3
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
    domain: 'deepseek.com',
    url: 'https://chat.deepseek.com/',
    briefingFile: '03_DEEPSEEK_MATH_SOLVER_OMR.md',
    outputFile: 'deepseek_math_solver_result.py',
    selectorHint: 'textarea#chat-input, textarea',
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
    domain: 'perplexity.ai',
    url: 'https://www.perplexity.ai/',
    briefingFile: '04_PERPLEXITY_REGULATORY_RADAR.md',
    outputFile: 'perplexity_regulatory_radar.md',
    selectorHint: 'textarea[placeholder], div[contenteditable="true"]',
    schedule: 'Diário — 08:45 BRT',
    parameters: {
      requirePrimarySources: true,
      jurisdictions: ['ANPD', 'MEC', 'CNE', 'MP-SP', 'MP-DFT', 'STJ'],
      focusLaws: ['Lei 13.709/2018 (LGPD Art. 14)', 'Lei 9.394/1996 (LDB Art. 12 VII)']
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
    name: 'Microsoft Copilot (Plataforma Windows & RPA)',
    domain: 'copilot.microsoft.com',
    url: 'https://copilot.microsoft.com/',
    briefingFile: '05_COPILOT_WINDOWS_RPA_PLATFORM.md',
    outputFile: 'copilot_windows_rpa_result.ps1',
    selectorHint: 'textarea#userInput, textarea',
    schedule: 'Diário — 09:00 BRT',
    parameters: {
      targetOS: 'Windows 10/11 Pro & Windows Server',
      encryptionApi: 'Windows DPAPI (System.Security.Cryptography.ProtectedData)',
      rpaTargets: ['Thomson Reuters Domínio', 'SigaWeb']
    },
    buildDailyPrompt: (baseBriefing, dateStr) => `[MISSÃO DIÁRIA AUTOMATIZADA — DATA: ${dateStr}]
[AGENTE ALVO: MICROSOFT COPILOT — ENGENHEIRO WINDOWS, DPAPI & RPA CONTÁBIL]

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

function getActiveCdpPort() {
  try {
    if (fs.existsSync(DEFAULT_CHROME_PORT_FILE)) {
      const lines = fs.readFileSync(DEFAULT_CHROME_PORT_FILE, 'utf-8').trim().split(/\r?\n/);
      const port = parseInt(lines[0], 10);
      if (port > 0) {
        return { port, source: 'Chrome Principal (DevToolsActivePort)', wsPath: lines[1] || null };
      }
    }
  } catch {}
  return { port: CDP_PORT, source: 'Cockpit Dedicado (Porta 9222)', wsPath: null };
}

function checkCdpStatus() {
  const { port, source } = getActiveCdpPort();
  return new Promise((resolve) => {
    const req = http.get(`http://127.0.0.1:${port}/json/list`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const tabs = JSON.parse(data);
          resolve({ online: true, port, source, tabs });
        } catch {
          resolve({ online: false, port, source, tabs: [] });
        }
      });
    });
    req.on('error', () => resolve({ online: false, port, source, tabs: [] }));
    req.setTimeout(2000, () => {
      req.destroy();
      resolve({ online: false, port, source, tabs: [] });
    });
  });
}

/**
 * Injeta o prompt compilado na aba do navegador via CDP WebSocket (Node 22+ WebSocket nativo)
 */
async function injectPromptIntoTab(tab, promptText, selectorHint) {
  if (!tab.webSocketDebuggerUrl || typeof WebSocket === 'undefined') {
    return { injected: false, reason: 'WebSocket indisponível ou aba sem debuggerUrl' };
  }

  return new Promise((resolve) => {
    const ws = new WebSocket(tab.webSocketDebuggerUrl);
    const timeout = setTimeout(() => {
      try { ws.close(); } catch {}
      resolve({ injected: false, reason: 'Timeout na conexão WebSocket CDP' });
    }, 4000);

    ws.onopen = () => {
      const escapedPrompt = JSON.stringify(promptText);
      const escapedSelectors = JSON.stringify(selectorHint);
      const jsExpression = `
        (function() {
          window.__AQUILA_DAILY_PROMPT__ = ${escapedPrompt};
          const selectors = ${escapedSelectors}.split(',').map(s => s.trim());
          for (const sel of selectors) {
            const el = document.querySelector(sel);
            if (el) {
              el.focus();
              if (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT') {
                const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set;
                if (nativeInputValueSetter) {
                  nativeInputValueSetter.call(el, window.__AQUILA_DAILY_PROMPT__);
                } else {
                  el.value = window.__AQUILA_DAILY_PROMPT__;
                }
                el.dispatchEvent(new Event('input', { bubbles: true }));
                return { status: 'FILLED_TEXTAREA', selector: sel };
              } else if (el.isContentEditable) {
                el.innerText = window.__AQUILA_DAILY_PROMPT__;
                el.dispatchEvent(new Event('input', { bubbles: true }));
                return { status: 'FILLED_CONTENTEDITABLE', selector: sel };
              }
            }
          }
          return { status: 'STORED_IN_WINDOW_ONLY', note: 'Use window.__AQUILA_DAILY_PROMPT__ ou cole do arquivo gerado' };
        })()
      `;

      ws.send(JSON.stringify({
        id: 1,
        method: 'Runtime.evaluate',
        params: {
          expression: jsExpression,
          returnByValue: true
        }
      }));
    };

    ws.onmessage = (event) => {
      clearTimeout(timeout);
      try {
        const msg = JSON.parse(event.data);
        const val = msg?.result?.result?.value;
        ws.close();
        resolve({ injected: true, detail: val });
      } catch (e) {
        ws.close();
        resolve({ injected: false, reason: e.message });
      }
    };

    ws.onerror = (err) => {
      clearTimeout(timeout);
      resolve({ injected: false, reason: err.message || 'Erro WebSocket' });
    };
  });
}

async function main() {
  const args = process.argv.slice(2);
  const shouldInject = args.includes('--inject');

  console.log('========================================================================');
  console.log('  ÁQUILA PRO — MOTOR DE AUTOMAÇÃO DIÁRIA DO SWARM MULTI-IA              ');
  console.log('========================================================================');

  const today = new Date().toISOString().split('T')[0];
  const todayOutputDir = path.join(OUTPUT_BASE, today);
  const promptsOutDir = path.join(todayOutputDir, 'prompts');
  fs.mkdirSync(promptsOutDir, { recursive: true });

  console.log(`[INFO] Pasta de auditorias do dia: ${todayOutputDir}`);
  console.log(`[INFO] Pasta de prompts compilados: ${promptsOutDir}\n`);

  console.log(`[1/4] Verificando conexão com o Chrome Cockpit (porta ${CDP_PORT})...`);
  const status = await checkCdpStatus();

  if (!status.online) {
    console.warn(`[AVISO] Chrome Cockpit não detectado na porta ${CDP_PORT}.`);
    console.log(`[DICA] Execute: powershell -ExecutionPolicy Bypass -File scripts/start_ai_cockpit.ps1\n`);
  } else {
    console.log(`[OK] Chrome Cockpit CONECTADO! (${status.tabs.length} abas abertas na sessão)\n`);
  }

  console.log('[2/4] Compilando Templates Cirúrgicos Diários para as 5 IAs...');
  const manifest = {
    generatedAt: new Date().toISOString(),
    date: today,
    cdpOnline: status.online,
    cloudLinks: CLOUD_LINKS,
    missions: []
  };

  for (const agent of DAILY_SWARM_CONFIG) {
    const briefingPath = path.join(BRIEFINGS_DIR, agent.briefingFile);
    const baseBriefing = fs.existsSync(briefingPath)
      ? fs.readFileSync(briefingPath, 'utf-8')
      : `# Briefing não encontrado em ${briefingPath}`;

    const compiledPrompt = agent.buildDailyPrompt(baseBriefing, today);
    const compiledPromptFile = path.join(promptsOutDir, `${agent.id}_${today}.prompt.md`);
    fs.writeFileSync(compiledPromptFile, compiledPrompt, 'utf-8');

    const matchingTab = status.tabs.find(t => t.url && t.url.includes(agent.domain));
    let injectionResult = null;

    if (shouldInject && matchingTab) {
      injectionResult = await injectPromptIntoTab(matchingTab, compiledPrompt, agent.selectorHint);
    }

    const tabStatus = matchingTab
      ? `[Aba Conectada: ${(matchingTab.title || agent.domain).substring(0, 28)}]`
      : '[Aba Aguardando Abertura]';

    const injectInfo = injectionResult
      ? ` -> Injeção CDP: ${injectionResult.injected ? injectionResult.detail?.status : injectionResult.reason}`
      : '';

    console.log(`  • ${agent.name.padEnd(44)} | Prompt: ${(compiledPrompt.length / 1024).toFixed(1)} KB | ${tabStatus}${injectInfo}`);

    manifest.missions.push({
      id: agent.id,
      name: agent.name,
      domain: agent.domain,
      schedule: agent.schedule,
      parameters: agent.parameters,
      compiledPromptPath: compiledPromptFile,
      expectedOutputPath: path.join(todayOutputDir, agent.outputFile),
      tabConnected: Boolean(matchingTab),
      tabId: matchingTab ? matchingTab.id : null,
      injectionResult
    });
  }

  const manifestPath = path.join(todayOutputDir, 'daily_swarm_dispatch_manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');

  console.log(`\n[3/4] Manifesto Diário Salvo em: ${manifestPath}`);
  console.log('[4/4] Comandos Rápidos de Operação:');
  console.log('  • Abrir Navegador Dedicado:  powershell -ExecutionPolicy Bypass -File scripts/start_ai_cockpit.ps1');
  console.log('  • Gerar Prompts do Dia:      node scripts/dispatch_ai_swarm.cjs');
  console.log('  • Injetar nas Abas Abertas:  node scripts/dispatch_ai_swarm.cjs --inject');
  console.log('========================================================================\n');
}

main().catch(console.error);
