import {
  PedagogicalTriEngine,
  TriItemParameters,
  StudentItemResponse,
  OFFICIAL_SAEB_DESCRIPTORS,
  OFFICIAL_BNCC_SKILLS,
  TRI_SCALING_CONSTANT_D,
} from '../services/PedagogicalTriEngine';

describe('Homologação Técnica — PedagogicalTriEngine (Onda 8: Docência, Curva TRI e SAEB/BNCC)', () => {
  // Itens de teste calibrados representativos
  const sampleItems: TriItemParameters[] = [
    {
      id: 'ITEM-MAT-FACIL-1',
      paramA: 1.2,
      paramB: -1.8,
      paramC: 0.2,
      descriptorCode: 'D14',
      bnccCode: 'EM13MAT101',
      area: 'matematica',
      stage: 'ENSINO_MEDIO',
    },
    {
      id: 'ITEM-MAT-FACIL-2',
      paramA: 1.0,
      paramB: -1.2,
      paramC: 0.2,
      descriptorCode: 'D14',
      bnccCode: 'EM13MAT101',
      area: 'matematica',
      stage: 'ENSINO_MEDIO',
    },
    {
      id: 'ITEM-MAT-MEDIO-1',
      paramA: 1.5,
      paramB: 0.0,
      paramC: 0.2,
      descriptorCode: 'D20',
      bnccCode: 'EM13MAT301',
      area: 'matematica',
      stage: 'ENSINO_MEDIO',
    },
    {
      id: 'ITEM-MAT-MEDIO-2',
      paramA: 1.4,
      paramB: 0.5,
      paramC: 0.2,
      descriptorCode: 'D21',
      bnccCode: 'EM13MAT302',
      area: 'matematica',
      stage: 'ENSINO_MEDIO',
    },
    {
      id: 'ITEM-MAT-DIFICIL-1',
      paramA: 1.8,
      paramB: 1.6,
      paramC: 0.2,
      descriptorCode: 'D28',
      bnccCode: 'EM13MAT304',
      area: 'matematica',
      stage: 'ENSINO_MEDIO',
    },
    {
      id: 'ITEM-MAT-DIFICIL-2',
      paramA: 1.9,
      paramB: 2.2,
      paramC: 0.2,
      descriptorCode: 'D28',
      bnccCode: 'EM13MAT304',
      area: 'matematica',
      stage: 'ENSINO_MEDIO',
    },
  ];

  describe('1. Modelo Logístico 3 Parâmetros (3PL) e Propriedades Matemáticas', () => {
    test('A constante de escala D da TRI deve ser exatamente 1.7', () => {
      expect(TRI_SCALING_CONSTANT_D).toBe(1.7);
    });

    test('Quando theta = b, a probabilidade 3PL deve ser exatamente (1 + c) / 2', () => {
      const a = 1.2;
      const b = 0.5;
      const c = 0.2;
      const theta = 0.5;

      const prob = PedagogicalTriEngine.calculate3PLProbability(theta, a, b, c);
      const expected = c + (1.0 - c) / (1.0 + Math.exp(0)); // c + (1-c)/2 = 0.2 + 0.4 = 0.6
      expect(prob).toBeCloseTo(expected, 5);
      expect(prob).toBeCloseTo(0.60, 5);
    });

    test('Quando theta tende a -infinito, a probabilidade P(theta) deve convergir para o chute c', () => {
      const a = 1.5;
      const b = 1.0;
      const c = 0.25;
      const thetaLow = -10.0;

      const prob = PedagogicalTriEngine.calculate3PLProbability(thetaLow, a, b, c);
      expect(prob).toBeCloseTo(c, 3);
    });

    test('Quando theta tende a +infinito, a probabilidade P(theta) deve convergir para 1.0', () => {
      const a = 1.5;
      const b = 0.0;
      const c = 0.20;
      const thetaHigh = 10.0;

      const prob = PedagogicalTriEngine.calculate3PLProbability(thetaHigh, a, b, c);
      expect(prob).toBeCloseTo(1.0, 3);
    });

    test('Monotonicidade estrita: P(theta) é estritamente crescente em relação a theta', () => {
      const a = 1.3;
      const b = 0.0;
      const c = 0.2;

      let prevProb = -1;
      for (let th = -3.0; th <= 3.0; th += 0.5) {
        const prob = PedagogicalTriEngine.calculate3PLProbability(th, a, b, c);
        expect(prob).toBeGreaterThan(prevProb);
        prevProb = prob;
      }
    });

    test('Discriminação (a): maior poder discriminante gera curva mais íngreme em theta = b', () => {
      const b = 0.0;
      const c = 0.0; // 2PL puro para isolar derivada simples
      const delta = 0.1;

      // a1 = baixo (0.8), a2 = alto (2.0)
      const p1Minus = PedagogicalTriEngine.calculate3PLProbability(-delta, 0.8, b, c);
      const p1Plus = PedagogicalTriEngine.calculate3PLProbability(delta, 0.8, b, c);
      const slope1 = (p1Plus - p1Minus) / (2 * delta);

      const p2Minus = PedagogicalTriEngine.calculate3PLProbability(-delta, 2.0, b, c);
      const p2Plus = PedagogicalTriEngine.calculate3PLProbability(delta, 2.0, b, c);
      const slope2 = (p2Plus - p2Minus) / (2 * delta);

      expect(slope2).toBeGreaterThan(slope1);
    });
  });

  describe('2. Informação do Item (IIF) e Informação do Teste (TIF)', () => {
    test('A função de informação do item é positiva e tem ápice próximo à dificuldade b', () => {
      const infoNearB = PedagogicalTriEngine.calculateItemInformation(0.2, 1.5, 0.0, 0.2);
      const infoFarLow = PedagogicalTriEngine.calculateItemInformation(-3.0, 1.5, 0.0, 0.2);
      const infoFarHigh = PedagogicalTriEngine.calculateItemInformation(3.5, 1.5, 0.0, 0.2);

      expect(infoNearB).toBeGreaterThan(infoFarLow);
      expect(infoNearB).toBeGreaterThan(infoFarHigh);
    });

    test('A informação do teste (TIF) cresce com mais itens e reduz o erro padrão (SE)', () => {
      const theta = 0.0;
      const resultFew = PedagogicalTriEngine.calculateTestInformationAndError(theta, sampleItems.slice(0, 2));
      const resultAll = PedagogicalTriEngine.calculateTestInformationAndError(theta, sampleItems);

      expect(resultAll.testInformation).toBeGreaterThan(resultFew.testInformation);
      expect(resultAll.standardError).toBeLessThan(resultFew.standardError);
    });
  });

  describe('3. Estimação Bayesiana EAP (Expected A Posteriori)', () => {
    test('Aluno com 100% de acertos atinge theta positivo robusto sem divergência numérica', () => {
      const allCorrectResponses: StudentItemResponse[] = sampleItems.map(it => ({
        itemId: it.id,
        isCorrect: true,
      }));

      const { theta, standardError } = PedagogicalTriEngine.estimateThetaEAP(sampleItems, allCorrectResponses);
      expect(theta).toBeGreaterThan(1.2);
      expect(Number.isFinite(theta)).toBe(true);
      expect(standardError).toBeGreaterThan(0);
      expect(standardError).toBeLessThan(1.0);
    });

    test('Aluno com 0% de acertos atinge theta negativo robusto sem NaN ou infinito', () => {
      const allIncorrectResponses: StudentItemResponse[] = sampleItems.map(it => ({
        itemId: it.id,
        isCorrect: false,
      }));

      const { theta, standardError } = PedagogicalTriEngine.estimateThetaEAP(sampleItems, allIncorrectResponses);
      expect(theta).toBeLessThan(-1.0);
      expect(Number.isFinite(theta)).toBe(true);
      expect(standardError).toBeGreaterThan(0);
    });

    test('Aluno médio (acerta fáceis e médias, erra difíceis) obtém theta balanceado centrado próximo a 0.0', () => {
      const balancedResponses: StudentItemResponse[] = [
        { itemId: 'ITEM-MAT-FACIL-1', isCorrect: true },
        { itemId: 'ITEM-MAT-FACIL-2', isCorrect: true },
        { itemId: 'ITEM-MAT-MEDIO-1', isCorrect: true },
        { itemId: 'ITEM-MAT-MEDIO-2', isCorrect: false },
        { itemId: 'ITEM-MAT-DIFICIL-1', isCorrect: false },
        { itemId: 'ITEM-MAT-DIFICIL-2', isCorrect: false },
      ];

      const { theta } = PedagogicalTriEngine.estimateThetaEAP(sampleItems, balancedResponses);
      expect(theta).toBeGreaterThanOrEqual(-0.7);
      expect(theta).toBeLessThanOrEqual(0.7);
    });
  });

  describe('4. Coerência Pedagógica e Detecção de Padrão de Chute (Guttman Inconsistency)', () => {
    test('Padrão Coerente (acerta fáceis e erra difíceis) resulta em alta coerência e ausência de alerta de chute', () => {
      const coherentResponses: StudentItemResponse[] = [
        { itemId: 'ITEM-MAT-FACIL-1', isCorrect: true },
        { itemId: 'ITEM-MAT-FACIL-2', isCorrect: true },
        { itemId: 'ITEM-MAT-MEDIO-1', isCorrect: true },
        { itemId: 'ITEM-MAT-MEDIO-2', isCorrect: false },
        { itemId: 'ITEM-MAT-DIFICIL-1', isCorrect: false },
        { itemId: 'ITEM-MAT-DIFICIL-2', isCorrect: false },
      ];

      const coherence = PedagogicalTriEngine.evaluatePedagogicalCoherence(0.0, sampleItems, coherentResponses);
      expect(coherence.coherenceIndex).toBeGreaterThanOrEqual(85);
      expect(coherence.isGuessingDetected).toBe(false);
      expect(coherence.anomalousItemsCount).toBe(0);
      expect(coherence.guttmanInversions).toBe(0);
    });

    test('Padrão Anômalo / Chute (erra as 2 fáceis e acerta as 2 difíceis) detecta padrão de chute e inversões de Guttman', () => {
      const guessingResponses: StudentItemResponse[] = [
        { itemId: 'ITEM-MAT-FACIL-1', isCorrect: false }, // errou fácil (b = -1.8)
        { itemId: 'ITEM-MAT-FACIL-2', isCorrect: false }, // errou fácil (b = -1.2)
        { itemId: 'ITEM-MAT-MEDIO-1', isCorrect: false },
        { itemId: 'ITEM-MAT-MEDIO-2', isCorrect: false },
        { itemId: 'ITEM-MAT-DIFICIL-1', isCorrect: true },  // acertou difícil (b = 1.6)
        { itemId: 'ITEM-MAT-DIFICIL-2', isCorrect: true },  // acertou difícil (b = 2.2)
      ];

      // Theta baixo porque errou 4 itens
      const theta = -0.8;
      const coherence = PedagogicalTriEngine.evaluatePedagogicalCoherence(theta, sampleItems, guessingResponses);

      expect(coherence.guttmanInversions).toBeGreaterThan(0);
      expect(coherence.anomalousItemsCount).toBeGreaterThanOrEqual(2);
      expect(coherence.isGuessingDetected).toBe(true);
      expect(coherence.coherenceIndex).toBeLessThan(75);
    });
  });

  describe('5. Conversão para Escalas Oficiais (ENEM, SAEB, Nota Escolar)', () => {
    test('Conversão ENEM segue média 500 e desvio padrão 100', () => {
      const enemTheta0 = PedagogicalTriEngine.convertToEnemScale(0.0, 100);
      expect(enemTheta0).toBe(500);

      const enemTheta1 = PedagogicalTriEngine.convertToEnemScale(1.5, 100);
      expect(enemTheta1).toBe(650);

      const enemThetaNeg = PedagogicalTriEngine.convertToEnemScale(-1.0, 100);
      expect(enemThetaNeg).toBe(400);
    });

    test('Conversão SAEB segue média 250 e desvio padrão 50 com limites operacionais', () => {
      const saebTheta0 = PedagogicalTriEngine.convertToSaebScale(0.0, 100);
      expect(saebTheta0).toBe(250);

      const saebTheta2 = PedagogicalTriEngine.convertToSaebScale(2.0, 100);
      expect(saebTheta2).toBe(350);

      const saebThetaNeg = PedagogicalTriEngine.convertToSaebScale(-2.0, 100);
      expect(saebThetaNeg).toBe(150);
    });

    test('Classificação de Níveis de Maestria SAEB', () => {
      expect(PedagogicalTriEngine.classifySaebMastery(180)).toBe('abaixo_do_basico');
      expect(PedagogicalTriEngine.classifySaebMastery(220)).toBe('basico');
      expect(PedagogicalTriEngine.classifySaebMastery(310)).toBe('proficiente');
      expect(PedagogicalTriEngine.classifySaebMastery(380)).toBe('avancado');
    });

    test('Nota Escolar se mantém no intervalo canônico [0.0, 10.0]', () => {
      const gradeMax = PedagogicalTriEngine.convertToSchoolGrade(3.0, 100, 100);
      expect(gradeMax).toBe(10.0);

      const gradeMin = PedagogicalTriEngine.convertToSchoolGrade(-3.0, 0, 0);
      expect(gradeMin).toBe(0.0);

      const gradeMid = PedagogicalTriEngine.convertToSchoolGrade(0.0, 50, 80);
      expect(gradeMid).toBeGreaterThan(4.0);
      expect(gradeMid).toBeLessThan(7.0);
    });
  });

  describe('6. Mapeamento Direto por Matriz SAEB e BNCC', () => {
    test('Matriz oficial possui descritores SAEB de Matemática e Língua Portuguesa com correlações BNCC válidas', () => {
      expect(OFFICIAL_SAEB_DESCRIPTORS['D14']).toBeDefined();
      expect(OFFICIAL_SAEB_DESCRIPTORS['D14'].description).toContain('porcentagem');
      expect(OFFICIAL_SAEB_DESCRIPTORS['D14'].correlatedBnccCodes).toContain('EM13MAT101');

      expect(OFFICIAL_SAEB_DESCRIPTORS['D01_LP']).toBeDefined();
      expect(OFFICIAL_SAEB_DESCRIPTORS['D01_LP'].description).toContain('informações explícitas');
      expect(OFFICIAL_SAEB_DESCRIPTORS['D01_LP'].correlatedBnccCodes).toContain('EM13LP01');
    });

    test('Catálogo de habilidades BNCC possui códigos válidos e descrições formativas', () => {
      expect(OFFICIAL_BNCC_SKILLS['EM13MAT101']).toBeDefined();
      expect(OFFICIAL_BNCC_SKILLS['EM13MAT101'].component).toBe('Matemática');
      expect(OFFICIAL_BNCC_SKILLS['EM13LP05']).toBeDefined();
    });

    test('Diagnóstico por descritor agrupa itens e gera recomendações pedagógicas precisas', () => {
      const responses: StudentItemResponse[] = [
        { itemId: 'ITEM-MAT-FACIL-1', isCorrect: true }, // D14
        { itemId: 'ITEM-MAT-FACIL-2', isCorrect: true }, // D14
        { itemId: 'ITEM-MAT-MEDIO-1', isCorrect: false }, // D20
        { itemId: 'ITEM-MAT-MEDIO-2', isCorrect: true },  // D21
        { itemId: 'ITEM-MAT-DIFICIL-1', isCorrect: false }, // D28
        { itemId: 'ITEM-MAT-DIFICIL-2', isCorrect: false }, // D28
      ];

      const diagnostics = PedagogicalTriEngine.diagnoseByDescriptors(sampleItems, responses, 0.0);
      expect(diagnostics.length).toBe(4); // D14, D20, D21, D28

      const diagD14 = diagnostics.find(d => d.descriptorCode === 'D14')!;
      expect(diagD14.totalItems).toBe(2);
      expect(diagD14.correctItems).toBe(2);
      expect(diagD14.accuracyPct).toBe(100);
      expect(diagD14.masteryLevel).toBe('avancado');

      const diagD28 = diagnostics.find(d => d.descriptorCode === 'D28')!;
      expect(diagD28.totalItems).toBe(2);
      expect(diagD28.correctItems).toBe(0);
      expect(diagD28.accuracyPct).toBe(0);
      expect(diagD28.masteryLevel).toBe('abaixo_do_basico');
      expect(diagD28.pedagogicalRecommendation).toContain('reforço conceitual');
    });
  });

  describe('7. Avaliação de Estudante e Preservação de Privacidade (LGPD & Anti-Estigmatização)', () => {
    test('Avaliação individual gera relatório confidencial sem ranqueamento público', () => {
      const studentResponses: StudentItemResponse[] = [
        { itemId: 'ITEM-MAT-FACIL-1', isCorrect: true },
        { itemId: 'ITEM-MAT-FACIL-2', isCorrect: true },
        { itemId: 'ITEM-MAT-MEDIO-1', isCorrect: true },
        { itemId: 'ITEM-MAT-MEDIO-2', isCorrect: true },
        { itemId: 'ITEM-MAT-DIFICIL-1', isCorrect: false },
        { itemId: 'ITEM-MAT-DIFICIL-2', isCorrect: false },
      ];

      const result = PedagogicalTriEngine.evaluateStudentAssessment({
        studentId: 'student_priv_001',
        assessmentId: 'assessment_onda8_tri',
        items: sampleItems,
        responses: studentResponses,
      });

      expect(result.studentId).toBe('student_priv_001');
      expect(result.totalItems).toBe(6);
      expect(result.correctItems).toBe(4);
      expect(result.accuracyPercentage).toBe(67);
      expect(result.theta).toBeGreaterThan(0.0);
      expect(result.saebScore).toBeGreaterThan(250);
      expect(result.formativeFeedback).toContain('Parabéns pela dedicação');
      expect(result.isGuessingPatternDetected).toBe(false);
      expect(result.descriptorDiagnostics.length).toBeGreaterThan(0);
      expect((result as any).rankPosition).toBeUndefined(); // Não há ranking público
    });

    test('Consolidação da turma fornece apenas métricas estatísticas agregadas e alerta de intervenção docente', () => {
      // Cria 4 resultados simulados
      const r1 = PedagogicalTriEngine.evaluateStudentAssessment({
        studentId: 'aluno_1',
        assessmentId: 'ass_01',
        items: sampleItems,
        responses: sampleItems.map(it => ({ itemId: it.id, isCorrect: true })), // Avançado
      });

      const r2 = PedagogicalTriEngine.evaluateStudentAssessment({
        studentId: 'aluno_2',
        assessmentId: 'ass_01',
        items: sampleItems,
        responses: [
          { itemId: 'ITEM-MAT-FACIL-1', isCorrect: true },
          { itemId: 'ITEM-MAT-FACIL-2', isCorrect: true },
          { itemId: 'ITEM-MAT-MEDIO-1', isCorrect: true },
          { itemId: 'ITEM-MAT-MEDIO-2', isCorrect: false },
          { itemId: 'ITEM-MAT-DIFICIL-1', isCorrect: false },
          { itemId: 'ITEM-MAT-DIFICIL-2', isCorrect: false },
        ], // Proficiente
      });

      const r3 = PedagogicalTriEngine.evaluateStudentAssessment({
        studentId: 'aluno_3',
        assessmentId: 'ass_01',
        items: sampleItems,
        responses: [
          { itemId: 'ITEM-MAT-FACIL-1', isCorrect: true },
          { itemId: 'ITEM-MAT-FACIL-2', isCorrect: false },
          { itemId: 'ITEM-MAT-MEDIO-1', isCorrect: false },
          { itemId: 'ITEM-MAT-MEDIO-2', isCorrect: false },
          { itemId: 'ITEM-MAT-DIFICIL-1', isCorrect: false },
          { itemId: 'ITEM-MAT-DIFICIL-2', isCorrect: false },
        ], // Básico / Abaixo do básico
      });

      const consolidated = PedagogicalTriEngine.consolidateClassAnalytics({
        assessmentId: 'ass_01',
        classId: '3_ANO_EM_A',
        studentResults: [r1, r2, r3],
      });

      expect(consolidated.totalStudentsEvaluated).toBe(3);
      expect(consolidated.averageSaebScore).toBeGreaterThan(150);
      expect(consolidated.averageEnemScore).toBeGreaterThan(400);
      expect(consolidated.masteryDistribution).toBeDefined();
      expect(consolidated.criticalDescriptors.length).toBeGreaterThan(0);
      expect(consolidated.criticalDescriptors[0].interventionPriority).toBeDefined();
      expect(consolidated.privacyNotice).toContain('LGPD Compliance');
      expect((consolidated as any).studentRankings).toBeUndefined(); // Zero ranqueamento nominal estigmatizante
    });
  });
});
