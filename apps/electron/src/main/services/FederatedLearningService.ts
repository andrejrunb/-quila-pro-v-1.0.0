import { CortexEvolutionService } from './CortexEvolutionService';
import { globalIntelligencePulseService } from './GlobalIntelligencePulseService';
import { sovereignEncryptionService } from './SovereignEncryptionService';
import { sovereignGraphService } from './SovereignGraphService';
import { sovereignMeshService } from './SovereignMeshService';
import { logger } from '../logger';
import Database from '../../database/Database';

/**
 * FederatedLearningService (v1.6 - The Nexus)
 * Orquestra o compartilhamento de inteligência coletiva entre Hubs Áquila.
 * Foca em Knowledge Nuggets (Insights extraídos do CortexEvolution).
 */
export class FederatedLearningService {
  private static instance: FederatedLearningService;
  private db: Database;

  private constructor() {
    this.db = Database.getInstance();
    this.setupConsensusListener();
  }

  public static getInstance(): FederatedLearningService {
    if (!FederatedLearningService.instance) {
      FederatedLearningService.instance = new FederatedLearningService();
    }
    return FederatedLearningService.instance;
  }

  private setupConsensusListener() {
    globalIntelligencePulseService.on('pulse:consensus', (hash: string) => {
      this.synthesizeConsensusKnowledge(hash);
    });
  }

  /**
   * Extrai e compartilha insights anonimizados com a malha (Nexus).
   */
  public async broadcastCollectiveIntelligence() {
    try {
      logger.info('[FederatedAI] Iniciando extração de Knowledge Nuggets para federação...');
      
      const cortex = CortexEvolutionService.getInstance();
      // Simulação: Busca insights recentes não marcados como LOCAL_ONLY
      const insights = cortex.searchKnowledge('', 10);
      const publicInsights = insights.filter(i => !i.tags?.includes('LOCAL_ONLY'));

      if (publicInsights.length === 0) {
        logger.debug('[FederatedAI] Nenhum insight público novo para compartilhar.');
        return;
      }

      for (const insight of publicInsights) {
        const payload = {
          topic: insight.category,
          content: insight.content,
          tags: insight.tags,
          sourceInstitution: 'ANONYMIZED_PEDAGOGY'
        };

        await sovereignMeshService.broadcast({
          id: `fai_pulse_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          sourceNode: sovereignMeshService.getNodeId(),
          targetNode: 'ALL',
          timestamp: Date.now(),
          payloadType: 'GLOBAL_INSIGHT_PULSE',
          payload: sovereignEncryptionService.encryptPayload(payload),
          securityLevel: 'high_sovereignty'
        });
      }

      logger.info(`[FederatedAI] ${publicInsights.length} nuggets compartilhados com o Nexus.`);
    } catch (err) {
      logger.error('[FederatedAI] Falha ao transmitir inteligência federada:', err);
    }
  }

  /**
   * Processa e armazena um insight recebido da malha.
   */
  public async handleFederatedInsight(packet: any) {
    try {
      const payload = sovereignEncryptionService.decryptPayload<any>(packet.payload);
      const { topic, content, tags } = payload;
      
      logger.info(`[FederatedAI] Recebido insight externo sobre: ${topic}`);

      // Salva no cache de conhecimento federado
      await this.db.run(`
        INSERT INTO nexus_knowledge_cache (id, topic, content, tags, sourceNode, timestamp)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [
        packet.id,
        topic,
        content,
        JSON.stringify(tags),
        packet.sourceNode,
        packet.timestamp
      ]);

      // Integra ao Grafo de Conhecimento
      sovereignGraphService.addEntity({
        id: `fed_insight_${packet.id}`,
        type: 'INSIGHT',
        label: `Federated Insight: ${topic}`,
        metadata: {
          topic,
          source: packet.sourceNode,
          timestamp: packet.timestamp,
          tags
        }
      });
      
    } catch (err) {
      logger.error('[FederatedAI] Erro ao processar insight federado:', err);
    }
  }

  /**
   * [Phase 2000] Sintetiza conhecimento global quando o consenso de realidade é atingido.
   */
  private async synthesizeConsensusKnowledge(hash: string) {
    logger.info(`[FederatedAI] Sintetizando estratégia global baseada no consenso: ${hash.substring(0, 12)}`);
    
    const id = `global_strategy_${hash.substring(0, 8)}`;
    sovereignGraphService.addEntity({
      id,
      type: 'PLAN',
      label: 'Global Educational Strategy (Consensus)',
      metadata: {
        consensusHash: hash,
        timestamp: Date.now(),
        status: 'validated_by_swarm',
        strategyType: 'predictive_homeostasis'
      }
    });

    // Associa o plano global aos insights federados recentes
    const recentInsights = await this.db.all('SELECT id FROM nexus_knowledge_cache ORDER BY timestamp DESC LIMIT 5');
    for (const insight of recentInsights) {
      sovereignGraphService.associate(id, `fed_insight_${insight.id}`, 'IMPLEMENTS', 1);
    }
  }

  /**
   * Retorna estatísticas da federação para a UI.
   */
  public async getFederationStats() {
    const totalLocal = (await this.db.get('SELECT COUNT(*) as count FROM pedagogical_resources'))?.count || 0;
    const totalFederated = (await this.db.get('SELECT COUNT(*) as count FROM nexus_knowledge_cache'))?.count || 0;
    
    return {
      totalLocal,
      totalFederated,
      status: sovereignMeshService.getStatus().active ? 'ACTIVE' : 'OFFLINE'
    };
  }
}

export const federatedLearningService = FederatedLearningService.getInstance();
