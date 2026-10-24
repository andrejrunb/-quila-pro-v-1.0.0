import { NextResponse } from 'next/server';
import { signSession } from '@/lib/session';
import { scryptSync, timingSafeEqual } from 'crypto';

// Contas do portal configuradas via ambiente ou valores de demonstração seguros
const DEMO_USERS: Record<string, { pass: string; role: 'admin' | 'coordinator' | 'teacher' | 'parent' | 'student'; defaultPortal: string }> = {
  'admin': {
    pass: process.env.INITIAL_ADMIN_PASSWORD || 'EagleSovereign2026#Secure',
    role: 'admin',
    defaultPortal: 'coordenacao',
  },
  'coordenacao': {
    pass: process.env.INITIAL_COORD_PASSWORD || 'CoordSovereign2026#Secure',
    role: 'coordinator',
    defaultPortal: 'coordenacao',
  },
  'professor': {
    pass: process.env.INITIAL_TEACHER_PASSWORD || 'ProfSovereign2026#Secure',
    role: 'teacher',
    defaultPortal: 'professores',
  },
  'aluno': {
    pass: process.env.INITIAL_STUDENT_PASSWORD || 'AlunoSovereign2026#Secure',
    role: 'student',
    defaultPortal: 'aluno',
  },
};

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

    if (!username || !password) {
      return NextResponse.json({ error: 'Usuário e senha são obrigatórios.' }, { status: 400 });
    }

    const cleanUser = String(username).trim().toLowerCase();
    const userAccount = DEMO_USERS[cleanUser];

    // Validação estrita de credenciais
    if (!userAccount || !verifyPassword(String(password), userAccount.pass)) {
      return NextResponse.json({ error: 'Credenciais inválidas. Verifique usuário e senha.' }, { status: 401 });
    }

    // Role derivada da conta autenticada (e não forjável pelo cliente)
    const role = userAccount.role;
    const portal = portalId || userAccount.defaultPortal;

    // Gerar token assinado criptograficamente com HMAC-SHA256
    const sessionToken = await signSession({
      username: cleanUser,
      portal,
      role,
    });

    const destination = portal === 'professores' ? '/portal/professor' : `/portal/${portal}`;
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
  } catch (error) {
    return NextResponse.json({ error: 'Falha no processamento de autenticação.' }, { status: 500 });
  }
}
