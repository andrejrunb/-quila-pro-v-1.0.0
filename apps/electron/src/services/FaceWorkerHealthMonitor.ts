/**
 * FaceWorkerHealthMonitor.ts — Item 37 (Self-Healing)
 * Monitora o processo do face_worker.py.
 * Se o worker travar ou morrer, reinicia automaticamente até 3 vezes.
 * Após 3 falhas em 5 min, entra em modo de falha segura e notifica o admin.
 */

import { EventEmitter } from 'events';
import { FaceWorkerBridge } from './FaceWorkerBridge';

export class FaceWorkerHealthMonitor extends EventEmitter {
  private checkInterval: NodeJS.Timeout | null = null;
  private restartCount = 0;
  private firstFailureTime: number | null = null;
  private readonly MAX_RESTARTS = 3;
  private readonly FAILURE_WINDOW_MS = 5 * 60 * 1000; // 5 minutos
  private inSafeFail = false;

  constructor(private readonly faceWorker: FaceWorkerBridge) {
    super();

    // Escutar morte inesperada do worker
    this.faceWorker.on('worker-exit', ({ code }) => {
      if (code !== 0 && !this.inSafeFail) {
        console.warn(`[HealthMonitor] Worker encerrou com código ${code}. Tentando reiniciar...`);
        this._handleFailure();
      }
    });
  }

  start(): void {
    if (this.checkInterval) return;
    // Ping ao worker a cada 30s
    this.checkInterval = setInterval(() => this._heartbeat(), 30_000);
    console.log('[HealthMonitor] Monitor de saúde iniciado.');
  }

  stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  private async _heartbeat(): Promise<void> {
    if (this.inSafeFail) return;
    if (!this.faceWorker.isReady()) {
      console.warn('[HealthMonitor] Worker não responde ao heartbeat.');
      this._handleFailure();
    }
  }

  private async _handleFailure(): Promise<void> {
    if (this.inSafeFail) return;

    const now = Date.now();

    // Resetar janela se a última falha foi há mais de 5 min
    if (this.firstFailureTime && (now - this.firstFailureTime) > this.FAILURE_WINDOW_MS) {
      this.restartCount = 0;
      this.firstFailureTime = null;
    }

    if (this.firstFailureTime === null) this.firstFailureTime = now;
    this.restartCount++;

    if (this.restartCount > this.MAX_RESTARTS) {
      this.inSafeFail = true;
      console.error('[HealthMonitor] 🆘 Limite de reinicializações atingido. Entrando em modo de falha segura.');
      this.emit('safe-fail', { restartCount: this.restartCount });
      return;
    }

    console.log(`[HealthMonitor] Reiniciando worker (tentativa ${this.restartCount}/${this.MAX_RESTARTS})...`);
    this.emit('restarting', { attempt: this.restartCount });

    try {
      this.faceWorker.stop();
      await new Promise(resolve => setTimeout(resolve, 2000)); // Aguardar cleanup
      await this.faceWorker.start();
      this.emit('restarted', { attempt: this.restartCount });
      console.log('[HealthMonitor] ✅ Worker reiniciado com sucesso!');
    } catch (err) {
      console.error('[HealthMonitor] Falha ao reiniciar worker:', err);
    }
  }

  reset(): void {
    this.restartCount = 0;
    this.firstFailureTime = null;
    this.inSafeFail = false;
    console.log('[HealthMonitor] Contador de reinicializações resetado.');
  }
}
