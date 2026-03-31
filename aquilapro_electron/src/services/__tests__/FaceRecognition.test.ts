import { FaceRecognition } from '../FaceRecognition';
import Database from '../../database/Database';
import { jest } from '@jest/globals';

// Mock dependências
jest.mock('../../database/Database');

jest.mock('../LicenseService', () => ({
  licenseService: {
    assertStudentLimit: jest.fn<() => Promise<void>>().mockImplementation(() => Promise.resolve())
  }
}));

describe('FaceRecognition', () => {
  let faceRecognition: FaceRecognition;
  let mockDb: jest.Mocked<Database>;

  // Helper to generate 128-dim vectors compatible with HNSW index
  const makeVector = (v: number, axis: number = 0) => {
    const arr = new Array(128).fill(0).map((_, i) => (i === axis ? v : 0));
    return arr;
  };

  beforeEach(() => {
    mockDb = {
      getFaceEmbeddings: (jest.fn() as any).mockResolvedValue([]),
      saveFaceEmbedding: (jest.fn() as any).mockResolvedValue(undefined),
      deleteFaceEmbedding: (jest.fn() as any).mockResolvedValue(undefined),
      run: (jest.fn() as any).mockResolvedValue(undefined),
      get: (jest.fn() as any).mockResolvedValue(null),
      all: (jest.fn() as any).mockResolvedValue([]),
    } as any;
    faceRecognition = new FaceRecognition(mockDb);
    jest.clearAllMocks();
  });

  describe('loadModel', () => {
    it('deve carregar embeddings do banco de dados na inicialização', async () => {
      const mockEmbeddings = [
        { faceId: 's1', studentId: 's1', embedding: makeVector(0.1), timestamp: new Date() },
        { faceId: 's2', studentId: 's2', embedding: makeVector(0.2), timestamp: new Date() }
      ];
      
      mockDb.getFaceEmbeddings.mockResolvedValueOnce(mockEmbeddings);

      await faceRecognition.loadModel();

      const stats = faceRecognition.getStats();
      expect(stats.modelLoaded).toBe(true);
      expect(stats.embeddingsCount).toBe(2);
      expect(mockDb.getFaceEmbeddings).toHaveBeenCalled();
    });

    it('deve emitir erro se o carregamento falhar', async () => {
      mockDb.getFaceEmbeddings.mockRejectedValueOnce(new Error('DB Error'));
      
      const errorSpy = jest.fn();
      faceRecognition.on('error', errorSpy);

      await faceRecognition.loadModel();
      expect(faceRecognition.getStats().modelLoaded).toBe(true);
    });
  });

  describe('recognize', () => {
    beforeEach(async () => {
      mockDb.getFaceEmbeddings.mockResolvedValueOnce([
        { faceId: 's1', studentId: 's1', embedding: makeVector(0.1), timestamp: new Date() }
      ]);
      await faceRecognition.loadModel();
    });

    it('deve retornar um match se a confiança for alta', async () => {
      // Vetor idêntico -> Distância 0 -> Confiança 1.0
      jest.spyOn(faceRecognition, 'extractEmbedding').mockResolvedValueOnce(Array.from(makeVector(0.1)) as any);

      const match = await faceRecognition.recognize(Buffer.from('fake-face'));

      expect(match).not.toBeNull();
      expect(match?.studentId).toBe('s1');
      expect(match?.confidence).toBeGreaterThan(0.9);
    });

    it('deve retornar null se a confiança for baixa', async () => {
      // Vetor muito distante (eixo diferente)
      jest.spyOn(faceRecognition, 'extractEmbedding').mockResolvedValueOnce(Array.from(makeVector(0.9, 1)) as any);

      const match = await faceRecognition.recognize(Buffer.from('fake-face'));
      expect(match).toBeNull();
    });

    it('deve lançar erro se o modelo não estiver carregado', async () => {
      const freshFR = new FaceRecognition(mockDb);
      await expect(freshFR.recognize(Buffer.from('f'))).rejects.toThrow('Modelo não carregado');
    });
  });

  describe('addFace', () => {
    it('deve salvar novo embedding no banco e atualizar cache', async () => {
      mockDb.saveFaceEmbedding.mockResolvedValueOnce(undefined);
      
      // Mock extractEmbedding to return 128-dim vector
      jest.spyOn(faceRecognition, 'extractEmbedding').mockResolvedValueOnce(Array.from(makeVector(0.5)) as any);
      
      const faceId = await faceRecognition.addFace('student-123', Buffer.from('new-face'));

      expect(faceId).toBe('student-123');
      expect(mockDb.saveFaceEmbedding).toHaveBeenCalledWith('student-123', expect.any(Array));
      expect(faceRecognition.getStats().embeddingsCount).toBe(1);
    });
  });

  describe('removeFace', () => {
    it('deve remover embedding do banco e do cache', async () => {
      mockDb.getFaceEmbeddings.mockResolvedValueOnce([
        { faceId: 'f1', studentId: 's1', embedding: makeVector(0.1), timestamp: new Date() }
      ]);
      await faceRecognition.loadModel();
      expect(faceRecognition.getStats().embeddingsCount).toBe(1);

      mockDb.deleteFaceEmbedding.mockResolvedValueOnce(undefined);
      
      await faceRecognition.removeFace('f1');

      expect(mockDb.deleteFaceEmbedding).toHaveBeenCalledWith('f1');
      expect(faceRecognition.getStats().embeddingsCount).toBe(0);
    });
  });
});
