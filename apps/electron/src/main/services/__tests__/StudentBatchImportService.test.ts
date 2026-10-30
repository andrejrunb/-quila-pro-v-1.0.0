import { StudentBatchImportService } from '../StudentBatchImportService';
import Database from '../../../database/Database';

describe('StudentBatchImportService (5-Stage Safe Enrollment Pipeline)', () => {
  let importService: StudentBatchImportService;
  let db: any;

  beforeEach(async () => {
    db = new Database(':memory:');
    await db.initialize();
    await db.run("INSERT OR IGNORE INTO schools (id, name) VALUES ('school-aquila-main', 'Escola Teste')");
    await db.run("INSERT OR IGNORE INTO classes (id, schoolId, name) VALUES ('class-9a', 'school-aquila-main', '9º Ano A')");
    await db.run("INSERT OR IGNORE INTO classes (id, schoolId, name) VALUES ('class-1em-a', 'school-aquila-main', '1º EM A')");
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

    // Reimportação idêntica (idempotência): simular registros já persistidos no banco
    jest.spyOn(db, 'get').mockImplementation(async (_sql: any, params: any = []) => {
      const reg = params && params[0];
      const matched = validBatch.find((b) => b.enrollmentId === reg);
      if (matched) {
        return {
          id: `stu-${matched.enrollmentId}`,
          name: matched.fullName,
          classId: 'class-1em-a',
          registrationNumber: matched.enrollmentId,
          schoolId: 'school-aquila-main',
        };
      }
      return undefined;
    });

    const preview2 = await importService.generatePreview(validBatch);
    expect(preview2.canProceedToConfirm).toBe(true);
    expect(preview2.alreadyEnrolledCount).toBe(2);

    const result2 = await importService.confirmImport(preview2.batchId, 'operador_secretaria_01');
    expect(result2.success).toBe(true);
    expect(result2.insertedCount).toBe(0);
    expect(result2.ignoredCount).toBe(2);
  });

  test('Stage 2: Should flag conflict when enrollment exists with divergent name', async () => {
    // Simular registro existente
    jest.spyOn(db, 'get').mockResolvedValueOnce({
      id: 'stu-mat-2026-999',
      name: 'Nome Existente Antigo',
      classId: 'class-9a',
      registrationNumber: 'MAT-2026-999',
      schoolId: 'school-aquila-main'
    });

    const divergentBatch = [
      {
        enrollmentId: 'MAT-2026-999',
        fullName: 'Nome Totalmente Diferente',
        className: '9º Ano A',
        guardianName: 'Responsavel',
        guardianContact: 'contato@email.com',
      }
    ];

    const preview = await importService.generatePreview(divergentBatch);
    expect(preview.canProceedToConfirm).toBe(false);
    expect(preview.errors.some(e => e.message.includes('Conflito cadastral'))).toBe(true);
  });
});
