import { randomUUID } from 'crypto';
import Database from '../Database';
import { SmartMessage } from '../../services/AiTypes';

/**
 * MessageRepository (v3461)
 * Gerencia a persistência de mensagens do EagleMessenger para resiliência de enxame.
 */
export class MessageRepository {
  constructor(private readonly db: Database) {}

  /**
   * Salva uma nova mensagem inteligente no buffer persistente.
   */
  async saveMessage(message: SmartMessage): Promise<void> {
    const updatedAt = new Date().toISOString();
    
    await this.db.run(
      `INSERT INTO smart_messages (
        id, senderId, senderRole, recipientId, originalContent, 
        adaptedContent, status, priority, timestamp, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        message.id || randomUUID(),
        message.senderId,
        message.senderRole,
        message.recipientId || 'broadcast',
        message.originalContent,
        message.adaptedContent,
        message.status || 'pending',
        message.priority || 1,
        new Date(message.timestamp).toISOString(),
        updatedAt
      ]
    );
  }

  /**
   * Recupera mensagens pendentes ou falhas para retentativa, priorizando as mais críticas.
   */
  async getPendingMessages(limit: number = 20): Promise<SmartMessage[]> {
    const rows = await this.db.all(
      `SELECT * FROM smart_messages 
       WHERE status IN ('pending', 'failed')
       ORDER BY priority DESC, timestamp ASC 
       LIMIT ?`,
      [limit]
    );

    return rows.map(row => ({
      id: row.id,
      senderId: row.senderId,
      senderRole: row.senderRole,
      recipientId: row.recipientId === 'broadcast' ? undefined : row.recipientId,
      originalContent: row.originalContent,
      adaptedContent: row.adaptedContent,
      timestamp: new Date(row.timestamp).getTime(),
      priority: row.priority,
      status: row.status
    }));
  }

  /**
   * Atualiza o estado de uma mensagem (ex: de 'pending' para 'sent').
   */
  async updateMessageStatus(id: string, status: 'pending' | 'sent' | 'failed'): Promise<void> {
    const updatedAt = new Date().toISOString();
    await this.db.run(
      `UPDATE smart_messages SET status = ?, updatedAt = ? WHERE id = ?`,
      [status, updatedAt, id]
    );
  }

  /**
   * Limpa mensagens antigas que já foram enviadas.
   */
  async purgeSentMessages(days: number = 2): Promise<void> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    
    await this.db.run(
      `DELETE FROM smart_messages WHERE status = 'sent' AND updatedAt < ?`,
      [cutoff.toISOString()]
    );
  }
}

export const messageRepository = (db: Database) => new MessageRepository(db);
