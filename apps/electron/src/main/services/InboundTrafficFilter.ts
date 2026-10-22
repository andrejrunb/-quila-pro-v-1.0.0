import { logger } from '../logger';

/**
 * InboundTrafficFilter - Camada 0 SQA-1000 (SEC-701)
 * Firewall interno para a rede Nexus Mesh.
 */
export class InboundTrafficFilter {
  private static instance: InboundTrafficFilter;
  private whitelist: Set<string> = new Set();

  private constructor() {
    // Whitelist inicial de serviços locais
    this.whitelist.add('127.0.0.1');
    this.whitelist.add('::1');
  }

  public static getInstance(): InboundTrafficFilter {
    if (!InboundTrafficFilter.instance) {
      InboundTrafficFilter.instance = new InboundTrafficFilter();
    }
    return InboundTrafficFilter.instance;
  }

  /**
   * [SQA-SEC-701] Filtra pacotes de entrada na malha.
   */
  public filterPacket(srcIp: string, payload: any): boolean {
    if (!this.whitelist.has(srcIp)) {
      logger.warn(`[Firewall] Bloqueada tentativa de conexão de origem não autorizada: ${srcIp}`);
      return false;
    }
    
    // Verificação de assinatura no payload (simulada)
    if (payload && !payload.signature) {
      logger.error(`[Firewall] Pacote de ${srcIp} rejeitado por falta de assinatura soberana.`);
      return false;
    }

    return true;
  }

  public authorizeNode(ip: string): void {
    this.whitelist.add(ip);
    logger.info(`[Firewall] Nó ${ip} autorizado na whitelist Nexus.`);
  }
}

export const inboundTrafficFilter = InboundTrafficFilter.getInstance();

