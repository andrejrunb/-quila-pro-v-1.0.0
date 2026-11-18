import type { PortalRole } from './session';

export const ROLE_DESTINATIONS: Record<PortalRole, string> = {
  admin: '/portal/coordenacao',
  coordinator: '/portal/coordenacao',
  teacher: '/portal/professor',
  parent: '/portal/pais',
  student: '/portal/aluno',
};

export const PORTAL_ID_ROLES: Record<string, PortalRole> = {
  coordenacao: 'coordinator',
  professores: 'teacher',
  pais: 'parent',
  aluno: 'student',
};

export function canAccessPortal(role: PortalRole, pathname: string): boolean {
  if (!pathname.startsWith('/portal/')) return false;
  const destination = ROLE_DESTINATIONS[role];
  return pathname === destination || pathname.startsWith(`${destination}/`);
}

export function isPrivilegedRole(role: PortalRole): boolean {
  return role === 'admin' || role === 'coordinator';
}

export function isPortalPublicExposureBlocked(): boolean {
  const isVercelDeployment = process.env.VERCEL === '1' || Boolean(process.env.VERCEL_ENV);
  return isVercelDeployment && process.env.AQUILA_PORTALS_PUBLIC_ENABLED !== 'true';
}

export function resolvePostLoginRedirect(
  requestedRedirect: string | null | undefined,
  serverDestination: string,
  role: PortalRole
): string {
  if (
    !requestedRedirect ||
    !requestedRedirect.startsWith('/') ||
    requestedRedirect.startsWith('//')
  ) {
    return serverDestination;
  }

  const pathname = requestedRedirect.split('?')[0].split('#')[0];
  if (canAccessPortal(role, pathname)) {
    return requestedRedirect;
  }
  if (
    isPrivilegedRole(role) &&
    (pathname === '/soc' ||
      pathname.startsWith('/soc/') ||
      pathname === '/bi-dashboard' ||
      pathname.startsWith('/bi-dashboard/'))
  ) {
    return requestedRedirect;
  }

  return serverDestination;
}
