const { _electron: electron } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

async function runUIExploration() {
  console.log('========================================================================');
  console.log('  ÁQUILA PRO — EXPLORAÇÃO EXAUSTIVA DE INTERFACES, PORTAIS E BOTÕES     ');
  console.log('========================================================================\n');

  const mainJs = path.join(process.cwd(), 'apps/electron/dist/main.js');
  const tempDir = path.join(process.env.TEMP, 'aquila_ui_exploration_' + Date.now());
  const templateDb = path.join(process.env.APPDATA, 'AquilaPro', 'aquila.db');
  const screenshotsDir = 'C:\\Users\\Thaysa\\.gemini\\antigravity\\brain\\5fca40fa-e48d-4bc6-bc7a-084bf4a62fe4\\screenshots';

  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  // Clone database to sandbox in both locations
  fs.mkdirSync(tempDir, { recursive: true });
  fs.mkdirSync(path.join(tempDir, 'AquilaPro'), { recursive: true });

  if (fs.existsSync(templateDb)) {
    fs.copyFileSync(templateDb, path.join(tempDir, 'aquila.db'));
    fs.copyFileSync(templateDb, path.join(tempDir, 'AquilaPro', 'aquila.db'));

    const wal = templateDb + '-wal';
    const shm = templateDb + '-shm';
    if (fs.existsSync(wal)) {
      fs.copyFileSync(wal, path.join(tempDir, 'aquila.db-wal'));
      fs.copyFileSync(wal, path.join(tempDir, 'AquilaPro', 'aquila.db-wal'));
    }
    if (fs.existsSync(shm)) {
      fs.copyFileSync(shm, path.join(tempDir, 'aquila.db-shm'));
      fs.copyFileSync(shm, path.join(tempDir, 'AquilaPro', 'aquila.db-shm'));
    }
    console.log('[Setup] Banco clonado com sucesso para ambiente de exploração interativa.');
  }

  console.log('[Launch] Iniciando Áquila Pro (Electron v28 / Chromium)...');
  const app = await electron.launch({
    args: [mainJs],
    env: {
      ...process.env,
      PLAYWRIGHT: 'true',
      AQUILA_USER_DATA_OVERRIDE: tempDir,
      NODE_ENV: 'development'
    },
    timeout: 60000
  });

  const win = await app.firstWindow();
  await win.setViewportSize({ width: 1440, height: 900 });

  const dialogLogs = [];
  const uncaughtErrors = [];

  // Dialog auto-dismiss
  win.on('dialog', async dialog => {
    const msg = dialog.message();
    console.log(`  [Dialog Auto-Handled]: "${msg}"`);
    dialogLogs.push(msg);
    await dialog.dismiss().catch(() => {});
  });

  win.on('pageerror', err => {
    uncaughtErrors.push(err.message);
    console.error(`  [Browser PageError]: ${err.message}`);
  });

  // Bypass setup wizard
  await win.evaluate(() => localStorage.setItem('aquila_setup_complete', 'true'));
  await win.reload();
  await win.waitForTimeout(2000);

  console.log('[Login] Preenchendo credenciais do Administrador...');
  const selectElem = win.locator('select.eagle-select');
  if (await selectElem.count() > 0) {
    await selectElem.selectOption('COLEGIOVISAO');
  }

  const userInput = win.locator('input[placeholder*="usuário"], input[name="username"]');
  if (await userInput.count() > 0) {
    await userInput.fill('admin');
  }

  const passInput = win.locator('input[type="password"]');
  if (await passInput.count() > 0) {
    await passInput.fill('Admin@2026!');
  }

  console.log('[Login] Clicando no botão "Entrar"...');
  await win.locator('button[type="submit"]').click();
  await win.waitForTimeout(2500);

  // Check LGPD Modal
  const lgpdBtn = win.locator('button:has-text("Concordar e Continuar")');
  if (await lgpdBtn.count() > 0 && await lgpdBtn.isVisible().catch(() => false)) {
    console.log('[LGPD] Aceitando termos LGPD...');
    await lgpdBtn.click();
    await win.waitForTimeout(1500);
  }

  const initialButtons = await win.locator('button, [role="button"], .tab, .nav-item').count();
  console.log(`[Dashboard] Login concluído. Elementos interativos detectados: ${initialButtons}`);

  // List of all portals and key routes to test
  const portalsToTest = [
    // 1. Administração Geral & Gestão Executiva
    { id: 'executive-cockpit-portal', name: 'Cockpit Executivo & Gestão Geral', category: 'Administração' },
    { id: 'user-management', name: 'Gestão de Usuários & RBAC', category: 'Administração' },
    { id: 'finance', name: 'Módulo Financeiro & ROI', category: 'Administração' },
    { id: 'audit-log', name: 'Trilha de Auditoria Zero-Bypass', category: 'Conformidade' },
    { id: 'lgpd', name: 'Conformidade LGPD & Expurgo Art. 16', category: 'Conformidade' },
    { id: 'security-monitor', name: 'Monitor de Segurança & Câmeras SOC', category: 'Segurança' },
    { id: 'turnstile-shadow', name: 'Catraca Shadow & Hardware Piloto', category: 'Segurança' },
    { id: 'hardware-cockpit', name: 'Diagnóstico NPU/GPU Hardware', category: 'Infraestrutura' },
    { id: 'diagnostics', name: 'Diagnóstico de Integridade de Banco', category: 'Infraestrutura' },
    { id: 'load-testing', name: 'Benchmark de Carga SQA-1000', category: 'Infraestrutura' },
    
    // 2. Portal Docente & Sala de Aula
    { id: 'teacher-dashboard', name: 'Dashboard do Professor', category: 'Docente' },
    { id: 'seating-intelligence', name: 'Disposição Inteligente de Sala', category: 'Docente' },
    { id: 'attendance', name: 'Chamada Rápida < 90s & Frequência', category: 'Docente' },
    { id: 'gradebook', name: 'Diário de Classe & Notas REGRA-2026', category: 'Docente' },
    { id: 'diary', name: 'Plano de Aula & Conteúdo BNCC', category: 'Docente' },
    { id: 'mastery-chamber', name: 'Câmara de Maestria Docente', category: 'Docente' },
    { id: 'ai-studio', name: 'Estúdio de Criação de IA Docente', category: 'Docente' },
    { id: 'activity-factory', name: 'Fábrica de Atividades Interativas', category: 'Docente' },
    { id: 'slide-studio', name: 'Estúdio de Slides & Apresentações', category: 'Docente' },
    { id: 'exam-foundry', name: 'Banco de Provas & Avaliações', category: 'Docente' },
    { id: 'omr-scanner', name: 'Scanner de Gabaritos OMR', category: 'Docente' },
    { id: 'youtube-radar', name: 'Radar Pedagógico de Vídeos', category: 'Docente' },

    // 3. Portal da Coordenação Pedagógica
    { id: 'coordination', name: 'Portal da Coordenação Pedagógica', category: 'Coordenação' },
    { id: 'bncc-heatmap', name: 'Mapa de Calor de Habilidades BNCC', category: 'Coordenação' },
    { id: 'timetable', name: 'Grade Horária & Alocação', category: 'Coordenação' },
    { id: 'growth-agents', name: 'Agentes de Crescimento Escolar', category: 'Coordenação' },
    { id: 'coordination-overview', name: 'Visão Geral Neuro-Pedagógica', category: 'Coordenação' },

    // 4. Secretaria Digital & RH
    { id: 'secretaria-portal', name: 'Secretaria Digital & Matrículas', category: 'Secretaria' },
    { id: 'hr-portal', name: 'Portal de Recursos Humanos', category: 'Secretaria' },
    { id: 'schedule-upload', name: 'Importação de Horários & Lote CSV', category: 'Secretaria' },

    // 5. Portal do Aluno & Gamificação
    { id: 'student-portal', name: 'Portal do Aluno (HUD & Modo Kumon)', category: 'Aluno' },
    { id: 'ai-lab', name: 'Laboratório de IA & Mentores Socráticos', category: 'Aluno' },
    { id: 'pvp-arena', name: 'Arena de Batalhas Socráticas', category: 'Aluno' },
    { id: 'essay-lab', name: 'Laboratório de Redação Nota 1000', category: 'Aluno' },
    { id: 'skill-tree', name: 'Árvore de Competências BNCC', category: 'Aluno' },
    { id: 'cosmetics-chamber', name: 'Câmara de Cosméticos & Loja de Skins', category: 'Aluno' },

    // 6. Família & Portaria
    { id: 'parent-portal', name: 'Portal da Família & Responsáveis', category: 'Família' },
    { id: 'visitor-management', name: 'Portaria & Gestão de Visitantes', category: 'Portaria' }
  ];

  const results = [];
  let totalButtonsFound = 0;
  let totalButtonsClicked = 0;

  console.log(`\nIniciando auditoria interativa em ${portalsToTest.length} portais e interfaces...\n`);

  for (let idx = 0; idx < portalsToTest.length; idx++) {
    const portal = portalsToTest[idx];
    const stepStr = `[${idx + 1}/${portalsToTest.length}]`;
    console.log(`${stepStr} Navegando para: "${portal.name}" (rota: ${portal.id})...`);

    const startNav = Date.now();

    // Trigger navigation
    try {
      await win.evaluate((targetPage) => {
        window.dispatchEvent(new CustomEvent('aquila:navigate', { detail: targetPage }));
        if (window.aquila && window.aquila.invoke) {
          window.aquila.invoke('navigate', targetPage).catch(() => {});
        }
      }, portal.id);
    } catch (e) {
      console.warn(`  [Nav Warn]: ${e.message}`);
    }

    await win.waitForTimeout(1400);

    // Check for crash screen
    const errorOverlay = win.locator('[class*="error-boundary"], [class*="crash-screen"], .crash-banner');
    const hasCrash = await errorOverlay.count();
    let crashDetails = null;

    if (hasCrash > 0) {
      crashDetails = await errorOverlay.first().innerText().catch(() => 'Erro desconhecido');
      console.error(`  ❌ CRASH DETECTADO em ${portal.name}: ${crashDetails}`);
    }

    // Comprehensive button interaction via DOM evaluate
    const interactionReport = await win.evaluate(() => {
      // Find all buttons, tabs, pill-buttons, links formatted as buttons
      const candidates = Array.from(document.querySelectorAll(
        'button, [role="button"], .tab, .tab-btn, .pill-btn, [role="tab"], .quick-action-btn, .action-btn, .sub-tab'
      ));

      const foundTexts = [];
      const clickedTexts = [];
      let clicks = 0;

      for (let i = 0; i < candidates.length; i++) {
        const el = candidates[i];
        const style = window.getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') continue;

        const text = (el.innerText || el.getAttribute('aria-label') || el.title || `Controle #${i + 1}`).replace(/\s+/g, ' ').trim();
        foundTexts.push(text);

        // Filter dangerous buttons
        const lower = text.toLowerCase();
        if (
          lower.includes('excluir') ||
          lower.includes('deletar') ||
          lower.includes('apagar') ||
          lower.includes('formatar') ||
          lower.includes('sair') ||
          lower.includes('logout') ||
          lower.includes('remover') ||
          lower.includes('resetar') ||
          lower.includes('revogar') ||
          lower.includes('fechar sessão')
        ) {
          continue;
        }

        // Click up to 8 controls
        if (clicks < 8) {
          try {
            el.click();
            clickedTexts.push(text || `Botão #${i + 1}`);
            clicks++;

            // If a modal or confirmation appeared, auto-close
            const modalCancel = document.querySelector(
              '.modal button:not([class*="delete"]):not([class*="danger"]), [role="dialog"] button, button:has-text("Fechar"), button:has-text("Continuar editando")'
            );
            if (modalCancel && modalCancel !== el) {
              modalCancel.click();
            }
          } catch (_) {}
        }
      }

      return {
        totalFound: foundTexts.length,
        totalClicked: clickedTexts.length,
        sampleFound: foundTexts.slice(0, 10),
        sampleClicked: clickedTexts.slice(0, 8)
      };
    });

    const btnCount = interactionReport.totalFound;
    const clicksDone = interactionReport.totalClicked;
    totalButtonsFound += btnCount;
    totalButtonsClicked += clicksDone;

    const durationMs = Date.now() - startNav;

    // Screenshot of each portal
    const fileName = `screenshot_${portal.id}.png`;
    const fullPath = path.join(screenshotsDir, fileName);
    try {
      await win.screenshot({ path: fullPath });
    } catch (e) {}

    console.log(`  ✅ ${portal.name}: ${btnCount} controles encontrados, ${clicksDone} acionados (${durationMs}ms)`);

    results.push({
      portalId: portal.id,
      portalName: portal.name,
      category: portal.category,
      buttonsFound: btnCount,
      buttonsClicked: clicksDone,
      sampleButtonsFound: interactionReport.sampleFound,
      sampleButtonsClicked: interactionReport.sampleClicked,
      hasCrash: hasCrash > 0,
      crashDetails,
      durationMs,
      screenshot: fullPath
    });
  }

  console.log('\n========================================================================');
  console.log('  RESUMO GERAL DA AUDITORIA INTERATIVA');
  console.log('========================================================================');
  console.log(`Total de Portais Auditados:   ${portalsToTest.length}`);
  console.log(`Total de Controles Detectados:${totalButtonsFound}`);
  console.log(`Total de Ações Executadas:    ${totalButtonsClicked}`);
  console.log(`Diálogos Auto-Gerenciados:    ${dialogLogs.length}`);
  console.log(`Erros Críticos de Render:     ${results.filter(r => r.hasCrash).length}`);
  console.log(`Erros não capturados de JS:   ${uncaughtErrors.length}`);
  console.log('========================================================================\n');

  // Save JSON report
  const reportPath = 'C:\\aquila\\test-results\\ui_exploration_audit_report.json';
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    totalPortals: portalsToTest.length,
    totalButtonsFound,
    totalButtonsClicked,
    dialogLogsCount: dialogLogs.length,
    dialogLogs,
    uncaughtErrorsCount: uncaughtErrors.length,
    uncaughtErrors,
    results
  }, null, 2), 'utf8');

  console.log(`Relatório salvo em: ${reportPath}`);

  await win.waitForTimeout(2000);
  await app.close();
  try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch (e) {}
  console.log('[Audit] Finalizado com sucesso.');
}

runUIExploration().catch(err => {
  console.error('Fatal exploration error:', err);
  process.exit(1);
});
