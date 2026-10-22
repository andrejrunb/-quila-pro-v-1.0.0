/**
 * ADAPTIVE QUIZ SERVICE (v4001 - Safe Proxy)
 * -----------------------------------------
 */

export interface QuizQuest {
  id: string;
  title: string;
  type: 'matching' | 'multiple_choice' | 'speed_run';
  difficulty: 'bronze' | 'silver' | 'gold';
  questions: any[]; // JSON
  xp_reward: number;
}

export class AdaptiveQuizServiceProxy {
  private static instance: AdaptiveQuizServiceProxy;

  private constructor() {}

  public static getInstance(): AdaptiveQuizServiceProxy {
    if (!AdaptiveQuizServiceProxy.instance) {
      AdaptiveQuizServiceProxy.instance = new AdaptiveQuizServiceProxy();
    }
    return AdaptiveQuizServiceProxy.instance;
  }

  private async invoke(method: string, ...args: any[]): Promise<any> {
    if (typeof window !== 'undefined' && window.aquila) {
      return window.aquila.invoke(`quiz:${method}`, ...args);
    }
    throw new Error(`[QuizProxy] IPC não disponível para ${method}`);
  }

  public async generateQuest(studentId: string, subject: string, difficulty: 'bronze' | 'silver' | 'gold'): Promise<QuizQuest> {
    return this.invoke('generateQuest', studentId, subject, difficulty);
  }

  public async submitResults(studentId: string, questId: string, score: number): Promise<{ xpGained: number; levelUp: boolean }> {
    return this.invoke('submitResults', studentId, questId, score);
  }
}

export const adaptiveQuizService = AdaptiveQuizServiceProxy.getInstance();
export default adaptiveQuizService;
