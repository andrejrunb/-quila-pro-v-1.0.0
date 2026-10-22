import { logger } from '../logger';
import { db } from '../../database/Database';

export interface BlockedAttempt {
  timestamp: number;
  domain: string;
  user: string;
  reason: string;
  sanitized: boolean;
}

/**
 * ShadowAIGovernanceService (Nível 23)
 * Governança contra o uso de ferramentas de IA externas e DLP de prompts.
 */
export class ShadowAIGovernanceService {
  private static instance: ShadowAIGovernanceService;
  private blockedDomains: string[] = [
    'openai.com',
    'chatgpt.com',
    'anthropic.com',
    'claude.ai',
    'perplexity.ai',
    'gemini.google.com'
  ];

  private blockedAttempts: BlockedAttempt[] = [];

  private constructor() {}

  public static getInstance(): ShadowAIGovernanceService {
    if (!ShadowAIGovernanceService.instance) {
      ShadowAIGovernanceService.instance = new ShadowAIGovernanceService();
    }
    return ShadowAIGovernanceService.instance;
  }

  /**
   * Verifica se um domínio é uma "Shadow AI" proibida.
   */
  public isShadowAI(domain: string): boolean {
    return this.blockedDomains.some(d => domain.includes(d));
  }

  /**
   * Registra uma tentativa bloqueada e redirecionada.
   */
  public logBlockedAttempt(attempt: Omit<BlockedAttempt, 'timestamp'>) {
    const fullAttempt = { ...attempt, timestamp: Date.now() };
    this.blockedAttempts.push(fullAttempt);
    logger.warn(`[ShieldPro] Shadow AI detectada: ${attempt.domain} por ${attempt.user}. Redirecionando para Hub Local.`);
    
    // Opcional: Persistir no DB para relatórios de conformidade
  }

  /**
   * Data Leak Prevention (DLP): Higieniza prompts antes de qualquer processamento.
   */
  public sanitizePrompt(prompt: string): { sanitized: string; violations: string[] } {
    const violations: string[] = [];
    let sanitized = prompt;

    // Regras básicas de DLP (Simuladas para nomes e CPFs)
    const sensitivePatterns = [
      { name: 'CPF', regex: /\d{3}\.\d{3}\.\d{3}-\d{2}/g },
      { name: 'EMAIL', regex: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g }
    ];

    sensitivePatterns.forEach(pattern => {
      if (pattern.regex.test(sanitized)) {
        violations.push(pattern.name);
        sanitized = sanitized.replace(pattern.regex, `[REDACTED_${pattern.name}]`);
      }
    });

    return { sanitized, violations };
  }

  public getBlockedAttempts() {
    return this.blockedAttempts;
  }
  
  public getApprovedTools() {
    return [
      { name: 'Áquila Llama 3', type: 'Local NPU', status: 'Sovereign' },
      { name: 'Mistral Áquila', type: 'Local NPU', status: 'Sovereign' },
      { name: 'Codestral (Offload)', type: 'Nexus Mesh', status: 'Sovereign' }
    ];
  }
}

export const shadowAIGovernanceService = ShadowAIGovernanceService.getInstance();
