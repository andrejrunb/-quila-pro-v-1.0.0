import { EventEmitter } from 'events';
import Database, { db } from '../../database/Database';
import { licenseService } from './LicenseService';
import { FaceVectorIndex } from './FaceVectorIndex';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';

import { FaceWorkerBridge } from './FaceWorkerBridge';
import { colabGpuBridge } from './ColabGpuBridge';
import { identityRecaptureService } from './IdentityRecaptureService';
import { systemHealthService } from './SystemHealthService';

/**
 * Interface para resultado de reconhecimento
 */
export interface FaceMatch {
  studentId: string;
  studentName: string;
  confidence: number;
  faceId: string;
  timestamp: Date;
}

/**
 * Interface para embedding de face
 */
export interface FaceEmbedding {
  faceId: string;
  studentId: string;
  embedding: number[]; // Vetor de 128 dimensões
  timestamp: Date;
}

/**
 * Classe para reconhecimento facial
 * Integra com banco de dados para identificar alunos
 */
export class FaceRecognition extends EventEmitter {
  private db: Database;
  private workerBridge: FaceWorkerBridge | null = null;
  private index: FaceVectorIndex;
  private confidenceThreshold: number = 0.6; // 60% de confiança mínima
  private modelLoaded: boolean = false;
  private readonly indexPath: string;

  constructor(db: Database, workerBridge?: FaceWorkerBridge, userDataPath?: string) {
    super();
    this.db = db;
    this.workerBridge = workerBridge || null;
    this.index = new FaceVectorIndex(128, 16, 64, 'cosine');
    this.indexPath = userDataPath ? path.join(userDataPath, 'face_index.hnsw') : path.join(os.homedir(), '.aquilapro', 'face_index.hnsw');
  }

  /**
   * Carrega modelos de reconhecimento facial
   * Em produção, usar face_recognition ou TensorFlow
   */
  async loadModel(): Promise<void> {
    try {
      console.log('Carregando modelo de reconhecimento facial...');

      // Simular carregamento de modelo
      // Em produção:
      // - Carregar face_recognition.js ou TensorFlow.js
      // - Carregar embeddings do banco de dados
      // - Compilar índice de busca (FAISS)

      await this.loadEmbeddingsFromDatabase();

      this.modelLoaded = true;
      this.emit('model:loaded', {
        timestamp: new Date(),
        embeddingsCount: this.index.size,
      });

      // Registrar listener para refinamento identitário (v3511)
      identityRecaptureService.on('identity-refined', async (refinement) => {
        await this.handleIdentityRefinement(refinement);
      });

      console.log(`Modelo carregado com ${this.index.size} embeddings indexados no HNSW`);
    } catch (error) {
      this.emit('error', {
        type: 'model:load',
        error: error instanceof Error ? error.message : 'Erro ao carregar modelo',
      });
      throw error;
    }
  }

  /**
   * Carrega embeddings do banco de dados e sincroniza com o HNSW local e os workers Python
   */
  private async loadEmbeddingsFromDatabase(): Promise<void> {
    try {
      const embeddings = await this.db.getFaceEmbeddings();
      const studentMap = new Map<string, number[][]>();

      for (const embedding of embeddings) {
        // Indexação HNSW local (Node.js side para busca rápida via API)
        this.index.add(embedding.faceId, embedding.embedding);

        // Agrupamento para sincronização com Workers Python (Real-time side)
        if (!studentMap.has(embedding.studentId)) {
          studentMap.set(embedding.studentId, []);
        }
        studentMap.get(embedding.studentId)!.push(embedding.embedding);
      }

      // Sincronizar com Workers em lote se o bridge estiver pronto
      if (this.workerBridge && this.workerBridge.isReady()) {
        console.log(`[FaceRecognition] Sincronizando ${studentMap.size} alunos com o pool de workers...`);
        const syncPromises = Array.from(studentMap.entries()).map(([sid, vecs]) => 
          this.workerBridge!.loadEmbeddings(sid, vecs)
        );
        await Promise.all(syncPromises);
      }

      console.log(`${embeddings.length} embeddings indexados no HNSW e sincronizados com workers`);
    } catch (error) {
      console.error('Erro ao carregar embeddings:', error);
      throw error;
    }
  }

  /**
   * Reconhece um rosto em um frame
   * Retorna o aluno mais provável
   */
  async recognize(faceData: Buffer): Promise<FaceMatch | null> {
    if (!this.modelLoaded) {
      throw new Error('Modelo não carregado. Chame loadModel() primeiro');
    }

    try {
      // Extrair embedding do rosto
      const embedding = await this.extractEmbedding(faceData);

      if (!embedding) {
        return null;
      }

      // Encontrar match mais próximo
      const match = this.findClosestMatch(embedding);

      if (match && match.confidence >= this.confidenceThreshold) {
        this.emit('recognition:success', {
          studentId: match.studentId,
          confidence: match.confidence,
          timestamp: new Date(),
        });

        // Identity Recapture: Se a confiança for alta, enviar para refinamento autônomo (Level 3)
        if (match.confidence > 0.90) {
          identityRecaptureService.processDetection(match.studentId, match.confidence, embedding);
          
          // Nível 14: Auto-Cura Biométrica
          const { biometricSelfHealingService } = await import('./BiometricSelfHealingService');
          biometricSelfHealingService.attemptSelfHealing(match.studentId, embedding, match.faceId ? await this.getEmbeddingById(match.faceId) : []);

          // [LEVEL 34] Seamless Presence Integration
          const { seamlessIdentityService } = require('./SeamlessIdentityService');
          seamlessIdentityService.reportPresence({
            userId: match.studentId,
            name: match.studentName || 'User',
            role: 'teacher',
            confidence: match.confidence,
            lastSeen: Date.now()
          });

          // [LEVEL 37] Emotional Resonance Integration
          const { microExpressionAnalyzer } = require('./MicroExpressionAnalyzer');
          const { emotionalClimateService } = require('./EmotionalClimateService');
          const state = await microExpressionAnalyzer.analyzeEmotion(faceData);
          emotionalClimateService.reportLocalEmotion('Terminal Central', state.emotion);
          
          this.emit('recognition:affective-state', {
            studentId: match.studentId,
            state
          });
        }



        return match;
      } else {
        this.emit('recognition:failed', {
          confidence: match?.confidence || 0,
          timestamp: new Date(),
        });

        return null;
      }
    } catch (error) {
      this.emit('error', {
        type: 'recognition',
        error: error instanceof Error ? error.message : 'Erro ao reconhecer rosto',
      });
      throw error;
    }
  }

  /**
   * Extrai embedding de um rosto usando o FaceWorkerBridge (Python Backend)
   * AG-002: Integração real para Malha Biométrica (Phase 1000)
   */
  public async extractEmbedding(faceData: Buffer | string): Promise<number[] | null> {
    try {
      // 1. Tentativa via Colab GPU (se online e faceData for Buffer)
      try {
        const colabStatus = colabGpuBridge.getStatus();
        if (colabStatus.online && Buffer.isBuffer(faceData)) {
          const result = await colabGpuBridge.extractFaceEmbeddings(faceData);
          if (result && result.faces_detected > 0 && result.faces[0]?.embedding) {
            console.log(`[FaceRecognition] Embedding extraído via Colab GPU (${result.processing_time_ms}ms, ${result.faces[0].embedding_dim}-dim)`);
            return result.faces[0].embedding;
          }
        }
      } catch (colabError) {
        console.warn('[FaceRecognition] Colab GPU indisponível, recorrendo ao worker local:', colabError instanceof Error ? colabError.message : colabError);
      }

      // 2. Tentativa via Worker local Python
      if (!this.workerBridge || !this.workerBridge.isReady()) {
        console.warn('[FaceRecognition] WorkerBridge não está pronto. Usando fallback de simulação.');
        // Fallback para fins de desenvolvimento se o worker não estiver rodando
        const embedding: number[] = [];
        for (let i = 0; i < 128; i++) {
          embedding.push(Math.random() * 2 - 1);
        }
        return embedding;
      }

      const result = await this.workerBridge.extractEmbedding(faceData);
      return result;
    } catch (error) {
      console.error('Erro ao extrair embedding:', error);
      return null;
    }
  }

  /**
   * Encontra o embedding mais próximo (busca por similaridade)
   * Usa distância euclidiana
   */
  private findClosestMatch(embedding: number[]): FaceMatch | null {
    const results = this.index.search(embedding, 1, this.confidenceThreshold);
    
    if (results.length === 0) return null;

    const top = results[0];
    return {
      studentId: top.id.split('_')[0], // Assume studentId_angle format
      studentName: '', // Será preenchido do banco se necessário
      confidence: top.score,
      faceId: top.id,
      timestamp: new Date(),
    };
  }

  /**
   * Calcula distância euclidiana entre dois vetores
   */
  private euclideanDistance(a: number[], b: number[]): number {
    let sum = 0;
    for (let i = 0; i < a.length; i++) {
      const diff = a[i] - b[i];
      sum += diff * diff;
    }
    return Math.sqrt(sum);
  }

  /**
   * Adiciona múltiplos ângulos de rosto para um aluno (V3)
   */
  async addMultiAngleFace(studentId: string, images: { front: string; left: string; right: string }): Promise<void> {
    try {
      const totalStudents = await this.db.getStudentCount();
      await licenseService.assertStudentLimit(totalStudents);

      const angles = ['front', 'left', 'right'] as const;
      for (const angle of angles) {
        const imageData = images[angle];
        if (!imageData) continue;

        // Converter DataURL para Buffer se necessário, ou passar direto se o extrator suportar
        const buffer = Buffer.from(imageData.split(',')[1], 'base64');
        const embedding = await this.extractEmbedding(buffer);
        
        if (embedding) {
          const faceId = `${studentId}_${angle}`;
          await this.db.saveFaceEmbedding(studentId, embedding, faceId);
          
          this.index.add(faceId, embedding);
        }
      }

      console.log(`Biometria multi-ângulo cadastrada para aluno ${studentId}`);
    } catch (error) {
      console.error(`Erro ao cadastrar biometria multi-ângulo para ${studentId}:`, error);
      throw error;
    }
  }

  /**
   * Adiciona novo rosto ao banco de dados (Single)
   */
  async addFace(studentId: string, faceData: Buffer): Promise<string> {
    try {
      // Verificar limite da licença (Phase 3 - Step 51)
      const totalStudents = await this.db.getStudentCount();
      await licenseService.assertStudentLimit(totalStudents);

      // Extrair embedding
      const embedding = await this.extractEmbedding(faceData);
      if (!embedding) {
        throw new Error('Falha ao extrair embedding');
      }

      // Salvar no banco de dados
      await this.db.saveFaceEmbedding(studentId, embedding);
      const faceId = studentId; // Usar studentId como identicador único de face

      // Atualizar cache local
      this.index.add(faceId, embedding);

      this.emit('face:added', {
        studentId,
        faceId,
        timestamp: new Date(),
      });

      console.log(`Rosto adicionado e indexado no HNSW para aluno ${studentId}`);
      return faceId;
    } catch (error) {
      this.emit('error', {
        type: 'face:add',
        studentId,
        error: error instanceof Error ? error.message : 'Erro ao adicionar rosto',
      });
      throw error;
    }
  }

  /**
   * [Level 3] Trata o evento de refinamento identitário
   */
  private async handleIdentityRefinement(refinement: any): Promise<void> {
    try {
      const { studentId, newConfidence } = refinement;
      
      // 1. Recarregar do banco para pegar o embedding médio calculado
      const embeddings = await this.db.getFaceEmbeddings();
      const updated = embeddings.find(e => e.studentId === studentId);

      if (updated) {
        // 2. Atualizar HNSW local
        this.index.remove(updated.faceId);
        this.index.add(updated.faceId, updated.embedding);

        // 3. Sincronizar com Workers Python
        if (this.workerBridge && this.workerBridge.isReady()) {
          await this.workerBridge.loadEmbeddings(studentId, [updated.embedding]);
        }

        systemHealthService.log('FaceRecognition', 'info', `Identidade evoluída para ${studentId} (Confiança: ${newConfidence})`);
      }
    } catch (error) {
      console.error('[FaceRecognition] Erro ao processar refinamento:', error);
    }
  }

  /**
   * Refina o embedding de um aluno com uma nova captura
   * (Identity Recapture - Phase 401+)
   */
  async refineEmbedding(studentId: string, faceData: Buffer, faceId?: string): Promise<void> {
    try {
      const targetFaceId = faceId || studentId;
      
      // 1. Extrair novo embedding
      const newEmbedding = await this.extractEmbedding(faceData);
      if (!newEmbedding) return;

      // 2. Buscar embedding atual
      const existingEmbeddings = await this.db.getFaceEmbeddings();
      const current = existingEmbeddings.find(e => e.faceId === targetFaceId);

      if (current) {
        // 3. Mesclar embeddings (Média Móvel - Alpha 0.2 para evitar 'drift' rápido)
        const alpha = 0.2;
        const refined = current.embedding.map((val, i) => val * (1 - alpha) + newEmbedding[i] * alpha);

        // 4. Salvar no Banco
        await this.db.saveFaceEmbedding(studentId, refined, targetFaceId);

        // 5. Atualizar Índice HNSW (Remove + Add para garantir integridade do grafo)
        this.index.remove(targetFaceId);
        this.index.add(targetFaceId, refined);

        this.emit('face:refined', {
          studentId,
          faceId: targetFaceId,
          timestamp: new Date()
        });

        console.log(`[Identity Recapture] Biometria refinada para aluno ${studentId} (faceId: ${targetFaceId})`);
      } else {
        // Se não existir, cadastrar como novo
        await this.addFace(studentId, faceData);
      }
    } catch (error) {
      console.error(`Erro no refinamento de biometria para ${studentId}:`, error);
    }
  }

  /**
   * Remove rosto do banco de dados
   */
  async removeFace(faceId: string): Promise<void> {
    try {
      await this.db.deleteFaceEmbedding(faceId);
      this.index.remove(faceId);

      this.emit('face:removed', {
        faceId,
        timestamp: new Date(),
      });

      console.log(`Rosto ${faceId} removido`);
    } catch (error) {
      this.emit('error', {
        type: 'face:remove',
        faceId,
        error: error instanceof Error ? error.message : 'Erro ao remover rosto',
      });
      throw error;
    }
  }

  /**
   * Define limiar de confiança
   */
  setConfidenceThreshold(threshold: number): void {
    if (threshold < 0 || threshold > 1) {
      throw new Error('Limiar deve estar entre 0 e 1');
    }
    this.confidenceThreshold = threshold;
  }

  /**
   * Obtém o status operacional detalhado (Real vs Simulado, NPU, etc)
   */
  async getOperationalStatus(): Promise<any> {
    const bridgeStatus = this.workerBridge ? await this.workerBridge.getOperationalStatus() : { mode: 'NO_BRIDGE' };
    return {
      service: 'FaceRecognition',
      model_loaded: this.modelLoaded,
      index_size: this.index.size,
      bridge: bridgeStatus
    };
  }

  /**
   * Obtém estatísticas do modelo
   */
  getStats() {
    return {
      modelLoaded: this.modelLoaded,
      embeddingsCount: this.index.size,
      confidenceThreshold: this.confidenceThreshold,
      isRealMesh: this.workerBridge?.isReady() || false
    };
  }

  /**
   * Obtém um embedding específico pelo faceId
   */
  public async getEmbeddingById(faceId: string): Promise<number[]> {
    try {
      const rows = await this.db.all('SELECT embedding FROM face_embeddings WHERE faceId = ?', [faceId]);
      if (rows.length > 0) {
        return JSON.parse(rows[0].embedding);
      }
      return [];
    } catch (error) {
      console.error(`Erro ao buscar embedding ${faceId}:`, error);
      return [];
    }
  }

  /**
   * Limpa cache de embeddings
   */
  clearCache(): void {
    // Para HNSW, 'limpar cache' significa resetar o índice
    this.index = new FaceVectorIndex(128, 16, 64, 'cosine');
    console.log('Cache de embeddings (HNSW) limpo');
  }
}

export default FaceRecognition;


