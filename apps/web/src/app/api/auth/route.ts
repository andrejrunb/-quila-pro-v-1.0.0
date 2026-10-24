import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password, portalId } = body;

    if (!username || !password) {
      return NextResponse.json({ error: 'Usuário e senha são obrigatórios.' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Senha inválida ou muito curta.' }, { status: 401 });
    }

    // Criar payload de sessão auditável
    const sessionPayload = {
      username: username.trim(),
      portal: portalId || 'aluno',
      role: portalId === 'coordenacao' ? 'coordinator' : portalId === 'professores' ? 'teacher' : portalId === 'pais' ? 'parent' : 'student',
      authenticatedAt: new Date().toISOString(),
    };

    const sessionToken = Buffer.from(JSON.stringify(sessionPayload)).toString('base64');

    const destination = portalId === 'professores' ? '/portal/professor' : `/portal/${portalId || 'aluno'}`;
    const response = NextResponse.json({ 
      success: true, 
      redirect: destination,
      user: { username: sessionPayload.username, role: sessionPayload.role }
    });

    response.cookies.set('aquila_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 8 // 8 horas
    });

    return response;
  } catch (error) {
    return NextResponse.json({ error: 'Falha no processamento de autenticação.' }, { status: 500 });
  }
}
