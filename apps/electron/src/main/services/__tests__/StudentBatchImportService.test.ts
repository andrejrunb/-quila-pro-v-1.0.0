/**
 * StudentBatchImportService.test.ts
 * ============================================================================
 * Bateria Formal de Testes Unitários e de Integração: Homologação AC-03
 * Pipeline Seguro de Importação de Matrículas da Secretaria Escolar.
 * 
 * Cobre rigorosamente os 12 cenários estritos em banco determinístico com rollback:
 *  1. Arquivo válido (prévia correta; gravação só pós-confirmação)
 *  2. Coluna obrigatória ausente no cabeçalho (erro compreensível)
 *  3. Matrícula obrigatória vazia (rejeição na prévia e bloqueio)
 *  4. Matrícula duplicada no mesmo arquivo (conflito prévio intra-lote)
 *  5. Matrícula já cadastrada no banco com dados divergentes (conflito explícito)
 *  6. CPF malformado quando informado (validação matemática Módulo 11 da Receita Federal)
 *  7. Texto com aparência de SQL (tratado como dado puro parametrizado, sem injeção)
 *  8. Conteúdo perigoso para planilha (sanitização contra CWE-1236 Formula Injection)
 *  9. Falha durante gravação (Rollback real com zero alunos no banco e evento em zero_bypass_audits)
 * 10. Reenvio do mesmo lote (idempotência sem duplicação no banco)
 * 11. Usuário sem permissão (bloqueio por controle de acesso RBAC antes da gravação)
 * 12. Importação para outra escola (bloqueio por violação de isolamento multi-unidade)
 * ============================================================================
 */

import { StudentBatchImportService, validateCpfDigits, sanitizeCsvFormula } from '../StudentBatchImportService';
import { ZeroBypassAuditService } from '../ZeroBypassAuditService';

/**
 * StatefulMockDb determinístico que emula SQLite em memória com transações atômicas,
 * rollback confiável e isolamento de tabelas.
 */
class StatefulMockDatabase {
  public schools: any[] = [];
  public classes: any[] = [];
  public students: any[] = [];
  public audits: any[] = [];

  constructor() {
    this.reset();
  }

  public reset() {
    this.schools = [
      { id: 'school-aquila-main', name: 'Escola Modelo Áquila' },
      { id: 'school-unit-b', name: 'Escola Unidade B' },
    ];
    this.classes = [
      { id: 'class-9a', schoolId: 'school-aquila-main', name: '9º Ano A' },
      { id: 'class-1em-a', schoolId: 'school-aquila-main', name: '1º EM A' },
      { id: 'class-b-ext', schoolId: 'school-unit-b', name: 'Turma B Externa' },
    ];
    this.students = [];
    this.audits = [];
  }

  get db() {
    return this;
  }

  async transaction<T>(fn: () => Promise<T>): Promise<T> {
    const studentsSnapshot = JSON.parse(JSON.stringify(this.students));
    try {
      return await fn();
    } catch (err) {
      // Rollback real e atômico da tabela students
      this.students = studentsSnapshot;
      throw err;
    }
  }

  async run(sql: string, params: any[] = []): Promise<any> {
    const s = sql.trim().toUpperCase();

    if (s.startsWith('CREATE TABLE') || s.startsWith('ALTER TABLE') || s.startsWith('PRAGMA')) {
      return { changes: 0, lastInsertRowid: 0 };
    }

    if (s.includes('INSERT INTO STUDENTS')) {
      const [id, classId, name, registrationNumber, parentPhone, metadata] = params;
      const newStudent = {
        id,
        classId,
        name,
        registrationNumber,
        parentPhone,
        status: 'active',
        metadata: typeof metadata === 'string' ? metadata : JSON.stringify(metadata || {}),
      };
      this.students.push(newStudent);
      return { changes: 1, lastInsertRowid: this.students.length };
    }

    if (s.includes('INSERT INTO ZERO_BYPASS_AUDITS')) {
      const [userId, action, details, metadata, timestamp, previous_hash, hash, legal_basis, consent_verified] = params;
      const newAudit = {
        id: this.audits.length + 1,
        userId,
        action,
        details,
        metadata: typeof metadata === 'string' ? metadata : JSON.stringify(metadata || {}),
        timestamp,
        previous_hash,
        hash,
        legal_basis,
        consent_verified,
      };
      this.audits.push(newAudit);
      return { changes: 1, lastInsertRowid: newAudit.id };
    }

    return { changes: 1 };
  }

  async get<T = any>(sql: string, params: any[] = []): Promise<T | undefined> {
    const s = sql.trim().toUpperCase();

    if (s.includes('PRAGMA TABLE_INFO')) {
      return undefined;
    }

    if (s.includes('FROM ZERO_BYPASS_AUDITS')) {
      if (s.includes("ACTION = 'STUDENT_ENROLLMENT'") && s.includes('FALHA_IMPORTACAO_LOTE')) {
        const found = [...this.audits].reverse().find(
          a => a.action === 'STUDENT_ENROLLMENT' && a.details && a.details.includes('FALHA_IMPORTACAO_LOTE')
        );
        return found as T | undefined;
      }
      if (s.includes('ORDER BY ID DESC LIMIT 1')) {
        const last = this.audits[this.audits.length - 1];
        return last as T | undefined;
      }
    }

    if (s.includes('FROM SCHOOLS') && s.includes('COUNT(*)')) {
      return { count: this.schools.length } as any;
    }

    if (s.includes('FROM STUDENTS')) {
      if (s.includes('COUNT(*)')) {
        let count = 0;
        if (s.includes('REGISTRATIONNUMBER LIKE "MAT-2026-V%"') || s.includes("REGISTRATIONNUMBER LIKE 'MAT-2026-V%'")) {
          count = this.students.filter(st => st.registrationNumber && st.registrationNumber.startsWith('MAT-2026-V')).length;
        } else if (s.includes('REGISTRATIONNUMBER =')) {
          const match = sql.match(/registrationNumber\s*=\s*["']([^"']+)["']/i);
          const reg = match ? match[1] : (params && params[0]);
          count = this.students.filter(st => st.registrationNumber === reg).length;
        } else {
          count = this.students.length;
        }
        return { count } as any;
      }

      // SELECT de busca com JOIN de classes
      if (s.includes('S.REGISTRATIONNUMBER = ? OR S.ID = ?') || s.includes('WHERE S.REGISTRATIONNUMBER =') || s.includes('WHERE REGISTRATIONNUMBER =')) {
        const reg = (params && params[0]) || (sql.match(/registrationNumber\s*=\s*["']([^"']+)["']/i)?.[1]);
        const found = this.students.find(st => st.registrationNumber === reg || st.id === reg);
        if (found) {
          const matchedClass = this.classes.find(c => c.id === found.classId);
          return {
            ...found,
            schoolId: matchedClass?.schoolId || 'school-aquila-main',
          } as any;
        }
        return undefined;
      }
    }

    return undefined;
  }

  async all<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    const s = sql.trim().toUpperCase();

    if (s.includes('PRAGMA TABLE_INFO(ZERO_BYPASS_AUDITS)')) {
      return [
        { name: 'id' },
        { name: 'userId' },
        { name: 'action' },
        { name: 'details' },
        { name: 'metadata' },
        { name: 'timestamp' },
        { name: 'previous_hash' },
        { name: 'hash' },
        { name: 'legal_basis' },
        { name: 'consent_verified' },
      ] as any;
    }

    if (s.includes('FROM CLASSES')) {
      return [...this.classes] as any;
    }

    if (s.includes('FROM STUDENTS')) {
      if (s.includes('REGISTRATIONNUMBER LIKE "MAT-ROLLBACK-%"') || s.includes("REGISTRATIONNUMBER LIKE 'MAT-ROLLBACK-%'")) {
        return this.students.filter(st => st.registrationNumber && st.registrationNumber.startsWith('MAT-ROLLBACK-')) as any;
      }
      return [...this.students] as any;
    }

    return [];
  }
}

describe('StudentBatchImportService — Homologação AC-03 (12 Cenários Independentes)', () => {
  let db: StatefulMockDatabase;
  let importService: StudentBatchImportService;

  beforeEach(async () => {
    ZeroBypassAuditService.resetInstance();
    db = new StatefulMockDatabase();

    const audit = ZeroBypassAuditService.getInstance(db);
    await audit.initialize();

    importService = new StudentBatchImportService(db as any);
  });

  // --------------------------------------------------------------------------
  // Cenário 1: Arquivo válido (prévia correta; gravação só pós-confirmação)
  // --------------------------------------------------------------------------
  test('Cenário 1: Arquivo válido — prévia correta e persistência realizada unicamente pós-confirmação', async () => {
    const validBatch = [
      {
        enrollmentId: 'MAT-2026-V01',
        fullName: 'Lucas Fernandes Oliveira',
        className: '9º Ano A',
        guardianName: 'Eduardo Oliveira',
        guardianContact: 'eduardo@teste.com',
        birthDate: '2010-04-12',
      },
      {
        enrollmentId: 'MAT-2026-V02',
        fullName: 'Beatriz Vasconcelos Ramos',
        className: '9º Ano A',
        guardianName: 'Helena Ramos',
        guardianContact: 'helena@teste.com',
        birthDate: '15/08/2010',
      },
    ];

    // ETAPA 1 & 2: Geração da Prévia
    const preview = await importService.generatePreview(validBatch);
    expect(preview.totalRows).toBe(2);
    expect(preview.validRowsCount).toBe(2);
    expect(preview.invalidRowsCount).toBe(0);
    expect(preview.errors.length).toBe(0);
    expect(preview.canProceedToConfirm).toBe(true);

    // Verificação estrita: NENHUM aluno deve ter sido gravado antes da confirmação
    const countBeforeConfirm = await db.get<any>('SELECT COUNT(*) as count FROM students WHERE registrationNumber LIKE "MAT-2026-V%"');
    expect(countBeforeConfirm?.count).toBe(0);

    // ETAPA 4 & 5: Confirmação formal
    const result = await importService.confirmImport(preview.batchId, 'operador_secretaria_01', {
      schoolId: 'school-aquila-main',
      operatorRole: 'secretaria',
    });

    expect(result.success).toBe(true);
    expect(result.insertedCount).toBe(2);
    expect(result.ignoredCount).toBe(0);

    // Agora sim os alunos devem existir no banco
    const countAfterConfirm = await db.get<any>('SELECT COUNT(*) as count FROM students WHERE registrationNumber LIKE "MAT-2026-V%"');
    expect(countAfterConfirm?.count).toBe(2);
  });

  // --------------------------------------------------------------------------
  // Cenário 2: Coluna obrigatória ausente no cabeçalho (erro compreensível)
  // --------------------------------------------------------------------------
  test('Cenário 2: Coluna obrigatória ausente — detecção clara no cabeçalho CSV', () => {
    // CSV com coluna 'matricula' ausente intencionalmente
    const csvMissingEnrollment = `nome;turma;responsavel_legal;telefone_responsavel
Lucas Fernandes;9º Ano A;Eduardo Oliveira;11999998888`;

    const validation = importService.validateCsvHeaders(csvMissingEnrollment);
    expect(validation.valid).toBe(false);
    expect(validation.missingColumns).toContain('matricula');

    expect(() => {
      importService.parseCsv(csvMissingEnrollment);
    }).toThrow(/Coluna obrigatória ausente no cabeçalho do arquivo: matricula/);
  });

  // --------------------------------------------------------------------------
  // Cenário 3: Matrícula obrigatória vazia (rejeição na prévia e bloqueio)
  // --------------------------------------------------------------------------
  test('Cenário 3: Matrícula obrigatória vazia — linha rejeitada e bloqueio de confirmação', async () => {
    const batchWithEmptyEnrollment = [
      {
        enrollmentId: '   ', // Matrícula em branco
        fullName: 'Thiago Almeida Santos',
        className: '9º Ano A',
        guardianName: 'Marcos Almeida',
        guardianContact: 'marcos@teste.com',
      },
    ];

    const preview = await importService.generatePreview(batchWithEmptyEnrollment);
    expect(preview.validRowsCount).toBe(0);
    expect(preview.invalidRowsCount).toBe(1);
    expect(preview.canProceedToConfirm).toBe(false);
    expect(preview.errors.some(e => e.field === 'enrollmentId' && e.message.includes('obrigatória'))).toBe(true);

    // Tentativa forçada de confirmação deve ser rejeitada
    await expect(
      importService.confirmImport(preview.batchId, 'operador_admin')
    ).rejects.toThrow(/Não é permitido confirmar lote com erros pendentes/);
  });

  // --------------------------------------------------------------------------
  // Cenário 4: Matrícula duplicada no mesmo arquivo (conflito prévio)
  // --------------------------------------------------------------------------
  test('Cenário 4: Matrícula duplicada no mesmo arquivo — detectada como conflito intra-lote', async () => {
    const batchWithDuplicateInFile = [
      {
        enrollmentId: 'MAT-2026-DUP01',
        fullName: 'Mariana Costa Ribeiro',
        className: '9º Ano A',
        guardianName: 'Claudia Costa',
        guardianContact: 'claudia@teste.com',
      },
      {
        enrollmentId: 'MAT-2026-DUP01', // Mesma matrícula para outra linha
        fullName: 'Juliana Costa Ribeiro',
        className: '9º Ano A',
        guardianName: 'Claudia Costa',
        guardianContact: 'claudia@teste.com',
      },
    ];

    const preview = await importService.generatePreview(batchWithDuplicateInFile);
    expect(preview.duplicateInBatchCount).toBe(1);
    expect(preview.canProceedToConfirm).toBe(false);
    expect(preview.errors.some(e => e.message.includes('duplicada dentro do mesmo arquivo'))).toBe(true);
  });

  // --------------------------------------------------------------------------
  // Cenário 5: Matrícula já cadastrada no banco com dados divergentes
  // --------------------------------------------------------------------------
  test('Cenário 5: Matrícula já cadastrada com dados divergentes — conflito cadastral explícito', async () => {
    // Pré-cadastrar aluno existente
    await db.run(
      `INSERT INTO students (id, classId, name, registrationNumber, parentPhone, status, metadata)
       VALUES (?, ?, ?, ?, ?, 'active', ?)`,
      ['stu-mat-diverg-01', 'class-9a', 'Nome Antigo Original', 'MAT-DIVERG-01', '1188887777', '{}']
    );

    const divergentBatch = [
      {
        enrollmentId: 'MAT-DIVERG-01',
        fullName: 'Nome Totalmente Diferente Não Permitido',
        className: '9º Ano A',
        guardianName: 'Outro Responsável',
        guardianContact: 'outro@teste.com',
      },
    ];

    const preview = await importService.generatePreview(divergentBatch);
    expect(preview.canProceedToConfirm).toBe(false);
    expect(preview.errors.some(e => e.message.includes('Conflito cadastral') && e.message.includes('Nome Antigo Original'))).toBe(true);
  });

  // --------------------------------------------------------------------------
  // Cenário 6: CPF malformado quando informado (validação Módulo 11)
  // --------------------------------------------------------------------------
  test('Cenário 6: CPF malformado — validação algorítmica rigorosa (Módulo 11)', async () => {
    // 1. Testes unitários do algoritmo Módulo 11
    expect(validateCpfDigits('52998224725')).toBe(true); // CPF sintético matematicamente válido
    expect(validateCpfDigits('529.982.247-25')).toBe(true); // Com pontuação
    expect(validateCpfDigits('11111111111')).toBe(false); // Dígitos iguais repetidos
    expect(validateCpfDigits('12345678900')).toBe(false); // Dígitos verificadores incorretos
    expect(validateCpfDigits('123')).toBe(false); // Tamanho inválido

    // 2. Teste via serviço
    const batchWithInvalidCpf = [
      {
        enrollmentId: 'MAT-2026-CPF01',
        fullName: 'Gabriel Nunes Rocha',
        className: '9º Ano A',
        guardianName: 'Sandra Rocha',
        guardianContact: 'sandra@teste.com',
        cpf: '111.111.111-11', // Inválido
      },
    ];

    const previewInvalid = await importService.generatePreview(batchWithInvalidCpf);
    expect(previewInvalid.canProceedToConfirm).toBe(false);
    expect(previewInvalid.errors.some(e => e.field === 'cpf' && e.message.includes('matematicamente inválidos'))).toBe(true);

    const batchWithValidCpf = [
      {
        enrollmentId: 'MAT-2026-CPF02',
        fullName: 'Gabriel Nunes Rocha',
        className: '9º Ano A',
        guardianName: 'Sandra Rocha',
        guardianContact: 'sandra@teste.com',
        cpf: '529.982.247-25', // Válido
      },
    ];

    const previewValid = await importService.generatePreview(batchWithValidCpf);
    expect(previewValid.canProceedToConfirm).toBe(true);
    expect(previewValid.errors.length).toBe(0);
  });

  // --------------------------------------------------------------------------
  // Cenário 7: Texto com aparência de SQL (segurança contra SQL Injection)
  // --------------------------------------------------------------------------
  test('Cenário 7: Texto com aparência de SQL — tratado como dado literal sem injeção', async () => {
    const maliciousBatch = [
      {
        enrollmentId: 'MAT-2026-SQL01',
        fullName: "Robert'); DROP TABLE students; --",
        className: '9º Ano A',
        guardianName: "Parent'; DELETE FROM schools; --",
        guardianContact: 'malicious@teste.com',
      },
    ];

    const preview = await importService.generatePreview(maliciousBatch);
    expect(preview.canProceedToConfirm).toBe(true);

    const result = await importService.confirmImport(preview.batchId, 'operador_admin', {
      schoolId: 'school-aquila-main',
    });
    expect(result.success).toBe(true);

    // Tabela 'students' e tabela 'schools' devem continuar totalmente intactas
    const schoolCheck = await db.get<any>('SELECT COUNT(*) as count FROM schools');
    expect(schoolCheck?.count).toBeGreaterThanOrEqual(2);

    // O registro foi inserido com segurança preservando o texto exato
    const student = await db.get<any>('SELECT name, metadata FROM students WHERE registrationNumber = "MAT-2026-SQL01"');
    expect(student?.name).toBe("Robert'); DROP TABLE students; --");
  });

  // --------------------------------------------------------------------------
  // Cenário 8: Conteúdo perigoso para planilha (CWE-1236 Formula Injection)
  // --------------------------------------------------------------------------
  test('Cenário 8: Conteúdo perigoso para planilha — higienização contra CWE-1236', async () => {
    expect(sanitizeCsvFormula('=SUM(A1:A10)')).toBe("'=SUM(A1:A10)");
    expect(sanitizeCsvFormula('+123456')).toBe("'+123456");
    expect(sanitizeCsvFormula('-danger')).toBe("'-danger");
    expect(sanitizeCsvFormula('@hyperlink("cmd")')).toBe("'@hyperlink(\"cmd\")");
    expect(sanitizeCsvFormula('Nome Normal')).toBe('Nome Normal');

    const formulaBatch = [
      {
        enrollmentId: 'MAT-2026-CSV01',
        fullName: '=CMD("calc.exe") Aluno',
        className: '9º Ano A',
        guardianName: '+5511999999999 Pai',
        guardianContact: 'formula@teste.com',
      },
    ];

    const preview = await importService.generatePreview(formulaBatch);
    const result = await importService.confirmImport(preview.batchId, 'operador_admin');
    expect(result.success).toBe(true);

    const savedStudent = await db.get<any>('SELECT name, metadata FROM students WHERE registrationNumber = "MAT-2026-CSV01"');
    expect(savedStudent?.name).toBe('\'=CMD("calc.exe") Aluno');
    const parsedMetadata = JSON.parse(savedStudent.metadata);
    expect(parsedMetadata.guardianName).toBe('\'+5511999999999 Pai');
  });

  // --------------------------------------------------------------------------
  // Cenário 9: Falha durante gravação (Rollback real & Auditoria de Falha)
  // --------------------------------------------------------------------------
  test('Cenário 9: Falha durante gravação — Rollback real de alunos e registro em zero_bypass_audits', async () => {
    const batchToFail = [
      {
        enrollmentId: 'MAT-ROLLBACK-01',
        fullName: 'Primeiro Aluno Sucesso Provisório',
        className: '9º Ano A',
        guardianName: 'Responsavel A',
        guardianContact: 'respA@teste.com',
      },
      {
        enrollmentId: 'MAT-ROLLBACK-02-FORCED-ERROR',
        fullName: 'Segundo Aluno Quebrador',
        className: '9º Ano A',
        guardianName: 'Responsavel B',
        guardianContact: 'respB@teste.com',
      },
    ];

    const preview = await importService.generatePreview(batchToFail);
    expect(preview.canProceedToConfirm).toBe(true);

    // Interceptar db.run para forçar falha unicamente na segunda inserção de estudante
    const originalRun = db.run.bind(db);
    jest.spyOn(db, 'run').mockImplementation(async (sql: string, params: any[] = []) => {
      if (sql.includes('INSERT INTO students') && params.some(p => String(p).includes('MAT-ROLLBACK-02-FORCED-ERROR'))) {
        throw new Error('SIMULATED_SQLITE_IO_DISK_FULL');
      }
      return originalRun(sql, params);
    });

    // A chamada deve falhar e estourar a exceção
    await expect(
      importService.confirmImport(preview.batchId, 'operador_secretaria_01')
    ).rejects.toThrow('SIMULATED_SQLITE_IO_DISK_FULL');

    // Restaurar mock
    jest.restoreAllMocks();

    // 1. Prova do Rollback: NENHUM aluno do lote deve ter sido persistido na tabela students!
    const studentsAfterRollback = await db.all<any>(
      'SELECT id, registrationNumber FROM students WHERE registrationNumber LIKE "MAT-ROLLBACK-%"'
    );
    expect(studentsAfterRollback.length).toBe(0);

    // 2. Prova da Auditoria: O evento de falha com ROLLBACK_EXECUTED DEVE existir em zero_bypass_audits!
    const auditFailure = await db.get<any>(
      `SELECT action, details, metadata FROM zero_bypass_audits 
       WHERE action = 'STUDENT_ENROLLMENT' AND details LIKE '%FALHA_IMPORTACAO_LOTE%' 
       ORDER BY id DESC LIMIT 1`
    );
    expect(auditFailure).toBeDefined();
    expect(auditFailure.details).toContain('Rollback executado');
    expect(auditFailure.details).toContain('SIMULATED_SQLITE_IO_DISK_FULL');
    const auditMeta = JSON.parse(auditFailure.metadata);
    expect(auditMeta.status).toBe('ROLLBACK_EXECUTED');
  });

  // --------------------------------------------------------------------------
  // Cenário 10: Reenvio do mesmo lote (Idempotência sem duplicação)
  // --------------------------------------------------------------------------
  test('Cenário 10: Reenvio do mesmo lote — idempotência estrita sem duplicação no banco', async () => {
    const idempotentBatch = [
      {
        enrollmentId: 'MAT-2026-IDEM01',
        fullName: 'Felipe Alcantara Castro',
        className: '9º Ano A',
        guardianName: 'Marcos Castro',
        guardianContact: 'marcos@castro.com',
      },
    ];

    // Primeira importação
    const preview1 = await importService.generatePreview(idempotentBatch);
    const result1 = await importService.confirmImport(preview1.batchId, 'operador_admin');
    expect(result1.insertedCount).toBe(1);
    expect(result1.ignoredCount).toBe(0);

    const countFirst = await db.get<any>('SELECT COUNT(*) as count FROM students WHERE registrationNumber = "MAT-2026-IDEM01"');
    expect(countFirst?.count).toBe(1);

    // Segunda importação idêntica (Reenvio)
    const preview2 = await importService.generatePreview(idempotentBatch);
    expect(preview2.canProceedToConfirm).toBe(true);
    expect(preview2.alreadyEnrolledCount).toBe(1);

    const result2 = await importService.confirmImport(preview2.batchId, 'operador_admin');
    expect(result2.insertedCount).toBe(0);
    expect(result2.ignoredCount).toBe(1);

    // A contagem no banco deve permanecer exatamente 1
    const countSecond = await db.get<any>('SELECT COUNT(*) as count FROM students WHERE registrationNumber = "MAT-2026-IDEM01"');
    expect(countSecond?.count).toBe(1);
  });

  // --------------------------------------------------------------------------
  // Cenário 11: Usuário sem permissão (Controle RBAC)
  // --------------------------------------------------------------------------
  test('Cenário 11: Usuário sem permissão — bloqueio por RBAC antes de qualquer mutação', async () => {
    const batchRbac = [
      {
        enrollmentId: 'MAT-2026-RBAC01',
        fullName: 'Samira Haddad Costa',
        className: '9º Ano A',
        guardianName: 'Munir Haddad',
        guardianContact: 'munir@teste.com',
      },
    ];

    const preview = await importService.generatePreview(batchRbac);
    expect(preview.canProceedToConfirm).toBe(true);

    // Usuário com perfil 'aluno' ou 'visitante' tenta confirmar a importação
    await expect(
      importService.confirmImport(preview.batchId, 'aluno_curioso_99', {
        schoolId: 'school-aquila-main',
        operatorRole: 'visitante',
      })
    ).rejects.toThrow(/Acesso negado: operador 'aluno_curioso_99' com perfil 'visitante' não possui permissão/);

    // Zero registros inseridos
    const checkDb = await db.get<any>('SELECT COUNT(*) as count FROM students WHERE registrationNumber = "MAT-2026-RBAC01"');
    expect(checkDb?.count).toBe(0);
  });

  // --------------------------------------------------------------------------
  // Cenário 12: Importação para outra escola (Isolamento Multi-Unidade)
  // --------------------------------------------------------------------------
  test('Cenário 12: Importação para outra escola — isolamento multi-unidade garantido', async () => {
    // Turma 'Turma B Externa' pertence à escola 'school-unit-b'
    const crossSchoolBatch = [
      {
        enrollmentId: 'MAT-2026-CROSS01',
        fullName: 'Estudante Unidade B',
        className: 'Turma B Externa',
        guardianName: 'Responsavel B',
        guardianContact: 'respB@teste.com',
      },
    ];

    // Tentativa de importar na escola 'school-aquila-main' referenciando turma de outra unidade
    const preview = await importService.generatePreview(crossSchoolBatch, {
      schoolId: 'school-aquila-main',
    });

    expect(preview.canProceedToConfirm).toBe(false);
    expect(preview.errors.some(e => e.message.includes('pertence a outra unidade escolar'))).toBe(true);
  });
});
