import { shadowAIGovernanceService } from './ShadowAIGovernanceService';
import { logger } from '../logger';

/**
 * SovereignAIProxy (Nível 23)
 * Intercepta e redireciona chamadas de IA para o motor local.
 */
export class SovereignAIProxy {
  private static instance: SovereignAIProxy;

  private constructor() {}

  public static getInstance(): SovereignAIProxy {
    if (!SovereignAIProxy.instance) {
      SovereignAIProxy.instance = new SovereignAIProxy();
    }
    return SovereignAIProxy.instance;
  }

  /**
   * Ponto de entrada para requisições de IA no sistema.
   * Em uma implementação real, isso seria um middleware de rede.
   */
  public async handleRequest(targetUrl: string, prompt: string, userId: string): Promise<any> {
    const domain = new URL(targetUrl).hostname;

    // 1. Governança Shadow AI
    if (shadowAIGovernanceService.isShadowAI(domain)) {
      shadowAIGovernanceService.logBlockedAttempt({
        domain,
        user: userId,
        reason: 'UNAUTHORIZED_EXTERNAL_AI',
        sanitized: true
      });

      // Redireciona para o modelo local
      return await this.routeToLocalLLM(prompt, 'Llama-3-Sovereign');
    }

    // 2. DLP para domínios permitidos (se houver algum externo permitido por exceção)
    const { sanitized, violations } = shadowAIGovernanceService.sanitizePrompt(prompt);
    if (violations.length > 0) {
      logger.warn(`[ShieldPro] DLP acionado para requisição externa: ${violations.join(', ')}`);
    }

    // Aqui faria a requisição real ou local dependendo da política
    return await this.routeToLocalLLM(sanitized, 'Llama-3-Sovereign');
  }

  private async routeToLocalLLM(prompt: string, model: string): Promise<any> {
    logger.info(`[ShieldPro] Roteando requisição para motor local: ${model}`);
    
    // Integração com Ollama/GenerativeAIService
    try {
      const { generativeAIService } = await import('./GenerativeAIService');
      const response = await generativeAIService.generateText(prompt);
      
      return {
        success: true,
        source: 'Sovereign-Hub-Local',
        model,
        content: response,
        sanitized: true
      };
    } catch (err) {
      logger.error(`[ShieldPro] Falha no motor local: ${err}`);
      throw new Error('Serviço de IA Soberana temporariamente indisponível.');
    }
  }
}

export const sovereignAIProxy = SovereignAIProxy.getInstance();
