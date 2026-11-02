import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { POST } from './route';
import { verifySession } from '@/lib/session';

describe('portal login route', () => {
  beforeEach(() => {
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
});
