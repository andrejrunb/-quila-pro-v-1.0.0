/**
 * verify_classroom_workstation.cjs
 * Validação Full HD (1920x1080) do Terminal Sala de Aula:
 * - Zero cortes verticais nas colunas (Horário, Tarefas, Eventos)
 * - Registro de Tipo de Uso do Computador + Turma + Auto-Start SO
 * - Agendamento automático de energia (-10min ligar / +10min desligar)
 * - Pedido de Autorização de Desligamento com Timer de 60s
 * - Projeção da tela atualizada no Plano de Fundo do Desktop (arquivo PNG gerado via capturePage)
 */

const { _electron: electron } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const MAIN_PATH = 'C:\\aquila\\apps\\electron\\dist\\main.js';
const USER_DATA_DIR = 'C:\\aquila\\test-results\\pilot_journey_env';
const SCREENSHOT_DIR = 'C:\\Users\\Thaysa\\.gemini\\antigravity\\brain\\5fca40fa-e48d-4bc6-bc7a-084bf4a62fe4\\screenshots';

async function main() {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

  console.log('[WS-VERIFY] Iniciando Electron em 1920x1080...');
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
  const unauthorizedAlerts = [];
  let hasFailure = false;

  try {
    const win = await app.firstWindow({ timeout: 60000 });
    win.on('dialog', async (d) => d.dismiss().catch(() => {}));
    win.on('console', (msg) => {
      const txt = msg.text();
      if (txt.includes('Canal IPC não autorizado') || txt.includes('SECURITY ALERT')) {
        unauthorizedAlerts.push(txt);
      }
      if (msg.type() === 'error') {
        consoleErrors.push(txt);
      }
    });

    await win.setViewportSize({ width: 1920, height: 1080 });
    await win.waitForLoadState('domcontentloaded');
    await win.waitForTimeout(2000);

    // 1. Login Admin
    const authRes = await win.evaluate(async () => {
      localStorage.setItem('aquila_setup_complete', 'true');
      localStorage.removeItem('aquila_terminal_profile');
      try { await window.aquila.invoke('logout'); } catch {}
      const attempts = [
        { channel: 'auth:login', creds: { username: 'admin.piloto', password: 'PilotPassword@2026!' } },
        { channel: 'auth:login', creds: { username: 'admin', password: 'Admin@2026!' } },
      ];
      for (const att of attempts) {
        try {
          const res = await window.aquila.invoke(att.channel, att.creds);
          if (res?.success && res?.user) {
            sessionStorage.setItem('aquila_session_user', JSON.stringify(res.user));
            return res;
          }
        } catch {}
      }
      return null;
    });

    if (!authRes?.success) {
      throw new Error('Falha ao autenticar no Electron para teste.');
    }

    await win.reload({ waitUntil: 'domcontentloaded' });
    await win.waitForTimeout(2000);

    const lgpdBtn = win.locator('button:has-text("Concordar e Continuar"), button:has-text("Aceitar")').first();
    if (await lgpdBtn.isVisible().catch(() => false)) {
      await lgpdBtn.click();
      await win.waitForTimeout(1000);
    }

    // 2. Navegar para ClassroomDashboard
    await win.evaluate(() => {
      window.dispatchEvent(new CustomEvent('aquila:navigate', { detail: 'classroom-dashboard' }));
    });
    await win.waitForTimeout(2200);

    // 3. Testar todos os novos canais IPC Workstation
    const ipcResults = await win.evaluate(async () => {
      const cfg = await window.aquila.invoke('workstation:configure', {
        usageType: 'classroom',
        classId: '1-serie-b',
        className: '1 SERIE B (1ª Série EM)',
        autoStartOs: true,
        projectWallpaper: true,
        wakeOffsetMinutes: 10,
        shutdownOffsetMinutes: 10,
        shutdownConfirmSeconds: 60,
      });
      const pwr = await window.aquila.invoke('workstation:schedule-power', {
        classId: '1-serie-b',
        className: '1 SERIE B (1ª Série EM)',
        firstLessonStart: '07:30',
        lastLessonEnd: '11:10',
        wakeOffsetMinutes: 10,
        shutdownOffsetMinutes: 10,
      });
      const wp = await window.aquila.invoke('workstation:project-wallpaper');
      const simCancel = await window.aquila.invoke('workstation:cancel-shutdown', { postponeMinutes: 60 });
      const simShut = await window.aquila.invoke('workstation:execute-shutdown', { classId: '1-serie-b', reason: 'playwright_audit' });
      return { cfg, pwr, wp, simCancel, simShut };
    });

    console.log('[IPC-WS] configure:', ipcResults.cfg?.success, 'usage:', ipcResults.cfg?.config?.usageType);
    console.log('[IPC-WS] schedule-power:', ipcResults.pwr?.wakeTime, '->', ipcResults.pwr?.shutdownTime);
    console.log('[IPC-WS] project-wallpaper:', ipcResults.wp?.success, 'bytes:', ipcResults.wp?.bytes, 'path:', ipcResults.wp?.wallpaperPath);
    console.log('[IPC-WS] cancel-shutdown:', ipcResults.simCancel?.success, ipcResults.simCancel?.status);
    console.log('[IPC-WS] execute-shutdown (safe mode):', ipcResults.simShut?.success, 'simulated:', ipcResults.simShut?.simulated);

    if (!ipcResults.cfg?.success || ipcResults.pwr?.wakeTime !== '07:20' || ipcResults.pwr?.shutdownTime !== '11:20') {
      hasFailure = true;
      console.error('[FAIL] Cálculo de wake/shutdown falhou!');
    }
    if (!ipcResults.wp?.success || !(ipcResults.wp?.bytes > 5000)) {
      hasFailure = true;
      console.error('[FAIL] Wallpaper PNG não foi capturado em tamanho válido!');
    }
    if (!ipcResults.simShut?.simulated) {
      hasFailure = true;
      console.error('[FAIL] execute-shutdown deveria operar em modo simulado no Playwright!');
    }

    // 4. Recarregar estado na página e verificar Zero Cortes Verticais em 1920x1080
    await win.waitForTimeout(1000);
    const layoutMetrics = await win.evaluate(() => {
      const panels = Array.from(document.querySelectorAll('.panel-card-content'));
      const overflows = panels.map((p, idx) => ({
        idx,
        scrollHeight: p.scrollHeight,
        clientHeight: p.clientHeight,
        clipped: p.scrollHeight > p.clientHeight + 4,
      }));
      const thirdEvent = document.querySelectorAll('.classroom-event-item')[2];
      const thirdTask = document.querySelectorAll('.classroom-task-item')[2];
      const viewportH = window.innerHeight;
      const evRect = thirdEvent ? thirdEvent.getBoundingClientRect() : null;
      const tkRect = thirdTask ? thirdTask.getBoundingClientRect() : null;
      return {
        overflows,
        scheduleCount: document.querySelectorAll('.schedule-time-row').length,
        taskCount: document.querySelectorAll('.classroom-task-item').length,
        eventCount: document.querySelectorAll('.classroom-event-item').length,
        thirdEventFullyVisible: evRect ? evRect.bottom <= viewportH : false,
        thirdTaskFullyVisible: tkRect ? tkRect.bottom <= viewportH : false,
        powerStripText: document.querySelector('.workstation-power-strip')?.textContent || '',
      };
    });

    console.log('[LAYOUT] Métricas 1080p:', JSON.stringify(layoutMetrics, null, 2));
    if (!layoutMetrics.thirdEventFullyVisible || !layoutMetrics.thirdTaskFullyVisible) {
      hasFailure = true;
      console.error('[FAIL] 3º card de Tarefas ou Eventos está cortado!');
    }
    if (layoutMetrics.overflows.some(o => o.clipped)) {
      hasFailure = true;
      console.error('[FAIL] Algum painel está com scrollHeight > clientHeight!');
    }

    // Print 1: ClassroomDashboard completo (sem cortes, com barra de energia + desktop wallpaper + auto-start SO)
    const p1 = path.join(SCREENSHOT_DIR, '01_modo_sala_workstation_1080p.png');
    await win.screenshot({ path: p1 });
    console.log('[SHOT] Salvo:', p1);

    // Print 2: Abrir Modal de Registro do Tipo de Uso do Computador & Turma
    await win.locator('.ws-chip-config').click();
    await win.waitForTimeout(500);
    const modalVisible = await win.locator('.ws-modal-overlay [aria-label="Selecionar Turma Vinculada"], .ws-modal-usage-grid').first().isVisible().catch(() => false);
    console.log('[MODAL-CONFIG] Aberto:', modalVisible);
    const p2 = path.join(SCREENSHOT_DIR, '02_registro_tipo_uso_computador_turma.png');
    await win.screenshot({ path: p2 });
    console.log('[SHOT] Salvo:', p2);

    // Fechar modal de configuração
    await win.locator('.ws-modal-close').click();
    await win.waitForTimeout(300);

    // Print 3: Acionar Modal de Pedido de Autorização para Desligar com Timer de 60s
    await win.locator('.btn-test-shutdown-timer').click();
    await win.waitForTimeout(1500); // verifica contagem regressiva (ex: 59s ou 58s)
    const countdownText = await win.locator('.ws-countdown-number').textContent().catch(() => '');
    console.log('[MODAL-SHUTDOWN] Timer atual:', countdownText);
    if (!countdownText || countdownText === '0s') {
      hasFailure = true;
      console.error('[FAIL] Timer de 60s não está exibindo contagem válida!');
    }
    const p3 = path.join(SCREENSHOT_DIR, '03_modal_autorizacao_desligar_timer_60s.png');
    await win.screenshot({ path: p3 });
    console.log('[SHOT] Salvo:', p3);

    // Cancelar desligamento para testar botão
    await win.locator('.ws-btn-keep-on').click();
    await win.waitForTimeout(400);

    console.log('\n[SUMMARY] Unauthorized IPC alerts:', unauthorizedAlerts.length);
    console.log('[SUMMARY] Console errors:', consoleErrors.length);

    if (unauthorizedAlerts.length > 0) {
      hasFailure = true;
      console.error('Alerts:', unauthorizedAlerts);
    }
  } finally {
    await app.close().catch(() => {});
  }

  if (hasFailure) {
    process.exit(1);
  }
  console.log('[WS-VERIFY] Todos os testes do Terminal de Sala de Aula passaram com sucesso!');
}

main().catch((err) => {
  console.error('[WS-VERIFY] Erro fatal:', err);
  process.exit(1);
});
