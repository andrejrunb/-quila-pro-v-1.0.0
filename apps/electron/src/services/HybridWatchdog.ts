import { EventEmitter } from 'events';

/**
 * HybridWatchdog.ts — Passo 67 do Roadmap.
 * Monitora workers de vídeo e IA, reiniciando apenas o necessário em caso de falha.
 * Evita o "black screen" durante o horário de pico.
 */
export class HybridWatchdog extends EventEmitter {
    private workerStatus: Map<string, { lastPing: number; restarts: number }> = new Map();
    private checkInterval: NodeJS.Timeout | null = null;

    constructor(private timeoutMs: number = 10000) {
        super();
    }

    public start(): void {
        this.checkInterval = setInterval(() => this._checkWorkers(), 5000);
        console.log('[HybridWatchdog] Monitoramento de resiliência ativo.');
    }

    public ping(workerId: string): void {
        if (!this.workerStatus.has(workerId)) {
            this.workerStatus.set(workerId, { lastPing: Date.now(), restarts: 0 });
        } else {
            const status = this.workerStatus.get(workerId)!;
            status.lastPing = Date.now();
        }
    }

    private _checkWorkers(): void {
        const now = Date.now();
        for (const [id, status] of this.workerStatus.entries()) {
            if (now - status.lastPing > this.timeoutMs) {
                console.warn(`[HybridWatchdog] Worker ${id} parou de responder! Reiniciando...`);
                status.restarts++;
                status.lastPing = now; // Reset para evitar loop infinito imediato
                this.emit('worker-failure', { id, restarts: status.restarts });
            }
        }
    }

    public stop(): void {
        if (this.checkInterval) clearInterval(this.checkInterval);
    }
}
