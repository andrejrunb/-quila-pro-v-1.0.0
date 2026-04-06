import { WhatsAppQueue } from './WhatsAppQueue';
import Database from '../database/Database';

/**
 * WhatsAppReportService.ts — AG-017
 * Automação de relatórios de fechamento para coordenação.
 */
class WhatsAppReportService {
  constructor(
    private readonly db: Database,
    private readonly whatsapp: WhatsAppQueue
  ) {}

  /**
   * Gera e envia o resumo diário.
   */
  public async sendDailySummary(adminPhone: string): Promise<void> {
    console.log('[WhatsAppReport] Gerando resumo diário...');
    
    // Simular busca de métricas do dia
    const dateStr = new Date().toLocaleDateString('pt-BR');
    const stats = {
        present: 145,
        absent: 12,
        alerts: 3
    };

    const message = `🦅 *Áquila Pro: Resumo Diário (${dateStr})* \n\n` +
                   `📊 *Presenças:* ${stats.present}\n` +
                   `❌ *Faltas:* ${stats.absent}\n` +
                   `🚨 *Avisos de Segurança:* ${stats.alerts}\n\n` +
                   `_Relatório gerado automaticamente às ${new Date().toLocaleTimeString('pt-BR')}_`;

    this.whatsapp.enqueue({
      to: adminPhone,
      body: message,
      event_type: 'DAILY_REPORT'
    });
  }
}

export { WhatsAppReportService };
