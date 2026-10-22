import { EventEmitter } from 'events';

/**
 * Interface para detecção de pessoas
 */
export interface PersonDetection {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
  timestamp: Date;
}

/**
 * Interface para evento de entrada/saída
 */
export interface EntryExitEvent {
  cameraId: string;
  personId: string;
  type: 'entry' | 'exit';
  timestamp: Date;
  location: string;
}

/**
 * Classe para processar frames e detectar pessoas
 */
export class FrameProcessor extends EventEmitter {
  private cameraId: string;
  private isProcessing: boolean = false;
  private lastDetections: Map<string, PersonDetection> = new Map();
  private entryExitThreshold: number = 0.7; // Confiança mínima para registrar entrada/saída

  constructor(cameraId: string) {
    super();
    this.cameraId = cameraId;
  }

  /**
   * Processa um frame e detecta pessoas
   */
  async processFrame(frameData: Buffer, timestamp: Date): Promise<PersonDetection[]> {
    try {
      this.isProcessing = true;

      // Simular detecção de pessoas usando YOLO/OpenCV
      // Em produção, usar modelo YOLO real
      const detections = await this.detectPersons(frameData);

      // Registrar entradas e saídas
      await this.trackEntryExit(detections, timestamp);

      // Emitir evento de detecção
      this.emit('detections', {
        cameraId: this.cameraId,
        detections,
        timestamp,
      });

      this.isProcessing = false;
      return detections;
    } catch (error) {
      this.isProcessing = false;
      this.emit('error', {
        cameraId: this.cameraId,
        error: error instanceof Error ? error.message : 'Erro ao processar frame',
        timestamp,
      });
      throw error;
    }
  }

  /**
   * Simula detecção de pessoas
   * Em produção, usar YOLO ou outro modelo de detecção
   */
  private async detectPersons(frameData: Buffer): Promise<PersonDetection[]> {
    // Simular detecção aleatória
    const detections: PersonDetection[] = [];

    // Gerar 0-3 detecções aleatórias
    const count = Math.floor(Math.random() * 4);

    for (let i = 0; i < count; i++) {
      detections.push({
        id: `person-${Date.now()}-${i}`,
        x: Math.random() * 1920,
        y: Math.random() * 1080,
        width: 50 + Math.random() * 150,
        height: 100 + Math.random() * 300,
        confidence: 0.7 + Math.random() * 0.3,
        timestamp: new Date(),
      });
    }

    return detections;
  }

  /**
   * Rastreia entradas e saídas de pessoas
   */
  private async trackEntryExit(detections: PersonDetection[], timestamp: Date): Promise<void> {
    const currentIds = new Set(detections.map(d => d.id));
    const previousIds = new Set(this.lastDetections.keys());

    // Detectar novas entradas
    for (const detection of detections) {
      if (!previousIds.has(detection.id) && detection.confidence >= this.entryExitThreshold) {
        this.emit('entry', {
          cameraId: this.cameraId,
          personId: detection.id,
          type: 'entry',
          timestamp,
          location: `${Math.round(detection.x)},${Math.round(detection.y)}`,
        } as EntryExitEvent);
      }
    }

    // Detectar saídas
    for (const [previousId] of this.lastDetections) {
      if (!currentIds.has(previousId)) {
        this.emit('exit', {
          cameraId: this.cameraId,
          personId: previousId,
          type: 'exit',
          timestamp,
          location: 'Fora do quadro',
        } as EntryExitEvent);
      }
    }

    // Atualizar detecções anteriores
    this.lastDetections.clear();
    for (const detection of detections) {
      this.lastDetections.set(detection.id, detection);
    }
  }

  /**
   * Obtém detecções atuais
   */
  getCurrentDetections(): PersonDetection[] {
    return Array.from(this.lastDetections.values());
  }

  /**
   * Define limiar de confiança para entrada/saída
   */
  setEntryExitThreshold(threshold: number): void {
    if (threshold < 0 || threshold > 1) {
      throw new Error('Limiar deve estar entre 0 e 1');
    }
    this.entryExitThreshold = threshold;
  }

  /**
   * Limpa detecções anteriores
   */
  clearDetections(): void {
    this.lastDetections.clear();
  }
}

/**
 * Gerenciador de processamento de frames
 */
export class FrameProcessorManager {
  private processors: Map<string, FrameProcessor> = new Map();
  private eventEmitter = new EventEmitter();

  /**
   * Cria um processador para uma câmera
   */
  createProcessor(cameraId: string): FrameProcessor {
    if (this.processors.has(cameraId)) {
      throw new Error(`Processador para câmera ${cameraId} já existe`);
    }

    const processor = new FrameProcessor(cameraId);

    // Propagar eventos
    processor.on('detections', (data) => this.eventEmitter.emit('processor:detections', data));
    processor.on('entry', (data) => this.eventEmitter.emit('processor:entry', data));
    processor.on('exit', (data) => this.eventEmitter.emit('processor:exit', data));
    processor.on('error', (data) => this.eventEmitter.emit('processor:error', data));

    this.processors.set(cameraId, processor);
    return processor;
  }

  /**
   * Obtém um processador
   */
  getProcessor(cameraId: string): FrameProcessor | undefined {
    return this.processors.get(cameraId);
  }

  /**
   * Remove um processador
   */
  removeProcessor(cameraId: string): void {
    const processor = this.processors.get(cameraId);
    if (processor) {
      processor.clearDetections();
      this.processors.delete(cameraId);
    }
  }

  /**
   * Obtém lista de processadores
   */
  getProcessors(): FrameProcessor[] {
    return Array.from(this.processors.values());
  }

  /**
   * Registra listener para eventos
   */
  on(event: string, listener: (...args: any[]) => void): void {
    this.eventEmitter.on(event, listener);
  }

  /**
   * Remove listener
   */
  off(event: string, listener: (...args: any[]) => void): void {
    this.eventEmitter.off(event, listener);
  }
}

export default FrameProcessor;

