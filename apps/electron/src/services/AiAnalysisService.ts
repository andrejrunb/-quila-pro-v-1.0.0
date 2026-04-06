/**
 * Step 116 — AiAnalysisService
 * Gerencia detecções avançadas (armas, aglomerações, comportamentos)
 * integrando-se ao motor de IA local e disparando alertas para a UI e WhatsApp.
 */
import { EventEmitter } from 'events';
import { ollamaIntegration } from './OllamaIntegration';
import type { SecurityEvent, SecurityEventType } from './AiTypes';

export class AiAnalysisService extends EventEmitter {
  private events: SecurityEvent[] = [];

  constructor() {
    super();
  }

  public handleNewEvent(event: SecurityEvent) {
    this.events.unshift(event);
    if (this.events.length > 50) this.events.pop();
    
    // Dispara para quem estiver ouvindo no processo principal (ex: main.ts para ponte IPC)
    this.emit('new-event', event);

    // Step 119 — Alerta Crítico (Consumo direto de outros serviços no Main se necessário)
    if (event.confidence > 0.85) {
      this.triggerCriticalNotification(event);
    }
  }

  private triggerCriticalNotification(event: SecurityEvent) {
    console.warn(`[CRITICAL] Detecção de ${event.type} na câmera ${event.cameraName}`);
    
    // Emitimos um evento específico para que o main.ts possa repassar para o WhatsAppService
    // ou para a UI via WebContents.send
    this.emit('critical-alert', {
      type: event.type,
      location: event.cameraName,
      confidence: event.confidence,
      timestamp: event.timestamp
    });
  }

  /**
   * Analisa um texto para segurança de conteúdo usando o modelo local (Cycle 9).
   */
  public async analyzeSafeContent(prompt: string): Promise<string> {
     const res = await ollamaIntegration.generate(prompt);
     // Fallback simples se a I.A não retornar JSON
     if (!res.includes('{')) {
       return JSON.stringify({ inappropriate: false, reason: "Inconclusive", risk: "LOW" });
     }
     return res;
  }

  public getRecentEvents() {
    return this.events;
  }
}

export const aiAnalysisService = new AiAnalysisService();
export default aiAnalysisService;
