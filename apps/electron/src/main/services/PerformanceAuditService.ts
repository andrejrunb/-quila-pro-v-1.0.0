import { NpuOptimizationService } from './NpuOptimizationService_V2';
import { ImmutableAuditLog } from './ImmutableAuditLog';

export class PerformanceAuditService {
  private static instance: PerformanceAuditService;
  private isMonitoring = false;

  private constructor(
    private npuOptimizer: NpuOptimizationService,
    private auditLog: ImmutableAuditLog
  ) {}

  public static getInstance(
    npuOptimizer: NpuOptimizationService,
    auditLog: ImmutableAuditLog
  ): PerformanceAuditService {
    if (!PerformanceAuditService.instance) {
      PerformanceAuditService.instance = new PerformanceAuditService(npuOptimizer, auditLog);
    }
    return PerformanceAuditService.instance;
  }

  /**
   * Monitora o impacto de um evento de hardware/UI.
   * Chamado quando um 'Pulse' é disparado.
   */
  public async auditPulseImpact(payload: any) {
    if (this.isMonitoring) return;
    this.isMonitoring = true;

    try {
      const metricsBefore = await this.npuOptimizer.getMetrics();
      const thermalState = await this.npuOptimizer.getThermalState();

      // Aguarda um pequeno delay para capturar o pico da animação/renderização
      await new Promise(resolve => setTimeout(resolve, 500));

      const metricsAfter = await this.npuOptimizer.getMetrics();

      await this.auditLog.record('performance_audit', 'UPDATE', `PULSE-${Date.now()}`, {
        event: payload.type || 'UNKNOWN_PULSE',
        studentId: payload.studentId,
        impact: {
          loadDiff: metricsAfter.load_factor - metricsBefore.load_factor,
          thermalState,
          finalMetrics: metricsAfter
        }
      });

      console.log(`[PerformanceAudit] Auditoria de Pulse concluída para: ${payload.type}`);
    } catch (error) {
      console.error('[PerformanceAudit] Falha na auditoria de pulso:', error);
    } finally {
      this.isMonitoring = false;
    }
  }
}
