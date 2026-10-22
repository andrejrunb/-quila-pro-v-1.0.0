import { EventEmitter } from 'events';

export interface VoiceMetric {
  decibels: number;
  frequency: number;
  panicScore: number;
  detectedKeywords: string[];
  location: string;
}

/**
 * Phase 401+ Voice Intelligence Service
 * Simula análise de áudio para detecção de pânico, gritos e palavras-chave.
 */
class VoiceIntelligenceService extends EventEmitter {
  private currentMetrics: Record<string, VoiceMetric> = {};

  constructor() {
    super();
    this.startSimulation();
  }

  private startSimulation() {
    setInterval(() => {
      const locations = ['Entrada', 'Pátio', 'Corredor A', 'Refeitório'];
      const location = locations[Math.floor(Math.random() * locations.length)];
      
      // Simular variação normal (background noise)
      const baseDb = 45 + Math.random() * 15;
      const metric: VoiceMetric = {
        decibels: baseDb,
        frequency: 200 + Math.random() * 800,
        panicScore: baseDb > 85 ? 0.8 : 0.1,
        detectedKeywords: baseDb > 85 ? ['SOCORRO', 'AJUDA'] : [],
        location
      };

      this.currentMetrics[location] = metric;
      this.emit('audio-update', metric);

      // Alerta de pânico se dB > 90
      if (metric.decibels > 90) {
        const { mobileGuardService } = require('./MobileGuardService');
        mobileGuardService.sendNotification({
          type: 'critical',
          message: `ALERTA DE SEGURANÇA: Ruído Crítico em ${metric.location}`,
          location: metric.location
        });
        
        // Phase 600: Despacho Automático de Drone
        const { autonomousPatrolEngine } = require('./AutonomousPatrolEngine');
        autonomousPatrolEngine.handleCriticalEvent('PANIC_VOICE', { x: 25, y: -10 });

        this.emit('panic-alert', metric);
      }
    }, 5000);
  }

  getMetrics() {
    return Object.values(this.currentMetrics);
  }
}

export const voiceIntelligenceService = new VoiceIntelligenceService();

