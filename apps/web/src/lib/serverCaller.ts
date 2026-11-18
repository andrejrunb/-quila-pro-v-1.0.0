import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { TRPCError } from '@trpc/server';
import { appRouter, type AuthUser } from '@aquila/api';
import type { AquilaDatabase } from '@aquila/db';
import { getInitializedWebDb, resolveLiveSessionUser } from './authDb';
import { isPortalPublicExposureBlocked } from './portalAccess';
import { verifySession } from './session';

function extractClientIp(request?: Request): string | undefined {
  if (!request) return undefined;
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]?.trim();
  return request.headers.get('x-real-ip') ?? undefined;
}

export async function getRequestAuthUser(existingDb?: AquilaDatabase | null): Promise<AuthUser | null> {
  if (isPortalPublicExposureBlocked()) return null;
  const cookieStore = await cookies();
  const token = cookieStore.get('aquila_session')?.value;
  if (!token) return null;
  const session = await verifySession(token);
  if (!session) return null;
  const db = existingDb !== undefined ? existingDb : await getInitializedWebDb();
  return await resolveLiveSessionUser(db, session);
}

export async function createServerTrpcContext(request?: Request) {
  const db = await getInitializedWebDb();
  const user = await getRequestAuthUser(db);
  return {
    db,
    user,
    ipAddress: extractClientIp(request),
  };
}

export async function createServerCaller(request?: Request) {
  const ctx = await createServerTrpcContext(request);
  return {
    ctx,
    caller: appRouter.createCaller(ctx),
  };
}

export function mapTrpcErrorToResponse(error: unknown): NextResponse {
  if (error instanceof TRPCError) {
    const statusMap: Record<string, number> = {
      UNAUTHORIZED: 401,
      FORBIDDEN: 403,
      NOT_FOUND: 404,
      BAD_REQUEST: 400,
      CONFLICT: 409,
    };
    const status = statusMap[error.code] ?? 500;
    return NextResponse.json({ error: error.message, code: error.code }, { status });
  }

  console.error('[Aquila Portal API Error]', error);
  return NextResponse.json(
    { error: 'Erro interno ao processar requisição no servidor.' },
    { status: 500 }
  );
}
