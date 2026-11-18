/**
 * verify_all_portals_and_ai.cjs
 * Script único sequencial Playwright Full HD (1920x1080) para homologação:
 * 1. Autenticação Admin e remoção/aceite do modal LGPD
 * 2. Validação dos canais IPC de IA & Portais (sem "Canal IPC não autorizado")
 * 3. Navegação sequencial nos 8 portais/estúdios, validação de botões críticos
 *    no Portal da Família, detecção de ErrorBoundary / LGPD / console errors
 *    e captura de screenshots Full HD.
 */

const { _electron: electron } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const MAIN_PATH = 'C:\\aquila\\apps\\electron\\dist\\main.js';
const USER_DATA_DIR = 'C:\\aquila\\test-results\\pilot_journey_env';
const SCREENSHOT_DIR = 'C:\\Users\\Thaysa\\.gemini\\antigravity\\brain\\5fca40fa-e48d-4bc6-bc7a-084bf4a62fe4\\screenshots';

const ROUTES = [
  { file: '01_portal_direcao_otimizado.png', page: 'executive-cockpit-portal', label: 'Portal da Direção' },
  { file: '02_portal_coordenacao_otimizado.png', page: 'coordination', label: 'Portal da Coordenação' },
  { file: '03_portal_secretaria_otimizado.png', page: 'secretaria-portal', label: 'Portal da Secretaria' },
  { file: '04_portal_familia_otimizado.png', page: 'parent-portal', label: 'Portal da Família' },
  { file: '05_portal_professor_otimizado.png', page: 'teacher-dashboard', label: 'Portal do Professor' },
  { file: '06_portal_aluno_otimizado.png', page: 'student-portal', label: 'Portal do Aluno' },
  { file: '07_estudio_ia_docente_otimizado.png', page: 'ai-studio', label: 'Estúdio IA Docente' },
  { file: '08_fabrica_atividades_ia_otimizada.png', page: 'activity-factory', label: 'Fábrica de Atividades IA' },
];

async function main() {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

  console.log('[VERIFY] Lançando Electron em modo Full HD (1920x1080)...');
  const app = await electron.launch({
    args: [MAIN_PATH],
    env: {
      ...process.env,
      AQUILA_USER_DATA_OVERRIDE: USER_DATA_DIR,
      PLAYWRIGHT: 'true',
      PLAYWRIGHT_TEST: 'true',
      AQUILA_LICENSE_HMAC_SECRET: 'aquila-pro-local-hmac-2026',
      AQUILA_ENCRYPTION_SECRET: 'aquila-pro-local-enc-2026',
      NODE_ENV: 'development',
    },
    timeout: 60000,
  });

  const consoleErrors = [];
  const pageErrors = [];
  const unauthorizedIpcAlerts = [];
  let hasFailure = false;

  try {
    const win = await app.firstWindow({ timeout: 60000 });
    win.on('dialog', async (d) => {
      await d.dismiss().catch(() => {});
    });
    win.on('console', (msg) => {
      const text = msg.text();
      if (text.includes('Canal IPC não autorizado') || text.includes('SECURITY ALERT')) {
        unauthorizedIpcAlerts.push(text);
      }
      if (msg.type() === 'error') {
        consoleErrors.push(text);
      }
    });
    win.on('pageerror', (err) => {
      pageErrors.push(err.message || String(err));
    });

    await win.setViewportSize({ width: 1920, height: 1080 });
    await win.waitForLoadState('domcontentloaded');
    await win.waitForTimeout(2500);

    // 1. Autenticação Admin
    console.log('[AUTH] Autenticando como Admin...');
    const authResult = await win.evaluate(async () => {
      localStorage.setItem('aquila_setup_complete', 'true');
      try {
        await window.aquila.invoke('logout');
      } catch (_e) {}

      const attempts = [
        { channel: 'auth:login', creds: { username: 'admin.piloto', password: 'PilotPassword@2026!' } },
        { channel: 'login', creds: { username: 'admin.piloto', password: 'PilotPassword@2026!' } },
        { channel: 'auth:login', creds: { username: 'admin', password: 'Admin@2026!' } },
      ];

      let lastRes = null;
      for (const att of attempts) {
        try {
          const res = await window.aquila.invoke(att.channel, att.creds);
          lastRes = { channel: att.channel, username: att.creds.username, res };
          if (res && res.success && res.user) {
            sessionStorage.setItem('aquila_session_user', JSON.stringify(res.user));
            return lastRes;
          }
        } catch (err) {
          lastRes = { channel: att.channel, username: att.creds.username, error: err?.message || String(err) };
        }
      }
      return lastRes;
    });

    console.log('[AUTH] Resultado do login:', JSON.stringify({
      channel: authResult?.channel,
      username: authResult?.username,
      success: authResult?.res?.success,
      role: authResult?.res?.user?.role,
      userId: authResult?.res?.user?.id,
      error: authResult?.error || authResult?.res?.message || null,
    }));

    if (!authResult?.res?.success || !authResult?.res?.user) {
      throw new Error(`Falha no login Admin: ${JSON.stringify(authResult)}`);
    }

    await win.reload({ waitUntil: 'domcontentloaded' });
    await win.waitForTimeout(2500);

    const activeUser = await win.evaluate(async () => {
      return await window.aquila.invoke('get-current-user').catch(() => null);
    });
    console.log('[AUTH] Sessão ativa pós-reload:', JSON.stringify(activeUser ? { id: activeUser.id, username: activeUser.username, role: activeUser.role } : null));

    // 2. Aceitar modal LGPD se aparecer e confirmar que não fica bloqueando a tela
    const lgpdBtn = win.locator('button:has-text("Concordar e Continuar"), button:has-text("Aceitar")').first();
    if (await lgpdBtn.isVisible().catch(() => false)) {
      console.log('[LGPD] Modal detectado — clicando no botão de aceite...');
      await lgpdBtn.click();
    }
    await win.waitForTimeout(1500);

    const lgpdStillOpen = await win.locator('.lgpd-modal-overlay').isVisible().catch(() => false);
    console.log(`[LGPD] Modal bloqueante ativo após verificação: ${lgpdStillOpen}`);
    if (lgpdStillOpen) {
      hasFailure = true;
      console.error('[FAIL] Modal LGPD permaneceu bloqueando a interface!');
    }

    // 3. Testes dos canais IPC de IA & Portais
    console.log('\n[IPC] Executando bateria de testes IPC de IA & Portais...');
    const ipcChecks = [
      {
        channel: 'hardware:dev-task',
        payload: { role: 'coder', prompt: 'Explique 2+2 em 1 frase curta.' },
      },
      {
        channel: 'pedagogy:ask-copilot',
        payload: { studentId: 'PILOT-999', question: 'Qual a fórmula da velocidade média?' },
      },
      {
        channel: 'ai:generate-report-comment',
        payload: { studentId: 'PILOT-999', studentName: 'Lucas Piloto Silva', avg: 8.5 },
      },
      {
        channel: 'timetable:solve',
        payload: {
          num_classes: 1,
          num_teachers: 1,
          num_rooms: 1,
          days: 5,
          periods_per_day: 2,
          time_limit_sec: 1,
          requirements: [
            { req_id: 1, class_id: 0, teacher_id: 0, subject_id: 0, room_id: 0, weekly_lessons: 2 },
          ],
        },
      },
      {
        channel: 'get-system-health',
        payload: undefined,
      },
      {
        channel: 'gamification:get-wallet',
        payload: { userId: 'PILOT-999' },
      },
      {
        channel: 'academic:get-grades',
        payload: { studentId: 'PILOT-999' },
      },
    ];

    const ipcResults = [];
    for (const check of ipcChecks) {
      const outcome = await win.evaluate(async ({ ch, pl }) => {
        const t0 = Date.now();
        try {
          const res = pl === undefined
            ? await window.aquila.invoke(ch)
            : await window.aquila.invoke(ch, pl);
          return {
            channel: ch,
            ok: true,
            unauthorized: false,
            elapsedMs: Date.now() - t0,
            res,
          };
        } catch (err) {
          const msg = err?.message || String(err);
          return {
            channel: ch,
            ok: false,
            unauthorized: msg.includes('Canal IPC não autorizado'),
            elapsedMs: Date.now() - t0,
            error: msg,
          };
        }
      }, { ch: check.channel, pl: check.payload });

      ipcResults.push(outcome);
      const preview = outcome.ok
        ? JSON.stringify(outcome.res).slice(0, 220)
        : `ERROR: ${outcome.error}`;
      console.log(`  [IPC] ${outcome.channel} -> ok=${outcome.ok} unauthorized=${outcome.unauthorized} (${outcome.elapsedMs}ms) | ${preview}`);

      if (outcome.unauthorized) {
        hasFailure = true;
      }
    }

    // 4. Navegação sequencial + Inspeção DOM + Captura das 8 Screenshots Full HD
    console.log('\n[UI] Capturando as 8 telas em Full HD (1920x1080)...');
    const routeReports = [];

    for (const route of ROUTES) {
      const consoleCountBefore = consoleErrors.length;
      const pageErrCountBefore = pageErrors.length;

      await win.evaluate((targetPage) => {
        window.dispatchEvent(new CustomEvent('aquila:navigate', { detail: targetPage }));
      }, route.page);

      await win.waitForTimeout(2200);

      // Aguarda eventuais spinners breves desaparecerem (sem travar infinito)
      await win.waitForFunction(() => {
        const loading = document.querySelector('.dashboard-loading, .pp-loading');
        return !loading;
      }, { timeout: 3000 }).catch(() => {});

      const domAudit = await win.evaluate(() => {
        const bodyText = document.body?.innerText || '';
        const hasErrorBoundary =
          !!document.querySelector('.error-boundary') ||
          bodyText.includes('Interrupção Recuperável de Interface');
        const hasLgpdOverlay = !!document.querySelector('.lgpd-modal-overlay');
        const scrollWidth = document.documentElement.scrollWidth;
        const innerWidth = window.innerWidth;
        const headerRow = document.querySelector('.portal-header-row');
        const headerHeight = headerRow ? Math.round(headerRow.getBoundingClientRect().height) : null;

        return {
          hasErrorBoundary,
          hasLgpdOverlay,
          horizontalOverflowPx: Math.max(0, scrollWidth - innerWidth),
          headerHeight,
          titleSnippet: bodyText.split('\n').map((l) => l.trim()).filter(Boolean).slice(0, 4).join(' | '),
        };
      });

      let familyButtons = null;
      if (route.page === 'parent-portal') {
        const boletimBtn = win.locator('button:has-text("Boletim Oficial")').first();
        const simulatorBtn = win.locator('button:has-text("Simulador App Família")').first();
        const boletimVisible = await boletimBtn.isVisible().catch(() => false);
        const boletimEnabled = boletimVisible ? await boletimBtn.isEnabled().catch(() => false) : false;
        const simulatorVisible = await simulatorBtn.isVisible().catch(() => false);
        const simulatorEnabled = simulatorVisible ? await simulatorBtn.isEnabled().catch(() => false) : false;
        familyButtons = { boletimVisible, boletimEnabled, simulatorVisible, simulatorEnabled };
        console.log('  [PARENT-BUTTONS]', JSON.stringify(familyButtons));
        if (!boletimEnabled || !simulatorEnabled) {
          hasFailure = true;
        }
      }

      const shotPath = path.join(SCREENSHOT_DIR, route.file);
      await win.screenshot({ path: shotPath, fullPage: false });

      const newConsoleErrors = consoleErrors.slice(consoleCountBefore);
      const newPageErrors = pageErrors.slice(pageErrCountBefore);

      if (domAudit.hasErrorBoundary || domAudit.hasLgpdOverlay) {
        hasFailure = true;
      }

      routeReports.push({
        file: route.file,
        page: route.page,
        label: route.label,
        ...domAudit,
        familyButtons,
        newConsoleErrors,
        newPageErrors,
      });

      console.log(
        `  [SHOT] ${route.file} (${route.page}) -> ErrorBoundary=${domAudit.hasErrorBoundary}, LGPD=${domAudit.hasLgpdOverlay}, HeaderH=${domAudit.headerHeight}px, OverflowX=${domAudit.horizontalOverflowPx}px, ConsoleErrs=${newConsoleErrors.length}, PageErrs=${newPageErrors.length}`
      );
    }

    console.log('\n[SUMMARY]');
    console.log(JSON.stringify({
      unauthorizedIpcAlerts,
      totalConsoleErrors: consoleErrors.length,
      totalPageErrors: pageErrors.length,
      consoleErrorsSample: consoleErrors.slice(0, 15),
      pageErrorsSample: pageErrors.slice(0, 15),
      routeReports,
    }, null, 2));

    if (unauthorizedIpcAlerts.length > 0) {
      hasFailure = true;
    }

    if (hasFailure) {
      console.error('\n[VERIFY] Falhas críticas detectadas na auditoria!');
      process.exitCode = 1;
    } else {
      console.log('\n[VERIFY] Auditoria completa finalizada sem falhas críticas.');
    }
  } finally {
    await app.close().catch(() => {});
  }
}

main().catch((err) => {
  console.error('[VERIFY FATAL]', err);
  process.exit(1);
});
