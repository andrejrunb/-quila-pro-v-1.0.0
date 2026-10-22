import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
import { EventEmitter } from 'events';
import * as path from 'path';
import * as readline from 'readline';
import * as fs from 'fs';

import { CameraConfig } from '../../services/AiTypes';

/**
 * CameraWorkerHost.ts — AG-013 (Arquitetura Isolada)
 * Gerencia o ciclo de vida de um processo Python dedicado para UMA câmera.
 */
export class CameraWorkerHost extends EventEmitter {
  private worker: ChildProcessWithoutNullStreams | null = null;
  private isRestarting = false;
  private restartCount = 0;
  private readonly MAX_RESTARTS = 5;
  
  constructor(
    private readonly config: CameraConfig,
    private readonly pythonBin: string,
    private readonly scriptPath: string
  ) {
    super();
    if (process.env.PLAYWRIGHT === 'true') {
        this.pythonBin = 'MOCK_PYTHON';
        // @ts-ignore
        this.scriptPath = '';
    }
  }

  public async start(embeddings: any[] = []): Promise<void> {
    if (this.worker || process.env.PLAYWRIGHT === 'true') {
      if (process.env.PLAYWRIGHT === 'true') {
        console.log(`[CameraWorkerHost] [MOCK] Injecting virtual worker for ${this.config.id}`);
        // Injetar processo virtual
        const virtualProcess: any = new EventEmitter();
        virtualProcess.stdin = { write: (data: string) => console.log(`[E2E Mock] Input: ${data.trim()}`), writable: true };
        virtualProcess.kill = () => {};
        this.worker = virtualProcess;
      }
      return;
    }

    console.log(`[CameraWorkerHost] Iniciando worker para ${this.config.id} (${this.config.zone})`);

    const args = this.scriptPath ? [this.scriptPath] : [];

    this.worker = spawn(this.pythonBin, args, {
      env: {
        ...process.env,
        CAM_ID: this.config.id,
        RTSP_URL: this.config.rtspUrl,
        ZONE: this.config.zone,
        PERF_PROFILE: this.config.performanceProfile || 'BALANCED',
        PYTHONUNBUFFERED: '1',
      },
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    const rl = readline.createInterface({ input: this.worker.stdout });
    
    rl.on('line', (line) => {
      try {
        const data = JSON.parse(line);
        this.emit('message', data);
        if (data.type === 'face_detected') {
          this.emit('face-detected', data);
        }
      } catch (err) {
        // console.error(`[W-${this.config.id}] Erro JSON:`, line);
      }
    });

    this.worker.stderr.on('data', (data) => {
        console.error(`[W-${this.config.id}][STDERR]`, data.toString().trim());
    });

    this.worker.on('exit', (code) => {
      console.warn(`[CameraWorkerHost] Worker ${this.config.id} encerrou com código ${code}`);
      this.worker = null;
      if (!this.isRestarting && this.restartCount < this.MAX_RESTARTS) {
        this._handleRestart(embeddings);
      }
    });

    // Carregar embeddings iniciais se fornecidos
    if (embeddings.length > 0) {
      this.loadEmbeddingsBulk(embeddings);
    }
  }

  public stop(): void {
    this.isRestarting = true;
    if (this.worker) {
      this.worker.stdin.write(JSON.stringify({ action: 'stop' }) + '\n');
      this.worker.kill('SIGTERM');
      this.worker = null;
    }
  }

  public sendCommand(cmd: any): void {
    if (this.worker && this.worker.stdin.writable) {
      this.worker.stdin.write(JSON.stringify(cmd) + '\n');
    }
  }

  public loadEmbeddingsBulk(embeddings: any[]): void {
      for (const entry of embeddings) {
          this.sendCommand({
              action: 'load_embeddings',
              student_id: entry.student_id || entry.studentId,
              vectors: [entry.vector || entry.embedding]
          });
      }
  }

  private _handleRestart(embeddings: any[]): void {
    this.restartCount++;
    console.log(`[CameraWorkerHost] Tentando reiniciar ${this.config.id} em 5s (Tentativa ${this.restartCount})...`);
    setTimeout(() => {
      this.start(embeddings);
    }, 5000);
  }
}

