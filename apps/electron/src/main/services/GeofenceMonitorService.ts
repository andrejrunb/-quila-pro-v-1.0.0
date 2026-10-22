import { parentPortal } from './ParentPortalService';
import { logger } from '../logger';
import { locationIntelligenceService, Coordinates } from './LocationIntelligenceService';

/**
 * GeofenceMonitorService (v1634)
 * Simula a detecção de pais por proximidade via Geofencing.
 */
export interface ParentArrival {
  parentId: string;
  parentName: string;
  studentIds: string[]; // Alterado para IDs reais
  studentNames?: string[]; // Para uso no ArrivalBoard
  distanceMeters: number;
  etaMinutes: number;
  status: 'ARRIVING' | 'AT_GATE' | 'IDLE';
}

class GeofenceMonitorService {
  private activeArrivals: Map<string, ParentArrival> = new Map();
  private averageSpeed = 30; // km/h
  private db: any;
  private schoolLocation: Coordinates = { lat: -23.5505, lon: -46.6333 }; // TODO: Carregar de config (v3520)

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
   * Processa uma atualização de localização real vinda do App de Pais (v3520)
   */
  public processLocationUpdate(parentId: string, name: string, studentIds: string[], currentCoords: Coordinates) {
    const distance = locationIntelligenceService.calculateDistance(currentCoords, this.schoolLocation);
    const eta = locationIntelligenceService.calculateETA(distance, this.averageSpeed);

    let status: ParentArrival['status'] = 'IDLE';
    if (distance <= 50) status = 'AT_GATE';
    else if (distance <= 1000) status = 'ARRIVING'; // Aumentado range para 1km

    const arrival: ParentArrival = {
      parentId,
      parentName: name,
      studentIds,
      distanceMeters: Math.round(distance),
      etaMinutes: eta,
      status
    };

    this.activeArrivals.set(parentId, arrival);

    if (status !== 'IDLE') {
      studentIds.forEach(studentId => {
        parentPortal.registerGeofenceEvent({
          parentId,
          studentId,
          status: status === 'AT_GATE' ? 'arrived' : 'approaching',
          distance: Math.round(distance),
          timestamp: Date.now()
        });
      });
      
      logger.info(`[Geofencing] [REAL-LOGISTICS] Pai ${name} está ${status} (${Math.round(distance)}m, ETA: ${eta}min)`);
    }
  }

  /**
   * @deprecated Usar processLocationUpdate para lógica real.
   */
  public updateParentPosition(parentId: string, name: string, studentIds: string[], distance: number) {
    this.processLocationUpdate(parentId, name, studentIds, {
      lat: this.schoolLocation.lat + (distance / 111111), // Mock de conversão metros para lat
      lon: this.schoolLocation.lon
    });
  }

  public getArrivingParents(): ParentArrival[] {
    return Array.from(this.activeArrivals.values())
      .filter(p => p.status !== 'IDLE')
      .sort((a, b) => a.distanceMeters - b.distanceMeters);
  }

  /**
   * [SQA-GEO-102] Retorna alertas ativos de geofencing.
   */
  public async getAlerts(): Promise<any[]> {
    return this.getArrivingParents();
  }

  /**
   * [SQA-GEO-103] Atualiza configurações de zona.
   */
  public async updateZone(id: string, config: any): Promise<void> {
    logger.info(`[Geofencing] Zona ${id} atualizada: ${JSON.stringify(config)}`);
  }

  /**
   * [Fase 502] Predição de densidade de tráfego baseada em clusters de ETA.
   */
  public getArrivalPredictions() {
    const arrivals = this.getArrivingParents();
    const clusters: Record<number, number> = {};
    
    // Janelas de 5 minutos para os próximos 30 minutos
    for (let i = 0; i <= 30; i += 5) {
      clusters[i] = 0;
    }

    arrivals.forEach(p => {
      // Arredonda ETA para a janela de 5 min mais próxima
      const window = Math.min(30, Math.floor(p.etaMinutes / 5) * 5);
      clusters[window] = (clusters[window] || 0) + 1;
    });

    const peakDetected = Object.values(clusters).some(count => count >= 5); // Ex: Mais de 5 pais na mesma janela
    const totalArriving = arrivals.length;

    return {
      clusters,
      peakDetected,
      totalArriving,
    };
  }

  /**
   * [SQA-GEO-104] Verifica se um estudante está no perímetro baseado na localização do pai.
   */
  public async isStudentInPerimeter(studentId: string): Promise<boolean> {
    const arrivals = Array.from(this.activeArrivals.values());
    // Retorna true se algum pai chegando/chegou tem este aluno associado
    return arrivals.some(a => a.studentIds.includes(studentId) && a.status !== 'IDLE');
  }
}

export const geofenceMonitorService = new GeofenceMonitorService();

