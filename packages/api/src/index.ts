import { z } from 'zod';
import { auditLogs } from '@aquila/db';
import { desc } from 'drizzle-orm';
import {
  router,
  publicProcedure,
  protectedProcedure,
  adminProcedure,
  teacherProcedure,
  parentProcedure,
  studentProcedure,
  type AuthUser,
  type PortalRole,
  type TRPCContext,
} from './trpc';
import { studentRouter } from './routers/student';
import { attendanceRouter } from './routers/attendance';
import { financeRouter } from './routers/finance';
import { automationRouter } from './routers/automation';
import { teacherRouter } from './routers/teacher';
import { parentRouter } from './routers/parent';
import { studentPortalRouter } from './routers/studentPortal';
import { leadRouter } from './routers/lead';

export {
  router,
  publicProcedure,
  protectedProcedure,
  adminProcedure,
  teacherProcedure,
  parentProcedure,
  studentProcedure,
};
export {
  computeSha256,
  enqueueEdgeSyncCommand,
  recordAuditEvent,
  verifyActiveUserAndSession,
  type EdgeCommandDomain,
} from './lib/governance';
export type { AuthUser, PortalRole, TRPCContext };

export const appRouter = router({
  getHealth: publicProcedure.query(() => {
    return { status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() };
  }),

  student: studentRouter,
  attendance: attendanceRouter,
  finance: financeRouter,
  automation: automationRouter,
  teacher: teacherRouter,
  parent: parentRouter,
  studentPortal: studentPortalRouter,
  lead: leadRouter,

  getAuditLogs: adminProcedure
    .input(z.object({ limit: z.number().min(1).max(200).default(50) }))
    .query(async ({ input, ctx }) => {
      if (!ctx.db) return [];
      return await ctx.db
        .select()
        .from(auditLogs)
        .orderBy(desc(auditLogs.createdAt))
        .limit(input.limit);
    }),
});

export type AppRouter = typeof appRouter;
