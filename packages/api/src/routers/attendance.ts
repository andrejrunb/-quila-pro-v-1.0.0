import { randomUUID } from 'node:crypto';
import { router, protectedProcedure, teacherProcedure } from '../trpc';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { attendance } from '@aquila/db';
import { and, eq, inArray } from 'drizzle-orm';
import {
  assertStudentAccess,
  assertTeacherClassAccess,
  enqueueEdgeSyncCommand,
  recordAuditEvent,
  resolveAccessibleStudentIds,
} from '../lib/governance';

export const attendanceRouter = router({
  getDailySummary: protectedProcedure
    .input(z.object({ date: z.string().optional(), classId: z.string().optional() }))
    .query(async ({ input, ctx }) => {
      const targetDate = input.date || new Date().toISOString().split('T')[0];
      if (!ctx.db) {
        return {
          date: targetDate,
          totalStudents: 0,
          presentCount: 0,
          absentCount: 0,
          lateCount: 0,
          justifiedCount: 0,
          attendanceRate: 0,
        };
      }

      const allowedIds = await resolveAccessibleStudentIds(ctx.db, ctx.user);
      if (allowedIds.length === 0) {
        return {
          date: targetDate,
          totalStudents: 0,
          presentCount: 0,
          absentCount: 0,
          lateCount: 0,
          justifiedCount: 0,
          attendanceRate: 0,
        };
      }

      const filters = [
        eq(attendance.date, targetDate),
        inArray(attendance.studentId, allowedIds),
      ];
      if (input.classId) {
        filters.push(eq(attendance.classId, input.classId));
      }

      const rows = await ctx.db
        .select()
        .from(attendance)
        .where(and(...filters));

      const presentCount = rows.filter((r) => r.status === 'present').length;
      const lateCount = rows.filter((r) => r.status === 'late').length;
      const justifiedCount = rows.filter((r) => r.status === 'justified').length;
      const absentCount = rows.filter((r) => r.status === 'absent').length;
      const totalStudents = rows.length || allowedIds.length;
      const attended = presentCount + lateCount;
      const attendanceRate = totalStudents > 0 ? Number(((attended / totalStudents) * 100).toFixed(1)) : 0;

      return {
        date: targetDate,
        totalStudents,
        presentCount,
        absentCount,
        lateCount,
        justifiedCount,
        attendanceRate,
      };
    }),

  markAttendance: teacherProcedure
    .input(
      z.object({
        studentId: z.string(),
        status: z.enum(['present', 'absent', 'late', 'justified']),
        classId: z.string(),
        date: z.string().optional(),
        detectedBy: z.enum(['manual', 'qr_badge', 'camera', 'nfc']).default('manual'),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.db) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not configured.' });
      }

      const cls = await assertTeacherClassAccess(ctx.db, ctx.user, input.classId);
      await assertStudentAccess(ctx.db, ctx.user, input.studentId);

      const dateStr = input.date || new Date().toISOString().split('T')[0];
      const existing = await ctx.db
        .select()
        .from(attendance)
        .where(
          and(
            eq(attendance.studentId, input.studentId),
            eq(attendance.classId, input.classId),
            eq(attendance.date, dateStr)
          )
        )
        .limit(1);

      const now = new Date();
      let recordId: string;
      if (existing[0]) {
        recordId = existing[0].id;
        await ctx.db
          .update(attendance)
          .set({
            status: input.status,
            detectedBy: input.detectedBy,
            timestamp: now,
          })
          .where(eq(attendance.id, recordId));
      } else {
        recordId = `att_${randomUUID().slice(0, 12)}`;
        await ctx.db.insert(attendance).values({
          id: recordId,
          studentId: input.studentId,
          classId: input.classId,
          date: dateStr,
          status: input.status,
          detectedBy: input.detectedBy,
          confidence: input.detectedBy === 'manual' ? 1.0 : 0.99,
          timestamp: now,
        });
      }

      const syncCmd = await enqueueEdgeSyncCommand(ctx.db, {
        institutionId: cls.institutionId,
        targetDomain: 'attendance',
        action: 'ATTENDANCE_MARKED',
        payload: {
          recordId,
          studentId: input.studentId,
          classId: input.classId,
          date: dateStr,
          status: input.status,
          detectedBy: input.detectedBy,
        },
        actorUserId: ctx.user.id,
        conflictPolicy: 'edge_offline_merge_with_teacher_override',
      });

      const auditHash = await recordAuditEvent(ctx.db, {
        userId: ctx.user.id,
        action: 'ATTENDANCE_MARKED',
        entity: 'attendance',
        entityId: recordId,
        details: {
          studentId: input.studentId,
          classId: input.classId,
          status: input.status,
          date: dateStr,
          commandId: syncCmd.commandId,
        },
        ipAddress: ctx.ipAddress,
      });

      return {
        success: true,
        auditHash,
        commandId: syncCmd.commandId,
        syncStatus: syncCmd.status,
        record: {
          id: recordId,
          studentId: input.studentId,
          classId: input.classId,
          date: dateStr,
          status: input.status,
          detectedBy: input.detectedBy,
          timestamp: now.toISOString(),
        },
      };
    }),
});
