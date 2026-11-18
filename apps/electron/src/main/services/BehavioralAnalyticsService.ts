export interface BehavioralMetric {
  studentId: string;
  name: string;
  delays: number;
  absences: number;
  behaviorScore: number; // 0-100
  incidents: number;
}

export interface ClassBenchmark {
  classId: string;
  averageDelays: number;
  averageAbsences: number;
  averageBehaviorScore: number;
  totalStudents: number;
  blocked?: boolean;
  complianceCode?: string;
  reason?: string;
}

const CNE_BEHAVIORAL_BLOCK_REASON =
  'Ranqueamento comportamental (social scoring) e telemetria emocional/afetiva vedados pelo Parecer CNE/CP nº 15/2026.';

/**
 * BehavioralAnalyticsService (v1637 — Neutralizado CNE/CP nº 15/2026)
 * Mock rankings e telemetria afetiva removidos; retorna apenas respostas nulas/bloqueadas em conformidade normativa.
 */
class BehavioralAnalyticsService {
  public getClassBenchmark(classId: string): ClassBenchmark {
    return {
      classId,
      averageDelays: 0,
      averageAbsences: 0,
      averageBehaviorScore: 0,
      totalStudents: 0,
      blocked: true,
      complianceCode: 'CNE_15_2026_PROHIBITED_EMOTION_INFERENCE',
      reason: CNE_BEHAVIORAL_BLOCK_REASON,
    };
  }

  public getStudentComparison(_studentId: string) {
    return null;
  }

  public getHighRiskAlerts(_minScore: number = 70) {
    return [];
  }

  public async getLiveTelemetry(studentId?: string) {
    return {
      blocked: true,
      telemetryBlocked: true,
      complianceCode: 'CNE_15_2026_PROHIBITED_EMOTION_INFERENCE',
      reason: CNE_BEHAVIORAL_BLOCK_REASON,
      studentId: studentId || null,
      timestamp: Date.now(),
      history: [],
      riskScore: 0,
      emotions: {
        stress: 0,
        fatigue: 0,
        engagement: 0,
        anxiety: 0,
        aggression: 0,
        neutral: 1,
        blocked: true,
        complianceCode: 'CNE_15_2026_PROHIBITED_EMOTION_INFERENCE',
      },
    };
  }
}

export const behavioralAnalyticsService = new BehavioralAnalyticsService();

