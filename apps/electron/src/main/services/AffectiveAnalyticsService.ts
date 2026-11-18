/**
 * AffectiveAnalyticsService
 * Neutralizado em cumprimento imediato ao Parecer CNE/CP nº 15/2026
 * (homologado pelo MEC em 10/11/2026, DOU de 11/11/2026, p. 141):
 * inferência automatizada de estados emocionais de estudantes é classificada como Risco Excessivo e proibida.
 */

export enum EmotionalState {
  OPTIMISTIC = 'OPTIMISTIC',
  CONTENT = 'CONTENT',
  NEUTRAL = 'NEUTRAL',
  FRUSTRATED = 'FRUSTRATED',
  BORED = 'BORED',
  ANXIOUS = 'ANXIOUS',
}

export interface AffectiveMetric {
  studentId: string;
  valence: number;
  arousal: number;
  state: EmotionalState;
  timestamp: string;
  blocked?: boolean;
  complianceCode?: 'CNE_15_2026_PROHIBITED_EMOTION_INFERENCE';
}

class AffectiveAnalyticsService {
  private static instance: AffectiveAnalyticsService;

  private constructor() {}

  public static getInstance(): AffectiveAnalyticsService {
    if (!AffectiveAnalyticsService.instance) {
      AffectiveAnalyticsService.instance = new AffectiveAnalyticsService();
    }
    return AffectiveAnalyticsService.instance;
  }

  public async analyzeAffect(studentId: string, _expressionData: unknown): Promise<AffectiveMetric> {
    return {
      studentId,
      valence: 0,
      arousal: 0,
      state: EmotionalState.NEUTRAL,
      timestamp: new Date().toISOString(),
      blocked: true,
      complianceCode: 'CNE_15_2026_PROHIBITED_EMOTION_INFERENCE',
    };
  }

  public async getClassroomAtmosphere(_classId: string): Promise<EmotionalState> {
    return EmotionalState.NEUTRAL;
  }

  public async getStudentTelemetry(_studentId: string) {
    return {
      valence: 0,
      arousal: 0,
      state: EmotionalState.NEUTRAL,
      momentum: 'BLOQUEADO_CNE_15_2026',
      telemetryBlocked: true,
      complianceCode: 'CNE_15_2026_PROHIBITED_EMOTION_INFERENCE',
      reason: 'Inferência emocional e vigilância afetiva vedadas imediatamente pelo Parecer CNE/CP nº 15/2026.',
      lastUpdate: new Date().toISOString(),
    };
  }
}

export const affectiveAnalyticsService = AffectiveAnalyticsService.getInstance();
