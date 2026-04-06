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
    console.log(`[Auth_Debug] Buscando usuário: ${username}`);
    const user = await this.db.get('SELECT * FROM users WHERE username = ?', [username]);
    if (!user) {
      console.warn(`[Auth_Debug] Usuário não encontrado: ${username}`);
      return null;
    }

    console.log(`[Auth_Debug] Usuário encontrado. Verificando senha...`);
    const isValid = this._verifyPassword(password, user.password_hash);
    if (!isValid) {
      console.warn(`[Auth_Debug] Senha incorreta para: ${username}`);
      return null;
    }

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
  // INTERNOS (Crypto Mod v2.0 - Bcrypt)
  // ─────────────────────────────────────────────

  private _hashPassword(password: string): string {
    // Fase 701.2: Upgrade massivo da Segurança com Bcrypt
    const bcrypt = require('bcryptjs');
    const salt = bcrypt.genSaltSync(12); // Fator de Custo 12 (Alto Risco)
    return bcrypt.hashSync(password, salt);
  }

  private _verifyPassword(password: string, storedHash: string): boolean {
    const bcrypt = require('bcryptjs');
    try {
      // Engine Padrão Bcrypt - Validação Soberana OS 1.0.1
      const isMatch = bcrypt.compareSync(password, storedHash);
      
      // Se não bateu com Bcrypt, tenta o Vault legado (PBKDF2)
      if (!isMatch && storedHash.includes(':')) {
        const parts = storedHash.split(':');
        if (parts.length === 3) {
          const [salt, iterations, hash] = parts;
          const verifyHash = crypto.pbkdf2Sync(password, salt, parseInt(iterations), 64, 'sha512').toString('hex');
          return hash === verifyHash; 
        } else if (parts.length === 2) {
          const [salt, hash] = parts;
          const verifyHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
          return hash === verifyHash;
        }
      }

      return isMatch;
    } catch (e: any) {
      console.error('[Auth_Debug] Erro ao verificar senha:', e.message);
      return false;
    }
  }
}
