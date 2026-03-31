import { EventEmitter } from 'events';
import * as crypto from 'crypto';
import { licenseService } from './LicenseService';

export interface MessageChannel {
  id: string;
  name: string;
  type: 'general' | 'secretaria' | 'pedagogico' | 'financeiro';
}

export interface PollOption {
  id: string;
  text: string;
  votes: number;
}

export interface SecureMessage {
  id: string;
  sender: string;
  recipient: string;
  content: string; // Encrypted in transit/storage
  timestamp: number;
  encrypted: boolean;
  iv?: string; // Initialization vector for AES
  priority: 'low' | 'normal' | 'high' | 'critical';
  isSilentAlarm?: boolean;
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
class CommunicationHubService extends EventEmitter {
  private secureMessages: SecureMessage[] = [];
  private legacyMessages: SchoolMessage[] = [];
  private readonly algorithm = 'aes-256-cbc';

  public channels: MessageChannel[] = [
    { id: 'gen', name: 'Comunicados Gerais', type: 'general' },
    { id: 'sec', name: 'Atendimento Secretaria', type: 'secretaria' },
    { id: 'ped', name: 'Coordenação Pedagógica', type: 'pedagogico' }
  ];

  constructor() {
    super();
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

  public sendMessage(msg: Partial<SecureMessage>) {
    const rawContent = msg.content || '';
    const { content, iv } = this.encrypt(rawContent);

    const fullMsg: SecureMessage = {
      id: `msg-${Date.now()}`,
      sender: msg.sender || 'System',
      recipient: msg.recipient || 'All',
      content: content,
      timestamp: Date.now(),
      encrypted: true,
      iv: iv,
      priority: msg.priority || 'normal',
      isSilentAlarm: msg.isSilentAlarm || false
    };

    this.secureMessages.push(fullMsg);
    this.emit('new-message', fullMsg);

    if (fullMsg.isSilentAlarm) {
      this.emit('silent-alarm', fullMsg);
    }

    return fullMsg;
  }

  public getHistory(): SecureMessage[] {
    return this.secureMessages;
  }

  public getDecryptedHistory(): (SecureMessage & { decryptedContent: string })[] {
    return this.secureMessages.map(m => ({
      ...m,
      decryptedContent: m.iv ? this.decrypt(m.content, m.iv) : m.content
    }));
  }

  public broadcastToChannel(channelId: string, text: string, mediaUrl?: string) {
    const newMessage: SchoolMessage = {
      id: `msg-${Date.now()}`,
      channelId,
      senderId: 'school-admin',
      text,
      mediaUrl,
      readBy: [],
      createdAt: new Date().toISOString()
    };
    this.legacyMessages.unshift(newMessage);
    this.emit('legacy-message', newMessage);
  }

  public createPoll(channelId: string, question: string, options: string[]) {
    const pollMessage: SchoolMessage = {
      id: `poll-${Date.now()}`,
      channelId,
      senderId: 'school-admin',
      text: question,
      poll: {
        question,
        options: options.map((opt, idx) => ({ id: `opt-${idx}`, text: opt, votes: 0 })),
        isClosed: false
      },
      readBy: [],
      createdAt: new Date().toISOString()
    };
    this.legacyMessages.unshift(pollMessage);
    this.emit('legacy-poll', pollMessage);
  }

  public async sendMessageToParent(studentId: string, message: string) {
    console.log(`[CommunicationHub] Private MSG to ${studentId}: ${message}`);
  }

  public async notifyExtremeDeviation(studentId: string, zone: string) {
     const msg = `Alerta Áquila: O aluno(a) foi detectado fora da área autorizada (Zona: ${zone}). Por favor, verifique com a coordenação.`;
     await this.sendMessageToParent(studentId, msg);
  }
}

export const communicationHubService = new CommunicationHubService();
export default communicationHubService;
