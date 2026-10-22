import { db } from '../../database/Database';
import { logger } from '../logger';
import { pedagogicalRiskService } from './PedagogicalRiskService';

/**
 * ABSENCE INTELLIGENCE SERVICE (Phase 501)
 * ---------------------------------------
 * Monitors attendance patterns and triggers pedagogical risk events.
 * Implements "Consecutive Absence" detection logic.
 */
export class AbsenceIntelligenceService {
  private static instance: AbsenceIntelligenceService;

  private constructor() {}

  public static getInstance(): AbsenceIntelligenceService {
    if (!AbsenceIntelligenceService.instance) {
      AbsenceIntelligenceService.instance = new AbsenceIntelligenceService();
    }
    return AbsenceIntelligenceService.instance;
  }

  /**
   * Tracks a sequence of absences and triggers risk analysis if thresholds are met.
   */
  public async trackAbsence(studentId: string, consecutiveCount: number): Promise<void> {
    logger.info(`[Absence-AI] Tracking ${consecutiveCount} consecutive absences for student: ${studentId}`);
    
    // Threshold for critical risk: 3 consecutive absences
    if (consecutiveCount >= 3) {
      logger.warn(`[Absence-AI] Threshold reached for ${studentId}. Triggering risk analysis.`);
      await pedagogicalRiskService.analyzeRisk(studentId, {
        trigger: 'CONSECUTIVE_ABSENCE',
        value: consecutiveCount
      });
    }
  }

  /**
   * Scans recent attendance logs to find new consecutive absence patterns.
   */
  public async scanRecentAbsences(): Promise<void> {
    try {
      // Find students with recent absences not yet handled
      // This is a simplified version for Phase 501
      const students = await db.all('SELECT id FROM students WHERE status = "active"');
      
      for (const student of students) {
        const recentLogs = await db.all(
          'SELECT status FROM attendance WHERE studentId = ? ORDER BY date DESC LIMIT 5',
          [student.id]
        );
        
        let consecutive = 0;
        for (const log of recentLogs) {
          if (log.status === 'absent') {
            consecutive++;
          } else {
            break;
          }
        }
        
        if (consecutive > 0) {
          await this.trackAbsence(student.id, consecutive);
        }
      }
    } catch (err: any) {
      logger.error(`[Absence-AI] Scan failed: ${err.message}`);
    }
  }
}

export const absenceIntelligenceService = AbsenceIntelligenceService.getInstance();
