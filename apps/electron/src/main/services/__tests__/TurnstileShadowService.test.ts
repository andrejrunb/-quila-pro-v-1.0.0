/**
 * Testes Unitários — TurnstileShadowService (Piloto 2 / Acesso Físico em Modo Sombra)
 */

import { TurnstileShadowService } from '../TurnstileShadowService';
import { db } from '../../../database/Database';

describe('TurnstileShadowService — Operação em Modo Sombra & Governança LGPD Art. 14', () => {
  let service: TurnstileShadowService;

  beforeAll(async () => {
    await db.initialize();
  });

  beforeEach(() => {
    service = TurnstileShadowService.getInstance();
    service.setRipdSignatureStatus(false);
    service.setOperatingMode('SHADOW_MODE');
  });

  test('1. Deve inicializar estritamente em SHADOW_MODE (Zero-Bypass)', () => {
    const status = service.getGatekeeperStatus();
    expect(status.operatingMode).toBe('SHADOW_MODE');
    expect(status.pilotPhase).toBe('PHASE_2_SHADOW_GATE');
    expect(status.isRipdSigned).toBe(false);
    expect(service.getOperatingMode()).toBe('SHADOW_MODE');
  });

  test('2. Avaliação de Acesso em Modo Sombra NUNCA deve energizar o relé físico', async () => {
    const payload = {
      deviceId: 'catraca_portaria_01',
      studentId: 'stu_ana_01',
      studentName: 'Ana Clara Silveira',
      photoScore: 0.96,
      lightingQualityScore: 0.91,
      detectionLatencyMs: 38,
      hasConsent: true
    };

    const result = await service.evaluateAccess(payload);
    expect(result.decision).toBe('ALLOW_SHADOW');
    expect(result.operatingMode).toBe('SHADOW_MODE');
    expect(result.relayFired).toBe(false); // REGRA DE OURO DO PILOTO 2
    expect(result.telemetry.studentName).toBe('Ana Clara Silveira');

    // Verificar histórico de telemetria
    const history = service.getTelemetryHistory(5);
    expect(history.length).toBeGreaterThan(0);
    expect(history[0].studentId).toBe('stu_ana_01');
  });

  test('3. Deve negar acesso biométrico e orientar para portaria manual se faltar consentimento (LGPD Art. 14)', async () => {
    const payload = {
      deviceId: 'catraca_portaria_01',
      studentId: 'stu_sem_consent',
      studentName: 'Lucas Ferreira',
      hasConsent: false
    };

    const result = await service.evaluateAccess(payload);
    expect(result.decision).toBe('DENY_NO_CONSENT');
    expect(result.relayFired).toBe(false);
    expect(result.message).toContain('Consentimento dos responsáveis não registrado');
  });

  test('4. Deve bloquear transição para MODO ATIVO se o RIPD não estiver assinado', () => {
    service.setRipdSignatureStatus(false);
    const transition = service.setOperatingMode('ACTIVE_MODE');
    expect(transition.success).toBe(false);
    expect(transition.reason).toContain('BLOQUEIO_DE_CONFORMIDADE');
    expect(service.getOperatingMode()).toBe('SHADOW_MODE');
  });

  test('5. Deve permitir MODO ATIVO somente após assinatura formal do RIPD', () => {
    service.setRipdSignatureStatus(true);
    const transition = service.setOperatingMode('ACTIVE_MODE');
    expect(transition.success).toBe(true);
    expect(service.getOperatingMode()).toBe('ACTIVE_MODE');
    expect(service.getGatekeeperStatus().pilotPhase).toBe('PHASE_3_ACTIVE_PASSAGE');
  });

  test('6. Deve registrar liberação manual assistida (Contingência de Portaria Anti-Constrangimento)', async () => {
    const initialStatus = service.getGatekeeperStatus();
    const bypass = await service.triggerOperatorManualPassage(
      'porteiro_joao',
      'Gabriel Mendes (Esqueceu crachá)',
      'Identificação visual assistida pelo porteiro'
    );

    expect(bypass.success).toBe(true);
    expect(bypass.message).toContain('Liberação manual de contingência registrada');
    expect(service.getGatekeeperStatus().manualBypassesCount).toBe(initialStatus.manualBypassesCount + 1);
  });

  test('7. Deve executar autoteste de bancada com 4/4 verificações FSM aprovadas', async () => {
    const bench = await service.runBenchTest('catraca_portaria_01');
    expect(bench.passed).toBe(true);
    expect(bench.totalTests).toBe(4);
    expect(bench.successfulTests).toBe(4);
    expect(bench.durationMs).toBeGreaterThan(0);
  });
});
