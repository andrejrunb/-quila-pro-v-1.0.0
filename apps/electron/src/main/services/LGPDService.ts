/**
 * LGPDService.ts
 * Gestão de Conformidade LGPD, Termos de Uso e Retenção de Dados.
 */

import Database from '../../database/Database';

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
# Política de Privacidade: Ecossistema Áquila Pro (v1.5.0)

A Áquila Pro preza pela transparência e soberania dos dados. Esta política descreve como tratamos informações sensíveis de alunos, funcionários e responsáveis.

1. **Coleta e Finalidade**:
   Coletamos dados biométricos faciais (pontos nodais/embeddings, não imagens brutas persistentes) exclusivamente para Segurança Escolar (Controle de Acesso) e Pedagogia (Chamada Inteligente).

2. **Soberania Local Absoluta**:
   Os dados de reconhecimento facial são processados e armazenados no **Áquila Edge Hub** físico dentro da unidade escolar. Nenhum embedding biométrico é enviado para servidores em nuvem ou bancos de dados externos.

3. **Bases Legais (LGPD)**:
   - Consentimento: Base primária para tratamento de dados de menores (Art. 14).
   - Proteção da Vida: Art. 7, VII, para garantir a segurança no perímetro escolar.

4. **Seus Direitos**:
   Conforme o Art. 18 da LGPD, você tem direito ao acesso, correção e exclusão imediata de seus dados biométricos enviando uma solicitação à Secretaria Escolar.

Ao clicar em "Concordar", você declara estar ciente e de acordo com o processamento soberano de dados.
    `.trim();
  }
}

export default LGPDService;

