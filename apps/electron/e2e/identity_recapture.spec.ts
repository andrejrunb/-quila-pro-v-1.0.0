import { _electron as electron } from '@playwright/test';
import { test, expect } from '@playwright/test';
import * as path from 'path';

/**
 * Identity Recapture Test - Áquila Pro
 * Valida o fluxo de recaptura biométrica e sincronização soberana.
 */
test('should complete biometric recapture flow', async () => {
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

    // Navegar para o Hub de Segurança -> Recaptura de Identidade via IPC
    await window.evaluate(() => {
      (window as any).aquila.invoke('navigate', 'identity-recapture');
    });
    await window.waitForTimeout(2000);

    // Aguardar o título do componente de recaptura
    const title = window.locator('h2:has-text("Recaptura Dinâmica de Identidade")').first();
    await expect(title).toBeVisible({ timeout: 30_000 });

    // Iniciar Scan
    await window.click('button:has-text("Forçar Recaptura")');

    // Aguardar progresso de extração neural (simulado via progress bar)
    // O texto é "EXTRAINDO 100%" conforme o componente
    await window.waitForSelector('span:has-text("EXTRAINDO 100%")', { timeout: 15_000 });

    // Verificar mensagem de sucesso e propagação
    await expect(window.locator('text=Rede reescrita e propagada aos Nodes Edge')).toBeVisible();
    
    // Screenshot do sucesso
    await window.screenshot({ path: 'e2e/screenshots/identity-recapture-success.png' });

    await electronApp.close();
});
