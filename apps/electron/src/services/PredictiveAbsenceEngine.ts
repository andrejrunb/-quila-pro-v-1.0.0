/**
 * PredictiveAbsenceEngine.ts — Item 27
 * Analisa padrões de frequência dos últimos 30 dias e prevê ausências.
 * Algoritmo: Média ponderada de presença + detecção de padrão semanal.
 * LGPD: Nunca acessa biometria — analisa apenas os registros de log.
 */

import Database from '../database/Database';

export interface AbsenceRisk {
  studentId: string;
  studentName: string;
  riskScore: number;     // 0-100. >70 = Alto risco de abandono
  pattern: string;       // Descrição do padrão detectado
  avgWeeklyAttendance: number;
  consecutiveAbsences: number;
}

export class PredictiveAbsenceEngine {
  constructor(private readonly db: Database) {}

  /**
   * Analisa todos os alunos e retorna os de maior risco.
   */
  async analyzeRisk(): Promise<AbsenceRisk[]> {
    const students = await this.db.getStudents();
    const results: AbsenceRisk[] = [];

    for (const student of students) {
      const risk = await this._analyzeStudent(student.id, student.name);
      if (risk) results.push(risk);
    }

    return results
      .filter(r => r.riskScore > 30)
      .sort((a, b) => b.riskScore - a.riskScore);
  }

  private async _analyzeStudent(studentId: string, studentName: string): Promise<AbsenceRisk | null> {
    try {
      // Busca log dos últimos 30 dias
      const logs = await this.db.all(
        `SELECT logged_at FROM attendance_logs WHERE student_id = ? 
         AND logged_at > datetime('now', '-30 days') ORDER BY logged_at DESC`,
        [studentId]
      );

      if (logs.length === 0) {
        return {
          studentId,
          studentName,
          riskScore: 80, // Sem registros = alto risco
          pattern: 'Nenhuma presença registrada nos últimos 30 dias.',
          avgWeeklyAttendance: 0,
          consecutiveAbsences: 30,
        };
      }

      // Agrupar por semana
      const daySet = new Set<string>(
        logs.map((l: any) => new Date(l.logged_at).toDateString())
      );
      const totalDays = 30;
      const presentDays = daySet.size;
      const attendanceRate = presentDays / totalDays;
      const avgWeeklyAttendance = (presentDays / 4); // 4 semanas

      // Detectar faltas consecutivas recentes
      const lastPresent = new Date(logs[0].logged_at);
      const daysSinceLast = Math.floor((Date.now() - lastPresent.getTime()) / 86_400_000);
      const consecutiveAbsences = daysSinceLast;

      // Calcular risk score
      let riskScore = 0;
      if (attendanceRate < 0.5) riskScore += 60;
      else if (attendanceRate < 0.75) riskScore += 30;
      if (consecutiveAbsences >= 5) riskScore += 30;
      else if (consecutiveAbsences >= 3) riskScore += 15;

      riskScore = Math.min(100, riskScore);

      // Gerar padrão textual
      let pattern = '';
      if (riskScore > 70) pattern = `⚠️ Evasão provável. ${consecutiveAbsences} dias consecutivos sem presença.`;
      else if (riskScore > 40) pattern = `Frequência abaixo de 75%. Média semanal: ${avgWeeklyAttendance.toFixed(1)} dias.`;
      else pattern = `Frequência normal (${(attendanceRate * 100).toFixed(0)}%).`;

      return {
        studentId,
        studentName,
        riskScore,
        pattern,
        avgWeeklyAttendance,
        consecutiveAbsences,
      };
    } catch (err) {
      console.error(`[PredictiveAbsence] Erro ao analisar aluno ${studentId}:`, err);
      return null;
    }
  }
}
