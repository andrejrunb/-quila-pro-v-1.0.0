import { EventEmitter } from 'events';
import { roboticsBridge } from './RoboticsBridge';

/**
 * Phase 600: AutonomousPatrolEngine
 * Inteligência que decide quando despachar robôs baseado em eventos do sistema.
 */
class AutonomousPatrolEngine extends EventEmitter {
  
  public async handleCriticalEvent(type: string, location: { x: number, y: number }) {
    console.log(`[PatrolEngine] Critical event detected: ${type} at ${location.x},${location.y}`);
    
    // Encontrar drone disponível
    const units = roboticsBridge.getUnits();
    const drone = units.find(u => u.type === 'drone' && u.status === 'docked');
    
    if (drone) {
      console.log(`[PatrolEngine] Dispatching ${drone.id} to location.`);
      roboticsBridge.sendCommand(drone.id, 'TAKEOFF');
      setTimeout(() => {
        roboticsBridge.sendCommand(drone.id, 'DISPATCH');
        this.emit('unit-dispatched', { unitId: drone.id, target: location });
      }, 3000);
    } else {
      console.warn('[PatrolEngine] No units available for dispatch.');
    }
  }

  public startNightPatrol() {
    const units = roboticsBridge.getUnits();
    units.forEach(u => {
      if (u.status === 'docked') {
        roboticsBridge.sendCommand(u.id, u.type === 'drone' ? 'TAKEOFF' : 'PATROL');
      }
    });
  }
}

export const autonomousPatrolEngine = new AutonomousPatrolEngine();
