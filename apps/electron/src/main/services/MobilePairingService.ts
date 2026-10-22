import * as crypto from 'crypto';
import { swarmEntropyService } from './SwarmEntropyService';
import { sovereignFirewall } from './SovereignFirewallService';
import { logger } from '../logger';

/**
 * MOBILE PAIRING SERVICE (v3643)
 * ------------------------------
 * Estabelece o vínculo de confiança entre o desktop da escola e o app mobile.
 * Utiliza o Swarm Entropy para gerar segredos de pareamento e assinaturas HMAC.
 */
export interface PairingData {
  parentId: string;
  pairingSecret: string;
  createdAt: number;
  expiresAt: number;
}

export class MobilePairingService {
  private static instance: MobilePairingService;
  private pairings: Map<string, PairingData> = new Map();

  private constructor() {}

  public static getInstance(): MobilePairingService {
    if (!MobilePairingService.instance) {
      MobilePairingService.instance = new MobilePairingService();
    }
    return MobilePairingService.instance;
  }

  public generatePairingToken(parentId: string): string {
    const seed = swarmEntropyService.getSwarmSeed();
    const pairingSecret = crypto.createHash('sha256').update(`${parentId}-${seed}-${Date.now()}`).digest('hex');
    
    this.pairings.set(parentId, {
      parentId,
      pairingSecret,
      createdAt: Date.now(),
      expiresAt: Date.now() + (1000 * 60 * 15) // 15 minutos de validade
    });

    logger.info(`[MobilePairing] Novo token gerado para ${parentId} (Sovereign Swarm Enabled)`);
    
    // Payload do QR-Code: ID do Responsável + Hostname Local + Segredo
    return Buffer.from(JSON.stringify({
      pId: parentId,
      host: ' nexus_alpha',
      secret: pairingSecret
    })).toString('base64');
  }

  /**
   * [SQA-PAR-768] Verifica se a requisição mobile está assinada corretamente.
   */
  public verifyDeviceRequest(parentId: string, signature: string, payload: any): boolean {
    const pairing = this.pairings.get(parentId);
    if (!pairing || Date.now() > pairing.expiresAt) {
      logger.warn(`[MobilePairing] Falha de verificação: Pareamento inexistente ou expirado para ${parentId}`);
      return false;
    }

    const dataToSign = JSON.stringify(payload);
    const expectedSignature = crypto
      .createHmac('sha256', pairing.pairingSecret)
      .update(dataToSign)
      .digest('hex');

    if (signature !== expectedSignature) {
      logger.error(`[MobilePairing] ASSINATURA INVÁLIDA de dispositivo mobile para ${parentId}`);
      
      // Notifica o firewall soberano sobre a tentativa maliciosa (v3504)
      sovereignFirewall.reportManualThreat({
         source: `MobileApp_${parentId}`,
         type: 'INVALID_SIGNATURE',
         severity: 'HIGH',
         metadata: { signature, expected: expectedSignature }
      });

      return false;
    }

    return true;
  }

  public getPairingStatus(parentId: string) {
    const pairing = this.pairings.get(parentId);
    return {
      isPaired: !!pairing,
      isActive: pairing ? Date.now() < pairing.expiresAt : false,
      expiresIn: pairing ? Math.max(0, pairing.expiresAt - Date.now()) : 0
    };
  }
}

export const mobilePairingService = MobilePairingService.getInstance();

