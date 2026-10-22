import { logger } from '../logger';

export interface CompanionState {
  studentId: string;
  name: string;
  personalityType: 'ENCOURAGING' | 'CHALLENGING' | 'CALM';
  symbiosisLevel: number; // 0-100
  mood: string;
  lastInteraction: number;
}

/**
 * LearningCompanionService (Nível 31)
 * Gerencia a simbiose entre o aluno e sua IA tutora pessoal.
 * Adapta-se ao estado emocional e acadêmico do estudante.
 */
export class LearningCompanionService {
  private static instance: LearningCompanionService;
  private companions: Map<string, CompanionState> = new Map();

  private constructor() {}

  public static getInstance(): LearningCompanionService {
    if (!LearningCompanionService.instance) {
      LearningCompanionService.instance = new LearningCompanionService();
    }
    return LearningCompanionService.instance;
  }

  public getCompanion(studentId: string): CompanionState {
    if (!this.companions.has(studentId)) {
      // Inicialização padrão do companheiro
      this.companions.set(studentId, {
        studentId,
        name: 'Áquila Guide',
        personalityType: 'ENCOURAGING',
        symbiosisLevel: 10,
        mood: 'HAPPY',
        lastInteraction: Date.now()
      });
    }
    return this.companions.get(studentId)!;
  }

  /**
   * Gera um "Nudge" (incentivo) baseado no contexto do aluno.
   */
  public generateNudge(studentId: string, context: { emotion: string; performance: number }): string {
    const companion = this.getCompanion(studentId);
    logger.info(`[Companion] Gerando nudge para ${studentId}. Emoção: ${context.emotion}`);

    // [LEVEL 32] Feedback Háptico sutil acompanhando o nudge
    const { hapticMeshService } = require('./HapticMeshService');
    hapticMeshService.triggerSensoryEvent(studentId, context.performance > 0.9 ? 'SUCCESS' : 'GENTLE_NUDGE');

    if (context.emotion === 'FRUSTRATED') {

      return `Ei, percebi que está difícil. Que tal uma pausa de 2 minutos? Eu te ajudo quando voltar.`;
    }

    if (context.performance > 0.9) {
      return `Incrível! Você está voando hoje. Vamos tentar um desafio extra?`;
    }

    return `Estou aqui com você. Vamos avançar mais um pouco?`;
  }

  /**
   * Aumenta o nível de simbiose conforme o aluno interage com o sistema.
   */
  public async strengthenSymbiosis(studentId: string, amount: number) {
    const companion = this.getCompanion(studentId);
    companion.symbiosisLevel = Math.min(100, companion.symbiosisLevel + amount);
    companion.lastInteraction = Date.now();
    logger.info(`[Companion] Nível de Simbiose de ${studentId} subiu para ${companion.symbiosisLevel}`);
  }
}

export const learningCompanionService = LearningCompanionService.getInstance();
