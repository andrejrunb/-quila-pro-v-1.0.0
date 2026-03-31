import { FacialAnalysis } from './MicroExpressionService';

/**
 * Phase 280 — BehavioralAuditService
 * Fornece a "Explanação de Decisão" exigida pela LGPD/Ética em IA.
 * Traduz métricas neurais em justificativas humanas compreensíveis.
 */
export class BehavioralAuditService {
  private static instance: BehavioralAuditService;

  private constructor() {}

  public static getInstance(): BehavioralAuditService {
    if (!BehavioralAuditService.instance) {
      BehavioralAuditService.instance = new BehavioralAuditService();
    }
    return BehavioralAuditService.instance;
  }

  /**
   * Gera uma justificativa técnica para um alerta de risco comportamental.
   */
  public explainDecision(analysis: FacialAnalysis): string {
    const reasons: string[] = [];
    const { emotions, physicalSigns, riskScore } = analysis;

    if (emotions.stress > 0.6) {
      reasons.push(`Nível de Stress elevado (${Math.round(emotions.stress * 100)}%) detectado via micro-tensões musculares faciais.`);
    }

    if (emotions.fatigue > 0.7) {
      reasons.push(`Sinais de Fadiga severa detectados via taxa de fechamento ocular (${(physicalSigns.eyeClosureRate * 100).toFixed(0)}%).`);
    }

    if (emotions.aggression > 0.5) {
      reasons.push(`Padrão de micro-expressão compatível com hostilidade/agressividade.`);
    }

    if (physicalSigns.pupilDilation) {
      reasons.push(`Dilatação pupilar detectada, indicando resposta fisiológica a estímulo estressor.`);
    }

    if (reasons.length === 0) {
      return `Alerta gerado por análise multidimensional de risco (Score: ${riskScore}).`;
    }

    return `Justificativa IA: ${reasons.join(' ')}`;
  }

  /**
   * Retorna os pilares éticos aplicados a esta decisão.
   */
  public getEthicalSafeguards(): string[] {
    return [
      "Processamento 100% Local (Edge)",
      "Anonymized by Design para compartilhamento externo",
      "Intervenção Humana Sugerida (Human-in-the-loop)",
      "Direito à Explicação contemplado (Art. 20 LGPD)"
    ];
  }
}

export const behavioralAuditService = BehavioralAuditService.getInstance();
export default behavioralAuditService;
