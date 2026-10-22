import Database from '../../database/Database';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';

export interface LongitudinalInsight {
  studentId: string;
  year: number;
  momentum: 'ACCELERATING' | 'STABLE' | 'DECELERATING';
  presenceTrend: number; // % change vs last period
  gradeTrend: number; // % change vs last period
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}

export class LongitudinalAnalysisService {
  private static instance: LongitudinalAnalysisService;
  private db = Database.getInstance();

  private constructor() {}

  public static getInstance(): LongitudinalAnalysisService {
    if (!LongitudinalAnalysisService.instance) {
      LongitudinalAnalysisService.instance = new LongitudinalAnalysisService();
    }
    return LongitudinalAnalysisService.instance;
  }

  /**
   * Gera um snapshot anual/semestral para um aluno
   */
  async generateYearlySnapshot(studentId: string, year: number): Promise<void> {
    try {
      // 1. Coleta dados do ano
      const grades = await this.db.all('SELECT * FROM student_grades WHERE studentId = ? AND strftime("%Y", createdAt) = ?', [studentId, year.toString()]);
      const behavior = await this.db.all('SELECT * FROM behavioral_logs WHERE studentId = ? AND strftime("%Y", createdAt) = ?', [studentId, year.toString()]);
      
      const academicSummary = {
        averageGrade: grades.length > 0 ? grades.reduce((acc, curr) => acc + curr.value, 0) / grades.length : 0,
        totalAssessments: grades.length
      };

      const behavioralSummary = {
        totalStressAlerts: behavior.filter(b => b.type === 'STRESS').length,
        engagementScore: 85 // Mocked for now, calculated from frequency
      };

      const aiSynthesis = "Progresso estável com picos de estresse em períodos de prova. Recomendada mentoria em matemática.";

      // 2. Calcula Hash de Integridade
      const snapshotData = JSON.stringify({ academicSummary, behavioralSummary, aiSynthesis });
      const integrityHash = crypto.createHash('sha256').update(snapshotData).digest('hex');

      // 3. Salva snapshot imutável
      await this.db.run(
        `INSERT INTO student_portfolio_snapshots 
        (id, studentId, periodId, year, academicData, behavioralSummary, aiSynthesis, integrityHash)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [uuidv4(), studentId, `YEAR_${year}`, year, JSON.stringify(academicSummary), JSON.stringify(behavioralSummary), aiSynthesis, integrityHash]
      );
    } catch (error) {
      console.error('Erro ao gerar snapshot longitudinal:', error);
    }
  }

  /**
   * Analisa tendência comparativa (Momentum)
   */
  async calculateStudentMomentum(studentId: string): Promise<LongitudinalInsight | null> {
    const snapshots = await this.db.all(
      'SELECT * FROM student_portfolio_snapshots WHERE studentId = ? ORDER BY year DESC LIMIT 2',
      [studentId]
    );

    if (snapshots.length < 2) return null;

    const current = JSON.parse(snapshots[0].academicData);
    const previous = JSON.parse(snapshots[1].academicData);

    const gradeDiff = current.averageGrade - previous.averageGrade;
    
    let momentum: 'ACCELERATING' | 'STABLE' | 'DECELERATING' = 'STABLE';
    if (gradeDiff > 0.5) momentum = 'ACCELERATING';
    else if (gradeDiff < -0.5) momentum = 'DECELERATING';

    return {
      studentId,
      year: snapshots[0].year,
      momentum,
      presenceTrend: 0, // Implementar logica de frequencia
      gradeTrend: gradeDiff,
      riskLevel: momentum === 'DECELERATING' ? 'HIGH' : 'LOW'
    };
  }
}

export default LongitudinalAnalysisService.getInstance();
