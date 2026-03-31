import { EventEmitter } from 'events';

export interface SystemMetrics {
  detectionsTotal: number;
  notificationsSent: number;
  notificationsFailed: number;
  avgFps: number;
  lastLatencyMs: number;
  lastUpdate: Date;
}

/**
 * MetricsService — Real-time observability for Áquila Pro.
 * Tracks performance and success rates of critical operations.
 */
export class MetricsService extends EventEmitter {
  private static instance: MetricsService;
  private metrics: SystemMetrics = {
    detectionsTotal: 0,
    notificationsSent: 0,
    notificationsFailed: 0,
    avgFps: 0,
    lastLatencyMs: 0,
    lastUpdate: new Date()
  };

  private constructor() {
    super();
  }

  public static getInstance(): MetricsService {
    if (!MetricsService.instance) {
      MetricsService.instance = new MetricsService();
    }
    return MetricsService.instance;
  }

  public recordDetection(): void {
    this.metrics.detectionsTotal++;
    this._emit();
  }

  public recordNotification(success: boolean, latencyMs?: number): void {
    if (success) {
      this.metrics.notificationsSent++;
    } else {
      this.metrics.notificationsFailed++;
    }
    
    if (latencyMs !== undefined) {
      this.metrics.lastLatencyMs = latencyMs;
    }
    this._emit();
  }

  public updateFps(fps: number): void {
    // Smoothed FPS average (Alpha = 0.8)
    this.metrics.avgFps = (this.metrics.avgFps * 0.8) + (fps * 0.2);
    this._emit();
  }

  public getMetrics(): SystemMetrics {
    return { ...this.metrics };
  }

  private _emit(): void {
    this.metrics.lastUpdate = new Date();
    this.emit('metrics-updated', this.metrics);
  }
}

export const metricsService = MetricsService.getInstance();
