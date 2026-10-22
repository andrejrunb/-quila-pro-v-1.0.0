import { sovereignRegistry } from '../registry';
import { Logger } from './Logger';
import Database from '../../database/Database';
import { FaceRecognition } from './FaceRecognition';

/**
 * Integração Completa de Reconhecimento Facial com Banco de Dados
 * Passo 1 Crítico: Conectar detecções com identificação de alunos
 */

export interface FaceDetection {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
  embedding?: number[];
  timestamp: number;
  cameraId: string;
  frameId: string;
}

export interface StudentMatch {
  studentId: string;
  name: string;
  confidence: number;
  matchedAt: number;
  photoId?: string;
}

export interface AttendanceRecord {
  studentId: string;
  cameraId: string;
  entryTime: number;
  exitTime?: number;
  confidence: number;
  status: 'present' | 'late' | 'absent';
  date: string;
}

export class FaceRecognitionIntegration {
  private logger: Logger;
  private attendanceCache: Map<string, AttendanceRecord> = new Map();
  private embeddingCache: Map<string, number[]> = new Map();

  private get db(): Database {
    return Database.getInstance();
  }

  private get faceRecognition(): FaceRecognition {
    const service = sovereignRegistry.getContext().faceRecognition;
    if (!service) {
      throw new Error('FaceRecognition service not initialized in registry');
    }
    return service;
  }

  constructor() {
    this.logger = new Logger('FaceRecognitionIntegration');
  }


  /**
   * Processar detecção de face e identificar aluno
   */
  async processDetection(detection: FaceDetection): Promise<StudentMatch | null> {
    try {
      this.logger.debug(`Processando detecção: ${detection.id}`);

      // 1. Extrair embedding da face detectada
      // Nota: extractEmbedding espera Buffer ou string (caminho do arquivo)
      // Como não temos o frame aqui, assumimos que a detecção já deveria ter o embedding
      const embedding = detection.embedding;

      if (!embedding) {
        this.logger.warn(`Não foi possível extrair embedding para detecção ${detection.id}`);
        return null;
      }

      // 2. Buscar alunos com embeddings similares no banco de dados
      const matches = await this.findSimilarStudents(embedding, detection.cameraId);

      if (matches.length === 0) {
        this.logger.info(`Nenhuma correspondência encontrada para detecção ${detection.id}`);
        return null;
      }

      // 3. Retornar melhor correspondência
      const bestMatch = matches[0];
      this.logger.info(`Aluno identificado: ${bestMatch.name} (confiança: ${bestMatch.confidence.toFixed(2)})`);

      // 4. Registrar presença
      await this.recordAttendance(bestMatch.studentId, detection);

      // 5. Atualizar embedding cache se confiança alta
      if (bestMatch.confidence > 0.85) {
        this.embeddingCache.set(bestMatch.studentId, embedding);
      }

      return bestMatch;
    } catch (error) {
      this.logger.error(`Erro ao processar detecção: ${(error as Error).message}`);
      return null;
    }
  }

  /**
   * Buscar alunos com embeddings similares
   */
  private async findSimilarStudents(
    embedding: number[],
    cameraId: string,
    topK: number = 5
  ): Promise<StudentMatch[]> {
    try {
      // 1. Buscar todos os alunos ativos
      const students = await this.db.getStudents();

      if (!students || students.length === 0) {
        return [];
      }

      // 2. Calcular similaridade com cada aluno
      const similarities = students.map((student: any) => {
        const photoEmbedding = JSON.parse(student.photoHash || '[]');
        const similarity = this.calculateSimilarity(embedding, photoEmbedding);

        return {
          studentId: student.id,
          name: student.name,
          confidence: similarity,
          photoId: student.photo_id,
          matchedAt: Date.now(),
        };
      });

      // 3. Ordenar por confiança e retornar top K
      const sorted = similarities
        .filter((s: any) => s.confidence > 0.6) // Limiar mínimo de confiança
        .sort((a: any, b: any) => b.confidence - a.confidence)
        .slice(0, topK);

      return sorted;
    } catch (error) {
      this.logger.error(`Erro ao buscar alunos similares: ${(error as Error).message}`);
      return [];
    }
  }

  /**
   * Calcular similaridade entre dois embeddings (cosseno)
   */
  private calculateSimilarity(embedding1: number[], embedding2: number[]): number {
    if (embedding1.length !== embedding2.length) {
      return 0;
    }

    let dotProduct = 0;
    let magnitude1 = 0;
    let magnitude2 = 0;

    for (let i = 0; i < embedding1.length; i++) {
      dotProduct += embedding1[i] * embedding2[i];
      magnitude1 += embedding1[i] * embedding1[i];
      magnitude2 += embedding2[i] * embedding2[i];
    }

    magnitude1 = Math.sqrt(magnitude1);
    magnitude2 = Math.sqrt(magnitude2);

    if (magnitude1 === 0 || magnitude2 === 0) {
      return 0;
    }

    return dotProduct / (magnitude1 * magnitude2);
  }

  /**
   * Registrar presença do aluno
   */
  private async recordAttendance(
    studentId: string,
    detection: FaceDetection
  ): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const cacheKey = `${studentId}-${today}`;

      // Verificar se já existe registro de presença hoje
      let record = this.attendanceCache.get(cacheKey);

      if (!record) {
        // Buscar no banco de dados
        const existing = await this.db.get(
          `SELECT * FROM attendance WHERE student_id = ? AND date = ? LIMIT 1`,
          [studentId, today]
        ) as any;

        if (existing) {
          record = existing;
        } else {
          // Criar novo registro
          record = {
            studentId,
            cameraId: detection.cameraId,
            entryTime: detection.timestamp,
            confidence: detection.confidence,
            status: this.calculateStatus(detection.timestamp),
            date: today,
          };
        }
      }

      // Atualizar tempo de saída
      record!.exitTime = detection.timestamp;

      // Salvar no cache
      this.attendanceCache.set(cacheKey, record!);

      // Salvar no banco de dados
      await this.db.recordAttendance({
        id: `att-${studentId}-${today}`,
        studentId,
        classId: '', 
        scheduleId: '',
        date: today,
        status: record!.status,
        percentage: 100,
        timeInClass: 0,
        totalDuration: 0,
      });

      this.logger.debug(`Presença registrada: ${studentId} em ${today}`);
    } catch (error) {
      this.logger.error(`Erro ao registrar presença: ${(error as Error).message}`);
    }
  }

  /**
   * Calcular status de presença (presente, atrasado, ausente)
   */
  private calculateStatus(timestamp: number): 'present' | 'late' | 'absent' {
    // Buscar horário de aula para hoje
    const hour = new Date(timestamp).getHours();
    const minute = new Date(timestamp).getMinutes();
    const timeInMinutes = hour * 60 + minute;

    // Horários de aula (exemplo: 8:00, 10:00, 14:00)
    const classStartTimes = [8 * 60, 10 * 60, 14 * 60]; // em minutos
    const lateThreshold = 15; // 15 minutos de tolerância

    for (const startTime of classStartTimes) {
      if (timeInMinutes >= startTime && timeInMinutes <= startTime + 50) {
        // Está dentro do horário de aula
        if (timeInMinutes <= startTime + lateThreshold) {
          return 'present';
        } else {
          return 'late';
        }
      }
    }

    return 'absent';
  }

  /**
   * Treinar novo aluno com fotos
   */
  async trainStudent(studentId: string, photoUrls: string[]): Promise<boolean> {
    try {
      this.logger.info(`Treinando aluno ${studentId} com ${photoUrls.length} fotos`);

      // 1. Extrair embeddings de todas as fotos
      const embeddings: number[][] = [];

      for (const photoUrl of photoUrls) {
        const embedding = await this.faceRecognition.extractEmbedding(photoUrl);

        if (embedding) {
          embeddings.push(embedding);
        }
      }

      if (embeddings.length === 0) {
        this.logger.warn(`Nenhum embedding extraído para aluno ${studentId}`);
        return false;
      }

      // 2. Calcular embedding médio
      const averageEmbedding = this.calculateAverageEmbedding(embeddings);

      // 3. Salvar no banco de dados
      await this.db.updateStudent(studentId, {
        photoHash: JSON.stringify(averageEmbedding),
      });

      // 4. Atualizar cache
      this.embeddingCache.set(studentId, averageEmbedding);

      this.logger.info(`Aluno ${studentId} treinado com sucesso`);
      return true;
    } catch (error) {
      this.logger.error(`Erro ao treinar aluno: ${(error as Error).message}`);
      return false;
    }
  }

  /**
   * Calcular embedding médio de múltiplos embeddings
   */
  private calculateAverageEmbedding(embeddings: number[][]): number[] {
    if (embeddings.length === 0) {
      return [];
    }

    const length = embeddings[0].length;
    const average: number[] = new Array(length).fill(0);

    for (const embedding of embeddings) {
      for (let i = 0; i < length; i++) {
        average[i] += embedding[i];
      }
    }

    for (let i = 0; i < length; i++) {
      average[i] /= embeddings.length;
    }

    return average;
  }

  /**
   * Obter relatório de presença do aluno
   */
  async getStudentAttendanceReport(
    studentId: string,
    startDate: string,
    endDate: string
  ): Promise<AttendanceRecord[]> {
    try {
      // SQLite: usa db.all() para consultas de lista
      const records = await this.db.all(
        `SELECT * FROM attendance
         WHERE student_id = ? AND date BETWEEN ? AND ?
         ORDER BY date DESC`,
        [studentId, startDate, endDate]
      ) as any[];

      return records || [];
    } catch (error) {
      this.logger.error(`Erro ao obter relatório de presença: ${(error as Error).message}`);
      return [];
    }
  }

  /**
   * Obter estatísticas de presença
   */
  async getAttendanceStats(startDate: string, endDate: string): Promise<any> {
    try {
      // SQLite: usa db.all() para consultas de agrupamento
      const stats = await this.db.all(
        `SELECT
           status,
           COUNT(*) as count,
           COUNT(DISTINCT student_id) as unique_students
         FROM attendance
         WHERE date BETWEEN ? AND ?
         GROUP BY status`,
        [startDate, endDate]
      ) as any[];

      return stats || [];
    } catch (error) {
      this.logger.error(`Erro ao obter estatísticas: ${(error as Error).message}`);
      return [];
    }
  }

  /**
   * Limpar cache
   */
  clearCache(): void {
    this.attendanceCache.clear();
    this.embeddingCache.clear();
    this.logger.info('Cache limpo');
  }
}

export default FaceRecognitionIntegration;
