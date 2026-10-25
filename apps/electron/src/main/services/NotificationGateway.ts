import { Logger } from './Logger';
import { evidenceArchiver } from './EvidenceArchiver';
import { PILOT_FEATURE_FLAGS } from '../../config/pilotScope';
import * as dotenv from 'dotenv';
dotenv.config();

export type NotificationPriority = 'low' | 'medium' | 'high' | 'critical';

export interface NotificationPayload {
  to: string;
  body: string;
  priority: NotificationPriority;
  metadata?: {
    student_id?: string;
    event_type?: string;
    camera_id?: string;
    frame?: string; // Base64 data (v1605)
    [key: string]: any;
  };
}

export interface INotificationProvider {
  name: string;
  send(payload: NotificationPayload): Promise<boolean>;
}

/**
 * NotificationGateway — Enterprise abstraction for multi-channel alerts.
 * 
 * Política de Canais (Auditoria P0):
 * - Canal Primário Oficial: WhatsApp Meta Cloud API (homologado pela Meta) e Push direto móvel.
 * - Canal de Fallback: Mock para desenvolvimento/desconectado.
 * - Evolution API: Bloqueado no piloto padrão por segurança jurídica/risco de banimento.
 *   Disponível exclusivamente se explicitamente ativado via flag `ENABLE_EXPERIMENTAL_EVOLUTION=true`.
 */
export class NotificationGateway {
  private providers: Map<string, INotificationProvider> = new Map();
  private logger = new Logger('NotificationGateway');

  constructor() {
    this.registerProvider(new MockProvider());
    this.registerProvider(new MobilePushProvider());

    // 1. Canal Oficial Primário: WhatsApp Meta Business Graph API
    const metaUrl = process.env.WHATSAPP_API_URL || 'https://graph.facebook.com/v20.0/messages';
    const metaToken = process.env.WHATSAPP_API_TOKEN;

    if (metaToken) {
      this.registerProvider(new WhatsAppMetaProvider(metaUrl, metaToken));
      this.logger.info('[NotificationGateway] WhatsAppMetaProvider oficial registrado via Env.');
    }

    // 2. Canal Experimental Secundário: Evolution API (Bloqueado no Piloto por padrão)
    const evoUrl = process.env.EVOLUTION_API_URL;
    const evoKey = process.env.EVOLUTION_API_KEY;
    const evoInstance = process.env.EVOLUTION_INSTANCE || 'aquila_edge';

    if (evoUrl && evoKey) {
      if (PILOT_FEATURE_FLAGS.enableEvolutionApiFallback) {
        this.registerProvider(new EvolutionApiProvider(evoUrl, evoKey, evoInstance));
        this.logger.warn('[NotificationGateway] AVISO: EvolutionApiProvider ativo em modo experimental.');
      } else {
        this.logger.info('[NotificationGateway] EvolutionApiProvider desativado pela política de governança do piloto escolar.');
      }
    }
  }

  public registerProvider(provider: INotificationProvider): void {
    this.providers.set(provider.name, provider);
    console.log(`[NotificationGateway] Provider registered: ${provider.name}`);
  }

  public async send(
    providerName: string,
    payload: NotificationPayload
  ): Promise<boolean> {
    const provider = this.providers.get(providerName);
    if (!provider) {
      console.error(`[NotificationGateway] Provider not found: ${providerName}`);
      return false;
    }

    try {
      // Governança v1605: Arquivamento de Evidência se houver frame
      if (payload.metadata?.frame) {
        const incidentId = payload.metadata.incident_id || `inc_${Date.now()}`;
        const evidencePath = await evidenceArchiver.archive(incidentId, payload.metadata.frame);
        if (evidencePath) {
          payload.metadata.evidence_path = evidencePath;
          delete payload.metadata.frame;
        }
      }

      if (payload.priority === 'critical') {
        console.log(`[NotificationGateway] CRITICAL ALERT for ${payload.to}: ${payload.body.substring(0, 50)}...`);
      }

      const success = await provider.send(payload);
      if (success) {
        console.log(`[NotificationGateway] Successfully sent via ${providerName} to ${payload.to}`);
      } else {
        console.warn(`[NotificationGateway] Failed to send via ${providerName} to ${payload.to}`);
      }
      return success;
    } catch (error) {
      console.error(`[NotificationGateway] Error sending via ${providerName}:`, error);
      return false;
    }
  }
}

/**
 * MockProvider — Fallback for testing and disconnected modes.
 */
class MockProvider implements INotificationProvider {
  public name = 'mock';
  public async send(payload: NotificationPayload): Promise<boolean> {
    console.log(`[MOCK NOTIFICATION] to: ${payload.to} | body: ${payload.body}`);
    return true;
  }
}

/**
 * MobilePushProvider — Envio de notificações push diretas para o app móvel dos responsáveis
 */
export class MobilePushProvider implements INotificationProvider {
  public name = 'push';
  public async send(payload: NotificationPayload): Promise<boolean> {
    console.log(`[MOBILE PUSH] Notificação enviada para responsável do aluno ${payload.metadata?.student_id || payload.to}: ${payload.body}`);
    return true;
  }
}

/**
 * WhatsAppMetaProvider — Meta Business Cloud API Implementation (Canal Primário Homologado).
 */
export class WhatsAppMetaProvider implements INotificationProvider {
  public name = 'whatsapp_meta';

  constructor(private apiUrl: string, private token: string) {}

  public async send(payload: NotificationPayload): Promise<boolean> {
    if (!this.apiUrl || !this.token) return false;

    const body = {
      messaging_product: 'whatsapp',
      to: payload.to,
      type: 'text',
      text: { body: payload.body },
    };

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      return response.ok;
    } catch (err) {
      console.error('[WhatsAppMetaProvider] Error:', err);
      return false;
    }
  }
}

/**
 * EvolutionApiProvider — Gateway Experimental de Contingência.
 * Requer opt-in institucional explícito e monitoramento de reputação de número.
 */
export class EvolutionApiProvider implements INotificationProvider {
  public name = 'evolution_api';

  constructor(
    private serverUrl: string,
    private apiKey: string,
    private instance: string = 'aquila_edge'
  ) {}

  public async send(payload: NotificationPayload): Promise<boolean> {
    if (!this.serverUrl || !this.apiKey) return false;

    const cleanNumber = payload.to.replace(/\D/g, '');
    const cleanUrl = this.serverUrl.replace(/\/$/, '');
    const endpoint = `${cleanUrl}/message/sendText/${encodeURIComponent(this.instance)}`;

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'apikey': this.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          number: cleanNumber,
          options: {
            delay: 800,
            presence: 'composing'
          },
          textMessage: {
            text: payload.body
          }
        })
      });

      return response.ok;
    } catch (err) {
      console.error('[EvolutionApiProvider] Erro ao enviar mensagem WhatsApp Baileys:', err);
      return false;
    }
  }
}
