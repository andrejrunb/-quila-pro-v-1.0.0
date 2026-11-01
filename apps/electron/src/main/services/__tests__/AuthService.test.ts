import { AuthService } from '../AuthService';
import { db, Database } from '../../../database/Database';
import { jest } from '@jest/globals';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import SessionService from '../SessionService';

// Mock do Database e SessionService
jest.mock('../../../database/Database');
jest.mock('../SessionService');

describe('AuthService', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  let authService: AuthService;
  let mockDb: jest.Mocked<Database>;
  let mockSessionService: jest.Mocked<SessionService>;
  let sessions: Map<string, any>;

  beforeEach(() => {
    process.env.AQUILA_AUTH_SECRET = 'test-session-signing-key-with-at-least-32-bytes';
    mockDb = new Database() as jest.Mocked<Database>;
    mockSessionService = new SessionService() as jest.Mocked<SessionService>;
    authService = new AuthService(mockDb, mockSessionService);
    sessions = new Map();
    jest.clearAllMocks();

    // Mock stateful run para sessões (Simula Persistência Soberana em memória)
    mockDb.run.mockImplementation(async (sql: string, params?: any[]) => {
      if (sql.includes('INSERT INTO active_sessions') && params) {
        const [token, userId, expiresAt, data] = params;
        sessions.set(token, { token, userId, expiresAt, data });
      } else if (sql.includes('DELETE FROM active_sessions') && params) {
        const [token] = params;
        sessions.delete(token);
      }
      return { changes: 1, lastID: 1 };
    });

    // Mock stateful get para sessões
    mockDb.get.mockImplementation(async (sql: string, params?: any[]) => {
      if (sql.includes('FROM active_sessions') && params) {
        const [token] = params;
        return sessions.get(token) || null;
      }
      return null;
    });
  });

  afterEach(() => {
    delete process.env.AQUILA_AUTH_SECRET;
    delete process.env.AQUILA_INITIAL_ADMIN_USERNAME;
    delete process.env.AQUILA_INITIAL_ADMIN_PASSWORD;
    delete process.env.AQUILA_ENABLE_DEMO_USERS;
    delete process.env.AQUILA_DEMO_SEED_DB_PATH;
    delete process.env.AQUILA_DEMO_RH_PASSWORD;
    delete process.env.AQUILA_DEMO_COORD_PASSWORD;
    delete process.env.AQUILA_DEMO_TEACHER_PASSWORD;
    delete process.env.AQUILA_DEMO_PARENT_PASSWORD;
    if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = originalNodeEnv;
  });

  afterAll(async () => {
    await mockDb.close();
  });

  it('fails closed when the session signing key is absent', () => {
    delete process.env.AQUILA_AUTH_SECRET;
    expect(() => new AuthService(mockDb, mockSessionService)).toThrow('AQUILA_AUTH_SECRET');
  });

  describe('login', () => {
    it('deve retornar uma sessão para credenciais válidas (Legado - 1000 iterações)', async () => {
      const salt = 'salt';
      const password = 'password';
      const hash = require('crypto').pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
      const mockUser = {
        id: 'user-1',
        username: 'testuser',
        password_hash: `${salt}:${hash}`,
        name: 'Test User',
        role: 'operator'
      };

      mockDb.get.mockResolvedValueOnce(mockUser);

      const session = await authService.login('testuser', 'password');

      expect(session).not.toBeNull();
      expect(session?.user.username).toBe('testuser');
    });

    it('deve retornar uma sessão para credenciais válidas (Seguro - 210k iterações)', async () => {
      const salt = 'salt';
      const password = 'password';
      const iterations = 210000;
      const hash = require('crypto').pbkdf2Sync(password, salt, iterations, 64, 'sha512').toString('hex');
      const mockUser = {
        id: 'user-2',
        username: 'safeuser',
        password_hash: `${salt}:${iterations}:${hash}`,
        name: 'Safe User',
        role: 'admin'
      };

      mockDb.get.mockResolvedValueOnce(mockUser);

      const session = await authService.login('safeuser', 'password');

      expect(session).not.toBeNull();
      expect(session?.user.username).toBe('safeuser');
    });

    it('deve retornar null para senha inválida', async () => {
      const mockUser = {
        id: 'user-1',
        username: 'testuser',
        password_hash: 'salt:wronghash',
        name: 'Test User',
        role: 'operator'
      };

      mockDb.get.mockResolvedValueOnce(mockUser);

      const session = await authService.login('testuser', 'wrongpassword');

      expect(session).toBeNull();
    });

    it('deve retornar null para usuário não encontrado', async () => {
      mockDb.get.mockResolvedValueOnce(null);

      const session = await authService.login('nonexistent', 'password');

      expect(session).toBeNull();
    });
  });

  describe('createUser', () => {
    it('deve inserir um novo usuário no banco com senha em hash', async () => {
      mockDb.run.mockResolvedValueOnce({ changes: 1, lastID: 1 });

      await authService.createUser({
        username: 'newuser',
        password: 'newpassword',
        name: 'New User',
        role: 'admin'
      });

      expect(mockDb.run).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO users'),
        expect.arrayContaining(['newuser', expect.stringContaining('scrypt$'), 'New User', 'admin'])
      );
    });
  });

  describe('validateSession', () => {
    it('deve validar uma sessão ativa', async () => {
      // Primeiro faz login para criar sessão
      const mockUser = { id: 'u1', username: 'u', password_hash: 's:h', name: 'N', role: 'admin' };
      mockDb.get.mockResolvedValueOnce(mockUser);
      
      // Forçamos o hash correto para 'p'
      // password 'p' with salt 's' -> pbkdf2Sync('p', 's', 1000, 64, 'sha512')
      const pHash = require('crypto').pbkdf2Sync('p', 's', 1000, 64, 'sha512').toString('hex');
      mockUser.password_hash = `s:${pHash}`;

      const session = await authService.login('u', 'p');
      const token = session!.token;

      const validated = await authService.validateSession(token);
      expect(validated).not.toBeNull();
      expect(validated?.token).toBe(token);
    });

    it('deve retornar null para token expirado', async () => {
      const mockUser = { id: 'u1', username: 'u', password_hash: 's:h', name: 'N', role: 'admin' };
      mockDb.get.mockResolvedValueOnce(mockUser);
      
      const pHash = require('crypto').pbkdf2Sync('p', 's', 1000, 64, 'sha512').toString('hex');
      mockUser.password_hash = `s:${pHash}`;

      const session = await authService.login('u', 'p');
      const token = session!.token;

      // Mock Date.now to simulate expiration
      const dateSpy = jest.spyOn(Date, 'now').mockReturnValue(session!.expiresAt + 1000);
 
       const validated = await authService.validateSession(token);
       expect(validated).toBeNull();
 
       dateSpy.mockRestore();
     });

    it('deve retornar null para token inexistente', async () => {
      const result = await authService.validateSession('invalid-token');
      expect(result).toBeNull();
    });

    it('rejeita token adulterado e assinatura criada com configuração anterior', async () => {
      const mockUser = { id: 'u2', username: 'student', password_hash: 's:h', name: 'Student', role: 'student' };
      mockDb.get.mockResolvedValueOnce(mockUser);
      mockUser.password_hash = `s:${require('crypto').pbkdf2Sync('p', 's', 1000, 64, 'sha512').toString('hex')}`;
      const session = await authService.login('student', 'p');
      const [payload, signature] = session!.token.split('.');
      const altered = Buffer.from(payload, 'base64url').toString('utf8').replace('"student"', '"admin"');
      expect(await authService.validateSession(`${Buffer.from(altered).toString('base64url')}.${signature}`)).toBeNull();

      const { signSessionToken } = require('../sessionCrypto');
      const oldToken = signSessionToken(
        { sub: 'u2', role: 'student', iat: 1, exp: Math.floor(Date.now() / 1000) + 60 },
        'old-runtime-session-key-with-at-least-32-bytes'
      );
      expect(await authService.validateSession(oldToken)).toBeNull();
    });

    it('rejeita usuário com role ausente ou não reconhecido', async () => {
      mockDb.get
        .mockResolvedValueOnce({ id: 'u3', username: 'invalid-role', password_hash: 's:h', name: 'User', role: 'unknown' })
        .mockResolvedValueOnce({ id: 'u4', username: 'missing-role', password_hash: 's:h', name: 'User' });
      expect(await authService.login('invalid-role', 'p')).toBeNull();
      expect(await authService.login('missing-role', 'p')).toBeNull();
    });
  });

  describe('initial privileged provisioning', () => {
    it('does not provision an account without explicit individual credentials', async () => {
      await authService.provisionInitialAdmin();
      expect(mockDb.run).not.toHaveBeenCalled();
    });

    it('creates once with configured credentials and preserves an existing administrator', async () => {
      process.env.AQUILA_INITIAL_ADMIN_USERNAME = 'first-admin';
      process.env.AQUILA_INITIAL_ADMIN_PASSWORD = 'a-unique-individual-secret';
      let completed = false;
      const baseGet = mockDb.get.getMockImplementation();
      mockDb.get.mockImplementation(async (sql: string, params?: any[]) => {
        if (sql.includes('auth_provisioning')) return completed ? { key: 'initial-admin' } : null;
        if (sql.includes("role = 'admin'")) return null;
        return baseGet ? baseGet(sql, params) : null;
      });
      const baseRun = mockDb.run.getMockImplementation();
      mockDb.run.mockImplementation(async (sql: string, params?: any[]) => {
        if (sql.includes('INSERT OR IGNORE INTO auth_provisioning')) completed = true;
        return baseRun ? baseRun(sql, params) : { changes: 1, lastID: 1 };
      });

      await authService.provisionInitialAdmin();
      delete process.env.AQUILA_INITIAL_ADMIN_PASSWORD;
      await authService.provisionInitialAdmin();
      const userInsert = mockDb.run.mock.calls.find(([sql]) => sql.includes('INSERT INTO users'));
      expect(userInsert?.[1]).toEqual(expect.arrayContaining(['first-admin', expect.stringContaining('scrypt$')]));
      expect(userInsert?.[1]).not.toContain('a-unique-individual-secret');
      expect(mockDb.run.mock.calls.filter(([sql]) => sql.includes('INSERT INTO users'))).toHaveLength(1);
    });

    it('does not replace or recreate an existing (including disabled) administrator', async () => {
      process.env.AQUILA_INITIAL_ADMIN_USERNAME = 'replacement-admin';
      process.env.AQUILA_INITIAL_ADMIN_PASSWORD = 'a-unique-individual-secret';
      mockDb.get.mockImplementation(async (sql: string) => {
        if (sql.includes("role = 'admin'")) return { id: 'existing-admin', isActive: 0 };
        return null;
      });

      await authService.provisionInitialAdmin();
      expect(mockDb.run.mock.calls.some(([sql]) => sql.includes('INSERT INTO users'))).toBe(false);
    });
  });

  describe('demo seeding guard', () => {
    it('does not create demo users during production startup', async () => {
      process.env.NODE_ENV = 'production';
      process.env.AQUILA_ENABLE_DEMO_USERS = 'true';
      process.env.AQUILA_DEMO_SEED_DB_PATH = 'C:\\demo\\test.db';
      await authService.seedDemoUsers();
      expect(mockDb.get).not.toHaveBeenCalled();
      expect(mockDb.run).not.toHaveBeenCalled();
    });

    it('does not create demo users without an isolated database path', async () => {
      process.env.NODE_ENV = 'development';
      process.env.AQUILA_ENABLE_DEMO_USERS = 'true';
      await authService.seedDemoUsers();
      expect(mockDb.get).not.toHaveBeenCalled();
      expect(mockDb.run).not.toHaveBeenCalled();
    });

    it('refuses demo seeding unless every account has an individual password', async () => {
      const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'aquila-demo-password-'));
      const databasePath = path.join(directory, 'demo.db');
      fs.writeFileSync(databasePath, '');
      process.env.NODE_ENV = 'development';
      process.env.AQUILA_ENABLE_DEMO_USERS = 'true';
      process.env.AQUILA_DEMO_SEED_DB_PATH = databasePath;
      jest.spyOn(mockDb, 'getDatabasePath').mockReturnValue(databasePath);

      await expect(authService.seedDemoUsers()).rejects.toThrow('individual password');
      expect(mockDb.run).not.toHaveBeenCalled();
      fs.rmSync(directory, { recursive: true, force: true });
    });

    it('does not recreate a removed demo account on seed rerun', async () => {
      const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'aquila-demo-seed-'));
      const databasePath = path.join(directory, 'demo.db');
      fs.writeFileSync(databasePath, '');
      process.env.NODE_ENV = 'development';
      process.env.AQUILA_ENABLE_DEMO_USERS = 'true';
      process.env.AQUILA_DEMO_SEED_DB_PATH = databasePath;
      process.env.AQUILA_DEMO_RH_PASSWORD = 'individual-demo-rh-password';
      process.env.AQUILA_DEMO_COORD_PASSWORD = 'individual-demo-coord-password';
      process.env.AQUILA_DEMO_TEACHER_PASSWORD = 'individual-demo-teacher-password';
      process.env.AQUILA_DEMO_PARENT_PASSWORD = 'individual-demo-parent-password';
      jest.spyOn(mockDb, 'getDatabasePath').mockReturnValue(databasePath);

      let seeded = false;
      mockDb.get.mockImplementation(async (sql: string) => {
        if (sql.includes('demo_seed_state')) return seeded ? { seed_name: 'demo-users' } : null;
        return null;
      });
      mockDb.run.mockImplementation(async (sql: string) => {
        if (sql.includes('INSERT INTO demo_seed_state')) seeded = true;
        return { changes: 1, lastID: 1 };
      });

      await authService.seedDemoUsers();
      const createdUsers = mockDb.run.mock.calls.filter(([sql]) => sql.includes('INSERT INTO users')).length;
      await authService.seedDemoUsers();

      expect(createdUsers).toBeGreaterThan(0);
      expect(mockDb.run.mock.calls.filter(([sql]) => sql.includes('INSERT INTO users'))).toHaveLength(createdUsers);
      expect(mockDb.get.mock.calls.filter(([sql]) => sql.includes('FROM users'))).toHaveLength(4);
      fs.rmSync(directory, { recursive: true, force: true });
    });
  });

  describe('edge cases', () => {
    it('deve lidar com login com campos vazios', async () => {
      const session = await authService.login('', '');
      expect(session).toBeNull();
    });
  });
});
