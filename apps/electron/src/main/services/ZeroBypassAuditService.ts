/**
 * ZeroBypassAuditService.ts — Onda 6: Governança Soberana, ECA Digital & Auditoria Imutável
 *
 * Em conformidade com:
 *  - Constituição v2.1 (AGENTS.md): Trilha Zero-Bypass para mutações sensíveis.
 *  - ECA Digital (Lei Federal 15.211/2025): Proteção integral, dignidade e restrição
 *    de perfil comportamental de crianças e adolescentes.
 *  - LGPD (Lei Federal 13.709/2018, Art. 14 e 16): Consentimento parental específico e
 *    expurgo auditável de dados biométricos.
 *  - Encadeamento Criptográfico SHA-256 (Hash-Chain Forense).
 */

import * as crypto from 'crypto';
import { Database } from '../../database/Database';
import { logger } from '../logger';

export type CriticalAuditAction =
  | 'DATA_RETENTION_EXPIRATION'
  | 'FIREWALL_RULE_MODIFIED'
  | 'BIOMETRIC_CONSENT_REVOKED'
  | 'HARD_DELETE_RECORDS'
  | 'ECA_DIGITAL_VIOLATION_BLOCKED'
  | 'BIOMETRIC_ACCESS'
  | 'ADMIN_AUTH_OVERRIDE'
  | 'STUDENT_ENROLLMENT'
  | 'CONSENT_GRANTED'
  | 'CONSENT_REVOKED';

export interface AuditRecordParams {
  userId: string;
  action: CriticalAuditAction | string;
  details: string;
  metadata?: Record<string, unknown>;
  legalBasis?: 'ECA_DIGITAL_LEI_15211' | 'LGPD_ART_14' | 'LGPD_ART_16' | 'LEGAL_OBLIGATION' | 'SECURITY_DEFENSE';
  consentVerified?: boolean;
}

export interface MinorComplianceCheckParams {
  studentId: string;
  studentAge: number;
  parentUserId?: string;
  parentConsentVerified: boolean;
  consentDocumentHash?: string;
  intendedAction: string;
}

export interface AuditChainBlock {
  id: number;
  userId: string;
  action: string;
  details: string;
  metadata: string;
  timestamp: string;
  previous_hash: string;
  hash: string;
  legal_basis: string | null;
  consent_verified: number;
}

export class EcaDigitalConsentError extends Error {
  constructor(message: string, public readonly details: Record<string, any>) {
    super(`[ECA Digital / LGPD Art. 14 Violation] ${message}`);
    this.name = 'EcaDigitalConsentError';
  }
}

export class ZeroBypassAuditService {
  private static instance: ZeroBypassAuditService;
  private readonly db: any;
  public static readonly GENESIS_HASH = '0'.repeat(64);
  private lastHash: string = ZeroBypassAuditService.GENESIS_HASH;
  private initialized: boolean = false;

  public constructor(db?: any) {
    this.db = db || Database.getInstance();
  }

  public static getInstance(db?: any): ZeroBypassAuditService {
    if (!ZeroBypassAuditService.instance) {
      ZeroBypassAuditService.instance = new ZeroBypassAuditService(db);
    }
    return ZeroBypassAuditService.instance;
  }

  /**
   * Inicializa o serviço e localiza o topo da cadeia (head block hash)
   */
  public async initialize(): Promise<void> {
    try {
      await this.ensureSchema();
      const lastEntry = await this.db.get(
        'SELECT hash FROM zero_bypass_audits WHERE hash IS NOT NULL ORDER BY id DESC LIMIT 1'
      );
      if (lastEntry && lastEntry.hash) {
        this.lastHash = lastEntry.hash;
        logger.info(`[ZeroBypassAudit] Corrente SHA-256 continuada a partir de: ${this.lastHash.substring(0, 16)}...`);
      } else {
        this.lastHash = ZeroBypassAuditService.GENESIS_HASH;
        logger.info('[ZeroBypassAudit] Gênese da Trilha Zero-Bypass estabelecida.');
      }
      this.initialized = true;
    } catch (err: any) {
      logger.error(`[ZeroBypassAudit] Falha na inicialização: ${err.message}`);
      this.lastHash = ZeroBypassAuditService.GENESIS_HASH;
      this.initialized = true;
    }
  }

  /**
   * Garante idempotência do schema com suporte a integridade forense
   */
  private async ensureSchema(): Promise<void> {
    try {
      const tableInfo = await this.db.all('PRAGMA table_info(zero_bypass_audits)');
      if (tableInfo && tableInfo.length > 0) {
        const columns = tableInfo.map((col: any) => col.name);
        if (!columns.includes('previous_hash')) {
          await this.db.run(`ALTER TABLE zero_bypass_audits ADD COLUMN previous_hash TEXT DEFAULT '${ZeroBypassAuditService.GENESIS_HASH}'`);
        }
        if (!columns.includes('hash')) {
          await this.db.run('ALTER TABLE zero_bypass_audits ADD COLUMN hash TEXT');
        }
        if (!columns.includes('legal_basis')) {
          await this.db.run('ALTER TABLE zero_bypass_audits ADD COLUMN legal_basis TEXT');
        }
        if (!columns.includes('consent_verified')) {
          await this.db.run('ALTER TABLE zero_bypass_audits ADD COLUMN consent_verified INTEGER DEFAULT 0');
        }
      }
    } catch (e: any) {
      logger.warn(`[ZeroBypassAudit] Verificação de schema concluída com aviso: ${e.message}`);
    }
  }

  /**
   * Validação Estrita de Conformidade com o ECA Digital (Lei 15.211/2025) e LGPD Art. 14.
   * Bloqueia o processamento se for menor de 18 anos sem consentimento parental verificado.
   */
  public async assertMinorConsent(params: MinorComplianceCheckParams): Promise<boolean> {
    const isMinor = params.studentAge < 18;

    if (isMinor) {
      const isCompliant = Boolean(params.parentConsentVerified && params.parentUserId && params.consentDocumentHash);

      if (!isCompliant) {
        // Registro forense compulsório do bloqueio de segurança
        await this.record({
          userId: params.parentUserId || 'UNVERIFIED_GUARDIAN',
          action: 'ECA_DIGITAL_VIOLATION_BLOCKED',
          details: `Tentativa de operação '${params.intendedAction}' bloqueada para estudante menor de idade (${params.studentId}, ${params.studentAge} anos) por falta de consentimento parental comprovado.`,
          metadata: {
            studentId: params.studentId,
            studentAge: params.studentAge,
            intendedAction: params.intendedAction,
            violationType: 'ECA_DIGITAL_LEI_15211_ARTICLE_14_LGPD'
          },
          legalBasis: 'ECA_DIGITAL_LEI_15211',
          consentVerified: false
        });

        throw new EcaDigitalConsentError(
          `Operação '${params.intendedAction}' recusada pelo Guardião ECA Digital. Menor de idade requer consentimento parental verificado com hash documental registrado.`,
          { studentId: params.studentId, studentAge: params.studentAge }
        );
      }
    }

    return true;
  }

  /**
   * Registra mutação sensível na trilha imutável com Encadeamento Criptográfico SHA-256
   */
  public async record(params: AuditRecordParams): Promise<{ id: number; hash: string; previousHash: string }> {
    if (!this.initialized) {
      await this.initialize();
    }

    const timestamp = new Date().toISOString();
    const sanitizedMetadata = this.sanitizePII(params.metadata || {});
    const metadataStr = JSON.stringify(sanitizedMetadata);
    const sanitizedDetails = this.sanitizeString(params.details);
    const legalBasis = params.legalBasis || 'LGPD_ART_14';
    const consentVerifiedInt = params.consentVerified ? 1 : 0;

    // Cálculo determinístico do bloco SHA-256
    const blockPayload = `${this.lastHash}|${params.userId}|${params.action}|${sanitizedDetails}|${metadataStr}|${timestamp}|${legalBasis}|${consentVerifiedInt}`;
    const hash = crypto.createHash('sha256').update(blockPayload).digest('hex');
    const previousHash = this.lastHash;

    const sql = `
      INSERT INTO zero_bypass_audits (
        userId, action, details, metadata, timestamp, previous_hash, hash, legal_basis, consent_verified
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const result = await this.db.run(sql, [
      params.userId,
      params.action,
      sanitizedDetails,
      metadataStr,
      timestamp,
      previousHash,
      hash,
      legalBasis,
      consentVerifiedInt
    ]);

    // Atualiza o ponteiro de ponta da corrente
    this.lastHash = hash;

    const recordId = result?.lastInsertRowid || result?.id || 0;

    logger.info(`[ZeroBypassAudit] Bloco auditado: [${params.action}] Hash: ${hash.substring(0, 10)}... (Prev: ${previousHash.substring(0, 8)}...)`);

    return {
      id: recordId,
      hash,
      previousHash
    };
  }

  /**
   * Verificação Forense Completa da Cadeia de Hashes (Auditoria Anti-Adulteração)
   */
  public async verifyChainIntegrity(): Promise<{
    valid: boolean;
    totalBlocks: number;
    errorIndex?: number;
    brokenBlockId?: number;
    expectedHash?: string;
    actualHash?: string;
  }> {
    const blocks: AuditChainBlock[] = await this.db.all(
      'SELECT id, userId, action, details, metadata, timestamp, previous_hash, hash, legal_basis, consent_verified FROM zero_bypass_audits ORDER BY id ASC'
    );

    let expectedPrevHash = ZeroBypassAuditService.GENESIS_HASH;

    for (let i = 0; i < (blocks || []).length; i++) {
      const block = blocks[i];

      // Verificação do encadeamento com o bloco anterior
      if (block.previous_hash !== expectedPrevHash) {
        logger.error(`[ZeroBypassAudit] Quebra de encadeamento no bloco id ${block.id} (index ${i}). PrevHash: ${block.previous_hash}, Esperado: ${expectedPrevHash}`);
        return {
          valid: false,
          totalBlocks: blocks.length,
          errorIndex: i,
          brokenBlockId: block.id,
          expectedHash: expectedPrevHash,
          actualHash: block.previous_hash
        };
      }

      // Recálculo determinístico do hash do bloco
      const recalculatedPayload = `${block.previous_hash}|${block.userId}|${block.action}|${block.details}|${block.metadata}|${block.timestamp}|${block.legal_basis || 'LGPD_ART_14'}|${block.consent_verified}`;
      const recalculatedHash = crypto.createHash('sha256').update(recalculatedPayload).digest('hex');

      if (block.hash !== recalculatedHash) {
        logger.error(`[ZeroBypassAudit] Adulteração de dados detectada no bloco id ${block.id}. Armazenado: ${block.hash}, Recalculado: ${recalculatedHash}`);
        return {
          valid: false,
          totalBlocks: blocks.length,
          errorIndex: i,
          brokenBlockId: block.id,
          expectedHash: recalculatedHash,
          actualHash: block.hash
        };
      }

      expectedPrevHash = block.hash;
    }

    return {
      valid: true,
      totalBlocks: (blocks || []).length
    };
  }

  /**
   * Redação de Dados Sensíveis e PII (LGPD Art. 14 & 16)
   */
  private sanitizePII(data: Record<string, any>): Record<string, any> {
    const SENSITIVE_KEYS = ['password', 'secret', 'token', 'cpf', 'rg', 'faceVector', 'embedding', 'rawImage'];
    const sanitized = { ...data };

    for (const key of Object.keys(sanitized)) {
      if (SENSITIVE_KEYS.some(sens => key.toLowerCase().includes(sens.toLowerCase()))) {
        sanitized[key] = '[REDACTED_BY_LGPD_GUARD]';
      } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
        sanitized[key] = this.sanitizePII(sanitized[key]);
      }
    }
    return sanitized;
  }

  private sanitizeString(str: string): string {
    return str ? str.replace(/\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/g, '[CPF_PROTEGIDO]') : '';
  }

  public getLastHash(): string {
    return this.lastHash;
  }
}

export const zeroBypassAuditService = ZeroBypassAuditService.getInstance();
export default zeroBypassAuditService;
