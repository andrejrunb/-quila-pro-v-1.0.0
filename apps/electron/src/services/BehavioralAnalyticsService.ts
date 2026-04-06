import { academicRecordsService } from './AcademicRecordsService';

export interface BehavioralMetric {
  studentId: string;
  name: string;
  delays: number;
  absences: number;
  behaviorScore: number; // 0-100
  incidents: number;
}

export interface ClassBenchmark {
  classId: string;
  averageDelays: number;
  averageAbsences: number;
  averageBehaviorScore: number;
  totalStudents: number;
}

/**
 * BehavioralAnalyticsService (v1637)
 * Engine de análise comparativa para benchmarking aluno vs turma.
 */
class BehavioralAnalyticsService {
  /**
   * Mock data para demonstração de rankings e médias
   */
  private mockMetrics: BehavioralMetric[] = [
    { studentId: 'std-001', name: 'Andrej', delays: 12, absences: 5, behaviorScore: 65, incidents: 4 },
    { studentId: 'std-002', name: 'Alice', delays: 1, absences: 0, behaviorScore: 95, incidents: 0 },
    { studentId: 'std-003', name: 'Bruno', delays: 2, absences: 1, behaviorScore: 88, incidents: 1 },
    { studentId: 'std-004', name: 'Carla', delays: 0, absences: 2, behaviorScore: 92, incidents: 0 },
    { studentId: 'std-005', name: 'Diego', delays: 3, absences: 0, behaviorScore: 85, incidents: 1 }
  ];

  public getClassBenchmark(classId: string): ClassBenchmark {
    const total = this.mockMetrics.length;
    return {
      classId,
      averageDelays: this.mockMetrics.reduce((acc, m) => acc + m.delays, 0) / total,
      averageAbsences: this.mockMetrics.reduce((acc, m) => acc + m.absences, 0) / total,
      averageBehaviorScore: this.mockMetrics.reduce((acc, m) => acc + m.behaviorScore, 0) / total,
      totalStudents: total
    };
  }

  public getStudentComparison(studentId: string) {
    const student = this.mockMetrics.find(m => m.studentId === studentId);
    const benchmark = this.getClassBenchmark('3A'); // Mock class

    if (!student) return null;

    return {
      student,
      benchmark,
      deviations: {
        delays: student.delays > benchmark.averageDelays * 2 ? 'HIGH' : 'NORMAL',
        absences: student.absences > benchmark.averageAbsences * 1.5 ? 'WARNING' : 'NORMAL',
        score: student.behaviorScore < benchmark.averageBehaviorScore * 0.8 ? 'CRITICAL' : 'NORMAL'
      },
      rankAcrossClass: this.calculateRank(studentId, 'delays')
    };
  }

  private calculateRank(studentId: string, metric: keyof BehavioralMetric) {
    const sorted = [...this.mockMetrics].sort((a, b) => (b[metric] as number) - (a[metric] as number));
    const index = sorted.findIndex(m => m.studentId === studentId);
    return {
      position: index + 1,
      total: sorted.length,
      percentile: ((sorted.length - index) / sorted.length) * 100
    };
  }
}

export const behavioralAnalyticsService = new BehavioralAnalyticsService();
