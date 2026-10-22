import * as fs from 'fs';
import * as path from 'path';
import { logger } from '../logger';
import { db } from '../../database/Database';

/**
 * PhotoLifecycleService (v3460)
 * Garante que fotos sensíveis não persistam desnecessariamente no hardware.
 */
export class PhotoLifecycleService {
  private photosDir: string;

  constructor(photosDir: string) {
    this.photosDir = photosDir;
  }

  /**
   * Deleta uma foto após o processamento da IA ter sido confirmado pelo usuário.
   */
  public async purgeProcessedImage(photoFileName: string) {
    const fullPath = path.join(this.photosDir, photoFileName);

    try {
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
        logger.info(`[Media] Foto expurgada com sucesso: ${photoFileName}`);
      } else {
        logger.warn(`[Media] Tentativa de deletar foto inexistente: ${photoFileName}`);
      }
    } catch (error) {
      logger.error(`[Media] Erro ao deletar foto ${photoFileName}: ${error}`);
    }
  }

  /**
   * Limpeza de segurança para arquivos órfãos (ex: fotos processadas mas não deletadas por erro).
   */
  public async runCleanupTask() {
    logger.info(`[Media] Iniciando tarefa de limpeza de mídia órfã.`);
    // Lógica para comparar arquivos no disco com registros 'pending' no banco...
  }
}

export const photoLifecycleService = new PhotoLifecycleService(path.join(process.env.APPDATA || '', 'AquilaPro', 'photos'));
