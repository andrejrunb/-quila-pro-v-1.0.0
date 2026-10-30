import { TurnstileAccessContract, PassageCommandRequest } from '../TurnstileAccessContract';

describe('TurnstileAccessContract (Deterministic FSM & Sensor Feedback)', () => {
  let contract: TurnstileAccessContract;

  beforeEach(() => {
    contract = new TurnstileAccessContract();
    contract.setDeviceState('catraca_01', 'IDLE_LOCKED');
  });

  test('Full Happy Path: REQUESTED -> ACK -> RELAY_ENERGIZED -> IN_PROGRESS -> COMPLETED -> IDLE', () => {
    const states: string[] = [];
    contract.on('state:changed', (e) => {
      states.push(e.currentState);
    });

    const req: PassageCommandRequest = {
      transactionId: 'TX-1001',
      deviceId: 'catraca_01',
      direction: 'ENTRANCE',
      authorizedEntityId: 'student_99',
      authMethod: 'MANUAL_BADGE',
      requestedAt: Date.now(),
    };

    // 1. Solicitado
    const res = contract.requestPassage(req);
    expect(res.accepted).toBe(true);
    expect(contract.getDeviceState('catraca_01')).toBe('COMMAND_REQUESTED');

    // 2. Hardware ACK
    contract.onHardwareAck('catraca_01', req.transactionId);
    expect(contract.getDeviceState('catraca_01')).toBe('COMMAND_ACKNOWLEDGED');

    // 3. Relé acionado
    contract.onRelayEnergized('catraca_01', req.transactionId, 5000);
    expect(contract.getDeviceState('catraca_01')).toBe('RELAY_ENERGIZED');

    // 4. Giro iniciado
    contract.onArmRotationStarted('catraca_01');
    expect(contract.getDeviceState('catraca_01')).toBe('PASSAGE_IN_PROGRESS');

    // 5. Giro completado
    contract.onPassageCompleted('catraca_01', req.transactionId);
    expect(contract.getDeviceState('catraca_01')).toBe('IDLE_LOCKED');

    expect(states).toContain('COMMAND_REQUESTED');
    expect(states).toContain('COMMAND_ACKNOWLEDGED');
    expect(states).toContain('RELAY_ENERGIZED');
    expect(states).toContain('PASSAGE_IN_PROGRESS');
    expect(states).toContain('PASSAGE_COMPLETED');
    expect(states).toContain('IDLE_LOCKED');
  });

  test('Anti-Duplication: Duplicate transactionId must be strictly rejected', () => {
    const req: PassageCommandRequest = {
      transactionId: 'TX-DUP-01',
      deviceId: 'catraca_01',
      direction: 'ENTRANCE',
      authorizedEntityId: 'student_99',
      authMethod: 'MANUAL_BADGE',
      requestedAt: Date.now(),
    };

    const first = contract.requestPassage(req);
    expect(first.accepted).toBe(true);

    // Segundo envio com o mesmo transactionId
    const second = contract.requestPassage(req);
    expect(second.accepted).toBe(false);
    expect(second.reason).toBe('DUPLICATE_COMMAND_REJECTED');
  });

  test('Forced Entry Alarm: Arm rotation without prior command authorization triggers alarm', () => {
    expect(contract.getDeviceState('catraca_01')).toBe('IDLE_LOCKED');

    // Alguém força ou pula a catraca enquanto ela está travada
    contract.onArmRotationStarted('catraca_01');
    expect(contract.getDeviceState('catraca_01')).toBe('ALARM_FORCED_ENTRY');
  });

  test('Timeout without passage: If relay energizes but no rotation occurs, rearm to IDLE_LOCKED', (done) => {
    const req: PassageCommandRequest = {
      transactionId: 'TX-TIMEOUT-01',
      deviceId: 'catraca_01',
      direction: 'ENTRANCE',
      authorizedEntityId: 'student_42',
      authMethod: 'OPERATOR_OVERRIDE',
      requestedAt: Date.now(),
    };

    contract.requestPassage(req);
    contract.onHardwareAck('catraca_01', req.transactionId);

    // Relé acionado com timeout curto de 50ms para teste
    contract.onRelayEnergized('catraca_01', req.transactionId, 50);

    setTimeout(() => {
      expect(contract.getDeviceState('catraca_01')).toBe('IDLE_LOCKED');
      done();
    }, 100);
  });
});
