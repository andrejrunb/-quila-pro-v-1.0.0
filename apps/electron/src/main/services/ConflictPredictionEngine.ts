import { EventEmitter } from 'events';
import { socialGraphService } from './SocialGraphService';

export interface ConflictRisk {
  groupIds: string[];
  riskLevel: 'low' | 'medium' | 'high';
  reason: string;
  timestamp: number;
}

/**
 * Phase 520: ConflictPredictionEngine
 * Analisa o grafo social e expressões faciais para prever tensões.
 */
class ConflictPredictionEngine extends EventEmitter {
  
  constructor() {
    super();
    this.monitorGraph();
  }

  private monitorGraph() {
    socialGraphService.on('graph-updated', (data) => {
      this.analyzeRisk(data);
    });
  }

  private analyzeRisk(data: any) {
    // Simulação: se houver muitos links entre grupos pequenos em curto tempo
    const highFrictionLinks = data.links.filter((l: any) => l.strength > 0.7);
    
    if (highFrictionLinks.length > 2) {
      const risk: ConflictRisk = {
        groupIds: highFrictionLinks.map((l: any) => l.sourceId),
        riskLevel: 'high',
        reason: 'Padrão de fricção persistente detectado em zona de alta densidade.',
        timestamp: Date.now()
      };
      this.emit('risk-detected', risk);

      // Phase 600: Despacho Preventivo
      const { autonomousPatrolEngine } = require('./AutonomousPatrolEngine');
      autonomousPatrolEngine.handleCriticalEvent('PREDICTIVE_FRICTION', { x: -15, y: 30 });
    }
  }

}

export const conflictPredictionEngine = new ConflictPredictionEngine();

