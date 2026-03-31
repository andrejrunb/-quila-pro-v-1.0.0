/**
 * AuthService.ts — Item 10: Gestão de Autenticação Local
 * Lida com login, hashing de senhas (bcrypt) e tokens de sessão.
 * Garantia de segurança local sem dependência de nuvem.
 */

import * as crypto from 'crypto';
import Database from '../database/Database';

// Nota: Em um ambiente real, usaríamos 'bcryptjs', mas como estamos em modo nativo
// e queremos evitar dependências binárias extras agora, usaremos PBKDF2 do Node crypto.

export interface UserSession {
  token: string;
  user: {
    id: string;
    username: string;
    role: string;
    name: string;
  };
  expiresAt: number;
}

export class AuthService {
  private activeSessions = new Map<string, UserSession>();

  constructor(private readonly db: Database) {}

  // ─────────────────────────────────────────────
  // AÇÕES DE AUTH
  // ─────────────────────────────────────────────

  async login(username: string, password: string): Promise<UserSession | null> {
    const user = await this.db.get('SELECT * FROM users WHERE username = ?', [username]);
    if (!user) return null;

    const isValid = this._verifyPassword(password, user.password_hash);
    if (!isValid) return null;

    // Criar Sessão
    const session: UserSession = {
      token: crypto.randomBytes(32).toString('hex'),
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        name: user.name
      },
      expiresAt: Date.now() + 24 * 60 * 60 * 1000 // 24h
    };

    this.activeSessions.set(session.token, session);
    await this.db.run('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);

    return session;
  }

  logout(token: string): void {
    this.activeSessions.delete(token);
  }

  validateSession(token: string): UserSession | null {
    const session = this.activeSessions.get(token);
    if (!session) return null;
    if (Date.now() > session.expiresAt) {
      this.activeSessions.delete(token);
      return null;
    }
    return session;
  }

  // ─────────────────────────────────────────────
  // GESTÃO DE USUÁRIOS
  // ─────────────────────────────────────────────

  async createUser(data: { username: string; password?: string; name: string; role?: string }): Promise<void> {
    const id = `user-${Date.now()}`;
    const hash = this._hashPassword(data.password || 'eagle123'); // Senha default
    const sql = `INSERT INTO users (id, username, password_hash, name, role) VALUES (?, ?, ?, ?, ?)`;
    await this.db.run(sql, [id, data.username, hash, data.name, data.role || 'operator']);
  }

  async ensureDefaultAdmin(): Promise<void> {
    const admin = await this.db.get('SELECT * FROM users WHERE username = ?', ['admin']);
    if (!admin) {
      console.log('[AuthService] Criando usuário admin padrão...');
      await this.createUser({
        username: 'admin',
        password: 'admin',
        name: 'Administrador Áquila',
        role: 'admin'
      });
    }
  }

  async ensureTestUser(): Promise<void> {
    const testUser = await this.db.get('SELECT * FROM users WHERE username = ?', ['teste']);
    if (!testUser) {
      console.log('[AuthService] Criando usuário de teste...');
      await this.createUser({
        username: 'teste',
        password: 'teste',
        name: 'Usuário Teste',
        role: 'operator'
      });
    }
  }

  // ─────────────────────────────────────────────
  // INTERNOS (Crypto)
  // ─────────────────────────────────────────────

  private _hashPassword(password: string): string {
    const salt = crypto.randomBytes(16).toString('hex');
    const iterations = 210000;
    const hash = crypto.pbkdf2Sync(password, salt, iterations, 64, 'sha512').toString('hex');
    return `${salt}:${iterations}:${hash}`;
  }

  private _verifyPassword(password: string, storedHash: string): boolean {
    const parts = storedHash.split(':');
    if (parts.length === 3) {
      const [salt, iterations, hash] = parts;
      const verifyHash = crypto.pbkdf2Sync(password, salt, parseInt(iterations), 64, 'sha512').toString('hex');
      return hash === verifyHash;
    } else {
      // Legado (1000 iterações)
      const [salt, hash] = parts;
      const verifyHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
      return hash === verifyHash;
    }
  }
}
