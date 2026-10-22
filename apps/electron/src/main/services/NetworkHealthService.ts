import { logger } from '../logger';

export interface StreamHealth {
  ip: string;
  latency: number;
  packetLoss: number;
  bitrate: number;
  status: 'STABLE' | 'UNSTABLE' | 'CRITICAL';
}

/**
 * NetworkHealthService (Nível 35)
 * Monitora a integridade da rede de câmeras para garantir segurança ininterrupta.
 */
export class NetworkHealthService {
  private static instance: NetworkHealthService;

  private constructor() {}

  public static getInstance(): NetworkHealthService {
    if (!NetworkHealthService.instance) {
      NetworkHealthService.instance = new NetworkHealthService();
    }
    return NetworkHealthService.instance;
  }

  /**
   * Diagnostica a saúde de uma conexão RTSP.
   */
  public async diagnoseStream(ip: string): Promise<StreamHealth> {
    logger.debug(`[Health] Diagnosticando stream em ${ip}`);
    
    // Simulação de teste de latência e perda de pacotes
    const latency = Math.floor(Math.random() * 50) + 10; // 10-60ms
    const packetLoss = Math.random() * 0.5; // 0-0.5%
    
    return {
      ip,
      latency,
      packetLoss,
      bitrate: 4096, // 4Mbps
      status: latency > 150 || packetLoss > 2 ? 'UNSTABLE' : 'STABLE'
    };
  }
}

export const networkHealthService = NetworkHealthService.getInstance();
