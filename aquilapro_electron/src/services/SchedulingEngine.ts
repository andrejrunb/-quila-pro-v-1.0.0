import { EventEmitter } from 'events';

export interface ScheduleEvent {
  roomId: string;
  className: string;
  teacherId: string;
  teacherName: string; // v1628: Nome do docente para despacho de relatórios
  expectedStudents: number;
  startTime: string; // ISO
  endTime: string; // ISO
}

export interface SchedulingAlert {
  id: string;
  type: 'EMPTY_CLASSROOM' | 'OVERCROWDED' | 'UNSCHEDULED_OCCUPANCY';
  roomId: string;
  message: string;
  timestamp: string;
}

/**
 * SchedulingEngine (v1615)
 * Correlaciona presença real (RuView) com a grade horária.
 * Identifica ociosidade de ativos e anomalias de ocupação.
 */
class SchedulingEngine extends EventEmitter {
  private activeSchedule: ScheduleEvent[] = [];
  private lastAlerts: Map<string, string> = new Map();

  constructor() {
    super();
    // Simular grade horária para testes
    this.seedMockSchedule();
  }

  private seedMockSchedule() {
    this.activeSchedule = [
      {
        roomId: 'sala_04',
        className: 'Matemática Avançada',
        teacherId: 'prof_lucas',
        teacherName: 'Lucas Oliveira',
        expectedStudents: 25,
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 3600000).toISOString()
      }
    ];
  }

  public getActiveEvent(roomId: string): ScheduleEvent | undefined {
    const now = new Date();
    return this.activeSchedule.find(e => 
      e.roomId === roomId && 
      new Date(e.startTime) <= now && 
      new Date(e.endTime) >= now
    );
  }

  /**
   * Avalia a ocupação de uma sala baseada em telemetria RuView
   */
  public evaluateOccupancy(roomId: string, currentCount: number): void {
    const now = new Date();
    const activeEvent = this.getActiveEvent(roomId);

    if (activeEvent) {
      // Caso 1: Sala vazia durante aula agendada
      if (currentCount === 0) {
        this.triggerAlert({
          id: `alert_${roomId}_empty_${Date.now()}`,
          type: 'EMPTY_CLASSROOM',
          roomId,
          message: `Sala ${roomId} está vazia durante a aula "${activeEvent.className}".`,
          timestamp: now.toISOString()
        });
      }
      // Caso 2: Superlotação
      else if (currentCount > activeEvent.expectedStudents * 1.2) {
        this.triggerAlert({
          id: `alert_${roomId}_over_${Date.now()}`,
          type: 'OVERCROWDED',
          roomId,
          message: `Sala ${roomId} com ocupação acima do limite (${currentCount} alunos).`,
          timestamp: now.toISOString()
        });
      }
    } else if (currentCount > 2) {
      // Caso 3: Ocupação sem agendamento
      this.triggerAlert({
        id: `alert_${roomId}_unauth_${Date.now()}`,
        type: 'UNSCHEDULED_OCCUPANCY',
        roomId,
        message: `Ocupação detectada na Sala ${roomId} fora do horário de aula.`,
        timestamp: now.toISOString()
      });
    }
  }

  private triggerAlert(alert: SchedulingAlert) {
    // Cooldown de alertas por tipo/sala (5 min)
    const key = `${alert.type}_${alert.roomId}`;
    const lastTime = this.lastAlerts.get(key);
    
    if (lastTime && (Date.now() - new Date(lastTime).getTime() < 300000)) return;

    this.lastAlerts.set(key, alert.timestamp);
    console.warn(`[SchedulingEngine] ALERTA: ${alert.message}`);
    this.emit('scheduling-alert', alert);
  }
}

export const schedulingEngine = new SchedulingEngine();
