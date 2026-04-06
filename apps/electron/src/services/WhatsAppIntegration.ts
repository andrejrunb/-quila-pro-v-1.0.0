import Logger from './Logger';

/**
 * Integração Completa de WhatsApp
 * Suporta Meta API (oficial) + Evolution API (open-source) + Fallback
 */

export interface WhatsAppConfig {
  provider: 'meta' | 'evolution' | 'auto';
  metaConfig?: {
    accessToken: string;
    phoneNumberId: string;
    businessAccountId: string;
  };
  evolutionConfig?: {
    baseUrl: string;
    apiKey: string;
    instanceName: string;
  };
}

export interface WhatsAppMessage {
  to: string;
  type: 'text' | 'template' | 'media';
  content: string;
  templateName?: string;
  parameters?: string[];
  mediaUrl?: string;
  mediaType?: 'image' | 'document' | 'audio' | 'video';
  caption?: string;
}

export interface WhatsAppResponse {
  success: boolean;
  messageId?: string;
  provider: string;
  timestamp: number;
  error?: string;
}

export class WhatsAppIntegration {
  private config: WhatsAppConfig;
  private logger: Logger;
  private metaAvailable: boolean = false;
  private evolutionAvailable: boolean = false;

  constructor(config: WhatsAppConfig) {
    this.config = config;
    this.logger = new Logger('WhatsAppIntegration');
    this.checkAvailability();
  }

  /**
   * Verificar disponibilidade das APIs
   */
  private async checkAvailability(): Promise<void> {
    try {
      // Verificar Meta API
      if (this.config.metaConfig) {
        const response = await fetch(
          `https://graph.instagram.com/v18.0/${this.config.metaConfig.phoneNumberId}`,
          {
            headers: {
              Authorization: `Bearer ${this.config.metaConfig.accessToken}`,
            },
          }
        );
        this.metaAvailable = response.ok;
        if (this.metaAvailable) {
          this.logger.info('Meta WhatsApp API disponível');
        }
      }
    } catch (error) {
      this.logger.warn(`Meta API indisponível: ${(error as Error).message}`);
    }

    try {
      // Verificar Evolution API
      if (this.config.evolutionConfig) {
        const response = await fetch(
          `${this.config.evolutionConfig.baseUrl}/instance/info/${this.config.evolutionConfig.instanceName}`,
          {
            headers: {
              apikey: this.config.evolutionConfig.apiKey,
            },
          }
        );
        this.evolutionAvailable = response.ok;
        if (this.evolutionAvailable) {
          this.logger.info('Evolution API disponível');
        }
      }
    } catch (error) {
      this.logger.warn(`Evolution API indisponível: ${(error as Error).message}`);
    }
  }

  /**
   * Enviar mensagem com fallback automático
   */
  async sendMessage(message: WhatsAppMessage): Promise<WhatsAppResponse> {
    const timestamp = Date.now();

    // Tentar Meta API primeiro (mais confiável)
    if (this.config.provider === 'meta' || this.config.provider === 'auto') {
      if (this.metaAvailable && this.config.metaConfig) {
        try {
          const result = await this.sendViaMetaAPI(message);
          return {
            success: true,
            messageId: result.messages[0].id,
            provider: 'meta',
            timestamp,
          };
        } catch (error) {
          this.logger.error(`Erro Meta API: ${(error as Error).message}`);
          if (this.config.provider === 'meta') {
            return {
              success: false,
              provider: 'meta',
              timestamp,
              error: (error as Error).message,
            };
          }
        }
      }
    }

    // Fallback para Evolution API
    if (this.config.provider === 'evolution' || this.config.provider === 'auto') {
      if (this.evolutionAvailable && this.config.evolutionConfig) {
        try {
          const result = await this.sendViaEvolutionAPI(message);
          return {
            success: true,
            messageId: result.key.id,
            provider: 'evolution',
            timestamp,
          };
        } catch (error) {
          this.logger.error(`Erro Evolution API: ${(error as Error).message}`);
          return {
            success: false,
            provider: 'evolution',
            timestamp,
            error: (error as Error).message,
          };
        }
      }
    }

    return {
      success: false,
      provider: 'none',
      timestamp,
      error: 'Nenhuma API de WhatsApp disponível',
    };
  }

  /**
   * Enviar via Meta WhatsApp Business API
   */
  private async sendViaMetaAPI(message: WhatsAppMessage): Promise<any> {
    if (!this.config.metaConfig) {
      throw new Error('Meta API não configurada');
    }

    const url = `https://graph.instagram.com/v18.0/${this.config.metaConfig.phoneNumberId}/messages`;

    let body: any = {
      messaging_product: 'whatsapp',
      to: this.formatPhoneNumber(message.to),
    };

    if (message.type === 'text') {
      body.type = 'text';
      body.text = { body: message.content };
    } else if (message.type === 'template') {
      body.type = 'template';
      body.template = {
        name: message.templateName,
        language: { code: 'pt_BR' },
        parameters: {
          body: {
            parameters: (message.parameters || []).map(p => ({
              type: 'text',
              text: p,
            })),
          },
        },
      };
    } else if (message.type === 'media') {
      body.type = 'image';
      body.image = {
        link: message.mediaUrl,
      };
      if (message.caption) {
        body.image.caption = message.caption;
      }
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.metaConfig.accessToken}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Meta API error: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Enviar via Evolution API
   */
  private async sendViaEvolutionAPI(message: WhatsAppMessage): Promise<any> {
    if (!this.config.evolutionConfig) {
      throw new Error('Evolution API não configurada');
    }

    const baseUrl = this.config.evolutionConfig.baseUrl;
    const instanceName = this.config.evolutionConfig.instanceName;
    const apiKey = this.config.evolutionConfig.apiKey;

    let endpoint = '';
    let body: any = {
      number: this.formatPhoneNumber(message.to),
    };

    if (message.type === 'text') {
      endpoint = `${baseUrl}/message/sendText/${instanceName}`;
      body.text = message.content;
    } else if (message.type === 'media') {
      endpoint = `${baseUrl}/message/sendMedia/${instanceName}`;
      body.mediaType = message.mediaType || 'image';
      body.media = message.mediaUrl;
      if (message.caption) {
        body.caption = message.caption;
      }
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: apiKey,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Evolution API error: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Enviar alerta crítico (aluno saiu da escola)
   */
  async sendCriticalAlert(
    parentPhone: string,
    studentName: string,
    schoolName: string
  ): Promise<WhatsAppResponse> {
    const message: WhatsAppMessage = {
      to: parentPhone,
      type: 'text',
      content: `🚨 ALERTA CRÍTICO - ${schoolName}\
\
${studentName} SAIU DA ESCOLA!\
\
Acionar segurança imediatamente.\
\
Horário: ${new Date().toLocaleTimeString('pt-BR')}`,
    };

    return this.sendMessage(message);
  }

  /**
   * Enviar alerta de ausência
   */
  async sendAbsenceAlert(
    parentPhone: string,
    studentName: string,
    minutesAbsent: number
  ): Promise<WhatsAppResponse> {
    const message: WhatsAppMessage = {
      to: parentPhone,
      type: 'text',
      content: `⚠️ Alerta de Presença\
\
${studentName} está ausente há ${minutesAbsent} minutos.\
\
Por favor, entre em contato com a escola.`,
    };

    return this.sendMessage(message);
  }

  /**
   * Enviar notificação de presença
   */
  async sendPresenceNotification(
    parentPhone: string,
    studentName: string,
    status: 'entrada' | 'saída'
  ): Promise<WhatsAppResponse> {
    const emoji = status === 'entrada' ? '✅' : '👋';
    const message: WhatsAppMessage = {
      to: parentPhone,
      type: 'text',
      content: `${emoji} Notificação de Presença\
\
${studentName} registrou ${status} na escola.\
\
Horário: ${new Date().toLocaleTimeString('pt-BR')}`,
    };

    return this.sendMessage(message);
  }

  /**
   * Enviar relatório diário
   */
  async sendDailyReport(
    parentPhone: string,
    studentName: string,
    attendanceRate: number,
    absences: number
  ): Promise<WhatsAppResponse> {
    const message: WhatsAppMessage = {
      to: parentPhone,
      type: 'text',
      content: `📊 Relatório Diário - ${studentName}\
\
Presença: ${attendanceRate}%\
Ausências: ${absences}\
\
Data: ${new Date().toLocaleDateString('pt-BR')}`,
    };

    return this.sendMessage(message);
  }

  /**
   * Enviar mensagem em lote
   */
  async sendBatch(messages: WhatsAppMessage[]): Promise<WhatsAppResponse[]> {
    const results: WhatsAppResponse[] = [];

    for (const message of messages) {
      try {
        const result = await this.sendMessage(message);
        results.push(result);
        // Aguardar um pouco entre mensagens para evitar rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        results.push({
          success: false,
          provider: 'unknown',
          timestamp: Date.now(),
          error: (error as Error).message,
        });
      }
    }

    return results;
  }

  /**
   * Formatar número de telefone
   */
  private formatPhoneNumber(phone: string): string {
    // Remover caracteres especiais
    let cleaned = phone.replace(/\\D/g, '');

    // Se não tiver código de país, adicionar 55 (Brasil)
    if (cleaned.length === 11) {
      cleaned = '55' + cleaned;
    } else if (cleaned.length === 10) {
      cleaned = '55' + cleaned;
    }

    return cleaned;
  }

  /**
   * Obter status das APIs
   */
  getStatus(): {
    meta: boolean;
    evolution: boolean;
    primaryProvider: string;
  } {
    let primaryProvider = 'none';
    if (this.metaAvailable) primaryProvider = 'meta';
    else if (this.evolutionAvailable) primaryProvider = 'evolution';

    return {
      meta: this.metaAvailable,
      evolution: this.evolutionAvailable,
      primaryProvider,
    };
  }
}

export default WhatsAppIntegration;

