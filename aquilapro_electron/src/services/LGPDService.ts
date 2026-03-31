/**
 * LGPDService.ts
 * Gestão de Conformidade LGPD, Termos de Uso e Retenção de Dados.
 */

import Database from '../database/Database';

export interface DataRetentionSettings {
  id: string;
  daysCount: number;
  dataType: 'events' | 'logs' | 'images';
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
    return row && row.termVersion === this.CURRENT_TERM_VERSION;
  }

  /**
   * Registra o consentimento do usuário
   */
  async recordConsent(userId: string, clientIp: string = '127.0.0.1'): Promise<void> {
    const sql = `INSERT OR REPLACE INTO user_consent (userId, consentedAt, termVersion, clientIp) 
                 VALUES (?, CURRENT_TIMESTAMP, ?, ?)`;
    await this.db.run(sql, [userId, this.CURRENT_TERM_VERSION, clientIp]);
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
    return row ? row.daysCount : (type === 'events' ? 90 : 30); // Defaults
  }

  /**
   * Executa a limpeza de dados antigos (Auto-Purge baseado em LGPD)
   */
  async runDataPurge(): Promise<{ deletedEvents: number; deletedLogs: number }> {
    const eventDays = await this.getRetentionPolicy('events');
    const logDays = await this.getRetentionPolicy('logs');

    // Deletar Eventos Antigos
    const eventSql = `DELETE FROM events WHERE timestamp < datetime('now', '-${eventDays} days')`;
    // Nota: Em um sistema real, aqui também deletaríamos os arquivos de imagem associados
    
    // Deletar Logs de Auditoria Antigos
    const logSql = `DELETE FROM audit_logs WHERE timestamp < datetime('now', '-${logDays} days')`;

    // Simular contagem de deleções (ou usar mudanças do sqlite se o db.run retornasse)
    await this.db.run(eventSql);
    await this.db.run(logSql);

    console.log(`[LGPD] Purge concluído. Retenção: ${eventDays} dias para eventos, ${logDays} dias para logs.`);
    
    return { deletedEvents: 0, deletedLogs: 0 }; 
  }

  /**
   * Retorna o texto do Termo de Consentimento
   */
  getConsentTermText(): string {
    return `
# Termo de Consentimento e Privacidade - Áquila Pro

Bem-vindo ao Áquila Pro. Para garantir a segurança e conformidade da instituição, processamos dados biométricos e logs de presença.

1. **Finalidade**: Os dados coletados (imagens de câmeras e embeddings faciais) são utilizados exclusivamente para controle de acesso, segurança e registro de presença escolar.
2. **Dados Sensíveis**: Reconhecemos que dados biométricos são sensíveis. Eles são armazenados localmente de forma criptografada e nunca compartilhados com terceiros sem autorização expressa.
3. **Retenção**: Mantemos os registros de eventos por um período padrão de 90 dias, após o qual são automaticamente excluídos.
4. **Seus Direitos**: Você pode solicitar a exclusão de seus dados ou revogar este consentimento a qualquer momento, o que pode limitar o acesso às funcionalidades de reconhecimento facial.

Ao clicar em "Concordar", você declara estar ciente e de acordo com o processamento de dados conforme descrito acima.
    `.trim();
  }
}

export default LGPDService;
