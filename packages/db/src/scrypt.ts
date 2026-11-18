import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const KEY_LEN = 64;
const MAX_MEM = 64 * 1024 * 1024;

/**
 * Generates a memory-hard scrypt hash compatible with apps/electron AuthService.ts:
 * `scrypt$16384$8$1$<saltHex>$<derivedHex>`
 */
export function hashPasswordScrypt(password: string): string {
  if (!password) {
    throw new Error('Password must be non-empty.');
  }
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, KEY_LEN, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
    maxmem: MAX_MEM,
  }).toString('hex');
  return `scrypt$${SCRYPT_N}$${SCRYPT_R}$${SCRYPT_P}$${salt}$${hash}`;
}

export function verifyPasswordScrypt(password: string, storedHash: string): boolean {
  if (!password || !storedHash || !storedHash.startsWith('scrypt$')) {
    return false;
  }
  const parts = storedHash.split('$');
  if (parts.length !== 6) {
    return false;
  }
  const [, sN, sr, sp, salt, expectedHex] = parts;
  const N = Number.parseInt(sN, 10);
  const r = Number.parseInt(sr, 10);
  const p = Number.parseInt(sp, 10);
  if (!Number.isFinite(N) || !Number.isFinite(r) || !Number.isFinite(p) || !salt || !expectedHex) {
    return false;
  }

  try {
    const derived = scryptSync(password, salt, KEY_LEN, { N, r, p, maxmem: MAX_MEM });
    const expected = Buffer.from(expectedHex, 'hex');
    if (derived.length !== expected.length) {
      return false;
    }
    return timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}
