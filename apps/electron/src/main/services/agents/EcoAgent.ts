import { BaseAgent, AgentIntent } from './BaseAgent';
import { energySovereigntyService } from '../EnergySovereigntyService';
import { ioTEdgeController } from '../IoTEdgeController';
import { logger } from '../../logger';

/**
 * EcoAgent (Nível 24)
 * Especialista em Soberania Ambiental.
 * Monitora o desperdício de energia e atua proativamente no Smart Campus.
 */
export class EcoAgent extends BaseAgent {
  constructor() {
    super('eco-01', 'Eco Guard');
  }

  public async perceive(event: string, data: any): Promise<void> {
    logger.info(`[EcoAgent] Perceived event: ${event}`);
    if (event === 'campus:occupancy_update') {
      await this.performOptimization(data);
    }
  }

  protected async think(): Promise<AgentIntent | null> {
    const metrics = energySovereigntyService.getSustainabilityMetrics();
    if (metrics.efficiencyScore < 0.7) {
      return {
        action: 'optimize_power',
        confidence: 0.9,
        parameters: { target: 'hvac' },
        reasoning: 'Baixa eficiência energética detectada.'
      };
    }
    return null;
  }

  protected async act(intent: AgentIntent): Promise<void> {
    if (intent.action === 'optimize_power') {
      const state = ioTEdgeController.getCampusState();
      await this.performOptimization({ totalUsage: state.totalInstantUsage });
    }
  }

  public async runDiagnostic(): Promise<any> {
    const state = ioTEdgeController.getCampusState();
    const metrics = energySovereigntyService.getSustainabilityMetrics();
    
    logger.info(`[EcoAgent] Diagnóstico ambiental: Score ${metrics.efficiencyScore * 100}%`);
    
    return {
      status: metrics.efficiencyScore > 0.8 ? 'nominal' : 'warning',
      efficiency: metrics.efficiencyScore,
      usage: state.totalInstantUsage
    };
  }

  /**
   * Executa uma rodada de otimização agêntica.
   */
  public async performOptimization(occupancyData: Record<string, number>) {
    logger.warn('[EcoAgent] Iniciando ciclo de otimização energética...');
    const commands = await energySovereigntyService.executePowerStrategy(occupancyData);
    
    this.addReport({
      timestamp: Date.now(),
      message: `Ciclo Eco concluído: ${commands.length} otimizações executadas.`,
      status: 'nominal'
    });
  }
}
