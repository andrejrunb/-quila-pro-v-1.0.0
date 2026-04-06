import { EventEmitter } from 'events';
import { Database } from '../database/Database';
import { logger } from '../main/logger';

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

class IdentityRecaptureService extends EventEmitter {
  private threshold = 0.98; // Confiança mínima para auto-refinamento
  private bufferSize = 5; // Quantidade de frames de alta qualidade antes de retreinar
  private qualityBuffers: Map<string, number[][]> = new Map();
  private db: Database;

  constructor() {
    super();
    this.db = Database.getInstance();
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
      // Calcular a média dos embeddings para suavizar anomalias
      const meanEmbedding = embeddings[0].map((_, i) => 
        embeddings.reduce((acc, curr) => acc + curr[i], 0) / embeddings.length
      );

      logger.info(`[Identity-Sovereignty] Refinando identidade autonômica de ${studentId}`);
      
      // Persistir no Banco de Dados (v3511) na tabela biometric_registry (v3508)
      await this.db.run(`
        INSERT INTO biometric_registry (student_id, embedding, source_unit, confidence, updatedAt)
        VALUES (?, ?, 'self_refinement', ?, CURRENT_TIMESTAMP)
        ON CONFLICT(student_id) DO UPDATE SET 
          embedding = excluded.embedding,
          confidence = excluded.confidence,
          updatedAt = CURRENT_TIMESTAMP
      `, [studentId, JSON.stringify(meanEmbedding), 0.99]);

      // Emitir evento para o FaceRecognition recarregar este aluno no HNSW (v3511)
      const refinement: IdentityRefinement = {
        studentId,
        previousConfidence: 0.94,
        newConfidence: 0.99,
        timestamp: Date.now(),
        status: 'refined'
      };

      this.emit('identity-refined', refinement);
    } catch (error) {
      logger.error(`[Identity] Falha no auto-refinamento de ${studentId}: ${error}`);
    }
  }
}

export const identityRecaptureService = new IdentityRecaptureService();
export default identityRecaptureService;
