import Logger from './Logger';
import { OllamaIntegration } from './OllamaIntegration';
import { hrSovereigntyService } from './HRSovereigntyService';
import { aiFlowManager } from './AIFlowManager';
import { StaffRecord, StaffRole, SmartMessage } from './AiTypes';
import { EventEmitter } from 'events';
import { MessageRepository } from '../database/repositories/MessageRepository';

/**
 * EagleMessengerService (v3461)
 * AI-powered smart communication between school departments and Swarm P2P events.
 */
export class EagleMessengerService extends EventEmitter {
  private logger: Logger;
  private ollama: OllamaIntegration;
  private repository: MessageRepository | null = null;
  private priorityBuffer: SmartMessage[] = [];

  constructor(ollama: OllamaIntegration, repository: MessageRepository) {
    super();
    this.logger = new Logger('EagleMessenger');
    this.ollama = ollama;
    this.repository = repository;
  }

  /**
   * Adapts a message based on sender and recipient roles and sends it.
   */
  public async sendSmartMessage(senderId: string, recipientId: string, originalContent: string): Promise<SmartMessage> {
    const sender = await hrSovereigntyService.getStaffById(senderId);
    const recipient = await hrSovereigntyService.getStaffById(recipientId);

    if (!sender || !recipient) {
      throw new Error('Sender or Recipient not found in HR registry.');
    }

    this.logger.info(`Adapting message from ${sender.role} to ${recipient.role}`);

    const adaptedContent = await this.adaptMessage(sender.role, recipient.role, originalContent);

    const message: SmartMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      senderId,
      senderRole: sender.role,
      recipientId,
      originalContent,
      adaptedContent,
      timestamp: Date.now(),
      status: 'pending',
      priority: sender.role === 'ADMIN' ? 10 : 1
    };

    // 1. Persiste no buffer local (SQLite)
    if (this.repository) {
      await this.repository.saveMessage(message);
    }

    // 2. Tenta despacho imediato para o Swarm Node
    if (recipient.nodeId) {
      try {
        this.logger.info(`Attempting immediate dispatch to node ${recipient.nodeId}`);
        // Logica de rede real (WebSocket/HTTP) viria aqui via SovereignSwarm
        // Simulando sucesso imediato
        if (this.repository) {
          await this.repository.updateMessageStatus(message.id, 'sent');
        }
        message.status = 'sent';
      } catch (err) {
        this.logger.warn(`Immediate dispatch failed for ${message.id}. Saved for retry.`);
      }
    }

    return message;
  }

  /**
   * Tenta reenviar todas as mensagens pendentes no banco.
   */
  public async flushOfflineBuffer(): Promise<void> {
    if (!this.repository) return;

    this.logger.info('Starting scheduled message flush...');
    const pending = await this.repository.getPendingMessages(50);
    
    if (pending.length === 0) return;

    for (const msg of pending) {
      try {
        // Lógica de reenvio P2P (Simulada por hora)
        this.logger.info(`Retrying pulse for message ${msg.id} (Prio: ${msg.priority})`);
        
        // Em um sistema real, aqui verificaríamos conectividade com o nó destino
        await this.repository.updateMessageStatus(msg.id, 'sent');
      } catch (err) {
        this.logger.error(`Flush failed for message ${msg.id}:`, err);
        await this.repository.updateMessageStatus(msg.id, 'failed');
      }
    }
  }

  /**
   * Broadcasts an adapted message to all staff in a specific role.
   */
  public async broadcastToRole(senderId: string, targetRole: StaffRole, originalContent: string): Promise<SmartMessage[]> {
    const sender = await hrSovereigntyService.getStaffById(senderId);
    if (!sender) throw new Error('Sender not found.');

    const recipients = await hrSovereigntyService.getStaffByRole(targetRole);
    this.logger.info(`Broadcasting to ${recipients.length} recipients with role ${targetRole}`);

    // Adapt message once or per recipient (once is more efficient for generic broadcasts)
    const adaptedContent = await this.adaptMessage(sender.role, targetRole, originalContent);

    const messages = recipients.map(r => ({
      id: `broadcast_${Date.now()}_${r.id}`,
      senderId,
      senderRole: sender.role,
      recipientId: r.id,
      originalContent,
      adaptedContent,
      timestamp: Date.now()
    }));

    return messages;
  }

  /**
   * Broadcasts a generic data event to all nodes in the local swarm.
   */
  public async broadcastSwarmSync(type: string, data: any): Promise<void> {
    this.logger.info(`Broadcasting swarm sync event: ${type}`);
    // Inter-process/Inter-node communication would be handled by SovereignSwarm
    // Here we emit locally so other services can react or bridge to the network
    this.emit(`swarm:${type}`, data);
  }

  /**
   * Requests data from the swarm and waits for responses (with timeout).
   */
  public async requestSwarmData<T>(type: string, query: any, timeoutMs: number = 3000): Promise<T[]> {
    return new Promise((resolve) => {
      const results: T[] = [];
      const timer = setTimeout(() => {
        this.removeListener(`swarm:${type}:response`, handleResponse);
        resolve(results);
      }, timeoutMs);

      const handleResponse = (data: T) => {
        results.push(data);
      };

      this.on(`swarm:${type}:response`, handleResponse);
      this.broadcastSwarmSync(type, query);
    });
  }

  private async adaptMessage(senderRole: StaffRole, recipientRole: StaffRole, content: string): Promise<string> {
    let toneInstruction = '';

    if (senderRole === 'TEACHER' && recipientRole === 'JANITOR') {
      toneInstruction = 'Adapte para uma Ordem de Serviço prática, clara e objetiva. Inclua prioridade e local se mencionado.';
    } else if (senderRole === 'HR' && recipientRole === 'TEACHER') {
      toneInstruction = 'Adapte para um comunicado oficial formal, encorajador e educado, solicitando ação imediata.';
    } else {
      toneInstruction = 'Mantenha um tom profissional e adaptado ao contexto escolar.';
    }

    const prompt = `[SISTEMA DE MENSAGENS ÁQUILA PRO]
Você é um mediador de comunicação escolar.
DE: ${senderRole}
PARA: ${recipientRole}
INSTRUÇÃO: ${toneInstruction}

MENSAGEM ORIGINAL: "${content}"

ESCREVA APENAS A MENSAGEM ADAPTADA ABAIXO:`;

    try {
      const result = await this.ollama.generate(prompt);
      return result.trim();
    } catch (err) {
      this.logger.error('Failed to adapt message with AI:', err);
      return content; // Fallback
    }
  }
}

// Singleton instantiation happens in main.ts with correct dependencies
