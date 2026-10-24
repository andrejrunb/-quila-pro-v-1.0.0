import { _electron as electron, test, expect, ElectronApplication, Page } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Phase 707 — E2E: Dashboards Navigation & Hub Resilience
 * Objetivo: Navegar por TODOS os hubs e rotas principais para garantir 
 * que nenhum componente de dashboard (complexo, Recharts, Three.js) 
 * cause crash no Renderer (Crash Resilience Audit).
 */

const DIST_MAIN = path.join(__dirname, '../dist/main.js');
const TIMEOUT = { timeout: 30_000 };

async function navigateAndVerify(win: Page, page: string, label: string) {
  try {
    await win.evaluate((p) => {
      (window as any).aquila?.invoke?.('navigate', p);
    }, page);
  } catch (e) {
    console.log(`[E2E] Skipped IPC navigate for ${page}`);
  }

  // Fallback to DOM click if possible
  try {
    const navItem = win.locator(`.nav-item:has-text("${label}")`);
    if(await navItem.count() > 0) {
        await navItem.first().click();
    }
  } catch (e) {}

  await win.waitForTimeout(1500);

  const errorOverlay = win.locator('[class*="error-boundary"], [class*="crash-screen"]');
  const hasError = await errorOverlay.count();
  
  if (hasError > 0) {
    const text = await errorOverlay.first().innerText();
    expect(hasError, `Aba "${label}" (page="${page}") causou crash overlay: ${text}`).toBe(0);
  }

  await expect(win.locator('body')).toBeVisible(TIMEOUT);
  console.log(`[E2E] ✅ Aba "${label}" abriu sem crash`);
}

test.describe('Dashboards Navigation & Crash Resilience', () => {
  let electronApp: ElectronApplication;
  let win: Page;
  let userDataDir: string;

  test.beforeEach(async () => {
    userDataDir = path.join(__dirname, `../test-user-data-nav-${Math.floor(Math.random() * 10000)}`);
    if (fs.existsSync(userDataDir)) {
      try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch (e) {}
    }
    fs.mkdirSync(userDataDir, { recursive: true });

    // [E2E-OPTIMIZATION] Copy template DB instead of seeding again
    const templateDb = path.join(__dirname, '../test-user-data/AquilaPro/aquila.db');
    const targetDbDir = path.join(userDataDir, 'AquilaPro');
    fs.mkdirSync(targetDbDir, { recursive: true });
    
    if (fs.existsSync(templateDb)) {
      fs.copyFileSync(templateDb, path.join(targetDbDir, 'aquila.db'));
      console.log(`[E2E] DB cloned from template to: ${userDataDir}`);
    } else {
      console.warn(`[E2E] Template DB not found at ${templateDb}. Falling back to empty DB.`);
    }

    electronApp = await electron.launch({
      args: [DIST_MAIN],
      env: { 
        ...process.env, 
        PLAYWRIGHT: 'true',
        AQUILA_USER_DATA_OVERRIDE: userDataDir,
        NODE_ENV: 'development'
      },
      timeout: 120000
    });

    win = await electronApp.firstWindow();
    
    // Bypass setup
    await win.evaluate(() => localStorage.setItem('aquila_setup_complete', 'true'));
    await win.reload();
    await win.waitForSelector('.quantum-boot-container', { state: 'detached', timeout: 30000 });

    await win.waitForSelector('.login-form', { timeout: 30000 });
    await win.fill('input[placeholder*="COLEGIOVISAO"]', 'VISAO');
    await win.fill('input[placeholder*="usuário"]', 'admin');
    await win.fill('input[type="password"]', process.env.INITIAL_ADMIN_PASSWORD || 'EagleSovereign2026#Admin');
    await win.click('button[type="submit"]');
    await win.waitForSelector('.dashboard-container, .dashboard-elite', { timeout: 60000 });

    // Dispensar modal LGPD caso apareça após o login (sem consentimento no DB de teste)
    await win.waitForTimeout(1500);
    const lgpdOverlay = win.locator('.lgpd-modal-overlay');
    const lgpdVisible = await lgpdOverlay.isVisible().catch(() => false);
    if (lgpdVisible) {
      console.log('[E2E] Modal LGPD detectado. Aceitando automaticamente...');
      await win.click('button:has-text("Concordar e Continuar")');
      await win.waitForTimeout(800);
    }
  });

  test.afterEach(async () => {
    if (electronApp) {
      try {
        await Promise.race([
          electronApp.close(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000))
        ]);
      } catch (e) {
        console.log('[E2E] Force killing Electron process in afterEach...');
        try { electronApp.process().kill(); } catch (err) {}
      }
    }
    if (fs.existsSync(userDataDir)) {
      try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch (e) {}
    }
  });

  const SECURITY_ROUTES = [
    { id: 'dashboard', label: 'Início' },
    { id: 'cameras', label: 'Câmeras' },
    { id: 'alerts', label: 'Ocorrências' },
    { id: 'night-sentry', label: 'Night Sentry' },
    { id: 'security-monitor', label: 'Estado do Sistema' },
    { id: 'identity-recapture', label: 'Recaptura (IA)' }
  ];

  test('Security Hub routes', async () => {
    await win.locator('button.hub-btn[title="Hub de Segurança"]').click();
    await win.waitForTimeout(2000);
    
    for (const route of SECURITY_ROUTES) {
      await navigateAndVerify(win, route.id, route.label);
    }
  });

  const ADMIN_ROUTES = [
    { id: 'executive-pulse', label: 'Painel da Direção' },
    { id: 'global-trends', label: 'Tendências do Enxame' },
    { id: 'finance', label: 'Financeiro' },
    { id: 'user-management', label: 'Controle de Acessos' },
    { id: 'lgpd', label: 'Proteção de Dados' },
    { id: 'settings', label: 'Configurações' },
    { id: 'nexus-mesh', label: 'Rede Nexus' },
    { id: 'coordination', label: 'Grade & Turmas' },
    { id: 'help-hub', label: 'Treinamento SOC' }
  ];

  test('Admin Hub routes', async () => {
    await win.locator('button.hub-btn[title="Hub Administrativo"]').click();
    await win.waitForTimeout(1000);

    for (const route of ADMIN_ROUTES) {
      await navigateAndVerify(win, route.id, route.label);
    }
  });

  const PEDAGOGICAL_ROUTES = [
    { id: 'students', label: 'Gestão de Alunos' },
    { id: 'attendance', label: 'Frequência' },
    { id: 'intelligence-hub', label: 'Inteligência Ativa' },
    { id: 'reports-hub', label: 'Relatórios & Laudos' },
    { id: 'diary', label: 'Diário de Classe' },
    { id: 'ai-lab', label: 'Córtex AI Lab' },
    { id: 'coordination-dashboard', label: 'Painel Coordenação' },
    { id: 'predictive-dashboard', label: 'Radar de Evasão' },
    { id: 'attendance-audit', label: 'Auditoria de Frequência' },
    { id: 'cross-audit', label: 'Auditoria Cruzada' },
    { id: 'seating-intelligence', label: 'Mapa de Assentos IA' },
    { id: 'lifecycle-dashboard', label: 'Ciclo de Vida' },
  ];

  test('Pedagogical Hub routes', async () => {
    test.slow();
    await win.locator('button.hub-btn[title="Hub Pedagógico"]').click();
    await win.waitForTimeout(1000);

    for (const route of PEDAGOGICAL_ROUTES) {
      await navigateAndVerify(win, route.id, route.label);
    }
  });
});
