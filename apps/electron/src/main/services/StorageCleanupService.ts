import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';

/**
 * StorageCleanupService.ts — AG-006
 * Mantém a saúde do disco limpando arquivos antigos.
 */
class StorageCleanupService {
  private readonly MAX_AGE_DAYS = 7;
  private readonly TEMP_MAX_AGE_HOURS = 1; // Frames temporários duram pouco
  
  private paths = {
    detections: path.join(app.getPath('userData'), 'detections'),
    frames: path.join(app.getPath('userData'), 'temp_frames'),
    backups: path.join(app.getPath('userData'), 'backups')
  };

  public runCleanup() {
    console.log('StorageCleanupService: Iniciando limpeza de rotina...');
    
    this.cleanupDirectory(this.paths.frames, this.TEMP_MAX_AGE_HOURS * 60 * 60 * 1000);
    this.cleanupDirectory(this.paths.detections, this.MAX_AGE_DAYS * 24 * 60 * 60 * 1000);
    // Backups mantemos por mais tempo ou por limite de cota, mas por agora 30 dias
    this.cleanupDirectory(this.paths.backups, 30 * 24 * 60 * 60 * 1000);
  }

  private cleanupDirectory(dir: string, maxAgeMs: number) {
    if (!fs.existsSync(dir)) return;

    try {
      const files = fs.readdirSync(dir);
      const now = Date.now();
      let count = 0;

      files.forEach(file => {
        const filePath = path.join(dir, file);
        const stats = fs.statSync(filePath);
        
        if (now - stats.mtimeMs > maxAgeMs) {
          fs.unlinkSync(filePath);
          count++;
        }
      });

      if (count > 0) {
        console.log(`StorageCleanupService: Removidos ${count} arquivos antigos em ${path.basename(dir)}.`);
      }
    } catch (err) {
      console.error(`StorageCleanupService: Erro ao limpar ${dir}:`, err);
    }
  }

  public schedule(intervalMs: number = 3600000) { // Default: 1 hora
    setInterval(() => this.runCleanup(), intervalMs);
    this.runCleanup(); // Primeira execução imediata
  }
}

export const storageCleanup = new StorageCleanupService();
export default storageCleanup;

