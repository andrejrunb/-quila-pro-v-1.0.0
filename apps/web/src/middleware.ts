import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySession } from '@/lib/session';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get('aquila_session');

  // Proteger rotas de portais e SOC
  if (pathname.startsWith('/portal') || pathname.startsWith('/soc')) {
    if (!sessionCookie || !sessionCookie.value) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Validação criptográfica do token de sessão (HMAC-SHA256)
    const session = await verifySession(sessionCookie.value);
    if (!session) {
      // Token forjado, adulterado ou expirado
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      loginUrl.searchParams.set('error', 'invalid_session');
      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete('aquila_session');
      return response;
    }

    // Controle de Acesso Baseado em Funções (RBAC)
    if (pathname.startsWith('/soc') && session.role !== 'admin' && session.role !== 'coordinator') {
      return NextResponse.redirect(new URL('/portal/aluno', request.url));
    }

    if (pathname.startsWith('/portal/coordenacao') && session.role !== 'admin' && session.role !== 'coordinator') {
      return NextResponse.redirect(new URL('/portal/aluno', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/portal/:path*', '/soc/:path*'],
};
