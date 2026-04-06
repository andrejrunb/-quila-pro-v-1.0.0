import { npuOptimizer } from './NpuOptimizationService';
import { nexusSyncService } from './NexusSyncService';
import { logger } from '../main/logger';

/**
 * NPU LOAD BALANCER (v3642)
 * -------------------------
 * Orquestra a carga de inferência LLM entre os nós do enxame.
 * Implementa a estratégia "Least-Hot Node" para evitar degradação de hardware.
 */
export class NpuLoadBalancer {
  private static instance: NpuLoadBalancer;
  private localPort: number = 11434;

  private constructor() {}

  public static getInstance(): NpuLoadBalancer {
    if (!NpuLoadBalancer.instance) {
      NpuLoadBalancer.instance = new NpuLoadBalancer();
    }
    return NpuLoadBalancer.instance;
  }

  /**
   * [SQA-NPU-715] Retorna o endpoint ideal para a próxima inferência.
   * Analisa a temperatura local e a carga do enxame Nexus.
   */
  public async getOptimalEndpoint(): Promise<string> {
    const localHealth = npuOptimizer.getThermalState();
    
    // Se o chip local estiver acima de 80C ou em estrangulamento térmico (Throttling)
    if (localHealth.temperature > 80 || localHealth.isThrottling) {
      logger.warn(`[LoadBalancer] Nó local em estresse térmico (${localHealth.temperature}C). Iniciando Failover Soberano...`);
      
      const peer = this.findHealthyPeer();
      if (peer) {
        logger.info(`[LoadBalancer] Offload efetuado para: ${peer.name} (${peer.id})`);
        // Em produção, o Peer teria um campo 'endpoint' real (IP:Porta)
        return `http://${peer.id}.local:${this.localPort}`;
      }
      
      logger.error(`[LoadBalancer] Nenhum nó saudável encontrado no Nexus. Mantendo local sob risco.`);
    }

    // Default: Processamento local focado em Soberania de Dados
    return `http://localhost:${this.localPort}`;
  }

  /**
   * Encontra um nó no enxame com menor carga térmica e computacional.
   */
  private findHealthyPeer() {
    const nodes = nexusSyncService.getNodes();
    
    // Critério: Status 'synced', Carga < 70%, e não ser o nó local
    const candidates = nodes.filter(n => 
      n.syncStatus === 'synced' && 
      n.load < 0.7 && 
      n.id !== 'nexus_alpha' // Considerando alpha como local neste contexto
    );

    // Retorna o nó mais livre (Least Loaded)
    return candidates.sort((a, b) => a.load - b.load)[0];
  }

  /**
   * Rotina de report de tarefa (v3642)
   */
  public reportTaskComplete(nodeId: string, durationMs: number) {
    if (durationMs > 2000) {
      logger.warn(`[LoadBalancer] Inferência lenta detectada no nó ${nodeId}: ${durationMs}ms`);
    }
  }
}

export const npuLoadBalancer = NpuLoadBalancer.getInstance();
