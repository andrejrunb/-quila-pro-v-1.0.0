import { EventEmitter } from 'events';

export interface ClimateTelemetry {
  sensorId: string;
  location: string;
  temperature: number; // Celsius
  humidity: number; // %
  timestamp: string;
}

export interface ClimateAlert {
  id: string;
  sensorId: string;
  location: string;
  type: 'CRITICAL_HEAT' | 'HUMIDITY_ALERT' | 'SENSOR_OFFLINE';
  message: string;
  currentValue: number;
  timestamp: string;
}

/**
 * ClimateMonitorService (v1619)
 * Monitoramento em tempo real de salas de servidores e áreas críticas.
 * Protege contra falhas de climatização e incêndios.
 */
class ClimateMonitorService extends EventEmitter {
  private sensors: Map<string, ClimateTelemetry> = new Map();
  private alerts: ClimateAlert[] = [];
  private readonly CRITICAL_TEMP = 28; // Limite para alerta

  constructor() {
    super();
    this.startMockTelemetry();
  }

  public processTelemetry(data: ClimateTelemetry) {
    this.sensors.set(data.sensorId, data);
    this.checkAlerts(data);
    this.emit('telemetry_update', data);
  }

  private checkAlerts(data: ClimateTelemetry) {
    if (data.temperature > this.CRITICAL_TEMP) {
      const alert: ClimateAlert = {
        id: `alert_${Date.now()}`,
        sensorId: data.sensorId,
        location: data.location,
        type: 'CRITICAL_HEAT',
        message: `Temperatura Crítica Detectada em ${data.location}: ${data.temperature}°C`,
        currentValue: data.temperature,
        timestamp: new Date().toISOString()
      };
      
      this.alerts.unshift(alert);
      this.emit('critical_alert', alert);
    }
  }

  public getSensorStatus(sensorId: string): ClimateTelemetry | undefined {
    return this.sensors.get(sensorId);
  }

  public getActiveAlerts(): ClimateAlert[] {
    return this.alerts;
  }

  private startMockTelemetry() {
    // Simula telemetria constante da sala de servidores
    setInterval(() => {
      const mockData: ClimateTelemetry = {
        sensorId: 'SRV_ROOM_01',
        location: 'Sala de Servidores Central',
        temperature: 22 + Math.random() * 2, // 22-24°C normal
        humidity: 45 + Math.random() * 5,
        timestamp: new Date().toISOString()
      };
      this.processTelemetry(mockData);
    }, 5000);
  }
}

export const climateMonitor = new ClimateMonitorService();
