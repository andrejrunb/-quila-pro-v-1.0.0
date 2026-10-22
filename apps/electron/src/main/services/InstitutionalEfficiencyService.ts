import { logger } from '../logger';

/**
 * InstitutionalEfficiencyService (Nível 36)
 * Calcula o impacto das automações cognitivas na produtividade da escola.
 */
export class InstitutionalEfficiencyService {
  private static instance: InstitutionalEfficiencyService;
  private totalHoursSaved: number = 0;

  private constructor() {}

  public static getInstance(): InstitutionalEfficiencyService {
    if (!InstitutionalEfficiencyService.instance) {
      InstitutionalEfficiencyService.instance = new InstitutionalEfficiencyService();
    }
    return InstitutionalEfficiencyService.instance;
  }

  /**
   * Registra a economia de tempo de uma tarefa automatizada.
   */
  public logAutomationSavings(taskType: string) {
    const savingsMap: Record<string, number> = {
      'CERTIFICATE': 0.5, // 30 min
      'REPORT_CARD': 0.25, // 15 min por aluno
      'ENROLLMENT_CONFIRMATION': 0.3 // 18 min
    };

    const saved = savingsMap[taskType] || 0.1;
    this.totalHoursSaved += saved;
    logger.info(`[Efficiency] +${saved}h economizadas via automação de ${taskType}. Total: ${this.totalHoursSaved.toFixed(1)}h`);
  }

  public getStats() {
    return {
      totalHoursSaved: this.totalHoursSaved,
      roiPercentage: (this.totalHoursSaved / 160) * 100 // ROI baseado em um mês de trabalho (160h)
    };
  }
}

export const institutionalEfficiencyService = InstitutionalEfficiencyService.getInstance();
