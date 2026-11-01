import { AuthenticationManager } from '../AuthenticationManager';
import Database from '../../../database/Database';
import { jest } from '@jest/globals';

// Mock do Database
jest.mock('../../../database/Database', () => {
  return {
    getInstance: jest.fn(),
    default: jest.fn()
  };
});

describe('AuthenticationManager', () => {
  let authManager: AuthenticationManager;
  let mockDb: any;

  beforeEach(() => {
    process.env.AQUILA_AUTH_SECRET = 'test-session-signing-key-with-at-least-32-bytes';
    mockDb = {
      query: jest.fn(),
      get: jest.fn(),
      run: jest.fn(),
      all: jest.fn(),
    };
    (Database.getInstance as any).mockReturnValue(mockDb);
    authManager = new AuthenticationManager();
    jest.clearAllMocks();
  });

  afterEach(() => {
    delete process.env.AQUILA_AUTH_SECRET;
  });

  it('fails closed when the session signing key is missing', () => {
    delete process.env.AQUILA_AUTH_SECRET;
    expect(() => new AuthenticationManager()).toThrow('AQUILA_AUTH_SECRET');
  });

  describe('Password Hashing (Scrypt)', () => {
    it('deve gerar um hash no formato scrypt$', async () => {
      // Usamos o método privado via casting ou chamando uma função pública que o use
      // No caso, createUser usa hashPassword
      mockDb.get.mockResolvedValueOnce(undefined); // existing check
      mockDb.run.mockResolvedValueOnce({ lastID: 1 }); // insert results

      const user = await authManager.createUser('test@example.com', 'mypassword', 'Test', 'admin');
      expect(user?.passwordHash).toContain('scrypt$16384$8$1$');
    });

    it('deve verificar corretamente hashes Scrypt', async () => {
      const password = 'secure-password';
      const hash = (authManager as any).hashPassword(password);
      
      mockDb.get.mockResolvedValueOnce({
        id: '1',
        username: 'test',
        password_hash: hash,
        role: 'admin',
        isActive: true,
      });
      mockDb.run.mockResolvedValueOnce({ changes: 1 });

      const token = await authManager.login({ email: 'test', password: password });
      expect(token).not.toBeNull();
    });

    it('deve suportar fallback para hashes PBKDF2 legados (2 partes)', async () => {
      const salt = 'salt';
      const password = 'old-password';
      const pbkdf2Hash = require('crypto').pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
      const legacyHash = `${salt}:${pbkdf2Hash}`;

      mockDb.get.mockResolvedValueOnce({
        id: 'legacy-1',
        username: 'olduser',
        password_hash: legacyHash,
        role: 'admin',
        isActive: true,
      });
      mockDb.run.mockResolvedValueOnce({ changes: 1 });

      const token = await authManager.login({ email: 'olduser', password: password });
      expect(token).not.toBeNull();
    });
  });

  describe('Login & Sessions', () => {
    it('deve falhar login com senha incorreta', async () => {
      mockDb.get.mockResolvedValueOnce({
        id: '1',
        username: 'test',
        password_hash: 'scrypt$16384$8$1$salt$wrong',
        role: 'admin',
        isActive: true,
      });

      const token = await authManager.login({ email: 'test', password: 'password' });
      expect(token).toBeNull();
    });

    it('deve gerenciar expiração de sessão', async () => {
      // Mock login to get token
      const hash = (authManager as any).hashPassword('pass');
      mockDb.get.mockResolvedValueOnce({
        id: '1',
        username: 'a@a.com',
        email: 'a@a.com',
        password_hash: hash,
        role: 'admin',
        isActive: true,
      });
      mockDb.run.mockResolvedValueOnce({ changes: 1 });
      const authToken = await authManager.login({ email: 'a@a.com', password: 'pass' });

      expect(authManager.verifyToken(authToken!.token)).toBe(true);

      // Mock Date.now to future (25h later)
      const futureDate = Date.now() + 25 * 60 * 60 * 1000;
      const dateSpy = jest.spyOn(Date, 'now').mockReturnValue(futureDate);
       
       expect(authManager.verifyToken(authToken!.token)).toBe(false);
       dateSpy.mockRestore();
     });
  });

  describe('RBAC Permissions', () => {
    it('deve validar permissões de admin corretamente', () => {
      expect(authManager.hasPermission('admin', 'manage_users')).toBe(true);
      expect(authManager.hasPermission('teacher', 'manage_users')).toBe(false);
    });
  });
});
