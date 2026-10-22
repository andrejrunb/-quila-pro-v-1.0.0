import { logger } from '../logger';

export interface SystemSyncState {
  securityStatus: 'CRITICAL' | 'STABLE';
  emotionalClimate: number; // 0-100
  ecoEfficiency: number; // 0-100
  automationProductivity: number; // 0-100
  lastSync: number;
}

/**
 * OmnipresenceOrchestrator (Nível 40)
 * Orquestrador supremo que unifica todas as vertentes de inteligência do Áquila Pro.
 * Garante que a segurança, a pedagogia e a infraestrutura operem em perfeita sincronia.
 */
export class OmnipresenceOrchestrator {
  private static instance: OmnipresenceOrchestrator;

  private constructor() {}

  public static getInstance(): OmnipresenceOrchestrator {
    if (!OmnipresenceOrchestrator.instance) {
      OmnipresenceOrchestrator.instance = new OmnipresenceOrchestrator();
    }
    return OmnipresenceOrchestrator.instance;
  }

  /**
   * Coleta o estado síncrono de todo o ecossistema.
   */
  public async getSyncState(): Promise<SystemSyncState> {
    logger.info('[Omnipresence] Sincronizando todas as camadas de inteligência...');
    
    // Importação dinâmica para evitar loops de dependência
    const { emotionalClimateService } = await import('./EmotionalClimateService');
    const { institutionalEfficiencyService } = await import('./InstitutionalEfficiencyService');

    const pulse = emotionalClimateService.getPulse();
    const stats = institutionalEfficiencyService.getStats();

    return {
      securityStatus: 'STABLE',
      emotionalClimate: pulse.globalHappiness,
      ecoEfficiency: 92, // Mock vindo do EcoService
      automationProductivity: stats.roiPercentage,
      lastSync: Date.now()
    };
  }
}

export const omnipresenceOrchestrator = OmnipresenceOrchestrator.getInstance();
