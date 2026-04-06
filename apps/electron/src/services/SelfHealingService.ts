import { EventEmitter } from 'events';

/**
 * SelfHealingService.ts — AG-025
 * Mantém o sistema Áquila Pro resiliente a falhas críticas.
 */
class SelfHealingService extends EventEmitter {
  private healthChecks = new Map<string, { lastHeartbeat: number; restartCount: number }>();
  private readonly HEARTBEAT_THRESHOLD_MS = 30_000; // 30s sem sinal = crash detectado

  constructor() {
    super();
    // Iniciar loop de monitoramento
    setInterval(() => this._checkHealth(), 10_000);
  }

  /**
   * Registra um sinal de vida de um serviço.
   */
  public reportHeartbeat(serviceId: string) {
    const info = this.healthChecks.get(serviceId) || { lastHeartbeat: Date.now(), restartCount: 0 };
    info.lastHeartbeat = Date.now();
    this.healthChecks.set(serviceId, info);
  }

  private _checkHealth() {
    const now = Date.now();
    for (const [id, info] of this.healthChecks.entries()) {
      if (now - info.lastHeartbeat > this.HEARTBEAT_THRESHOLD_MS) {
        console.error(`[SelfHealing] Serviço ${id} parou de responder! Reiniciando...`);
        info.restartCount++;
        info.lastHeartbeat = now; // Previne loops infinitos imediatos
        this.emit('service-restart', { id, restartCount: info.restartCount });
      }
    }
  }
}

export const selfHealing = new SelfHealingService();
export default selfHealing;
