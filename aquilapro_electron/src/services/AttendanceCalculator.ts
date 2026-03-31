import Database from '../database/Database';

export class AttendanceCalculator {
  constructor(private db: Database) {}

  /**
   * Calcula presença baseado em 75% threshold
   * @param studentId ID do aluno
   * @param classId ID da turma
   * @param date Data da aula
   * @returns Presença ou Falta
   */
  async calculateAttendance(
    studentId: string,
    classId: string,
    date: Date
  ): Promise<{
    status: 'PRESENÇA' | 'FALTA';
    percentage: number;
    timeInClass: number;
    totalDuration: number;
  }> {
    try {
      // 1. Obter horário da aula
      const schedule = await this.db.getClassSchedule(classId, date);
      if (!schedule) {
        return {
          status: 'FALTA',
          percentage: 0,
          timeInClass: 0,
          totalDuration: 0,
        };
      }

      const totalDuration = this.calculateDuration(schedule.startTime, schedule.endTime);

      // 2. Obter eventos do aluno (entrada/saída de sala)
      const events = await this.db.getStudentEvents(studentId, classId, date);

      // 3. Calcular tempo em sala
      const timeInClass = this.calculateTimeInClass(events, schedule);

      // 4. Calcular percentual
      const percentage = (timeInClass / totalDuration) * 100;

      // 5. Determinar presença (75% threshold)
      const status = percentage >= 75 ? 'PRESENÇA' : 'FALTA';

      return {
        status,
        percentage: Math.round(percentage * 100) / 100,
        timeInClass,
        totalDuration,
      };
    } catch (error) {
      console.error('Erro ao calcular presença:', error);
      throw error;
    }
  }

  /**
   * Calcula duração entre dois horários (em minutos)
   */
  private calculateDuration(startTime: Date, endTime: Date): number {
    return (endTime.getTime() - startTime.getTime()) / (1000 * 60);
  }

  /**
   * Calcula tempo total em sala baseado em eventos
   * Eventos: entrada, saída, retorno, etc.
   */
  private calculateTimeInClass(
    events: Array<{
      type: 'ENTRADA' | 'SAÍDA' | 'RETORNO';
      timestamp: Date;
    }>,
    schedule: {
      startTime: Date;
      endTime: Date;
    }
  ): number {
    let timeInClass = 0;
    let lastEntryTime: Date | null = null;

    for (const event of events) {
      if (event.type === 'ENTRADA' || event.type === 'RETORNO') {
        // Aluno entrou/retornou
        lastEntryTime = event.timestamp;
      } else if (event.type === 'SAÍDA' && lastEntryTime) {
        // Aluno saiu - calcular tempo desde entrada
        const duration = (event.timestamp.getTime() - lastEntryTime.getTime()) / (1000 * 60);
        timeInClass += duration;
        lastEntryTime = null;
      }
    }

    // Se aluno ainda está na sala (não saiu), contar até fim da aula
    if (lastEntryTime) {
      const duration = (schedule.endTime.getTime() - lastEntryTime.getTime()) / (1000 * 60);
      timeInClass += duration;
    }

    // Se não há eventos, verificar se aluno estava na sala o tempo todo
    if (events.length === 0) {
      // Assumir que aluno esteve o tempo todo (será verificado por câmera)
      timeInClass = this.calculateDuration(schedule.startTime, schedule.endTime);
    }

    return timeInClass;
  }

  /**
   * Gera relatório de presença para um período
   */
  async generateAttendanceReport(
    classId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Array<{
    studentId: string;
    studentName: string;
    totalClasses: number;
    presentClasses: number;
    absentClasses: number;
    percentage: number;
  }>> {
    try {
      // 1. Obter todos os alunos da turma
      const students = await this.db.getStudentsByClass(classId);

      // 2. Para cada aluno, calcular presença em cada aula
      const report: any[] = [];

      for (const student of students) {
        let totalClasses = 0;
        let presentClasses = 0;
        let absentClasses = 0;

        // Obter todas as aulas no período
        const schedules = await this.db.getClassSchedulesByPeriod(classId, startDate, endDate);

        for (const schedule of schedules) {
          const attendance = await this.calculateAttendance(student.id, classId, schedule.date);

          totalClasses++;
          if (attendance.status === 'PRESENÇA') {
            presentClasses++;
          } else {
            absentClasses++;
          }
        }

        const percentage = totalClasses > 0 ? (presentClasses / totalClasses) * 100 : 0;

        report.push({
          studentId: student.id,
          studentName: student.name,
          totalClasses,
          presentClasses,
          absentClasses,
          percentage: Math.round(percentage * 100) / 100,
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
  async calculateStatistics(classId: string, startDate: Date, endDate: Date): Promise<{
    totalStudents: number;
    averagePresence: number;
    averageAbsence: number;
    studentsWithHighAbsence: Array<{ name: string; absence: number }>;
  }> {
    try {
      const report = await this.generateAttendanceReport(classId, startDate, endDate);

      const totalStudents = report.length;
      const averagePresence =
        report.reduce((sum, r) => sum + r.percentage, 0) / totalStudents;
      const averageAbsence = 100 - averagePresence;

      // Alunos com mais de 20% de ausência
      const studentsWithHighAbsence = report
        .filter((r) => r.percentage < 80)
        .map((r) => ({
          name: r.studentName,
          absence: 100 - r.percentage,
        }))
        .sort((a, b) => b.absence - a.absence)
        .slice(0, 10);

      return {
        totalStudents,
        averagePresence: Math.round(averagePresence * 100) / 100,
        averageAbsence: Math.round(averageAbsence * 100) / 100,
        studentsWithHighAbsence,
      };
    } catch (error) {
      console.error('Erro ao calcular estatísticas:', error);
      throw error;
    }
  }
}

// Injeção de dependência tardia para evitar ciclos
export const attendanceCalculator = new AttendanceCalculator(new Database());
export default attendanceCalculator;
