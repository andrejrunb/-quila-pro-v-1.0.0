/**
 * AuthService.ts — Item 10: Gestão de Autenticação Local
 * Lida com login, hashing de senhas (bcrypt) e tokens de sessão.
 * Garantia de segurança local sem dependência de nuvem.
 */

import * as crypto from 'crypto';
import Database from '../../database/Database';
import SessionService from './SessionService';
import { getSessionSecret, signSessionToken, VALID_SESSION_ROLES, verifySessionToken } from './sessionCrypto';
import { isDedicatedDemoDatabase } from '../../database/demoSeedGuard';

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
  private readonly sessionSecret: string;

  constructor(
    private readonly db: Database,
    private readonly sessionService: SessionService,
    sessionSecret?: string
  ) {
    this.sessionSecret = getSessionSecret(sessionSecret);
  }

  // ─────────────────────────────────────────────
  // AÇÕES DE AUTH
  // ─────────────────────────────────────────────

  async login(username: string, password: string): Promise<UserSession | null> {
    const user = await this.db.get('SELECT * FROM users WHERE username = ?', [username]);
    if (!user) {
      return null;
    }

    if (
      typeof user.role !== 'string' ||
      !VALID_SESSION_ROLES.has(user.role) ||
      user.isActive === 0 ||
      user.isActive === false ||
      user.status === 'inactive'
    ) {
      return null;
    }

    const isValid = this._verifyPassword(password, user.password_hash);
    if (!isValid) {
      return null;
    }

    // Criar Sessão
    const issuedAt = Math.floor(Date.now() / 1000);
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000;
    const session: UserSession = {
      token: signSessionToken({
        sub: user.id,
        role: user.role,
        iat: issuedAt,
        exp: Math.floor(expiresAt / 1000),
        jti: crypto.randomUUID(),
      }, this.sessionSecret),
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        name: user.name
      },
      expiresAt
    };

    // Salvar na tabela active_sessions
    await this.db.run(
      'INSERT INTO active_sessions (token, userId, expiresAt, data) VALUES (?, ?, ?, ?)',
      [session.token, user.id, session.expiresAt, JSON.stringify(session.user)]
    );

    // [PERSISTENCE] Salvar no SessionService (electron-store) para persistência entre restarts
    this.sessionService.createSession(user.id, user.role, true, session.token);

    await this.db.run('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);

    return session;
  }

  async logout(token?: string): Promise<void> {
    const activeToken = token || this.sessionService.getSession().token;
    if (activeToken) {
      await this.db.run('DELETE FROM active_sessions WHERE token = ?', [activeToken]);
    }
    this.sessionService.clearSession();
  }

  async validateSession(token: string): Promise<UserSession | null> {
    try {
      const claims = verifySessionToken(token, this.sessionSecret);
      if (!claims) return null;

      const sessionData = await this.db.get('SELECT * FROM active_sessions WHERE token = ?', [token]);
      if (!sessionData) {
        return null;
      }

      if (Date.now() > sessionData.expiresAt) {
        await this.logout(token);
        return null;
      }

      const user = JSON.parse(sessionData.data);
      if (user.id !== claims.sub || user.role !== claims.role || !VALID_SESSION_ROLES.has(user.role)) {
        return null;
      }

      return {
        token,
        user,
        expiresAt: sessionData.expiresAt
      };
    } catch {
      return null;
    }
  }

  /**
   * Obtém o usuário atual persistido no local store.
   * Chamado pelo App.tsx no boot inicial.
   */
  async getCurrentUser(): Promise<any | null> {
    const sessionData = this.sessionService.getSession();
    if (!sessionData || !sessionData.token) {
      return null;
    }

    const session = await this.validateSession(sessionData.token);
    if (!session) {
      await this.logout(sessionData.token);
      return null;
    }

    return session.user;
  }

  async cleanupExpiredSessions(): Promise<void> {
    const now = Date.now();
    const result = await this.db.run('DELETE FROM active_sessions WHERE expiresAt < ?', [now]);
    if (result.changes > 0) {
      console.log(`[AuthService] Limpeza: ${result.changes} sessões expiradas removidas.`);
    }
  }

  // ─────────────────────────────────────────────
  // GESTÃO DE USUÁRIOS
  // ─────────────────────────────────────────────

  async createUser(data: { username: string; password: string; name: string; role: string }): Promise<void> {
    if (!data.password) throw new Error('An individual password is required.');
    const id = `user-${Date.now()}`;
    const hash = this._hashPassword(data.password);
    const sql = `INSERT INTO users (id, username, password_hash, name, role) VALUES (?, ?, ?, ?, ?)`;
    await this.db.run(sql, [id, data.username, hash, data.name, data.role || 'operator']);
  }

  async provisionInitialAdmin(): Promise<void> {
    const username = process.env.AQUILA_INITIAL_ADMIN_USERNAME?.trim();
    const password = process.env.AQUILA_INITIAL_ADMIN_PASSWORD;
    if (!username && !password) return;

    await this.db.run(
      'CREATE TABLE IF NOT EXISTS auth_provisioning (key TEXT PRIMARY KEY, completed_at TEXT NOT NULL)'
    );
    const completed = await this.db.get('SELECT key FROM auth_provisioning WHERE key = ?', ['initial-admin']);
    if (completed) return;
    if (!username || !password || Buffer.byteLength(password, 'utf8') < 16) {
      throw new Error('Initial administrator provisioning requires an individual username and password of at least 16 bytes.');
    }

    const existingAdmin = await this.db.get("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
    if (!existingAdmin) {
      await this.createUser({
        username,
        password,
        name: 'Administrador',
        role: 'admin'
      });
    }
    await this.db.run(
      'INSERT OR IGNORE INTO auth_provisioning (key, completed_at) VALUES (?, CURRENT_TIMESTAMP)',
      ['initial-admin']
    );
  }

  /**
   * Seed de usuários demo para todos os portais (sovereign design)
   */
  async seedDemoUsers(): Promise<void> {
    if (
      process.env.AQUILA_ENABLE_DEMO_USERS !== 'true' ||
      !isDedicatedDemoDatabase(this.db.getDatabasePath(), 'AQUILA_ENABLE_DEMO_USERS')
    ) {
      return;
    }

    const demoUsers = [
      { user: 'rh_demo', pass: process.env.AQUILA_DEMO_RH_PASSWORD, name: 'Gestor de RH Demo', role: 'rh' },
      { user: 'coord_demo', pass: process.env.AQUILA_DEMO_COORD_PASSWORD, name: 'Coordenação Demo', role: 'coordinator' },
      { user: 'profe_demo', pass: process.env.AQUILA_DEMO_TEACHER_PASSWORD, name: 'Docente Demo', role: 'docente' },
      { user: 'pais_demo', pass: process.env.AQUILA_DEMO_PARENT_PASSWORD, name: 'Portal de Pais Demo', role: 'pais' },
    ];
    const configuredDemoUsers = demoUsers.map(({ pass, ...user }) => {
      if (!pass || Buffer.byteLength(pass, 'utf8') < 16) {
        throw new Error('Each enabled demo account requires an individual password of at least 16 bytes.');
      }
      return { ...user, pass };
    });

    await this.db.run(
      'CREATE TABLE IF NOT EXISTS demo_seed_state (seed_name TEXT PRIMARY KEY, started_at TEXT NOT NULL)'
    );
    const alreadyStarted = await this.db.get('SELECT seed_name FROM demo_seed_state WHERE seed_name = ?', ['demo-users']);
    if (alreadyStarted) return;
    await this.db.run(
      'INSERT INTO demo_seed_state (seed_name, started_at) VALUES (?, CURRENT_TIMESTAMP)',
      ['demo-users']
    );

    for (const d of configuredDemoUsers) {
      const existing = await this.db.get('SELECT id FROM users WHERE username = ?', [d.user]);
      if (!existing) {
        await this.createUser({
          username: d.user,
          password: d.pass,
          name: d.name,
          role: d.role
        });
      }
    }
  }

  // ─────────────────────────────────────────────
  // INTERNOS (Crypto Mod v2.0 - Bcrypt)
  // ─────────────────────────────────────────────

  private _hashPassword(password: string): string {
    // [SQA-SEC-993] Next-Gen Hashing: Scrypt (Memory-Hard)
    // Usando scrypt como alternativa ao Argon2 (que exige compilação nativa instável em alguns ambientes)
    // Parâmetros: N=16384 (custo CPU/memória), r=8 (tamanho bloco), p=1 (paralelismo)
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1 }).toString('hex');
    return `scrypt$16384$8$1$${salt}$${hash}`;
  }

  private _verifyPassword(password: string, storedHash: string): boolean {
    try {
      // 1. Verificar se é o novo padrão Scrypt
      if (storedHash.startsWith('scrypt$')) {
        const [, sN, sr, sp, salt, hash] = storedHash.split('$');
        const N = parseInt(sN);
        const r = parseInt(sr);
        const p = parseInt(sp);
        const verifyHash = crypto.scryptSync(password, salt, 64, { N, r, p }).toString('hex');
        return hash === verifyHash;
      }

      // 2. Tentar Bcrypt (Padrão anterior)
      const bcrypt = require('bcryptjs');
      if (storedHash.startsWith('$2a$') || storedHash.startsWith('$2b$')) {
        return bcrypt.compareSync(password, storedHash);
      }
      
      // 3. Fallback para Vault legado (PBKDF2 ou SHA-based)
      if (storedHash.includes(':')) {
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

      // 4. Último suspiro: tentativa direta (não recomendado, mas para compatibilidade extrema em devs)
      return bcrypt.compareSync(password, storedHash);
    } catch (e: any) {
      console.error('[Auth_Debug] Erro ao verificar senha:', e.message);
      return false;
    }
  }
}
