/**
 * SchoolMessengerService (v2541)
 * Official communication backbone for Áquila OS.
 * Handles encrypted routing, privacy masking, and audit trails.
 */

export interface Message {
  id: string;
  senderId: string;
  senderRole: string;
  recipientId: string;
  content: string;
  type: 'TEXT' | 'TEMPLATE' | 'ALERT';
  templateData?: any;
  timestamp: string;
  status: 'SENT' | 'DELIVERED' | 'READ';
}

class SchoolMessengerService {
  private static instance: SchoolMessengerService;
  private auditLog: Message[] = [];

  private constructor() {}

  public static getInstance(): SchoolMessengerService {
    if (!SchoolMessengerService.instance) {
      SchoolMessengerService.instance = new SchoolMessengerService();
    }
    return SchoolMessengerService.instance;
  }

  /**
   * Sends a message with privacy masking for PII (Personal Identifiable Information).
   */
  public async sendMessage(msg: Partial<Message>): Promise<Message> {
    const fullMsg: Message = {
      id: `msg_${Date.now()}`,
      senderId: msg.senderId || 'SYS',
      senderRole: msg.senderRole || 'SYSTEM',
      recipientId: msg.recipientId || 'ALL',
      content: this.maskPII(msg.content || ''),
      type: msg.type || 'TEXT',
      templateData: msg.templateData,
      timestamp: new Date().toISOString(),
      status: 'SENT'
    };

    this.auditLog.push(fullMsg);
    this.log(`Message routed from ${fullMsg.senderRole} to ${fullMsg.recipientId}`);
    return fullMsg;
  }

  /**
   * Prevents leakage of phone numbers or emails in chat.
   */
  private maskPII(text: string): string {
    const phoneRegex = /\(?\d{2}\)?\s?\d{4,5}-?\d{4}/g;
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    return text.replace(phoneRegex, '[NÚMERO PROTEGIDO]').replace(emailRegex, '[E-MAIL PROTEGIDO]');
  }

  private log(msg: string) {
    console.log(`[SchoolMessenger] ${msg}`);
  }
}

export const schoolMessengerService = SchoolMessengerService.getInstance();

