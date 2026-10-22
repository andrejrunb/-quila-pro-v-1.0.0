import { EventEmitter } from 'events';
import { logger } from '../logger';

export enum EnergyMode {
  PERFORMANCE = 'performance', // Full power, high FPS
  BALANCED = 'balanced',       // Optimized, adaptive FPS
  CONSERVATION = 'conservation' // Low power, minimal background tasks
}

export interface GridStatus {
  source: 'AC' | 'Battery' | 'Solar';
  batteryLevel: number; // 0-100
  consumptionWatts: number;
  uptimeOnCurrentSource: number; // seconds
  mode: EnergyMode;
}

/**
 * Nível 15 — SovereignGridService
 * Responsável por gerir o consumo energético do Áquila Edge Hub.
 */
export class SovereignGridService extends EventEmitter {
  private static instance: SovereignGridService;
  private currentStatus: GridStatus = {
    source: 'AC',
    batteryLevel: 100,
    consumptionWatts: 45, // Média base para Edge Hub octacore
    uptimeOnCurrentSource: 0,
    mode: EnergyMode.PERFORMANCE
  };

  private constructor() {
    super();
    this.startMonitoring();
  }

  public static getInstance(): SovereignGridService {
    if (!SovereignGridService.instance) {
      SovereignGridService.instance = new SovereignGridService();
    }
    return SovereignGridService.instance;
  }

  private startMonitoring() {
    setInterval(() => {
      this.simulateGridFluctuations();
      this.emit('grid-status-updated', this.currentStatus);
    }, 5000);
    
    logger.info('[Green-Sovereignty] SovereignGridService Initialized');
  }

  private simulateGridFluctuations() {
    // Simular flutuação de consumo baseado na carga de IA
    this.currentStatus.consumptionWatts = 40 + Math.random() * 20;
    this.currentStatus.uptimeOnCurrentSource += 5;
    
    // Auto-ajuste de modo se a bateria cair (Simulação)
    if (this.currentStatus.source === 'Battery') {
      this.currentStatus.batteryLevel -= 0.1;
      if (this.currentStatus.batteryLevel < 30) {
        this.setEnergyMode(EnergyMode.CONSERVATION);
      } else if (this.currentStatus.batteryLevel < 70) {
        this.setEnergyMode(EnergyMode.BALANCED);
      }
    }
  }

  public setEnergyMode(mode: EnergyMode) {
    if (this.currentStatus.mode !== mode) {
      this.currentStatus.mode = mode;
      logger.warn(`[Energy] System switched to ${mode.toUpperCase()} mode`);
      this.emit('mode-changed', mode);
    }
  }

  public setPowerSource(source: 'AC' | 'Battery' | 'Solar') {
    this.currentStatus.source = source;
    this.currentStatus.uptimeOnCurrentSource = 0;
    
    if (source !== 'AC') {
      this.setEnergyMode(EnergyMode.BALANCED);
    } else {
      this.setEnergyMode(EnergyMode.PERFORMANCE);
    }
    
    this.emit('source-changed', source);
  }

  public getStatus(): GridStatus {
    return { ...this.currentStatus };
  }

  /**
   * Calcula a economia de CO2 baseada no processamento local (Edge)
   * Evitar o tráfego e processamento em data centers cloud economiza energia.
   */
  public calculateCO2Savings(): number {
    // Premissa: 1.2kg de CO2 salvos por mês por câmera processada localmente
    // Em produção, isso usaria métricas reais de rede.
    return 14.5; // kg CO2 / mês
  }
}

export const sovereignGridService = SovereignGridService.getInstance();
