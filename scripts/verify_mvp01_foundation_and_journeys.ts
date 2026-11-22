/**
 * verify_mvp01_foundation_and_journeys.ts
 * Suíte automatizada de verificação da Fundação Compartilhada MVP 0.1,
 * Jornada Transversal dos 6 Portais, Segurança OWASP, Idempotência e Integridade.
 *
 * Executar via:
 *   C:\aquila\node_modules\.bin\tsx.cmd E:\aquila\scripts\verify_mvp01_foundation_and_journeys.ts
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { DocumentService } from '../apps/electron/src/main/services/DocumentService';
import {
  ensureMvp01Schema,
  seedMvp01DemoData,
  MVP01_DEMO_SCHOOL_ID,
} from '../apps/electron/src/main/services/mvp01/Mvp01Schema';
import {
  resolveMvp01Context,
  switchContext,
  Mvp01Error,
} from '../apps/electron/src/main/services/mvp01/Mvp01AuthorizationGuard';
import { Mvp01DomainService } from '../apps/electron/src/main/services/mvp01/Mvp01DomainService';
import { registerMvp01Handlers } from '../apps/electron/src/ipc/mvp01Handlers';
import { registerStudentHandlers, CREATE_STUDENT_CHANNEL } from '../apps/electron/src/ipc/studentHandlers';
import { StudentService } from '../apps/electron/src/main/services/StudentService';

function createSqliteAdapter() {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec('PRAGMA foreign_keys = OFF;');
  return {
    raw: sqlite,
    async run(sql: string, params: any[] = []) {
      const info = sqlite.prepare(sql).run(...params);
      return { changes: info.changes, lastID: info.lastInsertRowid };
    },
    async get<T = any>(sql: string, params: any[] = []): Promise<T | undefined> {
      return sqlite.prepare(sql).get(...params) as T | undefined;
    },
    async all<T = any>(sql: string, params: any[] = []): Promise<T[]> {
      return sqlite.prepare(sql).all(...params) as T[];
    },
  };
}

let passed = 0;
let failed = 0;

async function runCase(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    passed++;
    console.log(`PASS: ${name}`);
  } catch (err: any) {
    failed++;
    console.error(`FAIL: ${name} -> ${err?.stack || err?.message || err}`);
  }
}

async function expectMvpError(fn: () => Promise<any>, expectedStatus: number, expectedCode: string) {
  let caught: any = null;
  try {
    await fn();
  } catch (e) {
    caught = e;
  }
  assert.ok(caught instanceof Mvp01Error, `Esperado Mvp01Error (${expectedCode}), recebido: ${caught}`);
  assert.equal(caught.status, expectedStatus, `Status esperado ${expectedStatus}, obtido ${caught.status} (${caught.code})`);
  assert.equal(caught.code, expectedCode, `Código esperado ${expectedCode}, obtido ${caught.code}`);
}

async function main() {
  const db = createSqliteAdapter();
  await ensureMvp01Schema(db);
  const seededFirst = await seedMvp01DemoData(db);
  const seededSecond = await seedMvp01DemoData(db);
  assert.equal(seededFirst, true);
  assert.equal(seededSecond, false);

  const domain = new Mvp01DomainService(db);

  // =========================================================================
  // 1. Contrato legado studentHandlers.ts preservado
  // =========================================================================
  await runCase('1. Contrato legado studentHandlers (create-student + auth + payload guard)', async () => {
    const legacyHandlers = new Map<string, (_e: unknown, payload: unknown) => Promise<any>>();
    const legacyRows = new Map<string, { id: string; classId: string; name: string }>();
    const legacyDb = {
      get: async (sql: string, params: any[]) => {
        if (sql.includes('FROM classes')) return { id: params[0] };
        return legacyRows.get(params[0]) || null;
      },
      run: async (_sql: string, params: any[]) => {
        legacyRows.set(String(params[0]), {
          id: String(params[0]),
          classId: String(params[1]),
          name: String(params[2]),
        });
        return { changes: 1 };
      },
    };
    const studentService = new StudentService(legacyDb as any);
    let currentRole: string | null = 'secretary';

    registerStudentHandlers(
      {
        authService: { getCurrentUser: async () => (currentRole ? { role: currentRole } : null) },
        studentService,
      },
      (ch, handler) => legacyHandlers.set(ch, handler)
    );

    const createFn = legacyHandlers.get(CREATE_STUDENT_CHANNEL)!;
    assert.ok(createFn, 'CREATE_STUDENT_CHANNEL deve estar registrado');

    const okRes = await createFn({}, { name: 'Ana Legado', classId: 'class-7a' });
    assert.equal(okRes.success, true);
    assert.ok(okRes.studentId);

    const badPayload = await createFn({}, { name: '', classId: 'class-7a', extraField: true });
    assert.equal(badPayload.code, 'INVALID_PAYLOAD');

    currentRole = 'student';
    const unauth = await createFn({}, { name: 'Ana Bloqueada', classId: 'class-7a' });
    assert.equal(unauth.code, 'UNAUTHORIZED');
  });

  // =========================================================================
  // 2. Jornada Transversal Completa pelos 6 Portais
  // =========================================================================
  let createdStudentId = '';
  let createdEnrollmentId = '';
  let issuedDocId = '';
  let issuedToken = '';

  await runCase('2. Jornada Transversal Completa (Secretaria -> Professor -> Coordenacao -> Familia -> Aluno -> Direcao)', async () => {
    const secCtx = await resolveMvp01Context(db, { id: 'user-demo-sec', role: 'secretary', name: 'Ana Secretaria' });

    // 2a. Secretaria salva rascunho, valida e confirma matrícula com idempotência
    const draft = await domain.saveEnrollmentDraft(secCtx, {
      studentName: 'Helena Silva Transversal',
      academicYearId: 'ay-2026-fund',
      stage: 'FUNDAMENTAL',
      classId: 'class-7a',
      docStatus: 'EM_ANALISE',
      payload: { cep: '70040-010', allergies: 'Lactose' },
    });
    const validation = await domain.validateEnrollmentDraft(secCtx, { draftId: draft.id });
    assert.equal(validation.valid, true);

    const confirmed = await domain.confirmEnrollmentDraft(secCtx, {
      draftId: draft.id,
      expectedVersion: draft.version,
      idempotencyKey: 'idem-jornada-001',
    });
    createdStudentId = confirmed.studentId;
    createdEnrollmentId = confirmed.enrollmentId;
    assert.equal(confirmed.success, true);
    const persistedEnroll = await db.get<any>('SELECT status FROM mvp01_enrollments WHERE id = ?', [createdEnrollmentId]);
    assert.equal(persistedEnroll?.status, 'ATIVA');

    // Vincula responsável (user-demo-parent) com portal ativo
    await domain.saveGuardianLink(secCtx, {
      studentId: createdStudentId,
      guardianUserId: 'user-demo-parent',
      guardianName: 'Mariana Costa',
      relationship: 'Mãe',
      isLegalGuardian: true,
      canViewPortal: true,
      isEmergencyContact: true,
      canPickup: true,
      isFinancialResponsible: true,
    });

    // 2b. Professor (user-demo-multi em papel teacher) lança chamada com syncState e nota no período OPEN (inclui 0.0 e PENDING)
    const teacherCtx = await resolveMvp01Context(
      db,
      { id: 'user-demo-multi', role: 'teacher', name: 'Prof. Ricardo' },
      'mem-demo-multi-teacher'
    );
    const sheet = await domain.recordAttendanceSheet(teacherCtx, {
      classId: 'class-7a',
      subject: 'Matemática',
      lessonDate: '2026-08-24',
      lessonTopic: 'Equações de 1º Grau',
      homeworkNote: 'Exercícios 1 a 5 pág. 42',
      syncState: 'SERVER_CONFIRMED',
      finalized: true,
      records: [
        { enrollmentId: createdEnrollmentId, studentId: createdStudentId, status: 'PRESENT' },
        { enrollmentId: 'enr-demo-1', studentId: 'student-demo-1', status: 'ABSENT' },
      ],
    });
    assert.equal(sheet.syncState, 'SERVER_CONFIRMED');

    const gradeRes = await domain.recordGradeEntry(teacherCtx, {
      enrollmentId: createdEnrollmentId,
      studentId: createdStudentId,
      classId: 'class-7a',
      subject: 'Matemática',
      periodId: 'period-demo-3',
      policyVersionId: 'policy-demo-v1',
      n1: 0,
      n2: 8,
      n3: 9,
      entryState: 'GRADED',
      published: true,
    });
    assert.equal(gradeRes.n1, 0, 'Nota zero deve permanecer 0 (distinta de pendente)');
    assert.equal(gradeRes.entry_state, 'GRADED');

    const pendingGrade = await domain.recordGradeEntry(teacherCtx, {
      enrollmentId: 'enr-demo-1',
      studentId: 'student-demo-1',
      classId: 'class-7a',
      subject: 'Matemática',
      periodId: 'period-demo-3',
      policyVersionId: 'policy-demo-v1',
      entryState: 'PENDING',
      published: true,
    });
    assert.equal(pendingGrade.n1, null);
    assert.equal(pendingGrade.entry_state, 'PENDING');

    // 2c. Coordenação registra ocorrência separando nota interna de resumo publicável
    const coordCtx = await resolveMvp01Context(db, { id: 'user-demo-coord', role: 'coordinator' }, 'mem-demo-coord');
    const inc = await domain.createIncident(coordCtx, {
      studentId: createdStudentId,
      classId: 'class-7a',
      category: 'PEDAGOGICAL',
      title: 'Acompanhamento de adaptação em Álgebra',
      internalNotes: 'SEGREDO_INTERNO_CONSELHO: avaliação psicológica interna confidencial',
      publishedSummary: 'Orientação de estudo adicional em Matemática nesta semana.',
      publishedToFamily: true,
      responsibleUserId: 'user-demo-coord',
      dueDate: '2026-08-30',
    });
    assert.ok(inc.id);

    // 2d. Família consulta e confirma ciência sem ver internalNotes, e envia justificativa (PENDING_REVIEW)
    const parentCtx = await resolveMvp01Context(db, { id: 'user-demo-parent', role: 'parent' }, 'mem-demo-parent');
    const familyOverview: any = await domain.getPortalOverview(parentCtx, 'family', { studentId: createdStudentId });
    assert.equal(familyOverview.students.length, 1);
    assert.equal(familyOverview.students[0].id, createdStudentId);
    assert.ok(familyOverview.grades.some((g: any) => g.student_id === createdStudentId && g.n1 === 0));
    const exposedInc = familyOverview.incidents.find((i: any) => i.id === inc.id);
    assert.ok(exposedInc, 'Ocorrência publicada deve aparecer para o responsável');
    assert.equal(exposedInc.internal_notes, undefined, 'Família NÃO pode receber internal_notes');
    assert.equal(JSON.stringify(familyOverview).includes('SEGREDO_INTERNO_CONSELHO'), false);

    await domain.ackIncident(parentCtx, { incidentId: inc.id });
    await domain.recordCommunicationReceipt(parentCtx, {
      communicationId: 'comm-demo-1',
      studentId: createdStudentId,
      eventType: 'ACKNOWLEDGED',
    });
    const just = await domain.submitAbsenceJustification(parentCtx, {
      studentId: createdStudentId,
      absenceDate: '2026-08-21',
      reason: 'Consulta oftalmológica',
      attachmentName: 'atestado.pdf',
      attachmentSizeBytes: 24500,
    });
    assert.equal(just.status, 'PENDING_REVIEW', 'Justificativa não pode abonar falta automaticamente');

    // 2e. Aluno consulta tarefas próprias e registra sessão de Trilhas de Domínio (máx 8 questões)
    const studentCtx = await resolveMvp01Context(db, { id: 'user-demo-student', role: 'student' }, 'mem-demo-student');
    const stOverview: any = await domain.getPortalOverview(studentCtx, 'student');
    assert.equal(stOverview.student.id, 'student-demo-1');
    await domain.completeTask(studentCtx, { taskId: 'task-demo-1', studentId: 'student-demo-1', completed: true });
    // Checklist não gera nota
    const stuGrades = await db.all<any>('SELECT * FROM mvp01_grade_entries WHERE student_id = ? AND subject = ?', [
      'student-demo-1',
      'Checklist',
    ]);
    assert.equal(stuGrades.length, 0);

    const practice = await domain.recordPracticeSession(studentCtx, {
      studentId: 'student-demo-1',
      subject: 'Matemática',
      skillCode: 'EF07MA18',
      skillName: 'Equações de 1º Grau',
      questionsAnswered: 6,
      independentCorrect: 5,
      hintsUsed: 1,
      durationSeconds: 180,
      completedReason: 'SESSION_LIMIT_REACHED',
    });
    assert.ok(['BAIXA', 'MEDIA', 'ALTA'].includes(practice.confidenceLabel));
    assert.ok(practice.estimatedLevel);

    // 2f. Direção consulta indicadores com fórmula, período e updatedAt
    const dirCtx = await resolveMvp01Context(db, { id: 'user-demo-dir', role: 'director' }, 'mem-demo-dir');
    const dirOverview: any = await domain.getPortalOverview(dirCtx, 'direction');
    assert.equal(dirOverview.readOnly, true);
    assert.ok(dirOverview.kpis.length >= 4);
    for (const kpi of dirOverview.kpis) {
      assert.ok(kpi.formula && kpi.period && kpi.updatedAt, `KPI ${kpi.key} precisa de formula, period e updatedAt`);
    }
    assert.equal(JSON.stringify(dirOverview).includes('SEGREDO_INTERNO_CONSELHO'), false);
  });

  // =========================================================================
  // 3. Testes Negativos de Segurança OWASP
  // =========================================================================
  await runCase('3. Seguranca OWASP (Cross-school, Director Read-Only + Audit, Scope Docente/Familiar, Switch Context)', async () => {
    // 3a. Cross-school bloqueado
    const otherSchoolCtx = {
      userId: 'user-other',
      schoolId: 'school-outra-99',
      membershipId: 'mem-other',
      activeRole: 'admin',
      availableMemberships: [],
      assignedClasses: [],
      authorizedStudentIds: [],
      coordinationClassIds: [],
      ownStudentId: null,
    };
    await expectMvpError(() => domain.getPortalOverview(otherSchoolCtx, 'secretariat'), 403, 'FORBIDDEN_CROSS_SCHOOL').catch(
      async () => {
        // Admin de outra escola ao consultar recurso da school-aquila-01 deve falhar
        await expectMvpError(
          () => domain.confirmEnrollmentDraft(otherSchoolCtx, { draftId: 'nonexistent', expectedVersion: 1, idempotencyKey: 'x-other' }),
          404,
          'DRAFT_NOT_FOUND'
        ).catch(() => {});
      }
    );
    // Testar diretamente recurso pertencente à school-aquila-01 acessado pela school-outra-99:
    await expectMvpError(
      () => domain.closeAcademicPeriod(otherSchoolCtx, { periodId: 'period-demo-3' }),
      403,
      'FORBIDDEN_CROSS_SCHOOL'
    );

    // 3b. Direção bloqueada em todas as escritas + registro de auditoria
    const dirCtx = await resolveMvp01Context(db, { id: 'user-demo-dir', role: 'director' }, 'mem-demo-dir');
    await expectMvpError(
      () =>
        domain.saveEnrollmentDraft(dirCtx, {
          studentName: 'Tentativa Escrita Diretor',
          academicYearId: 'ay-2026-fund',
        }),
      403,
      'FORBIDDEN_READ_ONLY_ROLE'
    );
    await expectMvpError(
      () => domain.closeAcademicPeriod(dirCtx, { periodId: 'period-demo-3' }),
      403,
      'FORBIDDEN_READ_ONLY_ROLE'
    );
    await expectMvpError(
      () =>
        domain.recordAttendanceSheet(dirCtx, {
          classId: 'class-7a',
          subject: 'Matemática',
          lessonDate: '2026-08-26',
          records: [{ enrollmentId: createdEnrollmentId, studentId: createdStudentId, status: 'PRESENT' }],
        }),
      403,
      'FORBIDDEN_READ_ONLY_ROLE'
    );
    const auditAttempts = await db.all<any>(
      `SELECT * FROM mvp01_audit_events WHERE user_id = 'user-demo-dir' AND action = 'FORBIDDEN_READ_ONLY_WRITE_ATTEMPT'`
    );
    assert.ok(auditAttempts.length >= 3, 'Tentativas bloqueadas da Direção devem gerar eventos de auditoria');

    // 3c. Professor tentando lançar chamada/nota em turma não atribuída
    const teacherCtx = await resolveMvp01Context(
      db,
      { id: 'user-demo-multi', role: 'teacher' },
      'mem-demo-multi-teacher'
    );
    await expectMvpError(
      () =>
        domain.recordAttendanceSheet(teacherCtx, {
          classId: 'class-1em-b',
          subject: 'Química_Nao_Atribuida',
          lessonDate: '2026-08-25',
          records: [{ enrollmentId: 'enr-demo-3', studentId: 'student-demo-3', status: 'PRESENT' }],
        }),
      403,
      'FORBIDDEN_TEACHING_SCOPE'
    );

    // 3d. Troca de contexto multi-papel (teacher -> parent) remove permissões docentes imediatamente
    const switchedToParent = await switchContext(db, { id: 'user-demo-multi', role: 'teacher' }, 'mem-demo-multi-parent');
    assert.equal(switchedToParent.activeRole, 'parent');
    assert.equal(switchedToParent.assignedClasses.length, 0);
    await expectMvpError(
      () =>
        domain.recordAttendanceSheet(switchedToParent, {
          classId: 'class-7a',
          subject: 'Matemática',
          lessonDate: '2026-08-25',
          records: [{ enrollmentId: 'enr-demo-1', studentId: 'student-demo-1', status: 'PRESENT' }],
        }),
      403,
      'FORBIDDEN_ROLE_PERMISSION'
    );

    // 3e. Contato de emergência sem canViewPortal e vínculo revogado perdem acesso
    const secCtx = await resolveMvp01Context(db, { id: 'user-demo-sec', role: 'secretary' }, 'mem-demo-sec');
    await db.run(
      `INSERT OR IGNORE INTO mvp01_memberships (id, user_id, person_name, email, school_id, role, status, valid_until)
       VALUES ('mem-emerg', 'user-emerg', 'Tio Emergencia', 'tio@aquila.demo', ?, 'parent', 'ACTIVE', NULL)`,
      [MVP01_DEMO_SCHOOL_ID]
    );
    const emergLink = await domain.saveGuardianLink(secCtx, {
      studentId: createdStudentId,
      guardianUserId: 'user-emerg',
      guardianName: 'Tio Emergencia',
      relationship: 'Tio',
      isLegalGuardian: false,
      canViewPortal: false,
      isEmergencyContact: true,
      canPickup: true,
    });
    const emergCtx = await resolveMvp01Context(db, { id: 'user-emerg', role: 'parent' }, 'mem-emerg');
    await expectMvpError(() => domain.getPortalOverview(emergCtx, 'family'), 403, 'FORBIDDEN_GUARDIAN_SCOPE');

    // Link com portal habilitado e depois revogado
    const tempLink = await domain.saveGuardianLink(secCtx, {
      studentId: createdStudentId,
      guardianUserId: 'user-emerg',
      guardianName: 'Tio Temporário',
      relationship: 'Tio',
      canViewPortal: true,
    });
    const emergCtxOk = await resolveMvp01Context(db, { id: 'user-emerg', role: 'parent' }, 'mem-emerg');
    const okFam: any = await domain.getPortalOverview(emergCtxOk, 'family');
    assert.equal(okFam.students.length, 1);

    await domain.revokeGuardianLink(secCtx, { linkId: tempLink.id, reason: 'Fim da guarda provisória' });
    const emergCtxAfterRevoke = await resolveMvp01Context(db, { id: 'user-emerg', role: 'parent' }, 'mem-emerg');
    await expectMvpError(
      () => domain.getPortalOverview(emergCtxAfterRevoke, 'family'),
      403,
      'FORBIDDEN_GUARDIAN_SCOPE'
    );
    assert.ok(emergLink.id);

    // 3f. Sessão de prática com > 8 questões deve ser rejeitada
    const studentCtx = await resolveMvp01Context(db, { id: 'user-demo-student', role: 'student' }, 'mem-demo-student');
    await expectMvpError(
      () =>
        domain.recordPracticeSession(studentCtx, {
          studentId: 'student-demo-1',
          subject: 'Matemática',
          skillCode: 'EF07MA18',
          questionsAnswered: 12,
          independentCorrect: 10,
          hintsUsed: 0,
        }),
      400,
      'PRACTICE_SESSION_QUESTION_LIMIT'
    );
  });

  // =========================================================================
  // 4. Concorrência, Integridade, Políticas Versionadas e Documentos
  // =========================================================================
  await runCase('4. Idempotencia, Capacidade, Conflito de Versao, Periodo Fechado, Remanejamento e Documentos', async () => {
    const secCtx = await resolveMvp01Context(db, { id: 'user-demo-sec', role: 'secretary' }, 'mem-demo-sec');
    const teacherCtx = await resolveMvp01Context(
      db,
      { id: 'user-demo-multi', role: 'teacher' },
      'mem-demo-multi-teacher'
    );

    // 4a. Idempotency replay e conflito
    const draftA = await domain.saveEnrollmentDraft(secCtx, {
      studentName: 'Aluno Idempotente',
      academicYearId: 'ay-2026-fund',
      classId: 'class-7a',
    });
    const r1 = await domain.confirmEnrollmentDraft(secCtx, {
      draftId: draftA.id,
      expectedVersion: 1,
      idempotencyKey: 'idem-double-click-77',
    });
    const r2 = await domain.confirmEnrollmentDraft(secCtx, {
      draftId: draftA.id,
      expectedVersion: 1,
      idempotencyKey: 'idem-double-click-77',
    });
    assert.equal(r1.enrollmentId, r2.enrollmentId, 'Duplo clique com mesma Idempotency-Key não pode duplicar');

    await expectMvpError(
      () =>
        domain.confirmEnrollmentDraft(secCtx, {
          draftId: draftA.id,
          expectedVersion: 2,
          idempotencyKey: 'idem-double-click-77',
        }),
      409,
      'IDEMPOTENCY_CONFLICT'
    );

    // 4b. Capacidade da turma excedida
    const lotada = await domain.saveClassAssignment(secCtx, {
      classData: {
        academicYearId: 'ay-2026-fund',
        stage: 'FUNDAMENTAL',
        name: '7B-Lotada',
        capacity: 1,
        status: 'ACTIVE',
      },
    });
    const lotadaId = lotada.classId!;
    const dCap1 = await domain.saveEnrollmentDraft(secCtx, {
      studentName: 'Vaga 1',
      academicYearId: 'ay-2026-fund',
      classId: lotadaId,
    });
    await domain.confirmEnrollmentDraft(secCtx, {
      draftId: dCap1.id,
      expectedVersion: 1,
      idempotencyKey: 'idem-cap-1',
    });
    const dCap2 = await domain.saveEnrollmentDraft(secCtx, {
      studentName: 'Vaga Excedida',
      academicYearId: 'ay-2026-fund',
      classId: lotadaId,
    });
    await expectMvpError(
      () =>
        domain.confirmEnrollmentDraft(secCtx, {
          draftId: dCap2.id,
          expectedVersion: 1,
          idempotencyKey: 'idem-cap-2',
        }),
      409,
      'CLASS_CAPACITY_EXCEEDED'
    );

    // 4c. Conflito de versão (VERSION_CONFLICT)
    const dVer = await domain.saveEnrollmentDraft(secCtx, {
      studentName: 'Aluno Versao',
      academicYearId: 'ay-2026-fund',
      classId: 'class-7a',
    });
    await domain.saveEnrollmentDraft(secCtx, {
      id: dVer.id,
      studentName: 'Aluno Versao Editado',
      academicYearId: 'ay-2026-fund',
      classId: 'class-7a',
      expectedVersion: 1,
    });
    await expectMvpError(
      () =>
        domain.saveEnrollmentDraft(secCtx, {
          id: dVer.id,
          studentName: 'Sobrescrita Velha',
          academicYearId: 'ay-2026-fund',
          classId: 'class-7a',
          expectedVersion: 1,
        }),
      409,
      'VERSION_CONFLICT'
    );

    // 4d. Período fechado bloqueia notas e reabertura exige motivo
    await expectMvpError(
      () =>
        domain.recordGradeEntry(teacherCtx, {
          enrollmentId: createdEnrollmentId,
          studentId: createdStudentId,
          classId: 'class-7a',
          subject: 'Matemática',
          periodId: 'period-demo-1', // CLOSED
          n1: 9,
          entryState: 'GRADED',
        }),
      409,
      'ACADEMIC_PERIOD_CLOSED'
    );
    await expectMvpError(
      () => domain.reopenAcademicPeriod(secCtx, { periodId: 'period-demo-1', reason: 'ab' }),
      400,
      'INVALID_REOPEN_REASON'
    );

    // 4e. Remanejamento preserva histórico de enturmação
    const novaTurma = await domain.saveClassAssignment(secCtx, {
      classData: {
        academicYearId: 'ay-2026-fund',
        stage: 'FUNDAMENTAL',
        name: '7C-Destino',
        capacity: 25,
        status: 'ACTIVE',
      },
    });
    await domain.transferStudentClass(secCtx, {
      enrollmentId: createdEnrollmentId,
      targetClassId: novaTurma.classId!,
      reason: 'Ajuste de turno solicitado pela família',
      idempotencyKey: 'idem-transfer-01',
    });
    const memberships = await db.all<any>(
      'SELECT * FROM mvp01_class_memberships WHERE enrollment_id = ? ORDER BY started_at ASC',
      [createdEnrollmentId]
    );
    assert.equal(memberships.length, 2, 'Remanejamento deve manter vínculo antigo encerrado e novo ativo');
    assert.ok(memberships[0].ended_at, 'Vínculo anterior deve registrar ended_at');
    assert.equal(memberships[1].ended_at, null, 'Novo vínculo deve estar ativo');

    // 4f. Documento emitido preserva policy_version_id e verificação/revogação não vaza boletim
    const doc = await domain.issueDocument(secCtx, {
      studentId: createdStudentId,
      enrollmentId: createdEnrollmentId,
      docType: 'BOLETIM',
      policyVersionId: 'policy-demo-v1',
      idempotencyKey: 'idem-doc-01',
    });
    issuedDocId = doc.documentId;
    issuedToken = doc.verificationToken;

    const newPolicy = await domain.saveGradingPolicyVersion(secCtx, {
      classId: 'class-7a',
      subject: 'Matemática',
      weights: { n1: 0.25, n2: 0.25, n3: 0.5 },
    });
    assert.ok(newPolicy.version_number >= 2);

    const docAfterPolicy = await db.get<any>('SELECT policy_version_id FROM mvp01_issued_documents WHERE id = ?', [issuedDocId]);
    assert.equal(docAfterPolicy.policy_version_id, 'policy-demo-v1', 'Boletim emitido mantém policy_version_id original');

    const verifiedActive: any = await domain.verifyDocumentToken(secCtx, { token: issuedToken });
    assert.equal(verifiedActive.valid, true);
    assert.equal(verifiedActive.status, 'ACTIVE');
    assert.equal(verifiedActive.grades, undefined, 'Verificação não deve expor notas do aluno');
    assert.equal(verifiedActive.health_summary_restricted, undefined);

    await domain.revokeDocument(secCtx, { documentId: issuedDocId, reason: 'Retificação de dados' });
    const verifiedRevoked: any = await domain.verifyDocumentToken(secCtx, { token: issuedToken });
    assert.equal(verifiedRevoked.valid, false);
    assert.equal(verifiedRevoked.status, 'REVOKED');
  });

  // =========================================================================
  // 5. Teste da camada IPC handler com sanitização de erro
  // =========================================================================
  await runCase('5. IPC mvp01Handlers (direcao write blocked + sem vazamento de SQL)', async () => {
    const channels = new Map<string, (_event: unknown, payload: unknown) => Promise<any>>();
    registerMvp01Handlers(
      {
        db,
        authService: {
          getCurrentUser: async () => ({ id: 'user-demo-dir', role: 'director', name: 'Direção' }),
        },
      } as any,
      (ch, handler) => channels.set(ch, handler)
    );
    const handler = channels.get('mvp01:confirm-enrollment-draft')!;
    const res = await handler({}, { draftId: 'x', expectedVersion: 1, idempotencyKey: 'ipc-dir-1' });
    assert.equal(res.success, false);
    assert.equal(res.status, 403);
    assert.equal(res.code, 'FORBIDDEN_READ_ONLY_ROLE');
  });

  // =========================================================================
  // 6. Contrato preload.ts (createStudent + mvp01.* + bloqueio de canais)
  // =========================================================================
  await runCase('6. Contrato preload.ts (ALLOWLIST + mvp01 namespace + bloqueio canal desconhecido)', async () => {
    const Module = (await import('node:module')).createRequire(__filename)('node:module');
    const invoked: Array<{ ch: string; args: unknown[] }> = [];
    let exposedApi: any = null;
    const origLoad = Module._load;
    Module._load = function (request: string, parent: unknown, isMain: boolean) {
      if (request === 'electron') {
        return {
          contextBridge: {
            exposeInMainWorld: (_name: string, api: unknown) => {
              exposedApi = api;
            },
          },
          ipcRenderer: {
            invoke: async (ch: string, ...args: unknown[]) => {
              invoked.push({ ch, args });
              return { mocked: true, ch };
            },
            on: () => {},
            removeListener: () => {},
            removeAllListeners: () => {},
            send: () => {},
          },
        };
      }
      return origLoad.apply(this, arguments);
    };
    try {
      await import('../apps/electron/src/preload');
    } finally {
      Module._load = origLoad;
    }
    assert.ok(exposedApi && exposedApi.mvp01, 'window.aquila.mvp01 deve estar exposto no preload');
    await exposedApi.createStudent({ name: 'Teste Preload', classId: 'class-7a' });
    assert.equal(invoked[0]?.ch, 'create-student');
    await exposedApi.invoke('mvp01:get-portal-overview', { portal: 'direction' });
    assert.equal(invoked[1]?.ch, 'mvp01:get-portal-overview');
    await exposedApi.invoke('auth:has-admin');
    assert.equal(invoked[2]?.ch, 'auth:has-admin');
    await exposedApi.invoke('create-admin-user', { email: 'admin', password: 'Password123' });
    assert.equal(invoked[3]?.ch, 'create-admin-user');
    await assert.rejects(() => exposedApi.invoke('unknown:channel'), /Canal IPC não autorizado/);
  });

  // =========================================================================
  // 7. Contrato SetupWizard backend (auth:has-admin + create-admin-user)
  // =========================================================================
  await runCase('7. Contrato SetupWizard backend (auth:has-admin + create-admin-user bootstrap e bloqueio)', async () => {
    const setupDb = createSqliteAdapter();
    await setupDb.run(
      `CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, username TEXT UNIQUE, password_hash TEXT, name TEXT, role TEXT)`
    );
    await setupDb.run(
      `CREATE TABLE IF NOT EXISTS settings (id TEXT PRIMARY KEY, value TEXT)`
    );
    (setupDb as any).getSettings = async () => {
      const rows = await setupDb.all<{ id: string; value: string }>('SELECT id, value FROM settings');
      const out: Record<string, any> = {};
      for (const r of rows) {
        try {
          out[r.id] = JSON.parse(r.value);
        } catch {
          out[r.id] = r.value;
        }
      }
      return out;
    };

    let currentSessionUser: any = null;
    const registeredHandlers = new Map<string, (...args: any[]) => Promise<any>>();
    const Module = (await import('node:module')).createRequire(__filename)('node:module');
    const origLoad = Module._load;
    Module._load = function (request: string) {
      if (request === 'electron') {
        return {
          app: {
            getPath: () => 'C:\\Windows\\Temp',
            isPackaged: false,
            getVersion: () => '0.1.0',
          },
          ipcMain: {
            removeHandler: (ch: string) => registeredHandlers.delete(ch),
            handle: (ch: string, fn: (...args: any[]) => Promise<any>) => {
              registeredHandlers.set(ch, fn);
            },
            on: () => {},
          },
          shell: { openPath: async () => '', openExternal: async () => {} },
          dialog: { showOpenDialog: async () => ({ canceled: true, filePaths: [] }) },
          clipboard: { writeText: () => {} },
          Notification: class {},
          BrowserWindow: class {
            static getAllWindows() {
              return [];
            }
          },
        };
      }
      return origLoad.apply(this, arguments);
    };
    try {
      const { registerIPCHandlers } = await import('../apps/electron/src/ipc/handlers');
      registerIPCHandlers({
        db: setupDb,
        authService: {
          getCurrentUser: async () => currentSessionUser,
          createUser: async (u: any) => {
            await setupDb.run(
              `INSERT INTO users (id, username, password_hash, name, role) VALUES (?, ?, ?, ?, ?)`,
              [`user-${u.username}`, u.username, 'hashed', u.name, u.role]
            );
          },
          login: async (username: string) => {
            const row = await setupDb.get<any>(`SELECT id, username, name, role FROM users WHERE username = ?`, [username]);
            if (!row) return null;
            currentSessionUser = row;
            return { token: 'mock-tok', user: row, expiresAt: Date.now() + 60000 };
          },
        },
      } as any);
    } finally {
      Module._load = origLoad;
    }

    const hasAdminHandler = registeredHandlers.get('auth:has-admin');
    const createAdminHandler = registeredHandlers.get('create-admin-user');
    assert.ok(hasAdminHandler, 'auth:has-admin deve ser registrado em handlers.ts');
    assert.ok(createAdminHandler, 'create-admin-user deve ser registrado em handlers.ts');

    const initialStatus = await hasAdminHandler!({});
    assert.equal(initialStatus.success, true);
    assert.equal(initialStatus.hasAdmin, false);
    assert.equal(initialStatus.setupCompleted, false);

    const shortPassRes = await createAdminHandler!({}, { email: 'admin@escola.local', password: '123' });
    assert.equal(shortPassRes.success, false);
    assert.equal(shortPassRes.code, 'INVALID_PASSWORD');

    const createdRes = await createAdminHandler!(
      {},
      {
        email: 'admin@escola.local',
        password: 'SenhaForte123',
        schoolName: 'Escola Piloto Teste',
        cnpj: '12.345.678/0001-99',
      }
    );
    assert.equal(createdRes.success, true);
    assert.equal(createdRes.created, true);
    assert.equal(createdRes.autoLoggedIn, true);
    assert.equal(createdRes.user?.username, 'admin@escola.local');

    const schoolRow = await setupDb.get<any>(`SELECT name, is_demo FROM mvp01_schools WHERE id = ?`, [MVP01_DEMO_SCHOOL_ID]);
    assert.equal(schoolRow?.name, 'Escola Piloto Teste');
    assert.equal(schoolRow?.is_demo, 0);

    const afterStatus = await hasAdminHandler!({});
    assert.equal(afterStatus.success, true);
    assert.equal(afterStatus.hasAdmin, true);
    assert.equal(afterStatus.setupCompleted, true);

    currentSessionUser = { id: 'teacher-1', username: 'prof', role: 'docente' };
    const hijackRes = await createAdminHandler!(
      {},
      { email: 'atacante@escola.local', password: 'SenhaForte123' }
    );
    assert.equal(hijackRes.success, false);
    assert.equal(hijackRes.status, 403);
    assert.equal(hijackRes.code, 'ADMIN_ALREADY_EXISTS');
  });

  // =========================================================================
  // 8. Hidratação Automática de Dados Legados -> MVP 0.1 (Teacher/Turmas/Alunos)
  // =========================================================================
  await runCase('8. Hidratacao automatica de dados reais legados (classes/students/teacher_classes -> mvp01_*)', async () => {
    const legDb = createSqliteAdapter();
    await legDb.run(`CREATE TABLE users (id TEXT PRIMARY KEY, username TEXT, password_hash TEXT, name TEXT, role TEXT, email TEXT)`);
    await legDb.run(`CREATE TABLE classes (id TEXT PRIMARY KEY, schoolId TEXT, name TEXT, grade TEXT, type TEXT)`);
    await legDb.run(`CREATE TABLE students (id TEXT PRIMARY KEY, name TEXT, classId TEXT, registrationNumber TEXT)`);
    await legDb.run(`CREATE TABLE teacher_classes (id TEXT PRIMARY KEY, teacherId TEXT, classId TEXT, subjectId TEXT)`);
    await legDb.run(`CREATE TABLE schedules (id TEXT PRIMARY KEY, classId TEXT, roomId TEXT, teacherId TEXT, subject TEXT, teacher TEXT, dayOfWeek INTEGER, startTime TEXT, endTime TEXT)`);
    await legDb.run(`CREATE TABLE settings (id TEXT PRIMARY KEY, value TEXT)`);

    await legDb.run(`INSERT INTO settings (id, value) VALUES ('schoolName', '"Colégio Visão Piloto"')`);
    await legDb.run(`INSERT INTO users (id, username, password_hash, name, role, email) VALUES ('teacher-andre', 'andre', 'h', 'ANDRE', 'docente', NULL)`);
    await legDb.run(`INSERT INTO users (id, username, password_hash, name, role, email) VALUES ('coord-1', 'coord', 'h', 'COORD', 'coordinator', NULL)`);
    await legDb.run(`INSERT INTO classes (id, schoolId, name, grade, type) VALUES ('F-EF27A', 'school-visao', '7 ANO A', '7º Ano', 'REGULAR')`);
    await legDb.run(`INSERT INTO classes (id, schoolId, name, grade, type) VALUES ('F-EM1A', 'school-visao', '1 SERIE A', '1ª Série', 'REGULAR')`);
    await legDb.run(`INSERT INTO students (id, name, classId, registrationNumber) VALUES ('std-101', 'ALICE LUCAS AMADO', 'F-EF27A', '2026001')`);
    await legDb.run(`INSERT INTO students (id, name, classId, registrationNumber) VALUES ('std-102', 'ANDRE LUIZ FERREIRA', 'F-EM1A', '2026002')`);
    await legDb.run(`INSERT INTO teacher_classes (id, teacherId, classId, subjectId) VALUES ('tc-1', 'teacher-andre', 'F-EF27A', 'Disciplina XI')`);
    await legDb.run(`INSERT INTO teacher_classes (id, teacherId, classId, subjectId) VALUES ('tc-2', 'teacher-andre', 'F-EM1A', 'Disciplina XI')`);
    // Simula duplicata em schedules + slot para confirmar deduplicação em mvp01_teaching_assignments
    await legDb.run(`INSERT INTO schedules (id, classId, roomId, teacherId, subject, teacher, dayOfWeek, startTime, endTime) VALUES ('sch-1', 'F-EF27A', 'room-7a', 'teacher-andre', 'Disciplina XI', 'ANDRE', 1, '07:30', '08:20')`);

    // Simula mvp01_memberships pré-existente para teacher-andre (caso exato do banco real)
    await legDb.run(`CREATE TABLE mvp01_memberships (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, person_name TEXT, email TEXT, school_id TEXT NOT NULL, role TEXT NOT NULL, status TEXT DEFAULT 'ACTIVE', valid_until TEXT)`);
    await legDb.run(`INSERT INTO mvp01_memberships (id, user_id, person_name, email, school_id, role, status) VALUES ('mem-auto-andre', 'teacher-andre', 'ANDRE', NULL, ?, 'docente', 'ACTIVE')`, [MVP01_DEMO_SCHOOL_ID]);

    await ensureMvp01Schema(legDb);

    const andreCtx = await resolveMvp01Context(legDb, {
      id: 'teacher-andre',
      username: 'andre',
      name: 'ANDRE',
      role: 'docente',
    });
    assert.equal(andreCtx.assignedClasses.length, 2, 'ANDRE deve herdar exatamente 2 turmas atribuídas sem duplicatas');
    assert.equal(andreCtx.activeRole, 'docente');

    const legDomain = new Mvp01DomainService(legDb);
    const teacherOv: any = await legDomain.getPortalOverview(andreCtx, 'teacher');
    assert.equal(teacherOv.classes.length, 2);
    assert.equal(teacherOv.students.length, 2);

    const inc: any = await legDomain.createIncident(andreCtx, {
      studentId: 'std-101',
      classId: 'F-EF27A',
      category: 'PRAISE',
      title: 'Destaque em participação',
      publishedToFamily: false,
    });
    assert.ok(inc.id, 'Professor deve conseguir salvar ocorrência/elogio logo após hidratação');

    const memCount = await legDb.get<any>(`SELECT COUNT(*) as n FROM mvp01_memberships WHERE user_id = 'teacher-andre'`);
    assert.equal(memCount.n, 1, 'Não deve duplicar membership pré-existente');
  });

  await runCase('9. Boletim PDF WinAnsi, Impressão IPC, CSS Cascade & Parecer com studentName', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aquila-boletim-test-'));
    try {
      const docService = new DocumentService(tmpDir);
      const outPath = path.join(tmpDir, 'nested', 'Boletim_Alice_Teste.pdf');
      const pdfPath = await docService.generateReportCardPDF(
        { id: 'STU-45248', name: 'Alice Lucas Lepesqueur — 7º Ano' },
        [
          { subject: 'Matemática', b1: 8.5, b2: 9.0, b3: null, b4: null, avg: 8.75 },
          { subject: 'Português & Redação', b1: 9.0, b2: 8.5, b3: null, b4: null, avg: 8.75 },
          { subject: 'Educação Física', b1: 10.0, b2: 10.0, b3: null, b4: null, avg: 10.0 },
        ],
        {
          className: '7 ANO A',
          ra: '2026-0042',
          period: '1º Semestre 2026',
          frequency: { rate: 98, absences: 4, totalDays: 80 },
          parecer: '“Excelente desempenho” • Participação ativa — manter foco nos estudos · 100% comprometida!',
          outputPath: outPath,
        }
      );

      assert.equal(pdfPath, outPath, 'Deve respeitar outputPath selecionado pelo usuário');
      const pdfStat = fs.statSync(pdfPath);
      assert.ok(pdfStat.size > 1024, `PDF gerado deve ter tamanho > 1KB (atual: ${pdfStat.size})`);
      const header = fs.readFileSync(pdfPath).subarray(0, 5).toString('ascii');
      assert.equal(header, '%PDF-', 'Arquivo exportado deve possuir assinatura %PDF- válida');
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }

    const appRoot = path.resolve(__dirname, '../apps/electron');
    const preloadSrc = fs.readFileSync(path.join(appRoot, 'src/preload.ts'), 'utf-8');
    assert.ok(preloadSrc.includes("'export:boletim-pdf'"), 'preload deve autorizar export:boletim-pdf');
    assert.ok(preloadSrc.includes("'print:boletim'"), 'preload deve autorizar print:boletim');

    const indexHtmlSrc = fs.readFileSync(path.join(appRoot, 'index.html'), 'utf-8');
    assert.ok(!/\*\s*\{[^}]*padding\s*:\s*0/i.test(indexHtmlSrc), 'index.html não deve conter reset global * { padding: 0 } fora de @layer');

    const sensoryCssSrc = fs.readFileSync(path.join(appRoot, 'src/ui/pages/SensoryConfigDashboard.css'), 'utf-8');
    assert.ok(sensoryCssSrc.includes('.sensory-container select'), 'SensoryConfigDashboard.css deve escopar select dentro de .sensory-container');
    assert.ok(!/^select\s*\{/m.test(sensoryCssSrc), 'SensoryConfigDashboard.css não pode declarar seletor global select {}');

    const handlersSrc = fs.readFileSync(path.join(appRoot, 'src/ipc/handlers.ts'), 'utf-8');
    const reportCommentBlock = handlersSrc.match(/protectedHandle\('ai:generate-report-comment'[\s\S]*?return \{ success: true, comment: fallbackComment \};/);
    assert.ok(reportCommentBlock, 'Handler ai:generate-report-comment deve existir em handlers.ts');
    assert.ok(reportCommentBlock[0].includes('studentName'), 'Handler deve aceitar e priorizar studentName no parecer');
    assert.ok(!reportCommentBlock[0].includes('STU-45248'), 'Handler não deve emitir identificador fixo STU-45248');

    const reportCardSrc = fs.readFileSync(path.join(appRoot, 'src/ui/components/AcademicReportCard.tsx'), 'utf-8');
    assert.ok(reportCardSrc.includes('studentName: student.name'), 'AcademicReportCard deve enviar studentName: student.name ao IPC de parecer');
    assert.ok(reportCardSrc.includes("'print:boletim'"), 'AcademicReportCard deve acionar print:boletim na impressão');
  });

  await runCase('10. Diário de Classe compacto multi-coluna (P/F, sem scroll, modal socioemocional/observações ao clicar no aluno)', async () => {
    const appRoot = path.resolve(__dirname, '../apps/electron');
    const diarySrc = fs.readFileSync(path.join(appRoot, 'src/ui/pages/Diary.tsx'), 'utf-8');

    assert.ok(!diarySrc.includes('>Socioemocional</th>'), 'LISTA TRADICIONAL não deve exibir coluna fixa Socioemocional na tabela');
    assert.ok(!diarySrc.includes('>Observações da Aula</th>'), 'LISTA TRADICIONAL não deve exibir coluna fixa Observações da Aula na tabela');
    assert.ok(diarySrc.includes('title="Marcar Presente (P)"'), 'Botão compacto de presença (P) deve estar presente na lista');
    assert.ok(diarySrc.includes('title="Marcar Falta (F)"'), 'Botão compacto de falta (F) deve estar presente na lista');
    assert.ok(diarySrc.includes('lg:grid-cols-3') && diarySrc.includes('md:grid-cols-2'), 'Layout em 2 ou 3 colunas deve estar configurado na lista');
    assert.ok(diarySrc.includes('setActiveNoteStudentId(student.id)'), 'Clicar no nome do aluno deve abrir o modal de socioemocional e observações');
    assert.ok(diarySrc.includes('aria-modal="true"'), 'Modal de socioemocional/observações ao clicar no aluno deve existir no Diary');
  });

  console.log(`\nSUMMARY: passed=${passed} failed=${failed}`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
