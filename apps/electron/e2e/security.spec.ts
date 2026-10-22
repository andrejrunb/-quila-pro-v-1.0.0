import { _electron as electron } from '@playwright/test';
import { test, expect, ElectronApplication, Page } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

test.describe('Security & Hardening — Áquila Pro', () => {
    let userDataDir: string;

    test.beforeEach(async () => {
        userDataDir = path.join(__dirname, `../test-user-data-sec-${Math.floor(Math.random() * 10000)}`);
        if (fs.existsSync(userDataDir)) {
            try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch (e) {}
        }
        fs.mkdirSync(userDataDir, { recursive: true });

        // [E2E-OPTIMIZATION] Copy template DB
        const templateDb = path.join(__dirname, '../test-user-data/AquilaPro/aquila.db');
        const targetDbDir = path.join(userDataDir, 'AquilaPro');
        fs.mkdirSync(targetDbDir, { recursive: true });
        if (fs.existsSync(templateDb)) {
            fs.copyFileSync(templateDb, path.join(targetDbDir, 'aquila.db'));
        }
    });

    test('should prevent brute-force on sensitive IPC channels (Rate Limiter)', async () => {
        const app = await electron.launch({
            args: [path.join(__dirname, '../dist/main.js')],
            env: { ...process.env, PLAYWRIGHT: 'true', AQUILA_USER_DATA_OVERRIDE: userDataDir },
            timeout: 120000
        });
        const win = await app.firstWindow({ timeout: 60000 });
        await win.waitForLoadState('domcontentloaded');

        const results = await win.evaluate(async () => {
            const calls = [];
            for (let i = 0; i < 20; i++) {
                // @ts-ignore
                calls.push(window.aquila.invoke('login', { username: 'brute', password: 'force' }));
            }
            return await Promise.all(calls);
        });

        // O Rate Limiter no main process deve retornar erro ou código específico
        const blocked = results.filter(r => r && (r.code === 'RATE_LIMIT_EXCEEDED' || (r.error && r.error.toLowerCase().includes('rate limit'))));
        expect(blocked.length).toBeGreaterThan(0);
        console.log('[E2E] ✅ Rate Limiter operacional');
        try {
            await Promise.race([
                app.close(),
                new Promise((_, r) => setTimeout(() => r(new Error('timeout')), 5000))
            ]);
        } catch (e) {
            try { app.process().kill(); } catch (err) {}
        }
    });

    test('should persist authentication session between application restarts', async () => {
        const app1 = await electron.launch({
            args: [path.join(__dirname, '../dist/main.js')],
            env: { ...process.env, PLAYWRIGHT: 'true', AQUILA_USER_DATA_OVERRIDE: userDataDir },
            timeout: 120000
        });
        const win1 = await app1.firstWindow({ timeout: 60000 });
        await win1.evaluate(() => localStorage.setItem('aquila_setup_complete', 'true'));
        await win1.reload();
        
        await win1.waitForSelector('.login-form', { timeout: 45000 });
        await win1.fill('input[placeholder*="COLEGIOVISAO"]', 'VISAO');
        await win1.fill('input[placeholder*="usuário"]', 'admin');
        await win1.fill('input[type="password"]', 'Admin@2026!');
        await win1.click('button[type="submit"]');
        await win1.waitForSelector('.dashboard-container', { timeout: 60000 });

        // Dispensar modal LGPD caso apareça após o login (sem consentimento no DB de teste)
        await win1.waitForTimeout(1500);
        const lgpdOverlay = win1.locator('.lgpd-modal-overlay');
        const lgpdVisible = await lgpdOverlay.isVisible().catch(() => false);
        if (lgpdVisible) {
            console.log('[E2E] Modal LGPD detectado. Aceitando automaticamente...');
            await win1.click('button:has-text("Concordar e Continuar")');
            await win1.waitForTimeout(800);
        }

        try {
            await Promise.race([
                app1.close(),
                new Promise((_, r) => setTimeout(() => r(new Error('timeout')), 5000))
            ]);
        } catch (e) {
            try { app1.process().kill(); } catch (err) {}
        }
        
        const app2 = await electron.launch({
            args: [path.join(__dirname, '../dist/main.js')],
            env: { ...process.env, PLAYWRIGHT: 'true', AQUILA_USER_DATA_OVERRIDE: userDataDir },
            timeout: 120000
        });
        const win2 = await app2.firstWindow({ timeout: 60000 });
        await win2.waitForLoadState('domcontentloaded');
        
        await win2.waitForSelector('.dashboard-container', { timeout: 60000 });
        expect(await win2.locator('.dashboard-container').count()).toBe(1);
        console.log('[E2E] ✅ Sessão persistida');
        try {
            await Promise.race([
                app2.close(),
                new Promise((_, r) => setTimeout(() => r(new Error('timeout')), 5000))
            ]);
        } catch (e) {
            try { app2.process().kill(); } catch (err) {}
        }
    });
});
