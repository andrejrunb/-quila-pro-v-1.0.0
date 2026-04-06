import { Database } from '../database/Database';
import { logger } from '../main/logger';

export interface FocusSession {
  studentId: string;
  durationMinutes: number;
  level: number;
  completedAt: string;
}

/**
 * DeepWorkService (v3460)
 * Treinamento de Concentração Progressiva. 
 * Começa com 10min e evolui conforme o histórico do aluno.
 */
export class DeepWorkService {
  private db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  /**
   * Sugere a duração da próxima sessão baseado na performance anterior.
   */
  public async getNextSessionTime(studentId: string): Promise<number> {
    const lastSession = await this.db.get(`
      SELECT durationMinutes FROM focus_sessions 
      WHERE studentId = ? ORDER BY completedAt DESC LIMIT 1
    `, [studentId]);

    if (!lastSession) return 15; // Início padrão: 15 minutos

    // Se completou a anterior, aumenta em 5 minutos (até o teto de 50min)
    const nextTime = lastSession.durationMinutes + 5;
    return Math.min(nextTime, 50);
  }

  /**
   * Registra o término de uma sessão de foco e concede XP bônus.
   */
  public async completeFocusSession(studentId: string, duration: number) {
    logger.info(`[DeepWork] Sessão de ${duration}m completada pelo aluno ${studentId}`);

    const query = `
      INSERT INTO focus_sessions (studentId, durationMinutes, completedAt)
      VALUES (?, ?, CURRENT_TIMESTAMP)
    `;

    await this.db.run(query, [studentId, duration]);

    // Cálculo de XP Soberano: 10 XP por minuto de foco
    const xpBonus = duration * 10;
    
    await this.db.run(`
      UPDATE students SET totalXP = totalXP + ? WHERE id = ?
    `, [xpBonus, studentId]);

    return { xpBonus, nextTarget: duration + 5 };
  }

  public async startSession(studentId: string) {
    logger.info(`[DeepWork] Iniciando sessão para Aluno: ${studentId}`);
    return { success: true, startTime: Date.now() };
  }

  public async endSession(studentId: string) {
    // Por enquanto mapeamos sessionId como studentId por simplicidade no Ciclo Soberano
    return await this.completeFocusSession(studentId, 25); // Padrão 25m se não especificado
  }
}
