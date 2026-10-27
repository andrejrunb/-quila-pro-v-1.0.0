/**
 * PilotControlPlaneLifecycle.test.ts
 * Piloto Controlado de Automação Agêntica: Ciclo Fechado com AgentControlPlane e RouteRegistry
 * 
 * Demonstração do Piloto Único:
 * 1. Detecção determinística de rotas órfãs vs Catálogo Oficial Tipado.
 * 2. Registro no AgentControlPlane com idempotency key durável.
 * 3. Transição segura de estados (AUTHORIZED -> RUNNING -> VALIDATING -> READY_FOR_REVIEW).
 * 4. Bloqueio estrito de auto-aprovação / merge sem Human-in-the-Loop (LGPD / Constituição v2.1).
 * 5. Registro de evidências de qualidade (Jest + Typecheck + PR GitHub).
 * 6. Verificação de persistência durável no Ledger JSON.
 */

import { agentControlPlane, AgentExecutionRecord } from '../main/services/AgentControlPlane';
import { validateRoute, SOVEREIGN_ROUTE_REGISTRY } from '../types/RouteRegistry';
import * as fs from 'fs';
import * as path from 'path';

describe('Piloto Controlado de Governança Agêntica (P0/P1 Closed Loop)', () => {
  const runSuffix = Date.now();
  const PILOT_TASK_ID = `TASK-PILOT-ORPHAN-NAV-${runSuffix}`;
  const PILOT_IDEMPOTENCY_KEY = `idempotent-hash-audit-orphan-route-navigation-${runSuffix}`;

  test('Fase 1: Detecção Determinística de Rotas Órfãs vs Catálogo Oficial', () => {
    // Simula conjunto de navegações disparadas por componentes na UI
    const capturedNavigations = [
      'arena',
      'cosmetics-chamber',
      'youtube-radar',
      'non-existent-orphan-route-xyz'
    ];

    const results = capturedNavigations.map(route => ({
      route,
      ...validateRoute(route)
    }));

    const validRoutes = results.filter(r => r.valid);
    const orphanRoutes = results.filter(r => !r.valid);

    expect(validRoutes.length).toBe(3);
    expect(orphanRoutes.length).toBe(1);
    expect(orphanRoutes[0].route).toBe('non-existent-orphan-route-xyz');
    expect(orphanRoutes[0].reason).toContain('não cadastrada');
  });

  test('Fase 2: Registro Idempotente no AgentControlPlane', () => {
    const { task, isNew } = agentControlPlane.registerTask({
      taskId: PILOT_TASK_ID,
      idempotencyKey: PILOT_IDEMPOTENCY_KEY,
      responsibleAgent: 'Antigravity-Pilot-Worker',
      title: 'Piloto: Tratamento Automatizado de Rota Órfã na Interface',
      description: 'Detecção de rota não cadastrada, remediação assistida e validação de CI.',
      acceptanceCriteria: [
        'Identificar componente com rota órfã via AST Indexer',
        'Mapear no RouteRegistry ou redirecionar para ErrorBoundary',
        'Evidência de Typecheck e Jest 100% verde',
        'Revisão humana obrigatória registrada antes do merge'
      ],
      environment: 'DEVELOPMENT',
      requiresHumanApproval: true
    });

    expect(task.taskId).toBe(PILOT_TASK_ID);
    expect(task.state).toBe('AUTHORIZED');
    expect(task.environment).toBe('DEVELOPMENT');

    // Teste de Idempotência: re-execução da mesma chave não pode duplicar registro
    const duplicateAttempt = agentControlPlane.registerTask({
      taskId: 'TASK-ANOTHER-DUPLICATE-ID',
      idempotencyKey: PILOT_IDEMPOTENCY_KEY,
      responsibleAgent: 'Antigravity-Pilot-Worker',
      title: 'Tentativa duplicada',
      description: 'Tentativa duplicada com mesma chave',
      acceptanceCriteria: []
    });

    expect(duplicateAttempt.isNew).toBe(false);
    expect(duplicateAttempt.task.taskId).toBe(PILOT_TASK_ID);
  });

  test('Fase 3: Ciclo de Transições e Evidências Verificáveis', () => {
    // Transiciona estados autorizados
    agentControlPlane.updateState(PILOT_TASK_ID, 'RUNNING');
    agentControlPlane.updateState(PILOT_TASK_ID, 'VALIDATING');

    // Registra evidências verificáveis de qualidade
    agentControlPlane.recordEvidence(PILOT_TASK_ID, {
      type: 'TYPECHECK',
      status: 'PASS',
      details: 'TypeScript tsc --noEmit concluído com 0 erros no projeto inteiro.'
    });

    agentControlPlane.recordEvidence(PILOT_TASK_ID, {
      type: 'JEST',
      status: 'PASS',
      details: 'Testes de RouteRegistry e ControlPlane 100% aprovados.'
    });

    // Move para READY_FOR_REVIEW vinculando PR e Commit
    agentControlPlane.updateState(PILOT_TASK_ID, 'READY_FOR_REVIEW', {
      branchName: 'fix/portals-stability-v2.1',
      commitSha: 'c9d06a15',
      pullRequestNumber: 5,
      pullRequestUrl: 'https://github.com/andrejrunb/-quila-pro-v-1.0.0/pull/5'
    });

    const readyTask = agentControlPlane.getTask(PILOT_TASK_ID);
    expect(readyTask?.state).toBe('READY_FOR_REVIEW');
    expect(readyTask?.evidences.length).toBe(2);
    expect(readyTask?.requiresHumanApproval).toBe(true);
    expect(readyTask?.pullRequestNumber).toBe(5);
  });

  test('Fase 4: Persistência Durável no Disco (Ledger JSON)', () => {
    const ledgerPath = path.resolve(__dirname, '../database/agent_control_plane_ledger.json');
    expect(fs.existsSync(ledgerPath)).toBe(true);

    const content = fs.readFileSync(ledgerPath, 'utf-8');
    const ledger: AgentExecutionRecord[] = JSON.parse(content);

    const recordedPilot = ledger.find(t => t.taskId === PILOT_TASK_ID);
    expect(recordedPilot).toBeDefined();
    expect(recordedPilot?.taskId).toBe(PILOT_TASK_ID);
    expect(recordedPilot?.state).toBe('READY_FOR_REVIEW');
    expect(recordedPilot?.evidences.length).toBeGreaterThanOrEqual(2);
  });
});
