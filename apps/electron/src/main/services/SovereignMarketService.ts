import { logger } from '../logger';
import { sovereignGraphService } from './SovereignGraphService';
import { sovereignGrantService } from './SovereignGrantService';
import { sovereignLedger } from './SovereignLedger';

export interface PedagogicalAsset {
  id: string;
  title: string;
  type: 'LESSON_PLAN' | 'FLASHCARDS' | 'AI_PROMPT' | 'EXPERIMENT';
  price: number;
  authorId: string;
  rating: number;
  effectivenessScore?: number; // 0.0 a 1.0 (Baseado em notas reais)
  tags: string[];
  metadata: any;
}

/**
 * SovereignMarketService — Phase 2500: Córtex Review
 * Motor de economia colaborativa P2P com Auditoria de Qualidade via IA.
 */
export class SovereignMarketService {
  private static instance: SovereignMarketService;

  private constructor() {}

  public static getInstance(): SovereignMarketService {
    if (!SovereignMarketService.instance) {
      SovereignMarketService.instance = new SovereignMarketService();
    }
    return SovereignMarketService.instance;
  }

  /**
   * Calcula o impacto pedagógico de um ativo analisando os Grafo Soberano.
   */
  public async getAssetEffectiveness(assetId: string): Promise<number> {
    // Simulação: Consulta o SKG para verificar a relação IMPROVED_BY
    // Em produção, isso seria uma query buscando a delta de notas após a associação do ativo.
    const randomness = Math.random() * 0.3; // Simula variação de impacto
    const baseScores: Record<string, number> = {
      'asset-quantum-physics-101': 0.92,
      'asset-history-rpg': 0.85,
      'asset-algebra-flashcards': 0.95
    };
    
    return (baseScores[assetId] || 0.70) + randomness;
  }

  /**
   * Lista todos os ativos disponíveis com seus respectivos selos de qualidade Córtex.
   */
  public async getAvailableAssets(): Promise<PedagogicalAsset[]> {
    const rawAssets: PedagogicalAsset[] = [
      {
        id: 'asset-quantum-physics-101',
        title: 'Física Quântica para Crianças (Prompt Evoluído)',
        type: 'AI_PROMPT',
        price: 150,
        authorId: 'teacher-andrej',
        rating: 4.9,
        effectivenessScore: await this.getAssetEffectiveness('asset-quantum-physics-101'),
        tags: ['Ciência', 'IA', 'Primário'],
        metadata: { version: '2.1' }
      },
      {
        id: 'asset-history-rpg',
        title: 'História do Brasil: RPG de Mesa Didático',
        type: 'LESSON_PLAN',
        price: 80,
        authorId: 'teacher-thaysa',
        rating: 4.7,
        effectivenessScore: await this.getAssetEffectiveness('asset-history-rpg'),
        tags: ['História', 'Gamificação'],
        metadata: { pages: 15 }
      },
      {
        id: 'asset-algebra-flashcards',
        title: 'Álgebra Universal (Flashcards Anki-ready)',
        type: 'FLASHCARDS',
        price: 45,
        authorId: 'teacher-cortex',
        rating: 5.0,
        effectivenessScore: await this.getAssetEffectiveness('asset-algebra-flashcards'),
        tags: ['Matemática', 'Vestibular'],
        metadata: { cards: 150 }
      }
    ];

    return rawAssets;
  }

  /**
   * Executa a compra e registra o início do monitoramento de impacto.
   */
  public async purchaseAsset(buyerId: string, assetId: string): Promise<boolean> {
    try {
      const assets = await this.getAvailableAssets();
      const asset = assets.find(a => a.id === assetId);

      if (!asset) throw new Error('Ativo não encontrado.');

      await sovereignGrantService.spendCredits(buyerId, asset.price, assetId);
      await sovereignGrantService.addTeacherCredits(asset.authorId, asset.price, `Venda: ${asset.title}`);

      sovereignGraphService.associate(buyerId, assetId, 'OWNS_ASSET', 1);
      
      // Inicia Monitoramento de Impacto no Córtex
      sovereignGraphService.associate(assetId, `class-${buyerId}`, 'MONITORING_IMPACT', 0.5);

      sovereignLedger.addEntry({
        type: 'MARKET_SETTLEMENT_V2',
        buyerId,
        sellerId: asset.authorId,
        impactMonitoring: true,
        assetId,
        timestamp: new Date().toISOString()
      });

      logger.info(`[CórtexReview] Monitoramento iniciado para o ativo ${assetId}`);
      return true;
    } catch (error) {
      logger.error(`[Marketplace] Erro: ${error}`);
      return false;
    }
  }

  /**
   * Publica um novo recurso no Marketplace.
   */
  public async publishAsset(asset: PedagogicalAsset): Promise<void> {
    sovereignGraphService.addEntity({
      id: asset.id,
      type: 'MARKET_ASSET',
      label: asset.title,
      metadata: asset
    });
    sovereignGraphService.associate(asset.authorId, asset.id, 'PUBLISHED_BY', 1);

    logger.info(`[Marketplace] Novo ativo publicado: ${asset.title} por ${asset.authorId}`);
  }
}

export const sovereignMarketService = SovereignMarketService.getInstance();
