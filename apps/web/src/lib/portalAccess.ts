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
