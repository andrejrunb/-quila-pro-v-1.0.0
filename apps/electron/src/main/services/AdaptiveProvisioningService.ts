import { resourceMonitor } from './ResourceMonitorService';
import { ollamaIntegration } from './OllamaIntegration';
import { logger } from '../logger';
import { Database } from '../../database/Database';

/**
 * AdaptiveProvisioningService.ts — Phase 402 (Adaptive Hive)
 * Orquestra a escolha e instalação automática de modelos de IA com base no hardware local.
 */
export class AdaptiveProvisioningService {
  private isRunning = false;
  
  // Matriz de Tiers de Modelo (Hardware -> Ollama Model)
  private readonly MODEL_MATRIX: Record<number, string> = {
    0: 'phi',       // < 4GB (Tiny/Fallback)
    1: 'qwen:0.5b', // 4-8GB
    2: 'qwen:7b',   // 8-16GB
    3: 'llama3:8b'  // > 16GB (Standard Elite)
  };

  constructor() {}

  /**
   * Executa o provisionamento adaptativo.
   * Chamado no boot do sistema após o banco de dados estar pronto.
   */
  public async provision() {
    if (this.isRunning) return;
    this.isRunning = true;

    try {
      // Sovereign Check: Se houver um provedor soberano manual, ignoramos o auto-provisionamento do Ollama
      const db = Database.getInstance();
      const settings = await db.getSettings();
      const provider = settings.ai_provider || 'ollama';

      if (provider !== 'ollama') {
        logger.info(`[AdaptiveProvisioning] Provedor '${provider}' detectado. Ignorando auto-provisionamento local.`);
        return;
      }

      const tier = resourceMonitor.getHardwareTier();
      const totalRAM = resourceMonitor.getTotalMemoryGB();
      const targetModel = this.MODEL_MATRIX[tier];

      logger.info(`[AdaptiveProvisioning] Detectado Tier ${tier} (${totalRAM}GB RAM). Modelo Alvo: ${targetModel}`);

      // 1. Verificar modelos instalados
      const installedModels = await ollamaIntegration.listModels();
      const isAlreadyInstalled = installedModels.some(m => m.name.startsWith(targetModel));

      if (isAlreadyInstalled) {
        logger.info(`[AdaptiveProvisioning] Modelo ${targetModel} já está presente. Configurando.`);
        ollamaIntegration.setModel(targetModel);
      } else {
        logger.warn(`[AdaptiveProvisioning] Modelo ${targetModel} ausente. Iniciando provisionamento em background.`);
        
        // No v1 Adaptive, fazemos o pull automático. 
        // No futuro, isso pode disparar uma notificação P2P no enxame.
        const success = await ollamaIntegration.pullModel(targetModel);
        
        if (success) {
          ollamaIntegration.setModel(targetModel);
        } else {
          logger.error(`[AdaptiveProvisioning] Falha ao provisionar modelo ${targetModel}. Mantendo fallback.`);
        }
      }
    } catch (err) {
      logger.error(`[AdaptiveProvisioning] Erro crítico no provisionamento: ${err}`);
    } finally {
      this.isRunning = false;
    }
  }
}

export const adaptiveProvisioningService = new AdaptiveProvisioningService();
export default adaptiveProvisioningService;
