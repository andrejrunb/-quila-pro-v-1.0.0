/**
 * NotificationOutboxService.ts — Áquila Pro Edge v2.1
 * 
 * Gerenciador de Fila de Mensageria Resiliente (WhatsApp Meta Cloud API):
 * - Garantia de Idempotência (idempotency_key única previne envio duplicado aos pais)
 * - Retry com Backoff Exponencial (10s, 60s, 300s)
 * - Fila de Mensagens Mortas / Dead-Letter Queue (DLQ após 3 falhas consecutivas)
 * - Buffer Offline Total (mensagens acumuladas durante queda de internet e drenadas na reconexão)
 */

import DatabaseConstructor from 'better-sqlite3';
import type Database from 'better-sqlite3';

export interface OutboxItem {
  id: number;
  idempotency_key: string;
  recipient_phone: string;
  template_name: string;
  parameters_json: string;
  status: 'PENDING' | 'PROCESSING' | 'SENT' | 'FAILED' | 'DEAD_LETTER';
  retry_count: number;
  max_retries: number;
  next_retry_at: string | null;
  last_error: string | null;
  sent_at: string | null;
  created_at: string;
}

export interface OutboxStats {
  pendingCount: number;
  sentCount: number;
  failedCount: number;
  deadLetterCount: number;
  totalCount: number;
}

export class NotificationOutboxService {
  private db: Database.Database;

  constructor(db: Database.Database) {
    this.db = db;
    this.initializeTable();
  }

  private initializeTable(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS notification_outbox (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        idempotency_key TEXT UNIQUE NOT NULL,
        recipient_phone TEXT NOT NULL,
        template_name TEXT NOT NULL,
        parameters_json TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'PENDING',
        retry_count INTEGER NOT NULL DEFAULT 0,
        max_retries INTEGER NOT NULL DEFAULT 3,
        next_retry_at TEXT,
        last_error TEXT,
        sent_at TEXT,
        created_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_outbox_status_retry ON notification_outbox(status, next_retry_at);
      CREATE INDEX IF NOT EXISTS idx_outbox_idempotency ON notification_outbox(idempotency_key);
    `);
  }

  /**
   * Enfileira uma mensagem com chave de idempotência.
   * Se a chave já existir, ignora a inserção sem duplicar disparo.
   */
  public enqueue(item: {
    idempotencyKey: string;
    recipientPhone: string;
    templateName: string;
    parameters: Record<string, any>;
    maxRetries?: number;
  }): { enqueued: boolean; duplicate: boolean } {
    try {
      const stmt = this.db.prepare(`
        INSERT INTO notification_outbox (
          idempotency_key, recipient_phone, template_name, parameters_json,
          status, retry_count, max_retries, next_retry_at, created_at
        ) VALUES (?, ?, ?, ?, 'PENDING', 0, ?, ?, ?)
      `);

      const now = new Date().toISOString();
      stmt.run(
        item.idempotencyKey,
        item.recipientPhone,
        item.templateName,
        JSON.stringify(item.parameters),
        item.maxRetries || 3,
        now,
        now
      );

      return { enqueued: true, duplicate: false };
    } catch (err: any) {
      if (err.message && err.message.includes('UNIQUE constraint failed')) {
        // Idempotência assegurada: mensagem já foi enfileirada anteriormente
        return { enqueued: false, duplicate: true };
      }
      throw err;
    }
  }

  /**
   * Processa lote de mensagens pendentes respeitando rate limit e backoff
   */
  public async processBatch(
    batchSize: number = 20,
    sendFunction: (item: OutboxItem) => Promise<boolean>
  ): Promise<{ processed: number; sent: number; retried: number; deadLetter: number }> {
    const nowIso = new Date().toISOString();

    // Seleciona mensagens prontas para envio (PENDING ou FAILED cujo next_retry_at já passou)
    const selectStmt = this.db.prepare(`
      SELECT * FROM notification_outbox
      WHERE (status = 'PENDING' OR status = 'FAILED')
        AND (next_retry_at IS NULL OR next_retry_at <= ?)
      ORDER BY id ASC
      LIMIT ?
    `);

    const items = selectStmt.all(nowIso, batchSize) as OutboxItem[];
    let sent = 0;
    let retried = 0;
    let deadLetter = 0;

    const markProcessing = this.db.prepare("UPDATE notification_outbox SET status = 'PROCESSING' WHERE id = ?");
    const markSent = this.db.prepare("UPDATE notification_outbox SET status = 'SENT', sent_at = ?, last_error = NULL WHERE id = ?");
    const markFailed = this.db.prepare(`
      UPDATE notification_outbox 
      SET status = 'FAILED', retry_count = retry_count + 1, next_retry_at = ?, last_error = ?
      WHERE id = ?
    `);
    const markDead = this.db.prepare(`
      UPDATE notification_outbox
      SET status = 'DEAD_LETTER', retry_count = retry_count + 1, last_error = ?
      WHERE id = ?
    `);

    for (const item of items) {
      markProcessing.run(item.id);

      try {
        const success = await sendFunction(item);
        if (success) {
          markSent.run(new Date().toISOString(), item.id);
          sent++;
        } else {
          throw new Error('Falha no gateway remoto de envio');
        }
      } catch (err: any) {
        const nextRetryCount = item.retry_count + 1;
        const errMsg = err.message || 'Erro desconhecido';

        if (nextRetryCount >= item.max_retries) {
          // Excedeu o número máximo de tentativas -> Dead Letter Queue
          markDead.run(errMsg, item.id);
          deadLetter++;
        } else {
          // Backoff exponencial: 10s * (2 ^ retry_count)
          const delaySeconds = 10 * Math.pow(2, item.retry_count);
          const nextRetryDate = new Date(Date.now() + delaySeconds * 1000).toISOString();
          markFailed.run(nextRetryDate, errMsg, item.id);
          retried++;
        }
      }
    }

    return { processed: items.length, sent, retried, deadLetter };
  }

  /**
   * Métricas de saúde do Outbox
   */
  public getStats(): OutboxStats {
    const statsRow = this.db.prepare(`
      SELECT
        count(CASE WHEN status = 'PENDING' THEN 1 END) as pendingCount,
        count(CASE WHEN status = 'SENT' THEN 1 END) as sentCount,
        count(CASE WHEN status = 'FAILED' THEN 1 END) as failedCount,
        count(CASE WHEN status = 'DEAD_LETTER' THEN 1 END) as deadLetterCount,
        count(*) as totalCount
      FROM notification_outbox
    `).get() as OutboxStats;

    return statsRow;
  }
}
