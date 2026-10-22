import { db } from '../../database/Database';
import { logger } from '../logger';

/**
 * VISION RE-ID SERVICE (v3645)
 * ----------------------------
 * Centraliza o registro biométrico de longa duração (embeddings).
 * Permite que identidades sejam compartilhadas entre campi sem expor fotos.
 */
export interface BiometricIdentity {
  studentId: string;
  embedding: number[]; // Vetor 128d (v3620)
  sourceUnit: string;
  confidence: number;
  updatedAt: number;
}

export class VisionReIdService {
  private static instance: VisionReIdService;
  private localRegistry: Map<string, BiometricIdentity> = new Map();

  private constructor() {}

  public static getInstance(): VisionReIdService {
    if (!VisionReIdService.instance) {
      VisionReIdService.instance = new VisionReIdService();
    }
    return VisionReIdService.instance;
  }

  /**
   * [SQA-VIS-855] Tenta identificar um aluno usando similaridade de cosseno.
   */
  public async identifyFromEnsemble(vector: number[]): Promise<BiometricIdentity | null> {
    let bestMatch: BiometricIdentity | null = null;
    let maxSimilarity = -1;

    // Busca no registro local (sincronizado de outros campi)
    for (const identity of this.localRegistry.values()) {
      const similarity = this.calculateCosineSimilarity(vector, identity.embedding);
      if (similarity > 0.85 && similarity > maxSimilarity) {
        maxSimilarity = similarity;
        bestMatch = identity;
      }
    }

    if (bestMatch) {
       logger.info(`[VisionReId] Match encontrado: ${bestMatch.studentId} (Sim: ${maxSimilarity.toFixed(2)})`);
    }

    return bestMatch;
  }

  /**
   * [SQA-VIS-858] Registra uma identidade vinda de outro campus (Lighthouse Sync).
   */
  public async registerRemoteIdentity(identity: BiometricIdentity) {
    this.localRegistry.set(identity.studentId, identity);
    
    // Persiste no banco para resiliência (v3508)
    await db.run(
      `INSERT OR REPLACE INTO biometric_registry (student_id, embedding, source_unit, updatedAt) 
       VALUES (?, ?, ?, ?)`,
      [identity.studentId, JSON.stringify(identity.embedding), identity.sourceUnit, identity.updatedAt]
    );

    logger.debug(`[VisionReId] Identidade biométrica sincronizada: ${identity.studentId} de ${identity.sourceUnit}`);
  }

  /**
   * Cálculo de Similaridade de Cosseno simplificado (v3508)
   */
  private calculateCosineSimilarity(v1: number[], v2: number[]): number {
    let dotProduct = 0;
    let mA = 0;
    let mB = 0;
    for (let i = 0; i < v1.length; i++) {
        dotProduct += (v1[i] * v2[i]);
        mA += (v1[i] * v1[i]);
        mB += (v2[i] * v2[i]);
    }
    mA = Math.sqrt(mA);
    mB = Math.sqrt(mB);
    const similarity = (dotProduct) / (mA * mB);
    return isNaN(similarity) ? 0 : similarity;
  }

  public async getStats() {
    return {
      registrySize: this.localRegistry.size,
      lastUpdate: Date.now()
    };
  }
}

export const visionReIdService = VisionReIdService.getInstance();

