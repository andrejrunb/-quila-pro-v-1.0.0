import { randomUUID } from 'node:crypto';
import { router, parentProcedure } from '../trpc';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import {
  attendance,
  biometricConsentLogs,
  biometricPurgeLogs,
  classes,
  grades,
  invoices,
  lessonDiaries,
  notifications,
  occurrences,
  students,
  users,
} from '@aquila/db';
import { and, desc, eq } from 'drizzle-orm';
import {
  assertStudentAccess,
  computeSha256,
  contestPublishedGrade,
  enqueueEdgeSyncCommand,
  nextMonotonicTimestampMs,
  recordAuditEvent,
  resolveAccessibleStudentIds,
  resolveInstitutionSyncStatus,
  sanitizeOutboundStudentRow,
  type InstitutionSyncStatus,
} from '../lib/governance';

function buildEmptyParentWorkspace(
  guardianName: string,
  syncStatus: InstitutionSyncStatus = {
    state: 'received_by_server',
    pendingCommandCount: 0,
    lastSyncedAt: null,
    staleReason: null,
  }
) {
  return {
    guardianName,
    students: [],
    activeStudent: null,
    activeClass: null,
    attendanceTimeline: [],
    attendanceRate: 0,
    dinnerConversations: [],
    grades: [],
    invoices: [],
    occurrences: [],
    notifications: [],
    biometricConsent: {
      enabled: false,
      status: 'disabled',
      documentVersion: 'v2.1-ANPD-2026',
      purpose: 'optional_biometric_portaria_local_edge',
      manifestationType: null as string | null,
      propagationStatus: 'not_applicable',
      consentLogId: null as string | null,
      edgeCommandId: null as string | null,
      latestReceiptSha256: null as string | null,
    },
    syncStatus,
  };
}

/** Normaliza CPF brasileiro (11 dígitos não repetidos) e retorna máscara minimizada para LGPD. */
function validateAndMaskGuardianCpf(rawCpf: string): string {
  const digits = rawCpf.replace(/\D/g, '');
  if (!/^\d{11}$/.test(digits) || /^(\d)\1{10}$/.test(digits)) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Informe um CPF válido com 11 dígitos numéricos.',
    });
  }
  return `***.${digits.slice(3, 6)}.${digits.slice(6, 9)}-**`;
}

export const parentRouter = router({
  getWorkspace: parentProcedure
    .input(z.object({ studentId: z.string().optional() }).optional())
    .query(async ({ input, ctx }) => {
      if (!ctx.db) {
        return buildEmptyParentWorkspace(ctx.user.username);
      }

      const allowedIds = await resolveAccessibleStudentIds(ctx.db, ctx.user);

      if (input?.studentId && !allowedIds.includes(input.studentId)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Acesso negado: o estudante informado não pertence ao vínculo ativo deste responsável.',
        });
      }

      if (allowedIds.length === 0) {
        const emptySyncStatus = await resolveInstitutionSyncStatus(ctx.db, ctx.user.institutionId);
        const guardianRows = await ctx.db
          .select({ name: users.name })
          .from(users)
          .where(eq(users.id, ctx.user.id))
          .limit(1);
        return buildEmptyParentWorkspace(guardianRows[0]?.name ?? ctx.user.username, emptySyncStatus);
      }

      const selectedStudentId =
        input?.studentId && allowedIds.includes(input.studentId)
          ? input.studentId
          : allowedIds[0];

      const linkedStudents = [];
      for (const sid of allowedIds) {
        const sRows = await ctx.db.select().from(students).where(eq(students.id, sid)).limit(1);
        if (sRows[0]) linkedStudents.push(sanitizeOutboundStudentRow(sRows[0]));
      }

      const guardianRows = await ctx.db
        .select({ name: users.name })
        .from(users)
        .where(eq(users.id, ctx.user.id))
        .limit(1);
      const guardianName = guardianRows[0]?.name ?? ctx.user.username;

      const activeStudent = linkedStudents.find((s) => s.id === selectedStudentId) ?? linkedStudents[0] ?? null;
      if (!activeStudent) {
        const emptySyncStatus = await resolveInstitutionSyncStatus(ctx.db, ctx.user.institutionId);
        return buildEmptyParentWorkspace(guardianName, emptySyncStatus);
      }

      const classRows = activeStudent.classId
        ? await ctx.db.select().from(classes).where(eq(classes.id, activeStudent.classId)).limit(1)
        : [];
      const activeClass = classRows[0] ?? null;

      const attRows = await ctx.db
        .select()
        .from(attendance)
        .where(eq(attendance.studentId, activeStudent.id))
        .orderBy(desc(attendance.timestamp))
        .limit(20);

      const presentCount = attRows.filter((a) => a.status === 'present' || a.status === 'late').length;
      const attendanceRate = attRows.length > 0 ? Number(((presentCount / attRows.length) * 100).toFixed(1)) : 100;

      const diaries = activeStudent.classId
        ? await ctx.db
            .select()
            .from(lessonDiaries)
            .where(and(eq(lessonDiaries.classId, activeStudent.classId), eq(lessonDiaries.status, 'published')))
            .orderBy(desc(lessonDiaries.createdAt))
            .limit(6)
        : [];

      const dinnerConversations = diaries
        .filter((d) => Boolean(d.dinnerPrompt))
        .map((d) => ({
          id: d.id,
          subject: d.subject,
          topic: d.topic,
          prompt: d.dinnerPrompt as string,
          context: `Registrado em ${d.date}`,
        }));

      // CNE 2026: Parents ONLY see published grades reviewed by a human teacher
      const studentGrades = await ctx.db
        .select()
        .from(grades)
        .where(and(eq(grades.studentId, activeStudent.id), eq(grades.status, 'published')));

      const studentInvoices = await ctx.db
        .select()
        .from(invoices)
        .where(eq(invoices.studentId, activeStudent.id))
        .orderBy(desc(invoices.dueDate));

      const studentOccurrences = await ctx.db
        .select()
        .from(occurrences)
        .where(eq(occurrences.studentId, activeStudent.id))
        .orderBy(desc(occurrences.createdAt));

      const userNotifications = await ctx.db
        .select()
        .from(notifications)
        .where(eq(notifications.recipientUserId, ctx.user.id))
        .orderBy(desc(notifications.createdAt))
        .limit(15);

      const consentRows = await ctx.db
        .select()
        .from(biometricConsentLogs)
        .where(eq(biometricConsentLogs.studentId, activeStudent.id))
        .orderBy(desc(biometricConsentLogs.recordedAtMs), desc(biometricConsentLogs.grantedAt))
        .limit(1);

      const latestConsent = consentRows[0];
      const consentEnabled = latestConsent?.status === 'granted';

      const syncStatus = await resolveInstitutionSyncStatus(ctx.db, activeStudent.institutionId);

      return {
        guardianName,
        students: linkedStudents,
        activeStudent,
        activeClass,
        attendanceTimeline: attRows.map((a) => ({
          id: a.id,
          date: a.date,
          time: a.timestamp.toISOString().slice(11, 19),
          status: a.status,
          channel: a.detectedBy === 'qr_badge' ? 'Crachá QR Dinâmico' : 'Chamada Digital Docente',
        })),
        attendanceRate,
        dinnerConversations,
        grades: studentGrades,
        invoices: studentInvoices,
        occurrences: studentOccurrences,
        notifications: userNotifications,
        biometricConsent: {
          enabled: consentEnabled,
          status: latestConsent?.status ?? 'disabled',
          documentVersion: latestConsent?.consentVersion ?? 'v2.1-ANPD-2026',
          purpose: latestConsent?.purpose ?? 'optional_biometric_portaria_local_edge',
          manifestationType: latestConsent?.manifestationType ?? null,
          propagationStatus: latestConsent?.propagationStatus ?? 'not_applicable',
          consentLogId: latestConsent?.id ?? null,
          edgeCommandId: latestConsent?.edgeCommandId ?? null,
          latestReceiptSha256: latestConsent?.auditSignatureSha256 ?? null,
        },
        syncStatus,
      };
    }),

  signOccurrence: parentProcedure
    .input(
      z.object({
        occurrenceId: z.string().min(1),
        manifestationType: z
          .enum(['SCIENCE_ACKNOWLEDGED', 'DISAGREEMENT_CONTESTATION'])
          .default('SCIENCE_ACKNOWLEDGED'),
        contestationReason: z.string().trim().max(1000).optional(),
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
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Ocorrência não encontrada.' });
      }

      const student = await assertStudentAccess(ctx.db, ctx.user, occ.studentId);

      if (occ.signedAt && occ.manifestationType && occ.manifestationType !== input.manifestationType) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Esta ocorrência já possui manifestação formal distinta registrada anteriormente.',
        });
      }

      const contestationReason = input.contestationReason?.trim() || null;
      if (
        input.manifestationType === 'DISAGREEMENT_CONTESTATION' &&
        (!contestationReason || contestationReason.length < 5)
      ) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'A contestação formal da ocorrência exige justificativa com pelo menos 5 caracteres.',
        });
      }

      const recordedAt = new Date();
      const documentVersion = 'occ-v1';
      const contentHashSha256 = computeSha256({
        occurrenceId: occ.id,
        studentId: occ.studentId,
        authenticatedUserId: ctx.user.id,
        manifestationType: input.manifestationType,
        contestationReason,
        documentVersion,
        recordedAt: recordedAt.toISOString(),
      });

      const edgeCmd = await enqueueEdgeSyncCommand(ctx.db, {
        institutionId: student.institutionId,
        targetDomain: 'occurrence_ack',
        action: input.manifestationType,
        actorUserId: ctx.user.id,
        conflictPolicy: 'guardian_explicit_latest',
        payload: {
          occurrenceId: occ.id,
          studentId: occ.studentId,
          manifestationType: input.manifestationType,
          contestationReason,
          documentVersion,
          contentHashSha256,
          recordedAt: recordedAt.toISOString(),
        },
      });

      await ctx.db
        .update(occurrences)
        .set({
          signedByParentUserId: ctx.user.id,
          signedAt: recordedAt,
          signatureHashSha256: contentHashSha256,
          manifestationType: input.manifestationType,
          contestationReason,
          documentVersion,
          propagationStatus: 'pending_at_edge',
          edgeCommandId: edgeCmd.commandId,
        })
        .where(eq(occurrences.id, occ.id));

      await recordAuditEvent(ctx.db, {
        userId: ctx.user.id,
        action:
          input.manifestationType === 'DISAGREEMENT_CONTESTATION'
            ? 'OCCURRENCE_CONTESTED_BY_GUARDIAN'
            : 'OCCURRENCE_ACKNOWLEDGED_BY_GUARDIAN',
        entity: 'occurrences',
        entityId: occ.id,
        details: {
          studentId: occ.studentId,
          authenticatedUserId: ctx.user.id,
          manifestationType: input.manifestationType,
          contestationReasonProvided: Boolean(contestationReason),
          documentVersion,
          contentHashSha256,
          edgeCommandId: edgeCmd.commandId,
        },
        ipAddress: ctx.ipAddress,
      });

      return {
        ok: true,
        occurrenceId: occ.id,
        authenticatedUserId: ctx.user.id,
        manifestationType: input.manifestationType,
        contestationReason,
        documentVersion,
        recordedAt: recordedAt.toISOString(),
        signedAt: recordedAt.toISOString(),
        contentHashSha256,
        signatureHashSha256: contentHashSha256,
        propagationStatus: edgeCmd.status,
        edgeCommandId: edgeCmd.commandId,
        note: 'Registro de ciência autenticada na plataforma; integridade verificada por hash SHA-256 (ciência de leitura não equivale a concordância nem a assinatura qualificada ICP-Brasil).',
      };
    }),

  contestGrade: parentProcedure
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

  setBiometricConsent: parentProcedure
    .input(
      z.object({
        studentId: z.string().min(1),
        decision: z.enum(['grant', 'revoke']),
        guardianCpf: z.string().min(11).max(18).optional(),
        guardianName: z.string().trim().min(3).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.db) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not configured.' });
      }

      const student = await assertStudentAccess(ctx.db, ctx.user, input.studentId);
      const now = new Date();
      const recordedAtMs = nextMonotonicTimestampMs();
      const documentVersion = 'v2.1-ANPD-2026';
      const purpose = 'optional_biometric_portaria_local_edge';
      const consentLogId = `bcl_${randomUUID().slice(0, 12)}`;

      if (input.decision === 'grant') {
        if (!input.guardianCpf || !input.guardianName) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Consentimento LGPD Art. 14 exige nome completo e CPF do responsável legal.',
          });
        }
        const maskedCpf = validateAndMaskGuardianCpf(input.guardianCpf);
        const contentHashSha256 = computeSha256({
          action: 'BIOMETRIC_CONSENT_GRANTED',
          consentLogId,
          studentId: student.id,
          institutionId: student.institutionId,
          authenticatedUserId: ctx.user.id,
          documentVersion,
          purpose,
          guardianName: input.guardianName,
          recordedAt: now.toISOString(),
        });

        const edgeCmd = await enqueueEdgeSyncCommand(ctx.db, {
          institutionId: student.institutionId,
          targetDomain: 'consent',
          action: 'OPT_IN_CONSENT',
          actorUserId: ctx.user.id,
          conflictPolicy: 'guardian_explicit_latest',
          payload: {
            consentLogId,
            studentId: student.id,
            decision: 'grant',
            documentVersion,
            purpose,
            contentHashSha256,
            recordedAt: now.toISOString(),
            recordedAtMs,
          },
        });

        await ctx.db.insert(biometricConsentLogs).values({
          id: consentLogId,
          studentId: student.id,
          institutionId: student.institutionId,
          guardianCpf: maskedCpf,
          guardianName: input.guardianName,
          consentVersion: documentVersion,
          purpose,
          manifestationType: 'OPT_IN_CONSENT',
          propagationStatus: 'pending_at_edge',
          edgeCommandId: edgeCmd.commandId,
          status: 'granted',
          grantedAt: now,
          recordedAtMs,
          revokedAt: null,
          auditSignatureSha256: contentHashSha256,
        });

        await recordAuditEvent(ctx.db, {
          userId: ctx.user.id,
          action: 'BIOMETRIC_CONSENT_GRANTED',
          entity: 'biometric_consent_logs',
          entityId: student.id,
          details: {
            consentLogId,
            authenticatedUserId: ctx.user.id,
            documentVersion,
            purpose,
            contentHashSha256,
            edgeCommandId: edgeCmd.commandId,
          },
          ipAddress: ctx.ipAddress,
        });

        return {
          ok: true,
          consentLogId,
          status: 'granted' as const,
          authenticatedUserId: ctx.user.id,
          manifestationType: 'OPT_IN_CONSENT' as const,
          documentVersion,
          purpose,
          contentHashSha256,
          auditSignatureSha256: contentHashSha256,
          propagationStatus: edgeCmd.status,
          edgeCommandId: edgeCmd.commandId,
          timestamp: now.toISOString(),
        };
      }

      // LGPD Art. 16 Revocation Request + Server Projection Cleanup + Outbound Command to School Edge
      const maskedCpf = input.guardianCpf ? validateAndMaskGuardianCpf(input.guardianCpf) : 'verificado-sessao';
      const purgeLogId = `bpl_${randomUUID().slice(0, 12)}`;
      const contentHashSha256 = computeSha256({
        action: 'BIOMETRIC_CONSENT_REVOKED',
        consentLogId,
        purgeLogId,
        studentId: student.id,
        institutionId: student.institutionId,
        authenticatedUserId: ctx.user.id,
        documentVersion,
        purpose,
        recordedAt: now.toISOString(),
      });

      const edgeCmd = await enqueueEdgeSyncCommand(ctx.db, {
        institutionId: student.institutionId,
        targetDomain: 'consent',
        action: 'REVOCATION_PURGE',
        actorUserId: ctx.user.id,
        conflictPolicy: 'revocation_always_wins',
        payload: {
          consentLogId,
          purgeLogId,
          studentId: student.id,
          decision: 'revoke',
          documentVersion,
          purpose,
          contentHashSha256,
          recordedAt: now.toISOString(),
          recordedAtMs,
        },
      });

      await ctx.db.insert(biometricConsentLogs).values({
        id: consentLogId,
        studentId: student.id,
        institutionId: student.institutionId,
        guardianCpf: maskedCpf,
        guardianName: input.guardianName || ctx.user.username,
        consentVersion: documentVersion,
        purpose,
        manifestationType: 'REVOCATION',
        propagationStatus: 'pending_at_edge',
        edgeCommandId: edgeCmd.commandId,
        status: 'revoked',
        grantedAt: now,
        recordedAtMs,
        revokedAt: now,
        auditSignatureSha256: contentHashSha256,
      });

      await ctx.db
        .update(students)
        .set({ faceEncoding: null, faceEmbeddingHash: null })
        .where(eq(students.id, student.id));

      await ctx.db.insert(biometricPurgeLogs).values({
        id: purgeLogId,
        studentId: student.id,
        institutionId: student.institutionId,
        reason: 'consent_revoked',
        status: 'purge_requested',
        edgeCommandId: edgeCmd.commandId,
        purgedByUserId: ctx.user.id,
        purgedAt: now,
        evidenceHashSha256: contentHashSha256,
        notes: 'Solicitação LGPD Art. 16 registrada na nuvem; aguardando confirmação de expurgo físico pelo Edge escolar.',
      });

      await recordAuditEvent(ctx.db, {
        userId: ctx.user.id,
        action: 'BIOMETRIC_CONSENT_REVOKED',
        entity: 'biometric_purge_logs',
        entityId: student.id,
        details: {
          consentLogId,
          purgeLogId,
          authenticatedUserId: ctx.user.id,
          documentVersion,
          purpose,
          contentHashSha256,
          propagationStatus: edgeCmd.status,
          edgeCommandId: edgeCmd.commandId,
        },
        ipAddress: ctx.ipAddress,
      });

      return {
        ok: true,
        consentLogId,
        purgeLogId,
        status: 'revoked' as const,
        authenticatedUserId: ctx.user.id,
        manifestationType: 'REVOCATION' as const,
        documentVersion,
        purpose,
        contentHashSha256,
        auditSignatureSha256: contentHashSha256,
        propagationStatus: edgeCmd.status,
        edgeCommandId: edgeCmd.commandId,
        retentionNotice:
          'Revogação recebida pelo servidor e ponteiros locais removidos na nuvem. O comando de expurgo biométrico permanece pendente na escola (Edge) até confirmação de recebimento/execução local, preservando registros legais de auditoria quando aplicável.',
        timestamp: now.toISOString(),
      };
    }),
});
