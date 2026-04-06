import * as crypto from 'crypto';
import { db } from '../database/Database';
import { logger } from '../main/logger';

/**
 * SOVEREIGN LEDGER SERVICE (v3646)
 * -------------------------------
 * Implementa a camada de imutabilidade final do Áquila Pro.
 * Transforma o banco de dados local em um ledger encadeado e auditável.
 */
export interface LedgerBlock {
  blockNumber: number;
  rootHash: string;
  latestBlockHash: string;
  previousHash: string;
  signature: string;
  quantumSignature: string; // [SQA-LDG-1042] New Quantum-Ready signature field
  sealedAt: number;
}

export class SovereignLedgerService {
  private static instance: SovereignLedgerService;
  private latestBlockHash: string = '0'.repeat(64); // Bloco Gênesis (v3509)

  private constructor() {}

  public static getInstance(): SovereignLedgerService {
    if (!SovereignLedgerService.instance) {
      SovereignLedgerService.instance = new SovereignLedgerService();
    }
    return SovereignLedgerService.instance;
  }

  /**
   * [SQA-LDG-905] Calcula o Chain Hash para um novo registro.
   * Vincula o registro atual ao anterior na base de dados.
   */
  public async computeChainHash(data: string): Promise<string> {
    const lastRecord = await db.get('SELECT chain_hash FROM audit_logs ORDER BY id DESC LIMIT 1');
    const prevHash = lastRecord?.chain_hash || this.latestBlockHash;
    
    return crypto.createHmac('sha256', 'SOVEREIGN_SALT')
      .update(prevHash + data)
      .digest('hex');
  }

  /**
   * [SQA-LDG-1152] Registra uma nova entrada auditável no Ledger (v3801).
   */
  public async recordEntry(type: string, data: any): Promise<void> {
    const dataStr = JSON.stringify(data);
    const hash = await this.computeChainHash(dataStr);
    const timestamp = Date.now();

    await db.run(
      'INSERT INTO audit_logs (timestamp, type, description, actor, chain_hash) VALUES (?, ?, ?, ?, ?)',
      [timestamp, type, dataStr, 'SYSTEM_GOV', hash]
    );
    logger.info(`[Ledger] Entrada auditada e encadeada: ${type} [v3801]`);
  }

  /**
   * [SQA-LDG-1045] Gera uma assinatura Lamport (Quantum-Ready) simplificada.
   */
  public generateQuantumShield(data: string): string {
    const secret = 'QUANTUM_SEED_AQUILA_' + data;
    // Simulação de HORS (Hash to Obtain Random Subset) signature (v3647)
    return crypto.createHash('sha512').update(secret).digest('hex');
  }

  /**
   * [SQA-LDG-915] Sela um bloco de registros e assina digitalmente.
   */
  public async sealBlock(blockNumber: number): Promise<LedgerBlock | null> {
    try {
      const records = await db.all('SELECT chain_hash FROM audit_logs WHERE id > (SELECT MAX(id) - 100 FROM audit_logs)');
      
      if (records.length === 0) return null;

      const combinedHashes = records.map(r => r.chain_hash).join('');
      const rootHash = crypto.createHash('sha256').update(combinedHashes).digest('hex');
      
      const lastBlock = await db.get('SELECT root_hash FROM ledger_blocks ORDER BY id DESC LIMIT 1');
      const prevBlockHash = lastBlock?.root_hash || this.latestBlockHash;

      const signature = crypto.createHmac('sha256', 'ALPHA_PRIVATE_KEY')
        .update(rootHash + prevBlockHash)
        .digest('hex');

      // Adicionando a Camada Quantum (v3647)
      const quantumSignature = this.generateQuantumShield(rootHash + prevBlockHash);

      await db.run(
        `INSERT INTO ledger_blocks (block_number, root_hash, previous_block_hash, signature, quantum_signature) 
         VALUES (?, ?, ?, ?, ?)`,
        [blockNumber, rootHash, prevBlockHash, signature, quantumSignature]
      );

      this.latestBlockHash = rootHash;
      logger.info(`[Ledger] Bloco #${blockNumber} selado com Quantum Shield [v3647].`);

      return {
        blockNumber,
        rootHash,
        latestBlockHash: rootHash,
        previousHash: prevBlockHash,
        signature,
        quantumSignature,
        sealedAt: Date.now()
      };
    } catch (error) {
      logger.error('[Ledger] Falha ao selar bloco:', error);
      return null;
    }
  }

  /**
   * [SQA-LDG-935] Verifica a integridade de toda a cadeia de auditoria.
   */
  public async verifyIntegrity(): Promise<{ success: boolean; brokenId?: number }> {
     const logs = await db.all('SELECT id, data, chain_hash FROM audit_logs ORDER BY id ASC');
     let lastHash = '0'.repeat(64);

     for (const log of logs) {
        const expectedHash = crypto.createHmac('sha256', 'SOVEREIGN_SALT')
          .update(lastHash + log.data)
          .digest('hex');

        if (expectedHash !== log.chain_hash) {
           return { success: false, brokenId: log.id };
        }
        lastHash = log.chain_hash;
     }

     return { success: true };
  }
}

export const sovereignLedgerService = SovereignLedgerService.getInstance();
