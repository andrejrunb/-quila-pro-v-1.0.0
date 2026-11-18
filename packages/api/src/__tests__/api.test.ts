import { describe, it, expect, beforeEach } from 'vitest';
import { appRouter } from '../index';
import {
  auditLogs,
  biometricConsentLogs,
  createMemoryDb,
  edgeSyncCommands,
  grades,
  occurrences,
  seedAcademicFixtures,
  studySessions,
  type AquilaDatabase,
} from '@aquila/db';
import { eq } from 'drizzle-orm';

describe('@aquila/api — Real DB Routers, IDOR Isolation, CNE 2026 & LGPD Audit', () => {
  let db: AquilaDatabase;

  beforeEach(async () => {
    db = await createMemoryDb();
    await seedAcademicFixtures(db);
  });

  it('getHealth deve responder publicamente com status ok', async () => {
    const caller = appRouter.createCaller({ db });
    const res = await caller.getHealth();
    expect(res.status).toBe('ok');
    expect(typeof res.uptime).toBe('number');
    expect(typeof res.timestamp).toBe('string');
  });

  it('protectedProcedure deve bloquear chamadas não autenticadas com UNAUTHORIZED', async () => {
    const unauthCaller = appRouter.createCaller({ db, user: null });
    await expect(unauthCaller.student.list({ limit: 10 })).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
    });
    await expect(unauthCaller.attendance.getDailySummary({})).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
    });
  });

  it('teacher (attendance + roster + CNE 2026 review + radar action) persiste no DB e gera trilha SHA-256', async () => {
    const teacherCaller = appRouter.createCaller({
      db,
      user: {
        id: 'usr_teacher_01',
        username: 'prof.ricardo',
        role: 'teacher',
        institutionId: 'inst_aquila_demo',
      },
    });

    const summary = await teacherCaller.attendance.getDailySummary({ date: '2026-11-11' });
    expect(summary.date).toBe('2026-11-11');
    expect(summary.totalStudents).toBeGreaterThan(0);

    const marked = await teacherCaller.attendance.markAttendance({
      studentId: 'std_001',
      status: 'present',
      classId: 'cls_2b',
      date: '2026-11-11',
      detectedBy: 'qr_badge',
    });
    expect(marked.success).toBe(true);
    expect(marked.auditHash).toMatch(/^[a-f0-9]{64}$/);

    const diaryRes = await teacherCaller.teacher.saveLessonDiary({
      classId: 'cls_2b',
      date: '2026-11-11',
      subject: 'Física Aplicada',
      topic: 'Termodinâmica',
      content: 'Primeira Lei da Termodinâmica aplicada.',
      bnccCodes: ['EM13CNT301'],
      sign: true,
    });
    expect(diaryRes.signed).toBe(true);
    expect(diaryRes.signatureHashSha256).toMatch(/^[a-f0-9]{64}$/);

    const radarRes = await teacherCaller.teacher.applyRadarAction({
      occurrenceId: 'occ_001',
      actionApplied: 'Encaminhada lista extra de exercícios de Trabalho Gasoso',
    });
    expect(radarRes.ok).toBe(true);
    expect(radarRes.auditHash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('adminProcedure deve bloquear perfil teacher/student com FORBIDDEN', async () => {
    const teacherCaller = appRouter.createCaller({
      db,
      user: { id: 'usr_teacher_01', username: 'prof.ricardo', role: 'teacher', institutionId: 'inst_aquila_demo' },
    });
    await expect(teacherCaller.getAuditLogs({ limit: 10 })).rejects.toMatchObject({ code: 'FORBIDDEN' });
    await expect(teacherCaller.finance.getSummary()).rejects.toMatchObject({ code: 'FORBIDDEN' });
    await expect(teacherCaller.automation.getSystemStatus()).rejects.toMatchObject({ code: 'FORBIDDEN' });
    await expect(teacherCaller.automation.runLgpdRetentionPurge({ retentionDays: 365, dryRun: true })).rejects.toMatchObject({
      code: 'FORBIDDEN',
    });
  });

  it('adminProcedure (auditLogs, finance real, observability & LGPD purge) opera sobre dados reais', async () => {
    const adminCaller = appRouter.createCaller({
      db,
      user: { id: 'usr_coord_01', username: 'coord.juliana', role: 'coordinator', institutionId: 'inst_aquila_demo' },
    });

    const finSummary = await adminCaller.finance.getSummary();
    expect(finSummary.currency).toBe('BRL');
    expect(finSummary.monthlyRevenue).toBeGreaterThan(0);

    const pendingInvoices = await adminCaller.finance.listInvoices({ status: 'pending' });
    expect(pendingInvoices.length).toBeGreaterThan(0);
    expect(pendingInvoices.every((inv) => inv.status === 'pending')).toBe(true);

    const obs = await adminCaller.automation.exportOfflineObservability({ includeMetricsWindowHours: 48 });
    expect(obs.piiIncluded).toBe(false);
    expect(obs.windowHours).toBe(48);
    expect(obs.sha256).toMatch(/^[a-f0-9]{64}$/);

    const purge = await adminCaller.automation.runLgpdRetentionPurge({ retentionDays: 365, dryRun: false });
    expect(purge.success).toBe(true);
    expect(purge.action).toBe('DATA_RETENTION_EXPIRATION');
    expect(purge.auditHash).toMatch(/^[a-f0-9]{64}$/);

    const logs = await adminCaller.getAuditLogs({ limit: 10 });
    expect(logs.length).toBeGreaterThan(0);
  });

  it('previne IDOR parental, oculta notas draft_ai (CNE 15/2026) até revisão e registra revogação LGPD Art. 16', async () => {
    const parent1Caller = appRouter.createCaller({
      db,
      user: { id: 'usr_parent_01', username: 'pais.patricia', role: 'parent', institutionId: 'inst_aquila_demo' },
    });
    const parent2Caller = appRouter.createCaller({
      db,
      user: { id: 'usr_parent_02', username: 'pais.roberto', role: 'parent', institutionId: 'inst_aquila_demo' },
    });

    // Parent 1 sees Lucas Andrade in 2º Ano B, never Matheus (std_005)
    const ws1 = await parent1Caller.parent.getWorkspace();
    expect(ws1.activeStudent?.id).toBe('std_001');
    expect(ws1.activeClass?.name).toBe('2º Ano B');
    await expect(parent1Caller.student.getById({ id: 'std_005' })).rejects.toMatchObject({ code: 'FORBIDDEN' });

    // Parent 2's child (std_005) has a draft_ai grade + submission hidden until teacher reviews
    const ws2Before = await parent2Caller.parent.getWorkspace();
    expect(ws2Before.grades.length).toBe(0);

    // Teacher approves submission grade -> becomes published!
    const teacherCaller = appRouter.createCaller({
      db,
      user: { id: 'usr_teacher_01', username: 'prof.ricardo', role: 'teacher', institutionId: 'inst_aquila_demo' },
    });
    const reviewed = await teacherCaller.teacher.reviewSubmissionGrade({
      submissionId: 'sub_001',
      finalScore: 7.5,
      feedback: 'Revisado e homologado pelo docente.',
    });
    expect(reviewed.reviewStatus).toBe('published');

    const ws2After = await parent2Caller.parent.getWorkspace();
    expect(ws2After.grades.some((g) => g.score === 7.5)).toBe(true);

    // Parent 1 signs occurrence + settles PIX + revokes LGPD with real SHA-256 hash
    const signOcc = await parent1Caller.parent.signOccurrence({ occurrenceId: 'occ_001' });
    expect(signOcc.signatureHashSha256).toMatch(/^[a-f0-9]{64}$/);

    const pixRes = await parent1Caller.finance.confirmPixPayment({ invoiceId: 'inv_001' });
    expect(pixRes.status).toBe('paid');
    expect(pixRes.receiptHashSha256).toMatch(/^[a-f0-9]{64}$/);

    const lgpdRes = await parent1Caller.parent.setBiometricConsent({
      studentId: 'std_001',
      decision: 'revoke',
    });
    expect(lgpdRes.status).toBe('revoked');
    expect(lgpdRes.auditSignatureSha256).toMatch(/^[a-f0-9]{64}$/);
  });

  it('studentPortal persiste missões BNCC e sessões de estudo (Kumon/Tutor) sem IDOR', async () => {
    const studentCaller = appRouter.createCaller({
      db,
      user: { id: 'usr_student_01', username: 'aluno.lucas', role: 'student', institutionId: 'inst_aquila_demo' },
    });

    const ws = await studentCaller.studentPortal.getWorkspace();
    expect(ws.student?.name).toBe('Lucas Andrade');
    expect(ws.activeClass?.name).toBe('2º Ano B');
    expect(ws.missions.length).toBeGreaterThan(0);

    const progressed = await studentCaller.studentPortal.advanceMission({ missionId: 'mis_001', delta: 40 });
    expect(progressed.completed).toBe(true);
    expect(progressed.progress).toBe(100);

    const tutorRes = await studentCaller.studentPortal.logStudySession({
      mode: 'socratic_tutor',
      topic: 'Primeira Lei da Termodinâmica',
      durationSeconds: 60,
    });
    expect(tutorRes.ok).toBe(true);
    expect(tutorRes.pedagogicalHintMode).toBe('deterministic_local_scaffold');
    expect(tutorRes.reply).toContain('Termodinâmica');
  });

  it('resolve opt-in + revogação no mesmo segundo via recordedAtMs, valida CPF e aplica contestação CNE 15/2026', async () => {
    const parent1Caller = appRouter.createCaller({
      db,
      user: { id: 'usr_parent_01', username: 'pais.patricia', role: 'parent', institutionId: 'inst_aquila_demo' },
    });
    const student1Caller = appRouter.createCaller({
      db,
      user: { id: 'usr_student_01', username: 'aluno.lucas', role: 'student', institutionId: 'inst_aquila_demo' },
    });

    await expect(
      parent1Caller.parent.setBiometricConsent({
        studentId: 'std_001',
        decision: 'grant',
        guardianCpf: '000.000.000-00',
        guardianName: 'Patrícia Andrade',
      })
    ).rejects.toMatchObject({ code: 'BAD_REQUEST' });

    const granted = await parent1Caller.parent.setBiometricConsent({
      studentId: 'std_001',
      decision: 'grant',
      guardianCpf: '123.456.789-00',
      guardianName: 'Patrícia Andrade',
    });
    expect(granted.consentLogId).toMatch(/^bcl_/);

    const revoked = await parent1Caller.parent.setBiometricConsent({
      studentId: 'std_001',
      decision: 'revoke',
    });
    expect(revoked.status).toBe('revoked');

    const wsAfter = await parent1Caller.parent.getWorkspace();
    expect(wsAfter.biometricConsent.enabled).toBe(false);
    expect(wsAfter.biometricConsent.status).toBe('revoked');
    expect(wsAfter.biometricConsent.consentLogId).toBe(revoked.consentLogId);
    expect(wsAfter.biometricConsent.edgeCommandId).toBe(revoked.edgeCommandId);

    const [consentRow] = await db
      .select()
      .from(biometricConsentLogs)
      .where(eq(biometricConsentLogs.id, granted.consentLogId));
    expect(consentRow.guardianCpf).toBe('***.456.789-**');
    expect(consentRow.edgeCommandId).toBe(granted.edgeCommandId);

    await expect(
      parent1Caller.parent.signOccurrence({
        occurrenceId: 'occ_001',
        manifestationType: 'DISAGREEMENT_CONTESTATION',
      })
    ).rejects.toMatchObject({ code: 'BAD_REQUEST' });

    const contestedOcc = await parent1Caller.parent.signOccurrence({
      occurrenceId: 'occ_001',
      manifestationType: 'DISAGREEMENT_CONTESTATION',
      contestationReason: 'Estudante entregou a lista diretamente ao monitor no laboratório.',
    });
    expect(contestedOcc.contestationReason).toContain('laboratório');

    await expect(
      parent1Caller.parent.signOccurrence({
        occurrenceId: 'occ_001',
        manifestationType: 'SCIENCE_ACKNOWLEDGED',
      })
    ).rejects.toMatchObject({ code: 'CONFLICT' });

    const [occRow] = await db.select().from(occurrences).where(eq(occurrences.id, 'occ_001'));
    expect(occRow.contestationReason).toContain('laboratório');
    expect(occRow.edgeCommandId).toBe(contestedOcc.edgeCommandId);

    const contestRes = await student1Caller.studentPortal.contestGrade({
      gradeId: 'grd_001',
      reason: 'Solicito revisão da questão 3 cujo cálculo vetorial seguiu o método aceito em aula.',
    });
    expect(contestRes.contestationStatus).toBe('contested');
    expect(contestRes.commandId).toMatch(/^cmd_/);

    const [grdRow] = await db.select().from(grades).where(eq(grades.id, 'grd_001'));
    expect(grdRow.contestationStatus).toBe('contested');
    expect(grdRow.contestedByUserId).toBe('usr_student_01');
  });

  it('garante idempotência de revisão, trava cross-class no docente e bloqueio etário CNE 15/2026 no servidor', async () => {
    const teacher1Caller = appRouter.createCaller({
      db,
      user: { id: 'usr_teacher_01', username: 'prof.ricardo', role: 'teacher', institutionId: 'inst_aquila_demo' },
    });
    const teacher2Caller = appRouter.createCaller({
      db,
      user: { id: 'usr_teacher_02', username: 'prof.helena', role: 'teacher', institutionId: 'inst_aquila_demo' },
    });
    const parent1Caller = appRouter.createCaller({
      db,
      user: { id: 'usr_parent_01', username: 'pais.patricia', role: 'parent', institutionId: 'inst_aquila_demo' },
    });
    const earlyStudentCaller = appRouter.createCaller({
      db,
      user: { id: 'usr_student_03', username: 'aluno.sofia', role: 'student', institutionId: 'inst_aquila_demo' },
    });
    const emStudentCaller = appRouter.createCaller({
      db,
      user: { id: 'usr_student_01', username: 'aluno.lucas', role: 'student', institutionId: 'inst_aquila_demo' },
    });

    const rev1 = await teacher1Caller.teacher.reviewSubmissionGrade({ submissionId: 'sub_001', finalScore: 7.0 });
    const rev2 = await teacher1Caller.teacher.reviewSubmissionGrade({ submissionId: 'sub_001', finalScore: 8.5 });
    expect(rev2.gradeId).toBe(rev1.gradeId);

    const std5Grades = await db.select().from(grades).where(eq(grades.studentId, 'std_005'));
    expect(std5Grades.filter((g) => g.subject === 'Física Aplicada' && g.period === '4bim')).toHaveLength(1);
    expect(std5Grades.find((g) => g.id === rev1.gradeId)?.score).toBe(8.5);

    await expect(
      teacher1Caller.teacher.saveGradesBatch({
        classId: 'cls_2b',
        subject: 'Matemática',
        period: '4bim',
        entries: [{ studentId: 'std_006', score: 9.0 }],
      })
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });

    await expect(
      teacher2Caller.teacher.saveLessonDiary({
        id: 'dry_001',
        classId: 'cls_2ef',
        date: '2026-11-12',
        subject: 'Português',
        topic: 'Tentativa indevida',
        content: 'Conteúdo não autorizado.',
        bnccCodes: ['EF02LP01'],
        sign: true,
      })
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });

    await teacher1Caller.teacher.saveLessonDiary({
      classId: 'cls_2b',
      date: '2026-11-12',
      subject: 'Química',
      topic: 'Rascunho oculto',
      content: 'Conteúdo em elaboração pelo docente.',
      bnccCodes: ['EM13CNT101'],
      dinnerPrompt: 'Prompt privado de rascunho não publicado',
      sign: false,
    });
    const parentWs = await parent1Caller.parent.getWorkspace();
    expect(parentWs.dinnerConversations.some((d) => d.prompt.includes('Prompt privado de rascunho'))).toBe(false);

    const earlyWs = await earlyStudentCaller.studentPortal.getWorkspace();
    expect(earlyWs.aiPolicy.blocked).toBe(true);
    expect(earlyWs.aiPolicy.stage).toBe('ENSINO_FUNDAMENTAL_ANOS_INICIAIS');
    expect(earlyWs.xpPoints).toBe(0);
    expect(earlyWs.coins).toBe(0);
    expect(earlyWs.streakDays).toBe(0);

    await expect(
      earlyStudentCaller.studentPortal.logStudySession({
        mode: 'socratic_tutor',
        topic: 'Ajuda com tarefa de alfabetização',
      })
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });

    const blockLogs = await db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.action, 'CNE_15_2026_EARLY_STAGE_AI_BLOCKED'));
    expect(blockLogs.length).toBeGreaterThanOrEqual(1);

    const sprintRes = await earlyStudentCaller.studentPortal.logStudySession({
      mode: 'kumon_3min',
      topic: 'Tabuada rápida do 3',
      durationSeconds: 180,
    });
    expect(sprintRes.mode).toBe('focus_sprint_3min');

    const redactedRes = await emStudentCaller.studentPortal.logStudySession({
      mode: 'essay_lab',
      topic: 'Meu CPF 123.456.789-00 e email aluno@escola.br na redação ENEM',
      durationSeconds: 120,
    });
    const [sesRow] = await db.select().from(studySessions).where(eq(studySessions.id, redactedRes.sessionId));
    expect(sesRow.notes).not.toContain('123.456.789-00');
    expect(sesRow.notes).not.toContain('aluno@escola.br');

    const pixRes = await parent1Caller.finance.confirmPixPayment({ invoiceId: 'inv_001' });
    expect(pixRes.commandId).toMatch(/^cmd_/);
    expect(pixRes.reconciliationState).toBe('PENDING_EDGE_RECONCILIATION');
    const [finCmd] = await db
      .select()
      .from(edgeSyncCommands)
      .where(eq(edgeSyncCommands.commandId, pixRes.commandId));
    expect(finCmd.targetDomain).toBe('finance');
  });
});
