import { logger } from '../main/logger';
import { sovereignLedger } from './SovereignLedger';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  xpBonus: number;
  icon: string;
}

/**
 * GamificationEngine — Motor Áquila Rewards (Fase 715)
 * Transforma eventos pedagógicos em recompensas simbólicas e progresso visual.
 */
export class GamificationEngine {
  private static instance: GamificationEngine;

  private constructor() {}

  public static getInstance(): GamificationEngine {
    if (!GamificationEngine.instance) {
      GamificationEngine.instance = new GamificationEngine();
    }
    return GamificationEngine.instance;
  }

  /**
   * Atribui XP a um aluno e registra no Ledger imutável.
   */
  public async grantXP(studentId: string, amount: number, reason: string) {
    logger.info(`[Gamification] Atribuindo ${amount} XP ao aluno ${studentId}: ${reason}`);
    
    const event = {
      type: 'XP_GRANT',
      studentId,
      amount,
      reason,
      timestamp: new Date().toISOString()
    };

    // Imutabilidade garantida pelo Ledger
    sovereignLedger.addEntry(event);

    return { success: true, newXP: amount }; // Em produção, somaríamos no DB
  }

  public getAvailableAchievements(): Achievement[] {
    return [
      { id: 'pres-01', title: 'Sempre Presente', description: 'Manteve 100% de presença na semana.', xpBonus: 500, icon: '🏆' },
      { id: 'focus-01', title: 'Foco Absoluto', description: 'Detectado alto nível de atenção em 3 aulas seguidas.', xpBonus: 200, icon: '🎯' },
      { id: 'colab-01', title: 'Colaborador Elite', description: 'Participou ativamente de dinâmicas em grupo.', xpBonus: 350, icon: '🤝' },
      { id: 'ledger-01', title: 'Cidadão Soberano', description: 'Validou a integridade dos seus próprios dados.', xpBonus: 1000, icon: '⛓️' }
    ];
  }

  public getProjectHealth() {
    return {
      engagementLevel: 88,
      complianceScore: 100,
      innovationIndex: 94,
      status: 'Ascending'
    };
  }
}

export const gamificationEngine = GamificationEngine.getInstance();
