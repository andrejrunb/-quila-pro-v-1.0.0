/**
 * Signed portal sessions. The signing key is supplied by the deployment
 * environment; there is deliberately no built-in or cross-purpose fallback.
 */
export type PortalRole = 'admin' | 'coordinator' | 'teacher' | 'parent' | 'student';

export interface SessionPayload {
  username: string;
  portal: string;
  role: PortalRole;
  iat: number;
  exp: number;
}

const VALID_ROLES = new Set<PortalRole>(['admin', 'coordinator', 'teacher', 'parent', 'student']);

export function getAuthSecret(secret = process.env.AQUILA_AUTH_SECRET): string {
  if (!secret || Buffer.byteLength(secret, 'utf8') < 32) {
    throw new Error('AQUILA_AUTH_SECRET must be configured with at least 32 bytes.');
  }
  return secret;
}

function base64UrlEncode(value: string | Uint8Array): string {
  return Buffer.from(value).toString('base64url');
}

function base64UrlDecode(value: string): string {
  return Buffer.from(value, 'base64url').toString('utf8');
}

async function getCryptoKey(): Promise<CryptoKey> {
  const keyData = new TextEncoder().encode(getAuthSecret());
  return crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

export async function signSession(
  payload: Omit<SessionPayload, 'iat' | 'exp'> & Partial<Pick<SessionPayload, 'iat' | 'exp'>>,
  expiresInSeconds = 60 * 60 * 8
): Promise<string> {
  if (!payload.username || !payload.portal || !VALID_ROLES.has(payload.role)) {
    throw new Error('A valid username, portal, and role are required to issue a session.');
  }

  const now = Math.floor(Date.now() / 1000);
  const fullPayload: SessionPayload = {
    ...payload,
    iat: payload.iat ?? now,
    exp: payload.exp ?? now + expiresInSeconds,
  };
  const encodedHeader = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload));
  const signedContent = `${encodedHeader}.${encodedPayload}`;
  const key = await getCryptoKey();
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(signedContent)
  );
  return `${signedContent}.${base64UrlEncode(new Uint8Array(signature))}`;
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3 || parts.some(part => part.length === 0)) return null;

  try {
    const [encodedHeader, encodedPayload, encodedSignature] = parts;
    const header = JSON.parse(base64UrlDecode(encodedHeader));
    if (header.alg !== 'HS256' || header.typ !== 'JWT') return null;

    const signature = Buffer.from(encodedSignature, 'base64url');
    const key = await getCryptoKey();
    const valid = await crypto.subtle.verify(
      'HMAC',
      key,
      signature,
      new TextEncoder().encode(`${encodedHeader}.${encodedPayload}`)
    );
    if (!valid) return null;

    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as SessionPayload;
    const now = Math.floor(Date.now() / 1000);
    if (
      typeof payload.username !== 'string' ||
      payload.username.length === 0 ||
      typeof payload.portal !== 'string' ||
      payload.portal.length === 0 ||
      typeof payload.role !== 'string' ||
      !VALID_ROLES.has(payload.role) ||
      !Number.isInteger(payload.iat) ||
      !Number.isInteger(payload.exp) ||
      payload.iat > now ||
      payload.exp <= now
    ) return null;

    return payload;
  } catch {
    return null;
  }
}
