import { EventEmitter } from 'events';
import Database from '../../database/Database';
import { sovereignRegistry } from '../registry';
import { ProcessingPipeline } from './ProcessingPipeline';
import { FaceRecognition, FaceMatch } from './FaceRecognition';

/**
 * Extensão do ProcessingPipeline com reconhecimento facial
 */
export class ProcessingPipelineWithFace extends ProcessingPipeline {
  private _faceRecognition?: FaceRecognition;
  private recognitionEnabled: boolean = true;

  constructor(db: Database) {
    super(db);
    this.setupFaceRecognitionListeners();
  }

  private get faceRecognition(): FaceRecognition {
    if (!this._faceRecognition) {
      const service = sovereignRegistry.getContext().faceRecognition as FaceRecognition;
      if (!service) {
        throw new Error('FaceRecognition service not initialized in registry');
      }
      this._faceRecognition = service;
    }
    return this._faceRecognition;
  }


  /**
   * Configura listeners para reconhecimento facial
   */
  private setupFaceRecognitionListeners(): void {
    // Quando uma pessoa é detectada, tentar reconhecer
    const managers = this.getManagers();
    if (managers && managers.processor) {
      managers.processor.on('processor:detections', async (data: any) => {
        if (!this.recognitionEnabled) return;

        try {
          // Para cada detecção, tentar reconhecer
          // Em produção, extrair face do frame e passar para FaceRecognition
          console.log(`Processando ${data.detections.length} detecções para reconhecimento`);
        } catch (error) {
          console.error('Erro ao processar detecções:', error);
        }
      });
    }

    // Eventos de reconhecimento facial
    this.faceRecognition.on('recognition:success', (data: any) => {
      this.emit('face:recognized', {
        studentId: data.studentId,
        confidence: data.confidence,
        timestamp: data.timestamp,
      });
    });

    this.faceRecognition.on('recognition:failed', (data: any) => {
      this.emit('face:unknown', {
        confidence: data.confidence,
        timestamp: data.timestamp,
      });
    });

    this.faceRecognition.on('face:added', (data: any) => {
      this.emit('face:added', data);
    });

    this.faceRecognition.on('face:removed', (data: any) => {
      this.emit('face:removed', data);
    });
  }

  /**
   * Inicializa o pipeline com reconhecimento facial
   */
  async start(): Promise<void> {
    try {
      // Iniciar pipeline normal
      await super.start();

      this.emit('started', {
        timestamp: new Date(),
        camerasCount: this.getCameras().length,
        faceRecognitionEnabled: this.recognitionEnabled,
      });
    } catch (error) {
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
    super.stop();
    this.faceRecognition.clearCache();
  }

  /**
   * Reconhece um rosto
   */
  async recognizeFace(faceData: Buffer): Promise<FaceMatch | null> {
    return await this.faceRecognition.recognize(faceData);
  }

  /**
   * Adiciona novo rosto para aluno (Single Angle)
   */
  async addStudentFace(studentId: string, faceData: Buffer): Promise<string> {
    return await this.faceRecognition.addFace(studentId, faceData);
  }

  /**
   * Adiciona biometria multi-ângulo (Frontal, Lateral Esquerda, Lateral Direita)
   */
  async addStudentFaceMultiAngle(studentId: string, images: { front: string; left: string; right: string }): Promise<void> {
    return await this.faceRecognition.addMultiAngleFace(studentId, images);
  }

  /**
   * Remove rosto
   */
  async removeFace(faceId: string): Promise<void> {
    await this.faceRecognition.removeFace(faceId);
  }

  /**
   * Habilita/desabilita reconhecimento facial
   */
  setFaceRecognitionEnabled(enabled: boolean): void {
    this.recognitionEnabled = enabled;
    console.log(`Reconhecimento facial ${enabled ? 'habilitado' : 'desabilitado'}`);
  }

  /**
   * Define limiar de confiança para reconhecimento
   */
  setFaceConfidenceThreshold(threshold: number): void {
    this.faceRecognition.setConfidenceThreshold(threshold);
  }

  /**
   * Obtém status do reconhecimento facial
   */
  getFaceRecognitionStatus() {
    return {
      enabled: this.recognitionEnabled,
      ...this.faceRecognition.getStats(),
    };
  }

  /**
   * Obtém status completo do pipeline
   */
  getStatus() {
    return {
      ...super.getStatus(),
      faceRecognition: this.getFaceRecognitionStatus(),
    };
  }
}

export default ProcessingPipelineWithFace;



