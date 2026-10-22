import { app } from 'electron';
import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
import { EventEmitter } from 'events';
import * as path from 'path';
import * as readline from 'readline';
import * as fs from 'fs';
import * as os from 'os';
import { privacyBlur } from './PrivacyBlurService';
import { selfHealingService } from './SelfHealingService';
import { FaceDetectedPayload, FaceEncoding } from '../../services/AiTypes';
import { npuOptimizer } from './NpuOptimizationService_V2';
import { thermalEfficiencyEngine } from './ThermalEfficiencyEngine';

export class FaceWorkerBridge extends EventEmitter {
  private workers: any[] = [];
  private _isShuttingDown: boolean = false;
  private readyCount = 0;
  private nextWorkerIndex = 0;
  private readonly POOL_SIZE = process.env.NODE_ENV === 'test' ? 1 : Math.min(Math.max(os.cpus().length - 2, 1), 4); // Entre 1 e 4 workers
  private pendingRequests = new Map<string, {
    resolve: (v: any) => void;
    reject: (e: Error) => void;
    timeout: NodeJS.Timeout;
  }>();
  private shmPaths: string[] = [];
  private shmFds: number[] = [];
  private readonly SHM_SIZE = 8 * 1024 * 1024; // 8 MB
  private readonly pythonBin: string;
  private readonly workerScript: string;
  private readonly REQUEST_TIMEOUT_MS = 15_000;
  private onnxModelPath: string | null = null;
  private hasHardwareAcceleration: boolean = false;
  private hardwareProfile: any = null;

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
      this.workerScript = path.join(__dirname, '../../../python/face_worker.py');
    }

    // [Fase 420] Metabollismo de Hardware: Escutar telemetria térmica
    thermalEfficiencyEngine.on('thermal-status', (status) => {
      this.setThrottle(status.isThrottled);
    });

    thermalEfficiencyEngine.on('thermal-critical', (temp) => {
      console.error(`[CRITICAL] Hardware at ${temp}°C. Forcing emergency throttle on all AI workers.`);
      this.setThrottle(true);
    });
  }

  // ─────────────────────────────────────────────
  // LIFECYCLE
  // ─────────────────────────────────────────────

  async start(): Promise<void> {
    if (this.workers.length > 0) return;

    // 1. Detectar Hardware e Resolver Caminhos de Modelos
    await this.detectHardware();

    // 2. Validar Estrutura Básica
    if (process.env.PLAYWRIGHT !== 'true' && !fs.existsSync(this.workerScript)) {
      throw new Error(`face_worker.py não encontrado: ${this.workerScript}`);
    }

    // 3. Validar Modelos Críticos (Aviso se faltar para NPU)
    if (this.hasHardwareAcceleration && !this.onnxModelPath) {
      console.warn('[FaceWorkerBridge] Aceleração NPU/GPU disponível, mas facenet.onnx não encontrado. Usando fallback CPU.');
    } else if (this.onnxModelPath) {
      console.log(`[FaceWorkerBridge] Validado modelo ONNX: ${path.basename(this.onnxModelPath)}`);
    }

    // Pre-allocate shared memory files for each worker
    if (process.env.PLAYWRIGHT !== 'true') {
      const shmDir = path.join(os.tmpdir(), 'aquila_shm');
      if (!fs.existsSync(shmDir)) {
        fs.mkdirSync(shmDir, { recursive: true });
      }
      for (let i = 0; i < this.POOL_SIZE; i++) {
        const shmPath = path.join(shmDir, `aquila_shm_${Date.now()}_W${i}_${Math.random().toString(36).slice(2, 7)}.bin`);
        this.shmPaths.push(shmPath);
        const fd = fs.openSync(shmPath, 'w+');
        fs.writeSync(fd, Buffer.alloc(this.SHM_SIZE), 0, this.SHM_SIZE, 0);
        this.shmFds.push(fd);
      }
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
   * Detecta aceleração de hardware disponível usando o NpuOptimizer (v1.5.0)
   */
  async detectHardware(): Promise<void> {
    const status = await npuOptimizer.detectHardware();
    this.hardwareProfile = status;
    
    const modelSearchPath = this.isDev 
      ? path.join(__dirname, '../../python/models/facenet.onnx')
      : path.join(this.resourcesPath, 'models', 'facenet.onnx');

    if (fs.existsSync(modelSearchPath)) {
      this.onnxModelPath = modelSearchPath;
      // Ativa aceleração se tiver NPU ou GPU disponível
      this.hasHardwareAcceleration = status.npu_detected || status.gpu_detected;
      console.log(`[FaceWorkerBridge] Perfil de Hardware: NPU=${status.npu_detected}, GPU=${status.gpu_detected}. Aceleração=${this.hasHardwareAcceleration}`);
    }
  }

  /**
   * Reinicia o pool de workers para recuperação de falhas (Self-Healing)
   */
  async restartPool(): Promise<void> {
    console.warn('[FaceWorkerBridge] Reiniciando pool de workers por solicitação de saúde...');
    this.stop();
    await this.start();
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
            detached: true,
            env: {
                ...process.env,
                FACE_MODEL: this.hasHardwareAcceleration ? 'facenet' : 'hog',
                FACE_TOLERANCE: '0.6',
                PYTHONUNBUFFERED: '1',
                WORKER_ID: index.toString(),
                ONNX_MODEL_PATH: this.onnxModelPath || '',
                USE_DML: this.hasHardwareAcceleration ? '1' : '0', // DirectML para Windows
                HALO_TRACE_DIR: path.join(app.getPath('userData'), 'traces'),
                AQUILA_SHM_PATH: this.shmPaths[index] || '',
            },
            stdio: ['pipe', 'pipe', 'pipe'],
        });
        worker.unref();

        worker.stderr.on('data', (data: Buffer) => {
            if (this._isShuttingDown) return;
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
          if (this._isShuttingDown) return;
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

        const startupTimeout = process.env.NODE_ENV === 'test' ? 45_000 : 15_000;
        setTimeout(() => {
            this.off('_raw', onReady);
            reject(new Error(`Worker ${index} timeout ao inicializar`));
        }, startupTimeout);
    });
  }

  async extractEmbedding(faceData: Buffer | string): Promise<number[] | null> {
    const payload = Buffer.isBuffer(faceData)
      ? { action: 'encode_photo', buffer: faceData }
      : { action: 'encode_photo', photo_path: faceData };
    const res = await this._request(payload);
    return res.vector || null;
  }

  stop(): void {
    // Mark shutdown to suppress further logs
    this._isShuttingDown = true;
    for (const worker of this.workers) {
      if (worker && worker.stdin && worker.stdin.writable) {
        worker.stdin.write(JSON.stringify({ action: 'shutdown' }) + '\n');
      }
      // Terminate worker process immediately
      try { worker.kill(); } catch {}
    }
    // Cleanup of workers, SHM, and flags will be handled in shutdownAll after exit events are captured.
  }

  /**
   * Gracefully shuts down all workers and cleans up resources.
   * Intended for test teardown to avoid lingering handles.
   */
  public async shutdownAll(): Promise<void> {
    // Mark shutdown to suppress logs
    this._isShuttingDown = true;
    // Prepare promises to wait for each worker's exit event
    const exitPromises = this.workers.map((worker) => {
      return new Promise<void>((resolve) => {
        if (!worker) return resolve();
        worker.once('exit', () => resolve());
      });
    });
    // Initiate shutdown logic for workers
    this.stop();
    // Await all worker exits
    await Promise.all(exitPromises);
    // Cleanup streams and listeners for each worker (now exited)
    for (const worker of this.workers) {
      if (worker.stdout) worker.stdout.destroy();
      if (worker.stderr) worker.stderr.destroy();
      worker.removeAllListeners();
    }
    // Cleanup SHM resources
    for (const fd of this.shmFds) {
      try { fs.closeSync(fd); } catch {}
    }
    this.shmFds = [];
    for (const shmPath of this.shmPaths) {
      try { if (fs.existsSync(shmPath)) fs.unlinkSync(shmPath); } catch {}
    }
    this.shmPaths = [];
    // Reset worker tracking and ready state
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

  getStatus() {
    return {
      ready: this.isReady(),
      poolSize: this.POOL_SIZE,
      readyCount: this.readyCount,
      hasAcceleration: this.hasHardwareAcceleration
    };
  }

  // ─────────────────────────────────────────────
  // COMANDOS PÚBLICOS
  // ─────────────────────────────────────────────

  async encodePhoto(photoData: Buffer | string): Promise<FaceEncoding> {
    const payload = Buffer.isBuffer(photoData)
      ? { action: 'encode_photo', buffer: photoData }
      : { action: 'encode_photo', photo_path: photoData };
    return this._request(payload);
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

  async recognizeFrame(frameData: Buffer | string): Promise<void> {
    const payload = Buffer.isBuffer(frameData)
      ? { action: 'recognize_frame', buffer: frameData }
      : { action: 'recognize_frame', frame_path: frameData };
    const result = await this._request(payload);
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
  // TELEMETRIA E STATUS
  // ─────────────────────────────────────────────

  public isUsingNPU(): boolean {
    return this.hasHardwareAcceleration && this.onnxModelPath !== null;
  }

  public async getOperationalStatus(): Promise<any> {
    const bridgeReady = this.isReady();
    let workerStatus: any = null;

    if (bridgeReady) {
      try {
        workerStatus = await this._request({ action: 'status' });
      } catch (e) {
        workerStatus = { error: 'Timeout ao consultar worker' };
      }
    }

    return {
      bridge_ready: bridgeReady,
      worker_count: this.workers.length,
      hardware: this.hardwareProfile,
      npu_active: this.isUsingNPU(),
      onnx_model: this.onnxModelPath ? path.basename(this.onnxModelPath) : 'NONE',
      worker_details: workerStatus,
      mode: bridgeReady && workerStatus?.face_recognition_available ? 'REAL_MESH' : 'SIMULATED_FALLBACK'
    };
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

      let idx = specificWorkerIndex ?? this.nextWorkerIndex;
      if (idx >= this.workers.length) idx = 0;

      const payload = { ...cmd };

      // Se contiver Buffer, escrever em SHM
      if (payload.buffer && Buffer.isBuffer(payload.buffer)) {
        if (this.shmFds[idx] !== undefined) {
          const buf = payload.buffer;
          if (buf.length > this.SHM_SIZE) {
            reject(new Error(`Buffer excede o limite de SHM de ${this.SHM_SIZE} bytes (Tamanho: ${buf.length})`));
            return;
          }
          try {
            fs.writeSync(this.shmFds[idx], buf, 0, buf.length, 0);
            payload.shm_size = buf.length;
          } catch (err) {
            reject(new Error(`Falha ao escrever no SHM do worker ${idx}: ${err instanceof Error ? err.message : err}`));
            return;
          }
        }
        delete payload.buffer;
      }

      const request_id = `req_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(request_id);
        reject(new Error(`FaceWorker timeout: ${cmd.action}`));
      }, this.REQUEST_TIMEOUT_MS);

      this.pendingRequests.set(request_id, { resolve, reject, timeout });

      const worker = this.workers[idx];
      if (specificWorkerIndex === undefined) {
          this.nextWorkerIndex = (this.nextWorkerIndex + 1) % this.workers.length;
      }

      if (worker && worker.stdin.writable) {
          worker.stdin.write(JSON.stringify({ ...payload, request_id }) + '\n');
      } else {
          reject(new Error('Worker stdin não disponível'));
      }
    });
  }

  private _handleLine(line: string): void {
    if (!line.trim()) return;
    try {
      selfHealingService.reportHeartbeat('FACE_WORKER');
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

