import { EventEmitter } from 'events';

export interface PushMessage {
  title: string;
  body: string;
  studentId?: string;
  priority: 'normal' | 'high';
  eventType: string;
}

/**
 * PushNotificationService.ts — AG-014
 * Bridge para envio de notificações para dispositivos móveis.
 */
class PushNotificationService extends EventEmitter {
  private readonly FCM_TOKEN = process.env.FCM_SERVER_KEY || 'MOCK_TOKEN';
  
  public async sendPush(msg: PushMessage): Promise<boolean> {
    console.log(`[PushService] Enviando notificação: ${msg.title} (${msg.priority})`);
    
    // Mock de delay de rede
    await new Promise(resolve => setTimeout(resolve, 800));

    // Emitir evento para logs do sistema
    this.emit('push-sent', { ...msg, ts: new Date().toISOString() });

    return true; 
  }

  public async notifyParent(studentName: string, message: string, studentId: string) {
    return this.sendPush({
      title: `Áquila Pro: ${studentName}`,
      body: message,
      studentId,
      priority: 'high',
      eventType: 'SECURITY_ALERT'
    });
  }
}

export const pushNotificationService = new PushNotificationService();
export default pushNotificationService;
