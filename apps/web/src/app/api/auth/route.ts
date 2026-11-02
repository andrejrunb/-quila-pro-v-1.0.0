import { NextResponse } from 'next/server';
import { signSession } from '@/lib/session';
import { timingSafeEqual } from 'crypto';
import { PORTAL_ID_ROLES, ROLE_DESTINATIONS } from '@/lib/portalAccess';
import type { PortalRole } from '@/lib/session';

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
  try {
    const body = await request.json();
    const { username, password, portalId } = body;

    if (typeof username !== 'string' || typeof password !== 'string' || !username.trim() || !password) {
      return NextResponse.json({ error: 'Usuário e senha são obrigatórios.' }, { status: 400 });
    }

    const cleanUser = username.trim().toLowerCase();
    const userAccount = getConfiguredAccounts().get(cleanUser);

    if (!userAccount || !verifyPassword(password, userAccount.password)) {
      return NextResponse.json({ error: 'Credenciais inválidas. Verifique usuário e senha.' }, { status: 401 });
    }

    const expectedPortalId = userAccount.role === 'admin'
      ? 'coordenacao'
      : Object.entries(PORTAL_ID_ROLES).find(([, role]) => role === userAccount.role)?.[0];
    const requestedPortalId = typeof portalId === 'string' ? portalId : expectedPortalId;
    const requestedRole = !requestedPortalId
      ? undefined
      : requestedPortalId === 'coordenacao' && userAccount.role === 'admin'
        ? 'admin'
        : PORTAL_ID_ROLES[requestedPortalId];
    if (!requestedPortalId || requestedRole !== userAccount.role) {
      return NextResponse.json({ error: 'Este perfil não pode acessar o portal selecionado.' }, { status: 403 });
    }

    const role = userAccount.role;
    const destination = ROLE_DESTINATIONS[role];

    const sessionToken = await signSession({
      username: cleanUser,
      portal: destination,
      role,
    });

    const response = NextResponse.json({
      success: true,
      redirect: destination,
      user: { username: cleanUser, role }
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
