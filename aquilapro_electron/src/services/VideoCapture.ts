import { EventEmitter } from 'events';

/**
 * Classe para captura de vídeo de câmeras IP
 * Utiliza OpenCV para processamento de frames
 */
export class VideoCapture extends EventEmitter {
  private cameraUrl: string;
  private cameraId: string;
  private isCapturing: boolean = false;
  private frameRate: number = 30;
  private resolution: { width: number; height: number };

  constructor(cameraId: string, cameraUrl: string, resolution = { width: 1920, height: 1080 }) {
    super();
    this.cameraId = cameraId;
    this.cameraUrl = cameraUrl;
    this.resolution = resolution;
  }

  /**
   * Inicia a captura de vídeo
   */
  async startCapture(): Promise<void> {
    if (this.isCapturing) {
      console.warn(`Captura já está ativa para câmera ${this.cameraId}`);
      return;
    }

    try {
      this.isCapturing = true;
      console.log(`Iniciando captura da câmera ${this.cameraId} (${this.cameraUrl})`);

      // Simular captura de vídeo
      // Em produção, usar cv.VideoCapture(this.cameraUrl)
      await this.simulateVideoCapture();

      this.emit('started', {
        cameraId: this.cameraId,
        timestamp: new Date(),
      });
    } catch (error) {
      this.isCapturing = false;
      this.emit('error', {
        cameraId: this.cameraId,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        timestamp: new Date(),
      });
      throw error;
    }
  }

  /**
   * Para a captura de vídeo
   */
  stopCapture(): void {
    if (!this.isCapturing) {
      console.warn(`Captura não está ativa para câmera ${this.cameraId}`);
      return;
    }

    this.isCapturing = false;
    console.log(`Parando captura da câmera ${this.cameraId}`);

    this.emit('stopped', {
      cameraId: this.cameraId,
      timestamp: new Date(),
    });
  }

  /**
   * Simula captura de vídeo (para desenvolvimento)
   * Em produção, usar cv.VideoCapture real
   */
  private async simulateVideoCapture(): Promise<void> {
    const frameInterval = 1000 / this.frameRate;

    while (this.isCapturing) {
      try {
        // Simular captura de frame
        const frame = {
          cameraId: this.cameraId,
          timestamp: new Date(),
          width: this.resolution.width,
          height: this.resolution.height,
          data: Buffer.alloc(this.resolution.width * this.resolution.height * 3),
        };

        this.emit('frame', frame);

        // Aguardar próximo frame
        await new Promise(resolve => setTimeout(resolve, frameInterval));
      } catch (error) {
        this.emit('error', {
          cameraId: this.cameraId,
          error: error instanceof Error ? error.message : 'Erro ao capturar frame',
          timestamp: new Date(),
        });
      }
    }
  }

  /**
   * Obtém informações da câmera
   */
  getInfo() {
    return {
      cameraId: this.cameraId,
      cameraUrl: this.cameraUrl,
      isCapturing: this.isCapturing,
      frameRate: this.frameRate,
      resolution: this.resolution,
    };
  }

  /**
   * Define a taxa de frames
   */
  setFrameRate(fps: number): void {
    if (fps < 1 || fps > 60) {
      throw new Error('FPS deve estar entre 1 e 60');
    }
    this.frameRate = fps;
  }

  /**
   * Captura um único frame
   */
  async captureFrame(): Promise<Buffer> {
    if (!this.isCapturing) {
      throw new Error('Captura não está ativa');
    }

    // Simular captura de frame
    return Buffer.alloc(this.resolution.width * this.resolution.height * 3);
  }
}

/**
 * Gerenciador de múltiplas câmeras
 */
export class VideoCaptureManager {
  private cameras: Map<string, VideoCapture> = new Map();
  private eventEmitter = new EventEmitter();

  /**
   * Adiciona uma câmera ao gerenciador
   */
  addCamera(cameraId: string, cameraUrl: string, resolution?: { width: number; height: number }): VideoCapture {
    if (this.cameras.has(cameraId)) {
      throw new Error(`Câmera ${cameraId} já existe`);
    }

    const capture = new VideoCapture(cameraId, cameraUrl, resolution);

    // Propagar eventos
    capture.on('started', (data) => this.eventEmitter.emit('camera:started', data));
    capture.on('stopped', (data) => this.eventEmitter.emit('camera:stopped', data));
    capture.on('frame', (data) => this.eventEmitter.emit('camera:frame', data));
    capture.on('error', (data) => this.eventEmitter.emit('camera:error', data));

    this.cameras.set(cameraId, capture);
    return capture;
  }

  /**
   * Remove uma câmera do gerenciador
   */
  removeCamera(cameraId: string): void {
    const camera = this.cameras.get(cameraId);
    if (camera) {
      camera.stopCapture();
      this.cameras.delete(cameraId);
    }
  }

  /**
   * Obtém uma câmera
   */
  getCamera(cameraId: string): VideoCapture | undefined {
    return this.cameras.get(cameraId);
  }

  /**
   * Inicia captura em todas as câmeras
   */
  async startAllCaptures(): Promise<void> {
    const promises = Array.from(this.cameras.values()).map(camera =>
      camera.startCapture().catch(error => {
        console.error(`Erro ao iniciar câmera ${camera.getInfo().cameraId}:`, error);
      })
    );

    await Promise.all(promises);
  }

  /**
   * Para captura em todas as câmeras
   */
  stopAllCaptures(): void {
    this.cameras.forEach(camera => camera.stopCapture());
  }

  /**
   * Obtém lista de câmeras
   */
  getCameras(): VideoCapture[] {
    return Array.from(this.cameras.values());
  }

  /**
   * Obtém informações de todas as câmeras
   */
  getCamerasInfo() {
    return Array.from(this.cameras.values()).map(camera => camera.getInfo());
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

export default VideoCapture;
