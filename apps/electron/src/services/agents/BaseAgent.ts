import { EventEmitter } from 'events';

export type AgentStatus = 'idle' | 'busy' | 'thinking' | 'error';

export interface AgentIntent {
  action: string;
  confidence: number;
  parameters: any;
  reasoning: string;
}

/**
 * Classe Base para Agentes do Áquila Swarm.
 * Implementa o ciclo Perception-Thought-Action (PTA).
 */
export abstract class BaseAgent extends EventEmitter {
  public readonly id: string;
  public readonly name: string;
  protected status: AgentStatus = 'idle';
  protected memory: any[] = [];
  protected maxMemoryItems: number = 50;

  constructor(id: string, name: string) {
    super();
    this.id = id;
    this.name = name;
  }

  public getStatus(): AgentStatus {
    return this.status;
  }

  /**
   * Perceber: Recebe um evento ou dado do ambiente.
   */
  public abstract perceive(event: string, data: any): Promise<void>;

  /**
   * Pensar: Processa o que foi percebido e gera uma intenção.
   */
  protected abstract think(): Promise<AgentIntent | null>;

  /**
   * Agir: Executa a intenção gerada.
   */
  protected abstract act(intent: AgentIntent): Promise<void>;

  /**
   * Ciclo de vida principal do agente.
   */
  protected async processCycle(): Promise<void> {
    if (this.status === 'busy') return;

    try {
      this.status = 'thinking';
      const intent = await this.think();
      
      if (intent && intent.confidence > 0.5) {
        this.status = 'busy';
        await this.act(intent);
        this.remember(`Executed: ${intent.action} (Reason: ${intent.reasoning})`);
      }
      
      this.status = 'idle';
    } catch (error) {
      this.status = 'error';
      this.emit('error', { agent: this.id, error });
      console.error(`Agent ${this.id} error:`, error);
    }
  }

  protected remember(entry: string): void {
    this.memory.push({
      timestamp: new Date(),
      entry
    });
    if (this.memory.length > this.maxMemoryItems) {
      this.memory.shift();
    }
    this.emit('memory:updated', { agent: this.id, entry });
  }

  public getMemory() {
    return this.memory;
  }
}
