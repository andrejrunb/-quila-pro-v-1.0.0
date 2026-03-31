import { reIDService, ReIDSession } from './ReIDService';
import { EventEmitter } from 'events';

/**
 * PRESENCE MONITOR SERVICE (v3620)
 * -------------------------------
 * Correlates detected student positions with their pedagogical schedule.
 * Flags discrepancies for teachers to assist in student guidance.
 */

export interface PresenceDiscrepancy {
  id: string;
  studentId: string;
  expectedRoom: string;
  actualRoom: string;
  timestamp: number;
  severity: 'low' | 'medium' | 'high';
}

class PresenceMonitorService extends EventEmitter {
  private discrepancies: Map<string, PresenceDiscrepancy> = new Map();

  constructor() {
    super();
    this.initMonitoring();
  }

  private initMonitoring() {
    reIDService.on('movement-detected', (session: ReIDSession) => {
      this.auditPresence(session);
    });
  }

  private auditPresence(session: ReIDSession) {
    // Mock Schedule Lookup
    const expected = this.getExpectedRoom(session.studentId);
    
    if (expected && session.lastSeenNode !== expected) {
      const disc: PresenceDiscrepancy = {
        id: `disc_${session.studentId}_${Date.now()}`,
        studentId: session.studentId,
        expectedRoom: expected,
        actualRoom: session.lastSeenNode,
        timestamp: Date.now(),
        severity: 'medium'
      };
      
      this.discrepancies.set(session.studentId, disc);
      this.emit('discrepancy-found', disc);
    } else {
      if (this.discrepancies.has(session.studentId)) {
        this.discrepancies.delete(session.studentId);
        this.emit('discrepancy-resolved', session.studentId);
      }
    }
  }

  private getExpectedRoom(studentId: string): string {
    // Simulated schedule
    const hour = new Date().getHours();
    if (hour >= 20 || hour < 8) return 'none';
    return 'room_101'; // Simplified: everyone should be in Room 101
  }

  public getDiscrepancies() {
    return Array.from(this.discrepancies.values());
  }
}

export const presenceMonitorService = new PresenceMonitorService();
