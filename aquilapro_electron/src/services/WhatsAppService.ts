import { EventEmitter } from 'events';

/**
 * Phase 401+: WhatsApp Intelligence Service
 * Focado na comunicação via grupo 'Notas' para o Fundador/Coordenadores.
 */
class WhatsAppService extends EventEmitter {
  private isConnected: boolean = false;
  private readonly TARGET_GROUP = 'Notas';
  private failoverTimer: NodeJS.Timeout | null = null;

  public async connect() {
    console.log('[WA] Inciando sincronização via WhatsApp Web...');
    // A lógica real dependeria de um driver (puppeteer/wa-automate)
    this.isConnected = true;
    this.emit('connected');
  }

  /**
   * Envia uma nota rápida para o grupo de coordenação.
   */
  public async sendToNotas(message: string) {
    if (!this.isConnected) {
      console.warn(`[WA] WhatsApp no conectado. Falha ao enviar para ${this.TARGET_GROUP}.`);
      return;
    }
    console.log(`[WA] COMUNICAO ESTRITA ATIVADA: Enviando para '${this.TARGET_GROUP}': ${message}`);
    // MOCK: Emitir evento para o log do SOC
    this.emit('message-sent', { to: this.TARGET_GROUP, content: message });
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

  public stopFailover() {
    if (this.failoverTimer) {
      clearTimeout(this.failoverTimer);
      this.failoverTimer = null;
    }
  }
}

export const whatsappService = new WhatsAppService();
