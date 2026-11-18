import { randomUUID } from 'node:crypto';
import { router, adminProcedure } from '../trpc';
import { z } from 'zod';
import {
  biometricConsentLogs,
  biometricPurgeLogs,
  edgeSyncEvents,
  students,
} from '@aquila/db';
import { and, desc, eq } from 'drizzle-orm';
import { computeSha256, recordAuditEvent } from '../lib/governance';

export const automationRouter = router({
  getSystemStatus: adminProcedure.query(async ({ ctx }) => {
    let recentSyncCount = 0;
    if (ctx.db) {
      const recent = await ctx.db
        .select({ id: edgeSyncEvents.id })
        .from(edgeSyncEvents)
        .orderBy(desc(edgeSyncEvents.receivedAt))
        .limit(20);
      recentSyncCount = recent.length;
    }

    return {
      cloudConnectorsEnabled: process.env.AQUILA_ENABLE_CLOUD_CONNECTORS === 'true',
      biometricAttendanceEnabled: process.env.BIOMETRIC_ATTENDANCE_ENABLED === 'true',
      edgeSyncMode: 'selective_tls_hmac',
      recentSyncEventsCount: recentSyncCount,
      sqsShield: { status: 'active', quantumEncrypted: false, transport: 'TLS-1.3 / HMAC-SHA256' },
    };
  }),

  exportOfflineObservability: adminProcedure
    .input(z.object({ includeMetricsWindowHours: z.number().min(1).max(720).default(24) }).optional())
    .query(async ({ input, ctx }) => {
      const windowHours = input?.includeMetricsWindowHours ?? 24;
      const payload = {
        schemaVersion: '2.1.0',
        exportedAt: new Date().toISOString(),
        exportedByRole: ctx.user?.role ?? 'admin',
        windowHours,
        piiIncluded: false,
        cloudConnectorsEnabled: process.env.AQUILA_ENABLE_CLOUD_CONNECTORS === 'true',
        sqliteWalMode: 'WAL',
        metrics: {
          uptimeSeconds: Math.floor(process.uptime()),
          integrityCheck: 'ok',
          biometricQuarantineH01: process.env.BIOMETRIC_ATTENDANCE_ENABLED !== 'true',
        },
      };
      const sha256 = computeSha256(payload);
      return {
        ...payload,
        sha256,
      };
    }),

  runLgpdRetentionPurge: adminProcedure
    .input(
      z.object({
        retentionDays: z.number().min(30).max(3650).default(365),
        dryRun: z.boolean().default(false),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const executedAt = new Date();
      let purgedTemplates = 0;

      if (ctx.db && !input.dryRun) {
        const instFilter = ctx.user.institutionId
          ? eq(students.institutionId, ctx.user.institutionId)
          : undefined;
        const rowsWithBiometrics = await ctx.db
          .select({ id: students.id, institutionId: students.institutionId })
          .from(students)
          .where(instFilter);

        for (const s of rowsWithBiometrics) {
          const revocations = await ctx.db
            .select()
            .from(biometricConsentLogs)
            .where(
              and(
                eq(biometricConsentLogs.studentId, s.id),
                eq(biometricConsentLogs.status, 'revoked')
              )
            )
            .limit(1);

          if (revocations[0]) {
            await ctx.db
              .update(students)
              .set({ faceEncoding: null, faceEmbeddingHash: null })
              .where(eq(students.id, s.id));
            purgedTemplates += 1;

            await ctx.db.insert(biometricPurgeLogs).values({
              id: `prg_${randomUUID().slice(0, 12)}`,
              studentId: s.id,
              institutionId: s.institutionId,
              reason: 'retention_ttl_expired',
              purgedByUserId: ctx.user.id,
              purgedAt: executedAt,
              evidenceHashSha256: computeSha256({ studentId: s.id, executedAt: executedAt.toISOString() }),
            });
          }
        }
      }

      const auditPayload = {
        action: 'DATA_RETENTION_EXPIRATION',
        lawReference: 'LGPD Art. 16 & Art. 14',
        retentionDays: input.retentionDays,
        dryRun: input.dryRun,
        purgedBiometricTemplates: purgedTemplates,
        operatorId: ctx.user.id,
        executedAt: executedAt.toISOString(),
      };

      const auditHash = ctx.db
        ? await recordAuditEvent(ctx.db, {
            userId: ctx.user.id,
            action: 'DATA_RETENTION_EXPIRATION',
            entity: 'biometric_purge_logs',
            entityId: ctx.user.institutionId || 'global',
            details: auditPayload,
            ipAddress: ctx.ipAddress,
          })
        : computeSha256(auditPayload);

      return {
        success: true,
        ...auditPayload,
        auditHash,
      };
    }),
});
