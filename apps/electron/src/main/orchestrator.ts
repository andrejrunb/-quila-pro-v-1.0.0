import { app } from 'electron';
import { sovereignRegistry } from './registry';
import { WindowManager } from './window';
import { registerIPCHandlers } from '../ipc/handlers';
import * as path from 'path';

export class SovereignOrchestrator {
  /**
   * Fase 1: Boot Crítico (DB + Auth + Janela)
   * Prioridade máxima para garantir UI responsiva e conformidade.
   */
  public static async startPhase1(userDataPath: string) {
    console.log('[ORCHESTRATOR] Iniciando Fase 1 (Boot Crítico)...');
    
    // 1. Database
    const { Database: DBClass } = await import('../database/Database');
    const db = new DBClass();
    await db.initialize();
    DBClass.setInstance(db);
    sovereignRegistry.setDatabase(db);

    // 1.1 Seeding de Produção (Colégio Visão - Dados Reais)
    const staffCount: any = await db.all('SELECT COUNT(*) as count FROM staff');
    if (staffCount[0].count === 0 || process.env.AQUILA_FORCE_SEED === 'true') {
      const { seedRealSchool } = await import('../database/seedRealSchool');
      await seedRealSchool(db);
    }
    
    // 2. Core Services (Eager Loading for Security/Auth)
    const { default: SessionService } = await import('./services/SessionService');
    const sessionService = new SessionService();
    sovereignRegistry.registerInstance('sessionService', sessionService);

    const { AuthService } = await import('./services/AuthService');
    const authService = new AuthService(db, sessionService);
    sovereignRegistry.registerInstance('authService', authService);

    // Garante que o administrador padrão exista no primeiro boot
    await authService.ensureDefaultAdmin();
    console.log('[ORCHESTRATOR] Administrador padrão verificado.');

    const { LGPDService } = await import('./services/LGPDService');
    const lgpdService = new LGPDService(db);
    sovereignRegistry.registerInstance('lgpdService', lgpdService);

    const { NotificationManager } = await import('./services/NotificationManager');
    const notificationManager = NotificationManager.getInstance(db);
    sovereignRegistry.registerInstance('notificationManager', notificationManager);

    const { EcosystemService } = await import('./services/EcosystemService');
    const ecosystemService = EcosystemService.getInstance();
    sovereignRegistry.registerInstance('ecosystemService', ecosystemService);

    // 2.5 Seating Intelligence (Phase 708) - Mover para Fase 1 para estabilidade E2E
    console.log('[DEBUG-PHASE1] Importing SeatingIntelligenceService...');
    const { seatingIntelligenceService } = await import('./services/SeatingIntelligenceService');
    console.log('[DEBUG-PHASE1] Registering seatingIntelligenceService:', !!seatingIntelligenceService);
    sovereignRegistry.registerInstance('seatingIntelligenceService', seatingIntelligenceService);

    // Mover o InstitutionalBudgetService para a Fase 1 para garantir prontidão dos testes de ROI
    console.log('[DEBUG-PHASE1] Importing InstitutionalBudgetService...');
    const { InstitutionalBudgetService } = await import('./services/InstitutionalBudgetService');
    const budgetService = InstitutionalBudgetService.getInstance();
    sovereignRegistry.registerInstance('institutionalBudgetService', budgetService);

    // 3. IPC Handlers (Injetando Contexto do Registry)
    const context = sovereignRegistry.getContext();
    registerIPCHandlers(context);
    console.log('[ORCHESTRATOR] IPC Handlers registrados.');

    // 4. Window Visibility
    WindowManager.createMainWindow();
    WindowManager.createTray();
    console.log('[ORCHESTRATOR] Fase 1 concluída.');
  }

  /**
   * Fase 2: Heavy Sovereign Bootstrap (Asynchronous)
   * Carrega serviços pesados em background após a UI estar ativa.
   */
  public static async startPhase2() {
    console.log('[ORCHESTRATOR] Iniciando Fase 2 (Sovereign Background)...');
    
    // Inicia o bootstrap de serviços pesados de forma assíncrona
    // Reduz delay em ambiente de teste para evitar timeouts
    const BOOT_DELAY = process.env.PLAYWRIGHT === 'true' ? 0 : 1000;
    
    setTimeout(async () => {
      try {
        const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
        const resourcesPath = process.resourcesPath || '';

        // 1. FaceWorker (IA)
        const { FaceWorkerBridge } = await import('./services/FaceWorkerBridge');
        const faceWorker = new FaceWorkerBridge(isDev, resourcesPath);
        sovereignRegistry.registerInstance('faceWorker', faceWorker);
        
        // Detect hardware and start workers
        await faceWorker.detectHardware();
        await faceWorker.start();
        
        faceWorker.on('face-detected', (payload: any) => {
          const win = sovereignRegistry.getContext().mainWindow;
          if (win && !win.isDestroyed()) {
            win.webContents.send('face-detected', payload);
          }
        });

        console.log('[ORCHESTRATOR] FaceWorkerBridge inicializado e pronto.');

        // 1.2 LocateAnything (IA)
        const { LocateAnythingBridge } = await import('./services/LocateAnythingBridge');
        const locateAnythingBridge = new LocateAnythingBridge(isDev, resourcesPath);
        sovereignRegistry.registerInstance('locateAnythingBridge', locateAnythingBridge);
        try {
          await locateAnythingBridge.start();
          console.log('[ORCHESTRATOR] LocateAnythingBridge inicializado com sucesso.');
        } catch (laErr) {
          console.error('[ORCHESTRATOR] Erro ao iniciar LocateAnythingBridge:', laErr);
        }

        // 1.1 FaceRecognition (Biometric Mesh Core) - v1000
        const { FaceRecognition } = await import('./services/FaceRecognition');
        const database = sovereignRegistry.getDatabase();
        const faceRecognition = new FaceRecognition(database, faceWorker);
        await faceRecognition.loadModel();
        sovereignRegistry.registerInstance('faceRecognition', faceRecognition);
        console.log('[ORCHESTRATOR] FaceRecognition (Biometric Mesh) inicializado.');

        // 2. Health Monitor (Self-Healing)
        const { FaceWorkerHealthMonitor } = await import('./services/FaceWorkerHealthMonitor');
        const faceWorkerHealthMonitor = new FaceWorkerHealthMonitor(faceWorker);
        faceWorkerHealthMonitor.start();
        sovereignRegistry.registerInstance('faceWorkerHealthMonitor', faceWorkerHealthMonitor);

        // 3. Stress Test Service
        const { StressTestService } = await import('./services/StressTestService');
        const stressTestService = new StressTestService();
        sovereignRegistry.registerInstance('stressTestService', stressTestService);

        // 4. Cortex Evolution
        const { cortexEvolutionService } = await import('./services/CortexEvolutionService');
        sovereignRegistry.registerInstance('cortexEvolutionService', cortexEvolutionService);

        // 4.1 HALO (Hierarchical Agent Loop Optimizer) - Level 22
        const { haloTraceRegistry } = await import('./services/HaloTraceRegistry');
        const { haloOptimizationService } = await import('./services/HaloOptimizationService');
        sovereignRegistry.registerInstance('haloRegistry', haloTraceRegistry);
        sovereignRegistry.registerInstance('haloOptimizer', haloOptimizationService);
        
        // Bridge Cortex Pulse to UI (v402)
        cortexEvolutionService.on('cortex:pulse', (insight: any) => {
          const win = sovereignRegistry.getContext().mainWindow;
          if (win && !win.isDestroyed()) {
            win.webContents.send('cortex:pulse', insight);
          }
        });

        cortexEvolutionService.startStudyLoop();

        // 5. Performance Benchmark
        const { performanceBenchmark } = await import('./services/PerformanceBenchmark');
        sovereignRegistry.registerInstance('performanceBenchmark', performanceBenchmark);
        

        // 7. [Phase 500] Librarian & [Phase 600] Executive Cockpit
        const { SovereignLibrarianService } = await import('./services/SovereignLibrarianService');
        const { ExecutiveCockpitService } = await import('./services/ExecutiveCockpitService');
        const { SovereignIntelligenceService } = await import('./services/SovereignIntelligenceService');
        const { LegalGuardService } = await import('./services/LegalGuardService');
        const { socialGraphService } = await import('./services/SocialGraphService');
        const { GradingService } = await import('./services/GradingService');
        const { SovereignVisionService } = await import('./services/SovereignVisionService');
        const { GenerativeAIService } = await import('./services/GenerativeAIService');
        const { logger } = await import('./logger');
        const aiService = GenerativeAIService.getInstance();
        sovereignRegistry.registerInstance('genAIService', aiService);

        const gradingService = new GradingService(database);
        sovereignRegistry.registerInstance('gradingService', gradingService);

        const { ScientificAttendanceService } = await import('./services/ScientificAttendanceService');
        const scientificAttendance = new ScientificAttendanceService(database, logger);
        sovereignRegistry.registerInstance('scientificAttendance', scientificAttendance);

        const sovereignVision = new SovereignVisionService(database, aiService);
        sovereignRegistry.registerInstance('sovereignVision', sovereignVision);

        const legalGuard = new LegalGuardService(database);
        await legalGuard.seedVault(); // Semeia artigos base
        sovereignRegistry.registerInstance('legalGuard', legalGuard);

        socialGraphService.setDatabase(database);
        await socialGraphService.computeGraphFromEvents();
        sovereignRegistry.registerInstance('socialGraphService', socialGraphService);

        const librarianService = SovereignLibrarianService.getInstance(database, aiService);
        await librarianService.init();
        sovereignRegistry.registerInstance('sovereignLibrarianService', librarianService);

        const executiveCockpitService = new ExecutiveCockpitService(database);
        sovereignRegistry.registerInstance('executiveCockpitService', executiveCockpitService);

        const intelligenceService = new SovereignIntelligenceService(database, aiService, legalGuard);
        sovereignRegistry.registerInstance('sovereignIntelligenceService', intelligenceService);

        // 7.0 SovereignKnowledgeService (QuantMind RAG)
        const { sovereignKnowledgeService } = await import('./services/SovereignKnowledgeService');
        sovereignKnowledgeService.init(database, aiService);
        await sovereignKnowledgeService.ensureTables();
        sovereignRegistry.registerInstance('sovereignKnowledgeService', sovereignKnowledgeService);
        console.log('[ORCHESTRATOR] SovereignKnowledgeService inicializado e pronto.');

        // 7.0.1 SovereignIncidentCaseService (Case Management)
        const { sovereignIncidentCaseService } = await import('./services/SovereignIncidentCaseService');
        sovereignIncidentCaseService.init(database, aiService);
        await sovereignIncidentCaseService.ensureTables();
        sovereignRegistry.registerInstance('sovereignIncidentCaseService', sovereignIncidentCaseService);
        console.log('[ORCHESTRATOR] SovereignIncidentCaseService inicializado e pronto.');
        

        
        // 7.1 [Phase 501] Pedagogical Coordination Intelligence
        const { coordinationService } = await import('./services/CoordinationService');
        const { absenceIntelligenceService } = await import('./services/AbsenceIntelligenceService');
        const { pedagogicalRiskService } = await import('./services/PedagogicalRiskService');
        const { localAudioAI } = await import('./services/LocalAudioIntelligenceService');
        const { neuroPedagogyService } = await import('./services/NeuroPedagogyService');
        sovereignRegistry.registerInstance('localAudioAI', localAudioAI);
        sovereignRegistry.registerInstance('neuroPedagogyService', neuroPedagogyService);
        sovereignRegistry.registerInstance('pedagogicalRiskService', pedagogicalRiskService);

        // 7.1.1 [Phase 502] Smart Scheduling
        const { SmartScheduleService } = await import('./services/SmartScheduleService');
        const smartScheduleService = new SmartScheduleService(database);
        sovereignRegistry.registerInstance('smartScheduleService', smartScheduleService);

        // 7.2 [Phase 401] Scientific Attendance Audit & Vision
        const { attendanceAuditService } = await import('./services/AttendanceAuditService');
        const { AuditLogService } = await import('./services/AuditLogService');
        const { securityService } = await import('./services/SecurityService');
        const { cameraService } = await import('./services/CameraService');
        const { cameraDiscoveryService } = await import('./services/CameraDiscoveryService');
        
        const { attendanceValidationService } = await import('./services/AttendanceValidationService');
        
        attendanceAuditService.setDatabase(database);
        sovereignRegistry.registerInstance('attendanceAuditService', attendanceAuditService);
        sovereignRegistry.registerInstance('attendanceValidationService', attendanceValidationService);
        sovereignRegistry.registerInstance('cameraService', cameraService);
        sovereignRegistry.registerInstance('cameraDiscoveryService', cameraDiscoveryService);
        
        const auditLogService = new AuditLogService(database, securityService);
        sovereignRegistry.registerInstance('auditLogService', auditLogService);
        
        console.log('[ORCHESTRATOR] AttendanceAudit, AuditLogService e CameraService ativos.');

        // 7.2 [Phase 501] Parent Intelligence Bridge
        const { sovereignParentLinkService } = await import('./services/SovereignParentLinkService');
        sovereignRegistry.registerInstance('sovereignParentLinkService', sovereignParentLinkService);

        // Inicia loop de inteligência (a cada 30min em prod, 1min em dev/test)
        const synthesisInterval = process.env.NODE_ENV === 'test' ? 60000 : 1800000;
        setInterval(() => {
          intelligenceService.runSynthesis();
          socialGraphService.computeGraphFromEvents();
        }, synthesisInterval);

        // 8. [Level 3] Location Intelligence & Geofencing
        const { locationIntelligenceService } = await import('./services/LocationIntelligenceService');
        sovereignRegistry.registerInstance('locationIntelligenceService', locationIntelligenceService);

        // 9. [Level 3] Help SOC & Support
        const { supportService } = await import('./services/SovereignSupportService');
        supportService.init(database);
        sovereignRegistry.registerInstance('supportService', supportService);

        // 10. Geofence Monitor
        const { geofenceMonitorService } = await import('./services/GeofenceMonitorService');
        geofenceMonitorService.init(database);
        sovereignRegistry.registerInstance('geofenceMonitorService', geofenceMonitorService);
        geofenceMonitorService.start();

        // 11. [Level 3] Identity Recapture & Evolution
        const { identityRecaptureService } = await import('./services/IdentityRecaptureService');
        sovereignRegistry.registerInstance('identityRecaptureService', identityRecaptureService);

        // 12. [Level 4] Predictive Analytics & Behavioral Engine
        const { nexusSyncService } = await import('./services/NexusSyncService');
        const { predictiveAnalyticsService } = await import('./services/PredictiveAnalyticsService');
        const { autonomousGovernanceOrchestrator } = await import('./services/AutonomousGovernanceOrchestrator');
        
        predictiveAnalyticsService.setDatabase(database);
        sovereignRegistry.registerInstance('predictiveAnalyticsService', predictiveAnalyticsService);
        
        // 5. Iniciar Motor Preditivo (Nível 4)
        const PREDICTIVE_INTERVAL = process.env.NODE_ENV === 'test' ? 5 * 60 * 1000 : 4 * 60 * 60 * 1000;
        setInterval(() => predictiveAnalyticsService.runGlobalInference(), PREDICTIVE_INTERVAL);
        
        // 6. Iniciar Governança Adaptativa (Nível 5)
        // Executa logo após a inferência para agir sobre novos dados
        const GOVERNANCE_DELAY = 10 * 60 * 1000; // 10 min após o boot
        setTimeout(() => {
          autonomousGovernanceOrchestrator.runGovernanceCycle();
          setInterval(() => autonomousGovernanceOrchestrator.runGovernanceCycle(), PREDICTIVE_INTERVAL);
        }, GOVERNANCE_DELAY);

        // 13. [Level 10] System Consciousness & Homeostasis
        const { SovereignConsciousnessService } = await import('./services/SovereignConsciousnessService');
        const { sovereignResilienceService } = await import('./services/SovereignResilienceService');
        const { sovereignMeshService } = await import('./services/SovereignMeshService');
        const { distributedInferenceService } = await import('./services/DistributedInferenceService');
        const { churnMonitorService } = await import('./services/ChurnMonitorService');
        const db = sovereignRegistry.getDatabase();
        
        const consciousnessService = SovereignConsciousnessService.getInstance(db);
        sovereignRegistry.registerInstance('sovereignConsciousnessService', consciousnessService);
        sovereignRegistry.registerInstance('sovereignResilienceService', sovereignResilienceService);
        sovereignRegistry.registerInstance('sentinel', sovereignResilienceService);
        sovereignRegistry.registerInstance('sovereignMeshService', sovereignMeshService);
        const { parentPortal } = await import('./services/ParentPortalService');
        const { WhatsAppMessagingService } = await import('./services/WhatsAppMessagingService');
        const { NegotiationService } = await import('./services/NegotiationService');
        const { LegalDocumentService } = await import('./services/LegalDocumentService');
        const { FinanceForecastingService } = await import('./services/FinanceForecastingService');
        
        const whatsAppService = new WhatsAppMessagingService(db);
        const legalDocService = LegalDocumentService.getInstance();
        const negotiationService = new NegotiationService(db, legalDocService);
        const forecastService = new FinanceForecastingService(db);
        
        sovereignRegistry.registerInstance('parentWatchdog', parentPortal);
        sovereignRegistry.registerInstance('whatsAppQueue', whatsAppService);
        sovereignRegistry.registerInstance('negotiationService', negotiationService);
        sovereignRegistry.registerInstance('legalDocumentService', legalDocService);
        sovereignRegistry.registerInstance('financeForecastService', forecastService);
        const { selfHealingService } = await import('./services/SelfHealingService');
        sovereignRegistry.registerInstance('distributedInferenceService', distributedInferenceService);

        // 13.1 [Phase 503] Pedagogical Orchestration Brain
        const { PedagogicalOrchestrator } = await import('./services/PedagogicalOrchestrator');
        const { Logger } = await import('./services/Logger');
        const pedagogicalOrchestrator = new PedagogicalOrchestrator(
            database, 
            localAudioAI, 
            whatsAppService, 
            new Logger(path.join(process.cwd(), 'logs', 'pedagogical'))
        );
        sovereignRegistry.registerInstance('pedagogicalOrchestrator', pedagogicalOrchestrator);

        // 14. [Phase 502] Student Portal Intelligence Hydration
        const { councilService } = await import('./services/SovereignCouncilService');
        const { StudentLifecycleService } = await import('./services/StudentLifecycleService');
        const { studentPortfolioService } = await import('./services/StudentPortfolioService');

        const studentLifecycle = StudentLifecycleService.getInstance();

        sovereignRegistry.registerInstance('councilService', councilService);
        sovereignRegistry.registerInstance('studentLifecycle', studentLifecycle);
        sovereignRegistry.registerInstance('studentPortfolio', studentPortfolioService);
        
        // Bridge Distributed Inference Telemetry to UI (Level 13)
        distributedInferenceService.on('task:update', (task: any) => {
          const win = sovereignRegistry.getContext().mainWindow;
          if (win && !win.isDestroyed()) {
            win.webContents.send('task:update', task);
          }
        });

        distributedInferenceService.on('mesh:update', (state: any) => {
          const win = sovereignRegistry.getContext().mainWindow;
          if (win && !win.isDestroyed()) {
            win.webContents.send('mesh:update', state);
          }
        });

        sovereignRegistry.registerInstance('selfHealingService', selfHealingService);
        sovereignRegistry.registerInstance('evasionRiskService', churnMonitorService);
        sovereignRegistry.registerInstance('churnMonitorService', churnMonitorService);

        // 13.2 [Phase 1800] Neural Hardening (Encryption)
        const { sovereignEncryptionService } = await import('./services/SovereignEncryptionService');
        sovereignRegistry.registerInstance('sovereignEncryptionService', sovereignEncryptionService);

        // 13.3 [Level 13] Córtex Transcendente & Global Pulse (v402)
        const { sovereignGraphService } = await import('./services/SovereignGraphService');
        const { globalIntelligencePulseService } = await import('./services/GlobalIntelligencePulseService');
        const { pedagogicalAIOrchestrator } = await import('./services/PedagogicalAIOrchestrator');
        const { SovereignOutcomeService } = await import('./services/SovereignOutcomeService');

        sovereignGraphService.setDatabase(database);
        sovereignRegistry.registerInstance('sovereignGraphService', sovereignGraphService);
        sovereignRegistry.registerInstance('globalIntelligencePulseService', globalIntelligencePulseService);
        sovereignRegistry.registerInstance('pedagogicalAIOrchestrator', pedagogicalAIOrchestrator);

        const outcomeService = new SovereignOutcomeService(database, cortexEvolutionService);
        sovereignRegistry.registerInstance('sovereignOutcomeService', outcomeService);

        // Inicia Ciclo de Pulso de Inteligência Global (Sincronização Mesh)
        globalIntelligencePulseService.start(30000);

        // 13.1 [Phase 410] Financial Auditor
        const { FinancialAuditorService } = await import('./services/FinancialAuditorService');
        const financialAuditor = FinancialAuditorService.getInstance(db);
        financialAuditor.start();
        sovereignRegistry.registerInstance('financialAuditorService', financialAuditor);
        
        // 13.4 [Phase 401] HR & Documents
        const { hrSovereigntyService } = await import('./services/HRSovereigntyService');
        const { DocumentService } = await import('./services/DocumentService');
        const userDataPath = app.getPath('userData');
        const reportsPath = path.join(userDataPath, 'reports');
        const documentService = new DocumentService(reportsPath);
        
        hrSovereigntyService.init(database);
        sovereignRegistry.registerInstance('hrSovereigntyService', hrSovereigntyService);
        sovereignRegistry.registerInstance('documentService', documentService);

        // Inicializar a malha se ainda não estiver ativa
        await sovereignMeshService.init();
        
        consciousnessService.startHomeostasisLoop();
        churnMonitorService.runGlobalRiskScan();

        // 14. [Level 19] Digital Twin & Flow Prediction
        const { digitalTwinService } = await import('./services/DigitalTwinService');
        const { FlowPredictionEngine } = await import('./services/FlowPredictionEngine');
        
        const flowPredictionEngine = new FlowPredictionEngine(db);
        await flowPredictionEngine.start();
        
        sovereignRegistry.registerInstance('digitalTwinService', digitalTwinService);
        sovereignRegistry.registerInstance('flowPredictionEngine', flowPredictionEngine);

        // 15. [Level 20] Sovereign Federation & Nexus Global
        const { nexusMeshService } = await import('./services/NexusMeshService');
        const { federatedLearningOrchestrator } = await import('./services/FederatedLearningOrchestrator');
        
        await nexusMeshService.start();
        await federatedLearningOrchestrator.start();
        
        sovereignRegistry.registerInstance('nexusMeshService', nexusMeshService);
        sovereignRegistry.registerInstance('federatedLearningOrchestrator', federatedLearningOrchestrator);

        // 16. [Expansion Phase] Mobility, Infrastructure & Digital Twin
        const { mobileGateway } = await import('./services/MobileGateway');
        const { cloudMirrorService } = await import('./services/CloudMirrorService');
        const { npuHardwareOptimizer } = await import('./services/NpuHardwareOptimizer');
        const { blenderBridgeService } = await import('./services/BlenderBridgeService');
        const { wikiSyncService } = await import('./services/WikiSyncService');

        mobileGateway.start(9000);
        await cloudMirrorService.startMirroring();
        await npuHardwareOptimizer.applyOptimizationProfile('MAX_PERFORMANCE');
        // A inicialização do ambiente (paredes provisórias) ocorre sob demanda.

        sovereignRegistry.registerInstance('mobileGateway', mobileGateway);
        sovereignRegistry.registerInstance('cloudMirrorService', cloudMirrorService);
        sovereignRegistry.registerInstance('npuHardwareOptimizer', npuHardwareOptimizer);
        sovereignRegistry.registerInstance('blenderBridgeService', blenderBridgeService);
        sovereignRegistry.registerInstance('wikiSyncService', wikiSyncService);

        // 16.1 [Phase 420] Thermal Homeostasis & Resilience
        const { thermalEfficiencyEngine } = await import('./services/ThermalEfficiencyEngine');
        sovereignRegistry.registerInstance('thermalEfficiencyEngine', thermalEfficiencyEngine);
        console.log('[ORCHESTRATOR] ThermalEfficiencyEngine (Homeostasis) ativo.');

        // 17. [Finalization] Sovereign Lifecycle & Metabolism (Cyclic Tasks)
        const { sovereignLifecycleService } = await import('./services/SovereignLifecycleService');
        await sovereignLifecycleService.bootMetabolism();
        sovereignRegistry.registerInstance('sovereignLifecycleService', sovereignLifecycleService);

        // 18. [Sprint 4] Headless RPA Workers (SigaWeb & Domínio Sistemas)
        const { RpaOrchestrator } = await import('./services/rpa');
        const rpaOrchestrator = RpaOrchestrator.getInstance();
        await rpaOrchestrator.initialize();
        sovereignRegistry.registerInstance('rpaOrchestrator', rpaOrchestrator);
        console.log('[ORCHESTRATOR] RpaOrchestrator (SigaWeb & Domínio Sistemas) ativo.');

        console.log('[Orchestrator] Fase 2 Concluída: Inteligência Preditiva, Gêmeos Digitais, Federação Nexus, Mobilidade, Nuvem, 3D Bridge, Wiki e RPA Ativos.');




      } catch (err) {
        console.error('[ORCHESTRATOR] Erro na Fase 2:', err);
      }
    }, BOOT_DELAY);
  }
}
