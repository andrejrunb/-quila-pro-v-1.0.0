import { OmrCorrectionService, omrCorrectionService } from '../OmrCorrectionService';
import { colabGpuBridge } from '../ColabGpuBridge';
import { db, Database } from '../../../database/Database';

describe('OmrCorrectionService Unit Tests (Passos 141-146)', () => {
  let service: OmrCorrectionService;

  beforeAll(async () => {
    await db.initialize();
  });

  beforeEach(() => {
    service = OmrCorrectionService.getInstance();
    jest.clearAllMocks();
  });

  test('Deve ser um Singleton retornando a mesma instância', () => {
    const a = OmrCorrectionService.getInstance();
    const b = OmrCorrectionService.getInstance();
    expect(a).toBe(b);
    expect(a).toBe(omrCorrectionService);
  });

  test('Deve criar e persistir um template de prova com gabarito oficial', async () => {
    const dbInstance = Database.getInstance();
    const createSpy = jest.spyOn(dbInstance, 'createOmrTemplate').mockResolvedValue('omr_tpl_123');

    const templateId = await service.createTemplate({
      title: 'Avaliação Trimestral de Matemática',
      totalQuestions: 5,
      answerKey: { '1': 'A', '2': 'B', '3': 'C', '4': 'D', '5': 'E' },
      weights: { '1': 2.0, '2': 2.0, '3': 2.0, '4': 2.0, '5': 2.0 },
    });

    expect(templateId).toBe('omr_tpl_123');
    expect(createSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Avaliação Trimestral de Matemática',
        totalQuestions: 5,
      })
    );
  });

  test('Deve lançar erro ao corrigir exame com template inexistente', async () => {
    const dbInstance = Database.getInstance();
    jest.spyOn(dbInstance, 'getOmrTemplate').mockResolvedValue(null);

    await expect(
      service.correctExam({
        templateId: 'tpl_nao_existe',
        imageBuffer: Buffer.from('fake_image_data'),
      })
    ).rejects.toThrow('não encontrado');
  });

  test('Deve processar e calcular nota via Colab GPU quando online', async () => {
    const dbInstance = Database.getInstance();
    jest.spyOn(dbInstance, 'getOmrTemplate').mockResolvedValue({
      id: 'omr_tpl_simulado',
      title: 'Simulado ENEM',
      totalQuestions: 3,
      optionsCount: 5,
      answerKey: { '1': 'A', '2': 'B', '3': 'C' },
      weights: { '1': 1.0, '2': 1.0, '3': 1.0 },
    });
    jest.spyOn(dbInstance, 'saveOmrCorrection').mockResolvedValue('omr_cor_abc');

    // Simular Colab Online
    jest.spyOn(colabGpuBridge, 'getStatus').mockReturnValue({
      online: true,
      url: 'https://colab-gpu.trycloudflare.com',
      health: null,
      stats: { requests: 1, errors: 0 },
    });

    jest.spyOn(colabGpuBridge, 'scanOmr').mockResolvedValue({
      total_detected: 3,
      answers: { '1': 'A', '2': 'B', '3': 'E' }, // acertou 1 e 2, errou 3
      confidence_avg: 0.98,
      processing_time_ms: 120,
    });

    const report = await service.correctExam({
      templateId: 'omr_tpl_simulado',
      imageBuffer: Buffer.from('omr_scan_test'),
      studentId: 'stud_123',
      studentName: 'Ana Souza',
    });

    expect(report).toBeDefined();
    expect(report.score).toBe(2);
    expect(report.totalPoints).toBe(3);
    expect(report.accuracyPct).toBe(66.67);
    expect(report.questions).toHaveLength(3);
    expect(report.questions[0].isCorrect).toBe(true);
    expect(report.questions[1].isCorrect).toBe(true);
    expect(report.questions[2].isCorrect).toBe(false);
  });
});
