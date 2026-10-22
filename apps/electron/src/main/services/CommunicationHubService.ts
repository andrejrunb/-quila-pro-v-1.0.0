import { EventEmitter } from 'events';
import * as crypto from 'crypto';
import { licenseService } from './LicenseService';
import { SecureMessage, MessageChannel, GhostPresence } from '../../services/AiTypes';
import { wiFiDensePoseService } from './WiFiDensePoseService';

export interface PollOption {
  id: string;
  text: string;
  votes: number;
}

export interface SchoolMessage {
  id: string;
  channelId: string;
  senderId: string;
  text: string;
  mediaUrl?: string;
  poll?: {
    question: string;
    options: PollOption[];
    isClosed: boolean;
  };
  readBy: string[];
  createdAt: string;
}

/**
 * CommunicationHubService (v3510)
 * Gerencia a mensageria segura e criptografada (E2EE).
 */
export class CommunicationHubService extends EventEmitter {
  private secureMessages: SecureMessage[] = [];
  private legacyMessages: SchoolMessage[] = [];
  private readonly MAX_MESSAGES_CACHE = 1000;
  private readonly algorithm = 'aes-256-cbc';

  public channels: MessageChannel[] = [
    { id: 'gen', name: 'Comunicados Gerais', type: 'general' },
    { id: 'sec', name: 'Atendimento Secretaria', type: 'secretaria' },
    { id: 'ped', name: 'Coordenação Pedagógica', type: 'pedagogico' }
  ];

  constructor() {
    super();
    this.initPassiveSafety();
  }

  private initPassiveSafety() {
    wiFiDensePoseService.on('passive-fall-alert', (ghost: GhostPresence) => {
      this.sendMessage({
        sender: 'SISTEMA_DENSE_POSE',
        recipient: 'SEGURANÇA_CENTRAL',
        content: `ALERTA CRÍTICO: Possível queda detectada via Wi-Fi no setor ${ghost.zoneId}. Confiança: ${(ghost.confidence * 100).toFixed(1)}%`,
        priority: 'critical',
        channelId: 'sec',
        isSilentAlarm: true
      });
    });
  }

  private _getEncryptionKey(): Buffer {
    const hwId = licenseService.getHardwareId();
    return crypto.createHash('sha256').update(hwId).digest();
  }

  public encrypt(text: string): { content: string; iv: string } {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this._getEncryptionKey(), iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return { content: encrypted, iv: iv.toString('hex') };
  }

  public decrypt(encryptedText: string, ivHex: string): string {
    try {
      const iv = Buffer.from(ivHex, 'hex');
      const decipher = crypto.createDecipheriv(this.algorithm, this._getEncryptionKey(), iv);
      let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (err) {
      return '[ERRO DE DECRIPTOGRAFIA]';
    }
  }

  public getChannels(): MessageChannel[] {
    return this.channels;
  }

  public getMessages(channelId: string): (SecureMessage & { decryptedContent: string })[] {
    return this.secureMessages
      .filter(m => m.channelId === channelId || (channelId === 'gen' && m.recipient === 'Todos'))
      .map(m => ({
        ...m,
        decryptedContent: this.decrypt(m.content, m.iv || '')
      }));
  }

  public sendMessage(msg: Partial<SecureMessage>) {
    const rawContent = msg.content || '';
    const { content, iv } = this.encrypt(rawContent);

    const fullMsg: SecureMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      sender: msg.sender || 'System',
      recipient: msg.recipient || 'All',
      content: content,
      timestamp: Date.now(),
      encrypted: true,
      iv: iv,
      priority: msg.priority || 'normal',
      isSilentAlarm: msg.isSilentAlarm,
      channelId: msg.channelId || 'gen'
    };

    this.secureMessages.push(fullMsg);
    
    // Memory Leak Protection: Limit cache size
    if (this.secureMessages.length > this.MAX_MESSAGES_CACHE) {
      this.secureMessages = this.secureMessages.slice(-this.MAX_MESSAGES_CACHE);
    }
    this.emit('new-message', {
      ...fullMsg,
      decryptedContent: rawContent
    });

    if (msg.isSilentAlarm) {
      this.emit('silent-alarm', fullMsg);
    }
  }

  /**
   * Envia uma mensagem direta para o pai/responsável do aluno
   * @param studentId ID do aluno cujos pais serão notificados
   * @param message Conteúdo da mensagem
   */
  public async sendMessageToParent(studentId: string, message: string): Promise<void> {
    this.sendMessage({
      sender: 'Sistema Áquila',
      recipient: `Resp-${studentId}`,
      content: message,
      priority: 'high',
      channelId: 'sec' // Secretaria/Segurança
    });
    console.log(`[CommHub] Notificando responsáveis do aluno ${studentId}: ${message}`);
  }
}

export const communicationHubService = new CommunicationHubService();

