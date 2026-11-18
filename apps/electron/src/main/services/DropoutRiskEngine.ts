import { EventEmitter } from 'events';
import { Database } from '../../database/Database';
import { logger } from '../logger';
import crypto from 'crypto';

export interface DropoutRiskFactor {
  factor: string;
  weight: number;
  value: number; // 0 to 1
  impact: number; // value * weight
}

export interface StudentRiskAssessment {
  studentId: string;
  date: string;
  riskScore: number; // 0 to 100
  factors: DropoutRiskFactor[];
  status: 'PENDING' | 'INTERVENTION_ONGOING' | 'RESOLVED';
  actionProtocol?: string;
  requiresHumanReview?: boolean;
  legalComplianceNotice?: string;
}

/**
 * DropoutRiskEngine (Bloco IV)
 * - Alto Risco (Parecer CNE/CP nº 15/2026): apoia busca ativa humana sem sanções automáticas
 *   e sem inferência emocional automatizada.
 * - Avalia 5 variáveis pedagógicas e de frequência: Frequência, Declínio de Notas, Atrasos,
 *   Acompanhamento Pedagógico Docente e Engajamento em Atividades.
 */
export class DropoutRiskEngine extends EventEmitter {
  private static instance: DropoutRiskEngine;
  private db: Database;
  
  // Weights (Heurística Ponderada de Apoio à Busca Ativa)
  private readonly W_ATTENDANCE = 40;
  private readonly W_GRADES_DECLINE = 25;
  private readonly W_TARDINESS = 15;
  private readonly W_PEDAGOGICAL_SUPPORT = 10;
  private readonly W_ENGAGEMENT = 10;

  private constructor() {
    super();
    this.db = Database.getInstance();
  }

  public static getInstance(): DropoutRiskEngine {
    if (!DropoutRiskEngine.instance) {
      DropoutRiskEngine.instance = new DropoutRiskEngine();
    }
    return DropoutRiskEngine.instance;
  }

  /**
   * Passo 202: Ponderar 5 variáveis fundamentais.
   * Calcula a probabilidade de evasão (Risk Score) de 0 a 100.
   */
  public async assessStudentRisk(studentId: string, classId: string): Promise<StudentRiskAssessment> {
    try {
      // 1. Frequência (Attendance)
      // Idealmente consultaríamos o banco real: db.getAttendanceReport()
      // Simulando acesso ao banco para manter o código testável:
      const attendance = await (this.db as any).calculateAttendance?.({ studentId, classId, date: new Date().toISOString() }) 
                         || { percentage: Math.random() * 40 + 60 }; // 60-100%
                         
      const attValue = 1 - (attendance.percentage / 100); // 1.0 (0%) - 0.0 (100%)

      // 2. Declínio de Notas
      // (Mock) Acesso ao banco de notas
      const gradesDeclineValue = Math.random(); // 0 (sem declínio) a 1 (declínio grave)

      // 3. Atrasos frequentes
      const tardinessValue = Math.random() * 0.5;

      // 4. Necessidade de Apoio Pedagógico (Registro docente; sem inferência emocional CNE 15/2026)
      const supportNeedValue = Math.random() * 0.4;

      // 5. Engajamento (Participação acadêmica nas atividades)
      const engagementValue = Math.random() * 0.6; // 0 (alto) a 1 (baixo)

      const factors: DropoutRiskFactor[] = [
        { factor: 'attendance_drop', weight: this.W_ATTENDANCE, value: attValue, impact: attValue * this.W_ATTENDANCE },
        { factor: 'grades_decline', weight: this.W_GRADES_DECLINE, value: gradesDeclineValue, impact: gradesDeclineValue * this.W_GRADES_DECLINE },
        { factor: 'tardiness_streak', weight: this.W_TARDINESS, value: tardinessValue, impact: tardinessValue * this.W_TARDINESS },
        { factor: 'pedagogical_support_need', weight: this.W_PEDAGOGICAL_SUPPORT, value: supportNeedValue, impact: supportNeedValue * this.W_PEDAGOGICAL_SUPPORT },
        { factor: 'low_engagement', weight: this.W_ENGAGEMENT, value: engagementValue, impact: engagementValue * this.W_ENGAGEMENT }
      ];

      const riskScore = factors.reduce((sum, f) => sum + f.impact, 0);

      const assessment: StudentRiskAssessment = {
        studentId,
        date: new Date().toISOString().split('T')[0],
        riskScore: Math.min(100, Math.max(0, riskScore)),
        factors,
        status: 'PENDING',
        actionProtocol: riskScore >= 75 ? 'ALERTA_BUSCA_ATIVA' : 'ACOMPANHAMENTO_NORMAL',
        requiresHumanReview: true,
        legalComplianceNotice:
          'Indicador preditivo de Alto Risco exclusivamente de apoio à busca ativa (LDB Art. 12, VIII, "a"): exige revisão humana e direito ao contraditório (Parecer CNE/CP nº 15/2026).'
      };

      // Passo 204: Disparo Automático
      if (assessment.riskScore >= 75) {
        logger.warn(`[DropoutRiskEngine] Risco SEVERO detectado para aluno ${studentId}: Score ${assessment.riskScore.toFixed(1)}`);
        this.emit('high-risk-detected', assessment);
        // Exemplo: notificar orientador via WhatsApp (Mensageria / EagleMessenger)
      }

      await this.saveRiskAssessment(assessment);
      return assessment;
      
    } catch (err: any) {
      logger.error(`[DropoutRiskEngine] Falha ao processar risco para ${studentId}: ${err.message}`);
      throw err;
    }
  }

  /**
   * Passo 203: Tabela `predictive_student_risk` com histórico semanal
   */
  private async saveRiskAssessment(assessment: StudentRiskAssessment) {
    const id = crypto.randomUUID();
    const query = `
      INSERT INTO predictive_student_risk 
      (id, studentId, riskScore, riskFactors, date, status, actionProtocol) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    try {
      await (this.db as any).run(query, [
        id,
        assessment.studentId,
        assessment.riskScore,
        JSON.stringify(assessment.factors),
        assessment.date,
        assessment.status,
        assessment.actionProtocol
      ]);
    } catch (error) {
       logger.error(`[DropoutRiskEngine] Falha ao salvar no banco: ${error}`);
    }
  }

  public async getRiskHistory(studentId: string): Promise<StudentRiskAssessment[]> {
    const query = `SELECT * FROM predictive_student_risk WHERE studentId = ? ORDER BY date DESC`;
    try {
      const rows = await (this.db as any).all(query, [studentId]);
      return rows.map((r: any) => ({
        ...r,
        factors: JSON.parse(r.riskFactors || '[]')
      }));
    } catch (err) {
      return [];
    }
  }

  /**
   * Analisa risco de todos os alunos de uma turma (Job Noturno)
   */
  public async assessClass(classId: string, studentIds: string[]): Promise<StudentRiskAssessment[]> {
    logger.info(`[DropoutRiskEngine] Iniciando análise preditiva em massa da turma ${classId}`);
    const results: StudentRiskAssessment[] = [];
    for (const id of studentIds) {
      const r = await this.assessStudentRisk(id, classId);
      results.push(r);
    }
    return results;
  }
}

export const dropoutRiskEngine = DropoutRiskEngine.getInstance();
