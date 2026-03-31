export interface SchoolZone {
  id: string;
  name: string;
  type: 'classroom' | 'bathroom' | 'canteen' | 'library' | 'corridor' | 'exit';
  coords: { x1: number, y1: number, x2: number, y2: number }; // Retângulo da zona
}

/**
 * LocationZoneService (v1629)
 * Gerencia o mapeamento espacial da escola para detecção de destinos.
 */
class LocationZoneService {
  private zones: SchoolZone[] = [
    { id: 'sala_04', name: 'Sala 04 (Matemática)', type: 'classroom', coords: { x1: 0, y1: 0, x2: 10, y2: 15 } },
    { id: 'wc_masc_01', name: 'Banheiro Masculino (Ala Norte)', type: 'bathroom', coords: { x1: 15, y1: 20, x2: 20, y2: 25 } },
    { id: 'wc_fem_01', name: 'Banheiro Feminino (Ala Norte)', type: 'bathroom', coords: { x1: 25, y1: 20, x2: 30, y2: 25 } },
    { id: 'cantina', name: 'Cantina Central', type: 'canteen', coords: { x1: 50, y1: 50, x2: 70, y2: 70 } },
    { id: 'corredor_norte', name: 'Corredor Norte', type: 'corridor', coords: { x1: 10, y1: 0, x2: 50, y2: 50 } }
  ];

  public getZoneAt(x: number, y: number): SchoolZone | undefined {
    return this.zones.find(z => 
      x >= z.coords.x1 && x <= z.coords.x2 && 
      y >= z.coords.y1 && y <= z.coords.y2
    );
  }

  public isAuthorizedDestination(currentZoneType: SchoolZone['type'], authorizedType: SchoolZone['type']): boolean {
    return currentZoneType === authorizedType || currentZoneType === 'corridor';
  }

  public getAllZones(): SchoolZone[] {
    return this.zones;
  }
}

export const locationZoneService = new LocationZoneService();
