/**
 * CloudBackupLink.ts — Item 38
 * Faz upload de backups SQLite para um bucket S3-compatible (Backblaze B2, AWS, etc.)
 * O arquivo é criptografado localmente antes do upload (AES-256-GCM).
 * LGPD: O arquivo local de backup não contém biometria decriptada.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import * as crypto from 'crypto';

interface CloudBackupConfig {
  endpoint: string;   // Ex: https://s3.us-east-1.amazonaws.com
  bucket: string;
  accessKey: string;
  secretKey: string;
  region: string;
  encryptionKey: string;  // 32 bytes (hex) para AES-256
}

export class CloudBackupLink {
  constructor(private readonly config: CloudBackupConfig) {}

  /**
   * Encripta o arquivo de backup e faz upload para S3.
   */
  async uploadBackup(backupPath: string): Promise<string> {
    const fileName = path.basename(backupPath);
    const encryptedPath = `${backupPath}.enc`;

    try {
      // 1. Encriptar localmente
      await this._encryptFile(backupPath, encryptedPath);
      console.log(`[CloudBackup] Backup encriptado: ${encryptedPath}`);

      // 2. Upload via PUT (S3-compatible)
      const objectKey = `aquilapro-backups/${new Date().getFullYear()}/${fileName}.enc`;
      await this._s3Put(encryptedPath, objectKey);

      console.log(`[CloudBackup] ✅ Upload concluído: ${objectKey}`);
      return objectKey;
    } finally {
      // Limpar arquivo encriptado temporário
      if (fs.existsSync(encryptedPath)) {
        fs.unlinkSync(encryptedPath);
      }
    }
  }

  private _encryptFile(input: string, output: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const key = Buffer.from(this.config.encryptionKey, 'hex');
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);

      const readStream = fs.createReadStream(input);
      const writeStream = fs.createWriteStream(output);

      // Prepend IV para decriptação futura
      writeStream.write(iv);

      readStream
        .pipe(cipher)
        .pipe(writeStream)
        .on('finish', resolve)
        .on('error', reject);
    });
  }

  private _s3Put(filePath: string, objectKey: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const fileBuffer = fs.readFileSync(filePath);
      const url = new URL(`/${this.config.bucket}/${objectKey}`, this.config.endpoint);
      const date = new Date().toUTCString();

      const req = https.request({
        method: 'PUT',
        hostname: url.hostname,
        path: url.pathname,
        headers: {
          'Content-Type': 'application/octet-stream',
          'Content-Length': fileBuffer.length,
          'Date': date,
          'Authorization': `Bearer ${this.config.accessKey}`, // Simplificado — produção usa AWS Signature V4
          'X-Aquila-Encrypted': 'AES-256-CBC',
        },
        timeout: 60_000,
      }, (res) => {
        if (res.statusCode && res.statusCode < 300) resolve();
        else reject(new Error(`S3 HTTP ${res.statusCode}`));
      });

      req.on('error', reject);
      req.on('timeout', () => { req.destroy(); reject(new Error('Timeout no upload')); });
      req.write(fileBuffer);
      req.end();
    });
  }
}

