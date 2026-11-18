import { describe, expect, it } from 'vitest';
import {
  canAccessPortal,
  isPrivilegedRole,
  resolvePostLoginRedirect,
  ROLE_DESTINATIONS,
} from '../portalAccess';

describe('portal destinations and role access', () => {
  it('uses the existing singular student route as the canonical destination', () => {
    expect(ROLE_DESTINATIONS.student).toBe('/portal/aluno');
    expect(canAccessPortal('student', '/portal/aluno')).toBe(true);
    expect(canAccessPortal('student', '/portal/alunos')).toBe(false);
  });

  it('denies students access to every other role portal', () => {
    expect(canAccessPortal('student', '/portal/professor')).toBe(false);
    expect(canAccessPortal('student', '/portal/pais')).toBe(false);
    expect(canAccessPortal('student', '/portal/coordenacao')).toBe(false);
  });

  it('allows each non-admin role only its own portal', () => {
    expect(canAccessPortal('teacher', '/portal/professor')).toBe(true);
    expect(canAccessPortal('parent', '/portal/pais')).toBe(true);
    expect(canAccessPortal('coordinator', '/portal/coordenacao')).toBe(true);
    expect(canAccessPortal('teacher', '/portal/aluno')).toBe(false);
  });

  it('identifies privileged roles and prevents open or cross-role redirects', () => {
    expect(isPrivilegedRole('admin')).toBe(true);
    expect(isPrivilegedRole('coordinator')).toBe(true);
    expect(isPrivilegedRole('teacher')).toBe(false);
    expect(isPrivilegedRole('parent')).toBe(false);
    expect(isPrivilegedRole('student')).toBe(false);

    expect(resolvePostLoginRedirect('//evil.com', '/portal/aluno', 'student')).toBe('/portal/aluno');
    expect(resolvePostLoginRedirect('https://evil.com', '/portal/aluno', 'student')).toBe('/portal/aluno');
    expect(resolvePostLoginRedirect('/portal/professor', '/portal/aluno', 'student')).toBe('/portal/aluno');
    expect(resolvePostLoginRedirect('/portal/aluno?tab=missoes', '/portal/aluno', 'student')).toBe(
      '/portal/aluno?tab=missoes'
    );
    expect(resolvePostLoginRedirect('/bi-dashboard', '/portal/aluno', 'student')).toBe('/portal/aluno');
    expect(resolvePostLoginRedirect('/bi-dashboard', '/portal/coordenacao', 'coordinator')).toBe(
      '/bi-dashboard'
    );
    expect(resolvePostLoginRedirect('/soc', '/portal/coordenacao', 'admin')).toBe('/soc');
  });
});
