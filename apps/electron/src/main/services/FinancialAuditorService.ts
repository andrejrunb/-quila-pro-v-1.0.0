import * as schedule from 'node-schedule';
import { Database } from '../../database/Database';
import { logger } from '../logger';
import { cortexEvolutionService, EvolutionaryInsight } from './CortexEvolutionService';
import { FinanceForecastingService } from './FinanceForecastingService';

/**
 * FINANCIAL AUDITOR SERVICE (Phase 410)
 * ------------------------------------
 * Auditor Financeiro Autônomo que opera em background.
 * Monitora inadimplência, riscos de evasão financeira e saúde de caixa.
 * Executa auditorias profundas em horários de baixo uso da NPU (01:00 AM).
 */
export class FinancialAuditorService {
  private static instance: FinancialAuditorService;
  private db: Database;
  private forecastService: FinanceForecastingService;
  private auditJob: schedule.Job | null = null;

  private constructor(db: Database) {
    this.db = db;
    this.forecastService = new FinanceForecastingService(db);
  }

  public static getInstance(db: Database): FinancialAuditorService {
    if (!FinancialAuditorService.instance) {
      FinancialAuditorService.instance = new FinancialAuditorService(db);
    }
    return FinancialAuditorService.instance;
  }

  /**
   * Inicializa o agendamento da auditoria automática.
   */
  public start() {
    logger.info('[FinancialAuditor] Ativando Auditor Financeiro Autônomo...');
    
    // Agenda auditoria diária às 01:00 AM
    this.auditJob = schedule.scheduleJob('0 1 * * *', () => {
      this.runAudit();
    });

    // Em modo desenvolvimento ou teste, roda uma auditoria inicial após 2 minutos
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
      logger.info('[FinancialAuditor] Agendando auditoria de teste (em 2 min)...');
      setTimeout(() => this.runAudit(), 120000);
    }
  }

  /**
   * Executa o ciclo completo de auditoria financeira.
   */
  public async runAudit() {
    const startTime = Date.now();
    logger.info('[FinancialAuditor] Iniciando Ciclo de Auditoria Financeira...');

    try {
      // 1. Auditoria de Inadimplência vs Risco de Evasão (Churn Correlation)
      const churnInsights = await this.auditChurnCorrelation();
      
      // 2. Auditoria de Saúde de Fluxo de Caixa (Forecast Audit)
      const healthInsights = await this.auditCashFlowHealth();
      
      // 3. Auditoria de Anomalias de Receita
      const anomalyInsights = await this.detectRevenueAnomalies();

      // Consolidar e enviar Insights para o Córtex
      const allInsights = [...churnInsights, ...healthInsights, ...anomalyInsights];
      
      for (const insight of allInsights) {
        await cortexEvolutionService.learnInsight(insight);
      }

      const duration = (Date.now() - startTime) / 1000;
      logger.info(`[FinancialAuditor] Auditoria concluída em ${duration}s. ${allInsights.length} insights gerados.`);
      
      return { success: true, insightsCount: allInsights.length };
    } catch (err) {
      logger.error(`[FinancialAuditor] Erro crítico durante auditoria: ${err}`);
      return { success: false, error: String(err) };
    }
  }

  /**
   * Identifica correlação entre atrasos de pagamento e baixo engajamento (Predição de Churn).
   */
  private async auditChurnCorrelation(): Promise<EvolutionaryInsight[]> {
    const insights: EvolutionaryInsight[] = [];
    
    // Heurística: Alunos com pendências > 15 dias + Engajamento comportamental < 40%
    const riskyStudents = await this.db.all(`
      SELECT s.id, s.name, b.amount, b.dueDate, bl.engagement
      FROM students s
      JOIN billing b ON s.id = b.studentHash
      LEFT JOIN behavioral_logs bl ON s.id = bl.studentId
      WHERE b.status = 'pending' 
      AND b.dueDate < date('now', '-15 days')
      AND (bl.engagement < 0.4 OR bl.engagement IS NULL)
    `);

    if (riskyStudents.length > 0) {
      insights.push({
        id: `FIN-CHURN-${Date.now()}`,
        category: 'FINANCIAL_RISK',
        severity: 'WARNING',
        content: `Risco de Churn Elevado: Detectados ${riskyStudents.length} alunos com inadimplência e baixo engajamento. Impacto estimado: R$ ${(riskyStudents.length * 1200).toLocaleString('pt-BR')}/mês.`,
        tags: ['churn', 'finance', 'prediction'],
        timestamp: Date.now()
      });
    }

    return insights;
  }

  /**
   * Audita a saúde do fluxo de caixa baseada em projeções.
   */
  private async auditCashFlowHealth(): Promise<EvolutionaryInsight[]> {
    const insights: EvolutionaryInsight[] = [];
    const health = await this.forecastService.getHealthScore();

    if (health.status === 'CRITICAL') {
      insights.push({
        id: `FIN-HEALTH-${Date.now()}`,
        category: 'FINANCIAL_HEALTH',
        severity: 'CRITICAL',
        content: `Saúde Financeira Crítica: Score ${health.score}/100. ${health.insights[0]}`,
        tags: ['cashflow', 'executive', 'priority'],
        timestamp: Date.now()
      });
    }

    return insights;
  }

  /**
   * Detecta anomalias súbitas em pagamentos (ex: queda brusca em recebíveis).
   */
  private async detectRevenueAnomalies(): Promise<EvolutionaryInsight[]> {
    const insights: EvolutionaryInsight[] = [];
    
    // Heurística: Comparar recebidos nos últimos 7 dias vs média das 3 semanas anteriores
    // (Simplificado para v410)
    return insights;
  }

  /**
   * Interrompe o agendamento (usado no desligamento do sistema).
   */
  public stop() {
    if (this.auditJob) {
      this.auditJob.cancel();
      this.auditJob = null;
    }
  }
}
