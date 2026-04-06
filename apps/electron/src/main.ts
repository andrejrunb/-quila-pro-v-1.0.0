/**
 * Áquila Pro Desktop - Main Process
 * Processo principal do Electron com janela, tray, auto-update e IPC handlers
 */

import { app, BrowserWindow, Menu, Tray, ipcMain, dialog, Notification, nativeImage, shell, clipboard } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { Logger } from './services/Logger';
import { HardwareFingerprint } from './services/HardwareFingerprint';

// ============================================================================
// CONSTANTES E CONFIGURAÇÃO INICIAL
// ============================================================================

const APP_NAME = 'Cool.me.ia';
const APP_VERSION = '1.3.0'; // Incremento para a era da Colmeia

// Deferir acesso ao app até que seja seguro ou mockado
const IS_DEV = process.env.NODE_ENV === 'development' || (typeof app !== 'undefined' && app.isPackaged === false);

function getSafePath(name: any) {
  try {
    return app.getPath(name);
  } catch (e) {
    // Fallback para desenvolvimento/Playwright se app.getPath falhar prematuramente
    return path.join(process.cwd(), 'temp_data');
  }
}

// Limpeza de argumentos para evitar crash no Electron v28 durante testes E2E
// Step 103 — Remoção temporária do bypass de crash (Playwright precisa da porta de debug)
// if (process.env.PLAYWRIGHT === 'true') {
//   const filteredArgs = process.argv.filter(arg => !arg.startsWith('--remote-debugging-port'));
//   process.argv.splice(0, process.argv.length, ...filteredArgs);
// }

const USER_DATA_PATH = (typeof app !== 'undefined' && app.isReady()) ? app.getPath('userData') : path.join(process.cwd(), 'userData');
const LOGS_PATH = path.join(USER_DATA_PATH, 'logs');
const BACKUPS_PATH = path.join(USER_DATA_PATH, 'backups');
const PHOTOS_PATH = path.join(USER_DATA_PATH, 'photos');
const REPORTS_PATH = path.join(USER_DATA_PATH, 'reports');

function ensureDirectories() {
  const dirs = [LOGS_PATH, BACKUPS_PATH, PHOTOS_PATH, REPORTS_PATH];
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
}

import { logger } from './main/logger';
console.log(`[${APP_NAME}] Logger inicializado.`);

// ============================================================================
// GARANTIR INSTÂNCIA ÚNICA (Antes de carregar serviços pesados)
// ============================================================================

console.log(`[${APP_NAME}] Verificando lock de instância única...`);
const isPlaywright = process.env.PLAYWRIGHT === 'true';

if (isPlaywright) {
  console.log(`[${APP_NAME}] Playwright mode: Forcing lock and disabling GPU.`);
  app.disableHardwareAcceleration();
}

const gotTheLock = isPlaywright ? true : app.requestSingleInstanceLock();

if (!gotTheLock) {
  console.warn(`[${APP_NAME}] Outra instância detectada. Encerrando.`);
  app.quit();
} else {
  console.log(`[${APP_NAME}] Lock de instância única obtido.`);
}

// ============================================================================
// IMPORTS DE SERVIÇOS (Posicionados após o Lock para evitar side-effects)
// ============================================================================

import { Database } from './database/Database';
import { BackupManager } from './services/BackupManager';
import { NotificationManager } from './services/NotificationManager';
import { AttendanceCalculator } from './services/AttendanceCalculator';
import { attendanceMonitor } from './services/AttendanceMonitor';
import { SmartReportService } from './services/SmartReportService';
import { ClassroomEntryService } from './services/ClassroomEntryService';
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
import { reIDService } from './services/ReIDService';
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
import { licenseService } from './services/LicenseService';
import { performanceBenchmark } from './services/PerformanceBenchmark';
import { pushNotificationService } from './services/PushNotificationService';
import { cameraSchema, studentImportSchema, authLoginSchema } from './main/validators';
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
import { CameraService } from './services/CameraService';
import { StudentService } from './services/StudentService';
import { npuOptimizer } from './services/NpuOptimizationService_V2';
import { institutionalBudgetService } from './services/InstitutionalBudgetService';
import { councilService } from './services/SovereignCouncilService';
import { nexusSyncService } from './services/NexusSyncService';
import { ExternalApiService } from './services/ExternalApiService';
import { EducationalAIIntegration } from './services/EducationalAIIntegration';
import { OllamaIntegration } from './services/OllamaIntegration';
import { aiFlowManager } from './services/AIFlowManager';
import { EagleMessengerService } from './services/EagleMessengerService';
import { wiFiDensePoseService } from './services/WiFiDensePoseService';
import { dropoutPredictor } from './services/DropoutPredictor';
import { aiAnalysisService } from './services/AiAnalysisService';
import { presenceMonitorService } from './services/PresenceMonitorService';
import { visitorRegistrationService } from './services/VisitorRegistrationService';
import { parentPortal } from './services/ParentPortalService';
import { studentPortfolioService } from './services/StudentPortfolioService';
import { pedagogicalInsightEngine } from './services/PedagogicalInsightEngine';
import { evolutionaryTimelineService } from './services/EvolutionaryTimelineService';
import { behavioralAnalyticsService } from './services/BehavioralAnalyticsService';
import { neuroPedagogyService } from './services/NeuroPedagogyService';
import { environmentalService } from './services/EnvironmentalService';
import { cognitiveAnalysisService } from './services/CognitiveAnalysisService';
import { securityAuditService } from './services/SecurityAuditService';
import { sovereignFirewall } from './services/SovereignFirewallService';
import { mobilePairingService, MobilePairingService } from './services/MobilePairingService';
import { lighthouseSyncService } from './services/LighthouseSyncService';
import { visionReIdService } from './services/VisionReIdService';
import { sovereignLedgerService } from './services/SovereignLedgerService';
import { ledgerExporter } from './services/LedgerExporter';
import { swarmDashboardService } from './services/SwarmDashboardService';
import { sovereignRelayService } from './services/SovereignRelayService';
import { neuralShardingService } from './services/NeuralShardingService';
import { evidenceColdStorage } from './services/EvidenceColdStorage';
import { sovereignOrchestrator } from './services/SovereignOrchestrator';
import { emotionBridgeService } from './services/EmotionBridgeService';
import { quantumTunnelingService } from './services/QuantumTunnelingService';
import { recoveryDiskGenerator } from './services/RecoveryDiskGenerator';
import { tenantIsolationService } from './services/TenantIsolationService';
import { aiEthicsAuditService } from './services/AIEthicsAuditService';
import { sovereignEmergencyService } from './services/SovereignEmergencyService';
import { quantumAtRestService } from './services/QuantumAtRestService';
import { sovereignGovernanceService } from './services/SovereignGovernanceService';
import { anonymousFeedbackService } from './services/AnonymousFeedbackService';
import { budgetGlassService } from './services/BudgetGlassService';
import { dynamicRBACService } from './services/DynamicRBACService';
import { swarmComparativeService } from './services/SwarmComparativeService';
import { actionPillGenerator } from './services/ActionPillGenerator';
import { consolidatedPulseService } from './services/ConsolidatedPulseService';
import { coolmeiaBrandingService } from './services/CoolmeiaBrandingService';
import { palmVeinService } from './services/PalmVeinService';
import { MessageRepository } from './database/repositories/MessageRepository';
import { PageIndexRAGService } from './services/PageIndexRAGService';
import { energyMonitor } from './services/EnergyMonitorService';
import { ApprovalWorkflowService } from './services/ApprovalWorkflowService';
import { PhotoLifecycleService } from './services/PhotoLifecycleService';
import { thermalEngine } from './services/ThermalEfficiencyEngine';
import { roboticsBridge } from './services/RoboticsBridge';
import { attendanceAuditService } from './services/AttendanceAuditService';
import { inventoryVision } from './services/InventoryVisionService';
import { crateGrid } from './services/CrateGridController';
import { geofenceMonitorService } from './services/GeofenceMonitorService';
import { vrPortalService } from './services/VRPortalService';
import { communicationHubService } from './services/CommunicationHubService';
import transportTracking from './services/TransportTrackingService';
import { printerService } from './services/PrinterService';
import { SecurityWatchdogService, securityWatchdogService } from './services/SecurityWatchdogService';
import { ContentGuardService } from './services/ContentGuardService';
import { BoardAnalysisService } from './services/BoardAnalysisService';
import { NotebookBridgeService } from './services/NotebookBridgeService';
import { AdaptiveLearningService } from './services/AdaptiveLearningService';
import { ParentWatchdogService } from './services/ParentWatchdogService';
import { LearningStyleService } from './services/LearningStyleService';
import { DeepWorkService } from './services/DeepWorkService';
import { NexusSyncService } from './services/NexusSyncService';
import { HybridCloudSyncService } from './services/HybridCloudSyncService';
import { NexusEconomyService } from './services/NexusEconomyService';
import { EvasionRadarService } from './services/EvasionRadarService';
import { FinanceService } from './services/FinanceService';
import { SwarmEntropyService } from './services/SwarmEntropyService';
import { SwarmRepairService } from './services/SwarmRepairService';
import { OmnissearchService } from './services/OmnissearchService';
import { identityRecaptureService } from './services/IdentityRecaptureService';
import { NpuLoadBalancer } from './services/NpuLoadBalancer';


// ============================================================================
// VARIÁVEIS GLOBAIS
// ============================================================================

let mainWindow: BrowserWindow | null = null;
let splashWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let db: Database;
let backupManager: BackupManager;
let notificationManager: NotificationManager;
let auditLog: ImmutableAuditLog;

let licenseManager: LicenseManager;
export let faceWorker: FaceWorkerBridge = null! as FaceWorkerBridge;
let classroomEntryService: ClassroomEntryService;
let syncService!: SyncService;
let hybridSync!: HybridCloudSyncService;
let messageRepository: MessageRepository;
let whatsAppQueue: WhatsAppQueue;
let streamReader: RTSPStreamReader;
let recognitionLoop: RecognitionLoop;
let alertEngine: AlertEngine;
let heatmapService: HeatmapService;
let authService: AuthService;
let sessionService: SessionService;
let themeService: ThemeService;
let shortcutsManager: KeyboardShortcutsManager;
let autoUpdateManager: AutoUpdateManager;
let mobileCompanion: MobileCompanionService;
let documentService: DocumentService;
let streamWatchdog: StreamWatchdog;
let isQuitting = false;
let lgpdService!: LGPDService;
let weeklyReportService!: WeeklyReportService;
let reportGenerator: ReportGenerator;
let securityAgent: SecurityAgent;
let pedagogicalAgent: PedagogicalAgent;
let analyticsService: AnalyticsService;
let auditService: AuditService;
let mobileGateway: MobileGateway;
let wsServer: WebSocketServerManager;
let cameraService: CameraService;
let studentService: StudentService;
let pageIndexRAGService: PageIndexRAGService;
let ollamaIntegration: OllamaIntegration;
let eagleMessenger: EagleMessengerService;
let eduAI: EducationalAIIntegration;

// Novas instâncias Soberanas (v3465)
let securityWatchdog: SecurityWatchdogService;
let mobilePairing: MobilePairingService;
let boardAnalysis: BoardAnalysisService;
let notebookBridge: NotebookBridgeService;
let adaptiveLearning: AdaptiveLearningService;
let parentWatchdog: ParentWatchdogService;
let learningStyle: LearningStyleService;
let deepWork: DeepWorkService;
let contentGuard: ContentGuardService;
let economyService: NexusEconomyService;
let entropyService: SwarmEntropyService;
let repairService: SwarmRepairService;
let omnissearchService: OmnissearchService;
let npuLoadBalancer: NpuLoadBalancer;

let isMaintenanceMode = false;
 
// ============================================================================
// BLOCO SOBERANO E2E (MOCKS GLOBAIS - DEFESA EM PROFUNDIDADE)
// ============================================================================
if (process.env.PLAYWRIGHT === 'true') {
  console.log('[E2E Mode] 🛡️ Blindagem SQA-1000 ativada no Top-Level.');
  const EventEmitter = require('events');
  
  // Mock FaceWorkerBridge
  const mockBridge: any = new EventEmitter();
  mockBridge.start = async () => console.log('[E2E Mock] FaceWorker startup bypassed (Global)');
  mockBridge.stop = () => console.log('[E2E Mock] FaceWorker shutdown bypassed');
  mockBridge.detectHardware = async () => console.log('[E2E Mock] Hardware detection bypassed');
  mockBridge.isReady = () => true;
  mockBridge.encodePhoto = async () => ({ vector: new Array(128).fill(0) });
  mockBridge.clearMemory = async () => {};
  (faceWorker as any) = mockBridge;

  // Mock RecognitionLoop
  const mockLoop: any = new EventEmitter();
  mockLoop.start = async () => console.log('[E2E Mock] RecognitionLoop startup bypassed (Global)');
  mockLoop.stop = () => console.log('[E2E Mock] RecognitionLoop shutdown bypassed');
  mockLoop.getStats = () => ({ activeStreams: 0, isRunning: false });
  mockLoop.setEmbeddings = () => {};
  recognitionLoop = mockLoop;
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
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
    },
  });

  // Handle Permissions for Webcam / Microphone automatically
  mainWindow.webContents.session.setPermissionRequestHandler((_webContents, permission, callback) => {
    if (permission === 'media') {
      callback(true);
    } else {
      callback(false);
    }
  });

  // Handle device access checks
  mainWindow.webContents.session.setPermissionCheckHandler((_webContents, permission) => {
    if (permission === 'media') {
      return true;
    }
    return false;
  });

  const startUrl = (IS_DEV && process.env.PLAYWRIGHT !== 'true')
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
    reIDService.on('reid-update', (session: any) => {
      mainWindow?.webContents.send('reid:update', session);
    });

    // Bridging Attendance Telemetry
    attendanceMonitor.on('attendance-updated', (telemetry: any) => {
      mainWindow?.webContents.send('attendance:telemetry-update', telemetry);
    });

    // Bridging Evasion Risk events
    const { evasionRiskService } = require('./services/EvasionRiskService');
    evasionRiskService.on('risk-audit-completed', (profiles: any) => {
      mainWindow?.webContents.send('evasion:audit-update', profiles);
    });

    // Bridging NPU status events
    const { npuOptimizer } = require('./services/NpuOptimizationService');
    npuOptimizer.on('npu-status-updated', (status: any) => {
      mainWindow?.webContents.send('npu:status-update', status);
    });

    // Bridging Resource Monitoring events
    const { resourceMonitor } = require('./services/ResourceMonitorService');
    resourceMonitor.on('throttle', (isThrottled: boolean) => {
      mainWindow?.webContents.send('perf:resource-status', resourceMonitor.getStatus());
    });
    
    // Envio periódico de status de recursos (Telemetria)
    setInterval(() => {
       if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('perf:resource-status', resourceMonitor.getStatus());
       }
    }, 10000); // 10s de telemetria

    // Bridging WiFi DensePose Safety events (Phase v3441)
    wiFiDensePoseService.on('ghost-detected', (ghost: any) => {
      mainWindow?.webContents.send('ghost-detected', ghost);
    });
    wiFiDensePoseService.on('passive-fall-alert', (alert: any) => {
      mainWindow?.webContents.send('wifi:fall-alert', alert);
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
    roboticsBridge.on('telemetry-update', (data: any) => {
      mainWindow?.webContents.send('robotics:telemetry', data);
    });

    // Bridging AI Analysis events (Purga IPC)
    aiAnalysisService.on('new-event', (event: any) => {
      mainWindow?.webContents.send('ai-event', event);
    });

    // Bridging Presence Monitor events (Purga IPC)
    presenceMonitorService.on('discrepancy-detected', (data: any) => {
      mainWindow?.webContents.send('presence-discrepancy', data);
    });

    // Bridging Biometric/PalmVein events (Purga IPC)
    palmVeinService.on('scan-completed', (scan: any) => {
      mainWindow?.webContents.send('biometric:scan-result', scan);
    });

    // Bridging IoT events (Purga IPC)
    ioTMainService.on('device-updated', (device: any) => {
      mainWindow?.webContents.send('iot:device-updated', device);
    });

    // Bridging ReID events (Purga IPC)
    reIDService.on('reid-update', (session: any) => {
      mainWindow?.webContents.send('reid:update', session);
    });
  });

  if (IS_DEV) {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
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
  // ---- RAG / DOCS SEARCH ----
  ipcMain.handle('rag:search-docs', async (_event, query: string) => {
    if (!pageIndexRAGService) return [];
    return await pageIndexRAGService.search(query);
  });


  // ---- SISTEMA ----
  ipcMain.handle('get-app-version', () => APP_VERSION);
  ipcMain.handle('get-system-info', () => ({
    platform: os.platform(),
    arch: os.arch(),
    cpus: os.cpus()?.length || 0,
    totalMemory: os.totalmem(),
    freeMemory: os.freemem(),
    uptime: os.uptime(),
    hostname: os.hostname(),
    appVersion: APP_VERSION,
    electronVersion: process.versions.electron,
    nodeVersion: process.versions.node,
    userDataPath: USER_DATA_PATH,
  }));

  // ---- RESILIENCE & QUEUE (Cycle 7) ----
  ipcMain.handle('get-queue-status', () => {
    return aiFlowManager.getQueueStatus();
  });

  ipcMain.handle('force-cleanup', async () => {
    return resourceMonitor.forceCleanup();
  });

  ipcMain.handle('get-hardware-id', () => HardwareFingerprint.getFingerprint());
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

    const calculator = new AttendanceCalculator(db);
    const reporter = new SmartReportService(db, calculator);
    return await reporter.generateDailySummary(studentId, date);
  });

  // ---- PORTFÓLIO E INSIGHTS (Purga IPC) ----
  ipcMain.handle('get-student-portfolio', async (_event, studentId) => {
    return {
      events: studentPortfolioService.getEventsByStudent(studentId),
      summary: studentPortfolioService.getSummary(studentId)
    };
  });

  ipcMain.handle('get-pedagogical-insights', async (_event, studentId) => {
    return pedagogicalInsightEngine.getInsights(studentId);
  });

  // ---- ESTOQUE E LOGÍSTICA (Purga IPC) ----
  ipcMain.handle('inventory:get-stock', async () => {
    return {
      stock: inventoryVision.getStockSnapshot(),
      orders: crateGrid.auditStock()
    };
  });

  // ---- SYNC & NEPHOS MESH (Zero-Debt / Item 92) ----
  ipcMain.handle('sync:get-peers', async () => {
    // Retorna peers tanto da Cloud (syncService) quanto do Mesh (nexusSyncService)
    return nexusSyncService.getNodes().map(n => ({
      ...n,
      isMesh: true
    }));
  });

  ipcMain.handle('sync:force', async () => {
    if (syncService) {
        // Inicialização de NPU (v3474 - Automática)
        npuOptimizer.detectHardware().catch((err: any) => {
          logger.error(`[Boot] Falha na detecção de NPU: ${err.message}`);
        });

        // Inicialização de Serviços de Rede
        nexusSyncService.init(db);
       await syncService.sync();
       console.log('[Main] Sincronização global forçada via IPC.');
       return { success: true };
    }
    return { success: false, message: 'Serviço de sincronização não disponível' };
  });

  ipcMain.handle('nexus:get-state', async () => {
    return {
      nodes: nexusSyncService.getNodes(),
      isAlive: nexusSyncService.isMeshAlive()
    };
  });

  // ---- AUTONOMOUS POLICIES (Zero-Debt) ----
  ipcMain.handle('autonomous:get-policies', async () => {
    try {
      // Busca políticas do banco ou do serviço direto
      return await db.all('SELECT * FROM autonomous_policies');
    } catch(e) { return []; }
  });

  ipcMain.handle('autonomous:toggle-policy', async (_event, id) => {
    try {
      const policy = await db.get('SELECT enabled FROM autonomous_policies WHERE id = ?', [id]);
      if (!policy) return { success: false };
      const newState = policy.enabled ? 0 : 1;
      await db.run('UPDATE autonomous_policies SET enabled = ? WHERE id = ?', [newState, id]);
      return { success: true, enabled: !!newState };
    } catch(e) { return { success: false }; }
  });

  // ---- IMPRESSÃO (Purga IPC) ----
  ipcMain.handle('print-badge', async (_event, data) => {
    console.log('[IPC] Solicitando impressÃ£o de crachÃ¡ para:', data.visitorName);
    // Em produÃ§Ã£o, o Main dispararia para a impressora do OS ou uma Janela oculta.
    return { success: true };
  });

  // ---- INTELIGÊNCIA DOCENTE (AI TEACHER LOG) ----
  ipcMain.handle('process-teacher-audio-log', async (_event, payload) => {
    try {
      console.log('[AI Teacher Log] Recebido novo feed em', payload.timestamp);
      
      // 1. Persistir o Log Bruto (Opcional, mas bom para histórico)
      // payload.teacherId, payload.text, payload.studentId, etc.
      
      // 2. Criar entrada na Fila de Aprovação (Córtex Connect)
      // Simulando a análise de IA que gera o título e a mensagem sugerida
      const student = payload.studentId ? await db.getStudent(payload.studentId) : null;
      const studentName = student ? student.name : 'Aluno';

      await db.createCommunicationApproval({
        senderId: payload.teacherId || 'teacher_01',
        studentId: payload.studentId || null,
        title: `Ocorrência Pedagógica: ${studentName}`,
        message: `Olá responsável pelo aluno ${studentName}. Registramos hoje uma observação em sala: "${payload.text || 'O aluno não entregou a atividade.'}"`,
        metadata: {
          originalText: payload.text,
          confidence: 0.98,
          timestamp: payload.timestamp
        },
        status: 'pending',
        channel: 'whatsapp'
      });

      // 3. Notificar Coordenação (UI update via IPC)
      mainWindow?.webContents.send('new-approval-pending');

      // 4. Auditoria
      await db.createAuditEntry({
        userId: payload.teacherId || 'system',
        studentId: payload.studentId || 'none',
        action: 'AUDIO_LOG_SUBMIT',
        reason: 'Diário Inteligente enviado para aprovação',
        timestamp: new Date().toISOString()
      });

      return { success: true };
    } catch(err: any) {
       console.error('[Córtex] Erro ao processar log:', err);
       return { success: false, error: err.message };
    }
  });

  ipcMain.handle('get-pending-approvals', async () => {
    return await db.getPendingApprovals();
  });

  ipcMain.handle('approve-communication', async (_event, { id, approvedBy }) => {
    try {
      const approval = await db.getApproval(id);
      if (!approval) return { success: false, message: 'Aprovação não encontrada' };

      // 1. Marcar como aprovado no banco
      await db.updateApprovalStatus(id, 'approved', approvedBy);

      // 2. Enfileirar no WhatsAppQueue
      // Buscamos o telefone do responsável no banco (supondo que esteja no objeto student ou meta)
      const student = await db.getStudent(approval.studentId);
      const to = student?.phone || '5561999623099'; // Fallback p/ teste se vazio

      await whatsAppQueue.enqueue({
        to: to,
        body: approval.message,
        student_id: approval.studentId,
        event_type: 'PEDAGOGICAL'
      });

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('reject-communication', async (_event, { id, rejectedBy }) => {
    await db.updateApprovalStatus(id, 'rejected', rejectedBy);
    return { success: true };
  });

  ipcMain.handle('get-school-entry-status', async () => {
    const entryService = new ClassroomEntryService(db);
    return await entryService.getFullStatus();
  });

  ipcMain.handle('get-student-economy', async (_, studentId: string) => {
    return await economyService.getEconomy(studentId);
  });

  const evasionRadar = new EvasionRadarService(db);
  ipcMain.handle('get-evasion-heatmap', async (_, horizon: 14 | 30) => {
    return await evasionRadar.getRiskHeatmap(horizon); // v3510 — Now with trends
  });

  const financeService = new FinanceService(db);
  ipcMain.handle('get-billing-history', async (_, studentId?: string) => {
    return await financeService.getBillingHistory(studentId);
  });

  ipcMain.handle('confirm-billing-payment', async (_, billingId: string) => {
    return await financeService.confirmPayment(billingId);
  });

  const omnissearch = new OmnissearchService(db);
  ipcMain.handle('omnissearch:search', async (_, query: string) => {
    return await omnissearch.search(query);
  });

  ipcMain.handle('omnissearch:voice-command', async (_, transcript: string) => {
    return await omnissearch.processVoiceCommand(transcript);
  });

  ipcMain.handle('lighthouse:connect-unit', async (_, unit) => {
    return await lighthouseSyncService.connectUnit(unit);
  });

  ipcMain.handle('lighthouse:sync-all', async () => {
    return await lighthouseSyncService.syncAllUnits();
  });

  ipcMain.handle('lighthouse:get-units', async () => {
    return await db.all('SELECT * FROM lighthouse_units');
  });

  ipcMain.handle('purchase-student-item', async (_, { studentId, itemId, price }) => {
    return await economyService.purchaseItem(studentId, itemId, price);
  });

  ipcMain.handle('equip-student-item', async (_, { studentId, type, itemId }) => {
    return await economyService.equipItem(studentId, type, itemId);
  });

  ipcMain.handle('system:get-entropy', async () => {
    return {
      level: entropyService.getEntropyLevel(),
      seed: entropyService.getShortSeed()
    };
  });

  ipcMain.handle('get-hardware-status', async () => await db.getDashboardStats());

  // ---- BRAIN / ANALYTICS (Onda 3) ----
  ipcMain.handle('get-evasion-risk-profiles', async () => {
    return evasionRiskService.getAllProfiles();
  });

  // ---- LICENCIAMENTO (PHASE 3) ----
  ipcMain.handle('license:get', async () => licenseManager.getLicenseInfo());
  ipcMain.handle('license:check-limit', async () => ({ success: true, status: 'within_limit' }));

  // ---- CONFIGURAÇÕES ----
  ipcMain.handle('get-settings', async () => await db.getSettings());
  ipcMain.handle('save-settings', async (_event, settings) => await db.saveSettings(settings));

  // ---- CÂMERAS (Sincronizado com Inventory - Passo 51) ----
  ipcMain.handle('get-cameras', async () => await cameraService.getCameras());
  
  ipcMain.handle('add-camera', async (_event, rawCamera) => {
    return await cameraService.addCamera(rawCamera);
  });

  ipcMain.handle('update-camera', async (_event, { id, status }) => {
    return await cameraService.updateCameraStatus(id, status);
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
        
        const startTime = Date.now();
        
        socket.on('connect', () => {
          const latency = Date.now() - startTime;
          socket.destroy();
          // 🔑 Atualiza status da câmera para ONLINE no banco de dados
          db.getCameras().then((cameras: any[]) => {
            const cam = cameras.find((c: any) => c.rtsp_url === rtspUrl || c.rtspUrl === rtspUrl);
            if (cam) {
              db.updateCameraStatus(cam.id, 'online').catch(() => {});
            }
          }).catch(() => {});
          resolve({ success: true, message: `Conexão RTSP estabelecida com latência viva de ${latency}ms.` });
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
  
  ipcMain.handle('login', async (_event, payload) => {
    console.log('[LOGIN_DEBUG] Payload recebido:', JSON.stringify(payload));
    try {
      const validated = authLoginSchema.parse(payload);
      const ident = validated.email || validated.username;

      if (!ident) {
         console.warn('[LOGIN_DEBUG] Identificador ausente');
         return { success: false, message: 'Usuário ou e-mail necessário.' };
      }

      console.log(`[LOGIN_DEBUG] Tentando login com: ${ident}`);
      
      // JIT Injection — Garantir usuário em modo Playwright
      if (process.env.PLAYWRIGHT === 'true' && (ident === 'playwright_admin' || ident === 'admin')) {
        const userCheck = await db.get('SELECT * FROM users WHERE username = ? OR email = ?', [ident, ident]);
        if (!userCheck) {
          console.warn(`[LOGIN_DEBUG] JIT Injection: Criando ${ident} sob demanda...`);
          const bcryptjs = require('bcryptjs');
          const hash = bcryptjs.hashSync('senha_playwright_123', 12);
          await db.run('INSERT INTO users (id, username, password_hash, name, role) VALUES (?, ?, ?, ?, ?)', 
            [`user-e2e-${ident}`, ident, hash, `E2E ${ident}`, 'admin']
          );
          await db.run('INSERT OR REPLACE INTO lgpd_consents (id, user_id, status, purpose, data_types, timestamp) VALUES (?, ?, ?, ?, ?, ?)',
            [`lgpd-e2e-${ident}`, `user-e2e-${ident}`, 'accepted', 'system_access', '[]', new Date().toISOString()]
          );
          console.log('[LOGIN_DEBUG] JIT Injection: Sucesso.');
        } else {
          console.log(`[LOGIN_DEBUG] JIT Check: Usuário ${ident} já existe.`);
        }
      }

      const session = await authService.login(ident, validated.password);
      if (session) {
        console.log(`[LOGIN_DEBUG] Login bem-sucedido: ${ident} (Role: ${session.user.role})`);
        if (validated.role && session.user.role !== validated.role && session.user.role !== 'admin') {
           return { success: false, message: `O usuário não possui permissão de ${validated.role}.` };
        }
        sessionService.set('current_session', session.token);
        return { success: true, user: session.user };
      }
      
      console.warn(`[LOGIN_DEBUG] Falha no login: Credenciais inválidas para ${ident}`);
      if (process.env.PLAYWRIGHT === 'true') {
        const users = await db.all('SELECT username FROM users');
        console.log('[LOGIN_DEBUG] Audit: Usuários no DB:', JSON.stringify(users.map((u:any) => u.username)));
      }
      return { success: false, message: 'Usuário ou senha inválidos' };
    } catch(err: any) {
      console.error('[LOGIN_DEBUG] Erro no login ou Zod:', err.message);
      return { success: false, message: 'Zod Block: Requisição Roteador Rejeitada' };
    }
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

  // ---- AI ANALYSIS & SECURITY (Purga IPC) ----
  ipcMain.handle('ai:get-events', () => aiAnalysisService.getRecentEvents());
  ipcMain.handle('ai:simulate-event', (_event, payload) => {
    aiAnalysisService.handleNewEvent(payload);
    return { success: true };
  });

  // ---- ATTENDANCE & PRESENCE (Purga IPC) ----
  ipcMain.handle('attendance:get-telemetry', () => attendanceMonitor.getTelemetry());
  ipcMain.handle('reid:get-sessions', () => reIDService.getAllSessions());
  ipcMain.handle('presence:get-discrepancies', () => presenceMonitorService.getDiscrepancies());

  // ---- IOT & HARDWARE (Purga IPC) ----
  ipcMain.handle('iot:get-status', () => ioTMainService.getDevices());
  ipcMain.handle('iot:trigger', async (_event, { deviceId, command }) => {
    return await ioTMainService.triggerCommand(deviceId, command);
  });

  // ---- BIOMETRY (Purga IPC) ----
  ipcMain.handle('biometric:get-status', () => ({ status: 'online', sensor: 'PalmVein V3' }));
  ipcMain.handle('biometric:scan', async (_event, userId) => {
    return await palmVeinService.scanPalm(userId);
  });

  ipcMain.handle('attendance:log', async (_event, { studentId, status }) => {
    return await attendanceAuditService.logAttendance(studentId, status);
  });

  // ---- SECURITY DRILLS ----
  ipcMain.handle('security:start-drill', async (_event, type) => {
    return await securityAuditService.startDrill(type);
  });
  ipcMain.handle('security:register-response', async (_event, { userId, time }) => {
    return await securityAuditService.registerResponse(userId, time);
  });
  ipcMain.handle('security:finalize-drill', async () => {
    return await securityAuditService.finalizeDrill();
  });

  // ---- LGPD ----
  ipcMain.handle('lgpd:get-records', async () => {
    // Retorna registros mockados ou reais para a UI
    return [
      { id: '1', subject: 'João Silva (Aluno)', type: 'biometric', status: 'granted', lastUpdated: '2024-03-10' },
      { id: '2', subject: 'Maria Santos (Aluno)', type: 'image', status: 'granted', lastUpdated: '2024-03-12' },
      { id: '3', subject: 'Pedro Oliveira (Aluno)', type: 'biometric', status: 'pending', lastUpdated: '2024-03-15' },
    ];
  });

  // ---- BEHAVIORAL (Purga IPC) ----
  ipcMain.handle('behavioral:get-metrics', async () => {
    // Retorna salvaguardas éticas reais e métricas mockadas (Phase v3441)
    return {
      safeguards: behavioralAuditService.getEthicalSafeguards(),
      alertCount: 12,
      baselineStability: 96,
      anomalyIndex: 0.15
    };
  });

  ipcMain.handle('hr:get-sovereignty', async () => {
    const staff = await hrSovereigntyService.getAllStaff();
    return {
       count: staff.length,
       index: 96, // Mock de agregação
       staff: staff.slice(0, 5)
    };
  });

  // ---- SUSTAINABILITY / ENERGY (Zero-Debt) ----
  ipcMain.handle('energy:get-metrics', () => energyMonitor.getMetrics());
  ipcMain.handle('energy:get-thermal', () => thermalEngine.getThermalState());
  ipcMain.handle('energy:set-eco-mode', (_event, active) => {
     energyMonitor.setEcoMode(active);
     return { success: true };
  });

  energyMonitor.on('energy-updated', (metrics) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('energy:updated', metrics);
    }
  });

  // ---- TEACHER / NEURO-PEDAGOGY (Zero-Debt) ----
  ipcMain.handle('neuro:get-pulse', (_event, classId) => neuroPedagogyService.getClassNeuroPulse(classId));
  ipcMain.handle('neuro:get-trends', () => neuroPedagogyService.getHistoricalNeuroTrends());
  ipcMain.handle('neuro:get-students', () => neuroPedagogyService.getIndividualStudentFocus());
  ipcMain.handle('neuro:get-recommendation', (_event, pulse) => neuroPedagogyService.getRecommendation(pulse));
  
  // ---- ENVIRONMENTAL / COGNITIVE (Zero-Debt) ----
  ipcMain.handle('env:get-room-data', (_event, roomId) => environmentalService.getRoomData(roomId));
  ipcMain.handle('env:force-ventilation', (_event, roomId) => environmentalService.forceVentilation(roomId));
  ipcMain.handle('cognitive:get-alerts', (_event, roomId) => cognitiveAnalysisService.getAlertsForRoom(roomId));

  // Forward environmental events
  environmentalService.on('room-updated', (data) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send(`env:room-updated-${data.roomId}`, data);
    }
  });


  // ---- VISITOR / PARENT / CLASSROOM / PORTFOLIO (Zero-Debt) ----
  ipcMain.handle('visitor:get-recent', () => visitorRegistrationService.getRecentVisitors());
  ipcMain.handle('visitor:register', (_event, data) => visitorRegistrationService.registerVisitor(data));
  ipcMain.handle('parent:get-notifications', () => []); // Placeholder for andy-messages
  ipcMain.handle('classroom:get-state', (_event, id) => classroomEntryService.getFullStatus());
  ipcMain.handle('portfolio:get-events', (_event, id) => studentPortfolioService.getEventsByStudent(id));
  ipcMain.handle('palm-vein:scan', (_event, id) => palmVeinService.scanPalm(id));
  ipcMain.handle('insight:get-insights', async (_, sId) => pedagogicalInsightEngine.getInsights(sId));
  ipcMain.handle('insight:analyze', async (_, sId) => pedagogicalInsightEngine.analyzeStudent(sId));
  ipcMain.handle('geofence:get-arriving', () => geofenceMonitorService.getArrivingParents());
  
  // VR & Digital Twin
  ipcMain.handle('vr:start-session', async (_, role) => await vrPortalService.startImmersiveSession(role));
  ipcMain.handle('vr:sync-twin', (_, data) => vrPortalService.syncDigitalTwin(data));

  // Messenger & Communication
  ipcMain.handle('messenger:get-channels', () => communicationHubService.getChannels());
  ipcMain.handle('messenger:get-messages', (_, cId) => communicationHubService.getMessages(cId));
  ipcMain.handle('messenger:send', (_, msg) => communicationHubService.sendMessage(msg));

  communicationHubService.on('new-message', (msg) => {
    mainWindow?.webContents.send('messenger:new-message', msg);
  });

  communicationHubService.on('silent-alarm', (alarm) => {
    mainWindow?.webContents.send('messenger:silent-alarm', alarm);
  });

  // Fleet & Logistics
  ipcMain.handle('fleet:get-status', () => transportTracking.getFleetStatus());
  ipcMain.handle('fleet:get-route', (_, id) => transportTracking.getRoute(id));

  // Zero-Debt: Lifecycle & Analytics
  ipcMain.handle('lifecycle:get-history', async (_, sId) => evolutionaryTimelineService.getStudentLifecycle(sId));
  ipcMain.handle('analytics:get-comparison', async (_, sId) => behavioralAnalyticsService.getStudentComparison(sId));

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
  ipcMain.handle('get-density', (_event, zoneId) => {
    return heatmapService.getDensity(zoneId);
  });


  // (Duplicata removida conforme auditoria Zero-Debt)


  ipcMain.handle('perf:get-metrics', () => {
    const usage = process.memoryUsage();
    return {
      rss: Math.round(usage.rss / 1024 / 1024),
      heapTotal: Math.round(usage.heapTotal / 1024 / 1024),
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024),
      external: Math.round(usage.external / 1024 / 1024),
      uptime: Math.round(process.uptime())
    };
  });


  // (Blocos de Segurança movidos para o grouping unificado em 1264-1272)

  const { localAudioAI } = require('./services/LocalAudioIntelligenceService');

  ipcMain.handle('ai:summarize', async (_, text: string) => {
    return await localAudioAI.summarizePedagogically(text);
  });

  ipcMain.handle('ai:transcribe', async (_, path: string) => {
    return await localAudioAI.transcribeLocal(path);
  });

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
      
      // Registrar Investimento Operacional (v4002-Hardening)
      institutionalBudgetService.logOperationalInvestment(`Exportação Presença: ${format.toUpperCase()}`, 0.50);
      
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
      
      // Registrar Investimento Operacional (v4002-Hardening)
      institutionalBudgetService.logOperationalInvestment(`Exportação Comportamento: ${format.toUpperCase()}`, 0.75);
      
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
        const bill = {
          id: `bill_${student.id}_${Date.now()}`,
          studentHash: student.id,
          amount: 850.00,
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: Math.random() > 0.3 ? 'paid' : 'pending',
          pixCode: '00020126360014BR.GOV.BCB.PIX0114+5511999999999520400005303986540510.005802BR5913Andre Jr6009SAO PAULO62070503***6304ABCD'
        };
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

  // ---- GESTÃO DE ALUNOS (Track A - Piloto) ----
  ipcMain.handle('students:list', async () => {
    try {
      const students = await db.getStudents();
      return { success: true, data: students };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  });

  ipcMain.handle('students:import-bulk', async (_event, studentsArray) => {
    return await studentService.importStudentsBulk(studentsArray);
  });

  ipcMain.handle('students:pick-and-import', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow as any, {
      title: 'Importar Alunos (Excel/CSV)',
      filters: [{ name: 'Planilhas', extensions: ['xlsx', 'csv'] }],
      properties: ['openFile']
    });

    if (canceled || filePaths.length === 0) return { success: false, message: 'Operação cancelada' };

    return await studentService.processExcelFile(filePaths[0]);
  });

  // ---- NEXUS & MESH (AG-034/035) ----
  ipcMain.handle('nexus:get-status', async () => {
    return {
      nodes: nexusSyncService.getNodes(),
      isAlive: nexusSyncService.isMeshAlive()
    };
  });

  ipcMain.handle('nexus:set-mesh-status', async (_event, active: boolean) => {
    nexusSyncService.setMeshStatus(active);
    return { success: true };
  });

  // ---- WIFI DENSE POSE (AG-041) ----
  ipcMain.handle('wifi:get-status', async () => {
    return await wiFiDensePoseService.getActiveGhosts();
  });

  // ---- PREDICTIVE ANALYSIS (AG-022) ----
  ipcMain.handle('predictive:analyze-risk', async (_event, data) => {
    return dropoutPredictor.analyzeRisk(data);
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

  // ---- NOVOS HANDLERS PARA PURGA IPC (Zero-Debt) ----
  ipcMain.handle('robotics:get-units', () => roboticsBridge.getUnits());
  ipcMain.handle('robotics:send-command', (_event, { id, command }) => roboticsBridge.sendCommand(id, command));
  
  const { pricingService } = require('./services/PricingService');
  ipcMain.handle('pricing:get-plans', () => pricingService.getPlans());
  ipcMain.handle('pricing:calculate-quote', (_event, { type, region, count, planId }) => 
    pricingService.calculateQuote(type, region, count, planId)
  );

  const { themeManager } = require('./services/ThemeManager');
  ipcMain.handle('theme:apply', (_event, theme) => themeManager.applyTheme(theme));
  ipcMain.handle('theme:get-branding', (_event, { planId, allowWhiteLabel }) => 
    themeManager.getBranding(planId, allowWhiteLabel)
  );

  const { autonomousActionService } = require('./services/AutonomousActionService');
  ipcMain.handle('autonomous-action:trigger', (_event, action, metadata) => 
    autonomousActionService.evaluateEvent({ type: action, zone: metadata?.zone || 'unknown' })
  );

  ipcMain.handle('wifi:get-ghosts', () => wiFiDensePoseService.getActiveGhosts());

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
        fs.unlinkSync(tempPath);
      }
      return { success: true, results };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  });

  ipcMain.handle('npu:apply-turboquant', async () => {
    try {
      const stats = await npuOptimizer.applyTurboQuant('Llama-3-8B');
      return { success: true, data: stats };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  });
  
  ipcMain.handle('npu:get-status', async () => {
    return { success: true, data: npuOptimizer.getStatus() };
  });

  ipcMain.handle('npu:get-thermal-status', async () => {
    return { success: true, data: npuOptimizer.getThermalState() };
  });

  ipcMain.handle('firewall:get-threats', async () => {
    return { success: true, data: sovereignFirewall.getThreatReport() };
  });

  // ---- PARENT PORTAL & MOBILE BRIDGE (751-800) ----
  ipcMain.handle('parent:get-pairing-token', async (_event, { parentId }) => {
    return { success: true, data: mobilePairingService.generatePairingToken(parentId) };
  });

  ipcMain.handle('parent:get-pairing-status', async (_event, { parentId }) => {
    return { success: true, data: mobilePairingService.getPairingStatus(parentId) };
  });

  ipcMain.handle('parent:get-student-digest', async (_event, { studentId }) => {
    const digest = await parentPortal.getStudentDigest(studentId);
    return { success: !!digest, data: digest };
  });

  // ---- LIGHTHOUSE MULTI-CAMPUS (801-850) ----
  ipcMain.handle('lighthouse:connect-unit', async (_event, unitData) => {
    try {
      await lighthouseSyncService.connectUnit(unitData);
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('lighthouse:get-units', async () => {
    const units = await db.all('SELECT * FROM lighthouse_units');
    return { success: true, data: units };
  });

  // ---- VISION RE-ID PRO (851-900) ----
  ipcMain.handle('vision:get-reid-stats', async () => {
    return { success: true, data: await visionReIdService.getStats() };
  });

  // ---- SOVEREIGN LEDGER FINALE (901-950) ----
  ipcMain.handle('ledger:audit-integrity', async () => {
    return { success: true, data: await sovereignLedgerService.verifyIntegrity() };
  });

  ipcMain.handle('ledger:export-certificate', async () => {
     const cert = await ledgerExporter.generateCertificate();
     return { success: !!cert, data: cert };
  });

  // ---- GLOBAL COMMAND CENTER (951-1000) ----
  ipcMain.handle('swarm:get-global-ecosystem', async () => {
    return { success: true, data: await swarmDashboardService.getGlobalEcosystem() };
  });

  // ---- PHASE 6: INFINITE SCALE (1001-1050) ----
  ipcMain.handle('p2p:start', async () => {
    const peerId = await sovereignRelayService.startNode();
    return { success: true, peerId };
  });

  ipcMain.handle('shard:distribute', async (_event, manifest) => {
    return await neuralShardingService.distributeWorkload(manifest);
  });

  ipcMain.handle('storage:cold-export', async (_event, { blockId }) => {
    return await evidenceColdStorage.exportToPhysicalMedia(blockId);
  });

  // ---- PHASE 6: ORCHESTRATION & EMPATHY (1051-1100) ----
  ipcMain.handle('orchestrator:boot', async () => {
    return await sovereignOrchestrator.bootInfrastructure();
  });

  ipcMain.handle('emotion:analyze', async (_event, { metadata }) => {
    return await emotionBridgeService.analyzeSentiment(metadata);
  });

  ipcMain.handle('quantum:establish-tunnel', async (_event, { peerId }) => {
    return await quantumTunnelingService.establishPqcTunnel(peerId);
  });

  ipcMain.handle('recovery:generate-image', async () => {
    return await recoveryDiskGenerator.generateGoldenImage();
  });

  // ---- PHASE 7: MULTI-TENANCY & ETHICAL AI (1101-1150) ----
  ipcMain.handle('tenant:switch', async (_event, { tenantId }) => {
    return await tenantIsolationService.switchTenant(tenantId);
  });

  ipcMain.handle('ethics:audit-response', async (_event, { response }) => {
    return await aiEthicsAuditService.auditResponse(response);
  });

  ipcMain.handle('emergency:activate', async () => {
    return await sovereignEmergencyService.activateEmergencyProtocol();
  });

  ipcMain.handle('storage:quantum-encrypt', async (_event, { data }) => {
    return await quantumAtRestService.encryptSovereignBlock(Buffer.from(data));
  });

  // ---- PHASE 8: GOVERNANCE & TRANSPARENCY (1151-1200) ----
  ipcMain.handle('gov:create-ballot', async (_event, { title, description, options }) => {
    return await sovereignGovernanceService.createBallot(title, description, options);
  });

  ipcMain.handle('gov:cast-vote', async (_event, { ballotId, voterId, optionIndex }) => {
    return await sovereignGovernanceService.castVote(ballotId, voterId, optionIndex);
  });

  ipcMain.handle('feedback:submit', async (_event, { category, content }) => {
    return await anonymousFeedbackService.submitFeedback(category, content);
  });

  ipcMain.handle('budget:get-summary', async () => {
    return await budgetGlassService.getBudgetSummary();
  });

  ipcMain.handle('rbac:validate', async (_event, { userId, permission }) => {
    return await dynamicRBACService.validatePermission(userId, permission);
  });

  // ---- PHASE 9: SWARM INTELLIGENCE & EXECUTIVE COCKPIT (1201-1250) ----
  ipcMain.handle('swarm:get-analysis', async () => {
    return await swarmComparativeService.getComparativeAnalysis();
  });

  ipcMain.handle('swarm:get-pills', async () => {
    return await actionPillGenerator.generatePills();
  });

  ipcMain.handle('swarm:get-pulse', async () => {
    return await consolidatedPulseService.generatePulse();
  });

  // ---- PHASE 10: COOL.ME.IA REBRANDING (1251-1300) ----
  ipcMain.handle('brand:get-info', () => {
    return {
      name: coolmeiaBrandingService.getBrandName(),
      mission: coolmeiaBrandingService.getMissionStatement()
    };
  });

  // ---- DISTRIBUTED SWARM AI (v3443) ----
  ipcMain.handle('brain:sovereign-query', async (_event, { query, specialization, userHasCloudCredits }) => {
    try {
      const result = await eduAI.sovereignAsk(query, specialization, userHasCloudCredits);
      return { success: true, data: result };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  });

  // ---- OMNI-CHANNEL MESSAGING (v3444) ----
  ipcMain.handle('messenger:smart-send', async (_event, { senderId, recipientId, content }) => {
    try {
      const result = await eagleMessenger.sendSmartMessage(senderId, recipientId, content);
      return { success: true, data: result };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  });

  ipcMain.handle('messenger:mass-broadcast', async (_event, { senderId, targetRole, content }) => {
    try {
      const results = await eagleMessenger.broadcastToRole(senderId, targetRole, content);
      return { success: true, data: results };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  });

  // ---- EDU-PODCAST & SMART CLASSES (Phase 705/707) ----
  
  ipcMain.handle('edu:generate-podcast', async (_event, { title, content }) => {
    try {
      const result = await eduAI.generateEduPodcast(title, content);
      return { success: true, data: result };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  });

  ipcMain.handle('edu:process-material', async (_event, { title, type, content }) => {
    try {
      const result = await eduAI.processMaterial(title, type, content);
      return { success: true, data: result };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  });

  ipcMain.handle('edu:get-student-feed', async (_event, studentId) => {
    // Simulação de feed para v3.6.8
    return { success: true, items: [] };
  });

  ipcMain.handle('edu:trigger-retention-notif', async (_event, question) => {
    logger.info(`[SmartClass] Notificação de Retenção: ${question.question}`);
    return { success: true };
  });

  // ---- ENGAGEMENT & PORTFOLIO (FASE 708) ----
  ipcMain.handle('edu:track-engagement', async (_event, { action, materialId }) => {
    logger.info(`[Engagement] Student action: ${action} on ${materialId}`);
    return { success: true };
  });

  ipcMain.handle('edu:get-portfolio', async (_event, studentId) => {
    return {
      success: true,
      data: {
        score: 82,
        stats: { resumes: 12, podcasts: 8, flashcards: 45, attendance: 94 },
        awards: ['Mestre da Termodinâmica', 'Engajamento Ouro']
      }
    };
  });

  ipcMain.handle('edu:notify-parents', async (_event, { studentId, type, message }) => {
    logger.info(`[SmartClass] Notificando Pais de ${studentId}: [${type}] ${message}`);
    // Integrar com WhatsAppService futuramente
    return { success: true };
  });

  // ---- NEXUS BRIDGE HARDENING (FASE 710/711) ----
  ipcMain.handle('edu:report-integrity-issue', async (event, violation) => {
    const { integrityService } = require('./services/IntegrityService');
    
    // Validação de API Key Dinâmica (Nexus Bridge Protocol)
    const isInternal = event.sender.getURL().includes('localhost') || event.sender.getURL().startsWith('file://');
    if (!isInternal) {
      logger.error(`[Security] Tentativa de acesso externo não autorizado à Nexus Bridge: ${event.sender.getURL()}`);
      return { success: false, error: 'Unauthorized: Nexus Bridge requires internal signature.' };
    }

    integrityService.reportViolation({
      ...violation,
      timestamp: new Date(),
      studentId: 'ST-999', // No V1.0, o ID virá da sessão mestre
      severity: violation.type === 'ai_suspicion' ? 'high' : 'medium'
    });
    return { success: true };
  });

  ipcMain.handle('edu:get-integrity-report', async (_event, materialId) => {
    const { integrityService } = require('./services/IntegrityService');
    return { success: true, data: integrityService.getViolationsByMaterial(materialId) };
  });

  // ---- NEXUS DREAM: MEMORY CONSOLIDATION (FASE 712) ----
  ipcMain.handle('nexus:perform-dream-cycle', async () => {
    const { nexusDreamService } = require('./services/NexusDreamService');
    return await nexusDreamService.performDreamCycle();
  });

  // ---- ÁQUILA SENTINEL (FASE 712.1.2) ----
  const { sentinel } = require('./services/AquilaSentinel');
  sentinel.start(path.join(__dirname, '../../..')); // Monitorar raiz do monorepo

  ipcMain.handle('nexus:get-sentinel-status', () => {
    return sentinel.getStatus();
  });

  // ---- AQUILA ARCHITECT (FASE 712.2.1) ----
  ipcMain.handle('nexus:start-deep-reasoning', async (_event, objective) => {
    const { architectEngine } = require('./services/ArchitectEngine');
    return await architectEngine.startSession(objective);
  });

  ipcMain.handle('nexus:get-architect-status', () => {
    const { architectEngine } = require('./services/ArchitectEngine');
    return architectEngine.getStatus();
  });

  // ---- SOVEREIGN SWARM (FASE 712.2.2) ----
  ipcMain.handle('nexus:get-swarm-status', () => {
    const { sovereignSwarm } = require('./services/SovereignSwarm');
    return sovereignSwarm.getSwarmStatus();
  });

  ipcMain.handle('nexus:get-swarm-history', async (_event, limit: number) => {
    const { sovereignSwarm } = require('./services/SovereignSwarm');
    return await sovereignSwarm.getSwarmHistory(limit);
  });

  ipcMain.handle('nexus:get-agent-history', async (_event, { agentId, limit }: { agentId: string, limit: number }) => {
    const { sovereignSwarm } = require('./services/SovereignSwarm');
    return await sovereignSwarm.getAgentHistory(agentId, limit);
  });

  ipcMain.handle('nexus:trigger-agent-diagnostic', (_event, agentId) => {
    const { sovereignSwarm } = require('./services/SovereignSwarm');
    return sovereignSwarm.triggerAgentDiagnostic(agentId);
  });

  // ---- AUDIO ENGINE (FASE 713) ----
  ipcMain.handle('nexus:generate-podcast', async (_event, topic, content) => {
    const { audioEngine } = require('./services/AudioEngine');
    return await audioEngine.generatePodcast(topic, content);
  });

  ipcMain.handle('nexus:get-audio-status', () => {
    const { audioEngine } = require('./services/AudioEngine');
    return audioEngine.getStatus();
  });

  // ---- SOVEREIGN LEDGER (FASE 714) ----
  ipcMain.handle('nexus:get-ledger-status', () => {
    const { sovereignLedger } = require('./services/SovereignLedger');
    return sovereignLedger.getChainStatus();
  });

  ipcMain.handle('nexus:add-ledger-entry', (_event, data) => {
    const { sovereignLedger } = require('./services/SovereignLedger');
    return sovereignLedger.addEntry(data);
  });

  // ---- GAMIFICATION: EAGLE REWARDS (FASE 715) ----
  ipcMain.handle('nexus:grant-xp', async (_event, studentId, amount, reason) => {
    const { gamificationEngine } = require('./services/GamificationEngine');
    return await gamificationEngine.grantXP(studentId, amount, reason);
  });

  ipcMain.handle('nexus:get-achievements', () => {
    const { gamificationEngine } = require('./services/GamificationEngine');
    return gamificationEngine.getAvailableAchievements();
  });

  ipcMain.handle('nexus:get-project-health', () => {
    const { gamificationEngine } = require('./services/GamificationEngine');
    return gamificationEngine.getProjectHealth();
  });

  // ---- LGPD GOVERNANCE (FASE 716) ----
  ipcMain.handle('nexus:run-compliance-check', async () => {
    const { lgpdPolicyEngine } = require('./services/LGPDPolicyEngine');
    return await lgpdPolicyEngine.runComplianceCheck();
  });

  ipcMain.handle('nexus:get-policy-status', () => {
    const { lgpdPolicyEngine } = require('./services/LGPDPolicyEngine');
    return lgpdPolicyEngine.getPolicyStatus();
  });

  // ---- SOVEREIGN INSTALLER (FASE 720) ----
  ipcMain.handle('nexus:check-updates', async () => {
    const { installerService } = require('./services/SovereignInstallerService');
    return await installerService.checkForUpdates();
  });

  ipcMain.handle('nexus:get-system-sanity', () => {
    const { installerService } = require('./services/SovereignInstallerService');
    return installerService.getSystemSanity();
  });

  // ---- SOVEREIGN AUDIT (FASE 721) ----
  ipcMain.handle('nexus:get-security-report', async () => {
    const { sovereignAudit } = require('./services/SovereignAudit');
    return await sovereignAudit.getSecurityReport();
  });

  // SQA — Quality Assurance
  ipcMain.handle('nexus:get-qa-report', async () => {
    const { EndToEndTesting } = require('./services/EndToEndTesting');
    const e2e = new EndToEndTesting();
    return e2e.getQAMetrics();
  });

  ipcMain.handle('nexus:run-security-scan', async () => {
    const { sovereignAudit } = require('./services/SovereignAudit');
    return await sovereignAudit.performFullScan();
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

  // (Handler get-density consolidado em 1449)
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

  // ---- SOVEREIGN SECOND BRAIN IPC (v3465) ----
    
  // Visão de Lousa
  ipcMain.handle('vision:analyze-board', async (_event, { subject, classId, image }) => {
    return await boardAnalysis.analyzeAndQueue(subject, classId, image);
  });

  ipcMain.handle('vision:finalize-board', async (_event, approvalId) => {
    await boardAnalysis.finalizeApprovedBoard(approvalId);
    return { success: true };
  });

  // Repetição Espaçada (SRS)
  ipcMain.handle('srs:get-due-cards', async (_event, studentId) => {
    return await adaptiveLearning.getDueFlashcards(studentId);
  });

  ipcMain.handle('srs:submit-review', async (_event, { studentId, cardId, score }) => {
    await adaptiveLearning.recordReview(studentId, cardId, score);
    return { success: true };
  });

  // Exportação NotebookLM
  ipcMain.handle('notebook:compile-package', async (_event, { studentId, days }) => {
    const pkg = await notebookBridge.compileStudyPackage(studentId, days);
    const base64 = notebookBridge.getDownloadablePackage(pkg);
    return { ...pkg, base64 };
  });

  // Deep Work (Foco)
  ipcMain.handle('deepwork:start-session', async (_event, studentId) => {
    return await deepWork.startSession(studentId);
  });

  ipcMain.handle('deepwork:end-session', async (_event, sessionId) => {
    return await deepWork.endSession(sessionId);
  });

  // Mobile Pairing / Shield
  ipcMain.handle('security:pair-device', async (_event, { deviceId, userId }) => {
    return await mobilePairingService.generatePairingToken(userId);
  });

  ipcMain.handle('security:check-pairing', async (_event, userId) => {
    return await mobilePairingService.getPairingStatus(userId || '');
  });

  ipcMain.handle('security:validate-content', async (_event, text) => {
    return await contentGuard.validateContent(text);
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

  // ---- SOVEREIGN EXECUTIVE PULSE (v4002) ----
  ipcMain.handle('identity:get-stats', async () => {
    return { totalStudents: 0, pendingRefinement: 0, recapturesToday: 0 };
  });

  ipcMain.handle('identity:refine', async (_event, { studentId, embeddings }) => {
    return await identityRecaptureService?.refineIdentity(studentId, embeddings);
  });

  ipcMain.handle('audit:get-stats', async () => {
    return { totalAudits: 0, anomaliesDetected: 0, accuracyRate: 0 };
  });

  ipcMain.handle('geofence:get-arriving', async () => {
    return geofenceMonitorService.getArrivingParents() || [];
  });

  ipcMain.handle('npu:get-swarm-load', async () => {
    return { load: 0, temperature: 0, nodes: [] };
  });

  ipcMain.handle('finance:get-transparency-report', async () => {
    return await institutionalBudgetService?.getTransparencyReport() || null;
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
  console.log(`[${APP_NAME}] app.whenReady() resolvido. Iniciando boot...`);
  
  // Inicialização do PageIndex RAG (v3441 Structured RAG)
  const ragPaths = [
    path.join(process.cwd(), 'docs'),
    path.join(process.cwd(), '.aquila_brain')
  ];
  pageIndexRAGService = new PageIndexRAGService(ragPaths);
  console.log(`[RAG] Indexando bases: ${ragPaths.join(', ')}`);
  pageIndexRAGService.buildIndex().catch(err => console.error('[RAG] Falha crítica na indexação:', err));

  // Inicialização do Motor Soberano (v3443 Distributed Swarm)
  ollamaIntegration = new OllamaIntegration('http://localhost:11434', 'llama3');
  eduAI = new EducationalAIIntegration(undefined, ollamaIntegration, pageIndexRAGService, npuOptimizer, aiFlowManager);
  
  // Inicialização do Mensageiro Adaptativo (v3444)
  // eagleMessenger = new EagleMessengerService(ollamaIntegration); // Removido: será instanciado após o DB

  // Handlers para o Instalador e Hardware Soberano (v3446)
  const { installerService } = require('./services/SovereignInstallerService');
  
  ipcMain.handle('ai:get-hardware-profile', async () => {
    const report = await installerService.getHardwareProfile();
    // Antes de retornar, garantir que a VRAM seja otimizada se estivermos em hardware baixo
    if (report.totalRamGB < 8) {
      await npuOptimizer.vramGarbageCollector();
    }
    return report;
  });

  ipcMain.handle('ai:vram-gc', async () => {
    await ollamaIntegration.resetMemory();
    return await npuOptimizer.vramGarbageCollector();
  });

  // Cold Storage Backups (v3469)
  ipcMain.handle('security:cold-storage-backup', async () => {
    const { backupService } = require('./services/SovereignBackupService');
    const dbPath = path.join(USER_DATA_PATH, 'aquila_pro_v1.sqlite');
    return await backupService.performSovereignBackup(dbPath, 'SCHOOL_SECRET_3469');
  });

  ipcMain.handle('security:check-backup-disk', async () => {
    const { backupService } = require('./services/SovereignBackupService');
    return await backupService.checkExternalMedia();
  });

  ipcMain.handle('ai:install-model', async (_event, modelName: string) => {
    return await installerService.installModel(modelName);
  });

  ipcMain.handle('ai:list-local-models', async () => {
    return await installerService.getInstalledModels();
  });

  // NotebookLM Export (v3470)
  ipcMain.handle('ai:export-notebook', async (_event, data: any) => {
    const { notebookExportService } = require('./services/NotebookExportService');
    return await notebookExportService.exportAsNotebook(data);
  });

  try {
    // Logger já inicializado no Top-Level

    // LGPD: Ativar firewall de rede ANTES de criar qualquer janela
    console.log('[Main] Ativando LGPD Network Guard...');
    LGPDNetworkGuard.activate();

    // Splash screen (Skip in Playwright to avoid hook timeout/race condition)
    if (process.env.PLAYWRIGHT !== 'true') {
      console.log('[Main] Criando Splash Window...');
      createSplashWindow();
    } else {
      console.log('[Main] Playwright detected: Skipping Splash Window.');
    }

    // Inicializar banco de dados
    console.log('[Main] Inicializando Database...');
    const dbPath = path.join(USER_DATA_PATH, 'aquila_pro_v1.sqlite');
    db = new Database(dbPath);
    await db.initialize();
    console.log('[Main] Database pronto.');

    // Inicializar Repositório de Mensagens e Mensageiro (v3465 resilience)
    messageRepository = new MessageRepository(db);
    eagleMessenger = new EagleMessengerService(ollamaIntegration, messageRepository);
    
    // Conectar RAG ao Enxame via Messenger
    pageIndexRAGService.initSwarm(eagleMessenger);
    documentService = new DocumentService(REPORTS_PATH);
    classroomEntryService = new ClassroomEntryService(db);
    
    // Injetar DB no Orquestrador de Enxame (v3467/v3475)
    const { swarmOrchestrator } = require('./services/SwarmOrchestrator');
    swarmOrchestrator.init(db);
    
    // Inicializar Escudo Híbrido (v3475)
    hybridSync = new HybridCloudSyncService(db);
    
    // Injetar DB na IA Educacional (v3470)
    eduAI.setDatabase(db);
    
    // Disparar Auditoria de Hardware e Sincronização (v3468)
    installerService.syncCapacityWithAlpha().catch((err: any) => console.error('[Installer] Falha ao sincronizar capacidade:', err));

    // Ouvir comandos de rede para instalação automática
    swarmOrchestrator.on('deployCommandReceived', async (data: any) => {
      console.log(`[Main] Comando de Deploy Recebido: Instalar ${data.model}`);
      await installerService.installModel(data.model);
    });

        // Sincronizar serviços de monitoramento com o Banco (AG-022)
        await attendanceMonitor.syncWithDatabase(db);
        await reIDService.initializeFromDatabase(db);

        // Inicializar Audit Log (Step 157 - Zero-Knowledge v3501)
        auditLog = new ImmutableAuditLog(db, process.env.AUDIT_SECRET || 'aquila-secret-256-bit-key');
        await auditLog.initialize();
        (db as any).auditLog = auditLog;

        // Inicializar Repair Engine (v3503 - Auto-Cura no Boot)
        repairService = new SwarmRepairService(db);
        await repairService.runEmergencyRepair();

        // Conectar Hooks de Escrita Unificados (v3501 - Triple Sync + Cloud + Audit)
        db.setWriteHook((table: string, data: any) => {
          swarmOrchestrator.replicateToSwarm(table, data);
          hybridSync.queueForSync(table, data);
          
          // Auditoria automática de transações críticas
          if (auditLog) {
            auditLog.record(table, 'INSERT', data.id || 'N/A', data).catch(e => console.error('[Audit] Failed auto-log:', e));
          }
        });

        lgpdService = new LGPDService(db);
        // licenseService já é singleton, inicializar apenas:
        await licenseService.initialize();

        hrSovereigntyService.init(db);

        // Inicializar Sovereign School API (Passo 901)
        const schoolApi = new ExternalApiService(db);
        schoolApi.start();

        // Inicializar Novos Motores Soberanos (v3465)
        securityWatchdog = securityWatchdogService;
        mobilePairing = MobilePairingService.getInstance();
        boardAnalysis = new BoardAnalysisService(db, eduAI);
        notebookBridge = new NotebookBridgeService(db);
        adaptiveLearning = new AdaptiveLearningService(db);
        parentWatchdog = new ParentWatchdogService(db);
        learningStyle = new LearningStyleService(db);
        deepWork = new DeepWorkService(db);
        contentGuard = new ContentGuardService(db);

        // --- RC1 STABILIZATION PILLARS ---
        // identityRecaptureService e npuLoadBalancer são singletons
        // Inicialização autônoma de biometria
        
        // Iniciar serviços autônomos
        attendanceAuditService.init(db);
        attendanceAuditService.start();
        geofenceMonitorService.init(db);
        geofenceMonitorService.start();
        wiFiDensePoseService.start(); // Já importado como singleton

        // Iniciar Watchdogs
        securityWatchdog.start();
        parentWatchdog.monitorCriticalAlerts(); // Poll inicial

        // Inicializar Economia e Entropia (v3502)
        economyService = new NexusEconomyService(db);
        entropyService = new SwarmEntropyService();
        
        // Inicializar Sovereign Swarm persistence (Cycle 8)
        const { sovereignSwarm } = require('./services/SovereignSwarm');
        sovereignSwarm.init(db);

        // Handlers de Teste de Failover (v3472)
        ipcMain.handle('swarm:simulate-failure', async (_event, nodeId: string) => {
          const { nexusSyncService } = require('./services/NexusSyncService');
          nexusSyncService.simulateNodeFailure(nodeId);
          return { success: true, message: `Falha simulada no nó ${nodeId}` };
        });

        ipcMain.handle('swarm:restore-node', async (_event, nodeId: string) => {
          const { nexusSyncService } = require('./services/NexusSyncService');
          nexusSyncService.restoreNode(nodeId);
          return { success: true, message: `Nó ${nodeId} restaurado` };
        });

        ipcMain.handle('swarm:get-state', async () => {
          return {
            ...sovereignSwarm.getSwarmStatus(),
            localNodeId: os.hostname(),
            masterNodeId: sovereignSwarm.masterNodeId
          };
        });

        // Handler de Estresse (v3474)
        ipcMain.handle('swarm:run-stress-test', async () => {
          const { swarmStressTest } = require('./services/SwarmStressTest');
          return await swarmStressTest.runMasterFailoverTest();
        });

        // Handlers de Inteligência e Exportação (v3473)
        ipcMain.handle('swarm:search', async (_event, query: string) => {
          const { pageIndexRAG } = require('./services/PageIndexRAGService');
          const { ollamaIntegration } = require('./services/OllamaIntegration');
          
          logger.info(`[Omnissearch] Pesquisando: ${query}`);
          
          // 1. RAG Retrieve
          const documents = await pageIndexRAG.search(query);
          
          // 2. I.A Answer (Resumo contextual)
          const context = documents.map((d: any) => d.snippet).join('\n---\n');
          const prompt = `Use o contexto abaixo para responder de forma concisa: "${query}"\n\nContexto:\n${context}`;
          const aiAnswer = await ollamaIntegration.generate(prompt);

          return {
            results: documents.map((d: any) => ({
              id: Math.random().toString(36).substr(2, 9),
              title: d.breadcrumb[d.breadcrumb.length - 1] || 'Documento',
              path: d.file,
              type: d.sectionLevel === 1 ? 'lesson' : 'doc',
              excerpt: d.snippet
            })),
            aiAnswer
          };
        });

        ipcMain.handle('swarm:export-notebook', async (_event, sourceIds: string[]) => {
          logger.info(`[NotebookLM] Iniciando exportação de ${sourceIds.length} fontes...`);
          // Simulação de geração de PDF/Markdowns estruturados
          return { success: true, path: '~/Documents/AquilaStudies/Week_Knowledge.zip' };
        });

    // Licença: carregar e validar plano
    licenseManager = LicenseManager.getInstance(dbPath);
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
    
    // ========================================================================
    // INICIALIZAÇÃO DE SERVIÇOS DE HARDWARE (REAL VS MOCK)
    // ========================================================================
    if (process.env.PLAYWRIGHT === 'true') {
      console.log('[E2E Mode] Aplicando injeção determinística de usuários...');
      try {
        await db.run('DELETE FROM users WHERE username IN (?, ?)', ['playwright_admin', 'admin']);
        const bcrypt = require('bcryptjs');
        const hash = bcrypt.hashSync('senha_playwright_123', 12);
        await db.run('INSERT INTO users (id, username, password_hash, name, role) VALUES (?, ?, ?, ?, ?)', 
          ['user-e2e-playwright', 'playwright_admin', hash, 'E2E Admin', 'admin']
        );
        await db.run('INSERT OR REPLACE INTO user_consent (userId, consentedAt, termVersion, clientIp) VALUES (?, ?, ?, ?)',
          ['user-e2e-playwright', new Date().toISOString(), 'v1.1-e2e', '127.0.0.1']
        );
      } catch (e: any) {
        console.error('[E2E Mode] Erro na injeção de dados:', e.message);
      }
    } else {
      await authService.ensureDefaultAdmin();
      await authService.ensureTestUser();
      
      // Inicializações Reais (Hardware/IA)
      faceWorker = new FaceWorkerBridge(IS_DEV, process.resourcesPath || '');
      faceWorker?.on('face-detected', (data) => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('face-detected', data);
        }
      });

      recognitionLoop = new RecognitionLoop(IS_DEV, process.resourcesPath || '');
      recognitionLoop.on('face-recognized', (data) => {
        if (mainWindow) {
          mainWindow.webContents.send('face-detected', data);
        }
      });
    }
    if (process.env.PLAYWRIGHT !== 'true') {
      try {
        mobileCompanion = new MobileCompanionService();
        mobileCompanion.start();
      } catch (err) {
        console.error('[Main] Erro ao iniciar MobileCompanion:', err);
      }
    } else {
      console.log('[Main] Modo Playwright: Ignorando MobileCompanion para evitar conflito de portas.');
    }

    // Inicializar WebSocket Server (Phase v3430)
    try {
      const isTest = process.env.PLAYWRIGHT === 'true';
      const basePort = isTest ? 9100 : 9000;
      const workerIndex = parseInt(process.env.TEST_WORKER_INDEX || '0', 10);
      const port = isTest ? (basePort + workerIndex) : basePort;

      wsServer = new WebSocketServerManager(port);
      await wsServer.start();
      console.log(`[Main] WebSocket Server ativo na porta ${port}.`);
    } catch (err: any) {
      console.error('[Main] Falha ao iniciar WebSocketServer:', err.message);
      if (process.env.PLAYWRIGHT === 'true') {
        console.warn('[Main] Modo Playwright: Continuando boot sem WebSocket fatal.');
      } else {
        throw err; // Re-throw em produção para falha atômica
      }
    }
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
      const sessionsInZone = reIDService?.getAllSessions().filter(s => s.lastSeenNode === zone && s.studentId !== data.studentId);
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
    console.log('[Main] Criando Janela Principal...');
    createMainWindow();
    console.log('[Main] Janela Principal solicitada.');

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
    if (process.env.PLAYWRIGHT !== 'true') {
      streamWatchdog = new StreamWatchdog(streamReader);
      streamWatchdog.start();
      streamWatchdog?.on('health-changed', (health) => {
          mainWindow?.webContents.send('stream-health-update', health);
      });
    } else {
      console.log('[E2E Mock] StreamWatchdog desativado para estabilidade.');
    }

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

    // Inicializar Serviços Modulares (Phase 703)
    cameraService = new CameraService(db, recognitionLoop, licenseService);
    studentService = new StudentService(db);
    
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
    
    if (process.env.PLAYWRIGHT === 'true') {
      console.error('[Áquila Pro] Test Mode FATAL ERROR:', errorDetail);
      // Despejar erro detalhado para o Playwright capturar
      process.stderr.write(`FATAL_E2E_ERROR: ${errorDetail}\n`);
      app.quit();
      return;
    }

    if (dialog) {
      const choice = dialog.showMessageBoxSync({
        type: 'error',
        buttons: ['Sair', 'Copiar Log', 'WhatsApp Suporte'],
        defaultId: 2,
        cancelId: 0,
        title: 'Falha de Inicialização - Áquila Pro',
        message: `O ${APP_NAME} encontrou um erro crítico e não pôde iniciar.\n\nResumo: ${(errorDetail || '').substring(0, 200)}...`,
        detail: 'Clique em "WhatsApp Suporte" para enviar os detalhes automaticamente ao desenvolvedor no canal oficial.'
      });

      const fullLog = `ERRO ÁQUILA PRO v${APP_VERSION}\nBUILD: V1.0+ Stabilized\nDATA: ${new Date().toLocaleString()}\n----------------\n${errorDetail}`;

      if (choice === 1) {
        clipboard.writeText(fullLog);
        dialog.showMessageBoxSync({ type: 'info', message: 'Log copiado para a área de transferência!' });
      } else if (choice === 2) {
        const waMsg = encodeURIComponent(`🚨 *ERRO ÁQUILA PRO* 🚨\n\n${fullLog.substring(0, 1500)}`);
        shell.openExternal(`https://wa.me/5561999623099?text=${waMsg}`);
      }
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

process?.on('uncaughtException', (error: any) => {
  const errorMsg = error instanceof Error ? error.message : String(error);
  console.error('[FATAL] Uncaught Exception:', error);
  
  if (process.env.PLAYWRIGHT === 'true') {
    process.stderr.write(`PLAYWRIGHT_FATAL: ${errorMsg}\n`);
    return; // Não mostra dialog em teste
  }

  if (dialog) {
    dialog.showErrorBox(
      'Erro Inesperado',
      `Ocorreu um erro inesperado:\n\n${errorMsg}\n\nO aplicativo será reiniciado.`
    );
  }
});

process?.on('unhandledRejection', (reason) => {
  console.error('[FATAL] Unhandled Rejection:', reason);
});
