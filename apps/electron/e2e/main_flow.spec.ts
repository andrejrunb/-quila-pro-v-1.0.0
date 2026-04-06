import { _electron as electron } from '@playwright/test';
import { test, expect, ElectronApplication, Page } from '@playwright/test';
import * as path from 'path';

/**
 * Step 103 — E2E: Fluxo Login → Dashboard → RankingBoard
 * Verifica que o app carrega, permite login e navega para o ranking.
 */

test.describe('Fluxo Principal — Login & Navegação', () => {
  let electronApp: ElectronApplication;
  let window: Page;

  test.beforeAll(async () => {
    electronApp = await electron.launch({
      args: [path.join(__dirname, '../dist/main.js')],
      env: { ...process.env, PLAYWRIGHT: 'true' },
      timeout: 60000
    });

    // Capturar logs do Processo Principal (Main)
    electronApp.process().stdout?.on('data', data => console.log(`[Main] ${data.toString()}`));
    electronApp.process().stderr?.on('data', data => console.error(`[Main Error] ${data.toString()}`));

    window = await electronApp.firstWindow();

    // Capturar logs do console do Renderer
    window.on('console', msg => console.log(`[Renderer] ${msg.text()}`));
    window.on('pageerror', err => console.error(`[Renderer Error] ${err.message}`));

    await window.waitForLoadState('domcontentloaded', { timeout: 30000 });
  });

  test.afterAll(async () => {
    await electronApp.close();
  });

  test('Deve exibir a tela de login ao abrir o app', async () => {
    // Bypass SetupWizard
    await window.evaluate(() => localStorage.setItem('aquila_setup_complete', 'true'));

    // A tela de login deve estar visível
    expect(await window.title()).toMatch(/Áquila Pro/);
    const loginForm = window.locator('form, [class*="login-form"], input[type="password"]');
    await expect(loginForm.first()).toBeVisible({ timeout: 15_000 });
  });

  test('Deve exibir mensagem de erro para credenciais inválidas', async () => {
    await window.locator('input[type="text"]').first().fill('usuario_invalido');
    await window.locator('input[type="password"]').first().fill('senha_errada');
    await window.locator('button[type="submit"]').first().click();

    // Erro deve aparecer (classe 'login-error' no LoginPage.tsx)
    const errorMsg = window.locator('.login-error').first();
    await expect(errorMsg).toBeVisible({ timeout: 15_000 });
  });

  test('Deve redirecionar para dashboard após login válido', async () => {
    // Preencher credenciais padrão
    const userInput = window.locator('input[type="text"]').first();
    const passInput = window.locator('input[type="password"]').first();
    const loginBtn = window.locator('button[type="submit"]').first();

    await userInput.fill('playwright_admin');
    await passInput.fill('senha_playwright_123'); // Credenciais de teste limpas via injection
    await loginBtn.click();

    // Dashboard deve carregar (classe 'dashboard-elite' no Dashboard.tsx)
    const dashboardContainer = window.locator('.dashboard-elite').first();
    await expect(dashboardContainer).toBeVisible({ timeout: 30_000 });
  });
});
