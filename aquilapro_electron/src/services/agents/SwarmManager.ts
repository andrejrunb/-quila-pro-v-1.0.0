import { BaseAgent } from './BaseAgent';
import { EventEmitter } from 'events';

/**
 * SwarmManager: Orquestrador central dos agentes.
 * Coordena o Shared Blackboard e roteia eventos.
 */
export class SwarmManager extends EventEmitter {
  private agents: Map<string, BaseAgent> = new Map();
  private blackboard: Map<string, any> = new Map();

  constructor() {
    super();
  }

  /**
   * Registra um novo agente no enxame.
   */
  public registerAgent(agent: BaseAgent): void {
    this.agents.set(agent.id, agent);
    console.log(`[Swarm] Agente registrado: ${agent.name} (${agent.id})`);
    
    agent.on('memory:updated', (data) => {
      this.emit('agent:activity', data);
    });

    agent.on('error', (data) => {
      this.emit('swarm:error', data);
    });
  }

  /**
   * Transmite um evento para todos os agentes de forma assíncrona, aguardando a percepção.
   */
  public async broadcast(event: string, data: any): Promise<void> {
    console.log(`[Swarm] Broadcast: ${event}`);
    this.blackboard.set(`last_event_${event}`, { data, timestamp: new Date() });
    
    const promises = Array.from(this.agents.values()).map(agent => 
      agent.perceive(event, data).catch(err => {
        console.error(`Error broadcasting to ${agent.id}:`, err);
      })
    );
    
    await Promise.all(promises);
  }

  /**
   * Atualiza o Quadro Negro Compartilhado (Shared Blackboard).
   */
  public updateBlackboard(key: string, value: any): void {
    this.blackboard.set(key, value);
    this.emit('blackboard:updated', { key, value });
  }

  public getFromBlackboard(key: string): any {
    return this.blackboard.get(key);
  }

  public getAgentsStatus() {
    const stats: any = {};
    for (const agent of this.agents.values()) {
      stats[agent.id] = {
        name: agent.name,
        status: agent.getStatus(),
        memoryCount: agent.getMemory().length
      };
    }
    return stats;
  }
}

export const swarmManager = new SwarmManager();
