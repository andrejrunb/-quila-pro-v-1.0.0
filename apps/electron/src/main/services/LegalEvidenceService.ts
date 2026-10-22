import { EventEmitter } from 'events';
import * as crypto from 'crypto';
import { logger } from '../logger';
import Database from '../../database/Database';

export interface Evidence {
  id: string;
  timestamp: Date;
  eventType: string;
  metadata: any;
  hash: string;
  signature: string;
}

export interface LegalAnchor {
  id: string;
  article_number: string;
  content: string;
}

/**
 * Nível 16 — LegalEvidenceService
 * Transforma alertas operacionais em evidências jurídicas assinadas digitalmente.
 */
export class LegalEvidenceService extends EventEmitter {
  private static instance: LegalEvidenceService;
  private privateKey: string = '';
  private publicKey: string = '';

  private constructor() {
    super();
    this.initializeKeys();
  }

  public static getInstance(): LegalEvidenceService {
    if (!LegalEvidenceService.instance) {
      LegalEvidenceService.instance = new LegalEvidenceService();
    }
    return LegalEvidenceService.instance;
  }

  private initializeKeys() {
    // Em produção, carregar do Vault ou gerar no primeiro boot (local-only)
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
    });
    this.publicKey = publicKey.export({ type: 'pkcs1', format: 'pem' }) as string;
    this.privateKey = privateKey.export({ type: 'pkcs1', format: 'pem' }) as string;
    
    logger.info('[Legal-Guard] Forensic Keys Initialized (Nível 16)');
  }

  /**
   * Assina um evento e gera uma evidência imutável.
   */
  public async signEvidence(eventType: string, metadata: any): Promise<Evidence> {
    const id = crypto.randomUUID();
    const timestamp = new Date();
    
    // Normalizar dados para hash determinístico
    const dataString = JSON.stringify({ id, eventType, metadata, timestamp: timestamp.toISOString() });
    
    const hash = crypto.createHash('sha256').update(dataString).digest('hex');
    
    const sign = crypto.createSign('SHA256');
    sign.update(dataString);
    const signature = sign.sign(this.privateKey, 'hex');

    const evidence: Evidence = {
      id,
      timestamp,
      eventType,
      metadata,
      hash,
      signature
    };

    await this.persistEvidence(evidence);
    
    logger.info(`[Legal-Guard] Evidence Signed: ${id} (Type: ${eventType})`);
    return evidence;
  }

  private async persistEvidence(evidence: Evidence) {
    try {
      const db = Database.getInstance();
      await db.run(`
        INSERT INTO legal_evidence (id, timestamp, eventType, metadata, hash, signature)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [
        evidence.id, 
        evidence.timestamp.toISOString(), 
        evidence.eventType, 
        JSON.stringify(evidence.metadata), 
        evidence.hash, 
        evidence.signature
      ]);
    } catch (error) {
      logger.error(`[Legal-Guard] Failed to persist evidence: ${error}`);
    }
  }

  /**
   * Verifica se uma evidência foi adulterada.
   */
  public verifyIntegrity(evidence: Evidence): boolean {
    const dataString = JSON.stringify({ 
      id: evidence.id, 
      eventType: evidence.eventType, 
      metadata: evidence.metadata, 
      timestamp: evidence.timestamp instanceof Date ? evidence.timestamp.toISOString() : evidence.timestamp 
    });
    
    const verify = crypto.createVerify('SHA256');
    verify.update(dataString);
    return verify.verify(this.publicKey, evidence.signature, 'hex');
  }

  public getPublicKey(): string {
    return this.publicKey;
  }

  /**
   * Busca leis relevantes para o contexto da evidência.
   * Nível 16 — Forensic Lookup.
   */
  public async findRelevantLaws(query: string, code?: string): Promise<LegalAnchor[]> {
    logger.info(`[Legal-Guard] Searching laws for: ${query} (Code: ${code || 'ALL'})`);
    
    // Stub implementation: Em produção, integra com o Sovereign-Graph (SKG)
    const baseLaws: LegalAnchor[] = [
      { id: 'const-art5', article_number: '5º', content: 'Privacidade e inviolabilidade de dados.' },
      { id: 'lgpd-art7', article_number: '7º', content: 'Hipóteses legítimas para tratamento de dados.' }
    ];

    if (query.toLowerCase().includes('frequência')) {
      return [...baseLaws, { id: 'ldb-art24', article_number: '24, VI', content: 'Controle de frequência escolar obrigatório.' }];
    }

    if (query.toLowerCase().includes('briga') || query.toLowerCase().includes('bullying')) {
      return [...baseLaws, { id: 'lei-13185', article_number: '1', content: 'Combate à intimidação sistemática (Bullying).' }];
    }

    return baseLaws;
  }
}

export const legalEvidenceService = LegalEvidenceService.getInstance();
