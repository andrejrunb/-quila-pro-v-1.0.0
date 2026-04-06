import { Database } from '../database/Database';
import { logger } from '../main/logger';
import { pushNotificationService } from './PushNotificationService';

/**
 * ParentWatchdogService (v3465)
 * O elo de confiança entre a Escola Soberana e a Família.
 */
export class ParentWatchdogService {
  private db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  /**
   * Monitora a fila de notificações e prioriza alertas críticos.
   */
  public async monitorCriticalAlerts() {
    logger.info(`[ParentWatchdog] Monitorando fila de alertas críticos.`);

    const pendingCritical = await this.db.all(`
      SELECT * FROM notifications 
      WHERE priority = 'high' AND read = 0 AND type IN ('SECURITY', 'BEHAVIORAL_CRITICAL')
    `);

    for (const alert of pendingCritical) {
      logger.warn(`[ParentWatchdog] 🚨 Alerta crítico pendente para aluno ${alert.studentId}: ${alert.title}`);
      
      // Re-disparar via Push de Alta Prioridade (PushNotificationService)
      await pushNotificationService.sendToRole('PARENT', {
        title: `⚠️ ALERTA URGENTE: ${alert.title}`,
        body: alert.message,
        priority: 'high'
      });

      // Marcar como 'notificado via watchdog'
      await this.db.run(`UPDATE notifications SET treatedAt = CURRENT_TIMESTAMP WHERE id = ?`, [alert.id]);
    }
  }

  /**
   * Envio agendado do 'Portfólio Comportamental' (Ciclo de 15 dias).
   */
  public async sendBiweeklyReport(studentId: string) {
    logger.info(`[ParentWatchdog] Gerando relatório quinzenal para aluno ${studentId}`);
    
    // Aqui integraria com o BehavioralLedgerService para consolidar o 'Vibe Check'
    const reportData = "Consolidado de comportamento, XP e retenção SRS dos últimos 15 dias.";
    
    await pushNotificationService.sendToRole('PARENT', {
      title: '📊 Portfólio Áquila: Resumo de 15 dias',
      body: `O resumo de desempenho do seu filho está disponível no App.`,
      priority: 'normal'
    });
  }
}
