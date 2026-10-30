import {
  SovereignResilienceService,
  sovereignResilienceService,
  SensorReadings,
} from '../SovereignResilienceService';
import { logger } from '../../logger';

describe('SovereignResilienceService — Edge Resilience & Thermal Governor', () => {
  beforeEach(() => {
    // Silencia saídas de console/logger
    jest.spyOn(logger, 'info').mockImplementation(() => {});
    jest.spyOn(logger, 'warn').mockImplementation(() => {});
    jest.spyOn(logger, 'error').mockImplementation(() => {});

    // Reseta estado interno do singleton para baseline
    sovereignResilienceService.setSimulationMode(true);
    sovereignResilienceService.stopWatchdog();
    (sovereignResilienceService as any).currentFramerate = 30;
    (sovereignResilienceService as any).isThrottled = false;
    (sovereignResilienceService as any).lastTelemetry = null;
    (sovereignResilienceService as any).telemetryHistory = [];
    (sovereignResilienceService as any).anomalyCount = 0;
  });

  afterAll(() => {
    sovereignResilienceService.stopWatchdog();
  });

  test('Deve iniciar no estado padrão de 30 FPS e sem throttling', () => {
    expect(sovereignResilienceService.getCurrentFramerate()).toBe(30);
    expect(sovereignResilienceService.isThermalThrottling()).toBe(false);
  });

  test('Deve ler sensores simulados e produzir telemetria normal abaixo de 75ºC', async () => {
    sovereignResilienceService.setSimulatedTemperatures(48.5, 52.0, 46.0);
    const telemetry = await sovereignResilienceService.evaluateThermalState();

    expect(telemetry.maxTemp).toBe(52.0);
    expect(telemetry.isThrottled).toBe(false);
    expect(telemetry.framerate).toBe(30);
    expect(telemetry.anomalyDetected).toBe(false);
  });

  test('Auto-Throttling: Deve reduzir framerate de 30 para 10 FPS quando a temperatura ultrapassar 75ºC', async () => {
    const framerateListener = jest.fn();
    sovereignResilienceService.on('framerate-changed', framerateListener);

    // Simula sobreaquecimento a 76.5ºC na NPU
    sovereignResilienceService.setSimulatedTemperatures(68.0, 72.0, 76.5);
    const telemetry = await sovereignResilienceService.evaluateThermalState();

    expect(telemetry.maxTemp).toBe(76.5);
    expect(telemetry.isThrottled).toBe(true);
    expect(telemetry.framerate).toBe(10);
    expect(sovereignResilienceService.getCurrentFramerate()).toBe(10);
    expect(sovereignResilienceService.isThermalThrottling()).toBe(true);

    expect(framerateListener).toHaveBeenCalledWith(
      expect.objectContaining({
        previousFps: 30,
        currentFps: 10,
        isThrottled: true,
        maxTemp: 76.5,
      })
    );

    sovereignResilienceService.off('framerate-changed', framerateListener);
  });

  test('Histerese de Refrigeração: Deve manter 10 FPS na faixa intermediária e retornar a 30 FPS ao atingir <= 65ºC', async () => {
    // 1. Aquece acima de 75ºC
    sovereignResilienceService.setSimulatedTemperatures(70.0, 76.0, 72.0);
    await sovereignResilienceService.evaluateThermalState();
    expect(sovereignResilienceService.getCurrentFramerate()).toBe(10);

    // 2. Resfria parcialmente para 68ºC (zona de histerese: não deve voltar a 30 FPS ainda)
    sovereignResilienceService.setSimulatedTemperatures(65.0, 68.0, 64.0);
    const intermediateTelemetry = await sovereignResilienceService.evaluateThermalState();
    expect(intermediateTelemetry.maxTemp).toBe(68.0);
    expect(intermediateTelemetry.framerate).toBe(10);
    expect(sovereignResilienceService.getCurrentFramerate()).toBe(10);
    expect(sovereignResilienceService.isThermalThrottling()).toBe(true);

    // 3. Resfria totalmente para 64ºC (<= 65ºC) -> Retorno a 30 FPS
    const recoveryListener = jest.fn();
    sovereignResilienceService.on('framerate-changed', recoveryListener);

    sovereignResilienceService.setSimulatedTemperatures(60.0, 64.0, 58.0);
    const cooledTelemetry = await sovereignResilienceService.evaluateThermalState();

    expect(cooledTelemetry.maxTemp).toBe(64.0);
    expect(cooledTelemetry.framerate).toBe(30);
    expect(sovereignResilienceService.getCurrentFramerate()).toBe(30);
    expect(sovereignResilienceService.isThermalThrottling()).toBe(false);

    expect(recoveryListener).toHaveBeenCalledWith(
      expect.objectContaining({
        previousFps: 10,
        currentFps: 30,
        isThrottled: false,
        maxTemp: 64.0,
      })
    );

    sovereignResilienceService.off('framerate-changed', recoveryListener);
  });

  test('Detecção de Anomalias: Deve detectar spike térmico abrupto (> 15ºC)', async () => {
    // 1. Estado estável a 45ºC
    sovereignResilienceService.setSimulatedTemperatures(45.0, 45.0, 45.0);
    await sovereignResilienceService.evaluateThermalState();

    // 2. Salto para 65ºC (delta de 20ºC)
    sovereignResilienceService.setSimulatedTemperatures(65.0, 62.0, 60.0);
    const telemetry = await sovereignResilienceService.evaluateThermalState();

    expect(telemetry.anomalyDetected).toBe(true);
    expect(telemetry.anomalyReason).toContain('THERMAL_SPIKE');
  });

  test('Detecção de Anomalias: Deve detectar leitura corrompida/irracional', async () => {
    const invalidReadings: SensorReadings = {
      cpuTemp: -10,
      gpuTemp: 50,
      npuTemp: 45,
      source: 'sensors',
      timestamp: new Date().toISOString(),
    };

    const telemetry = await sovereignResilienceService.evaluateThermalState(invalidReadings);
    expect(telemetry.anomalyDetected).toBe(true);
    expect(telemetry.anomalyReason).toContain('SENSOR_CORRUPTION');
  });

  test('Deve gravar telemetria estruturada e recuperar estatísticas com getResilienceStats()', async () => {
    sovereignResilienceService.setSimulatedTemperatures(50.0, 52.0, 48.0);
    await sovereignResilienceService.evaluateThermalState();

    const stats = await sovereignResilienceService.getResilienceStats();
    expect(stats.kernelIntegrity).toBe('100%');
    expect(stats.thermalGovernor).toBeDefined();
    expect(stats.thermalGovernor.currentFramerate).toBe(30);
    expect(stats.thermalGovernor.isThrottled).toBe(false);
    expect(stats.thermalGovernor.latestMaxTemp).toBe(52.0);
    expect(stats.thermalGovernor.status).toBe('OPTIMAL');
  });

  test('Compatibilidade: toggleAirGapMode e integridade quântica permanecem operacionais', async () => {
    await sovereignResilienceService.toggleAirGapMode(true);
    expect(process.env.AQUILA_AIRGAP_ACTIVE).toBe('true');

    await sovereignResilienceService.toggleAirGapMode(false);
    expect(process.env.AQUILA_AIRGAP_ACTIVE).toBe('false');
  });
});
