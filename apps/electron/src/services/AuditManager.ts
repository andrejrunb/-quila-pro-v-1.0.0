import crypto from 'crypto';
import { Database } from '../database/Database';

export interface AuditLogEntry {
  id?: string;
  table: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  recordId: string;
  data: string;
  timestamp: string;
  parentHash: string;
  signature: string;
}

export class AuditManager {
  private static instance: AuditManager;
  private db: Database;
  private lastHash: string = '0'.repeat(64); // Genesis hash
  private secretKey: string = process.env.AUDIT_SECRET || 'sov-aq-3481-prot';

  private constructor(db: Database) {
    this.db = db;
    this.loadLastHash();
  }

  public static getInstance(db?: Database): AuditManager {
    if (!AuditManager.instance && db) {
      AuditManager.instance = new AuditManager(db);
    }
    return AuditManager.instance;
  }

  private async loadLastHash() {
    try {
      const lastEntry = await this.db.get('SELECT signature FROM audit_logs ORDER BY timestamp DESC LIMIT 1');
      if (lastEntry) {
        this.lastHash = lastEntry.signature;
        console.log(`[AuditManager] Last chain hash loaded: ${this.lastHash.substring(0, 8)}...`);
      }
    } catch (err) {
      console.warn('[AuditManager] No previous audit logs found. Starting genesis chain.');
    }
  }

  public async log(table: string, action: 'INSERT' | 'UPDATE' | 'DELETE', recordId: string, data: any): Promise<void> {
    const timestamp = new Date().toISOString();
    const dataStr = JSON.stringify(data);
    
    // Immutable Chaining Logic
    const payload = `${this.lastHash}|${table}|${action}|${recordId}|${dataStr}|${timestamp}`;
    const signature = crypto
      .createHmac('sha256', this.secretKey)
      .update(payload)
      .digest('hex');

    const sql = `INSERT INTO audit_logs (table_name, action, record_id, data, timestamp, parent_hash, signature)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`;
    
    await this.db.run(sql, [table, action, recordId, dataStr, timestamp, this.lastHash, signature]);
    this.lastHash = signature;
  }

  public async verifyIntegrity(): Promise<{ valid: boolean; errorIndex?: number }> {
    const logs = await this.db.all('SELECT * FROM audit_logs ORDER BY timestamp ASC');
    let currentParentHash = '0'.repeat(64);

    for (let i = 0; i < logs.length; i++) {
      const log = logs[i];
      const payload = `${currentParentHash}|${log.table_name}|${log.action}|${log.record_id}|${log.data}|${log.timestamp}`;
      const expectedSign = crypto
        .createHmac('sha256', this.secretKey)
        .update(payload)
        .digest('hex');

      if (expectedSign !== log.signature) {
        console.error(`[AuditManager] INTEGRITY BREACH at index ${i}. Expected signature mismatch.`);
        return { valid: false, errorIndex: i };
      }
      currentParentHash = log.signature;
    }

    return { valid: true };
  }
}
