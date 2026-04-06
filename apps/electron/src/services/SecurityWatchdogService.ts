import { logger } from '../main/logger';
import { nexusSyncService } from './NexusSyncService';
import { SyncPacket } from './AiTypes';
import { pushNotificationService } from './PushNotificationService';

interface GlobalSession {
  userId: string;
  nodeId: string;
  deviceType: 'desktop' | 'mobile';
  timestamp: number;
}

/**
 * SecurityWatchdogService (v3459)
 * Monitoramento global de acessos no Enxame acadêmico.
 */
export class SecurityWatchdogService {
  private activeSessions: Map<string, GlobalSession> = new Map();

  constructor() {
    this.listenForNetworkPulses();
  }

  public start() {
    logger.info('[SecurityWatchdog] Monitoramento iniciado.');
    setInterval(() => this.runDiagnostics(), 300000); // 5 min
  }

  private async runDiagnostics() {
  }

  /**
   * Escuta sincronização de sessões vindas de outros nós da escola.
   */
  private listenForNetworkPulses() {
    nexusSyncService.on('nexus-pulse', (packet: SyncPacket) => {
      if (packet.payloadType === 'session_sync') {
        this.handleSyncEvent(packet);
      }
    });
  }

  private handleSyncEvent(packet: SyncPacket) {
    const { userId, action, deviceType } = packet.payload;
    const nodeId = packet.sourceNode;

    if (action === 'login') {
      this.detectConflicts(userId, nodeId, deviceType);
      this.activeSessions.set(`${userId}_${nodeId}`, {
        userId,
        nodeId,
        deviceType,
        timestamp: packet.timestamp
      });
    } else if (action === 'logout') {
      this.activeSessions.delete(`${userId}_${nodeId}`);
    }
  }

  /**
   * Lógica de Detecção de Invasão/Duplicidade.
   */
  private async detectConflicts(userId: string, incomingNodeId: string, deviceType: string) {
    // Permitimos múltiplos logins se um deles for Mobile (Pareamento)
    if (deviceType === 'mobile') return;

    // Verificar se o usuário já tem uma sessão Desktop ativa em OUTRO nó
    for (const [key, session] of this.activeSessions.entries()) {
      if (session.userId === userId && session.nodeId !== incomingNodeId && session.deviceType === 'desktop') {
        
        logger.warn(`[Watchdog] 🚨 CONFLITO DETECTADO: Usuário ${userId} logado em ${session.nodeId} e agora em ${incomingNodeId}.`);

        // Disparar Alerta Crítico para o Mobile do Professor
        await pushNotificationService.sendToUser(userId, {
          title: '⚠️ ACESSO DUPLICADO DETECTADO',
          body: `Sua conta foi acessada em outro terminal (${incomingNodeId}). Se não foi você, mude sua senha imediatamente.`,
          priority: 'high'
        });

        // Reportar para a Coordenação de TI
        await pushNotificationService.sendToRole('TECH_SUPPORT', {
          title: '🛡️ BLOQUEIO DE SEGURANÇA',
          body: `Possível tentativa de invasão na conta de ${userId}. Acesso simultâneo detectado.`,
          priority: 'high'
        });
      }
    }
  }

  /**
   * Registro de login local (chamado pelo SessionService).
   */
  public registerLocalLogin(userId: string, deviceType: 'desktop' | 'mobile') {
    nexusSyncService.broadcastSessionAction(userId, 'login', deviceType);
  }
}

export const securityWatchdogService = new SecurityWatchdogService();
