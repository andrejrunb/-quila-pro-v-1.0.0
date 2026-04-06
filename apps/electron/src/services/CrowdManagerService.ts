import { EventEmitter } from 'events';

export interface ZoneDensity {
  zoneId: string;
  count: number;
  density: number; // people per m2
  status: 'OPTIMAL' | 'MODERATE' | 'CONGESTED' | 'DANGEROUS';
  timestamp: string;
}

/**
 * CrowdManagerService (v1623)
 * Monitoramento de densidade de fluxo em tempo real.
 * Ajuda a prevenir aglomerações e pisoteamentos.
 */
class CrowdManagerService extends EventEmitter {
  private zoneStates: Map<string, ZoneDensity> = new Map();
  private readonly DENSITY_LIMIT = 2; // 2 pessoas por m2 para moderado
  private readonly CRITICAL_LIMIT = 4; // 4 pessoas por m2 para perigoso

  constructor() {
    super();
  }

  public updateZoneCount(zoneId: string, count: number, areaM2: number) {
    const density = count / areaM2;
    let status: ZoneDensity['status'] = 'OPTIMAL';

    if (density >= this.CRITICAL_LIMIT) {
      status = 'DANGEROUS';
    } else if (density >= this.DENSITY_LIMIT) {
      status = 'CONGESTED';
    } else if (density > 1) {
      status = 'MODERATE';
    }

    const state: ZoneDensity = {
      zoneId,
      count,
      density,
      status,
      timestamp: new Date().toISOString()
    };

    this.zoneStates.set(zoneId, state);
    this.emit('density_update', state);

    if (status === 'DANGEROUS' || status === 'CONGESTED') {
      this.emit('crowd_alert', state);
    }
  }

  public getZoneState(zoneId: string): ZoneDensity | undefined {
    return this.zoneStates.get(zoneId);
  }

  public getAllStates(): ZoneDensity[] {
    return Array.from(this.zoneStates.values());
  }
}

export const crowdManager = new CrowdManagerService();
