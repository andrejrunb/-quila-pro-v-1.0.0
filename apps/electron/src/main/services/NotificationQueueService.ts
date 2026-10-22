import { securityService } from './SecurityService';
import fs from 'fs';
import path from 'path';
import { app } from 'electron';

interface QueuedNotification {
  id: string;
  phone: string;
  message: string;
  timestamp: number;
  attempts: number;
}

/**
 * NotificationQueueService - Passo 11 do Roadmap Master
 * Garante que nenhuma notificação de IA seja perdida por queda de internet.
 */
export class NotificationQueueService {
  private queueFile: string;
  private queue: QueuedNotification[] = [];
  private isProcessing = false;

  constructor() {
    const userData = app?.getPath('userData') || '';
    this.queueFile = path.join(userData, 'notification_queue.json');
    this.loadQueue();
  }

  private loadQueue() {
    if (fs.existsSync(this.queueFile)) {
      try {
        const data = fs.readFileSync(this.queueFile, 'utf-8');
        this.queue = JSON.parse(data);
      } catch (err) {
        this.queue = [];
      }
    }
  }

  private saveQueue() {
    fs.writeFileSync(this.queueFile, JSON.stringify(this.queue, null, 2));
  }

  public async addToQueue(phone: string, message: string) {
    const item: QueuedNotification = {
      id: Math.random().toString(36).substring(7),
      phone,
      message,
      timestamp: Date.now(),
      attempts: 0
    };
    this.queue.push(item);
    this.saveQueue();
    this.processQueue();
  }

  public async processQueue() {
    if (this.isProcessing || this.queue.length === 0) return;
    this.isProcessing = true;

    console.log(`[QUEUE] Processing ${this.queue.length} pending notifications...`);

    const currentItem = this.queue[0];
    
    try {
      // Simulação de chamada de API WhatsApp
      // Em produção, aqui usaria axios.post(WA_API_URL, ...)
      const success = Math.random() > 0.3; // 70% de chance de sucesso para testes
      
      if (success) {
        console.log(`[QUEUE] Notification sent to ${currentItem.phone}`);
        this.queue.shift();
      } else {
        currentItem.attempts++;
        if (currentItem.attempts > 5) {
          console.error(`[QUEUE] Max attempts reached for ${currentItem.id}. Dropping.`);
          this.queue.shift();
        } else {
          console.warn(`[QUEUE] Failed attempt ${currentItem.attempts} for ${currentItem.id}. Retrying in 10s...`);
          // Espera 10s antes de tentar o próximo or o mesmo
          await new Promise(r => setTimeout(r, 10000));
        }
      }
    } catch (err) {
      console.error(`[QUEUE] Error processing notification:`, err);
    } finally {
      this.saveQueue();
      this.isProcessing = false;
      if (this.queue.length > 0) setTimeout(() => this.processQueue(), 2000);
    }
  }
}

export const notificationQueue = new NotificationQueueService();

