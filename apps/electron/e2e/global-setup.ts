import { _electron as electron } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

export default async function globalSetup() {
  console.log('\n[E2E GlobalSetup] Verificando pré-requisitos e preparando sessão...');

  const authFile = path.join(__dirname, '.auth/user.json');
  const authDir = path.dirname(authFile);
  const userDataDir = path.join(__dirname, '../test-user-data');

  // Limpeza de pastas antes do setup para garantir idempotecência
  if (fs.existsSync(authDir)) {
    console.log('[E2E GlobalSetup] Limpando diretório .auth/...');
    fs.rmSync(authDir, { recursive: true, force: true });
  }

  if (fs.existsSync(userDataDir)) {
    console.log('[E2E GlobalSetup] Limpando test-user-data para garantir login com senhas novas...');
    try {
      fs.rmSync(userDataDir, { recursive: true, force: true });
    } catch (e) {
      console.warn(`[E2E GlobalSetup] Falha ao limpar test-user-data (provável arquivo preso): ${e}`);
    }
  }
  
  fs.mkdirSync(authDir, { recursive: true });
  fs.mkdirSync(userDataDir, { recursive: true });

  // Criação do Seed no banco temporário antes de iniciar o Electron
  console.log('[E2E GlobalSetup] Executando seed no banco do ambiente de teste...');
  try {
    const { execSync } = require('child_process');
    // Forçar limpeza do diretório antes do seed
    if (fs.existsSync(userDataDir)) {
      fs.rmSync(userDataDir, { recursive: true, force: true });
    }
    fs.mkdirSync(userDataDir, { recursive: true });

    // Rodar o seed via Electron para compatibilidade de binários
    execSync(`npx electron dist/tests/seed_full.js`, {
      cwd: path.join(__dirname, '..'),
      env: { 
        ...process.env, 
        AQUILA_USER_DATA_OVERRIDE: userDataDir,
        ELECTRON_RUN_AS_NODE: '1'
      },
      stdio: 'inherit'
    });
    console.log('[E2E GlobalSetup] Seed finalizado com sucesso.');
  } catch (err) {
    console.error('[E2E GlobalSetup] Falha ao rodar seed_full.js via Electron:', err);
  }


  // 1. dist/main.js deve existir (build deve ter rodado antes)
  const mainJs = path.join(__dirname, '../dist/main.js');
  console.log(`[E2E-DEBUG] __dirname: ${__dirname}`);
  console.log(`[E2E-DEBUG] mainJs path: ${mainJs}`);
  if (!fs.existsSync(mainJs)) {
    throw new Error(
      `[E2E GlobalSetup] dist/main.js não encontrado.\n` +
      `Execute "npm run build" antes de rodar os testes E2E.`
    );
  }

  // 2. Garante screenshots dir
  const screenshotsDir = path.join(__dirname, 'screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  // 3. Login Automático para persistência de sessão
  console.log(`[E2E GlobalSetup] Iniciando Electron com userData isolado em: ${userDataDir}`);
  
  const electronApp = await electron.launch({
    args: [mainJs, '--enable-logging'],
    env: { 
      ...process.env, 
      PLAYWRIGHT: 'true',
      AQUILA_USER_DATA_OVERRIDE: userDataDir,
      NODE_ENV: 'development'
    },
    timeout: 120000 // 2 minutos para launch (generoso para máquinas lentas/CI)
  });

  // Captura logs do Electron para depuração
  electronApp.process().stdout?.on('data', (data) => console.log(`[Electron STDOUT]: ${data}`));
  electronApp.process().stderr?.on('data', (data) => console.error(`[Electron STDERR]: ${data}`));

  // Listener global para capturar logs de QUALQUER janela que abrir (incluindo a primeira)
  electronApp.on('window', (window) => {
    console.log(`[E2E] Nova janela detectada: ${window.url()}`);
    window.on('console', (msg) => {
      console.log(`[Renderer Console][${msg.type()}]: ${msg.text()}`);
    });
    window.on('pageerror', (err) => {
      console.error(`[Renderer UNCAUGHT ERROR]: ${err.message}`);
    });
  });

  let mainWindow: any;
  try {
    console.log('[E2E GlobalSetup] Localizando janela principal (Áquila Pro)...');
    
    // Registra a promessa de evento ANTES do polling para não perder janelas já abertas
    // Timeout generoso de 120s para suportar o boot pesado de NPU/RAG/Network.
    const windowEventPromise = electronApp.waitForEvent('window', { timeout: 120000 });

    // Polling rápido por até 30s para encontrar janela já existente
    console.log('[E2E GlobalSetup] Polling for existing windows...');
    for (let i = 0; i < 30; i++) {
      const windows = electronApp.windows();
      if (windows.length > 0) {
        console.log(`[E2E GlobalSetup] ${windows.length} janelas detectadas. Verificando filtros...`);
      }
      for (const win of windows) {
        const title = await win.title().catch(() => '');
        const url = win.url();
        console.log(`[E2E GlobalSetup] Janela: "${title}" | URL: ${url}`);
        if (!url.startsWith('devtools://') && (url.includes('localhost') || url.includes('index.html') || url.includes('file://') || title.includes('Áquila Pro'))) {
          mainWindow = win;
          break;
        }
      }
      if (mainWindow) break;
      await new Promise(r => setTimeout(r, 1000));
    }

    if (!mainWindow) {
      console.log('[E2E GlobalSetup] mainWindow não encontrada via polling. Aguardando evento de janela (120s)...');
      mainWindow = await windowEventPromise;
      console.log('[E2E GlobalSetup] Janela detectada via evento.');
    }
    
    console.log(`[E2E GlobalSetup] Janela principal identificada: "${await mainWindow.title()}" | URL: ${mainWindow.url()}`);
    
    // Espera estabilizar o carregamento inicial (em Electron 'complete' pode não disparar corretamente no Playwright dependendo de workers)
    console.log('[E2E GlobalSetup] Aguardando estabilização inicial...');
    await new Promise(r => setTimeout(r, 3000));
    // [E2E-STABILIZATION] Aplicar bypass do SetupWizard via LocalStorage antes de qualquer interação
    console.log('[E2E GlobalSetup] Aplicando bypass do SetupWizard...');
    await mainWindow.evaluate(() => {
      localStorage.setItem('aquila_setup_complete', 'true');
      console.log('[E2E-DEBUG] LocalStorage: aquila_setup_complete set to true.');
    });
    
    // Recarrega para garantir que o App.tsx veja o localStorage atualizado e pule o setup
    await mainWindow.reload();
    console.log('[E2E GlobalSetup] Recarga concluída pós-bypass.');

    // Sincroniza com a liberação do QuantumBoot (isLoading=false)
    console.log('[E2E GlobalSetup] Aguardando desanexação do QuantumBoot (pós-reload)...');
    await mainWindow.waitForSelector('.quantum-boot-container', { state: 'detached', timeout: 60000 });
    console.log('[E2E GlobalSetup] QuantumBoot liberado.');

    // Espera o formulário de login OU o dashboard (se a sessão for recuperada mesmo com limpeza)
    console.log('[E2E GlobalSetup] Localizando ponto de entrada (Login ou Dashboard)...');
    const entryPoint = await Promise.race([
      mainWindow.waitForSelector('.eagle-form, .login-form, .eagle-form-panel', { state: 'visible', timeout: 45000 }).then(() => 'login'),
      mainWindow.waitForSelector('.dashboard-container, .dashboard-elite', { state: 'visible', timeout: 45000 }).then(() => 'dashboard')
    ]);

    if (entryPoint === 'login') {
      console.log('[E2E GlobalSetup] Formulário de login detectado. Realizando login automatizado...');
      const hasSelect = await mainWindow.locator('select.eagle-select').count();
      if (hasSelect > 0) {
        await mainWindow.selectOption('select.eagle-select', 'COLEGIOVISAO');
      } else {
        await mainWindow.fill('input[placeholder*="COLEGIOVISAO"]', 'VISAO').catch(() => {});
      }
      await mainWindow.fill('input[placeholder*="usuário"]', 'admin');
      await mainWindow.fill('input[type="password"]', process.env.INITIAL_ADMIN_PASSWORD || 'EagleSovereign2026#Admin');
      await mainWindow.click('button[type="submit"]', { timeout: 60000 });

      // Dispensar modal LGPD se aparecer
      await mainWindow.waitForTimeout(1500);
      const lgpdBtn = mainWindow.locator('button:has-text("Concordar e Continuar")');
      const isLgpdVisible = await lgpdBtn.isVisible({ timeout: 5000 }).catch(() => false);
      if (isLgpdVisible) {
        console.log('[E2E GlobalSetup] Modal LGPD detectado. Aceitando termos...');
        await lgpdBtn.click();
        await mainWindow.waitForTimeout(1000);
      }

      // Espera o dashboard/portal carregar
      console.log('[E2E GlobalSetup] Aguardando carregamento do Dashboard ou Portal...');
      await mainWindow.waitForSelector('.dashboard-container, .dashboard-elite, .dashboard-main, .portal-wrapper, .portal-glass-container, .ap-cockpit', { state: 'visible', timeout: 60000 });
    } else {
      console.log('[E2E GlobalSetup] Já detectado no Dashboard ou Portal. Recuperação de sessão automática.');
    }

    console.log('[E2E GlobalSetup] Login/Sessão confirmado.');
    
    // Salva o estado da sessão manualmente (Electron não suporta browserContext.storageState)
    console.log('[E2E GlobalSetup] Extraindo estado da sessão do localStorage...');
    const sessionData = await mainWindow.evaluate(() => {
      const keys = ['aquilaSession', 'aquila_session', 'authToken', 'aquila_setup_complete'];
      const state: Record<string, string | null> = {};
      for (const key of keys) {
        state[key] = localStorage.getItem(key);
      }
      return state;
    });
    
    fs.writeFileSync(authFile, JSON.stringify({
      origins: [{
        origin: 'file://',
        localStorage: Object.entries(sessionData)
          .filter(([, v]) => v !== null)
          .map(([name, value]) => ({ name, value }))
      }]
    }, null, 2));
    console.log('[E2E GlobalSetup] Estado da sessão salvo em:', authFile);


  } catch (error) {
    console.error('[E2E GlobalSetup] ERRO CRÍTICO NO SETUP:', error);
    
    if (mainWindow) {
      const screenshotPath = path.join(__dirname, 'screenshots/failure-setup.png');
      console.log(`[E2E GlobalSetup] Capturando screenshot da falha na janela principal...`);
      await mainWindow.screenshot({ path: screenshotPath }).catch((e: any) => console.error('Erro ao tirar screenshot:', e));
    } else {
      console.warn('[E2E GlobalSetup] Não foi possível capturar screenshot: mainWindow não definido.');
    }
    
    throw error;
  } finally {
    if (electronApp) {
      console.log('[E2E GlobalSetup] Fechando aplicação Electron...');
      await electronApp.close();
    }
  }

  console.log('[E2E GlobalSetup] Preparação finalizada pronta para os testes.\n');
}
