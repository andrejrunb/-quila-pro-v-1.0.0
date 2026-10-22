import { logger } from '../logger';

export interface ResourceState {
  type: 'ENERGY' | 'WATER';
  location: string;
  consumption: number; // Watts ou Litros/min
  status: 'OPTIMIZED' | 'NORMAL' | 'WASTE_DETECTED';
}

/**
 * ResourceOrchestrationService (Nível 38)
 * Orquestra o consumo de recursos físicos da escola via automação inteligente.
 */
export class ResourceOrchestrationService {
  private static instance: ResourceOrchestrationService;
  private resources: ResourceState[] = [];

  private constructor() {
    this.resources = [
      { type: 'ENERGY', location: 'Bloco A - Salas 101-105', consumption: 1200, status: 'OPTIMIZED' },
      { type: 'WATER', location: 'Vestiários Masculinos', consumption: 50, status: 'NORMAL' }
    ];
  }

  public static getInstance(): ResourceOrchestrationService {
    if (!ResourceOrchestrationService.instance) {
      ResourceOrchestrationService.instance = new ResourceOrchestrationService();
    }
    return ResourceOrchestrationService.instance;
  }

  /**
   * Ajusta o consumo baseado na ocupação detectada.
   */
  public async adjustToOccupancy(location: string, occupancy: number) {
    logger.info(`[Eco] Ajustando recursos para ${location} (Ocupação: ${occupancy})`);
    
    // Se ocupação é zero, desligar luzes/ar (Eco-Mode)
    if (occupancy === 0) {
      this.updateResourceStatus(location, 'OPTIMIZED', 10); // 10W standby
    } else {
      this.updateResourceStatus(location, 'NORMAL', 500 + (occupancy * 50));
    }
  }

  private updateResourceStatus(location: string, status: ResourceState['status'], consumption: number) {
    const res = this.resources.find(r => r.location === location);
    if (res) {
      res.status = status;
      res.consumption = consumption;
    }
  }

  public getStates() {
    return this.resources;
  }
}

export const resourceOrchestrationService = ResourceOrchestrationService.getInstance();
