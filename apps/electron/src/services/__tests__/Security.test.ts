/**
 * Step 156-157 — Testes unitários: TOTPService e ImmutableAuditLog
 */
import { jest } from '@jest/globals';

const { TOTPService, hashPassword, verifyPassword } = require('../../services/TOTPService');
const { ImmutableAuditLog } = require('../../services/ImmutableAuditLog');

// ─────────────────────────────────────────────────────────────
// TOTPService
// ─────────────────────────────────────────────────────────────
describe('TOTPService (Step 156)', () => {
  let totp: any;

  beforeEach(() => {
    totp = new TOTPService();
  });

  it('deve gerar um secret com qrCodeUri e 8 backupCodes', () => {
    const result = totp.generateSecret('admin@escola.com.br', 'Áquila Pro');
    expect(result.secret).toBeTruthy();
    expect(result.qrCodeUri).toContain('otpauth://totp/');
    expect(result.qrCodeUri).toContain(result.secret);
    expect(result.backupCodes).toHaveLength(8);
    result.backupCodes.forEach((code: string) => {
      expect(code).toHaveLength(8);
    });
  });

  it('deve gerar token de 6 dígitos para um secret', () => {
    const { secret } = totp.generateSecret('test@test.com');
    const token = totp.generate(secret);
    expect(token).toMatch(/^\d{6}$/);
  });

  it('deve verificar um token gerado como válido', () => {
    const { secret } = totp.generateSecret('test@test.com');
    const token = totp.generate(secret, Date.now());
    expect(totp.verify(token, secret)).toBe(true);
  });

  it('deve rejeitar um token inválido', () => {
    const { secret } = totp.generateSecret('test@test.com');
    expect(totp.verify('000000', secret)).toBe(false);
    expect(totp.verify('123456', secret)).toBe(false);
  });

  it('deve aceitar token dentro da janela de tolerância (±30s)', () => {
    const { secret } = totp.generateSecret('test@test.com');
    // Token gerado 25 segundos atrás (dentro da janela)
    const oldToken = totp.generate(secret, Date.now() - 25_000);
    expect(totp.verify(oldToken, secret)).toBe(true);
  });

  it('deve rejeitar token expirado fora da janela', () => {
    const { secret } = totp.generateSecret('test@test.com');
    // Token de 90 segundos atrás (fora da janela de ±30s)
    const expiredToken = totp.generate(secret, Date.now() - 90_000);
    expect(totp.verify(expiredToken, secret)).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────
// hashPassword / verifyPassword
// ─────────────────────────────────────────────────────────────
describe('Password Hashing (Step 158)', () => {
  it('deve gerar hash diferente da senha original', () => {
    const hash = hashPassword('minha_senha_123');
    expect(hash).not.toBe('minha_senha_123');
    expect(hash).toContain(':'); // salt:hash
  });

  it('deve verificar a senha correta', () => {
    const hash = hashPassword('correta');
    expect(verifyPassword('correta', hash)).toBe(true);
  });

  it('deve rejeitar senha incorreta', () => {
    const hash = hashPassword('correta');
    expect(verifyPassword('errada', hash)).toBe(false);
  });

  it('deve gerar hashes diferentes para a mesma senha (salt aleatório)', () => {
    const h1 = hashPassword('mesma_senha');
    const h2 = hashPassword('mesma_senha');
    expect(h1).not.toBe(h2);
    // Mas ambas devem verificar corretamente
    expect(verifyPassword('mesma_senha', h1)).toBe(true);
    expect(verifyPassword('mesma_senha', h2)).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────
// ImmutableAuditLog
// ─────────────────────────────────────────────────────────────
describe('ImmutableAuditLog (Step 157)', () => {
  let auditLog: any;
  let mockDb: any;

  beforeEach(async () => {
    mockDb = {
      get: (jest.fn() as any).mockResolvedValue(null),
      run: (jest.fn() as any).mockResolvedValue(undefined),
      all: (jest.fn() as any).mockResolvedValue([]),
    };
    auditLog = new ImmutableAuditLog(mockDb, 'test-secret-key-32-chars-long!!!');
    await auditLog.initialize();
  });

  it('deve exigir secret com pelo menos 16 caracteres', () => {
    expect(() => new ImmutableAuditLog(mockDb, 'curto')).toThrow('[AuditLog]');
  });

  it('deve registrar uma entrada e retornar hash único', async () => {
    const entry = await auditLog.record('login', { userId: 'user-1' });
    expect(entry.hash).toBeTruthy();
    expect(entry.action).toBe('login');
    expect(entry.prevHash).toBe('GENESIS');
    expect(mockDb.run).toHaveBeenCalled();
  });

  it('deve encadear hashes: prevHash da 2ª = hash da 1ª', async () => {
    const e1 = await auditLog.record('login', { userId: 'u1' });
    const e2 = await auditLog.record('logout', { userId: 'u1' });
    expect(e2.prevHash).toBe(e1.hash);
  });

  it('deve redactar campos sensíveis do payload (password, cpf)', async () => {
    const entry = await auditLog.record('password_change', {
      userId: 'u1',
      password: 'senha_secreta',
      cpf: '123.456.789-00',
      action: 'changed',
    });
    expect(entry.payload.password).toBe('[REDACTED]');
    expect(entry.payload.cpf).toBe('[REDACTED]');
    expect(entry.payload.action).toBe('changed');
  });

  it('deve detectar adulteração na verificação de cadeia (verify)', async () => {
    // Simular log com hash incorreto (adulterado)
    mockDb.all.mockResolvedValue([
      {
        id: 'entry-1',
        timestamp: '2026-03-22T00:00:00Z',
        action: 'login',
        user_id: 'u1',
        payload: '{}',
        prev_hash: 'GENESIS',
        hash: 'HASH_INVALIDO_ADULTERADO',
      },
    ]);

    const result = await auditLog.verify();
    expect(result.valid).toBe(false);
    expect(result.firstBrokenId).toBe('entry-1');
  });

  it('deve validar cadeia vazia como válida', async () => {
    mockDb.all.mockResolvedValue([]);
    const result = await auditLog.verify();
    expect(result.valid).toBe(true);
    expect(result.totalEntries).toBe(0);
  });
});
