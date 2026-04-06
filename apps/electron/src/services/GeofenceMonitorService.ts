import { parentPortal } from './ParentPortalService';
import { logger } from '../main/logger';

/**
 * GeofenceMonitorService (v1634)
 * Simula a detecção de pais por proximidade via Geofencing.
 */
export interface ParentArrival {
  parentId: string;
  parentName: string;
  studentIds: string[]; // Alterado para IDs reais
  distanceMeters: number;
  etaMinutes: number;
  status: 'ARRIVING' | 'AT_GATE' | 'IDLE';
}

class GeofenceMonitorService {
  private activeArrivals: Map<string, ParentArrival> = new Map();
  private averageSpeed = 30; // km/h
  private db: any;

  /**
   * [SQA-GEO-101] Inicializa o serviço com o banco de dados.
   */
  public init(db: any) {
    this.db = db;
    logger.info('[Geofencing] Monitor inicializado.');
  }

  /**
   * Inicia o monitoramento ativo de proximidade.
   */
  public start() {
    logger.info('[Geofencing] Radar de ETA ativado.');
  }

  /**
   * Atualiza posição mockada do pai e dispara eventos no enxame
   */
  public updateParentPosition(parentId: string, name: string, studentIds: string[], distance: number) {
    let status: ParentArrival['status'] = 'IDLE';
    const eta = Math.round((distance / (this.averageSpeed * 1000 / 60))); // Minutos

    if (distance <= 50) status = 'AT_GATE';
    else if (distance <= 500) status = 'ARRIVING';

    const arrival: ParentArrival = {
      parentId,
      parentName: name,
      studentIds,
      distanceMeters: distance,
      etaMinutes: eta,
      status
    };

    this.activeArrivals.set(parentId, arrival);

    // Integrar com o Portal de Pais (v3511)
    if (status !== 'IDLE') {
      studentIds.forEach(studentId => {
        parentPortal.registerGeofenceEvent({
          parentId,
          studentId,
          status: status === 'AT_GATE' ? 'arrived' : 'approaching',
          distance,
          timestamp: Date.now()
        });
      });
      
      logger.info(`[Geofencing] Pai ${name} está ${status} (${distance}m, ETA: ${eta}min)`);
    }
  }

  public getArrivingParents(): ParentArrival[] {
    return Array.from(this.activeArrivals.values())
      .filter(p => p.status !== 'IDLE')
      .sort((a, b) => a.distanceMeters - b.distanceMeters);
  }
}

export const geofenceMonitorService = new GeofenceMonitorService();
