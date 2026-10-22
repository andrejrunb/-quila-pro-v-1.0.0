import { logger } from '../logger';
import { cortexEvolutionService } from './CortexEvolutionService';
import { sovereignLibrarianService } from './SovereignLibrarianService';
import { sovereignResilienceService } from './SovereignResilienceService';
import Database from '../../database/Database';

/**
 * SOVEREIGN LIFECYCLE SERVICE (v1.0.0)
 * -----------------------------------
 * Orquestra tarefas de longo prazo e ciclos automáticos do Áquila Pro.
 * É o "Metabolismo" do sistema, garantindo que processos de fundo
 * rodem de forma harmoniosa com os recursos do hardware.
 */
export class SovereignLifecycleService {
  private static instance: SovereignLifecycleService;
  private db: Database;

  private constructor() {
    this.db = Database.getInstance();
  }

  public static getInstance(): SovereignLifecycleService {
    if (!SovereignLifecycleService.instance) {
      SovereignLifecycleService.instance = new SovereignLifecycleService();
    }
    return SovereignLifecycleService.instance;
  }

  /**
   * Inicia todos os ciclos vitais do sistema.
   */
  public async bootMetabolism() {
    logger.info('[Lifecycle] Ativando Metabolismo do Sistema (Long-Running Tasks)...');

    // 1. Ciclo de Estudo (Córtex) - A cada 2 horas
    cortexEvolutionService.startStudyLoop();

    // 2. Ciclo de Descoberta (Librarian) - A cada 30 minutos
    sovereignLibrarianService.startDiscoveryLoop();

    // 3. Ciclo de Auditoria de Resiliência (Security) - A cada 4 horas
    this.startResilienceAuditLoop();

    // 4. Manutenção de Banco de Dados - Diário (3 AM)
    this.scheduleDatabaseMaintenance();

    // 5. Meta-Evolução (Evolver as Dev) - A cada 12 horas
    this.startMetaEvolutionLoop();

    // 6. Escaneamento de Risco Institucional (Pedagogical) - Diário
    this.startInstitutionalRiskLoop();

    // 7. Auditoria de Disposição de Sala (Seating) - Semanal
    this.startSeatingOptimizationLoop();

    logger.info('[Lifecycle] Todos os ciclos automáticos foram agendados com sucesso.');
  }

  /**
   * Ciclo de Escaneamento de Risco Institucional (Dropout Monitoring)
   */
  private startInstitutionalRiskLoop() {
    const INTERVAL = 24 * 60 * 60 * 1000;
    setInterval(async () => {
      logger.info('[Lifecycle] Iniciando Escaneamento de Risco Institucional (Global Audit)...');
      try {
        const { pedagogicalRiskService } = await import('./PedagogicalRiskService');
        await pedagogicalRiskService.runGlobalAudit();
      } catch (err) {
        logger.error(`[Lifecycle] Falha no escaneamento de risco: ${err}`);
      }
    }, INTERVAL);
  }

  /**
   * Ciclo de Otimização de Disposição de Sala
   */
  private startSeatingOptimizationLoop() {
    const INTERVAL = 7 * 24 * 60 * 60 * 1000; // 7 dias
    setInterval(async () => {
      logger.info('[Lifecycle] Iniciando Auditoria Semanal de Disposição de Sala...');
      try {
        const { seatingIntelligenceService } = await import('./SeatingIntelligenceService');
        await seatingIntelligenceService.autoOptimizeAllClasses();
      } catch (err) {
        logger.error(`[Lifecycle] Falha na otimização de salas: ${err}`);
      }
    }, INTERVAL);
  }

  /**
   * Ciclo de Meta-Evolução: O sistema sugere melhorias para si mesmo.
   */
  private startMetaEvolutionLoop() {
    const INTERVAL = 12 * 60 * 60 * 1000;
    setInterval(async () => {
      await this.runMetaEvolutionCycle();
    }, INTERVAL);
  }

  /**
   * Executa uma iteração do ciclo de Meta-Evolução manualmente.
   */
  public async runMetaEvolutionCycle() {
    logger.info('[Lifecycle] Iniciando ciclo de Meta-Evolução (Evolver as Dev)...');
    try {
      const { suggestions, criticalAlerts } = await cortexEvolutionService.metaEvolveSystem();
      
      // Persistimos as sugestões no banco para exibição no Dashboard do Diretor
      for (const suggestion of suggestions) {
        await this.db.run(
          "INSERT INTO ai_insights_review (category, content, status) VALUES (?, ?, ?)",
          ['SYSTEM_EVOLUTION', suggestion, 'PENDING']
        );
      }
      
      if (criticalAlerts.length > 0) {
        logger.warn(`[Lifecycle] Alertas Críticos de Meta-Evolução: ${criticalAlerts.join(', ')}`);
      }
      return { success: true, suggestions: suggestions.length };
    } catch (err) {
      logger.error(`[Lifecycle] Falha na Meta-Evolução: ${err}`);
      throw err;
    }
  }

  /**
   * Ciclo de Auditoria Zero-Bypass
   */
  private startResilienceAuditLoop() {
    const INTERVAL = 4 * 60 * 60 * 1000;
    setInterval(async () => {
      await this.runResilienceAudit();
    }, INTERVAL);
  }

  public async runResilienceAudit() {
    logger.info('[Lifecycle] Iniciando Auditoria de Resiliência Automática...');
    try {
      await sovereignResilienceService.runIntegrityAudit();
    } catch (err) {
      logger.error(`[Lifecycle] Falha na auditoria de resiliência: ${err}`);
      throw err;
    }
  }


  /**
   * Agenda tarefas de manutenção profunda
   */
  private scheduleDatabaseMaintenance() {
    // Simulação de agendamento (em prod usaríamos node-cron)
    // Para v1.0.0, rodamos uma vez 1 hora após o boot e depois a cada 24h
    setTimeout(() => this.runMaintenance(), 60 * 60 * 1000);
  }

  private async runMaintenance() {
    logger.info('[Lifecycle] Executando manutenção preventiva de dados...');
    try {
      await this.db.run('VACUUM');
      await this.db.run('ANALYZE');
      logger.info('[Lifecycle] Manutenção de banco concluída (VACUUM/ANALYZE).');
    } catch (err) {
      logger.error(`[Lifecycle] Erro na manutenção: ${err}`);
    }
  }
}

export const sovereignLifecycleService = SovereignLifecycleService.getInstance();
