import Database from '../../database/Database';
import { logger } from '../logger';
import { GenerativeAIService } from './GenerativeAIService';
import { attendanceCalculator } from './AttendanceCalculator';
import { sovereignFirewall } from './SovereignFirewallService';
import { v4 as uuidv4 } from 'uuid';

/**
 * ParentalAdvisorService (Phase 1100)
 * Geração de relatórios agênticos e seguros para os pais (Parent Bridge).
 */
export class ParentalAdvisorService {
  private static instance: ParentalAdvisorService;
  private db: Database;
  private ai: GenerativeAIService;

  private constructor() {
    this.db = Database.getInstance();
    this.ai = new GenerativeAIService(this.db, attendanceCalculator);
  }

  public static getInstance(): ParentalAdvisorService {
    if (!ParentalAdvisorService.instance) {
      ParentalAdvisorService.instance = new ParentalAdvisorService();
    }
    return ParentalAdvisorService.instance;
  }

  /**
   * Gera um relatório consolidado de progresso sociopedagógico.
   */
  public async generateReport(studentId: string, periodDays: number = 30) {
    logger.info(`[ParentBridge] Gerando advisor report para aluno: ${studentId}`);

    try {
      // 1. Coleta de Evidências (Soberania de Dados)
      const evidence = await this.db.get(`SELECT * FROM student_evidence_dossier WHERE student_id = ?`, [studentId]);
      const attendance = await this.db.all(`SELECT * FROM attendance WHERE studentId = ? AND date > date('now', '-? days')`, [studentId, periodDays]);
      const resources = await this.db.all(`SELECT title FROM pedagogical_resources WHERE studentId = ? OR classId IN (SELECT classId FROM students WHERE id = ?)`, [studentId, studentId]);

      // 2. Síntese via IA Soberana
      const context = {
        incidents: evidence?.incident_count || 0,
        severity: evidence?.severity_level || 'LOW',
        presence: attendance.length > 0 ? (attendance.filter(a => a.status === 'present').length / attendance.length) * 100 : 100,
        learningTopics: resources.map(r => r.title).slice(0, 5)
      };

      const prompt = `Gere um relatório acolhedor e profissional para os pais baseado nos dados: ${JSON.stringify(context)}. 
      FOCO: Destaque o que o aluno está aprendendo e como os pais podem apoiar o desenvolvimento socioemocional em casa. 
      NÃO use jargões técnicos excessivos.`;

      const aiResponse = await this.ai.chatWithSovereignContext(prompt);

      // 3. Assinatura Digital (Security Shield)
      const reportId = uuidv4();
      const reportContent = aiResponse.content;
      const signature = sovereignFirewall.signPacket({
        id: reportId,
        sourceNode: 'nexus_alpha',
        timestamp: Date.now(),
        payloadType: 'PARENT_REPORT',
        payload: { content: reportContent },
        securityLevel: 'high_sovereignty'
      });

      // 4. Persistência
      await this.db.run(`
        INSERT INTO notifications (id, type, title, message, priority, studentId, timestamp)
        VALUES (?, 'PARENT_ADVISORY', ?, ?, 'medium', ?, CURRENT_TIMESTAMP)
      `, [
        reportId,
        `Relatório de Progresso Acadêmico`,
        `${reportContent}\n\n[Assinatura Digital: ${signature}]`,
        studentId
      ]);

      return { success: true, report: reportContent, signature, reportId };

    } catch (err) {
      logger.error(`[ParentBridge] Falha ao gerar relatório: ${err}`);
      throw err;
    }
  }

  /**
   * Envia um relatório aprovado via WhatsApp.
   */
  public async sendReportToWhatsApp(studentId: string, reportContent: string) {
    try {
      const student = await this.db.get(`SELECT parentPhone FROM students WHERE id = ?`, [studentId]);
      
      if (!student || !student.parentPhone) {
        throw new Error("Telefone do responsável não cadastrado para este aluno.");
      }

      const { whatsappService } = await import('./WhatsAppService');
      await whatsappService.sendToParent(student.parentPhone, reportContent);

      return { success: true };
    } catch (err) {
      logger.error(`[ParentBridge] Erro ao enviar WhatsApp: ${err}`);
      throw err;
    }
  }
}

export const parentalAdvisorService = ParentalAdvisorService.getInstance();
