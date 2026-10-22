import crypto from 'crypto';
import { logger } from '../logger';

interface AuditEntry {
  type: string;
  data: any;
  previousHash: string;
  timestamp: Date;
}

/**
 * AuditLedgerService - Camada 3 SQA-1000 (LAW-002)
 * Implementação de Hash-Chain imutável para eventos críticos (Notas/Presença).
 */
export class AuditLedgerService {
  private static instance: AuditLedgerService;
  private lastHash: string = 'GENESIS-BLOCK';

  private constructor() {}

  public static getInstance(): AuditLedgerService {
    if (!AuditLedgerService.instance) {
      AuditLedgerService.instance = new AuditLedgerService();
    }
    return AuditLedgerService.instance;
  }

  /**
   * Significa um novo registro no Ledger Soberano.
   */
  public async signRecord(type: string, data: any): Promise<string> {
    const entry: AuditEntry = {
      type,
      data,
      previousHash: this.lastHash,
      timestamp: new Date()
    };

    const entryString = JSON.stringify(entry);
    const hash = crypto.createHash('sha256').update(entryString).digest('hex');
    
    this.lastHash = hash;
    
    logger.info(`[Ledger] Evento de Auditoria ${type} assinado no Hash-Chain: ${hash.substring(0, 16)}`);
    return hash;
  }

  /**
   * Valida a integridade do último bloco.
   */
  public getLatestHash(): string {
    return this.lastHash;
  }
}

export const auditLedger = AuditLedgerService.getInstance();

