import { logger } from '../main/logger';

/**
 * AriaLiveService - Camada 2 SQA-1000 (ACC-501)
 * Gestão de anúncios para leitores de tela em tempo real.
 */
export class AriaLiveService {
  private static instance: AriaLiveService;

  private constructor() {}

  public static getInstance(): AriaLiveService {
    if (!AriaLiveService.instance) {
      AriaLiveService.instance = new AriaLiveService();
    }
    return AriaLiveService.instance;
  }

  /**
   * [SQA-ACC-501] Envia uma mensagem para ser anunciada pela UI.
   * politeness: 'polite' (não interrompe) ou 'assertive' (interrompe agora).
   */
  public announce(message: string, politeness: 'polite' | 'assertive' = 'polite'): void {
    logger.info(`[Aria-Live] Mensagem registrada: "${message}" (Modo: ${politeness})`);
    
    // Dispara evento para a UI capturar via window.dispatchEvent
    const event = new CustomEvent('aria-announcement', {
      detail: { message, politeness }
    });
    window.dispatchEvent(event);
  }
}

export const ariaLiveService = AriaLiveService.getInstance();
