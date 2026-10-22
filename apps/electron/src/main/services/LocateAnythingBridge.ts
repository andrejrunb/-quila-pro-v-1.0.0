import { spawn } from 'child_process';
import { EventEmitter } from 'events';
import * as path from 'path';
import * as readline from 'readline';
import * as fs from 'fs';
import { selfHealingService } from './SelfHealingService';

export class LocateAnythingBridge extends EventEmitter {
  private worker: any = null;
  private isReadyState = false;
  private pendingRequests = new Map<string, {
    resolve: (v: any) => void;
    reject: (e: Error) => void;
    timeout: NodeJS.Timeout;
  }>();
  private readonly pythonBin: string;
  private readonly workerScript: string;
  private readonly REQUEST_TIMEOUT_MS = 15_000;

  constructor(private readonly isDev: boolean, private readonly resourcesPath: string) {
    super();
    if (process.env.PLAYWRIGHT === 'true') {
      this.pythonBin = 'MOCK_PYTHON';
      this.workerScript = '';
      return;
    }
    if (!isDev) {
      // Produção
      this.pythonBin = path.join(resourcesPath, 'python_workers', 'aquila_locate_anything', 'aquila_locate_anything.exe');
      this.workerScript = '';
    } else {
      // Desenvolvimento
      this.pythonBin = process.env.PYTHON_BIN || 'python';
      this.workerScript = path.join(__dirname, '../../../python/locate_anything_worker.py');
    }
  }

  async start(): Promise<void> {
    if (this.worker) return;

    if (process.env.PLAYWRIGHT !== 'true' && !fs.existsSync(this.workerScript) && this.isDev) {
      throw new Error(`locate_anything_worker.py não encontrado: ${this.workerScript}`);
    }

    console.log(`[LocateAnythingBridge] Iniciando worker LocateAnything...`);

    return new Promise((resolve, reject) => {
      if (process.env.PLAYWRIGHT === 'true') {
        this.isReadyState = true;
        this.worker = new EventEmitter();
        this.worker.stdin = { write: (data: string) => console.log(`[E2E Locate Mock] Input: ${data.trim()}`), writable: true };
        this.worker.kill = () => {};
        resolve();
        return;
      }

      const args = this.workerScript ? [this.workerScript] : [];
      const subProcess = spawn(this.pythonBin, args, {
        env: {
          ...process.env,
          PYTHONUNBUFFERED: '1',
        },
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      subProcess.stderr.on('data', (data: Buffer) => {
        console.log(`[locate_anything_worker.py] ${data.toString().trim()}`);
      });

      const rl = readline.createInterface({ input: subProcess.stdout });
      rl.on('line', (line: string) => this._handleLine(line));

      subProcess.on('error', (err) => {
        console.error(`[LocateAnythingBridge] Erro no Processo:`, err);
        reject(err);
      });

      subProcess.on('exit', (code) => {
        console.warn(`[LocateAnythingBridge] Processo encerrado (Código ${code})`);
        this.worker = null;
        this.isReadyState = false;
      });

      const onReady = (data: any) => {
        if (data.type === 'ready') {
          this.isReadyState = true;
          this.worker = subProcess;
          this.off('_raw', onReady);
          resolve();
        }
      };
      this.on('_raw', onReady);

      setTimeout(() => {
        this.off('_raw', onReady);
        reject(new Error(`Worker LocateAnything timeout ao inicializar`));
      }, 15_000);
    });
  }

  stop(): void {
    if (this.worker) {
      if (this.worker.stdin && this.worker.stdin.writable) {
        this.worker.stdin.write(JSON.stringify({ action: 'shutdown' }) + '\n');
      }
      setTimeout(() => {
        if (this.worker) this.worker.kill('SIGTERM');
      }, 1_500);
    }
    this.worker = null;
    this.isReadyState = false;
  }

  isReady(): boolean {
    return this.isReadyState && this.worker !== null;
  }

  async locate(framePath: string, query: string): Promise<any> {
    if (process.env.PLAYWRIGHT === 'true') {
      return {
        type: 'located',
        detections: [{ box: [100, 200, 250, 320], label: query, confidence: 0.9 }],
        simulated: true
      };
    }
    return this._request({ action: 'locate', frame_path: framePath, query });
  }

  async getOperationalStatus(): Promise<any> {
    const bridgeReady = this.isReady();
    let workerStatus: any = null;

    if (bridgeReady && process.env.PLAYWRIGHT !== 'true') {
      try {
        workerStatus = await this._request({ action: 'status' });
      } catch (e) {
        workerStatus = { error: 'Timeout ao consultar worker' };
      }
    }

    return {
      bridge_ready: bridgeReady,
      worker_details: workerStatus,
      mode: bridgeReady ? (workerStatus?.mode || 'SIMULATED_FALLBACK') : 'OFFLINE'
    };
  }

  private _request(cmd: Record<string, any>): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.isReady()) {
        reject(new Error('LocateAnythingBridge: Worker não inicializado'));
        return;
      }

      const request_id = `req_la_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(request_id);
        reject(new Error(`LocateAnything timeout: ${cmd.action}`));
      }, this.REQUEST_TIMEOUT_MS);

      this.pendingRequests.set(request_id, { resolve, reject, timeout });

      if (this.worker && this.worker.stdin && this.worker.stdin.writable) {
        this.worker.stdin.write(JSON.stringify({ ...cmd, request_id }) + '\n');
      } else {
        reject(new Error('Worker stdin não disponível'));
      }
    });
  }

  private _handleLine(line: string): void {
    if (!line.trim()) return;
    try {
      selfHealingService.reportHeartbeat('LOCATE_ANYTHING');
      const data = JSON.parse(line);
      this.emit('_raw', data);

      if (data.request_id && this.pendingRequests.has(data.request_id)) {
        const pending = this.pendingRequests.get(data.request_id)!;
        clearTimeout(pending.timeout);
        this.pendingRequests.delete(data.request_id);

        if (data.type === 'error') pending.reject(new Error(data.message));
        else pending.resolve(data);
      }
    } catch (e) {
      // Ignora erros de parsing não-JSON
    }
  }
}
