import { describe, it, expect, beforeEach } from 'vitest';
import { signSession, verifySession, UserSession } from '../session';

describe('Web Crypto HMAC-SHA256 Session Security', () => {
  const mockUser: UserSession = {
    id: 'user_coord_123',
    email: 'coordenacao@aquila.edu.br',
    role: 'coordinator',
    name: 'Coordenadora Heloisa',
  };

  it('deve assinar e validar com sucesso uma sessão íntegra', async () => {
    const token = await signSession(mockUser);
    expect(token).toBeDefined();
    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(2); // payload.signature

    const verified = await verifySession(token);
    expect(verified).not.toBeNull();
    expect(verified?.id).toBe(mockUser.id);
    expect(verified?.role).toBe('coordinator');
  });

  it('deve REJEITAR token com payload adulterado (anti-forging / anti-tampering)', async () => {
    const token = await signSession(mockUser);
    const [payloadB64, signature] = token.split('.');

    // Atacante tenta forjar a role de "parent" para "admin"
    const decoded = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf-8'));
    decoded.role = 'admin';
    const forgedPayloadB64 = Buffer.from(JSON.stringify(decoded)).toString('base64url');

    const forgedToken = `${forgedPayloadB64}.${signature}`;
    const verified = await verifySession(forgedToken);

    // O HMAC-SHA256 deve rejeitar a assinatura mismatch
    expect(verified).toBeNull();
  });

  it('deve REJEITAR token com assinatura corrompida', async () => {
    const token = await signSession(mockUser);
    const [payloadB64] = token.split('.');
    const corruptedToken = `${payloadB64}.deadbeefinvalidhash1234567890`;

    const verified = await verifySession(corruptedToken);
    expect(verified).toBeNull();
  });

  it('deve expirar tokens após o período de validade', async () => {
    // Cria sessão com expiração no passado (-10 segundos)
    const expiredPayload = {
      ...mockUser,
      exp: Math.floor(Date.now() / 1000) - 10,
    };

    const token = await signSession(expiredPayload as any);
    const verified = await verifySession(token);

    expect(verified).toBeNull();
  });
});
