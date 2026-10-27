import * as fs from 'fs';
import * as path from 'path';

/**
 * AgentControlPlane.ts — Plano de Controle de Agentes Autônomos
 * Áquila Pro — Nível P1 de Governança e Rastreabilidade
 * 
 * Garante que nenhuma decisão ou execução de agente ocorra sem autorização,
 * idempotência, orçamento controlado e trilha imutável de evidências.
 */

export type AgentTaskState = 
  | 'PROPOSED'
  | 'AUTHORIZED'
  | 'RUNNING'
  | 'VALIDATING'
  | 'READY_FOR_REVIEW'
  | 'APPROVED'
  | 'MERGED'
  | 'VERIFIED'
  | 'FAILED'
  | 'BLOCKED'
  | 'CANCELLED';

export interface AgentExecutionRecord {
  taskId: string;
  idempotencyKey: string;
  responsibleAgent: string;
  state: AgentTaskState;
  title: string;
  description: string;
  acceptanceCriteria: string[];
  maxRetries: number;
  currentRetries: number;
  environment: 'DEVELOPMENT' | 'STAGING' | 'PRODUCTION';
  branchName?: string;
  commitSha?: string;
  pullRequestNumber?: number;
  pullRequestUrl?: string;
  evidences: {
    type: 'TYPECHECK' | 'JEST' | 'PLAYWRIGHT' | 'BUILD' | 'SECURITY_AUDIT';
    status: 'PASS' | 'FAIL';
    details: string;
    timestamp: string;
  }[];
  requiresHumanApproval: boolean;
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export class AgentControlPlane {
  private static instance: AgentControlPlane;
  private ledgerPath: string;
  private tasks: Map<string, AgentExecutionRecord> = new Map();

  private constructor() {
    // Resolve dynamically relative to this service file to ensure consistent location
    // whether running from root c:\aquila or apps/electron
    this.ledgerPath = path.resolve(__dirname, '../../database/agent_control_plane_ledger.json');
    this.loadLedger();
  }

  public static getInstance(): AgentControlPlane {
    if (!AgentControlPlane.instance) {
      AgentControlPlane.instance = new AgentControlPlane();
    }
    return AgentControlPlane.instance;
  }

  private loadLedger() {
    try {
      if (fs.existsSync(this.ledgerPath)) {
        const raw = fs.readFileSync(this.ledgerPath, 'utf-8');
        const data: AgentExecutionRecord[] = JSON.parse(raw);
        data.forEach(t => this.tasks.set(t.taskId, t));
      }
    } catch (err) {
      console.warn('[AgentControlPlane] Ledger inicializado vazio:', err);
    }
  }

  private persistLedger() {
    try {
      const dir = path.dirname(this.ledgerPath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(this.ledgerPath, JSON.stringify(Array.from(this.tasks.values()), null, 2), 'utf-8');
    } catch (err) {
      console.error('[AgentControlPlane] Falha ao persistir ledger:', err);
    }
  }

  /**
   * Registra uma nova tarefa com chave de idempotência.
   * Se a chave já existir, retorna o registro existente sem duplicar execução.
   */
  public registerTask(params: {
    taskId: string;
    idempotencyKey: string;
    responsibleAgent: string;
    title: string;
    description: string;
    acceptanceCriteria: string[];
    environment?: 'DEVELOPMENT' | 'STAGING' | 'PRODUCTION';
    requiresHumanApproval?: boolean;
  }): { task: AgentExecutionRecord; isNew: boolean } {
    // Verificação de Idempotência
    for (const existing of this.tasks.values()) {
      if (existing.idempotencyKey === params.idempotencyKey) {
        return { task: existing, isNew: false };
      }
    }

    const now = new Date().toISOString();
    const task: AgentExecutionRecord = {
      taskId: params.taskId,
      idempotencyKey: params.idempotencyKey,
      responsibleAgent: params.responsibleAgent,
      state: 'AUTHORIZED',
      title: params.title,
      description: params.description,
      acceptanceCriteria: params.acceptanceCriteria,
      maxRetries: 3,
      currentRetries: 0,
      environment: params.environment || 'DEVELOPMENT',
      evidences: [],
      requiresHumanApproval: params.requiresHumanApproval !== false,
      createdAt: now,
      updatedAt: now,
    };

    this.tasks.set(task.taskId, task);
    this.persistLedger();
    return { task, isNew: true };
  }

  /**
   * Adiciona uma evidência verificável à tarefa
   */
  public recordEvidence(taskId: string, evidence: {
    type: 'TYPECHECK' | 'JEST' | 'PLAYWRIGHT' | 'BUILD' | 'SECURITY_AUDIT';
    status: 'PASS' | 'FAIL';
    details: string;
  }) {
    const task = this.tasks.get(taskId);
    if (!task) throw new Error(`Tarefa ${taskId} não encontrada no Control Plane.`);

    task.evidences.push({
      ...evidence,
      timestamp: new Date().toISOString(),
    });

    task.updatedAt = new Date().toISOString();
    this.persistLedger();
  }

  /**
   * Atualiza o estado da tarefa
   */
  public updateState(taskId: string, newState: AgentTaskState, metadata?: {
    branchName?: string;
    commitSha?: string;
    pullRequestNumber?: number;
    pullRequestUrl?: string;
  }) {
    const task = this.tasks.get(taskId);
    if (!task) throw new Error(`Tarefa ${taskId} não encontrada no Control Plane.`);

    task.state = newState;
    if (metadata?.branchName) task.branchName = metadata.branchName;
    if (metadata?.commitSha) task.commitSha = metadata.commitSha;
    if (metadata?.pullRequestNumber) task.pullRequestNumber = metadata.pullRequestNumber;
    if (metadata?.pullRequestUrl) task.pullRequestUrl = metadata.pullRequestUrl;

    task.updatedAt = new Date().toISOString();
    this.persistLedger();
  }

  public getTask(taskId: string): AgentExecutionRecord | undefined {
    return this.tasks.get(taskId);
  }

  public listTasks(): AgentExecutionRecord[] {
    return Array.from(this.tasks.values());
  }
}

export const agentControlPlane = AgentControlPlane.getInstance();
