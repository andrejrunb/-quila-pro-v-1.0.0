import { EventEmitter } from 'events';

/**
 * ENVIRONMENTAL SERVICE (v3610)
 * ----------------------------
 * Manages real-time IoT telemetry from classroom environmental sensors.
 * Tracks CO2, VOC, Temperature, and Humidity for cognitive optimization.
 */

export interface EnvironmentalData {
  roomId: string;
  co2: number; // ppm
  voc: number; // ppb
  temperature: number; // °C
  humidity: number; // %
  timestamp: number;
  status: 'optimal' | 'warning' | 'critical';
}

class EnvironmentalService extends EventEmitter {
  private roomData: Map<string, EnvironmentalData> = new Map();

  constructor() {
    super();
    this.initializeMockData();
    this.startSimulation();
  }

  private initializeMockData() {
    const rooms = ['room_101', 'room_102', 'lab_gen_01', 'auditorium_alpha'];
    rooms.forEach(id => {
      this.roomData.set(id, {
        roomId: id,
        co2: 450,
        voc: 120,
        temperature: 22.5,
        humidity: 45,
        timestamp: Date.now(),
        status: 'optimal'
      });
    });
  }

  private startSimulation() {
    setInterval(() => {
      this.roomData.forEach((data, roomId) => {
        // Simulate fluctuations
        const co2Delta = (Math.random() * 20 - 5); // Bias slightly upwards
        const tempDelta = (Math.random() * 0.4 - 0.2);
        
        data.co2 = Math.max(400, parseFloat((data.co2 + co2Delta).toFixed(0)));
        data.temperature = parseFloat((data.temperature + tempDelta).toFixed(1));
        data.timestamp = Date.now();
        
        // Status Logic
        if (data.co2 > 1000) data.status = 'critical';
        else if (data.co2 > 800) data.status = 'warning';
        else data.status = 'optimal';

        this.emit(`room-updated-${roomId}`, data);
      });
      this.emit('all-rooms-updated', Array.from(this.roomData.values()));
    }, 5000);
  }

  public getRoomData(roomId: string): EnvironmentalData | undefined {
    return this.roomData.get(roomId);
  }

  public getAllRoomData(): EnvironmentalData[] {
    return Array.from(this.roomData.values());
  }

  public forceVentilation(roomId: string) {
    const data = this.roomData.get(roomId);
    if (data) {
      console.log(`[Environmental] Forcing ventilation for ${roomId}...`);
      data.co2 = 420; // Rapid drop
      this.emit(`room-updated-${roomId}`, data);
    }
  }
}

export const environmentalService = new EnvironmentalService();
