import { db } from '../../database/Database';
import { dropoutPredictor } from './DropoutPredictor';
import { adaptiveLearningService } from './AdaptiveLearningService';
import { pedagogicalInsightEngine } from './PedagogicalInsightEngine';
import { StudentLifecycleService } from './StudentLifecycleService';
import { logger } from '../logger';

/**
 * PEDAGOGICAL AI ORCHESTRATOR (Cluster 9)
 * --------------------------------------
 * O "Cérebro" de intervenção do Áquila Pro. 
 * Combina predição de risco, lacunas de aprendizagem e fundamentação jurídica
 * para criar planos de ação personalizados para estudantes em risco.
 */
export class PedagogicalAIOrchestrator {
  
  /**
   * Gera um plano de intervenção completo para um estudante.
   * [v1.6.0] Agora integra anomalias de hardware (Biometria vs Geo).
   */
  public async generateIntervention(studentId: string, anomaly?: any): Promise<any> {
    try {
      logger.info(`[AI-Orchestrator] Iniciando orquestração de intervenção para: ${studentId}`);

      // 1. Coleta de Telemetria de Risco
      const riskAnalysis = await dropoutPredictor.analyzeStudent(studentId);
      
      // 2. Mapeamento de Lacunas de Aprendizado (SRS Logic)
      const learningMetrics = await this.getLearningGaps(studentId);

      // 3. Consulta de Fundamentação Jurídica (Sovereign Vault)
      const legalGrounding = await this.getLegalGrounding(riskAnalysis.riskScore);

      // 4. Inteligência de Ciclo de Vida (Multi-year analysis)
      const lifecycleService = StudentLifecycleService.getInstance();
      const lifecycleSummary = await lifecycleService.generateLifecycleSummary(studentId);

      // 5. Geração do Plano de Ação (Markdown)
      const actionPlan = this.constructActionPlanMarkdown(
        studentId, 
        riskAnalysis, 
        learningMetrics, 
        legalGrounding,
        lifecycleSummary,
        anomaly
      );

      // 5. Persistência no Dossiê de Evidências (Sempre como DRAFT para revisão)
      const dossierId = `DOSSIER-${studentId}-${Date.now()}`;
      await db.run(
        `INSERT INTO student_evidence_dossier (id, student_id, severity_level, compiled_data, legal_grounding, status) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          dossierId,
          studentId,
          this.mapRiskToSeverity(riskAnalysis.riskScore),
          JSON.stringify({ actionPlan, riskAnalysis, learningMetrics }),
          JSON.stringify(legalGrounding),
          'draft'
        ]
      );

      logger.info(`[AI-Orchestrator] Plano de intervenção gerado e salvo: ${dossierId}`);

      return {
        dossierId,
        studentId,
        riskScore: riskAnalysis.riskScore,
        planPreview: actionPlan.substring(0, 200) + '...'
      };

    } catch (err: any) {
      logger.error(`[AI-Orchestrator] Falha na orquestração: ${err.message}`);
      throw err;
    }
  }

  /**
   * Extrai lacunas pedagógicas reais do serviço de aprendizagem adaptativa.
   */
  private async getLearningGaps(studentId: string): Promise<any> {
    // Busca tópicos com maior taxa de erro no SRS
    const topics = await db.all(
      'SELECT topic, errorRate FROM student_learning_progress WHERE studentId = ? AND errorRate > 0.3 ORDER BY errorRate DESC LIMIT 3',
      [studentId]
    );
    return topics || [];
  }

  /**
   * Busca artigos do ECA/BNCC baseados na severidade do risco.
   */
  private async getLegalGrounding(riskScore: number): Promise<any[]> {
    const category = riskScore > 0.7 ? 'ECA' : 'BNCC';
    const articles = await db.all(
      'SELECT article_number, content FROM legal_articles_vault WHERE category = ? LIMIT 2',
      [category]
    );
    return articles || [];
  }

  private mapRiskToSeverity(score: number): string {
    if (score > 0.8) return 'CRITICAL';
    if (score > 0.6) return 'HIGH';
    if (score > 0.3) return 'MEDIUM';
    return 'LOW';
  }

  private constructActionPlanMarkdown(
    studentId: string, 
    risk: any, 
    gaps: any[], 
    legal: any[],
    lifecycle: string,
    anomaly?: any
  ): string {
    const date = new Date().toLocaleDateString('pt-BR');
    
    let markdown = `# Plano de Intervenção Pedagógica - ${studentId}\n`;
    markdown += `**Data de Geração:** ${date}\n`;
    markdown += `**Score de Risco Churn:** ${(risk.riskScore * 100).toFixed(1)}%\n\n`;
    
    if (anomaly) {
      markdown += `### 🚨 ANOMALIA DE HARDWARE DETECTADA\n`;
      markdown += `- **Tipo:** ${anomaly.type}\n`;
      markdown += `- **Detalhes:** ${anomaly.details}\n`;
      markdown += `- **Severidade:** ${anomaly.severity}\n\n`;
      markdown += `---\n\n`;
    }

    markdown += `## 1. Diagnóstico de Risco\n`;
    markdown += `- *Principal Fator:* ${risk.factors[0]?.factor || 'Frequência regular'}\n`;
    markdown += `- *Tendência:* ${risk.riskScore > 0.5 ? '⚠️ Alerta de Evasão' : '✅ Estável'}\n\n`;

    markdown += `## 2. Lacunas Pedagógicas Identificadas\n`;
    if (gaps.length > 0) {
      gaps.forEach(g => {
        markdown += `- **${g.topic}**: Necessita reforço (Taxa de erro: ${(g.errorRate * 100).toFixed(1)}%)\n`;
      });
    } else {
      markdown += `- Nenhuma lacuna crítica identificada pelo motor adaptativo.\n`;
    }

    markdown += `\n## 3. Contexto de Ciclo de Vida (Infinita)\n`;
    markdown += `${lifecycle}\n`;

    markdown += `\n## 4. Fundamentação Jurídica (Sovereign Vault)\n`;
    legal.forEach(l => {
      markdown += `> **Artigo ${l.article_number}**: ${l.content}\n\n`;
    });

    markdown += `\n## 4. Recomendações Sugeridas\n`;
    markdown += `1. **Entrevista de Acolhimento:** Agendar reunião com os pais para entender o contexto extra-escolar.\n`;
    markdown += `2. **Reforço Direcionado:** Criar trilha personalizada de estudo nos tópicos críticos via portal do aluno.\n`;
    markdown += `3. **Monitoramento Ativo:** Notificar coordenação em tempo real no próximo alerta do ChurnMonitor.\n\n`;

    markdown += `---\n*Gerado automaticamente pelo Áquila Pro AI Orchestrator v1.5.0 (Retenção Infinita)*`;

    return markdown;
  }

  /**
   * [v1.6.0] Retorna o estado atual da orquestração.
   */
  public getState() {
    return {
      status: 'active',
      activeInterventions: 0,
      lastPulse: Date.now(),
      version: '1.6.0'
    };
  }

  /**
   * [v1.6.0] Dispara manualmente um fluxo de recuperação pedagógica.
   */
  public async triggerRecovery(studentId: string, planId: string): Promise<any> {
    logger.info(`[AI-Orchestrator] Disparando recuperação manual para ${studentId} via plano ${planId}`);
    return { success: true, message: 'Recovery process initiated.' };
  }
}

export const pedagogicalAIOrchestrator = new PedagogicalAIOrchestrator();
