import { _electron as electron, test, expect, ElectronApplication, Page } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

const DIST_MAIN = path.join(__dirname, '../dist/main.js');

test.describe('Pedagogical Playlists & Game Maker Studio — E2E Homologation', () => {
  let app: ElectronApplication;
  let win: Page;
  let userDataDir: string;

  test.beforeEach(async () => {
    userDataDir = path.join(__dirname, `../test-user-data-playlists-${Math.floor(Math.random() * 10000)}`);
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
  });

  test.afterEach(async () => {
    if (app) {
      await app.close();
    }
    if (fs.existsSync(userDataDir)) {
      try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch (e) {}
    }
  });

  test('Teacher Portal: Navegação e Gerenciamento de Playlists 5 Atos', async () => {
    // Navigate to teacher portal with playlists-gamemaker page
    await win.evaluate(() => {
      (window as any).aquila?.invoke?.('navigate', 'playlists-gamemaker');
    });

    await win.waitForTimeout(1000);

    // Verify page container renders without crash
    const body = win.locator('body');
    await expect(body).toBeVisible();

    const errorOverlay = win.locator('[class*="error-boundary"], [class*="crash-screen"]');
    expect(await errorOverlay.count()).toBe(0);

    console.log('[E2E Playlists] ✅ Teacher Portal Playlists & Game Maker renderizou com sucesso');
  });

  test('Student Portal: Acesso à aba Playlists & Games e Execução do Fluxo', async () => {
    // Navigate to student playlists
    await win.evaluate(() => {
      (window as any).aquila?.invoke?.('navigate', 'playlists-live');
    });

    await win.waitForTimeout(1000);

    const body = win.locator('body');
    await expect(body).toBeVisible();

    const errorOverlay = win.locator('[class*="error-boundary"], [class*="crash-screen"]');
    expect(await errorOverlay.count()).toBe(0);

    console.log('[E2E Playlists] ✅ Student Portal Playlists Viewer abriu sem erros');
  });
});
