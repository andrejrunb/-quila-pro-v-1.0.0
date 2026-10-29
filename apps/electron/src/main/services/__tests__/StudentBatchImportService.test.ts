import { StudentBatchImportService } from '../StudentBatchImportService';
import Database from '../../../database/Database';

describe('StudentBatchImportService (5-Stage Safe Enrollment Pipeline)', () => {
  let importService: StudentBatchImportService;
  let db: any;

  beforeEach(() => {
    db = new Database(':memory:');
    importService = new StudentBatchImportService(db);
  });

  test('Stage 1 & 2: Preview should detect duplicate enrollments and missing mandatory fields', async () => {
    const rawBatch = [
      {
        enrollmentId: 'MAT-2026-001',
        fullName: 'Carlos Eduardo Santos',
        className: '9º Ano A',
        guardianName: 'Marcos Santos',
        guardianContact: 'marcos@email.com',
      },
      {
        enrollmentId: 'MAT-2026-001', // Duplicada no mesmo lote!
        fullName: 'Outro Aluno Repetido',
        className: '9º Ano A',
        guardianName: 'Maria Repetida',
        guardianContact: 'maria@email.com',
      },
      {
        enrollmentId: '', // Matrícula vazia!
        fullName: 'Sem Matricula',
        className: '9º Ano A',
        guardianName: 'Pai Sem Matricula',
        guardianContact: 'pai@email.com',
      },
      {
        enrollmentId: 'MAT-2026-002',
        fullName: 'Mariana', // Apenas 1 nome (sem sobrenome)
        className: '9º Ano A',
        guardianName: 'Luciana',
        guardianContact: 'luciana@email.com',
      },
      {
        enrollmentId: 'MAT-2026-003',
        fullName: 'Julia Mendes',
        className: '9º Ano A',
        guardianName: '', // Sem responsável legal
        guardianContact: '99999999',
      },
    ];

    const preview = await importService.generatePreview(rawBatch);

    expect(preview.totalRows).toBe(5);
    expect(preview.validRowsCount).toBe(1);
    expect(preview.invalidRowsCount).toBe(4);
    expect(preview.duplicateInBatchCount).toBe(1);
    expect(preview.canProceedToConfirm).toBe(false);

    // Dossiê de erros deve apontar as linhas e campos exatos
    const errorFields = preview.errors.map((e) => e.field);
    expect(errorFields).toContain('enrollmentId');
    expect(errorFields).toContain('fullName');
    expect(errorFields).toContain('guardianName');
  });

  test('Stage 4 & 5: Valid batch should allow confirmation and execute idempotent persistence', async () => {
    const validBatch = [
      {
        enrollmentId: 'MAT-2026-101',
        fullName: 'Ana Clara Lima',
        className: '1º EM A',
        guardianName: 'Roberto Lima',
        guardianContact: 'roberto@email.com',
      },
      {
        enrollmentId: 'MAT-2026-102',
        fullName: 'Bruno Henrique Silva',
        className: '1º EM A',
        guardianName: 'Patricia Silva',
        guardianContact: 'patricia@email.com',
      },
    ];

    const preview = await importService.generatePreview(validBatch);
    expect(preview.canProceedToConfirm).toBe(true);
    expect(preview.errors.length).toBe(0);

    const result = await importService.confirmImport(preview.batchId, 'operador_secretaria_01');
    expect(result.success).toBe(true);
    expect(result.insertedCount).toBe(2);
    expect(result.idempotentVerificationHash).toBeDefined();
  });
});
