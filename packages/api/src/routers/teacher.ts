import { randomUUID } from 'node:crypto';
import { router, teacherProcedure } from '../trpc';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import {
  assessments,
  assessmentSubmissions,
  attendance,
  classes,
  grades,
  lessonDiaries,
  occurrences,
  students,
  users,
} from '@aquila/db';
import { and, desc, eq, inArray } from 'drizzle-orm';
import {
  assertStudentAccess,
  assertTeacherClassAccess,
  computeSha256,
  enqueueEdgeSyncCommand,
  findTeacherClassIds,
  recordAuditEvent,
  resolveInstitutionSyncStatus,
  resolveLatestCommandByDomain,
  sanitizeOutboundStudentRow,
  type DomainSyncCommandSummary,
  type InstitutionSyncStatus,
} from '../lib/governance';

function buildEmptyTeacherWorkspace(
  teacherName: string,
  targetDate: string,
  teacherClasses: Array<typeof classes.$inferSelect>,
  syncStatus: InstitutionSyncStatus,
  lastAttendanceSync: DomainSyncCommandSummary | null,
  lastDiarySync: DomainSyncCommandSummary | null
) {
  return {
    teacherName,
    classes: teacherClasses,
    activeClass: null,
    roster: [],
    diaries: [],
    assessments: [],
    pendingSubmissions: [],
    occurrences: [],
    grades: [],
    date: targetDate,
    syncStatus,
    lastAttendanceSync,
    lastDiarySync,
  };
}

export const teacherRouter = router({
  getWorkspace: teacherProcedure
    .input(
      z
        .object({
          classId: z.string().optional(),
          date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
        })
        .optional()
    )
    .query(async ({ input, ctx }) => {
      const targetDate = input?.date || new Date().toISOString().split('T')[0];
      if (!ctx.db) {
        return buildEmptyTeacherWorkspace(
          ctx.user.username,
          targetDate,
          [],
          await resolveInstitutionSyncStatus(ctx.db as never, undefined),
          null,
          null
        );
      }

      if (input?.classId) {
        await assertTeacherClassAccess(ctx.db, ctx.user, input.classId);
      }

      const teacherRows = await ctx.db
        .select({ name: users.name })
        .from(users)
        .where(eq(users.id, ctx.user.id))
        .limit(1);
      const teacherName = teacherRows[0]?.name ?? ctx.user.username;

      const teacherClassIds = await findTeacherClassIds(ctx.db, ctx.user);
      if (teacherClassIds.length === 0) {
        const [syncStatus, lastAttendanceSync, lastDiarySync] = await Promise.all([
          resolveInstitutionSyncStatus(ctx.db, ctx.user.institutionId),
          resolveLatestCommandByDomain(ctx.db, ctx.user.institutionId, 'attendance'),
          resolveLatestCommandByDomain(ctx.db, ctx.user.institutionId, 'lesson_diary'),
        ]);
        return buildEmptyTeacherWorkspace(teacherName, targetDate, [], syncStatus, lastAttendanceSync, lastDiarySync);
      }

      const teacherClasses = await ctx.db
        .select()
        .from(classes)
        .where(inArray(classes.id, teacherClassIds));

      const activeClass =
        (input?.classId ? teacherClasses.find((c) => c.id === input.classId) : undefined) ??
        teacherClasses[0] ??
        null;

      if (!activeClass) {
        const [syncStatus, lastAttendanceSync, lastDiarySync] = await Promise.all([
          resolveInstitutionSyncStatus(ctx.db, ctx.user.institutionId),
          resolveLatestCommandByDomain(ctx.db, ctx.user.institutionId, 'attendance'),
          resolveLatestCommandByDomain(ctx.db, ctx.user.institutionId, 'lesson_diary'),
        ]);
        return buildEmptyTeacherWorkspace(
          teacherName,
          targetDate,
          teacherClasses,
          syncStatus,
          lastAttendanceSync,
          lastDiarySync
        );
      }

      const classStudents = await ctx.db
        .select()
        .from(students)
        .where(eq(students.classId, activeClass.id));

      const todayAttendance = await ctx.db
        .select()
        .from(attendance)
        .where(and(eq(attendance.classId, activeClass.id), eq(attendance.date, targetDate)));

      const attMap = new Map(todayAttendance.map((a) => [a.studentId, a]));

      const roster = classStudents.map((rawStudent, idx) => {
        const s = sanitizeOutboundStudentRow(rawStudent);
        const rec = attMap.get(s.id);
        const row = Math.floor(idx / 4);
        const col = (idx % 4) + 1;
        const seat = `${String.fromCharCode(65 + row)}${col}`;
        return {
          id: s.id,
          name: s.name,
          registrationNumber: s.registrationNumber,
          seat,
          status: (rec?.status === 'late' ? 'present' : rec?.status ?? 'present') as
            | 'present'
            | 'absent'
            | 'justified',
          detectedBy: rec?.detectedBy ?? 'manual',
          confidence: rec ? (rec.confidence ?? 1.0) : 0,
          entryTime: rec ? rec.timestamp.toISOString().slice(11, 16) : '--',
        };
      });

      const diaries = await ctx.db
        .select()
        .from(lessonDiaries)
        .where(eq(lessonDiaries.classId, activeClass.id))
        .orderBy(desc(lessonDiaries.createdAt))
        .limit(10);

      const classAssessments = await ctx.db
        .select()
        .from(assessments)
        .where(eq(assessments.classId, activeClass.id))
        .orderBy(desc(assessments.createdAt))
        .limit(10);

      const assessmentIds = classAssessments.map((a) => a.id);
      const pendingSubmissions =
        assessmentIds.length > 0
          ? await ctx.db
              .select()
              .from(assessmentSubmissions)
              .where(inArray(assessmentSubmissions.assessmentId, assessmentIds))
              .orderBy(desc(assessmentSubmissions.submittedAt))
              .limit(30)
          : [];

      const classOccurrences = await ctx.db
        .select()
        .from(occurrences)
        .where(eq(occurrences.classId, activeClass.id))
        .orderBy(desc(occurrences.createdAt))
        .limit(20);

      const classGrades = await ctx.db
        .select()
        .from(grades)
        .where(eq(grades.classId, activeClass.id));

      const [syncStatus, lastAttendanceSync, lastDiarySync] = await Promise.all([
        resolveInstitutionSyncStatus(ctx.db, activeClass.institutionId),
        resolveLatestCommandByDomain(ctx.db, activeClass.institutionId, 'attendance'),
        resolveLatestCommandByDomain(ctx.db, activeClass.institutionId, 'lesson_diary'),
      ]);

      return {
        teacherName,
        classes: teacherClasses,
        activeClass,
        roster,
        diaries,
        assessments: classAssessments,
        pendingSubmissions,
        occurrences: classOccurrences,
        grades: classGrades,
        date: targetDate,
        syncStatus,
        lastAttendanceSync,
        lastDiarySync,
      };
    }),

  saveRosterAttendance: teacherProcedure
    .input(
      z.object({
        classId: z.string(),
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
        entries: z
          .array(
            z.object({
              studentId: z.string(),
              status: z.enum(['present', 'absent', 'late', 'justified']),
              detectedBy: z.enum(['manual', 'qr_badge', 'camera', 'nfc']).default('manual'),
            })
          )
          .min(1),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.db) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not configured.' });
      }
      const cls = await assertTeacherClassAccess(ctx.db, ctx.user, input.classId);

      const dateStr = input.date || new Date().toISOString().split('T')[0];
      const now = new Date();

      for (const entry of input.entries) {
        const student = await assertStudentAccess(ctx.db, ctx.user, entry.studentId);
        if (student.classId !== cls.id) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Estudante informado não pertence à turma selecionada.',
          });
        }
        const existing = await ctx.db
          .select()
          .from(attendance)
          .where(
            and(
              eq(attendance.studentId, entry.studentId),
              eq(attendance.classId, input.classId),
              eq(attendance.date, dateStr)
            )
          )
          .limit(1);

        if (existing[0]) {
          await ctx.db
            .update(attendance)
            .set({ status: entry.status, detectedBy: entry.detectedBy, timestamp: now })
            .where(eq(attendance.id, existing[0].id));
        } else {
          await ctx.db.insert(attendance).values({
            id: `att_${randomUUID().slice(0, 12)}`,
            studentId: entry.studentId,
            classId: input.classId,
            date: dateStr,
            status: entry.status,
            detectedBy: entry.detectedBy,
            confidence: 1.0,
            timestamp: now,
          });
        }
      }

      const syncCmd = await enqueueEdgeSyncCommand(ctx.db, {
        institutionId: cls.institutionId,
        targetDomain: 'attendance',
        action: 'ROSTER_ATTENDANCE_SYNC',
        payload: {
          classId: input.classId,
          date: dateStr,
          entries: input.entries,
        },
        actorUserId: ctx.user.id,
        conflictPolicy: 'edge_offline_merge_with_teacher_override',
      });

      const syncHash = await recordAuditEvent(ctx.db, {
        userId: ctx.user.id,
        action: 'ROSTER_ATTENDANCE_SYNCED',
        entity: 'classes',
        entityId: input.classId,
        details: { date: dateStr, totalEntries: input.entries.length, commandId: syncCmd.commandId },
        ipAddress: ctx.ipAddress,
      });

      return {
        ok: true,
        syncedAt: now.toISOString(),
        syncHash,
        commandId: syncCmd.commandId,
        syncStatus: syncCmd.status,
        count: input.entries.length,
      };
    }),

  saveLessonDiary: teacherProcedure
    .input(
      z.object({
        id: z.string().optional(),
        classId: z.string().min(1),
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        subject: z.string().min(2),
        topic: z.string().min(2),
        content: z.string().min(3),
        bnccCodes: z.array(z.string()).default([]),
        homework: z.string().optional(),
        dinnerPrompt: z.string().optional(),
        sign: z.boolean().default(false),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.db) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not configured.' });
      }
      const cls = await assertTeacherClassAccess(ctx.db, ctx.user, input.classId);

      const now = new Date();
      const diaryId = input.id || `dry_${randomUUID().slice(0, 12)}`;
      const diaryStatus = input.sign ? ('published' as const) : ('draft' as const);
      const signatureHashSha256 = input.sign
        ? computeSha256({
            diaryId,
            classId: input.classId,
            teacherId: ctx.user.id,
            date: input.date,
            content: input.content,
            signedAt: now.toISOString(),
          })
        : null;

      const existing = await ctx.db
        .select()
        .from(lessonDiaries)
        .where(eq(lessonDiaries.id, diaryId))
        .limit(1);

      if (existing[0]) {
        const ownsDiary =
          existing[0].institutionId === cls.institutionId &&
          existing[0].classId === cls.id &&
          (ctx.user.role !== 'teacher' || existing[0].teacherId === ctx.user.id);
        if (!ownsDiary) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Acesso negado: diário pertence a outra turma, docente ou instituição.',
          });
        }
      }

      const resolvedHomework = input.homework ?? existing[0]?.homework ?? null;
      const resolvedDinnerPrompt = input.dinnerPrompt ?? existing[0]?.dinnerPrompt ?? null;

      const diaryCmd = await enqueueEdgeSyncCommand(ctx.db, {
        institutionId: cls.institutionId,
        targetDomain: 'lesson_diary',
        action: signatureHashSha256 ? 'LESSON_DIARY_SIGNED' : 'LESSON_DIARY_UPSERT',
        payload: {
          diaryId,
          classId: input.classId,
          teacherId: ctx.user.id,
          date: input.date,
          subject: input.subject,
          topic: input.topic,
          content: input.content,
          bnccCodes: input.bnccCodes,
          homework: resolvedHomework,
          dinnerPrompt: resolvedDinnerPrompt,
          status: diaryStatus,
          signed: Boolean(signatureHashSha256),
          signatureHashSha256,
        },
        actorUserId: ctx.user.id,
        conflictPolicy: 'teacher_diary_authoritative',
      });

      if (existing[0]) {
        await ctx.db
          .update(lessonDiaries)
          .set({
            date: input.date,
            subject: input.subject,
            topic: input.topic,
            content: input.content,
            bnccCodesJson: JSON.stringify(input.bnccCodes),
            homework: resolvedHomework,
            dinnerPrompt: resolvedDinnerPrompt,
            status: diaryStatus,
            propagationStatus: 'pending_at_edge',
            edgeCommandId: diaryCmd.commandId,
            ...(signatureHashSha256
              ? { signatureHashSha256, signedAt: now }
              : {}),
          })
          .where(eq(lessonDiaries.id, diaryId));
      } else {
        await ctx.db.insert(lessonDiaries).values({
          id: diaryId,
          classId: input.classId,
          teacherId: ctx.user.id,
          institutionId: cls.institutionId,
          date: input.date,
          subject: input.subject,
          topic: input.topic,
          content: input.content,
          bnccCodesJson: JSON.stringify(input.bnccCodes),
          homework: resolvedHomework,
          dinnerPrompt: resolvedDinnerPrompt,
          status: diaryStatus,
          propagationStatus: 'pending_at_edge',
          edgeCommandId: diaryCmd.commandId,
          signatureHashSha256,
          signedAt: signatureHashSha256 ? now : null,
          createdAt: now,
        });
      }

      await recordAuditEvent(ctx.db, {
        userId: ctx.user.id,
        action: signatureHashSha256 ? 'LESSON_DIARY_SIGNED' : 'LESSON_DIARY_SAVED',
        entity: 'lesson_diaries',
        entityId: diaryId,
        details: {
          classId: input.classId,
          date: input.date,
          status: diaryStatus,
          signatureHashSha256,
          commandId: diaryCmd.commandId,
        },
        ipAddress: ctx.ipAddress,
      });

      return {
        ok: true,
        id: diaryId,
        status: diaryStatus,
        signed: Boolean(signatureHashSha256),
        signatureHashSha256,
        commandId: diaryCmd.commandId,
        syncStatus: diaryCmd.status,
        propagationStatus: diaryCmd.status,
        edgeCommandId: diaryCmd.commandId,
      };
    }),

  saveAssessment: teacherProcedure
    .input(
      z.object({
        id: z.string().optional(),
        classId: z.string().min(1),
        title: z.string().min(3),
        instructions: z.string().min(3),
        subject: z.string().min(2).default('Física Aplicada'),
        bimestre: z.enum(['1bim', '2bim', '3bim', '4bim']).default('4bim'),
        questions: z.array(
          z.object({
            id: z.string(),
            bncc: z.string(),
            stem: z.string().min(3),
            options: z.array(z.string()),
            answer: z.string(),
          })
        ),
        approveForRelease: z.boolean().default(false),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.db) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not configured.' });
      }
      const cls = await assertTeacherClassAccess(ctx.db, ctx.user, input.classId);

      const now = new Date();
      const assessmentId = input.id || `asm_${randomUUID().slice(0, 12)}`;
      const status = input.approveForRelease ? 'approved' : 'draft_ai';

      const existing = await ctx.db
        .select()
        .from(assessments)
        .where(eq(assessments.id, assessmentId))
        .limit(1);

      if (existing[0]) {
        const ownsAssessment =
          existing[0].institutionId === cls.institutionId &&
          existing[0].classId === cls.id &&
          (ctx.user.role !== 'teacher' || existing[0].teacherId === ctx.user.id);
        if (!ownsAssessment) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Acesso negado: avaliação pertence a outra turma, docente ou instituição.',
          });
        }

        await ctx.db
          .update(assessments)
          .set({
            title: input.title,
            instructions: input.instructions,
            subject: input.subject,
            bimestre: input.bimestre,
            questionsJson: JSON.stringify(input.questions),
            status,
            ...(input.approveForRelease ? { approvedByUserId: ctx.user.id, approvedAt: now } : {}),
          })
          .where(eq(assessments.id, assessmentId));
      } else {
        await ctx.db.insert(assessments).values({
          id: assessmentId,
          classId: input.classId,
          teacherId: ctx.user.id,
          institutionId: cls.institutionId,
          title: input.title,
          instructions: input.instructions,
          subject: input.subject,
          bimestre: input.bimestre,
          questionsJson: JSON.stringify(input.questions),
          status,
          approvedByUserId: input.approveForRelease ? ctx.user.id : null,
          approvedAt: input.approveForRelease ? now : null,
          createdAt: now,
        });
      }

      const asmCmd = input.approveForRelease
        ? await enqueueEdgeSyncCommand(ctx.db, {
            institutionId: cls.institutionId,
            targetDomain: 'grade_publication',
            action: 'ASSESSMENT_RELEASE_APPROVED',
            payload: {
              assessmentId,
              classId: input.classId,
              subject: input.subject,
              bimestre: input.bimestre,
              status,
              approvedByUserId: ctx.user.id,
              approvedAt: now.toISOString(),
              questionCount: input.questions.length,
            },
            actorUserId: ctx.user.id,
            conflictPolicy: 'teacher_hitl_published_authoritative',
          })
        : null;

      await recordAuditEvent(ctx.db, {
        userId: ctx.user.id,
        action: input.approveForRelease ? 'ASSESSMENT_HUMAN_APPROVED' : 'ASSESSMENT_DRAFT_SAVED',
        entity: 'assessments',
        entityId: assessmentId,
        details: {
          status,
          questionCount: input.questions.length,
          commandId: asmCmd?.commandId ?? null,
        },
        ipAddress: ctx.ipAddress,
      });

      return {
        ok: true,
        id: assessmentId,
        status,
        commandId: asmCmd?.commandId ?? null,
        syncStatus: asmCmd?.status ?? 'received_by_server',
      };
    }),

  reviewSubmissionGrade: teacherProcedure
    .input(
      z.object({
        submissionId: z.string().min(1),
        finalScore: z.number().min(0).max(10),
        feedback: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.db) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not configured.' });
      }

      const found = await ctx.db
        .select()
        .from(assessmentSubmissions)
        .where(eq(assessmentSubmissions.id, input.submissionId))
        .limit(1);
      const submission = found[0];
      if (!submission) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Submissão não localizada.' });
      }

      await assertStudentAccess(ctx.db, ctx.user, submission.studentId);

      const asmRows = await ctx.db
        .select()
        .from(assessments)
        .where(eq(assessments.id, submission.assessmentId))
        .limit(1);
      const assessment = asmRows[0];
      if (!assessment) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Avaliação vinculada não localizada.' });
      }
      const cls = await assertTeacherClassAccess(ctx.db, ctx.user, assessment.classId);

      const now = new Date();
      await ctx.db
        .update(assessmentSubmissions)
        .set({
          finalScore: input.finalScore,
          feedback: input.feedback ?? submission.feedback,
          reviewStatus: 'published',
          reviewedByTeacherId: ctx.user.id,
          reviewedAt: now,
        })
        .where(eq(assessmentSubmissions.id, submission.id));

      const existingGrades = await ctx.db
        .select()
        .from(grades)
        .where(
          and(
            eq(grades.studentId, submission.studentId),
            eq(grades.classId, assessment.classId),
            eq(grades.subject, assessment.subject),
            eq(grades.period, assessment.bimestre),
            eq(grades.evaluationType, 'prova')
          )
        )
        .limit(1);

      const gradeId = existingGrades[0]?.id ?? `grd_${randomUUID().slice(0, 12)}`;

      const gradeCmd = await enqueueEdgeSyncCommand(ctx.db, {
        institutionId: cls.institutionId,
        targetDomain: 'grade_publication',
        action: 'GRADE_PUBLISHED',
        payload: {
          submissionId: submission.id,
          gradeId,
          studentId: submission.studentId,
          classId: assessment.classId,
          subject: assessment.subject,
          period: assessment.bimestre,
          score: input.finalScore,
        },
        actorUserId: ctx.user.id,
        conflictPolicy: 'teacher_hitl_published_authoritative',
      });

      if (existingGrades[0]) {
        await ctx.db
          .update(grades)
          .set({
            score: input.finalScore,
            status: 'published',
            reviewedByTeacherId: ctx.user.id,
            propagationStatus: 'pending_at_edge',
            edgeCommandId: gradeCmd.commandId,
          })
          .where(eq(grades.id, gradeId));
      } else {
        await ctx.db.insert(grades).values({
          id: gradeId,
          studentId: submission.studentId,
          classId: assessment.classId,
          subject: assessment.subject,
          evaluationType: 'prova',
          score: input.finalScore,
          maxScore: 10,
          period: assessment.bimestre,
          teacherId: ctx.user.id,
          status: 'published',
          reviewedByTeacherId: ctx.user.id,
          propagationStatus: 'pending_at_edge',
          edgeCommandId: gradeCmd.commandId,
          createdAt: now,
        });
      }

      const auditHash = await recordAuditEvent(ctx.db, {
        userId: ctx.user.id,
        action: 'SUBMISSION_REVIEWED_AND_PUBLISHED_CNE_2026',
        entity: 'assessment_submissions',
        entityId: submission.id,
        details: { studentId: submission.studentId, finalScore: input.finalScore, gradeId, commandId: gradeCmd.commandId },
        ipAddress: ctx.ipAddress,
      });

      return {
        ok: true,
        submissionId: submission.id,
        gradeId,
        reviewStatus: 'published' as const,
        auditHash,
        commandId: gradeCmd.commandId,
        syncStatus: gradeCmd.status,
        propagationStatus: gradeCmd.status,
        edgeCommandId: gradeCmd.commandId,
      };
    }),

  saveGradesBatch: teacherProcedure
    .input(
      z.object({
        classId: z.string().min(1),
        subject: z.string().min(2),
        period: z.enum(['1bim', '2bim', '3bim', '4bim']).default('4bim'),
        evaluationType: z.enum(['prova', 'trabalho', 'participacao']).default('prova'),
        maxScore: z.number().min(1).max(100).default(10),
        entries: z
          .array(
            z.object({
              studentId: z.string().min(1),
              score: z.number().min(0).max(100),
            })
          )
          .min(1),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.db) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not configured.' });
      }
      const cls = await assertTeacherClassAccess(ctx.db, ctx.user, input.classId);
      const now = new Date();

      const resolvedOps: Array<{
        studentId: string;
        score: number;
        gradeId: string;
        isExisting: boolean;
      }> = [];

      for (const entry of input.entries) {
        if (entry.score > input.maxScore) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `Nota (${entry.score}) excede o máximo configurado (${input.maxScore}).`,
          });
        }
        const student = await assertStudentAccess(ctx.db, ctx.user, entry.studentId);
        if (student.classId !== cls.id) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Estudante informado não pertence à turma selecionada.',
          });
        }

        const existing = await ctx.db
          .select({ id: grades.id })
          .from(grades)
          .where(
            and(
              eq(grades.studentId, entry.studentId),
              eq(grades.classId, input.classId),
              eq(grades.subject, input.subject),
              eq(grades.period, input.period),
              eq(grades.evaluationType, input.evaluationType)
            )
          )
          .limit(1);

        resolvedOps.push({
          studentId: entry.studentId,
          score: entry.score,
          gradeId: existing[0]?.id ?? `grd_${randomUUID().slice(0, 12)}`,
          isExisting: Boolean(existing[0]),
        });
      }

      const gradeIds = resolvedOps.map((op) => op.gradeId);

      const batchCmd = await enqueueEdgeSyncCommand(ctx.db, {
        institutionId: cls.institutionId,
        targetDomain: 'grade_publication',
        action: 'GRADES_BATCH_PUBLISHED',
        payload: {
          classId: input.classId,
          subject: input.subject,
          period: input.period,
          evaluationType: input.evaluationType,
          maxScore: input.maxScore,
          gradeIds,
          entries: input.entries,
        },
        actorUserId: ctx.user.id,
        conflictPolicy: 'teacher_hitl_published_authoritative',
      });

      for (const op of resolvedOps) {
        if (op.isExisting) {
          await ctx.db
            .update(grades)
            .set({
              score: op.score,
              maxScore: input.maxScore,
              status: 'published',
              reviewedByTeacherId: ctx.user.id,
              propagationStatus: 'pending_at_edge',
              edgeCommandId: batchCmd.commandId,
            })
            .where(eq(grades.id, op.gradeId));
        } else {
          await ctx.db.insert(grades).values({
            id: op.gradeId,
            studentId: op.studentId,
            classId: input.classId,
            subject: input.subject,
            evaluationType: input.evaluationType,
            score: op.score,
            maxScore: input.maxScore,
            period: input.period,
            teacherId: ctx.user.id,
            status: 'published',
            reviewedByTeacherId: ctx.user.id,
            propagationStatus: 'pending_at_edge',
            edgeCommandId: batchCmd.commandId,
            createdAt: now,
          });
        }
      }

      const auditHash = await recordAuditEvent(ctx.db, {
        userId: ctx.user.id,
        action: 'GRADES_BATCH_PUBLISHED',
        entity: 'grades',
        entityId: input.classId,
        details: {
          subject: input.subject,
          period: input.period,
          evaluationType: input.evaluationType,
          count: input.entries.length,
          gradeIds,
          commandId: batchCmd.commandId,
        },
        ipAddress: ctx.ipAddress,
      });

      return {
        ok: true,
        count: input.entries.length,
        gradeIds,
        auditHash,
        commandId: batchCmd.commandId,
        syncStatus: batchCmd.status,
        propagationStatus: batchCmd.status,
        edgeCommandId: batchCmd.commandId,
      };
    }),

  applyRadarAction: teacherProcedure
    .input(
      z.object({
        occurrenceId: z.string().min(1),
        actionApplied: z.string().min(3),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.db) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not configured.' });
      }
      const found = await ctx.db
        .select()
        .from(occurrences)
        .where(eq(occurrences.id, input.occurrenceId))
        .limit(1);
      const occ = found[0];
      if (!occ) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Ocorrência não localizada.' });
      }
      const cls = await assertTeacherClassAccess(ctx.db, ctx.user, occ.classId);

      const radarCmd = await enqueueEdgeSyncCommand(ctx.db, {
        institutionId: cls.institutionId,
        targetDomain: 'occurrence_ack',
        action: 'RADAR_ACTION_APPLIED',
        actorUserId: ctx.user.id,
        conflictPolicy: 'teacher_diary_authoritative',
        payload: {
          occurrenceId: occ.id,
          studentId: occ.studentId,
          classId: occ.classId,
          actionApplied: input.actionApplied,
        },
      });

      await ctx.db
        .update(occurrences)
        .set({
          actionApplied: input.actionApplied,
          propagationStatus: 'pending_at_edge',
          edgeCommandId: radarCmd.commandId,
        })
        .where(eq(occurrences.id, occ.id));

      const auditHash = await recordAuditEvent(ctx.db, {
        userId: ctx.user.id,
        action: 'PEDAGOGICAL_RADAR_ACTION_APPLIED',
        entity: 'occurrences',
        entityId: occ.id,
        details: {
          studentId: occ.studentId,
          actionApplied: input.actionApplied,
          commandId: radarCmd.commandId,
        },
        ipAddress: ctx.ipAddress,
      });

      return {
        ok: true,
        occurrenceId: occ.id,
        actionApplied: input.actionApplied,
        auditHash,
        commandId: radarCmd.commandId,
        propagationStatus: radarCmd.status,
        edgeCommandId: radarCmd.commandId,
      };
    }),
});
