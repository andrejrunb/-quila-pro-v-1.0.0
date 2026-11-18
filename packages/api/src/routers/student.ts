import { randomUUID } from 'node:crypto';
import { router, protectedProcedure, adminProcedure } from '../trpc';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { students } from '@aquila/db';
import { and, eq, inArray } from 'drizzle-orm';
import {
  assertStudentAccess,
  recordAuditEvent,
  resolveAccessibleStudentIds,
  sanitizeOutboundStudentRow,
} from '../lib/governance';

export const studentRouter = router({
  list: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(100).default(50), classId: z.string().optional() }))
    .query(async ({ input, ctx }) => {
      if (!ctx.db) return [];

      const allowedIds = await resolveAccessibleStudentIds(ctx.db, ctx.user);
      if (allowedIds.length === 0) return [];

      const conditions = [inArray(students.id, allowedIds)];
      if (input.classId) {
        conditions.push(eq(students.classId, input.classId));
      }
      if (ctx.user.institutionId) {
        conditions.push(eq(students.institutionId, ctx.user.institutionId));
      }

      const rows = await ctx.db
        .select()
        .from(students)
        .where(and(...conditions))
        .limit(input.limit);

      return rows.map(sanitizeOutboundStudentRow);
    }),

  create: adminProcedure
    .input(
      z.object({
        name: z.string().min(3),
        registrationNumber: z.string().min(2),
        classId: z.string(),
        institutionId: z.string(),
        dateOfBirth: z.string(),
        status: z.enum(['active', 'inactive', 'graduated', 'transferred']).default('active'),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.db) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not configured.' });
      }
      if (ctx.user.institutionId && ctx.user.institutionId !== input.institutionId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Cross-institution student creation denied.' });
      }

      const newStudent = {
        id: `std_${randomUUID().slice(0, 12)}`,
        ...input,
        enrolledAt: new Date(),
      };

      await ctx.db.insert(students).values(newStudent);
      await recordAuditEvent(ctx.db, {
        userId: ctx.user.id,
        action: 'STUDENT_CREATED',
        entity: 'students',
        entityId: newStudent.id,
        details: { classId: input.classId, institutionId: input.institutionId },
        ipAddress: ctx.ipAddress,
      });

      return newStudent;
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      if (!ctx.db) return null;
      const student = await assertStudentAccess(ctx.db, ctx.user, input.id);
      return sanitizeOutboundStudentRow(student);
    }),
});
