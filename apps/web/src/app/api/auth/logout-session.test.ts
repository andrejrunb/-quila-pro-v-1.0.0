import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { signSession } from '@/lib/session';

const mockCookiesGet = vi.fn();

vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: mockCookiesGet,
  }),
}));

import { GET as getSession } from './session/route';
import { POST as postLogout } from './logout/route';

describe('auth session and logout routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.AQUILA_AUTH_SECRET = 'test-session-signing-key-with-at-least-32-bytes';
  });

  afterEach(() => {
    delete process.env.AQUILA_AUTH_SECRET;
  });

  it('returns 401 on GET /api/auth/session when cookie is missing', async () => {
    mockCookiesGet.mockReturnValueOnce(undefined);
    const res = await getSession();
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ authenticated: false, user: null });
    expect(res.headers.get('cache-control')).toBe('no-store');
  });

  it('returns 401 and clears cookie when session signature is invalid', async () => {
    mockCookiesGet.mockReturnValueOnce({ value: 'tampered.token' });
    const res = await getSession();
    expect(res.status).toBe(401);
    expect(res.headers.get('set-cookie')).toContain('aquila_session=;');
    expect(res.headers.get('set-cookie')).toContain('Max-Age=0');
  });

  it('returns 200 with authenticated user when session token is valid', async () => {
    const token = await signSession({
      username: 'prof-ana',
      portal: '/portal/professor',
      role: 'teacher',
    });
    mockCookiesGet.mockReturnValueOnce({ value: token });

    const res = await getSession();
    expect(res.status).toBe(200);
    expect(res.headers.get('cache-control')).toBe('no-store');
    expect(await res.json()).toEqual({
      authenticated: true,
      user: {
        username: 'prof-ana',
        role: 'teacher',
        portal: '/portal/professor',
      },
    });
  });

  it('clears aquila_session cookie on POST /api/auth/logout', async () => {
    const res = await postLogout();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    const setCookie = res.headers.get('set-cookie');
    expect(setCookie).toContain('aquila_session=;');
    expect(setCookie).toContain('Max-Age=0');
  });
});
