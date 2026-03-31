import { AuthService } from '../AuthService';
import Database from '../../database/Database';
import { jest } from '@jest/globals';

// Mock do Database
jest.mock('../../database/Database');

describe('AuthService', () => {
  let authService: AuthService;
  let mockDb: jest.Mocked<Database>;

  beforeEach(() => {
    mockDb = new Database() as jest.Mocked<Database>;
    authService = new AuthService(mockDb);
    jest.clearAllMocks();
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
      mockDb.run.mockResolvedValueOnce(undefined);

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
      mockDb.run.mockResolvedValueOnce(undefined);

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
      mockDb.run.mockResolvedValueOnce(undefined);

      await authService.createUser({
        username: 'newuser',
        password: 'newpassword',
        name: 'New User',
        role: 'admin'
      });

      expect(mockDb.run).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO users'),
        expect.arrayContaining(['newuser', expect.stringContaining(':'), 'New User', 'admin'])
      );
    });
  });

  describe('validateSession', () => {
    it('deve validar uma sessão ativa', async () => {
      // Primeiro faz login para criar sessão
      const mockUser = { id: 'u1', username: 'u', password_hash: 's:h', name: 'N', role: 'R' };
      mockDb.get.mockResolvedValueOnce(mockUser);
      mockDb.run.mockResolvedValueOnce(undefined);
      
      // Forçamos o hash correto para 'p'
      // password 'p' with salt 's' -> pbkdf2Sync('p', 's', 1000, 64, 'sha512')
      const pHash = require('crypto').pbkdf2Sync('p', 's', 1000, 64, 'sha512').toString('hex');
      mockUser.password_hash = `s:${pHash}`;

      const session = await authService.login('u', 'p');
      const token = session!.token;

      const validated = authService.validateSession(token);
      expect(validated).not.toBeNull();
      expect(validated?.token).toBe(token);
    });

    it('deve retornar null para token expirado', async () => {
      const mockUser = { id: 'u1', username: 'u', password_hash: 's:h', name: 'N', role: 'R' };
      mockDb.get.mockResolvedValueOnce(mockUser);
      mockDb.run.mockResolvedValueOnce(undefined);
      
      const pHash = require('crypto').pbkdf2Sync('p', 's', 1000, 64, 'sha512').toString('hex');
      mockUser.password_hash = `s:${pHash}`;

      const session = await authService.login('u', 'p');
      const token = session!.token;

      // Mock Date.now to simulate expiration
      const realDateNow = Date.now;
      Date.now = jest.fn(() => session!.expiresAt + 1000);

      const validated = authService.validateSession(token);
      expect(validated).toBeNull();

      Date.now = realDateNow;
    });

    it('deve retornar null para token inexistente', () => {
      const result = authService.validateSession('invalid-token');
      expect(result).toBeNull();
    });
  });

  describe('edge cases', () => {
    it('deve lidar com login com campos vazios', async () => {
      const session = await authService.login('', '');
      expect(session).toBeNull();
    });
  });
});
