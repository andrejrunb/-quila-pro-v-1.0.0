import { _electron as electron, test, expect, ElectronApplication, Page } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

const DIST_MAIN = path.join(__dirname, '../dist/main.js');

test.describe('H5P & Perseus Offline Container Lab — E2E Homologation', () => {
  let app: ElectronApplication;
  let win: Page;
  let userDataDir: string;

  test.beforeEach(async () => {
    userDataDir = path.join(__dirname, `../test-user-data-applet-${Math.floor(Math.random() * 10000)}`);
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

  test('H5PPerseusAppletLab: Catálogo, Execução Perseus Slider, Dicas Socráticas e Branching H5P', async () => {
    // Navigate to H5P & Perseus lab using both custom event and invoke
    await win.evaluate(() => {
      window.dispatchEvent(new CustomEvent('aquila:navigate', { detail: 'h5p-perseus-lab' }));
      (window as any).aquila?.invoke?.('navigate', 'h5p-perseus-lab');
    });

    await win.waitForTimeout(2000);

    const body = win.locator('body');
    await expect(body).toBeVisible();

    const errorOverlay = win.locator('[class*="error-boundary"], [class*="crash-screen"]');
    expect(await errorOverlay.count()).toBe(0);

    // Verify main components are present
    const headerTitle = win.locator('h1', { hasText: 'Laboratório de Applets H5P & Perseus' });
    await expect(headerTitle).toBeVisible({ timeout: 15000 });

    // Verify catalog has items
    const mathCard = win.locator('[data-testid="applet-card-perseus-math-afim-01"]');
    await expect(mathCard).toBeVisible();

    // Click on Math Slider Card to start Perseus player
    await mathCard.click();
    await win.waitForTimeout(600);

    // Verify Active Player loaded
    const playerContainer = win.locator('[data-testid="applet-active-player"]');
    await expect(playerContainer).toBeVisible();

    // Verify Cartesian SVG and controls
    const svgPlane = win.locator('svg.svg-cartesian');
    await expect(svgPlane).toBeVisible();

    const sliderM = win.locator('[data-testid="perseus-slider-m"]');
    await expect(sliderM).toBeVisible();

    // Request Socratic Hint
    const hintBtn = win.locator('button.hint-trigger-btn');
    await expect(hintBtn).toBeVisible();
    await hintBtn.click();
    await win.waitForTimeout(300);

    const hintItem = win.locator('.hint-item');
    expect(await hintItem.count()).toBeGreaterThanOrEqual(1);

    // Click Verify Solution Button
    const verifyBtn = win.locator('[data-testid="applet-verify-btn"]');
    await expect(verifyBtn).toBeVisible();
    await verifyBtn.click();
    await win.waitForTimeout(500);

    const resultBanner = win.locator('[data-testid="applet-result-banner"]');
    await expect(resultBanner).toBeVisible();

    // Switch back to Catalog
    const switchBtn = win.locator('button.applet-back-btn', { hasText: 'Trocar Applet' });
    await switchBtn.click();
    await win.waitForTimeout(500);

    // Filter to H5P
    const h5pFilterBtn = win.locator('button:has-text("H5P Interactive Packages")');
    await h5pFilterBtn.click();
    await win.waitForTimeout(400);

    const energyBranchCard = win.locator('[data-testid="applet-card-h5p-branching-energia-01"]');
    await expect(energyBranchCard).toBeVisible();
    await energyBranchCard.click();
    await win.waitForTimeout(600);

    // Verify Branching choices
    const branchChoiceSolar = win.locator('[data-testid="branch-choice-c-solar-bateria"]');
    await expect(branchChoiceSolar).toBeVisible();
    await branchChoiceSolar.click();
    await win.waitForTimeout(500);

    // Verify transition to next node
    const nextChoiceThrottling = win.locator('[data-testid="branch-choice-c-throttling-ia"]');
    await expect(nextChoiceThrottling).toBeVisible();

    // Switch to History Tab
    const historyTabBtn = win.locator('button.subnav-btn:has-text("Meu Histórico de Maestria")');
    await historyTabBtn.click();
    await win.waitForTimeout(500);

    const historySection = win.locator('[data-testid="applet-history-section"]');
    await expect(historySection).toBeVisible();

    console.log('[E2E H5P/Perseus] ✅ H5PPerseusAppletLab homologado com sucesso absoluto!');
  });
});
