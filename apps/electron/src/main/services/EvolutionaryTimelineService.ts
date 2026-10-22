import { portfolioIntelligenceService, LongitudinalMetric } from './PortfolioIntelligenceService';
import { db } from '../../database/Database';

export interface LifecycleEntry extends LongitudinalMetric {
  gradeLevel: string;
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
   * Obtém o ciclo de vida completo (multi-ano) de um aluno.
   * Integra PortfolioIntelligenceService com metadados de série/ano.
   */
  public async getStudentLifecycle(studentId: string): Promise<StudentLifecycle> {
    const metrics = await portfolioIntelligenceService.getStudentLongitudinalHistory(studentId);
    
    // Recupera dados do aluno para saber o ano de ingresso
    const student = await db.get('SELECT createdAt FROM students WHERE id = ?', [studentId]);
    const enrollmentYear = student ? new Date(student.createdAt).getFullYear() : new Date().getFullYear();

    // Mapeia as métricas para a interface de ciclo de vida, enriquecendo com a série (grade)
    // Para simplificar, assumimos que o aluno avança uma série por ano desde o ingresso
    const history: LifecycleEntry[] = await Promise.all(metrics.map(async (m) => {
      // Tenta buscar a série real se houver registro histórico de turmas, 
      // caso contrário, calcula uma estimativa ou usa o atual.
      return {
        ...m,
        gradeLevel: `${m.year - enrollmentYear + 1}º Ano`,
        milestones: [] // Milestones podem ser preenchidos por eventos do student_evidence_dossier futuramente
      };
    }));

    return {
      studentId,
      enrollmentYear,
      history
    };
  }

  /**
   * Calcula deltas de crescimento ano-a-ano para identificar surtos de evolução ou riscos.
   */
  public calculateGrowthDeltas(history: LifecycleEntry[]) {
    if (history.length < 2) return null;
    
    const latest = history[history.length - 1];
    const previous = history[history.length - 2];
    
    return {
      behaviorDelta: latest.avgBehavior - previous.avgBehavior,
      academicDelta: latest.avgGrade - previous.avgGrade,
      isPositiveTrend: latest.avgGrade > previous.avgGrade
    };
  }
}

export const evolutionaryTimelineService = EvolutionaryTimelineService.getInstance();


