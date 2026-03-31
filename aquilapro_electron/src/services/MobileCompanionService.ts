/**
 * MobileCompanionService.ts — Item 59
 * Servidor WebSocket para integração com "App de Bolso" via rede local.
 * Permite que gestores recebam alertas push locais.
 */

import { WebSocketServer, WebSocket } from 'ws';
import { EventEmitter } from 'events';

export class MobileCompanionService extends EventEmitter {
  private wss: WebSocketServer | null = null;
  private readonly port: number = 8089;

  constructor() {
    super();
  }

  /**
   * Inicia o servidor WS na porta 8089.
   */
  start(): void {
    if (this.wss) return;

    try {
      this.wss = new WebSocketServer({ port: this.port });
      console.log(`[MobileCompanion] Servidor WebSocket ativo na porta ${this.port}`);

      this.wss.on('connection', (ws) => {
        console.log('[MobileCompanion] Novo dispositivo móvel conectado.');

        ws.on('message', (message) => {
          this._handleMessage(ws, message.toString());
        });

        ws.on('close', () => {
          console.log('[MobileCompanion] Conexão encerrada com dispositivo.');
        });

        // Enviar boas vindas
        ws.send(JSON.stringify({ type: 'welcome', version: '1.0.0', status: 'ready' }));
      });

      this.wss.on('error', (err) => {
        console.error('[MobileCompanion] Erro no servidor WS:', err);
      });
    } catch (err) {
      console.error('[MobileCompanion] Falha ao iniciar servidor:', err);
    }
  }

  /**
   * Notifica todos os dispositivos conectados sobre um evento (Ex: Alerta de Evasão).
   */
  broadcast(type: string, data: any): void {
    if (!this.wss) return;

    const payload = JSON.stringify({ type, data, timestamp: new Date().toISOString() });
    this.wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    });
  }

  stop(): void {
    if (this.wss) {
      this.wss.close();
      this.wss = null;
      console.log('[MobileCompanion] Servidor WebSocket desligado.');
    }
  }

  private _handleMessage(ws: WebSocket, message: string): void {
    try {
      const parsed = JSON.parse(message);
      if (parsed.type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong' }));
      }
    } catch {
      // Ignorar mensagens mal formatadas
    }
  }
}
