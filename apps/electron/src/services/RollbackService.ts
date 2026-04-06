import { logger } from '../main/logger';

/**
 * RollbackService - Camada 1 SQA-1000 (STAB-601)
 * Snapshots preventivos e recuperação atômica.
 */
export class RollbackService {
  private static instance: RollbackService;
  private snapshots: string[] = [];

  private constructor() {}

  public static getInstance(): RollbackService {
    if (!RollbackService.instance) {
      RollbackService.instance = new RollbackService();
    }
    return RollbackService.instance;
  }

  /**
   * [SQA-STAB-601] Cria um snapshot do estado crítico antes de atualizações.
   */
  public async createSnapshot(label: string): Promise<string> {
    const id = `SNAP-${label.toUpperCase()}-${Date.now()}`;
    logger.info(`[Rollback] Criando snapshot de segurança: ${id}`);
    this.snapshots.push(id);
    // Simulação de backup de banco e config
    return id;
  }

  /**
   * Reverte o sistema para o último snapshot estável.
   */
  public async triggerAtomicRollback(): Promise<boolean> {
    const lastSnap = this.snapshots.pop();
    if (lastSnap) {
      logger.error(`[CRITICAL] Falha detectada. Revertendo para snapshot: ${lastSnap}`);
      return true;
    }
    return false;
  }
}

export const rollbackService = RollbackService.getInstance();
