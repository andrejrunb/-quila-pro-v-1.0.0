import { EventEmitter } from 'events';
import { parentPortal } from './ParentPortalService';

export interface AttendanceAuditRecord {
  date: string;
  studentId: string;
  manualStatus: boolean;
  digitalStatus: boolean;
  isMatch: boolean;
}

/**
 * AttendanceAuditService (v3530)
 * Cruza dados da chamada manual com a digital e sincroniza com o Portal de Pais.
 */
class AttendanceAuditService extends EventEmitter {
  private auditLogs: AttendanceAuditRecord[] = [];

  /**
   * Registra a presença capturada via biometria e sincroniza (Item 114).
   */
  public async logAttendance(studentId: string, status: 'present' | 'absent') {
    console.log(`[Attendance] Registrando ${status} para ${studentId}`);
    
    // Sincronização Soberana com Portal de Pais
    parentPortal.pushSecurityAlert(
      studentId, 
      'access', 
      `Presença confirmada via Biometria Áquila: ${status === 'present' ? 'Entrada' : 'Saída'}`
    );

    this.emit('attendance-logged', { studentId, status, timestamp: Date.now() });
  }

  /**
   * Registra um cruzamento de dados para análise de precisão.
   */
  public logAudit(studentId: string, manual: boolean, digital: boolean) {
    const record: AttendanceAuditRecord = {
      date: new Date().toISOString().split('T')[0],
      studentId,
      manualStatus: manual,
      digitalStatus: digital,
      isMatch: manual === digital
    };

    this.auditLogs.push(record);
    this.emit('audit-logged', record);
  }

  public getEfficiencyRate(): number {
    if (this.auditLogs.length === 0) return 100;
    const matches = this.auditLogs.filter(r => r.isMatch).length;
    return (matches / this.auditLogs.length) * 100;
  }

  /**
   * Retorna tendências pedagógicas para o dashboard (v3530).
   */
  public getTrending() {
    return {
      totalPresent: this.auditLogs.length > 0 ? this.auditLogs.filter(r => r.digitalStatus).length : 24, // Mock if empty
      totalAbsent: this.auditLogs.length > 0 ? this.auditLogs.filter(r => !r.digitalStatus).length : 2,
      trend: 'stable'
    };
  }

  public getReport() {
    return this.auditLogs;
  }
}

export const attendanceAuditService = new AttendanceAuditService();
export default attendanceAuditService;
