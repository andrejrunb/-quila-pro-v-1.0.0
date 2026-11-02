import { createHmac, timingSafeEqual } from 'crypto';

export const VALID_SESSION_ROLES = new Set([
  'admin',
  'director',
  'secretary',
  'coordinator',
  'docente',
  'security',
  'rh',
  'hr',
  'pais',
  'parent',
  'responsavel',
  'student',
  'aluno',
  'teacher',
  'totem',
  'operator',
]);

export interface SessionClaims {
  sub: string;
  role: string;
  iat: number;
  exp: number;
  jti?: string;
}

export function getSessionSecret(secret = process.env.AQUILA_AUTH_SECRET): string {
  if (!secret || Buffer.byteLength(secret, 'utf8') < 32) {
    throw new Error('AQUILA_AUTH_SECRET must be configured with at least 32 bytes.');
  }
  return secret;
}

export function signSessionToken(claims: SessionClaims, secret: string): string {
  const payload = Buffer.from(JSON.stringify(claims)).toString('base64url');
  const signature = createHmac('sha256', secret).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

export function verifySessionToken(token: string, secret: string): SessionClaims | null {
  const [payload, signature, extra] = token.split('.');
  if (!payload || !signature || extra !== undefined) return null;

  const expected = createHmac('sha256', secret).update(payload).digest();
  let actual: Buffer;
  try {
    actual = Buffer.from(signature, 'base64url');
  } catch {
    return null;
  }
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;

  try {
    const claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as SessionClaims;
    if (
      typeof claims.sub !== 'string' ||
      claims.sub.length === 0 ||
      typeof claims.role !== 'string' ||
      !VALID_SESSION_ROLES.has(claims.role) ||
      (claims.jti !== undefined && (typeof claims.jti !== 'string' || claims.jti.length === 0)) ||
      !Number.isInteger(claims.iat) ||
      !Number.isInteger(claims.exp) ||
      claims.exp <= Math.floor(Date.now() / 1000)
    ) {
      return null;
    }
    return claims;
  } catch {
    return null;
  }
}
