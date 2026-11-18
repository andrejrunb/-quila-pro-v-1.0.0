import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { POST } from './route';
import { verifySession } from '@/lib/session';
import { resetRateLimitBuckets } from '@/lib/rateLimit';

describe('portal login route', () => {
  beforeEach(() => {
    resetRateLimitBuckets();
    process.env.AQUILA_AUTH_SECRET = 'test-session-signing-key-with-at-least-32-bytes';
    process.env.AQUILA_STUDENT_USERNAME = 'student-test';
    process.env.AQUILA_STUDENT_PASSWORD = 'a-unique-student-password';
  });

  afterEach(() => {
    delete process.env.AQUILA_AUTH_SECRET;
    delete process.env.AQUILA_STUDENT_USERNAME;
    delete process.env.AQUILA_STUDENT_PASSWORD;
  });

  it('redirects an authenticated student to the existing singular portal and issues a signed cookie', async () => {
    const response = await POST(new Request('http://localhost/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'student-test', password: 'a-unique-student-password', portalId: 'aluno' }),
    }));

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ redirect: '/portal/aluno', user: { role: 'student' } });
    const cookie = response.headers.get('set-cookie');
    const token = cookie?.match(/aquila_session=([^;]+)/)?.[1];
    expect(token).toBeTruthy();
    expect(await verifySession(decodeURIComponent(token!))).toMatchObject({
      username: 'student-test',
      portal: '/portal/aluno',
      role: 'student',
    });
  });

  it('rejects a student attempting to request another role portal', async () => {
    const response = await POST(new Request('http://localhost/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'student-test', password: 'a-unique-student-password', portalId: 'coordenacao' }),
    }));
    expect(response.status).toBe(403);
  });

  it('does not grant access through old built-in demo credentials', async () => {
    const response = await POST(new Request('http://localhost/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'known-demo-password-no-longer-configured', portalId: 'coordenacao' }),
    }));
    expect(response.status).toBe(401);
  });

  it('returns 400 for malformed JSON payloads', async () => {
    const response = await POST(new Request('http://localhost/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{invalid-json',
    }));
    expect(response.status).toBe(400);
  });

  it('enforces sliding-window rate limits with 429 after 15 attempts', async () => {
    for (let i = 0; i < 15; i += 1) {
      const res = await POST(new Request('http://localhost/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '203.0.113.10' },
        body: JSON.stringify({ username: 'student-test', password: 'wrong-password', portalId: 'aluno' }),
      }));
      expect(res.status).toBe(401);
    }

    const blocked = await POST(new Request('http://localhost/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '203.0.113.10' },
      body: JSON.stringify({ username: 'student-test', password: 'a-unique-student-password', portalId: 'aluno' }),
    }));
    expect(blocked.status).toBe(429);
    expect(blocked.headers.get('Retry-After')).toBeTruthy();
  });
});
