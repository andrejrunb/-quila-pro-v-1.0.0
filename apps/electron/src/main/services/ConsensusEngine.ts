import { logger } from '../logger';
import { sovereignSwarm, SwarmAgent } from './SovereignSwarm';

export interface Vote {
  agentId: string;
  approval: boolean;
  rationale: string;
  timestamp: number;
}

export interface ConsensusSession {
  id: string;
  action: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  votes: Vote[];
  requiredQuorum: number; // Ex: 0.6 para 60%
  metadata: any;
}

/**
 * ConsensusEngine
 * Motor de decisão coletiva para o Enxame Áquila (Nível 22).
 * Garante que ações críticas tenham aprovação da maioria dos agentes especialistas.
 */
export class ConsensusEngine {
  private static instance: ConsensusEngine;
  private sessions: Map<string, ConsensusSession> = new Map();

  private constructor() {}

  public static getInstance(): ConsensusEngine {
    if (!ConsensusEngine.instance) {
      ConsensusEngine.instance = new ConsensusEngine();
    }
    return ConsensusEngine.instance;
  }

  /**
   * Solicita aprovação para uma ação de alto risco.
   */
  public async requestHighRiskApproval(action: string, metadata: any = {}): Promise<boolean> {
    const sessionId = `CONSENSUS-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    logger.warn(`[Consensus] Solicitando aprovação coletiva para: ${action}`);

    const swarmStatus = sovereignSwarm.getSwarmStatus();
    const activeAgents = swarmStatus.agents.filter(a => a.status === 'active');

    if (activeAgents.length === 0) {
      logger.error(`[Consensus] Falha na votação: Nenhum agente ativo disponível.`);
      return false;
    }

    const session: ConsensusSession = {
      id: sessionId,
      action,
      status: 'PENDING',
      votes: [],
      requiredQuorum: 0.6, // Padrão Áquila (60%)
      metadata
    };

    this.sessions.set(sessionId, session);

    // Simula o processo de votação dos agentes (Bees)
    // Em uma versão futura, cada agente teria sua própria lógica de IA para votar.
    for (const agent of activeAgents) {
      const vote = await this.simulateAgentVote(agent, action, metadata);
      session.votes.push(vote);
    }

    const approvalCount = session.votes.filter(v => v.approval).length;
    const approvalRate = approvalCount / activeAgents.length;

    if (approvalRate >= session.requiredQuorum) {
      session.status = 'APPROVED';
      logger.info(`[Consensus] AÇÃO APROVADA: ${action} (${(approvalRate * 100).toFixed(0)}% de consenso)`);
      return true;
    } else {
      session.status = 'REJECTED';
      logger.error(`[Consensus] AÇÃO REJEITADA: ${action} (Apenas ${(approvalRate * 100).toFixed(0)}% de consenso)`);
      return false;
    }
  }

  /**
   * Simula o raciocínio de um agente individual.
   */
  private async simulateAgentVote(agent: SwarmAgent, action: string, metadata: any): Promise<Vote> {
    // Lógica básica de decisão baseada no tipo do agente
    let approval = true;
    let rationale = 'Alinhado com protocolos de estabilidade.';

    if (action.includes('delete') || action.includes('purge')) {
      if (agent.type === 'security') {
        approval = true; // Segurança geralmente aprova limpeza se houver trilha
        rationale = 'Limpeza autorizada para otimização de infraestrutura.';
      } else if (agent.type === 'academic') {
        approval = false; // Acadêmico é conservador com dados
        rationale = 'Risco de perda de histórico pedagógico não mitigado.';
      }
    }

    // Delay simulado de "pensamento" (IA Reasoning)
    await new Promise(resolve => setTimeout(resolve, 100));

    return {
      agentId: agent.id,
      approval,
      rationale,
      timestamp: Date.now()
    };
  }

  public getSession(id: string): ConsensusSession | undefined {
    return this.sessions.get(id);
  }

  public getAllSessions(): ConsensusSession[] {
    return Array.from(this.sessions.values());
  }
}

export const consensusEngine = ConsensusEngine.getInstance();
