import { Logger } from './Logger';
import { evidenceArchiver } from './EvidenceArchiver';

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
 * Centralizes routing, provider management, and persistent evidence (v1605).
 */
export class NotificationGateway {
  private providers: Map<string, INotificationProvider> = new Map();
  private logger = new Logger('NotificationGateway');

  constructor() {
    this.registerProvider(new MockProvider());
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
          // Remover o frame gigante do payload para não carregar a memória/rede se não for necessário
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
 * WhatsAppMetaProvider — Meta Business API Implementation.
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
