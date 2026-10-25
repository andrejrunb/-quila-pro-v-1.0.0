/**
 * Áquila Pro — Utilitário de Sessão Criptográfica Segura (HMAC-SHA256)
 * Utiliza Web Crypto API nativa (compatível com Edge Runtime do Next.js).
 */

const AUTH_SECRET = process.env.AQUILA_AUTH_SECRET || process.env.AQUILA_ENCRYPTION_SECRET || 'aquila_sovereign_auth_secret_key_v2_1_production';

export interface SessionPayload {
  username: string;
  portal: string;
  role: 'admin' | 'coordinator' | 'teacher' | 'parent' | 'student';
  iat: number;
  exp: number;
  [key: string]: any;
}

function base64UrlEncode(buffer: Uint8Array | string): string {
  let base64: string;
  if (typeof buffer === 'string') {
    if (typeof btoa !== 'undefined') {
      base64 = btoa(unescape(encodeURIComponent(buffer)));
    } else {
      base64 = Buffer.from(buffer, 'utf-8').toString('base64');
    }
  } else {
    if (typeof Buffer !== 'undefined') {
      base64 = Buffer.from(buffer).toString('base64');
    } else {
      let binary = '';
      const len = buffer.byteLength;
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(buffer[i]);
      }
      base64 = btoa(binary);
    }
  }

  return base64.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function base64UrlDecode(str: string): string {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) {
    str += '=';
  }
  if (typeof atob !== 'undefined') {
    return decodeURIComponent(escape(atob(str)));
  }
  return Buffer.from(str, 'base64').toString('utf-8');
}

async function getCryptoKey(): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyData = enc.encode(AUTH_SECRET);
  return await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

/**
 * Assina criptograficamente uma sessão usando HMAC-SHA256 (Web Crypto API)
 */
export async function signSession(payload: Partial<SessionPayload>, expiresInSeconds = 60 * 60 * 8): Promise<string> {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const fullPayload: SessionPayload = {
    username: payload.username || 'unknown',
    portal: payload.portal || 'portal',
    role: payload.role || 'coordinator',
    iat: payload.iat ?? now,
    exp: payload.exp ?? (now + expiresInSeconds),
    ...payload,
  };

  const encHeader = base64UrlEncode(JSON.stringify(header));
  const encPayload = base64UrlEncode(JSON.stringify(fullPayload));
  const dataToSign = `${encHeader}.${encPayload}`;

  const key = await getCryptoKey();
  const enc = new TextEncoder();
  const signatureBytes = await crypto.subtle.sign('HMAC', key, enc.encode(dataToSign));
  const signature = base64UrlEncode(new Uint8Array(signatureBytes));

  return `${dataToSign}.${signature}`;
}

/**
 * Valida a integridade e assinatura criptográfica de um token de sessão
 */
export async function verifySession(token: string): Promise<SessionPayload | null> {
  if (!token || typeof token !== 'string') return null;

  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [encHeader, encPayload, signature] = parts;
  const dataToSign = `${encHeader}.${encPayload}`;

  try {
    const key = await getCryptoKey();
    const enc = new TextEncoder();
    
    // Converter signature de base64url de volta para buffer
    const sigB64 = signature.replace(/-/g, '+').replace(/_/g, '/');
    const rawSig = typeof atob !== 'undefined' ? atob(sigB64) : Buffer.from(sigB64, 'base64').toString('binary');
    const sigBytes = new Uint8Array(rawSig.length);
    for (let i = 0; i < rawSig.length; i++) {
      sigBytes[i] = rawSig.charCodeAt(i);
    }

    const isValid = await crypto.subtle.verify('HMAC', key, sigBytes, enc.encode(dataToSign));
    if (!isValid) return null;

    const payload: SessionPayload = JSON.parse(base64UrlDecode(encPayload));
    const now = Math.floor(Date.now() / 1000);

    if (payload.exp && payload.exp < now) {
      return null; // Expirado
    }

    return payload;
  } catch {
    return null;
  }
}
