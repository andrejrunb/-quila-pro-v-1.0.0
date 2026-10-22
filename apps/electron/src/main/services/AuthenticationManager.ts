import Database from '../../database/Database';
import Logger from './Logger';
import crypto from 'crypto';

/**
 * Passo 9: Autenticação de Usuários
 * Sistema de login, roles e controle de acesso
 * Refatorado: usa db.get()/db.all()/db.run() em vez do obsoleto db.query()
 */

export type UserRole = 'admin' | 'coordinator' | 'teacher' | 'security';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  passwordHash: string;
  createdAt: number;
  lastLogin?: number;
  isActive: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthToken {
  token: string;
  userId: string;
  expiresAt: number;
}

export class AuthenticationManager {
  private logger: Logger;
  private sessions: Map<string, AuthToken> = new Map();
  private tokenSecret = process.env.JWT_SECRET || 'default-secret-key';

  private get db(): Database {
    return Database.getInstance();
  }

  constructor() {
    this.logger = new Logger('AuthenticationManager');
  }

  /**
   * Hash de senha usando Scrypt (Padrão Soberano)
   */
  private hashPassword(password: string): string {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1 }).toString('hex');
    return `scrypt$16384$8$1$${salt}$${hash}`;
  }

  /**
   * Verificar senha com suporte a fallback
   */
  private verifyPassword(password: string, storedHash: string): boolean {
    try {
      // 1. Padrão Scrypt
      if (storedHash.startsWith('scrypt$')) {
        const [, sN, sr, sp, salt, hash] = storedHash.split('$');
        const N = parseInt(sN);
        const r = parseInt(sr);
        const p = parseInt(sp);
        const verifyHash = crypto.scryptSync(password, salt, 64, { N, r, p }).toString('hex');
        return hash === verifyHash;
      }

      // 2. Fallback PBKDF2 (Legado do AuthenticationManager)
      if (storedHash.includes(':')) {
        const parts = storedHash.split(':');
        if (parts.length === 2) {
          const [salt, hash] = parts;
          const verifyHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
          return hash === verifyHash;
        }
      }

      return false;
    } catch (error) {
      this.logger.error(`Erro na verificação de senha: ${(error as Error).message}`);
      return false;
    }
  }

  /**
   * Gerar token JWT simples
   */
  private generateToken(userId: string): string {
    const payload = {
      userId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24 horas
    };

    const token = Buffer.from(JSON.stringify(payload)).toString('base64');
    return token;
  }

  /**
   * Login de usuário
   */
  async login(credentials: LoginCredentials): Promise<AuthToken | null> {
    try {
      const user = await this.db.get(
        'SELECT * FROM users WHERE username = ?',
        [credentials.email]
      ) as any;

      if (!user) {
        this.logger.warn(`Tentativa de login com usuário não encontrado: ${credentials.email}`);
        return null;
      }

      if (!this.verifyPassword(credentials.password, user.password_hash)) {
        this.logger.warn(`Tentativa de login com senha incorreta: ${credentials.email}`);
        return null;
      }

      const token = this.generateToken(user.id);
      const expiresAt = Date.now() + 24 * 60 * 60 * 1000;

      const authToken: AuthToken = {
        token,
        userId: user.id,
        expiresAt,
      };

      this.sessions.set(token, authToken);

      await this.db.run(
        'UPDATE users SET last_login = ? WHERE id = ?',
        [new Date().toISOString(), user.id]
      );

      this.logger.info(`Usuário ${user.username} fez login com sucesso`);
      return authToken;
    } catch (error) {
      this.logger.error(`Erro ao fazer login: ${(error as Error).message}`);
      return null;
    }
  }

  /**
   * Logout de usuário
   */
  async logout(token: string): Promise<void> {
    try {
      this.sessions.delete(token);
      this.logger.info('Usuário fez logout');
    } catch (error) {
      this.logger.error(`Erro ao fazer logout: ${(error as Error).message}`);
    }
  }

  /**
   * Verificar token
   */
  verifyToken(token: string): boolean {
    const authToken = this.sessions.get(token);
    if (!authToken) return false;

    if (authToken.expiresAt < Date.now()) {
      this.sessions.delete(token);
      return false;
    }

    return true;
  }

  /**
   * Obter usuário pelo token
   */
  async getUserFromToken(token: string): Promise<User | null> {
    try {
      if (!this.verifyToken(token)) return null;

      const authToken = this.sessions.get(token);
      if (!authToken) return null;

      const user = await this.db.get(
        'SELECT * FROM users WHERE id = ?',
        [authToken.userId]
      ) as any;

      if (!user) return null;

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        passwordHash: user.password_hash,
        createdAt: new Date(user.created_at).getTime(),
        lastLogin: user.last_login ? new Date(user.last_login).getTime() : undefined,
        isActive: user.isActive === 1,
      };
    } catch (error) {
      this.logger.error(`Erro ao obter usuário: ${(error as Error).message}`);
      return null;
    }
  }

  /**
   * Criar novo usuário
   */
  async createUser(
    email: string,
    password: string,
    name: string,
    role: UserRole
  ): Promise<User | null> {
    try {
      const existing = await this.db.get(
        'SELECT id FROM users WHERE email = ?',
        [email]
      ) as any;

      if (existing) {
        this.logger.warn(`Tentativa de criar usuário com email duplicado: ${email}`);
        return null;
      }

      const userId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const passwordHash = this.hashPassword(password);

      await this.db.run(
        `INSERT INTO users (id, email, name, role, password_hash, isActive, created_at)
         VALUES (?, ?, ?, ?, ?, 1, ?)`,
        [userId, email, name, role, passwordHash, new Date().toISOString()]
      );

      this.logger.info(`Novo usuário criado: ${email} (${role})`);

      return {
        id: userId,
        email,
        name,
        role,
        passwordHash,
        createdAt: Date.now(),
        isActive: true,
      };
    } catch (error) {
      this.logger.error(`Erro ao criar usuário: ${(error as Error).message}`);
      return null;
    }
  }

  /**
   * Alterar senha
   */
  async changePassword(
    userId: string,
    oldPassword: string,
    newPassword: string
  ): Promise<boolean> {
    try {
      const user = await this.db.get(
        'SELECT password_hash FROM users WHERE id = ?',
        [userId]
      ) as any;

      if (!user) return false;

      if (!this.verifyPassword(oldPassword, user.password_hash)) {
        this.logger.warn(`Tentativa de alterar senha com senha antiga incorreta`);
        return false;
      }

      const newPasswordHash = this.hashPassword(newPassword);

      await this.db.run(
        'UPDATE users SET password_hash = ? WHERE id = ?',
        [newPasswordHash, userId]
      );

      this.logger.info(`Senha alterada para usuário ${userId}`);
      return true;
    } catch (error) {
      this.logger.error(`Erro ao alterar senha: ${(error as Error).message}`);
      return false;
    }
  }

  /**
   * Desativar usuário
   */
  async deactivateUser(userId: string): Promise<boolean> {
    try {
      await this.db.run(
        'UPDATE users SET isActive = 0 WHERE id = ?',
        [userId]
      );

      this.logger.info(`Usuário ${userId} desativado`);
      return true;
    } catch (error) {
      this.logger.error(`Erro ao desativar usuário: ${(error as Error).message}`);
      return false;
    }
  }

  /**
   * Verificar permissão
   */
  hasPermission(role: UserRole, action: string): boolean {
    const permissions: Record<UserRole, string[]> = {
      admin: [
        'view_dashboard',
        'manage_users',
        'manage_cameras',
        'view_reports',
        'manage_settings',
        'manage_alerts',
      ],
      coordinator: [
        'view_dashboard',
        'view_reports',
        'manage_alerts',
        'view_cameras',
      ],
      teacher: ['view_dashboard', 'view_class_attendance'],
      security: ['view_cameras', 'view_alerts', 'manage_alerts'],
    };

    return permissions[role]?.includes(action) || false;
  }

  /**
   * Listar usuários
   */
  async listUsers(): Promise<User[]> {
    try {
      const users = await this.db.all(
        'SELECT id, email, name, role, created_at, last_login, isActive FROM users'
      ) as any[];

      return (users || []).map(u => ({
        id: u.id,
        email: u.email,
        name: u.name,
        role: u.role,
        passwordHash: '',
        createdAt: new Date(u.created_at).getTime(),
        lastLogin: u.last_login ? new Date(u.last_login).getTime() : undefined,
        isActive: u.isActive === 1,
      }));
    } catch (error) {
      this.logger.error(`Erro ao listar usuários: ${(error as Error).message}`);
      return [];
    }
  }

  /**
   * Obter estatísticas de autenticação
   */
  async getAuthStats(): Promise<any> {
    try {
      const totalUsers = await this.db.get('SELECT COUNT(*) as count FROM users') as any;
      const activeUsers = await this.db.get(
        'SELECT COUNT(*) as count FROM users WHERE isActive = 1'
      ) as any;
      const adminUsers = await this.db.get(
        'SELECT COUNT(*) as count FROM users WHERE role = "admin"'
      ) as any;

      return {
        totalUsers: totalUsers?.count ?? 0,
        activeUsers: activeUsers?.count ?? 0,
        adminUsers: adminUsers?.count ?? 0,
        activeSessions: this.sessions.size,
      };
    } catch (error) {
      this.logger.error(`Erro ao obter estatísticas: ${(error as Error).message}`);
      return {};
    }
  }
}

export default AuthenticationManager;
