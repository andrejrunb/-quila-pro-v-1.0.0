import { logger } from '../logger';

export interface SensoryProfile {
  studentId: string;
  tactileSensitivity: 'LOW' | 'NORMAL' | 'HIGH';
  hapticEnabled: boolean;
  preferredIntensity: number; // 0.1 to 1.0
  allowedPatterns: string[];
}

/**
 * SensoryProfileService (Nível 32)
 * Gerencia as configurações de inclusão sensorial para alunos.
 * Essencial para suporte à neurodiversidade no ecossistema Áquila.
 */
export class SensoryProfileService {
  private static instance: SensoryProfileService;
  private profiles: Map<string, SensoryProfile> = new Map();

  private constructor() {}

  public static getInstance(): SensoryProfileService {
    if (!SensoryProfileService.instance) {
      SensoryProfileService.instance = new SensoryProfileService();
    }
    return SensoryProfileService.instance;
  }

  public getProfile(studentId: string): SensoryProfile {
    if (!this.profiles.has(studentId)) {
      // Perfil padrão
      this.profiles.set(studentId, {
        studentId,
        tactileSensitivity: 'NORMAL',
        hapticEnabled: true,
        preferredIntensity: 0.7,
        allowedPatterns: ['SUCCESS', 'FOCUS', 'GENTLE_NUDGE']
      });
    }
    return this.profiles.get(studentId)!;
  }

  public async updateProfile(studentId: string, updates: Partial<SensoryProfile>) {
    const profile = this.getProfile(studentId);
    Object.assign(profile, updates);
    logger.info(`[Sensory] Perfil atualizado para ${studentId}: ${JSON.stringify(updates)}`);
  }
}

export const sensoryProfileService = SensoryProfileService.getInstance();
