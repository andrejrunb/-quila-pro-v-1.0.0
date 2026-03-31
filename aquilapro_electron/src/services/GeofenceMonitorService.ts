/**
 * GeofenceMonitorService (v1634)
 * Simula a detecção de pais por proximidade via Geofencing.
 */
export interface ParentArrival {
  parentId: string;
  parentName: string;
  studentNames: string[];
  distanceMeters: number;
  status: 'ARRIVING' | 'AT_GATE' | 'IDLE';
}

class GeofenceMonitorService {
  private activeArrivals: Map<string, ParentArrival> = new Map();

  /**
   * Atualiza posição mockada do pai
   */
  public updateParentPosition(parentId: string, name: string, studentNames: string[], distance: number) {
    let status: ParentArrival['status'] = 'IDLE';
    if (distance <= 50) status = 'AT_GATE';
    else if (distance <= 500) status = 'ARRIVING';

    this.activeArrivals.set(parentId, {
      parentId,
      parentName: name,
      studentNames,
      distanceMeters: distance,
      status
    });
  }

  public getArrivingParents(): ParentArrival[] {
    return Array.from(this.activeArrivals.values())
      .filter(p => p.status !== 'IDLE')
      .sort((a, b) => a.distanceMeters - b.distanceMeters);
  }
}

export const geofenceMonitorService = new GeofenceMonitorService();
