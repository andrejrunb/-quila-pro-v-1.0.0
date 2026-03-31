import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';

/**
 * EvidenceArchiver.ts — Sistema de Arquivamento de Evidências Visuais (v1605)
 * Salva frames de incidentes críticos para futura auditoria legal.
 */
export class EvidenceArchiver {
  private baseDir: string;

  constructor() {
    const userData = app.getPath('userData');
    this.baseDir = path.join(userData, 'Evidence');
    this._ensureDir();
  }

  private _ensureDir() {
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }
  }

  /**
   * Salva uma imagem (base64) associada a um incidente.
   */
  async archive(incidentId: string, base64Data: string): Promise<string | null> {
    try {
      const fileName = `evidence_${incidentId}_${Date.now()}.png`;
      const filePath = path.join(this.baseDir, fileName);
      
      // Remover header base64 se presente
      const cleanData = base64Data.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(cleanData, 'base64');
      
      await fs.promises.writeFile(filePath, buffer);
      console.log(`[EvidenceArchiver] Evidência salva em: ${filePath}`);
      return filePath;
    } catch (err) {
      console.error('[EvidenceArchiver] Erro ao arquivar evidência:', err);
      return null;
    }
  }

  /**
   * Obtém o caminho absoluto de uma evidência.
   */
  getPath(fileName: string): string {
    return path.join(this.baseDir, fileName);
  }

  /**
   * Limpeza de evidências antigas baseada na política de retenção.
   */
  async purgeOld(days: number): Promise<number> {
    // Implementar se necessário (AG-027 Data Retention)
    return 0;
  }
}

export const evidenceArchiver = new EvidenceArchiver();
