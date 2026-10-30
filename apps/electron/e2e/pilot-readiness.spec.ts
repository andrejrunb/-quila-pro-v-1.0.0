import { test, expect } from '@playwright/test';

test.describe('Áquila Pro — Cockpit de Prontidão dos Dois Pilotos (H-01 & H-02)', () => {
  test('deve autenticar como administrador e auditar a prontidão dos Dois Pilotos', async ({ page }) => {
    // 1. Acessa a aplicação
    await page.goto('http://localhost:3001');

    // 2. Login Administrativo
    const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i], input[placeholder*="usuário" i]').first();
    await emailInput.waitFor({ state: 'visible', timeout: 25000 });
    await emailInput.fill('admin@colegiovisao.com.br');

    const passInput = page.locator('input[type="password"]').first();
    await passInput.fill('EagleSovereign2026#Admin');

    const unitSelect = page.locator('select').first();
    if (await unitSelect.isVisible()) {
      await unitSelect.selectOption('COLEGIOVISAO');
    }

    const submitBtn = page.locator('button[type="submit"], button:has-text("Entrar"), button:has-text("Acessar")').first();
    await submitBtn.click();

    // 3. Aguarda carregamento do Cockpit Executivo
    const titleLocator = page.locator('h1:has-text("Direção"), h1:has-text("Soberana"), .ap-cmd-title').first();
    await expect(titleLocator).toBeVisible({ timeout: 20000 });

    // 4. Clica no botão de Prontidão dos Pilotos
    const readinessBtn = page.locator('button:has-text("Prontidão dos Pilotos"), button:has-text("H-01/H-02")').first();
    await expect(readinessBtn).toBeVisible({ timeout: 10000 });
    await readinessBtn.click();

    // 5. Verifica renderização do PilotReadinessInspector
    const inspectorContainer = page.locator('[data-testid="pilot-readiness-inspector"]').first();
    await expect(inspectorContainer).toBeVisible({ timeout: 15000 });

    // 6. Verifica badges de BSL 1.1 e Modo Sombra
    await expect(page.locator('text=BSL 1.1 SOBERANA').first()).toBeVisible();
    await expect(page.locator('text=MODO SOMBRA SEGURO').first()).toBeVisible();

    // 7. Verifica status 13/13 Checks Aprovados
    await expect(page.locator('text=13/13').first()).toBeVisible();
    await expect(page.locator('text=PRONTO PARA HOMOLOGAÇÃO EM CAMPO').first()).toBeVisible();

    // 8. Executa auditoria ao vivo
    const liveAuditBtn = page.locator('button:has-text("Executar Auditoria ao Vivo")').first();
    await expect(liveAuditBtn).toBeVisible();
    await liveAuditBtn.click();

    // 9. Aguarda confirmação no terminal
    await expect(page.locator('text=AUDITORIA CONCLUÍDA').first()).toBeVisible({ timeout: 10000 });

    // 10. Testa exportação do dossiê
    const exportBtn = page.locator('button:has-text("Exportar Dossiê Executivo")').first();
    await expect(exportBtn).toBeVisible();
    await exportBtn.click();
    await expect(page.locator('text=Dossiê Copiado!').first()).toBeVisible({ timeout: 5000 });
  });
});
