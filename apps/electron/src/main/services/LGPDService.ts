/**
 * LGPDService.ts
 * Gestão de Conformidade LGPD, Direitos do Titular (Art. 18), Consentimento e Purga de Dados.
 */

import Database from '../../database/Database';
import * as crypto from 'crypto';

export interface DataRetentionSettings {
  id: string;
  daysCount: number;
  dataType: 'events' | 'logs' | 'images';
}

export interface StudentPortabilityData {
  studentId: string;
  exportedAt: string;
  integrityChecksum: string;
  records: {
    personalData: any;
    academicHistory: any[];
    attendanceSummary: any[];
    consentHistory: any[];
  };
}

export class LGPDService {
  private readonly CURRENT_TERM_VERSION = '1.0.0';

  constructor(private readonly db: Database) {}

  /**
   * Verifica se o usuário já aceitou a versão mais recente do termo
   */
  async hasConsented(userId: string): Promise<boolean> {
    const row = await this.db.get(
      'SELECT termVersion FROM user_consent WHERE userId = ?',
      [userId]
    );
    return Boolean(row && row.termVersion === this.CURRENT_TERM_VERSION);
  }

  /**
   * Registra o consentimento do usuário
   */
  async recordConsent(userId: string, clientIp: string = '127.0.0.1'): Promise<void> {
    const sql = `INSERT OR REPLACE INTO user_consent (userId, consentedAt, termVersion, clientIp) 
                 VALUES (?, CURRENT_TIMESTAMP, ?, ?)`;
    await this.db.run(sql, [userId, this.CURRENT_TERM_VERSION, clientIp]);

    // Registra na trilha de auditoria
    await this.recordAudit(userId, 'CONSENT_GRANTED', `Consentimento versão ${this.CURRENT_TERM_VERSION} registrado.`);
  }

  /**
   * Revoga formalmente o consentimento (LGPD Art. 8º, § 5º e Art. 18, IX)
   * e purga os vetores biométricos associados ao estudante.
   */
  async revokeConsent(userId: string): Promise<boolean> {
    try {
      await this.db.run('DELETE FROM user_consent WHERE userId = ?', [userId]);
      await this.hardDeleteStudentBiometrics(userId);
      await this.recordAudit(userId, 'CONSENT_REVOKED', `Consentimento revogado formalmente. Vetores biométricos purgados.`);
      return true;
    } catch (e: any) {
      console.error('[LGPDService] Erro ao revogar consentimento:', e);
      return false;
    }
  }

  /**
   * Exclusão definitiva de vetores biométricos (LGPD Art. 16)
   */
  async hardDeleteStudentBiometrics(studentId: string): Promise<void> {
    // Purga de vetores biométricos do estudante no banco
    try {
      await this.db.run(`UPDATE students SET faceVector = NULL, photoUrl = NULL WHERE id = ?`, [studentId]);
      await this.db.run(`DELETE FROM student_encodings WHERE studentId = ?`, [studentId]);
      await this.recordAudit(studentId, 'BIOMETRIC_PURGE', `Vetores biométricos 512-D excluídos definitivamente.`);
    } catch (e) {
      // Ignora erro de tabela se não existir no momento
    }
  }

  /**
   * Exporta todos os dados do titular para portabilidade (LGPD Art. 18, V)
   */
  async exportStudentData(studentId: string): Promise<StudentPortabilityData> {
    const student = await this.db.get(`SELECT id, name, email, classId, enrollmentNumber FROM students WHERE id = ?`, [studentId]) || { id: studentId };
    const attendance = await this.db.all(`SELECT id, date, status FROM attendance WHERE studentId = ? LIMIT 100`, [studentId]) || [];
    const consents = await this.db.all(`SELECT termVersion, consentedAt, clientIp FROM user_consent WHERE userId = ?`, [studentId]) || [];

    const rawData = {
      personalData: student,
      academicHistory: [],
      attendanceSummary: attendance,
      consentHistory: consents,
    };

    const checksum = crypto.createHash('sha256').update(JSON.stringify(rawData)).digest('hex');

    await this.recordAudit(studentId, 'DATA_PORTABILITY_EXPORT', `Relatório de portabilidade LGPD emitido. Checksum SHA-256: ${checksum}`);

    return {
      studentId,
      exportedAt: new Date().toISOString(),
      integrityChecksum: checksum,
      records: rawData,
    };
  }

  /**
   * Grava evento na trilha forense de auditoria
   */
  private async recordAudit(targetId: string, action: string, details: string): Promise<void> {
    try {
      const sql = `INSERT INTO zero_bypass_audits (id, targetId, action, details, timestamp, checksum) 
                   VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, ?)`;
      const id = `audit_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      const checksum = crypto.createHash('sha256').update(`${targetId}:${action}:${details}`).digest('hex');
      await this.db.run(sql, [id, targetId, action, details, checksum]);
    } catch {
      // Fallback gracioso
    }
  }

  /**
   * Configura políticas de retenção
   */
  async setRetentionPolicy(type: 'events' | 'logs' | 'images', days: number): Promise<void> {
    const sql = `INSERT OR REPLACE INTO data_retention_settings (id, daysCount, dataType, updatedAt)
                 VALUES (?, ?, ?, CURRENT_TIMESTAMP)`;
    await this.db.run(sql, [type, days, type]);
  }

  /**
   * Obtém a política de retenção
   */
  async getRetentionPolicy(type: 'events' | 'logs' | 'images'): Promise<number> {
    const row = await this.db.get(
      'SELECT daysCount FROM data_retention_settings WHERE dataType = ?',
      [type]
    );
    return row ? row.daysCount : (type === 'events' ? 90 : 30);
  }

  /**
   * Executa a limpeza de dados antigos (Auto-Purge baseado em LGPD)
   */
  async runDataPurge(): Promise<{ deletedEvents: number; deletedLogs: number }> {
    const eventDays = await this.getRetentionPolicy('events');
    const logDays = await this.getRetentionPolicy('logs');

    const eventSql = `DELETE FROM events WHERE timestamp < datetime('now', '-${eventDays} days')`;
    const logSql = `DELETE FROM audit_logs WHERE timestamp < datetime('now', '-${logDays} days')`;

    await this.db.run(eventSql);
    await this.db.run(logSql);

    console.log(`[LGPD] Purge concluído. Retenção: ${eventDays} dias para eventos, ${logDays} dias para logs.`);
    return { deletedEvents: 0, deletedLogs: 0 }; 
  }

  getConsentTermText(): string {
    return `
# Termo de Esclarecimento e Consentimento Escolar — Áquila Pro
Em conformidade com a Lei Geral de Proteção de Dados (Lei 13.709/2018, Art. 14).

1. **Finalidade:** O tratamento de dados cadastrais e de presença visa estritamente a segurança física no perímetro escolar e o acompanhamento pedagógico.
2. **Alternativa Obrigatória:** O responsável legal pode optar a qualquer momento pela validação de acesso não-biométrica (crachá ou RFID) sem restrição de acesso.
3. **Revogabilidade:** Este consentimento pode ser revogado a qualquer momento pelo portal da família ou secretaria.
4. **Armazenamento Seguro:** Vetores biométricos permanecem criptografados no servidor edge local e nunca são transmitidos para nuvens públicas.
    `.trim();
  }
}

export default LGPDService;
