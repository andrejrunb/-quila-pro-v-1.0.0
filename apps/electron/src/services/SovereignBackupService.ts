import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { logger } from '../main/logger';

/**
 * SovereignBackupService - O Escudo Cold Storage (v3469)
 * Gerencia backups criptografados em mídias físicas externa.
 */
export class SovereignBackupService {
  private static instance: SovereignBackupService;
  private readonly ALGORITHM = 'aes-256-cbc';
  private readonly BACKUP_PATH = 'D:/AquilaBackups'; // Caminho padrão para USB

  private constructor() {}

  public static getInstance(): SovereignBackupService {
    if (!SovereignBackupService.instance) {
      SovereignBackupService.instance = new SovereignBackupService();
    }
    return SovereignBackupService.instance;
  }

  /**
   * [SQA-BCK-301] Executa backup criptografado completo
   */
  public async performSovereignBackup(sourcePath: string, schoolSecret: string) {
    logger.info('[Backup] Iniciando Cold Storage Mirror...');
    
    try {
      if (!fs.existsSync(this.BACKUP_PATH)) {
        fs.mkdirSync(this.BACKUP_PATH, { recursive: true });
      }

      const iv = crypto.randomBytes(16);
      const key = crypto.scryptSync(schoolSecret, 'salt', 32);
      const cipher = crypto.createCipheriv(this.ALGORITHM, key, iv);

      const fileName = `aquila_pro_${new Date().toISOString().split('T')[0]}.enc`;
      const targetFilePath = path.join(this.BACKUP_PATH, fileName);

      const input = fs.createReadStream(sourcePath);
      const output = fs.createWriteStream(targetFilePath);

      // Escrever o IV no início do arquivo para decriptação posterior
      output.write(iv);

      input.pipe(cipher).pipe(output);

      return new Promise((resolve, reject) => {
        output.on('finish', () => {
          logger.info(`[Backup] Backup Soberano concluído: ${fileName}`);
          resolve({ success: true, path: targetFilePath });
        });
        output.on('error', reject);
      });
    } catch (err) {
      logger.error(`[Backup] Falha no Cold Storage: ${err}`);
      return { success: false, error: err };
    }
  }

  /**
   * Monitoramento de drivers USB (v3469)
   */
  public async checkExternalMedia(): Promise<boolean> {
    return fs.existsSync('D:/') || fs.existsSync('E:/');
  }
}

export const backupService = SovereignBackupService.getInstance();
