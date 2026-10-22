import { logger } from '../logger';

/**
 * COOLMEIA BRANDING SERVICE (v4001)
 * --------------------------------
 * Motor central de marca que gerencia a transição da identidade 'Áquila'
 * para o ecossistema 'Áquila Pro'. Transforma a visão individual em
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
    currentBrand: 'Áquila Pro',
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
    logger.warn(`[ÁquilaProEvolution] Transição Sistemática v1.5.0: ÁQUILA -> ÁQUILA PRO`);
    // Futura integração com o SovereignLedgerService para registrar a mudança de marca.
  }
}

export const coolmeiaBrandingService = CoolmeiaBrandingService.getInstance();

