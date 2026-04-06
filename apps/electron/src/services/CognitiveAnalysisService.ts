import { environmentalService, EnvironmentalData } from './EnvironmentalService';
import { EventEmitter } from 'events';

/**
 * COGNITIVE ANALYSIS SERVICE (v3610)
 * ----------------------------------
 * Correlates environmental telemetry with cognitive performance metrics.
 * Triggers automated health interventions (Hypoxia alerts, Ventilation).
 */

export interface CognitiveAlert {
  id: string;
  roomId: string;
  type: 'HYPOXIA_RISK' | 'THERMAL_STRESS' | 'VOC_CONCENTRATION';
  severity: 'low' | 'medium' | 'high';
  message: string;
  timestamp: number;
}

class CognitiveAnalysisService extends EventEmitter {
  private activeAlerts: Map<string, CognitiveAlert> = new Map();

  constructor() {
    super();
    this.startAnalysis();
  }

  private startAnalysis() {
    environmentalService.on('all-rooms-updated', (rooms: EnvironmentalData[]) => {
      rooms.forEach(room => this.analyzeRoom(room));
    });
  }

  private analyzeRoom(room: EnvironmentalData) {
    // CO2 -> Hypoxia Correlation
    if (room.co2 > 950) {
      this.triggerAlert({
        id: `hypoxia_${room.roomId}`,
        roomId: room.roomId,
        type: 'HYPOXIA_RISK',
        severity: room.co2 > 1200 ? 'high' : 'medium',
        message: `High CO2 levels (${room.co2}ppm) detected in ${room.roomId}. Cognitive output may drop by 15%.`,
        timestamp: Date.now()
      });
    } else {
      this.clearAlert(`hypoxia_${room.roomId}`);
    }

    // Thermal Stress
    if (room.temperature > 26) {
      this.triggerAlert({
        id: `thermal_${room.roomId}`,
        roomId: room.roomId,
        type: 'THERMAL_STRESS',
        severity: 'medium',
        message: `Elevated temperature in ${room.roomId}. Academic retention peak is 21-23°C.`,
        timestamp: Date.now()
      });
    } else {
      this.clearAlert(`thermal_${room.roomId}`);
    }
  }

  private triggerAlert(alert: CognitiveAlert) {
    if (!this.activeAlerts.has(alert.id)) {
      this.activeAlerts.set(alert.id, alert);
      this.emit('new-alert', alert);
      console.warn(`[CognitiveSafety] ALERT in ${alert.roomId}: ${alert.message}`);
    }
  }

  private clearAlert(id: string) {
    if (this.activeAlerts.has(id)) {
      this.activeAlerts.delete(id);
      this.emit('alert-cleared', id);
    }
  }

  public getAlertsForRoom(roomId: string): CognitiveAlert[] {
    return Array.from(this.activeAlerts.values()).filter(a => a.roomId === roomId);
  }
}

export const cognitiveAnalysisService = new CognitiveAnalysisService();
