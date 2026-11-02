import { ProcessWatchdogService } from '../ProcessWatchdogService';
import { logger } from '../../logger';

describe('ProcessWatchdogService — Resiliência, Backoff Exponencial e Circuit Breaker (P-05)', () => {
  let watchdog: ProcessWatchdogService;

  beforeEach(() => {
    jest.spyOn(logger, 'info').mockImplementation(() => {});
    jest.spyOn(logger, 'warn').mockImplementation(() => {});
    jest.spyOn(logger, 'error').mockImplementation(() => {});
    watchdog = ProcessWatchdogService.getInstance();
    watchdog.reset();
    watchdog.setBaseBackoffMs(500); // 500ms base para testes ágeis
    watchdog.setMaxRetries(3);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    watchdog.reset();
  });

  test('Deve aplicar backoff exponencial a cada falha registrada', () => {
    const service = 'python-worker-ocr';

    const fail1 = watchdog.recordFailure(service);
    expect(fail1.isOpen).toBe(false);
    expect(fail1.canRetry).toBe(true);
    expect(fail1.backoffMs).toBe(500); // 500 * 2^0

    const fail2 = watchdog.recordFailure(service);
    expect(fail2.isOpen).toBe(false);
    expect(fail2.canRetry).toBe(true);
    expect(fail2.backoffMs).toBe(1000); // 500 * 2^1

    const fail3 = watchdog.recordFailure(service);
    expect(fail3.isOpen).toBe(true);
    expect(fail3.canRetry).toBe(false);
    expect(fail3.backoffMs).toBe(2000); // 500 * 2^2
  });

  test('Deve disparar evento circuit-breaker:open e bloquear execuções após limite de falhas', () => {
    const service = 'swarm-evaluator';
    let openEventReceived: any = null;
    watchdog.on('circuit-breaker:open', (evt) => {
      openEventReceived = evt;
    });

    expect(watchdog.canExecute(service)).toBe(true);

    watchdog.recordFailure(service);
    watchdog.recordFailure(service);
    expect(watchdog.canExecute(service)).toBe(true);

    watchdog.recordFailure(service); // 3ª falha -> disjuntor abre
    expect(watchdog.canExecute(service)).toBe(false);
    expect(openEventReceived).toBeDefined();
    expect(openEventReceived.serviceName).toBe(service);
    expect(openEventReceived.failureCount).toBe(3);
  });

  test('Deve restaurar o disjuntor e zerar falhas após registro de sucesso', () => {
    const service = 'database-syncer';
    let closedEventReceived: any = null;
    watchdog.on('circuit-breaker:closed', (evt) => {
      closedEventReceived = evt;
    });

    watchdog.recordFailure(service);
    watchdog.recordFailure(service);
    watchdog.recordFailure(service);
    expect(watchdog.canExecute(service)).toBe(false);

    watchdog.recordSuccess(service);
    expect(watchdog.canExecute(service)).toBe(true);
    expect(closedEventReceived).toBeDefined();
    expect(closedEventReceived.serviceName).toBe(service);

    const state = watchdog.getCircuitBreakerState(service);
    expect(state.failureCount).toBe(0);
    expect(state.isOpen).toBe(false);
  });
});
