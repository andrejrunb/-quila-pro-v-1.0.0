import { logger } from '../logger';
import { EventEmitter } from 'events';

export interface IdentityPresence {
  userId: string;
  name: string;
  role: string;
  confidence: number;
  lastSeen: number;
}

/**
 * SeamlessIdentityService (Nível 34)
 * Gerencia a autenticação contínua e invisível via biometria.
 * Elimina a necessidade de logins manuais em dispositivos autorizados.
 */
export class SeamlessIdentityService extends EventEmitter {
  private static instance: SeamlessIdentityService;
  private currentPresence: IdentityPresence | null = null;
  private presenceTimeout: number = 5000; // 5 segundos sem ver o rosto = ausente

  private constructor() {
    super();
    this.startInactivityWatchdog();
  }

  public static getInstance(): SeamlessIdentityService {
    if (!SeamlessIdentityService.instance) {
      SeamlessIdentityService.instance = new SeamlessIdentityService();
    }
    return SeamlessIdentityService.instance;
  }

  /**
   * Notifica a presença de uma identidade reconhecida.
   */
  public reportPresence(presence: IdentityPresence) {
    if (!this.currentPresence || this.currentPresence.userId !== presence.userId) {
      logger.info(`[Seamless] Nova identidade detectada: ${presence.name} (${presence.role})`);
      this.currentPresence = presence;
      this.emit('identity:changed', presence);
    } else {
      this.currentPresence.lastSeen = Date.now();
      this.currentPresence.confidence = presence.confidence;
    }
  }

  public getCurrentIdentity(): IdentityPresence | null {
    return this.currentPresence;
  }

  /**
   * Watchdog para detectar quando o usuário se afasta da tela.
   */
  private startInactivityWatchdog() {
    setInterval(() => {
      if (this.currentPresence && Date.now() - this.currentPresence.lastSeen > this.presenceTimeout) {
        logger.warn(`[Seamless] Identidade perdida (Ausência): ${this.currentPresence.name}`);
        this.currentPresence = null;
        this.emit('identity:lost');
      }
    }, 1000);
  }
}

export const seamlessIdentityService = SeamlessIdentityService.getInstance();
