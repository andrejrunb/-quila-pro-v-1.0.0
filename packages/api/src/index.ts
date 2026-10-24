import { initTRPC, TRPCError } from '@trpc/server';
import { z } from 'zod';
import { studentRouter } from './routers/student';
import { attendanceRouter } from './routers/attendance';
import { financeRouter } from './routers/finance';
import { automationRouter } from './routers/automation';

import type { createDb } from '@aquila/db';

export interface AuthUser {
  id: string;
  username: string;
  role: 'admin' | 'coordinator' | 'teacher' | 'parent' | 'student';
}

export interface TRPCContext {
  db?: ReturnType<typeof createDb>;
  user?: AuthUser | null;
  services?: {
    student?: any;
    camera?: any;
  };
}

const t = initTRPC.context<TRPCContext>().create();

export const router = t.router;
export const publicProcedure = t.procedure;

// Middleware de autenticação obrigatória
const isAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Acesso restrito: autenticação mandatória no ecossistema Áquila Pro.',
    });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

// Middleware de privilégio administrativo/coordenação
const isAdminOrCoord = t.middleware(({ ctx, next }) => {
  if (!ctx.user || (ctx.user.role !== 'admin' && ctx.user.role !== 'coordinator')) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Acesso proibido: este recurso exige privilégios de Administrador ou Coordenação.',
    });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(isAuthed);
export const adminProcedure = t.procedure.use(isAdminOrCoord);

export const appRouter = router({
  getHealth: publicProcedure.query(() => {
    return { status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() };
  }),

  // Modular Routers protegidos
  student: studentRouter,
  attendance: attendanceRouter,
  finance: financeRouter,
  automation: automationRouter,

  // Governança & Auditoria protegida
  getAuditLogs: adminProcedure
    .input(z.object({ limit: z.number().default(50) }))
    .query(async ({ input, ctx }) => {
      if (!ctx.db) return [];
      const { auditLogs } = require("@aquila/db");
      return await ctx.db.select().from(auditLogs).limit(input.limit);
    }),
});

export type AppRouter = typeof appRouter;
