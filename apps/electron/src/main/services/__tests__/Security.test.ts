import { TOTPService, hashPassword, verifyPassword } from '../../services/TOTPService';
import ImmutableAuditLog from '../../services/ImmutableAuditLog';

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
    const oldToken = totp.generate(secret, Date.now() - 25_000);
    expect(totp.verify(oldToken, secret)).toBe(true);
  });

  it('deve rejeitar token expirado fora da janela', () => {
    const { secret } = totp.generateSecret('test@test.com');
    const expiredToken = totp.generate(secret, Date.now() - 90_000);
    expect(totp.verify(expiredToken, secret)).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────
// Password Hashing
// ─────────────────────────────────────────────────────────────
describe('Password Hashing (Step 158)', () => {
  it('deve gerar hash diferente da senha original', () => {
    const hash = hashPassword('minha_senha_123');
    expect(hash).not.toBe('minha_senha_123');
    expect(hash).toContain('scrypt$'); // Novo padrão Sovereign
  });

  it('deve verificar a senha correta', () => {
    const hash = hashPassword('correta');
    expect(verifyPassword('correta', hash)).toBe(true);
  });

  it('deve rejeitar senha incorreta', () => {
    const hash = hashPassword('correta');
    expect(verifyPassword('errada', hash)).toBe(false);
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

  it('deve registrar uma entrada no banco', async () => {
    await auditLog.record('users', 'INSERT', 'u1', { userId: 'u1' });
    expect(mockDb.run).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO audit_logs'),
        expect.arrayContaining(['users', 'INSERT', 'u1'])
    );
  });

  it('deve encadear hashes corretamente', async () => {
    await auditLog.record('users', 'INSERT', 'u1', { name: 'Test' });
    const firstHash = (auditLog as any).lastHash;
    await auditLog.record('users', 'UPDATE', 'u1', { name: 'Test2' });
    const secondHash = (auditLog as any).lastHash;
    
    expect(secondHash).not.toBe(firstHash);
    expect(mockDb.run).toHaveBeenCalledTimes(2);
  });

  it('deve redactar campos sensíveis do payload', async () => {
    await auditLog.record('users', 'INSERT', 'u1', {
      password: 'senha_secreta',
      cpf: '123.456.789-00',
    });
    
    const lastCall = mockDb.run.mock.calls[0];
    const payloadStr = lastCall[1][3]; // dataStr column
    const payload = JSON.parse(payloadStr);
    
    expect(payload.password).toBe('[REDACTED]');
    expect(payload.cpf).toBe('[REDACTED]');
  });

  it('deve detectar adulteração na verificação de cadeia', async () => {
    mockDb.all.mockResolvedValue([
      {
        id: 1,
        table_name: 'users',
        action: 'INSERT',
        record_id: 'u1',
        data: '{}',
        timestamp: new Date().toISOString(),
        parent_hash: '0'.repeat(64),
        signature: 'HASH_INVALIDO_ADULTERADO',
      },
    ]);

    const result = await auditLog.verify();
    expect(result.valid).toBe(false);
    expect(result.firstBrokenId).toBe('u1');
  });

  it('deve validar cadeia vazia como válida', async () => {
    mockDb.all.mockResolvedValue([]);
    const result = await auditLog.verify();
    expect(result.valid).toBe(true);
    expect(result.totalEntries).toBe(0);
  });
});
