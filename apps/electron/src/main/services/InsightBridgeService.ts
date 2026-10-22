import { injectable, inject } from 'inversify';
import { SyncPacket } from '../../services/AiTypes';
import { SovereignMeshService } from './SovereignMeshService';
import { CorporateAuditService } from './CorporateAuditService';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../logger';

@injectable()
export class InsightBridgeService {
  private static instance: InsightBridgeService;

  constructor(
    @inject(SovereignMeshService) private mesh: SovereignMeshService,
    @inject(CorporateAuditService) private corporateAudit: CorporateAuditService
  ) {}

  public static getInstance(): InsightBridgeService {
    if (!InsightBridgeService.instance) {
      InsightBridgeService.instance = new InsightBridgeService(
        SovereignMeshService.getInstance(),
        CorporateAuditService.getInstance()
      );
    }
    return InsightBridgeService.instance;
  }

  /**
   * Envia um pedido de ajuda pedagógica para o enxame via Broker.
   */
  async requestPedagogicalHelp(topic: string, tenantId: string) {
    const packet: SyncPacket = {
      id: uuidv4(),
      sourceNode: this.mesh.getNodeId ? this.mesh.getNodeId() : 'local-node',
      targetNode: 'CORPORATE_BROKER',
      tenantId: tenantId,
      payloadType: 'BRIDGE_HELP_REQUEST',
      timestamp: Date.now(),
      payload: {
        topic,
        urgent: true
      }
    };

    // No modelo federado, enviamos para o Broker que decide o roteamento
    await this.mesh.broadcast(packet);
    logger.info(`[InsightBridge] Pedido de ajuda sobre "${topic}" enviado ao enxame (via Broker).`);
  }

  /**
   * Processa um pedido de ajuda recebido. 
   * Apenas o Broker ou nós autorizados devem responder.
   */
  async handleIncomingHelpRequest(packet: SyncPacket) {
    if (packet.payloadType !== 'BRIDGE_HELP_REQUEST') return;

    logger.info(`[InsightBridge] Recebido pedido de ajuda do Broker para o tópico: ${packet.payload.topic}`);
    
    // Simulação: O robô corporativo já faz o matching inicial.
    // Aqui poderíamos disparar uma busca local na biblioteca e sugerir resposta ao usuário.
  }

  /**
   * Envia uma resposta (material) para um pedido de ajuda.
   */
  async respondWithMaterial(requestId: string, materialId: string, targetTenantId: string) {
    const packet: SyncPacket = {
      id: uuidv4(),
      sourceNode: this.mesh.getNodeId ? this.mesh.getNodeId() : 'local-node',
      targetNode: targetTenantId,
      payloadType: 'HELP_RESPONSE',
      timestamp: Date.now(),
      payload: {
        requestId,
        materialId
      }
    };

    await this.mesh.broadcast(packet);
    logger.info(`[InsightBridge] Resposta enviada para o pedido ${requestId}.`);
  }
}

export const insightBridgeService = InsightBridgeService.getInstance();
