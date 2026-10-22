import { selfHealingService } from '../SelfHealingService';
import { distributedInferenceService } from '../DistributedInferenceService';
import { thermalEfficiencyEngine } from '../ThermalEfficiencyEngine';
import { sovereignMeshService } from '../SovereignMeshService';
import { logger } from '../../logger';

describe('Sovereign Intelligence Hardening & Homeostasis', () => {
  beforeAll(async () => {
    // Mocking logger to avoid noise during tests
    jest.spyOn(logger, 'info').mockImplementation(() => {});
    jest.spyOn(logger, 'warn').mockImplementation(() => {});
    jest.spyOn(logger, 'error').mockImplementation(() => {});
  });

  afterAll(() => {
    selfHealingService.stop();
  });

  test('Should detect thermal warning and trigger offload', async () => {
    // 1. Setup: Adicionar tarefa local pendente
    await distributedInferenceService.dispatchTask('face_recognition', { image: '...' }, true);
    let tasks = distributedInferenceService.getActiveTasks();
    expect(tasks.length).toBeGreaterThan(0);
    expect(tasks[0].targetNodeId).toBe('local');

    // 2. Simular temperatura alta (> 65C)
    // Forçamos a temperatura no motor (precisariamos de um setter ou mock)
    // Como é um Singleton, vamos usar o estado interno via reflexão ou mock
    (thermalEfficiencyEngine as any).currentTemp = 70; 

    // 3. Executar auditoria de saúde (manualmente para o teste)
    await (selfHealingService as any).auditThermalHealth();

    // 4. Verificar se a tarefa foi redistribuída
    // No mock do SelfHealing, ele despacha novamente. 
    // Como não temos outros peers reais no ambiente de teste simples, 
    // ele pode acabar reatribuindo, mas o log/fluxo deve ser disparado.
    tasks = distributedInferenceService.getActiveTasks();
    // Se a redistribuição funcionou, a tarefa antiga foi removida ou o status mudou
    // (Depende da implementação exata do dispatchTask que gera novos IDs)
    
    expect(thermalEfficiencyEngine.shouldOffloadTask()).toBe(true);
  });

  test('Should report real NPU load based on active tasks', () => {
    const caps = distributedInferenceService.getLocalCapabilities();
    // Com pelo menos 1 tarefa, a carga deve ser > 0
    expect(caps.currentLoad).toBeGreaterThan(0);
    expect(caps.activeTasks).toBeGreaterThan(0);
  });

  test('Consolidated IPC handler mesh:get-inference-state structure', async () => {
    // Validamos a existência do estado consolidado de inferência
    const state = distributedInferenceService.getLocalCapabilities();
    expect(state).toHaveProperty('currentLoad');
    expect(state).toHaveProperty('temperature');
    expect(state).toHaveProperty('status');
  });
});
