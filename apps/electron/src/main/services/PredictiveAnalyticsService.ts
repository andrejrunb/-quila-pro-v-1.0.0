import { EventEmitter } from 'events';
import { logger } from '../logger';
import Database from '../../database/Database';
import { socialGraphService } from './SocialGraphService';
import { identityRecaptureService } from './IdentityRecaptureService';

export interface PredictiveRisk {
  studentId: string;
  score: number; // 0 to 100
  factors: string[];
  classification: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  predictedIncident?: string;
}

/**
 * Maturity Level 4: PredictiveAnalyticsService
 * Motor de inferência para predição de comportamento e risco escolar.
 */
class PredictiveAnalyticsService extends EventEmitter {
  private db: Database | null = null;
  private isRunning: boolean = false;

  public setDatabase(db: Database) {
    this.db = db;
  }

  /**
   * Executa a análise global de risco para todos os alunos ativos.
   */
  public async runGlobalInference(): Promise<PredictiveRisk[]> {
    if (!this.db || this.isRunning) return [];
    this.isRunning = true;
    
    logger.info('[Predictive] Iniciando inferência comportamental global Nível 4...');
    const risks: PredictiveRisk[] = [];

    try {
      const students = await this.db.all('SELECT id, name, frustrationScore FROM students WHERE status = \'active\'');
      
      // Garantir que o grafo social está atualizado
      await socialGraphService.computeGraphFromEvents();

      for (const student of students) {
        const risk = await this.calculateStudentRisk(student);
        if (risk.score > 30) {
          risks.push(risk);
        }
      }

      logger.info(`[Predictive] Análise concluída. ${risks.length} alunos em monitoramento de risco.`);
      this.emit('risks-updated', risks);
      return risks;
    } catch (err) {
      logger.error(`[Predictive] Falha na inferência global: ${err}`);
      return [];
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Cálculo multi-fatorial de risco (Nível 4)
   */
  public async calculateStudentRisk(student: any): Promise<PredictiveRisk> {
    let score = 0;
    const factors: string[] = [];

    // 1. Fator Social (SKG)
    const degree = (socialGraphService as any).graph.degree(student.id) || 0;
    if (degree <= 1) {
      score += 35;
      factors.push('SOCIAL_ISOLATION');
    }

    // 2. Fator Comportamental (Frustration)
    if (student.frustrationScore > 7) {
      score += 25;
      factors.push('HIGH_FRUSTRATION');
    }

    // 3. Fator Identitário (AI Evolution Drift)
    const stats = identityRecaptureService.getStats();
    // Se o aluno teve muitos refinamentos recentes, pode indicar mudança brusca de aparência/comportamento
    if (stats.totalRefinements > 100) { // Placeholder: Idealmente filtrar por studentId
       // score += 10;
       // factors.push('IDENTITY_DRIFT');
    }

    // 4. Fator Presença (Anomalia de Frequência)
    if (this.db) {
        const attendance = await this.db.all(
            'SELECT status FROM attendance WHERE studentId = ? ORDER BY date DESC LIMIT 10',
            [student.id]
        );
        const lates = attendance.filter(a => a.status === 'late').length;
        if (lates > 3) {
            score += 20;
            factors.push('ATTENDANCE_INSTABILITY');
        }
    }

    // [Phase 6001] Evolução de Inteligência (SIE)
    // Aplicar o fator de aprendizado do sistema
    const { sovereignEvolutionService } = require('./SovereignEvolutionService');
    const multiplier = await sovereignEvolutionService.getCurrentConfidenceMultiplier();
    score = score * multiplier;

    // Normalização
    score = Math.min(score, 100);

    let classification: PredictiveRisk['classification'] = 'LOW';
    if (score > 80) classification = 'CRITICAL';
    else if (score > 60) classification = 'HIGH';
    else if (score > 40) classification = 'MEDIUM';

    return {
      studentId: student.id,
      score,
      factors,
      classification,
      predictedIncident: this.inferIncident(factors)
    };
  }

  private inferIncident(factors: string[]): string | undefined {
    if (factors.includes('SOCIAL_ISOLATION') && factors.includes('ATTENDANCE_INSTABILITY')) {
      return 'POTENTIAL_DROPOUT';
    }
    if (factors.includes('HIGH_FRUSTRATION')) {
      return 'BEHAVIORAL_OUTBURST';
    }
    return undefined;
  }

  public async getRiskReport() {
    return this.runGlobalInference();
  }
}

export const predictiveAnalyticsService = new PredictiveAnalyticsService();
