import { logger } from '../logger';
import { anonymizationService } from './AnonymizationService';
import { aiEthicsAuditService } from './AIEthicsAuditService';
import Database from '../../database/Database';

/**
 * AI GOVERNANCE SERVICE (Shield Pro - Phase 500+)
 * ---------------------------------------------
 * O "Shield Pro" é a camada de proteção institucional contra Shadow AI e
 * vazamento de dados soberanos. Ele intercepta, audita e governa todas as
 * chamadas de IA Generativa.
 * 
 * Alinhado com: Stanford Enterprise AI Playbook & Constituição Áquila Pro.
 */
export class AIGovernanceService {
  private static instance: AIGovernanceService;
  private db: Database | null = null;
  
  // Lista de modelos e provedores autorizados pela Instituição
  private authorizedProviders = ['openai', 'google', 'ollama', 'lmstudio'];
  private sovereignModels = ['gemini-1.5-flash', 'gpt-4o', 'qwen2.5-coder'];

  private constructor() {}

  public static getInstance(): AIGovernanceService {
    if (!AIGovernanceService.instance) {
      AIGovernanceService.instance = new AIGovernanceService();
    }
    return AIGovernanceService.instance;
  }

  public setDatabase(db: Database) {
    this.db = db;
  }

  /**
   * [Shield Pro - Audit] Valida se a chamada de IA segue as políticas de governança.
   */
  public async shieldPrompt(prompt: string, context: { provider: string, modelId: string }): Promise<string> {
    logger.info(`[ShieldPro] Auditando prompt para ${context.provider}/${context.modelId}...`);

    // 1. Verificação de Shadow AI (Provedores não autorizados)
    if (!this.authorizedProviders.includes(context.provider.toLowerCase())) {
      const error = `[ShieldPro] BLOQUEIO ESTRATÉGICO: O provedor ${context.provider} não está na Allowlist de Governança Institucional.`;
      logger.error(error);
      throw new Error(error);
    }

    // 2. Proteção de PII (LGPD Compliance)
    // Mascara CPFs e tenta reduzir a exposição de nomes reais antes do envio externo
    let shieldedPrompt = anonymizationService.purgePIIFromLog(prompt);

    // 3. Injeção de Diretrizes de Soberania (Always-Pedagogical Policy)
    const institutionalSuffix = `
\n---
DIRETRIZ INSTITUCIONAL (ÁQUILA PRO):
- Mantenha tom profissional, pedagógico e empático.
- Não divulgue dados sensíveis de menores ou logs de segurança brutos.
- Priorize a soberania educacional e os valores da escola.
---`.trim();

    shieldedPrompt = `${shieldedPrompt}\n\n${institutionalSuffix}`;

    return shieldedPrompt;
  }

  /**
   * [Shield Pro - Post-Audit] Analisa a resposta da IA antes da entrega.
   */
  public async shieldResponse(response: string): Promise<string> {
    const ethicsReport = await aiEthicsAuditService.auditResponse(response);
    
    if (!ethicsReport.isSafe) {
      logger.warn(`[ShieldPro] RESPOSTA FILTRADA: Violações: ${ethicsReport.violations.join(', ')}`);
      return "⚠️ Conteúdo bloqueado pelo Shield Pro devido a violações de diretrizes éticas institucionais.";
    }

    // Persiste auditoria no Ledger Soberano via Ethics Service
    await aiEthicsAuditService.logEthicalAudit(ethicsReport);

    return response;
  }

  /**
   * [Shield Pro - Governance] Verifica se o custo/uso está dentro dos limites.
   */
  public async validateUsage(tokens: number): Promise<boolean> {
    // Simulação de cota institucional (Phase 500+)
    if (tokens > 100000) {
      logger.error('[ShieldPro] Cota de tokens institucional excedida.');
      return false;
    }
    return true;
  }

  /**
   * [Shield Pro - Audit] Retorna os logs de auditoria de governança.
   */
  public async getAuditLogs(): Promise<any[]> {
    // Em um sistema real, isso buscaria do SQLite ou do Sovereign Ledger.
    // Retornando mock para a demonstração da Fase 500+.
    return [
      {
        id: 'log_001',
        timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
        userId: 'admin',
        action: 'AIG_PROMPT_SHIELD',
        reason: 'Purga de PII e Injeção de Diretrizes Pedagógicas.'
      },
      {
        id: 'log_002',
        timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
        userId: 'teacher_pedro',
        action: 'AIG_PROMPT_SHIELD',
        reason: 'Validação de conformidade com o Stanford AI Playbook.'
      },
      {
        id: 'log_003',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        userId: 'system',
        action: 'SECURITY_BLOCK',
        reason: 'Bloqueio de Provedor Externo Não Autorizado (Shadow AI).'
      }
    ];
  }
}

export const aiGovernanceService = AIGovernanceService.getInstance();
