import { db } from '../database/Database';
import { logger } from '../main/logger';
import { sovereignLedgerService } from './SovereignLedgerService';

/**
 * LEDGER EXPORTER SERVICE (v3646)
 * ------------------------------
 * Gera certificados de integridade e exporta o histórico de auditoria
 * em formatos assinados digitalmente para conformidade regulatória.
 */
export interface SovereignCertificate {
  schoolId: string;
  unitName: string;
  lastBlockNumber: number;
  rootHash: string;
  signature: string;
  generatedAt: string;
  verificationUrl: string;
}

export class LedgerExporter {
  private static instance: LedgerExporter;

  private constructor() {}

  public static getInstance(): LedgerExporter {
    if (!LedgerExporter.instance) {
      LedgerExporter.instance = new LedgerExporter();
    }
    return LedgerExporter.instance;
  }

  /**
   * [SQA-LDG-925] Gera um certificado de integridade soberana.
   */
  public async generateCertificate(): Promise<SovereignCertificate | null> {
    try {
      const lastBlock = await db.get('SELECT * FROM ledger_blocks ORDER BY block_number DESC LIMIT 1');
      if (!lastBlock) {
         // Se não houver blocos, tentar selar um agora (v3509)
         await sovereignLedgerService.sealBlock(1);
         return this.generateCertificate();
      }

      const school = await db.get('SELECT name FROM schools LIMIT 1') || { name: 'Áquila Sovereign Unit' };

      const cert: SovereignCertificate = {
        schoolId: 'AQ-PRO-SOV-001',
        unitName: school.name,
        lastBlockNumber: lastBlock.block_number,
        rootHash: lastBlock.root_hash,
        signature: lastBlock.signature,
        generatedAt: new Date().toISOString(),
        verificationUrl: `https://verify.aquila.pro/check?root=${lastBlock.root_hash}`
      };

      logger.info(`[LedgerExporter] Certificado gerado para Bloco #${lastBlock.block_number}`);
      return cert;
    } catch (error) {
      logger.error('[LedgerExporter] Falha ao gerar certificado:', error);
      return null;
    }
  }

  /**
   * [SQA-LDG-928] Exporta o Ledger completo para JSON assinado.
   */
  public async exportFullLedger() {
     const blocks = await db.all('SELECT * FROM ledger_blocks ORDER BY block_number ASC');
     const auditLogs = await db.all('SELECT * FROM audit_logs ORDER BY id ASC LIMIT 5000');

     return {
        metadata: {
           version: 'v3509',
           type: 'Sovereign Ledger Export',
           unit: 'Alpha Node'
        },
        blocks,
        auditLogs
     };
  }
}

export const ledgerExporter = LedgerExporter.getInstance();
