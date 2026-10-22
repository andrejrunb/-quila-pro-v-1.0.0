import { Database } from '../../database/Database';
import { GenerativeAIService } from './GenerativeAIService';
import { LegalGuardService } from './LegalGuardService';
import { logger } from '../logger';
import { v4 as uuidv4 } from 'uuid';

/**
 * SovereignIntelligenceService.ts
 * Engine para síntese de inteligência estratégica e pedagógica.
 * Transforma logs brutos em insights acionáveis no cockpit.
 */
export class SovereignIntelligenceService {
  private isProcessing: boolean = false;

  constructor(
    private db: Database,
    private ai: GenerativeAIService,
    private legalGuard: LegalGuardService
  ) {}

  /**
   * Executa o ciclo de síntese de dados.
   */
  async runSynthesis(): Promise<any> {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      logger.info('[SIE] Iniciando ciclo de síntese de inteligência soberana...');

      // 1. Agregação de Dados Comportamentais (Últimas 48h)
      const behavioralData = await this.db.all(`
        SELECT studentId, AVG(stress) as avgStress, AVG(engagement) as avgEngagement, COUNT(*) as sampleCount
        FROM behavioral_logs
        WHERE timestamp > datetime('now', '-2 days')
        GROUP BY studentId
        HAVING COUNT(*) > 5
      `);

      // 2. Agregação de Frequência
      const attendanceAnomalies = await this.db.all(`
        SELECT studentId, COUNT(*) as absences
        FROM attendance
        WHERE status = 'absent' AND date > date('now', '-7 days')
        GROUP BY studentId
        HAVING absences >= 2
      `);

      // 3. Agregação de Segurança
      const securityAnomalies = await this.db.all(`
        SELECT type, COUNT(*) as count, message
        FROM security_events
        WHERE timestamp > datetime('now', '-1 days')
        GROUP BY type
      `);

      // Se não houver dados suficientes, retornamos um insight genérico ou abortamos
      if (behavioralData.length === 0 && attendanceAnomalies.length === 0 && securityAnomalies.length === 0) {
        logger.info('[SIE] Dados insuficientes para síntese profunda. Ciclo abortado.');
        this.isProcessing = false;
        return;
      }

      // 4. Construção do Prompt para o Córtex
      const context = {
        behavioral: behavioralData,
        attendance: attendanceAnomalies,
        security: securityAnomalies
      };

      const prompt = `
        Analise o seguinte contexto operacional de uma escola e gere 3 INSIGHTS ESTRATÉGICOS.
        Identifique riscos de evasão, problemas de engajamento ou vulnerabilidades de segurança.
        
        DADOS:
        ${JSON.stringify(context)}

        REGRAS:
        - Responda em JSON.
        - Formato: Array de objetos { type: "pedagogical"|"operational"|"security", title: string, content: string, suggestedAction: string }.
        - Linguagem: Português formal mas direto.
      `;

      const aiResponse = await this.ai.analyzeContent(prompt);
      
      interface Insight {
        type: string;
        title: string;
        content: string;
        suggestedAction: string;
      }

      let insights: Insight[] = [];
      try {
        // Tenta limpar possíveis marcações de markdown e parsear o JSON
        const jsonMatch = aiResponse.match(/\[.*\]/s);
        const jsonStr = jsonMatch ? jsonMatch[0] : aiResponse;
        insights = JSON.parse(jsonStr);
      } catch (err) {
        logger.warn('[SIE] Falha ao parsear JSON da IA. Salvando como texto bruto.');
        insights = [{
          type: 'operational',
          title: 'Relatório Consolidado de Inteligência',
          content: aiResponse,
          suggestedAction: 'Revisar manualmente os logs brutos.'
        }];
      }

      // 5. Persistência dos Insights com Fundamentação Legal (Phase 900)
      for (const insight of insights) {
        const id = `SIE-${uuidv4().substring(0, 8)}`;
        
        // Busca fundamentação legal baseada no conteúdo do insight
        const relatedLegal = await this.legalGuard.findRelatedArticles(insight.content);
        const legalBasis = relatedLegal.length > 0 
          ? relatedLegal.map(a => `${a.source} ${a.article_number}: ${a.title}`).join(' | ')
          : "Base legal em auditoria.";

        await this.db.run(`
          INSERT INTO ai_insights_review (id, source_service, insight_type, content, suggested_action, status, legal_basis)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
          id,
          'SovereignIntelligenceEvolution',
          insight.type,
          insight.content,
          insight.suggestedAction,
          'pending',
          legalBasis
        ]);
      }

      logger.info(`[SIE] Síntese concluída. ${insights.length} novos insights gerados.`);
      return insights;

    } catch (err: any) {
      logger.error(`[SIE] Erro catastrófico no ciclo de síntese: ${err.message}`);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Recupera insights pendentes para o Dashboard.
   */
  async getPendingInsights(): Promise<any[]> {
    return await this.db.all(`
      SELECT * FROM ai_insights_review 
      WHERE status = 'pending' 
      ORDER BY createdAt DESC 
      LIMIT 5
    `);
  }

  async approveInsight(id: string): Promise<void> {
    await this.db.run("UPDATE ai_insights_review SET status = 'approved', reviewedAt = CURRENT_TIMESTAMP WHERE id = ?", [id]);
  }
}
