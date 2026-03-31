import { EventEmitter } from 'events';
import { CameraWorkerHost, CameraConfig } from './CameraWorkerHost';
import { CameraStream } from './RTSPStreamReader';
import { resourceMonitor } from './ResourceMonitorService';

export { CameraStream };

/**
 * RecognitionLoop.ts — Versão 2.0 (Arquitetura Isolada)
 * Em vez de um pool global, gerencia workers dedicados por câmera.
 * Implementa Item 1 (Process-per-Camera) das sugestões comerciais.
 */
export class RecognitionLoop extends EventEmitter {
  private isRunning: boolean = false;
  private hosts = new Map<string, CameraWorkerHost>();
  private readonly pythonBin: string;
  private readonly workerScript: string;
  private readonly isPackaged: boolean;
  private currentEmbeddings: any[] = [];
  private performanceProfile: string = 'BALANCED';
  private lastDetectionTs: number = Date.now();
  private idleCheckInterval: NodeJS.Timeout | null = null;

  constructor(isDev: boolean, resourcesPath: string) {
    super();
    this.isPackaged = !isDev;
    
    if (this.isPackaged) {
      // Em produção, usamos o binário congelado (PyInstaller)
      const path = require('path');
      this.pythonBin = path.join(resourcesPath, 'python_workers', 'aquila_camera_worker', 'aquila_camera_worker.exe');
      this.workerScript = ''; // O binário já contém o script
    } else {
      // Em desenvolvimento, usamos o interpretador local
      this.pythonBin = 'python';
      this.workerScript = require('path').join(__dirname, '../../python/camera_worker.py');
    }
  }

  /**
   * Define os embeddings que serão passados para novos workers
   */
  public setEmbeddings(embeddings: any[]): void {
    this.currentEmbeddings = embeddings;
    // Se já estiver rodando, atualizar workers ativos
    for (const host of this.hosts.values()) {
        host.loadEmbeddingsBulk(embeddings);
    }
  }

  public async start(cameras: CameraStream[], performanceProfile: string = 'BALANCED'): Promise<void> {
    this.isRunning = true;
    this.performanceProfile = performanceProfile;
    console.log(`[RecognitionLoop 2.0] Iniciando ${cameras.length} processos isolados em perfil ${performanceProfile}.`);

    // Monitorar recursos (Item 67: Hardware Optimization)
    resourceMonitor.on('throttle', (enabled: boolean) => {
        console.log(`[RecognitionLoop] Propagando throttle=${enabled} para ${this.hosts.size} workers.`);
        for (const host of this.hosts.values()) {
            host.sendCommand({ action: 'set_throttle', enabled });
        }
    });

    for (const config of cameras) {
      if (this.hosts.has(config.cameraId)) continue;

      const host = new CameraWorkerHost(
        { 
          id: config.cameraId, 
          rtspUrl: config.rtspUrl, 
          zone: config.zone,
          performanceProfile: this.performanceProfile 
        },
        this.pythonBin,
        this.workerScript
      );

      host.on('face-detected', (data) => {
        this.lastDetectionTs = Date.now();
        this.emit('face-recognized', data); // Para o AlertEngine
        this.emit('recognition', { ...data, processedAt: new Date().toISOString() }); // Para o Main/UI
      });

      host.on('message', (msg) => {
        if (msg.type === 'crowd_detected') {
            this.emit('crowd-recognized', msg);
        }
        if (msg.type === 'error') {
          console.error(`[RecognitionLoop][${config.cameraId}] Erro:`, msg.message);
        }
      });

      await host.start(this.currentEmbeddings);
      this.hosts.set(config.cameraId, host);
    }

    // Loop de limpeza de memória (Item 67)
    if (!this.idleCheckInterval) {
        this.idleCheckInterval = setInterval(() => {
            const idleTime = Date.now() - this.lastDetectionTs;
            if (idleTime > 5 * 60 * 1000) { // 5 minutos sem faces
                console.log('[RecognitionLoop] Sistema ocioso por 5min. Limpando memória dos workers.');
                for (const host of this.hosts.values()) {
                    host.sendCommand({ action: 'clear_memory' });
                }
            }
        }, 60 * 1000); // Checa a cada minuto
    }

    this.emit('started');
  }

  public stop(): void {
    this.isRunning = false;
    for (const host of this.hosts.values()) {
      host.stop();
    }
    if (this.idleCheckInterval) {
        clearInterval(this.idleCheckInterval);
        this.idleCheckInterval = null;
    }
    this.hosts.clear();
    this.emit('stopped');
  }

  public getStats() {
    return {
      activeStreams: this.hosts.size,
      isRunning: this.isRunning
    };
  }

  public async reloadCamera(cameraId: string, config: CameraStream): Promise<void> {
      const oldHost = this.hosts.get(cameraId);
      if (oldHost) {
          oldHost.stop();
          this.hosts.delete(cameraId);
      }
      await this.start([config]);
  }
}
