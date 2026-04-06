import Database from "../database/Database";

export interface EvasionRisk {
  studentId: string;
  name: string;
  riskScore: number; // 0 to 100
  horizon: 14 | 30;
  level: 'LOW' | 'MEDIUM' | 'HIGH';
  factors: string[];
  trend: 'CLIMBING' | 'STABLE' | 'REDUCING';
}

/**
 * EvasionRadarService (Passo 751)
 * Motor de Análise Preditiva para Retenção de Alunos.
 */
export class EvasionRadarService {
  constructor(private db: Database) {}

  /**
   * Analisa um aluno específico e retorna seu perfil de risco.
   */
  async analyzeStudentRisk(studentId: string, horizon: 14 | 30 = 14): Promise<EvasionRisk> {
    const student = await this.db.get('SELECT name FROM students WHERE id = ?', [studentId]);
    if (!student) throw new Error('Student not found');

    const now = new Date();
    const startDate = new Date();
    startDate.setDate(now.getDate() - horizon);
    const startDateIso = startDate.toISOString();

    // 1. Analisar Presença (Peso 0.7)
    const attendanceStats = await this.db.get(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present
      FROM attendance 
      WHERE studentId = ? AND date >= ?
    `, [studentId, startDateIso]);

    const attendanceRate = attendanceStats.total > 0 ? (attendanceStats.present / attendanceStats.total) : 1;
    
    // 2. Analisar Engajamento SRS (Peso 0.3)
    const srsStats = await this.db.get(`
      SELECT AVG(easeFactor) as avgEase, COUNT(*) as totalReviews
      FROM srs_schedules
      WHERE studentId = ? AND lastReview >= ?
    `, [studentId, startDateIso]);

    const srsWeight = srsStats.totalReviews > 0 ? (srsStats.avgEase / 2.5) : 0.5;

    // Cálculo do Score (Inverso: maior taxa de ausência = maior risco)
    const attendanceRisk = (1 - attendanceRate) * 100;
    const srsRisk = (1 - Math.min(srsWeight, 1)) * 100;

    const finalScore = Math.round((attendanceRisk * 0.7) + (srsRisk * 0.3));

    // -- CALCULO DA TENDÊNCIA (Trend Analysis) --
    const prevEndDate = startDateIso;
    const prevStartDate = new Date(startDate.getTime());
    prevStartDate.setDate(prevStartDate.getDate() - horizon);
    const prevStartDateIso = prevStartDate.toISOString();

    const prevAttendance = await this.db.get(`
      SELECT COUNT(*) as total, SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present
      FROM attendance WHERE studentId = ? AND date >= ? AND date < ?
    `, [studentId, prevStartDateIso, prevEndDate]);

    const prevRate = prevAttendance && prevAttendance.total > 0 ? (prevAttendance.present / prevAttendance.total) : 1;
    const prevScore = Math.round((1 - prevRate) * 100 * 0.7 + 50 * 0.3); // Simplificado prev SRS

    let trend: 'CLIMBING' | 'STABLE' | 'REDUCING' = 'STABLE';
    if (finalScore > prevScore + 5) trend = 'CLIMBING';
    else if (finalScore < prevScore - 5) trend = 'REDUCING';
    // -------------------------------------------

    let level: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
    const factors: string[] = [];

    if (finalScore > 70) {
      level = 'HIGH';
      factors.push('Ausência crítica detectada');
    } else if (finalScore > 40) {
      level = 'MEDIUM';
      factors.push('Engajamento em declínio');
    }

    if (attendanceRate < 0.75) factors.push('Frequência abaixo de 75%');
    if (srsStats.totalReviews === 0) factors.push('Nenhuma revisão SRS realizada no período');

    return {
      studentId,
      name: student.name,
      riskScore: finalScore,
      horizon,
      level,
      factors,
      trend
    };
  }

  /**
   * Retorna o heatmap de risco para todos os alunos da instituição.
   */
  async getRiskHeatmap(horizon: 14 | 30 = 14): Promise<EvasionRisk[]> {
    const students = await this.db.all('SELECT id FROM students WHERE status = "active"');
    const heatmap = await Promise.all(
      students.map(s => this.analyzeStudentRisk(s.id, horizon))
    );
    return heatmap.sort((a, b) => b.riskScore - a.riskScore);
  }
}
