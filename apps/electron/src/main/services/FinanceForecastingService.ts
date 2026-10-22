import { Database } from '../../database/Database';
import { logger } from '../logger';

export interface ForecastInsight {
  period: string;
  expectedRevenue: number;
  evasionRiskImpact: number;
  netRevenue: number;
}

export interface FinanceHealthScore {
  score: number; // 0-100
  status: 'OPTIMAL' | 'STABLE' | 'CRITICAL';
  insights: string[];
}

/**
 * FINANCE FORECASTING SERVICE (v408)
 * ---------------------------------
 * Inteligência Preditiva para saúde financeira da escola.
 * Antecipa fluxos de caixa e impactos de evasão.
 */
export class FinanceForecastingService {
  constructor(private db: Database) {}

  /**
   * Calcula a "Nota de Saúde Financeira" da escola.
   */
  public async getHealthScore(): Promise<FinanceHealthScore> {
    logger.info('[Forecast] Calculando Score de Saúde Financeira...');
    
    // Simulação de cálculo: (Inadimplência vs Reserva vs Churn)
    const score = 82; 
    
    return {
      score,
      status: score > 80 ? 'OPTIMAL' : score > 50 ? 'STABLE' : 'CRITICAL',
      insights: [
        'Reserva de caixa cobre 3 meses de operação.',
        'Risco de evasão concentrado no 9º ano (impacto de R$ 12k/mês).',
        'Acordos AI recuperaram R$ 45k no último trimestre.'
      ]
    };
  }

  /**
   * Projeta receita para os próximos meses.
   */
  public async getRevenueForecast(months: number = 6): Promise<ForecastInsight[]> {
    const insights: ForecastInsight[] = [];
    const baseRevenue = 250000; // Mock: Receita base mensal

    for (let i = 0; i < months; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() + i);
      const period = date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });

      // Impacto progressivo de churn simulado
      const evasionRiskImpact = baseRevenue * (0.02 * (i + 1)); 
      
      insights.push({
        period,
        expectedRevenue: baseRevenue,
        evasionRiskImpact,
        netRevenue: baseRevenue - evasionRiskImpact
      });
    }

    return insights;
  }
}
