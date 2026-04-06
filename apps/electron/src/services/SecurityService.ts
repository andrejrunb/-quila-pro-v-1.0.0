import crypto from 'crypto';
import os from 'os';
import { securityHardening } from './SecurityHardeningService';

/**
 * SecurityService - Passo 02 do Roadmap Master
 * Responsável por criptografia local e blindagem de dados sensíveis.
 */
export class SecurityService {
  private algorithm = 'aes-256-gcm';
  private key: Buffer;

  constructor() {
    // A chave é derivada de um segredo único do hardware 
    const salt = 'aquila-pro-secure-salt-v1';
    const hwSecret = os.hostname() + os.arch() + (process.env.COMPUTERNAME || 'eagle-device');
    this.key = crypto.pbkdf2Sync(hwSecret, salt, 10000, 32, 'sha256');
  }

  /**
   * [SQA-SEC-002] Rotaciona a chave de criptografia ativa
   */
  public rotateKey(): void {
    this.key = securityHardening.rotateEncryptionKeys(this.key);
  }

  /**
   * [SQA-SEC-001] Validação de Checksums do Kernel
   */
  public async auditBinaries(paths: string[]): Promise<boolean> {
    return await securityHardening.validateNapiChecksums(paths);
  }

  /**
   * Criptografa dados sensíveis antes de salvar no banco
   */
  public encrypt(text: string): string {
    const iv = crypto.randomBytes(12); // GCM standard IV size
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv) as crypto.CipherGCM;
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    const authTag = cipher.getAuthTag();
    return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted.toString('hex');
  }

  /**
   * Descriptografa dados lidos do banco
   */
  public decrypt(text: string): string {
    try {
      const textParts = text.split(':');
      if (textParts.length === 3) {
        // GCM new format
        const iv = Buffer.from(textParts[0], 'hex');
        const authTag = Buffer.from(textParts[1], 'hex');
        const encryptedText = Buffer.from(textParts[2], 'hex');
        const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv) as crypto.DecipherGCM;
        decipher.setAuthTag(authTag);
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return decrypted.toString();
      } else if (textParts.length === 2) {
        // Fallback CBC legacy format
        const iv = Buffer.from(textParts[0], 'hex');
        const encryptedText = Buffer.from(textParts[1], 'hex');
        const decipher = crypto.createDecipheriv('aes-256-cbc', this.key, iv);
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return decrypted.toString();
      }
      return '';
    } catch (err) {
      console.error('[SECURITY] Decryption failed:', err);
      return '';
    }
  }

  /**
   * Versão para dados binários (Buffer)
   */
  public encryptBuffer(buffer: Buffer): Buffer {
    const iv = crypto.randomBytes(12); // GCM standard IV size
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv) as crypto.CipherGCM;
    const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return Buffer.concat([iv, authTag, encrypted]); // 12 bytes IV + 16 bytes AuthTag + variable encrypted
  }

  public decryptBuffer(data: Buffer): Buffer {
    try {
      // If it's the new format, IV is 12 bytes, authTag is 16 bytes
      const iv = data.slice(0, 12);
      const authTag = data.slice(12, 28);
      const encrypted = data.slice(28);
      const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv) as crypto.DecipherGCM;
      decipher.setAuthTag(authTag);
      return Buffer.concat([decipher.update(encrypted), decipher.final()]);
    } catch (err) {
      console.error('[SECURITY] Buffer decryption failed:', err);
      // Optional: implement legacy CBC fallback if legacy buffers are expected, 
      // but usually buffers are ephemeral in this app, so fallback skipped.
      return Buffer.alloc(0);
    }
  }
}

export const securityService = new SecurityService();
