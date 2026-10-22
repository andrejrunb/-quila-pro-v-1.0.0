import AlertManager from './AlertManager';
import Database from '../../database/Database';
import Logger from './Logger';

/**
 * Passo 3: Integrar Google Maps com Geofencing
 * Localização de câmeras, alunos e alertas de saída da escola
 */

export interface Location {
  lat: number;
  lon: number;
  address?: string;
}

export interface Geofence {
  id: string;
  name: string;
  center: Location;
  radiusMeters: number;
  type: 'school' | 'classroom' | 'restricted';
  active: boolean;
}

export interface GeofenceEvent {
  studentId: string;
  studentName: string;
  geofenceId: string;
  geofenceName: string;
  eventType: 'enter' | 'exit';
  timestamp: number;
  location: Location;
}

export class GoogleMapsIntegration {
  private apiKey: string;
  private logger: Logger;
  private alertManager: AlertManager;
  private baseUrl = 'https://maps.googleapis.com/maps/api';
  private geofences: Map<string, Geofence> = new Map();
  private studentLocations: Map<string, Location> = new Map();
  private geofenceStates: Map<string, Set<string>> = new Map(); // geofenceId -> Set<studentId>

  constructor(db: Database, apiKey?: string) {
    this.apiKey = apiKey || process.env.GOOGLE_MAPS_API_KEY || '';
    this.logger = new Logger('GoogleMapsIntegration');
    this.alertManager = new AlertManager(db);

    if (!this.apiKey) {
      this.logger.warn('Google Maps API key não configurada. Usando modo simulado.');
    }
  }

  /**
   * Criar geofence (cerca virtual)
   */
  createGeofence(
    id: string,
    name: string,
    center: Location,
    radiusMeters: number,
    type: Geofence['type'] = 'school'
  ): Geofence {
    const geofence: Geofence = {
      id,
      name,
      center,
      radiusMeters,
      type,
      active: true,
    };

    this.geofences.set(id, geofence);
    this.geofenceStates.set(id, new Set());

    this.logger.info(`Geofence criado: ${name} (${radiusMeters}m)`);
    return geofence;
  }

  /**
   * Atualizar localização do aluno
   */
  async updateStudentLocation(
    studentId: string,
    studentName: string,
    location: Location
  ): Promise<void> {
    try {
      const previousLocation = this.studentLocations.get(studentId);
      this.studentLocations.set(studentId, location);

      // Verificar geofences
      for (const [geofenceId, geofence] of this.geofences) {
        const isInside = this.isLocationInGeofence(location, geofence);
        const wasInside = this.geofenceStates.get(geofenceId)?.has(studentId) || false;

        // Detectar entrada
        if (isInside && !wasInside) {
          await this.handleGeofenceEnter(studentId, studentName, geofenceId);
        }
        // Detectar saída
        else if (!isInside && wasInside) {
          await this.handleGeofenceExit(studentId, studentName, geofenceId);
        }

        // Atualizar estado
        if (isInside) {
          this.geofenceStates.get(geofenceId)?.add(studentId);
        } else {
          this.geofenceStates.get(geofenceId)?.delete(studentId);
        }
      }
    } catch (error) {
      this.logger.error(`Erro ao atualizar localização: ${(error as Error).message}`);
    }
  }

  /**
   * Manipular entrada em geofence
   */
  private async handleGeofenceEnter(
    studentId: string,
    studentName: string,
    geofenceId: string
  ): Promise<void> {
    const geofence = this.geofences.get(geofenceId);
    if (!geofence) return;

    this.logger.info(`${studentName} entrou em ${geofence.name}`);

    // Criar alerta se for área restrita
    if (geofence.type === 'restricted') {
      await this.alertManager.alertUnusualActivity(
        geofenceId,
        geofence.name,
        `${studentName} entrou em área restrita: ${geofence.name}`
      );
    }
  }

  /**
   * Manipular saída de geofence
   */
  private async handleGeofenceExit(
    studentId: string,
    studentName: string,
    geofenceId: string
  ): Promise<void> {
    const geofence = this.geofences.get(geofenceId);
    if (!geofence) return;

    this.logger.info(`${studentName} saiu de ${geofence.name}`);

    // Criar alerta se for a escola
    if (geofence.type === 'school') {
      await this.alertManager.alertStudentLeftSchool(
        studentId,
        studentName,
        geofence.name
      );
    }
  }

  /**
   * Verificar se localização está dentro de geofence
   */
  private isLocationInGeofence(location: Location, geofence: Geofence): boolean {
    const distance = this.calculateDistance(
      location.lat,
      location.lon,
      geofence.center.lat,
      geofence.center.lon
    );

    return distance <= geofence.radiusMeters;
  }

  /**
   * Calcular distância entre dois pontos (Fórmula de Haversine)
   */
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371000; // Raio da Terra em metros
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Obter endereço a partir de coordenadas (Reverse Geocoding)
   */
  async getAddressFromCoordinates(lat: number, lon: number): Promise<string | null> {
    try {
      if (!this.apiKey) {
        return `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
      }

      const url = `${this.baseUrl}/geocode/json?latlng=${lat},${lon}&key=${this.apiKey}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.results && data.results.length > 0) {
        return data.results[0].formatted_address;
      }

      return null;
    } catch (error) {
      this.logger.error(`Erro ao obter endereço: ${(error as Error).message}`);
      return null;
    }
  }

  /**
   * Obter coordenadas a partir de endereço (Geocoding)
   */
  async getCoordinatesFromAddress(address: string): Promise<Location | null> {
    try {
      if (!this.apiKey) {
        return null;
      }

      const url = `${this.baseUrl}/geocode/json?address=${encodeURIComponent(address)}&key=${this.apiKey}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.results && data.results.length > 0) {
        const location = data.results[0].geometry.location;
        return {
          lat: location.lat,
          lon: location.lng,
          address: data.results[0].formatted_address,
        };
      }

      return null;
    } catch (error) {
      this.logger.error(`Erro ao obter coordenadas: ${(error as Error).message}`);
      return null;
    }
  }

  /**
   * Calcular rota entre dois pontos
   */
  async getRoute(origin: Location, destination: Location): Promise<any | null> {
    try {
      if (!this.apiKey) {
        return null;
      }

      const url = `${this.baseUrl}/directions/json?origin=${origin.lat},${origin.lon}&destination=${destination.lat},${destination.lon}&key=${this.apiKey}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.routes && data.routes.length > 0) {
        return data.routes[0];
      }

      return null;
    } catch (error) {
      this.logger.error(`Erro ao obter rota: ${(error as Error).message}`);
      return null;
    }
  }

  /**
   * Obter localização atual do aluno
   */
  getStudentLocation(studentId: string): Location | undefined {
    return this.studentLocations.get(studentId);
  }

  /**
   * Obter todos os alunos em um geofence
   */
  getStudentsInGeofence(geofenceId: string): string[] {
    return Array.from(this.geofenceStates.get(geofenceId) || []);
  }

  /**
   * Obter geofence por ID
   */
  getGeofence(geofenceId: string): Geofence | undefined {
    return this.geofences.get(geofenceId);
  }

  /**
   * Listar todos os geofences
   */
  listGeofences(): Geofence[] {
    return Array.from(this.geofences.values());
  }

  /**
   * Deletar geofence
   */
  deleteGeofence(geofenceId: string): boolean {
    const deleted = this.geofences.delete(geofenceId);
    this.geofenceStates.delete(geofenceId);
    if (deleted) {
      this.logger.info(`Geofence ${geofenceId} deletado`);
    }
    return deleted;
  }

  /**
   * Gerar URL de mapa para visualização
   */
  generateMapUrl(center: Location, zoom: number = 15): string {
    return `https://www.google.com/maps?q=${center.lat},${center.lon}&z=${zoom}`;
  }

  /**
   * Gerar URL de mapa estático
   */
  generateStaticMapUrl(
    center: Location,
    width: number = 400,
    height: number = 300,
    zoom: number = 15
  ): string {
    if (!this.apiKey) {
      return '';
    }

    return `https://maps.googleapis.com/maps/api/staticmap?center=${center.lat},${center.lon}&zoom=${zoom}&size=${width}x${height}&key=${this.apiKey}`;
  }
}

export default GoogleMapsIntegration;


