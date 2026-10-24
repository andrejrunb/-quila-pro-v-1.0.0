import { _electron as electron } from '@playwright/test';
import { test, expect, ElectronApplication, Page } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

test.describe('Regressão Visual — Áquila Pro Elite UI', () => {
  let electronApp: ElectronApplication;
  let window: Page;
  let userDataDir: string;

  test.beforeAll(async () => {
    userDataDir = path.join(__dirname, '../test-user-data-visual');
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
    }

    electronApp = await electron.launch({
      args: [path.join(__dirname, '../dist/main.js')],
      env: { 
        ...process.env, 
        PLAYWRIGHT: 'true',
        AQUILA_USER_DATA_OVERRIDE: userDataDir,
        NODE_ENV: 'development'
      },
      timeout: 120000
    });

    window = await electronApp.firstWindow();
    await window.evaluate(() => localStorage.setItem('aquila_setup_complete', 'true'));
    await window.reload();
    await window.waitForSelector('.login-form', { timeout: 30000 });
    await window.fill('input[placeholder*="COLEGIOVISAO"]', 'VISAO');
    await window.fill('input[placeholder*="usuário"]', 'admin');
    await window.fill('input[type="password"]', process.env.INITIAL_ADMIN_PASSWORD || 'EagleSovereign2026#Admin');
    await window.click('button[type="submit"]');
    await window.waitForSelector('.dashboard-container, .dashboard-elite', { timeout: 60000 });

    // Dispensar modal LGPD caso apareça após o login (sem consentimento no DB de teste)
    await window.waitForTimeout(1500);
    const lgpdOverlay = window.locator('.lgpd-modal-overlay');
    const lgpdVisible = await lgpdOverlay.isVisible().catch(() => false);
    if (lgpdVisible) {
      console.log('[E2E] Modal LGPD detectado. Aceitando automaticamente...');
      await window.click('button:has-text("Concordar e Continuar")');
      await window.waitForTimeout(800);
    }
  });

  test.afterAll(async () => {
    if (electronApp) {
      try {
        await Promise.race([
          electronApp.close(),
          new Promise((_, r) => setTimeout(() => r(new Error('timeout')), 5000))
        ]);
      } catch (e) {
        try { electronApp.process().kill(); } catch (err) {}
      }
    }
  });

  test('Snapshot: Dashboard Elite (Home)', async () => {
    await window.waitForTimeout(2000);
    await expect(window).toHaveScreenshot('dashboard-elite-home.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.20,
      animations: 'disabled'
    });
  });

  test('Snapshot: Admin Portal (Navigation & Modules)', async () => {
    await window.evaluate(() => (window as any).aquila.invoke('navigate', 'settings'));
    await window.waitForTimeout(2000);
    await expect(window).toHaveScreenshot('admin-portal-view.png', { fullPage: true, maxDiffPixelRatio: 0.20 });
  });
});
