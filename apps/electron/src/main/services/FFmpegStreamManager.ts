import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';
import { logger } from '../logger';

export interface StreamConfig {
  cameraId: string;
  rtspUrl: string;
  fps?: number; // default 5 for analysis
}

/**
 * FFmpegStreamManager - Native FFmpeg RTSP Decoding (Passo 155)
 * Extracts real-time JPEG frames from multiple RTSP streams without locking the main thread.
 */
export class FFmpegStreamManager extends EventEmitter {
  private static instance: FFmpegStreamManager;
  private processes: Map<string, ChildProcess> = new Map();
  
  private constructor() {
    super();
  }

  public static getInstance(): FFmpegStreamManager {
    if (!FFmpegStreamManager.instance) {
      FFmpegStreamManager.instance = new FFmpegStreamManager();
    }
    return FFmpegStreamManager.instance;
  }

  /**
   * Inicia o feed RTSP decodificando para MJPEG via stdout.
   */
  public startStream(config: StreamConfig): boolean {
    if (this.processes.has(config.cameraId)) {
      logger.warn(`[FFmpegStreamManager] Stream ${config.cameraId} já está rodando.`);
      return false;
    }

    const fps = config.fps || 5;
    
    // Comando FFmpeg: pega RTSP, converte para MJPEG, envia no stdout a x FPS
    const args = [
      '-rtsp_transport', 'tcp',
      '-i', config.rtspUrl,
      '-f', 'image2pipe',
      '-vcodec', 'mjpeg',
      '-r', fps.toString(),
      '-q:v', '3', // qualidade aceitável
      '-an', // sem áudio
      '-'
    ];

    logger.info(`[FFmpegStreamManager] Iniciando FFmpeg nativo para câmera ${config.cameraId}: ffmpeg ${args.join(' ')}`);
    
    const ffmpegProcess = spawn('ffmpeg', args);
    this.processes.set(config.cameraId, ffmpegProcess);

    let frameBuffer = Buffer.alloc(0);

    ffmpegProcess.stdout.on('data', (data: Buffer) => {
      frameBuffer = Buffer.concat([frameBuffer, data]);
      
      // Procura marcações JPEG SOI (FF D8) e EOI (FF D9)
      let startOffset = frameBuffer.indexOf(Buffer.from([0xff, 0xd8]));
      let endOffset = frameBuffer.indexOf(Buffer.from([0xff, 0xd9]));

      while (startOffset !== -1 && endOffset !== -1 && endOffset > startOffset) {
        // Encontrou um frame completo
        const frame = frameBuffer.subarray(startOffset, endOffset + 2);
        
        // Emite o evento com o buffer da imagem
        this.emit('frame', config.cameraId, frame);
        
        // Limpa o buffer até o EOI
        frameBuffer = frameBuffer.subarray(endOffset + 2);
        
        // Procura próximo
        startOffset = frameBuffer.indexOf(Buffer.from([0xff, 0xd8]));
        endOffset = frameBuffer.indexOf(Buffer.from([0xff, 0xd9]));
      }
    });

    ffmpegProcess.stderr.on('data', (data: Buffer) => {
      // ffmpeg loga no stderr. Vamos ignorar a não ser que dê erro, mas se quisermos debug:
      // const msg = data.toString();
      // se msg contiver 'error' logar.
    });

    ffmpegProcess.on('close', (code) => {
      logger.info(`[FFmpegStreamManager] FFmpeg finalizado para ${config.cameraId} com código ${code}`);
      this.processes.delete(config.cameraId);
      this.emit('closed', config.cameraId);
    });

    return true;
  }

  /**
   * Para o feed de vídeo.
   */
  public stopStream(cameraId: string) {
    const process = this.processes.get(cameraId);
    if (process) {
      process.kill('SIGTERM');
      this.processes.delete(cameraId);
      logger.info(`[FFmpegStreamManager] Stream FFmpeg parado para ${cameraId}`);
    }
  }

  public stopAll() {
    for (const [id, process] of this.processes.entries()) {
      process.kill('SIGTERM');
    }
    this.processes.clear();
  }
}

export const ffmpegStreamManager = FFmpegStreamManager.getInstance();
