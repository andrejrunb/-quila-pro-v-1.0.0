import { EventEmitter } from 'events';
import { logger } from '../logger';
import { nexusFederationService } from './NexusFederationService';
import { legalEvidenceService } from './LegalEvidenceService';

export interface ThreatSignature {
  id: string;
  type: 'BEHAVIORAL' | 'NETWORK' | 'IDENTITY';
  pattern: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  originHub: string;
  signature: string;
}

/**
 * Nível 18 — ThreatIntelligenceExchange
 * Motor de "Vacinas Digitais" para a malha Nexus.
 */
export class ThreatIntelligenceExchange extends EventEmitter {
  private static instance: ThreatIntelligenceExchange;
  private knownSignatures: Map<string, ThreatSignature> = new Map();

  private constructor() {
    super();
    this.startListeningForVaccines();
  }

  public static getInstance(): ThreatIntelligenceExchange {
    if (!ThreatIntelligenceExchange.instance) {
      ThreatIntelligenceExchange.instance = new ThreatIntelligenceExchange();
    }
    return ThreatIntelligenceExchange.instance;
  }

  private startListeningForVaccines() {
    // Escutar por novas assinaturas recebidas via NexusFederation
    nexusFederationService.on('sync-completed', (peerId) => {
      logger.info(`[Threat-Intel] Received intelligence update from ${peerId}`);
    });
  }

  /**
   * Disseminar uma nova vacina digital para a rede.
   */
  public async broadcastVaccine(type: ThreatSignature['type'], pattern: string, severity: ThreatSignature['severity']) {
    const id = `VAC-${Date.now()}`;
    const signature = `SIG-${Math.random().toString(36).substring(7)}`;

    const vaccine: ThreatSignature = {
      id,
      type,
      pattern,
      severity,
      originHub: 'LOCAL-HUB-PRIMARY',
      signature
    };

    this.knownSignatures.set(id, vaccine);
    logger.warn(`[Threat-Intel] Broadcasting Digital Vaccine: ${type} - ${pattern}`);

    // Enviar para todos os peers conectados
    const peers = nexusFederationService.getPeers();
    for (const peer of peers) {
      await nexusFederationService.syncCollectiveIntelligence(peer.id, vaccine);
    }

    this.emit('vaccine-broadcasted', vaccine);
  }

  public getKnownSignatures(): ThreatSignature[] {
    return Array.from(this.knownSignatures.values());
  }
}

export const threatIntelligenceExchange = ThreatIntelligenceExchange.getInstance();
