import { SovereignConsciousnessService } from '../SovereignConsciousnessService';
import { resourceMonitor } from '../ResourceMonitorService';
import { cortexEvolutionService } from '../CortexEvolutionService';
import Database from '../../../database/Database';

describe('SovereignConsciousnessService - Level 10 Homeostasis', () => {
  let consciousness: SovereignConsciousnessService;
  const db = Database.getInstance();

  beforeAll(async () => {
    // Inicializa o banco para evitar SQLITE_MISUSE
    await db.initialize();
    consciousness = SovereignConsciousnessService.getInstance(db);
    consciousness.startHomeostasisLoop(5000); // Loop rápido para teste
  });

  afterAll(async () => {
    consciousness.stopHomeostasisLoop();
    await db.close();
  });

  it('deve reagir a eventos de throttle ativando a preservação de hardware', async () => {
    const learnSpy = jest.spyOn(cortexEvolutionService, 'learnInsight');
    
    // Mock do status para simular throttling ativo
    const statusSpy = jest.spyOn(resourceMonitor, 'getStatus').mockReturnValue({
      isThrottled: true,
      cpuLoad: 90,
      memoryUsage: 0.8,
      heapUsedMB: 300,
      heapTotalMB: 1024,
      memoryDeltaMBs: 0,
      predictivePanic: false,
      timeToOOM: Infinity,
      limits: { cpu: 85, mem: 0.9, heap: 1024 }
    });

    // Simular evento de throttle por superaquecimento
    resourceMonitor.emit('throttle', {
      active: true,
      reason: 'NPU OVERHEAT',
      npu: { temperature: 88, isThrottling: true }
    });

    // Aguardar processamento assíncrono
    await new Promise(resolve => setTimeout(resolve, 500));

    expect(learnSpy).toHaveBeenCalledWith(expect.objectContaining({
      category: 'HARDWARE_PRESERVATION'
    }));

    const heartbeat = await consciousness.getEcosystemHeartbeat();
    expect(heartbeat.isThrottled).toBe(true);
    
    statusSpy.mockRestore();
  });

  it('deve normalizar as operações após o evento de resume', async () => {
    const statusSpy = jest.spyOn(resourceMonitor, 'getStatus').mockReturnValue({
      isThrottled: false,
      cpuLoad: 20,
      memoryUsage: 0.5,
      heapUsedMB: 200,
      heapTotalMB: 1024,
      memoryDeltaMBs: 0,
      predictivePanic: false,
      timeToOOM: Infinity,
      limits: { cpu: 85, mem: 0.9, heap: 1024 }
    });

    resourceMonitor.emit('resume');

    // Aguardar
    await new Promise(resolve => setTimeout(resolve, 200));

    const heartbeat = await consciousness.getEcosystemHeartbeat();
    expect(heartbeat.isThrottled).toBe(false);
    
    statusSpy.mockRestore();
  });

  it('deve persistir o pulso de consciência no Grafo Soberano', async () => {
    // Forçar execução da soberania
    // @ts-ignore - acessando método privado para teste
    await consciousness.enforceSovereignty();

    const { sovereignGraphService } = await import('../SovereignGraphService');
    const graph = sovereignGraphService.getGraphSnapshot();
    
    // Na v1.5 do SKG, graph.nodes é um array com {key, attributes}
    const consciousnessNode = graph.nodes.find((n: any) => n.key === 'SYSTEM_CONSCIOUSNESS');
    expect(consciousnessNode).toBeDefined();
    expect(consciousnessNode.attributes.label).toBe('Consciousness Heartbeat');
  });

  it('deve decair a frustração do estudante temporalmente e aplicar auto-recuperação', async () => {
    const studentId = 'STU-DECAY-TEST';
    
    // Mock do banco de dados (db.all, db.run e db.get)
    let currentScore = 3;
    let currentLevel = 1;

    const allSpy = jest.spyOn(db, 'all').mockImplementation(async (sql: string, params?: any[]) => {
      if (sql.includes('students') && sql.includes('frustrationScore > 0')) {
        return [{ id: studentId, name: 'Pedro Decay', frustrationScore: currentScore, observationLevel: currentLevel }];
      }
      return [];
    });

    const runSpy = jest.spyOn(db, 'run').mockImplementation(async (sql: string, params?: any[]) => {
      if (sql.includes('students SET frustrationScore = ? WHERE id = ?')) {
        currentScore = params?.[0];
      } else if (sql.includes('students SET observationLevel = 0 WHERE id = ?')) {
        currentLevel = 0;
      }
      return { changes: 1, lastID: 1 };
    });

    const getSpy = jest.spyOn(db, 'get').mockImplementation(async (sql: string, params?: any[]) => {
      if (sql.includes('students') && params?.[0] === studentId) {
        return { id: studentId, frustrationScore: currentScore, observationLevel: currentLevel };
      }
      return undefined;
    });

    // 1. Executar o decaimento de frustração uma vez (3 -> 2)
    await consciousness.decayStudentFrustration();

    expect(currentScore).toBe(2);
    expect(currentLevel).toBe(1); // Ainda deve estar em observação

    // 2. Executar o decaimento de frustração mais uma vez (2 -> 1)
    await consciousness.decayStudentFrustration();

    expect(currentScore).toBe(1);
    expect(currentLevel).toBe(0); // Auto-recuperação deve reverter observationLevel para 0

    // Restaurar spies
    allSpy.mockRestore();
    runSpy.mockRestore();
    getSpy.mockRestore();
  });
});


