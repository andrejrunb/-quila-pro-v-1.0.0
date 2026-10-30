import { _electron as electron, test, expect, ElectronApplication, Page } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

const DIST_MAIN = path.join(__dirname, '../dist/main.js');

test.describe('Piloto 2 — Catracas em Modo Sombra (Shadow Mode E2E Homologation)', () => {
  let app: ElectronApplication;
  let win: Page;
  let userDataDir: string;

  test.beforeEach(async () => {
    userDataDir = path.join(__dirname, `../test-user-data-shadow-${Math.floor(Math.random() * 10000)}`);
    if (fs.existsSync(userDataDir)) {
      try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch (e) {}
    }
    fs.mkdirSync(userDataDir, { recursive: true });

    // Clone template DB with schema
    const templateDb = path.join(__dirname, '../test-user-data/AquilaPro/aquila.db');
    const targetDbDir = path.join(userDataDir, 'AquilaPro');
    fs.mkdirSync(targetDbDir, { recursive: true });
    
    if (fs.existsSync(templateDb)) {
      fs.copyFileSync(templateDb, path.join(targetDbDir, 'aquila.db'));
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
    }
    await win.fill('input[placeholder*="usuário"]', 'admin');
    await win.fill('input[type="password"]', process.env.INITIAL_ADMIN_PASSWORD || 'EagleSovereign2026#Admin');
    await win.click('button[type="submit"]');

    // Dispensar modal LGPD se aparecer
    await win.waitForTimeout(1500);
    const lgpdBtn = win.locator('button:has-text("Concordar e Continuar")');
    const lgpdVisible = await lgpdBtn.isVisible({ timeout: 5000 }).catch(() => false);
    if (lgpdVisible) {
      await lgpdBtn.click();
      await win.waitForTimeout(1000);
    }

    await win.waitForSelector('.dashboard-container, .dashboard-elite, .dashboard-main, .portal-wrapper, body', { timeout: 30000 });
  });

  test.afterEach(async () => {
    if (app) {
      try {
        await Promise.race([
          app.close(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000))
        ]);
      } catch (e) {
        try { app.process().kill(); } catch (err) {}
      }
    }
    if (fs.existsSync(userDataDir)) {
      try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch (e) {}
    }
  });

  test('TurnstileShadowConsole: Modo Sombra na Portaria, Autoteste de Bancada e Contingência Anti-Constrangimento', async () => {
    // Navigate to turnstile-shadow
    await win.evaluate(() => {
      window.dispatchEvent(new CustomEvent('aquila:navigate', { detail: 'turnstile-shadow' }));
      (window as any).aquila?.invoke?.('navigate', 'turnstile-shadow');
    });

    await win.waitForTimeout(2000);

    const body = win.locator('body');
    await expect(body).toBeVisible();

    const errorOverlay = win.locator('[class*="error-boundary"], [class*="crash-screen"]');
    expect(await errorOverlay.count()).toBe(0);

    // Verify main components are present
    const headerTitle = win.locator('h1', { hasText: 'Cockpit da Guarita' });
    await expect(headerTitle).toBeVisible({ timeout: 15000 });

    // Verify Shadow Mode warning banner
    const shadowBanner = win.locator('[data-testid="shadow-mode-banner"]');
    await expect(shadowBanner).toBeVisible();
    await expect(shadowBanner).toContainText('MODO SOMBRA EM OPERAÇÃO (PILOTO 2 SEGURO)');

    // Verify Bench Test Card
    const benchCard = win.locator('[data-testid="bench-test-card"]');
    await expect(benchCard).toBeVisible();

    const runBenchBtn = win.locator('[data-testid="btn-run-bench-test"]');
    await expect(runBenchBtn).toBeVisible();
    await runBenchBtn.click();
    await win.waitForTimeout(1000);

    // Verify bench logs
    const benchLogs = win.locator('[data-testid="bench-log-list"]');
    await expect(benchLogs).toBeVisible();
    await expect(benchLogs).toContainText('OK:');

    // Test Contingency Manual Bypass
    const contingencyBox = win.locator('[data-testid="contingency-box"]');
    await expect(contingencyBox).toBeVisible();

    const bypassInput = win.locator('[data-testid="input-bypass-student"]');
    await expect(bypassInput).toBeVisible();
    await bypassInput.fill('Bruno Carvalho (9ºA)');

    const bypassBtn = win.locator('[data-testid="btn-manual-bypass"]');
    await expect(bypassBtn).toBeVisible();
    await bypassBtn.click();
    await win.waitForTimeout(600);

    const successMsg = win.locator('[data-testid="bypass-success-msg"]');
    await expect(successMsg).toBeVisible();
    await expect(successMsg).toContainText('Liberação manual');

    console.log('[E2E Piloto 2] ✅ Cockpit da Guarita e Modo Sombra homologados com sucesso absoluto!');
  });
});
