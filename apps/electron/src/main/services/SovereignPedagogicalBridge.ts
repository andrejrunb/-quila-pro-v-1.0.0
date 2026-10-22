import { attendanceValidationService } from './AttendanceValidationService';
import { geofenceMonitorService } from './GeofenceMonitorService';
import { seatingIntelligenceService } from './SeatingIntelligenceService';
import { pedagogicalAIOrchestrator } from './PedagogicalAIOrchestrator';
import { logger } from '../logger';
import { EventEmitter } from 'events';

export interface PedagogicalAnomaly {
  studentId: string;
  type: 'IDENTITY_DISCREPANCY' | 'SEATING_DEVIATION' | 'UNEXPECTED_ABSENCE';
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  details: string;
  timestamp: number;
}

/**
 * SOVEREIGN PEDAGOGICAL BRIDGE (v1.6.0)
 * ------------------------------------
 * Orquestra a "Soberania da Verdade" cruzando biometria, geo e comportamento espacial.
 */
export class SovereignPedagogicalBridge extends EventEmitter {
  private static instance: SovereignPedagogicalBridge;

  private constructor() {
    super();
  }

  public static getInstance(): SovereignPedagogicalBridge {
    if (!SovereignPedagogicalBridge.instance) {
      SovereignPedagogicalBridge.instance = new SovereignPedagogicalBridge();
    }
    return SovereignPedagogicalBridge.instance;
  }

  /**
   * Executa auditoria cruzada para um estudante específico.
   */
  public async auditStudentPresence(studentId: string, classId: string): Promise<PedagogicalAnomaly | null> {
    try {
      logger.info(`[SovereignBridge] Auditoria cruzada iniciada para: ${studentId}`);

      // 1. Verificar Visão (PoA)
      const poaStatus = await attendanceValidationService.getStudentPoAStatus(studentId, classId);
      
      // 2. Verificar Geofencing
      const geoStatus = await geofenceMonitorService.isStudentInPerimeter(studentId);
      
      // 3. Verificar Assento (Seating)
      const seatLayout = await seatingIntelligenceService.getLayout(classId);
      const studentSeat = seatLayout.find((s: any) => s.studentId === studentId);

      // --- LÓGICA DE DETECÇÃO DE ANOMALIAS ---

      // Caso A: Presente na Visão mas Ausente no Geo (Esqueceu celular ou fraude de aparelho)
      if (poaStatus?.verified && !geoStatus) {
        return {
          studentId,
          type: 'IDENTITY_DISCREPANCY',
          severity: 'MEDIUM',
          details: 'Detecção Facial positiva, porém dispositivo móvel ausente no perímetro escolar.',
          timestamp: Date.now()
        };
      }

      // Caso B: Sentado fora do lugar recomendado (Indicador comportamental)
      // (Supondo que o serviço de seating tenha a recomendação guardada)
      const recommendations = await seatingIntelligenceService.getRecommendations(classId);
      const recommendation = recommendations.find((r: any) => r.studentId === studentId);
      
      if (studentSeat && recommendation && (studentSeat.row !== recommendation.suggestedPosition.row)) {
        return {
          studentId,
          type: 'SEATING_DEVIATION',
          severity: 'LOW',
          details: `O estudante não está utilizando o assento otimizado sugerido pela IA (Atual: F${studentSeat.row} vs Sugerido: F${recommendation.suggestedPosition.row}).`,
          timestamp: Date.now()
        };
      }

      return null;

    } catch (err: any) {
      logger.error(`[SovereignBridge] Erro na auditoria: ${err.message}`);
      return null;
    }
  }

  /**
   * Monitora anomalias e dispara intervenções automáticas.
   */
  public async monitorAndTrigger(studentId: string, classId: string) {
    const anomaly = await this.auditStudentPresence(studentId, classId);
    
    if (anomaly) {
      logger.warn(`[SovereignBridge] Anomalia detectada: ${anomaly.type} para ${studentId}`);
      
      // Se a anomalia for grave ou recorrente, gera intervenção
      if (anomaly.severity === 'HIGH' || anomaly.severity === 'MEDIUM') {
        await pedagogicalAIOrchestrator.generateIntervention(studentId);
      }

      this.emit('anomaly_detected', anomaly);
    }
  }
}

export const sovereignPedagogicalBridge = SovereignPedagogicalBridge.getInstance();
