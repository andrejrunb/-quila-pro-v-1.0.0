import {
  PedagogicalScaffoldingEngine,
  StudentSubmission,
} from '../services/PedagogicalScaffoldingEngine';

describe('Onda 9 — PedagogicalScaffoldingEngine (Motor Kumon de Scaffolding Adaptativo)', () => {
  let engine: PedagogicalScaffoldingEngine;

  beforeEach(() => {
    engine = new (PedagogicalScaffoldingEngine as any)();
    engine.clearSchedules();
  });

  describe('1. Decomposição de Habilidades em 3 Níveis Áquila', () => {
    test('Deve decompor uma habilidade de Matemática em exatamente 3 Níveis progressivos', () => {
      const plan = engine.decomposeSkill({
        skillId: 'mat_fracoes_01',
        skillName: 'Adição de Frações com Denominadores Diferentes',
        discipline: 'Matemática',
        bnccCode: 'EF06MA09',
      });

      expect(plan.skillId).toBe('mat_fracoes_01');
      expect(plan.discipline).toBe('Matemática');
      expect(plan.bnccCode).toBe('EF06MA09');
      expect(plan.totalMicroSteps).toBeGreaterThanOrEqual(5);

      // Verificação do Nível 1 (Fundamentos / Base Intuitiva)
      expect(plan.levels.nivel1.name).toContain('Nível 1 (Fundamentos / Base Intuitiva)');
      expect(plan.levels.nivel1.masteryThresholdPercent).toBe(80);
      expect(plan.levels.nivel1.microSteps.length).toBeGreaterThan(0);
      expect(plan.levels.nivel1.microSteps[0].pedagogicalModality).toBe('visual_intuitive');
      expect(plan.levels.nivel1.microSteps[0].targetStandardCompletionSeconds).toBeLessThanOrEqual(60);

      // Verificação do Nível 2 (Aplicação Curricular / Worked Examples)
      expect(plan.levels.nivel2.name).toContain('Nível 2 (Aplicação Curricular / Worked Examples)');
      expect(plan.levels.nivel2.masteryThresholdPercent).toBe(85);
      expect(plan.levels.nivel2.microSteps[0].pedagogicalModality).toBe('worked_example');
      expect(plan.levels.nivel2.microSteps[0].workedExample).toBeDefined();
      expect(plan.levels.nivel2.microSteps[0].workedExample?.fadedPrompt).toBeDefined();

      // Verificação do Nível 3 (Aprofundamento / Desafio Olímpico e Vestibulares)
      expect(plan.levels.nivel3.name).toContain('Nível 3 (Aprofundamento / Desafio Olímpico e Vestibulares)');
      expect(plan.levels.nivel3.masteryThresholdPercent).toBe(90);
      expect(plan.levels.nivel3.microSteps[0].pedagogicalModality).toBe('olympic_challenge');
    });

    test('Deve adaptar a decomposição para Física mantendo os 3 Níveis', () => {
      const plan = engine.decomposeSkill({
        skillId: 'fis_eletro_01',
        skillName: 'Primeira Lei de Ohm e Circuitos Elétricos',
        discipline: 'Física',
        bnccCode: 'EM13CNT106',
      });

      expect(plan.levels.nivel1.microSteps[0].checkQuestion.options).toContain('corrente');
      expect(plan.levels.nivel2.microSteps[0].workedExample?.problemStatement).toContain('Primeira Lei de Ohm');
      expect(plan.levels.nivel3.microSteps[0].pedagogicalModality).toBe('olympic_challenge');
    });
  });

  describe('2. Agendamento de Revisão Espaçada de Ebbinghaus (24h, 48h, 96h, 144h)', () => {
    test('Deve agendar exatamente 4 etapas nos intervalos de 24h, 48h, 96h e 144h', () => {
      const baseDate = new Date('2026-10-26T10:00:00Z');
      const schedule = engine.scheduleEbbinghausReviews('aluno_kumon_01', 'mat_fracoes_01', baseDate);

      expect(schedule.studentId).toBe('aluno_kumon_01');
      expect(schedule.skillId).toBe('mat_fracoes_01');
      expect(schedule.isFullyConsolidated).toBe(false);
      expect(schedule.reviews).toHaveLength(4);

      // Intervalos canônicos
      expect(schedule.reviews[0].intervalHours).toBe(24);
      expect(schedule.reviews[1].intervalHours).toBe(48);
      expect(schedule.reviews[2].intervalHours).toBe(96);
      expect(schedule.reviews[3].intervalHours).toBe(144);

      // Verificação das datas calculadas
      const t0 = baseDate.getTime();
      const r0Time = new Date(schedule.reviews[0].scheduledFor).getTime();
      const r1Time = new Date(schedule.reviews[1].scheduledFor).getTime();
      const r2Time = new Date(schedule.reviews[2].scheduledFor).getTime();
      const r3Time = new Date(schedule.reviews[3].scheduledFor).getTime();

      expect(r0Time - t0).toBe(24 * 3600 * 1000);
      expect(r1Time - r0Time).toBe(48 * 3600 * 1000);
      expect(r2Time - r1Time).toBe(96 * 3600 * 1000);
      expect(r3Time - r2Time).toBe(144 * 3600 * 1000);
    });

    test('Deve filtrar apenas revisões vencidas (DUE) na data de corte', () => {
      const baseDate = new Date('2026-10-26T10:00:00Z');
      engine.scheduleEbbinghausReviews('aluno_01', 'skill_01', baseDate);

      // 12 horas depois: nenhuma revisão devida
      const t12h = new Date('2026-10-26T22:00:00Z');
      expect(engine.getDueReviews('aluno_01', t12h)).toHaveLength(0);

      // 25 horas depois: 1ª revisão devida
      const t25h = new Date('2026-10-27T11:00:00Z');
      const dueReviews = engine.getDueReviews('aluno_01', t25h);
      expect(dueReviews).toHaveLength(1);
      expect(dueReviews[0].intervalIndex).toBe(0);
      expect(dueReviews[0].status).toBe('DUE');
    });

    test('Deve atualizar a força da memória e marcar consolidação na 4ª etapa', () => {
      const baseDate = new Date('2026-10-26T10:00:00Z');
      engine.scheduleEbbinghausReviews('aluno_02', 'skill_02', baseDate);

      // Sucesso nas 4 etapas sucessivas
      for (let i = 0; i < 4; i++) {
        const result = engine.recordReviewOutcome('aluno_02', 'skill_02', i, true, 100, 45, new Date());
        expect(result.updatedReview.status).toBe('COMPLETED');
        expect(result.retentionProbability).toBeGreaterThan(0);
      }

      const finalSchedule = engine.getSchedule('aluno_02', 'skill_02');
      expect(finalSchedule?.isFullyConsolidated).toBe(true);
      expect(finalSchedule?.stabilityIndexHours).toBeGreaterThan(200);
    });

    test('Deve acionar regressão e reescalonamento Kumon em caso de falha na revisão', () => {
      const baseDate = new Date('2026-10-26T10:00:00Z');
      engine.scheduleEbbinghausReviews('aluno_03', 'skill_03', baseDate);

      const failResult = engine.recordReviewOutcome('aluno_03', 'skill_03', 1, false, 30, 90, new Date());
      expect(failResult.updatedReview.status).toBe('RELAPSED');
      expect(failResult.recommendedNextAction).toBe('RETRY_SAME_INTERVAL');

      // Próxima revisão deve ter sido reescalonada para +24h
      const schedule = engine.getSchedule('aluno_03', 'skill_03');
      expect(schedule?.reviews[2].status).toBe('PENDING');
    });

    test('Cálculo da probabilidade de retenção na Curva de Ebbinghaus R(t) = exp(-t/S)', () => {
      const t0 = new Date('2026-10-26T00:00:00Z');
      const t24h = new Date('2026-10-27T00:00:00Z');

      const rImmediately = engine.calculateRetentionProbability(t0, 24, t0);
      expect(rImmediately).toBeCloseTo(1.0, 2);

      const rAtStability = engine.calculateRetentionProbability(t0, 24, t24h);
      // exp(-1) ~= 0.3679
      expect(rAtStability).toBeCloseTo(0.3679, 2);
    });
  });

  describe('3. Detecção Socrática de Equívocos Conceituais (Misconceptions)', () => {
    test('Deve detectar equívoco clássico de soma direta de frações: 1/2 + 1/3 = 2/5', () => {
      const submission: StudentSubmission = {
        studentId: 'aluno_fracao',
        skillId: 'mat_fracoes',
        problemPrompt: 'Calcule a soma: 1/2 + 1/3',
        studentAnswer: '2/5',
        expectedAnswer: '5/6',
      };

      const diagnosis = engine.diagnoseMisconception(submission);
      expect(diagnosis.hasMisconception).toBe(true);
      expect(diagnosis.detectedMisconception?.id).toBe('MIS_ADD_FRACTIONS_DIRECT');
      expect(diagnosis.recommendedAction).toBe('TRIGGER_LEVEL_1_REMEDIATION');

      // Intervenção socrática não entrega a resposta, mas desafia com contraexemplo
      const intervention = diagnosis.socraticIntervention!;
      expect(intervention.inquiryQuestion).toContain('pizza');
      expect(intervention.counterExample).toContain('50%');
      expect(intervention.remedialScaffoldingLevel).toBe('NIVEL_1_FUNDAMENTOS');
      expect(intervention.correctiveStepAnchor).toBe('NIVEL_1_PASSO_FRACAO_VISUAL');
    });

    test('Deve detectar equívoco de álgebra distributiva: (x + 2)^2 = x^2 + 4', () => {
      const submission: StudentSubmission = {
        studentId: 'aluno_algebra',
        skillId: 'mat_produtos_notaveis',
        problemPrompt: 'Desenvolva o produto notável: (x + 2)^2',
        studentAnswer: 'x^2 + 4',
        expectedAnswer: 'x^2 + 4x + 4',
      };

      const diagnosis = engine.diagnoseMisconception(submission);
      expect(diagnosis.hasMisconception).toBe(true);
      expect(diagnosis.detectedMisconception?.id).toBe('MIS_ALGEBRA_DISTRIBUTIVE_POWER');
      expect(diagnosis.socraticIntervention?.inquiryQuestion).toContain('unidades que faltam');
    });

    test('Deve detectar equívoco do par ação-reação na 3ª Lei de Newton', () => {
      const submission: StudentSubmission = {
        studentId: 'aluno_newton',
        skillId: 'fis_newton',
        problemPrompt: 'Por que o cavalo consegue puxar a charrete se as forças são iguais e opostas?',
        studentAnswer: 'Ação e reação se anulam então a força resultante zero impede movimento.',
        expectedAnswer: 'As forças atuam em corpos distintos.',
      };

      const diagnosis = engine.diagnoseMisconception(submission);
      expect(diagnosis.hasMisconception).toBe(true);
      expect(diagnosis.detectedMisconception?.id).toBe('MIS_NEWTON_THIRD_LAW_CANCEL');
      expect(diagnosis.socraticIntervention?.counterExample).toContain('corpos DIFERENTES');
    });

    test('Não deve diagnosticar equívoco quando o aluno responde corretamente', () => {
      const submission: StudentSubmission = {
        studentId: 'aluno_nota10',
        skillId: 'mat_fracoes',
        problemPrompt: 'Calcule: 1/2 + 1/3',
        studentAnswer: '5/6',
        expectedAnswer: '5/6',
      };

      const diagnosis = engine.diagnoseMisconception(submission);
      expect(diagnosis.hasMisconception).toBe(false);
      expect(diagnosis.recommendedAction).toBe('PROCEED');
    });

    test('Deve permitir cadastrar e detectar novo equívoco conceitual customizado', () => {
      engine.registerCustomMisconception({
        id: 'MIS_ZERO_POWER',
        discipline: 'Matemática',
        topic: 'Potências',
        title: 'Expoente Zero Resultando em Zero',
        description: 'Achar que x^0 = 0.',
        detector: (sub) => sub.problemPrompt.includes('^0') && sub.studentAnswer.trim() === '0',
        socraticInquiryPrompt: 'O que resulta da divisão de um número por ele mesmo? x^3 / x^3 = ?',
        concreteCounterExample: '5 / 5 = 1. Pelas regras de potência: 5^(1-1) = 5^0 = 1.',
        correctiveMicroStepAnchor: 'NIVEL_1_DIVISAO_POTENCIAS',
        remedialLevel: 'NIVEL_1_FUNDAMENTOS',
      });

      const submission: StudentSubmission = {
        studentId: 'aluno_potencia',
        skillId: 'mat_potencia',
        problemPrompt: 'Calcule: 7^0',
        studentAnswer: '0',
        expectedAnswer: '1',
      };

      const diagnosis = engine.diagnoseMisconception(submission);
      expect(diagnosis.hasMisconception).toBe(true);
      expect(diagnosis.detectedMisconception?.id).toBe('MIS_ZERO_POWER');
    });
  });

  describe('4. Geração de Micro-Drill Kumon com SCT (Standard Completion Time)', () => {
    test('Deve gerar micro-drill adaptativo calibrando tempo padrão de resolução', () => {
      const drillN1 = engine.generateKumonMicroDrill('mat_calculo_01', 'NIVEL_1_FUNDAMENTOS', 3);
      expect(drillN1.standardCompletionTimeSeconds).toBe(40);
      expect(drillN1.level).toBe('NIVEL_1_FUNDAMENTOS');

      const drillN2 = engine.generateKumonMicroDrill('mat_calculo_01', 'NIVEL_2_APLICACAO_CURRICULAR', 6);
      expect(drillN2.standardCompletionTimeSeconds).toBe(80);

      const drillN3 = engine.generateKumonMicroDrill('mat_calculo_01', 'NIVEL_3_APROFUNDAMENTO_OLIMPICO', 9);
      expect(drillN3.standardCompletionTimeSeconds).toBe(180);
    });
  });
});
