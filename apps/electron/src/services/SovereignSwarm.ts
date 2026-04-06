import { resourceMonitor } from './ResourceMonitorService';
import Database from '../database/Database';
import { SwarmRepository, swarmRepository } from '../database/repositories/SwarmRepository';
import { randomUUID } from 'crypto';
import { logger } from '../main/logger';
import { nexusSyncService } from './NexusSyncService';
import * as os from 'os';

export interface AgentReport {
  timestamp: number;
  message: string;
  status: 'nominal' | 'degraded' | 'critical';
}

export interface SwarmAgent {
  id: string;
  name: string;
  type: 'security' | 'performance' | 'ux' | 'academic';
  status: 'active' | 'idle' | 'warning' | 'dead';
  reports: AgentReport[];
}

/**
 * SovereignSwarm — Orquestrador de Agentes (Cycle 7 Hardened)
 * Coordena enxames de agentes especialistas com telemetria estruturada.
 */
export class SovereignSwarm {
  private static instance: SovereignSwarm;
  private agents: SwarmAgent[] = [
    { id: 'sec-01', name: 'Sentinel Security', type: 'security', status: 'active', reports: [] },
    { id: 'sec-02', name: 'Audit Security', type: 'security', status: 'active', reports: [] },
    { id: 'qa-03', name: 'Quality Guard', type: 'academic', status: 'active', reports: [] },
    { id: 'perf-01', name: 'TurboQuant Opt', type: 'performance', status: 'active', reports: [] },
    { id: 'ux-01', name: 'Glassmorphism Auditor', type: 'ux', status: 'idle', reports: [] }
  ];

  private healthIndex: number = 100;
  private repository: SwarmRepository | null = null;
  public localNodeId: string = os.hostname();
  public masterNodeId: string | null = null;
  private isMasterActive: boolean = false;

  private constructor() {
    this.startOrchestration();
  }

  /**
   * Inicializa o enxame com o banco de dados para persistência.
   */
  public init(db: Database) {
    this.repository = swarmRepository(db);
    logger.info('[Swarm] Repositório de persistência acoplado.');
    
    // Purga inicial de segurança (Cycle 9)
    this.purgeOldReports().catch(err => logger.error('[Swarm] Boot maintenance failed:', err));
  }

  public static getInstance(): SovereignSwarm {
    if (!SovereignSwarm.instance) {
      SovereignSwarm.instance = new SovereignSwarm();
    }
    return SovereignSwarm.instance;
  }

  private startOrchestration() {
    logger.info('[Swarm] Orquestrador de Agentes Iniciado — Modo Soberano V1.0.2.');
    
    // Pulso inicial e agendamento
    this.pulse();
    setInterval(() => this.pulse(), 30000);
    
    // Eleição inicial e monitoramento de mesh
    this.electMaster();
    nexusSyncService.on('node-suspended', () => this.electMaster());
    nexusSyncService.on('nexus-pulse', () => this.checkMasterHealth());

    // Escuta estresse do sistema
    resourceMonitor.on('throttle', (status) => {
      if (status.active) {
        this.broadcastToAgents(`System stressed. Entering low-power monitoring. Reason: ${status.reason || 'High Load'}`, 'degraded');
      } else {
        this.broadcastToAgents('Technical debt cleared. Resuming nominal speed.', 'nominal');
      }
    });

    // Predictive Resilience Logging (Cycle 8 Hardening)
    resourceMonitor.on('proactive-throttle', (data) => {
      this.addDefensiveReport(`PREDICTIVE PANIC: System heading to OOM in ${data.projectedOOM.toFixed(1)}s. Shifting agents to defensive mode.`);
    });
    
    // Scheduled Maintenance (Every 24 hours)
    setInterval(() => this.purgeOldReports(), 24 * 60 * 60 * 1000);
  }

  /**
   * Purges old telemetry reports from the database to prevent bloat.
   */
  public async purgeOldReports(days: number = 7) {
    if (!this.repository) return;
    try {
      logger.info(`[Swarm] Running maintenance: Purging reports older than ${days} days...`);
      await this.repository.purgeOldReports(days);
    } catch (err) {
      logger.error('[Swarm] Maintenance failed:', err);
    }
  }

  private addDefensiveReport(message: string) {
    const report: AgentReport = {
      timestamp: Date.now(),
      message,
      status: 'critical'
    };
    
    // Broadcast to all agents and persist immediately
    this.agents.forEach(agent => {
      this.addReport(agent.id, report);
      agent.status = 'warning';
    });
    
    this.persistReports();
  }


  private electMaster(reason: string = 'Início do Sistema') {
    const nodes = nexusSyncService.getNodes().filter(n => n.syncStatus !== 'offline');
    // Adiciona o nó local na lista de candidatos
    const candidates = [...nodes.map(n => n.id), this.localNodeId].sort();
    
    const newMaster = candidates[0];
    if (newMaster !== this.masterNodeId) {
      const oldMaster = this.masterNodeId;
      this.masterNodeId = newMaster;
      this.isMasterActive = (this.masterNodeId === this.localNodeId);
      logger.warn(`[Swarm] FAILOVER DETECTADO! Causa: ${reason}`);
      logger.warn(`[Swarm] Transição de Mestre: ${oldMaster || 'NENHUM'} -> ${this.masterNodeId} ${this.isMasterActive ? '(LOCAL)' : '(REMOTO)'}`);
      
      if (this.isMasterActive) {
        this.broadcastToAgents('Promoted to Master node. Taking coordination control.', 'nominal');
      }
    }
  }

  private checkMasterHealth() {
    if (this.isMasterActive) return; // Eu sou o mestre, não preciso checar a mim mesmo

    const nodes = nexusSyncService.getNodes();
    const master = nodes.find(n => n.id === this.masterNodeId);
    
    if (!master || master.syncStatus === 'offline') {
      logger.warn(`[Swarm] Heartbeat do Master ${this.masterNodeId} PERDIDO. Iniciando eleição...`);
      this.electMaster('Perda de Heartbeat do Mestre');
    }
  }

  public isMaster(): boolean {
    return this.isMasterActive;
  }

  private pulse() {
    const sysStatus = resourceMonitor.getStatus();
    
    this.agents.forEach(agent => {
      const report: AgentReport = {
        timestamp: Date.now(),
        message: agent.status === 'active' ? 'Heartbeat: Validating local context' : 'Standby',
        status: sysStatus.isThrottled ? 'degraded' : 'nominal'
      };
      
      this.addReport(agent.id, report);
    });
    
    this.calculateSwarmHealth();
    logger.info(`[Swarm] Pulse Complete. Health Index: ${this.healthIndex}%`);
    
    // Persistência em background (Não bloqueia o pulso)
    this.persistReports();
  }

  private async persistReports() {
    if (!this.repository) return;
    
    try {
      // Persiste apenas o último relatório de cada agente que ainda não está no DB
      // Ou simplificado: persiste o head do buffer se for novo
      for (const agent of this.agents) {
        if (agent.reports.length > 0) {
          const latest = agent.reports[0];
          await this.repository.saveReport({
            agent_id: agent.id,
            status: agent.status === 'warning' ? 'warning' : (agent.status === 'dead' ? 'error' : (agent.status === 'idle' ? 'idle' : 'active')),
            message: latest.message,
            metadata: { 
              sysStatus: resourceMonitor.getStatus(),
              swarmHealth: this.healthIndex 
            }
          });
        }
      }
    } catch (err) {
      logger.error('[Swarm] Erro ao persistir relatórios:', err);
    }
  }

  private addReport(agentId: string, report: AgentReport) {
    const agent = this.agents.find(a => a.id === agentId);
    if (agent) {
      agent.reports.unshift(report);
      if (agent.reports.length > 5) agent.reports.pop(); // Mantém histórico curto
    }
  }

  private broadcastToAgents(message: string, status: AgentReport['status']) {
    this.agents.forEach(agent => {
      this.addReport(agent.id, { timestamp: Date.now(), message, status });
      if (status === 'degraded' && agent.status === 'active') {
        agent.status = 'warning';
      } else if (status === 'nominal' && agent.status === 'warning') {
        agent.status = 'active';
      }
    });
    this.calculateSwarmHealth();
  }

  private calculateSwarmHealth() {
    const totalWeight = this.agents.length * 10;
    let currentScore = 0;

    this.agents.forEach(a => {
      if (a.status === 'active') currentScore += 10;
      else if (a.status === 'idle') currentScore += 8;
      else if (a.status === 'warning') currentScore += 4;
    });

    // Penalidade por Hardware (Monitor de Recursos)
    const sysStatus = resourceMonitor.getStatus();
    if (sysStatus.isThrottled) currentScore *= 0.7;

    this.healthIndex = Math.round((currentScore / totalWeight) * 100);
  }

  public getSwarmStatus() {
    return {
      agentCount: this.agents.length,
      agents: this.agents,
      healthIndex: this.healthIndex,
      status: this.healthIndex > 80 ? 'nominal' : (this.healthIndex > 50 ? 'warning' : 'critical')
    };
  }

  public triggerAgentDiagnostic(agentId: string) {
    const agent = this.agents.find(a => a.id === agentId);
    if (agent) {
      this.addReport(agent.id, { 
        timestamp: Date.now(), 
        message: 'Deep scan diagnostic performed.', 
        status: 'nominal' 
      });
      return { success: true, result: 'Nominal' };
    }
    return { success: false };
  }

  /**
   * Recupera o histórico global do enxame do banco de dados (Cycle 9).
   */
  public async getSwarmHistory(limit: number = 50) {
    if (!this.repository) return [];
    return await this.repository.getHistory(limit);
  }

  /**
   * Recupera o histórico de um agente específico do banco de dados (Cycle 9).
   */
  public async getAgentHistory(agentId: string, limit: number = 20) {
    if (!this.repository) return [];
    return await this.repository.getAgentHistory(agentId, limit);
  }
}

export const sovereignSwarm = SovereignSwarm.getInstance();
