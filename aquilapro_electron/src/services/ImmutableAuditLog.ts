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
import Database from '../database/Database';
import { wasmAuditBridge } from './WasmAuditBridge';

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
  private lastHash = 'GENESIS'; // Hash inicial (bloco gênese)

  constructor(
    private readonly db: Database,
    secret: string
  ) {
    if (!secret || secret.length < 16) {
      throw new Error('[AuditLog] AUDIT_SECRET deve ter pelo menos 16 caracteres.');
    }
    this.SECRET = secret;
  }

  /**
   * Inicializa carregando o último hash persistido.
   */
  async initialize(): Promise<void> {
    try {
      const lastEntry = await (this.db as any).get(
        `SELECT hash FROM audit_log ORDER BY rowid DESC LIMIT 1`
      );
      if (lastEntry?.hash) {
        this.lastHash = lastEntry.hash;
      }
    } catch {
      // Tabela pode não existir ainda; será criada no initialize() do DB
    }
    await this._ensureTable();
  }

  /**
   * Registra uma ação no audit log com assinatura HMAC.
   */
  async record(
    action: string,
    payload: Record<string, any>,
    userId?: string
  ): Promise<AuditEntry> {
    const entry: Omit<AuditEntry, 'hash'> = {
      id: randomUUID(),
      timestamp: new Date().toISOString(),
      action,
      userId: userId || null,
      payload: this._stripPII(payload),
      prevHash: this.lastHash,
    };

    const hash = this._computeHash(entry);
    const fullEntry: AuditEntry = { ...entry, hash };

    await (this.db as any).run(
      `INSERT INTO audit_log (id, timestamp, action, user_id, payload, prev_hash, hash)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        fullEntry.id,
        fullEntry.timestamp,
        fullEntry.action,
        fullEntry.userId,
        JSON.stringify(fullEntry.payload),
        fullEntry.prevHash,
        fullEntry.hash,
      ]
    );

    this.lastHash = hash;
    return fullEntry;
  }

  /**
   * Verifica a integridade da cadeia de audit logs usando a ponte de performance.
   */
  async verify(): Promise<{ valid: boolean; firstBrokenId?: string; totalEntries: number }> {
    const entries: any[] = await (this.db as any).all(
      `SELECT * FROM audit_log ORDER BY rowid ASC`
    );

    const result = wasmAuditBridge.verifyChain(this.SECRET, entries);
    
    return { 
        valid: result.valid, 
        firstBrokenId: result.brokenId, 
        totalEntries: entries.length 
    };
  }

  private _computeHash(entry: Omit<AuditEntry, 'hash'>): string {
    return wasmAuditBridge.computeHash(this.SECRET, {
      id: entry.id,
      timestamp: entry.timestamp,
      action: entry.action,
      userId: entry.userId,
      payload: entry.payload,
      prevHash: entry.prevHash,
    });
  }

  /** Remove campos PII do payload antes de persistir */
  private _stripPII(payload: Record<string, any>): Record<string, any> {
    const PII_FIELDS = ['password', 'token', 'secret', 'cpf', 'rg', 'photo', 'embedding', 'face'];
    const clean: Record<string, any> = {};
    for (const [k, v] of Object.entries(payload)) {
      const isPII = PII_FIELDS.some(f => k.toLowerCase().includes(f));
      clean[k] = isPII ? '[REDACTED]' : v;
    }
    return clean;
  }

  private async _ensureTable(): Promise<void> {
    await (this.db as any).run(`
      CREATE TABLE IF NOT EXISTS audit_log (
        id        TEXT PRIMARY KEY,
        timestamp TEXT NOT NULL,
        action    TEXT NOT NULL,
        user_id   TEXT,
        payload   TEXT NOT NULL DEFAULT '{}',
        prev_hash TEXT NOT NULL,
        hash      TEXT NOT NULL
      )
    `);
  }
}

export default ImmutableAuditLog;
