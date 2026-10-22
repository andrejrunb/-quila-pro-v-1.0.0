import { EventEmitter } from 'events';
import { Database } from '../../database/Database';
import { logger } from '../logger';
import crypto from 'crypto';

export interface Badge {
  id: string;
  name: string;
  description: string;
  conditionType: 'ATTENDANCE' | 'GRADES' | 'RECOVERY';
  threshold: number;
}

export const SYSTEM_BADGES: Badge[] = [
  { id: 'bdg_iron_will', name: 'Vontade de Ferro', description: 'Recuperou a frequência para mais de 85%', conditionType: 'RECOVERY', threshold: 85 },
  { id: 'bdg_perfect_month', name: 'Mês Perfeito', description: '100% de presença no mês', conditionType: 'ATTENDANCE', threshold: 100 },
  { id: 'bdg_scholar', name: 'Erudito', description: 'Média global acima de 90', conditionType: 'GRADES', threshold: 90 },
];

/**
 * GamificationEngine (Bloco IV)
 * - Avalia e distribui SovereignCoins (Pontos) e Badges de Superação.
 * - Conecta-se aos loops preditivos para recompensar recuperações de alunos em risco.
 */
export class GamificationEngine extends EventEmitter {
  private static instance: GamificationEngine;
  private db: Database;

  private constructor() {
    super();
    this.db = Database.getInstance();
  }

  public static getInstance(): GamificationEngine {
    if (!GamificationEngine.instance) {
      GamificationEngine.instance = new GamificationEngine();
    }
    return GamificationEngine.instance;
  }

  /**
   * Passo 213: Adicionar SovereignCoins por uma ação positiva (ex: aula assistida)
   */
  public async addCoins(studentId: string, amount: number, reason: string): Promise<boolean> {
    try {
      // Incrementar coins via SQL
      const query = `UPDATE students SET sovereignCoins = COALESCE(sovereignCoins, 0) + ? WHERE id = ?`;
      await (this.db as any).run(query, [amount, studentId]);
      
      logger.info(`[Gamification] ${amount} SovereignCoins concedidos ao aluno ${studentId}. Motivo: ${reason}`);
      this.emit('coins-awarded', { studentId, amount, reason });
      return true;
    } catch (error) {
      logger.error(`[Gamification] Erro ao adicionar coins: ${error}`);
      return false;
    }
  }

  /**
   * Passo 212 & 218: Avaliar e dar badges de superação
   */
  public async evaluateBadges(studentId: string, currentStats: { attendance: number, grades: number, wasAtRisk: boolean }) {
    for (const badge of SYSTEM_BADGES) {
      let deservesBadge = false;

      if (badge.conditionType === 'RECOVERY' && currentStats.wasAtRisk && currentStats.attendance >= badge.threshold) {
        deservesBadge = true;
      }
      if (badge.conditionType === 'ATTENDANCE' && currentStats.attendance >= badge.threshold) {
        deservesBadge = true;
      }
      if (badge.conditionType === 'GRADES' && currentStats.grades >= badge.threshold) {
        deservesBadge = true;
      }

      if (deservesBadge) {
        await this.awardBadge(studentId, badge);
      }
    }
  }

  private async awardBadge(studentId: string, badge: Badge) {
    try {
      // Check if already has badge
      const existing = await (this.db as any).get(`SELECT id FROM student_badges WHERE studentId = ? AND badgeId = ?`, [studentId, badge.id]);
      if (existing) return; // Já possui

      const awardId = crypto.randomUUID();
      await (this.db as any).run(
        `INSERT INTO student_badges (id, studentId, badgeId, badgeName) VALUES (?, ?, ?, ?)`,
        [awardId, studentId, badge.id, badge.name]
      );
      
      logger.info(`[Gamification] Badge '${badge.name}' conquistada pelo aluno ${studentId}!`);
      
      // Bonus: Dar moedas ao ganhar uma badge
      await this.addCoins(studentId, 100, `Recompensa por Conquista: ${badge.name}`);
      
      this.emit('badge-unlocked', { studentId, badge });
    } catch (err) {
      logger.error(`[Gamification] Falha ao dar badge: ${err}`);
    }
  }

  public async getStudentGamificationProfile(studentId: string) {
    const student = await (this.db as any).get(`SELECT sovereignCoins FROM students WHERE id = ?`, [studentId]);
    const badges = await (this.db as any).all(`SELECT badgeId, badgeName, awardedAt FROM student_badges WHERE studentId = ?`, [studentId]);
    
    return {
      coins: student?.sovereignCoins || 0,
      badges: badges || []
    };
  }
}

export const gamificationEngine = GamificationEngine.getInstance();
