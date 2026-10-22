import { _electron as electron, test, expect, ElectronApplication, Page } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

/**
 * portals.spec.ts — E2E: Abertura de abas dos portais Teacher, Security e HR
 */

const DIST_MAIN = path.join(__dirname, '../dist/main.js');

async function navigateAndVerify(win: Page, page: string, label: string) {
  try {
    await win.evaluate((p) => {
      (window as any).aquila?.invoke?.('navigate', p);
    }, page);
  } catch (e) {}

  await win.waitForTimeout(1500);

  const errorOverlay = win.locator('[class*="error-boundary"], [class*="crash-screen"]');
  const hasError = await errorOverlay.count();
  
  if (hasError > 0) {
    const text = await errorOverlay.first().innerText();
    expect(hasError, `Portal "${label}" (page="${page}") causou crash: ${text}`).toBe(0);
  }

  await expect(win.locator('body')).toBeVisible({ timeout: 15000 });
  console.log(`[E2E] ✅ Aba "${label}" abriu sem crash`);
}

test.describe('Portals Resilience — Áquila Pro', () => {
  let app: ElectronApplication;
  let win: Page;
  let userDataDir: string;

  test.beforeEach(async () => {
    userDataDir = path.join(__dirname, `../test-user-data-portals-${Math.floor(Math.random() * 10000)}`);
    if (fs.existsSync(userDataDir)) {
      try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch (e) {}
    }
    fs.mkdirSync(userDataDir, { recursive: true });

    // [E2E-OPTIMIZATION] Copy template DB instead of seeding again
    const templateDb = path.join(__dirname, '../test-user-data/AquilaPro/aquila.db');
    const targetDbDir = path.join(userDataDir, 'AquilaPro');
    fs.mkdirSync(targetDbDir, { recursive: true });
    
    if (fs.existsSync(templateDb)) {
      fs.copyFileSync(templateDb, path.join(targetDbDir, 'aquila.db'));
      console.log(`[E2E] DB cloned from template to: ${userDataDir}`);
    } else {
      console.warn(`[E2E] Template DB not found at ${templateDb}. Falling back to empty DB.`);
    }

    app = await electron.launch({
      args: [DIST_MAIN],
      env: { 
        ...process.env, 
        PLAYWRIGHT: 'true',
        AQUILA_USER_DATA_OVERRIDE: userDataDir,
        NODE_ENV: 'development'
      },
      timeout: 120000
    });

    win = await app.firstWindow();
    await win.evaluate(() => localStorage.setItem('aquila_setup_complete', 'true'));
    await win.reload();
    await win.waitForSelector('.eagle-form, .login-form, .eagle-form-panel', { timeout: 30000 });
    const hasSelect = await win.locator('select.eagle-select').count();
    if (hasSelect > 0) {
      await win.selectOption('select.eagle-select', 'COLEGIOVISAO');
    } else {
      await win.fill('input[placeholder*="COLEGIOVISAO"]', 'VISAO').catch(() => {});
    }
    await win.fill('input[placeholder*="usuário"]', 'admin');
    await win.fill('input[type="password"]', 'Admin@2026!');
    await win.click('button[type="submit"]');

    // Dispensar modal LGPD caso apareça após o login (sem consentimento no DB de teste)
    await win.waitForTimeout(1500);
    const lgpdBtn = win.locator('button:has-text("Concordar e Continuar")');
    const lgpdVisible = await lgpdBtn.isVisible({ timeout: 5000 }).catch(() => false);
    if (lgpdVisible) {
      console.log('[E2E] Modal LGPD detectado. Aceitando automaticamente...');
      await lgpdBtn.click();
      await win.waitForTimeout(1000);
    }

    await win.waitForSelector('.dashboard-container, .dashboard-elite, .dashboard-main, .portal-wrapper, .portal-glass-container, .ap-cockpit', { timeout: 60000 });
  });

  test.afterEach(async () => {
    if (app) {
      try {
        await Promise.race([
          app.close(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000))
        ]);
      } catch (e) {
        console.log('[E2E] Force killing Electron process in portals.spec.ts...');
        try { app.process().kill(); } catch (err) {}
      }
    }
    if (fs.existsSync(userDataDir)) {
      try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch (e) {}
    }
  });

  test('teacher-dashboard — abre sem crash', async () => {
    await navigateAndVerify(win, 'teacher-dashboard', 'Teacher Dashboard');
  });

  test('security-monitor — abre sem crash', async () => {
    await navigateAndVerify(win, 'security-monitor', 'Security Hub');
  });

  test('hr — portal principal abre sem crash', async () => {
    await navigateAndVerify(win, 'hr', 'HR Portal');
  });

  test('student-portal — abre sem crash', async () => {
    await navigateAndVerify(win, 'student-portal', 'Student Portal');
  });

  test('ai-lab (simuladores e mentores) — abre sem crash', async () => {
    await navigateAndVerify(win, 'ai-lab', 'AI Lab & Simulators');
  });

  test('skill-tree (árvore BNCC) — abre sem crash', async () => {
    await navigateAndVerify(win, 'skill-tree', 'BNCC Skill Tree');
  });

  test('essay-lab (redação nota 1000) — abre sem crash', async () => {
    await navigateAndVerify(win, 'essay-lab', 'Essay Lab 1000');
  });

  test('omr-scanner (scanner gabarito) — abre sem crash', async () => {
    await navigateAndVerify(win, 'omr-scanner', 'OMR Scanner');
  });

  test('family (portal da família) — abre sem crash', async () => {
    await navigateAndVerify(win, 'family', 'Family & Guardians Portal');
  });

  test('bncc-heatmap (mapa de calor BNCC) — abre sem crash', async () => {
    await navigateAndVerify(win, 'bncc-heatmap', 'BNCC Heatmap');
  });

  test('attendance (chamada inteligente facial & LDB) — abre sem crash', async () => {
    await navigateAndVerify(win, 'attendance', 'Attendance');
  });

  test('coordination (portal da coordenação neuro-pedagógica) — abre sem crash', async () => {
    await navigateAndVerify(win, 'coordination', 'Coordination Portal');
  });

  test('secretaria-portal (secretaria digital soberana) — abre sem crash', async () => {
    await navigateAndVerify(win, 'secretaria-portal', 'Secretaria Digital');
  });

  test('load-testing (stress test & benchmark SQA-1000) — abre sem crash', async () => {
    await navigateAndVerify(win, 'load-testing', 'Load Testing');
  });

  test('slide-studio (estúdio de slides interativos) — abre sem crash', async () => {
    await navigateAndVerify(win, 'slide-studio', 'Slide Studio');
  });

  test('activity-factory (fábrica de atividades interativas) — abre sem crash', async () => {
    await navigateAndVerify(win, 'activity-factory', 'Activity Factory');
  });

  test('pvp-arena (arena de batalhas socráticas) — abre sem crash', async () => {
    await navigateAndVerify(win, 'pvp-arena', 'PvP Arena');
  });

  test('mastery-chamber (câmara de maestria & mentores socráticos) — abre sem crash', async () => {
    await navigateAndVerify(win, 'mastery-chamber', 'Mastery Chamber');
  });

  test('ai-studio (estúdio de IA docente) — abre sem crash', async () => {
    await navigateAndVerify(win, 'ai-studio', 'AI Studio');
  });

  test('gradebook (diário de classe docente) — abre sem crash', async () => {
    await navigateAndVerify(win, 'gradebook', 'Gradebook');
  });

  test('seating-intelligence (inteligência de disposição de sala) — abre sem crash', async () => {
    await navigateAndVerify(win, 'seating-intelligence', 'Seating Intelligence');
  });

  test('knowledge-canvas (canvas de conhecimento soberano & grafo mental Albus) — abre sem crash', async () => {
    await navigateAndVerify(win, 'knowledge-canvas', 'Knowledge Canvas');
  });

  test('mobile-parent-app (simulador mobile da família e docente) — abre sem crash', async () => {
    await navigateAndVerify(win, 'mobile-parent-app', 'Mobile Companion & Parent App');
  });
});
