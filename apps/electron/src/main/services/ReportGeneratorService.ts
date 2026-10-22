import Database from '../../database/Database';
import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';

/**
 * ReportGeneratorService.ts — Passo 25 do Roadmap.
 * Gera relatórios consolidados em PDF/JSON para escolas.
 */
export class ReportGeneratorService {
  constructor(private db: Database) {}

  public async generateSchoolWeeklyReport(): Promise<{ path: string; summary: any }> {
    const reportsDir = path.join(app.getPath('userData'), 'reports');
    if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });

    const fileName = `weekly_report_${Date.now()}.json`;
    const dest = path.join(reportsDir, fileName);

    // Coletar métricas reais
    const stats = await this.db.getDashboardStats();
    const alerts = await this.db.getRecentSecurityAlerts(100);
    
    const summary = {
      period: 'Últimos 7 dias',
      totalPresences: stats.totalStudents || 0,
      securityAlertsCount: alerts.length,
      anomaliesDetected: alerts.filter(a => a.priority === 'high').length,
      generatedAt: new Date().toISOString()
    };

    fs.writeFileSync(dest, JSON.stringify({ summary, details: alerts }, null, 2));

    return {
      path: dest,
      summary
    };
  }
}

