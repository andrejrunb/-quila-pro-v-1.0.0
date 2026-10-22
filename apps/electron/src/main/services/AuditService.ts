import Database, { db } from '../../database/Database';

/**
 * AuditService.ts — Gestão de Logs de Auditoria (v1605)
 * Garante uma trilha imutável de ações operacionais e sistêmicas.
 */
export class AuditService {
  constructor(private readonly db: Database) {}

  /**
   * Registra uma ação realizada no sistema.
   * @param userId ID do usuário que realizou a ação
   * @param action Tipo da ação (ex: TREAT_INCIDENT, LOGIN, LOGOUT)
   * @param reason Descrição ou motivo da ação
   * @param payload Metadados adicionais em formato JSON
   */
  async logAction(userId: string, action: string, reason: string, payload?: any): Promise<void> {
    try {
      await this.db.logAudit(userId, action, reason, payload);
      
      // Se for uma ação crítica (ex: tratamento de incidente), enviamos para o outbox para sincronização em nuvem (v1606)
      if (['TREAT_INCIDENT', 'LOGIN_FAILURE', 'SECURITY_OVERRIDE'].includes(action)) {
         await this.db.addOutboxItem(`AUDIT_${action}`, {
           userId,
           reason,
           payload,
           timestamp: new Date().toISOString()
         });
      }
      
      console.log(`[AuditService] Ação registrada: ${action} por ${userId}`);
    } catch (err) {
      console.error('[AuditService] Erro ao registrar log de auditoria:', err);
    }
  }

  /**
   * Obtém os logs mais recentes para exibição no painel de governança.
   */
  async getRecentLogs(limit = 100): Promise<any[]> {
    return this.db.getRecentUsage(limit);
  }
}

