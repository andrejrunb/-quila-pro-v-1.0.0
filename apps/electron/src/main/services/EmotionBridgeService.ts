import { logger } from '../logger';

/**
 * EMOTION BRIDGE SERVICE
 * ----------------------
 * Desativado para inferência facial/emocional em cumprimento ao Parecer CNE/CP nº 15/2026
 * (homologado em 10/11/2026, DOU de 11/11/2026, p. 141).
 */
export interface EmotionalState {
  joy: number;
  boredom: number;
  frustration: number;
  surprise: number;
  engagement: number;
  primaryEmotion: string;
  blocked?: boolean;
  complianceCode?: 'CNE_15_2026_PROHIBITED_EMOTION_INFERENCE';
}

export class EmotionBridgeService {
  private static instance: EmotionBridgeService;

  private constructor() {}

  public static getInstance(): EmotionBridgeService {
    if (!EmotionBridgeService.instance) {
      EmotionBridgeService.instance = new EmotionBridgeService();
    }
    return EmotionBridgeService.instance;
  }

  public async analyzeSentiment(_visionMetadata: unknown): Promise<EmotionalState> {
    logger.warn('[EmotionBridge] Bloqueado por conformidade imediata ao Parecer CNE/CP nº 15/2026.');
    return {
      joy: 0,
      boredom: 0,
      frustration: 0,
      surprise: 0,
      engagement: 0,
      primaryEmotion: 'DISABLED_CNE_15_2026',
      blocked: true,
      complianceCode: 'CNE_15_2026_PROHIBITED_EMOTION_INFERENCE',
    };
  }

  public getTutorAction(_state: EmotionalState): string {
    return 'MAINTAIN_PACE';
  }
}

export const emotionBridgeService = EmotionBridgeService.getInstance();
