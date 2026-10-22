import Logger from './Logger';

interface Location {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: Date;
}

interface GeofenceZone {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  type: 'classroom' | 'corridor' | 'entrance' | 'bathroom' | 'outdoor';
}

interface GeofenceEvent {
  studentId: string;
  studentName: string;
  zoneId: string;
  zoneName: string;
  eventType: 'enter' | 'exit';
  timestamp: Date;
  location: Location;
}

export class GoogleMapsService {
  private logger: Logger;
  private apiKey: string;
  private geofenceZones: Map<string, GeofenceZone> = new Map();
  private studentLocations: Map<string, Location> = new Map();
  private geofenceEvents: GeofenceEvent[] = [];

  constructor(apiKey: string) {
    this.logger = new Logger('GoogleMapsService');
    this.apiKey = apiKey;
    this.initializeDefaultZones();
  }

  /**
   * Inicializar zonas de geofence padrão
   */
  private initializeDefaultZones(): void {
    // Entrada/Saída do bloco
    this.addGeofenceZone({
      id: 'entrance',
      name: 'Entrada/Saída do Bloco',
      latitude: -23.5505,
      longitude: -46.6333,
      radiusMeters: 15,
      type: 'entrance',
    });

    // Corredores
    this.addGeofenceZone({
      id: 'corridor_1',
      name: 'Corredor Principal',
      latitude: -23.5506,
      longitude: -46.6334,
      radiusMeters: 20,
      type: 'corridor',
    });

    // Banheiros
    this.addGeofenceZone({
      id: 'bathroom',
      name: 'Banheiros',
      latitude: -23.5507,
      longitude: -46.6335,
      radiusMeters: 10,
      type: 'bathroom',
    });

    // Áreas externas
    this.addGeofenceZone({
      id: 'outdoor',
      name: 'Área Externa',
      latitude: -23.5508,
      longitude: -46.6336,
      radiusMeters: 50,
      type: 'outdoor',
    });

    this.logger.info('Zonas de geofence padrão inicializadas');
  }

  /**
   * Adicionar zona de geofence
   */
  addGeofenceZone(zone: GeofenceZone): void {
    this.geofenceZones.set(zone.id, zone);
    this.logger.info(`Zona de geofence adicionada: ${zone.name}`);
  }

  /**
   * Remover zona de geofence
   */
  removeGeofenceZone(zoneId: string): void {
    this.geofenceZones.delete(zoneId);
    this.logger.info(`Zona de geofence removida: ${zoneId}`);
  }

  /**
   * Obter todas as zonas de geofence
   */
  getGeofenceZones(): GeofenceZone[] {
    return Array.from(this.geofenceZones.values());
  }

  /**
   * Atualizar localização do aluno
   */
  updateStudentLocation(studentId: string, location: Location): void {
    const previousLocation = this.studentLocations.get(studentId);
    this.studentLocations.set(studentId, location);

    // Verificar geofences
    this.checkGeofences(studentId, location, previousLocation);
  }

  /**
   * Verificar se aluno entrou/saiu de geofence
   */
  private checkGeofences(
    studentId: string,
    currentLocation: Location,
    previousLocation?: Location
  ): void {
    for (const zone of this.geofenceZones.values()) {
      const distance = this.calculateDistance(
        currentLocation.latitude,
        currentLocation.longitude,
        zone.latitude,
        zone.longitude
      );

      const isInZone = distance <= zone.radiusMeters;
      const wasInZone = previousLocation
        ? this.calculateDistance(
            previousLocation.latitude,
            previousLocation.longitude,
            zone.latitude,
            zone.longitude
          ) <= zone.radiusMeters
        : false;

      // Detectar entrada
      if (isInZone && !wasInZone) {
        this.triggerGeofenceEvent(studentId, zone.id, 'enter', currentLocation);
      }

      // Detectar saída
      if (!isInZone && wasInZone) {
        this.triggerGeofenceEvent(studentId, zone.id, 'exit', currentLocation);
      }
    }
  }

  /**
   * Disparar evento de geofence
   */
  private triggerGeofenceEvent(
    studentId: string,
    zoneId: string,
    eventType: 'enter' | 'exit',
    location: Location
  ): void {
    const zone = this.geofenceZones.get(zoneId);
    if (!zone) return;

    const event: GeofenceEvent = {
      studentId,
      studentName: `Aluno ${studentId}`, // Será preenchido com dados reais
      zoneId,
      zoneName: zone.name,
      eventType,
      timestamp: new Date(),
      location,
    };

    this.geofenceEvents.push(event);

    // Log do evento
    this.logger.info(
      `Evento de geofence: ${event.studentName} ${eventType} de ${zone.name}`
    );

    // Gerar alerta se necessário
    if (eventType === 'exit' && zone.type === 'entrance') {
      this.logger.warn(`ALERTA: Aluno saiu da escola - ${event.studentName}`);
    }
  }

  /**
   * Calcular distância entre dois pontos (Haversine formula)
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
   * Obter localização atual do aluno
   */
  getStudentLocation(studentId: string): Location | undefined {
    return this.studentLocations.get(studentId);
  }

  /**
   * Obter todos os eventos de geofence
   */
  getGeofenceEvents(studentId?: string, limit?: number): GeofenceEvent[] {
    let events = this.geofenceEvents;

    if (studentId) {
      events = events.filter(e => e.studentId === studentId);
    }

    if (limit) {
      events = events.slice(-limit);
    }

    return events;
  }

  /**
   * Limpar eventos antigos
   */
  clearOldEvents(hoursOld: number = 24): void {
    const cutoffTime = new Date(Date.now() - hoursOld * 60 * 60 * 1000);
    const initialCount = this.geofenceEvents.length;

    this.geofenceEvents = this.geofenceEvents.filter(
      e => e.timestamp > cutoffTime
    );

    const removedCount = initialCount - this.geofenceEvents.length;
    this.logger.info(`${removedCount} eventos antigos removidos`);
  }

  /**
   * Obter zona onde aluno está
   */
  getStudentCurrentZone(studentId: string): GeofenceZone | null {
    const location = this.studentLocations.get(studentId);
    if (!location) return null;

    for (const zone of this.geofenceZones.values()) {
      const distance = this.calculateDistance(
        location.latitude,
        location.longitude,
        zone.latitude,
        zone.longitude
      );

      if (distance <= zone.radiusMeters) {
        return zone;
      }
    }

    return null;
  }

  /**
   * Gerar relatório de movimento
   */
  generateMovementReport(studentId: string, date: Date): string {
    const events = this.getGeofenceEvents(studentId);
    const dayEvents = events.filter(
      e =>
        e.timestamp.toDateString() === date.toDateString()
    );

    let report = `Relatório de Movimento - ${studentId}\
`;
    report += `Data: ${date.toLocaleDateString('pt-BR')}\
`;
    report += `Total de eventos: ${dayEvents.length}\
\
`;

    dayEvents.forEach(event => {
      report += `${event.timestamp.toLocaleTimeString('pt-BR')} - ${event.eventType.toUpperCase()} de ${event.zoneName}\
`;
    });

    return report;
  }
}

export default GoogleMapsService;


