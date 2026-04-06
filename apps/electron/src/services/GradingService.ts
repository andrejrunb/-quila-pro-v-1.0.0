import { Database } from '../database/Database';
import { logger } from '../main/logger';

export interface GradeRecord {
  id?: string;
  studentId: string;
  classId: string;
  type: string; // 'P1', 'P2', 'Project', etc.
  value: number;
  weight: number;
  timestamp: string;
}

/**
 * GradingService (v3447)
 * Motor de Avaliação Pedagógica. Gerencia pesos, médias e relatórios de desempenho.
 */
export class GradingService {
  private db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  /**
   * Salva uma nota para um aluno.
   */
  public async saveGrade(grade: GradeRecord) {
    logger.info(`[Grading] Salvando nota ${grade.type} para o aluno ${grade.studentId}`);
    const query = `
      INSERT INTO student_grades (studentId, classId, type, value, weight, timestamp)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    return await this.db.run(query, [
      grade.studentId, 
      grade.classId, 
      grade.type, 
      grade.value, 
      grade.weight, 
      grade.timestamp || new Date().toISOString()
    ]);
  }

  /**
   * Calcula a média ponderada de um aluno em uma turma específica.
   */
  public async calculateAverage(studentId: string, classId: string) {
    const query = `SELECT value, weight FROM student_grades WHERE studentId = ? AND classId = ?`;
    const grades = await this.db.all(query, [studentId, classId]);

    if (grades.length === 0) return 0;

    let totalWeightedScore = 0;
    let totalWeight = 0;

    grades.forEach((g: any) => {
      totalWeightedScore += g.value * g.weight;
      totalWeight += g.weight;
    });

    return totalWeight > 0 ? (totalWeightedScore / totalWeight) : 0;
  }

  /**
   * Gera o relatório consolidado da turma.
   */
  public async getClassReport(classId: string) {
    const studentsQuery = `SELECT id, name FROM students WHERE classId = ?`;
    const students = await this.db.all(studentsQuery, [classId]);

    const report = [];
    for (const student of students) {
      const average = await this.calculateAverage(student.id, classId);
      report.push({
        id: student.id,
        name: student.name,
        average: parseFloat(average.toFixed(2)),
        status: average >= 6 ? 'APROVADO' : 'RISCO_PEDAGOGICO'
      });
    }

    return report;
  }
}
