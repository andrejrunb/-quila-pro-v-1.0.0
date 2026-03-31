/**
 * RTSPStreamReader.ts — Item 2: Captura de Frames de Câmeras IP (RTSP)
 * Usa ffmpeg (via fluent-ffmpeg ou spawn) para capturar frames periódicos.
 * Salva frames como arquivos temporários para o FaceWorkerBridge processar.
 * Respeita o limite de streams simultâneos do plano (LicenseManager).
 */

import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface CameraStream {
  cameraId: string;
  rtspUrl: string;
  zone: string;
  fps: number; // Frames por segundo a capturar (1 = 1fps, suficiente para reconhecimento)
}

export interface CapturedFrame {
  cameraId: string;
  zone: string;
  framePath: string;
  timestamp: string;
}

export class RTSPStreamReader extends EventEmitter {
  private streams = new Map<string, { process: ChildProcess; config: CameraStream }>();
  private readonly tempDir: string;
  private readonly maxStreams: number;

  constructor(maxStreams = 4) {
    super();
    this.maxStreams = maxStreams;
    this.tempDir = path.join(os.tmpdir(), 'aquila_frames');
    if (!fs.existsSync(this.tempDir)) fs.mkdirSync(this.tempDir, { recursive: true });
  }

  // ─────────────────────────────────────────────
  // CONTROLE DE STREAMS
  // ─────────────────────────────────────────────

  startStream(camera: CameraStream): boolean {
    if (this.streams.size >= this.maxStreams) {
      console.warn(`[RTSPStreamReader] Limite de ${this.maxStreams} streams atingido.`);
      return false;
    }
    if (this.streams.has(camera.cameraId)) {
      console.warn(`[RTSPStreamReader] Stream ${camera.cameraId} já está ativo.`);
      return true;
    }

    if (camera.rtspUrl.startsWith('simulate://')) {
      console.log(`[RTSPStreamReader] Ativando modo simulação para ${camera.cameraId}`);
      return this._startSimulatedStream(camera);
    }

    const frameDir = path.join(this.tempDir, camera.cameraId);
    if (!fs.existsSync(frameDir)) fs.mkdirSync(frameDir, { recursive: true });
    
    // Usar ffmpeg para extrair frames a N fps
    const args = [
      '-rtsp_transport', 'tcp',
      '-i', camera.rtspUrl,
      '-vf', `fps=${camera.fps || 1}`,
      '-q:v', '3',
      '-update', '1',
      path.join(frameDir, 'latest.jpg'),
    ];

    let proc: ChildProcess;
    try {
      proc = spawn('ffmpeg', args, { stdio: ['ignore', 'pipe', 'pipe'] });
    } catch {
      return this._startSimulatedStream(camera);
    }

    proc.stderr?.on('data', (data: Buffer) => {
      const msg = data.toString();
      if (msg.includes('Error') || msg.includes('error')) {
        console.error(`[RTSPStreamReader][${camera.cameraId}] ${msg.trim()}`);
      }
    });

    proc.on('exit', (code) => {
      console.log(`[RTSPStreamReader] Stream ${camera.cameraId} encerrado (code ${code}). Mantendo config para reconexão.`);
      const current = this.streams.get(camera.cameraId);
      if (current) {
        // Marcamos como inativo mas mantemos a config
        (current as any).active = false;
      }
      this.emit('stream-ended', { cameraId: camera.cameraId, code });
    });

    this.streams.set(camera.cameraId, { process: proc, config: camera });

    // Monitorar novo frame e emitir evento
    this._watchFrames(camera, path.join(frameDir, 'latest.jpg'));

    console.log(`[RTSPStreamReader] Stream iniciado: ${camera.cameraId} | ${camera.rtspUrl}`);
    return true;
  }

  stopStream(cameraId: string): void {
    const stream = this.streams.get(cameraId);
    if (stream) {
      stream.process.kill('SIGTERM');
      this.streams.delete(cameraId);
      this._cleanFrameDir(cameraId);
    }
  }

  stopAll(): void {
    for (const id of this.streams.keys()) {
      this.stopStream(id);
    }
  }

  getActiveStreams(): string[] {
    return Array.from(this.streams.entries())
      .filter(([_, s]) => (s as any).active !== false)
      .map(([id]) => id);
  }

  reconnect(cameraId: string): void {
    const stream = this.streams.get(cameraId);
    if (!stream) return;
    
    console.log(`[RTSPStreamReader] Tentando reconectar câmera ${cameraId}...`);
    this.streams.delete(cameraId); // Limpa o estado inativo antes de reiniciar
    this.startStream(stream.config);
  }

  getStreamCount(): number {
    return this.streams.size;
  }

  // ─────────────────────────────────────────────
  // MONITORAMENTO DE FRAMES
  // ─────────────────────────────────────────────

  private _watchFrames(camera: CameraStream, framePath: string): void {
    let lastMtime = 0;
    const interval = setInterval(() => {
      if (!this.streams.has(camera.cameraId)) {
        clearInterval(interval);
        return;
      }
      try {
        if (!fs.existsSync(framePath)) return;
        const { mtimeMs } = fs.statSync(framePath);
        if (mtimeMs > lastMtime) {
          lastMtime = mtimeMs;
          const frame: CapturedFrame = {
            cameraId: camera.cameraId,
            zone: camera.zone,
            framePath,
            timestamp: new Date().toISOString(),
          };
          this.emit('frame', frame);
        }
      } catch { /* Arquivo temporariamente inacessível */ }
    }, 1000 / (camera.fps || 1));
  }

  // ─────────────────────────────────────────────
  // SIMULAÇÃO (quando ffmpeg não está disponível)
  // ─────────────────────────────────────────────

  private _startSimulatedStream(camera: CameraStream): boolean {
    const fakeProcess = { kill: () => {} } as any;
    this.streams.set(camera.cameraId, { process: fakeProcess, config: camera });

    // Emite evento de frame simulado a cada segundo
    const interval = setInterval(() => {
      if (!this.streams.has(camera.cameraId)) {
        clearInterval(interval);
        return;
      }
      this.emit('frame', {
        cameraId: camera.cameraId,
        zone: camera.zone,
        framePath: '',  // Sem arquivo real — FaceWorkerBridge lida com framePathvazio
        timestamp: new Date().toISOString(),
        simulated: true,
      } as CapturedFrame & { simulated: boolean });
    }, 1000 / (camera.fps || 1));

    return true;
  }

  private _cleanFrameDir(cameraId: string): void {
    const frameDir = path.join(this.tempDir, cameraId);
    try {
      if (fs.existsSync(frameDir)) fs.rmSync(frameDir, { recursive: true });
    } catch { /* Ignorar erros de limpeza */ }
  }
}
