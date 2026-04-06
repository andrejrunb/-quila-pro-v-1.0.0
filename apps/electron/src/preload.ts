/**
 * Áquila Pro Desktop - Preload Script
 * Bridge seguro entre o processo principal (Node.js) e o renderer (React)
 * Usa contextBridge para expor APIs seguras sem habilitar nodeIntegration
 */

import { contextBridge, ipcRenderer } from 'electron';

// ============================================================================
// TIPOS
// ============================================================================

interface CameraConfig {
  id: string;
  name: string;
  rtspUrl: string;
  location: string;
  ip?: string;
  username?: string;
  password?: string;
  status?: string;
  type?: string;
  resolution?: string;
  fps?: number;
  lastSeen?: string;
  roomId?: string;
  enabled: boolean;
}

interface StudentData {
  id: string;
  name: string;
  classId: string;
  photoPath?: string;
}

interface AttendanceQuery {
  studentId: string;
  classId: string;
  date: string;
}

interface ReportQuery {
  type: 'daily' | 'weekly' | 'monthly' | 'bimestral';
  periodId?: string;
  classId?: string;
  startDate?: string;
  endDate?: string;
}

interface NotificationData {
  type: string;
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  studentId?: string;
}

// ============================================================================
// API EXPOSTA AO RENDERER
// ============================================================================

const aquilaAPI = {
  // ---- SISTEMA ----
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  getSystemInfo: () => ipcRenderer.invoke('get-system-info'),
  getPlatform: () => process.platform,
  getHardwareId: () => ipcRenderer.invoke('get-hardware-id'),
  getDensity: (zoneId: string) => ipcRenderer.invoke('get-density', zoneId),
  getPerformanceMetrics: () => ipcRenderer.invoke('perf:get-metrics'),
  
  // ---- SECURITY DRILLS (AG-042) ----
  startDrill: (type: string) => ipcRenderer.invoke('security:start-drill', type),
  registerDrillResponse: (guardId: string, time: number) => ipcRenderer.invoke('security:register-response', { guardId, time }),
  finalizeDrill: () => ipcRenderer.invoke('security:finalize-drill'),
  
  // ---- BANCO DE DADOS ----
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings: Record<string, any>) => ipcRenderer.invoke('save-settings', settings),
  
  // ---- CÂMERAS ----
  getCameras: () => ipcRenderer.invoke('get-cameras'),
  addCamera: (camera: CameraConfig) => ipcRenderer.invoke('add-camera', camera),
  setSchoolName: (name: string) => ipcRenderer.invoke('set-school-name', name),
  updateCamera: (camera: CameraConfig) => ipcRenderer.invoke('update-camera', camera),
  removeCamera: (cameraId: string) => ipcRenderer.invoke('remove-camera', cameraId),
  testCameraConnection: (rtspUrl: string) => ipcRenderer.invoke('test-camera', rtspUrl),
  startCamera: (cameraId: string) => ipcRenderer.invoke('start-camera', cameraId),
  stopCamera: (cameraId: string) => ipcRenderer.invoke('stop-camera', cameraId),
  startAllCameras: () => ipcRenderer.invoke('start-all-cameras'),
  stopAllCameras: () => ipcRenderer.invoke('stop-all-cameras'),
  getCameraStatus: (cameraId: string) => ipcRenderer.invoke('get-camera-status', cameraId),
  getCameraFrame: (cameraId: string) => ipcRenderer.invoke('get-camera-frame', cameraId),
  
  // ---- ALUNOS ----
  getStudents: (classId?: string) => ipcRenderer.invoke('get-students', classId),
  getStudent: (studentId: string) => ipcRenderer.invoke('get-student', studentId),
  createStudent: (student: StudentData) => ipcRenderer.invoke('create-student', student),
  updateStudent: (student: StudentData) => ipcRenderer.invoke('update-student', student),
  deleteStudent: (studentId: string) => ipcRenderer.invoke('delete-student', studentId),
  uploadStudentPhoto: (studentId: string, photoPath: string) => ipcRenderer.invoke('upload-student-photo', studentId, photoPath),
  trainFaceRecognition: (studentId: string) => ipcRenderer.invoke('train-face-recognition', studentId),
  trainAllFaces: () => ipcRenderer.invoke('train-all-faces'),
  
  // ---- TURMAS ----
  getClasses: () => ipcRenderer.invoke('get-classes'),
  createClass: (classData: any) => ipcRenderer.invoke('create-class', classData),
  updateClass: (classData: any) => ipcRenderer.invoke('update-class', classData),
  deleteClass: (classId: string) => ipcRenderer.invoke('delete-class', classId),
  upsertClass: (classData: any) => ipcRenderer.invoke('upsert-class', classData),
  
  // ---- SALAS ----
  getRooms: () => ipcRenderer.invoke('get-rooms'),
  upsertRoom: (roomData: any) => ipcRenderer.invoke('upsert-room', roomData),
  deleteRoom: (roomId: string) => ipcRenderer.invoke('delete-room', roomId),
  
  // ---- GRADE HORÁRIA ----
  getSchedules: (classId?: string) => ipcRenderer.invoke('get-schedules', classId),
  importScheduleFromExcel: (filePath: string) => ipcRenderer.invoke('import-schedule-excel', filePath),
  exportScheduleTemplate: () => ipcRenderer.invoke('export-schedule-template'),
  
  // ---- PRESENÇA ----
  calculateAttendance: (query: AttendanceQuery) => ipcRenderer.invoke('calculate-attendance', query),
  getAttendanceReport: (classId: string, startDate: string, endDate: string) => ipcRenderer.invoke('get-attendance-report', classId, startDate, endDate),
  getStudentAttendanceHistory: (studentId: string, days: number) => ipcRenderer.invoke('get-student-attendance-history', studentId, days),
  getDailyAttendanceSummary: (date: string) => ipcRenderer.invoke('get-daily-attendance-summary', date),
  
  // ---- EVENTOS ----
  getRecentEvents: (limit?: number) => ipcRenderer.invoke('get-recent-events', limit),
  getStudentEvents: (studentId: string, date: string) => ipcRenderer.invoke('get-student-events', studentId, date),
  
  // ---- ALERTAS ----
  getAlerts: (filter?: any) => ipcRenderer.invoke('get-alerts', filter),
  getUnreadAlerts: () => ipcRenderer.invoke('get-unread-alerts'),
  markAlertRead: (alertId: string) => ipcRenderer.invoke('mark-alert-read', alertId),
  markAllAlertsRead: () => ipcRenderer.invoke('mark-all-alerts-read'),
  dismissAlert: (alertId: string) => ipcRenderer.invoke('dismiss-alert', alertId),
  
  // ---- NOTIFICAÇÕES ----
  getNotifications: () => ipcRenderer.invoke('get-notifications'),
  markNotificationRead: (notificationId: string) => ipcRenderer.invoke('mark-notification-read', notificationId),
  sendDesktopNotification: (notification: NotificationData) => ipcRenderer.invoke('send-desktop-notification', notification),
  
  // ---- RELATÓRIOS ----
  generateAttendanceReport: (periodId: string, classId: string, format: 'pdf' | 'excel') => ipcRenderer.invoke('reports:generate-attendance', { periodId, classId, format }),
  generateBehaviorReport: (studentId: string, periodId: string, format: 'pdf' | 'excel') => ipcRenderer.invoke('reports:generate-behavior', { studentId, periodId, format }),
  getBimestralReport: (classId: string, bimestre: number, year: number) => ipcRenderer.invoke('get-bimestral-report', classId, bimestre, year),
  
  // ---- NEXUS CORE (AG-034/035) ----
  getNexusState: () => ipcRenderer.invoke('nexus:get-state'),
  setMeshStatus: (active: boolean) => ipcRenderer.invoke('nexus:set-mesh-status', active),
  onNexusPulse: (callback: any) => {
    const subscription = (_event: any, data: any) => callback(data);
    ipcRenderer.on('nexus-pulse', subscription);
    return () => ipcRenderer.removeListener('nexus-pulse', subscription);
  },
  onMeshStatusChanged: (callback: any) => {
    const subscription = (_event: any, data: any) => callback(data);
    ipcRenderer.on('mesh-status-changed', subscription);
    return () => ipcRenderer.removeListener('mesh-status-changed', subscription);
  },
  getSwarmStatus: () => ipcRenderer.invoke('nexus:get-swarm-status'),
  getSwarmHistory: (limit?: number) => ipcRenderer.invoke('nexus:get-swarm-history', limit),
  getAgentHistory: (agentId: string, limit?: number) => ipcRenderer.invoke('nexus:get-agent-history', agentId, limit),

  // ---- WIFI DENSE POSE (AG-041) ----
  getWiFiStatus: () => ipcRenderer.invoke('wifi:get-status'),
  onGhostDetected: (callback: any) => ipcRenderer.on('ghost-detected', (_event, data) => callback(data)),
  onPassiveFallAlert: (callback: any) => ipcRenderer.on('wifi:fall-alert', (_event, data) => callback(data)),

  // ---- PREDICTIVE ANALYSIS (AG-022) ----
  analyzeDropoutRisk: (data: any) => ipcRenderer.invoke('predictive:analyze-risk', data),

  // ---- AI ANALYSIS (Purga IPC) ----
  getAiEvents: (limit?: number) => ipcRenderer.invoke('ai:get-events', limit),
  simulateAiEvent: (payload: any) => ipcRenderer.invoke('ai:simulate-event', payload),
  onAiEvent: (callback: any) => ipcRenderer.on('ai-event', (_event, data) => callback(data)),

  // ---- ATTENDANCE & PRESENCE (Purga IPC) ----
  getAttendanceTelemetry: () => ipcRenderer.invoke('attendance:get-telemetry'),
  getReIDSessions: () => ipcRenderer.invoke('reid:get-sessions'),
  onReIDUpdate: (callback: any) => ipcRenderer.on('reid:update', (_event, data) => callback(data)),
  getPresenceDiscrepancies: () => ipcRenderer.invoke('presence:get-discrepancies'),
  onPresenceDiscrepancy: (callback: any) => ipcRenderer.on('presence-discrepancy', (_event, data) => callback(data)),

  // ---- IOT & HARDWARE (Purga IPC) ----
  getIoTDevices: () => ipcRenderer.invoke('iot:get-status'),
  triggerIoTAction: (deviceId: string, command: string) => ipcRenderer.invoke('iot:trigger', { deviceId, command }),
  onIoTDeviceUpdated: (callback: any) => ipcRenderer.on('iot:device-updated', (_event, data) => callback(data)),

  // ---- BIOMETRY (Purga IPC) ----
  getBiometricStatus: () => ipcRenderer.invoke('biometric:get-status'),
  scanPalm: (userId: string) => ipcRenderer.invoke('biometric:scan', userId),
  onBiometricScanResult: (callback: any) => ipcRenderer.on('biometric:scan-result', (_event, data) => callback(data)),
  scanPalmVein: (userId: string) => ipcRenderer.invoke('biometric:scan', userId),
  logAttendance: (studentId: string, status: string) => ipcRenderer.invoke('attendance:log', { studentId, status }),

  // ---- SECURITY AUDIT (Zero-Debt) ----
  startSecurityDrill: (type: string) => ipcRenderer.invoke('security:start-drill', type),
  registerSecurityResponse: (userId: string, time: number) => ipcRenderer.invoke('security:register-response', { userId, time }),
  finalizeSecurityDrill: () => ipcRenderer.invoke('security:finalize-drill'),

  // ---- LGPD (Zero-Debt) ----
  getLgpdRecords: () => ipcRenderer.invoke('lgpd:get-records'),

  // ---- BEHAVIORAL (Zero-Debt) ----
  getBehavioralMetrics: () => ipcRenderer.invoke('behavioral:get-metrics'),

  // ---- HR (Zero-Debt) ----
  getHrSovereignty: () => ipcRenderer.invoke('hr:get-sovereignty'),

  // ---- SUSTAINABILITY (Zero-Debt) ----
  getEnergyMetrics: () => ipcRenderer.invoke('energy:get-metrics'),
  getThermalState: () => ipcRenderer.invoke('energy:get-thermal'),
  setEcoMode: (active: boolean) => ipcRenderer.invoke('energy:set-eco-mode', active),
  onEnergyUpdated: (callback: (data: any) => void) => {
    const handler = (_event: any, data: any) => callback(data);
    ipcRenderer.on('energy:updated', handler);
    return () => ipcRenderer.removeListener('energy:updated', handler);
  },

  // ---- TEACHER (Zero-Debt) ----
  getNeuroPulse: (classId: string) => ipcRenderer.invoke('neuro:get-pulse', classId),
  getNeuroTrends: () => ipcRenderer.invoke('neuro:get-trends'),
  getIndividualStudentFocus: () => ipcRenderer.invoke('neuro:get-students'),
  getNeuroRecommendation: (pulse: any) => ipcRenderer.invoke('neuro:get-recommendation', pulse),
  getRoomData: (roomId: string) => ipcRenderer.invoke('env:get-room-data', roomId),
  forceVentilation: (roomId: string) => ipcRenderer.invoke('env:force-ventilation', roomId),
  getCognitiveAlerts: (roomId: string) => ipcRenderer.invoke('cognitive:get-alerts', roomId),
  onRoomUpdated: (roomId: string, callback: (data: any) => void) => {
    const handler = (_event: any, data: any) => callback(data);
    ipcRenderer.on(`env:room-updated-${roomId}`, handler);
    return () => ipcRenderer.removeListener(`env:room-updated-${roomId}`, handler);
  },
  processTeacherAudioLog: (data: any) => ipcRenderer.invoke('process-teacher-audio-log', data),

  // ---- VISITOR / PARENT / CLASSROOM / PORTFOLIO (Zero-Debt) ----
  getParentNotifications: () => ipcRenderer.invoke('parent:get-notifications'),
  getClassroomState: (id: string) => ipcRenderer.invoke('classroom:get-state', id),
  getPortfolioEvents: (studentId: string) => ipcRenderer.invoke('portfolio:get-events', studentId),
  getPedagogicalInsights: (studentId: string) => ipcRenderer.invoke('insight:get-insights', studentId),
  analyzePedagogicalStudent: (studentId: string) => ipcRenderer.invoke('insight:analyze', studentId),
  getStudentLifecycle: (studentId: string) => ipcRenderer.invoke('lifecycle:get-history', studentId),
  getStudentComparison: (studentId: string) => ipcRenderer.invoke('analytics:get-comparison', studentId),
  getStudentPortfolio: (studentId: string) => ipcRenderer.invoke('get-student-portfolio', studentId),
  getInventoryStock: () => ipcRenderer.invoke('inventory:get-stock'),
  printBadge: (data: any) => ipcRenderer.invoke('print-badge', data),
  getRecentVisitors: () => ipcRenderer.invoke('visitor:get-recent'),
  registerVisitor: (data: any) => ipcRenderer.invoke('visitor:register', data),
  searchDocs: (query: string) => ipcRenderer.invoke('rag:search-docs', query),
  on: (channel: string, callback: (...args: any[]) => void) => {
    const ALLOWED_LISTEN_CHANNELS = [
      'sync:peers-updated', 'sync:global-started', 'sync:global-finished',
      'update-available', 'update-download-progress', 'update-downloaded', 'update-error',
      'robotics:telemetry', 'nexus-pulse', 'rag:index-status'
    ];
    if (ALLOWED_LISTEN_CHANNELS.includes(channel)) {
      const subscription = (_event: any, ...args: any[]) => callback(...args);
      ipcRenderer.on(channel, subscription);
      return () => ipcRenderer.removeListener(channel, subscription);
    }
    console.warn(`Blocked attempt to listen on restricted channel: ${channel}`);
    return () => {};
  },


  // ---- GEOFENCE (Zero-Debt) ----
  geofence: {
    getArriving: () => ipcRenderer.invoke('geofence:get-arriving'),
  },

  // ---- VR & DIGITAL TWIN (Zero-Debt) ----
  vr: {
    startSession: (role: string) => ipcRenderer.invoke('vr:start-session', role),
    syncTwin: (data: any) => ipcRenderer.invoke('vr:sync-twin', data),
  },

  // ---- MESSENGER (Zero-Debt) ----
  messenger: {
    getChannels: () => ipcRenderer.invoke('messenger:get-channels'),
    getMessages: (channelId: string) => ipcRenderer.invoke('messenger:get-messages', channelId),
    sendMessage: (msg: any) => ipcRenderer.invoke('messenger:send', msg),
    onNewMessage: (callback: (msg: any) => void) => {
      const handler = (_event: any, data: any) => callback(data);
      ipcRenderer.on('messenger:new-message', handler);
      return () => ipcRenderer.removeListener('messenger:new-message', handler);
    },
    onSilentAlarm: (callback: (alarm: any) => void) => {
      const handler = (_event: any, data: any) => callback(data);
      ipcRenderer.on('messenger:silent-alarm', handler);
      return () => ipcRenderer.removeListener('messenger:silent-alarm', handler);
    }
  },

  // ---- FLEET (Zero-Debt) ----
  fleet: {
    getStatus: () => ipcRenderer.invoke('fleet:get-status'),
    getRoute: (id: string) => ipcRenderer.invoke('fleet:get-route', id),
  },

  // ---- BACKUP ----
  backupNow: () => ipcRenderer.invoke('backup-now'),
  getBackupHistory: () => ipcRenderer.invoke('get-backup-history'),
  restoreBackup: (backupId: string) => ipcRenderer.invoke('restore-backup', backupId),
  setBackupSchedule: (schedule: any) => ipcRenderer.invoke('set-backup-schedule', schedule),
  
  // ---- AUTENTICAÇÃO ----
  login: (username: string, password: string) => ipcRenderer.invoke('login', username, password),
  logout: () => ipcRenderer.invoke('logout'),
  getCurrentUser: () => ipcRenderer.invoke('get-current-user'),
  changePassword: (oldPassword: string, newPassword: string) => ipcRenderer.invoke('change-password', oldPassword, newPassword),
  
  // ---- PROCESSAMENTO ----
  startProcessing: () => ipcRenderer.invoke('start-processing'),
  stopProcessing: () => ipcRenderer.invoke('stop-processing'),
  getProcessingStatus: () => ipcRenderer.invoke('get-processing-status'),
  getSystemMetrics: () => ipcRenderer.invoke('get-system-metrics'),
  runPerformanceBenchmark: (cameras: number) => ipcRenderer.invoke('run-performance-benchmark', cameras),
  
  // ---- LGPD ----
  exportStudentData: (studentId: string) => ipcRenderer.invoke('export-student-data', studentId),
  deleteStudentData: (studentId: string, confirmation: string) => ipcRenderer.invoke('delete-student-data', studentId, confirmation),
  getConsentStatus: (studentId: string) => ipcRenderer.invoke('get-consent-status', studentId),
  recordConsent: (studentId: string, consent: any) => ipcRenderer.invoke('record-consent', studentId, consent),
  
  // ---- DIÁLOGOS ----
  showOpenDialog: (options: any) => ipcRenderer.invoke('show-open-dialog', options),
  showSaveDialog: (options: any) => ipcRenderer.invoke('show-save-dialog', options),
  showMessageBox: (options: any) => ipcRenderer.invoke('show-message-box', options),
  
  // ---- ATUALIZAÇÕES ----
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  downloadUpdate: () => ipcRenderer.invoke('download-update'),
  installUpdate: () => ipcRenderer.invoke('install-update'),

  // ---- COORDENAÇÃO E PERÍODOS (AG-025) ----
  getCoordinations: () => ipcRenderer.invoke('get-coordinations'),
  upsertCoordination: (c: any) => ipcRenderer.invoke('upsert-coordination', c),
  deleteCoordination: (id: string) => ipcRenderer.invoke('delete-coordination', id),
  getAcademicPeriods: () => ipcRenderer.invoke('get-academic-periods'),
  upsertAcademicPeriod: (p: any) => ipcRenderer.invoke('upsert-academic-period', p),
  deleteAcademicPeriod: (id: string) => ipcRenderer.invoke('delete-academic-period', id),
  getStudentReport: (sId: string, pId: string) => ipcRenderer.invoke('get-student-report', sId, pId),
  upsertStudentReport: (r: any) => ipcRenderer.invoke('upsert-student-report', r),
  getUsers: () => ipcRenderer.invoke('get-users'),
  updateUserRole: (userId: string, role: string, coordinationId: string | null) => ipcRenderer.invoke('update-user-role', userId, role, coordinationId),

  // AI & Verification (AG-026)
  getVerificationQueue: () => ipcRenderer.invoke('get-verification-queue'),
  updateVerificationStatus: (id: string, status: string, confirmedStudentId?: string, coordinatorId?: string) => 
    ipcRenderer.invoke('update-verification-status', id, status, confirmedStudentId, coordinatorId),
  
  // Rankings & Alarms (AG-027)
  getStudentRankings: (metric: 'presence' | 'punctuality' | 'loitering', limit?: number, order?: 'ASC' | 'DESC') => 
    ipcRenderer.invoke('get-student-rankings', metric, limit, order),
  calculateAttendanceAnomalies: (studentId: string) => 
    ipcRenderer.invoke('calculate-attendance-anomalies', studentId),
  getBehavioralStats: () => ipcRenderer.invoke('get-behavioral-stats'),
  getSocialContextSummary: () => ipcRenderer.invoke('get-social-context-summary'),

  // ---- FINANCEIRO V3 (Step 09) ----
  getFinancialStats: () => ipcRenderer.invoke('finance:get-stats'),
  getAllBilling: () => ipcRenderer.invoke('finance:get-all-billing'),
  syncFinance: () => ipcRenderer.invoke('finance:sync'),
  
  // ---- LISTENERS (eventos do main para renderer) ----
  onCameraFrame: (callback: (data: any) => void) => {
    const handler = (_event: any, data: any) => callback(data);
    ipcRenderer.on('camera-frame', handler);
    return () => ipcRenderer.removeListener('camera-frame', handler);
  },
  
  onAlert: (callback: (alert: any) => void) => {
    const handler = (_event: any, alert: any) => callback(alert);
    ipcRenderer.on('new-alert', handler);
    return () => ipcRenderer.removeListener('new-alert', handler);
  },
  
  onNotification: (callback: (notification: any) => void) => {
    const handler = (_event: any, notification: any) => callback(notification);
    ipcRenderer.on('new-notification', handler);
    return () => ipcRenderer.removeListener('new-notification', handler);
  },
  
  onProcessingStatus: (callback: (status: any) => void) => {
    const handler = (_event: any, status: any) => callback(status);
    ipcRenderer.on('processing-status', handler);
    return () => ipcRenderer.removeListener('processing-status', handler);
  },
  
  onStudentDetected: (callback: (data: any) => void) => {
    const handler = (_event: any, data: any) => callback(data);
    ipcRenderer.on('student-detected', handler);
    return () => ipcRenderer.removeListener('student-detected', handler);
  },

  // AG-002: Face detection event from FaceWorkerBridge via main process
  onFaceDetected: (callback: (data: any) => void) => {
    const handler = (_event: any, data: any) => callback(data);
    ipcRenderer.on('face-detected', handler);
    return () => ipcRenderer.removeListener('face-detected', handler);
  },

  onShortcut: (callback: (data: any) => void) => {
    const handler = (_event: any, data: any) => callback(data);
    ipcRenderer.on('keyboard-shortcut', handler);
    return () => ipcRenderer.removeListener('keyboard-shortcut', handler);
  },
  
  onCameraStatusChange: (callback: (data: any) => void) => {
    const handler = (_event: any, data: any) => callback(data);
    ipcRenderer.on('camera-status-change', handler);
    return () => ipcRenderer.removeListener('camera-status-change', handler);
  },
  
  onUpdateAvailable: (callback: (info: any) => void) => {
    const handler = (_event: any, info: any) => callback(info);
    ipcRenderer.on('update-available', handler);
    return () => ipcRenderer.removeListener('update-available', handler);
  },
  
  onUpdateDownloaded: (callback: (info: any) => void) => {
    const handler = (_event: any, info: any) => callback(info);
    ipcRenderer.on('update-downloaded', handler);
    return () => ipcRenderer.removeListener('update-downloaded', handler);
  },
  
  onBackupComplete: (callback: (result: any) => void) => {
    const handler = (_event: any, result: any) => callback(result);
    ipcRenderer.on('backup-complete', handler);
    return () => ipcRenderer.removeListener('backup-complete', handler);
  },
  
  onNavigate: (callback: (event: any, page: string) => void) => {
    const handler = (event: any, page: string) => callback(event, page);
    ipcRenderer.on('navigate', handler);
    return () => ipcRenderer.removeListener('navigate', handler);
  },

  onNpuStatus: (callback: (status: any) => void) => {
    const handler = (_event: any, status: any) => callback(status);
    ipcRenderer.on('npu:status-update', handler);
    return () => ipcRenderer.removeListener('npu:status-update', handler);
  },

  onPerfStatus: (callback: (status: any) => void) => {
    const handler = (_event: any, status: any) => callback(status);
    ipcRenderer.on('perf:resource-status', handler);
    return () => ipcRenderer.removeListener('perf:resource-status', handler);
  },

  onHeatmapUpdate: (callback: (data: any) => void) => {
    const handler = (_event: any, data: any) => callback(data);
    ipcRenderer.on('analytics:heatmap-update', handler);
    return () => ipcRenderer.removeListener('analytics:heatmap-update', handler);
  },
  
  // ---- LICENÇA / PLANO ----
  getLicenseInfo: () => ipcRenderer.invoke('get-license-info'),
  getPlanLimits: () => ipcRenderer.invoke('get-plan-limits'),
  activateLicense: (licenseJson: string) => ipcRenderer.invoke('activate-license', licenseJson),

  // ---- FACE WORKER ----
  getFaceWorkerStatus: () => ipcRenderer.invoke('get-face-worker-status'),

  // ---- WHATSAPP ----
  sendWhatsAppAlert: (data: any) => ipcRenderer.invoke('send-whatsapp-alert', data),
  getWhatsAppQueueStatus: () => ipcRenderer.invoke('get-whatsapp-queue-status'),

  // ---- SYNC ----
  forceSync: () => ipcRenderer.invoke('force-sync'),
  getLastSyncTime: () => ipcRenderer.invoke('get-last-sync-time'),
  onSyncStatus: (callback: any) => ipcRenderer.on('sync-status', callback),

  // ---- THEME ----
  getThemeConfig: () => ipcRenderer.invoke('theme:get-config'),
  updateTheme: (partial: any) => ipcRenderer.invoke('theme:update', partial),

  // ---- GENERIC INVOKE (Hardened with Allow-List) ----
  invoke: (channel: string, ...args: any[]) => {
    const ALLOWED_CHANNELS = [
      'get-app-version', 'get-system-info', 'get-hardware-id', 'get-density',
      'get-settings', 'save-settings', 'get-cameras', 'add-camera', 'update-camera',
      'remove-camera', 'test-camera', 'start-camera', 'stop-camera', 'get-students',
      'get-student', 'create-student', 'update-student', 'delete-student',
      'upload-student-photo', 'train-face-recognition', 'get-classes', 'upsert-class',
      'delete-class', 'get-rooms', 'upsert-room', 'delete-room', 'get-schedules',
      'upsert-schedule', 'delete-schedule', 'calculate-attendance', 'get-attendance-report',
      'get-daily-attendance-summary', 'get-recent-events', 'get-alerts', 'mark-alert-read',
      'send-briefing-notification', 'reports:generate-attendance', 'reports:generate-behavior',
      'get-bimestral-report', 'backup-now', 'login', 'logout', 'get-current-user',
      'get-system-metrics', 'get-stream-stats', 'lgpd:get-term', 'lgpd:run-purge',
      'sync:get-status', 'sync:enroll', 'sync:test-connection', 'get-license-info',
      'get-plan-limits', 'activate-license', 'get-users', 'create-user', 'get-student-events',
      'get-smart-narrative', 'get-social-context-for-student', 'get-student-trajectory',
      'get-school-settings', 'update-school-branding', 'get-student-rankings',
      'calculate-reprobation-risk', 'get-behavioral-stats', 'get-social-context-summary',
      'whatsapp:get-status', 'whatsapp:update-config', 'whatsapp:test-connection',
      'save-whatsapp-templates', 'auth:login', 'auth:logout', 'auth:validate',
      'dialog:openDirectory', 'dialog:openFile', 'scan-photo-folder', 'parse-import-spreadsheet',
      'get-whatsapp-templates', 'theme:get-config', 'theme:update',
      'get-schedule-optimizations', 'get-unread-alerts', 'mark-all-alerts-read',
      'get-coordinations', 'upsert-coordination', 'delete-coordination',
      'get-academic-periods', 'upsert-academic-period', 'delete-academic-period',
      'is-setup-complete', 'set-school-name', 'import-students', 'create-lead',
      'get-audit-logs', 'iot:connect', 'iot:open-gate', 'toggle-lockdown',
      'perform-background-check', 'get-leads', 'update-user-role',
      'get-student-attendance-history', 'import-student', 'get-system-health',
      'install-update', 'check-for-updates', 'get-notifications', 'mark-notification-read',
      'send-desktop-notification', 'trigger-weekly-reports', 'finance:get-stats',
      'finance:get-all-billing', 'finance:sync', 'get-backup-history',
      'reprocess-biometrics', 'face:add-multi-angle', 'get-stream-stats',
      'start-recognition', 'stop-recognition', 'get-recognition-status',
      'run-performance-benchmark', 'analytics:get-engagement', 'analytics:get-heatmap',
      'treat-incident',
      'get-audit-logs-v1605', 'mobile:register-device', 'mobile:auth-challenge',
      'mobile:authorize-exit', 'mobile:survey-point', 'mobile:poi-tag',
      'get-evasion-risk-profiles', 'nexus:perform-dream-cycle', 'nexus:get-sentinel-status', 'nexus:start-deep-reasoning', 'nexus:get-architect-status', 'nexus:get-swarm-status', 'nexus:trigger-agent-diagnostic', 'nexus:generate-podcast', 'nexus:get-audio-status', 'nexus:get-ledger-status', 'nexus:add-ledger-entry', 'nexus:grant-xp', 'nexus:get-achievements', 'nexus:get-project-health', 'nexus:run-compliance-check', 'nexus:get-policy-status', 'nexus:check-updates', 'nexus:get-system-sanity',
      'ai:get-events', 'ai:simulate-event', 'attendance:get-telemetry', 'reid:get-sessions', 'presence:get-discrepancies', 'iot:get-status', 'iot:trigger', 'biometric:get-status', 'biometric:scan',
      'security:start-drill', 'security:register-response', 'security:finalize-drill', 'lgpd:get-records', 'behavioral:get-metrics', 'hr:get-sovereignty', 'attendance:log',
      'energy:get-metrics', 'energy:get-thermal', 'energy:set-eco-mode',
      'neuro:get-pulse', 'neuro:get-trends', 'neuro:get-students', 'neuro:get-recommendation',
      'env:get-room-data', 'env:force-ventilation', 'cognitive:get-alerts', 'process-teacher-audio-log',
      'get-student-portfolio', 'get-pedagogical-insights', 'inventory:get-stock', 'nexus:get-state', 'print-badge',
      'visitor:get-recent', 'visitor:register',
      'robotics:get-units', 'robotics:send-command', 'pricing:get-plans', 'pricing:calculate-quote',
      'theme:apply', 'theme:get-branding', 'autonomous-action:trigger', 'wifi:get-ghosts',
      'perf:get-metrics', 'rag:index-status', 'rag:search-docs',
      'nexus:get-swarm-history', 'nexus:get-agent-history',
      'audit:get-stats', 'geofence:get-arriving', 'npu:get-load'
    ];


    if (ALLOWED_CHANNELS.includes(channel)) {
      return ipcRenderer.invoke(channel, ...args);
    } else {
      console.error(`[SECURITY ALERT] Tentativa de acesso a canal IPC não autorizado: ${channel}`);
      return Promise.reject(new Error(`Canal IPC não autorizado: ${channel}`));
    }
  },
};

// ============================================================================
// EXPOR API VIA CONTEXT BRIDGE
// ============================================================================

contextBridge.exposeInMainWorld('aquila', aquilaAPI);

// Declaração de tipos para TypeScript
declare global {
  interface Window {
    aquila: typeof aquilaAPI;
  }
}
