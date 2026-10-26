import {
  InternationalExamRadarService,
  OFFICIAL_INTERNATIONAL_ITEMS,
  SAEB_BNCC_TO_INTERNATIONAL_CROSSWALK,
  PisaProficiencyLevel,
  TimssBenchmarkLevel
} from '../services/InternationalExamRadarService';

describe('Homologação Técnica — InternationalExamRadarService (Onda 5: Radar Global PISA & TIMSS)', () => {
  describe('1. Integridade do Catálogo de Itens Públicos Desclassificados', () => {
    test('O catálogo deve possuir itens de PISA e TIMSS em Matemática, Leitura e Ciências', () => {
      expect(OFFICIAL_INTERNATIONAL_ITEMS.length).toBeGreaterThanOrEqual(7);

      const pisaItems = OFFICIAL_INTERNATIONAL_ITEMS.filter(item => item.program === 'PISA');
      const timssItems = OFFICIAL_INTERNATIONAL_ITEMS.filter(item => item.program === 'TIMSS');

      expect(pisaItems.length).toBeGreaterThanOrEqual(4);
      expect(timssItems.length).toBeGreaterThanOrEqual(3);
    });

    test('Todos os itens devem conter parâmetros de calibração TRI e escore de referência', () => {
      OFFICIAL_INTERNATIONAL_ITEMS.forEach(item => {
        expect(item.id).toBeDefined();
        expect(item.title).toBeTruthy();
        expect(item.questionText).toBeTruthy();
        expect(item.correctAnswer).toMatch(/^[A-E]$/);
        expect(item.scaleCalibrationScore).toBeGreaterThanOrEqual(350);
        expect(item.scaleCalibrationScore).toBeLessThanOrEqual(750);

        // Parâmetros TRI válidos
        expect(item.triParameters.paramA).toBeGreaterThan(0.5);
        expect(item.triParameters.paramB).toBeGreaterThanOrEqual(-2.5);
        expect(item.triParameters.paramB).toBeLessThanOrEqual(2.5);
        expect(item.triParameters.paramC).toBeCloseTo(0.20, 2);

        // Correlações curriculares
        expect(item.saebCorrelations.length).toBeGreaterThan(0);
        expect(item.bnccCorrelations.length).toBeGreaterThan(0);
      });
    });

    test('Filtros do catálogo por programa e domínio devem operar corretamente', () => {
      const mathItems = InternationalExamRadarService.getCatalogItems({ domain: 'mathematics' });
      expect(mathItems.every(i => i.domain === 'mathematics')).toBe(true);

      const pisaReading = InternationalExamRadarService.getCatalogItems({
        program: 'PISA',
        domain: 'reading'
      });
      expect(pisaReading.length).toBeGreaterThanOrEqual(2);
      expect(pisaReading.every(i => i.program === 'PISA' && i.domain === 'reading')).toBe(true);

      const timssGrade8 = InternationalExamRadarService.getCatalogItems({
        program: 'TIMSS',
        targetGrade: '8th_grade'
      });
      expect(timssGrade8.length).toBeGreaterThanOrEqual(2);
      expect(timssGrade8.every(i => i.targetGrade === '8th_grade')).toBe(true);
    });
  });

  describe('2. Conversão e Harmonização das Escalas Internacionais', () => {
    test('Theta = 0.0 deve corresponder exatamente à média internacional de 500 pontos', () => {
      const pisaScore = InternationalExamRadarService.convertThetaToPisaScore(0.0);
      expect(pisaScore).toBe(500);

      const convertedTheta = InternationalExamRadarService.convertPisaScoreToTheta(500);
      expect(convertedTheta).toBe(0.0);
    });

    test('Conversão Theta <-> PISA deve ser bijetora e respeitar o desvio padrão de 100', () => {
      const thetaPlusOne = 1.0;
      const score = InternationalExamRadarService.convertThetaToPisaScore(thetaPlusOne);
      expect(score).toBe(600);

      const thetaMinusOne = -1.0;
      const scoreMinus = InternationalExamRadarService.convertThetaToPisaScore(thetaMinusOne);
      expect(scoreMinus).toBe(400);
    });

    test('Conversão direta SAEB <-> PISA deve satisfazer a relação métrica exata (PISA = 2 * SAEB)', () => {
      // SAEB 250 (média, theta=0) => PISA 500
      expect(InternationalExamRadarService.convertSaebToPisa(250)).toBe(500);
      expect(InternationalExamRadarService.convertPisaToSaeb(500)).toBe(250);

      // SAEB 300 (theta = +1.0) => PISA 600
      expect(InternationalExamRadarService.convertSaebToPisa(300)).toBe(600);
      expect(InternationalExamRadarService.convertPisaToSaeb(600)).toBe(300);

      // SAEB 200 (theta = -1.0) => PISA 400
      expect(InternationalExamRadarService.convertSaebToPisa(200)).toBe(400);
      expect(InternationalExamRadarService.convertPisaToSaeb(400)).toBe(200);
    });

    test('Conversão ENEM <-> PISA deve preservar escores na escala padrão (M=500, SD=100)', () => {
      expect(InternationalExamRadarService.convertEnemToPisa(720)).toBe(720);
      expect(InternationalExamRadarService.convertEnemToPisa(450)).toBe(450);
    });
  });

  describe('3. Classificação dos Níveis de Proficiência PISA (OCDE) e Benchmarks TIMSS (IEA)', () => {
    test('Classificação correta dos Níveis PISA (1 a 6) e Limiar de Base OCDE (Nível 2)', () => {
      expect(InternationalExamRadarService.classifyPisaProficiencyLevel(340)).toBe('BELOW_LEVEL_1');
      expect(InternationalExamRadarService.classifyPisaProficiencyLevel(390)).toBe('LEVEL_1');
      expect(InternationalExamRadarService.classifyPisaProficiencyLevel(420)).toBe('LEVEL_2'); // Limiar exato
      expect(InternationalExamRadarService.classifyPisaProficiencyLevel(500)).toBe('LEVEL_3');
      expect(InternationalExamRadarService.classifyPisaProficiencyLevel(580)).toBe('LEVEL_4');
      expect(InternationalExamRadarService.classifyPisaProficiencyLevel(630)).toBe('LEVEL_5');
      expect(InternationalExamRadarService.classifyPisaProficiencyLevel(700)).toBe('LEVEL_6');
    });

    test('Classificação correta dos Benchmarks Internacionais do TIMSS', () => {
      expect(InternationalExamRadarService.classifyTimssBenchmark(380)).toBe('BELOW_LOW');
      expect(InternationalExamRadarService.classifyTimssBenchmark(450)).toBe('LOW');
      expect(InternationalExamRadarService.classifyTimssBenchmark(500)).toBe('INTERMEDIATE');
      expect(InternationalExamRadarService.classifyTimssBenchmark(590)).toBe('HIGH');
      expect(InternationalExamRadarService.classifyTimssBenchmark(650)).toBe('ADVANCED');
    });
  });

  describe('4. Conversão Unificada e Diagnóstico Formativo Internacional', () => {
    test('Conversão unificada para aluno no topo internacional (Theta = +1.8)', () => {
      const result = InternationalExamRadarService.performUnifiedScaleConversion(1.8);

      expect(result.pisaScore).toBe(680);
      expect(result.timssScore).toBe(680);
      expect(result.pisaProficiencyLevel).toBe('LEVEL_6');
      expect(result.timssBenchmark).toBe('ADVANCED');
      expect(result.isOecdBaselineMet).toBe(true);
      expect(result.saebScore).toBe(340);
      expect(result.enemScore).toBe(680);
      expect(result.comparativeVerdict).toContain('Padrão de Excelência Global');
    });

    test('Conversão unificada para aluno abaixo da linha de base da OCDE (Theta = -1.2)', () => {
      const result = InternationalExamRadarService.performUnifiedScaleConversion(-1.2);

      expect(result.pisaScore).toBe(380);
      expect(result.pisaProficiencyLevel).toBe('LEVEL_1');
      expect(result.isOecdBaselineMet).toBe(false);
      expect(result.saebScore).toBe(190);
      expect(result.comparativeVerdict).toContain('Alerta Pedagógico Crítico');
    });

    test('Geração de relatório diagnóstico comparativo com lacunas contra a média OCDE e Brasil', () => {
      const diag = InternationalExamRadarService.generateInternationalDiagnostic(
        'ALUNO-EDGE-001',
        -0.8,
        ['D14', 'D01_LP']
      );

      expect(diag.studentOrGroupIdentifier).toBe('ALUNO-EDGE-001');
      expect(diag.pisaScore).toBe(420); // 500 - 80 = 420 (Nível 2 exato)
      expect(diag.pisaLevel).toBe('LEVEL_2');
      expect(diag.isOecdBaselineMet).toBe(true);
      expect(diag.gapToOecdAverage).toBe(-80); // 420 - 500
      expect(diag.gapToBrazilAveragePisa).toBe(30); // 420 - 390
      expect(diag.recommendedFocusAreas.length).toBe(2);
      expect(diag.recommendedFocusAreas[0]).toContain('MATHEMATICS');
      expect(diag.recommendedFocusAreas[1]).toContain('READING');
    });
  });

  describe('5. Mapeamento Pedagógico Cruzado (SAEB / BNCC -> PISA / TIMSS)', () => {
    test('Descritores SAEB de Matemática devem mapear para competências do PISA', () => {
      const d14Mapping = InternationalExamRadarService.getCrosswalkMapping('D14');
      expect(d14Mapping).not.toBeNull();
      expect(d14Mapping!.internationalDomain).toBe('mathematics');
      expect(d14Mapping!.pisaCompetency).toContain('Quantity');
      expect(d14Mapping!.correlatedBnccCodes).toContain('EM13MAT101');

      const d20Mapping = InternationalExamRadarService.getCrosswalkMapping('D20');
      expect(d20Mapping!.pisaCompetency).toContain('Change and Relationships');
    });

    test('Descritores SAEB de Leitura devem mapear para competências de leitura do PISA', () => {
      const d01Lp = InternationalExamRadarService.getCrosswalkMapping('D01_LP');
      expect(d01Lp).not.toBeNull();
      expect(d01Lp!.internationalDomain).toBe('reading');
      expect(d01Lp!.pisaCompetency).toContain('Access and Retrieve');

      const d14Lp = InternationalExamRadarService.getCrosswalkMapping('D14_LP');
      expect(d14Lp!.pisaCompetency).toContain('Evaluate and Reflect');
    });

    test('Descritor desconhecido deve retornar null com segurança sem quebrar execução', () => {
      const unk = InternationalExamRadarService.getCrosswalkMapping('D999_INEXISTENTE');
      expect(unk).toBeNull();
    });
  });
});
