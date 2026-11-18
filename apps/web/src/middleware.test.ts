import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { middleware } from './middleware';
import { verifySession } from '@/lib/session';

vi.mock('@/lib/session', () => ({ verifySession: vi.fn() }));

describe('portal route middleware', () => {
  beforeEach(() => vi.mocked(verifySession).mockResolvedValue({
    username: 'student-test',
    portal: '/portal/aluno',
    role: 'student',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 60,
  }));

  it('allows the student to load the existing singular portal page', async () => {
    const request = new NextRequest('http://localhost/portal/aluno');
    request.cookies.set('aquila_session', 'valid-session');

    const response = await middleware(request);
    expect(response.headers.get('x-middleware-next')).toBe('1');
  });

  it('redirects a student away from another role portal', async () => {
    const request = new NextRequest('http://localhost/portal/professor');
    request.cookies.set('aquila_session', 'valid-session');

    const response = await middleware(request);
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('http://localhost/portal/aluno');
  });

  it('redirects unauthenticated requests on /portal and /bi-dashboard to /login with redirect param', async () => {
    const portalReq = new NextRequest('http://localhost/portal/aluno');
    const portalRes = await middleware(portalReq);
    expect(portalRes.status).toBe(307);
    expect(portalRes.headers.get('location')).toBe('http://localhost/login?redirect=%2Fportal%2Faluno');

    const biReq = new NextRequest('http://localhost/bi-dashboard');
    const biRes = await middleware(biReq);
    expect(biRes.status).toBe(307);
    expect(biRes.headers.get('location')).toBe('http://localhost/login?redirect=%2Fbi-dashboard');
  });

  it('clears invalid session cookies and redirects with error=invalid_session', async () => {
    vi.mocked(verifySession).mockResolvedValueOnce(null);
    const request = new NextRequest('http://localhost/portal/pais');
    request.cookies.set('aquila_session', 'tampered-token');

    const response = await middleware(request);
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe(
      'http://localhost/login?redirect=%2Fportal%2Fpais&error=invalid_session'
    );
    expect(response.headers.get('set-cookie')).toContain('aquila_session=;');
  });

  it('blocks non-privileged roles from /bi-dashboard and /soc while allowing coordinator', async () => {
    const studentBiReq = new NextRequest('http://localhost/bi-dashboard');
    studentBiReq.cookies.set('aquila_session', 'valid-session');
    const studentBiRes = await middleware(studentBiReq);
    expect(studentBiRes.status).toBe(307);
    expect(studentBiRes.headers.get('location')).toBe('http://localhost/portal/aluno');

    const studentSocReq = new NextRequest('http://localhost/soc');
    studentSocReq.cookies.set('aquila_session', 'valid-session');
    const studentSocRes = await middleware(studentSocReq);
    expect(studentSocRes.status).toBe(307);
    expect(studentSocRes.headers.get('location')).toBe('http://localhost/portal/aluno');

    vi.mocked(verifySession).mockResolvedValue({
      username: 'coord-test',
      portal: '/portal/coordenacao',
      role: 'coordinator',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 60,
    });
    const coordBiReq = new NextRequest('http://localhost/bi-dashboard');
    coordBiReq.cookies.set('aquila_session', 'valid-session');
    const coordBiRes = await middleware(coordBiReq);
    expect(coordBiRes.headers.get('x-middleware-next')).toBe('1');

    const coordSocReq = new NextRequest('http://localhost/soc');
    coordSocReq.cookies.set('aquila_session', 'valid-session');
    const coordSocRes = await middleware(coordSocReq);
    expect(coordSocRes.headers.get('x-middleware-next')).toBe('1');
  });
});
