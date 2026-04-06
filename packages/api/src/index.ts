import { initTRPC } from '@trpc/server';
import { z } from 'zod';

// Contexto compartilhado (será injetado pelo Electron ou Server)
export interface TRPCContext {
  db?: any;
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

  // ---- ESTUDANTES ----
  getStudents: publicProcedure
    .input(z.object({ limit: z.number().min(1).max(100).nullish(), cursor: z.string().nullish() }))
    .query(async ({ ctx }) => {
      if (!ctx.db) return [];
      return await ctx.db.getStudents();
    }),

  createStudent: publicProcedure
    .input(z.object({
      name: z.string().min(3),
      registrationNumber: z.string().optional(),
      classId: z.string().default('default'),
      status: z.enum(['active', 'inactive']).default('active')
    }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.services?.student) throw new Error('Serviço de estudantes não disponível');
      return await ctx.services.student.importStudentsBulk([input]);
    }),

  // ---- GOVERNANÇA LGPD ----
  getAuditLogs: publicProcedure
    .input(z.object({ limit: z.number().default(50) }))
    .query(async ({ input, ctx }) => {
      if (!ctx.db) return [];
      return await ctx.db.getAuditLogs(input.limit);
    }),
});

export type AppRouter = typeof appRouter;
