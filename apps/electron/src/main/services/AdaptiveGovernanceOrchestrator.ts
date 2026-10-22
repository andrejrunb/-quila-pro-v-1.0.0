import { EventEmitter } from 'events';
import { logger } from '../logger';
import { councilService, Proposal } from './SovereignCouncilService';
import { sovereignGridService, EnergyMode } from './SovereignGridService';
import { legalEvidenceService } from './LegalEvidenceService';

/**
 * Nível 17 — AdaptiveGovernanceOrchestrator
 * O "Braço Executor" do Conselho Soberano.
 * Converte decisões democráticas em mudanças técnicas imediatas no OS.
 */
export class AdaptiveGovernanceOrchestrator extends EventEmitter {
  private static instance: AdaptiveGovernanceOrchestrator;

  private constructor() {
    super();
    this.startWatchingCouncil();
  }

  public static getInstance(): AdaptiveGovernanceOrchestrator {
    if (!AdaptiveGovernanceOrchestrator.instance) {
      AdaptiveGovernanceOrchestrator.instance = new AdaptiveGovernanceOrchestrator();
    }
    return AdaptiveGovernanceOrchestrator.instance;
  }

  private startWatchingCouncil() {
    // Escutar eventos de propostas fechadas ou aprovadas
    // No contexto real, isso seria disparado por um cron ou trigger de votação completa
    logger.info('[Adaptive-Gov] Orchestrator Initialized: Watching for Sovereign Consensus.');
  }

  /**
   * Executa a vontade da comunidade baseada no resultado da votação.
   */
  public async applyPolicyChange(proposalId: string, result: 'APPROVED' | 'REJECTED') {
    const proposal = await councilService.getProposal(proposalId);
    if (!proposal || result === 'REJECTED') return;

    logger.warn(`[Adaptive-Gov] Applying Approved Policy: ${proposal.title}`);

    // Mapeamento lógico de ações (Exemplos do Nível 17)
    if (proposal.title.includes('Modo Conservação')) {
      await this.executeEnergyPolicy(EnergyMode.CONSERVATION);
    } else if (proposal.title.includes('Mentoria')) {
      await this.activateSocialProgram(proposal.id);
    }

    // Assinar a execução juridicamente
    await legalEvidenceService.signEvidence('GOVERNANCE_EXECUTION', {
      proposalId,
      action: 'POLICY_APPLIED',
      status: 'SUCCESS'
    });

    this.emit('policy-applied', { proposalId, title: proposal.title });
  }

  private async executeEnergyPolicy(mode: EnergyMode) {
    sovereignGridService.setEnergyMode(mode);
    logger.info(`[Adaptive-Gov] Energy Mode adjusted to ${mode} via Sovereign Consensus.`);
  }

  private async activateSocialProgram(proposalId: string) {
    // Simular ativação de módulo social
    logger.info(`[Adaptive-Gov] Social Program (Mentorship) activated for proposal ${proposalId}.`);
  }
}

export const adaptiveGovernanceOrchestrator = AdaptiveGovernanceOrchestrator.getInstance();
