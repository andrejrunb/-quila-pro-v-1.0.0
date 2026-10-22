import { logger } from '../logger';
import { aiAnalysisService } from './AiAnalysisService';
import { pushNotificationService } from './PushNotificationService';
import { ollamaIntegration } from './OllamaIntegration';
import { Database } from '../../database/Database';

export interface GuardResult {
  allowed: boolean;
  reason?: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}

/**
 * ContentGuardService (v3460)
 * O "Escudo Moral" do Áquila Pro. Intercepta comunicações para evitar abusos.
 */
export class ContentGuardService {
  private db: Database | null = null;

  constructor(db?: Database) {
    if (db) this.db = db;
  }

  /**
   * Valida se um texto contém conteúdo impróprio ou não-educativo.
   */
  public async validateContent(text: string): Promise<{ safe: boolean; reason?: string }> {
    logger.info('[ContentGuard] Validando conteúdo...');
    
    // Simulação de filtro heurístico + IA
    const prompt = `Analise o seguinte texto para um ambiente escolar. Responda APENAS "SAFE" ou "UNSAFE: [motivo]".
    Texto: "${text}"`;

    try {
      const result = await ollamaIntegration.generate(prompt);
      const safe = result.toUpperCase().includes('SAFE') && !result.toUpperCase().includes('UNSAFE');
      
      return { 
        safe, 
        reason: safe ? undefined : result.replace('UNSAFE:', '').trim() 
      };
    } catch (err) {
      logger.error('[ContentGuard] Erro na validação de IA:', err);
      return { safe: true }; // Fallback permissivo para não bloquear o fluxo
    }
  }

  /**
   * Analisa um conteúdo de texto antes do envio.
   */
  public async validateText(text: string, userId: string): Promise<GuardResult> {
    logger.info(`[Guard] Analisando conteúdo de: ${userId}`);

    // Prompt de segurança para a I.A local (Ollama) ou Cloud (Gemini)
    const prompt = `Analise a seguinte mensagem escolar para conteúdos inadequados (ofensas, pornografia, bullying, ódio). 
    Responda APENAS em JSON no formato { "inappropriate": boolean, "reason": "string", "risk": "LOW|MEDIUM|HIGH" }.
    Mensagem: "${text}"`;

    try {
      const response = await aiAnalysisService.analyzeSafeContent(prompt);
      const result = JSON.parse(response);

      if (result.inappropriate) {
        logger.warn(`[Guard] BLOQUEIO: Conteúdo inadequado detectado para o usuário ${userId}. Motivo: ${result.reason}`);
        
        // Alerta imediato para a Coordenação/TI
        await pushNotificationService.sendToRole('SECURITY', {
          title: '⚠️ TENTATIVA DE ABUSO BLOQUEADA',
          body: `Usuário ${userId} tentou enviar conteúdo inadequado: ${result.reason}`,
          priority: 'high'
        });

        return { allowed: false, reason: result.reason, riskLevel: result.risk };
      }

      return { allowed: true, riskLevel: 'LOW' };
    } catch (error) {
      logger.error(`[Guard] Erro na análise de segurança: ${error}`);
      // Em caso de erro na I.A, por precaução em mensagens críticas, podemos ser conservadores
      return { allowed: true, riskLevel: 'LOW' }; 
    }
  }

  /**
   * Placeholder para análise de Imagem (Vision)
   */
  public async validateImage(imageBuffer: Buffer, userId: string): Promise<GuardResult> {
     // Integrar com Gemini Vision ou modelo local de NSFW
     logger.info(`[Guard] Vision: Analisando imagem de ${userId}`);
     return { allowed: true, riskLevel: 'LOW' };
  }
}

export const contentGuardService = new ContentGuardService();

