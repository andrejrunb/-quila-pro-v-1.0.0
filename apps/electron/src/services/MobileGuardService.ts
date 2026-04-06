import { EventEmitter } from 'events';

export interface GuardNotification {
  id: string;
  type: 'critical' | 'alert' | 'info';
  message: string;
  location: string;
  timestamp: number;
}

export interface GuardStatus {
  id: string;
  name: string;
  currentTask: string;
  status: 'on-patrol' | 'responding' | 'break' | 'offline';
  lastPing: number;
}

/**
 * Phase 501: MobileGuardService
 * Simula a comunicação com dispositivos móveis de guardas em campo.
 */
class MobileGuardService extends EventEmitter {
  private activeGuards: GuardStatus[] = [
    { id: 'g1', name: 'Almeida', currentTask: 'Ronda Portaria', status: 'on-patrol', lastPing: Date.now() },
    { id: 'g2', name: 'Santos', currentTask: 'Apoio Refeitório', status: 'on-patrol', lastPing: Date.now() }
  ];

  public sendNotification(notification: Omit<GuardNotification, 'id' | 'timestamp'>) {
    const fullNotification: GuardNotification = {
      ...notification,
      id: `push_${Date.now()}`,
      timestamp: Date.now()
    };
    
    console.log(`[MobileGuard] PUSH SENT to all guards: ${fullNotification.message} at ${fullNotification.location}`);
    this.emit('push-sent', fullNotification);
    return fullNotification;
  }

  public updateGuardStatus(guardId: string, status: GuardStatus['status']) {
    const guard = this.activeGuards.find(g => g.id === guardId);
    if (guard) {
      guard.status = status;
      guard.lastPing = Date.now();
      this.emit('guard-updated', guard);
    }
  }

  public getGuards() {
    return this.activeGuards;
  }
}

export const mobileGuardService = new MobileGuardService();
