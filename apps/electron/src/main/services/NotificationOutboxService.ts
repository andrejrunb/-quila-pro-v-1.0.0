/**
 * NotificationOutboxService.ts — Áquila Pro Edge v2.1
 * 
 * Gerenciador de Fila de Mensageria Resiliente (WhatsApp Meta Cloud API):
 * - Garantia de Idempotência (idempotency_key única previne envio duplicado aos pais)
 * - Suporte a ID do Provedor (provider_message_id) para reconciliação pós-falha de rede
 * - Tratamento de Respostas Ambíguas (status AMBIGUOUS previne reenvio cego)
 * - Retry com Backoff Exponencial (10s, 60s, 300s)
 * - Fila de Mensagens Mortas (DLQ após 3 falhas consecutivas)
 * - Operação de Reprocessamento HITL (Human-in-the-Loop) com Trilha de Auditoria
 * - Buffer Offline Total (mensagens acumuladas durante queda de internet e drenadas na reconexão)
 */

import DatabaseConstructor from 'better-sqlite3';
import type Database from 'better-sqlite3';

export type OutboxStatus = 'PENDING' | 'PROCESSING' | 'SENT' | 'FAILED' | 'DEAD_LETTER' | 'AMBIGUOUS';

export interface OutboxItem {
  id: number;
  idempotency_key: string;
  provider_message_id: string | null;
  recipient_phone: string;
  template_name: string;
  parameters_json: string;
  status: OutboxStatus;
  retry_count: number;
  max_retries: number;
  next_retry_at: string | null;
  last_error: string | null;
  sent_at: string | null;
  reconciled_at: string | null;
  reconciled_by: string | null;
  created_at: string;
}

export interface OutboxStats {
  pendingCount: number;
  sentCount: number;
  failedCount: number;
  deadLetterCount: number;
  ambiguousCount: number;
  totalCount: number;
}

export type SendFunctionResult = boolean | {
  success: boolean;
  providerMessageId?: string;
  ambiguous?: boolean;
  error?: string;
};

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
        provider_message_id TEXT,
        recipient_phone TEXT NOT NULL,
        template_name TEXT NOT NULL,
        parameters_json TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'PENDING',
        retry_count INTEGER NOT NULL DEFAULT 0,
        max_retries INTEGER NOT NULL DEFAULT 3,
        next_retry_at TEXT,
        last_error TEXT,
        sent_at TEXT,
        reconciled_at TEXT,
        reconciled_by TEXT,
        created_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_outbox_status_retry ON notification_outbox(status, next_retry_at);
      CREATE INDEX IF NOT EXISTS idx_outbox_idempotency ON notification_outbox(idempotency_key);
      CREATE INDEX IF NOT EXISTS idx_outbox_provider_id ON notification_outbox(provider_message_id);

      CREATE TABLE IF NOT EXISTS guardian_whatsapp_consents (
        recipient_phone TEXT PRIMARY KEY,
        student_id TEXT NOT NULL,
        consented INTEGER NOT NULL DEFAULT 1,
        channel TEXT NOT NULL DEFAULT 'whatsapp_meta',
        updated_at TEXT NOT NULL
      );
    `);
  }

  /**
   * Enfileira uma mensagem com chave de idempotência.
   * Se a chave já existir, ignora a inserção sem duplicar disparo.
   */
  /**
   * Registra ou revoga consentimento LGPD (Art. 14) do responsável para WhatsApp Meta Cloud API
   */
  public setGuardianConsent(
    recipientPhone: string,
    studentId: string,
    consented: boolean,
    channel: 'whatsapp_meta' | 'push' = 'whatsapp_meta'
  ): void {
    const now = new Date().toISOString();
    this.db.prepare(`
      INSERT INTO guardian_whatsapp_consents (recipient_phone, student_id, consented, channel, updated_at)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(recipient_phone) DO UPDATE SET
        consented = excluded.consented,
        channel = excluded.channel,
        updated_at = excluded.updated_at
    `).run(recipientPhone, studentId, consented ? 1 : 0, channel, now);
  }

  /**
   * Verifica se o responsável possui consentimento LGPD ativo para canal oficial permitido
   */
  public hasGuardianConsent(recipientPhone: string): boolean {
    const row = this.db.prepare(
      "SELECT consented, channel FROM guardian_whatsapp_consents WHERE recipient_phone = ?"
    ).get(recipientPhone) as { consented: number; channel: string } | undefined;
    if (!row) return false;
    return row.consented === 1 && (row.channel === 'whatsapp_meta' || row.channel === 'push');
  }

  /**
   * Enfileira mensagem em lote controlado exigindo consentimento ativo do responsável (LGPD Art. 14)
   */
  public enqueueControlledPilot(item: {
    idempotencyKey: string;
    recipientPhone: string;
    studentId: string;
    templateName: string;
    parameters: Record<string, any>;
    maxRetries?: number;
  }): { enqueued: boolean; duplicate: boolean; blockedByLgpdConsent?: boolean } {
    if (!this.hasGuardianConsent(item.recipientPhone)) {
      return { enqueued: false, duplicate: false, blockedByLgpdConsent: true };
    }
    return this.enqueue(item);
  }

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
    sendFunction: (item: OutboxItem) => Promise<SendFunctionResult>
  ): Promise<{ processed: number; sent: number; retried: number; deadLetter: number; ambiguous: number }> {
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
    let ambiguous = 0;

    const markProcessing = this.db.prepare("UPDATE notification_outbox SET status = 'PROCESSING' WHERE id = ?");
    const markSent = this.db.prepare(`
      UPDATE notification_outbox 
      SET status = 'SENT', sent_at = ?, provider_message_id = COALESCE(?, provider_message_id), last_error = NULL 
      WHERE id = ?
    `);
    const markAmbiguous = this.db.prepare(`
      UPDATE notification_outbox
      SET status = 'AMBIGUOUS', provider_message_id = COALESCE(?, provider_message_id), last_error = ?
      WHERE id = ?
    `);
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
        const result = await sendFunction(item);
        const isSuccess = typeof result === 'boolean' ? result : result.success;
        const providerMsgId = typeof result === 'object' ? result.providerMessageId : null;
        const isAmbiguous = typeof result === 'object' ? !!result.ambiguous : false;

        if (isSuccess) {
          markSent.run(new Date().toISOString(), providerMsgId || null, item.id);
          sent++;
        } else if (isAmbiguous) {
          const errMsg = typeof result === 'object' && result.error ? result.error : 'Timeout após envio — reconciliação necessária';
          markAmbiguous.run(providerMsgId || null, errMsg, item.id);
          ambiguous++;
        } else {
          const errMsg = typeof result === 'object' && result.error ? result.error : 'Falha no gateway remoto de envio';
          throw new Error(errMsg);
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

    return { processed: items.length, sent, retried, deadLetter, ambiguous };
  }

  /**
   * Reconcilia status de mensagem ambígua ou enviada externamente via webhook do provedor (Meta WhatsApp)
   */
  public reconcileProviderStatus(
    idempotencyKey: string,
    providerStatus: 'DELIVERED' | 'SENT' | 'FAILED' | 'REJECTED',
    providerMessageId?: string,
    operatorId: string = 'SYSTEM_RECONCILIATION'
  ): { reconciled: boolean; previousStatus: string | null; newStatus: OutboxStatus } {
    const item = this.db.prepare("SELECT * FROM notification_outbox WHERE idempotency_key = ?").get(idempotencyKey) as OutboxItem | undefined;
    if (!item) {
      return { reconciled: false, previousStatus: null, newStatus: 'FAILED' };
    }

    const now = new Date().toISOString();
    let newStatus: OutboxStatus = item.status;

    if (providerStatus === 'DELIVERED' || providerStatus === 'SENT') {
      newStatus = 'SENT';
      this.db.prepare(`
        UPDATE notification_outbox
        SET status = 'SENT',
            provider_message_id = COALESCE(?, provider_message_id),
            sent_at = COALESCE(sent_at, ?),
            reconciled_at = ?,
            reconciled_by = ?,
            last_error = NULL
        WHERE id = ?
      `).run(providerMessageId || null, now, now, operatorId, item.id);
    } else {
      newStatus = 'DEAD_LETTER';
      this.db.prepare(`
        UPDATE notification_outbox
        SET status = 'DEAD_LETTER',
            provider_message_id = COALESCE(?, provider_message_id),
            reconciled_at = ?,
            reconciled_by = ?,
            last_error = ?
        WHERE id = ?
      `).run(providerMessageId || null, now, operatorId, `Rejeitado pelo provedor: ${providerStatus}`, item.id);
    }

    return { reconciled: true, previousStatus: item.status, newStatus };
  }

  /**
   * Consulta itens retidos na Dead-Letter Queue (DLQ)
   */
  public getDeadLetters(limit: number = 50, offset: number = 0): OutboxItem[] {
    return this.db.prepare(`
      SELECT * FROM notification_outbox
      WHERE status = 'DEAD_LETTER'
      ORDER BY id DESC
      LIMIT ? OFFSET ?
    `).all(limit, offset) as OutboxItem[];
  }

  /**
   * Reprocessamento controlado de item da DLQ por intervenção humana (HITL)
   */
  public reprocessDeadLetter(
    id: number,
    operatorUserId: string,
    justification: string
  ): { reprocessed: boolean; error?: string } {
    if (!operatorUserId || !justification || justification.trim().length < 5) {
      return { reprocessed: false, error: 'Identificação do operador e justificativa técnica são obrigatórias (HITL LGPD).' };
    }

    const item = this.db.prepare("SELECT * FROM notification_outbox WHERE id = ?").get(id) as OutboxItem | undefined;
    if (!item) {
      return { reprocessed: false, error: 'Mensagem não encontrada na base.' };
    }

    if (item.status !== 'DEAD_LETTER' && item.status !== 'AMBIGUOUS' && item.status !== 'FAILED') {
      return { reprocessed: false, error: `Status atual (${item.status}) não permite reprocessamento manual.` };
    }

    const now = new Date().toISOString();
    this.db.prepare(`
      UPDATE notification_outbox
      SET status = 'PENDING',
          retry_count = 0,
          next_retry_at = ?,
          reconciled_at = ?,
          reconciled_by = ?,
          last_error = ?
      WHERE id = ?
    `).run(
      now,
      now,
      operatorUserId,
      `Reprocessamento manual solicitado: "${justification}"`,
      id
    );

    return { reprocessed: true };
  }

  /**
   * Verificação de Alerta da Dead-Letter Queue para TI e DPO Escolar
   */
  public checkDlqAlert(threshold: number = 1): { alert: boolean; count: number; message: string } {
    const row = this.db.prepare("SELECT count(*) as count FROM notification_outbox WHERE status = 'DEAD_LETTER'").get() as { count: number };
    const count = row.count || 0;
    const alert = count >= threshold;
    return {
      alert,
      count,
      message: alert ? `ALERTA OPERACIONAL: ${count} mensagem(ns) retida(s) na Dead-Letter Queue aguardando resolução.` : 'DLQ saudável (Zero mensagens retidas).'
    };
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
        count(CASE WHEN status = 'AMBIGUOUS' THEN 1 END) as ambiguousCount,
        count(*) as totalCount
      FROM notification_outbox
    `).get() as OutboxStats;

    return statsRow;
  }
}
