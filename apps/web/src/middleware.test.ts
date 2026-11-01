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
});
