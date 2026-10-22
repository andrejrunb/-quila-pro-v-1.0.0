import { EventEmitter } from 'events';
import { logger } from '../logger';
import { agentOrchestratorService } from './AgentOrchestratorService';

export interface PulseEntry {
  agent: string;
  thought: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
}

/**
 * Nível 17 — SwarmPulseService
 * Consolida a "consciência" de todos os agentes do Hub em um stream unificado.
 */
export class SwarmPulseService extends EventEmitter {
  private static instance: SwarmPulseService;
  private pulseHistory: PulseEntry[] = [];

  private constructor() {
    super();
    this.startPulsing();
  }

  public static getInstance(): SwarmPulseService {
    if (!SwarmPulseService.instance) {
      SwarmPulseService.instance = new SwarmPulseService();
    }
    return SwarmPulseService.instance;
  }

  private startPulsing() {
    setInterval(() => {
      this.generateSyntheticPulse();
    }, 5000);
    
    logger.info('[Swarm-Pulse] Cognitive Telemetry Active (Level 17)');
  }

  private generateSyntheticPulse() {
    const agents = ['Security', 'Admin', 'Teacher', 'Coordinator', 'Reception'];
    const thoughts = [
      "Monitorando estabilidade térmica da NPU...",
      "Analisando padrões de presença na Zona Sul.",
      "Sincronizando modelos de aprendizagem entre Hubs.",
      "Detectado potencial conflito de horário no Bloco B.",
      "Verificando integridade das evidências forenses."
    ];

    const agent = agents[Math.floor(Math.random() * agents.length)];
    const thought = thoughts[Math.floor(Math.random() * thoughts.length)];
    
    const entry: PulseEntry = {
      agent,
      thought,
      priority: Math.random() > 0.8 ? 'high' : 'medium',
      timestamp: new Date()
    };

    this.pulseHistory.push(entry);
    if (this.pulseHistory.length > 50) this.pulseHistory.shift();

    this.emit('pulse', entry);
    
    // Detecção de conflito (Simulada)
    if (Math.random() > 0.95) {
      this.emit('swarm-conflict', {
        agents: ['Security', 'Admin'],
        reason: 'Priority mismatch on Entrance 01 lock state.'
      });
    }
  }

  public getRecentPulse(): PulseEntry[] {
    return [...this.pulseHistory].reverse();
  }
}

export const swarmPulseService = SwarmPulseService.getInstance();
