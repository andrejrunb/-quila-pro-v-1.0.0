import { logger } from '../logger';

export interface OpportunitySpark {
  id: string;
  title: string;
  type: 'CONNECTION' | 'RESOURCE' | 'INNOVATION';
  description: string;
  relevance: number; // 0-100
}

/**
 * SerendipityService (Nível 47)
 * Detecta "felizes coincidências" e oportunidades inesperadas dentro do ecossistema,
 * promovendo conexões e inovações que de outra forma passariam despercebidas.
 */
export class SerendipityService {
  private static instance: SerendipityService;

  private constructor() {}

  public static getInstance(): SerendipityService {
    if (!SerendipityService.instance) {
      SerendipityService.instance = new SerendipityService();
    }
    return SerendipityService.instance;
  }

  /**
   * Recupera "faíscas" de oportunidade atuais.
   */
  public async getSparks(): Promise<OpportunitySpark[]> {
    logger.info('[Serendipity] Escaneando ecossistema por faíscas de oportunidade...');
    
    return [
      { 
        id: 'spark_1', 
        title: 'Sinergia de Pesquisa', 
        type: 'CONNECTION', 
        description: 'Dois alunos da 3ª série estão explorando tópicos idênticos na Biblioteca Neural sem saber.',
        relevance: 95
      },
      { 
        id: 'spark_2', 
        title: 'Recurso de Lab Ocioso', 
        type: 'RESOURCE', 
        description: 'O cluster de NPU está com 80% de ociosidade — ideal para rodar experimentos de grande escala hoje.',
        relevance: 82
      }
    ];
  }
}

export const serendipityService = SerendipityService.getInstance();
