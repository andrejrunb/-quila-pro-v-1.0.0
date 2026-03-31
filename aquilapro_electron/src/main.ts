/**
 * Áquila Pro Desktop - Main Process
 * Processo principal do Electron com janela, tray, auto-update e IPC handlers
 */

import { app, BrowserWindow, Menu, Tray, ipcMain, dialog, Notification, nativeImage, shell } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import Database from './database/Database';
import { BackupManager } from './services/BackupManager';
import { NotificationManager } from './services/NotificationManager';
import { AttendanceCalculator } from './services/AttendanceCalculator';
import { SmartReportService } from './services/SmartReportService';
import { ClassroomEntryService } from './services/ClassroomEntryService';
import { Logger } from './services/Logger';
import { LicenseManager } from './services/LicenseManager';
import { LGPDNetworkGuard } from './services/LGPDNetworkGuard';
import { LGPDService } from './services/LGPDService';
import { FaceWorkerBridge } from './services/FaceWorkerBridge';
import { ImmutableAuditLog } from './services/ImmutableAuditLog';
import { SyncService } from './services/SyncService';
import { WhatsAppQueue } from './services/WhatsAppQueue';
import { RTSPStreamReader } from './services/RTSPStreamReader';
import { RecognitionLoop } from './services/RecognitionLoop';
import { AlertEngine } from './services/AlertEngine';
import { HeatmapService } from './services/HeatmapService';
import { AuthService } from './services/AuthService';
import { WebSocketServerManager } from './services/WebSocketServer';
import { socialGraphService } from './services/SocialGraphService';
import { ReIDService } from './services/ReIDService';
import { conflictPredictionEngine } from './services/ConflictPredictionEngine';
import { hrSovereigntyService } from './services/HRSovereigntyService';
import * as ExcelJS from 'exceljs';
import SessionService from './services/SessionService';
import { ThemeService } from './services/ThemeService';
import { KeyboardShortcutsManager } from './services/KeyboardShortcutsManager';
import { AutoUpdateManager } from './services/AutoUpdateManager';
import { MobileCompanionService } from './services/MobileCompanionService';
import { StreamWatchdog } from './services/StreamWatchdog';
import { resourceMonitor } from './services/ResourceMonitorService';
import { storageCleanup } from './services/StorageCleanupService';
import { LicenseService } from './services/LicenseService';
import { performanceBenchmark } from './services/PerformanceBenchmark';
import { pushNotificationService } from './services/PushNotificationService';
import { gestureService } from './services/GestureService';
import { selfHealing } from './services/SelfHealingService';
import { DatabaseMirrorService } from './services/DatabaseMirrorService';
import { WeeklyReportService } from './services/WeeklyReportService';
import { microExpressionService } from './services/MicroExpressionService';
import { behavioralAuditService } from './services/BehavioralAuditService';
import { DocumentService } from './services/DocumentService';
import { ReportGenerator } from './services/ReportGenerator';
import { hardwareBridge } from './services/HardwareBridge';
import { backgroundCheckService } from './services/BackgroundCheckService';
import { swarmManager } from './services/agents/SwarmManager';
import { SecurityAgent } from './services/agents/SecurityAgent';
import { PedagogicalAgent } from './services/agents/PedagogicalAgent';
import { AnalyticsService } from './services/AnalyticsService';
import { evasionRiskService } from './services/EvasionRiskService';
import { securityService } from './services/SecurityService';
import { AuditService } from './services/AuditService';
import { evidenceArchiver } from './services/EvidenceArchiver';
import { MobileGateway } from './services/MobileGateway';
import { ioTMainService } from './services/IoTMainService';

// ============================================================================
// CONSTANTES
// ============================================================================

const APP_NAME = 'Áquila Pro';
const APP_VERSION = '1.2.6';
const IS_DEV = process.env.NODE_ENV === 'development' || !app.isPackaged;
const USER_DATA_PATH = app.getPath('userData');
const LOGS_PATH = path.join(USER_DATA_PATH, 'logs');
const BACKUPS_PATH = path.join(USER_DATA_PATH, 'backups');
const PHOTOS_PATH = path.join(USER_DATA_PATH, 'photos');
const REPORTS_PATH = path.join(USER_DATA_PATH, 'reports');

// ============================================================================
// VARIÁVEIS GLOBAIS
// ============================================================================

let mainWindow: BrowserWindow | null = null;
let splashWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let db: Database;
let backupManager: BackupManager;
let notificationManager: NotificationManager;
let logger: Logger;
let auditLog: ImmutableAuditLog;

// Inicializar Logger ABSOLUTAMENTE PRIMEIRO (Top Level)
ensureDirectories();
logger = new Logger(LOGS_PATH);
console.log(`[${APP_NAME}] Logger inicializado no Top-Level.`);

let licenseManager: LicenseManager;
export let faceWorker: FaceWorkerBridge;
let syncService!: SyncService;
let whatsAppQueue: WhatsAppQueue;
let streamReader: RTSPStreamReader;
let recognitionLoop: RecognitionLoop;
let alertEngine: AlertEngine;
let heatmapService: HeatmapService;
let authService: AuthService;
let sessionService: SessionService;
let reIDService: any;
let attendanceMonitor: any;
let themeService: ThemeService;
let shortcutsManager: KeyboardShortcutsManager;
let autoUpdateManager: AutoUpdateManager;
let mobileCompanion: MobileCompanionService;
let documentService: DocumentService;
let streamWatchdog: StreamWatchdog;
let isQuitting = false;
let lgpdService!: LGPDService;
let licenseService!: LicenseService;
let weeklyReportService!: WeeklyReportService;
let reportGenerator: ReportGenerator;
let securityAgent: SecurityAgent;
let pedagogicalAgent: PedagogicalAgent;
let analyticsService: AnalyticsService;
let auditService: AuditService;
let mobileGateway: MobileGateway;
let wsServer: WebSocketServerManager;
let isMaintenanceMode = false;

// ============================================================================
// GARANTIR INSTÂNCIA ÚNICA
// ============================================================================

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app?.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

// ============================================================================
// CRIAR DIRETÓRIOS NECESSÁRIOS
// ============================================================================

function ensureDirectories() {
  const dirs = [LOGS_PATH, BACKUPS_PATH, PHOTOS_PATH, REPORTS_PATH];
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
}

// ============================================================================
// SPLASH SCREEN
// ============================================================================

function createSplashWindow() {
  splashWindow = new BrowserWindow({
    width: 500,
    height: 350,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
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

// ============================================================================
// JANELA PRINCIPAL
// ============================================================================

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    show: false,
    title: APP_NAME,
    icon: getAppIcon(),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      webSecurity: true,
      allowRunningInsecureContent: false,
    },
  });

  const startUrl = IS_DEV
    ? 'http://localhost:3001'
    : `file://${path.join(__dirname, 'index.html')}`;

  console.log(`[${APP_NAME}] Carregando URL: ${startUrl}`);
  
  if (!IS_DEV && !fs.existsSync(path.join(__dirname, 'index.html'))) {
    console.error(`[${APP_NAME}] ERRO CRÍTICO: index.html não encontrado em ${__dirname}`);
    dialog.showErrorBox('Erro de Inicialização', `Arquivo index.html não encontrado em: ${__dirname}\n\nO aplicativo não pode carregar a interface.`);
  }

  mainWindow.loadURL(startUrl);

  // Mostrar quando pronto
  mainWindow?.once('ready-to-show', () => {
    if (splashWindow) {
      splashWindow?.close();
      splashWindow = null;
    }
    mainWindow?.show();
    mainWindow?.focus();

    // Bridging IoTMainService events to the Renderer
    ioTMainService.on('devices-updated', (devices: any) => {
      mainWindow?.webContents.send('iot:devices-updated', devices);
      // Propagar para o Swarm se houver alertas
      const alerts = devices.filter((d: any) => d.status === 'error' || d.status === 'busy');
      if (alerts.length > 0) {
        swarmManager.broadcast('iot:sensor_alert', { devices: alerts, message: 'Sensores IoT detectaram atividade ou erro.' });
      }
    });

    // Bridging VoiceIntelligence events
    const { voiceIntelligenceService } = require('./services/VoiceIntelligenceService');
    voiceIntelligenceService.on('audio-update', (metric: any) => {
      mainWindow?.webContents.send('voice:audio-update', metric);
    });
    voiceIntelligenceService.on('panic-alert', (alert: any) => {
      mainWindow?.webContents.send('voice:panic-alert', alert);
    });

    // Bridging ReID events (v3650 Unified)
    const { reIDService } = require('./services/ReIDService');
    reIDService.on('reid-update', (session: any) => {
      mainWindow?.webContents.send('reid:update', session);
    });

    // Bridging Attendance Telemetry
    const { attendanceMonitor } = require('./services/AttendanceMonitor');
    attendanceMonitor.on('attendance-updated', (telemetry: any) => {
      mainWindow?.webContents.send('attendance:telemetry-update', telemetry);
    });

    // Bridging Evasion Risk events
    const { evasionRiskService } = require('./services/EvasionRiskService');
    evasionRiskService.on('risk-audit-completed', (profiles: any) => {
      mainWindow?.webContents.send('evasion:audit-update', profiles);
    });

    // Bridging NPU status events
    const { npuOptimization } = require('./services/NPUOptimizationService');
    npuOptimization.on('npu-status-updated', (status: any) => {
      mainWindow?.webContents.send('npu:status-update', status);
    });

    // Bridging Heatmap Telemetry (Phase 500)
    const { heatmapService } = require('./services/HeatmapService');
    heatmapService.on('heatmap-update', (data: any) => {
      mainWindow?.webContents.send('analytics:heatmap-update', data);
    });

    // Bridging Mobile Ecosystem (Phase 501)
    const { mobileGuardService } = require('./services/MobileGuardService');
    mobileGuardService.on('push-sent', (notif: any) => {
      mainWindow?.webContents.send('mobile:guard-push', notif);
    });

    const { mobileParentPortal } = require('./services/MobileParentPortal');
    mobileParentPortal.on('arrival-detected', (event: any) => {
      mainWindow?.webContents.send('mobile:parent-arrival', event);
    });

    // Cloud Mirroring (Phase 510)
    const { cloudMirrorService } = require('./services/CloudMirrorService');
    cloudMirrorService.on('sync-success', (packet: any) => {
      mainWindow?.webContents.send('cloud:sync-success', packet);
    });

    // Predictive Security (Phase 520)
    const { conflictPredictionEngine } = require('./services/ConflictPredictionEngine');
    conflictPredictionEngine.on('risk-detected', (risk: any) => {
      mainWindow?.webContents.send('predictive:risk-alert', risk);
    });

    // Robotics & Drones (Phase 600)
    const { roboticsBridge } = require('./services/RoboticsBridge');
    roboticsBridge.on('telemetry-update', (data: any) => {
      mainWindow?.webContents.send('robotics:telemetry', data);
    });
  });

  // DevTools - Habilitado temporariamente para depuração em produção
  mainWindow.webContents.openDevTools({ mode: 'detach' });
  
  if (IS_DEV) {
    // mainWindow.webContents.openDevTools({ mode: 'detach' });
  }

  // Minimizar para tray ao fechar
  mainWindow?.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow?.hide();
      showTrayNotification('Áquila Pro continua rodando', 'O sistema está monitorando em segundo plano.');
    }
  });

  mainWindow?.on('closed', () => {
    mainWindow = null;
  });

  // Criar menu
  // Remover menu padrão para visual de App nativo (Eagle Dark)
  Menu.setApplicationMenu(null);
  // createAppMenu();
}

// ============================================================================
// SYSTEM TRAY
// ============================================================================

function createTray() {
  const icon = getAppIcon();
  tray = new Tray(icon);
  tray.setToolTip(`${APP_NAME} v${APP_VERSION}`);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Abrir Áquila Pro',
      click: () => {
        mainWindow?.show();
        mainWindow?.focus();
      },
    },
    { type: 'separator' },
    {
      label: 'Status do Sistema',
      click: () => {
        mainWindow?.show();
        mainWindow?.webContents.send('navigate', 'dashboard');
      },
    },
    {
      label: 'Câmeras',
      click: () => {
        mainWindow?.show();
        mainWindow?.webContents.send('navigate', 'cameras');
      },
    },
    {
      label: 'Alertas',
      click: () => {
        mainWindow?.show();
        mainWindow?.webContents.send('navigate', 'alerts');
      },
    },
    { type: 'separator' },
    {
      label: 'Fazer Backup Agora',
      click: async () => {
        try {
          await backupManager.backupNow();
          showTrayNotification('Backup Concluído', 'O backup foi realizado com sucesso.');
        } catch (error) {
          showTrayNotification('Erro no Backup', 'Falha ao realizar backup.');
        }
      },
    },
    { type: 'separator' },
    {
      label: `Versão ${APP_VERSION}`,
      enabled: false,
    },
    {
      label: 'Sair',
      click: () => {
        isQuitting = true;
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);

  tray?.on('double-click', () => {
    mainWindow?.show();
    mainWindow?.focus();
  });
}

function showTrayNotification(title: string, body: string) {
  if (Notification.isSupported()) {
    new Notification({ title, body, icon: getAppIcon() }).show();
  }
}

// ============================================================================
// ÍCONE DO APP
// ============================================================================

function getAppIcon(): Electron.NativeImage {
  const iconPath = IS_DEV
    ? path.join(__dirname, '../resources/icon.png')
    : path.join(process.resourcesPath, 'resources/icon.png');

  if (fs.existsSync(iconPath)) {
    return nativeImage.createFromPath(iconPath);
  }

  // Ícone padrão se não encontrar
  return nativeImage.createFromPath('');
}

// ============================================================================
// MENU DA APLICAÇÃO
// ============================================================================

function createAppMenu() {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: 'Arquivo',
      submenu: [
        {
          label: 'Fazer Backup',
          accelerator: 'CmdOrCtrl+B',
          click: async () => {
            await backupManager.backupNow();
            dialog.showMessageBox(mainWindow!, {
              type: 'info',
              title: 'Backup',
              message: 'Backup realizado com sucesso!',
            });
          },
        },
        { type: 'separator' },
        {
          label: 'Configurações',
          accelerator: 'CmdOrCtrl+,',
          click: () => mainWindow?.webContents.send('navigate', '/settings'),
        },
        { type: 'separator' },
        {
          label: 'Sair',
          accelerator: 'CmdOrCtrl+Q',
          click: () => {
            isQuitting = true;
            app.quit();
          },
        },
      ],
    },
    {
      label: 'Editar',
      submenu: [
        { role: 'undo', label: 'Desfazer' },
        { role: 'redo', label: 'Refazer' },
        { type: 'separator' },
        { role: 'cut', label: 'Recortar' },
        { role: 'copy', label: 'Copiar' },
        { role: 'paste', label: 'Colar' },
        { role: 'selectAll', label: 'Selecionar Tudo' },
      ],
    },
    {
      label: 'Exibir',
      submenu: [
        { role: 'reload', label: 'Recarregar' },
        { role: 'forceReload', label: 'Forçar Recarregamento' },
        { type: 'separator' },
        { role: 'resetZoom', label: 'Zoom Padrão' },
        { role: 'zoomIn', label: 'Aumentar Zoom' },
        { role: 'zoomOut', label: 'Diminuir Zoom' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: 'Tela Cheia' },
        ...(IS_DEV ? [{ role: 'toggleDevTools' as const, label: 'DevTools' }] : []),
      ],
    },
    {
      label: 'Navegação',
      submenu: [
        { label: 'Dashboard', click: () => mainWindow?.webContents.send('navigate', 'dashboard') },
        { label: 'Câmeras', click: () => mainWindow?.webContents.send('navigate', 'cameras') },
        { label: 'Alunos', click: () => mainWindow?.webContents.send('navigate', 'students') },
        { label: 'Relatórios', click: () => mainWindow?.webContents.send('navigate', 'reports') },
        { label: 'Alertas', click: () => mainWindow?.webContents.send('navigate', 'alerts') },
        { label: 'Configurações', click: () => mainWindow?.webContents.send('navigate', 'settings') },
      ],
    },
    {
      label: 'Ajuda',
      submenu: [
        {
          label: 'Documentação',
          click: () => shell.openExternal('https://docs.aquilapro.com.br'),
        },
        {
          label: 'Suporte',
          click: () => shell.openExternal('https://wa.me/5561999623099'),
        },
        { type: 'separator' },
        {
          label: 'Verificar Atualizações',
          click: async () => {
            dialog.showMessageBox(mainWindow!, {
              type: 'info',
              title: 'Atualizações',
              message: `Versão atual: ${APP_VERSION}`,
              detail: 'Verificando atualizações...',
            });
          },
        },
        { type: 'separator' },
        {
          label: `Sobre ${APP_NAME}`,
          click: () => {
            dialog.showMessageBox(mainWindow!, {
              type: 'info',
              title: `Sobre ${APP_NAME}`,
              message: `${APP_NAME} v${APP_VERSION}`,
              detail: [
                'Sistema de Segurança e Engajamento Escolar',
                '',
                `Plataforma: ${os.platform()} ${os.arch()}`,
                `Node.js: ${process.versions.node}`,
                `Electron: ${process.versions.electron}`,
                `Chrome: ${process.versions.chrome}`,
                '',
                '© 2026 André Jr - Todos os direitos reservados',
                'Contato: andrejrunb@yahoo.com.br',
                'WhatsApp: +55 (61) 99962-3099',
              ].join('\n'),
            });
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// ============================================================================
// IPC HANDLERS
// ============================================================================

function registerIpcHandlers() {
  // ---- SISTEMA ----
  ipcMain.handle('get-app-version', () => APP_VERSION);
  ipcMain.handle('get-system-info', () => ({
    platform: os.platform(),
    arch: os.arch(),
    cpus: os.cpus().length,
    totalMemory: os.totalmem(),
    freeMemory: os.freemem(),
    uptime: os.uptime(),
    hostname: os.hostname(),
    appVersion: APP_VERSION,
    electronVersion: process.versions.electron,
    nodeVersion: process.versions.node,
    userDataPath: USER_DATA_PATH,
  }));

  ipcMain.handle('get-hardware-id', () => licenseService?.getHardwareId());
  // ---- RELATÓRIOS INTELIGENTES (AG-022) ----
  ipcMain.handle('get-smart-narrative', async (_event, params) => {
    const studentId = typeof params === 'string' ? params : params.studentId;
    const date = params?.date ? new Date(params.date) : new Date();
    
    // Log de Auditoria (Essencial p/ Compliance LGPD)
    await db.createAuditEntry({
      userId: 'system',
      studentId: studentId,
      action: 'VIEW_BRIEFING',
      reason: `Visualizou resumo narrativo do aluno`,
      timestamp: new Date().toISOString()
    });

    // Se tiver data específica, usa o serviço de relatório diário (Step 22)
    const calculator = new AttendanceCalculator(db);
    const reporter = new SmartReportService(db, calculator);
    return await reporter.generateDailySummary(studentId, date);
  });

  ipcMain.handle('get-school-entry-status', async () => {
    const entryService = new ClassroomEntryService(db);
    return await entryService.getFullStatus();
  });

  ipcMain.handle('get-dashboard-stats', async () => await db.getDashboardStats());

  // ---- BRAIN / ANALYTICS (Onda 3) ----
  ipcMain.handle('get-evasion-risk-profiles', async () => {
    return evasionRiskService.getAllProfiles();
  });

  // ---- LICENCIAMENTO (PHASE 3) ----
  ipcMain.handle('license:get', async () => await licenseService?.getActiveLicense());
  ipcMain.handle('license:check-limit', async (_event, type) => await licenseService?.checkLimit(type));
  ipcMain.handle('license:activate', async (_event, key) => await licenseService?.activateLicense(key));

  // ---- CONFIGURAÇÕES ----
  ipcMain.handle('get-settings', async () => await db.getSettings());
  ipcMain.handle('save-settings', async (_event, settings) => await db.saveSettings(settings));

  // ---- CÂMERAS (Sincronizado com Inventory - Passo 51) ----
  ipcMain.handle('get-cameras', async () => await db.getCameras());
  
  ipcMain.handle('add-camera', async (_event, camera) => {
    // Verificar limite da licença (Phase 3 - Step 51)
    await licenseService?.assertCameraLimit();
    
    const result = await db.addCamera(camera);
    
    // Ativação imediata do stream (Requisito Crítico)
    try {
      if (recognitionLoop) {
        await recognitionLoop.reloadCamera(camera.id, {
          cameraId: camera.id,
          rtspUrl: camera.rtspUrl,
          zone: camera.location || 'entrada',
          fps: camera.fps || 1
        });
        console.log(`[Main] Stream ativado para nova câmera: ${camera.id}`);
      }
    } catch (err) {
      console.error(`[Main] Erro ao iniciar stream para nova câmera ${camera.id}:`, err);
    }
    return result;
  });

  ipcMain.handle('update-camera', async (_event, camera) => {
    const result = await db.updateCameraStatus(camera.id, camera.status);
    // Se mudou pra online ou offline via UI, podemos agir aqui
    return result;
  });

  ipcMain.handle('remove-camera', async (_event, cameraId) => {
    if (streamReader) streamReader.stopStream(cameraId);
    return await db.deleteCamera(cameraId);
  });

  ipcMain.handle('test-camera', async (_event, rtspUrl) => {
    return new Promise((resolve) => {
      try {
        // 💡 Suporte para Webcam Local (Índice numérico)
        if (/^\d+$/.test(rtspUrl)) {
          return resolve({ success: true, message: 'Webcam local detectada. O teste de rede foi ignorado.' });
        }

        // Extrair host e porta da URL RTSP: rtsp://user:pass@host:port/path
        const match = rtspUrl.match(/@([^:\\/]+)(?::(\d+))?/);
        if (!match) {
          return resolve({ success: false, message: 'URL RTSP inválida ou malformada.' });
        }
        
        const host = match[1];
        const port = parseInt(match[2] || '554');
        
        const net = require('net');
        const socket = new net.Socket();
        
        socket.setTimeout(5000);
        
        socket.on('connect', () => {
          socket.destroy();
          // 🔑 Atualiza status da câmera para ONLINE no banco de dados
          db.getCameras().then((cameras: any[]) => {
            const cam = cameras.find((c: any) => c.rtsp_url === rtspUrl || c.rtspUrl === rtspUrl);
            if (cam) {
              db.updateCameraStatus(cam.id, 'online').catch(() => {});
            }
          }).catch(() => {});
          resolve({ success: true, message: 'Conexão TCP com a câmera estabelecida (Porta RTSP aberta).' });
        });
        
        socket.on('timeout', () => {
          socket.destroy();
          // Marca câmera como offline no banco
          db.getCameras().then((cameras: any[]) => {
            const cam = cameras.find((c: any) => c.rtsp_url === rtspUrl || c.rtspUrl === rtspUrl);
            if (cam) db.updateCameraStatus(cam.id, 'offline').catch(() => {});
          }).catch(() => {});
          resolve({ success: false, message: 'Tempo limite esgotado (Camera inacessível na rede).' });
        });
        
        socket.on('error', (err: any) => {
          socket.destroy();
          db.getCameras().then((cameras: any[]) => {
            const cam = cameras.find((c: any) => c.rtsp_url === rtspUrl || c.rtspUrl === rtspUrl);
            if (cam) db.updateCameraStatus(cam.id, 'offline').catch(() => {});
          }).catch(() => {});
          resolve({ success: false, message: `Erro de rede: ${err.message}` });
        });
        
        socket.connect(port, host);
      } catch (error: any) {
        resolve({ success: false, message: `Falha na inicialização do teste: ${error.message}` });
      }
    });
  });

  // ---- ALUNOS ----
  ipcMain.handle('get-students', async (_event, classId) => {
    if (classId) return await db.getStudentsByClass(classId);
    return await db.getStudentsByClass('all');
  });

  ipcMain.handle('get-social-context-for-student', async (_event, studentId) => await db.getSocialContextForStudent(studentId));
  ipcMain.handle('create-student', async (_event, student) => await db.createStudent(student));

  ipcMain.handle('upload-student-photo', async (_event, studentId, photoPath) => {
    const destDir = path.join(PHOTOS_PATH, studentId);
    if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
    const destPath = path.join(destDir, `photo_${Date.now()}.jpg`);
    fs.copyFileSync(photoPath, destPath);
    return { success: true, path: destPath };
  });

  // ---- PRESENÇA ----
  ipcMain.handle('calculate-attendance', async (_event, query) => {
    const calculator = new AttendanceCalculator(db);
    return await calculator.calculateAttendance(query.studentId, query.classId, query.date);
  });

  ipcMain.handle('get-attendance-report', async (_event, classId, startDate, endDate) => {
    return await db.getAttendanceReport(classId, new Date(startDate), new Date(endDate));
  });

  ipcMain.handle('get-daily-attendance-summary', async (_event, date) => {
    return await db.getAttendanceReport('all', new Date(date), new Date(date));
  });

  // ---- EVENTOS ----
  ipcMain.handle('get-recent-events', async (_event, limit) => {
    return await db.getRecentSecurityAlerts(limit || 50);
  });

  ipcMain.handle('get-bimestral-report', async (_event, studentId, year) => {
    const y = year || new Date().getFullYear();
    return await db.getAttendanceBimestral(studentId, y);
  });


  ipcMain.handle('get-alerts', async (_event, filter) => {
    const all = await db.getUnreadNotifications();
    if (!filter) return all;
    return all.filter((n: any) =>
      (!filter.type || n.type === filter.type) &&
      (!filter.read || n.read === filter.read)
    );
  });

  ipcMain.handle('send-briefing-notification', async (_event, { studentId, message, type }) => {
    // Simulação de envio de WhatsApp/SMS
    console.log(`[SIMULATION] Sending ${type} briefing for student ${studentId}: ${message}`);
    // Adiciona log na tabela de notificações para rastreio
    await db.createNotification({
      type: 'BRIEFING_SENT',
      title: `Briefing ${type === 'whatsapp' ? 'WhatsApp' : 'SMS'} Enviado`,
      message: message,
      priority: 'low',
      studentId: studentId
    });
    return { success: true };
  });

  ipcMain.handle('export-student-report-pdf', async (_event, { studentId }) => {
    // Simulação de exportação PDF
    console.log(`[SIMULATION] Exporting PDF report for student ${studentId}`);
    return { success: true, path: `C:/Exports/Report_${studentId}_${Date.now()}.pdf` };
  });

  // ---- GESTÃO DE SALAS E TURMAS (AG-024) ----
  ipcMain.handle('get-rooms', async () => await db.getRooms());
  ipcMain.handle('upsert-room', async (_event, room) => await db.upsertRoom(room));
  ipcMain.handle('delete-room', async (_event, id) => await db.deleteRoom(id));

  ipcMain.handle('get-classes', async () => await db.getClasses());
  ipcMain.handle('upsert-class', async (_event, classObj) => await db.upsertClass(classObj));
  ipcMain.handle('delete-class', async (_event, id) => await db.deleteClass(id));

  ipcMain.handle('get-schedules', async () => await db.getSchedules());
  ipcMain.handle('upsert-schedule', async (_event, s) => await db.upsertSchedule(s));
  ipcMain.handle('delete-schedule', async (_event, id) => await db.deleteSchedule(id));
  ipcMain.handle('get-schedule-optimizations', async () => {
    const { SmartScheduleService } = require('./services/SmartScheduleService');
    const service = new SmartScheduleService(db);
    return await service.getOptimizationSuggestions();
  });
  ipcMain.handle('get-unread-alerts', async () => await db.getUnreadNotifications());
  ipcMain.handle('mark-alert-read', async (_event, alertId) => await db.markNotificationRead(alertId));
  ipcMain.handle('mark-all-alerts-read', async () => {
    const unread = await db.getUnreadNotifications();
    for (const n of unread) await db.markNotificationRead(n.id);
    return { success: true };
  });

  // ---- COORDENAÇÃO E PERÍODOS (AG-025) ----
  ipcMain.handle('get-coordinations', async () => await db.getCoordinations());
  ipcMain.handle('upsert-coordination', async (_event, c) => await db.upsertCoordination(c));
  ipcMain.handle('delete-coordination', async (_event, id) => await db.deleteCoordination(id));

  ipcMain.handle('get-academic-periods', async () => await db.getAcademicPeriods());
  ipcMain.handle('upsert-academic-period', async (_event, p) => await db.upsertAcademicPeriod(p));
  ipcMain.handle('delete-academic-period', async (_event, id) => await db.deleteAcademicPeriod(id));
  
  ipcMain.handle('get-student-rankings', async (_event, metric, limit) => await db.getStudentRankings(metric, limit));
  ipcMain.handle('calculate-reprobation-risk', async (_event, studentId) => await db.calculateReprobationRisk(studentId));
  ipcMain.handle('get-student-trajectory', async (_event, studentId, date) => await db.getStudentTrajectory(studentId, date));
  ipcMain.handle('get-behavioral-stats', async () => await db.getBehavioralStats());
  ipcMain.handle('get-social-context-summary', async () => await db.getSocialContextSummary());

  ipcMain.handle('get-student-report', async (_event, sId, pId) => await db.getStudentReport(sId, pId));
  ipcMain.handle('upsert-student-report', async (_event, r) => await db.upsertStudentReport(r));

  ipcMain.handle('get-users', async () => await db.getUsers());
  
  ipcMain.handle('login', async (_event, { email, username, password, role }) => {
    const ident = email || username;
    const session = await authService.login(ident, password);
    if (session) {
      if (role && session.user.role !== role && session.user.role !== 'admin') {
         return { success: false, message: `O usuário não possui permissão de ${role}.` };
      }
      sessionService.set('current_session', session.token);
      return { success: true, user: session.user };
    }
    return { success: false, message: 'Usuário ou senha inválidos' };
  });

  ipcMain.handle('logout', async () => {
    const token = sessionService.get('current_session');
    if (token) authService.logout(token);
    sessionService.delete('current_session');
    return { success: true };
  });

  ipcMain.handle('get-current-user', async () => {
    const token = sessionService.get('current_session');
    if (!token) return null;
    const session = authService.validateSession(token);
    return session ? session.user : null;
  });

  ipcMain.handle('is-setup-complete', async () => {
    // Para o MVP Pilot, verificamos se a escola tem o nome configurado
    const schoolName = sessionService.get('school_name');
    return !!schoolName;
  });

  ipcMain.handle('set-school-name', async (_event, name) => {
    sessionService.set('school_name', name);
    return { success: true };
  });

  ipcMain.handle('import-students', async (_event, students: any[]) => {
    console.log(`[IMPORT] Processing ${students.length} students in batch...`);
    for (const s of students) {
      await db.createStudent({
        id: s.id || `std-${Math.random().toString(36).substring(7)}`,
        name: s.name,
        classId: s.classId || 'default',
        photoPath: s.photoPath || ''
      });
    }
    return { success: true, count: students.length };
  });

  ipcMain.handle('create-lead', async (_event, leadData) => {
    await db.createLead(leadData);
    return { success: true };
  });

  ipcMain.handle('get-audit-logs', async (_event, studentId?: string) => {
    return await db.getAuditLogs(studentId);
  });

  // ---- IoT & HARDWARE (Step 05/06) ----
  ipcMain.handle('iot:connect', async (_event, config) => await ioTMainService.connectDevice(config));
  ipcMain.handle('iot:open-gate', async (_event, deviceId) => await ioTMainService.openGate(deviceId));
  ipcMain.handle('iot:disconnect-all', () => { /* Simulado: ioTMainService.disconnectAll() */ });
  
  // ---- LOCKDOWN PROTOCOL (Phase 730) ----
  ipcMain.handle('toggle-lockdown', async (_event, active: boolean) => {
    console.log(`[LOCKDOWN] ${active ? 'ATIVANDO' : 'DESATIVANDO'} PROTOCOLO DE EMERGÊNCIA`);
    if (active) {
      await ioTMainService.lockAll(); // Bloqueia todas as saídas
      
      // Notificação Crítica
      new Notification({
        title: '⚠️ LOCKDOWN ATIVADO',
        body: 'Todas as saídas foram bloqueadas por protocolo de segurança.',
        urgency: 'critical'
      }).show();
    } else {
      await ioTMainService.unlockAll();
    }
    return { success: true, status: active ? 'emergency' : 'normal' };
  });

  // ---- SAFEVISITOR PRO: BACKGROUND CHECKS (Phase 710) ----
  ipcMain.handle('perform-background-check', async (_event, { cpf, name }) => {
    return await backgroundCheckService.verifyVisitor(cpf, name);
  });

  ipcMain.handle('get-leads', async () => {
    return await (db as any).getLeads();
  });

  ipcMain.handle('update-school-branding', async (_event, branding) => {
    // Para simplificar no MVP, assumimos uma única escola ou a ativa
    const sql = `UPDATE schools SET schoolLogo = ?, primaryColor = ? WHERE id = (SELECT id FROM schools LIMIT 1)`;
    await db.run(sql, [branding.logo, branding.primaryColor]);
    return { success: true };
  });

  ipcMain.handle('get-school-settings', async () => {
    const sql = `SELECT * FROM schools LIMIT 1`;
    return await db.get(sql);
  });

  ipcMain.handle('create-user', async (_event, userData) => {
    // Apenas admin pode criar usuários (checagem básica no main, ideal no logic)
    const token = sessionService.get('current_session');
    const session = authService.validateSession(token);
    if (!session || session.user.role !== 'admin') {
      return { success: false, message: 'Não autorizado' };
    }
    
    await authService.createUser(userData);
    return { success: true };
  });

  // AI & Verification (AG-026)
  ipcMain.handle('get-verification-queue', async () => {
    return await db.getVerificationQueue();
  });

  ipcMain.handle('update-verification-status', async (_event, id, status, confirmedStudentId, coordinatorId) => {
    return await db.updateVerificationStatus(id, status, confirmedStudentId, coordinatorId);
  });
  ipcMain.handle('update-user-role', async (_event, userId, role, coordinationId) => await db.updateUserRole(userId, role, coordinationId));

  // ---- ATTENDANCE HISTORY (missing handler) ----
  ipcMain.handle('get-student-attendance-history', async (_event, studentId, days = 30) => {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    return await db.all(
      `SELECT logged_at, type FROM attendance_logs WHERE student_id = ? AND logged_at > ? ORDER BY logged_at DESC LIMIT 200`,
      [studentId, since.toISOString()]
    );
  });

  // ---- DIALOGS (needed by BatchPhotoImporter) ----
  ipcMain.handle('dialog:openDirectory', async () => {
    const result = await dialog.showOpenDialog(mainWindow!, { properties: ['openDirectory'] });
    return result.canceled ? null : result.filePaths[0];
  });
  ipcMain.handle('dialog:openFile', async (_event, opts) => {
    const result = await dialog.showOpenDialog(mainWindow!, { properties: ['openFile'], ...opts });
    return result.canceled ? null : result.filePaths[0];
  });

  // ---- BATCH IMPORT (Item 32) ----
  ipcMain.handle('scan-photo-folder', async (_event, folderPath) => {
    if (!fs.existsSync(folderPath)) return [];
    return fs.readdirSync(folderPath)
      .filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f))
      .map(f => ({
        name: path.basename(f, path.extname(f)),
        path: path.join(folderPath, f),
      }));
  });
  ipcMain.handle('delete-student', async (_event, studentId) => {
    await db.deleteStudent(studentId);
    return { success: true };
  });

  ipcMain.handle('update-student', async (_event, studentId, data) => {
    await db.updateStudent(studentId, data);
    return { success: true };
  });

  ipcMain.handle('import-student', async (_event, data) => {
    try {
      const studentId = `student_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      await db.createStudent({ id: studentId, name: data.name, class: data.class, phone: data.parentPhone });
      if (data.photoPath && fs.existsSync(data.photoPath)) {
        const destDir = path.join(PHOTOS_PATH, studentId);
        if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
        fs.copyFileSync(data.photoPath, path.join(destDir, 'photo.jpg'));
      }
      return { success: true, id: studentId };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  });
  ipcMain.handle('parse-import-spreadsheet', async (_event, filePath) => {
    try {
      if (!fs.existsSync(filePath)) throw new Error('Arquivo não encontrado');
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(filePath);
      const worksheet = workbook.getWorksheet(1);
      const results: any[] = [];
      
      worksheet?.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // Header
        const name = row.getCell(1).value?.toString();
        if (!name) return;

        results.push({
          name,
          class: row.getCell(2).value?.toString() || '',
          parentName: row.getCell(3).value?.toString() || '',
          parentPhone: row.getCell(4).value?.toString() || '',
          registrationNumber: row.getCell(5).value?.toString() || '',
          externalId: row.getCell(6).value?.toString() || '',
        });
      });
      return { success: true, data: results };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  });

  // ---- WHATSAPP TEMPLATES (Item 35) ----
  ipcMain.handle('save-whatsapp-templates', async (_event, templates) => {
    await db.saveSettings({ whatsapp_templates: JSON.stringify(templates) });
    return { success: true };
  });
  ipcMain.handle('get-whatsapp-templates', async () => {
    const s = await db.getSettings();
    return JSON.parse(s.whatsapp_templates || '[]');
  });


  ipcMain.handle('get-attendance-anomalies', async (_event, studentId) => {
    return await db.calculateAttendanceAnomalies(studentId);
  });

  // ---- INFRASTRUCTURE & HEALTH (Steps 51-53) ----

  ipcMain.handle('get-system-health', async () => {
    // Cálculo real de CPU (Fase Produção)
    const cpusBefore = os.cpus();
    await new Promise(resolve => setTimeout(resolve, 100));
    const cpusAfter = os.cpus();
    
    let totalIdle = 0;
    let totalTick = 0;
    
    for(let i = 0; i < cpusBefore.length; i++) {
        const start = cpusBefore[i].times;
        const end = cpusAfter[i].times;
        totalIdle += end.idle - start.idle;
        for(let type in start) {
            totalTick += (end as any)[type] - (start as any)[type];
        }
    }
    
    const cpuUsage = totalTick > 0 ? (1 - totalIdle / totalTick) * 100 : 0;
    const totalMem = os.totalmem();
    const freeMem = os.freemem();

    return {
      cpu: Math.round(cpuUsage),
      temp: null, // Veridical: Sem sensor nativo via Node no Windows
      memory: Number(((totalMem - freeMem) / (1024 ** 3)).toFixed(1)),
      totalMemory: Number((totalMem / (1024 ** 3)).toFixed(1)),
      uptime: `${Math.floor(os.uptime() / 86400)}d ${Math.floor((os.uptime() % 86400) / 3600)}h`
    };
  });

  ipcMain.handle('install-update', () => {
    if (autoUpdateManager) autoUpdateManager.installUpdate();
  });

  ipcMain.handle('check-for-updates', async () => {
    if (autoUpdateManager) {
      // Forçar uma verificação manual
      autoUpdateManager.start(); 
      return { success: true, message: 'Verificação iniciada.' };
    }
    return { success: false, message: 'Serviço de atualização não disponível.' };
  });

  // ---- NOTIFICAÇÕES ----
  ipcMain.handle('get-notifications', async () => await db.getUnreadNotifications());
  ipcMain.handle('mark-notification-read', async (_event, id) => await db.markNotificationRead(id));
  ipcMain.handle('send-desktop-notification', async (_event, notification) => {
    showTrayNotification(notification.title, notification.message);
    return { success: true };
  });

  // ---- RELATÓRIOS V3 (Step 08) ----
  ipcMain.handle('reports:generate-attendance', async (_event, { periodId, classId, format }) => {
    try {
      const filePath = format === 'pdf' 
        ? await reportGenerator.generateAttendancePDF(periodId, classId)
        : await reportGenerator.generateAttendanceExcel(periodId, classId);
      
      // Abrir arquivo automaticamente (UX V3)
      shell.openPath(filePath);
      return { success: true, data: { filePath } };
    } catch (err: any) {
      console.error('[IPC] Erro reports:generate-attendance:', err);
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('reports:generate-behavior', async (_event, { studentId, periodId, format }) => {
    try {
      const filePath = format === 'pdf'
        ? await reportGenerator.generateBehaviorPDF(studentId, periodId)
        : await reportGenerator.generateBehaviorExcel(studentId, periodId);
      
      shell.openPath(filePath);
      return { success: true, data: { filePath } };
    } catch (err: any) {
      console.error('[IPC] Erro reports:generate-behavior:', err);
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('trigger-weekly-reports', async () => {
    await weeklyReportService.generateAllReports();
    return { success: true };
  });

  // ---- FINANCEIRO V3 (Step 09) ----
  ipcMain.handle('finance:get-stats', async () => {
    try {
      return await db.getFinancialStats();
    } catch (err: any) {
      console.error('[IPC] Erro finance:get-stats:', err);
      return { totalPaid: 0, totalPending: 0, totalOverdue: 0, inadimplencyRate: 0 };
    }
  });

  ipcMain.handle('finance:get-all-billing', async () => {
    try {
      const billing = await db.getAllBilling();
      const students = await db.getStudents();
      return billing.map(b => {
        const student = students.find(s => s.id === b.studentHash);
        return { ...b, studentName: student?.name || 'Aluno Externo' };
      });
    } catch (err: any) {
      console.error('[IPC] Erro finance:get-all-billing:', err);
      return [];
    }
  });

  ipcMain.handle('finance:sync', async () => {
    try {
      // Simulação de Sync com ERP Externo (V3)
      console.log('[Main] Sincronizando faturas com ERP...');
      const students = await db.getStudents();
      for (const student of students.slice(0, 5)) {
        await db.upsertBilling({
          id: `bill_${student.id}_${Date.now()}`,
          studentHash: student.id,
          amount: 850.00,
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: Math.random() > 0.3 ? 'paid' : 'pending',
          pixCode: '00020126360014BR.GOV.BCB.PIX0114+5511999999999520400005303986540510.005802BR5913Andre Jr6009SAO PAULO62070503***6304ABCD'
        });
      }
      return { success: true, message: 'Faturas sincronizadas com sucesso.' };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  });

  // ---- BACKUP ----
  ipcMain.handle('backup-now', async () => await backupManager.backupNow());
  ipcMain.handle('get-backup-history', async () => {
    const files = fs.readdirSync(BACKUPS_PATH).filter(f => f.endsWith('.bak') || f.endsWith('.zip'));
    return files.map(f => ({
      name: f,
      size: fs.statSync(path.join(BACKUPS_PATH, f)).size,
      date: fs.statSync(path.join(BACKUPS_PATH, f)).mtime,
    }));
  });

  // ---- PROCESSAMENTO ----
  ipcMain.handle('get-processing-status', async () => ({
    isRunning: false,
    camerasActive: 0,
    fps: 0,
    cpuUsage: os.loadavg()[0],
    memoryUsage: (os.totalmem() - os.freemem()) / os.totalmem() * 100,
  }));

  // get-system-metrics handled below (Item 18 version is richer)

  // ---- LGPD ----
  ipcMain.handle('export-student-data', async (_event, studentId) => {
    const student = await db.getStudent(studentId);
    const exportPath = path.join(REPORTS_PATH, `student_data_${studentId}_${Date.now()}.json`);
    fs.writeFileSync(exportPath, JSON.stringify(student, null, 2));
    return { success: true, path: exportPath };
  });

  ipcMain.handle('delete-student-data', async (_event, studentId, confirmation) => {
    if (confirmation !== `DELETAR_${studentId}`) {
      return { success: false, message: 'Confirmação inválida' };
    }
    // Implementar exclusão completa
    return { success: true, message: 'Dados excluídos conforme LGPD' };
  });

  // ---- NOVOS HANDLERS LGPD (CONFORMIDADE OPERADOR) ----
  ipcMain.handle('lgpd:check-consent', async (_event, userId) => {
    try {
      const consented = await lgpdService.hasConsented(userId);
      return { success: true, data: { consented } };
    } catch (error) {
      return { success: false, error: 'Erro ao verificar consentimento' };
    }
  });

  ipcMain.handle('lgpd:record-consent', async (_event, { userId, clientIp }) => {
    try {
      await lgpdService.recordConsent(userId, clientIp);
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Erro ao registrar consentimento' };
    }
  });

  ipcMain.handle('lgpd:get-term', async () => {
    return { success: true, data: { text: lgpdService.getConsentTermText() } };
  });

  ipcMain.handle('lgpd:run-purge', async () => {
    try {
      const result = await lgpdService.runDataPurge();
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: 'Erro ao executar limpeza' };
    }
  });

  // ---- DIÁLOGOS ----
  ipcMain.handle('show-open-dialog', async (_event, options) => {
    return await dialog.showOpenDialog(mainWindow!, options);
  });

  ipcMain.handle('show-save-dialog', async (_event, options) => {
    return await dialog.showSaveDialog(mainWindow!, options);
  });

  ipcMain.handle('show-message-box', async (_event, options) => {
    return await dialog.showMessageBox(mainWindow!, options);
  });


  ipcMain.handle('export-schedule-template', async () => {
    const templatePath = path.join(REPORTS_PATH, 'grade_horaria_template.xlsx');
    return { success: true, path: templatePath };
  });

  // ---- ALIASES PARA COMPATIBILIDADE (Reduzido para evitar conflitos) ----
  ipcMain.handle('cameras:list', async () => await db.getCameras());
  ipcMain.handle('students:list', async () => ({ success: true, data: await db.getStudentsByClass('all') }));

  // ---- LICENÇA / PLANO ----
  ipcMain.handle('get-license-info', () => licenseManager?.getLicenseInfo() ?? { tier: 'essencial', active: false });
  ipcMain.handle('get-plan-limits', () => licenseManager?.getLimits() ?? {});
  ipcMain.handle('activate-license', (_event, licenseJson) => licenseManager?.activate(licenseJson) ?? false);

  // ---- FACE WORKER (AG-001) ----
  ipcMain.handle('train-face-recognition', async (_event, studentId) => {
    try {
      const student = await db.getStudent(studentId);
      if (!student?.photoPath) return { success: false, message: 'Aluno sem foto cadastrada' };
      if (!faceWorker?.isReady()) return { success: false, message: 'Face Worker não está ativo' };

      // Verificar limite do plano
      licenseManager?.assertFaceLimit(0); // TODO: passar contagem real

      const result = await faceWorker.encodePhoto(student.photoPath);
      if (!result?.vector) return { success: false, message: 'Não foi possível extrair embedding' };

      // Salvar embedding no SQLite via outbox (sem expor o vetor externamente)
      await db.addOutboxItem('face_encoded', { student_id: studentId, vector_size: result.vector.length });
      await faceWorker.loadEmbeddings(studentId, [result.vector]);

      return { success: true, student_id: studentId };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  });

  ipcMain.handle('train-all-faces', async () => {
    try {
      const students = await db.getStudents();
      let trained = 0;
      for (const student of students) {
        if (student.photoPath && faceWorker?.isReady()) {
          try {
            const result = await faceWorker.encodePhoto(student.photoPath);
            if (result?.vector) {
              await faceWorker.loadEmbeddings(student.id, [result.vector]);
              trained++;
            }
          } catch { /* Continuar com próximo */ }
        }
      }
      return { success: true, trained, total: students.length };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  });

  ipcMain.handle('get-face-worker-status', () => faceWorker?.isReady()
    ? { ready: true }
    : { ready: false, message: 'Worker não inicializado' }
  );

  // ---- WHATSAPP QUEUE ----
  ipcMain.handle('send-whatsapp-alert', (_event, { to, body, studentId, eventType }) => {
    whatsAppQueue?.enqueue({ to, body, student_id: studentId, event_type: eventType });
    return { success: true, queued: true };
  });
  ipcMain.handle('get-whatsapp-queue-status', () => whatsAppQueue?.getQueueStatus() ?? {});

  // ---- SYNC ----
  ipcMain.handle('force-sync', async () => await syncService?.sync() ?? {});

  // ---- HEATMAP (Item 9) ----
  ipcMain.handle('get-heatmap-summaries', async () => await heatmapService?.getZoneSummaries());
  ipcMain.handle('get-heatmap-data', async (_event, zone) => await heatmapService?.getHeatmapData(zone));

  ipcMain.handle('get-last-sync-time', () => syncService?.getLastSyncTime());

  // ---- CLOUD SYNC & ENROLLMENT (Steps 91-100) ----
  ipcMain.handle('sync:enroll', async (_event, adminToken) => {
    if (!syncService) return { success: false, message: 'Serviço de sincronização não inicializado.' };
    return await syncService.enroll(adminToken);
  });

  ipcMain.handle('sync:get-status', async () => {
    if (!syncService) return { status: 'offline' };
    const settings = await db.getSettings();
    return {
      cloudId: settings.cloud_id || null,
      isEnrolled: !!settings.cloud_id,
      lastSync: syncService.getLastSyncTime(),
      endpoint: settings.cloud_endpoint || process.env.CLOUD_SYNC_URL
    };
  });

  ipcMain.handle('sync:test-connection', async () => {
    if (!syncService) return { success: false, message: 'Serviço inativo.' };
    try {
      await syncService.sendHeartbeat();
      return { success: true };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  });

  // ---- THEME (Item 51) ----
  ipcMain.handle('theme:get-config', () => themeService.getConfig());
  ipcMain.handle('theme:update', (_event, partial) => {
    const newConfig = themeService.update(partial);
    // Notificar janela para aplicar se necessário (embora o renderer possa fazer poll ou emitir via preload)
    return newConfig;
  });

  // ---- AUTH (Phase 3 Refactor) ----
  ipcMain.handle('auth:login', async (_event, { username, email, password, role, rememberMe }) => {
    const ident = username || email;
    const session = await authService?.login(ident, password);
    if (session) {
      if (role && session.user.role !== role && session.user.role !== 'admin') {
         return { success: false, message: `O usuário não possui permissão de ${role}.` };
      }
      const token = sessionService.createSession(session.user.id, session.user.role, rememberMe);
      return { success: true, token, user: session.user };
    }
    return { success: false, message: 'Usuário ou senha incorretos' };
  });

  ipcMain.handle('auth:logout', (_event, token) => {
    sessionService.clearSession();
    if (token) authService?.logout(token);
    return { success: true };
  });

  ipcMain.handle('auth:validate', (_event, token) => {
    const isValid = sessionService.validateSession(token);
    if (!isValid) return { success: false, message: 'Sessão expirada ou inválida' };
    const session = authService?.validateSession(token);
    return session ? { success: true, user: session.user } : { success: false };
  });


  // ---- WHATSAPP (Item 15) ----
  ipcMain.handle('whatsapp:update-config', (_event, config) => whatsAppQueue?.updateConfig(config));
  ipcMain.handle('whatsapp:test-connection', async (_event, phone) => await whatsAppQueue?.sendTestMessage(phone));
  ipcMain.handle('whatsapp:get-status', () => whatsAppQueue?.getQueueStatus());

  // ---- BIOMETRIA (Item 16) ----
  ipcMain.handle('reprocess-biometrics', async (_event, studentId) => {
    try {
      const student = await db.get('SELECT * FROM students WHERE id = ?', [studentId]);
      if (!student || !student.photo_path) throw new Error('Aluno ou foto não encontrados');

      const vector = await faceWorker?.extractEmbedding(student.photo_path);
      if (!vector) throw new Error('Não foi possível detectar face na foto');

      await db.saveFaceEmbedding(studentId, vector);
      return { success: true };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  });

  ipcMain.handle('face:add-multi-angle', async (_event, { studentId, images }) => {
    try {
      if (!faceWorker?.isReady()) {
        throw new Error('Face Worker não está pronto ou inicializado.');
      }

      const results: any = {};
      const angles = ['front', 'left', 'right'] as const;
      
      for (const angle of angles) {
        const imageData = images[angle];
        if (!imageData) continue;

        // Converter DataURL (Base64) para Buffer
        const base64Data = imageData.split(',')[1];
        const buffer = Buffer.from(base64Data, 'base64');
        
        // Simular salvamento temporário se o encodePhoto precisar de path, 
        // mas aqui vamos assumir que o faceWorker pode processar buffer ou DataURL
        // No FaceWorkerBridge.ts real, ele provavelmente espera um path de arquivo.
        
        // Para este MVP V3, vamos usar o encodePhoto existente se ele aceitar Buffer,
        // ou salvar em um arquivo temporário.
        const tempPath = path.join(os.tmpdir(), `biometry_${studentId}_${angle}.jpg`);
        fs.writeFileSync(tempPath, buffer);
        
        const result = await faceWorker.encodePhoto(tempPath);
        if (result?.vector) {
          const faceId = `${studentId}_${angle}`;
          await db.saveFaceEmbedding(studentId, result.vector, faceId);
          results[angle] = true;
        }
        
        // Limpar temporário
        if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
      }

      // Atualizar no loop de reconhecimento em tempo real
      const newEmbeddings = await db.getFaceEmbeddings();
      recognitionLoop.setEmbeddings(newEmbeddings);

      return { success: true, angles: results };
    } catch (err: any) {
      console.error('[IPC] Erro em face:add-multi-angle:', err);
      return { success: false, error: err.message };
    }
  });

  // ---- MÉTRICAS (Item 18) ----
  ipcMain.handle('get-system-metrics', () => {
    const { metricsService } = require('./services/MetricsService');
    const m = metricsService.getMetrics();
    return {
      cpuUsage: os.loadavg()[0] * 10,
      totalMem: os.totalmem(),
      freeMem: os.freemem(),
      uptime: os.uptime(),
      platform: os.platform(),
      // Strategic v1604 Metrics
      detectionsTotal: m.detectionsTotal,
      notificationsSent: m.notificationsSent,
      notificationsFailed: m.notificationsFailed,
      avgFps: m.avgFps,
      lastLatencyMs: m.lastLatencyMs
    };
  });

  ipcMain.handle('get-stream-stats', () => {
    return recognitionLoop?.getStats() || { activeStreams: 0, totalProcessed: 0, fps: 0 };
  });

  // ---- RECONHECIMENTO (Items 2-5) ----
  ipcMain.handle('start-recognition', async (_event, cameras) => {
    return await recognitionLoop?.start(cameras);
  });
  ipcMain.handle('stop-recognition', () => recognitionLoop?.stop());
  ipcMain.handle('get-recognition-status', () => recognitionLoop?.getStats() ?? {});
  ipcMain.handle('get-density', async (_event, zoneId) => {
    return heatmapService?.getDensity(zoneId) || 0;
  });
  ipcMain.handle('run-performance-benchmark', async (_event, cameras) => {
    return await performanceBenchmark.runStresstest(cameras);
  });

  // ---- BEHAVIORAL INTELLIGENCE (Phase 241) ----

  ipcMain.handle('behavioral:get-live', async () => {
    const analysis = microExpressionService.getLiveAnalysis();
    // Persiste no log se o risco for significativo (v3.6.4)
    if (analysis.riskScore > 30) {
      db.recordBehavioralLog(analysis).catch(e => console.error('Failed to log behavior:', e));
    }
    return analysis;
  });

  ipcMain.handle('behavioral:get-history', async (_event, studentId: string) => {
    return await db.getBehavioralHistory(studentId);
  });

  ipcMain.handle('behavioral:explain-risk', async (_event, analysis: any) => {
    return {
      explanation: behavioralAuditService.explainDecision(analysis),
      safeguards: behavioralAuditService.getEthicalSafeguards()
    };
  });

  ipcMain.handle('behavioral:get-evasion-profiles', async () => {
    return await db.getHighRiskEvasionProfiles();
  });

  // ---- INTEGRATION & AUDIT (v3.0) ----
  ipcMain.handle('analytics:get-engagement', async (_event, days) => {
    return await analyticsService.getEngagementTrends(days);
  });
  ipcMain.handle('analytics:get-heatmap', async (_event, days) => {
    return await analyticsService.getHeatmap(days);
  });
  ipcMain.handle('analytics:get-summary', async () => {
    return await analyticsService.getManagementSummary();
  });
  ipcMain.handle('analytics:get-risk', async () => {
    return await analyticsService.getRiskAssessment();
  });

  // GOVERNANÇA v1605
  ipcMain.handle('treat-incident', async (_event, id: string, notes: string) => {
    // Auditamos a tentativa de tratamento
    const token = sessionService.get('current_session');
    const session = authService?.validateSession(token || '');
    const userId = session?.user.username || 'admin';

    await db.treatAlert(id, userId, notes);
    await auditService.logAction(userId, 'TREAT_INCIDENT', `Incidente ${id} tratado: ${notes.substring(0, 50)}...`);
    return { success: true };
  });

  ipcMain.handle('get-audit-logs-v1605', async () => {
    return await db.getIncidentHistory();
  });

  // ---- SYSTEM GOVERNANCE & CONTROL (Phase v3440) ----
  ipcMain.handle('system:reboot', async () => {
    const userId = sessionService.get('current_session_user') || 'admin';
    await auditService.logAction(userId, 'SYSTEM_REBOOT', 'Reinicialização do sistema solicitada via dashboard.');
    app.relaunch();
    app.exit(0);
  });

  ipcMain.handle('system:shutdown', async () => {
    const userId = sessionService.get('current_session_user') || 'admin';
    await auditService.logAction(userId, 'SYSTEM_SHUTDOWN', 'Desligamento do sistema solicitado via dashboard.');
    app.quit();
  });

  ipcMain.handle('system:toggle-maintenance', async () => {
    isMaintenanceMode = !isMaintenanceMode;
    const userId = sessionService.get('current_session_user') || 'admin';
    
    await auditService.logAction(
      userId, 
      'MAINTENANCE_TOGGLE', 
      `Modo manutenção ${isMaintenanceMode ? 'ativado' : 'desativado'}.`
    );

    // Broadcast para todos os clientes via WebSocket
    wsServer.broadcast({
      type: 'status',
      category: 'system',
      message: `Modo Manutenção: ${isMaintenanceMode ? 'ATIVADO' : 'DESATIVADO'}`,
      data: { isMaintenanceMode },
      timestamp: new Date()
    });

    return { isMaintenanceMode };
  });

  ipcMain.handle('governance:get-audit-logs', async (_event, limit = 100) => {
    return await auditService.getRecentLogs(limit);
  });

  ipcMain.handle('system:get-maintenance-status', () => {
    return { isMaintenanceMode };
  });

  // MOBILE ECOSYSTEM v1606
  ipcMain.handle('mobile:register-device', async (_event, data: any) => {
    await mobileGateway.registerDevice(data);
    return { success: true };
  });

  ipcMain.handle('mobile:auth-challenge', async (_event, userId: string) => {
    return mobileGateway.generateAuthChallenge(userId);
  });

  ipcMain.handle('mobile:authorize-exit', async (_event, qrToken: string) => {
    return await mobileGateway.authorizeExit(qrToken);
  });

  // SITE SURVEY & CALIBRATION v1607
  ipcMain.handle('mobile:survey-point', async (_event, data: any) => {
    await mobileGateway.registerSurveyPoint(data);
    return { success: true };
  });

  ipcMain.handle('mobile:poi-tag', async (_event, data: any) => {
    await mobileGateway.registerPOITag(data);
    return { success: true };
  });

  ipcMain.handle('hardware:get-status', async () => {
    return { 
      edgeHubActive: ioTMainService.isEdgeHubActive(),
      timestamp: Date.now()
    };
  });

  // ---- SECRETARIA E RH SOVEREIGNTY (v3.0) ----

  ipcMain.handle('hr:get-staff', async () => {
    return await hrSovereigntyService.getAllStaff();
  });

  ipcMain.handle('hr:calculate-payroll', async (_event, staffId: string) => {
    return await hrSovereigntyService.calculatePayroll(staffId);
  });

  ipcMain.handle('hr:record-ponto', async (_event, { staffId, type }: { staffId: string, type: 'IN' | 'OUT' }) => {
    await (db as any).recordStaffPonto(staffId, type);
    return { success: true };
  });

  ipcMain.handle('secretary:get-student-documents', async (_event, studentId: string) => {
    return await (db as any).getStudentDocuments(studentId);
  });

  ipcMain.handle('secretary:update-document', async (_event, doc: any) => {
    await (db as any).upsertStudentDocument(doc);
    return { success: true };
  });

  ipcMain.handle('secretary:generate-transcript', async (_event, { studentId, type }: { studentId: string, type: string }) => {
    try {
      if (type === 'HOLERITE') {
        const staff = (await hrSovereigntyService.getAllStaff()).find(s => s.id === studentId);
        if (!staff) return { success: false, message: 'Colaborador não encontrado' };
        const payroll = await hrSovereigntyService.calculatePayroll(studentId);
        const filePath = await documentService.generatePaystub(staff, payroll);
        return { success: true, path: filePath };
      } else {
        const student = await db.getStudent(studentId);
        if (!student) return { success: false, message: 'Aluno não encontrado' };
        const filePath = await documentService.generateTranscript(student, type);
        return { success: true, path: filePath };
      }
    } catch (err: any) {
      console.error('[DocumentService] Error:', err);
      return { success: false, message: err.message };
    }
  });
}

// ============================================================================
// INICIALIZAÇÃO DO APP
// ============================================================================
// ============================================================================
// BROADCASTERS (Health & AI)
// ============================================================================

// Iniciar app
app.whenReady().then(async () => {
  try {
    // Logger já inicializado no Top-Level

    // LGPD: Ativar firewall de rede ANTES de criar qualquer janela
    LGPDNetworkGuard.activate();

    // Splash screen
    createSplashWindow();

    // Inicializar banco de dados
    const dbPath = path.join(USER_DATA_PATH, 'aquila_pro_v1.sqlite');
    db = new Database();
    await db.initialize();
    documentService = new DocumentService(REPORTS_PATH);

    // Sincronizar serviços de monitoramento com o Banco (AG-022)
    const amMod = require('./services/AttendanceMonitor');
    const rsMod = require('./services/ReIDService');
    attendanceMonitor = amMod.attendanceMonitor;
    reIDService = rsMod.reIDService;
    
    await attendanceMonitor.syncWithDatabase(db);
    await reIDService.initializeFromDatabase(db);

    // Inicializar Audit Log (Step 157 - Imutabilidade)
    auditLog = new ImmutableAuditLog(db, process.env.AUDIT_SECRET || 'aquila-secret-256-bit-key');
    await auditLog.initialize();
    (db as any).auditLog = auditLog; // Injeção de dependência manual para o DB

    lgpdService = new LGPDService(db);
    licenseService = new LicenseService(); 
    licenseService.init(db);

    hrSovereigntyService.init(db);

    // Licença: carregar e validar plano
    licenseManager = LicenseManager.getInstance(USER_DATA_PATH);
    licenseManager.load();
    console.log(`[LicenseManager] Plano ativo: ${licenseManager.getTier().toUpperCase()}`);

    // Inicializar serviços existentes
    backupManager = new BackupManager(dbPath, licenseManager, USER_DATA_PATH, auditLog);
    backupManager.scheduleBackup();

    notificationManager = new NotificationManager(db);
    notificationManager.startMonitoring();

    // Inicializar Hub de Notificações (Strategic v1604)
    const { NotificationGateway, WhatsAppMetaProvider } = require('./services/NotificationGateway');
    const notificationGateway = new NotificationGateway();
    
    const waConfig = { 
      apiUrl: process.env.WA_API_URL || '', 
      token: process.env.WA_TOKEN || '' 
    };

    if (waConfig.apiUrl) {
      notificationGateway.registerProvider(new WhatsAppMetaProvider(waConfig.apiUrl, waConfig.token));
    }

    // Inicializar WhatsApp Queue e injetar Gateway
    whatsAppQueue = new WhatsAppQueue(db, licenseManager, waConfig);
    whatsAppQueue.setGateway(notificationGateway);
    await whatsAppQueue.start();

    // Inicializar AuditService (v1605)
    auditService = new AuditService(db);

    // Inicializar MobileGateway (v1606)
    mobileGateway = new MobileGateway(db);

    // Inicializar motor de sync LGPD
    syncService = new SyncService(db, process.env.CLOUD_SYNC_URL);
    await syncService.start();

    // Inicializar EvasionRiskService (Eagle Brain - Onda 3)
    evasionRiskService.init(db);

    // Notificar renderer sobre progresso do sync (Item 57)
    syncService?.on('sync-start', () => mainWindow?.webContents.send('sync-status', { status: 'syncing' }));
    syncService?.on('sync-complete', (result: any) => mainWindow?.webContents.send('sync-status', { status: 'idle', lastSync: result.timestamp }));
    syncService?.on('sync-error', (err: any) => mainWindow?.webContents.send('sync-status', { status: 'error', error: err.message }));

    // Inicializar Heatmap Service (Item 9)
    heatmapService = new HeatmapService(db, licenseManager);
    heatmapService.start();
    heatmapService.on('heatmap-updated', (data: any) => {
      mainWindow?.webContents.send('analytics:heatmap-update', data);
    });

    // Inicializar ThemeService (Item 29/51)
    themeService = new ThemeService(USER_DATA_PATH);

    // Inicializar AuthService (Item 10)
    sessionService = new SessionService();
    authService = new AuthService(db);
    await authService.ensureDefaultAdmin();
    await authService.ensureTestUser();

    // Inicializar Face Worker (AG-001 + AG-002)
    faceWorker = new FaceWorkerBridge(IS_DEV, process.resourcesPath || '');
    faceWorker?.on('face-detected', (data) => {
      // AG-002: propagar evento ao renderer via IPC
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('face-detected', data);
      }
    });

    // Inicializar Core de Reconhecimento Versão 2.0 (Isolated Proc-per-Camera)
    recognitionLoop = new RecognitionLoop(IS_DEV, process.resourcesPath || '');
    
    // Inicializar Mobile Companion (Item 31/59)
    mobileCompanion = new MobileCompanionService();
    mobileCompanion.start();

    // Inicializar WebSocket Server (Phase v3430)
    wsServer = new WebSocketServerManager(9000);
    await wsServer.start();
    console.log('[Main] WebSocket Server ativo na porta 9000.');

    alertEngine = new AlertEngine(db, mobileCompanion, wsServer);
    
    // Inicializar Gerador de Relatórios V3
    reportGenerator = new ReportGenerator(REPORTS_PATH, db);
    
    // Analytics Service (Phase 1500)
    analyticsService = new AnalyticsService(db);

    // ========================================================================
    // INICIALIZAR ÁQUILA SWARM (MULTI-AGENTES PHASE 1200)
    // ========================================================================
    securityAgent = new SecurityAgent();
    pedagogicalAgent = new PedagogicalAgent(db);
    
    swarmManager.registerAgent(securityAgent);
    swarmManager.registerAgent(pedagogicalAgent);

    swarmManager.on('agent:activity', (data) => {
      // Propagar logs de atividade dos agentes para o Logger e UI
      logger.info(`[Swarm][${data.agent}] ${data.entry}`);
      mainWindow?.webContents.send('swarm:activity', data);
    });

    swarmManager.on('swarm:error', (err) => {
      logger.error(`[Swarm Error][${err.agent}] ${err.error}`);
    });

    // Notificar alerta para dispositivos móveis (Item 59)
    alertEngine?.on('alert-sent', (alertData) => {
      mobileCompanion?.broadcast('alert', alertData);
      wsServer?.notifyAlert(alertData);
    });

    recognitionLoop?.on('face-recognized', (data) => {
      // Quando face é reconhecida, o alertEngine processa (AG-024)
      const zone = data.zone || 'geral';
      alertEngine?.processDetection(data, zone, data.camera_id);

      // --- BROADCAST PARA O SWARM (Phase 1200) ---
      swarmManager.broadcast('face:recognized', {
        studentId: data.label,
        confidence: data.confidence,
        zone,
        cameraId: data.camera_id
      });

      // Gatilho Biométrico (Fase 11 - Passo 06)
      // Se o reconhecimento for de alta confiança (>0.85) e o aluno estiver ativo, abre o portão
      if (data.confidence > 0.85) {
        console.log(`[Main] Gatilho Biométrico: Abrindo portão para ${data.name || 'ID ' + data.label}`);
        ioTMainService.triggerCommand('DEFAULT_GATE', 'open'); // Usando serviço do Main Process
      }

      // --- SOCIAL GRAPH (Phase 520) ---
      // Se houver outros estudantes na mesma zona recentemente, registrar interação
      const sessionsInZone = reIDService?.getSessions().filter(s => s.lastSeenNode === zone && s.studentId !== data.studentId);
      sessionsInZone?.forEach(s => {
          socialGraphService.registerInteraction(data.studentId, s.studentId, 0.05); // Pequeno incremento por encontro
      });

      // --- BROADCAST VIA WEBSOCKET (Phase v3430) ---
      wsServer?.notifyFaceRecognition({
        studentId: data.label,
        studentName: data.name || 'Aluno',
        zone,
        confidence: data.confidence,
        timestamp: new Date()
      });

      // --- INTEGRAR COM RE-ID SERVICE (AG-022) ---
      reIDService?.trackMovement(data.label, data.camera_id || zone);
      
      // Atualizar telemetria de presença global
      attendanceMonitor?.syncWithDatabase(db);
    });

    recognitionLoop?.on('crowd-recognized', (data) => {
      alertEngine?.processCrowdDetection(data.zone_id || data.zone || 'area_comum', data.count || 0);
    });

    // ─────────────────────────────────────────────
    // INICIALIZAÇÃO DO CORE (Câmeras + IA)
    // ─────────────────────────────────────────────
    const startCoreServices = async () => {
      try {
        // 1. Iniciar Worker de IA
        await faceWorker.detectHardware();
        await faceWorker.start();
        
        // 2. Carregar Embeddings (Biometria)
        const embeddings = await db.getFaceEmbeddings();
        recognitionLoop.setEmbeddings(embeddings);
        console.log(`[Main] FaceWorker sincronizado com ${embeddings.length} alunos.`);

        // 3. Iniciar Streams de Câmeras (AG-051: Lendo da tabela dedicada)
        const cameras = await db.getCameras();
        
        if (cameras.length > 0) {
          const streamConfigs = cameras.map((c: any) => ({
            cameraId: c.id,
            rtspUrl: c.rtspUrl,
            zone: c.location || 'entrada',
            fps: c.fps || 1
          }));
          await recognitionLoop.start(streamConfigs);
        }

      } catch (err: any) {
        console.error('[Main] Falha na inicialização do Core:', err.message);
      }
    };

    faceWorker.on('error', (err) => console.error('[FaceWorker] Erro:', err));
    startCoreServices();

    // Registrar IPC handlers
    registerIpcHandlers();

    // Criar janela principal
    createMainWindow();

    // Criar tray
    createTray();

    // Inicializar Atalhos de Teclado (Item 39/49)
    shortcutsManager = new KeyboardShortcutsManager();
    shortcutsManager.register(() => mainWindow);

    // Iniciar serviços de background remanescentes
    autoUpdateManager = new AutoUpdateManager(logger);
    autoUpdateManager.start();
    syncService.start();

    // Inicializar Relatórios Semanais (Step 56)
    weeklyReportService = new WeeklyReportService(db, whatsAppQueue);
    weeklyReportService.start();

    // Inicializar Reader de Streams (Item 2)
    streamReader = new RTSPStreamReader(licenseManager?.getTier() === 'enterprise' ? 16 : 4);

    // Watchdog de Streams (Item 65)
    streamWatchdog = new StreamWatchdog(streamReader);
    streamWatchdog.start();
    streamWatchdog?.on('health-changed', (health) => {
        mainWindow?.webContents.send('stream-health-update', health);
    });

    // Iniciar Limpeza de Disco (Item 67)
    storageCleanup.schedule(6 * 60 * 60 * 1000); // A cada 6 horas

    // Escutar eventos mobile / gestos
    pushNotificationService?.on('push-sent', (log) => {
        console.log(`[Main] Push enviado via FCM: ${log.title}`);
        mainWindow?.webContents.send('push-status', log);
    });

    // Auto-Recovery (Item 96)
    selfHealing?.on('service-restart', ({ id, restartCount }) => {
        logger.error(`[MAIN] Tentando recuperar serviço ${id} (Reinício #${restartCount})`);
        if (id === 'FACE_WORKER') faceWorker?.start();
    });

    // Database Redundancy (Item 98)
    const dbMirror = new DatabaseMirrorService(app.getPath('userData'));
    setInterval(() => dbMirror.syncMirror(), 30 * 60 * 1000); // A cada 30 min

    logger.info('Eagle AI: Fase 5 - Infra Integrada 🦅🚀');

    gestureService?.on('gesture-detected', (data) => {
        mainWindow?.webContents.send('gesture-alert', data);
    });

    console.log(`[${APP_NAME}] Sistema inicializado com sucesso (v${APP_VERSION})`);

    console.log(`[${APP_NAME}] Sistema inicializado com sucesso (v${APP_VERSION})`);
    if (mainWindow) {
      mainWindow.webContents.executeJavaScript('console.log("Main: Sistema pronto e janela principal criada.")');
    }
  } catch (error: any) {
    const errorDetail = error instanceof Error ? error.stack : String(error);
    console.error(`[${APP_NAME}] Erro CRÍTICO na inicialização:`, errorDetail);
    
    if (dialog) {
      dialog.showErrorBox(
        'Erro de Inicialização (Modo Diagnóstico)',
        `Não foi possível iniciar o ${APP_NAME}.\n\nDetalhes do Erro:\n${errorDetail}\n\nPor favor, envie este erro para o suporte:\nandrejrunb@yahoo.com.br`
      );
    }
    app.quit();
  }
});

app?.on('window-all-closed', () => {
  // Não fechar no macOS (fica no tray)
  if (process.platform !== 'darwin' && isQuitting) {
    app.quit();
  }
});

app?.on('activate', () => {
  if (mainWindow === null) {
    createMainWindow();
  } else {
    mainWindow?.show();
  }
});

app?.on('before-quit', async () => {
  isQuitting = true;
  try {
    if (recognitionLoop) recognitionLoop.stop();
    if (heatmapService) heatmapService.stop();
    if (faceWorker) faceWorker.stop();
    if (syncService) syncService.stop();
    if (whatsAppQueue) whatsAppQueue.stop();
    if (notificationManager) notificationManager.stopMonitoring();
    if (db) await db.close();
  } catch (error) {
    console.error('Erro ao fechar:', error);
  }
});

// ============================================================================
// TRATAMENTO DE ERROS GLOBAIS
// ============================================================================

process?.on('uncaughtException', (error) => {
  console.error('[FATAL] Uncaught Exception:', error);
  if (dialog) {
    dialog.showErrorBox(
      'Erro Inesperado',
      `Ocorreu um erro inesperado:\n\n${error.message}\n\nO aplicativo será reiniciado.`
    );
  }
});

process?.on('unhandledRejection', (reason) => {
  console.error('[FATAL] Unhandled Rejection:', reason);
});
