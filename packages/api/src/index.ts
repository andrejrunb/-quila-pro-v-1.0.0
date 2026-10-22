import { initTRPC } from '@trpc/server';
import { z } from 'zod';
import { studentRouter } from './routers/student';
import { attendanceRouter } from './routers/attendance';
import { financeRouter } from './routers/finance';
import { automationRouter } from './routers/automation';

import type { createDb } from '@aquila/db';

export interface TRPCContext {
  db?: ReturnType<typeof createDb>;
  services?: {
    student?: any;
    camera?: any;
  };
}

const t = initTRPC.context<TRPCContext>().create();

export const router = t.router;
export const publicProcedure = t.procedure;

export const appRouter = router({
  getHealth: publicProcedure.query(() => {
    return { status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() };
  }),

  // Modular Routers
  student: studentRouter,
  attendance: attendanceRouter,
  finance: financeRouter,
  automation: automationRouter,

  // Governance & Audit
  getAuditLogs: publicProcedure
    .input(z.object({ limit: z.number().default(50) }))
    .query(async ({ input, ctx }) => {
      if (!ctx.db) return [];
      const { auditLogs } = require("@aquila/db"); return await ctx.db.select().from(auditLogs).limit(input.limit);
    }),
});

export type AppRouter = typeof appRouter;
