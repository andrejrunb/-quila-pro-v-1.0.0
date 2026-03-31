/**
 * StreamWatchdog.ts — Item 65
 * Monitor de saúde para streams RTSP.
 * Verifica se os frames estão chegando no intervalo esperado.
 */

import { EventEmitter } from 'events';
import { RTSPStreamReader, CapturedFrame } from './RTSPStreamReader';

export interface StreamHealth {
  cameraId: string;
  status: 'online' | 'unstable' | 'offline';
  lastFrameTs: number;
  avgLatencyMs: number;
  retryCount: number;
  lastError?: string;
}

export class StreamWatchdog extends EventEmitter {
  private healthMap = new Map<string, StreamHealth>();
  private checkInterval: NodeJS.Timeout | null = null;
  private readonly TIMEOUT_MS = 5000;
  private readonly MAX_RETRIES = 10;
  private readonly BASE_RETRY_DELAY = 2000;

  constructor(private readonly reader: RTSPStreamReader) {
    super();
    this._setupListeners();
  }

  start(): void {
    if (this.checkInterval) return;
    this.checkInterval = setInterval(() => this._checkHealth(), 3000);
  }

  stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  getHealth(cameraId: string): StreamHealth | undefined {
    return this.healthMap.get(cameraId);
  }

  getAllHealth(): StreamHealth[] {
    return Array.from(this.healthMap.values());
  }

  private _setupListeners(): void {
    this.reader.on('frame', (frame: CapturedFrame) => {
      const now = Date.now();
      const prev = this.healthMap.get(frame.cameraId);
      
      this.healthMap.set(frame.cameraId, {
        cameraId: frame.cameraId,
        status: 'online',
        lastFrameTs: now,
        avgLatencyMs: prev ? (now - prev.lastFrameTs) : 0,
        retryCount: 0
      });
    });

    this.reader.on('stream-ended', (data) => {
      const health = this.healthMap.get(data.cameraId);
      if (health) {
        health.status = 'unstable';
        health.retryCount = (health.retryCount || 0) + 1;
        health.lastError = data.reason;
        this.emit('health-changed', health);
      }
      
      const retryDelay = Math.min(
        this.BASE_RETRY_DELAY * Math.pow(2, (health?.retryCount || 1) - 1),
        300_000 // Máximo 5 minutos
      );

      setTimeout(() => {
        if (health && health.retryCount <= this.MAX_RETRIES) {
          console.log(`[Watchdog 2.0] Reconnecting ${data.cameraId} (Attempt ${health.retryCount}). Delay: ${retryDelay}ms`);
          this.reader.reconnect(data.cameraId);
        } else if (health) {
          health.status = 'offline';
          this.emit('health-changed', health);
          console.error(`[Watchdog 2.0] Maximum retries reached for ${data.cameraId}.`);
        }
      }, retryDelay);
    });
  }

  private _checkHealth(): void {
    const now = Date.now();
    for (const [id, health] of this.healthMap.entries()) {
      if (health.status === 'online' && (now - health.lastFrameTs) > this.TIMEOUT_MS) {
        health.status = 'offline';
        this.emit('health-changed', health);
        console.warn(`[StreamWatchdog] Câmera ${id} parece estar offline.`);
      }
    }
  }
}
