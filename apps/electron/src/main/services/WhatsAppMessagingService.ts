import { Database } from '../../database/Database';
import { logger } from '../logger';

export interface WhatsAppMessage {
  id: string;
  recipientId: string;
  recipientName: string;
  recipientPhone: string;
  content: string;
  status: 'pending' | 'sent' | 'failed';
  type: 'billing' | 'attendance' | 'security';
  createdAt: string;
}

export class WhatsAppMessagingService {
  constructor(private db: Database) {}

  /**
   * Envia uma mensagem de cobrança baseada em um template.
   */
  public async queueBillingMessage(studentId: string, amount: number, dueDate: string, pixCode?: string) {
    try {
      const student = await this.db.get('SELECT name, metadata FROM students WHERE id = ?', [studentId]);
      if (!student) throw new Error('Estudante não encontrado');

      const metadata = JSON.parse(student.metadata || '{}');
      const phone = metadata.parentPhone || '5500000000000'; // Fallback
      
      const content = `Olá ${student.name}, lembramos que a mensalidade de ${amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} vence em ${dueDate}. Para facilitar, utilize o PIX abaixo: \n\n${pixCode || 'CHAVE-PIX-EXEMPLO'}`;

      const messageId = `MSG-${Date.now()}`;
      
      // No mundo real, isso iria para uma tabela de fila ou API externa.
      // Por enquanto, simulamos o armazenamento na memória ou log para visualização no dashboard.
      logger.info(`[WhatsApp] Mensagem enfileirada para ${student.name}: ${content}`);

      return { success: true, messageId };
    } catch (err) {
      logger.error('[WhatsApp] Erro ao enfileirar mensagem:', err);
      return { success: false, error: (err as Error).message };
    }
  }

  /**
   * Envia uma mensagem genérica de WhatsApp.
   */
  public async sendMessage(phone: string, content: string, type: string = 'pedagogical') {
    try {
      const messageId = `MSG-${Date.now()}`;
      // Log for audit/simulation as requested in Sovereign OS pattern
      logger.info(`[WhatsApp] Mensagem enviada para ${phone} (Tipo: ${type}): ${content}`);
      
      // In production, this would call a real WhatsApp API Gateway
      return { success: true, messageId };
    } catch (err) {
      logger.error('[WhatsApp] Erro ao enviar mensagem:', err);
      return { success: false, error: (err as Error).message };
    }
  }

  /**
   * Retorna a fila de mensagens pendentes/recentes para o dashboard.
   */
  public async getMessageHistory() {
    // Mocking history for UI development until we have a dedicated table
    return [
      { id: '1', recipientName: 'André Santos', type: 'billing', status: 'sent', createdAt: new Date().toISOString() },
      { id: '2', recipientName: 'Beatriz Lima', type: 'billing', status: 'pending', createdAt: new Date().toISOString() },
    ];
  }
}

export default WhatsAppMessagingService;
