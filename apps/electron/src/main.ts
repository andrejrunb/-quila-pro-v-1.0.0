// [BOOT] Linha Zero - main.ts Executing (v1.0.0-PRO)
console.log('[BOOT] Áquila Pro: Processo Principal iniciado.');

import { app, dialog } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { WindowManager } from './main/window';
import { SovereignOrchestrator } from './main/orchestrator';
import { sovereignRegistry } from './main/registry';

// ============================================================================
// CONSTANTES E CONFIGURAÇÃO INICIAL
// ============================================================================

const APP_NAME = 'Áquila Pro';
const APP_VERSION = '1.5.0';

app.commandLine.appendSwitch('allow-file-access-from-files');

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
