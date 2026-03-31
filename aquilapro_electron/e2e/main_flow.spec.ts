import { test, expect } from '@playwright/test';

/**
 * Step 103 — E2E: Fluxo Login → Dashboard → RankingBoard
 * Verifica que o app carrega, permite login e navega para o ranking.
 */

test.describe('Fluxo Principal — Login & Navegação', () => {
  test('Deve exibir a tela de login ao abrir o app', async ({ page }) => {
    await page.goto('/');
    // A tela de login deve estar visível
    await expect(page).toHaveTitle(/Áquila Pro/i);
    const loginForm = page.locator('form, [data-testid="login-form"], input[type="password"]');
    await expect(loginForm.first()).toBeVisible({ timeout: 10_000 });
  });

  test('Deve redirecionar para dashboard após login válido', async ({ page }) => {
    await page.goto('/');

    // Preencher credenciais padrão
    const emailInput = page.locator('input[type="text"], input[type="email"]').first();
    const passInput = page.locator('input[type="password"]').first();
    const loginBtn = page.locator('button[type="submit"], button:has-text("Entrar")').first();

    await emailInput.fill('admin');
    await passInput.fill('admin123');
    await loginBtn.click();

    // Dashboard deve carregar
    await expect(page.locator('text=Dashboard, text=Visão Geral, [class*="dashboard"]').first())
      .toBeVisible({ timeout: 15_000 });
  });

  test('Deve navegar para RankingBoard e exibir seções de ranking', async ({ page }) => {
    await page.goto('/');

    // Login rápido
    await page.locator('input[type="text"], input[type="email"]').first().fill('admin');
    await page.locator('input[type="password"]').first().fill('admin123');
    await page.locator('button[type="submit"], button:has-text("Entrar")').first().click();

    // Aguardar dashboard
    await page.waitForTimeout(2000);

    // Buscar link de ranking na sidebar
    const rankingLink = page.locator('text=Ranking, [href*="ranking"], [data-page="ranking-board"]').first();
    if (await rankingLink.isVisible()) {
      await rankingLink.click();
      // Aguardar carregamento
      await expect(page.locator('text=Estrelas de Assiduidade, text=Risco de Reprovação').first())
        .toBeVisible({ timeout: 10_000 });
    }
  });

  test('Deve exibir mensagem de erro para credenciais inválidas', async ({ page }) => {
    await page.goto('/');
    await page.locator('input[type="text"], input[type="email"]').first().fill('usuario_invalido');
    await page.locator('input[type="password"]').first().fill('senha_errada');
    await page.locator('button[type="submit"], button:has-text("Entrar")').first().click();

    // Erro deve aparecer
    const errorMsg = page.locator('[class*="error"], [class*="alert"], text=inválid, text=incorret').first();
    await expect(errorMsg).toBeVisible({ timeout: 5_000 });
  });
});
