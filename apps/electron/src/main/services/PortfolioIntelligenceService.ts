import { db } from '../../database/Database';
import { sovereignGraphService } from './SovereignGraphService';

/**
 * PortfolioIntelligenceService (v3700)
 * -----------------------------------
 * O "Motor de Inteligência Longitudinal" do Áquila Pro.
 * Responsável por cruzar dados históricos (notas, comportamento, frequência)
 * para identificar progressos e defasagens institucionais.
 */

export interface LongitudinalMetric {
  year: number;
  avgGrade: number;
  avgBehavior: number;
  attendance: number;
}

export interface DeficitReport {
  studentId: string;
  category: 'academic' | 'behavioral' | 'engagement';
  delta: number; // Porcentagem de variação (negativa = defasagem)
  severity: 'low' | 'medium' | 'high' | 'critical';
  insight: string;
}

class PortfolioIntelligenceService {
  private static instance: PortfolioIntelligenceService;

  private constructor() {}

  public static getInstance(): PortfolioIntelligenceService {
    if (!PortfolioIntelligenceService.instance) {
      PortfolioIntelligenceService.instance = new PortfolioIntelligenceService();
    }
    return PortfolioIntelligenceService.instance;
  }

  /**
   * Obtém a trajetória histórica de um aluno ao longo dos anos registrados.
   */
  public async getStudentLongitudinalHistory(studentId: string): Promise<LongitudinalMetric[]> {
    console.log(`[PortfolioIntelligence] Calculando trajetória multi-ano para: ${studentId}`);
    
    // Cruza notas e relatórios históricos
    const grades = await db.all(
      `SELECT strftime('%Y', timestamp) as year, AVG(value) as avgGrade 
       FROM student_grades 
       WHERE studentId = ? 
       GROUP BY year 
       ORDER BY year ASC`,
      [studentId]
    );

    // Mapeia os dados reais ou retorna série histórica baseada em student_reports
    const metrics: LongitudinalMetric[] = grades.map((g: any) => ({
      year: parseInt(g.year),
      avgGrade: parseFloat(g.avgGrade.toFixed(2)),
      avgBehavior: 85, // Fallback enquanto logs comportamentais são migrados
      attendance: 0.95 // Mock temporário para frequência
    }));

    return metrics;
  }

  /**
   * Identifica lacunas de aprendizado ou quedas comportamentais significativas.
   */
  public async analyzeDeficits(studentId: string): Promise<DeficitReport[]> {
    const history = await this.getStudentLongitudinalHistory(studentId);
    if (history.length < 2) return [];

    const latest = history[history.length - 1];
    const previous = history[history.length - 2];
    
    const reports: DeficitReport[] = [];

    // Análise Acadêmica
    const gradeDelta = ((latest.avgGrade - previous.avgGrade) / (previous.avgGrade || 1)) * 100;
    if (gradeDelta < -10) {
      const report: DeficitReport = {
        studentId,
        category: 'academic',
        delta: gradeDelta,
        severity: gradeDelta < -20 ? 'critical' : 'medium',
        insight: `Queda de ${Math.abs(gradeDelta).toFixed(1)}% no desempenho acadêmico em comparação ao ano anterior.`
      };
      reports.push(report);

      // Registra insight no Grafo Soberano (SKG) para orquestração
      sovereignGraphService.addEntity({
        id: `GAP-${studentId}-${Date.now()}`,
        type: 'INSIGHT',
        label: 'Defasagem Acadêmica Detectada',
        metadata: {
          studentId,
          delta: gradeDelta,
          category: 'academic'
        }
      });
    }

    return reports;
  }

  /**
   * Agrega métricas de uma turma inteira para análise da gestão.
   */
  public async getClassPortfolio(classId: string) {
    const studentsInClass = await db.all('SELECT id, name FROM students WHERE classId = ?', [classId]);
    
    const results = await Promise.all(studentsInClass.map(async (s: any) => {
      const history = await this.getStudentLongitudinalHistory(s.id);
      return {
        id: s.id,
        name: s.name,
        latestAvg: history.length > 0 ? history[history.length - 1].avgGrade : 0,
        trend: history.length > 1 ? (history[history.length - 1].avgGrade > history[history.length - 2].avgGrade ? 'up' : 'down') : 'stable'
      };
    }));

    return {
      classId,
      avgGrade: results.reduce((acc, curr) => acc + curr.latestAvg, 0) / (results.length || 1),
      students: results
    };
  }
}

export const portfolioIntelligenceService = PortfolioIntelligenceService.getInstance();
