import { initTRPC, TRPCError } from '@trpc/server';
import type { AquilaDatabase } from '@aquila/db';

export type PortalRole = 'admin' | 'coordinator' | 'teacher' | 'parent' | 'student';

export interface AuthUser {
  id: string;
  username: string;
  role: PortalRole;
  institutionId?: string;
  jti?: string;
  sessionIssuedAt?: number;
  /**
   * Hint de apresentação apenas — nunca utilizado como autorização no DAL.
   */
  linkedStudentIds?: string[];
}

export interface TRPCContext {
  db?: AquilaDatabase;
  user?: AuthUser | null;
  ipAddress?: string;
  services?: {
    student?: unknown;
    camera?: unknown;
  };
}

const t = initTRPC.context<TRPCContext>().create();

export const router = t.router;
export const publicProcedure = t.procedure;

const isAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Acesso restrito: autenticação mandatória no ecossistema Áquila Pro.',
    });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});

const requireRoles = (allowed: readonly PortalRole[], message: string) =>
  t.middleware(({ ctx, next }) => {
    if (!ctx.user) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Acesso restrito: autenticação mandatória no ecossistema Áquila Pro.',
      });
    }
    if (!allowed.includes(ctx.user.role)) {
      throw new TRPCError({ code: 'FORBIDDEN', message });
    }
    return next({ ctx: { ...ctx, user: ctx.user } });
  });

export const protectedProcedure = t.procedure.use(isAuthed);
export const adminProcedure = t.procedure.use(
  requireRoles(['admin', 'coordinator'], 'Acesso proibido: este recurso exige privilégios de Administrador ou Coordenação.')
);
export const teacherProcedure = t.procedure.use(
  requireRoles(['teacher', 'coordinator', 'admin'], 'Acesso restrito ao perfil Docente ou Coordenação.')
);
export const parentProcedure = t.procedure.use(
  requireRoles(['parent', 'coordinator', 'admin'], 'Acesso restrito ao perfil de Responsável Legal ou Coordenação.')
);
export const studentProcedure = t.procedure.use(
  requireRoles(['student', 'coordinator', 'admin'], 'Acesso restrito ao perfil do Estudante ou Coordenação.')
);
