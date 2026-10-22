import { WebSocketServer, WebSocket } from 'ws';
import { EventEmitter } from 'events';
import { Server } from 'http';

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

/**
 * Servidor WebSocket para notificações em tempo real
 */
export class WebSocketServerManager extends EventEmitter {
  private wss: WebSocketServer | null = null;
  private httpServer: Server | null = null;
  private clients: Set<WebSocket> = new Set();
  private port: number = 9000;
  private isRunning: boolean = false;

  constructor(port: number = 9000) {
    super();
    this.port = port;
  }

  /**
   * Inicia o servidor WebSocket
   */
  async start(httpServer?: Server): Promise<void> {
    try {
      if (httpServer) {
        this.httpServer = httpServer;
        this.wss = new WebSocketServer({ server: httpServer });
      } else {
        this.wss = new WebSocketServer({ port: this.port });
      }

      this.setupConnectionHandler();
      this.isRunning = true;

      this.emit('started', {
        port: this.port,
        timestamp: new Date(),
      });

      console.log(`Servidor WebSocket iniciado na porta ${this.port}`);
    } catch (error: any) {
      this.emit('error', {
        error: error instanceof Error ? error.message : 'Erro ao iniciar servidor',
        timestamp: new Date(),
      });
      // Fallback: Ignorar EADDRINUSE fatal se porta fixa estiver alocada pelo próprio DevServer.
      // throw error; 
      console.error(`[WebSocket] Falha nativa ao monopolizar Porta ${this.port}:`, error.message);
      console.warn(`[WebSocket] Sobreviveu ao Crash; Executável Local operando sem notificação real-time websocket...`);
    }
  }

  /**
   * Para o servidor WebSocket
   */
  stop(): void {
    if (!this.isRunning) {
      console.warn('Servidor WebSocket não está rodando');
      return;
    }

    // Fechar todas as conexões
    this.clients.forEach(client => {
      client.close();
    });
    this.clients.clear();

    // Fechar servidor
    if (this.wss) {
      this.wss.close();
    }

    this.isRunning = false;

    this.emit('stopped', {
      timestamp: new Date(),
    });

    console.log('Servidor WebSocket parado');
  }

  /**
   * Configura handler de conexão
   */
  private setupConnectionHandler(): void {
    if (!this.wss) return;

    this.wss.on('connection', (ws: WebSocket) => {
      console.log('Novo cliente WebSocket conectado');
      this.clients.add(ws);

      this.emit('client:connected', {
        clientsCount: this.clients.size,
        timestamp: new Date(),
      });

      // Handler de mensagens
      ws.on('message', (data: string) => {
        try {
          const message = JSON.parse(data) as WSMessage;
          this.handleMessage(ws, message);
        } catch (error) {
          console.error('Erro ao processar mensagem:', error);
        }
      });

      // Handler de erro
      ws.on('error', (error: Error) => {
        console.error('Erro no WebSocket:', error);
        this.emit('client:error', {
          error: error.message,
          timestamp: new Date(),
        });
      });

      // Handler de desconexão
      ws.on('close', () => {
        console.log('Cliente WebSocket desconectado');
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
        this.emit('client:subscribe', {
          channels: message.data.channels,
          timestamp: new Date(),
        });
        break;

      case 'unsubscribe':
        this.emit('client:unsubscribe', {
          channels: message.data.channels,
          timestamp: new Date(),
        });
        break;

      default:
        this.emit('message:received', message);
    }
  }

  /**
   * Envia mensagem para um cliente específico
   */
  sendToClient(ws: WebSocket, message: WSMessage): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  /**
   * Envia mensagem para todos os clientes
   */
  broadcast(message: WSMessage): void {
    this.clients.forEach(client => {
      this.sendToClient(client, message);
    });
  }

  /**
   * Envia notificação de presença
   */
  notifyPresence(data: any): void {
    this.broadcast({
      type: 'presence',
      data,
      timestamp: new Date(),
    });
  }

  /**
   * Envia notificação de alerta
   */
  notifyAlert(data: any): void {
    this.broadcast({
      type: 'alert',
      data,
      timestamp: new Date(),
    });
  }

  /**
   * Envia notificação de câmera
   */
  notifyCamera(data: any): void {
    this.broadcast({
      type: 'camera',
      data,
      timestamp: new Date(),
    });
  }

  /**
   * Envia notificação de detecção
   */
  notifyDetection(data: any): void {
    this.broadcast({
      type: 'detection',
      data,
      timestamp: new Date(),
    });
  }

  /**
   * Envia notificação de reconhecimento facial
   */
  notifyFaceRecognition(data: any): void {
    this.broadcast({
      type: 'face_recognition',
      data,
      timestamp: new Date(),
    });
  }

  /**
   * Envia notificação de status do sistema
   */
  notifyStatus(data: any): void {
    this.broadcast({
      type: 'status',
      data,
      timestamp: new Date(),
    });
  }

  /**
   * Obtém número de clientes conectados
   */
  getClientsCount(): number {
    return this.clients.size;
  }

  /**
   * Obtém status do servidor
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      port: this.port,
      clientsCount: this.clients.size,
    };
  }
}

export default WebSocketServerManager;


