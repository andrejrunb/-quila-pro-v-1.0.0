import { 
  AgentRole, AgentTask, AGENT_DEFINITIONS 
} from './AgentDefinitions';
import { AutonomousAgent } from './AutonomousAgent';
import { AdminAgent } from './agents/AdminAgent';
import { SecurityAgent } from './agents/SecurityAgent';
import { ReceptionAgent } from './agents/ReceptionAgent';
import { TeacherAgent } from './agents/TeacherAgent';
import { StudentAgent } from './agents/StudentAgent';
import { CoordinatorAgent } from './agents/CoordinatorAgent';
import { SecretaryAgent } from './agents/SecretaryAgent';
import { ParentAgent } from './agents/ParentAgent';
import { ArrivalAgent } from './agents/ArrivalAgent';
import { FinanceAgent } from './agents/FinanceAgent';
import { InfrastructureAgent } from './agents/InfrastructureAgent';
import { wiFiDensePoseService } from './WiFiDensePoseService';

/**
 * AgentOrchestratorService (v1636-v3341)
 * The Central Nerve Center of the Áquila Pro 'School OS'.
 * Manages 9 autonomous Hub Agent instances with Multi-Unit Support.
 */
class AgentOrchestratorService {
  private static instance: AgentOrchestratorService;
  private agents: Map<AgentRole, AutonomousAgent> = new Map();
  private activityLog: any[] = [];
  private currentUnitId: string = 'unit-hq';

  private constructor() {
    this.initializeSwarm();
  }

  public static getInstance(): AgentOrchestratorService {
    if (!AgentOrchestratorService.instance) {
      AgentOrchestratorService.instance = new AgentOrchestratorService();
    }
    return AgentOrchestratorService.instance;
  }

  /**
   * [SQA-NET-915] Altera o contexto operacional do enxame para uma nova unidade.
   */
  public async setUnitContext(unitId: string): Promise<void> {
    if (this.currentUnitId === unitId) return;
    
    console.info(`[SwitchContext] Transição de rede unitária para: ${unitId}`);
    this.currentUnitId = unitId;
    
    // Limpeza parcial do log para focar na nova unidade (v3341)
    this.activityLog = this.activityLog.filter(t => t.to === 'ADMIN'); 
    
    // Notifica todos os agentes sobre a mudança de 'Geofence' lógica
    for (const agent of this.agents.values()) {
        await agent.perceive('UNIT_TRANSITION', { unitId });
    }
  }

  /**
   * Initializes the 9 primary Hub instances of the Swarm.
   */
  private initializeSwarm() {
    this.agents.set('ADMIN', new AdminAgent());
    this.agents.set('SECURITY', new SecurityAgent());
    this.agents.set('TOTEM', new ReceptionAgent()); 
    this.agents.set('TEACHER', new TeacherAgent());
    this.agents.set('STUDENT', new StudentAgent());
    this.agents.set('COORDINATOR', new CoordinatorAgent());
    this.agents.set('SECRETARY', new SecretaryAgent());
    this.agents.set('PARENT', new ParentAgent());
    this.agents.set('PUBLIC', new ArrivalAgent()); 
    this.agents.set('FINANCE', new FinanceAgent());
    this.agents.set('INFRA', new InfrastructureAgent());
  }

  /**
   * Routes a task to the appropriate Hub Agent.
   */
  public async requestTask(task: AgentTask): Promise<void> {
    const agent = this.agents.get(task.to);
    
    this.activityLog.push({
      timestamp: new Date(),
      unitId: this.currentUnitId,
      ...task
    });

    if (agent) {
       await agent.handleTask(task);
    } else {
       console.warn(`[Orchestrator] No agent active for role: ${task.to}`);
    }
  }

  /**
   * Triggers the 'think' loop for all active agents.
   */
  public async pulse(context: any) {
    const ghosts = wiFiDensePoseService.getActiveGhosts();
    const augmentedContext = { ...context, unitId: this.currentUnitId, activeGhosts: ghosts };

    for (const agent of this.agents.values()) {
      await agent.perceive('PULSE', augmentedContext);
    }
  }

  public getSwarmStatus() {
     const status: any[] = [];
     this.agents.forEach(a => status.push(a.getStatus()));
     return status;
  }

  public getActiveTasks(): AgentTask[] {
    // Retorna as tarefas do log que ainda não foram marcadas como COMPLETED ou FAILED
    // Como o log é simples, filtramos os últimos elementos do histórico que simulariam 'em progresso'
    return this.activityLog.filter(t => t.status === 'IN_PROGRESS' || !t.status).slice(-3);
  }

  public getRecentActivity() {
    return [...this.activityLog].reverse();
  }

  public getAgentContext(role: AgentRole) {
    const agent = this.agents.get(role);
    return agent ? agent.getStatus() : null;
  }
}

export const agentOrchestratorService = AgentOrchestratorService.getInstance();
