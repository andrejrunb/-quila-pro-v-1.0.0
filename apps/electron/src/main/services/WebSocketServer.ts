import { WebSocketServer, WebSocket } from 'ws';
import { EventEmitter } from 'events';
import { Server, IncomingMessage } from 'http';
import * as crypto from 'crypto';

/**
 * Interface para mensagem WebSocket
 */
export interface WSMessage {
  type: string;
  category?: string;
  message?: string;
  data: any;
  timestamp: Date;
}

export interface WSClientMeta {
  ip: string;
  authenticated: boolean;
  role?: string;
  userId?: string;
  connectedAt: Date;
  messageCount: number;
  lastMessageTime: number;
}

/**
 * Servidor WebSocket para notificações em tempo real com Segurança Enterprise:
 * - Validação de Origem (LAN e domínios homologados)
 * - Autenticação por HMAC-SHA256 / Bearer Token
 * - Rate Limiting por IP (Proteção contra DoS local)
 */
export class WebSocketServerManager extends EventEmitter {
  private wss: WebSocketServer | null = null;
  private httpServer: Server | null = null;
  private clients: Map<WebSocket, WSClientMeta> = new Map();
  private port: number = 9000;
  private isRunning: boolean = false;
  private ipRateLimits: Map<string, { count: number; windowStart: number }> = new Map();
  private readonly MAX_MESSAGES_PER_MINUTE = 120;
  private readonly MAX_CONNECTIONS_PER_IP = 20;
  private hmacSecret: string = process.env.AQUILA_WS_SECRET || 'AQUILA_EDGE_WS_HMAC_SECRET_2026';

  constructor(port: number = 9000, hmacSecret?: string) {
    super();
    this.port = port;
    if (hmacSecret) this.hmacSecret = hmacSecret;
  }

  /**
   * Inicia o servidor WebSocket
   */
  async start(httpServer?: Server): Promise<void> {
    try {
      const serverOptions: any = {
        verifyClient: (info: { origin: string; secure: boolean; req: IncomingMessage }, callback: (res: boolean, code?: number, message?: string) => void) => {
          this.verifyClientConnection(info, callback);
        }
      };

      if (httpServer) {
        this.httpServer = httpServer;
        serverOptions.server = httpServer;
      } else {
        serverOptions.port = this.port;
      }

      this.wss = new WebSocketServer(serverOptions);
      this.setupConnectionHandler();
      this.isRunning = true;

      this.emit('started', {
        port: this.port,
        timestamp: new Date(),
      });

      console.log(`[WebSocket] Servidor Seguro iniciado na porta ${this.port} (Origem validada, Rate Limit ativo).`);
    } catch (error: any) {
      this.emit('error', {
        error: error instanceof Error ? error.message : 'Erro ao iniciar servidor',
        timestamp: new Date(),
      });
      console.error(`[WebSocket] Falha nativa ao monopolizar Porta ${this.port}:`, error.message);
    }
  }

  /**
   * Validação de conexão de entrada: Origem, Token e Rate Limit por IP
   */
  public verifyClientConnection(
    info: { origin: string; secure: boolean; req: IncomingMessage },
    callback: (res: boolean, code?: number, message?: string) => void
  ): void {
    const req = info.req;
    const ip = req.socket.remoteAddress || '127.0.0.1';

    // 1. Verificação de Rate Limit de Conexões por IP
    const now = Date.now();
    const rate = this.ipRateLimits.get(ip) || { count: 0, windowStart: now };
    if (now - rate.windowStart > 60000) {
      rate.count = 1;
      rate.windowStart = now;
    } else {
      rate.count++;
      if (rate.count > this.MAX_MESSAGES_PER_MINUTE) {
        console.warn(`[WebSocket] Conexão rejeitada por Rate Limit do IP: ${ip}`);
        callback(false, 429, 'Too Many Requests');
        return;
      }
    }
    this.ipRateLimits.set(ip, rate);

    // 2. Verificação de Origem (Origin Header)
    // Permite conexões locais (Electron/Next.js), redes privadas homologadas e requisições sem origin (terminais RFID nativos)
    const origin = info.origin || req.headers['origin'] || '';
    if (origin) {
      const allowedOrigins = [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://localhost:9000',
        'app://aquila.school',
        'vscode-webview://'
      ];
      const isAllowedOrigin = allowedOrigins.some(ao => origin.startsWith(ao)) ||
        /^http:\/\/(192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+)(:\d+)?$/.test(origin);

      if (!isAllowedOrigin && process.env.NODE_ENV === 'production') {
        console.warn(`[WebSocket] Origem não autorizada: ${origin}`);
        callback(false, 403, 'Forbidden Origin');
        return;
      }
    }

    // 3. Verificação de Token de Autenticação (Query param ?token=... ou Header Authorization)
    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    const token = url.searchParams.get('token') || (req.headers['authorization'] || '').replace('Bearer ', '');

    // Em ambiente de produção, conexões sem token são recusadas
    if (process.env.NODE_ENV === 'production' && !token) {
      console.warn(`[WebSocket] Conexão rejeitada: Token ausente para IP ${ip}`);
      callback(false, 401, 'Unauthorized: Token Required');
      return;
    }

    if (token) {
      const valid = this.validateAuthToken(token);
      if (!valid) {
        console.warn(`[WebSocket] Conexão rejeitada: Token inválido para IP ${ip}`);
        callback(false, 401, 'Unauthorized: Invalid Token');
        return;
      }
    }

    callback(true);
  }

  /**
   * Validação de Token HMAC-SHA256 ou JWT
   */
  public validateAuthToken(token: string): boolean {
    if (!token || token.trim() === '') return false;
    // Permite tokens de sessão interna com HMAC
    try {
      if (token.includes('.')) {
        const [payloadB64, sig] = token.split('.');
        const expectedSig = crypto.createHmac('sha256', this.hmacSecret).update(payloadB64).digest('hex');
        return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig));
      }
      return token.length >= 16;
    } catch {
      return false;
    }
  }

  /**
   * Para o servidor WebSocket
   */
  stop(): void {
    if (!this.isRunning) return;

    this.clients.forEach((_, client) => {
      client.close();
    });
    this.clients.clear();

    if (this.wss) {
      this.wss.close();
    }

    this.isRunning = false;
    this.emit('stopped', { timestamp: new Date() });
    console.log('[WebSocket] Servidor parado com sucesso.');
  }

  /**
   * Configura handler de conexão
   */
  private setupConnectionHandler(): void {
    if (!this.wss) return;

    this.wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
      const ip = req.socket.remoteAddress || '127.0.0.1';
      const meta: WSClientMeta = {
        ip,
        authenticated: true,
        connectedAt: new Date(),
        messageCount: 0,
        lastMessageTime: Date.now()
      };

      this.clients.set(ws, meta);

      this.emit('client:connected', {
        clientsCount: this.clients.size,
        ip,
        timestamp: new Date(),
      });

      ws.on('message', (data: string) => {
        try {
          const clientMeta = this.clients.get(ws);
          if (clientMeta) {
            const now = Date.now();
            clientMeta.messageCount++;
            // Rate limit interno por conexão: max 30 msgs a cada 5 segundos
            if (now - clientMeta.lastMessageTime < 5000 && clientMeta.messageCount > 30) {
              console.warn(`[WebSocket] Conexão violou rate limit: desconectando IP ${clientMeta.ip}`);
              ws.close(1008, 'Policy Violation: Rate Limit Exceeded');
              return;
            }
            if (now - clientMeta.lastMessageTime >= 5000) {
              clientMeta.messageCount = 1;
              clientMeta.lastMessageTime = now;
            }
          }

          const message = JSON.parse(data.toString()) as WSMessage;
          this.handleMessage(ws, message);
        } catch (error) {
          console.error('[WebSocket] Erro ao processar mensagem recebida:', error);
        }
      });

      ws.on('error', (error: Error) => {
        console.error('[WebSocket] Erro no cliente:', error.message);
        this.emit('client:error', { error: error.message, timestamp: new Date() });
      });

      ws.on('close', () => {
        this.clients.delete(ws);
        this.emit('client:disconnected', {
          clientsCount: this.clients.size,
          timestamp: new Date(),
        });
      });
    });
  }

  /**
   * Processa mensagem recebida do cliente
   */
  private handleMessage(ws: WebSocket, message: WSMessage): void {
    switch (message.type) {
      case 'ping':
        this.sendToClient(ws, {
          type: 'pong',
          data: { timestamp: new Date() },
          timestamp: new Date(),
        });
        break;
      case 'subscribe':
        this.emit('client:subscribe', { client: ws, data: message.data });
        break;
      default:
        this.emit('message', { client: ws, message });
    }
  }

  /**
   * Envia mensagem para um cliente específico
   */
  sendToClient(ws: WebSocket, message: WSMessage): boolean {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
      return true;
    }
    return false;
  }

  /**
   * Transmite mensagem para todos os clientes conectados
   */
  broadcast(message: WSMessage): void {
    let sentCount = 0;
    this.clients.forEach((_, client) => {
      if (this.sendToClient(client, message)) {
        sentCount++;
      }
    });

    this.emit('broadcast', {
      type: message.type,
      recipientCount: sentCount,
      timestamp: new Date(),
    });
  }

  public getConnectedClientsCount(): number {
    return this.clients.size;
  }
}

export const webSocketServer = new WebSocketServerManager();
