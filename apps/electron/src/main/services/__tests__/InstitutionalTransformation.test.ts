import { sovereignPedagogicalBridge } from '../SovereignPedagogicalBridge';
import { pedagogicalAIOrchestrator } from '../PedagogicalAIOrchestrator';
import { attendanceValidationService } from '../AttendanceValidationService';
import { geofenceMonitorService } from '../GeofenceMonitorService';
import { seatingIntelligenceService } from '../SeatingIntelligenceService';
import { logger } from '../../logger';

// Mock dependencies
jest.mock('../AttendanceValidationService', () => ({
  attendanceValidationService: {
    getStudentPoAStatus: jest.fn()
  }
}));

jest.mock('../GeofenceMonitorService', () => ({
  geofenceMonitorService: {
    isStudentInPerimeter: jest.fn()
  }
}));

jest.mock('../SeatingIntelligenceService', () => ({
  seatingIntelligenceService: {
    getLayout: jest.fn().mockResolvedValue([]),
    getRecommendations: jest.fn().mockResolvedValue([])
  }
}));

jest.mock('../PedagogicalAIOrchestrator', () => ({
  pedagogicalAIOrchestrator: {
    generateIntervention: jest.fn()
  }
}));

describe('Institutional Transformation (Phase 500+)', () => {
  const studentId = 'TEST-STUDENT-001';
  const classId = 'CLASS-A';

  beforeAll(() => {
    // Mocking logger
    jest.spyOn(logger, 'info').mockImplementation(() => {});
    jest.spyOn(logger, 'warn').mockImplementation(() => {});
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('Should detect Identity Discrepancy (Face OK, Geo Missing)', async () => {
    // 1. Simular status de PoA verificado (Visão)
    (attendanceValidationService.getStudentPoAStatus as any).mockResolvedValue({
      verified: true,
      confidence: 0.98
    });

    // 2. Simular Geofencing ausente
    (geofenceMonitorService.isStudentInPerimeter as any).mockResolvedValue(false);

    // 3. Executar auditoria
    const anomaly = await sovereignPedagogicalBridge.auditStudentPresence(studentId, classId);

    expect(anomaly).not.toBeNull();
    expect(anomaly?.type).toBe('IDENTITY_DISCREPANCY');
    expect(anomaly?.severity).toBe('MEDIUM');
  });

  test('Should trigger Pedagogical Intervention on anomaly', async () => {
    const interventionSpy = jest.spyOn(pedagogicalAIOrchestrator, 'generateIntervention');
    
    // Simular status de PoA verificado (Visão)
    (attendanceValidationService.getStudentPoAStatus as any).mockResolvedValue({
      verified: true,
      confidence: 0.98
    });

    // Simular Geofencing ausente
    (geofenceMonitorService.isStudentInPerimeter as any).mockResolvedValue(false);

    // Simular monitoramento disparando anomalia
    await sovereignPedagogicalBridge.monitorAndTrigger(studentId, classId);

    expect(interventionSpy).toHaveBeenCalledWith(studentId);
  });
});
