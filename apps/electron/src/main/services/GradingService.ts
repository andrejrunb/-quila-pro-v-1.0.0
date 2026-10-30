import { Database } from '../../database/Database';
import { logger } from '../logger';

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

    const report: any[] = [];
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

  /**
   * Avalia as respostas do aluno contra um gabarito real e calcula a nota exata.
   */
  public evaluateSubmission(
    studentAnswers: Record<string | number, string>,
    answerKey: Record<string | number, string>,
    maxScore: number = 10.0
  ): {
    totalQuestions: number;
    correctCount: number;
    score: number;
    details: { question: string; expected: string; provided: string; correct: boolean }[];
  } {
    const questions = Object.keys(answerKey);
    if (questions.length === 0) {
      return { totalQuestions: 0, correctCount: 0, score: 0, details: [] };
    }

    let correctCount = 0;
    const details = questions.map((q) => {
      const expected = String(answerKey[q]).trim().toUpperCase();
      const provided = String(studentAnswers[q] || '').trim().toUpperCase();
      const correct = expected === provided;
      if (correct) correctCount++;
      return { question: String(q), expected, provided, correct };
    });

    const score = parseFloat(((correctCount / questions.length) * maxScore).toFixed(2));
    return {
      totalQuestions: questions.length,
      correctCount,
      score,
      details,
    };
  }

  /**
   * [SQA-GRD-705] PROCESS ANSWER SHEET (OCR Autopilot)
   * Processa uma imagem de cartão de resposta com verificação segura.
   * Se o worker OCR não estiver configurado, REJEITA de forma segura (Fail-Secure).
   * NUNCA produz notas arbitrárias ou randômicas.
   */
  public async processAnswerSheet(
    imageData: string,
    studentId: string,
    templateId: string,
    options?: { ocrEngineReady?: boolean; detectedAnswers?: Record<number, string>; answerKey?: Record<number, string> }
  ) {
    logger.info(`[Grading] Processando avaliação para Aluno: ${studentId}, Template: ${templateId}`);

    // Fail-Secure: Sem worker OCR ativo, não inventar nota
    if (!options?.ocrEngineReady || !options?.detectedAnswers || !options?.answerKey) {
      logger.warn(`[Grading] Worker OCR indisponível ou gabarito ausente. Encaminhado para conferência manual docente.`);
      return {
        success: false,
        reason: 'OCR_SERVICE_UNAVAILABLE_MANUAL_REVIEW_REQUIRED',
        studentId,
        templateId,
      };
    }

    // Avaliação determinística real contra o gabarito
    const evaluation = this.evaluateSubmission(options.detectedAnswers, options.answerKey);

    const grade: GradeRecord = {
      studentId,
      classId: 'class_auto_detected',
      type: 'Exam_OCR',
      value: evaluation.score,
      weight: 1.0,
      timestamp: new Date().toISOString(),
    };

    await this.saveGrade(grade);

    return {
      success: true,
      grade: evaluation.score,
      correctCount: evaluation.correctCount,
      totalQuestions: evaluation.totalQuestions,
      details: evaluation.details,
    };
  }

  /**
   * Retorna a lista de avaliações cadastradas.
   */
  public async getAssessments() {
    const query = `SELECT * FROM assessments`;
    return await this.db.all(query);
  }
}

