import { ColabTunnelWatchdog, colabTunnelWatchdog } from '../ColabTunnelWatchdog';
import { colabGpuBridge } from '../ColabGpuBridge';
import { db, Database } from '../../../database/Database';

describe('ColabTunnelWatchdog Unit Tests (Passo 101 & 120)', () => {
  let watchdog: ColabTunnelWatchdog;

  beforeAll(async () => {
    await db.initialize();
  });

  beforeEach(() => {
    watchdog = ColabTunnelWatchdog.getInstance();
    watchdog.stop();
    jest.clearAllMocks();
  });

  afterAll(() => {
    if (watchdog) {
      watchdog.destroy();
    }
  });

  test('Deve ser um Singleton retornando a mesma instância', () => {
    const a = ColabTunnelWatchdog.getInstance();
    const b = ColabTunnelWatchdog.getInstance();
    expect(a).toBe(b);
    expect(a).toBe(colabTunnelWatchdog);
  });

  test('Deve iniciar e parar o watchdog corretamente', () => {
    watchdog.start();
    expect((watchdog as any).checkInterval).not.toBeNull();

    watchdog.stop();
    expect((watchdog as any).checkInterval).toBeNull();
  });

  test('Deve enfileirar tarefas offline com status pending no banco', async () => {
    (colabGpuBridge as any).isOnline = false;
    const dbInstance = Database.getInstance();
    const runSpy = jest.spyOn(dbInstance, 'run').mockResolvedValue({ changes: 1, lastID: 1 });
    const getSpy = jest.spyOn(dbInstance, 'get').mockResolvedValue({
      id: 'ctask_mock',
      taskType: 'benchmark',
      status: 'pending'
    });

    const taskId = await watchdog.enqueueTask('benchmark', { matrixSize: 4096 });
    expect(taskId).toBeDefined();
    expect(taskId).toMatch(/^ctask_/);
    expect(runSpy).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO colab_task_queue'),
      expect.arrayContaining(['benchmark'])
    );

    const taskRow = await db.get(`SELECT * FROM colab_task_queue WHERE id = ?`, [taskId]);
    expect(taskRow).toBeDefined();
    expect(taskRow.taskType).toBe('benchmark');
    expect(taskRow.status).toBe('pending');
  });

  test('Deve retornar métricas consolidadas com pendingTasksCount', async () => {
    const dbInstance = Database.getInstance();
    jest.spyOn(dbInstance, 'get').mockResolvedValue({ count: 2 });
    const metrics = await watchdog.getMetrics();
    expect(metrics).toBeDefined();
    expect(typeof metrics.isHealthy).toBe('boolean');
    expect(metrics.pendingTasksCount).toBe(2);
  });

  test('Deve reagir à degradação do túnel quando a bridge emitir offline', (done) => {
    watchdog.once('tunnel:degraded', (data) => {
      expect(data.failures).toBeGreaterThan(0);
      done();
    });

    colabGpuBridge.emit('offline', new Error('Tunnel connection reset'));
  });

  test('Deve reagir à restauração do túnel quando a bridge emitir online', (done) => {
    watchdog.once('tunnel:restored', (data) => {
      expect(data.timestamp).toBeDefined();
      done();
    });

    colabGpuBridge.emit('online', {
      status: 'HEALTHY',
      gpu: { allocated_gb: 1.2, total_gb: 15.0, utilization_pct: 10 },
      uptime_s: 3600,
      stats: { requests: 5, faces_processed: 2, frames_analyzed: 10, errors: 0 },
      capabilities: { face_recognition: true, object_detection: true, onnx_gpu: true }
    });
  });

  test('Deve limpar timers e listeners no destroy()', () => {
    watchdog.start();
    watchdog.destroy();
    expect((watchdog as any).checkInterval).toBeNull();
    expect(watchdog.listenerCount('tunnel:restored')).toBe(0);
    expect(watchdog.listenerCount('tunnel:degraded')).toBe(0);
  });
});
