import Database from '../../database/Database';

export class AttendanceCalculator {
  private static instance: AttendanceCalculator;

  private get db(): Database {
    return Database.getInstance();
  }

  constructor() {}

  public static getInstance(): AttendanceCalculator {
    if (!AttendanceCalculator.instance) {
      AttendanceCalculator.instance = new AttendanceCalculator();
    }
    return AttendanceCalculator.instance;
  }

  /**
   * Calcula presença baseado em 75% threshold
   */
  async calculateAttendance(
    studentId: string,
    classId: string,
    date: Date
  ): Promise<{
    status: 'present' | 'absent' | 'late';
    percentage: number;
    timeInClass: number;
    totalDuration: number;
  }> {
    try {
      const schedule = await this.db.getScheduleForClass(classId, date);
      if (!schedule) {
        return { status: 'absent', percentage: 0, timeInClass: 0, totalDuration: 0 };
      }

      const events = await this.db.getStudentEvents(studentId, classId, date);
      const totalDuration = this.calculateDuration(schedule.startTime, schedule.endTime);
      const timeInClass = this.calculateTimeInClass(events, schedule);
      const percentage = totalDuration > 0 ? (timeInClass / totalDuration) * 100 : 0;

      let status: 'present' | 'absent' | 'late' = 'absent';
      if (percentage >= 75) status = 'present';
      else if (percentage >= 50) status = 'late';

      return {
        status,
        percentage: Math.round(percentage),
        timeInClass,
        totalDuration,
      };
    } catch (error) {
      console.error('Erro ao calcular presença:', error);
      throw error;
    }
  }

  /**
   * Calcula a duração total em minutos
   */
  private calculateDuration(startTime: string, endTime: string): number {
    const start = new Date(`1970-01-01T${startTime}Z`);
    const end = new Date(`1970-01-01T${endTime}Z`);
    return (end.getTime() - start.getTime()) / (1000 * 60);
  }

  /**
   * Calcula o tempo total em sala baseado em eventos de entrada/saída
   */
  private calculateTimeInClass(events: any[], schedule: any): number {
    let totalMinutes = 0;
    let lastEntryTime: Date | null = null;

    const classEnd = new Date(`1970-01-01T${schedule.endTime}Z`);

    events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    for (const event of events) {
      const eventTime = new Date(event.timestamp);
      
      if (event.type === 'ENTRY') {
        lastEntryTime = eventTime;
      } else if (event.type === 'EXIT' && lastEntryTime) {
        const duration = (eventTime.getTime() - lastEntryTime.getTime()) / (1000 * 60);
        totalMinutes += duration;
        lastEntryTime = null;
      }
    }

    // Se o aluno ainda estiver na sala no final da aula
    if (lastEntryTime && lastEntryTime < classEnd) {
      const duration = (classEnd.getTime() - lastEntryTime.getTime()) / (1000 * 60);
      totalMinutes += duration;
    }

    return Math.max(0, totalMinutes);
  }

  /**
   * Gera relatório de presença para uma turma
   */
  async generateAttendanceReport(
    classId: string,
    startDate: Date,
    endDate: Date
  ): Promise<any[]> {
    try {
      const students = await this.db.getStudentsByClass(classId);
      const report: any[] = [];

      for (const student of students) {
        const attendance = await this.calculateAttendance(student.id, classId, startDate);
        report.push({
          studentId: student.id,
          name: student.name,
          ...attendance,
        });
      }

      return report;
    } catch (error) {
      console.error('Erro ao gerar relatório de presença:', error);
      throw error;
    }
  }

  /**
   * Calcula estatísticas gerais de presença
   */
  async calculateStatistics(
    classId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalStudents: number;
    averagePresence: number;
    averageAbsence: number;
    studentsWithHighAbsence: { name: string; absence: number }[];
  }> {
    try {
      const report = await this.generateAttendanceReport(classId, startDate, endDate);
      const totalStudents = report.length;
      if (totalStudents === 0) {
        return {
          totalStudents: 0,
          averagePresence: 0,
          averageAbsence: 0,
          studentsWithHighAbsence: [],
        };
      }
      
      const averagePresence = report.reduce((acc, curr) => acc + curr.percentage, 0) / totalStudents;
      const averageAbsence = 100 - averagePresence;

      const studentsWithHighAbsence = report
        .filter(r => r.percentage < 75)
        .map(r => ({ name: r.name, absence: 100 - r.percentage }));

      return {
        totalStudents,
        averagePresence: Math.round(averagePresence),
        averageAbsence: Math.round(averageAbsence),
        studentsWithHighAbsence,
      };
    } catch (error) {
      console.error('Erro ao calcular estatísticas:', error);
      throw error;
    }
  }

  /**
   * Valida presença com auditoria científica (Cross-Audit) e gera Hash SQA
   */
  async validateScientificAttendance(
    studentId: string,
    classId: string,
    date: Date,
    manualStatus?: 'present' | 'absent'
  ): Promise<{
    status: 'verified' | 'discrepancy' | 'absent';
    hash: string;
    auditLog: string;
  }> {
    const calc = await this.calculateAttendance(studentId, classId, date);
    const aiStatus = calc.status === 'absent' ? 'absent' : 'present';
    
    let finalStatus: 'verified' | 'discrepancy' | 'absent' = 'absent';
    let auditLog = `AI Detection: ${calc.percentage}%`;

    if (manualStatus) {
      if (manualStatus === aiStatus) {
        finalStatus = manualStatus === 'present' ? 'verified' : 'absent';
        auditLog += ` | Manual: ${manualStatus} | Consensus reached.`;
      } else {
        finalStatus = 'discrepancy';
        auditLog += ` | Manual: ${manualStatus} | WARNING: Mismatch detected.`;
      }
    } else {
      finalStatus = aiStatus === 'present' ? 'verified' : 'absent';
      auditLog += ' | No manual audit available.';
    }

    // Geração de Hash SQA (Sovereign Quality Assurance)
    const crypto = require('crypto');
    const dataToHash = `${studentId}-${classId}-${date.toISOString()}-${finalStatus}`;
    const hash = crypto.createHash('sha256').update(dataToHash).digest('hex');

    return {
      status: finalStatus,
      hash,
      auditLog
    };
  }
}

export const attendanceCalculator = new AttendanceCalculator();
export default attendanceCalculator;


