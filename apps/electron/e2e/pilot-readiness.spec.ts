import { _electron as electron, test, expect, ElectronApplication, Page } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

const DIST_MAIN = path.join(__dirname, '../dist/main.js');

test.describe('Áquila Pro — Cockpit de Prontidão dos Dois Pilotos (H-01 & H-02)', () => {
  let app: ElectronApplication;
  let win: Page;
  let userDataDir: string;

  test.beforeEach(async () => {
    userDataDir = path.join(__dirname, `../test-user-data-readiness-${Math.floor(Math.random() * 10000)}`);
    if (fs.existsSync(userDataDir)) {
      try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch (e) {}
    }
    fs.mkdirSync(userDataDir, { recursive: true });

    // Copia template do banco se existir
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

    await win.waitForSelector('.eagle-form, .login-form, .eagle-form-panel', { timeout: 30000 });
    const hasSelect = await win.locator('select.eagle-select').count();
    if (hasSelect > 0) {
      await win.selectOption('select.eagle-select', 'COLEGIOVISAO');
    }
    await win.fill('input[placeholder*="usuário"]', 'admin');
    await win.fill('input[type="password"]', process.env.INITIAL_ADMIN_PASSWORD || 'EagleSovereign2026#Admin');
    await win.click('button[type="submit"]');

    // Dispensar modal LGPD se aparecer
    await win.waitForTimeout(1500);
    const lgpdBtn = win.locator('button:has-text("Concordar e Continuar")');
    const lgpdVisible = await lgpdBtn.isVisible({ timeout: 5000 }).catch(() => false);
    if (lgpdVisible) {
      await lgpdBtn.click();
      await win.waitForTimeout(1000);
    }

    await win.waitForSelector('.dashboard-container, .dashboard-elite, .dashboard-main, .portal-wrapper, body', { timeout: 30000 });
  });

  test.afterEach(async () => {
    if (app) {
      try {
        await Promise.race([
          app.close(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000))
        ]);
      } catch (e) {
        try { app.process().kill(); } catch (err) {}
      }
    }
    if (fs.existsSync(userDataDir)) {
      try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch (e) {}
    }
  });

  test('Deve abrir o Cockpit de Prontidão, validar os 13 checks de H-01/H-02 e disparar auditoria ao vivo', async () => {
    // 1. Navega para pilot-readiness
    await win.evaluate(() => {
      window.dispatchEvent(new CustomEvent('aquila:navigate', { detail: 'pilot-readiness' }));
      (window as any).aquila?.invoke?.('navigate', 'pilot-readiness');
    });

    await win.waitForTimeout(2000);

    // 2. Verifica se o Cockpit de Prontidão foi renderizado
    const inspectorContainer = win.locator('[data-testid="pilot-readiness-inspector"]');
    await expect(inspectorContainer).toBeVisible({ timeout: 15000 });

    // 3. Verifica badges de governança e modo sombra
    await expect(win.locator('text=BSL 1.1 SOBERANA').first()).toBeVisible();
    await expect(win.locator('text=MODO SOMBRA SEGURO').first()).toBeVisible();
    await expect(win.locator('text=ELECTRON FUSES ATIVOS').first()).toBeVisible();

    // 4. Verifica métrica de prontidão (13/13)
    await expect(win.locator('text=13/13').first()).toBeVisible();
    await expect(win.locator('text=Checks Aprovados').first()).toBeVisible();

    // 5. Executa auditoria ao vivo
    const liveAuditBtn = win.locator('button:has-text("Executar Auditoria ao Vivo")').first();
    await expect(liveAuditBtn).toBeVisible();
    await liveAuditBtn.click();

    // 6. Aguarda veredito da auditoria ao vivo no terminal
    const terminalLogs = win.locator('.terminal-body');
    await expect(terminalLogs).toBeVisible({ timeout: 10000 });
    await expect(win.locator('text=AUDITORIA CONCLUÍDA').first()).toBeVisible({ timeout: 10000 });

    // 7. Testa clique de exportação de dossiê
    const exportBtn = win.locator('button:has-text("Exportar Dossiê Executivo")').first();
    await expect(exportBtn).toBeVisible();
    await exportBtn.click();
    await expect(win.locator('text=Dossiê Copiado!').first()).toBeVisible({ timeout: 5000 });

    console.log('[E2E Readiness] ✅ Cockpit dos Dois Pilotos (H-01/H-02) 100% aprovado e certificado!');
  });
});
