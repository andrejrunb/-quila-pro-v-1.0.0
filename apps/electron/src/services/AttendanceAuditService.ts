/**
 * ATTENDANCE AUDIT SERVICE (Safe Proxy)
 */
export class AttendanceAuditServiceProxy {
  private static instance: AttendanceAuditServiceProxy;
  public static getInstance(): AttendanceAuditServiceProxy {
    if (!AttendanceAuditServiceProxy.instance) AttendanceAuditServiceProxy.instance = new AttendanceAuditServiceProxy();
    return AttendanceAuditServiceProxy.instance;
  }
  private async invoke(method: string, ...args: any[]): Promise<any> {
    if (typeof window !== 'undefined' && window.aquila) return window.aquila.invoke(`attendance-audit:${method}`, ...args);
    return null;
  }
  public async getAuditStats(): Promise<any> { return this.invoke('get-stats'); }
  public async getDiscrepancies(date?: string): Promise<any> { return this.invoke('get-discrepancies', date); }
  public async getSeatingDiscrepancies(classId: string): Promise<any> { return this.invoke('get-seating-discrepancies', classId); }
  public async getHistory(days: number = 30): Promise<any> { return this.invoke('get-history', days); }
  public async runBatchAudit(date: string): Promise<any> { return this.invoke('run-batch', { date }); }
}
export const attendanceAuditService = AttendanceAuditServiceProxy.getInstance();
export default attendanceAuditService;
