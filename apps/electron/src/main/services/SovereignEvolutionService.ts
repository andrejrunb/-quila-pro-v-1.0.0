import { db } from '../../database/Database';

/**
 * SOVEREIGN EVOLUTION SERVICE (SIE) v6001
 * --------------------------------------
 * O motor de auto-correção e aprendizado do Áquila Pro.
 * Analisa o impacto das decisões de governança para otimizar os modelos de IA.
 */
export class SovereignEvolutionService {
  private static instance: SovereignEvolutionService;

  private constructor() {}

  public static getInstance(): SovereignEvolutionService {
    if (!SovereignEvolutionService.instance) {
      SovereignEvolutionService.instance = new SovereignEvolutionService();
    }
    return SovereignEvolutionService.instance;
  }

  /**
   * Analisa sucessos recentes e calcula novos pesos para o modelo preditivo
   */
  public async runEvolutionCycle() {
    console.log('[SIE] Iniciando ciclo de evolução de inteligência...');

    try {
      // 1. Coletar dados de impacto fechados e não processados pelo SIE
      const impactData = await db.all(`
        SELECT l.*, p.author_type
        FROM governance_impact_links l
        JOIN proposals_votecasting p ON l.proposal_id = p.id
        WHERE l.final_impact_score IS NOT NULL 
        AND l.processed_at > COALESCE((SELECT MAX(optimized_at) FROM sovereign_evolution_log), '1970-01-01')
      `);

      if (impactData.length === 0) {
        console.log('[SIE] Sem novos dados de impacto para evolução.');
        return;
      }

      // 2. Calcular o fator de melhoria média
      const avgImpact = impactData.reduce((acc, curr) => acc + curr.final_impact_score, 0) / impactData.length;
      
      // 3. Ajustar o Multiplicador de Confiança (Confidence Bias)
      // Se o impacto for positivo, aumentamos a confiança na detecção de riscos similares
      const evolutionFactor = 1 + (avgImpact * 0.1); // Máximo de 10% de ajuste por ciclo
      
      console.log(`[SIE] Evolução concluída. Fator de Melhoria: ${(avgImpact * 100).toFixed(2)}%. Novo Evolution Factor: ${evolutionFactor.toFixed(3)}`);

      // 4. Persistir no Log de Evolução
      await this.logEvolution(avgImpact, evolutionFactor, impactData.length);

      return evolutionFactor;
    } catch (error) {
      console.error('[SIE] Erro no ciclo de evolução:', error);
    }
  }

  private async logEvolution(avgImpact: number, factor: number, samples: number) {
    await db.run(
      `INSERT INTO sovereign_evolution_log (avg_impact, confidence_multiplier, data_samples)
       VALUES (?, ?, ?)`,
      [avgImpact, factor, samples]
    );
  }

  /**
   * Retorna o multiplicador de confiança atualizado para o PredictiveAnalyticsService
   */
  public async getCurrentConfidenceMultiplier(): Promise<number> {
    const lastEvolution = await db.get(`SELECT confidence_multiplier FROM sovereign_evolution_log ORDER BY optimized_at DESC LIMIT 1`);
    return lastEvolution && typeof lastEvolution.confidence_multiplier === 'number' ? lastEvolution.confidence_multiplier : 1.0;
  }
}

export const sovereignEvolutionService = SovereignEvolutionService.getInstance();
