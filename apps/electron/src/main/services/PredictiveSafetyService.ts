/**
 * PredictiveSafetyService (v1641)
 * Analyzes real-time behavior patterns to predict risks without physical intervention.
 * Integrates PoseEstimation and Heatmap data for institutional safety.
 */

export enum SafetyAnomalyType {
  RUNNING = 'RUNNING',
  ISOLATION = 'ISOLATION',
  CROWDING = 'CROWDING',
  UNAUTHORIZED_ZONE = 'UNAUTHORIZED_ZONE'
}

export interface SafetyAnomaly {
  id: string;
  type: SafetyAnomalyType;
  location: string;
  confidence: number;
  timestamp: string;
  description: string;
}

class PredictiveSafetyService {
  private static instance: PredictiveSafetyService;
  private currentRiskLevel: number = 0; // 0-100

  private constructor() {}

  public static getInstance(): PredictiveSafetyService {
    if (!PredictiveSafetyService.instance) {
      PredictiveSafetyService.instance = new PredictiveSafetyService();
    }
    return PredictiveSafetyService.instance;
  }

  /**
   * Main analysis loop (simulated)
   * In production, this would subscribe to PoseEstimationService and HeatmapService streams.
   */
  public async analyzeScene(frameData: any): Promise<SafetyAnomaly[]> {
    const anomalies: SafetyAnomaly[] = [];

    // Logic: Detect Erratic Running (Simulated)
    if (frameData.velocity > 15) {
      anomalies.push({
         id: `anom-${Date.now()}-1`,
         type: SafetyAnomalyType.RUNNING,
         location: 'Corredor Central',
         confidence: 0.92,
         timestamp: new Date().toISOString(),
         description: 'Detecção de correria em área de alto tráfego.'
      });
    }

    // Logic: Detect Student Isolation (Simulated)
    if (frameData.proximity < 0.1 && frameData.duration > 300) {
      anomalies.push({
         id: `anom-${Date.now()}-2`,
         type: SafetyAnomalyType.ISOLATION,
         location: 'Pátio Externo - Zona Sombra',
         confidence: 0.85,
         timestamp: new Date().toISOString(),
         description: 'Aluno isolado por longo período em zona de baixa visibilidade.'
      });
    }

    // Logic: Detect Late Stay (v1642)
    const hour = new Date().getHours();
    if (hour >= 18 && frameData.occupancy > 0) {
      anomalies.push({
         id: `anom-${Date.now()}-3`,
         type: SafetyAnomalyType.UNAUTHORIZED_ZONE,
         location: 'Biblioteca',
         confidence: 0.99,
         timestamp: new Date().toISOString(),
         description: 'Permanência indevida após o horário de encerramento.'
      });
    }

    this.updateRiskLevel(anomalies);
    return anomalies;
  }

  private updateRiskLevel(anomalies: SafetyAnomaly[]) {
    // Simple weighted risk calculation
    const weightedSum = anomalies.length * 25;
    this.currentRiskLevel = Math.min(100, Math.max(0, weightedSum));
  }

  public getCurrentRiskLevel(): number {
    return this.currentRiskLevel;
  }

  public getSafetyStatus(): 'NORMAL' | 'CAUTION' | 'ALERT' {
    if (this.currentRiskLevel > 70) return 'ALERT';
    if (this.currentRiskLevel > 30) return 'CAUTION';
    return 'NORMAL';
  }
}

export const predictiveSafetyService = PredictiveSafetyService.getInstance();

