import { logger } from '../logger';
import { seamlessIdentityService } from './SeamlessIdentityService';

/**
 * PresenceContextManager (Nível 34)
 * Orquestra a troca de perfis e contextos na interface baseada na presença física.
 */
export class PresenceContextManager {
  private static instance: PresenceContextManager;

  private constructor() {
    this.setupListeners();
  }

  public static getInstance(): PresenceContextManager {
    if (!PresenceContextManager.instance) {
      PresenceContextManager.instance = new PresenceContextManager();
    }
    return PresenceContextManager.instance;
  }

  private setupListeners() {
    seamlessIdentityService.on('identity:changed', (presence) => {
      logger.info(`[ContextManager] Trocando contexto para ${presence.role}...`);
      // Lógica para injetar novas permissões dinamicamente no barramento
    });

    seamlessIdentityService.on('identity:lost', () => {
      logger.warn('[ContextManager] Protegendo interface por ausência de usuário.');
      // Lógica para bloquear ou borrar a tela
    });
  }

  public async getPresenceStatus() {
     return seamlessIdentityService.getCurrentIdentity();
  }
}

export const presenceContextManager = PresenceContextManager.getInstance();
