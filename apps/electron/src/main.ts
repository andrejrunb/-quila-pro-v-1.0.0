// [BOOT] Linha Zero - main.ts Executing (v2.1.0)
console.log('[BOOT] Áquila Pro: Processo Principal iniciado.');

import { app, dialog } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import * as crypto from 'crypto';
import * as dotenv from 'dotenv';

// ============================================================================
// INICIALIZAÇÃO DE AMBIENTE E SEGREDOS DE BORDA (ZERO-BYPASS)
// ============================================================================

function initEnvironmentAndSecrets(userDataPath?: string) {
  const candidatePaths = [
    path.resolve(__dirname, '../../.env'),
    path.resolve(process.cwd(), '.env'),
    path.resolve(process.resourcesPath || '', '.env'),
    userDataPath ? path.resolve(userDataPath, '.env') : null,
  ].filter(Boolean) as string[];

  for (const envPath of candidatePaths) {
    if (fs.existsSync(envPath)) {
      dotenv.config({ path: envPath });
    }
  }

  // Se AQUILA_AUTH_SECRET não estiver presente ou for < 32 bytes (ex: instalação limpa E-01),
  // recupera ou gera um segredo criptográfico soberano de 256 bits (32 bytes) no userData.
  if (!process.env.AQUILA_AUTH_SECRET || Buffer.byteLength(process.env.AQUILA_AUTH_SECRET, 'utf8') < 32) {
    if (userDataPath) {
      const secretFile = path.resolve(userDataPath, '.auth_secret');
      try {
        if (fs.existsSync(secretFile)) {
          const persisted = fs.readFileSync(secretFile, 'utf8').trim();
          if (Buffer.byteLength(persisted, 'utf8') >= 32) {
            process.env.AQUILA_AUTH_SECRET = persisted;
          }
        }
        if (!process.env.AQUILA_AUTH_SECRET || Buffer.byteLength(process.env.AQUILA_AUTH_SECRET, 'utf8') < 32) {
          const generated = crypto.randomBytes(32).toString('hex');
          fs.writeFileSync(secretFile, generated, { mode: 0o600 });
          process.env.AQUILA_AUTH_SECRET = generated;
          console.log('[SECURITY] AQUILA_AUTH_SECRET soberano de borda gerado e persistido.');
        }
      } catch (err) {
        console.warn('[SECURITY] Não foi possível persistir .auth_secret em userData, usando secret efêmero:', err);
        process.env.AQUILA_AUTH_SECRET = crypto.randomBytes(32).toString('hex');
      }
    }
  }
}

// Inicialização imediata com caminhos conhecidos de desenvolvimento
initEnvironmentAndSecrets();

import { WindowManager } from './main/window';
import { SovereignOrchestrator } from './main/orchestrator';
import { sovereignRegistry } from './main/registry';

// ============================================================================
// CONSTANTES E CONFIGURAÇÃO INICIAL
// ============================================================================

const APP_NAME = 'Áquila Pro';
const APP_VERSION = process.env.npm_package_version || (typeof app?.getVersion === 'function' ? app.getVersion() : '2.1.0') || '2.1.0';

// [P0-SEC-01] allow-file-access-from-files removido por segurança (superfície XSS/file://).
// Recursos locais controlados utilizam protocolo seguro aquila-asset:// ou IPC.

// [SQA-PATH-002] Forçar userDataDir se passado via CLI ou ENV
const customUserData = process.argv.find(arg => arg.startsWith('--user-data-dir='))?.split('=')[1] || process.env.AQUILA_USER_DATA_OVERRIDE;
if (customUserData) {
  try {
    app.setPath('userData', customUserData);
    console.log(`[BOOT] UserData manual override: ${customUserData}`);
  } catch (e) {
    console.error(`[BOOT] Falha ao setar UserData: ${e}`);
  }
}

// ============================================================================
// GARANTIR INSTÂNCIA ÚNICA
// ============================================================================

const isPlaywright = process.env.PLAYWRIGHT === 'true';
if (isPlaywright) {
  app.disableHardwareAcceleration();
}

const gotTheLock = isPlaywright ? true : app.requestSingleInstanceLock();

if (!gotTheLock) {
  console.warn(`[${APP_NAME}] Outra instância detectada. Finalizando.`);
  app.quit();
} else {
  app.on('second-instance', () => {
    try {
      const win = sovereignRegistry.getContext().mainWindow;
      if (win && !win.isDestroyed()) {
        if (win.isMinimized()) win.restore();
        win.show();
        win.focus();
      }
    } catch (e) {
      console.warn('[BOOT] Erro ao focar janela na segunda instância:', e);
    }
  });
}

// ============================================================================
// BOOT SEQUENCE (PHASED INITIALIZATION)
// ============================================================================

app.whenReady().then(async () => {
  console.log(`[${APP_NAME}] app.whenReady() - Iniciando Orquestração Soberana.`);
  
  const userDataPath = app.getPath('userData');
  ensureDirectories(userDataPath);
  initEnvironmentAndSecrets(userDataPath);

  try {
    // Fase 1: Boot Crítico (DB, Auth, Window)
    if (isPlaywright) {
       console.log('[BOOT] E2E Mode: Suprimindo Splash Window');
    } else {
       WindowManager.createSplashWindow();
    }

    await SovereignOrchestrator.startPhase1(userDataPath);
    
    // Fase 2: Background Services
    await SovereignOrchestrator.startPhase2();

    console.log(`[${APP_NAME}] Sistema inicializado com sucesso.`);
  } catch (error: any) {
    console.error(`[BOOT] Erro CRÍTICO na inicialização:`, error);
    if (isPlaywright) {
      process.stderr.write(`FATAL_E2E_ERROR: ${error.stack}\n`);
      app.quit();
    } else {
      dialog.showErrorBox('Erro de Inicialização', `O Áquila Pro não pôde iniciar:\n\n${error.message}`);
      app.quit();
    }
  }
});

// ============================================================================
// UTILS & HANDLERS
// ============================================================================

function ensureDirectories(userDataPath: string) {
  const dirs = ['logs', 'backups', 'photos', 'reports'].map(d => path.join(userDataPath, d));
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  }
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  WindowManager.setQuitting(true);
});

process.on('uncaughtException', (error) => {
  console.error('[FATAL] Uncaught Exception:', error);
  if (isPlaywright) process.stderr.write(`PLAYWRIGHT_FATAL: ${error.message}\n`);
});
