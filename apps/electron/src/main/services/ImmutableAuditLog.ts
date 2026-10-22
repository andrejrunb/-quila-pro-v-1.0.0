/**
 * Step 157 — Audit Log com Assinatura Digital (HMAC-SHA256)
 *
 * Garante imutabilidade dos logs: qualquer alteração pode ser detectada
 * ao verificar o hash encadeado (chain).
 *
 * Arquitetura:
 *   - Cada entrada tem um hash próprio (HMAC do conteúdo)  
 *   - O hash da entrada inclui o hash da entrada anterior (chain hash)
 *   - Para validar, recalcular todos os hashes e verificar a cadeia
 *
 * Uso no main.ts:
 *   const auditLog = new ImmutableAuditLog(db, process.env.AUDIT_SECRET!);
 *   await auditLog.record('login', { userId: user.id, ip: '192.168.0.1' });
 */
import { createHmac, randomUUID } from 'crypto';
import Database from '../../database/Database';
import { sovereignGraphService } from './SovereignGraphService';

export interface AuditEntry {
  id: string;
  timestamp: string;
  action: string;
  userId: string | null;
  payload: Record<string, any>;
  prevHash: string;
  hash: string;
}

export class ImmutableAuditLog {
  private readonly SECRET: string;
  private lastHash = '0'.repeat(64); // Genesis

  constructor(
    private readonly db: any,
    secret: string
  ) {
    if (!secret || secret.length < 16) {
      throw new Error('[AuditLog] Secret deve ter pelo menos 16 caracteres para garantir entropia soberana.');
    }
    this.SECRET = secret;
  }

  async initialize(): Promise<void> {
    try {
      const lastEntry = await this.db.get(
        `SELECT signature FROM audit_logs ORDER BY id DESC LIMIT 1`
      );
      if (lastEntry?.signature) {
        this.lastHash = lastEntry.signature;
        console.log(`[AuditLog] Chain continued from: ${this.lastHash.substring(0, 8)}...`);
      }
    } catch (err) {
      console.warn('[AuditLog] Genesis block required.');
    }
  }

  async record(
    table: string,
    action: 'INSERT' | 'UPDATE' | 'DELETE',
    recordId: string,
    data: any,
    userId: string = 'system'
  ): Promise<void> {
    const timestamp = new Date().toISOString();
    const cleanData = this._stripPII(data);
    const dataStr = JSON.stringify(cleanData);
    
    // Canonical payload for Zero-Knowledge verification
    const payload = `${this.lastHash}|${table}|${action}|${recordId}|${dataStr}|${timestamp}|${userId}`;
    const signature = createHmac('sha256', this.SECRET)
      .update(payload)
      .digest('hex');

    await this.db.run(
      `INSERT INTO audit_logs (table_name, action, record_id, data, timestamp, parent_hash, chain_hash, signature, userId)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [table, action, recordId, dataStr, timestamp, this.lastHash, signature, signature, userId]
    );

    this.lastHash = signature;

    // Integração com SKG (Sovereign Knowledge Graph)
    const eventId = `AUDIT-${signature.substring(0, 12)}`;
    sovereignGraphService.addEntity({
      id: eventId,
      type: 'SYSTEM_EVENT',
      label: `${action} em ${table}`,
      metadata: {
        table,
        action,
        recordId,
        userId,
        timestamp,
        integrityHash: signature
      }
    });

    // Criar conexão entre Usuário e Evento
    sovereignGraphService.associate(userId, eventId, 'TRIGGERED', 1);
  }

  async verify(): Promise<{ valid: boolean; errorIndex?: number; firstBrokenId?: string; totalEntries: number }> {
    const logs = await this.db.all('SELECT * FROM audit_logs ORDER BY id ASC');
    let currentParentHash = '0'.repeat(64);
    const totalEntries = logs.length;

    for (let i = 0; i < logs.length; i++) {
        const log = logs[i];
        // Reconstruct expected payload (Zero-Knowledge friendly)
        const payload = `${currentParentHash}|${log.table_name}|${log.action}|${log.record_id}|${log.data}|${log.timestamp}|system`;
        const expectedSign = createHmac('sha256', this.SECRET)
          .update(payload)
          .digest('hex');

        if (expectedSign !== log.signature) {
          return { valid: false, errorIndex: i, firstBrokenId: log.record_id, totalEntries };
        }
        currentParentHash = log.signature;
    }
    return { valid: true, totalEntries };
  }

  private _stripPII(data: any): any {
    if (!data) return data;
    const PII_FIELDS = ['password', 'token', 'secret', 'photo', 'embedding', 'face', 'address', 'cpf', 'email', 'telefone'];
    const clean = { ...data };
    for (const key of Object.keys(clean)) {
      if (PII_FIELDS.some(f => key.toLowerCase().includes(f))) {
        clean[key] = '[REDACTED]';
      }
    }
    return clean;
  }
}

export default ImmutableAuditLog;

