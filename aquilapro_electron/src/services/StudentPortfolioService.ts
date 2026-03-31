import { EventEmitter } from 'events';

export interface PortfolioEvent {
  id: string;
  studentId: string;
  timestamp: string;
  type: 'attendance' | 'participation' | 'restlessness' | 'sleep_warning' | 'focus_period' | 'frequent_movement' | 'zone_deviation';
  description: string;
  severity: 'low' | 'medium' | 'high';
  location?: string;
}

/**
 * StudentPortfolioService (v1626)
 * Gerencia o histórico comportamental e pedagógico dos alunos baseado em RuView CSI.
 */
class StudentPortfolioService extends EventEmitter {
  private events: PortfolioEvent[] = [];

  constructor() {
    super();
  }

  public logEvent(event: Omit<PortfolioEvent, 'id' | 'timestamp'>) {
    const newEvent: PortfolioEvent = {
      ...event,
      id: `bev-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      timestamp: new Date().toISOString()
    };

    this.events.unshift(newEvent); // Mais recentes primeiro
    this.emit('event_logged', newEvent);
    
    console.log(`[Portfolio] Logged ${event.type} for Student ${event.studentId}`);
  }

  public getEventsByStudent(studentId: string): PortfolioEvent[] {
    return this.events.filter(e => e.studentId === studentId);
  }

  public getSummary(studentId: string) {
    const studentEvents = this.getEventsByStudent(studentId);
    return {
      total: studentEvents.length,
      restlessnessCount: studentEvents.filter(e => e.type === 'restlessness').length,
      sleepWarnings: studentEvents.filter(e => e.type === 'sleep_warning').length,
      engagementScore: this.calculateEngagementScore(studentId),
      lastEvent: studentEvents[0]
    };
  }

  /**
   * Calcula o score de engajamento (0-10) baseado no comportamento (v1628)
   */
  public calculateEngagementScore(studentId: string): number {
    const events = this.getEventsByStudent(studentId);
    if (events.length === 0) return 10.0; // Assume 10 se não houver registros negativos

    let score = 10.0;
    events.forEach(event => {
      if (event.type === 'restlessness') score -= 0.5;
      if (event.type === 'sleep_warning') score -= 2.0;
      if (event.type === 'frequent_movement') score -= 0.3;
      if (event.type === 'focus_period') score += 0.2;
      if (event.type === 'zone_deviation') score -= 1.5; // v1629: Penalidade alta para desvios
    });

    return Math.max(0, Math.min(10, score));
  }

  public clearHistory(studentId: string) {
    this.events = this.events.filter(e => e.studentId !== studentId);
  }
}

export const studentPortfolioService = new StudentPortfolioService();
