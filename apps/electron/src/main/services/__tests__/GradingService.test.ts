import { GradingService, GradeRecord } from '../GradingService';
import Database from '../../../database/Database';

describe('GradingService (Zero-Mock Deterministic Pedagogical Evaluation)', () => {
  let gradingService: GradingService;
  let db: any;

  beforeEach(() => {
    db = new Database(':memory:');
    gradingService = new GradingService(db);
  });

  test('evaluateSubmission should calculate exact score from answer key without mocks', () => {
    const answerKey = { 1: 'A', 2: 'B', 3: 'C', 4: 'D', 5: 'E' };
    const studentAnswers = { 1: 'A', 2: 'B', 3: 'C', 4: 'A', 5: 'E' }; // 4/5 acertos = 8.0

    const result = gradingService.evaluateSubmission(studentAnswers, answerKey, 10.0);

    expect(result.totalQuestions).toBe(5);
    expect(result.correctCount).toBe(4);
    expect(result.score).toBe(8.0);
    expect(result.details.find((d) => d.question === '4')?.correct).toBe(false);
    expect(result.details.find((d) => d.question === '1')?.correct).toBe(true);
  });

  test('processAnswerSheet must reject and require manual review when OCR is unavailable (Fail-Secure)', async () => {
    const result = await gradingService.processAnswerSheet('base64_image_data', 'aluno_101', 'template_prova_1');

    expect(result.success).toBe(false);
    expect(result.reason).toBe('OCR_SERVICE_UNAVAILABLE_MANUAL_REVIEW_REQUIRED');
  });

  test('processAnswerSheet with active engine should grade deterministically and record in grades', async () => {
    // Mock saveGrade para teste unitário
    jest.spyOn(gradingService, 'saveGrade').mockResolvedValue(undefined as any);

    const answerKey = { 1: 'A', 2: 'C', 3: 'D' };
    const detectedAnswers = { 1: 'A', 2: 'C', 3: 'D' }; // 3/3 acertos = 10.0

    const result = await gradingService.processAnswerSheet('base64_image', 'aluno_102', 'template_1', {
      ocrEngineReady: true,
      detectedAnswers,
      answerKey,
    });

    expect(result.success).toBe(true);
    expect(result.grade).toBe(10.0);
    expect(result.correctCount).toBe(3);
    expect(gradingService.saveGrade).toHaveBeenCalledTimes(1);
  });
});
