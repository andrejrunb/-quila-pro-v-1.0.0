import { initTRPC, TRPCError } from '@trpc/server';
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
    student?: unknown;
    camera?: unknown;
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
