import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySession } from '@/lib/session';
import {
  canAccessPortal,
  isPortalPublicExposureBlocked,
  isPrivilegedRole,
  ROLE_DESTINATIONS,
} from '@/lib/portalAccess';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get('aquila_session');
  const requiresAuth =
    pathname.startsWith('/portal') ||
    pathname.startsWith('/soc') ||
    pathname.startsWith('/bi-dashboard');

  if (requiresAuth && isPortalPublicExposureBlocked()) {
    const blockedUrl = new URL('/login', request.url);
    blockedUrl.searchParams.set('error', 'portals_blocked_pending_phase2');
    return NextResponse.redirect(blockedUrl);
  }

  // Proteger rotas de portais, SOC e BI
  if (requiresAuth) {
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

    if (
      (pathname.startsWith('/soc') || pathname.startsWith('/bi-dashboard')) &&
      !isPrivilegedRole(session.role)
    ) {
      return NextResponse.redirect(new URL(ROLE_DESTINATIONS[session.role], request.url));
    }

    if (pathname.startsWith('/portal') && !canAccessPortal(session.role, pathname)) {
      return NextResponse.redirect(new URL(ROLE_DESTINATIONS[session.role], request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/portal/:path*', '/soc/:path*', '/bi-dashboard/:path*'],
};
