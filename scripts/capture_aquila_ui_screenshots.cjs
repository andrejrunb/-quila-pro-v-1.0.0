/**
 * capture_aquila_ui_screenshots.cjs
 * ============================================================================
 * 1. Abre o aplicativo nativo Áquila Pro Desktop (Electron) no computador em
 *    resolução Full HD (1920x1080).
 * 2. Autentica como Direção Executiva e navega pelas 10 páginas/portais do UI,
 *    tirando screenshots PNG de alta definição.
 * 3. Mantém uma janela nativa do Áquila Pro aberta no computador para a usuária.
 */

const { _electron: electron } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const ENV_DIR = 'C:\\aquila\\test-results\\pilot_journey_env';
const MAIN_PATH = 'C:\\aquila\\apps\\electron\\dist\\main.js';
const SCREENSHOT_OUT_DIR = path.resolve(__dirname, '../test-results/ui_screenshots_2026_11_08');
const ARTIFACT_SCREENSHOT_DIR = 'C:\\Users\\Thaysa\\.gemini\\antigravity\\brain\\5fca40fa-e48d-4bc6-bc7a-084bf4a62fe4\\screenshots\\ui_audit';

fs.mkdirSync(SCREENSHOT_OUT_DIR, { recursive: true });
fs.mkdirSync(ARTIFACT_SCREENSHOT_DIR, { recursive: true });

const UI_PAGES_TO_CAPTURE = [
  {
    id: '01_admin_executive_cockpit',
    page: 'executive-cockpit-portal',
    title: '01. Portal da Direcao (Sovereign Executive Cockpit)'
  },
  {
    id: '02_teacher_cockpit_dashboard',
    page: 'teacher-dashboard',
    title: '02. Portal do Professor (Gestao de Sala & Telemetria)'
  },
  {
    id: '03_teacher_schedule_sa_gls',
    page: 'schedule',
    title: '03. Grade Horaria Docente + Otimizador SA+GLS (Zero Janelas)'
  },
  {
    id: '04_teacher_ai_studio_tri_pei',
    page: 'ai-studio',
    title: '04. Estudio Pedagogico IA (Itens TRI 3PL Calibrados + Matriz PEI/AEE DOK 1-4)'
  },
  {
    id: '05_coordination_cockpit',
    page: 'coordination',
    title: '05. Portal da Coordenacao Neuro-Pedagogica'
  },
  {
    id: '06_secretaria_digital_erp',
    page: 'secretaria-portal',
    title: '06. Portal da Secretaria Digital & Dominio Contabil ERP'
  },
  {
    id: '07_parent_family_portal',
    page: 'parent-portal',
    title: '07. Portal da Familia (Roteiros Conversa de Jantar 7 Series + LDB Art. 12 VIII a)'
  },
  {
    id: '08_student_rpg_cockpit',
    page: 'student-portal',
    title: '08. Portal do Aluno (Jornada Epica RPG & Meu Inicio)'
  },
  {
    id: '09_student_cosmetics_chamber',
    page: 'cosmetics-chamber',
    title: '09. Camara de Cosmeticos, Battle Banner 3D & Moeda Aureus'
  },
  {
    id: '10_student_mastery_wordwall',
    page: 'mastery-chamber',
    title: '10. Camara de Maestria ENEM & Motor Wordwall (8 Estilos Interativos)'
  }
];

async function runCapture() {
  console.log('[UI-CAPTURE] Abrindo aplicativo nativo Áquila Pro Desktop (Electron)...');
  const app = await electron.launch({
    args: [MAIN_PATH],
    env: {
      ...process.env,
      AQUILA_USER_DATA_OVERRIDE: ENV_DIR,
      AQUILA_LICENSE_HMAC_SECRET: 'aquila-pro-local-hmac-2026',
      AQUILA_ENCRYPTION_SECRET: 'aquila-pro-local-enc-2026',
      PLAYWRIGHT: 'true',
      PLAYWRIGHT_TEST: 'true',
      NODE_ENV: 'development'
    },
    timeout: 60000
  });

  const win = await app.firstWindow();
  win.on('dialog', async d => await d.dismiss().catch(() => {}));
  await win.setViewportSize({ width: 1920, height: 1080 });
  await win.waitForLoadState('domcontentloaded');
  await win.waitForTimeout(2800);

  // Autentica como admin e marca setup_complete + consentimento LGPD para exibir os portais limpos
  await win.evaluate(async () => {
    localStorage.setItem('aquila_setup_complete', 'true');
    try {
      const loginRes = await window.aquila.invoke('login', {
        username: 'admin.piloto',
        password: 'PilotPassword@2026!'
      });
      const user = loginRes?.user || {
        id: 'usr-admin-01',
        username: 'admin.piloto',
        name: 'Direcao Executiva',
        role: 'admin'
      };
      sessionStorage.setItem('aquila_session_user', JSON.stringify(user));
      await window.aquila.invoke('lgpd:record-consent', { userId: user.id }).catch(() => {});
    } catch {}
  });

  await win.reload({ waitUntil: 'domcontentloaded' });
  await win.waitForTimeout(2800);

  // Fecha eventual modal LGPD caso apareça
  await win.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const acceptBtn = btns.find(b => (b.innerText || '').toLowerCase().includes('aceitar') || (b.innerText || '').toLowerCase().includes('concordar'));
    if (acceptBtn) acceptBtn.click();
  });
  await win.waitForTimeout(600);

  for (const item of UI_PAGES_TO_CAPTURE) {
    console.log(`  [SHOT] Capturando ${item.title} (page='${item.page}')...`);
    await win.evaluate((targetPage) => {
      window.dispatchEvent(new CustomEvent('aquila:navigate', { detail: targetPage }));
    }, item.page);

    await win.waitForTimeout(1800);

    if (item.page === 'schedule') {
      const btn = win.locator('[data-testid="btn-run-sa-gls-solver"]');
      if (await btn.count() > 0) {
        await btn.click().catch(() => {});
        await win.waitForTimeout(1400);
      }
    }

    const outPath = path.join(SCREENSHOT_OUT_DIR, `${item.id}.png`);
    const artPath = path.join(ARTIFACT_SCREENSHOT_DIR, `${item.id}.png`);
    await win.screenshot({ path: outPath, fullPage: false });
    fs.copyFileSync(outPath, artPath);
  }

  await app.close();
  console.log(`[OK] 10 screenshots de alta definição salvas em:\n  - ${SCREENSHOT_OUT_DIR}\n  - ${ARTIFACT_SCREENSHOT_DIR}`);

  // Abre uma instância independente do Áquila Pro Desktop visível na tela do computador para a usuária
  const electronBin = require('electron');
  const child = spawn(electronBin, [MAIN_PATH], {
    detached: true,
    stdio: 'ignore',
    env: {
      ...process.env,
      AQUILA_USER_DATA_OVERRIDE: ENV_DIR,
      AQUILA_LICENSE_HMAC_SECRET: 'aquila-pro-local-hmac-2026',
      AQUILA_ENCRYPTION_SECRET: 'aquila-pro-local-enc-2026',
      PLAYWRIGHT_TEST: 'true',
      NODE_ENV: 'development'
    }
  });
  child.unref();
  console.log('[OK] Aplicativo Áquila Pro Desktop mantido aberto na tela do computador!');
}

runCapture().catch(err => {
  console.error('[ERRO UI-CAPTURE]', err);
  process.exit(1);
});
