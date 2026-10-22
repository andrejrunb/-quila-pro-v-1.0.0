import { logger } from '../../logger';
import { sovereignMcpService } from '../SovereignMcpService';
import { db } from '../../../database/Database';

export interface SwarmTask {
  id: string;
  name: string;
  description: string;
  tool: string;
  arguments: any;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: any;
  planId?: string;
  reflection?: string;
  executedAt?: number;
}

/**
 * SwarmTaskScheduler (Nível 22)
 * Gerencia a fila de tarefas autônomas do enxame Áquila.
 */
export class SwarmTaskScheduler {
  private static instance: SwarmTaskScheduler;
  private tasks: SwarmTask[] = [];

  private constructor() {
    this.startProcessingLoop();
  }

  public static getInstance(): SwarmTaskScheduler {
    if (!SwarmTaskScheduler.instance) {
      SwarmTaskScheduler.instance = new SwarmTaskScheduler();
    }
    return SwarmTaskScheduler.instance;
  }

  /**
   * Adiciona uma tarefa à fila do enxame
   */
  public async scheduleTask(task: Omit<SwarmTask, 'status' | 'id'>): Promise<string> {
    const taskId = `TASK-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const newTask: SwarmTask = {
      ...task,
      id: taskId,
      status: 'pending'
    };

    this.tasks.push(newTask);
    logger.info(`[SwarmTask] Tarefa agendada: ${task.name} (${taskId})`);
    
    // Persistência em auditoria (Opcional: implementar tabela swarm_tasks se necessário)
    
    return taskId;
  }

  /**
   * Loop de processamento autônomo
   */
  private async startProcessingLoop() {
    setInterval(async () => {
      const nextTask = this.tasks.find(t => t.status === 'pending');
      if (nextTask) {
        await this.executeTask(nextTask);
      }
    }, 10000); // Processa a cada 10 segundos
  }

  private async executeTask(task: SwarmTask) {
    task.status = 'running';
    logger.warn(`[SwarmTask] Executando: ${task.name}...`);

    try {
      // Executa via MCP
      const result = await sovereignMcpService.executeTool(task.tool, task.arguments);
      
      task.status = 'completed';
      task.result = result;
      task.executedAt = Date.now();
      task.reflection = `Execução bem-sucedida. Impacto nominal atingido.`;
      
      logger.info(`[SwarmTask] Tarefa concluída: ${task.name}`);
    } catch (err) {
      task.status = 'failed';
      task.result = err instanceof Error ? err.message : String(err);
      task.reflection = `Falha na execução: ${task.result}. Necessário intervenção ou retentativa.`;
      logger.error(`[SwarmTask] Falha na tarefa ${task.name}: ${task.result}`);
    }
  }

  public getTasks() {
    return this.tasks;
  }
}

export const swarmTaskScheduler = SwarmTaskScheduler.getInstance();
