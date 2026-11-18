import { NextResponse } from 'next/server';
import { authenticateDbUser, resolveEnvIdentityContext, tryRecordLoginAudit } from '@/lib/authDb';
import { signSession } from '@/lib/session';
import { timingSafeEqual } from 'crypto';
import { PORTAL_ID_ROLES, ROLE_DESTINATIONS } from '@/lib/portalAccess';
import type { PortalRole } from '@/lib/session';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

interface ConfiguredAccount {
  username: string;
  password: string;
  role: PortalRole;
}

const ACCOUNT_ENV: Array<{ role: PortalRole; username: string; password: string }> = [
  { role: 'admin', username: 'AQUILA_WEB_ADMIN_USERNAME', password: 'AQUILA_WEB_ADMIN_PASSWORD' },
  { role: 'coordinator', username: 'AQUILA_COORD_USERNAME', password: 'AQUILA_COORD_PASSWORD' },
  { role: 'teacher', username: 'AQUILA_TEACHER_USERNAME', password: 'AQUILA_TEACHER_PASSWORD' },
  { role: 'parent', username: 'AQUILA_PARENT_USERNAME', password: 'AQUILA_PARENT_PASSWORD' },
  { role: 'student', username: 'AQUILA_STUDENT_USERNAME', password: 'AQUILA_STUDENT_PASSWORD' },
];

function getConfiguredAccounts(): Map<string, ConfiguredAccount> {
  const accounts = new Map<string, ConfiguredAccount>();
  for (const config of ACCOUNT_ENV) {
    const username = process.env[config.username]?.trim().toLowerCase();
    const password = process.env[config.password];
    if (!username && !password) continue;
    const minPasswordBytes = config.role === 'admin' ? 16 : 12;
    if (!username || !password || Buffer.byteLength(password, 'utf8') < minPasswordBytes) {
      throw new Error(`Incomplete or weak credential configuration for role "${config.role}".`);
    }
    accounts.set(username, { username, password, role: config.role });
  }
  return accounts;
}

function verifyPassword(provided: string, expected: string): boolean {
  try {
    const providedBuf = Buffer.from(provided);
    const expectedBuf = Buffer.from(expected);
    if (providedBuf.length !== expectedBuf.length) {
      return false;
    }
    return timingSafeEqual(providedBuf, expectedBuf);
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    const parsed = await request.json();
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return NextResponse.json({ error: 'Payload JSON inválido.' }, { status: 400 });
    }
    body = parsed as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'Corpo JSON inválido.' }, { status: 400 });
  }

  try {
    const { username, password, portalId } = body;

    if (typeof username !== 'string' || typeof password !== 'string' || !username.trim() || !password) {
      return NextResponse.json({ error: 'Usuário e senha são obrigatórios.' }, { status: 400 });
    }

    const cleanUser = username.trim().toLowerCase();
    const rate = checkRateLimit(`auth:${getClientIp(request)}:${cleanUser}`, {
      maxRequests: 15,
      windowMs: 60_000,
    });
    if (!rate.allowed) {
      return NextResponse.json(
        { error: 'Muitas tentativas de autenticação. Aguarde alguns instantes.' },
        { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds) } }
      );
    }

    const userAccount = getConfiguredAccounts().get(cleanUser);
    let resolvedRole: PortalRole | null = null;
    let resolvedUsername = cleanUser;
    let resolvedUserId: string | undefined;
    let resolvedInstitutionId: string | undefined;
    let resolvedLinkedStudentIds: string[] | undefined;

    if (userAccount && verifyPassword(password, userAccount.password)) {
      resolvedRole = userAccount.role;
      const envContext = await resolveEnvIdentityContext(cleanUser, userAccount.role);
      resolvedUserId = envContext.userId;
      resolvedInstitutionId = envContext.institutionId;
      resolvedLinkedStudentIds = envContext.linkedStudentIds;
    } else {
      const dbUser = await authenticateDbUser(cleanUser, password);
      if (dbUser) {
        resolvedRole = dbUser.role;
        resolvedUsername = dbUser.username;
        resolvedUserId = dbUser.userId;
        resolvedInstitutionId = dbUser.institutionId;
        resolvedLinkedStudentIds = dbUser.linkedStudentIds;
      }
    }

    if (!resolvedRole) {
      return NextResponse.json({ error: 'Credenciais inválidas. Verifique usuário e senha.' }, { status: 401 });
    }

    const expectedPortalId = resolvedRole === 'admin'
      ? 'coordenacao'
      : Object.entries(PORTAL_ID_ROLES).find(([, role]) => role === resolvedRole)?.[0];
    const requestedPortalId = typeof portalId === 'string' ? portalId : expectedPortalId;
    const requestedRole = !requestedPortalId
      ? undefined
      : requestedPortalId === 'coordenacao' && resolvedRole === 'admin'
        ? 'admin'
        : PORTAL_ID_ROLES[requestedPortalId];
    if (!requestedPortalId || requestedRole !== resolvedRole) {
      return NextResponse.json({ error: 'Este perfil não pode acessar o portal selecionado.' }, { status: 403 });
    }

    const role = resolvedRole;
    const destination = ROLE_DESTINATIONS[role];

    const sessionToken = await signSession({
      username: resolvedUsername,
      portal: destination,
      role,
      userId: resolvedUserId,
      institutionId: resolvedInstitutionId,
      linkedStudentIds: resolvedLinkedStudentIds,
    });

    if (resolvedUserId) {
      await tryRecordLoginAudit({
        userId: resolvedUserId,
        username: resolvedUsername,
        role,
        portal: destination,
        ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? undefined,
      });
    }

    const response = NextResponse.json({
      success: true,
      redirect: destination,
      user: {
        username: resolvedUsername,
        role,
        userId: resolvedUserId,
        institutionId: resolvedInstitutionId,
        linkedStudentIds: resolvedLinkedStudentIds,
      }
    });

    response.cookies.set('aquila_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 8, // 8 horas
    });

    return response;
  } catch {
    return NextResponse.json({ error: 'Falha no processamento de autenticação.' }, { status: 500 });
  }
}
