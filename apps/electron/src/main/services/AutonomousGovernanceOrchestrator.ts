import { predictiveAnalyticsService } from './PredictiveAnalyticsService';
import { councilService } from './SovereignCouncilService';
import { db } from '../../database/Database';
import { v4 as uuidv4 } from 'uuid';

/**
 * AUTONOMOUS GOVERNANCE ORCHESTRATOR (v5001)
 * -----------------------------------------
 * O "Cérebro Legislativo" da Áquila Pro.
 * Monitora riscos preditivos e propõe políticas adaptativas automaticamente.
 */
export class AutonomousGovernanceOrchestrator {
  private static instance: AutonomousGovernanceOrchestrator;
  private isProcessing = false;

  private constructor() {}

  public static getInstance(): AutonomousGovernanceOrchestrator {
    if (!AutonomousGovernanceOrchestrator.instance) {
      AutonomousGovernanceOrchestrator.instance = new AutonomousGovernanceOrchestrator();
    }
    return AutonomousGovernanceOrchestrator.instance;
  }

  /**
   * Ciclo de monitoramento adaptativo
   */
  public async runGovernanceCycle() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      console.log('[GovOrchestrator] Iniciando ciclo de governança adaptativa...');
      
      // 1. Obter relatório de risco consolidado
      const riskReport = await predictiveAnalyticsService.getRiskReport();
      const criticalStudents = riskReport.filter(r => r.classification === 'CRITICAL');

      if (criticalStudents.length > 0) {
        await this.handleCriticalSocialClusters(criticalStudents);
      }

      // 2. Processar Feedback Loops (Medir impacto de propostas anteriores)
      await this.evaluateDecisionImpacts();

      // 3. Evoluir Inteligência (Nível 6)
      const { sovereignEvolutionService } = require('./SovereignEvolutionService');
      await sovereignEvolutionService.runEvolutionCycle();

    } catch (error) {
      console.error('[GovOrchestrator] Erro no ciclo de governança:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Identifica padrões de risco social e sugere propostas no Conselho
   */
  private async handleCriticalSocialClusters(students: any[]) {
    // Agrupar por motivo principal
    const isolationRisks = students.filter(s => s.details.includes('Isolamento'));
    
    if (isolationRisks.length >= 3) {
      console.log(`[GovOrchestrator] Detectado cluster de isolamento (${isolationRisks.length} alunos). Gerando proposta...`);
      
      const proposalId = await councilService.generateAiProposal('social');
      
      // Vincular proposta aos dados de risco no Ledger
      await this.linkRiskToProposal(proposalId, isolationRisks.map(s => s.studentId));
    }
  }

  /**
   * Vincula a causa (Risco) à consequência (Proposta)
   */
  private async linkRiskToProposal(proposalId: string, studentIds: string[]) {
    const linkId = uuidv4();
    await db.run(
      `INSERT INTO governance_impact_links (id, proposal_id, target_data_json, initial_risk_score)
       VALUES (?, ?, ?, ?)`,
      [linkId, proposalId, JSON.stringify(studentIds), 0.85] // Score inicial médio
    );
  }

  /**
   * Avalia o impacto das decisões tomadas no conselho
   */
  private async evaluateDecisionImpacts() {
    const activeLinks = await db.all(`
      SELECT l.*, p.status 
      FROM governance_impact_links l
      JOIN proposals_votecasting p ON l.proposal_id = p.id
      WHERE p.status = 'closed' AND l.final_impact_score IS NULL
    `);

    for (const link of activeLinks) {
      const studentIds = JSON.parse(link.target_data_json);
      let currentAvgRisk = 0;

      // Calcular risco atual para esses alunos
      for (const id of studentIds) {
        const risk = await predictiveAnalyticsService.calculateStudentRisk(id);
        currentAvgRisk += risk.score;
      }
      currentAvgRisk /= studentIds.length;

      const impact = link.initial_risk_score - currentAvgRisk;
      
      await db.run(
        `UPDATE governance_impact_links SET final_impact_score = ?, processed_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [impact, link.id]
      );

      console.log(`[GovOrchestrator] Impacto da Proposta ${link.proposal_id}: ${impact > 0 ? '+' : ''}${(impact * 100).toFixed(1)}% de melhoria.`);
    }
  }
}

export const autonomousGovernanceOrchestrator = AutonomousGovernanceOrchestrator.getInstance();
