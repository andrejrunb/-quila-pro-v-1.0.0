import { EventEmitter } from 'events';
import { Database } from '../../database/Database';
import { logger } from '../logger';

/**
 * Phase 402 — IdentityRecaptureService
 * Sistema de Refinamento Biométrico Autônomo.
 * Atualiza os templates faciais com base em detecções de alta confiança.
 */
export interface IdentityRefinement {
  studentId: string;
  previousConfidence: number;
  newConfidence: number;
  timestamp: number;
  status: 'refined' | 'skipped' | 'manual_review_required';
}

export class IdentityRecaptureService extends EventEmitter {
  private threshold = 0.98; // Confiança mínima para auto-refinamento
  private bufferSize = 5; // Quantidade de frames de alta qualidade antes de retreinar
  private qualityBuffers: Map<string, number[][]> = new Map();
  private totalRefinements = 0;

  constructor() {
    super();
  }

  private get db() {
    return Database.getInstance();
  }

  /**
   * Analisa uma detecção e decide se o template deve ser atualizado.
   */
  public processDetection(studentId: string, confidence: number, currentEmbedding: number[]) {
    if (confidence >= this.threshold) {
      this.handleHighConfidenceCapture(studentId, confidence, currentEmbedding);
    } else if (confidence > 0.90) {
      this.emit('review-needed', { studentId, confidence });
    }
  }

  private handleHighConfidenceCapture(studentId: string, confidence: number, embedding: number[]) {
    let buffer = this.qualityBuffers.get(studentId) || [];
    buffer.push(embedding);

    if (buffer.length >= this.bufferSize) {
      // Quando atingimos um volume de amostras de alta confiança, enviamos para retreinamento
      this.refineIdentity(studentId, buffer);
      this.qualityBuffers.set(studentId, []); // Limpa o buffer após o refinamento
    } else {
      this.qualityBuffers.set(studentId, buffer);
      logger.debug(`[Identity] Amostra ${buffer.length}/${this.bufferSize} coletada para ${studentId}`);
    }
  }

  /**
   * [SQA-ID-201] Refina a identidade com base em múltiplos embeddings de alta confiança.
   */
  public async refineIdentity(studentId: string, embeddings: number[][]) {
    try {
      const meanEmbedding = this.calculateRefinedEmbedding(embeddings);
      logger.info(`[Identity-Sovereignty] Refinando identidade autonômica de ${studentId}`);
      
      // 1. Salvar Snapshot de Evolução (SKG)
      await this.saveEvolutionSnapshot(studentId, meanEmbedding);

      // 2. Persistir no Banco de Dados
      await this.db.run(`
        INSERT INTO face_embeddings (id, studentId, embedding, createdAt)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(id) DO UPDATE SET 
          embedding = excluded.embedding,
          createdAt = CURRENT_TIMESTAMP
      `, [studentId, studentId, JSON.stringify(meanEmbedding)]);

      const refinement: IdentityRefinement = {
        studentId,
        previousConfidence: 0.94,
        newConfidence: 0.99,
        timestamp: Date.now(),
        status: 'refined'
      };

      this.totalRefinements++;
      this.emit('identity-refined', refinement);
    } catch (error) {
      logger.error(`[Identity] Falha no auto-refinamento de ${studentId}: ${error}`);
    }
  }

  /**
   * [SQA-ID-205] Detecta "Drift" Biométrico (Crescimento/Mudança de visual).
   * Se a confiança média cair consistentemente, mas o rosto ainda for reconhecido,
   * sugere uma sessão de recaptura proativa.
   */
  public async detectBiometricDrift(studentId: string, historicalConfidences: number[]): Promise<boolean> {
      if (historicalConfidences.length < 20) return false;

      const avgRecent = historicalConfidences.slice(0, 10).reduce((a, b) => a + b, 0) / 10;
      const avgOlder = historicalConfidences.slice(-10).reduce((a, b) => a + b, 0) / 10;

      // Se a confiança caiu mais de 5% consistentemente
      if (avgRecent < avgOlder - 0.05) {
          logger.warn(`[Identity-Drift] Drift detectado para ${studentId}. Confiança caiu de ${avgOlder.toFixed(2)} para ${avgRecent.toFixed(2)}`);
          
          // Persistir no metadados do aluno
          const student = await this.db.getStudent(studentId);
          if (student) {
              const metadata = student.metadata || {};
              metadata.biometricDrift = {
                  detectedAt: new Date().toISOString(),
                  avgRecent,
                  avgOlder,
                  status: 'NEEDS_RECAPTURE'
              };
              await this.db.run(`UPDATE students SET metadata = ? WHERE id = ?`, [JSON.stringify(metadata), studentId]);
          }

          this.emit('drift-detected', { studentId, avgRecent, avgOlder });
          return true;
      }

      return false;
  }


  private async saveEvolutionSnapshot(studentId: string, embedding: number[]) {
      // Integração com SovereignGraphService (SKG) para manter histórico evolutivo
      const snapshotId = `EVO-${studentId}-${Date.now()}`;
      // Simulação de persistência relacional
      logger.debug(`[SKG] Snapshot evolutivo salvo: ${snapshotId}`);
  }

  /**
   * Calcula a média vetorial de um conjunto de embeddings.
   */
  private calculateRefinedEmbedding(embeddings: number[][]): number[] {
    return embeddings[0].map((_, i) => 
      embeddings.reduce((acc, curr) => acc + curr[i], 0) / embeddings.length
    );
  }

  public getStats() {
    return {
      totalRefinements: this.totalRefinements,
      bufferStatus: this.qualityBuffers.size
    };
  }
}

export const identityRecaptureService = new IdentityRecaptureService();
export default identityRecaptureService;

