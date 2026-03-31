import { EventEmitter } from 'events';

export interface RobotTelemetry {
  id: string;
  type: 'drone' | 'wheeled';
  battery: number;
  status: 'docked' | 'patrolling' | 'responding' | 'emergency-land';
  position: { x: number; y: number; alt: number };
  heading: number;
}

/**
 * Phase 600: RoboticsBridge
 * Gerencia a comunicação e telemetria com unidades robóticas (Drones/Robôs).
 */
class RoboticsBridge extends EventEmitter {
  private units: Map<string, RobotTelemetry> = new Map();

  constructor() {
    super();
    this.initUnits();
    this.startTelemetryLoop();
  }

  private initUnits() {
    this.units.set('DRONE-ALPHA', {
      id: 'DRONE-ALPHA',
      type: 'drone',
      battery: 100,
      status: 'docked',
      position: { x: 0, y: 0, alt: 0 },
      heading: 0
    });
    this.units.set('ROBOT-TERRA-01', {
      id: 'ROBOT-TERRA-01',
      type: 'wheeled',
      battery: 85,
      status: 'patrolling',
      position: { x: 50, y: 20, alt: 0 },
      heading: 90
    });
  }

  private startTelemetryLoop() {
    setInterval(() => {
      this.units.forEach(unit => {
        if (unit.status !== 'docked') {
          unit.battery = Math.max(0, unit.battery - 0.1);
          unit.position.x += (Math.random() - 0.5) * 5;
          unit.position.y += (Math.random() - 0.5) * 5;
          unit.heading = (unit.heading + (Math.random() - 0.5) * 10) % 360;
        }
        
        if (unit.battery < 15 && unit.status !== 'emergency-land') {
          this.sendCommand(unit.id, 'RTL'); // Return to Launch
        }
      });
      this.emit('telemetry-update', Array.from(this.units.values()));
    }, 2000);
  }

  public sendCommand(id: string, command: 'TAKEOFF' | 'LAND' | 'RTL' | 'PATROL' | 'DISPATCH') {
    const unit = this.units.get(id);
    if (!unit) return;

    console.log(`[Robotics] Command ${command} sent to ${id}`);
    
    switch (command) {
      case 'TAKEOFF':
        unit.status = 'patrolling';
        unit.position.alt = 10;
        break;
      case 'LAND':
      case 'RTL':
        unit.status = 'docked';
        unit.position = { x: 0, y: 0, alt: 0 };
        break;
      case 'DISPATCH':
        unit.status = 'responding';
        break;
    }
    
    this.emit('command-status', { id, command, success: true });
    this.emit('telemetry-update', Array.from(this.units.values()));
  }

  public getUnits() {
    return Array.from(this.units.values());
  }
}

export const roboticsBridge = new RoboticsBridge();
