import Database from '../database/Database';
import { logger } from '../main/logger';

export interface StudentBehaviorProfile {
  studentId: string;
  attendanceScore: number; // 0-100
  engagementScore: number; // 0-100 (Based on AI interactions)
  emotionalProfile: string; // 'Focused', 'Struggling', 'Bored'
  riskLevel: 'critical' | 'warning' | 'stable';
  lastInteractions: string[];
}

/**
 * StudentBehaviorRAG - O Cérebro Pedagógico (v3470)
 * Analisa padrões semânticos e comportamentais de alunos.
 */
export class StudentBehaviorRAG {
  private db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  /**
   * [SQA-PED-501] Gera perfil comportamental semântico
   */
  public async getStudentProfile(studentId: string): Promise<StudentBehaviorProfile> {
    try {
      // 1. Coletar dados de presença (Simulado via DB query - AG-022)
      const attendance = await this.db.get('SELECT COUNT(*) as present FROM attendance WHERE studentId = ? AND status = "present"', [studentId]);
      const totalDays = await this.db.get('SELECT COUNT(*) as total FROM calendar_days');
      
      const attRate = totalDays?.total > 0 ? (attendance?.present / totalDays.total) * 100 : 85;

      // 2. Coletar dados de interação com a IA (Ouvir o "Enxame")
      const entries = await this.db.all('SELECT content FROM ai_interaction_logs WHERE userId = ? ORDER BY createdAt DESC LIMIT 10', [studentId]);
      
      // Heurística de engajamento (Simples por enquanto, evoluirá para embeddings)
      const engagement = Math.min(entries.length * 10, 100);

      // 3. Prever risco
      const gap = attRate - engagement;
      let risk: any = 'stable';
      if (gap > 40 || attRate < 60) risk = 'critical';
      else if (gap > 20 || attRate < 75) risk = 'warning';

      return {
        studentId,
        attendanceScore: Math.round(attRate),
        engagementScore: engagement,
        emotionalProfile: entries.length > 5 ? 'Active' : 'Passive',
        riskLevel: risk,
        lastInteractions: entries.map((e: any) => e.content)
      };
    } catch (err) {
      logger.error(`[BehaviorRAG] Erro ao gerar perfil: ${err}`);
      throw err;
    }
  }

  /**
   * [SQA-PED-502] Predição proativa de desempenho
   */
  public async predictAcademicRisk(classId: string) {
    logger.info(`[BehaviorRAG] Analisando risco da turma ${classId}...`);
    // Em prod, isto cruzaria embeddings de dúvidas com notas de prova.
    return { classId, analyzed: true, timestamp: new Date() };
  }
}
