/**
 * Step 146 — MobileGateway
 * Define a interface de comunicação para o aplicativo móvel (Áquila Parent).
 * Prepara o sistema para sincronização bidirecional em tempo real.
 */
export interface MobileSession {
  userId: string;
  deviceId: string;
  lastActive: number;
}

class MobileGateway {
  private endpoint = '/api/v1/mobile';

  /**
   * Registra um novo dispositivo mobile de pai/aluno
   */
  public async registerDevice(data: { userId: string, pushToken: string }) {
    console.log(`[Mobile] Registrando token push para ${data.userId}: ${data.pushToken}`);
    
    // Step 150 — Integração direta com Firebase/OneSignal via Main Process
    const api = (window as any).aquila;
    if (api?.invoke) {
      return await api.invoke('mobile:register-token', data);
    }
    return { success: true };
  }

  /**
   * Envia notificação em tempo real
   */
  public async sendNotification(userId: string, title: string, body: string, priority: 'high' | 'normal' = 'normal') {
    console.log(`[Mobile] Enviando notificação para ${userId}: ${title}`);
    
    const api = (window as any).aquila;
    if (api?.invoke) {
      return await api.invoke('mobile:send-push', { userId, title, body, priority });
    }
    return { success: false, reason: 'API_NOT_AVAILABLE' };
  }
}

export const mobileGateway = new MobileGateway();
export default mobileGateway;
