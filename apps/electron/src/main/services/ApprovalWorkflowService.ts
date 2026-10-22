import Database, { db } from '../../database/Database';
import { logger } from '../logger';

export interface PendingContent {
  id: string;
  senderId: string;
  studentId?: string;
  type: 'MESSAGE' | 'TASK' | 'INCIDENT';
  draft: string;
  metadata?: any;
}

/**
 * ApprovalWorkflowService (v3458)
 * Garante que a I.A. seja um assistente e não o decisor final.
 */
export class ApprovalWorkflowService {
  private db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  /**
   * Adiciona um conteúdo gerado pela I.A. à fila de aprovação.
   */
  public async enqueueContent(content: Omit<PendingContent, 'id'>) {
    const id = `pend-${Date.now()}`;
    logger.info(`[Approval] Enfileirando conteúdo do tipo ${content.type} de ${content.senderId}`);

    const query = `
      INSERT INTO communication_approvals (id, senderId, studentId, title, message, status)
      VALUES (?, ?, ?, ?, ?, 'pending')
    `;

    await this.db.run(query, [
      id,
      content.senderId,
      content.studentId || null,
      content.type,
      content.draft
    ]);

    return id;
  }

  /**
   * Aprova e dispara o conteúdo original.
   */
  public async approve(id: string, approverId: string) {
    logger.info(`[Approval] Conteúdo ${id} APROVADO por ${approverId}`);

    const query = `
      UPDATE communication_approvals 
      SET status = 'approved', approvedAt = CURRENT_TIMESTAMP, approvedBy = ?
      WHERE id = ?
    `;

    await this.db.run(query, [approverId, id]);

    // Buscar o conteúdo para disparo real
    const content = await this.db.get(`SELECT message, studentId, senderId FROM communication_approvals WHERE id = ?`, [id]);
    
    if (content) {
      // Aqui integraria com o EagleMessengerService Real-Time
      logger.info(`[Approval] Disparando mensagem final para ${content.studentId}`);
    }

    return true;
  }

  /**
   * Rejeita o conteúdo com feedback.
   */
  public async reject(id: string, feedback: string) {
    logger.warn(`[Approval] Conteúdo ${id} REJEITADO: ${feedback}`);
    
    const query = `UPDATE communication_approvals SET status = 'rejected' WHERE id = ?`;
    await this.db.run(query, [id]);
  }
}

export const approvalWorkflowService = new ApprovalWorkflowService(db);
