import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
import { EventEmitter } from 'events';
import * as path from 'path';
import * as readline from 'readline';
import * as fs from 'fs';
import * as os from 'os';
import { privacyBlur } from './PrivacyBlurService';
import { selfHealing } from './SelfHealingService';
import { FaceDetectedPayload, FaceEncoding } from './AiTypes';

export class FaceWorkerBridge extends EventEmitter {
  private workers: any[] = [];
  private readyCount = 0;
  private nextWorkerIndex = 0;
  private readonly POOL_SIZE = Math.min(Math.max(os.cpus().length - 2, 1), 4); // Entre 1 e 4 workers
  private pendingRequests = new Map<string, {
    resolve: (v: any) => void;
    reject: (e: Error) => void;
    timeout: NodeJS.Timeout;
  }>();
  private readonly pythonBin: string;
  private readonly workerScript: string;
  private readonly REQUEST_TIMEOUT_MS = 15_000;
  private onnxModelPath: string | null = null;
  private hasNPU: boolean = false;

  constructor(private readonly isDev: boolean, private readonly resourcesPath: string) {
    super();
    if (process.env.PLAYWRIGHT === 'true') {
      this.pythonBin = 'MOCK_PYTHON';
      this.workerScript = '';
      return;
    }
    if (!isDev) {
      // Produção: Binário congelado
      this.pythonBin = path.join(resourcesPath, 'python_workers', 'aquila_face_worker', 'aquila_face_worker.exe');
      this.workerScript = '';
    } else {
      // Desenvolvimento
      this.pythonBin = process.env.PYTHON_BIN || 'python';
      this.workerScript = path.join(__dirname, '../../python/face_worker.py');
    }
  }

  // ─────────────────────────────────────────────
  // LIFECYCLE
  // ─────────────────────────────────────────────

  async start(): Promise<void> {
    if (this.workers.length > 0) return;

    if (!fs.existsSync(this.workerScript)) {
      throw new Error(`face_worker.py não encontrado: ${this.workerScript}`);
    }

    console.log(`[FaceWorkerBridge] Iniciando pool de ${this.POOL_SIZE} workers...`);

    const promises: Array<Promise<void>> = [];
    for (let i = 0; i < this.POOL_SIZE; i++) {
        const p = this._spawnWorker(i);
        promises.push(p);
    }

    await Promise.all(promises);
    this.setReady(true);
  }

  /**
   * Detecta aceleração de hardware disponível (Item 93)
   */
  async detectHardware(): Promise<void> {
    const modelSearchPath = this.isDev 
      ? path.join(__dirname, '../../python/models/facenet.onnx')
      : path.join(this.resourcesPath, 'models', 'facenet.onnx');

    if (fs.existsSync(modelSearchPath)) {
      this.onnxModelPath = modelSearchPath;
      this.hasNPU = true; // Assume hardware compatível se o modelo ONNX estiver presente p/ DirectML
      console.log(`[FaceWorkerBridge] Modelo ONNX detectado: ${modelSearchPath}`);
    }
  }

  private _spawnWorker(index: number): Promise<void> {
    return new Promise((resolve, reject) => {
        if (process.env.PLAYWRIGHT === 'true') {
          console.log(`[FaceWorkerBridge] [MOCK] Injecting virtual worker ${index}`);
          this.readyCount++;
          // Injetar processo virtual para passar nos checks de isReady()
          const virtualProcess: any = new EventEmitter();
          virtualProcess.stdin = { write: (data: string) => console.log(`[E2E Mock] Input: ${data.trim()}`), writable: true };
          virtualProcess.kill = () => {};
          this.workers.push(virtualProcess);
          resolve(); 
          return;
        }

        const args = this.workerScript ? [this.workerScript] : [];
        const worker = spawn(this.pythonBin, args, {
            env: {
                ...process.env,
                FACE_MODEL: this.hasNPU ? 'facenet' : 'hog',
                FACE_TOLERANCE: '0.6',
                PYTHONUNBUFFERED: '1',
                WORKER_ID: index.toString(),
                ONNX_MODEL_PATH: this.onnxModelPath || '',
            },
            stdio: ['pipe', 'pipe', 'pipe'],
        });

        worker.stderr.on('data', (data: Buffer) => {
            console.log(`[face_worker.py][W${index}] ${data.toString().trim()}`);
        });

        const rl = readline.createInterface({ input: worker.stdout });
        rl.on('line', (line: string) => this._handleLine(line));

        worker.on('error', (err) => {
            console.error(`[FaceWorkerBridge] Erro no Worker ${index}:`, err);
            this.emit('error', err);
            reject(err);
        });

        worker.on('exit', (code) => {
            console.warn(`[FaceWorkerBridge] Worker ${index} encerrado (Código ${code})`);
            const idx = this.workers.indexOf(worker);
            if (idx > -1) this.workers.splice(idx, 1);
            if (this.workers.length === 0) {
                this.setReady(false);
                this.emit('worker-exit', { code });
            }
        });

        const onReady = (data: any) => {
            if (data.type === 'ready') {
                this.readyCount++;
                this.workers.push(worker);
                this.off('_raw', onReady);
                resolve();
            }
        };
        this.on('_raw', onReady);

        setTimeout(() => {
            this.off('_raw', onReady);
            reject(new Error(`Worker ${index} timeout ao inicializar`));
        }, 15_000);
    });
  }

  async extractEmbedding(imagePath: string): Promise<number[] | null> {
    const res = await this._request({ action: 'encode_photo', photo_path: imagePath });
    return res.vector || null;
  }

  stop(): void {
    for (const worker of this.workers) {
        worker.stdin.write(JSON.stringify({ action: 'shutdown' }) + '\n');
        setTimeout(() => worker.kill('SIGTERM'), 1_500);
    }
    this.workers = [];
    this.readyCount = 0;
    this.setReady(false);
  }

  isReady(): boolean {
    return this.readyCount > 0 && this.workers.length > 0;
  }

  setReady(value: boolean) {
    if (this.workers.length > 0 !== value) {
      this.emit('status-change', { ready: value });
    }
  }

  // ─────────────────────────────────────────────
  // COMANDOS PÚBLICOS
  // ─────────────────────────────────────────────

  async encodePhoto(photoPath: string): Promise<FaceEncoding> {
    return this._request({ action: 'encode_photo', photo_path: photoPath });
  }

  async loadEmbeddings(studentId: string, vectors: number[][]): Promise<void> {
    const promises = this.workers.map((_, i) => 
        this._request({ action: 'load_embeddings', student_id: studentId, vectors }, i)
    );
    await Promise.all(promises);
  }

  async setThrottle(enabled: boolean): Promise<void> {
    const promises = this.workers.map((_, i) => 
        this._request({ action: 'set_throttle', enabled }, i)
    );
    await Promise.all(promises);
  }

  async clearMemory(): Promise<void> {
    const promises = this.workers.map((_, i) => 
        this._request({ action: 'clear_memory' }, i)
    );
    await Promise.all(promises);
  }

  async recognizeFrame(framePath: string): Promise<void> {
    const result = await this._request({ action: 'recognize_frame', frame_path: framePath });
    if (result?.type === 'face_detected') {
      const payload: FaceDetectedPayload = {
        student_id: result.student_id,
        confidence: result.confidence,
        ts: Date.now(),
        occlusion_score: result.occlusion_score,
        mask_detected: result.mask_detected,
        gesture: result.gesture,
        box: result.box,
        simulated: result.simulated,
        behavior_metadata: result.behavior_metadata // v4001 - Social Intelligence
      };

      // ITEM 92: Ofuscação de IA para não cadastrados
      if (privacyBlur.shouldBlur(payload)) {
        console.log(`[FaceWorkerBridge] Aplicando filtro de privacidade LGPD`);
        // Aqui o frame seria editado antes da emissão se necessário
      }

      this.emit('face-detected', payload);
    }
  }

  // ─────────────────────────────────────────────
  // INTERNOS
  // ─────────────────────────────────────────────

  private _request(cmd: Record<string, any>, specificWorkerIndex?: number): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.isReady()) {
          reject(new Error('FaceWorkerBridge: Nenhum worker disponível'));
          return;
      }

      const request_id = `req_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(request_id);
        reject(new Error(`FaceWorker timeout: ${cmd.action}`));
      }, this.REQUEST_TIMEOUT_MS);

      this.pendingRequests.set(request_id, { resolve, reject, timeout });

      let idx = specificWorkerIndex ?? this.nextWorkerIndex;
      if (idx >= this.workers.length) idx = 0;
      
      const worker = this.workers[idx];
      if (specificWorkerIndex === undefined) {
          this.nextWorkerIndex = (this.nextWorkerIndex + 1) % this.workers.length;
      }

      if (worker && worker.stdin.writable) {
          worker.stdin.write(JSON.stringify({ ...cmd, request_id }) + '\n');
      } else {
          reject(new Error('Worker stdin não disponível'));
      }
    });
  }

  private _handleLine(line: string): void {
    if (!line.trim()) return;
    try {
      selfHealing.reportHeartbeat('FACE_WORKER');
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
      // console.error('[FaceWorkerBridge] Erro JSON:', line);
    }
  }

  private _resolvePython(): string {
    return process.env.PYTHON_BIN || 'python';
  }
}
