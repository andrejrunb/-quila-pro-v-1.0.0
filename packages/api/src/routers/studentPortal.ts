import { randomUUID } from 'node:crypto';
import { router, studentProcedure } from '../trpc';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import {
  attendance,
  classes,
  grades,
  schedules,
  studentMissions,
  students,
  studySessions,
} from '@aquila/db';
import { and, desc, eq } from 'drizzle-orm';
import {
  assertStudentAccess,
  contestPublishedGrade,
  recordAuditEvent,
  resolveAccessibleStudentIds,
  resolveInstitutionSyncStatus,
  sanitizeOutboundStudentRow,
  type InstitutionSyncStatus,
} from '../lib/governance';
import { evaluateStudentStageAiPolicy, type StudentAiPolicyResult } from '../lib/cnePolicy';

const DEFAULT_BLOCKED_AI_POLICY: StudentAiPolicyResult = {
  blocked: true,
  stage: 'NAO_IDENTIFICADO',
  ageYears: null,
  reason: 'Parecer CNE/CP nº 15/2026 (fail-closed): estudante não vinculado à sessão.',
};

function buildEmptyStudentWorkspace(syncStatus: InstitutionSyncStatus) {
  return {
    student: null,
    activeClass: null,
    latestAttendance: null,
    grades: [],
    schedules: [],
    missions: [],
    xpPoints: 0,
    coins: 0,
    streakDays: 0,
    recentSessions: [],
    aiPolicy: DEFAULT_BLOCKED_AI_POLICY,
    syncStatus,
  };
}

/** Remove padrões triviais de PII (CPF, e-mail, telefone) antes de persistir anotações pedagógicas. */
function sanitizePedagogicalTopic(rawTopic?: string): string | null {
  if (!rawTopic) return null;
  return rawTopic
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[email-redigido]')
    .replace(/\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g, '[cpf-redigido]')
    .replace(/\b(?:\+?55\s?)?(?:\(?\d{2}\)?\s?)?\d{4,5}-?\d{4}\b/g, '[telefone-redigido]')
    .trim()
    .slice(0, 140);
}

function buildPedagogicalHint(topic: string): string {
  const lower = topic.toLowerCase();
  if (lower.includes('física') || lower.includes('termo') || lower.includes('carnot')) {
    return 'Na Primeira Lei da Termodinâmica (ΔU = Q - W), identifique o sinal do calor (Q) e do trabalho (W). Para o ciclo de Carnot, use η = 1 - (Tfria / Tquente) em Kelvin.';
  }
  if (lower.includes('redação') || lower.includes('enem')) {
    return 'Estruture a proposta de intervenção com 5 elementos explícitos: Agente, Ação, Meio/Modo, Efeito e Detalhamento, respeitando os direitos humanos.';
  }
  if (lower.includes('matemática') || lower.includes('parábola') || lower.includes('função')) {
    return 'Em funções quadráticas f(x)=ax²+bx+c, o vértice V=(Xv, Yv) usa Xv = -b/(2a) e Yv = -Δ/(4a). Verifique a concavidade pelo sinal de a.';
  }
  return 'Decomponha o problema em dados conhecidos, incógnita e unidade de medida antes de iniciar os cálculos. Quer praticar uma lista guiada da Trilha BNCC?';
}

export const studentPortalRouter = router({
  getWorkspace: studentProcedure
    .input(z.object({ studentId: z.string().optional() }).optional())
    .query(async ({ input, ctx }) => {
      if (!ctx.db) {
        return buildEmptyStudentWorkspace(await resolveInstitutionSyncStatus(ctx.db as never, undefined));
      }

      const emptySyncStatus = await resolveInstitutionSyncStatus(ctx.db, ctx.user.institutionId);
      const allowedIds = await resolveAccessibleStudentIds(ctx.db, ctx.user);

      let rawStudent: typeof students.$inferSelect | undefined;
      if (input?.studentId) {
        rawStudent = await assertStudentAccess(ctx.db, ctx.user, input.studentId);
      } else if (allowedIds.length > 0) {
        const studentRows = await ctx.db
          .select()
          .from(students)
          .where(eq(students.id, allowedIds[0]))
          .limit(1);
        rawStudent = studentRows[0];
      }

      if (!rawStudent) {
        return buildEmptyStudentWorkspace(emptySyncStatus);
      }

      const student = sanitizeOutboundStudentRow(rawStudent);
      const classRows = student.classId
        ? await ctx.db.select().from(classes).where(eq(classes.id, student.classId)).limit(1)
        : [];
      const activeClass = classRows[0] ?? null;

      const attRows = await ctx.db
        .select()
        .from(attendance)
        .where(eq(attendance.studentId, student.id))
        .orderBy(desc(attendance.timestamp))
        .limit(1);

      // CNE 2026: only teacher-reviewed published grades are visible to students
      const publishedGrades = await ctx.db
        .select()
        .from(grades)
        .where(and(eq(grades.studentId, student.id), eq(grades.status, 'published')));

      const classSchedules = student.classId
        ? await ctx.db.select().from(schedules).where(eq(schedules.classId, student.classId))
        : [];

      const missions = await ctx.db
        .select()
        .from(studentMissions)
        .where(eq(studentMissions.studentId, student.id));

      const sessions = await ctx.db
        .select()
        .from(studySessions)
        .where(eq(studySessions.studentId, student.id))
        .orderBy(desc(studySessions.createdAt))
        .limit(30);

      const missionXp = missions.filter((m) => m.completed).reduce((acc, m) => acc + m.rewardXp, 0);
      const sessionXp = sessions.reduce((acc, s) => acc + s.earnedXp, 0);
      const coins = missions.filter((m) => m.completed).reduce((acc, m) => acc + m.rewardCoins, 0);
      const streakDays = new Set(sessions.map((s) => s.createdAt.toISOString().slice(0, 10))).size;

      const aiPolicy = evaluateStudentStageAiPolicy({
        grade: activeClass?.grade ?? null,
        className: activeClass?.name ?? null,
        dateOfBirth: rawStudent.dateOfBirth,
      });
      const syncStatus = await resolveInstitutionSyncStatus(ctx.db, student.institutionId);

      return {
        student,
        activeClass,
        latestAttendance: attRows[0] ?? null,
        grades: publishedGrades,
        schedules: classSchedules,
        missions,
        xpPoints: missionXp + sessionXp,
        coins,
        streakDays,
        recentSessions: sessions,
        aiPolicy,
        syncStatus,
      };
    }),

  contestGrade: studentProcedure
    .input(
      z.object({
        gradeId: z.string().min(1),
        reason: z.string().trim().min(10).max(1000),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.db) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not configured.' });
      }
      return contestPublishedGrade(ctx.db, ctx.user, input, ctx.ipAddress);
    }),

  advanceMission: studentProcedure
    .input(z.object({ missionId: z.string(), delta: z.number().min(5).max(100).default(40) }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.db) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not configured.' });
      }

      const found = await ctx.db
        .select()
        .from(studentMissions)
        .where(eq(studentMissions.id, input.missionId))
        .limit(1);
      const mission = found[0];
      if (!mission) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Missão não encontrada.' });
      }

      await assertStudentAccess(ctx.db, ctx.user, mission.studentId);

      const nextProgress = Math.min(100, mission.progress + input.delta);
      const completed = nextProgress >= 100;
      const now = new Date();

      await ctx.db
        .update(studentMissions)
        .set({ progress: nextProgress, completed, updatedAt: now })
        .where(eq(studentMissions.id, mission.id));

      if (completed && !mission.completed) {
        await ctx.db.insert(studySessions).values({
          id: `ses_${randomUUID().slice(0, 12)}`,
          studentId: mission.studentId,
          institutionId: mission.institutionId,
          mode: 'flashcards_srs',
          durationSeconds: 180,
          earnedXp: mission.rewardXp,
          notes: `Missão concluída: ${mission.title}`,
          createdAt: now,
        });
      }

      await recordAuditEvent(ctx.db, {
        userId: ctx.user.id,
        action: 'STUDENT_MISSION_PROGRESSED',
        entity: 'student_missions',
        entityId: mission.id,
        details: { progress: nextProgress, completed },
        ipAddress: ctx.ipAddress,
      });

      return { ok: true, missionId: mission.id, progress: nextProgress, completed };
    }),

  logStudySession: studentProcedure
    .input(
      z.object({
        studentId: z.string().optional(),
        mode: z.enum(['focus_sprint_3min', 'kumon_3min', 'flashcards_srs', 'essay_lab', 'socratic_tutor']),
        durationSeconds: z.number().min(10).max(7200).default(180),
        topic: z.string().max(400).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.db) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not configured.' });
      }

      const allowedIds = await resolveAccessibleStudentIds(ctx.db, ctx.user);
      const targetStudentId = input.studentId || allowedIds[0];
      if (!targetStudentId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Nenhum estudante vinculado à sessão.' });
      }
      const student = await assertStudentAccess(ctx.db, ctx.user, targetStudentId);
      const canonicalMode = input.mode === 'kumon_3min' ? ('focus_sprint_3min' as const) : input.mode;

      const classRows = student.classId
        ? await ctx.db.select().from(classes).where(eq(classes.id, student.classId)).limit(1)
        : [];
      const activeClass = classRows[0] ?? null;

      const aiPolicy = evaluateStudentStageAiPolicy({
        grade: activeClass?.grade ?? null,
        className: activeClass?.name ?? null,
        dateOfBirth: student.dateOfBirth,
      });

      if ((canonicalMode === 'socratic_tutor' || canonicalMode === 'essay_lab') && aiPolicy.blocked) {
        await recordAuditEvent(ctx.db, {
          userId: ctx.user.id,
          action: 'CNE_15_2026_EARLY_STAGE_AI_BLOCKED',
          entity: 'students',
          entityId: student.id,
          details: {
            mode: canonicalMode,
            stage: aiPolicy.stage,
            ageYears: aiPolicy.ageYears,
          },
          ipAddress: ctx.ipAddress,
        });
        throw new TRPCError({
          code: 'FORBIDDEN',
          message:
            aiPolicy.reason ??
            'Parecer CNE/CP nº 15/2026: acesso autônomo à IA generativa bloqueado para esta etapa escolar.',
        });
      }

      const xpByMode: Record<typeof canonicalMode, number> = {
        focus_sprint_3min: 50,
        flashcards_srs: 40,
        essay_lab: 60,
        socratic_tutor: 25,
      };
      const earnedXp = xpByMode[canonicalMode];
      const now = new Date();
      // Store only sanitized pedagogical topic summary locally (never send underage essays to cloud LLM)
      const safeTopicNote = sanitizePedagogicalTopic(input.topic) || canonicalMode;

      const sessionId = `ses_${randomUUID().slice(0, 12)}`;
      await ctx.db.insert(studySessions).values({
        id: sessionId,
        studentId: student.id,
        institutionId: student.institutionId,
        mode: canonicalMode,
        durationSeconds: input.durationSeconds,
        earnedXp,
        notes: safeTopicNote,
        createdAt: now,
      });

      return {
        ok: true,
        sessionId,
        mode: canonicalMode,
        earnedXp,
        pedagogicalHintMode: canonicalMode === 'socratic_tutor' ? ('deterministic_local_scaffold' as const) : null,
        reply: canonicalMode === 'socratic_tutor' ? buildPedagogicalHint(safeTopicNote) : undefined,
      };
    }),
});
