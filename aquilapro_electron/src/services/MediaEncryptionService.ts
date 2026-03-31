import * as crypto from 'crypto';
import * as fs from 'fs';
import { licenseService } from './LicenseService';

/**
 * MediaEncryptionService.ts — AG-024
 * Criptografia militar para fotos de alunos (Repouso).
 */
class MediaEncryptionService {
  private readonly algorithm = 'aes-256-cbc';
  private readonly ivLength = 16;

  /**
   * Criptografa um arquivo de imagem.
   */
  public async encryptFile(filePath: string): Promise<void> {
    const key = this._getHardwareKey();
    const iv = crypto.randomBytes(this.ivLength);
    const input = fs.readFileSync(filePath);

    const cipher = crypto.createCipheriv(this.algorithm, key, iv);
    const encrypted = Buffer.concat([iv, cipher.update(input), cipher.final()]);

    fs.writeFileSync(filePath + '.enc', encrypted);
    fs.unlinkSync(filePath); // Remove original inseguro
    console.log(`[MediaEncryption] Arquivo ${filePath} protegido com AES-256.`);
  }

  /**
   * Decriptografa um arquivo para exibição temporária.
   */
  public decryptFile(encryptedPath: string): Buffer {
    const key = this._getHardwareKey();
    const data = fs.readFileSync(encryptedPath);
    
    const iv = data.slice(0, this.ivLength);
    const encryptedText = data.slice(this.ivLength);

    const decipher = crypto.createDecipheriv(this.algorithm, key, iv);
    return Buffer.concat([decipher.update(encryptedText), decipher.final()]);
  }

  private _getHardwareKey(): Buffer {
    // Deriva a chave do Hardware ID para impedir que as fotos sejam lidas em outro PC (Item 69)
    const hwId = licenseService.getHardwareId();
    return crypto.createHash('sha256').update(hwId).digest();
  }
}

export const mediaEncryption = new MediaEncryptionService();
export default mediaEncryption;
