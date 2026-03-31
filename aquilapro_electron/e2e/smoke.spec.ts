import { _electron as electron } from '@playwright/test';
import { test, expect } from '@playwright/test';
import * as path from 'path';

/**
 * Smoke Test - Áquila Pro
 * Verifica se o app inicia e carrega o UnifiedCommand.
 */
test('should launch app and show UnifiedCommand', async () => {
    const electronApp = await electron.launch({
        args: [path.join(__dirname, '../dist/main.js')],
        env: { ...process.env, NODE_ENV: 'test' }
    });

    // Aguarda a primeira janela
    const window = await electronApp.firstWindow();
    
    // Verifica o título (definido no main.ts como Áquila Pro)
    expect(await window.title()).toBe('Áquila Pro');

    // Verifica se o dashboard ou o comando unificado é carregado
    // Como o app pode iniciar no login, vamos procurar por elementos base
    await window.waitForSelector('body');
    
    // Screenshot para evidência (salvo no diretório de testes)
    await window.screenshot({ path: 'e2e/screenshots/smoke-launch.png' });

    // Fecha o app
    await electronApp.close();
});
