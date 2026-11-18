import { logger } from '../logger';

export type EmotionType = 'JOY' | 'STRESS' | 'FRUSTRATION' | 'ENGAGEMENT' | 'NEUTRAL';

export interface EmotionalState {
  emotion: EmotionType;
  intensity: number; // 0 a 1 (sempre 0 sob bloqueio normativo CNE/CP nº 15/2026)
  timestamp: number;
  blocked?: boolean;
  complianceCode?: 'CNE_15_2026_PROHIBITED_EMOTION_INFERENCE';
  reason?: string;
}

/**
 * MicroExpressionAnalyzer
 * Neutralizado em cumprimento imediato ao Parecer CNE/CP nº 15/2026
 * (homologado pelo MEC em 10/11/2026, DOU de 11/11/2026, p. 141):
 * é vedada a inferência ou reconhecimento automatizado de emoções de estudantes.
 */
export class MicroExpressionAnalyzer {
  private static instance: MicroExpressionAnalyzer;

  private constructor() {}

  public static getInstance(): MicroExpressionAnalyzer {
    if (!MicroExpressionAnalyzer.instance) {
      MicroExpressionAnalyzer.instance = new MicroExpressionAnalyzer();
    }
    return MicroExpressionAnalyzer.instance;
  }

  /**
   * Análise afetiva bloqueada por vedação imediata do Parecer CNE/CP nº 15/2026.
   */
  public async analyzeEmotion(_faceData: Buffer): Promise<EmotionalState> {
    logger.warn('[Compliance CNE 15/2026] Tentativa de inferência emocional bloqueada (Risco Excessivo).');
    return {
      emotion: 'NEUTRAL',
      intensity: 0,
      timestamp: Date.now(),
      blocked: true,
      complianceCode: 'CNE_15_2026_PROHIBITED_EMOTION_INFERENCE',
      reason: 'Reconhecimento ou inferência automatizada de emoções vedado pelo Parecer CNE/CP nº 15/2026.',
    };
  }
}

export const microExpressionAnalyzer = MicroExpressionAnalyzer.getInstance();
