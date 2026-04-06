import { ProcessingPipeline } from '../ProcessingPipeline';
import Database from '../../database/Database';
import { VideoCaptureManager } from '../VideoCapture';
import { FrameProcessorManager } from '../FrameProcessor';
import { PresenceTracker } from '../PresenceTracker';
import { jest } from '@jest/globals';

// Mocks
jest.mock('../../database/Database');
jest.mock('../VideoCapture');
jest.mock('../FrameProcessor', () => {
  const { EventEmitter } = require('events');
  class MockManager extends EventEmitter {
    getProcessor = jest.fn();
    createProcessor = jest.fn();
    removeProcessor = jest.fn();
  }
  return { FrameProcessorManager: MockManager };
});

describe('Integration: Attendance Flow', () => {
  let pipeline: ProcessingPipeline;
  let mockDb: jest.Mocked<Database>;
  let mockCapture: jest.Mocked<VideoCaptureManager>;
  let mockProcessor: jest.Mocked<FrameProcessorManager>;

  beforeEach(() => {
    mockDb = new Database() as jest.Mocked<Database>;
    pipeline = new ProcessingPipeline(mockDb);
    
    // Pegando as instâncias criadas dentro do constructor via getter se existir, 
    // ou acessando privadamente para o teste.
    mockCapture = (pipeline as any).captureManager;
    mockProcessor = (pipeline as any).processorManager;

    jest.clearAllMocks();
  });

  it('deve registrar presença no banco quando um aluno é detectado', async () => {
    const studentId = 'aluno-123';
    const classId = 'turma-A';
    const cameraId = 'cam-01';

    // 1. Simular evento de entrada vindo do processador de frames
    // O ProcessingPipeline ouve o evento 'processor:entry' do processorManager
    (mockProcessor as any).emit('processor:entry', {
      studentId,
      classId,
      cameraId,
      timestamp: new Date()
    });

    // 2. O pipeline deve chamar o presenceTracker
    // Como PresenceTracker não é mockado, ele deve chamar o db.run para inserir no banco
    
    // Verificamos se houve uma chamada de inserção no banco de dados
    expect(mockDb.recordPresenceEntry).toHaveBeenCalledWith(expect.objectContaining({
      studentId,
      classId,
      cameraId
    }));
  });

  it('deve registrar saída e calcular duração corretamente', async () => {
    const studentId = 'aluno-1';
    const classId = 'turma-A';
    const key = `${studentId}-${classId}`;

    // Simular entrada prévia
    const entryTime = new Date(Date.now() - 30 * 60 * 1000); // 30 min atrás
    const tracker = (pipeline as any).presenceTracker;
    (tracker as any).activeStudents.set(key, {
      entryTime: entryTime,
      cameraId: 'cam-01'
    });

    // Simular saída
    await pipeline.recordStudentExit(studentId, classId);

    // Deve salvar evento de saída no banco
    expect(mockDb.recordPresenceExit).toHaveBeenCalledWith(expect.objectContaining({
      studentId,
      classId,
      duration: expect.any(Number)
    }));
  });
});
