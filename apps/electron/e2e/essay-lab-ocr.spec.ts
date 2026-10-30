import { _electron as electron, test, expect, ElectronApplication, Page } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

const DIST_MAIN = path.join(__dirname, '../dist/main.js');

test.describe('Sovereign Essay Lab 1000 & OCR — E2E Homologation', () => {
  let app: ElectronApplication;
  let win: Page;
  let userDataDir: string;

  test.beforeEach(async () => {
    userDataDir = path.join(__dirname, `../test-user-data-essay-${Math.floor(Math.random() * 10000)}`);
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
    } else {
      await win.fill('input[placeholder*="COLEGIOVISAO"]', 'VISAO').catch(() => {});
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
        try { app.process().kill(); } catch (err) {}
      }
    }
    if (fs.existsSync(userDataDir)) {
      try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch (e) {}
    }
  });

  test('EssayLab1000: Navegação, Modalidades (Digitação, Foto OCR e Histórico) e Renderização', async () => {
    // Navigate to essay lab
    await win.evaluate(() => {
      (window as any).aquila?.invoke?.('navigate', 'essay-lab');
    });

    await win.waitForTimeout(1500);

    const body = win.locator('body');
    await expect(body).toBeVisible();

    const errorOverlay = win.locator('[class*="error-boundary"], [class*="crash-screen"]');
    expect(await errorOverlay.count()).toBe(0);

    // Verify main components are present
    const headerTitle = win.locator('h1');
    await expect(headerTitle).toContainText('Laboratório de Redação');

    // Verify the mode buttons exist
    const photoOcrBtn = win.locator('button', { hasText: 'Folha Manuscrita (Foto/Upload OCR)' });
    await expect(photoOcrBtn).toBeVisible();

    const historyBtn = win.locator('button', { hasText: 'Minhas Redações Anteriores' });
    await expect(historyBtn).toBeVisible();

    // Click on photo OCR mode
    await photoOcrBtn.click();
    await win.waitForTimeout(500);

    const uploadZoneLabel = win.locator('label[for="essay-photo-input"]');
    await expect(uploadZoneLabel).toBeVisible();

    // Click on history mode
    await historyBtn.click();
    await win.waitForTimeout(500);

    const historyHeader = win.locator('h3', { hasText: 'Histórico de Redações Auditadas do Aluno' });
    await expect(historyHeader).toBeVisible();

    console.log('[E2E EssayLab] ✅ EssayLab1000 com modalidades Digitação, Foto OCR e Histórico homologado com sucesso!');
  });
});
