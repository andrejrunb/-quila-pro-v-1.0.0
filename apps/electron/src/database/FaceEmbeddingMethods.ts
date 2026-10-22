/**
 * Métodos para gerenciar embeddings de faces no banco de dados
 * Adicionar estes métodos à classe Database
 */
import { securityService } from '../main/services/SecurityService';

export const FaceEmbeddingMethods = {
  /**
   * Salva um embedding de face no banco de dados
   */
  async saveFaceEmbedding(this: any, data: {
    studentId: string;
    embedding: number[];
    timestamp: Date;
  }): Promise<string> {
    const faceId = `face-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const query = `
      INSERT INTO face_embeddings (face_id, student_id, embedding, timestamp)
      VALUES (?, ?, ?, ?)
    `;

    const embeddingJson = JSON.stringify(data.embedding);
    const encrypted = securityService.encryptBuffer(Buffer.from(embeddingJson));

    try {
      await this.db.run(query, [
        faceId,
        data.studentId,
        encrypted.toString('hex'),
        data.timestamp.toISOString(),
      ]);

      console.log(`Embedding salvo: ${faceId} para aluno ${data.studentId}`);
      return faceId;
    } catch (error) {
      console.error('Erro ao salvar embedding:', error);
      throw error;
    }
  },

  /**
   * Obtém todos os embeddings de um aluno
   */
  async getStudentFaceEmbeddings(this: any, studentId: string): Promise<any[]> {
    const query = `
      SELECT face_id, student_id, embedding, timestamp
      FROM face_embeddings
      WHERE student_id = ?
      ORDER BY timestamp DESC
    `;

    try {
      const rows = await this.db.all(query, [studentId]);

      return rows.map((row: any) => {
        let embedding = [];
        try {
          if (row.embedding.includes('"')) {
            // Legado (JSON plano)
            embedding = JSON.parse(row.embedding);
          } else {
            const decrypted = securityService.decryptBuffer(Buffer.from(row.embedding, 'hex'));
            embedding = JSON.parse(decrypted.toString());
          }
        } catch (e) {
          console.error('Falha ao decifrar embedding:', e);
        }
        return {
          faceId: row.face_id,
          studentId: row.student_id,
          embedding: embedding,
          timestamp: new Date(row.timestamp),
        };
      });
    } catch (error) {
      console.error('Erro ao obter embeddings do aluno:', error);
      return [];
    }
  },

  /**
   * Obtém todos os embeddings do banco
   */
  async getFaceEmbeddings(this: any): Promise<any[]> {
    const query = `
      SELECT face_id, student_id, embedding, timestamp
      FROM face_embeddings
      ORDER BY timestamp DESC
    `;

    try {
      const rows = await this.db.all(query, []);

      return rows.map((row: any) => ({
        faceId: row.face_id,
        studentId: row.student_id,
        embedding: JSON.parse(row.embedding),
        timestamp: new Date(row.timestamp),
      }));
    } catch (error) {
      console.error('Erro ao obter embeddings:', error);
      return [];
    }
  },

  /**
   * Deleta um embedding
   */
  async deleteFaceEmbedding(this: any, faceId: string): Promise<void> {
    const query = `
      DELETE FROM face_embeddings
      WHERE face_id = ?
    `;

    try {
      await this.db.run(query, [faceId]);
      console.log(`Embedding deletado: ${faceId}`);
    } catch (error) {
      console.error('Erro ao deletar embedding:', error);
      throw error;
    }
  },

  /**
   * Deleta todos os embeddings de um aluno
   */
  async deleteStudentFaceEmbeddings(this: any, studentId: string): Promise<void> {
    const query = `
      DELETE FROM face_embeddings
      WHERE student_id = ?
    `;

    try {
      await this.db.run(query, [studentId]);
      console.log(`Embeddings deletados para aluno: ${studentId}`);
    } catch (error) {
      console.error('Erro ao deletar embeddings do aluno:', error);
      throw error;
    }
  },

  /**
   * Obtém estatísticas de embeddings
   */
  async getFaceEmbeddingsStats(this: any): Promise<any> {
    const query = `
      SELECT
        COUNT(*) as total_embeddings,
        COUNT(DISTINCT student_id) as total_students,
        MIN(timestamp) as oldest_embedding,
        MAX(timestamp) as newest_embedding
      FROM face_embeddings
    `;

    try {
      const row = await this.db.get(query, []);

      return {
        totalEmbeddings: row.total_embeddings || 0,
        totalStudents: row.total_students || 0,
        oldestEmbedding: row.oldest_embedding ? new Date(row.oldest_embedding) : null,
        newestEmbedding: row.newest_embedding ? new Date(row.newest_embedding) : null,
      };
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      return {
        totalEmbeddings: 0,
        totalStudents: 0,
        oldestEmbedding: null,
        newestEmbedding: null,
      };
    }
  },

  /**
   * Cria tabela de embeddings se não existir
   */
  async createFaceEmbeddingsTable(this: any): Promise<void> {
    const query = `
      CREATE TABLE IF NOT EXISTS face_embeddings (
        face_id TEXT PRIMARY KEY,
        student_id TEXT NOT NULL,
        embedding TEXT NOT NULL,
        timestamp DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students(student_id)
      )
    `;

    try {
      await this.db.run(query, []);
      console.log('Tabela face_embeddings criada/verificada');
    } catch (error) {
      console.error('Erro ao criar tabela:', error);
      throw error;
    }
  },
};

export default FaceEmbeddingMethods;

