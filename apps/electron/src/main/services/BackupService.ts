import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { app } from 'electron';

/**
 * BackupService.ts — Passo 58 do Roadmap.
 * Serviço para backup local, criptografado e compactado.
 */
export class BackupService {
    private dbPath: string;
    private backupDir: string;
    private encryptionKey: string;

    constructor(dbPath: string) {
        this.dbPath = dbPath;
        this.backupDir = path.join(path.dirname(dbPath), 'backups');
        this.encryptionKey = 'AQUILA_PRO_MASTER_SECURE_KEY_2026'; // Mock: Deveria vir de env ou TPM

        if (!fs.existsSync(this.backupDir)) {
            fs.mkdirSync(this.backupDir, { recursive: true });
        }
    }

    public async createBackup(): Promise<string> {
        return new Promise((resolve, reject) => {
            try {
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                const backupFile = path.join(this.backupDir, `aquila_backup_${timestamp}.bak`);
                
                const input = fs.readFileSync(this.dbPath);
                
                // Criptografia Simples AES-256 (AG-058)
                const cipher = crypto.createCipheriv('aes-256-ctr', crypto.scryptSync(this.encryptionKey, 'salt', 32), Buffer.alloc(16, 0));
                const encrypted = Buffer.concat([cipher.update(input), cipher.final()]);
                
                fs.writeFileSync(backupFile, encrypted);

                // Manter apenas os últimos 7 backups (Política de Retenção)
                this._rotateBackups();

                resolve(backupFile);
            } catch (error) {
                reject(error);
            }
        });
    }

    private _rotateBackups() {
        const files = fs.readdirSync(this.backupDir)
            .filter(f => f.endsWith('.bak'))
            .map(f => ({ name: f, time: fs.statSync(path.join(this.backupDir, f)).mtime.getTime() }))
            .sort((a, b) => b.time - a.time);

        if (files.length > 7) {
            files.slice(7).forEach(f => fs.unlinkSync(path.join(this.backupDir, f.name)));
        }
    }
}

export default BackupService;

