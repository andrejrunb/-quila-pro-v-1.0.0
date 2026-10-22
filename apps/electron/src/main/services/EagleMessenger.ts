import { EventEmitter } from 'events';
import { logger } from '../logger';
// import { Client, LocalAuth } from 'whatsapp-web.js'; 
// Substituído temporariamente por mock ou injeção dinâmica devido à restrição de build.

export interface MessageJob {
  id: string;
  phone: string;
  text: string;
  templateType: string;
  status: 'PENDING' | 'SENT' | 'DELIVERED' | 'FAILED';
  createdAt: number;
}

/**
 * EagleMessenger (Bloco V - WhatsApp Soberano)
 * Controla envio de mensagens, anti-ban rate limiting, e WhatsApp Web Bot
 */
export class EagleMessenger extends EventEmitter {
  private static instance: EagleMessenger;
  private queue: MessageJob[] = [];
  private isProcessingQueue = false;
  
  // Rate limiter (Passo 232: 3 a 10s anti-ban)
  private readonly MIN_DELAY = 3000;
  private readonly MAX_DELAY = 10000;

  private isConnected = false;

  private constructor() {
    super();
  }

  public static getInstance(): EagleMessenger {
    if (!EagleMessenger.instance) {
      EagleMessenger.instance = new EagleMessenger();
    }
    return EagleMessenger.instance;
  }

  /**
   * Passo 249: Inicializa o WhatsApp Web Client e gera QR Code
   */
  public async initialize() {
    logger.info('[EagleMessenger] Inicializando ponte WhatsApp Web (Isolada)...');
    
    // Simulação do puppeteer carregando e QR code
    setTimeout(() => {
      this.emit('qr-code', 'MOCK_QR_CODE_DATA_STRING_FOR_UI');
      logger.info('[EagleMessenger] QR Code emitido para pareamento.');
    }, 2000);
    
    // Simula scan com sucesso após 5s
    setTimeout(() => {
      this.isConnected = true;
      this.emit('ready');
      logger.info('[EagleMessenger] WhatsApp conectado e soberano.');
      this.processQueue();
    }, 5000);
  }

  /**
   * Passo 233, 234: Envio enfileirado seguro
   */
  public async sendTemplate(phone: string, templateType: 'ATTENDANCE' | 'ABSENCE_ALERT' | 'RISK_ALERT', params: Record<string, string>) {
    
    // Passo 246: Salvaguarda LGPD (Opt-out)
    // Se o contato fez opt-out (checar DB), não envia.
    // Ignorado na simulação.

    let text = '';
    switch (templateType) {
      case 'ATTENDANCE':
        text = `*Áquila Notifica:*\nSeu filho(a) ${params.name} registrou entrada na escola às ${params.time}.`;
        break;
      case 'ABSENCE_ALERT':
        text = `*Áquila Alerta (08:30):*\nNão identificamos a entrada de ${params.name} hoje. Caso haja atestado, envie uma foto aqui.\nPara mais info: #faltas`;
        break;
      case 'RISK_ALERT':
        text = `*Áquila Pedagógico:*\nIdentificamos uma queda de engajamento do(a) aluno(a) ${params.name}. Gostaríamos de agendar uma reunião de apoio.`;
        break;
      default:
        text = `Notificação Áquila: ${JSON.stringify(params)}`;
    }

    const job: MessageJob = {
      id: `msg_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      phone,
      text,
      templateType,
      status: 'PENDING',
      createdAt: Date.now()
    };

    this.queue.push(job);
    logger.info(`[EagleMessenger] Mensagem enfileirada para ${phone} (Template: ${templateType})`);
    
    if (!this.isProcessingQueue && this.isConnected) {
      this.processQueue();
    }
  }

  private async processQueue() {
    if (this.queue.length === 0) {
      this.isProcessingQueue = false;
      return;
    }

    this.isProcessingQueue = true;
    const job = this.queue.shift();

    if (job) {
      try {
        logger.info(`[EagleMessenger] Enviando MSG para ${job.phone}: "${job.text.substring(0, 30)}..."`);
        
        // ENVIO REAL (ex: client.sendMessage(phone + '@c.us', text))
        await new Promise(resolve => setTimeout(resolve, 500)); 
        
        job.status = 'SENT';
        this.emit('message-status', job);
        
      } catch (err) {
         logger.error(`[EagleMessenger] Falha no envio para ${job.phone}.`);
         job.status = 'FAILED';
      }
    }

    // Atraso anti-ban aleatório entre 3 e 10 segundos
    const delay = Math.floor(Math.random() * (this.MAX_DELAY - this.MIN_DELAY + 1)) + this.MIN_DELAY;
    
    setTimeout(() => {
      this.processQueue();
    }, delay);
  }
}

export const eagleMessenger = EagleMessenger.getInstance();
