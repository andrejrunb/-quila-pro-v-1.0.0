import { z } from 'zod';
import { auditLogs } from '@aquila/db';
import {
  router,
  publicProcedure,
  protectedProcedure,
  adminProcedure,
  type AuthUser,
  type TRPCContext,
} from './trpc';
import { studentRouter } from './routers/student';
import { attendanceRouter } from './routers/attendance';
import { financeRouter } from './routers/finance';
import { automationRouter } from './routers/automation';

export { router, publicProcedure, protectedProcedure, adminProcedure };
export type { AuthUser, TRPCContext };

export const appRouter = router({
  getHealth: publicProcedure.query(() => {
    return { status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() };
  }),

  // Modular Routers protegidos
  student: studentRouter,
  attendance: attendanceRouter,
  finance: financeRouter,
  automation: automationRouter,

  // Governança & Auditoria protegida (import estático de auditLogs)
  getAuditLogs: adminProcedure
    .input(z.object({ limit: z.number().default(50) }))
    .query(async ({ input, ctx }) => {
      if (!ctx.db) return [];
      return await ctx.db.select().from(auditLogs).limit(input.limit);
    }),
});

export type AppRouter = typeof appRouter;
