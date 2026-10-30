import { hardwareAccelerationService } from '../HardwareAccelerationService';

describe('HardwareAccelerationService — Orquestração de Clusters de GPU & Dev Swarm', () => {
  test('1. Deve instanciar o serviço com sucesso como Singleton', () => {
    expect(hardwareAccelerationService).toBeDefined();
    expect(typeof hardwareAccelerationService.getTelemetry).toBe('function');
  });

  test('2. Deve obter telemetria consolidada de hardware (NVIDIA NIM, Colab, Edge)', async () => {
    const telemetry = await hardwareAccelerationService.getTelemetry();
    expect(telemetry).toHaveProperty('timestamp');
    expect(telemetry).toHaveProperty('nvidiaCloud');
    expect(telemetry).toHaveProperty('colabGpu');
    expect(telemetry).toHaveProperty('localEdge');

    expect(telemetry.nvidiaCloud).toHaveProperty('status');
    expect(telemetry.nvidiaCloud).toHaveProperty('availableModelsCount');
    expect(telemetry.localEdge).toHaveProperty('device');
    expect(telemetry.localEdge.directMlSupported).toBe(true);
  });

  test('3. Deve atualizar e validar URL do túnel Colab', async () => {
    const res = await hardwareAccelerationService.setColabUrl('https://test-colab.trycloudflare.com');
    expect(res).toHaveProperty('success');
    expect(res).toHaveProperty('message');
  });
});
