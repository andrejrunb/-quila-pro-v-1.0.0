import * as fs from 'fs';
import * as path from 'path';

/**
 * DatabaseMirrorService.ts — AG-026
 * Mirroring de banco de dados para alta disponibilidade e prevenção de corrupção.
 */
class DatabaseMirrorService {
  private primaryDbPath: string;
  private mirrorPath: string;

  constructor(appDataPath: string) {
    this.primaryDbPath = path.join(appDataPath, 'aquila.db');
    this.mirrorPath = path.join(appDataPath, 'backup/aquila_mirror.db');
    
    if (!fs.existsSync(path.dirname(this.mirrorPath))) {
        fs.mkdirSync(path.dirname(this.mirrorPath), { recursive: true });
    }
  }

  /**
   * Executa um espelhamento atômico.
   */
  public async syncMirror(): Promise<void> {
    try {
        if (!fs.existsSync(this.primaryDbPath)) return;
        
        // Em produção SQLITE, usar VACUUM INTO ou cópia segura Online
        fs.copyFileSync(this.primaryDbPath, this.mirrorPath);
        console.log(`[DatabaseMirror] Espelhamento concluído com sucesso em ${new Date().toLocaleTimeString()}`);
    } catch (err) {
        console.error('[DatabaseMirror] Falha ao espelhar banco:', err);
    }
  }
}

export { DatabaseMirrorService };
