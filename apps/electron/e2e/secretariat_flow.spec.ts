import { _electron as electron } from '@playwright/test';
import { test, expect, ElectronApplication, Page } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

test.describe('Secretariat Module Flow — Áquila Pro', () => {
  let electronApp: ElectronApplication;
  let window: Page;
  let userDataDir: string;

  test.beforeEach(async () => {
    userDataDir = path.join(__dirname, `../test-user-data-sec-${Math.floor(Math.random() * 10000)}`);
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
    await window.fill('input[type="password"]', 'Admin@2026!');
    await window.click('button[type="submit"]');
    await window.waitForSelector('.dashboard-container', { timeout: 60000 });

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

  test.afterEach(async () => {
    if (electronApp) {
      try {
        await Promise.race([
          electronApp.close(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000))
        ]);
      } catch (e) {
        console.log('[E2E] Force killing Electron process in secretariat_flow.spec.ts...');
        try { electronApp.process().kill(); } catch (err) {}
      }
    }
    if (fs.existsSync(userDataDir)) {
      try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch (e) {}
    }
  });

  test('Navigate to Secretariat and interact with modules', async () => {
    // Abrir Hub Administrativo primeiro
    await window.locator('button.hub-btn[title="Hub Administrativo"]').click();
    await window.waitForTimeout(1000);

    // Navegar para Controle de Acessos (User Management / Secretaria)
    await window.evaluate(() => (window as any).aquila?.invoke?.('navigate', 'user-management'));
    await window.waitForTimeout(2000);

    await expect(window.locator('body')).toContainText(/Gestão de Acessos/i);
    console.log('[E2E] ✅ Secretaria operacional');
  });
});
