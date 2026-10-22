import { logger } from '../logger';

export interface WellnessMetric {
  studentId: string;
  postureScore: number; // 0-100
  fatigueLevel: number; // 0-100
  activityScore: number; // 0-100
  lastUpdate: number;
}

/**
 * WellnessGuardianService (Nível 41)
 * Monitora marcadores de saúde física e fadiga através de análise de visão computacional e postura.
 * Garante a ergonomia e o bem-estar dos alunos durante as atividades letivas.
 */
export class WellnessGuardianService {
  private static instance: WellnessGuardianService;
  private metrics: Map<string, WellnessMetric> = new Map();

  private constructor() {}

  public static getInstance(): WellnessGuardianService {
    if (!WellnessGuardianService.instance) {
      WellnessGuardianService.instance = new WellnessGuardianService();
    }
    return WellnessGuardianService.instance;
  }

  /**
   * Atualiza as métricas de bem-estar de um aluno.
   */
  public reportWellness(studentId: string, data: Partial<WellnessMetric>) {
    logger.debug(`[Wellness] Atualizando métricas para ${studentId}`);
    const current = this.metrics.get(studentId) || {
      studentId,
      postureScore: 100,
      fatigueLevel: 0,
      activityScore: 50,
      lastUpdate: Date.now()
    };

    this.metrics.set(studentId, { ...current, ...data, lastUpdate: Date.now() });
  }

  public getGlobalMetrics() {
    const all = Array.from(this.metrics.values());
    if (all.length === 0) return { avgPosture: 95, avgFatigue: 10, totalAlerts: 0 };

    const avgPosture = all.reduce((acc, m) => acc + m.postureScore, 0) / all.length;
    const avgFatigue = all.reduce((acc, m) => acc + m.fatigueLevel, 0) / all.length;

    return {
      avgPosture,
      avgFatigue,
      totalAlerts: all.filter(m => m.postureScore < 60 || m.fatigueLevel > 80).length
    };
  }
}

export const wellnessGuardianService = WellnessGuardianService.getInstance();
