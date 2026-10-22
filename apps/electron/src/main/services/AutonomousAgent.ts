import { BaseAgent, AgentIntent, AgentStatus } from './agents/BaseAgent';
import { AgentRole, AgentTask, AGENT_DEFINITIONS } from '../../services/AgentDefinitions';
import { SubAgent, SubAgentDefinition } from './SubAgent';
import { haloTraceRegistry } from './HaloTraceRegistry';
import { v4 as uuidv4 } from 'uuid';

/**
 * AutonomousAgent (v1638)
 * Base class for the 9 Hub Agents.
 * Supports dynamic spawning of specialized sub-teams (up to 10 members).
 */
export abstract class AutonomousAgent extends BaseAgent {
  public readonly role: AgentRole;
  public readonly specialization: string;
  public readonly teamId: 'SECURITY' | 'PEDAGOGY' | 'OPERATIONS';
  protected activeTasks: AgentTask[] = [];
  protected memoryBuffer: string[] = [];
  protected subAgents: Map<string, SubAgent> = new Map();
  protected currentTraceId: string | null = null;

  constructor(role: AgentRole, teamId: 'SECURITY' | 'PEDAGOGY' | 'OPERATIONS') {
    super(role, role); // Usando role como ID e Nome para compatibilidade
    this.role = role;
    this.teamId = teamId;
    this.specialization = AGENT_DEFINITIONS[role].specialization;
  }

  /**
   * Perceber (BaseAgent): Implementação que delega para o antigo 'think' (mais contextual).
   */
  public async perceive(event: string, data: any): Promise<void> {
    this.currentTraceId = uuidv4();
    const spanId = haloTraceRegistry.startSpan({
      agentId: this.id,
      name: 'perceive',
      stepType: 'perception',
      input: { event, data },
      traceId: this.currentTraceId
    });

    try {
      this.log(`Perceived event: ${event}`);
      await this.thinkHub(data);
      haloTraceRegistry.endSpan(spanId, { status: 'success' });
    } catch (error: any) {
      haloTraceRegistry.endSpan(spanId, null, error.message);
      throw error;
    }
  }

  /**
   * Antigo método 'think' da AutonomousAgent, renomeado para evitar conflito.
   */
  public abstract thinkHub(context: any): Promise<void>;

  /**
   * Implementação obrigatória da BaseAgent (Pensar Interno).
   * No modelo Hub, o pensamento gera tarefas para sub-agentes.
   */
  protected async think(): Promise<AgentIntent | null> {
    // Por enquanto, o ciclo PTA é simplificado no modelo Hub
    return null;
  }

  /**
   * Implementação obrigatória da BaseAgent (Agir).
   */
  protected async act(intent: AgentIntent): Promise<void> {
    this.log(`Acting on intent: ${intent.action}`);
  }

  /**
   * Spawns a dedicated sub-agent for a specific task.
   * Max 10 per Hub.
   */
  protected spawnSubAgent(def: SubAgentDefinition): SubAgent | null {
    if (this.subAgents.size >= 10) {
      this.remember('Maximum sub-agent capacity reached (10). Cannot spawn more.');
      return null;
    }

    const subId = `${this.role}_SUB_${Date.now()}_${this.subAgents.size}`;
    const newSub: SubAgent = {
      id: subId,
      role: def.role,
      parentRole: this.role,
      mission: def.mission,
      status: 'ACTIVE',
      execute: async (p) => {
        const subSpanId = haloTraceRegistry.startSpan({
          agentId: subId,
          name: `subagent_execution:${def.role}`,
          stepType: 'subtask',
          input: p,
          parentId: undefined, // Or pass parent span if we track it
          traceId: this.currentTraceId || uuidv4()
        });
        try {
          const res = await def.logic(p, (m) => this.log(`[SUB:${def.role}] ${m}`));
          haloTraceRegistry.endSpan(subSpanId, res);
          return res;
        } catch (err: any) {
          haloTraceRegistry.endSpan(subSpanId, null, err.message);
          throw err;
        }
      }
    };

    this.subAgents.set(subId, newSub);
    this.remember(`Spawned specialized sub-agent: ${def.role} (Mission: ${def.mission})`);
    return newSub;
  }

  protected terminateSubAgent(id: string) {
    this.subAgents.delete(id);
    this.remember(`Terminated sub-agent: ${id}`);
  }

  public async handleTask(task: AgentTask): Promise<void> {
    const spanId = haloTraceRegistry.startSpan({
      agentId: this.id,
      name: `handle_task:${task.id}`,
      stepType: 'subtask',
      input: task,
      traceId: this.currentTraceId || uuidv4()
    });

    this.log(`Received Hub-level task: ${task.description}`);
    this.activeTasks.push({ ...task, status: 'IN_PROGRESS' });
    
    try {
      await this.executeTaskLogic(task);
      this.updateTaskStatus(task.id, 'COMPLETED');
      haloTraceRegistry.endSpan(spanId, { status: 'completed' });
    } catch (error: any) {
       console.error(`[${this.role}] Hub task failed:`, error);
       this.updateTaskStatus(task.id, 'FAILED');
       haloTraceRegistry.endSpan(spanId, null, error.message);
    }
  }

  protected abstract executeTaskLogic(task: AgentTask): Promise<void>;

  protected updateTaskStatus(taskId: string, status: AgentTask['status']) {
    const task = this.activeTasks.find(t => t.id === taskId);
    if (task) task.status = status;
  }

  protected log(message: string) {
    console.log(`%c[${this.role} HUB]`, 'color: #3b82f6; font-weight: bold', message);
    this.remember(message); // Integrar com a memória da BaseAgent
  }

  /**
   * Implementação do status básico (BaseAgent).
   */
  public getStatus(): AgentStatus {
    return super.getStatus();
  }

  /**
   * Status rico específico para Agentes Hub (Onda 3).
   */
  public getHubStatus() {
    return {
      role: this.role,
      teamId: this.teamId,
      specialization: this.specialization,
      subAgentCount: this.subAgents.size,
      pendingTasks: this.activeTasks.filter(t => t.status === 'PENDING' || t.status === 'IN_PROGRESS').length
    };
  }
}

