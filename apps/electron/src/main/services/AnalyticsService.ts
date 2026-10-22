
import Database from '../../database/Database';
import { startOfDay, subDays, format, eachDayOfInterval } from 'date-fns';

export interface EngagementTrend {
    date: string;
    presenceCount: number;
    anomalyCount: number;
}

export class AnalyticsService {
    constructor(private readonly db: Database) {}

    /**
     * Retorna tendências de engajamento baseadas em presença e eventos de segurança.
     */
    async getEngagementTrends(days: number = 7): Promise<EngagementTrend[]> {
        const endDate = new Date();
        const startDate = subDays(endDate, days - 1);
        
        const interval = eachDayOfInterval({ start: startDate, end: endDate });
        
        // Query para obter contagem de presenças por dia
        // Nota: Assumindo estrutura de tabela baseada em ImmutableAuditLog ou Presence
        const presenceData = await this.db.all(`
            SELECT date(timestamp) as day, COUNT(*) as count 
            FROM audit_log 
            WHERE action = 'FACE_RECOGNIZED' 
            AND timestamp >= ?
            GROUP BY day
        `, [startDate.toISOString()]);

        const anomaliesData = await this.db.all(`
            SELECT date(timestamp) as day, COUNT(*) as count 
            FROM audit_log 
            WHERE action = 'SECURITY_ALERT' 
            AND timestamp >= ?
            GROUP BY day
        `, [startDate.toISOString()]);

        const trends: EngagementTrend[] = interval.map(date => {
            const dayStr = format(date, 'yyyy-MM-dd');
            const presence = presenceData.find((d: any) => d.day === dayStr);
            const anomaly = anomaliesData.find((d: any) => d.day === dayStr);

            return {
                date: dayStr,
                presenceCount: presence ? presence.count : 0,
                anomalyCount: anomaly ? anomaly.count : 0
            };
        });

        return trends;
    }

    /**
     * Identifica zonas de maior aglomeração (Heatmap Data).
     */
    async getHeatmap(days: number = 7) {
        return this.db.all(`
            SELECT payload as zoneName, COUNT(*) as eventCount, strftime('%H', timestamp) as hour
            FROM audit_log
            WHERE action = 'LOITERING_DETECTION'
            AND timestamp >= ?
            GROUP BY zoneName, hour
            ORDER BY eventCount DESC
            LIMIT 10
        `, [subDays(new Date(), days).toISOString()]);
    }

    /**
     * Gera um resumo de inteligência para o gestor.
     */
    async getManagementSummary() {
        const totalEvents = await this.db.get('SELECT COUNT(*) as count FROM audit_log');
        const uniqueStudents = await this.db.get('SELECT COUNT(DISTINCT userId) as count FROM audit_log WHERE userId IS NOT NULL');
        
        return {
            totalLogs: totalEvents.count,
            activeStudents: uniqueStudents.count,
            systemHealth: '100%',
            lastUpdate: new Date().toISOString()
        };
    }

    /**
     * Identifica alunos com risco de evasão ou vulnerabilidade baseando-se em padrões de frequência e segurança.
     */
    async getRiskAssessment() {
        const thirtyDaysAgo = subDays(new Date(), 30).toISOString();
        
        // 1. Alunos com queda de frequência (ex: menos de 3 presenças nos últimos 30 dias)
        const lowAttendance = await this.db.all(`
            SELECT userId, COUNT(*) as frequency 
            FROM audit_log 
            WHERE action = 'FACE_RECOGNIZED' 
            AND timestamp >= ?
            GROUP BY userId
            HAVING frequency < 5
        `, [thirtyDaysAgo]);

        // 2. Alunos com múltiplos alertas de segurança
        const securityAlerts = await this.db.all(`
            SELECT userId, COUNT(*) as alertCount
            FROM audit_log
            WHERE action = 'SECURITY_ALERT'
            AND timestamp >= ?
            AND userId IS NOT NULL
            GROUP BY userId
            HAVING alertCount > 2
        `, [thirtyDaysAgo]);

        const students = await this.db.getStudents();
        
        const riskList: any[] = [];

        // Mapear baixas frequências
        for (const item of lowAttendance) {
            const student = students.find((s: any) => s.id === item.userId);
            if (student) {
                riskList.push({
                    id: student.id,
                    name: student.name,
                    riskLevel: item.frequency < 2 ? 'high' : 'medium',
                    reason: `Baixa frequência nos últimos 30 dias (${item.frequency} presenças)`,
                    type: 'attendance'
                });
            }
        }

        // Mapear alertas de segurança
        for (const item of securityAlerts) {
            const student = students.find((s: any) => s.id === item.userId);
            if (student) {
                riskList.push({
                    id: student.id,
                    name: student.name,
                    riskLevel: item.alertCount > 5 ? 'high' : 'medium',
                    reason: `Múltiplos alertas de segurança (${item.alertCount} incidentes)`,
                    type: 'security'
                });
            }
        }

        return riskList.sort((a, b) => (a.riskLevel === 'high' ? -1 : 1));
    }
}

