import {
  SovereignMeshService,
  CRDTRecord
} from '../SovereignMeshService';
import { logger } from '../../logger';

describe('SovereignMeshService — Onda 7: Malha P2P Soberana & Resiliência Offline-First', () => {
  beforeEach(() => {
    // Silencia saídas de console/logger
    jest.spyOn(logger, 'info').mockImplementation(() => {});
    jest.spyOn(logger, 'warn').mockImplementation(() => {});
    jest.spyOn(logger, 'error').mockImplementation(() => {});
    jest.spyOn(logger, 'debug').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('1. Descoberta Local mDNS & Isolamento Institucional', () => {
    test('Deve inicializar nós com isolamento de escola (schoolId) sem dependência externa', async () => {
      const nodeA = new SovereignMeshService({ port: 4001, schoolId: 'escola-matriz', simulationMode: true });
      nodeA.setSimulatedNodeId('hub-catraca-norte');
      await nodeA.init();

      expect(nodeA.getSchoolId()).toBe('escola-matriz');
      expect(nodeA.getNodeId()).toBe('hub-catraca-norte');
      expect(nodeA.getStatus().active).toBe(true);
    });

    test('Deve rejeitar registros CRDT e pacotes de escolas diferentes', async () => {
      const nodeEscolaA = new SovereignMeshService({ port: 4001, schoolId: 'escola-santos-dumont', simulationMode: true });
      nodeEscolaA.setSimulatedNodeId('hub-escola-a');

      const alienRecord: CRDTRecord = {
        key: 'attendance:stu-999',
        value: { studentId: 'stu-999', status: 'present' },
        timestamp: Date.now(),
        sequence: 1,
        nodeId: 'alien-node',
        schoolId: 'escola-rival',
        isDeleted: false,
        versionVector: { 'alien-node': 1 }
      };

      const applied = nodeEscolaA.applyRemoteCRDTRecord(alienRecord);
      expect(applied).toBe(false);
      expect(nodeEscolaA.getCRDT('attendance:stu-999')).toBeUndefined();
    });
  });

  describe('2. Resolução Determinística de Conflitos CRDT LWW (Last-Write-Wins)', () => {
    let node: SovereignMeshService;

    beforeEach(() => {
      node = new SovereignMeshService({ port: 4001, schoolId: 'escola-central', simulationMode: true });
      node.setSimulatedNodeId('hub-principal');
    });

    test('Maior timestamp físico deve vencer o conflito LWW', () => {
      const olderRecord: CRDTRecord = {
        key: 'student:101:zone',
        value: 'biblioteca',
        timestamp: 1000,
        sequence: 1,
        nodeId: 'node-a',
        schoolId: 'escola-central',
        isDeleted: false,
        versionVector: { 'node-a': 1 }
      };

      const newerRecord: CRDTRecord = {
        key: 'student:101:zone',
        value: 'patio-norte',
        timestamp: 2000,
        sequence: 1,
        nodeId: 'node-b',
        schoolId: 'escola-central',
        isDeleted: false,
        versionVector: { 'node-b': 1 }
      };

      const result = node.resolveConflict(newerRecord, olderRecord);
      expect(result.winner).toBe('incoming');
      expect(result.record.value).toBe('patio-norte');

      const reverseResult = node.resolveConflict(olderRecord, newerRecord);
      expect(reverseResult.winner).toBe('existing');
      expect(reverseResult.record.value).toBe('patio-norte');
    });

    test('Desempate determinístico por Sequence e NodeId em caso de timestamps iguais', () => {
      const recordA: CRDTRecord = {
        key: 'gate:turnstile:counter',
        value: 10,
        timestamp: 5000,
        sequence: 2,
        nodeId: 'node-alpha',
        schoolId: 'escola-central',
        isDeleted: false,
        versionVector: { 'node-alpha': 2 }
      };

      const recordB: CRDTRecord = {
        key: 'gate:turnstile:counter',
        value: 15,
        timestamp: 5000,
        sequence: 1,
        nodeId: 'node-beta',
        schoolId: 'escola-central',
        isDeleted: false,
        versionVector: { 'node-beta': 1 }
      };

      // Maior sequence (2 > 1) deve vencer
      const resultSeq = node.resolveConflict(recordA, recordB);
      expect(resultSeq.winner).toBe('incoming');
      expect(resultSeq.record.value).toBe(10);

      // Mesma sequence e mesmo timestamp -> desempate lexicográfico por nodeId ('node-beta' > 'node-alpha')
      const recordEqualSeqA: CRDTRecord = { ...recordA, sequence: 1 };
      const recordEqualSeqB: CRDTRecord = { ...recordB, sequence: 1 };

      const resultLex = node.resolveConflict(recordEqualSeqB, recordEqualSeqA);
      expect(resultLex.winner).toBe('incoming');
      expect(resultLex.record.nodeId).toBe('node-beta');
    });

    test('Deve suportar Tombstones (exclusão lógica) com preservação da regra LWW', async () => {
      await node.putCRDT('alert:door-left-open', { room: 'Lab 1', severity: 'high' });
      expect(node.getCRDT('alert:door-left-open')).toBeDefined();

      await node.deleteCRDT('alert:door-left-open');
      expect(node.getCRDT('alert:door-left-open')).toBeUndefined();
      expect(node.getCRDT('alert:door-left-open', true)?.isDeleted).toBe(true);
    });
  });

  describe('3. Reconciliação Offline-First pós-Desconexão & Partição de Rede', () => {
    test('Nós operando desconectados devem convergir para o mesmo estado após reconexão', async () => {
      // 1. Instancia dois nós da mesma escola (ex: Portaria e Sala de Professores)
      const portariaNode = new SovereignMeshService({ port: 4001, schoolId: 'colegio-modelo', simulationMode: true });
      portariaNode.setSimulatedNodeId('node-portaria');

      const salaProfNode = new SovereignMeshService({ port: 4002, schoolId: 'colegio-modelo', simulationMode: true });
      salaProfNode.setSimulatedNodeId('node-professores');

      await portariaNode.init();
      await salaProfNode.init();

      // 2. Simula PARTIÇÃO DE REDE: Os nós estão 100% desconectados (Offline)
      // Portaria registra presença do Aluno 1 e Aluno 2
      await portariaNode.putCRDT('presence:stu-001', { studentId: 'stu-001', checkIn: '07:30', gate: 'Portaria Principal' });
      await portariaNode.putCRDT('presence:stu-002', { studentId: 'stu-002', checkIn: '07:32', gate: 'Portaria Principal' });

      // Sala dos Professores registra uma observação para Aluno 2 (mais recente) e nota para Aluno 3
      await salaProfNode.putCRDT('presence:stu-003', { studentId: 'stu-003', checkIn: '07:35', gate: 'Entrada Secundária' });
      
      // Conflito concorrente proposital no Aluno 2:
      // Simula uma alteração posterior do professor (timestamp maior)
      await salaProfNode.putCRDT('presence:stu-002', {
        studentId: 'stu-002',
        checkIn: '07:32',
        gate: 'Portaria Principal',
        teacherValidated: true
      });

      // Estado antes da reconexão:
      expect(portariaNode.getAllCRDT().length).toBe(2);
      expect(salaProfNode.getAllCRDT().length).toBe(2);
      expect(portariaNode.getCRDT('presence:stu-003')).toBeUndefined();

      // 3. RECONEXÃO: Os nós reestabelecem conexão local (mDNS Discovery + Reconcile)
      portariaNode.connectSimulatedPeer(salaProfNode);
      salaProfNode.connectSimulatedPeer(portariaNode);

      // 4. VERIFICAÇÃO DE CONVERGÊNCIA IDÊNTICA (Strong Eventual Consistency)
      const portariaAll = portariaNode.getAllCRDT();
      const profAll = salaProfNode.getAllCRDT();

      expect(portariaAll.length).toBe(3);
      expect(profAll.length).toBe(3);

      // Ambos devem ter exatamente os 3 alunos
      expect(portariaNode.getCRDT('presence:stu-001')?.value.studentId).toBe('stu-001');
      expect(portariaNode.getCRDT('presence:stu-003')?.value.studentId).toBe('stu-003');

      // O registro com conflito (Aluno 2) deve ter resolvido a favor da atualização do professor (LWW)
      const aluno2NaPortaria = portariaNode.getCRDT('presence:stu-002');
      const aluno2NoProfessor = salaProfNode.getCRDT('presence:stu-002');

      expect(aluno2NaPortaria?.value.teacherValidated).toBe(true);
      expect(aluno2NoProfessor?.value.teacherValidated).toBe(true);
      expect(aluno2NaPortaria?.timestamp).toBe(aluno2NoProfessor?.timestamp);
    });

    test('Vetor de Versão (Version Vector) deve computar deltas com precisão mínima de payload', async () => {
      const nodeA = new SovereignMeshService({ port: 4001, schoolId: 'escola-delta', simulationMode: true });
      nodeA.setSimulatedNodeId('node-a');
      await nodeA.init();

      await nodeA.putCRDT('key-1', 'val-1');
      await nodeA.putCRDT('key-2', 'val-2');
      await nodeA.putCRDT('key-3', 'val-3');

      // Se o peer já viu a versão 2 do node-a, o delta deve conter apenas key-3
      const remoteVector = { 'node-a': 2 };
      const deltas = nodeA.computeDeltasForPeer(remoteVector);

      expect(deltas.length).toBe(1);
      expect(deltas[0].key).toBe('key-3');
    });
  });
});
