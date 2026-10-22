/**
 * BackupManager.ts — Item 19/58: Gestão de Backups Compactados
 * Realiza cópias de segurança do banco de dados SQLite em formato ZIP.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as archiver from 'archiver';
import { LicenseManager } from './LicenseManager';
import { ImmutableAuditLog } from './ImmutableAuditLog';

export class BackupManager {
  private intervalHandle: NodeJS.Timeout | null = null;
  private readonly backupPath: string;

  constructor(
    private readonly dbPath: string,
    private readonly license: LicenseManager,
    private readonly baseDir: string,
    private readonly auditLog: ImmutableAuditLog
  ) {
    this.backupPath = path.join(this.baseDir, 'backups');
    if (!fs.existsSync(this.backupPath)) {
      fs.mkdirSync(this.backupPath, { recursive: true });
    }
  }

  scheduleBackup(): void {
    if (this.intervalHandle) return;

    const tier = this.license.getTier();
    let intervalMs = 24 * 60 * 60 * 1000; // Default: 24h

    if (tier === 'pro') intervalMs = 12 * 60 * 60 * 1000;   // 12h
    if (tier === 'elite' || tier === 'perpetual') intervalMs = 4 * 60 * 60 * 1000; // 4h

    this.intervalHandle = setInterval(() => this.backupNow(), intervalMs);
    console.log(`[BackupManager] Agendado para cada ${intervalMs / 3600000} horas (Plano: ${tier}).`);
  }

  stop(): void {
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = null;
    }
  }

  /**
   * Executa um backup imediato com compressão ZIP (Item 58).
   */
  async backupNow(): Promise<{ path: string; name: string; size: number; timestamp: number; integrity: boolean; }> {
    const timestamp = Date.now();
    const zipFileName = `Backup_Eagle_${timestamp}.zip`;
    const dest = path.join(this.backupPath, zipFileName);

    // Verificação de Integridade (Phase 1000 - ImmutableAuditLog)
    const auditStatus = await this.auditLog.verify();
    if (!auditStatus.valid) {
      console.error(`[BackupManager] ALERTA: Audit Log comprometido! Primeiro erro no ID: ${auditStatus.firstBrokenId}`);
    }

    return new Promise((resolve, reject) => {
      const output = fs.createWriteStream(dest);
      const archive = archiver('zip', { zlib: { level: 9 } });

      output.on('close', () => {
        const size = archive.pointer();
        console.log(`[BackupManager] Backup compactado concluído: ${zipFileName} (${size} bytes)`);
        this._cleanupOldBackups();
        resolve({
          path: dest,
          name: zipFileName,
          size,
          timestamp,
          integrity: auditStatus.valid
        });
      });

      archive.on('error', (err) => {
        console.error('[BackupManager] Erro na compressão:', err);
        reject(err);
      });

      archive.pipe(output);
      
      // Adicionar o DB ao zip
      if (fs.existsSync(this.dbPath)) {
        archive.file(this.dbPath, { name: 'database.sqlite' });
      }

      // Adicionar relatório de integridade ao backup
      const reportContent = `Relatório de Integridade Áquila Pro\n` +
        `Data: ${new Date().toISOString()}\n` +
        `Status AuditLog: ${auditStatus.valid ? 'INTEGRO' : 'COMPROMETIDO'}\n` +
        `${!auditStatus.valid ? 'ERRO DETECTADO NO ID: ' + auditStatus.firstBrokenId : ''}\n` +
        `Total de entradas auditadas: ${auditStatus.totalEntries}\n`;
      
      archive.append(reportContent, { name: 'integrity_report.txt' });
      
      this.auditLog.record('SYSTEM', 'INSERT', zipFileName, { 
        fileName: zipFileName, 
        integrity: auditStatus.valid,
        totalEntries: 0 // Mocked for now (was totalEntries)
      }, 'system').then(() => {
        archive.finalize();
      }).catch(err => {
        console.error('[BackupManager] Erro ao gravar audit log do backup:', err);
        archive.finalize();
      });
    });
  }

  /**
   * Mantém apenas os últimos backups baseados no Tier.
   */
  private _cleanupOldBackups(): void {
    try {
      const files = fs.readdirSync(this.backupPath)
        .filter(f => f.endsWith('.zip'))
        .map(f => ({ name: f, time: fs.statSync(path.join(this.backupPath, f)).mtime.getTime() }))
        .sort((a, b) => b.time - a.time);

      const limit = this.license.getTier() === 'starter' ? 10 : 50;
      const toDelete = files.slice(limit);

      for (const f of toDelete) {
        fs.unlinkSync(path.join(this.backupPath, f.name));
      }
    } catch (err) {
      console.warn('[BackupManager] Erro ao limpar backups antigos:', err);
    }
  }
}

