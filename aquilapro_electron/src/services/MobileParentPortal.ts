import { EventEmitter } from 'events';

export interface ParentAlert {
  id: string;
  studentName: string;
  type: 'attendance' | 'pedagogical' | 'geofencing';
  content: string;
  timestamp: number;
}

/**
 * Phase 501: MobileParentPortal
 * Simula a interface dos pais, focando em geofencing e insights de IA.
 */
class MobileParentPortal extends EventEmitter {
  
  public simulateArrival(parentName: string, studentName: string) {
    const event = {
      parentName,
      studentName,
      type: 'geofencing',
      message: `${parentName} está a 500m da escola. Preparar ${studentName} para saída.`,
      timestamp: Date.now()
    };
    
    console.log(`[ParentPortal] GEOFENCE ALERT: ${event.message}`);
    this.emit('arrival-detected', event);
  }

  public sendPedagogicalSummary(studentName: string, summary: string) {
    const alert: ParentAlert = {
      id: `ped_${Date.now()}`,
      studentName,
      type: 'pedagogical',
      content: summary,
      timestamp: Date.now()
    };
    
    this.emit('alert-sent', alert);
  }
}

export const mobileParentPortal = new MobileParentPortal();
