import { EventEmitter } from 'events';
import { studentPortfolioService } from './StudentPortfolioService';
import { schedulingEngine, ScheduleEvent } from './SchedulingEngine';
import { identityBridge } from './IdentityBridgeService';

export interface PedagogicalReport {
  id: string;
  classSession: string;
  teacherId: string;
  teacherName: string;
  timestamp: string;
  avgEngagementScore: number;
  criticalAlerts: number;
  studentSummaries: Array<{
    name: string;
    score: number;
    status: 'high_focus' | 'restless' | 'sleep_warning' | 'normal';
  }>;
  pathReviews: Array<{ // v1630: Trajetórias para validação
    studentId: string;
    studentName: string;
    actualZones: string[];
    startTime: string;
    endTime: string;
    validationStatus: 'pending' | 'confirmed' | 'divergent';
  }>;
}

/**
 * PedagogicalReportingService (v1628)
 * Automatiza o envio de resumos comportamentais para professores.
 */
class PedagogicalReportingService extends EventEmitter {
  private sentReports: PedagogicalReport[] = [];

  constructor() {
    super();
  }

  /**
   * Disparado quando uma aula termina (simulado para v1628)
   */
  public generateSessionReport(roomId: string) {
    const activeEvent = schedulingEngine.getActiveEvent(roomId);
    if (!activeEvent) return;

    // Coletar identidades vinculadas no momento
    const participants = identityBridge.getAllLinks();
    const studentSummaries = participants.map(link => {
      const summary = studentPortfolioService.getSummary(link.studentId);
      return {
        name: link.studentName,
        score: summary.engagementScore,
        status: this.getStatusFromScore(summary.engagementScore)
      };
    });

    const report: PedagogicalReport = {
      id: `rep-${Date.now()}`,
      classSession: activeEvent.className,
      teacherId: activeEvent.teacherId,
      teacherName: activeEvent.teacherName,
      timestamp: new Date().toISOString(),
      avgEngagementScore: studentSummaries.reduce((acc, s) => acc + s.score, 0) / (studentSummaries.length || 1),
      criticalAlerts: studentSummaries.filter(s => s.score < 5).length,
      studentSummaries,
      pathReviews: [ // v1630: Mock de trajetórias para demonstração
        { 
          studentId: 'std-001', 
          studentName: participants[0]?.studentName || 'Andrej', 
          actualZones: ['Corredor Norte', 'Cantina', 'Pátio Central'], 
          startTime: '14:05', 
          endTime: '14:15', 
          validationStatus: 'pending' 
        },
        { 
          studentId: 'std-002', 
          studentName: participants[1]?.studentName || 'Fulano', 
          actualZones: ['Corredor Norte', 'Banheiro Masc.'], 
          startTime: '14:20', 
          endTime: '14:25', 
          validationStatus: 'pending' 
        }
      ]
    };

    this.sentReports.unshift(report);
    this.emit('report_dispatched', report);
    
    console.log(`[PedagogicalReporting] Report sent to Prof. ${activeEvent.teacherName} for ${activeEvent.className}`);
    return report;
  }

  private getStatusFromScore(score: number): any {
    if (score >= 9) return 'high_focus';
    if (score < 5) return 'sleep_warning';
    if (score < 7) return 'restless';
    return 'normal';
  }

  public updatePathValidation(reportId: string, studentId: string, status: 'confirmed' | 'divergent') {
    const report = this.sentReports.find(r => r.id === reportId);
    if (report) {
      const review = report.pathReviews.find(p => p.studentId === studentId);
      if (review) {
        review.validationStatus = status;
        this.emit('validation_updated', { reportId, studentId, status });
        
        // v1630: Notificar portfólio para aplicar penalidade se divergente
        if (status === 'divergent') {
          studentPortfolioService.logEvent({
            studentId,
            type: 'zone_deviation',
            description: `DIVERGÊNCIA CONFIRMADA PELO PROFESSOR: Destino não condiz com o declarado na aula ${report.classSession}.`,
            severity: 'high'
          });
        }
      }
    }
  }

  public getHistoryByTeacher(teacherId: string): PedagogicalReport[] {
    return this.sentReports.filter(r => r.teacherId === teacherId);
  }
}

export const pedagogicalReportingService = new PedagogicalReportingService();
