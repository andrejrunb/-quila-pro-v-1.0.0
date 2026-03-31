import { EventEmitter } from 'events';
import { VideoCapture, VideoCaptureManager } from './VideoCapture';
import { FrameProcessor, FrameProcessorManager } from './FrameProcessor';
import { PresenceTracker } from './PresenceTracker';
import Database from '../database/Database';

/**
 * Interface para configuração de câmera
 */
export interface CameraConfig {
  cameraId: string;
  cameraUrl: string;
  location: string;
  type: 'corridor' | 'door' | 'entrance';
  classId?: string; // Para câmeras de porta de sala
  resolution?: { width: number; height: number };
  fps?: number;
}

/**
 * Pipeline de processamento que integra captura, processamento e rastreamento
 */
export class ProcessingPipeline extends EventEmitter {
  private db: Database;
  private captureManager: VideoCaptureManager;
  private processorManager: FrameProcessorManager;
  private presenceTracker: PresenceTracker;
  private isRunning: boolean = false;
  private cameras: Map<string, CameraConfig> = new Map();

  constructor(db: Database) {
    super();
    this.db = db;
    this.captureManager = new VideoCaptureManager();
    this.processorManager = new FrameProcessorManager();
    this.presenceTracker = new PresenceTracker(db);
    this.setupEventListeners();
  }

  /**
   * Configura listeners de eventos
   */
  private setupEventListeners(): void {
    // Eventos de captura
    this.captureManager.on('camera:frame', async (data) => {
      const processor = this.processorManager.getProcessor(data.cameraId);
      if (processor) {
        try {
          await processor.processFrame(data.data, data.timestamp);
        } catch (error) {
          console.error(`Erro ao processar frame de ${data.cameraId}:`, error);
        }
      }
    });

    // Eventos de detecção
    this.processorManager.on('processor:entry', async (data) => {
      this.emit('person:entry', data);
      await this.presenceTracker.recordEntry(data.studentId, data.classId, data.cameraId);
    });

    this.processorManager.on('processor:exit', async (data) => {
      this.emit('person:exit', data);
      await this.presenceTracker.recordExit(data.studentId, data.classId);
    });

    // Eventos de presença
    this.presenceTracker.on('entry', (data) => {
      this.emit('presence:entry', data);
    });

    this.presenceTracker.on('exit', (data) => {
      this.emit('presence:exit', data);
    });
  }

  /**
   * Adiciona uma câmera ao pipeline
   */
  addCamera(config: CameraConfig): void {
    if (this.cameras.has(config.cameraId)) {
      throw new Error(`Câmera ${config.cameraId} já existe`);
    }

    this.cameras.set(config.cameraId, config);

    // Criar captura de vídeo
    this.captureManager.addCamera(
      config.cameraId,
      config.cameraUrl,
      config.resolution
    );

    // Criar processador de frames
    this.processorManager.createProcessor(config.cameraId);

    console.log(`Câmera ${config.cameraId} adicionada ao pipeline`);
  }

  /**
   * Remove uma câmera do pipeline
   */
  removeCamera(cameraId: string): void {
    const camera = this.captureManager.getCamera(cameraId);
    if (camera) {
      camera.stopCapture();
      this.captureManager.removeCamera(cameraId);
      this.processorManager.removeProcessor(cameraId);
      this.cameras.delete(cameraId);
      console.log(`Câmera ${cameraId} removida do pipeline`);
    }
  }

  /**
   * Inicia o pipeline
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.warn('Pipeline já está rodando');
      return;
    }

    try {
      console.log('Iniciando pipeline de processamento...');
      this.isRunning = true;

      // Iniciar captura em todas as câmeras
      await this.captureManager.startAllCaptures();

      this.emit('started', {
        timestamp: new Date(),
        camerasCount: this.cameras.size,
      });

      console.log(`Pipeline iniciado com ${this.cameras.size} câmera(s)`);
    } catch (error) {
      this.isRunning = false;
      this.emit('error', {
        error: error instanceof Error ? error.message : 'Erro ao iniciar pipeline',
        timestamp: new Date(),
      });
      throw error;
    }
  }

  /**
   * Para o pipeline
   */
  stop(): void {
    if (!this.isRunning) {
      console.warn('Pipeline não está rodando');
      return;
    }

    console.log('Parando pipeline de processamento...');
    this.isRunning = false;

    // Parar captura em todas as câmeras
    this.captureManager.stopAllCaptures();

    // Limpar rastreador
    this.presenceTracker.clear();

    this.emit('stopped', {
      timestamp: new Date(),
    });

    console.log('Pipeline parado');
  }

  /**
   * Obtém status do pipeline
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      camerasCount: this.cameras.size,
      cameras: this.captureManager.getCamerasInfo(),
      activeStudents: this.presenceTracker.getActiveStudents(),
    };
  }

  /**
   * Registra entrada de aluno
   */
  async recordStudentEntry(studentId: string, classId: string, cameraId: string): Promise<void> {
    await this.presenceTracker.recordEntry(studentId, classId, cameraId);
  }

  /**
   * Registra saída de aluno
   */
  async recordStudentExit(studentId: string, classId: string): Promise<void> {
    await this.presenceTracker.recordExit(studentId, classId);
  }

  /**
   * Calcula presença de aluno
   */
  async calculateStudentPresence(studentId: string, classId: string, date: Date) {
    return await this.presenceTracker.calculatePresence(studentId, classId, date);
  }

  /**
   * Define horário de aula
   */
  setClassSchedule(classId: string, startTime: Date, endTime: Date): void {
    this.presenceTracker.setClassSchedule(classId, startTime, endTime);
  }

  /**
   * Obtém câmeras configuradas
   */
  getCameras(): CameraConfig[] {
    return Array.from(this.cameras.values());
  }

  /**
   * Obtém gerenciadores
   */
  getManagers() {
    return {
      capture: this.captureManager,
      processor: this.processorManager,
      presence: this.presenceTracker,
    };
  }
}

export default ProcessingPipeline;

