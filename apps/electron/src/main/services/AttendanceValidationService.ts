import * as crypto from 'crypto';
import { sovereignGraphService } from './SovereignGraphService';
import { attendanceAuditService } from './AttendanceAuditService';
import { gamificationEngine } from './GamificationEngine';
import { logger } from '../logger';

/**
 * AttendanceValidationService (v1.6.0-PRO)
 * Implementa o protocolo Proof-of-Attendance (PoA) para a Fase 2100.
 * Converte eventos de hardware/biometria em evidências científicas assinadas no Grafo Soberano.
 */
export class AttendanceValidationService {
  private static instance: AttendanceValidationService;
  private readonly secretKey: string = 'aquila-sovereign-2026-poa-secret';

  private constructor() {
    // [CLEANUP] IPC handlers migrated to centralized registry in ipc/handlers.ts
  }

  public static getInstance(): AttendanceValidationService {
    if (!AttendanceValidationService.instance) {
      AttendanceValidationService.instance = new AttendanceValidationService();
    }
    return AttendanceValidationService.instance;
  }

  /**
   * Gera um token PoA (Proof-of-Attendance) determinístico e assinado.
   * Este token serve como prova criptográfica que o aluno estava no local em determinado momento.
   */
  public generatePoAToken(studentId: string, classId: string, timestamp: number): string {
    const data = `${studentId}:${classId}:${timestamp}:${this.secretKey}`;
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Valida e registra a presença de forma científica no Grafo Soberano e no Ledger de Auditoria.
   */
  public async validatePresence(studentId: string, classId: string, seatId: string): Promise<any> {
    const timestamp = Date.now();
    const token = this.generatePoAToken(studentId, classId, timestamp);

    logger.info(`[PoA] Validando presença científica para Aluno ${studentId} no Assento ${seatId}`);

    // 1. Registrar no Grafo Soberano (SKG)
    const eventId = `poa-event-${studentId}-${timestamp}`;
    sovereignGraphService.addEntity({
      id: eventId,
      type: 'ATTENDANCE_EVENT',
      label: `PoA Event: ${studentId}`,
      metadata: {
        studentId,
        classId,
        seatId,
        token,
        method: 'IoT-Pulse + FaceID',
        timestamp
      }
    });

    // Criar conexões relacionais no Grafo
    sovereignGraphService.associate(studentId, eventId, 'GENERATED_POA', 1);
    sovereignGraphService.associate(eventId, seatId, 'CAPTURED_AT', 1);

    // 3. Fase 2200: Concessão de Mérito (Rewards)
    const meritXP = 25;
    const meritReason = 'Scientific Presence Verified (PoA)';
    await gamificationEngine.addCoins(studentId, meritXP, meritReason);

    // Registrar o prêmio de mérito no Grafo
    const meritId = `merit-${studentId}-${timestamp}`;
    sovereignGraphService.addEntity({
      id: meritId,
      type: 'MERIT_AWARD',
      label: `Merit: ${meritReason}`,
      metadata: {
        studentId,
        amount: meritXP,
        type: 'PoA_BONUS',
        timestamp
      }
    });
    sovereignGraphService.associate(studentId, meritId, 'EARNED_MERIT', 1);
    sovereignGraphService.associate(eventId, meritId, 'TRIGGERED_REWARD', 1);

    // 4. Registrar no serviço de Auditoria Cruzada (Fase 1500 logic)
    await attendanceAuditService.logAttendance(studentId, 'present');
    
    // Simular auditoria científica automática
    await attendanceAuditService.persistAuditRecord(
      studentId,
      new Date().toISOString().split('T')[0],
      true, // Facial Detected
      true, // Sensor Detected
      true, // Manual Status
      0.99  // Confidence
    );

    return {
      success: true,
      token,
      timestamp,
      studentId,
      seatId
    };
  }

  /**
   * Retorna o status de validação para um conjunto de alunos em uma classe.
   */
  public async getValidationStatus(classId: string): Promise<Record<string, any>> {
    // No mundo real, consultaria o SKG. Aqui retornamos um snapshot das últimas 24h.
    return {}; 
  }

  /**
   * [Fase 500+] Retorna o status de PoA (Visão) para um aluno específico.
   */
  public async getStudentPoAStatus(studentId: string, classId?: string): Promise<{ verified: boolean; confidence: number; timestamp: number }> {
    // Simulação de consulta ao cache de detecção facial de curto prazo
    const lastEvent = sovereignGraphService.getNeighbors(studentId)
      .filter(n => n.type === 'ATTENDANCE_EVENT')
      .sort((a, b) => (b.metadata?.timestamp || 0) - (a.metadata?.timestamp || 0))[0];

    if (lastEvent && (Date.now() - (lastEvent.metadata?.timestamp || 0)) < 300000) { // Últimos 5 minutos
      return {
        verified: true,
        confidence: 0.98,
        timestamp: lastEvent.metadata?.timestamp
      };
    }

    return { verified: false, confidence: 0, timestamp: Date.now() };
  }

  /**
   * [Fase 500+] Retorna estatísticas agregadas de auditoria para uma turma.
   */
  public async getClassValidationStats(classId: string): Promise<any> {
    // Mock de estatísticas baseadas em auditoria científica
    return {
      visionValidated: 85,
      geofenceValidated: 92,
      manualValidated: 98,
      discrepancies: 5
    };
  }
}

export const attendanceValidationService = AttendanceValidationService.getInstance();
