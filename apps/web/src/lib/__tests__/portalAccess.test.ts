import { describe, expect, it } from 'vitest';
import { canAccessPortal, ROLE_DESTINATIONS } from '../portalAccess';

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
});
