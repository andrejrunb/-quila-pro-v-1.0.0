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
    
    return { success: false, reason: 'API_NOT_AVAILABLE' };
  }

  /**
   * [Sovereign API] Busca dados de presença e engajamento para os pais.
   */
  public async fetchPerformanceData(studentId: string) {
    const api = (window as any).aquila;
    if (api?.invoke) {
      return await api.invoke('api:get-performance', { studentId });
    }
    return null;
  }

  /**
   * [Sovereign API] Busca status financeiro e código PIX para os pais.
   */
  public async fetchFinanceStatus(studentId: string) {
    const api = (window as any).aquila;
    if (api?.invoke) {
      return await api.invoke('api:get-finance', { studentId });
    }
    return null;
  }
}

export const mobileGateway = new MobileGateway();
export default mobileGateway;
