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



const inferenceAPI = {

  dispatch: (task: any) => ipcRenderer.invoke('inference:dispatch', task),

  getTasks: () => ipcRenderer.invoke('inference:get-tasks'),

  getNodes: () => ipcRenderer.invoke('inference:get-nodes'),

  getState: () => ipcRenderer.invoke('mesh:get-inference-state')

};



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

  inference: inferenceAPI,

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

  getStudentRiskHistory: (studentId: string) => ipcRenderer.invoke('predictive:get-risk-history', studentId),



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



  // ---- CÓRTEX EVOLUTION (LEVEL 13) ----

  getCortexState: () => ipcRenderer.invoke('cortex:get-orchestration-state'),

  getEvolutionMetrics: () => ipcRenderer.invoke('cortex:get-evolution-metrics'),

  triggerRecovery: (studentId: string, planId: string) => ipcRenderer.invoke('cortex:trigger-recovery', { studentId, planId }),

  onCortexPulse: (callback: (insight: any) => void) => {

    const subscription = (_event: any, data: any) => callback(data);

    ipcRenderer.on('cortex:pulse', subscription);

    return () => ipcRenderer.removeListener('cortex:pulse', subscription);

  },



  // ---- OUTCOME INTELLIGENCE (LEVEL 9) ----

  outcome: {

    completeTask: (studentId: string, taskId: string) => ipcRenderer.invoke('outcome:complete-task', { studentId, taskId }),

    recordInteraction: (studentId: string) => ipcRenderer.invoke('outcome:record-interaction', { studentId }),

    getProjection: () => ipcRenderer.invoke('outcome:get-projection'),

    getAureusReport: () => ipcRenderer.invoke('outcome:get-aureus-report')

  },

  finalizeSecurityDrill: () => ipcRenderer.invoke('security:finalize-drill'),

  semanticSearch: (query: string, cameraId?: string, zone?: string) => ipcRenderer.invoke('security:semantic-search', { query, cameraId, zone }),

  getNetworkGuardStatus: () => ipcRenderer.invoke('security:get-network-guard-status'),

  startNetworkGuard: () => ipcRenderer.invoke('security:start-network-guard'),

  stopNetworkGuard: () => ipcRenderer.invoke('security:stop-network-guard'),



  // ---- LGPD (Zero-Debt) ----

  getLgpdRecords: () => ipcRenderer.invoke('lgpd:get-records'),

  exportRipd: () => ipcRenderer.invoke('lgpd:export-ripd'),



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



  // ---- OMR SOBERANO (Passos 141-146) ----

  omr: {

    createTemplate: (data: any) => ipcRenderer.invoke('omr:create-template', data),

    getTemplate: (id: string) => ipcRenderer.invoke('omr:get-template', id),

    listTemplates: (classId?: string) => ipcRenderer.invoke('omr:list-templates', classId),

    correctExam: (data: { templateId: string; imageBase64: string; studentId?: string; studentName?: string }) => ipcRenderer.invoke('omr:correct-exam', data),

    getCorrections: (templateId: string) => ipcRenderer.invoke('omr:get-corrections', templateId),

    saveGrade: (data: { studentId: string; classId: string; value: number; type?: string; weight?: number }) => ipcRenderer.invoke('academic:save-student-grade', data),

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

  parent: {

    getNotifications: () => ipcRenderer.invoke('parent:get-notifications'),

    getBehavioralInsight: (studentId: string) => ipcRenderer.invoke('parent:get-behavioral-insight', studentId),

    setRestrictions: (studentId: string, restrictions: any) => ipcRenderer.invoke('parent:set-restrictions', { studentId, restrictions }),

    updateLocation: (parentId: string, name: string, studentIds: string[], coords: { lat: number; lon: number }) => 

      ipcRenderer.invoke('parent:update-location', { parentId, name, studentIds, coords }),

  },

  affiliate: {

    getProducts: () => ipcRenderer.invoke('affiliate:get-products'),

    getStats: () => ipcRenderer.invoke('affiliate:get-stats'),

  },

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

  

  // ---- PEDAGOGICAL (Sovereign Librarian) ----

  pedagogical: {

    uploadFile: (filePath: string, classId?: string, options?: string[]) => ipcRenderer.invoke('pedagogical:upload-file', { filePath, classId, options }),

    getMaterials: (studentId?: string) => ipcRenderer.invoke('pedagogical:get-materials', studentId),

    dismissRisk: (studentId: string, riskType: string, reason: string) => ipcRenderer.invoke('pedagogical:dismiss-risk', studentId, riskType, reason),

    completeTask: (studentId: string, taskId: string) => ipcRenderer.invoke('pedagogical:complete-task', { studentId, taskId }),

    browseLibrary: (filters: any) => ipcRenderer.invoke('pedagogical:browse-library', filters),

    toggleFavorite: (resourceId: string) => ipcRenderer.invoke('pedagogical:toggle-favorite', resourceId),

    getCollections: () => ipcRenderer.invoke('pedagogical:get-collections'),

    createCollection: (name: string, description?: string) => ipcRenderer.invoke('pedagogical:create-collection', { name, description }),

    assignToCollection: (resourceId: string, collectionId: string) => ipcRenderer.invoke('pedagogical:assign-collection', { resourceId, collectionId }),

    searchSemantic: (query: string, limit?: number) => ipcRenderer.invoke('pedagogical:search-semantic', { query, limit }),

    getKnowledgeMap: () => ipcRenderer.invoke('pedagogical:get-knowledge-map'),

    generateExecutiveDigest: (resourceIds: string[]) => ipcRenderer.invoke('pedagogical:generate-executive-digest', { resourceIds }),

    querySwarm: (query: string) => ipcRenderer.invoke('pedagogical:query-swarm', { query }),

    getSwarmCache: () => ipcRenderer.invoke('pedagogical:get-swarm-cache'),

    vouchForResource: (resourceId: string, comment: string) => ipcRenderer.invoke('pedagogical:vouch-for-resource', { resourceId, comment }),

    getEvasionRadar: () => ipcRenderer.invoke('pedagogical:getEvasionRadar'),

    getRiskStats: () => ipcRenderer.invoke('pedagogical:getRiskStats'),

  },



  executive: {

    getROI: () => ipcRenderer.invoke('executive:get-roi'),

    getPulse: () => ipcRenderer.invoke('executive:get-pulse'),

    getHistory: (type: string) => ipcRenderer.invoke('executive:get-history', { type }),

    logMetric: (metric: any) => ipcRenderer.invoke('executive:log-metric', metric),

    getBudgetReport: () => ipcRenderer.invoke('budget:get-report'),

    getAIInsights: () => ipcRenderer.invoke('executive:get-ai-insights'),

    getNarrative: (schoolId?: string) => ipcRenderer.invoke('executive:get-narrative', schoolId),

    reviewNarrative: (narrativeId: string, reviewerName: string) => ipcRenderer.invoke('executive:review-narrative', { narrativeId, reviewerName }),

    exportNarrativeMd: (narrative: any) => ipcRenderer.invoke('executive:export-narrative-md', narrative)

  },



  council: {

    listPolls: (role: string) => ipcRenderer.invoke('council:list-polls', { role }),

    castVote: (data: any) => ipcRenderer.invoke('council:cast-vote', data)

  },



  geminiNotebook: {
    status: () => ipcRenderer.invoke('gemini-notebook:status'),
    create: (userId: string, title: string) => ipcRenderer.invoke('gemini-notebook:create', userId, title),
    get: (notebookId: string) => ipcRenderer.invoke('gemini-notebook:get', notebookId),
    list: (pageSize?: number) => ipcRenderer.invoke('gemini-notebook:list', pageSize),
    share: (userId: string, notebookId: string, recipients: Array<{ email: string; role: string }>) =>
      ipcRenderer.invoke('gemini-notebook:share', userId, notebookId, recipients),
    remove: (userId: string, notebookId: string, approval: { approvedBy: string; confirm: boolean }) =>
      ipcRenderer.invoke('gemini-notebook:delete', userId, notebookId, approval),
  },

  cosmetics: {
    getCatalog: () => ipcRenderer.invoke('cosmetics:get-catalog'),
    getInventory: (studentId: string) => ipcRenderer.invoke('cosmetics:get-inventory', studentId),
    claimAchievement: (studentId: string, achievementCode: string, grantedBy?: string) =>
      ipcRenderer.invoke('cosmetics:claim-achievement', studentId, achievementCode, grantedBy),
    purchase: (studentId: string, itemId: string, currentBalance: number, buyerId?: string) =>
      ipcRenderer.invoke('cosmetics:purchase', studentId, itemId, currentBalance, buyerId),
    equip: (studentId: string, itemId: string) => ipcRenderer.invoke('cosmetics:equip', studentId, itemId),
    getAuditTrail: (studentId?: string) => ipcRenderer.invoke('cosmetics:get-audit-trail', studentId),
  },

  student: {

    getStudent: (id: string) => ipcRenderer.invoke('get-student', id),

    getEconomy: (studentId: string) => ipcRenderer.invoke('get-student-economy', studentId),

    getEvents: (studentId: string, date?: string) => ipcRenderer.invoke('get-student-events', studentId, date),

    getPortfolio: (studentId: string) => ipcRenderer.invoke('get-student-portfolio', studentId),

    getLifecycle: (studentId: string) => ipcRenderer.invoke('lifecycle:get-history', studentId),

  },



  pod: {

    listPods: (studentId: string) => ipcRenderer.invoke('pod:list-pods-for-student', studentId),

    getAudio: (podId: string) => ipcRenderer.invoke('pod:getAudioOverview', podId),

  },



  // ---- GRADING (Vision-Based v1.5.0) ----

  grading: {

    getAssessments: (classId?: string) => ipcRenderer.invoke('grading:get-assessments', classId),

    createAssessment: (assessment: any) => ipcRenderer.invoke('grading:create-assessment', assessment),

    scanSheet: (imageBase64: string, assessmentId: string) => ipcRenderer.invoke('grading:scan-sheet', { imageBase64, assessmentId }),

    saveAutoGrade: (data: any) => ipcRenderer.invoke('grading:save-auto-grade', data),

  },



  // ---- MAPEAMENTO DE SALA (Phase 708) ----

  seating: {

    getLayout: (classId: string) => ipcRenderer.invoke('seating:get-layout', classId),

    getRecommendations: (classId: string) => ipcRenderer.invoke('seating:get-recommendations', classId),

    saveLayout: (classId: string, data: any) => ipcRenderer.invoke('seating:save-layout', classId, data),

    getRules: (classId: string) => ipcRenderer.invoke('seating:get-rules', classId),

    saveRule: (classId: string, rule: any) => ipcRenderer.invoke('seating:save-rule', { classId, rule }),

    deleteRule: (classId: string, ruleId: string) => ipcRenderer.invoke('seating:delete-rule', { classId, ruleId }),

    validatePresence: (classId: string, roomId: string) => ipcRenderer.invoke('seating:validate-presence', classId, roomId),

    registerBehavioralOccurrence: (data: { studentIds: string[], occurrenceType: string, description: string }) => ipcRenderer.invoke('seating:register-behavioral-occurrence', data),

  },



  behavioral: {

    getLive: (studentId?: string) => ipcRenderer.invoke('behavioral:get-live', studentId),

    getEvasionProfiles: () => ipcRenderer.invoke('behavioral:get-evasion-profiles'),

    getEmotionalTelemetry: (studentId: string) => ipcRenderer.invoke('behavioral:get-emotional-telemetry', studentId),

    getBehavioralInsight: (studentId: string) => ipcRenderer.invoke('behavioral:get-insight', studentId),

    getPoseEvents: (studentId?: string) => ipcRenderer.invoke('behavioral:get-pose-events', studentId),

  },



  pedagogy: {

    getBancas: () => ipcRenderer.invoke('pedagogy:get-bancas'),

    getClassTarget: (classId: string) => ipcRenderer.invoke('pedagogy:get-class-target', classId),

    getStudentTarget: (studentId: string) => ipcRenderer.invoke('pedagogy:get-student-target', studentId),

    setTarget: (classId: string, bancaId: string, year: number) => ipcRenderer.invoke('pedagogy:set-target', classId, bancaId, year),

    getResources: (bancaId: string) => ipcRenderer.invoke('pedagogy:get-resources', bancaId)

  },



  ecosystem: {

    getState: () => ipcRenderer.invoke('ecosystem:get-state'),

    updateState: (state: any) => ipcRenderer.invoke('ecosystem:update-state', state),

    toggleModule: (moduleId: string) => ipcRenderer.invoke('ecosystem:toggle-module', moduleId),

    setAIProvider: (provider: 'cloud' | 'local') => ipcRenderer.invoke('ecosystem:set-ai-provider', provider),

    onStatusChanged: (callback: (state: any) => void) => {

      const handler = (_event: any, state: any) => callback(state);

      ipcRenderer.on('ecosystem:status-changed', handler);

      return () => ipcRenderer.removeListener('ecosystem:status-changed', handler);

    }

  },



  on: (channel: string, callback: (...args: any[]) => void) => {

    const ALLOWED_LISTEN_CHANNELS = [

      'sync:peers-updated', 'sync:global-started', 'sync:global-finished',

      'update-available', 'update-download-progress', 'update-downloaded', 'update-error',

      'robotics:telemetry', 'nexus-pulse', 'rag:index-status', 'ecosystem:status-changed'

    ];

    if (ALLOWED_LISTEN_CHANNELS.includes(channel)) {

      const subscription = (_event: any, ...args: any[]) => callback(...args);

      ipcRenderer.on(channel, subscription);

      return () => ipcRenderer.removeListener(channel, subscription);

    }

    console.warn(`Blocked attempt to listen on restricted channel: ${channel}`);

    return () => {};

  },



  removeAllListeners: (channel: string) => {

    const ALLOWED_CHANNELS = [

      'sync:peers-updated', 'sync:global-started', 'sync:global-finished',

      'update-available', 'update-download-progress', 'update-downloaded', 'update-error',

      'robotics:telemetry', 'nexus-pulse', 'rag:index-status', 'ecosystem:status-changed',

      'npu:status-update', 'perf:resource-status', 'analytics:heatmap-update',

      'camera-frame', 'new-alert', 'new-notification', 'processing-status', 'student-detected', 'face-detected'

    ];

    if (ALLOWED_CHANNELS.includes(channel)) {

      ipcRenderer.removeAllListeners(channel);

    }

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

  login: (username: string, password: string) => ipcRenderer.invoke('login', { username, password }),

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

      'upsert-schedule', 'delete-schedule', 'clear-schedules', 'calculate-attendance', 'get-attendance-report',

      'get-daily-attendance-summary', 'get-recent-events', 'get-alerts', 'mark-alert-read',

      'send-briefing-notification', 'reports:generate-attendance', 'reports:generate-behavior',

      'get-bimestral-report', 'backup-now', 'login', 'logout', 'get-current-user',

      'get-system-metrics', 'get-stream-stats', 'lgpd:get-term', 'lgpd:run-purge',

      'sync:get-status', 'sync:enroll', 'sync:test-connection', 'get-license-info',

      'get-plan-limits', 'activate-license', 'get-users', 'create-user', 'delete-user', 'get-student-events',

      'audit:get-stats', 'audit:get-evidences', 'geofence:get-arriving', 'identity:get-stats', 'identity:get-mesh-health', 'support:get-summary',

      'mesh:get-swarm-status', 'executive:get-pulse', 'executive:get-roi', 'executive:get-budget-report',

      'cortex:get-orchestration-state', 'cortex:get-evolution-metrics', 'cortex:trigger-recovery',

      'outcome:complete-task', 'outcome:record-interaction', 'outcome:get-projection',

      'get-smart-narrative', 'get-social-context-for-student', 'get-student-trajectory',

      'get-school-settings', 'update-school-branding', 'get-student-rankings',

      'calculate-reprobation-risk', 'get-behavioral-stats', 'get-social-context-summary',

      'whatsapp:get-status', 'whatsapp:update-config', 'whatsapp:test-connection', 'send-whatsapp',

      'save-whatsapp-templates', 'auth:login', 'auth:logout', 'auth:validate',

      'dialog:openDirectory', 'dialog:openFile', 'shell:openPath', 'shell:openExternal', 'omr:create-template', 'omr:get-template', 'omr:list-templates', 'omr:correct-exam', 'omr:get-corrections', 'academic:save-student-grade', 'mobile:broadcast-pedagogical-pack', 'mobile:broadcast-grade', 'scan-photo-folder', 'parse-import-spreadsheet',

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

      'treat-incident', 'lifecycle:get-metrics', 'lifecycle:get-trends', 'lifecycle:predict-risk', 'lifecycle:get-risky-students', 'lifecycle:dismiss-risk',

      'finance:get-intervention-roi', 'finance:get-billing-history',

      'pedagogical:get-longitudinal-insight',

      'council:createProposal', 'council:whitelistByDirector', 'council:activatePoll', 'council:castVote',

      'council:getProposal', 'council:listActivePollsForRole', 'council:generateAiProposal',

      'pod:generatePod', 'pod:getAudioOverview', 'pod:listPodsForStudent',

      'quiz:generateQuest', 'quiz:submitResults',

      'budget:getTransparencyReport', 'budget:logOperationalInvestment',

      'nexus:getNodes', 'nexus:isMeshAlive', 'nexus:setMeshStatus',

      'get-audit-logs-v1605', 'mobile:register-device', 'mobile:auth-challenge',

      'mobile:authorize-exit', 'mobile:survey-point', 'mobile:poi-tag',

      'get-evasion-risk-profiles', 'nexus:perform-dream-cycle', 'nexus:get-sentinel-status', 'nexus:start-deep-reasoning', 'nexus:get-architect-status', 'nexus:get-swarm-status', 'nexus:trigger-agent-diagnostic', 'nexus:generate-podcast', 'nexus:get-audio-status', 'nexus:get-ledger-status', 'nexus:add-ledger-entry', 'nexus:grant-xp', 'nexus:get-achievements', 'nexus:get-project-health', 'nexus:run-compliance-check', 'nexus:get-policy-status', 'nexus:check-updates', 'nexus:get-system-sanity', 'edu:generate-podcast', 'pedagogy:process-material', 'pedagogical:get-materials',

      'ai:chat', 'ai:get-events', 'ai:simulate-event', 'attendance:get-telemetry', 'reid:get-sessions', 'presence:get-discrepancies', 'iot:get-status', 'iot:trigger', 'biometric:get-status', 'biometric:scan',

      'settings:get', 'settings:save', 'auth:create-user', 'discover-cameras',

      'get-reid-sessions', 'get-sync-status', 'lgpd:get-retention', 'lgpd:set-retention',

      'logout-session', 'reports:attendance', 'search-rag', 'students:add',

      'students:train', 'get-billing-registry', 'get-payment-history', 'get-subscription',

      'reports:export-excel', 'reports:export-pdf', 'get-ai-synthesis',

      'adapt-messenger-content', 'swarm:get-installed-models', 'swarm:deploy-model',

      'export-cold-storage', 'get-action-pills', 'get-attendance-telemetry',

      'security:start-drill', 'security:register-response', 'security:finalize-drill', 'security:semantic-search', 'security:get-network-guard-status', 'security:start-network-guard', 'security:stop-network-guard', 'lgpd:get-records', 'lgpd:check-consent', 'lgpd:record-consent', 'lgpd:export-ripd', 'behavioral:get-metrics', 'hr:get-sovereignty', 'attendance:log', 'parent:update-location', 'affiliate:get-products', 'affiliate:get-stats',

      'energy:get-metrics', 'energy:get-thermal', 'energy:set-eco-mode',

      'neuro:get-pulse', 'neuro:get-trends', 'neuro:get-students', 'neuro:get-recommendation',

      'env:get-room-data', 'env:force-ventilation', 'cognitive:get-alerts', 'process-teacher-audio-log',

      'pedagogical:get-current-class', 'pedagogical:process-audio-report', 'pedagogical:get-recent-reports',

      'schedule:validate', 'schedule:get-optimization', 'schedule:generate-auto', 'schedule:get-teacher-daily',

      'get-student-portfolio', 'get-pedagogical-insights', 'inventory:get-stock', 'nexus:get-state', 'print-badge',

      'visitor:get-recent', 'visitor:register',

      'robotics:get-units', 'robotics:send-command', 'pricing:get-plans', 'pricing:calculate-quote',

      'pricing:calculate-roi', 'pricing:get-config', 'pricing:update-plan', 'integration:sync-students', 'integration:sync-schedules',

      'db:get-students',

      'attendance-audit:getAuditStats',

      'attendance-audit:getHistory',

      'attendance-audit:getSeatingDiscrepancies',

      'attendance-audit:runBatchAudit',

      'attendance-audit:get-history', 'attendance-audit:get-stats', 'attendance-audit:get-validation-status', 'attendance-audit:generate-audit', 'attendance-audit:remediate',

      'finance:get-health-score', 'finance:get-revenue-forecast', 'finance:get-proposals', 'finance:accept-proposal', 'finance:get-records', 'finance:get-contract',

      'inference:dispatch', 'inference:get-tasks', 'inference:get-nodes', 'mesh:get-inference-state',

      'theme:apply', 'theme:get-branding', 'autonomous-action:trigger', 'wifi:get-ghosts',

      'perf:get-metrics', 'rag:index-status', 'rag:search-docs',

      'nexus:get-swarm-history', 'nexus:get-agent-history',

      'audit:get-stats', 'geofence:get-arriving', 'npu:get-load',

      'get-dashboard-stats', 'get-queue-status', 'get-weekly-attendance-summary',

      'pedagogical:upload-file', 'pedagogical:get-materials', 'pedagogical:dismiss-risk', 'pedagogical:complete-task',

      'seating:get-layout', 'seating:get-recommendations', 'seating:save-layout',

      'seating:get-rules', 'seating:save-rule', 'seating:delete-rule',

      'seating:register-behavioral-occurrence', 'seating:validate-presence',

      'notebook:ask', 'ai:vision-analyze', 'ai:search-grounding',

      'cortex:get-health', 'cortex:get-recent-pulse', 'cortex:generate-strategy',

      'governance:get-shield-status', 'governance:get-audit-logs',

      'workflow:get-efficiency', 'workflow:get-maturity',

      'nexus:start-swarm-mission',

      'insight:request-swarm-help', 'global:get-trends', 'global:get-synthesized-pulse',

      'get-exam-bancas', 'get-all-class-targets', 'set-class-target', 'pedagogy:get-student-target', 'pedagogy:get-pulse-history',

      'pedagogical:browse-library', 'pedagogical:toggle-favorite', 'pedagogical:get-collections', 'pedagogical:create-collection', 'pedagogical:assign-collection',

      'pedagogical:search-semantic', 'pedagogical:get-knowledge-map', 'pedagogical:generate-executive-digest',

      'pedagogical:query-swarm', 'pedagogical:get-swarm-cache', 'pedagogical:vouch-for-resource',

      'pedagogical:getEvasionRadar', 'pedagogical:getRiskStats',

      'executive:get-roi', 'executive:get-pulse', 'executive:get-history', 'executive:log-metric', 'executive:get-ai-insights', 'executive:seed-insights',
      'executive:get-narrative', 'executive:review-narrative', 'executive:export-narrative-md',

      'hr:get-staff', 'hr:calculate-payroll', 'hr:get-performance',

      'secretary:generate-transcript',

      'council:list-polls', 'council:cast-vote',

      'system:get-dashboard-stats', 'system:get-weekly-attendance', 'system:get-recent-alerts',

      'budget:get-report', 'identity:get-stats', 'support:get-summary', 'system:lockdown',

      'social:get-graph', 'social:get-at-risk', 'legal:find-articles',

      'ecosystem:get-state', 'ecosystem:update-state', 'ecosystem:toggle-module', 'ecosystem:set-ai-provider',

      'system:get-info', 'wiki:search', 'wiki:get-article', 'companion:get-state', 'navigate', 'get-financial-records',

      'get-student-economy', 'vision:analyze-board', 'lifecycle:get-history',

      'coordination:get-biometric-health',

      'coordination:get-finance-stats',

      'coordination:get-churn-risk',

      'coordination:approve-evolution',

      'coordination:get-system-metabolism',

      'coordination:get-resilience-stats',

      'coordination:get-resilience-logs',

      'coordination:generate-intervention',

      'coordination:update-insight',

      'coordination:get-daily-attendance-summary',

      'coordination:get-evasion-profiles',

      'coordination:get-high-risk-behaviors',

      'coordination:get-settings',

      'coordination:get-security-alerts',

      'coordination:execute-security-protocol',

      'coordination:get-camera-by-id',

      'coordination:get-intervention-dossiers',

      'coordination:get-summary',

      'coordination:resolve-insight',

      'coordination:get-finance-stats',

      'institution:get-profile',

      'pedagogical:get-longitudinal-insight',

      'brain:get-active-tasks',

      'inference:dispatch', 'inference:get-tasks', 'inference:get-nodes', 'mesh:get-inference-state',

      'database:run-structural-check', 'database:test-atomicity',

      'grading:get-assessments', 'grading:save-auto-grade', 'grading:scan-sheet', 'grading:create-assessment',

      'attendance:audit-class', 'attendance:confirm-audit',

      'churn:get-radar', 'attendance:get-stats', 'pedagogical:synthesize-trends',

      'pedagogical:save-trend', 'pedagogical:share-with-parents',

      'finance:calculate-quote', 'finance:calculate-roi', 'whatsapp:get-history',

      'whatsapp:send-billing', 'get-subscription', 'finance:generate-pix',

      'finance:generate-monthly-billing', 'institution:update-profile',

      'secretariat:get-teachers', 'secretariat:create-teacher', 'secretariat:update-teacher', 'secretariat:delete-teacher',

      'secretariat:get-teacher-classes', 'secretariat:link-teacher', 'secretariat:get-subjects', 'secretariat:generate-teacher-card', 'import-schedule-excel', 'export-schedule-template', 'secretariat:save-weights', 'secretariat:get-bulk-boletim', 'secretariat:generate-report-card',

      'teachers:save-attendance', 'tasks:list', 'tasks:create', 'tasks:update', 'tasks:delete', 'teachers:save-daily-report', 'teachers:get-daily-reports', 'coordination:update-report-status',

      'stress:run-benchmark', 'stress:start', 'stress:stop', 'stress:get-status',

      'pedagogy:ask-copilot', 'pedagogy:process-whiteboard',

      'seating:get-active-schedule-for-local-room', 'secretariat:get-students-by-class', 'seating:apply-layout', 'reports:get-bimestral-feedback',

      'batch-import:preview', 'batch-import:confirm', 'playlists:list', 'playlists:save', 'playlists:delete', 'gamemaker:list-templates', 'gamemaker:save-template', 'gamemaker:delete-template', 'essay:submit-and-audit', 'essay:list-by-student', 'essay:get-detail', 'essay:delete', 'applet:get-catalog', 'applet:save-progress', 'applet:get-student-progress', 'turnstile:get-status', 'turnstile:evaluate-access', 'turnstile:manual-bypass', 'turnstile:run-bench-test', 'turnstile:get-telemetry', 'turnstile:set-mode'

    ];





    if (ALLOWED_CHANNELS.includes(channel)) {

      return ipcRenderer.invoke(channel, ...args);

    } else {

      console.error(`[SECURITY ALERT] Tentativa de acesso a canal IPC não autorizado: ${channel}`);

      return Promise.reject(new Error(`Canal IPC não autorizado: ${channel}`));

    }

  },



  // ---- PEDAGOGIA ----

  getPulseHistory: (studentId: string) => ipcRenderer.invoke('pedagogy:get-pulse-history', studentId),



  // ---- INTEGRITY & SOCIAL (Phase 900) ----

  social: {

    getGraph: () => ipcRenderer.invoke('social:get-graph'),

    getAtRisk: () => ipcRenderer.invoke('social:get-at-risk'),

  },

  legal: {

    findArticles: (query: string) => ipcRenderer.invoke('legal:find-articles', { query }),

  },

  

  onIsolationStatus: (callback: (data: { isolated: boolean; reason: string }) => void) => {

    const subscription = (_event: any, data: any) => callback(data);

    ipcRenderer.on('sovereign:isolation:status', subscription);

    return () => ipcRenderer.removeListener('sovereign:isolation:status', subscription);

  },

  // ---- EVOLUTION ----



  // ---- AUDITORIA DE PRESENÇA CIENTÍFICA (Phase 401) ----

  attendance: {

    getAuditHistory: () => ipcRenderer.invoke('attendance-audit:get-history'),

    getAuditStats: () => ipcRenderer.invoke('attendance-audit:get-stats'),

    getValidationStatus: (classId: string) => ipcRenderer.invoke('attendance-audit:get-validation-status', classId),

    generateAudit: (studentId: string, status: boolean) => ipcRenderer.invoke('attendance-audit:generate-audit', studentId, status),

    remediate: (auditId: number, studentId: string, status: boolean) => ipcRenderer.invoke('attendance-audit:remediate', { auditId, studentId, status }),

  },

  pricing: {

    getPlans: () => ipcRenderer.invoke('pricing:get-plans'),

    calculateQuote: (criteria: any) => ipcRenderer.invoke('pricing:calculate-quote', { criteria }),

    calculateROI: (criteria: any) => ipcRenderer.invoke('pricing:calculate-roi', criteria),

    getHealthScore: () => ipcRenderer.invoke('finance:get-health-score'),

    getRevenueForecast: (months: number) => ipcRenderer.invoke('finance:get-revenue-forecast', { months }),

  },

  colab: {

    configureGpu: (url: string) => ipcRenderer.invoke('colab-gpu:configure', url),

    getGpuStatus: () => ipcRenderer.invoke('colab-gpu:get-status'),

    checkGpuHealth: () => ipcRenderer.invoke('colab-gpu:check-health'),

    runGpuBenchmark: (matrixSize?: number) => ipcRenderer.invoke('colab-gpu:benchmark', matrixSize),

    getLearningTrack: (topic: string, studentId?: string) => ipcRenderer.invoke('colab-gpu:get-learning-track', { topic, studentId }),

    listPhetSims: (query?: string) => ipcRenderer.invoke('colab-gpu:list-phet-sims', query),

    generateAgentContent: (agentId: string, prompt: string) => ipcRenderer.invoke('colab-gpu:generate-agent-content', { agentId, prompt }),

    tutorChat: (prompt: string, systemPrompt?: string, maxTokens?: number) => ipcRenderer.invoke('colab-gpu:tutor-chat', { prompt, systemPrompt, maxTokens }),

    resolveQuestion: (question: string) => ipcRenderer.invoke('colab-gpu:resolve-question', question),

    decomposeDifficulty: (subject: string, difficultyDescription: string) => ipcRenderer.invoke('colab-gpu:decompose-difficulty', { subject, difficultyDescription }),

    setEndpoint: (url: string) => ipcRenderer.invoke('colab:set-endpoint', url),

    testConnection: () => ipcRenderer.invoke('colab:test-connection'),

    getStatus: () => ipcRenderer.invoke('colab:get-status'),

  },

  mastery: {

    getScaffolding: (questionId: string) => ipcRenderer.invoke('mastery:get-scaffolding', questionId),

    getBySubject: (subject: string, exam?: string, limit?: number) => ipcRenderer.invoke('mastery:get-by-subject', { subject, exam, limit }),

    getConcepts: (exam?: string, subject?: string) => ipcRenderer.invoke('mastery:get-concepts', { exam, subject }),

    getGpuStatus: () => ipcRenderer.invoke('mastery:get-gpu-status'),

    runGpuTraining: () => ipcRenderer.invoke('mastery:run-gpu-training'),

    diagnoseAndLevel: (questionId: string, failed: boolean) => ipcRenderer.invoke('mastery:diagnose-level', { questionId, failed }),

    generateLiveNvidia: (subject: string, difficulty: string, statement: string) => ipcRenderer.invoke('mastery:generate-nvidia', { subject, difficulty, statement }),

  },

  rpa: {

    getStatus: () => ipcRenderer.invoke('rpa:get-status'),

    getLogs: (limit?: number) => ipcRenderer.invoke('rpa:get-logs', limit),

    syncSigaWeb: (classId?: string, date?: string) => ipcRenderer.invoke('rpa:sync-sigaweb', { classId, date }),

    syncDominio: (startDate?: string, endDate?: string) => ipcRenderer.invoke('rpa:sync-dominio', { startDate, endDate }),

    testConnection: () => ipcRenderer.invoke('rpa:test-connection'),

    saveSigaConfig: (config: any) => ipcRenderer.invoke('rpa:save-siga-config', config),

    saveDominioConfig: (config: any) => ipcRenderer.invoke('rpa:save-dominio-config', config),

  },

  playlists: {

    list: (classId?: string) => ipcRenderer.invoke('playlists:list', classId),

    save: (data: any) => ipcRenderer.invoke('playlists:save', data),

    delete: (id: string) => ipcRenderer.invoke('playlists:delete', id),

  },

  gameMaker: {

    listTemplates: (teacherId?: string) => ipcRenderer.invoke('gamemaker:list-templates', teacherId),

    saveTemplate: (data: any) => ipcRenderer.invoke('gamemaker:save-template', data),

    deleteTemplate: (id: string) => ipcRenderer.invoke('gamemaker:delete-template', id),

  },

  essay: {

    submitAndAudit: (data: any) => ipcRenderer.invoke('essay:submit-and-audit', data),

    listByStudent: (studentId: string) => ipcRenderer.invoke('essay:list-by-student', studentId),

    getDetail: (id: string) => ipcRenderer.invoke('essay:get-detail', id),

    delete: (id: string, studentId?: string) => ipcRenderer.invoke('essay:delete', id, studentId),

  },

  applet: {

    getCatalog: () => ipcRenderer.invoke('applet:get-catalog'),

    saveProgress: (data: any) => ipcRenderer.invoke('applet:save-progress', data),

    getStudentProgress: (studentId: string) => ipcRenderer.invoke('applet:get-student-progress', studentId),

  },

  turnstile: {

    getStatus: () => ipcRenderer.invoke('turnstile:get-status'),

    evaluateAccess: (payload: any) => ipcRenderer.invoke('turnstile:evaluate-access', payload),

    manualBypass: (operatorId: string, studentName: string, reason: string) => ipcRenderer.invoke('turnstile:manual-bypass', operatorId, studentName, reason),

    runBenchTest: (deviceId?: string) => ipcRenderer.invoke('turnstile:run-bench-test', deviceId),

    getTelemetry: (limit?: number) => ipcRenderer.invoke('turnstile:get-telemetry', limit),

    setMode: (mode: any) => ipcRenderer.invoke('turnstile:set-mode', mode),

  },

  batchImport: {

    preview: (payload: any) => ipcRenderer.invoke('batch-import:preview', payload),

    confirm: (payload: any) => ipcRenderer.invoke('batch-import:confirm', payload),

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

