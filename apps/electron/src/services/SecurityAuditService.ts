import { logger } from '../main/logger';
import { sovereignLedger } from './SovereignLedger';

export interface DrillResult {
  drillId: string;
  type: 'lockdown' | 'panic' | 'fire';
  startTime: string;
  endTime?: string;
  participants: number;
  avgResponseTimeMs: number;
  status: 'SUCCESS' | 'FAILED' | 'IN_PROGRESS';
}

/**
 * SecurityAuditService — Motor de Red Audit (Auditoria de Resiliência)
 * Responsável por validar a prontidão da segurança via simulações controladas.
 */
class SecurityAuditService {
  private static instance: SecurityAuditService;
  private currentDrill: DrillResult | null = null;

  private constructor() {}

  public static getInstance(): SecurityAuditService {
    if (!SecurityAuditService.instance) {
      SecurityAuditService.instance = new SecurityAuditService();
    }
    return SecurityAuditService.instance;
  }

  /**
   * Inicia uma simulação de emergência.
   */
  public async startDrill(type: 'lockdown' | 'panic' | 'fire'): Promise<DrillResult> {
    logger.warn(`[RedAudit] Iniciando simulação de ${type.toUpperCase()}...`);
    
    this.currentDrill = {
      drillId: `drill-${Date.now()}`,
      type,
      startTime: new Date().toISOString(),
      participants: 0,
      avgResponseTimeMs: 0,
      status: 'IN_PROGRESS'
    };

    // Notificar o Swarm que é um TESTE para evitar pânico real
    // No ambiente real, dispararíamos um socket.emit('security:drill-start', type)
    
    sovereignLedger.addEntry({
      type: 'SECURITY_DRILL_START',
      drillType: type,
      timestamp: this.currentDrill.startTime
    });

    return this.currentDrill;
  }

  /**
   * Registra a resposta de um membro da equipe (ex: Guarda clicando no botão 'Ciente').
   */
  public async registerResponse(staffId: string, responseTimeMs: number) {
    if (!this.currentDrill || this.currentDrill.status !== 'IN_PROGRESS') return;

    this.currentDrill.participants += 1;
    // Média móvel simples para o tempo de resposta
    this.currentDrill.avgResponseTimeMs = 
      (this.currentDrill.avgResponseTimeMs * (this.currentDrill.participants - 1) + responseTimeMs) / 
      this.currentDrill.participants;

    logger.info(`[RedAudit] Resposta registrada de ${staffId}: ${responseTimeMs}ms`);
  }

  /**
   * Finaliza a simulação e gera o relatório imutável.
   */
  public async finalizeDrill(): Promise<DrillResult | null> {
    if (!this.currentDrill) return null;

    this.currentDrill.endTime = new Date().toISOString();
    this.currentDrill.status = this.currentDrill.avgResponseTimeMs < 5000 ? 'SUCCESS' : 'FAILED';

    sovereignLedger.addEntry({
      drillType: this.currentDrill.type, // Renomeado para evitar conflito com 'type' do ledger
      ...this.currentDrill
    });

    const result = { ...this.currentDrill };
    this.currentDrill = null;
    return result;
  }
}

export const securityAuditService = SecurityAuditService.getInstance();
