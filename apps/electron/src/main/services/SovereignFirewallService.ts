import * as crypto from 'crypto';
import { logger } from '../logger';
import { SyncPacket } from '../../services/AiTypes';

/**
 * SOVEREIGN FIREWALL SERVICE (v3641)
 * ---------------------------------
 * Camada de defesa soberana do Áquila Pro.
 * Garante que apenas pacotes assinados por autoridades (Nó Alpha) 
 * possam realizar ações críticas no enxame local.
 */
export class SovereignFirewallService {
  private static instance: SovereignFirewallService;
  private secret: string;
  private alphaNodeId: string = 'nexus_alpha';
  private blockedNodes: Set<string> = new Set();
  private threatLog: any[] = [];

  private constructor() {
    // Segredo compartilhado do enxame (v3501)
    this.secret = process.env.ALPHA_SECRET || 'aquila-swarm-sovereignty-default-secret-2024';
  }

  public static getInstance(): SovereignFirewallService {
    if (!SovereignFirewallService.instance) {
      SovereignFirewallService.instance = new SovereignFirewallService();
    }
    return SovereignFirewallService.instance;
  }

  /**
   * [SQA-FW-665] Verifica se um pacote é autêntico e autorizado.
   */
  public verifyPacket(packet: SyncPacket): boolean {
    if (!packet.signature) {
      // Pacotes internos ou de telemetria básica podem ser aceitos se não forem admin
      if (this.isAdminCommand(packet)) {
        this.logThreat(packet, 'MISSING_SIGNATURE_ON_ADMIN_COMMAND');
        return false;
      }
      return true; 
    }

    if (this.blockedNodes.has(packet.sourceNode)) {
      return false;
    }

    const expectedSignature = this.generateSignature(packet);
    if (packet.signature !== expectedSignature) {
      this.logThreat(packet, 'INVALID_SIGNATURE');
      this.blockNode(packet.sourceNode);
      return false;
    }

    return true;
  }

  /**
   * [SQA-FW-668] Gera assinatura HMAC para um pacote de saída.
   */
  public signPacket(packet: any): string {
    return this.generateSignature(packet);
  }

  /**
   * [SQA-FW-670] Registro manual de ameaça vindo de outros serviços (v3701).
   */
  public reportManualThreat(details: { source: string; type: string; severity: string; metadata?: any }) {
    const entry = {
      timestamp: Date.now(),
      source: details.source,
      type: details.type,
      reason: details.type,
      severity: details.severity,
      metadata: details.metadata
    };
    this.threatLog.push(entry);
    logger.error(`[Firewall] AMEAÇA EXTERNA REGISTRADA: ${details.type} de ${details.source}`);
  }

  private generateSignature(packet: any): string {
    const dataToSign = JSON.stringify({
      id: packet.id,
      source: packet.sourceNode,
      type: packet.payloadType,
      ts: packet.timestamp,
      data: packet.payload
    });

    // v701: Upgrade para SHA3-256 (Quantum Resilience)
    // Se o pacote for marcado como high_sovereignty, usamos SHA3-256
    const algorithm = (packet.securityLevel === 'high_sovereignty') ? 'sha3-256' : 'sha256';

    try {
      return crypto
        .createHmac(algorithm, this.secret)
        .update(dataToSign)
        .digest('hex');
    } catch (e) {
      // Fallback para sha256 caso o environment não suporte sha3 nativamente (Node < 12)
      return crypto
        .createHmac('sha256', this.secret)
        .update(dataToSign)
        .digest('hex');
    }
  }

  private isAdminCommand(packet: SyncPacket): boolean {
    const criticalTypes = ['admin_command', 'parity_response', 'system_update'];
    return criticalTypes.includes(packet.payloadType as string);
  }

  private logThreat(packet: SyncPacket, reason: string) {
    const entry = {
      timestamp: Date.now(),
      source: packet.sourceNode,
      type: packet.payloadType,
      reason,
      severity: 'high'
    };
    this.threatLog.push(entry);
    logger.error(`[Firewall] AMEAÇA DETECTADA: ${reason} de ${packet.sourceNode}`);
  }

  public blockNode(nodeId: string) {
    this.blockedNodes.add(nodeId);
    logger.warn(`[Firewall] Nó bloqueado por falha de segurança: ${nodeId}`);
  }

  public getBlockedNodes(): string[] {
    return Array.from(this.blockedNodes);
  }

  public getThreatReport() {
    return {
      status: 'Shield active',
      threatCount: this.threatLog.length,
      blockedNodes: Array.from(this.blockedNodes),
      recentLogs: this.threatLog.slice(-10)
    };
  }
}

export const sovereignFirewall = SovereignFirewallService.getInstance();

