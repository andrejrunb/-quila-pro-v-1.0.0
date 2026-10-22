import { EventEmitter } from 'events';
import { GhostPresence } from '../../services/AiTypes';
import { logger } from '../logger';

/**
 * WiFiDensePoseService (Phase v3441)
 * Implementa a detecção passiva de presença e postura via assinaturas de sinal WiFi CSI.
 * Permite o monitoramento de áreas sem câmeras (ex: Banheiros, Vestiários).
 */
class WiFiDensePoseService extends EventEmitter {
  private static instance: WiFiDensePoseService;
  private ghosts: Map<string, GhostPresence> = new Map();

  private constructor() {
    super();
  }

  /**
   * Inicia o processamento de sinais CSI (WiFi Ghosts).
   */
  public start() {
    logger.info('[DensePose] Monitoramento passivo INICIADO.');
    this.startSimulation();
  }

  public static getInstance(): WiFiDensePoseService {
    if (!WiFiDensePoseService.instance) {
      WiFiDensePoseService.instance = new WiFiDensePoseService();
    }
    return WiFiDensePoseService.instance;
  }

  /**
   * Simula a captura de assinaturas CSI.
   */
  private startSimulation() {
    setInterval(() => {
      // Pequena flutuação de ruído de sinal (CSI variance)
      if (Math.random() > 0.75) {
        this.generateGhostEvent();
      }
    }, 15000); 
  }

  private generateGhostEvent() {
    const isFall = Math.random() > 0.94; // Raridade do evento de queda
    const zoneId = ['WC_MASC_L3', 'VESTIARIO_SUL', 'COZINHA_PRO_B', 'BIBLIOTECA_ALMA'].at(Math.floor(Math.random() * 4)) || 'UNKNOWN_ZONE';
    
    const ghost: GhostPresence = {
      id: `csi_node_${Math.random().toString(36).substring(7)}`,
      x: 2 + Math.random() * 18,
      y: 1 + Math.random() * 9,
      z: isFall ? 0.2 : 1.4, // Altura estimada do centro de massa
      posture: isFall ? 'FALLEN' : (Math.random() > 0.6 ? 'STANDING' : 'MOVING'),
      confidence: 0.85 + Math.random() * 0.12,
      timestamp: new Date().toISOString(),
      zoneId: zoneId
    };

    console.log(`[PassiveSafety] Presença Detectada via WiFi em ${zoneId}: ${ghost.posture}`);
    this.ghosts.set(ghost.id, ghost);
    this.emit('ghost-detected', ghost);

    if (isFall || ghost.posture === 'FALLEN') {
       console.error(`[CRITICAL] ALERTA DE QUEDA PASSIVA (DENSEPOSE) EM ${zoneId}`);
       this.emit('passive-fall-alert', ghost);
    }

    // Auto-limpeza após 25 segundos
    setTimeout(() => {
       if (this.ghosts.has(ghost.id)) {
         this.ghosts.delete(ghost.id);
         this.emit('ghost-lost', ghost.id);
       }
    }, 25000);
  }

  public getActiveGhosts(): GhostPresence[] {
    return Array.from(this.ghosts.values());
  }

  public hasPresenceInZone(zoneId: string): boolean {
    return Array.from(this.ghosts.values()).some(g => g.zoneId === zoneId);
  }
}

export const wiFiDensePoseService = WiFiDensePoseService.getInstance();

