/**
 * Step 116 — AiAnalysisService
 * Gerencia detecções avançadas (armas, aglomerações, comportamentos)
 * integrando-se ao motor de IA local e disparando alertas para a UI e WhatsApp.
 */
import { EventEmitter } from 'events';
import type { SecurityEvent, SecurityEventType } from './AiTypes';
export type { SecurityEvent, SecurityEventType };


class AiAnalysisService extends EventEmitter {
  private events: SecurityEvent[] = [];

  constructor() {
    super();
    this.setupIpcListeners();
  }

  private setupIpcListeners() {
    const api = (window as any).aquila;
    if (api?.on) {
      api.on('ai-security-event', (event: SecurityEvent) => {
        this.handleNewEvent(event);
      });
    }
  }

  public handleNewEvent(event: SecurityEvent) {
    this.events.unshift(event);
    if (this.events.length > 50) this.events.pop();
    
    // Dispara para a UI local
    this.emit('new-event', event);

    // TODO: Integrar com WhatsAppService para notificações críticas
    if (event.confidence > 0.85) {
      this.triggerCriticalNotification(event);
    }
  }

  private triggerCriticalNotification(event: SecurityEvent) {
    console.warn(`[CRITICAL] Detecção de ${event.type} na câmera ${event.cameraName}`);
    
    // Step 119 — Integração com Evolution API via IPC
    const api = (window as any).aquila;
    if (api?.invoke) {
      api.invoke('whatsapp:send-security-alert', {
        type: event.type,
        location: event.cameraName,
        confidence: event.confidence,
        timestamp: event.timestamp
      }).catch((err: any) => console.error('Falha ao enviar alerta WhatsApp:', err));
    }
  }

  public getRecentEvents() {
    return this.events;
  }
}

export const aiAnalysisService = new AiAnalysisService();
export default aiAnalysisService;
