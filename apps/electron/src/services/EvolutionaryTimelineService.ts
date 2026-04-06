/**
 * EvolutionaryTimelineService (v1640)
 * Manages the multi-year history of student academic and behavioral growth.
 * High-performance aggregation for long-term institutional tracking.
 */

export interface LifecycleEntry {
  year: number;
  gradeLevel: string;
  avgBehaviorScore: number;
  avgAcademicScore: number;
  attendanceRate: number;
  milestones: string[];
}

export interface StudentLifecycle {
  studentId: string;
  enrollmentYear: number;
  history: LifecycleEntry[];
}

class EvolutionaryTimelineService {
  private static instance: EvolutionaryTimelineService;

  private constructor() {}

  public static getInstance(): EvolutionaryTimelineService {
    if (!EvolutionaryTimelineService.instance) {
      EvolutionaryTimelineService.instance = new EvolutionaryTimelineService();
    }
    return EvolutionaryTimelineService.instance;
  }

  /**
   * Fetches the entire multi-year history for a student.
   * In production, this would query the indexed historical database.
   */
  public async getStudentLifecycle(studentId: string): Promise<StudentLifecycle> {
    // Mock data representing a 3-year journey
    return {
      studentId,
      enrollmentYear: 2024,
      history: [
        {
          year: 2024,
          gradeLevel: '6º Ano',
          avgBehaviorScore: 78,
          avgAcademicScore: 82,
          attendanceRate: 0.95,
          milestones: ['Adaptação Concluída', 'Melhora em Matemática']
        },
        {
          year: 2025,
          gradeLevel: '7º Ano',
          avgBehaviorScore: 85,
          avgAcademicScore: 88,
          attendanceRate: 0.98,
          milestones: ['Liderança em Projeto de Ciências', 'Premiado em Olímpiada']
        },
        {
          year: 2026,
          gradeLevel: '8º Ano (Atual)',
          avgBehaviorScore: 92,
          avgAcademicScore: 85,
          attendanceRate: 0.92,
          milestones: ['Interesse em Robótica', 'Participação no Grêmio']
        }
      ]
    };
  }

  /**
   * Calculates year-over-year deltas to identify growth spurts or risks.
   */
  public calculateGrowthDeltas(history: LifecycleEntry[]) {
    if (history.length < 2) return null;
    
    const latest = history[history.length - 1];
    const previous = history[history.length - 2];
    
    return {
      behaviorDelta: latest.avgBehaviorScore - previous.avgBehaviorScore,
      academicDelta: latest.avgAcademicScore - previous.avgAcademicScore,
      isPositiveTrend: latest.avgBehaviorScore > previous.avgBehaviorScore
    };
  }
}

export const evolutionaryTimelineService = EvolutionaryTimelineService.getInstance();
