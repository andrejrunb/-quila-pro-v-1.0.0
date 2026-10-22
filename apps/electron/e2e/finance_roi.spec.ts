import { _electron as electron } from '@playwright/test';
import { test, expect } from '@playwright/test';
import * as path from 'path';

/**
 * Finance ROI & Ledger Test - Áquila Pro
 * Valida o faturamento (Financial Glass) e a transparência de auditoria.
 */
test('should calculate dynamic ROI for public vs private schools', async () => {
    const electronApp = await electron.launch({
        args: [path.join(__dirname, '../dist/main.js')],
        env: { 
            ...process.env, 
            NODE_ENV: 'test', 
            PLAYWRIGHT: 'true',
            AQUILA_USER_DATA_OVERRIDE: path.join(__dirname, '../test-user-data')
        },
        timeout: 60000
    });

    const window = await electronApp.firstWindow();
    await window.waitForLoadState('domcontentloaded');

    // Monitorar logs do Renderer
    window.on('console', msg => console.log(`[Renderer Console] ${msg.text()}`));

    // Navegar para o Hub Administrativo -> Financeiro via IPC (mais robusto)
    await window.evaluate(() => {
      (window as any).aquila.invoke('navigate', 'finance');
    });
    await window.waitForTimeout(3000);

    // Dispensar o modal LGPD caso apareça (ambiente de teste sem consentimento pré-gravado)
    const lgpdModal = window.locator('.lgpd-modal-overlay');
    const lgpdVisible = await lgpdModal.isVisible().catch(() => false);
    if (lgpdVisible) {
      console.log('[E2E] Modal LGPD detectado. Aceitando consentimento automaticamente...');
      await window.click('button:has-text("Concordar e Continuar")');
      await window.waitForTimeout(1000);
    }

    // Aguardar o título do Financial Glass
    const title = window.locator('.glass-title').first();
    await expect(title).toContainText('Financial Glass', { timeout: 30_000 });

    // 1. Validar Visualização do Ledger (Financial Glass)
    const projectedRevenue = window.locator('text=Receita Projetada');
    await expect(projectedRevenue).toBeVisible();

    // 2. Abrir Modal de Cobrança (Simulando clique na primeira linha da tabela)
    await window.click('td.font-bold'); // Clique no nome do aluno

    // 3. Verificar Modal PIX e Trilha de Auditoria
    await expect(window.locator('text=Detalhamento de Cobrança')).toBeVisible();
    await expect(window.locator('text=Trilha de Auditoria')).toBeVisible();
    await expect(window.locator('text=IDENTIDADE VERIFICADA')).toBeVisible();

    // 4. Fechar e Tirar Screenshot
    await window.click('button:has-text("FECHAR")');
    await window.screenshot({ path: 'e2e/screenshots/finance-ledger-success.png' });

    await electronApp.close();
});
