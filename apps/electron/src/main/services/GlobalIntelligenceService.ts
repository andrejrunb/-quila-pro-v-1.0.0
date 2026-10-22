import { EventEmitter } from 'events';
import { injectable, inject } from 'inversify';
import { SyncPacket } from '../../services/AiTypes';
import { SovereignMeshService } from './SovereignMeshService';
import { GenerativeAIService } from './GenerativeAIService';
import { logger } from '../logger';

@injectable()
export class GlobalIntelligenceService extends EventEmitter {
  private static instance: GlobalIntelligenceService;

  constructor(
    @inject(SovereignMeshService) private mesh: SovereignMeshService,
    @inject(GenerativeAIService) private generativeAi: GenerativeAIService
  ) {
    super();
  }

  public static getInstance(): GlobalIntelligenceService {
    if (!GlobalIntelligenceService.instance) {
      GlobalIntelligenceService.instance = new GlobalIntelligenceService(
        SovereignMeshService.getInstance(),
        GenerativeAIService.getInstance()
      );
    }
    return GlobalIntelligenceService.instance;
  }

  /**
   * Dispara um pedido de dados anonimizados para síntese global.
   */
  async triggerGlobalPulse() {
    const packet: SyncPacket = {
      id: `pulse_${Date.now()}`,
      sourceNode: this.mesh.getNodeId(),
      targetNode: 'ALL_NODES',
      payloadType: 'GLOBAL_INSIGHT_PULSE',
      timestamp: Date.now(),
      payload: {
        requestType: 'ANONYMIZED_SUMMARY'
      }
    };

    await this.mesh.broadcast(packet);
    logger.info('[GlobalIntelligence] Global Insight Pulse enviado ao enxame.');
  }

  /**
   * Gera um relatório de tendências com base nos dados agregados do enxame.
   */
  async generateTrendReport(aggregatedData: any[]): Promise<{ title: string; content: string; date: string }> {
    logger.info(`[GlobalIntelligence] Gerando síntese para ${aggregatedData.length} registros federados.`);
    
    const dataString = aggregatedData.map(d => `- ${d.topic}: ${d.count} ocorrências`).join('\n');
    
    const prompt = `
      Como IA do Áquila Pro (Córtex), analise estes dados agregados de centenas de escolas:
      ${dataString}
      
      Crie um relatório de 3 tendências estratégicas para diretores escolares.
      Formate como: "Título da Tendência: Descritivo curto e impacto previsto".
      Seja visionário e use um tom "Premium Elite".
    `;

    try {
      const reportContent = await this.generativeAi.analyzeContent(prompt);
      return {
        title: 'Relatório de Inteligência Global Áquila',
        content: reportContent,
        date: new Date().toLocaleDateString('pt-BR')
      };
    } catch (err) {
      logger.error('[GlobalIntelligence] Erro na síntese:', err);
      return {
        title: 'Relatório Indisponível',
        content: 'Dados insuficientes para síntese global segura.',
        date: new Date().toLocaleDateString('pt-BR')
      };
    }
  }
}

export const globalIntelligenceService = GlobalIntelligenceService.getInstance();
