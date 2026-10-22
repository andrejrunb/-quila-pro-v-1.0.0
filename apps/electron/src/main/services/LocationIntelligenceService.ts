/**
 * LocationIntelligenceService (v3520)
 * Núcleo de cálculos geoespaciais para o ecossistema Áquila Pro.
 * Implementa fórmulas de Haversine para precisão em curvatura terrestre.
 */

export interface Coordinates {
  lat: number;
  lon: number;
}

export class LocationIntelligenceService {
  /**
   * Calcula a distância entre dois pontos em metros usando a fórmula de Haversine.
   */
  public calculateDistance(p1: Coordinates, p2: Coordinates): number {
    const R = 6371e3; // Raio da Terra em metros
    const φ1 = (p1.lat * Math.PI) / 180;
    const φ2 = (p2.lat * Math.PI) / 180;
    const Δφ = ((p2.lat - p1.lat) * Math.PI) / 180;
    const Δλ = ((p2.lon - p1.lon) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distância em metros
  }

  /**
   * Verifica se um ponto está dentro de uma geocerca (círculo).
   */
  public isInsideGeofence(point: Coordinates, center: Coordinates, radiusMeters: number): boolean {
    const distance = this.calculateDistance(point, center);
    return distance <= radiusMeters;
  }

  /**
   * Calcula o ETA estimado baseado na distância e velocidade média (km/h).
   */
  public calculateETA(distanceMeters: number, averageSpeedKmh: number = 30): number {
    const speedMs = (averageSpeedKmh * 1000) / 3600;
    return Math.ceil(distanceMeters / speedMs / 60); // Retorna minutos
  }
}

export const locationIntelligenceService = new LocationIntelligenceService();
export default locationIntelligenceService;
