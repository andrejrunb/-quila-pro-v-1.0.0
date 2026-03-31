import Database from '../database/Database';
import Logger from './Logger';
import crypto from 'crypto';

/**
 * Passo 9: Autenticação de Usuários
 * Sistema de login, roles e controle de acesso
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
  private db: Database;
  private logger: Logger;
  private sessions: Map<string, AuthToken> = new Map();
  private tokenSecret = process.env.JWT_SECRET || 'default-secret-key';

  constructor() {
    this.db = new Database();
    this.logger = new Logger('AuthenticationManager');
  }

  /**
   * Hash de senha usando bcrypt
   */
  private hashPassword(password: string): string {
    // Em produção, usar bcrypt: await bcrypt.hash(password, 10)
    // Para simplificar, usar crypto.pbkdf2
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto
      .pbkdf2Sync(password, salt, 1000, 64, 'sha512')
      .toString('hex');
    return `${salt}:${hash}`;
  }

  /**
   * Verificar senha
   */
  private verifyPassword(password: string, hash: string): boolean {
    const [salt, storedHash] = hash.split(':');
    const computed = crypto
      .pbkdf2Sync(password, salt, 1000, 64, 'sha512')
      .toString('hex');
    return computed === storedHash;
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

    // Implementação simplificada (em produção usar jsonwebtoken)
    const token = Buffer.from(JSON.stringify(payload)).toString('base64');
    return token;
  }

  /**
   * Login de usuário
   */
  async login(credentials: LoginCredentials): Promise<AuthToken | null> {
    try {
      // Buscar usuário
      const users = await this.db.query(
        'SELECT * FROM users WHERE username = ?',
        [credentials.email] // Reusing email field as username for login
      );

      if (!users || users.length === 0) {
        this.logger.warn(`Tentativa de login com usuário não encontrado: ${credentials.email}`);
        return null;
      }

      const user = users[0];

      // Verificar senha
      if (!this.verifyPassword(credentials.password, user.password_hash)) {
        this.logger.warn(`Tentativa de login com senha incorreta: ${credentials.email}`);
        return null;
      }

      // Gerar token
      const token = this.generateToken(user.id);
      const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 horas

      const authToken: AuthToken = {
        token,
        userId: user.id,
        expiresAt,
      };

      // Armazenar sessão
      this.sessions.set(token, authToken);

      // Atualizar lastLogin
      await this.db.query(
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

    // Verificar expiração
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

      const users = await this.db.query(
        'SELECT * FROM users WHERE id = ?',
        [authToken.userId]
      );

      if (!users || users.length === 0) return null;

      const user = users[0];
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        passwordHash: user.password_hash,
        createdAt: new Date(user.created_at).getTime(),
        lastLogin: user.last_login ? new Date(user.last_login).getTime() : undefined,
        isActive: user.is_active === 1,
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
      // Verificar se email já existe
      const existing = await this.db.query(
        'SELECT id FROM users WHERE email = ?',
        [email]
      );

      if (existing && existing.length > 0) {
        this.logger.warn(`Tentativa de criar usuário com email duplicado: ${email}`);
        return null;
      }

      const userId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const passwordHash = this.hashPassword(password);

      await this.db.query(
        `INSERT INTO users (id, email, name, role, password_hash, is_active, created_at)
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
      const users = await this.db.query(
        'SELECT password_hash FROM users WHERE id = ?',
        [userId]
      );

      if (!users || users.length === 0) return false;

      const user = users[0];

      // Verificar senha antiga
      if (!this.verifyPassword(oldPassword, user.password_hash)) {
        this.logger.warn(`Tentativa de alterar senha com senha antiga incorreta`);
        return false;
      }

      // Hash da nova senha
      const newPasswordHash = this.hashPassword(newPassword);

      await this.db.query(
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
      await this.db.query(
        'UPDATE users SET is_active = 0 WHERE id = ?',
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
      const users = await this.db.query(
        'SELECT id, email, name, role, created_at, last_login, is_active FROM users'
      );

      return (users || []).map(u => ({
        id: u.id,
        email: u.email,
        name: u.name,
        role: u.role,
        passwordHash: '',
        createdAt: new Date(u.created_at).getTime(),
        lastLogin: u.last_login ? new Date(u.last_login).getTime() : undefined,
        isActive: u.is_active === 1,
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
      const totalUsers = await this.db.query('SELECT COUNT(*) as count FROM users');
      const activeUsers = await this.db.query(
        'SELECT COUNT(*) as count FROM users WHERE is_active = 1'
      );
      const adminUsers = await this.db.query(
        'SELECT COUNT(*) as count FROM users WHERE role = "admin"'
      );

      return {
        totalUsers: totalUsers && totalUsers[0] ? totalUsers[0].count : 0,
        activeUsers: activeUsers && activeUsers[0] ? activeUsers[0].count : 0,
        adminUsers: adminUsers && adminUsers[0] ? adminUsers[0].count : 0,
        activeSessions: this.sessions.size,
      };
    } catch (error) {
      this.logger.error(`Erro ao obter estatísticas: ${(error as Error).message}`);
      return {};
    }
  }
}

export default AuthenticationManager;

