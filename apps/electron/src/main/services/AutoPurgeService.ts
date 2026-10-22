import * as fs from 'fs';
import * as path from 'path';
import Database from '../../database/Database';

/**
 * AutoPurgeService.ts — Passo 72 do Roadmap.
 * Responsável pela deleção automática de evidências (frames) após o período legal (30 dias).
 * Garante o "Direito ao Esquecimento" e economia de disco.
 */
export class AutoPurgeService {
    private purgeInterval: NodeJS.Timeout | null = null;
    private maxAgeDays: number = 30;

    constructor(private db: Database, private storagePath: string) {}

    public start(): void {
        console.log('[AutoPurge] Iniciando agendador de limpeza (Ciclo: 24h)...');
        // Executa uma vez ao iniciar e depois a cada 24 horas
        this._runPurge();
        this.purgeInterval = setInterval(() => this._runPurge(), 24 * 60 * 60 * 1000);
    }

    public stop(): void {
        if (this.purgeInterval) clearInterval(this.purgeInterval);
    }

    private async _runPurge(): Promise<void> {
        const thresholdDate = new Date();
        thresholdDate.setDate(thresholdDate.getDate() - this.maxAgeDays);
        
        console.log(`[AutoPurge] Analisando arquivos anteriores a: ${thresholdDate.toLocaleDateString()}`);

        try {
            // 1. Localiza alertas/evidências antigos no banco
            const oldAlerts = await this.db.all(
                'SELECT id, proofPath FROM security_alerts WHERE timestamp < ?',
                [thresholdDate.toISOString()]
            );

            let deletedCount = 0;
            for (const alert of oldAlerts) {
                if (alert.proofPath) {
                    const fullPath = path.resolve(this.storagePath, alert.proofPath);
                    if (fs.existsSync(fullPath)) {
                        fs.unlinkSync(fullPath);
                        deletedCount++;
                    }
                }
            }

            // 2. Limpa logs de notificação antigos (opcional, dependendo da política)
            // await this.db.run('DELETE FROM notifications WHERE timestamp < ?', [thresholdDate.toISOString()]);

            if (deletedCount > 0) {
                console.log(`[AutoPurge] Limpeza concluída: ${deletedCount} evidências removidas.`);
            }
        } catch (error) {
            console.error('[AutoPurge] Falha durante o ciclo de limpeza:', error);
        }
    }

    public setMaxAge(days: number): void {
        this.maxAgeDays = days;
        console.log(`[AutoPurge] Novo limite de retenção: ${days} dias.`);
    }
}

