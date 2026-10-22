import { db } from '../../database/Database';
import { logger } from '../logger';

/**
 * COORDINATION SERVICE (Phase 502)
 * --------------------------------
 * Centralizes high-level pedagogical insights and intervention management.
 * Segregated from general system alerts for coordinator-specific focus.
 */
export class CoordinationService {
  private static instance: CoordinationService;

  private constructor() {}

  public static getInstance(): CoordinationService {
    if (!CoordinationService.instance) {
      CoordinationService.instance = new CoordinationService();
    }
    return CoordinationService.instance;
  }

  /**
   * Publishes a new insight for the coordination dashboard.
   */
  public async publishInsight(data: {
    type: 'DROPOUT_RISK' | 'SEATING_OPTIMIZATION' | 'BEHAVIORAL_ANOMALY';
    targetId: string;
    title: string;
    content: string;
    priority?: 'LOW' | 'MEDIUM' | 'HIGH';
  }): Promise<void> {
    try {
      const id = `INSIGHT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      
      await db.run(
        `INSERT INTO coordination_insights (id, type, target_id, title, content, priority)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          id,
          data.type,
          data.targetId,
          data.title,
          data.content,
          data.priority || 'MEDIUM'
        ]
      );

      logger.info(`[Coordination] New insight published: ${id} (${data.type})`);
    } catch (err: any) {
      logger.error(`[Coordination] Failed to publish insight: ${err.message}`);
    }
  }

  /**
   * Fetches pending insights.
   */
  public async getPendingInsights(): Promise<any[]> {
    return await db.all(
      "SELECT * FROM coordination_insights WHERE status = 'PENDING' ORDER BY createdAt DESC"
    );
  }

  /**
   * Dismisses or resolves an insight.
   */
  public async updateInsightStatus(id: string, status: 'RESOLVED' | 'DISMISSED'): Promise<void> {
    await db.run(
      'UPDATE coordination_insights SET status = ? WHERE id = ?',
      [status, id]
    );
  }

  /**
   * Lists all intervention dossiers.
   */
  public async getInterventionDossiers(): Promise<any[]> {
    return await db.all(
      'SELECT * FROM student_evidence_dossier ORDER BY createdAt DESC'
    );
  }

  /**
   * Generates a high-level summary for the dashboard.
   */
  public async getCoordinationSummary(): Promise<any> {
    const totalStudents = await db.get('SELECT COUNT(*) as count FROM students');
    const presentToday = await db.get("SELECT COUNT(DISTINCT studentId) as count FROM attendance WHERE date = date('now') AND status = 'PRESENT'");
    const pendingInsights = await db.get("SELECT COUNT(*) as count FROM coordination_insights WHERE status = 'PENDING'");
    const criticalRisks = await db.get("SELECT COUNT(*) as count FROM coordination_insights WHERE status = 'PENDING' AND priority = 'HIGH'");
    const activeDossiers = await db.get('SELECT COUNT(*) as count FROM student_evidence_dossier');
    const pendingInterventions = await db.get("SELECT COUNT(*) as count FROM coordination_insights WHERE type = 'DROPOUT_RISK' AND status = 'PENDING'");

    const total = totalStudents?.count || 0;
    const present = presentToday?.count || 0;

    return {
      totalStudents: total,
      presentToday: present,
      attendanceRate: total > 0 ? (present / total) * 100 : 0,
      studentsAtRisk: criticalRisks?.count || 0,
      pendingIncidents: pendingInsights?.count || 0,
      pendingInterventions: pendingInterventions?.count || 0,
      activeDossiers: activeDossiers?.count || 0,
      lastSync: new Date().toISOString()
    };
  }

  /**
   * Resolves an insight with a specific action.
   */
  public async resolveInsight(id: string, resolution: string): Promise<void> {
    await db.run(
      "UPDATE coordination_insights SET status = 'RESOLVED', resolution_note = ? WHERE id = ?",
      [resolution, id]
    );
    logger.info(`[Coordination] Insight ${id} resolved with note.`);
  }

  /**
   * Fetches detailed evasion profiles for the dashboard.
   * Maps coordination_insights to the format expected by the UI.
   */
  public async getEvasionProfilesDetailed(threshold: number = 50): Promise<any[]> {
    const rows = await db.all(`
      SELECT 
        ci.target_id as studentId,
        s.name as studentName,
        c.name as className,
        ci.content as factorsContent,
        ci.priority,
        ci.createdAt as lastAudit
      FROM coordination_insights ci
      JOIN students s ON ci.target_id = s.id
      JOIN classes c ON s.classId = c.id
      WHERE ci.type = 'DROPOUT_RISK' AND ci.status = 'PENDING'
    `);

    return rows.map(r => ({
      studentId: r.studentId,
      studentName: r.studentName, // Note: decrypted by db.getStudents usually, but here we might need manual decrypt if db.all is used raw
      className: r.className,
      riskProbability: r.priority === 'HIGH' ? 0.85 : 0.65, // Derived from priority for now
      trend: 'up', // Default trend
      factors: r.factorsContent.split('.').map((f: string) => f.trim()).filter((f: string) => f.length > 0),
      consecutiveAbsences: 0, // Placeholder
      lastAudit: r.lastAudit
    }));
  }
}

export const coordinationService = CoordinationService.getInstance();
