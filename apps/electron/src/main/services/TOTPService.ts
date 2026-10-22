/**
 * Step 156 — Serviço de Autenticação de Dois Fatores (2FA TOTP)
 * Compatível com Google Authenticator, Authy, Microsoft Authenticator.
 *
 * Dependência: npm install otplib qrcode
 * Uso:
 *   const totp = new TOTPService();
 *   const { secret, qrCodeUrl } = await totp.generateSecret('admin@escola.com.br', 'Áquila Pro');
 *   const isValid = totp.verify(token, secret);
 */
import { createHmac, createHash, randomBytes } from 'crypto';

// Constantes TOTP (RFC 6238)
const TOTP_DIGITS = 6;
const TOTP_STEP = 30; // segundos
const TOTP_WINDOW = 1; // tolerância de ±1 janela

/**
 * Implementação TOTP sem dependência externa.
 * Compatível com Google Authenticator via RFC 6238.
 */
export class TOTPService {
  /**
   * Gera uma nova chave secreta TOTP para o usuário.
   * @param userEmail - Email do usuário (para o QR Code)
   * @param issuer   - Nome da aplicação (ex: "Áquila Pro")
   */
  generateSecret(userEmail: string, issuer = 'Áquila Pro'): {
    secret: string;
    qrCodeUri: string;
    backupCodes: string[];
  } {
    // Gerar secret de 32 bytes em base32
    const rawSecret = randomBytes(20);
    const secret = this._toBase32(rawSecret);

    // URI padrão para QR Code (otpauth://)
    const label = encodeURIComponent(`${issuer}:${userEmail}`);
    const params = new URLSearchParams({
      secret,
      issuer,
      algorithm: 'SHA1',
      digits: String(TOTP_DIGITS),
      period: String(TOTP_STEP),
    });
    const qrCodeUri = `otpauth://totp/${label}?${params.toString()}`;

    // Gerar códigos de backup (8 códigos de 8 dígitos)
    const backupCodes = Array.from({ length: 8 }, () =>
      randomBytes(4).readUInt32BE(0).toString(10).slice(0, 8).padStart(8, '0')
    );

    return { secret, qrCodeUri, backupCodes };
  }

  /**
   * Gera o token TOTP atual para um secret.
   * Útil para testes.
   */
  generate(secret: string, timestamp = Date.now()): string {
    const counter = Math.floor(timestamp / 1000 / TOTP_STEP);
    return this._hotp(secret, counter);
  }

  /**
   * Verifica se um token TOTP é válido para o secret, com tolerância de ±1 janela.
   */
  verify(token: string, secret: string): boolean {
    const counter = Math.floor(Date.now() / 1000 / TOTP_STEP);
    for (let delta = -TOTP_WINDOW; delta <= TOTP_WINDOW; delta++) {
      if (this._hotp(secret, counter + delta) === token.trim()) {
        return true;
      }
    }
    return false;
  }

  /**
   * Gera token HMAC-based OTP (base do TOTP).
   */
  private _hotp(secret: string, counter: number): string {
    const key = Buffer.from(this._fromBase32(secret));
    const msg = Buffer.alloc(8);
    msg.writeBigInt64BE(BigInt(counter));
    const hmac = createHmac('sha1', key).update(msg).digest();
    const offset = hmac[hmac.length - 1] & 0x0f;
    const code = (hmac.readUInt32BE(offset) & 0x7fffffff) % Math.pow(10, TOTP_DIGITS);
    return code.toString().padStart(TOTP_DIGITS, '0');
  }

  private _toBase32(bytes: Buffer): string {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let bits = 0;
    let value = 0;
    let output = '';
    for (const byte of bytes) {
      value = (value << 8) | byte;
      bits += 8;
      while (bits >= 5) {
        output += alphabet[(value >>> (bits - 5)) & 31];
        bits -= 5;
      }
    }
    if (bits > 0) output += alphabet[(value << (5 - bits)) & 31];
    return output;
  }

  private _fromBase32(input: string): number[] {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    const cleaned = input.toUpperCase().replace(/=+$/, '');
    let bits = 0;
    let value = 0;
    const output: number[] = [];
    for (const char of cleaned) {
      const idx = alphabet.indexOf(char);
      if (idx < 0) continue;
      value = (value << 5) | idx;
      bits += 5;
      if (bits >= 8) {
        output.push((value >>> (bits - 8)) & 255);
        bits -= 8;
      }
    }
    return output;
  }
}

// ─────────────────────────────────────────────────────────────
// Utilitário: hash de senhas bcrypt-like (sem dep. externa)
// Usa scrypt que é built-in do Node.js >= 10
// ─────────────────────────────────────────────────────────────
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const { scryptSync } = require('crypto');
  const hash = scryptSync(password, salt, 64) as Buffer;
  return `scrypt$${salt}:${hash.toString('hex')}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const parts = stored.split(':');
  const salt = parts[0].replace('scrypt$', '');
  const expected = parts[1];
  const { scryptSync, timingSafeEqual } = require('crypto');
  const actual = scryptSync(password, salt, 64) as Buffer;
  const expectedBuf = Buffer.from(expected, 'hex');
  return timingSafeEqual(actual, expectedBuf);
}

export default TOTPService;

