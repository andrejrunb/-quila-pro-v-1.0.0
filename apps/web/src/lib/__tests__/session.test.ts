import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { getAuthSecret, signSession, verifySession } from '../session';

const SESSION_KEY = 'test-session-signing-key-with-at-least-32-bytes';

describe('Session signing and validation', () => {
  beforeEach(() => {
    process.env.AQUILA_AUTH_SECRET = SESSION_KEY;
  });

  afterEach(() => {
    delete process.env.AQUILA_AUTH_SECRET;
  });

  const validSession = {
    username: 'student-01',
    portal: '/portal/aluno',
    role: 'student' as const,
  };

  it('fails closed when the runtime key is absent or too short', async () => {
    delete process.env.AQUILA_AUTH_SECRET;
    expect(() => getAuthSecret()).toThrow('AQUILA_AUTH_SECRET');
    await expect(signSession(validSession)).rejects.toThrow('AQUILA_AUTH_SECRET');
    expect(await verifySession('old.cookie.signature')).toBeNull();

    process.env.AQUILA_AUTH_SECRET = 'short';
    expect(() => getAuthSecret()).toThrow('32 bytes');
  });

  it('signs and validates claims with the configured key', async () => {
    const token = await signSession(validSession);
    const payload = await verifySession(token);
    expect(payload).toMatchObject(validSession);
  });

  it('rejects cookie tampering and signatures from the previous runtime key', async () => {
    const token = await signSession(validSession);
    const [header, encodedPayload, signature] = token.split('.');
    const changed = Buffer.from(encodedPayload, 'base64url').toString('utf8').replace('student', 'admin');
    const tampered = `${header}.${Buffer.from(changed).toString('base64url')}.${signature}`;
    expect(await verifySession(tampered)).toBeNull();

    process.env.AQUILA_AUTH_SECRET = 'rotated-session-signing-key-with-at-least-32-bytes';
    expect(await verifySession(token)).toBeNull();
  });

  it('rejects missing or unsupported roles even if claims are signed', async () => {
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(SESSION_KEY),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    for (const claims of [
      { username: 'user', portal: '/portal/aluno', iat: 1, exp: Math.floor(Date.now() / 1000) + 60 },
      { ...validSession, role: 'unknown', iat: 1, exp: Math.floor(Date.now() / 1000) + 60 },
    ]) {
      const payload = Buffer.from(JSON.stringify(claims)).toString('base64url');
      const content = `${header}.${payload}`;
      const signatureBytes = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(content));
      const token = `${content}.${Buffer.from(signatureBytes).toString('base64url')}`;
      expect(await verifySession(token)).toBeNull();
    }
  });

  it('rejects expired sessions', async () => {
    const token = await signSession({
      ...validSession,
      exp: Math.floor(Date.now() / 1000) - 1,
    });
    expect(await verifySession(token)).toBeNull();
  });
});
