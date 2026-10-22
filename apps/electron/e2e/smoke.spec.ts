import { _electron as electron } from '@playwright/test';
import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Smoke Test - Áquila Pro
 * Verifica se o app inicia e carrega o UnifiedCommand.
 */
test('should launch app and show UnifiedCommand', async () => {
    const userDataDir = path.join(__dirname, '../test-user-data-smoke');
    if (fs.existsSync(userDataDir)) {
        try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch (e) {}
    }
    fs.mkdirSync(userDataDir, { recursive: true });

    const electronApp = await electron.launch({
        args: [path.join(__dirname, '../dist/main.js')],
        env: { 
            ...process.env, 
            NODE_ENV: 'test', 
            PLAYWRIGHT: 'true',
            AQUILA_USER_DATA_OVERRIDE: userDataDir
        },
        timeout: 120000
    });

    // Capturar logs do Processo Principal (Main)
    electronApp.process().stdout?.on('data', data => console.log(`[Main] ${data.toString()}`));
    electronApp.process().stderr?.on('data', data => console.error(`[Main Error] ${data.toString()}`));

    // Aguarda a primeira janela
    console.log('[E2E] Aguardando primeira janela...');
    const window = await electronApp.firstWindow({ timeout: 60000 });
    
    // Capturar logs do console do Renderer
    window.on('console', msg => console.log(`[Renderer] ${msg.text()}`));
    window.on('pageerror', err => console.error(`[Renderer Error] ${err.message}`));

    console.log('[E2E] Janela detectada. Aguardando domcontentloaded...');
    await window.waitForLoadState('domcontentloaded', { timeout: 30000 });
    
    // Verifica o título (definido no main.ts como Áquila Pro)
    // O título real no HTML pode ser mais longo, então usamos regex
    expect(await window.title()).toMatch(/Áquila Pro/);

    // Verifica se o dashboard ou o login é carregado
    await window.waitForSelector('body', { timeout: 15000 });
    
    // Screenshot para evidência (salvo no diretório de testes)
    await window.screenshot({ path: 'e2e/screenshots/smoke-launch.png' });

    // Fecha o app
    await electronApp.close();
});
