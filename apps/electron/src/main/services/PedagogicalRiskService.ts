import { db } from '../../database/Database';
import { logger } from '../logger';
import { dropoutPredictor } from './DropoutPredictor';
import { coordinationService } from './CoordinationService';

/**
 * PEDAGOGICAL RISK SERVICE (Phase 501)
 * -----------------------------------
 * Orchestrates pedagogical risk assessment and dashboard reporting.
 * Integrates with DropoutPredictor for the mathematical heavy lifting.
 */
export class PedagogicalRiskService {
  private static instance: PedagogicalRiskService;

  private constructor() {}

  public static getInstance(): PedagogicalRiskService {
    if (!PedagogicalRiskService.instance) {
      PedagogicalRiskService.instance = new PedagogicalRiskService();
    }
    return PedagogicalRiskService.instance;
  }

  /**
   * Analyzes risk for a student and publishes findings to the coordination dashboard.
   */
  public async analyzeRisk(studentId: string, context?: { trigger: string, value: any }): Promise<void> {
    try {
      logger.info(`[Risk-Service] Analyzing risk for ${studentId} (Trigger: ${context?.trigger || 'MANUAL'})`);
      
      const analysis = await dropoutPredictor.analyzeStudent(studentId);
      
      // If risk is significant, publish to Coordination dashboard
      if (analysis.riskScore > 50) {
        await coordinationService.publishInsight({
          type: 'DROPOUT_RISK',
          targetId: studentId,
          title: `Risco de Evasão: ${analysis.level.toUpperCase()}`,
          content: `O estudante ${studentId} apresenta score de risco de ${analysis.riskScore}%. 
                    Fatores detectados: ${analysis.factors.join(', ')}. 
                    Recomendação: ${analysis.recommendation}`,
          priority: analysis.riskScore > 80 ? 'HIGH' : 'MEDIUM'
        });
        
        logger.info(`[Risk-Service] High risk insight published for ${studentId}`);
      }
      
    } catch (err: any) {
      logger.error(`[Risk-Service] Analysis failed for ${studentId}: ${err.message}`);
    }
  }

  /**
   * Performs a global risk scan for all active students.
   */
  public async runGlobalAudit(): Promise<void> {
    logger.info('[Risk-Service] Starting global institutional risk audit...');
    const students = await db.all("SELECT id FROM students WHERE status = 'active'");
    
    for (const student of students) {
      await this.analyzeRisk(student.id, { trigger: 'GLOBAL_AUDIT', value: null });
    }
    
    logger.info('[Risk-Service] Global audit completed.');
  }

  /**
   * Fetches longitudinal (historical) risk insights for a student.
   */
  public async getLongitudinalInsight(studentId: string): Promise<any> {
    const history = await db.all(
      'SELECT * FROM student_risk_history WHERE student_id = ? ORDER BY analyzed_at DESC LIMIT 10',
      [studentId]
    );
    
    if (history.length === 0) return { momentum: 'STABLE', score: 0 };
    
    const latest = history[0].risk_score;
    const previous = history[1]?.risk_score || latest;
    
    return {
      momentum: latest > previous ? 'WORSENING' : (latest < previous ? 'IMPROVING' : 'STABLE'),
      score: latest,
      history: history.map(h => ({ date: h.analyzed_at, score: h.risk_score }))
    };
  }
}

export const pedagogicalRiskService = PedagogicalRiskService.getInstance();
