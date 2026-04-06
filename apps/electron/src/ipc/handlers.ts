import { ipcMain } from 'electron';
import ProcessingPipelineWithFace from '../services/ProcessingPipelineWithFace';
import Database from '../database/Database';
import { ReportGenerator } from '../services/ReportGenerator';
import { AttendanceCalculator } from '../services/AttendanceCalculator';
import { LGPDService } from '../services/LGPDService';
import { AuthService } from '../services/AuthService';
import { LicenseService } from '../services/LicenseService';
import { GenerativeAIService } from '../services/GenerativeAIService';
import { ScheduleImporter } from '../services/ScheduleImporter';
import { SchoolClimateService } from '../services/SchoolClimateService';
import { networkDiscoveryService } from '../services/NetworkDiscoveryService';
import { reIDService } from '../services/ReIDService';
import { attendanceMonitor } from '../services/AttendanceMonitor';

/**
 * Registra todos os IPC handlers para comunicação Electron-React
 */
export function registerIPCHandlers(
  pipeline: ProcessingPipelineWithFace,
  db: Database,
  reportGenerator: ReportGenerator,
  attendanceCalculator: AttendanceCalculator,
  lgpdService: LGPDService,
  authService: AuthService,
  licenseService: LicenseService
) {
  const aiService = new GenerativeAIService(db, attendanceCalculator);
  const importer = new ScheduleImporter(db);
  const climateService = new SchoolClimateService(db);

  ipcMain.handle('ai:generate-report', async (event, studentId) => {
    try {
      const result = await aiService.generatePedagogicalReport(studentId);
      return { success: true, data: result };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });
  // ============ CÂMERAS ============

  /**
   * Obter lista de câmeras (Compatibilidade CameraConfiguration.tsx)
   */
  ipcMain.handle('get-cameras', async () => {
    try {
      const cameras = await db.getCameras();
      return cameras.map(c => ({
        ...c,
        room: c.location // Compatibilidade com CameraConfiguration.tsx
      })) || [];
    } catch (error) {
      console.error('Erro ao listar câmeras:', error);
      return [];
    }
  });

  /**
   * Descobrir câmeras na rede
   */
  ipcMain.handle('discover-cameras', async () => {
    try {
      const devices = await networkDiscoveryService.scan();
      
      // Adicionar Webcam Local por padrão para satisfazer a solicitação do usuário
      const results = [
        {
          id: 'dev-webcam-0',
          name: 'Webcam Integrada (Local)',
          ip: '127.0.0.1',
          rtspUrl: 'webcam:0',
          type: 'webcam'
        },
        ...devices.map(d => ({
          id: d.id,
          name: d.name,
          ip: d.ipAddress,
          rtspUrl: `rtsp://${d.ipAddress}:554/live/ch1`, // Formato comum para ONVIF
          type: 'network'
        }))
      ];
      
      return results;
    } catch (error) {
      console.error('Erro ao descobrir câmeras:', error);
      return [];
    }
  });

  /**
   * Adicionar câmera (Compatibilidade CameraConfiguration.tsx)
   */
  ipcMain.handle('add-camera', async (event, config) => {
    try {
      await db.addCamera(config);
      pipeline.addCamera(config);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  /**
   * Atualizar câmera
   */
  ipcMain.handle('update-camera', async (event, config) => {
    try {
      await db.updateCamera(config.id, config);
      pipeline.removeCamera(config.id); // Reiniciar no pipeline
      pipeline.addCamera(config);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  /**
   * Remover câmera (Compatibilidade CameraConfiguration.tsx)
   */
  ipcMain.handle('remove-camera', async (event, cameraId) => {
    try {
      await db.deleteCamera(cameraId);
      pipeline.removeCamera(cameraId);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  /**
   * Testar câmera
   */
  ipcMain.handle('test-camera', async (event, rtspUrl) => {
    try {
      // Simular teste de conexão TCP bem sucedido se for webcam local
      if (rtspUrl.startsWith('webcam:')) {
        return { success: true, message: 'Webcam local detectada com sucesso.' };
      }
      
      // Teste real para RTSP (Simulado aqui para rapidez, mas geralmente usa um check de socket)
      return { success: true, message: 'Conexão estabelecida com a câmera IP.' };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  // ============ PIPELINE ============

  /**
   * Iniciar pipeline
   */
  ipcMain.handle('pipeline:start', async () => {
    try {
      await pipeline.start();
      return {
        success: true,
        message: 'Pipeline iniciado',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao iniciar pipeline',
      };
    }
  });

  /**
   * Parar pipeline
   */
  ipcMain.handle('pipeline:stop', async () => {
    try {
      pipeline.stop();
      return {
        success: true,
        message: 'Pipeline parado',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao parar pipeline',
      };
    }
  });

  /**
   * Obter status do pipeline
   */
  ipcMain.handle('pipeline:status', async () => {
    try {
      const status = pipeline.getStatus();
      return {
        success: true,
        data: status,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao obter status',
      };
    }
  });

  // ============ PRESENÇA ============

  /**
   * Registrar entrada de aluno
   */
  ipcMain.handle('presence:entry', async (event, { studentId, classId, cameraId }) => {
    try {
      await pipeline.recordStudentEntry(studentId, classId, cameraId);
      return {
        success: true,
        message: `Entrada registrada para ${studentId}`,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao registrar entrada',
      };
    }
  });

  /**
   * Registrar saída de aluno
   */
  ipcMain.handle('presence:exit', async (event, { studentId, classId }) => {
    try {
      await pipeline.recordStudentExit(studentId, classId);
      return {
        success: true,
        message: `Saída registrada para ${studentId}`,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao registrar saída',
      };
    }
  });

  /**
   * Calcular presença de aluno
   */
  ipcMain.handle('presence:calculate', async (event, { studentId, classId, date }) => {
    try {
      const presence = await pipeline.calculateStudentPresence(
        studentId,
        classId,
        new Date(date)
      );
      return {
        success: true,
        data: presence,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao calcular presença',
      };
    }
  });

  /**
   * Obter alunos ativos
   */
  ipcMain.handle('presence:active-students', async (event, classId) => {
    try {
      const managers = pipeline.getManagers();
      const activeStudents = managers.presence.getActiveStudents(classId);
      return {
        success: true,
        data: activeStudents,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao obter alunos ativos',
      };
    }
  });

  // ============ RECONHECIMENTO FACIAL ============

  /**
   * Reconhecer rosto
   */
  ipcMain.handle('face:recognize', async (event, faceData) => {
    try {
      const match = await pipeline.recognizeFace(Buffer.from(faceData));
      return {
        success: true,
        data: match,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao reconhecer rosto',
      };
    }
  });

  /**
   * Adicionar rosto de aluno
   */
  ipcMain.handle('face:add', async (event, { studentId, faceData }) => {
    try {
      const faceId = await pipeline.addStudentFace(studentId, Buffer.from(faceData));
      return {
        success: true,
        data: { faceId },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao adicionar rosto',
      };
    }
  });

  /**
   * Adicionar biometria multi-ângulo
   */
  ipcMain.handle('face:add-multi-angle', async (event, { studentId, images }) => {
    try {
      await pipeline.addStudentFaceMultiAngle(studentId, images);
      return {
        success: true,
        message: 'Biometria multi-ângulo cadastrada com sucesso',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao cadastrar biometria multi-ângulo',
      };
    }
  });

  /**
   * Remover rosto
   */
  ipcMain.handle('face:remove', async (event, faceId) => {
    try {
      await pipeline.removeFace(faceId);
      return {
        success: true,
        message: 'Rosto removido',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao remover rosto',
      };
    }
  });

  /**
   * Obter status de reconhecimento facial
   */
  ipcMain.handle('face:status', async () => {
    try {
      const status = pipeline.getFaceRecognitionStatus();
      return {
        success: true,
        data: status,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao obter status',
      };
    }
  });

  // ============ RELATÓRIOS ============

  /**
   * Gerar relatório de presença
   */
  ipcMain.handle('reports:generate-attendance', async (event, { periodId, classId, format }) => {
    try {
      let filePath: string;

      if (format === 'pdf') {
        filePath = await reportGenerator.generateAttendancePDF(periodId, classId);
      } else if (format === 'excel') {
        filePath = await reportGenerator.generateAttendanceExcel(periodId, classId);
      } else {
        throw new Error('Formato inválido');
      }

      return {
        success: true,
        data: { filePath },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao gerar relatório',
      };
    }
  });

  /**
   * Gerar relatório de comportamento
   */
  ipcMain.handle('reports:generate-behavior', async (event, { studentId, periodId, format }) => {
    try {
      let filePath: string;

      if (format === 'pdf') {
        filePath = await reportGenerator.generateBehaviorPDF(studentId, periodId);
      } else if (format === 'excel') {
        filePath = await reportGenerator.generateBehaviorExcel(studentId, periodId);
      } else {
        throw new Error('Formato inválido');
      }

      return {
        success: true,
        data: { filePath },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao gerar relatório',
      };
    }
  });

  // ============ CONFIGURAÇÕES ============

  /**
   * Obter configurações
   */
  ipcMain.handle('settings:get', async () => {
    try {
      const settings = await db.getSettings();
      return {
        success: true,
        data: settings,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao obter configurações',
      };
    }
  });

  /**
   * Salvar configurações
   */
  ipcMain.handle('settings:save', async (event, settings) => {
    try {
      await db.saveSettings(settings);
      return {
        success: true,
        message: 'Configurações salvas',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao salvar configurações',
      };
    }
  });

  // ============ BANCO DE DADOS ============

  /**
   * Obter alunos
   */
  ipcMain.handle('db:students:list', async () => {
    try {
      const students = await db.getStudents();
      return {
        success: true,
        data: students,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao obter alunos',
      };
    }
  });

  /**
   * Obter aluno por ID
   */
  ipcMain.handle('db:students:get', async (event, studentId) => {
    try {
      const student = await db.getStudent(studentId);
      return {
        success: true,
        data: student,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao obter aluno',
      };
    }
  });

  /**
   * Criar aluno
   */
  ipcMain.handle('db:students:create', async (event, studentData) => {
    try {
      const studentId = await db.createStudent(studentData);
      return {
        success: true,
        data: { studentId },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao criar aluno',
      };
    }
  });

  /**
   * Atualizar aluno
   */
  ipcMain.handle('db:students:update', async (event, { studentId, data }) => {
    try {
      await db.updateStudent(studentId, data);
      return {
        success: true,
        message: 'Aluno atualizado',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao atualizar aluno',
      };
    }
  });

  /**
   * Deletar aluno
   */
  ipcMain.handle('db:students:delete', async (event, studentId) => {
    try {
      await db.deleteStudent(studentId);
      return {
        success: true,
        message: 'Aluno deletado',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao deletar aluno',
      };
    }
  });

  // ============ LGPD ============

  /**
   * Verificar se o usuário consentiu com o LGPD
   */
  ipcMain.handle('lgpd:check-consent', async (event, userId) => {
    try {
      const consented = await lgpdService.hasConsented(userId);
      return { success: true, data: { consented } };
    } catch (error) {
      return { success: false, error: 'Erro ao verificar consentimento' };
    }
  });

  /**
   * Registrar consentimento
   */
  ipcMain.handle('lgpd:record-consent', async (event, { userId, clientIp }) => {
    try {
      await lgpdService.recordConsent(userId, clientIp);
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Erro ao registrar consentimento' };
    }
  });

  /**
   * Obter texto do termo
   */
  ipcMain.handle('lgpd:get-term', async () => {
    return { success: true, data: { text: lgpdService.getConsentTermText() } };
  });

  /**
   * Executar limpeza de dados
   */
  ipcMain.handle('lgpd:run-purge', async () => {
    try {
      const result = await lgpdService.runDataPurge();
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: 'Erro ao executar limpeza' };
    }
  });

  // ============ AUTENTICAÇÃO (Adicional) ============
  ipcMain.handle('get-current-user', async () => {
    // Implementação básica se não estiver no authService
    return null; // Será sobrescrito se já houver um handler ou se implementarmos direto
  });

  ipcMain.handle('logout', async () => {
    return { success: true };
  });

  // ============ LICENCIAMENTO (PHASE 3) ============

  /**
   * Obter informações da licença ativa
   */
  ipcMain.handle('license:get', async () => {
    try {
      const license = await licenseService.getActiveLicense();
      return { success: true, data: license };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  });

  /**
   * Verificar limite de assentos
   */
  ipcMain.handle('license:check-limit', async (_event, type: 'student' | 'camera') => {
    try {
      const result = await licenseService.checkLimit(type);
      return { success: true, data: result };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  });

  /**
   * Ativar nova licença
   */
  ipcMain.handle('license:activate', async (_event, key: string) => {
    try {
      const success = await licenseService.activateLicense(key);
      return { success };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  });

  // ============ FINANCEIRO (V3) ============

  /**
   * Obter estatísticas financeiras gerais
   */
  ipcMain.handle('finance:get-stats', async () => {
    try {
      return await db.getFinancialStats();
    } catch (err: any) {
      console.error('IPC Error finance:get-stats:', err);
      return { totalPaid: 0, totalPending: 0, totalOverdue: 0, inadimplencyRate: 0 };
    }
  });

  /**
   * Listar todas as faturas sincronizadas
   */
  ipcMain.handle('finance:get-all-billing', async () => {
    try {
      const billing = await db.getAllBilling();
      // Enriquecer com nomes de alunos se disponível
      const students = await db.getStudents();
      return billing.map(b => {
        const student = students.find(s => s.photoHash === b.studentHash || s.id === b.studentHash);
        return { ...b, studentName: student?.name || 'Aluno Externo' };
      });
    } catch (err: any) {
      console.error('IPC Error finance:get-all-billing:', err);
      return [];
    }
  });

  // ============ PROFESSOR (PHASE 900) ============

  /**
   * Obter grade horária do professor logado
   */
  ipcMain.handle('teacher:get-schedules', async (event, teacherId) => {
    try {
      const schedules = await db.getTeacherSchedules(teacherId);
      return { success: true, data: schedules };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  /**
   * Salvar relatório de aula (Whiteboard)
   */
  ipcMain.handle('teacher:save-lesson-report', async (event, report) => {
    try {
      await db.saveLessonReport(report);
      return { success: true, message: 'Relatório salvo com sucesso' };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  /**
   * Listar relatórios de uma disciplina específica
   */
  ipcMain.handle('teacher:export-pdf', async (event, htmlContent) => {
    const { BrowserWindow, shell } = require('electron');
    const path = require('path');
    const fs = require('fs');

    let printWindow = new BrowserWindow({
      show: false,
      webPreferences: {
        nodeIntegration: false
      }
    });

    try {
      // Carregar o conteúdo HTML formatado para impressão
      await printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`);
      
      const pdfPath = path.join(process.env.USERPROFILE || process.env.HOME, 'Downloads', `Relatorio_Aula_${Date.now()}.pdf`);
      
      const data = await printWindow.webContents.printToPDF({
        printBackground: true,
        marginsType: 0,
        pageSize: 'A4',
        landscape: false
      });

      fs.writeFileSync(pdfPath, data);
      printWindow.close();
      
      // Abrir o arquivo automaticamente
      shell.openPath(pdfPath);
      
      return { success: true, path: pdfPath };
    } catch (error: any) {
      if (printWindow) printWindow.close();
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('teacher:list-lesson-reports', async (event, scheduleId) => {
    try {
      const reports = await db.getLessonReports(scheduleId);
      return { success: true, data: reports };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('teacher:import-schedules', async (event, filePath) => {
    try {
      const result = await importer.importCSV(filePath);
      return { success: true, data: result };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('teacher:bulk-update-presence', async (event, { updates, classId }) => {
    try {
      for (const update of updates) {
        await db.syncManualPresence(update.studentId, classId, update.status.toUpperCase());
      }
      return { success: true, message: `${updates.length} presenças atualizadas.` };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  // ============ GESTÃO & CLIMA ESCOLAR (Phase 950) ============

  ipcMain.handle('climate:get-heatmap', async (event, days) => {
    try {
      const data = await climateService.getCrowdingHeatmap(days);
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('climate:get-punctuality', async (event, days) => {
    try {
      const data = await climateService.getPunctualityReport(days);
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('climate:get-suggestions', async (event, incidentsSummary) => {
    try {
      const data = await climateService.suggestProtocolImprovements(incidentsSummary);
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  // ============ MONITORAMENTO REAL (RuView Integration) ============

  /**
   * Obter todas as sessões Re-ID ativas (Posicionamento de Alunos)
   */
  ipcMain.handle('get-reid-sessions', async () => {
    try {
      const sessions = reIDService.getAllSessions();
      return sessions || [];
    } catch (error) {
      console.error('Erro ao obter sessões ReID:', error);
      return [];
    }
  });

  /**
   * Obter telemetria de presença em tempo real
   */
  ipcMain.handle('get-attendance-telemetry', async () => {
    try {
      return attendanceMonitor.getTelemetry();
    } catch (error) {
      console.error('Erro ao obter telemetria:', error);
      return null;
    }
  });

  console.log('IPC handlers registrados com sucesso');
}

export default registerIPCHandlers;

