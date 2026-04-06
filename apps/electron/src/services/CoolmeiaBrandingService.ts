import { logger } from '../main/logger';

/**
 * COOLMEIA BRANDING SERVICE (v4001)
 * --------------------------------
 * Motor central de marca que gerencia a transição da identidade 'Áquila'
 * para o ecossistema 'Cool.me.ia'. Transforma a visão individual em
 * inteligência coletiva e soberana.
 */
export interface BrandingConfig {
  currentBrand: string;
  mission: string;
  tagline: string;
  visualTheme: 'Eagle' | 'Honeycomb';
}

export class CoolmeiaBrandingService {
  private static instance: CoolmeiaBrandingService;

  private config: BrandingConfig = {
    currentBrand: 'Cool.me.ia',
    mission: 'Conectando Soberanias Individuais em uma Inteligência Coletiva.',
    tagline: 'A Inteligência que nos Conecta.',
    visualTheme: 'Honeycomb'
  };

  private constructor() {}

  public static getInstance(): CoolmeiaBrandingService {
    if (!CoolmeiaBrandingService.instance) {
      CoolmeiaBrandingService.instance = new CoolmeiaBrandingService();
    }
    return CoolmeiaBrandingService.instance;
  }

  /**
   * [SQA-CBS-1255] Retorna o nome da marca atualizado para a interface.
   */
  public getBrandName(): string {
    return this.config.currentBrand;
  }

  /**
   * [SQA-CBS-1258] Retorna a nova missão para os relatórios quinzenais (Pulse).
   */
  public getMissionStatement(): string {
    return this.config.mission;
  }

  /**
   * [SQA-CBS-1260] Log de transição soberana para o Ledger.
   */
  public async logEvolution(): Promise<void> {
    logger.warn(`[CoolmeiaEvolution] Transição Sistemática v4001: ÁQUILA -> COOL.ME.IA`);
    // Futura integração com o SovereignLedgerService para registrar a mudança de marca.
  }
}

export const coolmeiaBrandingService = CoolmeiaBrandingService.getInstance();
