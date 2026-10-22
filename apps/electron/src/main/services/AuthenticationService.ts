import Logger from './Logger';
import * as crypto from 'crypto';

export type UserRole = 'admin' | 'coordinator' | 'teacher' | 'security';

interface User {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  name: string;
  department?: string;
  phone?: string;
  createdAt: Date;
  lastLogin?: Date;
  isActive: boolean;
}

interface LoginCredentials {
  username: string;
  password: string;
}

interface AuthToken {
  token: string;
  userId: string;
  role: UserRole;
  expiresAt: Date;
}

interface Permission {
  resource: string;
  action: string; // 'create', 'read', 'update', 'delete'
}

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    { resource: 'users', action: 'create' },
    { resource: 'users', action: 'read' },
    { resource: 'users', action: 'update' },
    { resource: 'users', action: 'delete' },
    { resource: 'students', action: 'create' },
    { resource: 'students', action: 'read' },
    { resource: 'students', action: 'update' },
    { resource: 'students', action: 'delete' },
    { resource: 'reports', action: 'create' },
    { resource: 'reports', action: 'read' },
    { resource: 'reports', action: 'delete' },
    { resource: 'settings', action: 'update' },
  ],
  coordinator: [
    { resource: 'students', action: 'read' },
    { resource: 'students', action: 'update' },
    { resource: 'reports', action: 'read' },
    { resource: 'reports', action: 'create' },
    { resource: 'alerts', action: 'read' },
  ],
  teacher: [
    { resource: 'students', action: 'read' },
    { resource: 'reports', action: 'read' },
    { resource: 'attendance', action: 'read' },
  ],
  security: [
    { resource: 'students', action: 'read' },
    { resource: 'alerts', action: 'read' },
    { resource: 'geofence', action: 'read' },
  ],
};

export class AuthenticationService {
  private logger: Logger;
  private users: Map<string, User> = new Map();
  private activeTokens: Map<string, AuthToken> = new Map();
  private currentUser: User | null = null;
  private tokenExpiration: number = 24 * 60 * 60 * 1000; // 24 horas

  constructor() {
    this.logger = new Logger('AuthenticationService');
    this.initializeDefaultUsers();
  }

  /**
   * Inicializar usuários padrão
   */
  private initializeDefaultUsers(): void {
    // Admin padrão
    this.createUser({
      username: 'admin',
      email: 'admin@aquila.local',
      password: 'admin123', // Mudar em produção
      role: 'admin',
      name: 'Administrador',
    });

    // Coordenador padrão
    this.createUser({
      username: 'coordinator',
      email: 'coordinator@aquila.local',
      password: 'coord123', // Mudar em produção
      role: 'coordinator',
      name: 'Coordenador Pedagógico',
      department: 'Coordenação',
    });

    this.logger.info('Usuários padrão inicializados');
  }

  /**
   * Criar novo usuário
   */
  createUser(data: {
    username: string;
    email: string;
    password: string;
    role: UserRole;
    name: string;
    department?: string;
    phone?: string;
  }): User {
    const id = crypto.randomUUID();
    const passwordHash = this.hashPassword(data.password);

    const user: User = {
      id,
      username: data.username,
      email: data.email,
      passwordHash,
      role: data.role,
      name: data.name,
      department: data.department,
      phone: data.phone,
      createdAt: new Date(),
      isActive: true,
    };

    this.users.set(id, user);
    this.logger.info(`Usuário criado: ${data.username} (${data.role})`);

    return user;
  }

  /**
   * Login de usuário
   */
  login(credentials: LoginCredentials): AuthToken {
    const user = Array.from(this.users.values()).find(
      u => u.username === credentials.username && u.isActive
    );

    if (!user) {
      this.logger.warn(`Tentativa de login com usuário inválido: ${credentials.username}`);
      throw new Error('Usuário ou senha inválidos');
    }

    if (!this.verifyPassword(credentials.password, user.passwordHash)) {
      this.logger.warn(`Tentativa de login com senha incorreta: ${credentials.username}`);
      throw new Error('Usuário ou senha inválidos');
    }

    // Atualizar último login
    user.lastLogin = new Date();

    // Gerar token
    const token = this.generateToken(user.id);
    const expiresAt = new Date(Date.now() + this.tokenExpiration);

    const authToken: AuthToken = {
      token,
      userId: user.id,
      role: user.role,
      expiresAt,
    };

    this.activeTokens.set(token, authToken);
    this.currentUser = user;

    this.logger.info(`Login bem-sucedido: ${user.username}`);

    return authToken;
  }

  /**
   * Logout de usuário
   */
  logout(token: string): void {
    this.activeTokens.delete(token);
    this.currentUser = null;
    this.logger.info('Logout bem-sucedido');
  }

  /**
   * Verificar se token é válido
   */
  verifyToken(token: string): boolean {
    const authToken = this.activeTokens.get(token);

    if (!authToken) {
      return false;
    }

    if (authToken.expiresAt < new Date()) {
      this.activeTokens.delete(token);
      return false;
    }

    return true;
  }

  /**
   * Obter usuário atual
   */
  getCurrentUser(): User | null {
    return this.currentUser;
  }

  /**
   * Obter usuário por ID
   */
  getUserById(userId: string): User | undefined {
    return this.users.get(userId);
  }

  /**
   * Listar todos os usuários
   */
  getAllUsers(): User[] {
    return Array.from(this.users.values());
  }

  /**
   * Atualizar usuário
   */
  updateUser(userId: string, updates: Partial<User>): User {
    const user = this.users.get(userId);
    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    Object.assign(user, updates);
    this.logger.info(`Usuário atualizado: ${user.username}`);

    return user;
  }

  /**
   * Deletar usuário
   */
  deleteUser(userId: string): void {
    this.users.delete(userId);
    this.logger.info(`Usuário deletado: ${userId}`);
  }

  /**
   * Verificar permissão
   */
  hasPermission(role: UserRole, resource: string, action: string): boolean {
    const permissions = ROLE_PERMISSIONS[role] || [];
    return permissions.some(p => p.resource === resource && p.action === action);
  }

  /**
   * Obter permissões do usuário
   */
  getUserPermissions(userId: string): Permission[] {
    const user = this.users.get(userId);
    if (!user) {
      return [];
    }

    return ROLE_PERMISSIONS[user.role] || [];
  }

  /**
   * Hash de senha
   */
  private hashPassword(password: string): string {
    return crypto
      .createHash('sha256')
      .update(password + 'aquila-salt')
      .digest('hex');
  }

  /**
   * Verificar senha
   */
  private verifyPassword(password: string, hash: string): boolean {
    return this.hashPassword(password) === hash;
  }

  /**
   * Gerar token
   */
  private generateToken(userId: string): string {
    return crypto
      .randomBytes(32)
      .toString('hex')
      .substring(0, 64);
  }

  /**
   * Limpar tokens expirados
   */
  cleanupExpiredTokens(): void {
    const now = new Date();
    let removedCount = 0;

    for (const [token, authToken] of this.activeTokens.entries()) {
      if (authToken.expiresAt < now) {
        this.activeTokens.delete(token);
        removedCount++;
      }
    }

    if (removedCount > 0) {
      this.logger.info(`${removedCount} tokens expirados removidos`);
    }
  }
}

export default AuthenticationService;


