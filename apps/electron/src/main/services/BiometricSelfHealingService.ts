import { EventEmitter } from 'events';
import Database from '../../database/Database';
import { logger } from '../logger';
import { identityRecaptureService, IdentityRefinement } from './IdentityRecaptureService';

/**
 * Nível 14 — BiometricSelfHealingService
 * Evolução do IdentityRecaptureService com foco em Monitoramento de Saúde de Identidade
 * e diversidade de biometria.
 */
export interface IdentityHealthScore {
  studentId: string;
  health: number; // 0.0 - 1.0
  lastUpdate: Date;
  diversityAngles: string[]; // ['front', 'left', 'right', etc]
  refinementCount: number;
  status: 'stable' | 'evolving' | 'drift_detected';
}

export class BiometricSelfHealingService extends EventEmitter {
  private static instance: BiometricSelfHealingService;
  private driftThreshold = 0.35; // Distância euclidiana máxima permitida antes de considerar 'drift'
  private recoveryAlpha = 0.15; // Taxa de aprendizado para a auto-cura

  private constructor() {
    super();
    this.initialize();
  }

  public static getInstance(): BiometricSelfHealingService {
    if (!BiometricSelfHealingService.instance) {
      BiometricSelfHealingService.instance = new BiometricSelfHealingService();
    }
    return BiometricSelfHealingService.instance;
  }

  private initialize() {
    // Escutar eventos do IdentityRecapture original para monitorar saúde
    identityRecaptureService.on('identity-refined', (refinement: IdentityRefinement) => {
      this.monitorHealth(refinement);
    });

    logger.info('[Self-Healing] Biometric Self-Healing Service Level 14 Initialized');
  }

  /**
   * Monitora a saúde da identidade após um refinamento.
   */
  private async monitorHealth(refinement: IdentityRefinement) {
    try {
      const db = Database.getInstance();
      const studentId = refinement.studentId;

      // Calcular score de saúde baseado na estabilidade das detecções
      const health = Math.min(refinement.newConfidence * 1.05, 1.0);
      
      const healthStatus: IdentityHealthScore = {
        studentId,
        health,
        lastUpdate: new Date(),
        diversityAngles: await this.getDiversityAngles(studentId),
        refinementCount: (identityRecaptureService.getStats().totalRefinements),
        status: health > 0.95 ? 'stable' : 'evolving'
      };

      this.emit('health-updated', healthStatus);
      
      if (healthStatus.status === 'stable') {
        logger.debug(`[Self-Healing] Identidade de ${studentId} está estável (Health: ${health.toFixed(2)})`);
      }
    } catch (error) {
      logger.error(`[Self-Healing] Erro ao monitorar saúde de ${refinement.studentId}: ${error}`);
    }
  }

  /**
   * Verifica quais ângulos de biometria o aluno possui.
   */
  private async getDiversityAngles(studentId: string): Promise<string[]> {
    const db = Database.getInstance();
    const rows = await db.all('SELECT faceId FROM face_embeddings WHERE studentId = ?', [studentId]);
    return rows.map(r => r.faceId.split('_')[1] || 'default');
  }

  /**
   * [Nível 14] Tenta curar uma identidade que está apresentando 'drift' (deriva biométrica).
   * Isso acontece quando o aluno cresce ou muda drasticamente o estilo (cabelo, óculos).
   */
  public async attemptSelfHealing(studentId: string, currentEmbedding: number[], matchedEmbedding: number[]) {
    const distance = this.calculateDistance(currentEmbedding, matchedEmbedding);
    
    if (distance > this.driftThreshold) {
      logger.warn(`[Self-Healing] Drift detectado para ${studentId} (Distância: ${distance.toFixed(3)}). Iniciando cura gradual.`);
      
      // Cura gradual: Não substitui, mas aproxima o template do novo estado
      const healedEmbedding = matchedEmbedding.map((val, i) => 
        val * (1 - this.recoveryAlpha) + currentEmbedding[i] * this.recoveryAlpha
      );

      const db = Database.getInstance();
      await db.run(
        'UPDATE face_embeddings SET embedding = ? WHERE studentId = ? AND faceId = ?',
        [JSON.stringify(healedEmbedding), studentId, studentId]
      );

      this.emit('identity-healed', {
        studentId,
        distance,
        timestamp: new Date()
      });
    }
  }

  private calculateDistance(a: number[], b: number[]): number {
    return Math.sqrt(a.reduce((acc, val, i) => acc + Math.pow(val - b[i], 2), 0));
  }

  public async getMeshHealthReport(): Promise<IdentityHealthScore[]> {
    // Em um cenário real, isso buscaria de uma tabela de telemetria
    // Por enquanto, simulamos baseado nos dados do banco
    const db = Database.getInstance();
    const students = await db.all('SELECT DISTINCT studentId FROM face_embeddings LIMIT 50');
    
    const reports: IdentityHealthScore[] = [];
    for (const s of students) {
      reports.push({
        studentId: s.studentId,
        health: 0.9 + Math.random() * 0.1,
        lastUpdate: new Date(),
        diversityAngles: await this.getDiversityAngles(s.studentId),
        refinementCount: Math.floor(Math.random() * 10),
        status: 'stable'
      });
    }
    return reports;
  }
}

export const biometricSelfHealingService = BiometricSelfHealingService.getInstance();
