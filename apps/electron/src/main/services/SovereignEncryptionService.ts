import * as crypto from 'crypto';
import { logger } from '../logger';

/**
 * SovereignEncryptionService (Phase 1800 - Neural Hardening)
 * Provedor de criptografia AES-256-GCM para estados cognitivos e dados sensíveis.
 * Garante que payloads de inferência distribuída permaneçam privados na malha.
 */
export class SovereignEncryptionService {
  private static instance: SovereignEncryptionService;
  private readonly algorithm = 'aes-256-gcm';
  private readonly key: Buffer;

  private constructor() {
    // Hardened Key Derivation (HKD)
    // Em produção, o segredo é injetado via TPM ou derivado do hardware fingerprint.
    const masterSecret = process.env.AQUILA_ENCRYPTION_SECRET || 'SOVEREIGN_SYSTEM_KEY_2026_ALPHA';
    this.key = crypto.scryptSync(masterSecret, 'aquila-pro-salt', 32);
    logger.info('[SECURITY] SovereignEncryptionService inicializado com AES-256-GCM.');
  }

  public static getInstance(): SovereignEncryptionService {
    if (!SovereignEncryptionService.instance) {
      SovereignEncryptionService.instance = new SovereignEncryptionService();
    }
    return SovereignEncryptionService.instance;
  }

  /**
   * Criptografa um texto plano retornando o IV e o Auth Tag.
   */
  public encrypt(text: string, customKey?: string): { iv: string, content: string, tag: string } {
    const iv = crypto.randomBytes(12);
    const key = customKey ? crypto.scryptSync(customKey, 'aquila-ark-salt', 32) : this.key;
    const cipher = crypto.createCipheriv(this.algorithm, key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag().toString('hex');
    
    return {
      iv: iv.toString('hex'),
      content: encrypted,
      tag: tag
    };
  }

  /**
   * Descriptografa um conteúdo verificado pelo Auth Tag.
   */
  public decrypt(iv: string, content: string, tag: string, customKey?: string): string {
    try {
      const key = customKey ? crypto.scryptSync(customKey, 'aquila-ark-salt', 32) : this.key;
      const decipher = crypto.createDecipheriv(this.algorithm, key, Buffer.from(iv, 'hex'));
      decipher.setAuthTag(Buffer.from(tag, 'hex'));
      
      let decrypted = decipher.update(content, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch {
      logger.error('[SovereignEncryption] Erro ao descriptografar dados. Chave inválida ou dados corrompidos.');
      throw new Error('Falha na descriptografia.');
    }
  }

  /**
   * Criptografa um objeto (payload) para transporte na malha P2P.
   */
  public encryptPayload(payload: Record<string, unknown> | unknown[], customKey?: string): { iv: string, content: string, tag: string } {
    return this.encrypt(JSON.stringify(payload), customKey);
  }

  /**
   * Descriptografa um objeto recebido da malha.
   */
  public decryptPayload<T = Record<string, unknown> | unknown[]>(
    encryptedPayload: { iv: string, content: string, tag: string },
    customKey?: string
  ): T {
    const decrypted = this.decrypt(encryptedPayload.iv, encryptedPayload.content, encryptedPayload.tag, customKey);
    return JSON.parse(decrypted) as T;
  }
}

export const sovereignEncryptionService = SovereignEncryptionService.getInstance();
