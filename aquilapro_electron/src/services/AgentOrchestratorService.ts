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

/**
 * AgentOrchestratorService (v1636-v1638)
 * The Central Nerve Center of the Áquila Pro 'School OS'.
 * Manages 9 autonomous Hub Agent instances.
 */
class AgentOrchestratorService {
  private static instance: AgentOrchestratorService;
  private agents: Map<AgentRole, AutonomousAgent> = new Map();
  private activityLog: any[] = [];

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
   * Initializes the 9 primary Hub instances of the Swarm.
   */
  private initializeSwarm() {
    this.agents.set('ADMIN', new AdminAgent());
    this.agents.set('SECURITY', new SecurityAgent());
    this.agents.set('TOTEM', new ReceptionAgent()); // Hub for Reception
    this.agents.set('TEACHER', new TeacherAgent());
    this.agents.set('STUDENT', new StudentAgent());
    this.agents.set('COORDINATOR', new CoordinatorAgent());
    this.agents.set('SECRETARY', new SecretaryAgent());
    this.agents.set('PARENT', new ParentAgent());
    // Note: Multiple roles can map to different instances or shared ones.
    // Here we add the ArrivalAgent as a secondary TOTEM hub or specialized role.
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
    for (const agent of this.agents.values()) {
      await agent.think(context);
    }
  }

  public getSwarmStatus() {
     const status: any[] = [];
     this.agents.forEach(a => status.push(a.getStatus()));
     return status;
  }

  public getActivityFeed() {
    return [...this.activityLog].reverse();
  }

  public getAgentContext(role: AgentRole) {
    const agent = this.agents.get(role);
    return agent ? agent.getStatus() : null;
  }
}

export const agentOrchestratorService = AgentOrchestratorService.getInstance();
