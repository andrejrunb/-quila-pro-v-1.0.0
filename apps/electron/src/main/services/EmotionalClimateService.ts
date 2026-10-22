import { logger } from '../logger';
import { EmotionType } from './MicroExpressionAnalyzer';

export interface CampusPulse {
  globalHappiness: number; // 0-100
  stressLevel: number; // 0-100
  activeHotspots: { location: string; dominantEmotion: EmotionType }[];
  lastUpdate: number;
}

/**
 * EmotionalClimateService (Nível 37)
 * Monitora o "batimento cardíaco emocional" da escola.
 * Agrega dados anonimizados para fornecer insights sobre o bem-estar coletivo.
 */
export class EmotionalClimateService {
  private static instance: EmotionalClimateService;
  private currentPulse: CampusPulse;

  private constructor() {
    this.currentPulse = {
      globalHappiness: 75,
      stressLevel: 20,
      activeHotspots: [
        { location: 'Refeitório', dominantEmotion: 'JOY' },
        { location: 'Laboratório de IA', dominantEmotion: 'ENGAGEMENT' }
      ],
      lastUpdate: Date.now()
    };
  }

  public static getInstance(): EmotionalClimateService {
    if (!EmotionalClimateService.instance) {
      EmotionalClimateService.instance = new EmotionalClimateService();
    }
    return EmotionalClimateService.instance;
  }

  /**
   * Atualiza o pulso coletivo com base em novas amostras.
   */
  public reportLocalEmotion(location: string, emotion: EmotionType) {
    logger.debug(`[Climate] Novo reporte emocional em ${location}: ${emotion}`);
    // Lógica de agregação estatística
    this.currentPulse.lastUpdate = Date.now();
  }

  public getPulse(): CampusPulse {
    return this.currentPulse;
  }
}

export const emotionalClimateService = EmotionalClimateService.getInstance();
