import { EventEmitter } from 'events';
import Database from '../database/Database';
import { licenseService } from './LicenseService';
import { FaceVectorIndex } from './FaceVectorIndex';
import * as path from 'path';
import * as os from 'os';

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
  private index: FaceVectorIndex;
  private confidenceThreshold: number = 0.6; // 60% de confiança mínima
  private modelLoaded: boolean = false;
  private readonly indexPath: string;

  constructor(db: Database, userDataPath?: string) {
    super();
    this.db = db;
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
   * Carrega embeddings do banco de dados
   */
  private async loadEmbeddingsFromDatabase(): Promise<void> {
    try {
      const embeddings = await this.db.getFaceEmbeddings();

      for (const embedding of embeddings) {
        this.index.add(embedding.faceId, embedding.embedding);
      }

      console.log(`${embeddings.length} embeddings indexados no HNSW`);
    } catch (error) {
      console.error('Erro ao carregar embeddings:', error);
      // Continuar mesmo se falhar
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
   * Extrai embedding de um rosto
   * ⚠️ STATUS: SIMULAÇÃO (V4 Audit)
   * Em produção, este método deve ser substituído pela chamada ao face_recognition.js 
   * ou pelo modelo TensorFlow.js carregado no loadModel().
   */
  public async extractEmbedding(faceData: any): Promise<number[] | null> {
    try {
      // O código abaixo gera vetores aleatórios para fins de demonstração da UI e lógica de fluxo.
      const embedding: number[] = [];
      for (let i = 0; i < 128; i++) {
        embedding.push(Math.random() * 2 - 1); // Valores entre -1 e 1
      }

      return embedding;
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
      await licenseService.assertStudentLimit();

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
      await licenseService.assertStudentLimit();

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
   * Obtém estatísticas do modelo
   */
  getStats() {
    return {
      modelLoaded: this.modelLoaded,
      embeddingsCount: this.index.size,
      confidenceThreshold: this.confidenceThreshold,
    };
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

