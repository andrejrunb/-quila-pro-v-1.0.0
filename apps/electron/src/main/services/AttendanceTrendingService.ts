import { Database } from '../../database/Database';

export interface TrendResult {
  date: string;
  count: number;
  anomaly?: boolean;
}

/**
 * AttendanceTrendingService.ts — AG-018
 * Analisa o histórico de presença para predição de evasão escolar.
 */
class AttendanceTrendingService {
  constructor(private readonly db: Database) {}

  /**
   * Retorna os dados para o gráfico de tendência dos últimos 7 dias.
   */
  public async getWeeklyTrend(): Promise<TrendResult[]> {
    try {
      // Query real na tabela 'attendance' agrupando por data
      const sql = `
        SELECT date, COUNT(*) as count 
        FROM attendance 
        WHERE date >= date('now', '-7 days')
        GROUP BY date
        ORDER BY date ASC
      `;
      
      const results = await this.db.all(sql);
      
      // Mapear para o formato da UI
      return results.map((r: any) => ({
        date: this.formatDateLabel(r.date),
        count: r.count,
        anomaly: r.count < 10 // Simples heurística: menos de 10 alunos é uma anomalia para esta escola
      }));
    } catch (err) {
      console.error('[AttendanceTrendingService] Erro ao buscar tendências:', err);
      return [];
    }
  }

  /**
   * Calcula o "Student Engagement Score" com base nos últimos 30 dias.
   */
  public async getEngagementScore(studentId: string): Promise<number> {
    try {
      const sql = `
        SELECT 
          COUNT(CASE WHEN status = 'present' THEN 1 END) as presentCount,
          COUNT(*) as totalDays
        FROM attendance 
        WHERE studentId = ? AND date >= date('now', '-30 days')
      `;
      
      const result = await this.db.get(sql, [studentId]);
      
      if (!result || result.totalDays === 0) return 0;
      
      return Math.round((result.presentCount / result.totalDays) * 100);
    } catch (err) {
      console.error(`[AttendanceTrendingService] Erro ao calcular score para ${studentId}:`, err);
      return 0;
    }
  }

  private formatDateLabel(dateStr: string): string {
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const date = new Date(dateStr);
    return days[date.getDay()];
  }
}

export { AttendanceTrendingService };

