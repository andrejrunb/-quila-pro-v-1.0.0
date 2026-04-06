import Database from '../database/Database';

/**
 * ChurnMonitorService.ts — Passo 62 do Roadmap.
 * Monitora a saúde operacional (Heartbeat) e o engajamento do sistema.
 */
export class ChurnMonitorService {
    private interval: NodeJS.Timeout | null = null;
    private detectionsThisInterval = 0;
    private alertsThisInterval = 0;

    constructor(private db: Database) {}

    public start(): void {
        console.log('[ChurnMonitor] Iniciando rastreamento de atividade...');
        // Heartbeat a cada 5 minutos
        this.interval = setInterval(() => this._logHeartbeat(), 5 * 60 * 1000);
    }

    public stop(): void {
        if (this.interval) clearInterval(this.interval);
    }

    public recordDetection(): void {
        this.detectionsThisInterval++;
    }

    public recordAlert(): void {
        this.alertsThisInterval++;
    }

    private async _logHeartbeat(): Promise<void> {
        try {
            // Loga 300 segundos (5 min) de atividade
            await this.db.logSystemUsage(300, this.detectionsThisInterval, this.alertsThisInterval);
            this.detectionsThisInterval = 0;
            this.alertsThisInterval = 0;
        } catch (error) {
            console.error('[ChurnMonitor] Erro ao logar heartbeat:', error);
        }
    }

    /**
     * Verifica se o sistema foi usado nos últimos X dias.
     * Útil para o André (Dono do SaaS) saber se a escola abandonou o app.
     */
    public async isHealthy(daysLimit: number = 2): Promise<boolean> {
        const usage = await this.db.getRecentUsage(daysLimit);
        return usage.length > 0;
    }
}
