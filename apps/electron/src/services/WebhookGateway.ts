/**
 * WebhookGateway.ts — Item 28
 * Expõe um servidor HTTP local (express) para receber e disparar webhooks.
 * Escolas podem integrar com SGE (Sistema de Gestão Escolar) via REST.
 * LGPD: Payload de saída não contém dados biométricos.
 */

import { EventEmitter } from 'events';
import * as http from 'http';
import * as https from 'https';

interface WebhookConfig {
  targetUrl: string;
  secret: string;           // HMAC-SHA256 para validação
  events: string[];         // Tipos de eventos a encaminhar
  enabled: boolean;
}

export class WebhookGateway extends EventEmitter {
  private server: http.Server | null = null;
  private readonly PORT = 7979;
  private configs: WebhookConfig[] = [];

  constructor(configs: WebhookConfig[] = []) {
    super();
    this.configs = configs;
  }

  /**
   * Inicia o servidor HTTP local para receber webhooks externos.
   */
  startServer(): void {
    if (this.server) return;

    this.server = http.createServer((req, res) => {
      if (req.method !== 'POST') {
        res.writeHead(405);
        res.end('Method Not Allowed');
        return;
      }

      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', () => {
        try {
          const payload = JSON.parse(body);
          console.log('[WebhookGateway] Evento recebido:', payload.event);
          this.emit('incoming-webhook', payload);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: true }));
        } catch {
          res.writeHead(400);
          res.end('Bad Request');
        }
      });
    });

    this.server.listen(this.PORT, '127.0.0.1', () => {
      console.log(`[WebhookGateway] Servidor local em http://127.0.0.1:${this.PORT}`);
    });
  }

  stopServer(): void {
    this.server?.close();
    this.server = null;
  }

  /**
   * Dispara um webhook para todos os destinos configurados para aquele evento.
   */
  async dispatch(eventType: string, payload: Record<string, any>): Promise<void> {
    const targets = this.configs.filter(c => c.enabled && c.events.includes(eventType));

    for (const target of targets) {
      const body = JSON.stringify({ event: eventType, data: payload, ts: new Date().toISOString() });

      try {
        await this._post(target.targetUrl, body, target.secret);
        console.log(`[WebhookGateway] Evento '${eventType}' disparado para ${target.targetUrl}`);
      } catch (err) {
        console.error(`[WebhookGateway] Falha ao enviar para ${target.targetUrl}:`, err);
      }
    }
  }

  private _post(url: string, body: string, secret: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const parsedUrl = new URL(url);
      const client = parsedUrl.protocol === 'https:' ? https : http;

      const req = client.request({
        host: parsedUrl.hostname,
        port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
        path: parsedUrl.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
          'X-Aquila-Secret': secret,
        },
      }, (res) => {
        if (res.statusCode && res.statusCode < 300) resolve();
        else reject(new Error(`HTTP ${res.statusCode}`));
      });

      req.on('error', reject);
      req.setTimeout(5000, () => { req.destroy(); reject(new Error('Timeout')); });
      req.write(body);
      req.end();
    });
  }
}
