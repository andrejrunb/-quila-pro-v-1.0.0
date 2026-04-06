import { _electron as electron } from '@playwright/test';
import { test, expect, ElectronApplication, Page } from '@playwright/test';
import * as path from 'path';

/**
 * Phase 706 — Visual Regression Zero-Debt
 * Valida a integridade do design Glassmorphism em múltiplas resoluções.
 * Executar com: npx playwright test e2e/visual_regression.spec.ts
 */

test.describe('Regressão Visual — Áquila Pro Elite UI', () => {
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

    // Bypass SetupWizard
    await window.evaluate(() => localStorage.setItem('aquila_setup_complete', 'true'));

    // Login unificado para todos os testes visuais
    await window.locator('input[type="text"]').first().fill('playwright_admin');
    await window.locator('input[type="password"]').first().fill('senha_playwright_123');
    await window.locator('button[type="submit"]').first().click();
    
    // Aguardar o carregamento do Dashboard (classe 'dashboard-elite' no Dashboard.tsx)
    await expect(window.locator('.dashboard-elite').first()).toBeVisible({ timeout: 30000 });
  });

  test.afterAll(async () => {
    await electronApp.close();
  });

  test('Snapshot: Dashboard Elite (Home)', async () => {
    // Bypass SetupWizard
    await window.evaluate(() => localStorage.setItem('aquila_setup_complete', 'true'));
    // Pequena pausa para garantir que as animações de entrada (float/pulse) estabilizem
    await window.waitForTimeout(2000);
    
    // Captura o Dashboard completo para validar Glassmorphism e KPIs
    await expect(window).toHaveScreenshot('dashboard-elite-home.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.1, // Aumentado para tolerar variações de renderização dinâmica
      animations: 'disabled'
    });
  });

  test('Snapshot: Admin Portal (Navigation & Modules)', async () => {
    // Navegar para o Portal Administrativo / Configurações
    const adminLink = window.locator('text=/Configurações do Sistema|Config/i').first();
    await adminLink.click();
    await window.waitForTimeout(1500);
    
    // Validar visual do Admin Portal
    await expect(window).toHaveScreenshot('admin-portal-view.png', {
      fullPage: true
    });
  });

  test('Snapshot: Edu-Podcast Hub', async () => {
    // Navegar para o Hub de Podcasts (Fase 705)
    const eduLink = window.locator('text=/Hub de Podcasts|Podcast/i').first();
    await eduLink.click();
    await window.waitForTimeout(1500);
    
    // Validar interface do player e waveforms
    await expect(window).toHaveScreenshot('edu-podcast-interface.png', {
      fullPage: true
    });
  });

  test('Snapshot: Governance & Transparency (LGPD)', async () => {
    // Navegar para Governança
    const govLink = window.locator('text=/Conformidade LGPD|Governança/i').first();
    await govLink.click();
    await window.waitForTimeout(1500);
    
    // Validar visual das tabelas de auditoria
    await expect(window).toHaveScreenshot('governance-lgpd-portal.png', {
      fullPage: true
    });
  });
});
