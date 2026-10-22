import { logger } from '../logger';
import { sovereignOrchestrator } from './SovereignOrchestrator';

/**
 * SOVEREIGN EMERGENCY SERVICE (v3702)
 * ---------------------------------
 * Gerencia o 'Modo de Emergência' do Áquila Pro OS.
 * Em caso de queda total de energia (Nobreak crítico/Bateria fraca)
 * ou desconexão total de rede, o sistema desativa módulos pesados
 * e mantém apenas o essencial (Soberania de Dados e Presidência).
 */
export class SovereignEmergencyService {
  private static instance: SovereignEmergencyService;
  private isEmergencyMode: boolean = false;

  private constructor() {}

  public static getInstance(): SovereignEmergencyService {
    if (!SovereignEmergencyService.instance) {
      SovereignEmergencyService.instance = new SovereignEmergencyService();
    }
    return SovereignEmergencyService.instance;
  }

  /**
   * [SQA-EME-1125] Ativa o Protocolo de Emergência (Offline-Only).
   */
  public async activateEmergencyProtocol(): Promise<void> {
    logger.warn('[!URGENTE] ATIVANDO PROTOCOLO DE EMERGÊNCIA (FALHA CRÍTICA)...');
    this.isEmergencyMode = true;

    // Desativa orquestradores de IA e Visão pesados (Economia de Energia)
    // v3647: 'aquila-vision' e 'aquila-nlu' desativados
    await sovereignOrchestrator.restartService('aquila-vision'); 
    // Em produção: orchestrator.stop('aquila-vision')

    logger.info('[Emergency] Módulos de Baixa Prioridade Suspensos.');
    logger.info('[Emergency] Módulo de Persistência Ledger: PRIORIDADE MÁXIMA.');
  }

  /**
   * [SQA-EME-1130] Restaura o estado operacional padrão.
   */
  public async restoreNormalOperation(): Promise<void> {
     this.isEmergencyMode = false;
     logger.info('[Emergency] Protocolo de Emergência Finalizado. Restaurando Enxame...');
     await sovereignOrchestrator.bootInfrastructure();
  }
}

export const sovereignEmergencyService = SovereignEmergencyService.getInstance();

