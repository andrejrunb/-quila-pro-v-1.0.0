import { logger } from '../logger';

export interface UserContextSnapshot {
  userId: string;
  pageId: string;
  params: any;
  scrollPosition: number;
  timestamp: number;
  deviceSource: 'DESKTOP' | 'MOBILE';
}

/**
 * ContextHandoffService (Nível 33)
 * Gerencia a transferência fluida de estado entre dispositivos.
 * Permite "Continuar no Celular" ou vice-versa.
 */
export class ContextHandoffService {
  private static instance: ContextHandoffService;
  private activeSnapshots: Map<string, UserContextSnapshot> = new Map();

  private constructor() {}

  public static getInstance(): ContextHandoffService {
    if (!ContextHandoffService.instance) {
      ContextHandoffService.instance = new ContextHandoffService();
    }
    return ContextHandoffService.instance;
  }

  /**
   * Captura o estado atual para handoff.
   */
  public pushContext(snapshot: UserContextSnapshot) {
    this.activeSnapshots.set(snapshot.userId, snapshot);
    logger.info(`[Handoff] Contexto capturado para ${snapshot.userId}: ${snapshot.pageId}`);
    
    // Notifica o MobileCompanion para que o app móvel saiba que há um handoff pronto
    const { mobileCompanionService } = require('./MobileCompanionService');
    // mobileCompanionService.broadcast('handoff:ready', snapshot);
  }

  /**
   * Recupera o último contexto disponível para o usuário.
   */
  public pullContext(userId: string): UserContextSnapshot | undefined {
    return this.activeSnapshots.get(userId);
  }

  public clearContext(userId: string) {
    this.activeSnapshots.delete(userId);
  }
}

export const contextHandoffService = ContextHandoffService.getInstance();
