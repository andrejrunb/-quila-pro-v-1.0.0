import { EventEmitter } from 'events';

/**
 * Phase 401+: WhatsApp Intelligence Service
 * Focado na comunicação via grupo 'Notas' para o Fundador/Coordenadores.
 */
export class WhatsAppService extends EventEmitter {
  private static instance: WhatsAppService;
  private gateway?: any;
  public isConnected: boolean = false;
  private failoverTimer: any = null;

  public static getInstance(): WhatsAppService {
    if (!WhatsAppService.instance) {
      WhatsAppService.instance = new WhatsAppService();
    }
    return WhatsAppService.instance;
  }

  public setGateway(gateway: any) {
    this.gateway = gateway;
    this.isConnected = true;
  }

  public async connect() {
    console.log('[WA] Service ready (Bridged to NotificationGateway).');
  }

  /**
   * Envia uma nota rápida para o grupo de coordenação.
   */
  public async sendToNotas(message: string) {
    if (!this.gateway) {
      console.warn(`[WA] Gateway no conectado. Falha ao enviar.`);
      return;
    }
    
    // Grupo 'Notas' mapeado para o contato de coordenação
    const coordinationNumber = '5511988888888'; 

    await this.gateway.send('whatsapp_webjs', {
      to: coordinationNumber,
      body: `[NOTAS COORDENAÇÃO]\n${message}`,
      priority: 'high'
    });

    this.emit('message-sent', { to: 'Notas', content: message });
  }

  /**
   * Envia o relatório de progresso diretamente para o WhatsApp do pai/mãe.
   */
  public async sendToParent(phone: string, message: string) {
    if (!this.gateway) {
      console.warn(`[WA] Gateway não conectado.`);
      return;
    }

    await this.gateway.send('whatsapp_webjs', {
      to: phone,
      body: `[ÁQUILA PRO - RELATÓRIO PEDAGÓGICO]\n${message}`,
      priority: 'normal'
    });

    this.emit('message-sent', { to: phone, content: message });
  }

  /**
   * Inicia o protocolo de failover de 5 minutos.
   */
  public startFailoverProtocol(context: string) {
    if (this.failoverTimer) clearTimeout(this.failoverTimer);
    
    console.log(`[WA] Protocolo de Failover iniciado (5min). Contexto: ${context}`);
    
    this.failoverTimer = setTimeout(() => {
      this.sendToNotas(`[ALERTA ÁQUILA] Usuário não respondeu no chat principal. Replicação de mensagem: ${context}`);
    }, 5 * 60 * 1000);
  }

  /**
   * Ponte genérica para envio de mensagens (Phase 402+).
   */
  public async sendMessage(to: string, message: string) {
    if (to.includes('@') || to.length > 8) {
      return await this.sendToParent(to, message);
    } else {
      return await this.sendToNotas(message);
    }
  }

  public stopFailover() {
    if (this.failoverTimer) {
      clearTimeout(this.failoverTimer);
      this.failoverTimer = null;
    }
  }
}

export const whatsappService = new WhatsAppService();

