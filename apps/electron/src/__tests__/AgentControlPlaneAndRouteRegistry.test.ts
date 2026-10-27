import { SOVEREIGN_ROUTE_REGISTRY, validateRoute, getRoutesForPortal } from '../types/RouteRegistry';
import { agentControlPlane } from '../main/services/AgentControlPlane';

describe('P0 & P1 Architecture Governance — RouteRegistry & AgentControlPlane', () => {
  describe('P0: RouteRegistry (Contratos Tipados de Rotas e Permissões)', () => {
    it('deve validar rotas canônicas existentes no catálogo', () => {
      const studentPortalCheck = validateRoute('student-portal');
      expect(studentPortalCheck.valid).toBe(true);
      expect(studentPortalCheck.definition?.primaryPortal).toBe('student-portal');

      const cosmeticsCheck = validateRoute('cosmetics-chamber');
      expect(cosmeticsCheck.valid).toBe(true);

      const timetableCheck = validateRoute('timetable');
      expect(timetableCheck.valid).toBe(true);
      expect(timetableCheck.definition?.primaryPortal).toBe('coordination-portal');
    });

    it('deve rejeitar e sinalizar rotas órfãs ou inexistentes', () => {
      const invalidCheck = validateRoute('rota_fantasma_inexistente');
      expect(invalidCheck.valid).toBe(false);
      expect(invalidCheck.reason).toContain('não cadastrada no RouteRegistry oficial');
    });

    it('deve validar e restringir permissões por perfil de usuário', () => {
      // Aluno tentando acessar financeiro
      const unauthorizedCheck = validateRoute('finance', 'aluno');
      expect(unauthorizedCheck.valid).toBe(false);
      expect(unauthorizedCheck.reason).toContain('não possui permissão');

      // Diretor acessando financeiro
      const authorizedCheck = validateRoute('finance', 'director');
      expect(authorizedCheck.valid).toBe(true);
    });

    it('deve retornar todas as rotas primárias de um portal específico', () => {
      const studentRoutes = getRoutesForPortal('student-portal');
      expect(studentRoutes.length).toBeGreaterThanOrEqual(10);
      const routeIds = studentRoutes.map(r => r.id);
      expect(routeIds).toContain('mastery-chamber');
      expect(routeIds).toContain('cosmetics-chamber');
      expect(routeIds).toContain('youtube-radar');
    });

    it('deve validar integralmente as rotas de navegação ampliadas (P0 Coverage)', () => {
      const expandedRoutes = [
        'dashboard',
        'global-trends',
        'help',
        'support',
        'alerts',
        'social-nexus',
        'sovereign-nexus',
        'executive-pulse',
        'governance',
        'pricing',
        'knowledge-canvas',
        'network-traffic',
        'students',
        'mobile-parent-app',
        'activity-factory',
        'daily-report'
      ];

      for (const routeId of expandedRoutes) {
        const check = validateRoute(routeId);
        expect(check.valid).toBe(true);
        expect(check.definition).toBeDefined();
        expect(check.definition?.id).toBe(routeId);
      }

      // Verificação específica: mobile-parent-app acessível para responsavel/parent
      const parentCheck = validateRoute('mobile-parent-app', 'responsavel');
      expect(parentCheck.valid).toBe(true);

      // Verificação específica: students acessível para professor/teacher
      const teacherCheck = validateRoute('students', 'teacher');
      expect(teacherCheck.valid).toBe(true);
    });
  });

  describe('P1: AgentControlPlane (Plano de Controle Durável & Idempotência)', () => {
    const testKey = `test_idempotency_${Date.now()}`;

    it('deve registrar uma tarefa com chave de idempotência', () => {
      const { task, isNew } = agentControlPlane.registerTask({
        taskId: 'TASK-PILOT-001',
        idempotencyKey: testKey,
        responsibleAgent: 'Antigravity',
        title: 'Piloto P1: Auditoria de Rotas Órfãs e Validação Estática',
        description: 'Demonstrar detecção de rota órfã em branch com dados sintéticos e revisão humana.',
        acceptanceCriteria: [
          'Catálogo tipado valida todas as 47 rotas',
          'Idempotência evita duplicação de PRs',
          'Nenhum dado real escolar exposto',
        ],
        requiresHumanApproval: true,
      });

      expect(isNew).toBe(true);
      expect(task.state).toBe('AUTHORIZED');
      expect(task.requiresHumanApproval).toBe(true);
    });

    it('deve garantir idempotência sem duplicar tarefas repetidas', () => {
      const { task, isNew } = agentControlPlane.registerTask({
        taskId: 'TASK-PILOT-001-DUPLICATE',
        idempotencyKey: testKey, // Mesma chave!
        responsibleAgent: 'Antigravity',
        title: 'Tentativa duplicada',
        description: 'Não deve criar novo registro',
        acceptanceCriteria: [],
      });

      expect(isNew).toBe(false);
      expect(task.taskId).toBe('TASK-PILOT-001'); // Retornou a existente!
    });

    it('deve registrar evidências verificáveis de CI e qualidade', () => {
      agentControlPlane.recordEvidence('TASK-PILOT-001', {
        type: 'TYPECHECK',
        status: 'PASS',
        details: 'tsc --noEmit concluído com 0 erros.',
      });

      agentControlPlane.recordEvidence('TASK-PILOT-001', {
        type: 'JEST',
        status: 'PASS',
        details: '70 testes unitários verdes.',
      });

      const updated = agentControlPlane.getTask('TASK-PILOT-001');
      expect(updated?.evidences.length).toBe(2);
      expect(updated?.evidences[0].type).toBe('TYPECHECK');
      expect(updated?.evidences[1].type).toBe('JEST');
    });

    it('deve transicionar estados até READY_FOR_REVIEW sem contornar aprovação humana', () => {
      agentControlPlane.updateState('TASK-PILOT-001', 'RUNNING');
      agentControlPlane.updateState('TASK-PILOT-001', 'VALIDATING');
      agentControlPlane.updateState('TASK-PILOT-001', 'READY_FOR_REVIEW', {
        branchName: 'fix/portals-stability-v2.1',
        commitSha: '927b93ae',
        pullRequestNumber: 5,
        pullRequestUrl: 'https://github.com/andrejrunb/-quila-pro-v-1.0.0/pull/5',
      });

      const readyTask = agentControlPlane.getTask('TASK-PILOT-001');
      expect(readyTask?.state).toBe('READY_FOR_REVIEW');
      expect(readyTask?.pullRequestNumber).toBe(5);
      expect(readyTask?.requiresHumanApproval).toBe(true);
    });
  });
});
