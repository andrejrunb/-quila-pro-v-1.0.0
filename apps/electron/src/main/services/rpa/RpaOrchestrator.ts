/**
 * Áquila Pro — RPA Orchestrator (Córtex de Automação Soberana)
 * Coordena os workers headless de SigaWeb (Acadêmico) e Domínio Sistemas (Contábil/Financeiro).
 */

import { EventEmitter } from 'events';
import * as schedule from 'node-schedule';
import { Database } from '../../../database/Database';
import { logger } from '../../logger';
import { SigaWebWorker } from './SigaWebWorker';
import { DominioWebWorker } from './DominioWebWorker';
import { RpaExecutionLog, SigaWebSyncResult, DominioExportResult } from './types';

export class RpaOrchestrator extends EventEmitter {
  private static instance: RpaOrchestrator;
  private db: Database;
  private sigaWorker: SigaWebWorker;
  private dominioWorker: DominioWebWorker;

  private sigaJob: schedule.Job | null = null;
  private dominioJob: schedule.Job | null = null;
  private isInitialized = false;

  private constructor() {
    super();
    this.db = Database.getInstance();
    this.sigaWorker = SigaWebWorker.getInstance();
    this.dominioWorker = DominioWebWorker.getInstance();
  }

  public static getInstance(): RpaOrchestrator {
    if (!RpaOrchestrator.instance) {
      RpaOrchestrator.instance = new RpaOrchestrator();
    }
    return RpaOrchestrator.instance;
  }

  /**
   * Inicializa o orquestrador e ativa os agendamentos automáticos por Cron.
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) return;
    logger.info('[RpaOrchestrator] Inicializando barramento de automação RPA...');

    await this.ensureTables();
    this.scheduleAutomations();

    this.isInitialized = true;
    logger.info('[RpaOrchestrator] Barramento RPA pronto. Agendamentos SigaWeb e Domínio ativos.');
  }

  private async ensureTables(): Promise<void> {
    try {
      await this.db.run(
        `CREATE TABLE IF NOT EXISTS rpa_execution_logs (
          id TEXT PRIMARY KEY,
          workerType TEXT NOT NULL,
          triggerType TEXT NOT NULL,
          status TEXT NOT NULL,
          recordsCount INTEGER,
          durationMs INTEGER,
          details TEXT,
          protocol TEXT,
          checksum TEXT,
          error TEXT,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )`
      );
    } catch (err: any) {
      logger.error('[RpaOrchestrator] Erro ao verificar tabelas RPA:', err);
    }
  }

  /**
   * Configura os agendamentos diários automáticos.
   */
  public scheduleAutomations(): void {
    // 1. SigaWeb Cron (Seg a Sex às 18:30 por padrão)
    const sigaConfig = this.sigaWorker.getConfig();
    if (this.sigaJob) this.sigaJob.cancel();

    if (sigaConfig.autoSyncEnabled) {
      this.sigaJob = schedule.scheduleJob(sigaConfig.dailySyncCron, async () => {
        logger.info('[RpaOrchestrator] Disparando sincronização agendada do SigaWeb...');
        try {
          const res = await this.sigaWorker.syncAllDailyAttendance(undefined, 'CRON');
          this.emit('rpa:sigaweb-batch-done', res);
        } catch (e: any) {
          logger.error('[RpaOrchestrator] Erro no Cron do SigaWeb:', e);
        }
      });
      logger.info(`[RpaOrchestrator] Agendamento SigaWeb ativo: ${sigaConfig.dailySyncCron}`);
    }

    // 2. Domínio Sistemas Cron (Diariamente às 23:55)
    const dominioConfig = this.dominioWorker.getConfig();
    if (this.dominioJob) this.dominioJob.cancel();

    if (dominioConfig.autoSyncEnabled) {
      this.dominioJob = schedule.scheduleJob(dominioConfig.dailySyncCron, async () => {
        logger.info('[RpaOrchestrator] Disparando exportação agendada para Domínio Sistemas...');
        try {
          const res = await this.dominioWorker.exportFinancialRemittance(undefined, undefined, 'CRON');
          this.emit('rpa:dominio-batch-done', res);
        } catch (e: any) {
          logger.error('[RpaOrchestrator] Erro no Cron do Domínio:', e);
        }
      });
      logger.info(`[RpaOrchestrator] Agendamento Domínio ativo: ${dominioConfig.dailySyncCron}`);
    }
  }

  // ─── MÉTODOS OPERACIONAIS ───

  /**
   * Disparo manual de sincronização do SigaWeb para uma ou todas as turmas.
   */
  public async syncSigaWeb(classId?: string, date?: string): Promise<any> {
    logger.info(`[RpaOrchestrator] Disparo manual SigaWeb: Turma ${classId || 'TODAS'}`);
    if (classId) {
      const res = await this.sigaWorker.syncClassAttendance(classId, date, 'MANUAL');
      this.emit('rpa:sigaweb-done', res);
      return res;
    } else {
      const res = await this.sigaWorker.syncAllDailyAttendance(date, 'MANUAL');
      this.emit('rpa:sigaweb-batch-done', res);
      return res;
    }
  }

  /**
   * Disparo manual de exportação da remessa contábil para o Domínio Sistemas.
   */
  public async syncDominio(startDate?: string, endDate?: string): Promise<DominioExportResult> {
    logger.info(`[RpaOrchestrator] Disparo manual Domínio Sistemas: ${startDate || 'Mês Atual'}`);
    const res = await this.dominioWorker.exportFinancialRemittance(startDate, endDate, 'MANUAL');
    this.emit('rpa:dominio-done', res);
    return res;
  }

  /**
   * Recupera os logs de auditoria recentes do RPA.
   */
  public async getExecutionLogs(limit: number = 25): Promise<RpaExecutionLog[]> {
    try {
      const logs = await this.db.all(
        `SELECT * FROM rpa_execution_logs ORDER BY createdAt DESC LIMIT ?`,
        [limit]
      );
      return logs || [];
    } catch (e: any) {
      logger.error('[RpaOrchestrator] Erro ao buscar logs RPA:', e);
      return [];
    }
  }

  /**
   * Status e métricas operacionais consolidadas.
   */
  public async getStatus(): Promise<any> {
    const logs = await this.getExecutionLogs(5);
    const totalLogs = await this.db.get(`SELECT COUNT(*) as total FROM rpa_execution_logs`);
    const successfulLogs = await this.db.get(`SELECT COUNT(*) as ok FROM rpa_execution_logs WHERE status = 'SUCCESS'`);
    const sigaConfig = this.sigaWorker.getConfig();
    const dominioConfig = this.dominioWorker.getConfig();

    return {
      initialized: this.isInitialized,
      workers: {
        sigaweb: {
          enabled: sigaConfig.autoSyncEnabled,
          portalUrl: sigaConfig.portalUrl,
          cron: sigaConfig.dailySyncCron,
        },
        dominio: {
          enabled: dominioConfig.autoSyncEnabled,
          hotFolderPath: dominioConfig.hotFolderPath,
          integrationType: dominioConfig.integrationType,
          cron: dominioConfig.dailySyncCron,
        },
      },
      stats: {
        totalExecutions: totalLogs?.total || 0,
        successfulExecutions: successfulLogs?.ok || 0,
        successRate: totalLogs?.total > 0 ? Math.round(((successfulLogs?.ok || 0) / totalLogs.total) * 100) : 100,
      },
      recentLogs: logs,
    };
  }

  /**
   * Executa diagnóstico e teste de integridade de ambos os workers.
   */
  public async testIntegrations(): Promise<any> {
    const sigaTest = await this.sigaWorker.testConnection();
    const dominioTest = await this.dominioWorker.testHotFolder();

    return {
      timestamp: new Date().toISOString(),
      sigaweb: sigaTest,
      dominio: dominioTest,
    };
  }
}
