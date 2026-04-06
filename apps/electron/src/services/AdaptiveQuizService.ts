import { db } from '../database/Database';
import { v4 as uuidv4 } from 'uuid';

/**
 * ADAPTIVE QUIZ SERVICE (v4001)
 * ----------------------------
 * Mecânica de Gamificação (Kahoot/Wordwall).
 * Gera avaliações síncronas que quantizam o conhecimento em XP e progressão de nível.
 */

export interface QuizQuest {
  id: string;
  title: string;
  type: 'matching' | 'multiple_choice' | 'speed_run';
  difficulty: 'bronze' | 'silver' | 'gold';
  questions: any[]; // JSON
  xp_reward: number;
}

export class AdaptiveQuizService {
  private static instance: AdaptiveQuizService;

  private constructor() {}

  public static getInstance(): AdaptiveQuizService {
    if (!AdaptiveQuizService.instance) {
      AdaptiveQuizService.instance = new AdaptiveQuizService();
    }
    return AdaptiveQuizService.instance;
  }

  /**
   * Gera uma missão de quiz personalizada (v4001)
   */
  public async generateQuest(studentId: string, subject: string, difficulty: 'bronze' | 'silver' | 'gold'): Promise<QuizQuest> {
    const xp_rewards = { bronze: 50, silver: 150, gold: 500 };
    
    return {
      id: uuidv4(),
      title: `Quest de ${subject} (${difficulty.toUpperCase()})`,
      type: 'multiple_choice',
      difficulty,
      questions: [
        { q: 'Qual o principal fator de resiliência em enxames?', options: ['Redundância', 'Centralização', 'Velocidade'], correct: 0 }
      ],
      xp_reward: xp_rewards[difficulty]
    };
  }

  /**
   * Finaliza o quiz e credita XP Soberano (v4001)
   */
  public async submitResults(studentId: string, questId: string, score: number): Promise<{ xpGained: number; levelUp: boolean }> {
    // Quantização de Notas: Score (0-100) * Recompensa da Quest
    // Simulando chamada para o Ledger de Economia do Aluno
    
    const xpGained = Math.round(score * 2.5); // Multiplicador de maestria
    
    const response = await (window as any).electron.invoke('add-student-xp', {
      studentId,
      amount: xpGained,
      reason: `COMPLETOU_QUEST_${questId}`
    });

    console.log(`[Quiz] Result for Student ${studentId}: +${xpGained} XP`);

    return {
      xpGained,
      levelUp: response?.levelUp || false
    };
  }
}

export const adaptiveQuizService = AdaptiveQuizService.getInstance();
