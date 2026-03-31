/**
 * WhatsAppQueue.ts — Fila de Mensagens WhatsApp com Rate Limiting por Plano
 */
import { LicenseManager } from './LicenseManager';
import Database from '../database/Database';
import { NotificationGateway } from './NotificationGateway';
import { metricsService } from './MetricsService';

interface WhatsAppMessage {
  id: string;
  to: string;
  body: string;
  student_id?: string;
  event_type: string;
  queued_at: Date;
  attempts: number;
}

interface WhatsAppConfig {
  apiUrl: string;
  token: string;
}

export class WhatsAppQueue {
  private queue: WhatsAppMessage[] = [];
  private sentThisHour = 0;
  private hourWindowStart = new Date();
  private isProcessing = false;
  private intervalHandle: NodeJS.Timeout | null = null;
  private gateway?: NotificationGateway;

  constructor(
    private readonly db: Database,
    private readonly license: LicenseManager,
    private config: WhatsAppConfig
  ) {}

  public updateConfig(config: WhatsAppConfig): void {
    this.config = config;
    console.log('[WhatsAppQueue] Configurações de API atualizadas.');
  }

  public async sendTestMessage(to: string): Promise<boolean> {
    const testMsg: WhatsAppMessage = {
      id: `test_${Date.now()}`,
      to,
      body: 'Eagle AI — Teste de Conexão Áquila Pro.🚀',
      student_id: 'test',
      event_type: 'TEST',
      queued_at: new Date(),
      attempts: 0
    };
    return await this._send(testMsg);
  }

  public getQueueStatus(): { queued: number; sentThisHour: number; rateLimit: number; tier: string } {
    return {
      queued: this.queue.length,
      sentThisHour: this.sentThisHour,
      rateLimit: this.license.getLimits().whatsappRatePerHour,
      tier: this.license.getTier(),
    };
  }

  async start(): Promise<void> {
    if (this.intervalHandle) return;
    try {
      const pending = await this.db.getPendingWhatsAppMessages();
      if (pending && pending.length > 0) {
        this.queue = pending.map(m => ({
          ...m,
          queued_at: new Date(m.queuedAt),
          student_id: m.studentId,
          event_type: m.eventType
        }));
      }
    } catch (err) {
      console.error('[WhatsAppQueue] Erro ao carregar mensagens:', err);
    }
    this.intervalHandle = setInterval(() => this._process(), 5_000);
  }

  stop(): void {
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = null;
    }
  }

  public setGateway(gateway: NotificationGateway): void {
    this.gateway = gateway;
  }

  async enqueue(message: Omit<WhatsAppMessage, 'id' | 'queued_at' | 'attempts'>): Promise<void> {
    const msg: WhatsAppMessage = {
      ...message,
      id: `wa_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      queued_at: new Date(),
      attempts: 0,
    };

    try {
      await this.db.addWhatsAppMessage({
        id: msg.id,
        to: msg.to,
        body: msg.body,
        studentId: msg.student_id,
        eventType: msg.event_type,
        attempts: 0,
        status: 'pending'
      });
      this.queue.push(msg);
    } catch (err) {
      this.queue.push(msg);
    }
  }

  private async _process(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) return;
    this.isProcessing = true;
    try {
      this._resetHourWindowIfNeeded();
      const limits = this.license.getLimits();
      const rateLimit = limits.whatsappRatePerHour;

      while (this.queue.length > 0) {
        if (rateLimit > 0 && this.sentThisHour >= rateLimit) break;

        const msg = this.queue.shift()!;
        
        try {
          const success = await this._send(msg);
          if (success) {
            this.sentThisHour++;
            await this.db.deleteWhatsAppMessage(msg.id);
          } else if (msg.attempts < 3) {
            msg.attempts++;
            await this.db.updateWhatsAppMessageStatus(msg.id, 'pending', msg.attempts);
            this.queue.unshift(msg);
            break;
          } else {
            await this.db.updateWhatsAppMessageStatus(msg.id, 'failed', msg.attempts);
          }
        } catch (err) {
          if (msg.attempts < 3) {
            msg.attempts++;
            this.queue.unshift(msg);
          }
           break;
        }
      }
    } finally {
      this.isProcessing = false;
    }
  }

  private async _send(msg: WhatsAppMessage): Promise<boolean> {
    const startTime = Date.now();
    if (!this.gateway) {
      if (process.env.NODE_ENV === 'test') {
        console.warn('[WhatsAppQueue] Gateway missing in test environment. Returning false.');
        return false;
      }
      console.log(`[WA SIMULADO] ${msg.to}: ${msg.body}`);
      metricsService.recordNotification(true, Date.now() - startTime);
      return true;
    }

    const success = await this.gateway.send('whatsapp_meta', {
      to: msg.to,
      body: msg.body,
      priority: msg.event_type === 'CRITICAL' ? 'critical' : 'high',
      metadata: { student_id: msg.student_id, event_type: msg.event_type }
    });

    metricsService.recordNotification(success, Date.now() - startTime);
    return success;
  }

  private _resetHourWindowIfNeeded(): void {
    const now = new Date();
    if (now.getTime() - this.hourWindowStart.getTime() >= 3_600_000) {
      this.sentThisHour = 0;
      this.hourWindowStart = now;
    }
  }
}
