import { logger } from '../logger';
import { EmotionType } from './MicroExpressionAnalyzer';

export interface CampusPulse {
  globalHappiness: number;
  stressLevel: number;
  activeHotspots: { location: string; dominantEmotion: EmotionType }[];
  lastUpdate: number;
  blocked?: boolean;
  complianceCode?: 'CNE_15_2026_PROHIBITED_EMOTION_INFERENCE';
  legalReference?: string;
}

/**
 * EmotionalClimateService
 * Bloqueado em observância imediata ao Parecer CNE/CP nº 15/2026
 * (homologado pelo MEC em 10/11/2026, DOU de 11/11/2026, p. 141), que veda
 * reconhecimento ou inferência automatizada de emoções em ambiente escolar.
 */
export class EmotionalClimateService {
  private static instance: EmotionalClimateService;
  private currentPulse: CampusPulse;

  private constructor() {
    this.currentPulse = {
      globalHappiness: 0,
      stressLevel: 0,
      activeHotspots: [],
      lastUpdate: Date.now(),
      blocked: true,
      complianceCode: 'CNE_15_2026_PROHIBITED_EMOTION_INFERENCE',
      legalReference: 'Parecer CNE/CP nº 15/2026 (homologado em 10/11/2026, DOU Ed. 212, p. 141)',
    };
  }

  public static getInstance(): EmotionalClimateService {
    if (!EmotionalClimateService.instance) {
      EmotionalClimateService.instance = new EmotionalClimateService();
    }
    return EmotionalClimateService.instance;
  }

  public reportLocalEmotion(location: string, _emotion: EmotionType) {
    logger.warn(`[Climate] Reporte emocional ignorado em ${location}: proibido pelo Parecer CNE/CP nº 15/2026.`);
  }

  public getPulse(): CampusPulse {
    return {
      ...this.currentPulse,
      lastUpdate: Date.now(),
    };
  }
}

export const emotionalClimateService = EmotionalClimateService.getInstance();
