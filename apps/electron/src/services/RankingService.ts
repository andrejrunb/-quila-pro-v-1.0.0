import Database from '../database/Database';
import { logger } from '../main/logger';

export interface RankInfo {
  position: number;
  studentId: string;
  name: string;
  xp: number;
}

/**
 * RankingService (v3451)
 * Motor de Competição Saudável. Segmenta o progresso por categorias pedagógicas.
 */
export class RankingService {
  private db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  /**
   * Retorna os 10 melhores de uma determinada categoria (Turma, Nível ou Global).
   */
  public async getTop10(type: 'CLASS' | 'LEVEL' | 'GLOBAL', targetId?: string): Promise<RankInfo[]> {
    let query = '';
    let params: any[] = [];

    if (type === 'CLASS') {
      query = `SELECT id, name, totalXP FROM students WHERE classId = ? ORDER BY totalXP DESC LIMIT 10`;
      params = [targetId];
    } else if (type === 'LEVEL') {
      // Cruzamento com a tabela de turmas para filtrar pelo nível (ensino médio, etc)
      query = `
        SELECT s.id, s.name, s.totalXP 
        FROM students s
        JOIN classes c ON s.classId = c.id
        WHERE c.grade = ? 
        ORDER BY s.totalXP DESC LIMIT 10
      `;
      params = [targetId];
    } else {
      query = `SELECT id, name, totalXP FROM students ORDER BY totalXP DESC LIMIT 10`;
    }

    const rows = await this.db.all(query, params);
    return rows.map((r, index) => ({
      position: index + 1,
      studentId: r.id,
      name: r.name,
      xp: r.totalXP || 0
    }));
  }

  /**
   * Localiza a posição de um aluno específico no ranking.
   */
  public async getStudentRank(studentId: string, type: 'CLASS' | 'LEVEL' | 'GLOBAL', targetId?: string): Promise<number> {
    let query = '';
    let params: any[] = [];

    if (type === 'CLASS') {
      query = `
        SELECT COUNT(*) as rank 
        FROM students 
        WHERE classId = ? AND totalXP >= (SELECT totalXP FROM students WHERE id = ?)
      `;
      params = [targetId, studentId];
    } else if (type === 'LEVEL') {
      query = `
        SELECT COUNT(*) as rank 
        FROM students s
        JOIN classes c ON s.classId = c.id
        WHERE c.grade = ? AND s.totalXP >= (SELECT totalXP FROM students WHERE id = ?)
      `;
      params = [targetId, studentId];
    } else {
      query = `SELECT COUNT(*) as rank FROM students WHERE totalXP >= (SELECT totalXP FROM students WHERE id = ?)`;
      params = [studentId];
    }

    const result = await this.db.get(query, params);
    return result ? result.rank : 0;
  }

  /**
   * Snapshots de Ranking por Matéria (Agregado via Behavioral/Engagement).
   */
  public async getSubjectRanking(subject: string, classId: string) {
     // Lógica para agregar engajamento de behavioral_logs com horários específicos
     logger.info(`[Ranking] Gerando snapshot de performance para: ${subject}`);
     return []; // Mock por enquanto
  }
}
