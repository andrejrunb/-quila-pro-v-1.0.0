import { app, BrowserWindow, Menu, Tray, Notification, nativeImage, shell, dialog, clipboard } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { sovereignRegistry } from './registry';

let mainWindow: BrowserWindow | null = null;
let splashWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let isQuitting = false;

const APP_NAME = 'Áquila Pro';
const APP_VERSION = '1.5.0';

const IS_DEV = process.env.NODE_ENV === 'development' || (typeof app !== 'undefined' && app.isPackaged === false);

export class WindowManager {
  public static createSplashWindow() {
    splashWindow = new BrowserWindow({
      width: 500, height: 350,
      frame: false, transparent: true,
      alwaysOnTop: true, resizable: false,
      skipTaskbar: true,
      webPreferences: { nodeIntegration: false, contextIsolation: true },
    });

    const splashHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            display: flex; align-items: center; justify-content: center;
            height: 100vh; background: transparent; font-family: 'Segoe UI', sans-serif;
            -webkit-app-region: drag;
          }
          .container {
            background: linear-gradient(135deg, #0a1628 0%, #1a365d 50%, #0a1628 100%);
            border-radius: 20px; padding: 60px 50px; text-align: center;
            box-shadow: 0 25px 50px rgba(0,0,0,0.5);
            border: 1px solid rgba(255,255,255,0.1);
            width: 460px;
          }
          .logo { font-size: 48px; margin-bottom: 10px; }
          h1 { color: #60a5fa; font-size: 28px; font-weight: 700; margin-bottom: 5px; }
          .subtitle { color: #94a3b8; font-size: 13px; margin-bottom: 30px; }
          .progress-bar {
            width: 100%; height: 4px; background: rgba(255,255,255,0.1);
            border-radius: 2px; overflow: hidden;
          }
          .progress-fill {
            height: 100%; background: linear-gradient(90deg, #3b82f6, #60a5fa);
            border-radius: 2px; animation: loading 2.5s ease-in-out infinite;
          }
          @keyframes loading {
            0% { width: 0%; }
            50% { width: 70%; }
            100% { width: 100%; }
          }
          .status { color: #64748b; font-size: 12px; margin-top: 15px; }
          .version { color: #475569; font-size: 11px; margin-top: 8px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">🦅</div>
          <h1>${APP_NAME}</h1>
          <p class="subtitle">Sistema de Segurança e Engajamento Escolar</p>
          <div class="progress-bar"><div class="progress-fill"></div></div>
          <p class="status">Inicializando sistema...</p>
          <p class="version">v${APP_VERSION}</p>
        </div>
      </body>
      </html>
    `;

    splashWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(splashHtml)}`);
  }

  public static createMainWindow() {
    const playwright = process.env.PLAYWRIGHT === 'true';
    
    mainWindow = new BrowserWindow({
      width: 1400, height: 900,
      minWidth: 1024, minHeight: 700,
      show: playwright,
      title: APP_NAME,
      icon: WindowManager.getAppIcon(),
      webPreferences: {
        preload: path.join(__dirname, '..', 'preload.js'),
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true,
        webSecurity: true,
      },
    });

    mainWindow.webContents.on('console-message', (_event, level, message, line, sourceId) => {
      console.log(`[Renderer] [L${level}] ${message} (${sourceId}:${line})`);
    });

    sovereignRegistry.setMainWindow(mainWindow);

    const distPath = path.join(__dirname, '..', 'index.html');
    const devUrl = 'http://localhost:3001';

    if (process.env.VITE_DEV === 'true') {
      console.log(`[WindowManager] Carregando dev server: ${devUrl}`);
      mainWindow.loadURL(devUrl).catch(err => {
        console.warn(`[WindowManager] Dev server inacessível, fallback para arquivo local.`);
        if (fs.existsSync(distPath)) mainWindow?.loadFile(distPath);
      });
    } else if (fs.existsSync(distPath)) {
      console.log(`[WindowManager] Carregando arquivo de produção local: ${distPath}`);
      mainWindow.loadFile(distPath).catch(err => {
        console.warn(`[WindowManager] Falha ao carregar arquivo local:`, err.message);
      });
    } else {
      console.log(`[WindowManager] index.html local não encontrado, tentando dev server ${devUrl}`);
      mainWindow.loadURL(devUrl);
    }

    if (IS_DEV && process.env.VITE_DEV === 'true') {
      mainWindow.webContents.openDevTools();
    }

    let shown = false;
    const showWindow = () => {
      if (shown) return;
      shown = true;
      console.log('[WindowManager] Exibindo janela principal na tela.');
      if (splashWindow && !splashWindow.isDestroyed()) {
        splashWindow.close();
      }
      splashWindow = null;

      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.show();
        mainWindow.focus();
        mainWindow.setAlwaysOnTop(true);
        mainWindow.setAlwaysOnTop(false);
      }
    };

    const safetyTimer = setTimeout(() => {
      console.log('[WindowManager] Safety timer fallback acionado.');
      showWindow();
    }, 2500);

    mainWindow.once('ready-to-show', () => {
      clearTimeout(safetyTimer);
      showWindow();
    });
    mainWindow.webContents.once('did-finish-load', () => {
      clearTimeout(safetyTimer);
      showWindow();
    });

    mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
      console.warn(`[WindowManager] did-fail-load (${errorCode}: ${errorDescription}) em ${validatedURL}`);
      if (validatedURL.includes('localhost') && fs.existsSync(distPath)) {
        console.log('[WindowManager] Redirecionando para arquivo local:', distPath);
        mainWindow?.loadFile(distPath);
      }
    });

    mainWindow.on('close', (event) => {
      if (!isQuitting) {
        event.preventDefault();
        mainWindow?.hide();
        WindowManager.showTrayNotification('Áquila Pro continua rodando', 'O sistema está monitorando em segundo plano.');
      }
    });

    mainWindow.on('closed', () => {
      mainWindow = null;
      sovereignRegistry.setMainWindow(null);
    });

    Menu.setApplicationMenu(null);
    return mainWindow;
  }

  public static createTray() {
    const icon = WindowManager.getAppIcon();
    tray = new Tray(icon);
    tray.setToolTip(`${APP_NAME} v${APP_VERSION}`);

    const contextMenu = Menu.buildFromTemplate([
      { label: 'Abrir Áquila Pro', click: () => { mainWindow?.show(); mainWindow?.focus(); } },
      { type: 'separator' },
      { label: 'Sair', click: () => { isQuitting = true; app.quit(); } },
    ]);

    tray.setContextMenu(contextMenu);
    tray.on('double-click', () => {
      mainWindow?.show();
      mainWindow?.focus();
    });
  }

  public static showTrayNotification(title: string, body: string) {
    if (Notification.isSupported()) {
      new Notification({ title, body, icon: WindowManager.getAppIcon() }).show();
    }
  }

  public static getAppIcon(): Electron.NativeImage {
    const iconPath = IS_DEV
      ? path.join(__dirname, '..', '..', 'resources', 'icon.ico')
      : path.join(process.resourcesPath, 'resources', 'icon.ico');

    if (fs.existsSync(iconPath)) {
      return nativeImage.createFromPath(iconPath);
    }
    return nativeImage.createFromPath('');
  }

  public static setQuitting(value: boolean) {
    isQuitting = value;
  }
}
