import { EventEmitter } from 'events';
import Database from '../../database/Database';
import { logger } from '../logger';

export interface RoiSimulationParams {
  cloudMonthlyCost: number;
  edgeHardwareCost: number;
  monthsToPayback: number;
  recommendation: string;
}

export class AiRoiEngineService extends EventEmitter {
  private static instance: AiRoiEngineService;
  private db: Database;
  
  // Cost assumptions (in BRL) for cloud API
  private COST_PER_1M_INPUT_TOKENS = 0.50 * 5.0; // Gemini: $0.50 -> R$ 2.50
  private COST_PER_1M_OUTPUT_TOKENS = 1.50 * 5.0; // Gemini: $1.50 -> R$ 7.50
  
  // Recommended Hardware Config for Sovereign Edge
  private EDGE_SERVER_COST = 8500; // Average cost of a local Edge NPU Server

  private constructor() {
    super();
    this.db = Database.getInstance();
  }

  public static getInstance(): AiRoiEngineService {
    if (!AiRoiEngineService.instance) {
      AiRoiEngineService.instance = new AiRoiEngineService();
    }
    return AiRoiEngineService.instance;
  }

  /**
   * Loga o uso de tokens da IA (texto ou imagem).
   */
  public async logUsage(serviceType: 'llm_text' | 'llm_vision' | 'cv_face', tokensInput: number, tokensOutput: number, computeTimeMs: number = 0) {
    try {
      await this.db.run(
        `INSERT INTO ai_metrics (service_type, tokens_input, tokens_output, compute_time_ms) VALUES (?, ?, ?, ?)`,
        [serviceType, tokensInput, tokensOutput, computeTimeMs]
      );
    } catch (err: any) {
      logger.error(`[AiRoiEngine] Failed to log usage: ${err.message}`);
    }
  }

  /**
   * Calcula o custo acumulado em "Nuvem" e simula o ROI de transição para "Edge"
   */
  public async simulateRoi(): Promise<RoiSimulationParams> {
    try {
      const rows = await this.db.all(`SELECT service_type, SUM(tokens_input) as totalInput, SUM(tokens_output) as totalOutput FROM ai_metrics GROUP BY service_type`) || [];
      
      let totalCloudCost = 0;

      for (const row of rows) {
        if (row.service_type === 'llm_text' || row.service_type === 'llm_vision') {
            const costIn = (row.totalInput / 1000000) * this.COST_PER_1M_INPUT_TOKENS;
            const costOut = (row.totalOutput / 1000000) * this.COST_PER_1M_OUTPUT_TOKENS;
            totalCloudCost += (costIn + costOut);
        }
        if (row.service_type === 'cv_face') {
            // Cada hora de CV em Cloud custaria ~R$ 0.10 (apenas para métrica comparativa)
            // Aqui row.totalInput poderia ser os frames processados.
            totalCloudCost += (row.totalInput / 30) * 0.001; 
        }
      }

      // Se a base de dados ainda não tem uso suficiente (ex: acabou de instalar), vamos projetar para a frente 
      // baseado no total de alunos (mockado para efeito de UI).
      const studentsCount = (await this.db.all('SELECT COUNT(*) as count FROM students'))?.[0]?.count || 300;
      
      // Mensalidade Cloud Projetada (Tokens + Requisições esperadas)
      const projectedCloudMonthlyCost = (totalCloudCost > 0 ? totalCloudCost : (studentsCount * 1.50)); // R$ 1.50 per student/month em API

      let recommendation = "CONTINUE_CLOUD";
      let monthsToPayback = this.EDGE_SERVER_COST / projectedCloudMonthlyCost;

      if (monthsToPayback <= 12) {
          recommendation = "INVEST_EDGE";
      } else if (monthsToPayback <= 24) {
          recommendation = "PLAN_EDGE";
      }

      return {
          cloudMonthlyCost: projectedCloudMonthlyCost,
          edgeHardwareCost: this.EDGE_SERVER_COST,
          monthsToPayback: Math.ceil(monthsToPayback),
          recommendation
      };

    } catch (err: any) {
      logger.error(`[AiRoiEngine] Error simulating ROI: ${err.message}`);
      return { cloudMonthlyCost: 0, edgeHardwareCost: this.EDGE_SERVER_COST, monthsToPayback: 0, recommendation: "ERROR" };
    }
  }

  /**
   * Obtém os produtos B2B recomendados baseados na capacidade da escola.
   */
  public async getB2BMarketplaceRecommendations() {
      const studentsCount = (await this.db.all('SELECT COUNT(*) as count FROM students'))?.[0]?.count || 300;
      
      const recommendations: any[] = [];

      // Servidor Local (NPU/GPU)
      if (studentsCount > 250) {
          recommendations.push({
              category: "Sovereign AI Server",
              name: "Servidor Edge Áquila NPU 40 TOPS",
              price: "R$ 8.500",
              link: "https://marketplace.aquila.pro/afiliado/edge-server-tier1",
              icon: "Server"
          });
      }

      // Câmeras
      recommendations.push({
          category: "Visão Computacional",
          name: "Câmera IP Intelbras VIP 1230 D",
          price: "R$ 310 / unid",
          link: "https://marketplace.aquila.pro/afiliado/intelbras-vip1230d",
          icon: "Camera"
      });

      // Cabos / Switches
      if (studentsCount > 100) {
          recommendations.push({
              category: "Infraestrutura PoE",
              name: "Switch Intelbras PoE 16 Portas Gigabit",
              price: "R$ 1.250",
              link: "https://marketplace.aquila.pro/afiliado/switch-poe-16portas",
              icon: "Network"
          });
      }

      return recommendations;
  }
}

export const aiRoiEngineService = AiRoiEngineService.getInstance();
