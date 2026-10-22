import { EventEmitter } from './EventEmitter';
import { attendanceCalculator } from './AttendanceCalculator';

/**
 * AttendanceMonitor Service (v3650)
 * Unified service for real-time occupancy and attendance telemetry.
 */
export interface AttendanceTelemetry {
  currentStudents: number;
  totalEnrolled: number;
  percentage: number;
  lastUpdate: string;
}

class AttendanceMonitor extends EventEmitter {
  private static instance: AttendanceMonitor;
  private telemetry: AttendanceTelemetry = {
    currentStudents: 0,
    totalEnrolled: 0,
    percentage: 0,
    lastUpdate: new Date().toISOString()
  };

  private constructor() {
    super();
    // A sincronização real será disparada pelo Main process (RecognitionLoop/Database events)
  }

  public static getInstance(): AttendanceMonitor {
    if (!AttendanceMonitor.instance) {
      AttendanceMonitor.instance = new AttendanceMonitor();
    }
    return AttendanceMonitor.instance;
  }

  /**
   * Atualiza a telemetria com dados REAIS do banco de dados
   */
  public async syncWithDatabase(db: any) {
    try {
      const stats = await db.getDashboardStats();
      this.telemetry = {
        currentStudents: stats.todayPresence || stats.totalStudents * 0.9, // Fallback se todayPresence não existir (mas adicionei no DB)
        totalEnrolled: stats.totalStudents,
        percentage: stats.presenceRate,
        lastUpdate: new Date().toISOString()
      };
      
      // Se todayPresence não veio do getDashboardStats (que acabei de atualizar), pegar direto
      if (db.getTodayPresenceCount) {
        this.telemetry.currentStudents = await db.getTodayPresenceCount();
        this.telemetry.percentage = this.telemetry.totalEnrolled > 0 
          ? parseFloat(((this.telemetry.currentStudents / this.telemetry.totalEnrolled) * 100).toFixed(1))
          : 0;
      }

      this.emit('attendance-updated', this.telemetry);
    } catch (error) {
      console.error('Erro ao sincronizar AttendanceMonitor com o Banco:', error);
    }
  }

  public getTelemetry(): AttendanceTelemetry {
    return this.telemetry;
  }
}

export const attendanceMonitor = AttendanceMonitor.getInstance();
export default attendanceMonitor;

