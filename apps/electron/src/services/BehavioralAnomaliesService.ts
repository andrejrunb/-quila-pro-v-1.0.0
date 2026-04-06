import { EventEmitter } from 'events';

export interface AnomalyEvent {
  type: 'RUNNING' | 'FALL_DETECTED' | 'SUDDEN_CROWD';
  zone: string;
  confidence: number;
}

/**
 * BehavioralAnomaliesService.ts — AG-019
 * Detecção proativa de incidentes via visão computacional.
 */
class BehavioralAnomaliesService extends EventEmitter {
  
  public processMetrics(zone: string, data: any) {
    // Lógica simplificada (Item 89)
    // No futuro, isso analisará vetores de movimento (Optical Flow)
    if (data.velocity > 5.0) { // Velocidade em pixels/frame fictícia
        this.emit('anomaly', {
            type: 'RUNNING',
            zone,
            confidence: 0.85
        } as AnomalyEvent);
        console.warn(`[Anomaly] Correria detectada na zona ${zone}!`);
    }

    if (data.is_horizontal && data.impact > 0.8) {
        this.emit('anomaly', {
            type: 'FALL_DETECTED',
            zone,
            confidence: 0.92
        } as AnomalyEvent);
        console.error(`[Anomaly] Possível QUEDA na zona ${zone}!`);
    }
  }
}

export const anomalyService = new BehavioralAnomaliesService();
export default anomalyService;
