import Database from '../../database/Database';
import { SecurityService } from './SecurityService';

/**
 * AuditLogService.ts — Passo 18 do Roadmap (LGPD Audit).
 * Registra acessos a dados sensíveis para fins de conformidade legal.
 */
export class AuditLogService {
  constructor(private db: Database, private security: SecurityService) {}

  /**
   * Registra um acesso a biometria ou dados de identificação.
   */
  public async logAccess(userId: string, studentId: string, action: string, reason: string): Promise<void> {
    const timestamp = new Date().toISOString();
    const entry = {
      userId,
      studentId,
      action,
      reason,
      timestamp,
      ip: '127.0.0.1',
      resource: 'BiometricTemplate_V1', // Step 80: Granularidade
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : `NodeJS-${process.platform}-${process.arch}`
    };

    console.log(`[AUDIT] User ${userId} accessed student ${studentId} for ${action}.`);
    
    // Persistir no banco em tabela de auditoria (Criptografada se necessário)
    await (this.db as any).createAuditEntry(entry);
  }

  /**
   * Gera relatório de auditoria para o DPO.
   */
  public async generateDPOReport(studentId?: string): Promise<any[]> {
    return await (this.db as any).getAuditLogs(studentId);
  }
}

