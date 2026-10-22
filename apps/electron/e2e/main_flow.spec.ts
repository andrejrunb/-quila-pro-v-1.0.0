import { _electron as electron } from '@playwright/test';
import { test, expect, ElectronApplication, Page } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';
/**
 * Step 103 — E2E: Fluxo Login → Dashboard → RankingBoard
 * Verifica que o app carrega, permite login e navega para o ranking.
 */

test.describe('Fluxo Principal — Login & Navegação', () => {
  let electronApp: ElectronApplication;
  let window: Page;

  test.beforeAll(async () => {
    const userDataDir = path.join(__dirname, '../test-user-data-mainflow');
    
    // [E2E-STABILIZATION] Limpar a pasta do user-data para garantir estado inicial (sem sessão)
    if (fs.existsSync(userDataDir)) {
      fs.rmSync(userDataDir, { recursive: true, force: true });
    }
    
    // [E2E-OPTIMIZATION] Copy template DB instead of seeding again
    const templateDb = path.join(__dirname, '../test-user-data/AquilaPro/aquila.db');
    const targetDbDir = path.join(userDataDir, 'AquilaPro');
    if (!fs.existsSync(targetDbDir)) {
      fs.mkdirSync(targetDbDir, { recursive: true });
    }
    
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

    // Capturar logs do Processo Principal (Main)
    electronApp.process().stdout?.on('data', data => console.log(`[Main] ${data.toString()}`));
    electronApp.process().stderr?.on('data', data => console.error(`[Main Error] ${data.toString()}`));

    console.log('[E2E] Searching for Main Window...');
    window = await electronApp.firstWindow({ timeout: 120000 });
    
    // Wait for the window to have the correct title (Unified to Áquila Pro)
    // This distinguishes the main window from DevTools or other helper windows
    await window.waitForFunction(() => {
      return document.title.includes('Áquila Pro');
    }, { timeout: 45000 });

    // Capturar logs do console do Renderer
    window.on('console', msg => console.log(`[Renderer] ${msg.text()}`));
    window.on('pageerror', err => console.error(`[Renderer Error] ${err.message}`));

    await window.waitForLoadState('domcontentloaded');
  });

  test.afterAll(async () => {
    try {
      if (window && !window.isClosed()) {
        await window.evaluate(() => window.close()).catch(() => {});
      }
      await electronApp.close();
    } catch (e) {
      console.warn('[E2E] Detalhe de log ao fechar a aplicação (Ignorado):', e);
    }
  });

  test('Fluxo completo: Boot, bypass de Setup, erro de credenciais e Login com sucesso', async () => {
    // 1. Setup e Boot Validation
    console.log('[E2E] Aguardando QuantumBoot se desprender do DOM...');
    await window.waitForSelector('.quantum-boot-container', { state: 'detached', timeout: 45000 });

    // Bypass SetupWizard and reload
    await window.evaluate(() => localStorage.setItem('aquila_setup_complete', 'true'));
    await window.reload();

    // Aguardar boot novamente 
    await window.waitForSelector('.quantum-boot-container', { state: 'detached', timeout: 45000 });

    // A tela de login deve estar visível
    const loginForm = window.locator('.login-form');
    await expect(loginForm.first()).toBeVisible({ timeout: 20_000 });

    // 2. Testar falha de credenciais
    await window.locator('input[placeholder*="COLEGIOVISAO"]').fill('VISAO');
    await window.locator('input[placeholder*="usuário"]').fill('usuario_invalido');
    await window.locator('input[type="password"]').fill('senha_errada');
    await window.locator('button[type="submit"]').first().click();

    const errorMsg = window.locator('.login-error').first();
    await expect(errorMsg).toBeVisible({ timeout: 15_000 });

    // 3. Testar login com sucesso
    await window.locator('input[placeholder*="COLEGIOVISAO"]').fill('VISAO');
    await window.locator('input[placeholder*="usuário"]').fill('admin');
    await window.locator('input[type="password"]').fill('Admin@2026!'); 
    await window.locator('button[type="submit"]').first().click();

    // Dashboard deve carregar e estar visível
    const dashboardContainer = window.locator('.dashboard-elite').first();
    await expect(dashboardContainer).toBeVisible({ timeout: 30_000 });
  });
});
